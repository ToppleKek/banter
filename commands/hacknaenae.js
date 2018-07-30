const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'hacknaenae (ban) a user from the server who isnt already on the server',
  usage: `${CONFIG.prefix}hacknaenae userID reason for ban`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'ban')) {
      if (hasArgs) {
        let target;
        const args = msg.content.split(' ');
        const userArg = args[0];
        let reason;
        if (args[1]) {
          args.shift();
          reason = args.join(' ');
        }
        else reason = 'No reason provided';
        client.users.fetch(userArg)
          .then(target => {
            if (msg.guild.member(target)) {
              utils.sendResponse(msg, 'That user is on this server, please use naenae instead', 'err');
              return;
            }

            if (!utils.checkPermission(client.user, msg, 'ban')) utils.sendResponse(msg, `Missing permissions to naenae ${target.tag}`, 'err');
            else {
              msg.guild.members.ban(target, { days: 0, reason: reason})
                .then(member => {
                  utils.writeToModlog(msg.guild.id, `Manual action`, `${msg.author.tag} hacknaenaed ${target.tag} for \`${reason.replace('`', '')}\``, false, msg.author);
                  msg.channel.send({
                    embed: {
                      color: 1571692,
                      title: `${target.tag} JUST GOT HACKNAENAED`,
                      description: 'GET FRICKED KIDDO',
                      thumbnail: {
                        url: 'https://images-ext-2.discordapp.net/external/hHfWlFdQbHi0JXTdaed_3iGwULt6vXXLohlGFEe56oo/https/cdn.discordapp.com/attachments/242345022719000595/352625339891056640/lmao.gif',
                      },
                      timestamp: new Date(),
                    }
                  })
                })
                .catch(err => {
                  utils.sendResponse(msg, `Failed to hacknaenae. Error: ${err}`, 'err');
                });
            }
          })
          .catch(err => {
            utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}\nError: ${err}`, 'err');
          });
      }
      else {
        utils.sendResponse(msg, `You must provide a userID to hacknaenae!\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must have permission to ban members to execute this command', 'err');
    }
  }
};