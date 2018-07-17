const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Mute a user',
  usage: `${CONFIG.prefix}mute @someone 5 go think about what youve done for 5 minutes`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'admin')) {
      if (hasArgs) {
        const args = msg.content.split(' ');
        const userArg = args[0];
        let target;

        if (msg.mentions.users.first()) target = msg.guild.member(msg.mentions.users.first());
        else if (client.users.get(userArg)) target = msg.guild.member(client.users.get(userArg));
        else {
          utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}`, 'err');
          return;
        }

        if (target.roles.find(role => role.name === 'Muted')) {
          return utils.sendResponse(msg, 'This user is already muted', 'err');
        }

        const time = args[1];
        args.splice(0, 2);
        let reason = args.join(' ');

        if (!reason) reason = 'No reason specified';
        if (Number.isNaN(Number.parseInt(time, 10))) {
          return utils.sendResponse(msg, `Invalid time\nUsage: ${module.exports.usage}`, 'err');
        } else if (Number.parseInt(time, 10) < 1) {
          return utils.sendResponse(msg, `Time must be greater than 1 minute\nUsage: ${module.exports.usage}`, 'err');
        }

        utils.timedMute(target.id, msg.guild.id, time * 60, false, msg.author, reason);
        utils.sendResponse(msg, `Muted ${target.user.tag}`, 'success');
      } else {
        utils.sendResponse(msg, `You must provide a length of time to mute\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must be an administrator to execute this command', 'err');
    }
  }
};