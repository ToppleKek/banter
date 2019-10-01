const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');

module.exports = {
  help: 'Manage custom permissions',
  usage: `${CONFIG.prefix}perms <mention, userID, roleID>`,
  unmanageable: true,
  main: async (client, msg, hasArgs) => {
    if (mainModule.locks[msg.guild.id].perms)
      return utils.commandError(msg, 'Lock Error', 'Only one user at a time may be editing this configuration', module.exports.usage);

    if (msg.guild.ownerID !== msg.author.id) {
      mainModule.locks[msg.guild.id].perms = false;
      return utils.commandError(msg, 'Permission Error', 'Only the server owner can execute this command', module.exports.usage);
    }

    if (!hasArgs) {
      mainModule.locks[msg.guild.id].perms = false;
      return utils.commandError(msg, 'Argument Error', 'You must provide a mention, userID or roleID', module.exports.usage);
    }

    mainModule.locks[msg.guild.id].perms = true;

    const permsRaw = await utils.getDBItem(msg.guild, 'perms');
    let perms = JSON.parse(permsRaw);

    if (!perms)
      perms = {};

    let target;
    let targetUser;
    let targetRole;
    let type;

    if (msg.mentions.users.first()) {
      target = msg.mentions.users.first();
      type = 'user';
    } else if (msg.mentions.roles.first()) {
      target = msg.mentions.roles.first();
      type = 'role';
    } else {
      targetRole = await msg.guild.roles.fetch(msg.content.split()[0]).catch(err => {return});

      if (targetRole) {
        target = targetRole;
        type = 'role';
      } else {
        targetUser = await msg.guild.members.fetch(msg.content.split()[0]).catch(err => {return});

        if (targetUser) {
          target = targetUser.user;
          type = 'user';
        }
      }
    }

    if (!target) {
      mainModule.locks[msg.guild.id].perms = false;
      return utils.commandError(msg, 'Argument Error', 'User or role not found', module.exports.usage);
    }

    if (!perms[target.id])
      perms[target.id] = {};

    let i = Object.keys(mainModule.commands).length;
    let pages = module.exports.generatePages(perms, target);

    let embed = { embed: {
      color: 7506394,
      title: `Modify custom permissions for ${type}: ${type == 'user' ? target.tag : target.name} (Page 1/${pages.length})`,
      author: {
        name: `${msg.author.tag}, type '<status> <command>', 'page n' to change pages or 'exit' to exit`,
        iconURL: msg.author.avatarURL() == null ? '' : msg.author.avatarURL()
      },
      timestamp: new Date(),
      description: 'Command is the command, status is one of:\nallow - the target can use this command\ndeny - the target cannot use this command\ndiscord - permissions will be based on the users discord permissions\n**EXAMPLE:** `allow dabon`',
      fields: pages[0]
    }};

    const botMsg = await msg.channel.send(embed);

    const collector = msg.channel.createMessageCollector(m => m, { idle: 60000 });
    const statuses = ['allow', 'deny', 'discord'];
    let page = 1;

    collector.on('collect', async m => {
      if (m.author === msg.author) {
        const args = m.content.split(' ');

        if (m.content.startsWith('page')) {
          if (Number.parseInt(args[1]) > pages.length || Number.parseInt(args[1]) <= 0)
            return;

          page = Number.parseInt(args[1]);

          embed = { embed: {
            color: 7506394,
            title: `Modify custom permissions for ${type}: ${type == 'user' ? target.tag : target.name} (Page ${page}/${pages.length})`,
            author: {
              name: `${msg.author.tag}, type '<status> <command>', 'page n' to change pages or 'exit' to exit`,
              iconURL: msg.author.avatarURL() == null ? '' : msg.author.avatarURL()
            },
            timestamp: new Date(),
            description: 'Command is the command, status is one of:\nallow - the target can use this command\ndeny - the target cannot use this command\ndiscord - permissions will be based on the users discord permissions',
            fields: pages[page - 1]
          }};

          await botMsg.edit(embed);
          await m.delete();
        } else if (mainModule.commands[args[1]] &&
                   !mainModule.commands[args[1]].unmanageable &&
                   statuses.includes(args[0])) {
          perms[target.id][args[1]] = args[0];

          await utils.setDBItem(msg.guild, 'perms', JSON.stringify(perms));
          pages = module.exports.generatePages(perms, target);

          embed = { embed: {
            color: 7506394,
            title: `Modify custom permissions for ${type}: ${type == 'user' ? target.tag : target.name} (Page ${page}/${pages.length})`,
            author: {
              name: `${msg.author.tag}, type '<status> <command>', 'page n' to change pages or 'exit' to exit`,
              iconURL: msg.author.avatarURL() == null ? '' : msg.author.avatarURL()
            },
            timestamp: new Date(),
            description: 'Command is the command, status is one of:\nallow - the target can use this command\ndeny - the target cannot use this command\ndiscord - permissions will be based on the users discord permissions',
            fields: pages[page - 1]
          }};

          await botMsg.edit(embed);
          await m.delete();
        } else if (m.content === 'exit')
        collector.stop('abort');
      }
    });

    collector.on('end', (col, reason) => {
      if (reason === 'abort')
        utils.sendResponse(msg, 'Exited', 'info');
      else if (reason !== 'done')
        utils.sendResponse(msg, 'Perms menu timed out', 'info');

      mainModule.locks[msg.guild.id].perms = false;
    });
  },

  generatePages(perms, target) {
    let fields = [];
    let pages = [];

    for (let command in mainModule.commands) {
      let status;

      if (perms[target.id][command] === undefined)
        status = 'discord';
      else
        status = perms[target.id][command];

      if (mainModule.commands[command].unmanageable)
        status = 'unmanageable';

      fields.push({
        name: CONFIG.prefix + command,
        value: `${CONFIG.emoji[status]} Permission status: **${status.toUpperCase()}**`
      });
    }

    while (fields.length)
      pages.push(fields.splice(0, 10));

    return pages;
  }
};