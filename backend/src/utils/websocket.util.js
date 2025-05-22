/**
 * Advanced WebSocket Utility
 * Provides real-time communication with optimized performance and resource usage
 */
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../config/logger');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Singleton instance
let wss = null;
let isInitialized = false;

// Connection tracking
const userConnections = new Map();
const anonymousConnections = new Set();
let totalConnections = 0;
let activeConnections = 0;
let metrics = {
  messagesReceived: 0,
  messagesSent: 0,
  errors: 0,
  authSuccess: 0,
  authFailure: 0,
  maxConcurrentConnections: 0,
  bytesReceived: 0,
  bytesSent: 0
};

// Configuration
const DEFAULT_OPTIONS = {
  path: '/ws',
  pingInterval: 30000,
  pingTimeout: 10000,
  maxPayload: 100 * 1024, // 100KB default
  maxConnections: 10000,
  messageRateLimit: {
    windowMs: 60000, // 1 minute
    maxMessages: 100, // 100 messages per minute
  }
};

// Store client rate limiting data
const clientRateLimits = new Map();

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP/HTTPS server instance
 * @param {Object} options - WebSocket server options
 * @returns {WebSocket.Server} WebSocket server instance
 */
const initialize = (server, options = {}) => {
  try {
    if (wss) {
      logger.warn('WebSocket server already initialized');
      return wss;
    }

    // Merge default options with provided options
    const wsOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Create WebSocket server
    wss = new WebSocket.Server({ 
      server,
      path: wsOptions.path,
      maxPayload: wsOptions.maxPayload,
      clientTracking: true,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        // Don't use context takeover to save memory
        serverNoContextTakeover: true,
        clientNoContextTakeover: true,
        threshold: 1024 // only compress messages larger than 1KB
      }
    });

    logger.info(`WebSocket server initialized with path: ${wsOptions.path}`);
    isInitialized = true;
    
    // Connection limit check
    wss.on('connection', (ws, req) => {
      // Check connection limit
      if (totalConnections >= wsOptions.maxConnections) {
        logger.warn(`Connection limit reached (${wsOptions.maxConnections}), rejecting new connection`);
        ws.send(JSON.stringify({
          type: 'error',
          code: 'CONNECTION_LIMIT_EXCEEDED',
          message: 'Server connection limit reached. Please try again later.',
          timestamp: new Date().toISOString()
        }));
        ws.close(1013, 'Maximum connections reached');
        return;
      }
      
      // Generate a unique ID for the connection
      const connectionId = uuidv4();
      totalConnections++;
      activeConnections++;
      
      // Update max concurrent connections metric
      if (activeConnections > metrics.maxConcurrentConnections) {
        metrics.maxConcurrentConnections = activeConnections;
      }
      
      // Set up connection state
      ws.id = connectionId;
      ws.isAuthenticated = false;
      ws.userId = null;
      ws.connectedAt = new Date();
      ws.lastActivity = new Date();
      ws.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      ws.userAgent = req.headers['user-agent'] || 'Unknown';
      ws.messageCount = 0;
      
      // Initialize rate limiting for this client
      clientRateLimits.set(connectionId, {
        messages: 0,
        lastReset: Date.now(),
        warnings: 0
      });
      
      // Add to anonymous connections initially
      anonymousConnections.add(ws);
      
      logger.debug(`New WebSocket connection: ${connectionId} from ${ws.ip}`);

      // Set up ping interval to keep connection alive and detect stale connections
      ws.isAlive = true;
      ws.pingInterval = setInterval(() => {
        if (ws.isAlive === false) {
          logger.debug(`Terminating stale connection: ${ws.id}`);
          clearInterval(ws.pingInterval);
          ws.terminate();
          return;
        }
        
        ws.isAlive = false;
        try {
          ws.ping('', false, (err) => {
            if (err) {
              logger.debug(`Ping error for ${ws.id}: ${err.message}`);
            }
          });
        } catch (error) {
          logger.error(`Failed to ping client ${ws.id}: ${error.message}`);
          clearInterval(ws.pingInterval);
          ws.terminate();
        }
      }, wsOptions.pingInterval);
      
      // Handle pong response
      ws.on('pong', () => {
        ws.isAlive = true;
        ws.lastActivity = new Date();
      });

      // Handle messages
      ws.on('message', (message) => {
        try {
          // Update metrics
          metrics.messagesReceived++;
          metrics.bytesReceived += message.length;
          ws.messageCount++;
          ws.lastActivity = new Date();
          
          // Check rate limiting
          const rateLimitCheck = checkRateLimit(connectionId, wsOptions.messageRateLimit);
          if (!rateLimitCheck.allowed) {
            ws.send(JSON.stringify({ 
              type: 'error',
              code: 'RATE_LIMIT_EXCEEDED',
              message: rateLimitCheck.message,
              timestamp: new Date().toISOString()
            }));
            
            // If client has exceeded multiple warnings, disconnect them
            if (rateLimitCheck.warnings >= 3) {
              logger.warn(`Disconnecting client ${connectionId} due to repeated rate limit violations`);
              ws.close(1008, 'Rate limit exceeded repeatedly');
              return;
            }
            
            return;
          }
          
          const data = JSON.parse(message);

          // Handle authentication
          if (data.type === 'auth' && data.token) {
            try {
              // Verify token
              const decoded = jwt.verify(data.token, config.jwt.secret);
              ws.userId = decoded.id;
              ws.isAuthenticated = true;
              
              // Move from anonymous to authenticated connections
              anonymousConnections.delete(ws);
              
              // Add to user connections
              if (!userConnections.has(decoded.id)) {
                userConnections.set(decoded.id, new Set());
              }
              userConnections.get(decoded.id).add(ws);
              
              // Update metrics
              metrics.authSuccess++;
              
              logger.debug(`WebSocket authenticated for user: ${decoded.id}`);

              // Send confirmation
              ws.send(JSON.stringify({ 
                type: 'auth_success',
                userId: decoded.id,
                timestamp: new Date().toISOString()
              }));
            } catch (authError) {
              logger.debug(`WebSocket authentication error: ${authError.message}`);
              metrics.authFailure++;
              
              ws.send(JSON.stringify({ 
                type: 'auth_error',
                code: 'INVALID_TOKEN',
                message: 'Authentication failed: Invalid or expired token',
                timestamp: new Date().toISOString()
              }));
            }
            return;
          }
          
          // Handle other message types (custom handlers could be registered here)
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ 
              type: 'pong', 
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          // Handle subscription to channels
          if (data.type === 'subscribe' && data.channel && ws.isAuthenticated) {
            // Implement channel subscription logic here if needed
            ws.send(JSON.stringify({
              type: 'subscribe_success',
              channel: data.channel,
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          // Log unknown message types
          logger.debug(`Received unknown message type: ${data.type || 'undefined'} from ${ws.id}`);
          
        } catch (error) {
          metrics.errors++;
          logger.debug(`WebSocket message handling error for ${ws.id}: ${error.message}`);
          
          try {
            ws.send(JSON.stringify({ 
              type: 'error',
              code: 'INVALID_MESSAGE',
              message: 'Invalid message format',
              timestamp: new Date().toISOString()
            }));
          } catch (sendError) {
            logger.error(`Failed to send error response to client ${ws.id}: ${sendError.message}`);
          }
        }
      });

      // Handle close
      ws.on('close', (code, reason) => {
        logger.debug(`WebSocket connection closed: ${ws.id}, User: ${ws.userId}, Code: ${code}, Reason: ${reason || 'No reason provided'}`);
        
        // Clear ping interval
        clearInterval(ws.pingInterval);
        
        // Clean up rate limit data
        clientRateLimits.delete(connectionId);
        
        // Clean up connections
        if (ws.userId && userConnections.has(ws.userId)) {
          userConnections.get(ws.userId).delete(ws);
          
          // Clean up empty sets
          if (userConnections.get(ws.userId).size === 0) {
            userConnections.delete(ws.userId);
          }
        } else {
          anonymousConnections.delete(ws);
        }
        
        // Update connection counters
        activeConnections--;
        
        // Calculate connection duration
        const duration = Math.round((Date.now() - ws.connectedAt.getTime()) / 1000);
        logger.debug(`Connection ${ws.id} lasted ${duration} seconds, sent ${ws.messageCount} messages`);
      });

      // Handle errors
      ws.on('error', (error) => {
        metrics.errors++;
        logger.error(`WebSocket error for ${ws.id}: ${error.message}`);
      });

      // Send a welcome message
      try {
        ws.send(JSON.stringify({ 
          type: 'welcome',
          message: 'Connected to JayLink notification service',
          connectionId: connectionId,
          timestamp: new Date().toISOString(),
          serverTime: new Date().toISOString(),
          features: {
            compression: true,
            authentication: true,
            notifications: true
          }
        }));
      } catch (error) {
        logger.error(`Failed to send welcome message to ${connectionId}: ${error.message}`);
      }
    });

    // Handle server-level errors
    wss.on('error', (error) => {
      metrics.errors++;
      logger.error(`WebSocket server error: ${error.message}`);
    });
    
    // Set up periodic status logging
    const statusInterval = setInterval(() => {
      const status = getStatus();
      logger.info(`WebSocket Status: ${status.activeConnections} active connections, ${status.authenticatedUsers} authenticated users`);
      
      // Reset hourly metrics but keep lifetime metrics
      metrics.messagesReceived = 0;
      metrics.messagesSent = 0;
      metrics.errors = 0;
      metrics.bytesReceived = 0;
      metrics.bytesSent = 0;
    }, 3600000); // Log every hour
    
    // Store interval for cleanup
    wss.statusInterval = statusInterval;
    
    // Enable heartbeat to detect broken connections
    const heartbeatInterval = setInterval(() => {
      wss.clients.forEach((ws) => {
        // Calculate idle time
        const idleTime = Date.now() - ws.lastActivity.getTime();
        
        // If client has been idle for more than 5 minutes and is not authenticated, disconnect
        if (!ws.isAuthenticated && idleTime > 300000) {
          logger.debug(`Closing idle unauthenticated connection ${ws.id}`);
          ws.close(1000, 'Connection idle timeout');
        }
      });
    }, 60000); // Check every minute
    
    // Store interval for cleanup
    wss.heartbeatInterval = heartbeatInterval;

    return wss;
  } catch (error) {
    logger.error(`WebSocket initialization error: ${error.message}`, { stack: error.stack });
    isInitialized = false;
    throw error;
  }
};

/**
 * Check if a client has exceeded rate limits
 * @param {string} clientId - Client connection ID
 * @param {Object} limits - Rate limiting configuration
 * @returns {Object} Result with allowed status and message
 */
function checkRateLimit(clientId, limits) {
  const now = Date.now();
  const clientLimit = clientRateLimits.get(clientId);
  
  if (!clientLimit) {
    return { allowed: false, message: 'Unknown client' };
  }
  
  // Reset counter if window has passed
  if (now - clientLimit.lastReset > limits.windowMs) {
    clientLimit.messages = 0;
    clientLimit.lastReset = now;
  }
  
  // Increment message counter
  clientLimit.messages++;
  
  // Check if over limit
  if (clientLimit.messages > limits.maxMessages) {
    clientLimit.warnings = (clientLimit.warnings || 0) + 1;
    
    return { 
      allowed: false, 
      message: `Rate limit exceeded. Maximum ${limits.maxMessages} messages per ${limits.windowMs/1000} seconds.`,
      warnings: clientLimit.warnings 
    };
  }
  
  return { allowed: true };
}

/**
 * Emit an event to a specific channel
 * @param {string} channel - Channel identifier (e.g., 'user:123', 'broadcast', 'system')
 * @param {string} type - Event type
 * @param {Object} payload - Event payload
 * @returns {number} Number of clients the message was sent to
 */
const emit = (channel, type, payload) => {
  if (!wss || !isInitialized) {
    logger.warn('WebSocket server not initialized');
    return 0;
  }

  try {
    let sentCount = 0;
    const message = JSON.stringify({ 
      type, 
      payload, 
      timestamp: new Date().toISOString() 
    });
    const messageSize = Buffer.byteLength(message);
    
    // Parse channel to determine target
    if (channel.startsWith('user:')) {
      const userId = channel.split(':')[1];
      
      if (!userId) {
        logger.warn('Invalid user channel format');
        return 0;
      }
      
      // Send to specific user
      if (userConnections.has(userId)) {
        userConnections.get(userId).forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
              sentCount++;
              metrics.messagesSent++;
              metrics.bytesSent += messageSize;
            } catch (error) {
              metrics.errors++;
              logger.error(`Error sending message to user ${userId}: ${error.message}`);
            }
          }
        });
        
        logger.debug(`Emitted ${type} to user:${userId} (${sentCount} connections)`);
      }
    } else if (channel === 'broadcast') {
      // Broadcast to all authenticated clients
      userConnections.forEach((clients, userId) => {
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
              sentCount++;
              metrics.messagesSent++;
              metrics.bytesSent += messageSize;
            } catch (error) {
              metrics.errors++;
              logger.error(`Error broadcasting to user ${userId}: ${error.message}`);
            }
          }
        });
      });
      
      logger.debug(`Broadcast ${type} to all authenticated users (${sentCount} connections)`);
    } else if (channel === 'system') {
      // Send to all connections (authenticated and anonymous)
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
            sentCount++;
            metrics.messagesSent++;
            metrics.bytesSent += messageSize;
          } catch (error) {
            metrics.errors++;
            logger.error(`Error sending system message: ${error.message}`);
          }
        }
      });
      
      logger.debug(`Emitted system message ${type} to all clients (${sentCount} connections)`);
    } else {
      logger.warn(`Unknown channel format: ${channel}`);
    }
    
    return sentCount;
  } catch (error) {
    metrics.errors++;
    logger.error(`WebSocket emit error: ${error.message}`);
    return 0;
  }
};

