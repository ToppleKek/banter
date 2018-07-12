const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Force initialize the database for this server (Owner only)',
  usage: `${CONFIG.prefix}force_init`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'owner')) {
      mainModule.db.serialize(() => {
        // TODO: something is very wrong here, i cant update the db with the auto increment row_id
        mainModule.db.run(`INSERT INTO servers VALUES('${msg.guild.name.replace("'", '')}', '${msg.guild.id}', NULL, NULL, NULL)`, (err) => {
          if (err) return console.log(err);
        });
      });
      //mainModule.db.finalize();
    } else {
      utils.sendResponse(msg, `Please ask the owner ${CONFIG.ownerid} to initialize your server`, 'err');
    }
  }
};