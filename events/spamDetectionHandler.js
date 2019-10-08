const mainModule = require('../bot.js');
const utils = require('../utils/utils.js');
const configTools = require('../utils/configTools.js');

module.exports = {
  message: async message => {
    if (!message.guild || message.author.bot) return;

    const ingoredChannels = await utils.getIgnoredChannels(message.guild.id, 'spam')
                            .catch(err => {return});
    if (ingoredChannels) {
      const arr = ingoredChannels.split(' ');
      if (arr.includes(message.channel.id)) return;
    }

    let conf = await configTools.getConfig(message.guild)
        .catch(err => console.log(err));

    if (!(conf instanceof Error)) {
      
      let user;

      if (!mainModule.guilds[message.guild.id]) {
        mainModule.guilds[message.guild.id] = {
          users: {},
          joins: {oldest: null, users: [], hitThreshold: false, hitAt: null}
        }
      }

      if (!mainModule.guilds[message.guild.id].users[message.author.id]) {
        mainModule.guilds[message.guild.id].users[message.author.id] = {
          lastMessage: null,
          lastMessageID: null,
          lastMessageTime: null,
          possibleSpamMessages: 0,
          possibleSpamMentions: 0
        }
      }

      user = mainModule.guilds[message.guild.id].users[message.author.id];

      if (!user.lastMessageTime)
        user.lastMessageTime = Date.now();

      if (conf.asMInRow > 0 && !await utils.isWhitelisted(message.guild, message.guild.member(message.author), 'antiSpam')) {
        if (user.lastMessage === message.content && (Date.now() - (conf.asCool * 1000)) < user.lastMessageTime) {
          user.possibleSpamMessages++;
        } else {
          user.possibleSpamMessages = 0;
        }

        if (user.possibleSpamMessages >= conf.asMInRow - 1) {
          utils.sendResponse(message, `**ANTISPAM:** Possible spam detected for user: **${message.author.tag}**\n*Please contact a moderator to be unmuted*`, 'info');

          utils.permaMute(message.author.id, message.guild.id, true, mainModule.client.user.id, 'suspected spam', false);

          await utils.issueWarning(message.author.id, message.guild.id, {issuer:mainModule.client.user.id,message:'Possible spam detected - User has been muted'});

          user.possibleSpamMessages = 0;
        }
      }

      if (conf.asPing > 0 && !await utils.isWhitelisted(message.guild, message.guild.member(message.author), 'antiPing')) {
        const regex = /<@!?(\d{17,19})>|<@&(\d{17,19})>/g;
        const matches = message.content.match(regex);

        console.log(matches);

        if (matches)
          user.possibleSpamMentions += matches.length;

        if (Date.now() - (conf.asPCool * 1000) > user.lastMessageTime)
          user.possibleSpamMentions = 0;

        console.log(`POSSIBLE SPAM: ${user.possibleSpamMentions} LASTMSG: ${user.lastMessageTime}`);

        if (user.possibleSpamMentions >= conf.asPing) {
          utils.sendResponse(message, `**ANTISPAM:** (Ping spam) Possible spam detected for user: **${message.author.tag}**\n*Please contact a moderator to be unmuted*`, 'info');

          utils.permaMute(message.author.id, message.guild.id, true, mainModule.client.user.id, 'suspected spam', false);

          await utils.issueWarning(message.author.id, message.guild.id, {issuer:mainModule.client.user.id,message:'Possible spam detected - User has been muted (ping spam)'});
          
          user.possibleSpamMentions = 0;
        }
      }
      user.lastMessage = message.content;
      user.lastMessageID = message.id;
      user.lastMessageTime = message.createdTimestamp;

    } else {
      console.log(`[ERROR] spamDetection: conf is instanceof Error: ${conf} Guild: ${message.guild.name}`);
    }
  },

  guildMemberAdd: async member => {
    let conf = await configTools.getConfig(member.guild)
        .catch(err => console.log(err));

    if (!(conf instanceof Error)) {
      if (conf.aBotMInRow <= 0)
        return;

      let user;

      if (!mainModule.guilds[member.guild.id]) {
        mainModule.guilds[member.guild.id] = {
          users: {},
          joins: {oldest: null, users: [], hitThreshold: false, hitAt: null}
        }
      }

      if (!mainModule.guilds[member.guild.id].joins.users[member.user.id])
        mainModule.guilds[member.guild.id].joins.users.push(member.user.id);

      let joins = mainModule.guilds[member.guild.id].joins;

      if (((Date.now() - (conf.aBotCool * 1000)) > joins.oldest) && joins.oldest) {
        mainModule.guilds[member.guild.id].joins.oldest = null;
        mainModule.guilds[member.guild.id].joins.users = [];
      } else if (!joins.oldest)
        mainModule.guilds[member.guild.id].joins.oldest = Date.now();

      if (mainModule.guilds[member.guild.id].joins.hitAt) {
        mainModule.guilds[member.guild.id].joins.hitThreshold = (Date.now() - (conf.aBotTCool * 1000)) < mainModule.guilds[member.guild.id].joins.hitAt;

        // Reset if we are not on high alert anymore
        if (!mainModule.guilds[member.guild.id].joins.hitThreshold) {
          mainModule.guilds[member.guild.id].joins.oldest = null;
          mainModule.guilds[member.guild.id].joins.users = [];
        }
      }

      if (joins.hitThreshold)
        utils.permaMute(member.user.id, member.guild.id, true, mainModule.client.user.id, 'suspected spam', false);
      else if (joins.users.length > conf.aBotMInRow && (Date.now() - (conf.aBotCool * 1000)) < joins.oldest) {
        console.log("DEBUG: Not on cooldown: muting all");

        for (let i = 0; i < joins.users.length; i++)
          utils.permaMute(joins.users[i], member.guild.id, true, mainModule.client.user.id, 'suspected spam', false);

        mainModule.guilds[member.guild.id].joins.hitThreshold = true;
        mainModule.guilds[member.guild.id].joins.hitAt = Date.now();

        const systemChannel = member.guild.channels.get(await utils.getDBItem(member.guild, 'system'));

        if (systemChannel)
          await systemChannel.send(`@everyone A raid has been detected and stopped!
${joins.users.length} users were muted and new users will be muted for another ${conf.aBotTCool} seconds.
These users must be unmuted manually if this was an error. Please take appropriate action as soon as possible.`, {disableEveryone: false});
      }
    } else {
      console.log(`[ERROR] spamDetection: conf is instanceof Error: ${conf} Guild: ${message.guild.name}`);
    }
  }
};