// backend/src/config/monitoring-config.js
/**
 * JayLink SMS Platform
 * Health monitoring configuration
 */

const config = {
    // Whether monitoring is enabled
    enabled: process.env.MONITORING_ENABLED === 'true',
    
    // How often to check system health (ms)
    interval: parseInt(process.env.MONITORING_INTERVAL || '60000', 10),
    
    // Whether to perform extended logging
    extendedLogging: process.env.MONITORING_EXTENDED_LOGGING === 'true',
    
    // File to write metrics to for external monitoring tools
    metricsFile: process.env.MONITORING_METRICS_FILE || './logs/metrics.json',
    
    // Cooldown period between alerts of the same type (ms)
    alertCooldown: parseInt(process.env.MONITORING_ALERT_COOLDOWN || '300000', 10), // 5 minutes default
    
    // Whether to allow auto-restart in production
    allowProductionRestart: process.env.MONITORING_ALLOW_RESTART === 'true',
    
    // Actions to take when alerts are triggered
    alertActions: process.env.MONITORING_ALERT_ACTIONS 
      ? process.env.MONITORING_ALERT_ACTIONS.split(',')
      : ['log'],
    
    // Notification settings
    notifications: {
      email: process.env.MONITORING_EMAIL_ENABLED === 'true' ? {
        to: process.env.MONITORING_EMAIL_TO,
        from: process.env.MONITORING_EMAIL_FROM || 'monitoring@jaylink.com',
        smtp: {
          host: process.env.MONITORING_EMAIL_SMTP_HOST,
          port: parseInt(process.env.MONITORING_EMAIL_SMTP_PORT || '587', 10),
          secure: process.env.MONITORING_EMAIL_SMTP_SECURE === 'true',
          auth: process.env.MONITORING_EMAIL_SMTP_USER ? {
            user: process.env.MONITORING_EMAIL_SMTP_USER,
            pass: process.env.MONITORING_EMAIL_SMTP_PASS
          } : undefined
        }
      } : null,
      
      slack: process.env.MONITORING_SLACK_ENABLED === 'true' ? {
        webhookUrl: process.env.MONITORING_SLACK_WEBHOOK_URL,
        channel: process.env.MONITORING_SLACK_CHANNEL
      } : null,
      
      webhook: process.env.MONITORING_WEBHOOK_ENABLED === 'true' ? {
        url: process.env.MONITORING_WEBHOOK_URL,
        headers: process.env.MONITORING_WEBHOOK_HEADERS 
          ? JSON.parse(process.env.MONITORING_WEBHOOK_HEADERS)
          : {}
      } : null
    },
    
    // Alert thresholds
    thresholds: {
      system: {
        memory: {
          warning: parseInt(process.env.THRESHOLD_SYSTEM_MEMORY_WARNING || '80', 10),
          critical: parseInt(process.env.THRESHOLD_SYSTEM_MEMORY_CRITICAL || '90', 10)
        },
        cpu: {
          warning: parseFloat(process.env.THRESHOLD_SYSTEM_CPU_WARNING || '0.8'),
          critical: parseFloat(process.env.THRESHOLD_SYSTEM_CPU_CRITICAL || '0.9')
        }
      },
      process: {
        memory: {
          warning: parseInt(process.env.THRESHOLD_PROCESS_MEMORY_WARNING || '80', 10),
          critical: parseInt(process.env.THRESHOLD_PROCESS_MEMORY_CRITICAL || '90', 10)
        }
      },
      disk: {
        usage: {
          warning: parseInt(process.env.THRESHOLD_DISK_USAGE_WARNING || '80', 10),
          critical: parseInt(process.env.THRESHOLD_DISK_USAGE_CRITICAL || '90', 10)
        }
      },
      database: {
        responseTime: {
          warning: parseInt(process.env.THRESHOLD_DB_RESPONSE_WARNING || '500', 10),
          critical: parseInt(process.env.THRESHOLD_DB_RESPONSE_CRITICAL || '2000', 10)
        }
      },
      application: {
        errors: {
          warning: parseInt(process.env.THRESHOLD_APP_ERRORS_WARNING || '10', 10),
          critical: parseInt(process.env.THRESHOLD_APP_ERRORS_CRITICAL || '50', 10)
        },
        minUptime: parseInt(process.env.THRESHOLD_APP_MIN_UPTIME || '300', 10) // 5 minutes
      }
    }
  };
  
  module.exports = config;