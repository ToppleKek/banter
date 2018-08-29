const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Force initialize the database for this server (Bot owner only)',
  usage: `${CONFIG.prefix}force_init`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'owner');
    if (hasMR) {
      mainModule.db.serialize(() => {
        mainModule.db.run(`INSERT INTO servers VALUES(NULL, '${msg.guild.name.replace("'", '')}', '${msg.guild.id}', NULL, NULL, NULL, NULL, NULL, NULL)`, (err) => {
          if (err) return console.log(err);
        });
      });
      //mainModule.db.finalize();
    } else {
      utils.sendResponse(msg, `Please ask the owner ${CONFIG.ownerid} to initialize your server`, 'err');
    }
  }
};