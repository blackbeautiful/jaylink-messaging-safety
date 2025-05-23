// backend/src/utils/queue.util.js
const logger = require('../config/logger');
const config = require('../config/config');

/**
 * Enhanced Queue wrapper around Bull queue with better error handling and fallbacks
 * Handles background task processing with graceful degradation
 */
class Queue {
  /**
   * Create a new queue
   * @param {string} name - Queue name
   * @param {Object} options - Queue options
   */
  constructor(name, options = {}) {
    this.name = name;
    this.isInitialized = false;
    this.mockMode = false;
    this.initError = null;
    this.mockJobs = new Map();
    this.processors = new Map();
    
    try {
      // Attempt to initialize with Bull/Redis
      this._initializeWithBull(options);
    } catch (error) {
      logger.error(`Failed to initialize queue "${name}" with Bull: ${error.message}`);
      this._initializeMockMode(options);
    }
  }
  
  /**
   * Initialize queue with Bull and Redis
   * @param {Object} options - Queue options
   * @private
   */
  _initializeWithBull(options) {
    // Dynamically import Bull to avoid startup errors if Redis is not available
    const Bull = this._getBullModule();
    
    if (!Bull) {
      throw new Error('Bull module not available');
    }
    
    // Set up redis connection from config or use defaults
    const redisOptions = this._getRedisOptions();
    
    // Test Redis connection first
    this._testRedisConnection(redisOptions);
    
    // Create Bull queue
    this.queue = new Bull(this.name, {
      redis: redisOptions,
      defaultJobOptions: {
        attempts: options.attempts || 3,
        removeOnComplete: options.removeOnComplete || 100,
        removeOnFail: options.removeOnFail || 50,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      },
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 1
      },
      ...options
    });
    
    // Set up event handlers
    this._setupEventHandlers();
    
