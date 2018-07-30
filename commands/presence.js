const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Get a users (rich)presence',
  usage: `${CONFIG.prefix}presence @someone`,
  main: (client, msg, hasArgs) => {
    let target;
    if (msg.mentions.users.first()) target = msg.mentions.users.first();
    else if (client.users.get(msg.content)) target = client.users.get(msg.content);
    else if (client.users.find(usr => usr.username.toLowerCase() === msg.content.toLowerCase())) target = client.users.find(usr => usr.username.toLowerCase() === msg.content.toLowerCase());
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
            value: `Timestamps: ${target.presence.activity.timestamps ? `Start: ${target.presence.activity.timestamps.start} End: ${target.presence.activity.timestamps.end}` : 'N/A'}\
            \nType: ${target.presence.activity.type}`
          }],
          thumbnail: {
            url: target.presence.activity.assets.smallImageURL() ? target.presence.activity.assets.smallImageURL({size:2048}) : 'https://cdn.discordapp.com/attachments/298938210556575755/471375338006380547/no_image.png',
          },
          image: {
            url: target.presence.activity.assets.largeImageURL() ? target.presence.activity.assets.largeImageURL({size:2048}) : 'https://cdn.discordapp.com/attachments/298938210556575755/471375338006380547/no_image.png',
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