const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const configTools = require('../utils/configTools.js');
const mainModule = require('../bot.js');

module.exports = {
  help: 'Load base64 config string from web editor',
  usage: `${CONFIG.prefix}loadcfg eyAic29tZUNvbmZpZyI6IHRydWUsICJ3aHlEaWRZb3VEZWNvZGVUaGlzIjogdHJ1ZX0=`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR) {
      if (hasArgs) {
        const json = configTools.decodeConfig(msg.content);
        if (json instanceof Error) utils.sendResponse(msg, `Decoding and parsing your string failed ${json}`, 'err');
        else if (!configTools.validateConfig(json)) utils.sendResponse(msg, `Your JSON did not validate against the schema. Check to make sure all values are supplied and have the correct type`, 'err');
        else {
          mainModule.db.run(`UPDATE servers SET config = ? WHERE id = ${msg.guild.id}`, msg.content, (err, row) => {
            if (err) return utils.sendResponse(msg, `SQL_ERROR: ${err}`, 'err');
            else {
              utils.sendResponse(msg, 'Server configuration updated', 'success');
            }
          });
        }
      } else utils.sendResponse(msg, `You must provide a base64 string to load\nUsage: ${module.exports.usage}`, 'err');
    } else utils.sendResponse(msg, 'You must be an administrator to use this command', 'err');
  }
};