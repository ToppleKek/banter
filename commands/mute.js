const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'Mute/unmute a user (toggle)',
  usage: `Note: you may use your own syntax for this command as long as the time number is next to the mention.\n${CONFIG.prefix}mute @someone 5 go think about what you've done for 5 minutes`,
  main: async (client, msg, hasArgs) => {
    const hasR = await utils.checkPermission(msg.author, msg, 'roles');
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR || hasR) {
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
          if (!Number.isNaN(Number.parseInt(time, 10))) args.splice(args.indexOf(time), 1);
          args.splice(utils.regexIndexOf(args, /<@!?(1|\d{17,19})>/), 1);
          const reason = args.join(' ');
          target.roles.remove(msg.guild.roles.find(role => role.name === 'Muted'));
          mainModule.db.run(`DELETE FROM muted WHERE user_id = ${target.id} AND guild_id = ${msg.guild.id}`, (err, row) => console.log(`[DEBUG] Tried to delete ${row}`));
          utils.writeToModlog(msg.guild.id, 'Manual action', `User ${target.user.tag} UNMUTED. Reason: \`${reason ? reason : 'No reason specified'}\``, false, msg.author);
          return utils.sendResponse(msg, `Unmuted ${target.user.tag}`, 'success');
        }

        if (Number.isNaN(Number.parseInt(time, 10))) {
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
        // Extra check, I have no idea why it keeps getting past but if you do
        // .!mute @someone 10mins reason
        // Notice how there is a 'mins' after the number.
        // For some reason it thinks thats all a-ok but it's really not.
        // So in modlog and probably in timedMute() the time variable is NaN.
        // This 'fix' should patch that up.
        if (Number.isNaN(Number.parseInt(time, 10) * 60)) return utils.sendResponse(msg, `Invalid time\nUsage: ${module.exports.usage}`, 'err');
        utils.timedMute(target.id, msg.guild.id, Number.parseInt(time, 10) * 60, false, msg.author, reason);
        utils.sendResponse(msg, `Muted ${target.user.tag}`, 'success');
      } else {
        utils.sendResponse(msg, `You must provide a user to mute and optional: time to mute\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must have permission to manage roles to execute this command', 'err');
    }
  }
};