const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const crypto = require("crypto");

require("dotenv").config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

function isPasswordValid(password) {
  const regex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
  );
  return regex.test(password);
}

function isUserNameValid(username) {
  let regex = /^[a-zA-Z]+$/;
  return regex.test(username);
}

function hashPassword(username, password) {
  return crypto
    .createHash("sha512")
    .update(username + password)
    .digest("hex");
}

// Establish DB connection
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

// TODO remove that after deployment
// Initialize DB
const deleteTable = "DROP TABLE accounts";
connection.query(deleteTable, function (err, results, fields) {
  if (err) {
    console.log(err.message);
  }
});

const createTable = `CREATE TABLE \`accounts\` (
        \`username\` varchar(50) NOT NULL,
        \`password\` varchar(512) NOT NULL
      ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;`;

connection.query(createTable, function (err, results, fields) {
  if (err) {
    console.log(err.message);
  }
});

// Launch express server
const app = express();

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

// Serve the page
app.get("/", function (request, response) {
  response.sendFile(path.join(__dirname + "/login.html"));
});

// Handle submit
app.post("/auth", function (request, response) {
  const username = request.body.username;
  const password = request.body.password;
  if (
    username &&
    password &&
    isUserNameValid(username) &&
    isPasswordValid(password)
  ) {
    let hashedPassword = hashPassword(username, password);
    connection.query(
      "SELECT * FROM accounts WHERE username = ? AND password = ?",
      [username, hashedPassword],
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
    response.send("Please enter a valid Username and Password!");
    response.end();
  }
});

// Handle register
app.post("/register", function (request, response) {
  const username = request.body.username;
  // Validate username contains characters only
  const onlyChar = isUserNameValid(username);
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
          // Is password secure enough?
          const passValid = isPasswordValid(password);
          if (!passValid) {
            response.send(`Password needs to be minimum 8 characters and contains at least
                    1 lower case, 1 upper case, 1 number, and at least one special character from
                    !@#$%^&* but no spaces`);
            response.end();
          } else {
            let hashedPassword = hashPassword(username, password);
            let query =
              "INSERT INTO `accounts` (`username`, `password`) VALUES ('";
            query += username + "', '" + hashedPassword + "');";
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
