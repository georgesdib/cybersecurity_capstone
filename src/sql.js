function initializeTable(connection) {
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

  connection.query(createTable, function (err) {
    if (err) {
      console.log(err.message);
    }
  });

  createTable = `CREATE TABLE IF NOT EXISTS \`keypairs\` (
      \`username\` varchar(50) NOT NULL,
      \`publickey\` TEXT NOT NULL,
      \`privatekey\` TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

  connection.query(createTable, function (err) {
    if (err) {
      console.log(err.message);
    }
  });
}

function initializeMessageTable(connection) {
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
            \`title\` TEXT NOT NULL,
            \`message\` TEXT NOT NULL,
            PRIMARY KEY (\`id\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

  connection.query(createTable, function (err, results, fields) {
    if (err) {
      console.log(err.message);
    }
  });
}

module.exports = {
  initializeTable,
  initializeMessageTable,
};