/**
 * Emit an event to multiple users at once
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} type - Event type
 * @param {Object} payload - Event payload
 * @returns {number} Number of clients the message was sent to
 */
const emitToUsers = (userIds, type, payload) => {
  if (!wss || !isInitialized) {
    logger.warn('WebSocket server not initialized');
    return 0;
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    logger.warn('Invalid userIds parameter: must be a non-empty array');
    return 0;
  }

  try {
    let sentCount = 0;
    const message = JSON.stringify({ 
      type, 
      payload, 
      timestamp: new Date().toISOString() 
    });
    const messageSize = Buffer.byteLength(message);
    
    // Filter to users who have active connections
    const connectedUsers = userIds.filter(userId => userConnections.has(userId));
    
    // Send to each user
    connectedUsers.forEach(userId => {
      if (userConnections.has(userId)) {
        userConnections.get(userId).forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
              sentCount++;
              metrics.messagesSent++;
              metrics.bytesSent += messageSize;
            } catch (error) {
              metrics.errors++;
              logger.error(`Error sending message to user ${userId}: ${error.message}`);
            }
          }
        });
      }
    });
    
    logger.debug(`Emitted ${type} to ${connectedUsers.length} users (${sentCount} connections)`);
    return sentCount;
  } catch (error) {
    metrics.errors++;
    logger.error(`WebSocket emitToUsers error: ${error.message}`);
    return 0;
  }
};

