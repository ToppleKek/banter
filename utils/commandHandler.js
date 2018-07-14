const CONFIG = require('../config.json');
const utils = require('./utils.js');

module.exports = {
  checkCommand(client, commands, msg, isMention) {
    if (!msg.guild || msg.author.id === client.user.id || msg.author.bot || CONFIG.blacklisted.includes(msg.author.id)) return;
    if (!msg.guild.member(client.user).hasPermission('ADMINISTRATOR')) {
      return utils.sendResponse(msg, 'This bot being a moderation bot requires the administrator permission to function. Please grant it an administrative role.', 'err');
    }
    if (isMention) {
      const command = msg.content.split(' ')[1];
      let hasArgs = true;
      console.log(msg.content);
      if (msg.content === `<@${client.user.id}> ${command}`) hasArgs = false;
      msg.content = msg.content.split(' ').splice(2, msg.content.split(' ').length).join(' ');
      if (commands[command]) {
        try {
          commands[command].main(client, msg, hasArgs);
          console.log(`[INFO] Command ${command} used by: ${msg.author.tag} args: ${msg.content}`);
        } catch (err) {
          console.log(`[ERROR] (Mention) Error in command used by: ${msg.author.tag} Content: ${msg.content} Error: ${err}`);
          //utils.logError(client, msg, 'COMMAND HANDLER ERROR', `The command handler encountered an error while processing a command. Command: ${msg.content} Error: ${err}`);
        }
      }
    } else {
      const command = msg.content.split(CONFIG.prefix)[1].split(' ')[0];
      let hasArgs = true;
      if (msg.content === CONFIG.prefix + command) hasArgs = false;
      msg.content = msg.content.replace(`${CONFIG.prefix + command} `, '');
      if (commands[command]) {
        try {
          commands[command].main(client, msg, hasArgs);
          console.log(`[INFO] Command ${command} used by: ${msg.author.tag} args: ${msg.content}`);
        } catch (err) {
          console.log(`[ERROR] Error in command used by: ${msg.author.tag} Content: ${msg.content} Error: ${err}`);
          //utils.logError(client, msg, 'COMMAND HANDLER ERROR', `The command handler encountered an error while processing a command. Command: ${msg.content} Error: ${err}`);
        }
      }
    }
  },
};
