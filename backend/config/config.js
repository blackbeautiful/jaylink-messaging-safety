// backend/config/config.js

module.exports = {
  development: {
    username: 'jaylink_user',
    password: 'jaylinkdev123',
    database: 'jaylink_db',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  test: {
    username: 'jaylink_user',
    password: 'jaylinkdev123',
    database: 'jaylink_db_test',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  production: {
    username: process.env.DB_USER || 'jaylink_user',
    password: process.env.DB_PASSWORD || 'jaylinkdev123',
    database: process.env.DB_NAME || 'jaylink_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
