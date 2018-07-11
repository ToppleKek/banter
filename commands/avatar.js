const CONFIG = require('../config.json');
module.exports = {
  help: 'Get a users avatar',
  usage: `${CONFIG.prefix}avatar @someone`,
  main: (client, msg, hasArgs) => {
    let target;
    if (msg.mentions.users.first()) target = msg.mentions.users.first().id;
    else if (client.users.get(msg.content)) target = msg.content;
    else target = msg.author.id;
    msg.channel.send(client.users.get(target).avatarURL({size:2048})).catch(err => {
      msg.channel.send('Failed to get avatar');
    });
  }
};