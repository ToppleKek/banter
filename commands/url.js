const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');

module.exports = {
  help: 'Set your server\'s vanity URL',
  usage: `${CONFIG.prefix}url vanity_url invite_code [(${CONFIG.prefix}url disable) to disable]`,
  main: async (client, msg, hasArgs) => {
    if (!await utils.checkPermission(msg.author, msg, 'admin') && hasArgs)
      return utils.commandError(msg, 'Permission Error', 'You must be an administrator to modify the vanity URL', module.exports.usage);

    if (!hasArgs) {
      const url = await utils.getVanityURL(msg.guild);
      const c = await utils.getVanityURLCode(msg.guild);

      return utils.sendResponse(msg, `This server's vanity URL is: ${url === null ? 'not set' : `${CONFIG.rootDomain}/${url} and points to: ${c === 'auto' ? '(auto generated invite)' : `https://discord.gg/${c}`}`}`, 'info');
    }

    msg.content = msg.content.replace(/\s+/g, ' ');
    msg.content = msg.content.trim();

    const args = msg.content.split(' ');

    if (args[0] === 'disable') {
      if (!await utils.getVanityURL(msg.guild))
        return utils.sendResponse(msg, 'Your server does not have a vanity URL enabled', 'err');

      await utils.deleteVanityURL(msg.guild);
      return utils.sendResponse(msg, 'Your server\'s vanity URL has been disabled', 'success');
    }

    if (!args[1]) {
      return utils.commandError(msg, 'Argument Error', 'You must provide a valid invite code (or "disable" as first arg, or "auto" as second arg)', module.exports.usage);
    }

    const invites = await msg.guild.fetchInvites();

    if (!invites.find(inv => inv.code === args[1]) && args[1] != 'auto')
      return utils.commandError(msg, 'Argument Error', `Invalid invite: ${args[1]}`, module.exports.usage);

    const url = await utils.changeVanityURL(msg.guild, args[0], args[1]);

    utils.sendResponse(msg, url === null ? 'This URL may already be in use. Please try another' : `Your server's vanity URL was set to: ${url}`, url === null ? 'err' : 'success');
  }
};