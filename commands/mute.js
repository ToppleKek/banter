const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Mute a user',
  usage: `Note: you may use your own syntax for this command as long as the time number is next to the mention. ${CONFIG.prefix}mute @someone 5 go think about what you've done for 5 minutes`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR) {
      if (hasArgs) {
        const args = msg.content.split(' ');
        let target;

        if (msg.mentions.users.first()) target = msg.guild.member(msg.mentions.users.first());
        else return utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}`, 'err');

        let mentionIndex = utils.regexIndexOf(args, /<@!?(1|\d{17,19})>/);
        let time;

        if (!Number.isNaN(Number.parseInt(args[mentionIndex - 1], 10)) && Number.isNaN(Number.parseInt(args[mentionIndex + 1], 10)) || !args[mentionIndex + 1]) {
          time = args[mentionIndex - 1];
        } else if (!Number.isNaN(Number.parseInt(args[mentionIndex + 1], 10)) && Number.isNaN(Number.parseInt(args[mentionIndex - 1], 10)) || !args[mentionIndex - 1]) {
          time = args[mentionIndex + 1];
        } else if (!Number.isNaN(Number.parseInt(args[mentionIndex - 1], 10)) && !Number.isNaN(Number.parseInt(args[mentionIndex + 1], 10))) {
          utils.sendResponse(msg, 'Time value before and after the mention is ambiguous', 'info');
          if (args[mentionIndex + 2] && !args[mentionIndex - 2]) {
            time = args[mentionIndex - 1];
          } else if (args[mentionIndex - 2] && !args[mentionIndex + 2]) {
            time = args[mentionIndex + 1];
          } else {
            utils.sendResponse(msg, 'Can\'t autoselect a time value based on surrounding text. Defaulting to first value', 'info');
            time = args[mentionIndex - 1];
          }
        } else return utils.sendResponse(msg, `Time must be before or after the user mention\nUsage: ${module.exports.usage}`);
        
        if (target.roles.find(role => role.name === 'Muted')) {
          return utils.sendResponse(msg, 'This user is already muted', 'err');
        }

        if (Number.isNaN(Number.parseInt(time, 10))) {
          console.log('looks like theres no time');
          args.splice(utils.regexIndexOf(args, /<@!?(1|\d{17,19})>/), 1);
          let reason = args.join(' ');
          if (!reason) reason = 'No reason specified';
          utils.permaMute(target.id, msg.guild.id, false, msg.author, reason);
          return utils.sendResponse(msg, `Muted ${target.user.tag}`, 'success');
        }
        args.splice(args.indexOf(time), 1);
        args.splice(utils.regexIndexOf(args, /<@!?(1|\d{17,19})>/), 1);

        let reason = args.join(' ');

        if (!reason) reason = 'No reason specified';
        if (Number.isNaN(Number.parseInt(time, 10))) {
          return utils.sendResponse(msg, `Invalid time\nUsage: ${module.exports.usage}`, 'err');
        } else if (Number.parseInt(time, 10) < 1) {
          return utils.sendResponse(msg, `Time must be greater than 1 minute\nUsage: ${module.exports.usage}`, 'err');
        } else if (Number.parseInt(time, 10) > 1000) {
          return utils.sendResponse(msg, `Don't you think that might be too long? Maximum time is 1000 minutes\nUsage: ${module.exports.usage}`, 'err');
        }

        utils.timedMute(target.id, msg.guild.id, time * 60, false, msg.author, reason);
        utils.sendResponse(msg, `Muted ${target.user.tag}`, 'success');
      } else {
        utils.sendResponse(msg, `You must provide a user to mute and optional: time to mute\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must be an administrator to execute this command', 'err');
    }
  }
};