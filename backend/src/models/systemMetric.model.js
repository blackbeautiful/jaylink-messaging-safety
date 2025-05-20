// backend/src/models/systemMetric.model.js
/**
 * JayLink SMS Platform
 * System Metrics model for storing health monitoring data
 */

module.exports = (sequelize, DataTypes) => {
    const SystemMetric = sequelize.define('SystemMetric', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      // System metrics
      systemLoad: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: '1-minute load average'
      },
      systemMemoryTotal: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Total system memory in bytes'
      },
      systemMemoryFree: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Free system memory in bytes'
      },
      systemMemoryUsedPercent: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Percentage of system memory used'
      },
      // Process metrics
      processUptime: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Process uptime in seconds'
      },
      processMemoryRss: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Process resident set size in bytes'
      },
      processMemoryHeapTotal: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Process total heap size in bytes'
      },
      processMemoryHeapUsed: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Process used heap size in bytes'
      },
      processMemoryExternal: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Process external memory in bytes'
      },
      processMemoryUsedPercent: {
        type: DataTypes.FLOAT,
        allowNull: false,
        comment: 'Percentage of process heap memory used'
      },
      // Database metrics
      databaseStatus: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'unknown',
        comment: 'Database connection status'
      },
      databaseResponseTime: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Database query response time in milliseconds'
      },
      // Disk metrics
      diskUsedPercent: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Percentage of disk space used'
      },
      // Application metrics
      errorCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of errors in the last hour'
      },
      activeConnections: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of active HTTP connections'
      },
      // Alert information
      alertCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total number of alerts triggered'
      },
      criticalAlertCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of critical alerts triggered'
      },
      warningAlertCount: {
        type: DataTypes.INTEGER,
        allowNull: false, 
        defaultValue: 0,
        comment: 'Number of warning alerts triggered'
      },
      alertDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON string of alert details'
      },
      // Full metrics data for historical reference
      fullMetrics: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: 'JSON string of complete metrics'
      }
    }, {
      tableName: 'system_metrics',
      timestamps: true,
      indexes: [
        {
          name: 'idx_system_metrics_timestamp',
          fields: ['timestamp']
        },
        {
          name: 'idx_system_metrics_created_at',
          fields: ['createdAt']
        }
      ]
    });
  
    /**
     * Create record from metrics object
     * @param {Object} metrics - System metrics
     * @param {Array} alerts - System alerts
     * @returns {Promise<SystemMetric>} Created record
     */
    SystemMetric.createFromMetrics = async (metrics, alerts = []) => {
      try {
        // Map the metrics object to model fields
        const record = {
          timestamp: metrics.timestamp,
          // System metrics
          systemLoad: metrics.system.loadAverage[0],
          systemMemoryTotal: metrics.system.totalMemory,
          systemMemoryFree: metrics.system.freeMemory,
          systemMemoryUsedPercent: ((metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory * 100),
          // Process metrics
          processUptime: metrics.process.uptime,
          processMemoryRss: metrics.process.memoryUsage.rss,
          processMemoryHeapTotal: metrics.process.memoryUsage.heapTotal,
          processMemoryHeapUsed: metrics.process.memoryUsage.heapUsed,
          processMemoryExternal: metrics.process.memoryUsage.external || 0,
          processMemoryUsedPercent: (metrics.process.memoryUsage.heapUsed / metrics.process.memoryUsage.heapTotal * 100),
          // Database metrics
          databaseStatus: metrics.database.status,
          databaseResponseTime: metrics.database.responseTime,
          // Disk metrics
          diskUsedPercent: metrics.disk?.volumes?.[0]?.usedPercentage || null,
          // Application metrics
          errorCount: metrics.application?.errors?.lastHour || 0,
          activeConnections: metrics.application?.connections?.active || 0,
          // Alert information
          alertCount: alerts.length,
          criticalAlertCount: alerts.filter(a => a.level === 'CRITICAL').length,
          warningAlertCount: alerts.filter(a => a.level === 'WARNING').length,
          alertDetails: alerts.length > 0 ? JSON.stringify(alerts) : null,
          // Full metrics for reference
          fullMetrics: JSON.stringify(metrics)
        };
  
        // Create and return the record
        return await SystemMetric.create(record);
      } catch (error) {
        console.error('Error creating system metric record:', error);
        throw error;
      }
    };
    
    /**
     * Clean up old metrics to prevent database bloat
     * @param {number} daysToKeep - Number of days of data to retain
     * @returns {Promise<number>} Number of records deleted
     */
    SystemMetric.cleanupOldMetrics = async (daysToKeep = 30) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // Delete records older than the cutoff date
      const { count } = await SystemMetric.destroy({
        where: {
          createdAt: {
            [sequelize.Op.lt]: cutoffDate
          }
        }
      });
      
      return count;
    };
  
    return SystemMetric;
  };