const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Set your servers channel config',
  usage: `${CONFIG.prefix}set <log|modlog|starboard> #channel`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR) {
      if (!hasArgs) {
        utils.sendResponse(msg, `You must provide something to update and a mention to a channel or a channelID!\nUsage: \`${module.exports.usage}\``, 'err');
        return;
      }
      let selection = msg.content.split(' ')[0];

      let channel;
      if (msg.mentions.channels.first()) channel = msg.mentions.channels.first().id;
      else if (msg.guild.channels.get(msg.content)) channel = msg.content;
      if (!msg.guild.channels.get(channel)) {
        utils.sendResponse(msg, `That channel does not exist on this guild.\nUsage: \`${module.exports.usage}\``, 'err');
        return;
      }

      switch (selection) {
        case 'log':
          mainModule.db.run(`UPDATE servers SET log = ${channel} WHERE id = ${msg.guild.id}`, (err) => {
            if (err) {
              utils.sendResponse(msg, `There was an error updating your log! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            } else {
              utils.sendResponse(msg, `Set ${msg.guild.name}'s log to ${msg.guild.channels.get(channel).name}`, 'success');
              utils.writeToModlog(msg.guild.id, 'server logging enabled', 'N/A', 'server', false, msg.author);
            }
          });
          break;
        case 'modlog':
          mainModule.db.run(`UPDATE servers SET modlog = ${channel} WHERE id = ${msg.guild.id}`, (err) => {
            if (err) {
              utils.sendResponse(msg, `There was an error updating your modlog! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            } else {
              utils.sendResponse(msg, `Set ${msg.guild.name}'s modlog to ${msg.guild.channels.get(channel).name}`, 'success');
              utils.writeToModlog(msg.guild.id, 'moderator action logging enabled', 'N/A', 'server', false, msg.author);
            }
          });
          break;
        case 'starboard':
          mainModule.db.run(`UPDATE servers SET starboard = ${channel} WHERE id = ${msg.guild.id}`, (err) => {
            if (err) {
              utils.sendResponse(msg, `There was an error updating your starboard! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            } else {
              utils.sendResponse(msg, `Set ${msg.guild.name}'s starboard to ${msg.guild.channels.get(channel).name}`, 'success');
              utils.writeToModlog(msg.guild.id, 'starboard enabled', 'N/A', 'server', false, msg.author);
            }
          });
          break;
        default:
          utils.sendResponse(msg, `Invalid type.\nUsage: \`${module.exports.usage}\``, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must be an administrator to use this command', 'err');
    }
  }
};