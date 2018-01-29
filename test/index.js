const standardTests = require("passwordless-tokenstore-test");
const Sequelize = require("sequelize");

const PasswordlessSequelize = require("../");

const dbConfig = {
  username: "local-dev",
  password: "",
  database: "passwordless",
  host: "localhost",
  dialect: "mysql",
  port: 3306,
  logging: false
};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  { ...dbConfig, operatorsAliases: Sequelize.Op }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });

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

function TokenStoreFactory() {
  return new PasswordlessSequelize(PasswordlessModel);
}

const beforeEachTest = function(done) {
  PasswordlessModel.sync({ force: true })
    .then(() => {
      return done();
    })
    .catch(error => {
      console.error("ERROR - Unable to sync database.", error);
      console.error("ERROR - Server not started.");
    });
};

const afterEachTest = function(done) {
  // Any other activity after each test
  done();
};

// Call the test suite
standardTests(TokenStoreFactory, beforeEachTest, afterEachTest);

describe("PasswordlessSequelize Tests", function() {
  beforeEach(function(done) {
    beforeEachTest(done);
  });

  afterEach(function(done) {
    afterEachTest(done);
  });
});
