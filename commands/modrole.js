const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'List/Toggle roles that are given internal "administrator" permission',
  usage: `${CONFIG.prefix}modrole role name`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin', true);
    if (hasMR) {
      if (hasArgs) {
        if (!msg.guild.roles.find(role => role.name === msg.content)) return utils.sendResponse(msg, `Role not found. Usage: ${module.exports.usage}`, 'err');
        else {
          let modRoles = await utils.getModRoles(msg.guild.id).catch(e => utils.sendResponse(msg, `[SQL_ERROR] In await: \`${e}\` <--- if this is null, ignore`, 'err')); 
          let existingRoles = [];
          let rem = false;
          const roleToAdd = msg.guild.roles.find(role => role.name === msg.content);
          if (modRoles) existingRoles = modRoles.split(' ');
          if (existingRoles.includes(roleToAdd.id)) rem = true;
          if (rem) existingRoles.splice(existingRoles.indexOf(roleToAdd.id, 1));
          else existingRoles.push(roleToAdd.id);
          mainModule.db.run(`UPDATE servers SET modroles = ? WHERE id = ${msg.guild.id}`, existingRoles.join(' '), err => {
            if (err) return utils.sendResponse(msg, `[SQL_ERROR] In update: ${err}`, 'err');
            utils.writeToModlog(msg.guild.id, 'Manual action', `Role ${roleToAdd.name} was ${rem ? 'removed' : 'added'} ${rem ? 'from' : 'to'} the modrole list.`, false, msg.author);
            utils.sendResponse(msg, `${rem ? 'Removed' : 'Added'} ${roleToAdd.name} to list of modroles. All users with this role will ${rem ? 'no longer' : 'now'} have internal "administrator" permission!`, 'success');
          });
        }
      } else {
        let modRoles = await utils.getModRoles(msg.guild.id).catch(e => utils.sendResponse(msg, `This server doesn\'t have any modroles. To add one: ${module.exports.usage}`, 'err'));
        if (!modRoles) return;
        modRoles = modRoles.split(' ');
        const modRNames = [];
        const toRemove = [];
        for (let i = 0; i < modRoles.length; i += 1) {
          if (!msg.guild.roles.get(modRoles[i])) toRemove.push(modRoles[i]);
          else modRNames.push(msg.guild.roles.get(modRoles[i]).name);
        }
        if (toRemove.length > 0) {
          for (let i = 0; i < toRemove.length; i += 1) {
            modRoles.splice(modRoles.indexOf(toRemove[i]), 1);
          }
          mainModule.db.run(`UPDATE servers SET modroles = ? WHERE id = ${msg.guild.id}`, modRoles.join(' '), err => {
            if (err) return utils.sendResponse(msg, `[SQL_ERROR] In update in toRemove: ${err}`, 'err');
            utils.sendResponse(msg, 'Some modroles were found in the db that do not exist anymore! They have been removed', 'info');
          });
        }
        if (modRNames.length < 1) utils.sendResponse(msg, `This server doesn\'t have any modroles. To add one: ${module.exports.usage}`, 'err');
        else utils.sendResponse(msg, `**Modroles for ${msg.guild.name}**\n-------------\n${modRNames.join('\n')}`, 'info');
      }
    } else {
      utils.sendResponse(msg, 'You must be a real administrator to use this command', 'err');
    }
  }
};