/**
 * Get current WebSocket server status
 * @returns {Object} Server status information
 */
const getStatus = () => {
  if (!wss) {
    return {
      initialized: false,
      activeConnections: 0,
      authenticatedUsers: 0,
      metrics: { ...metrics }
    };
  }
  
  return {
    initialized: isInitialized,
    activeConnections,
    authenticatedUsers: userConnections.size,
    anonymousConnections: anonymousConnections.size,
    metrics: { ...metrics },
    uptime: wss.startedAt ? Math.floor((Date.now() - wss.startedAt) / 1000) : 0,
    memory: process.memoryUsage()
  };
};

/**
 * Check if the WebSocket server is initialized
 * @returns {boolean} True if the server is initialized
 */
const isInitializedFn = () => {
  return isInitialized;
};

/**
 * Close WebSocket server
 * @returns {Promise<void>}
 */
const close = async () => {
  if (!wss) {
    return;
  }
  
  return new Promise((resolve, reject) => {
    try {
      // Clear intervals
      if (wss.statusInterval) clearInterval(wss.statusInterval);
      if (wss.heartbeatInterval) clearInterval(wss.heartbeatInterval);
      
      // Close all client connections with a graceful message
      wss.clients.forEach(client => {
        try {
          // Send close message if client is still connected
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'server_shutdown',
              message: 'Server is shutting down. Please reconnect in a few moments.',
              timestamp: new Date().toISOString()
            }));
            
            // Clear client ping interval
            if (client.pingInterval) {
              clearInterval(client.pingInterval);
            }
            
            // Close connection gracefully
            client.close(1001, 'Server shutting down');
          }
        } catch (error) {
          logger.error(`Error during client shutdown for ${client.id}: ${error.message}`);
        }
      });
      
      // Allow some time for close frames to be sent before terminating
      setTimeout(() => {
        wss.close((err) => {
          if (err) {
            logger.error(`Error closing WebSocket server: ${err.message}`);
            reject(err);
          } else {
            logger.info('WebSocket server closed successfully');
            
            // Reset state
            wss = null;
            isInitialized = false;
            
            // Clear connection tracking
            userConnections.clear();
            anonymousConnections.clear();
            clientRateLimits.clear();
            totalConnections = 0;
            activeConnections = 0;
            
            resolve();
          }
        });
      }, 500);
    } catch (error) {
      logger.error(`WebSocket close error: ${error.message}`);
      reject(error);
    }
  });
};

module.exports = {
  initialize,
  emit,
  emitToUsers,
  getStatus,
  isInitialized: isInitializedFn,
  close
};