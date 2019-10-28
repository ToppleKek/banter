const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Toggle live server statistics',
  usage: `${CONFIG.prefix}stats`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');

    if (!hasMR)
      return utils.sendResponse(msg, 'You must be an administrator to use this command', 'err');

    const statChans = await utils.getStatChannels(msg.guild.id)
    .catch(console.error);

    let json;
    let enabled;

    if (!statChans) {
      enabled = true;
      json = {};

      const everyoneRole = msg.guild.roles.find(role => role.name === '@everyone').id;
      const parent = await msg.guild.channels.create('Server Statistics', {
        type: 'category',
      });

      const totalUsers = await msg.guild.channels.create(`Total Users: ${msg.guild.memberCount}`,{
        type: 'voice',
        parent,
        permissionOverwrites: [{
          id: everyoneRole,
          deny: ['CONNECT'],
        },],
      });

      const totalOnline = await msg.guild.channels.create(`Gained Users Today: 0`, {
        type: 'voice',
        parent,
        permissionOverwrites: [{
          id: everyoneRole,
          deny: ['CONNECT'],
        },],
      });

      const newestUser = await msg.guild.channels.create(`Newest User:`, {
        type: 'voice',
        parent,
        permissionOverwrites: [{
          id: everyoneRole,
          deny: ['CONNECT'],
        },],
      });

      const newestUserEdit = await msg.guild.channels.create(`-> N/A`, {
        type: 'voice',
        parent,
        permissionOverwrites: [{
          id: everyoneRole,
          deny: ['CONNECT'],
        },],
      });

      json.parent = parent.id;
      json.totalUsers = totalUsers.id;
      json.newestUser = newestUser.id;
      json.totalOnline = totalOnline.id;
      json.newestUserEdit = newestUserEdit.id;

    }
    else {
      enabled = false;
      json = JSON.parse(statChans);

      const parent = await mainModule.client.channels.fetch(json.parent);
      const totalUsers = await mainModule.client.channels.fetch(json.totalUsers);
      const totalOnline = await mainModule.client.channels.fetch(json.totalOnline);
      const newestUser = await mainModule.client.channels.fetch(json.newestUser);
      const newestUserEdit = await mainModule.client.channels.fetch(json.newestUserEdit);

      if (totalUsers)
        totalUsers.delete();

      if (newestUser)
        newestUser.delete();

      if (totalOnline)
        totalOnline.delete();

      if (newestUserEdit)
        newestUserEdit.delete();

      if (parent)
        parent.delete();
    }

    mainModule.db.run('UPDATE servers SET stat_chans = ? WHERE id = ?', enabled ? JSON.stringify(json) : null, msg.guild.id, err => {
      if (err)
        return utils.sendResponse(msg, `Failed to update your servers configuration: SQL_ERROR: ${err}`, 'err');

      return utils.sendResponse(msg, `Server stat channels have been ${enabled ? 'enabled' : 'disabled'} for this server`, 'success');
    });
  }
};