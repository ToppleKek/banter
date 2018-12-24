const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'Role yourself (toggle)',
  usage: `${CONFIG.prefix}pubrole public role name`,
  main: async (client, msg, hasArgs) => {
    if (hasArgs) {
      let selfRoles = await utils.getSelfRoles(msg.guild.id).catch(e => utils.sendResponse(msg, `This server doesn\'t have any public roles`, 'err'));
      if (!selfRoles) return;
      selfRoles = selfRoles.split(' ');
      const toRemove = [];
      for (let i = 0; i < selfRoles.length; i += 1) {
        if (!msg.guild.roles.get(selfRoles[i])) toRemove.push(selfRoles[i]);
      }
      if (toRemove.length > 0) {
        for (let i = 0; i < toRemove.length; i += 1) {
          selfRoles.splice(selfRoles.indexOf(toRemove[i]), 1);
        }
        mainModule.db.run(`UPDATE servers SET selfroles = ? WHERE id = ${msg.guild.id}`, selfRoles.join(' '), err => {
          if (err) return utils.sendResponse(msg, `[SQL_ERROR] In update in toRemove: ${err}`, 'err');
          utils.sendResponse(msg, 'Some selfRoles were found in the db that do not exist anymore! They have been removed', 'info');
        });
      }
      if (selfRoles.length < 1) utils.sendResponse(msg, `This server doesn\'t have any public roles`, 'err');
      const roleToAdd = msg.guild.roles.find(role => role.name === msg.content);
      if (!roleToAdd) return utils.sendResponse(msg, `That role does not exist\nUsage: ${module.exports.usage}`, 'err');
      if (selfRoles.includes(roleToAdd.id)) {
        if (msg.guild.member(msg.author).roles.find(role => role.name === roleToAdd.name)) {
          await msg.guild.member(msg.author).roles.remove(roleToAdd).catch(err => utils.sendResponse(msg, `Failed to remove role: ${err}`, 'err'));
          utils.sendResponse(msg, `You don't have the \`${roleToAdd.name}\` role anymore`, 'success');
        } else {
          await msg.guild.member(msg.author).roles.add(roleToAdd).catch(err => utils.sendResponse(msg, `Failed to add role: ${err}`, 'err'));
          utils.sendResponse(msg, `You now have the \`${roleToAdd.name}\` role`, 'success');
        }
      } else {
        utils.sendResponse(msg, 'That role is not public', 'err');
      }
    } else {
      mainModule.commands['roles'].main(client, msg, hasArgs);
    }
  }
};