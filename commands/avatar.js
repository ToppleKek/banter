module.exports = {
  help: 'Get a users avatar',
  main: (client, msg, hasArgs) => {
    let target;
    if (msg.mentions.users.first()) target = msg.mentions.users.first().id;
    else if (client.users.get(msg.content)) target = msg.content;
    else target = msg.author.id;
    msg.channel.send(client.users.get(target).avatarURL({size:2048}));
  }
};