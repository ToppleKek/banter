const CONFIG = require('../config.json');
module.exports = {
  help: 'Get a users avatar',
  usage: `${CONFIG.prefix}avatar @someone`,
  main: async (client, msg, hasArgs) => {
    let target;
    let extraInfo;
    if (msg.mentions.users.first()) target = msg.mentions.users.first().id;
    else if (client.users.find(usr => usr.username.toLowerCase().search(msg.content.toLowerCase()) > -1)) target = client.users.find(usr => usr.username.toLowerCase().search(msg.content.toLowerCase()) > -1).id;
    else if (hasArgs && new RegExp((/[0-9]{18}/g)).test(msg.content)) {
      const usrFoundFromID = await client.users.fetch(msg.content)
          .catch(err => {
            extraInfo = `User not found or none was supplied, returning your avatar Debug: ${err}`;
            target = msg.author.id;
          });
      if (usrFoundFromID) target = usrFoundFromID.id;
    }
    else {
      extraInfo = 'User not found or none was supplied, returning your avatar';
      target = msg.author.id;
    }
    msg.channel.send(`${extraInfo ? `\`${extraInfo}\`` : ''} ${client.users.get(target).tag}'s avatar: ${client.users.get(target).avatarURL({size:2048})} `).catch(err => {
      msg.channel.send('Failed to get avatar');
    });
  }
};