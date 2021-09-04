const temp = require("temp").track();
const fs = require("fs");

function downloadData(response, results) {
  temp.open({suffix: ".txt"}, function (err, info) {
    if (err) {
      console.error("Failed to create temp: " + err);
    } else {
        const data = JSON.stringify(results);
      fs.writeFile(info.fd, data, (err) => {
        if (err) {
          console.error("Failed to write file: " + err);
        } else {
          response.download(info.path);
        }
      });
    }
  });
  temp.cleanupSync();
}

module.exports = { downloadData };
