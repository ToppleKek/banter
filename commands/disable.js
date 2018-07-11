const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Disable a channel action',
  usage: `${CONFIG.prefix}disable <log|modlog|starboard>`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'admin')) {
      if (!hasArgs) {
        utils.sendResponse(msg, `You must provide something to Disable!\nUsage: \`${module.exports.usage}\``, 'err');
        return;
      }
      mainModule.db.serialize(() => {
        mainModule.db.get(`SELECT * FROM servers WHERE id = ${msg.guild.id}`, (err, row) => {
          switch (msg.content) {
            case 'log':
              if (row.log === 'DISABLED') {
                utils.sendResponse(msg, 'Logging is already disabled', 'err');
                return;
              }
              mainModule.db.run(`UPDATE servers SET log = 'DISABLED' WHERE id = ${msg.guild.id}`, (err) => {
                if (err) {
                  utils.sendResponse(msg, `There was an error updating your log! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
                } else {
                  utils.sendResponse(msg, `Disabled logging on this server`, 'success');
                }
              });
              break;
            case 'modlog':
              if (row.modlog === 'DISABLED') {
                utils.sendResponse(msg, 'Logging of moderator actions is already disabled', 'err');
                return;
              }
              mainModule.db.run(`UPDATE servers SET modlog = 'DISABLED' WHERE id = ${msg.guild.id}`, (err) => {
                if (err) {
                  utils.sendResponse(msg, `There was an error updating your modlog! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
                } else {
                  utils.sendResponse(msg, `Disabled logging of moderator actions on this server`, 'success');
                }
              });
              break;
            case 'starboard':
              if (row.starboard === 'DISABLED') {
                utils.sendResponse(msg, 'Starboard is already disabled', 'err');
                return;
              }
              mainModule.db.run(`UPDATE servers SET starboard = 'DISABLED' WHERE id = ${msg.guild.id}`, (err) => {
                if (err) {
                  utils.sendResponse(msg, `There was an error updating your starboard! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
                } else {
                  utils.sendResponse(msg, `Disabled starboard on this server`, 'success');
                }
              });
              break;
            default:
              utils.sendResponse(msg, `Invalid type.\nUsage: \`${module.exports.usage}\``, 'err');
          }
        });
      });
    } else {
      utils.sendResponse(msg, 'You must be an administrator to use this command', 'err');
    }
  }
};