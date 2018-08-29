const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'naenae (ban) a user from the server',
  usage: `${CONFIG.prefix}naenae @someone reason for ban`,
  main: async (client, msg, hasArgs) => {
    const hasBAN = await utils.checkPermission(msg.author, msg, 'ban');
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR || hasBAN) {
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
        if (userArg === '@everyone' || userArg === '@here') return utils.sendResponse(msg, 'What am I gonna do?! Mintz the server ***again***????', 'err');
        if (msg.mentions.users.first()) target = msg.guild.member(msg.mentions.users.first());
        else if (client.users.get(userArg)) target = msg.guild.member(client.users.get(userArg));
        else return utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}`, 'err');

        // Back by popular demand
        if (target.id === client.user.id) return utils.sendResponse(msg, 'Woah what am I gonna do naenae myself??!??', 'err');
        else if (target.id === CONFIG.ownerid) return utils.sendResponse(msg, 'I\'m not gonna naenae the god!!!!!!', 'err');
        else if (target.id === msg.guild.ownerID) return utils.sendResponse(msg, 'Damn that persons the owner no naenae', 'err');

        const targetPos = utils.getHighestRolePos(msg.guild.id, target);
        const authorPos = utils.getHighestRolePos(msg.guild.id, msg.author);
        const targetUsr = target.user;

        if (targetPos >= authorPos && msg.author.id !== msg.guild.ownerID) utils.sendResponse(msg, `${targetUsr.tag} has a higher or equal role. You also cannot naenae yourself`, 'err');
        else if (!target.bannable) utils.sendResponse(msg, `Missing permissions to naenae ${targetUsr.tag}`, 'err');
        else {
          target.createDM().then(chan => {
            chan.send({
              embed: {
                color: 1571692,
                title: `Get heckin naenaed from ${msg.guild.name}`,
                description: `They banned you for \`${reason}\``,
                timestamp: new Date(),
              }
            }).catch(err => {
              utils.sendResponse(msg, `Failed to DM ${targetUsr.tag} with error ${err}, trying to ban anyway`, 'info');
            });
          }).catch(err => {
            utils.sendResponse(msg, `Failed to DM ${targetUsr.tag} with error ${err}, trying to ban anyway`, 'info');
          });

          target.ban({days: 0, reason: reason})
              .then(member => {
                utils.writeToModlog(msg.guild.id, `Manual action`, `${msg.author.tag} naenaed ${targetUsr.tag} for \`${reason.replace('`', '')}\``, false, msg.author);
                msg.channel.send({
                  embed: {
                    color: 1571692,
                    title: `${targetUsr.tag} JUST GOT NAENAED`,
                    description: 'GET FRICKED KIDDO',
                    thumbnail: {
                      url: 'https://images-ext-2.discordapp.net/external/hHfWlFdQbHi0JXTdaed_3iGwULt6vXXLohlGFEe56oo/https/cdn.discordapp.com/attachments/242345022719000595/352625339891056640/lmao.gif',
                    },
                    timestamp: new Date(),
                  }
                })
              })
              .catch(err => {
                utils.sendResponse(msg, `Failed to naenae. Error: ${err}`, 'err');
              });
        }
      }
      else {
        utils.sendResponse(msg, `You must provide a mention or a userID to naenae!\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must have permission to ban members to execute this command', 'err');
    }
  }
};