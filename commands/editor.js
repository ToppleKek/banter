const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'Generate a link to the web editor',
  usage: `${CONFIG.prefix}editor`,
  main: (client, msg, hasArgs) => {
    mainModule.db.get(`SELECT config FROM servers WHERE id = ${msg.guild.id}`, (err, row) => {
      if (err) return utils.sendResponse(msg, `SQL_ERROR: ${err}`, 'err');
      else if (row && row.config) utils.sendResponse(msg, `https://editor.diddled.me/?cfg=${row.config}`, 'success');
      else utils.sendResponse(msg, `https://editor.diddled.me`, 'success');
    });
  }
};