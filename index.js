const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const cryptoJS = require("crypto-js");
const helpers = require("./src/message");
const { generateKeyPairSync, KeyObject } = require("crypto");

require("dotenv").config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

// Establish DB connection
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

initializeTable();
helpers.initializeMessageTable(connection);

// Launch express server
const app = express();

initializeSession();

// Serve the page
app.get("/", function (request, response) {
  response.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/reset", function (request, response) {
  response.sendFile(path.join(__dirname + "/html/reset_password.html"));
});

app.get("/register_page", function (request, response) {
  response.sendFile(path.join(__dirname + "/html/register.html"));
});

app.post("/reset_password", resetPassword);

app.post("/auth", handleAuth);

app.post("/register", handleRegister);

app.post("/logoff", handleLogoff);

app.get("/message", function (request, response) {
  if (request.session.loggedin) {
    helpers.readMessage(
      connection,
      request.session.username,
      request.query.id,
      response
    );
  } else {
    response.send("You need to be logged in with the right account");
    response.end();
  }
});

app.post("/send_message_form", function (request, response) {
  helpers.handleSendmessage(connection, request, response);
});

app.get("/send_message", function (request, response) {
  response.sendFile(path.join(__dirname + "/html/send_message.html"));
});

// Back to home page
app.get("/home", function (request, response) {
  if (request.session.loggedin) {
    //response.send("Welcome back, " + request.session.username + "!");
    //response.sendFile(path.join(__dirname + "/html/message.html"));
    helpers.readTitles(connection, request.session.username, response);
  } else {
    response.send(
      'Please login to view this page! <a href="/index.html">Login</a>'
    );
    response.end();
  }
});

app.listen(PORT);

function isPasswordValid(password) {
  const regex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
  );
  return regex.test(password);
}

function isUserNameValid(username) {
  let regex = /^[a-zA-Z]+$/; //characters only
  return username && username.length >= 1 && regex.test(username);
}

function hashString(value) {
  return cryptoJS.SHA3(value).toString(cryptoJS.enc.Hex);
}

function hashPassword(username, password) {
  return hashString(username + password);
}

