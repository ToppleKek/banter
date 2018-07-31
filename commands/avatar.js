const CONFIG = require('../config.json');
module.exports = {
  help: 'Get a users avatar',
  usage: `${CONFIG.prefix}avatar @someone`,
  main: async (client, msg, hasArgs) => {
    let target;
    let extraInfo;
    if (msg.mentions.users.first()) target = msg.mentions.users.first().id;
    else if (client.users.find(usr => usr.username.toLowerCase() === msg.content.toLowerCase())) target = client.users.find(usr => usr.username.toLowerCase() === msg.content.toLowerCase()).id;
    else if (hasArgs) {
      const usrFoundFromID = await client.users.fetch(msg.content)
          .catch(err => console.log(`[DEBUG] Err in fetch ${err}`));
      if (usrFoundFromID.id) target = usrFoundFromID.id;
    }
    else {
      extraInfo = 'User not found or none was supplied, returning your avatar';
      target = msg.author.id;
    }
    msg.channel.send(`${extraInfo ? `\`${extraInfo}\`` : ''} ${client.users.get(target).avatarURL({size:2048})} `).catch(err => {
      msg.channel.send('Failed to get avatar');
    });
  }
};