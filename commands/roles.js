const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'List public roles',
  usage: `${CONFIG.prefix}roles`,
  main: async (client, msg, hasArgs) => {
    let selfRoles = await utils.getSelfRoles(msg.guild.id).catch(e => utils.sendResponse(msg, `This server doesn\'t have any public roles`, 'err'));
    if (!selfRoles) return;
    selfRoles = selfRoles.split(' ');
    const modRNames = [];
    const toRemove = [];
    for (let i = 0; i < selfRoles.length; i += 1) {
      if (!msg.guild.roles.get(selfRoles[i])) toRemove.push(selfRoles[i]);
      else modRNames.push(msg.guild.roles.get(selfRoles[i]).name);
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
    if (modRNames.length < 1) utils.sendResponse(msg, `This server doesn\'t have any public roles`, 'err');
    else utils.sendResponse(msg, `**Public roles for ${msg.guild.name}**\n-------------\n${modRNames.join('\n')}`, 'info');
  }
};