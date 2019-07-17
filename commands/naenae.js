const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');

module.exports = {
    help: 'naenae (ban) a user from the server',
    usage: `${CONFIG.prefix}naenae @someone reason for ban`,
    main: async (client, msg, hasArgs) => {
        if (!await utils.checkPermission(msg.author, msg, 'ban') || !await utils.checkPermission(msg.author, msg, 'admin'))
          return utils.commandError(msg, 'Permission Error', 'You must have permission to ban members to execute this command', module.exports.usage);

        if (!hasArgs)
          return utils.commandError(msg, 'Argument Error', 'You must provide a mention or userID of the person you want to ban', module.exports.usage);
        
        msg.content = msg.content.replace(/\s+/g, ' ');

        const args = msg.content.split(' ');
        const userArg = args[0];
        let reason = 'No reason provided';
        let target;

        if (args[1]) {
          args.shift();
          reason = args.join(' ');
        }

        if (msg.mentions.users.first() && !await msg.guild.members.fetch(msg.mentions.users.first()).catch(err => {return}))
          return utils.commandError(msg, 'Argument Error', 'The user specified does not exist in the guild (Guild.member returned null)', module.exports.usage);
        else if (msg.mentions.users.first() && await msg.guild.members.fetch(msg.mentions.users.first()).catch(err => utils.commandError(msg, 'Internal Error', `Failed to get guild member object for target: ${err}`)))
          target = await msg.guild.members.fetch(msg.mentions.users.first()).catch(err => {return});

        if (!target) {
          target = await client.users.fetch(userArg).catch(err => 
            utils.commandError(msg, 'Argument Error', `"${userArg}" is not a valid user (err: ${err})`, module.exports.usage));

          if (!target)
            return;
          else if (!await msg.guild.members.fetch(target).catch(err => {return}))
            return utils.commandError(msg, 'Argument Error', 'The user specified does not exist in the guild (Guild.member returned null)', module.exports.usage);

          target = await msg.guild.members.fetch(target);
        }

        if ((utils.getHighestRolePos(msg.guild.id, target) >= utils.getHighestRolePos(msg.guild.id, msg.author)) && msg.author.id !== msg.guild.ownerID)
          return utils.commandError(msg, 'Permission Error', `${target.user.tag} has a higher or equal role. You also cannot naenae yourself`, module.exports.usage);

        const chan = await target.createDM().catch(err => utils.sendResponse(msg, 'Warning: Cannot send direct messages to the target user', 'info'));

        if (chan && target.bannable) {
          await chan.send({
            embed: {
              color: 1571692,
              title: `Get heckin naenaed from ${msg.guild.name}`,
              description: `They banned you for \`${reason}\``,
              timestamp: new Date(),
            }
          }).catch(err => utils.sendResponse(msg, `Warning: Failed to DM user: ${err}`, 'info'));
        }

        if (!await target.ban({days: 0, reason: reason}).catch(err => utils.sendResponse(msg, `Could not ban ${target.user.tag}! Error: ${err}`, 'err')))
            return;

        utils.writeToModlog(msg.guild.id, 'naenaed (ban)', reason, target.user.tag, false, msg.author);
        msg.channel.send({
          embed: {
            color: 1571692,
            title: `${target.user.tag} JUST GOT NAENAED`,
            description: 'GET FRICKED KIDDO',
            thumbnail: {
              url: 'https://images-ext-2.discordapp.net/external/hHfWlFdQbHi0JXTdaed_3iGwULt6vXXLohlGFEe56oo/https/cdn.discordapp.com/attachments/242345022719000595/352625339891056640/lmao.gif',
            },
            timestamp: new Date(),
          }
        });
    }
};
