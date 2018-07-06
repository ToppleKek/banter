const utils = require("../utils/utils.js");
const mainModule = require('../bot.js');
module.exports = {
  help: "Owner only",
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, "owner")) {
      mainModule.db.serialize(() => {
        mainModule.db.get("SELECT * FROM servers", (err, row) => {
          utils.sendResponse(msg, row.id, 'info');
        });
      });
    }
  }
};