function initializeTable() {
  // TODO remove that after deployment
  // Initialize DB
  /*let deleteTable = "DROP TABLE accounts";
  connection.query(deleteTable, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });

  deleteTable = "DROP TABLE keypairs";
  connection.query(deleteTable, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });*/

  let createTable = `CREATE TABLE IF NOT EXISTS \`accounts\` (
        \`username\` varchar(50) NOT NULL,
        \`password\` varchar(512) NOT NULL,
        \`answer\` varchar(512) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

  connection.query(createTable, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });

  createTable = `CREATE TABLE IF NOT EXISTS \`keypairs\` (
    \`username\` varchar(50) NOT NULL,
    \`publickey\` TEXT NOT NULL,
    \`privatekey\` TEXT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

  connection.query(createTable, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });
}

function initializeSession() {
  // TODO test better the cookie expiry
  app.use(
    session({
      secret: process.env.COOKIE_SECRET,
      resave: true,
      saveUninitialized: false,
      cookie: {
        //secure: true,
        maxAge: 3600000, // 1hour
        sameSite: true,
      },
    })
  );
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static(__dirname));

  // Set EJS View Engine**
  app.set("view engine", "ejs");
  // Set HTML engine**
  app.engine("html", require("ejs").renderFile);
  //set directory
  app.set("views", __dirname + "/html/");
}

function resetPassword(request, response) {
  const username = request.body.username;
  const password = request.body.password;
  const answer = request.body.answer;
  if (
    password &&
    isUserNameValid(username) &&
    isPasswordValid(password) &&
    isUserNameValid(answer) &&
    answer.length < 512
  ) {
    let hashedAnswer = hashString(answer);
    connection.query(
      "SELECT * FROM accounts WHERE username = ? AND answer = ?",
      [username, hashedAnswer],
      function (error, results, fields) {
        if (results.length > 0) {
          if (error) {
            response.send("Error: " + error);
            response.end();
          } else {
            let query =
              "INSERT INTO `accounts` (`username`, `password`, `answer`) VALUES ('";
            query +=
              username +
              "', '" +
              hashPassword(username, password) +
              "', '" +
              hashedAnswer +
              "');";
            connection.query(query, function (error, results) {
              if (error) {
                response.send("Error: " + error);
              } else if (results) {
                response.send("Password Reset");
              } else {
                response.send("Failed to reset password!");
              }
              response.end();
            });
          }
        } else {
          response.send("Incorrect Username and/or Secret Answer!");
          response.end();
        }
      }
    );
  } else {
    response.send("Please enter a valid username, password, and secret answer");
    response.send();
  }
}

function handleAuth(request, response) {
  const username = request.body.username;
  const password = request.body.password;
  if (password && isUserNameValid(username) && isPasswordValid(password)) {
    let hashedPassword = hashPassword(username, password);
    connection.query(
      "SELECT * FROM accounts WHERE username = ? AND password = ?",
      [username, hashedPassword],
      function (error, results, fields) {
        if (error) {
          response.send("Error: " + error);
        } else if (results.length > 0) {
          request.session.loggedin = true;
          request.session.username = username;
          response.redirect("/home");
        } else {
          response.send("Incorrect Username and/or Password!");
        }
        response.end();
      }
    );
  } else {
    response.send("Please enter a valid Username and Password!");
    response.end();
  }
}

function registerNewUser(connection, response, username, password, answer) {
  // Generate private/public keypair
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: process.env.COOKIE_SECRET,
    },
  });

  // Insert the keys into the DB
  let query =
    "INSERT INTO `keypairs` (`username`, `privatekey`, `publickey`) VALUES ('";

  query += username + "', '" + privateKey + "', '" + publicKey + "');";
  KeyObject;

  connection.query(query, function (error, results) {
    if (error) {
      response.send("Error: " + error);
      response.end();
    } else if (!results) {
      response.send("Failed to register!");
      response.end();
    } else {
      // Insert the username to the DB
      query =
        "INSERT INTO `accounts` (`username`, `password`, `answer`) VALUES ('";
      query +=
        username +
        "', '" +
        hashPassword(username, password) +
        "', '" +
        hashString(answer) +
        "');";
      connection.query(query, function (error, results) {
        if (error) {
          response.send("Error: " + error);
        } else if (results) {
          response.send('Username registered <a href="/index.html">Login</a>');
        } else {
          response.send("Failed to register!");
        }
        response.end();
      });
    }
  });
}

function handleRegister(request, response) {
  const username = request.body.username;
  const userValid = isUserNameValid(username);
  const password = request.body.password;
  const answer = request.body.answer;
  const answerValid = isUserNameValid(answer);
  if (!(userValid && password && answerValid && password.length >= 1)) {
    response.send("Please enter Username and Password and the secret answer!");
    response.send("Username and secret answer can only contain characters");
    response.end();
  } else {
    // Check if the username exists already
    connection.query(
      "SELECT * FROM accounts WHERE username = ?",
      [username],
      function (error, results) {
        if (error) {
          response.send("Error: " + error);
          response.end();
        } else if (results.length > 0) {
          response.send(
            'Username already exists, maybe you meant to login? <a href="/index.html">Login</a>'
          );
          response.end();
        } else {
          // Is password secure enough?
          if (!isPasswordValid(password)) {
            response.send(`Password needs to be minimum 8 characters and contains at least
                    1 lower case, 1 upper case, 1 number, and at least one special character from
                    !@#$%^&* but no spaces`);
            response.end();
          } else {
            registerNewUser(connection, response, username, password, answer);
          }
        }
      }
    );
  }
}

function handleLogoff(request, response) {
  request.session.loggedin = false;
  request.session.username = null;
  response.redirect("/");
  response.end();
}