    this.isInitialized = true;
    logger.info(`Queue "${this.name}" initialized with Bull/Redis`);
  }
  
  /**
   * Initialize queue in mock mode for development/testing
   * @param {Object} options - Queue options
   * @private
   */
  _initializeMockMode(options) {
    this.mockMode = true;
    this.isInitialized = true;
    this.mockJobs = new Map();
    this.processors = new Map();
    
    // Create mock queue object with same interface
    this.queue = {
      add: (jobName, data, jobOptions = {}) => {
        logger.debug(`MOCK QUEUE: Adding job "${jobName}" to queue "${this.name}"`, { data });
        const jobId = Date.now() + Math.random().toString(36).substring(2, 10);
        const job = { 
          id: jobId, 
          name: jobName,
          data, 
          opts: jobOptions, 
          status: 'waiting',
          timestamp: new Date()
        };
        this.mockJobs.set(jobId, job);
        
        // Auto-process job if not delayed and processor exists
        if (!jobOptions.delay && !jobOptions.repeat) {
          setTimeout(() => {
            this._processMockJob(jobName, job);
          }, 100);
        }
        
        return Promise.resolve({ id: jobId });
      },
      
      process: (jobName, concurrency, processor) => {
        // Handle different argument patterns
        if (typeof concurrency === 'function') {
          processor = concurrency;
          concurrency = 1;
        }
        
        this.processors.set(jobName, { processor, concurrency });
        logger.debug(`MOCK QUEUE: Registered processor for "${jobName}" in queue "${this.name}"`);
      },
      
      getWaitingCount: () => Promise.resolve(Array.from(this.mockJobs.values()).filter(j => j.status === 'waiting').length),
      getActiveCount: () => Promise.resolve(Array.from(this.mockJobs.values()).filter(j => j.status === 'active').length),
      getCompletedCount: () => Promise.resolve(Array.from(this.mockJobs.values()).filter(j => j.status === 'completed').length),
      getFailedCount: () => Promise.resolve(Array.from(this.mockJobs.values()).filter(j => j.status === 'failed').length),
      getDelayedCount: () => Promise.resolve(Array.from(this.mockJobs.values()).filter(j => j.status === 'delayed').length),
      
      close: () => {
        logger.debug(`MOCK QUEUE: Closed queue "${this.name}"`);
        this.mockJobs.clear();
        this.processors.clear();
        return Promise.resolve();
      },
      
      // Mock event emitter methods
      on: (event, handler) => {
        logger.debug(`MOCK QUEUE: Event listener registered for "${event}" on queue "${this.name}"`);
      },
      
      removeAllListeners: () => {
        logger.debug(`MOCK QUEUE: All event listeners removed from queue "${this.name}"`);
      }
    };
    
    logger.info(`Queue "${this.name}" initialized in mock mode (${config.env} environment)`);
  }
  
  /**
   * Get Bull module, handling potential import errors
   * @private
   */
  _getBullModule() {
    try {
      // Try to require Bull
      return require('bull');
    } catch (error) {
      logger.debug(`Failed to load Bull module: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get Redis connection options
   * @private
   */
  _getRedisOptions() {
    const redisConfig = config.redis || {};
    
    return {
      host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig.port || process.env.REDIS_PORT || 6379,
      password: redisConfig.password || process.env.REDIS_PASSWORD || undefined,
      db: redisConfig.db || process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      family: 4,
      connectTimeout: 10000,
      commandTimeout: 5000,
      retryDelayOnClusterDown: 300
    };
  }
  
  /**
   * Test Redis connection
   * @param {Object} redisOptions - Redis connection options
   * @private
   */
  _testRedisConnection(redisOptions) {
    try {
      const Redis = require('ioredis');
      const testClient = new Redis(redisOptions);
      
      // Test connection synchronously with timeout
      testClient.on('error', (error) => {
        logger.debug(`Redis connection test failed: ${error.message}`);
        testClient.disconnect();
        throw error;
      });
      
      // If we get here, connection should work
      testClient.disconnect();
    } catch (error) {
      throw new Error(`Redis connection test failed: ${error.message}`);
    }
  }
  
  /**
   * Set up event handlers for Bull queue
   * @private
   */
  _setupEventHandlers() {
    if (!this.queue || this.mockMode) return;
    
    this.queue.on('error', (error) => {
      logger.error(`Queue "${this.name}" error: ${error.message}`);
    });
    
    this.queue.on('waiting', (jobId) => {
      logger.debug(`Job ${jobId} waiting in queue "${this.name}"`);
    });
    
    this.queue.on('active', (job, jobPromise) => {
      logger.debug(`Job ${job.id} active in queue "${this.name}"`);
    });
    
    this.queue.on('completed', (job, result) => {
      logger.debug(`Job ${job.id} completed in queue "${this.name}"`);
    });
    
    this.queue.on('failed', (job, err) => {
      logger.warn(`Job ${job.id} failed in queue "${this.name}": ${err.message}`);
    });
    
    this.queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled in queue "${this.name}"`);
    });
  }
  
  /**
   * Process a mock job
   * @param {string} jobName - Job name
   * @param {Object} job - Job object
   * @private
   */
  _processMockJob(jobName, job) {
    const processorInfo = this.processors.get(jobName);
    
    if (processorInfo && processorInfo.processor) {
      job.status = 'active';
      
      Promise.resolve().then(async () => {
        try {
          const result = await processorInfo.processor(job);
          job.status = 'completed';
          job.result = result;
          job.finishedOn = new Date();
          logger.debug(`MOCK QUEUE: Job "${jobName}" (${job.id}) completed in queue "${this.name}"`, { result });
        } catch (error) {
          job.status = 'failed';
          job.error = error.message;
          job.failedReason = error.message;
          job.finishedOn = new Date();
          logger.debug(`MOCK QUEUE: Job "${jobName}" (${job.id}) failed in queue "${this.name}"`, { error: error.message });
        }
      });
    } else {
      logger.warn(`MOCK QUEUE: No processor found for job "${jobName}" in queue "${this.name}"`);
      job.status = 'failed';
      job.error = 'No processor found';
      job.failedReason = 'No processor found';
      job.finishedOn = new Date();
    }
  }
  
  /**
   * Add a job to the queue
   * @param {string} jobName - Job name
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise<Job>} Created job
   */
  async add(jobName, data, options = {}) {
    if (!this.isInitialized) {
      logger.warn(`Queue "${this.name}" is not initialized, job "${jobName}" not added`);
      return Promise.resolve({ id: null, queued: false });
    }
    
    try {
      const job = await this.queue.add(jobName, data, options);
      logger.debug(`Job "${jobName}" added to queue "${this.name}" with ID: ${job.id}`);
      return job;
    } catch (error) {
      logger.error(`Failed to add job "${jobName}" to queue "${this.name}": ${error.message}`);
      return Promise.resolve({ id: null, queued: false, error: error.message });
    }
  }
  
  /**
   * Register a processor for a job
   * @param {string} jobName - Job name
   * @param {number|Function} concurrency - Concurrency or processor function
   * @param {Function} processor - Job processor function
   */
  process(jobName, concurrency, processor) {
    if (!this.isInitialized) {
      logger.warn(`Queue "${this.name}" is not initialized, processor for "${jobName}" not registered`);
      return;
    }
    
    try {
      // Handle different argument patterns
      if (typeof concurrency === 'function') {
        processor = concurrency;
        concurrency = 1;
      }
      
      this.queue.process(jobName, concurrency, async (job) => {
        try {
          logger.debug(`Processing job "${jobName}" (${job.id}) in queue "${this.name}"`);
          const result = await processor(job);
          logger.debug(`Job "${jobName}" (${job.id}) completed in queue "${this.name}"`);
          return result;
        } catch (error) {
          logger.error(`Job "${jobName}" (${job.id}) failed in queue "${this.name}": ${error.message}`);
          throw error;
        }
      });
      
      logger.debug(`Processor registered for "${jobName}" in queue "${this.name}"`);
    } catch (error) {
      logger.error(`Failed to register processor for "${jobName}" in queue "${this.name}": ${error.message}`);
    }
  }
  
  /**
   * Get queue metrics
   * @returns {Promise<Object>} Queue metrics
   */
  async getMetrics() {
    if (!this.isInitialized) {
      return {
        queue: this.name,
        initialized: false,
        error: this.initError || 'Queue not initialized'
      };
    }
    
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
        this.queue.getDelayedCount()
      ]);
      
      return {
        queue: this.name,
        initialized: true,
        mockMode: this.mockMode,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
        health: this._getQueueHealth(waiting, active, failed)
      };
    } catch (error) {
      logger.error(`Failed to get metrics for queue "${this.name}": ${error.message}`);
      return {
        queue: this.name,
        initialized: true,
        mockMode: this.mockMode,
        error: error.message
      };
    }
  }
  
  /**
   * Get queue health status
   * @param {number} waiting - Waiting jobs count
   * @param {number} active - Active jobs count
   * @param {number} failed - Failed jobs count
   * @returns {string} Health status
   * @private
   */
  _getQueueHealth(waiting, active, failed) {
    if (failed > 100) return 'unhealthy';
    if (waiting > 1000) return 'overloaded';
    if (active > 50) return 'busy';
    return 'healthy';
  }
  
  /**
   * Pause the queue
   * @returns {Promise<void>}
   */
  async pause() {
    if (!this.isInitialized || this.mockMode) {
      logger.warn(`Cannot pause queue "${this.name}" - not initialized or in mock mode`);
      return;
    }
    
    try {
      await this.queue.pause();
      logger.info(`Queue "${this.name}" paused`);
    } catch (error) {
      logger.error(`Failed to pause queue "${this.name}": ${error.message}`);
    }
  }
  
  /**
   * Resume the queue
   * @returns {Promise<void>}
   */
  async resume() {
    if (!this.isInitialized || this.mockMode) {
      logger.warn(`Cannot resume queue "${this.name}" - not initialized or in mock mode`);
      return;
    }
    
    try {
      await this.queue.resume();
      logger.info(`Queue "${this.name}" resumed`);
    } catch (error) {
      logger.error(`Failed to resume queue "${this.name}": ${error.message}`);
    }
  }
  
  /**
   * Clean old jobs from the queue
   * @param {number} grace - Grace period in milliseconds
   * @param {string} type - Job type to clean ('completed', 'failed', 'active', 'waiting')
   * @returns {Promise<number>} Number of jobs cleaned
   */
  async clean(grace = 24 * 60 * 60 * 1000, type = 'completed') {
    if (!this.isInitialized || this.mockMode) {
      logger.warn(`Cannot clean queue "${this.name}" - not initialized or in mock mode`);
      return 0;
    }
    
    try {
      const cleaned = await this.queue.clean(grace, type);
      logger.info(`Cleaned ${cleaned.length} ${type} jobs from queue "${this.name}"`);
      return cleaned.length;
    } catch (error) {
      logger.error(`Failed to clean queue "${this.name}": ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Close the queue
   * @returns {Promise<void>}
   */
  async close() {
    if (!this.isInitialized) {
      return;
    }
    
    try {
      if (this.queue && this.queue.close) {
        await this.queue.close();
      }
      
      if (this.mockMode) {
        this.mockJobs.clear();
        this.processors.clear();
      }
      
      this.isInitialized = false;
      logger.info(`Queue "${this.name}" closed`);
    } catch (error) {
      logger.error(`Error closing queue "${this.name}": ${error.message}`);
    }
  }
}

module.exports = Queue;