const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'dabon (kick) a user from the server',
  usage: `${CONFIG.prefix}dabon @someone reason for kick`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'kick')) {
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
        if (msg.mentions.users.first()) target = msg.guild.member(msg.mentions.users.first());
        else if (client.users.get(userArg)) target = msg.guild.member(client.users.get(userArg));
        else {
          utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}`, 'err');
          return;
        }

        const targetPos = utils.getHighestRolePos(msg.guild.id, target);
        const authorPos = utils.getHighestRolePos(msg.guild.id, msg.author);
        const targetUsr = target.user;

        if (targetPos >= authorPos) utils.sendResponse(msg, `${targetUsr.tag} has a higher or equal role. You also cannot dab on yourself`, 'err');
        else if (!target.kickable) utils.sendResponse(msg, `Missing permissions to dab on ${targetUsr.tag}`, 'err');
        else {
          target.createDM().then(chan => {
            chan.send({
              embed:{
                color: 1571692,
                title: `Get heckin dabbed on from ${msg.guild.name}`,
                description: `They kicked you for \`${reason}\``,
                timestamp: new Date(),
              }
            }).catch(err => {
              utils.sendResponse(msg, `Failed to DM ${targetUsr.tag} with error ${err}, trying to ban anyway`, 'info');
            });
          }).catch(err => {
            utils.sendResponse(msg, `Failed to DM ${targetUsr.tag} with error ${err}, trying to ban anyway`, 'info');
          });

          target.kick({ reason: reason })
              .then(member => {
                utils.writeToModlog(msg.guild.id, `Manual action`, `${msg.author.tag} dabbed on ${targetUsr.tag} for \`${reason.replace('`', '')}\``, false, msg.author);
                msg.channel.send({
                  embed: {
                    color: 1571692,
                    title: `${targetUsr.tag} JUST GOT DABBED ON`,
                    description: 'GET FRICKED KIDDO',
                    thumbnail: {
                      url: 'https://cdn.discordapp.com/attachments/298938210556575755/467035923289341965/breaddab.gif',
                    },
                    timestamp: new Date(),
                  }
                })
              })
              .catch(err => {
                utils.sendResponse(msg, `Failed to dab. Error: ${err}`, 'err');
              });
        }
      }
      else {
        utils.sendResponse(msg, `You must provide a mention or a userID to dab on!\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must have permission to kick members to execute this command', 'err');
    }
  }
};