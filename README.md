# cybersecurity_capstone

This is the capstone project of the coursera cybersecurity specialisation. I have deployed the website to Heroku on:

https://georges-cybersecurity-capstone.herokuapp.com

The project is coded in nodejs using expressjs, and uses sql for the database.
The user first has to register, where the user would input their name, password, and an answer to a secret question in order to be able to reset the password.

Upon registration, a private/public keypair is generated with the private key encoded with a secret passphrase. This is stored in a DB, and is used for message sending.

After login, one can send messages, when a user *a* sends a message to user *b*, *a* signs the message with the public key of *b*, and then *b* can read the message by decrypting it using the private key. A message consists of a title and a body, both are encrypted. Only the title is shown on the main page with a link, and when you click on the link it gets you to the content of the message.

The authorisation cookie expires after 1hour, user can also log off manually.

There are 3 databases:

* DB for the users along with passwords and secret answers, both of which are encoded.
* DB for private/public keypairs, the private key is encoded.
* DB for messages, which contains the recipient, the ID, the title and the message, the last 2 are encoded using the keypair above.

You can get a dump of the databases by going to:

https://georges-cybersecurity-capstone.herokuapp.com/dbdump

And then click on the relevant button.