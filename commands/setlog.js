const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
module.exports = {
  help: 'Set your servers log',
  main: (client, msg, hasArgs) => {
    if (!utils.checkPermission(msg.author, msg, 'admin'))
      if (!hasArgs) {
        utils.sendResponse(msg, 'You must provide a mention to a channel or a channelID!', 'err');
        return;
      }
    let log;
    if (msg.mentions.channels.first()) log = msg.mentions.channels.first().id;
    else if (msg.guild.channels.get(msg.content)) log = msg.content;
    if (!msg.guild.channels.get(log)) {
      utils.sendResponse(msg, 'That channel does not exist on this guild', 'err');
      return;
    }
    mainModule.db.run(`UPDATE servers SET log = ${log} WHERE id = ${msg.guild.id}`, (err) => {
      if (err) {
        utils.sendResponse(msg, `There was an error updating your log! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
      } else {
        utils.sendResponse(msg, `Set ${msg.guild.name}'s log to ${msg.guild.channels.get(log).name}`, 'success');
      }
    });
  }
};