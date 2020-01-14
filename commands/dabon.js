const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');

module.exports = {
    help: 'dabon (kick) a user from the server',
    usage: `${CONFIG.prefix}dabon @someone reason for kick`,
    main: async (client, msg, hasArgs) => {
        if (!await utils.checkPermission(msg.author, msg, 'kick') && !await utils.checkPermission(msg.author, msg, 'admin'))
          return utils.commandError(msg, 'Permission Error', 'You must have permission to kick members to execute this command', module.exports.usage);

        if (!hasArgs)
          return utils.commandError(msg, 'Argument Error', 'You must provide a mention or userID of the person you want to kick', module.exports.usage);
        
        msg.content = msg.content.replace(/\s+/g, ' ');
        msg.content = msg.content.trim();

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

        if ((await utils.getHighestRolePos(msg.guild.id, target) >= await utils.getHighestRolePos(msg.guild.id, msg.author)) && msg.author.id !== msg.guild.ownerID)
          return utils.commandError(msg, 'Permission Error', `${target.user.tag} has a higher or equal role. You also cannot dabon yourself`, module.exports.usage);

        const chan = await target.createDM().catch(err => utils.sendResponse(msg, 'Warning: Cannot send direct messages to the target user', 'info'));

        if (chan && target.bannable) {
          await chan.send({
            embed: {
              color: 1571692,
              title: `Get heckin dabbed on from ${msg.guild.name}`,
              description: `They kicked you for \`${reason}\``,
              timestamp: new Date(),
            }
          }).catch(err => utils.sendResponse(msg, `Warning: Failed to DM user: ${err}`, 'info'));
        }

        if (!await target.kick({reason: reason}).catch(err => utils.sendResponse(msg, `Could not kick ${target.user.tag}! Error: ${err}`, 'err')))
            return;

        utils.writeToModlog(msg.guild.id, 'dabbed on (kick)', reason, target.user.tag, false, msg.author);
        msg.channel.send({
          embed: {
            color: 1571692,
            title: `${target.user.tag} JUST GOT DABBED ON`,
            description: 'GET FRICKED KIDDO',
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/298938210556575755/467035923289341965/breaddab.gif',
            },
            timestamp: new Date(),
          }
        });
    }
};
