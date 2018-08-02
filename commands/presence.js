const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Get a users (rich)presence',
  usage: `${CONFIG.prefix}presence @someone`,
  main: async (client, msg, hasArgs) => {
    let target;
    if (msg.mentions.users.first()) target = msg.mentions.users.first();
    //else if (usrFoundFromID.id) target = usrFoundFromID;
    else if (client.users.find(usr => usr.username.toLowerCase() === msg.content.toLowerCase())) target = client.users.find(usr => usr.username.toLowerCase() === msg.content.toLowerCase());
    else if (hasArgs && new RegExp((/[0-9]{18}/g)).test(msg.content)) {
      const usrFoundFromID = await client.users.fetch(msg.content)
          .catch(err => {
            target = msg.author;
          });
      if (usrFoundFromID) target = usrFoundFromID;
    }
    else target = msg.author;
    if (!target.presence || !target.presence.activity) return utils.sendResponse(msg, 'That user is not playing a game', 'err');
    if (target.presence.activity && target.presence.activity.state && target.presence.activity.details && target.presence.activity.assets) {
      msg.channel.send({
        embed: {
          author: {
            name: `${target.tag}'s presence`,
            iconURL: target.avatarURL(),
          },
          fields: [{
            name: 'Status',
            value: target.presence.status,
          }, {
            name: 'Presence name',
            value: target.presence.activity.name ? target.presence.activity.name : 'N/A',
          }, {
            name: 'Rich presence state',
            value: target.presence.activity.state ? target.presence.activity.state : 'N/A',
          }, {
            name: 'Rich presence details',
            value: target.presence.activity.details ? target.presence.activity.details : 'N/A',
          }, {
            name: 'Rich presence image text',
            value: `Small image text: ${target.presence.activity.assets.smallText ? target.presence.activity.assets.smallText : 'N/A'}\
            \nLarge image text: ${target.presence.activity.assets.largeText ? target.presence.activity.assets.largeText : 'N/A'}`,
          }, {
            name: 'Extra info',
            value: `**Timestamps:** ${target.presence.activity.timestamps ? 
                   `\nTime elapsed: ${target.presence.activity.timestamps.start ? utils.secondsToHms((Date.now() / 1000) - (target.presence.activity.timestamps.start.getTime() / 1000)) : 'N/A'}\
                   \nTime left: ${target.presence.activity.timestamps.end ?
                   utils.secondsToHms((target.presence.activity.timestamps.end.getTime() / 1000) - (Date.now() / 1000)) : 'N/A'}` : 'N/A'}\
                   \n**Type:** ${target.presence.activity.type}`
          }],
          thumbnail: {
            url: target.presence.activity.assets.smallImageURL() ? target.presence.activity.assets.smallImageURL({size:2048, format:'png'}) : 'https://cdn.discordapp.com/attachments/298938210556575755/471375338006380547/no_image.png',
          },
          image: {
            url: target.presence.activity.assets.largeImageURL() ? target.presence.activity.assets.largeImageURL({size:2048, format:'png'}) : 'https://cdn.discordapp.com/attachments/298938210556575755/471375338006380547/no_image.png',
          },
          color: 4718492,
          timestamp: new Date(),
        },
      });
    } else {
      msg.channel.send({
        embed: {
          author: {
            name: `${target.tag}'s presence`,
            iconURL: target.avatarURL(),
          },
          fields: [{
            name: 'Status',
            value: target.presence.status,
          }, {
            name: 'Presence name',
            value: target.presence.activity.name ? target.presence.activity.name : 'N/A',
          }, {
            name: 'Time playing',
            value: target.presence.activity.timestamps ? utils.secondsToHms((Date.now() / 1000) - (target.presence.activity.timestamps.start.getTime() / 1000)) : 'N/A',
          }, {
            name: 'Type',
            value: target.presence.activity.type,
          }],
          color: 4718492,
          timestamp: new Date(),
        },
      });
    }
  }
};