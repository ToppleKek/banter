const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Enable/disable spam detection (toggle)',
  usage: `${CONFIG.prefix}spam`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');

    if (hasMR) {
      mainModule.db.get('SELECT spam_filter_enabled FROM servers WHERE id = ?', msg.guild.id, (err, row) => {
        let enabled = false;

        console.log(`DB SAYS: ${row.spam_filter_enabled}`);
        if (!row || !row.spam_filter_enabled || row.spam_filter_enabled === 0)
          enabled = false;

        else
          enabled = true;

        console.log(`ENABLED: ${enabled}`);
        mainModule.db.run('UPDATE servers SET spam_filter_enabled = ? WHERE id = ?', (enabled ? 0 : 1), msg.guild.id, err => {
          if (err)
            return utils.sendResponse(msg, `Failed to update your servers configuration: SQL_ERROR: ${err}`, 'err');

          return utils.sendResponse(msg, `Spam detection has been ${enabled ? 'disabled' : 'enabled'} for this server`, 'success');
        });
      });
    } else {
      return utils.sendResponse(msg, `You must be a real administrator to use this command`, 'err');
    }
  }
};