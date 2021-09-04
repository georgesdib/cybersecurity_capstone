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
          \`username\` varchar(50) NOT NULL,
          \`title\` varchar(512) NOT NULL,
          \`message\` TEXT NOT NULL
        ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;`;

  connection.query(createTable, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });
}

function insertMessage(connection, username, title, message) {
  //TODO add encryption to the message
  let query = "INSERT INTO `messages` (`username`, `title`, `message`) VALUES ('";
  query += username + "', '" + title + "', '" + message + "');";
  connection.query(query, function (error) {
    if (error) {
      console.error("Error: " + error);
    }
  });
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
        response.send("Message sent!");
        response.end();
      }
    }
  );
}

module.exports = { handleSendmessage, initializeMessageTable };
