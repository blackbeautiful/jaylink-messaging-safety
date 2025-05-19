// backend/config/config.js

module.exports = {
  development: {
    username: 'jaylink_user',
    password: 'jaylinkdev123',
    database: 'jaylink_db',
    host: 'localhost',
    dialect: 'mysql',
    logging: console.log
  },
  test: {
    username: 'jaylink_user',
    password: 'jaylinkdev123',
    database: 'jaylink_db_test',
    host: '127.0.0.1',
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
