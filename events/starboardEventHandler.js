const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

module.exports = {
  messageReactionAdd: (messageReaction, user) => {
    console.log(`reaction name: ${messageReaction.emoji.name}`);
    if (!messageReaction.message.guild || messageReaction.emoji.name !== '⭐' || messageReaction.message.guild.id === '298938210556575755') return;
    mainModule.db.get(`SELECT * FROM starboard WHERE message_id = ${messageReaction.message.id}`, async (err, row) => {
      if (err) return console.log(`[ERROR] starboardEventHandler: SQL_SELECT: ${err}`);
      if (row) {
        mainModule.db.run(`UPDATE starboard SET star_count = ${messageReaction.count}`, err => {
          if (err) return console.log(`[ERROR] starboardEventHandler: SQL_UPDATE: ${err}`);
        });
        const starboard = await utils.getActionChannel(messageReaction.message.guild.id, 'starboard');
        const messageToEdit = await starboard.messages.fetch(row.message_id);
        console.log(`Found message to edit ${messageToEdit.id}`);
        //messageToEdit.edit()
      } else if (messageReaction.count >= 5) {
        const usrArr = Array.from(messageReaction.users.values());
        let subAmount = 0;
        for (let i = 0; i < usrArr.length; i += 1) {
          if (usrArr[i].bot || usrArr[i].id === messageReaction.message.author.id) subAmount += 1;
        }
        if (messageReaction.count - subAmount >= 2) {
          const starboard = await utils.getActionChannel(messageReaction.message.guild.id, 'starboard');
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
            embed:{
              author: {
                name: `${messageReaction.message.author.tag}'s message was starred in ${messageReaction.message.channel.name}`,
                iconURL: messageReaction.message.author.avatarURL() ? messageReaction.message.author.avatarURL() : 'https://cdn.discordapp.com/attachments/328763359535169547/468903512273715200/damn.png',
                color: 16768849,
                fields: fields,
                footer: {
                  text: `⭐ ${messageReaction.count}`,
                },
              }
            }
          };
          if (isImg) embed.image = messageReaction.attachments.first().url;

          const botMsg = await starboard.send(embed);
          mainModule.db.run(`INSERT INTO starboard VALUES(NULL, ${messageReaction.message.guild.id}, ${messageReaction.message.channel.id}, ${messageReaction.message.id}, ${botMsg.id}, ${messageReaction.count})`, err => {
            if (err) return utils.sendResponse(messageReaction.message, `Failed to update starboard db: SQL_ERROR: ${err}`, 'err');
          });
        }
      }
    });
  }
};