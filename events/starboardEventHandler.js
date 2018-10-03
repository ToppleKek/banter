const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const configTools = require('../utils/configTools.js');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

module.exports = {
  messageReactionAdd: async (messageReaction, user) => {
    const conf = await configTools.getConfig(messageReaction.guild)
          .catch(err => console.log(`[ERROR] starboard:messageReactionAdd:Failed to get config ${err}`));
    //const starsRequired = conf instanceof Error ? 5 : conf.starC;
    const starsRequired = 5;
    if (!messageReaction.message.guild || messageReaction.emoji.name !== '⭐' || messageReaction.message.author === mainModule.client.user) return;
    const usrArr = Array.from(messageReaction.users.values());
    for (let i = 0; i < usrArr.length; i += 1) {
      if (usrArr[i].bot || usrArr[i].id === messageReaction.message.author.id) {
        messageReaction.users.remove(usrArr[i].id);
        messageReaction.message.channel.send({ embed: {
          color: 11736341,
          description: `**${usrArr[i].tag}**: Bot accounts and the target message author cannot star this message!`,
          timestamp: new Date(),
        }})
          .then(message => {
            setTimeout(() => {
              message.delete()
                  .catch(e => console.log(`[ERROR] Error deleting self star message ${e}`));
            }, 30000);
          })
          .catch(e => console.log(`[ERROR] Error sending self star message ${e}`));
        return;
      }
    }
    mainModule.db.get(`SELECT * FROM starboard WHERE message_id = ${messageReaction.message.id}`, async (err, row) => {
      if (err) return console.log(`[ERROR] starboardEventHandler: SQL_SELECT: ${err}`);
      if (row) {
        mainModule.db.run(`UPDATE starboard SET star_count = ${messageReaction.count} WHERE message_id = ${messageReaction.message.id}`, err => {
          if (err) return console.log(`[ERROR] starboardEventHandler: SQL_UPDATE: ${err}`);
        });
        const starboard = await utils.getActionChannel(messageReaction.message.guild.id, 'starboard').catch(err => console.log(`[WARN] Starboard promise reject! Err: ${err}`));
        if (starboard === messageReaction.message.id) return;
        const messageToEdit = await mainModule.client.channels.get(starboard).messages.fetch(row.botmsg_id);
        console.log(`Found message to edit ${messageToEdit.id}`);
        const fields = [{
          name: 'Content',
          value: messageReaction.message.content ? messageReaction.message.content : '***Empty message***',
        }];
        let isImg;
        if (messageReaction.message.attachments.first()) {
          const contentType = await utils.getContentType(messageReaction.message.attachments.first().url);
          isImg = ['image/jpeg', 'image/gif', 'image/webp', 'image/png'].includes(contentType);
          if (!isImg) {
            fields.push({
              name: 'Attachments',
              value: messageReaction.message.attachments.first().url,
            });
          }
        }
        let embed = {
          embed: {
            author: {
              name: `${messageReaction.message.author.tag}'s message was starred in ${messageReaction.message.channel.name}`,
              iconURL: messageReaction.message.author.avatarURL() ? messageReaction.message.author.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png',
              url: `https://canary.discordapp.com/channels/${messageReaction.message.guild.id}/${messageReaction.message.channel.id}/${messageReaction.message.id}`,
            },
            color: 16768849,
            description: `**Click to jump:** https://canary.discordapp.com/channels/${messageReaction.message.guild.id}/${messageReaction.message.channel.id}/${messageReaction.message.id}`,
            fields: fields,
            timestamp: new Date(),
            footer: {
              text: `⭐ ${messageReaction.count}`,
            },
          }
        };
        if (isImg) {
          embed.embed.image = {};
          embed.embed.image.url = messageReaction.message.attachments.first().url;
        }
        messageToEdit.edit(embed);
      } else if (messageReaction.count >= 5) {
        if (messageReaction.count >= 5) {
          const starboard = await utils.getActionChannel(messageReaction.message.guild.id, 'starboard').catch(err => console.log(`[WARN] Starboard promise reject! Err: ${err}`));
          if (starboard === messageReaction.message.id) return;
          const fields = [{
            name: 'Content',
            value: messageReaction.message.content ? messageReaction.message.content : '***Empty message***',
          }];
          let isImg;
          if (messageReaction.message.attachments.first()) {
            const contentType = await utils.getContentType(messageReaction.message.attachments.first().url);
            isImg = ['image/jpeg', 'image/gif', 'image/webp', 'image/png'].includes(contentType);
            if (!isImg) {
              fields.push({
                name: 'Attachments',
                value: messageReaction.message.attachments.first().url,
              });
            }
          }
          let embed = {
            embed: {
              author: {
                name: `${messageReaction.message.author.tag}'s message was starred in ${messageReaction.message.channel.name}`,
                iconURL: messageReaction.message.author.avatarURL() ? messageReaction.message.author.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png',
                url: `https://canary.discordapp.com/channels/${messageReaction.message.guild.id}/${messageReaction.message.channel.id}/${messageReaction.message.id}`,
              },
              color: 16768849,
              description: `**Click to jump:** https://canary.discordapp.com/channels/${messageReaction.message.guild.id}/${messageReaction.message.channel.id}/${messageReaction.message.id}`,
              fields: fields,
              timestamp: new Date(),
              footer: {
                text: `⭐ ${messageReaction.count}`,
              },
            }
          };
          if (isImg) {
            embed.embed.image = {};
            embed.embed.image.url = messageReaction.message.attachments.first().url;
          }
          const botMsg = await mainModule.client.channels.get(starboard).send(embed);
          mainModule.db.run(`INSERT INTO starboard VALUES(NULL, ${messageReaction.message.guild.id}, ${messageReaction.message.channel.id}, ${messageReaction.message.id}, ${botMsg.id}, ${messageReaction.count})`, err => {
            if (err) return utils.sendResponse(messageReaction.message, `Failed to update starboard db: SQL_ERROR: ${err}`, 'err');
          });
        }
      }
    });
  },

  messageReactionRemove: (messageReaction, user) => {
    console.log(`rem reaction name: ${messageReaction.emoji.name}`);
    if (!messageReaction.message.guild || messageReaction.emoji.name !== '⭐' || messageReaction.message.author === mainModule.client.user) return;
    mainModule.db.get(`SELECT * FROM starboard WHERE message_id = ${messageReaction.message.id}`, async (err, row) => {
      if (err) return console.log(`[ERROR] starboardEventHandler: SQL_SELECT: ${err}`);
      if (row) {
        mainModule.db.run(`UPDATE starboard SET star_count = ${messageReaction.count} WHERE message_id = ${messageReaction.message.id}`, err => {
          if (err) return console.log(`[ERROR] starboardEventHandler: SQL_UPDATE: ${err}`);
        });
        const starboard = await utils.getActionChannel(messageReaction.message.guild.id, 'starboard').catch(err => console.log(`[WARN] Starboard promise reject! Err: ${err}`));
        if (starboard === messageReaction.message.id) return;
        const messageToEdit = await mainModule.client.channels.get(starboard).messages.fetch(row.botmsg_id);
        console.log(`Found message to edit ${messageToEdit.id}`);
        if (messageReaction.count < 1) {
          mainModule.db.run('DELETE FROM starboard WHERE botmsg_id = ?', messageToEdit.id, (err) => {
            if (err) return console.log(`[ERROR] Failed to delete from starboard db: ${err}`);
            messageToEdit.delete();
          });   
        }
        const fields = [{
          name: 'Content',
          value: messageReaction.message.content ? messageReaction.message.content : '***Empty message***',
        }];
        let isImg;
        if (messageReaction.message.attachments.first()) {
          const contentType = await utils.getContentType(messageReaction.message.attachments.first().url);
          isImg = ['image/jpeg', 'image/gif', 'image/webp', 'image/png'].includes(contentType);
          if (!isImg) {
            fields.push({
              name: 'Attachments',
              value: messageReaction.message.attachments.first().url,
            });
          }
        }
        let embed = {
          embed: {
            author: {
              name: `${messageReaction.message.author.tag}'s message was starred in ${messageReaction.message.channel.name}`,
              iconURL: messageReaction.message.author.avatarURL() ? messageReaction.message.author.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png',
              url: `https://canary.discordapp.com/channels/${messageReaction.message.guild.id}/${messageReaction.message.channel.id}/${messageReaction.message.id}`,
            },
            color: 16768849,
            description: `**Click to jump:** https://canary.discordapp.com/channels/${messageReaction.message.guild.id}/${messageReaction.message.channel.id}/${messageReaction.message.id}`,
            fields: fields,
            timestamp: new Date(),
            footer: {
              text: `⭐ ${messageReaction.count}`,
            },
          }
        };
        if (isImg) {
          embed.embed.image = {};
          embed.embed.image.url = messageReaction.message.attachments.first().url;
        }
        messageToEdit.edit(embed);
      }
    });
  },
};