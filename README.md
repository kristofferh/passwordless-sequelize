# Passwordless-Sequelize

This module provides token storage for [Passwordless](https://github.com/florianheinemann/passwordless), a node.js module for express that allows website authentication without password using verification through email or other means. Visit the project's [website](https://passwordless.net) for more details.

Tokens are stored in a PostgreSQL/MySQL/SQLite/MSSQL database, using [Sequelize](https://github.com/sequelize/sequelize) - a multi SQL dialect ORM for Node.js - and are hashed and salted using [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/).

## Note

This package use newer JavaScript constructs like `async/await` so it requires at least Node v7.6.

## Usage

First, install the module:
`yarn install passwordless-sequelize`

or

`$ npm install passwordless-sequelize --save`

Afterwards, follow the guide for [Passwordless](https://github.com/florianheinemann/passwordless). A typical implementation may look like this:

```javascript
const passwordless = require("passwordless");
const PasswordlessSequelize = require("passwordless-sequelize");
const Sequelize = require("sequelize");

// Setup sequelize connections.
const dbConfig = {
  username: "local-dev",
  password: "",
  database: "passwordless",
  host: "localhost",
  dialect: "mysql",
  port: 3306,
  logging: false
};

// Create new sequelize instance.
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  { ...dbConfig, operatorsAliases: Sequelize.Op }
);

// Test connection.
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

// Create Model.
const PasswordlessModel = sequelize.define("Passwordless", {
  token: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  origin: {
    type: Sequelize.STRING
  },
  ttl: {
    type: Sequelize.BIGINT
  },
  uid: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  }
});

// Sync the model(s) - create tables if needed.
PasswordlessModel.sync()
  .then(() => {
    console.info("Database sync complete.");
    ...
  })
  .catch(err => {
    console.error("Unable to sync database.", err);
  });

passwordless.init(new PasswordlessSequelize(PasswordlessModel));

passwordless.addDelivery(
  function(tokenToSend, uidToSend, recipient, callback) {
    // Send out a token
  }
);

app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken());
```

## Initialization

```javascript
new PasswordlessSequelize(model);
```

* **model:** _(String)_ Mandatory. The sequelize model you want to act on.

## Hash and salt

As the tokens are equivalent to passwords (even though only for a limited time) they have to be protected in the same way. `passwordless-sequelize` uses [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/) with automatically created random salts. To generate the salt, 10 rounds are used.

## Tests

`$ yarn test`

or

`$ npm test`

## License

[MIT License](http://opensource.org/licenses/MIT)

## Author

Kristoffer Hedstrom (https://k-create.com) (Adapted code from Florian Heinemann [@thesumofall](http://twitter.com/thesumofall/))
