const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Force initialize the database for this server (Owner only)',
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'owner')) {
      mainModule.db.serialize(() => {
        mainModule.db.run(`INSERT INTO servers VALUES('${msg.guild.name}', '${msg.guild.id}', 'NOT_SET', 'NOT_SET')`, (err) => {
          if (err) return console.log(err);
        });
      });
      //mainModule.db.finalize();
    } else {
      utils.sendResponse(msg, `Please ask the owner ${CONFIG.ownerid} to initialize your server`, 'err');
    }
  }
};