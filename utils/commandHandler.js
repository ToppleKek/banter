const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
const utils = require('./utils.js');

module.exports = {
  async checkCommand(client, commands, msg, isMention, prefix) {
    if (!msg.guild || msg.author.id === client.user.id || msg.author.bot || CONFIG.blacklisted.includes(msg.author.id))
      return;
    
    if (!msg.guild.member(client.user).hasPermission('ADMINISTRATOR')) {
      return utils.sendResponse(msg, 'This bot being a moderation bot requires the administrator permission to function. Please grant it an administrative role.', 'err');
    }

    if (!mainModule.locks[msg.guild.id])
      mainModule.locks[msg.guild.id] = {};

    if (isMention) {
      const command = msg.content.split(' ')[1];
      let hasArgs = true;

      if (msg.content === `<@${client.user.id}> ${command}` || msg.content === `<@!${client.user.id}> ${command}`)
        hasArgs = false;

      let content = msg.content.split(' ');

      content.splice(0, 2);
      msg.content = content.join(' ').replace(/\s\s+/g, ' ');

      if (commands[command]) {
        try {
          const customPermission = await utils.getCustomPermission(msg.guild, msg.guild.member(msg.author), command);

          if (customPermission === 'deny') {
              return msg.channel.send({embed: {
                title: 'Command Handler Message',
                description: `**${msg.author.tag}** - You have been denied access to this command by the server owner`,
                color: 11736341,
                timestamp: new Date()
              }});
          }

          Object.defineProperty(msg, 'command', {
            value: command
          });

          commands[command].main(client, msg, hasArgs);
          console.log(`[INFO] Command ${command} used by: ${msg.author.tag} args: ${msg.content}`);
        } catch (err) {
          console.log(`[ERROR] (Mention) Error in command used by: ${msg.author.tag} Content: ${msg.content} Error: ${err} ${err.stack}`);
        }
      }
    } else {
      const command = msg.content.split(prefix)[1].split(' ')[0];
      let hasArgs = true;

      if (msg.content === prefix + command)
        hasArgs = false;

      msg.content = msg.content.replace(`${prefix + command} `, '').replace(/\s\s+/g, ' ');

      if (commands[command]) {
        try {
          const customPermission = await utils.getCustomPermission(msg.guild, msg.guild.member(msg.author), command);

          if (customPermission === 'deny') {
              return msg.channel.send({embed: {
                title: 'Command Handler Message',
                description: `**${msg.author.tag}** - You have been denied access to this command by the server owner`,
                color: 11736341,
                timestamp: new Date()
              }});
          }

          Object.defineProperty(msg, 'command', {
            value: command
          });

          commands[command].main(client, msg, hasArgs);
          console.log(`[INFO] Command ${command} used by: ${msg.author.tag} args: ${msg.content}`);
        } catch (err) {
          console.log(`[ERROR] Error in command used by: ${msg.author.tag} Content: ${msg.content} Error: ${err} ${err.stack}`);
        }
      }
    }
  }
};
