const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'Unmute a user',
  usage: `${CONFIG.prefix}unmute @someone`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR) {
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

        if (!target.roles.find(role => role.name === 'Muted')) {
          return utils.sendResponse(msg, 'This user is not muted', 'err');
        }

        args.shift();
        let reason = args.join(' ');

        if (!reason) reason = 'No reason specified';

        target.roles.remove(msg.guild.roles.find(role => role.name === 'Muted'));
        mainModule.db.run(`DELETE FROM muted WHERE user_id = ${target.id} AND guild_id = ${msg.guild.id}`, (err, row) => console.log(`[DEBUG] Tried to delete ${row}`));
        utils.writeToModlog(msg.guild.id, 'Manual action', `User ${target.user.tag} UNMUTED. Reason: \`${reason}\``, false, msg.author);

        utils.sendResponse(msg, `Unmuted ${target.user.tag}`, 'success');
      } else {
        utils.sendResponse(msg, `You must provide a user mention or ID to unmute\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must be an administrator to execute this command', 'err');
    }
  }
};