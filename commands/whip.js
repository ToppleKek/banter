const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Whip (unban) a user from the server',
  usage: `${CONFIG.prefix}whip userID reason`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    const hasBAN = await utils.checkPermission(msg.author, msg, 'ban');
  	if (hasMR || hasBAN) {
      if (hasArgs) {
        const args = msg.content.split(' ');
        let target;
        if (msg.mentions.users.first()) target = msg.mentions.users.first();
        target = await client.users.fetch(args[0]).catch(err => console.log(`[DEBUG] Failed to fetch user in guild ${msg.guild.name} ERR: ${err}`));
        if (!target) return utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}`, 'err');
        const bans = await msg.guild.fetchBans();
        if (!bans.find(ban => ban.user.id === target.id)) return utils.sendResponse(msg, `That user isn't banned\nUsage: ${module.exports.usage}`, 'err');
        const unban = await msg.guild.members.unban(target.id).catch(err => utils.sendResponse(msg, `There was an error unbanning user ${target.tag} Error: ${err}`, 'err'));
        args.shift();
        reason = args.join(' ');
        utils.writeToModlog(msg.guild.id, `Manual action`, `${msg.author.tag} whipped ${target.tag} for \`${reason ? reason.replace('`', '') : 'No reason specified'}\``, false, msg.author);
        msg.channel.send({
          embed: {
            color: 1571692,
            title: `${target.tag} JUST GOT WHIPPED`,
            description: 'WELCOME BACK KIDDO',
            thumbnail: {
              url: 'https://images-ext-2.discordapp.net/external/hHfWlFdQbHi0JXTdaed_3iGwULt6vXXLohlGFEe56oo/https/cdn.discordapp.com/attachments/242345022719000595/352625339891056640/lmao.gif',
            },
            timestamp: new Date(),
          }
        });
      } else {
        utils.sendResponse(msg, `You must provide a userID to whip\nUsage: ${module.exports.usage}`, 'err');
      }

  	} else {
  		utils.sendResponse(msg, 'You must have permission to ban members to execute this command', 'info');
  	}
  }
};