// knexfile.js
const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'database.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '..', 'migrations')
    }
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'database.sqlite')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '..', 'migrations')
    }
  }
};
