const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const util = require('util');
module.exports = {
  help: 'Get a users (rich)presence',
  usage: `${CONFIG.prefix}presence @someone`,
  main: async (client, msg, hasArgs) => {
    const emoji = {
      online: 'allow',
      idle: 'idle',
      dnd: 'deny',
      offline: 'unmanageable'
    };

    let target;

    if (msg.mentions.users.first())
      target = msg.mentions.users.first();

    else if (client.users.find(usr => usr.username.toLowerCase().search(msg.content.toLowerCase()) > -1))
      target = client.users.find(usr => usr.username.toLowerCase().search(msg.content.toLowerCase()) > -1);

    else if (hasArgs && new RegExp((/[0-9]{18}/g)).test(msg.content)) {
      const usrFoundFromID = await client.users.fetch(msg.content)
          .catch(err => {
            target = msg.author;
          });
      if (usrFoundFromID)
        target = usrFoundFromID;
    } else
      target = msg.author;

    if (target.presence.activity && target.presence.activity.state && target.presence.activity.details && target.presence.activity.assets) {
      let cs = target.presence.clientStatus;

      if (!cs) {
        cs = {
          desktop: 'unknown',
          mobile: 'unknown',
          web: 'unknown'
        };
      }

      msg.channel.send({
        embed: {
          author: {
            name: `${target.tag}'s presence`,
            iconURL: target.avatarURL(),
          },
          fields: [{
            name: 'Statuses',
            value: `Desktop: ${cs.desktop ? `${CONFIG.emoji[emoji[cs.desktop]]} ${cs.desktop}` : `${CONFIG.emoji[emoji['offline']]} offline`}\nMobile: ${cs.mobile ? `${CONFIG.emoji[emoji[cs.mobile]]} ${cs.mobile}` : `${CONFIG.emoji[emoji['offline']]} offline`}\nWeb: ${cs.web ? `${CONFIG.emoji[emoji[cs.web]]} ${cs.web}` : `${CONFIG.emoji[emoji['offline']]} offline`}`,
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
      let cs = target.presence.clientStatus;

      if (!cs) {
        cs = {
          desktop: 'unknown',
          mobile: 'unknown',
          web: 'unknown'
        };
      }

      msg.channel.send({
        embed: {
          author: {
            name: `${target.tag}'s presence`,
            iconURL: target.avatarURL(),
          },
          fields: [{
            name: 'Statuses',
            value: `Desktop: ${cs.desktop ? `${CONFIG.emoji[emoji[cs.desktop]]} ${cs.desktop}` : `${CONFIG.emoji[emoji['offline']]} offline`}\nMobile: ${cs.mobile ? `${CONFIG.emoji[emoji[cs.mobile]]} ${cs.mobile}` : `${CONFIG.emoji[emoji['offline']]} offline`}\nWeb: ${cs.web ? `${CONFIG.emoji[emoji[cs.web]]} ${cs.web}` : `${CONFIG.emoji[emoji['offline']]} offline`}`,
          }, {
            name: 'Presence name',
            value: (target.presence.activity && target.presence.activity.name) ? target.presence.activity.name : 'N/A',
          }, {
            name: 'Presence state',
            value: target.presence.activity && target.presence.activity.state ? target.presence.activity.state : 'N/A'
          }, {
            name: 'Time playing',
            value: (target.presence.activity && target.presence.activity.timestamps) ? utils.secondsToHms((Date.now() / 1000) - (target.presence.activity.timestamps.start.getTime() / 1000)) : 'N/A',
          }, {
            name: 'Type',
            value: (target.presence.activity && target.presence.activity.type) ? target.presence.activity.type : 'N/A',
          }],
          color: 4718492,
          timestamp: new Date(),
        },
      });
    }
  }
};