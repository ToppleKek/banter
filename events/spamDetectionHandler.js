const mainModule = require('../bot.js');
const utils = require('../utils/utils.js');
const configTools = require('../utils/configTools.js');


module.exports = {
  message: async message => {
    if (!message.guild || message.author.bot) return;

    let conf = await configTools.getConfig(message.guild)
        .catch(err => console.log(err));

    if (!(conf instanceof Error)) {
      let user;

      if (!mainModule.guilds[message.guild.id]) {
        mainModule.guilds[message.guild.id] = {
          users: {}
        }
      }

      if (!mainModule.guilds[message.guild.id].users[message.author.id]) {
        mainModule.guilds[message.guild.id].users[message.author.id] = {
          lastMessage: null,
          lastMessageID: null,
          lastMessageTime: null,
          possibleSpamMessages: 0,
        }
      }

      user = mainModule.guilds[message.guild.id].users[message.author.id];

      if (user.lastMessage === message.content && (Date.now() - (conf.asCool * 1000)) < user.lastMessageTime) {
        user.possibleSpamMessages++;
      } else {
        user.possibleSpamMessages = 0;
      }

      user.lastMessage = message.content;
      user.lastMessageID = message.id;
      user.lastMessageTime = message.createdTimestamp;

      if (user.possibleSpamMessages >= conf.asMInRow - 1) {
        utils.sendResponse(message, `**ANTISPAM:** Possible spam detected for user: **${message.author.tag}**\n*Please contact a moderator to be unmuted*`, 'info');

        utils.permaMute(message.author.id, message.guild.id, true, mainModule.client.user.id, 'suspected spam', false);

        await utils.issueWarning(message.author.id, message.guild.id, {issuer:mainModule.client.user.id,message:'Possible spam detected - User has been muted'});

        user.possibleSpamMessages = 0;
      }
    } else {
      console.log(`[ERROR] spamDetection: conf is instanceof Error: ${conf} Guild: ${message.guild.name}`);
    }

  }
};