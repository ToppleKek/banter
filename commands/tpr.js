const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'Add/remove a role to the list of public roles (toggle)',
  usage: `${CONFIG.prefix}tpr role name`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin', true);
    if (hasMR) {
      if (hasArgs) {
        if (!msg.guild.roles.find(role => role.name === msg.content)) return utils.sendResponse(msg, `Role not found. Usage: ${module.exports.usage}`, 'err');
        else {
          let selfRoles = await utils.getSelfRoles(msg.guild.id).catch(e => utils.error(`tpr.js In await: \`${e}\` <--- if this is null, ignore`)); 
          let existingRoles = [];
          let rem = false;
          const roleToAdd = msg.guild.roles.find(role => role.name.toLowerCase() === msg.content.toLowerCase());
          const rolePos = roleToAdd.position;
          const authorPos = utils.getHighestRolePos(msg.guild.id, msg.author);
          if (rolePos >= authorPos) return utils.sendResponse(msg, 'That role is higher or equal to your highest role. You may only add roles under you to the list of public roles', 'err');
          if (selfRoles) existingRoles = selfRoles.split(' ');
          if (existingRoles.includes(roleToAdd.id)) rem = true;
          if (rem) existingRoles.splice(existingRoles.indexOf(roleToAdd.id, 1));
          else existingRoles.push(roleToAdd.id);
          mainModule.db.run(`UPDATE servers SET selfroles = ? WHERE id = ${msg.guild.id}`, existingRoles.join(' '), err => {
            if (err) return utils.sendResponse(msg, `[SQL_ERROR] In update: ${err}`, 'err');
            utils.writeToModlog(msg.guild.id, `role ${roleToAdd.name} is ${rem ? 'no longer public' : 'now public'}`, 'N/A', 'server', false, msg.author);
            utils.sendResponse(msg, `${rem ? 'Removed' : 'Added'} ${roleToAdd.name} (${roleToAdd.id}) ${rem ? 'from' : 'to'} list of public roles`, 'success');
          });
        }
      } else {
        utils.sendResponse(msg, `You must provide a role to add/remove\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must be a real administrator to use this command', 'err');
    }
  }
};