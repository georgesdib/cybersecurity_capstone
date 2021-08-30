const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const PORT = process.env.PORT || 5000

// Establish DB connection
const connection = mysql.createConnection({
  host: "us-cdbr-east-04.cleardb.com",
  user: "b487a85c65c9ba",
  password: "c708f206",
  database: "heroku_1d16e292184721a",
});

// Launch express server
const app = express();

app.use(
  session({
    secret: "coursera_secret",
    resave: true,
    saveUninitialized: true,
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