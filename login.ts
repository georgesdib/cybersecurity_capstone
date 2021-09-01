const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

require("dotenv").config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

// Establish DB connection
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

// Initialize DB
const deleteTable = "DROP TABLE accounts";
connection.query(deleteTable, function (err, results, fields) {
  if (err) {
    console.log(err.message);
  }
});

const createTable = `CREATE TABLE \`accounts\` (
        \`username\` varchar(50) NOT NULL,
        \`password\` varchar(255) NOT NULL
      ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;`;

connection.query(createTable, function (err, results, fields) {
  if (err) {
    console.log(err.message);
  }
});

// Launch express server
const app = express();

app.use(
  session({
    secret: "kjsbfkjsbjkvbwijfb",
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

// Serve the page
app.get("/", function (request, response) {
  response.sendFile(path.join(__dirname + "/login.html"));
});

// Handle submit
app.post("/auth", function (request, response) {
  const username = request.body.username;
  const password = request.body.password;
  if (username && password) {
    connection.query(
      "SELECT * FROM accounts WHERE username = ? AND password = ?",
      [username, password],
      function (error, results, fields) {
        if (results.length > 0) {
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
    response.send("Please enter Username and Password!");
    response.end();
  }
});

// Handle register
app.post("/register", function (request, response) {
  const username = request.body.username;
  // Validate username contains characters only
  const regex = /^[a-zA-Z]+$/;
  const onlyChar = regex.test(username);
  const password = request.body.password;
  if (!(username && password && username.length >= 1 && password.length >= 1)) {
    response.send("Please enter Username and Password!");
    response.end();
  } else if (!onlyChar) {
    response.send("Username can only contain characters");
    response.end();
  } else {
    // Check if the username exists already
    connection.query(
      "SELECT * FROM accounts WHERE username = ?",
      [username],
      function (error, results) {
        if (results.length > 0) {
          response.send("Username already exists, maybe you meant to login?");
          response.end();
        } else {
          let query =
            "INSERT INTO `accounts` (`username`, `password`) VALUES ('";
          query += username + "', '" + password + "');";
          connection.query(query, function (error, results) {
            if (error) {
              response.send("Error: " + error);
            } else if (results) {
              response.send("Username registered");
            } else {
              response.send("Failed to register!");
            }
            response.end();
          });
        }
      }
    );
  }
});

// Back to home page
app.get("/home", function (request, response) {
  if (request.session.loggedin) {
    response.send("Welcome back, " + request.session.username + "!");
  } else {
    response.send("Please login to view this page!");
  }
  response.end();
});

app.listen(PORT);
