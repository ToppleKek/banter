const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Get information about a user',
  usage: `${CONFIG.prefix}user @someone`,
  main: async (client, msg, hasArgs) => {
    let target;
    if (msg.mentions.users.first()) target = msg.mentions.users.first();

    else if (client.users.find(usr => usr.username.toLowerCase().search(msg.content.toLowerCase()) > -1))
      target = client.users.find(usr => usr.username.toLowerCase().search(msg.content.toLowerCase()) > -1);

    else if (hasArgs && new RegExp(/[0-9]{17,19}/g).test(msg.content)) {
      const usrFoundFromID = await client.users.fetch(msg.content)
          .catch(err => {
            extraInfo = `User not found or none was supplied, returning your info Debug: ${err}`;
            target = msg.author;
          });

      if (usrFoundFromID) target = usrFoundFromID;
    }

    else {
      extraInfo = 'User not found or none was supplied, returning your info';
      target = msg.author;
    }

    target = await msg.guild.members.fetch(target).catch(err => {return}) ? await msg.guild.members.fetch(target) : {user:target};

    const fields = [{
        name: 'Creation Date',
        value: target.user.createdAt ? target.user.createdAt.toString() : 'N/A',
      }];

    if (await msg.guild.members.fetch(target).catch(err => {return})) {
      fields.push({
        name: 'Guild Join Date',
        value: target.joinedAt.toString(),
      });
    }

    fields.push({
      name: 'Seen on',
      value: utils.getMutualGuilds(target.user).length > 0 ? utils.getMutualGuilds(target.user).join('\n').substring(0, 1000) : 'No guilds',
    });

    let color;
    const member = await msg.guild.members.fetch(target).catch(err => {return});
    if (member && member.roles.color) color = member.roles.color.color;
    else color = 0;

    const embed = {
      author: {
        name: `${target.user.tag} - User Info`,
        iconURL: target.user.avatarURL(),
      },
      color: color,
      description: `ID: ${target.user.id} Status: ${target.user.presence.status}`,
      fields: fields,
      thumbnail: {url: target.user.avatarURL({size:2048})},
    };

    msg.channel.send({embed});
  }
};
