const { publicEncrypt, privateDecrypt } = require("crypto");
require("dotenv").config({ path: "./.env" });

function insertMessage(connection, response, username, title, message) {
  // Get the public key to encrypt
  connection.query(
    "SELECT publickey FROM keypairs WHERE username = ?",
    [username],
    function (error, results) {
      if (error) {
        console.error("Error in encrypting: " + error);
      } else {
        let key = results[0].publickey;
        const titleEnc = publicEncrypt(key, Buffer.from(title)).toString(
          "base64"
        );
        const msgEnc = publicEncrypt(key, Buffer.from(message)).toString(
          "base64"
        );

        // Now insert into messages DB
        let query =
          "INSERT INTO `messages` (`username`, `title`, `message`) VALUES ('";
        query += username + "', '" + titleEnc + "', '" + msgEnc + "');";
        connection.query(query, function (error) {
          if (error) {
            console.error("Error in saving message: " + error);
          } else {
            response.send('Message sent! <a href="/home">Go back</a>');
            response.end();
          }
        });
      }
    }
  );
}

function readTitles(connection, username, response) {
  // Get the private key to decrypt
  connection.query(
    "SELECT privatekey FROM keypairs WHERE username = ?",
    [username],
    function (error, results) {
      if (error) {
        console.error("Error in decrypting: " + error);
      } else {
        const key = results[0].privatekey;
        connection.query(
          "SELECT title, id FROM messages WHERE username = ?",
          [username],
          function (error, results) {
            if (error) {
              console.error(error);
            } else {
              let messages = results.map((result) =>
                privateDecrypt(
                  {
                    key: key,
                    passphrase: process.env.COOKIE_SECRET,
                  },
                  Buffer.from(result.title, "base64")
                ).toString()
              );
              let links = results.map((result) => "/message?id=" + result.id);
              response.render("message.html", {
                messages: messages,
                links: links,
                username: username,
              });
            }
          }
        );
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
          // Get the private key to decrypt
          connection.query(
            "SELECT privatekey FROM keypairs WHERE username = ?",
            [userName],
            function (error, results) {
              if (error) {
                console.error("Error in decrypting: " + error);
              } else {
                let key = results[0].privatekey;
                const mesDec = privateDecrypt(
                  {
                    key: key,
                    passphrase: process.env.COOKIE_SECRET,
                  },
                  Buffer.from(message, "base64")
                ).toString();
                const titleDec = privateDecrypt(
                  {
                    key: key,
                    passphrase: process.env.COOKIE_SECRET,
                  },
                  Buffer.from(title, "base64")
                ).toString();
                response.send("<h1>" + titleDec + "</h1><br>" + mesDec);
                response.end();
              }
            }
          );
        } else {
          response.send("You are not allowed to view this message");
          response.end();
        }
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
        insertMessage(connection, response, to, title, message);
      }
    }
  );
}

module.exports = {
  handleSendmessage,
  readTitles,
  readMessage,
};
