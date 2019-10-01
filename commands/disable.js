const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Disable a channel action',
  usage: `${CONFIG.prefix}disable <log|modlog|starboard|system>`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR) {
      if (!hasArgs) {
        utils.sendResponse(msg, `You must provide something to Disable!\nUsage: \`${module.exports.usage}\``, 'err');
        return;
      }
      mainModule.db.serialize(() => {
        mainModule.db.get(`SELECT * FROM servers WHERE id = ${msg.guild.id}`, (err, row) => {
          switch (msg.content) {
            case 'log':
              if (!row.log) {
                utils.sendResponse(msg, 'Logging is already disabled', 'err');
                return;
              }
              mainModule.db.run(`UPDATE servers SET log = NULL WHERE id = ${msg.guild.id}`, (err) => {
                if (err) {
                  utils.sendResponse(msg, `There was an error updating your log! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
                } else {
                  utils.sendResponse(msg, `Disabled logging on this server`, 'success');
                  utils.writeToModlog(msg.guild.id, 'server logging disabled', 'N/A', 'server', false, msg.author);
                }
              });
              break;

            case 'modlog':
              if (!row.modlog) {
                utils.sendResponse(msg, 'Logging of moderator actions is already disabled', 'err');
                return;
              }
              mainModule.db.run(`UPDATE servers SET modlog = NULL WHERE id = ${msg.guild.id}`, (err) => {
                if (err) {
                  utils.sendResponse(msg, `There was an error updating your modlog! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
                } else {
                  utils.sendResponse(msg, `Disabled logging of moderator actions on this server`, 'success');
                  utils.writeToModlog(msg.guild.id, 'moderator action logging disabled', 'N/A', 'server', false, msg.author);
                }
              });
              break;

            case 'starboard':
              if (!row.starboard) {
                utils.sendResponse(msg, 'Starboard is already disabled', 'err');
                return;
              }
              mainModule.db.run(`UPDATE servers SET starboard = NULL WHERE id = ${msg.guild.id}`, (err) => {
                if (err) {
                  utils.sendResponse(msg, `There was an error updating your starboard! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
                } else {
                  utils.sendResponse(msg, `Disabled starboard on this server`, 'success');
                  utils.writeToModlog(msg.guild.id, 'starboard disabled', 'N/A', 'server', false, msg.author);
                }
              });
              break;

            case 'system':
              if (!row.starboard) {
                utils.sendResponse(msg, 'System channel is already disabled', 'err');
                return;
              }
              mainModule.db.run(`UPDATE servers SET system = NULL WHERE id = ${msg.guild.id}`, (err) => {
                if (err) {
                  utils.sendResponse(msg, `There was an error updating your system channel! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
                } else {
                  utils.sendResponse(msg, `Disabled system channel on this server`, 'success');
                  utils.writeToModlog(msg.guild.id, 'system channel disabled', 'N/A', 'server', false, msg.author);
                }
              });
              break;

            default:
              utils.sendResponse(msg, `Invalid type.\nUsage: \`${module.exports.usage}\``, 'err');
          }
        });
      });
    } else {
      utils.sendResponse(msg, 'You must be an administrator to execute this command', 'err');
    }
  }
};