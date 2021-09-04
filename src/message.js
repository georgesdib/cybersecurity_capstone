function initializeMessageTable(connection) {
  // TODO remove that after deployment
  // Initialize DB
  /*const deleteTable = "DROP TABLE messages";
  connection.query(deleteTable, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });*/

  const createTable = `CREATE TABLE IF NOT EXISTS \`messages\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`username\` varchar(50) NOT NULL,
          \`title\` varchar(512) NOT NULL,
          \`message\` TEXT NOT NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

  connection.query(createTable, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });
}

function insertMessage(connection, username, title, message) {
  //TODO add encryption to the message
  let query =
    "INSERT INTO `messages` (`username`, `title`, `message`) VALUES ('";
  query += username + "', '" + title + "', '" + message + "');";
  connection.query(query, function (error) {
    if (error) {
      console.error("Error: " + error);
    }
  });
}

function readTitles(connection, username, response) {
  connection.query(
    "SELECT title, id FROM messages WHERE username = ?",
    [username],
    function (error, results) {
      if (error) {
        console.error(error);
      } else {
        let messages = results.map((result) => result.title);
        let links = results.map((result) => "/message?id=" + result.id);
        response.render("message.html", { messages: messages, links: links, username: username });
      }
    }
  );
}

function readMessage(connection, loggedInUser, id, response) {
  connection.query(
    "SELECT title, message, username FROM messages WHERE id = ?",
    [id],
    function (error, results) {
      if (error) {
        console.error(error);
      } else {
        const title = results[0].title;
        const message = results[0].message;
        const userName = results[0].username;
        if (userName == loggedInUser) {
          response.send("<h1>" + title + "</h1><br>" + message);
        } else {
          response.send("You are not allowed to view this message");
        }
        response.end();
      }
    }
  );
}

function handleSendmessage(connection, request, response) {
  const to = request.body.to;
  const title = request.body.title;
  const message = request.body.message;

  // Is the username valid
  connection.query(
    "SELECT * FROM accounts WHERE username = ?",
    [to],
    function (error, results) {
      if (error) {
        console.error("Error: " + error);
      } else if (results.length === 0) {
        response.send("Invalid username");
        response.end();
      } else {
        insertMessage(connection, to, title, message);
        response.send('Message sent! <a href="/home">Go back</a>');
        response.end();
      }
    }
  );
}

module.exports = {
  handleSendmessage,
  initializeMessageTable,
  readTitles,
  readMessage
};
