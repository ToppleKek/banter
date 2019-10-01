const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');

module.exports = {
  help: 'List all muted users on the server',
  usage: `${CONFIG.prefix}muted`,
  main: async (client, msg, hasArgs) => {
    const members = await msg.guild.members.fetch();
    const muted = members.filter(member => member.roles.find(role => role.name === 'Muted'));

    utils.sendResponse(msg, `**There are __${muted.size}__ users muted on this server\n${muted.size > 50 ? `${muted.array().splice(0, 50).join('\n')}\n***And ${muted.size - 50} more...` : muted.array().join('\n')}***`, 'info');
  }
};