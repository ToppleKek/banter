const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Add/remove a role from a user (toggle)',
  usage: `${CONFIG.prefix}role @someone role name`,
  main: async (client, msg, hasArgs) => {
    const hasR = await utils.checkPermission(msg.author, msg, 'roles');
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR || hasR) {
      if (hasArgs) {
        const args = msg.content.split(' ');
        const userArg = args[0];
        let target;

        if (msg.mentions.users.first())
          target = await msg.guild.members.fetch(msg.mentions.users.first()).catch(err => {return});

        else if (await client.users.fetch(userArg).catch(err => {return}))
          target = await msg.guild.members.fetch(await client.users.fetch(userArg).catch(err => {return})).catch(err => {return});
        else return utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}`, 'err');

        args.shift();
        const roleName = args.join(' ');

        if (!msg.guild.roles.find(role => role.name === roleName)) return utils.sendResponse(msg, `Role not found: ${roleName}`, 'err');

        const authorMember = await msg.guild.members.fetch(msg.author).catch(err => {return});

        if ((msg.guild.roles.find(role => role.name === roleName).position >= authorMember.roles.highest.position) && msg.author.id !== msg.guild.ownerID) return utils.sendResponse(msg, 'That role is higher or equal to your highest role', 'err');

        if (target.roles.find(role => role.name === roleName)) {
          target.roles.remove(msg.guild.roles.find(role => role.name === roleName))
            .then(member => {
              utils.sendResponse(msg, `Removed ${roleName} from ${member.user.tag}`, 'success');
              utils.writeToModlog(msg.guild.id, `remove role ${roleName}`, 'N/A', member.user.tag, false, msg.author);
            })
            .catch(err => utils.sendResponse(msg, `Error removing role from user: ${err}`, 'err'));
        } else {
          target.roles.add(msg.guild.roles.find(role => role.name === roleName))
            .then(member => {
              utils.sendResponse(msg, `Added ${roleName} to ${member.user.tag}`, 'success');
              utils.writeToModlog(msg.guild.id, `add role ${roleName}`, 'N/A', member.user.tag, false, msg.author);
            })
            .catch(err => utils.sendResponse(msg, `Error adding role to user: ${err}`, 'err'));
        }
      } else {
        utils.sendResponse(msg, `You must provide a mention or userID and a role to toggle\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must have permission to manage roles to use this command', 'err');
    }
  }
};
