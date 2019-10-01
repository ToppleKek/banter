const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');

module.exports = {
  help: 'Whitelist a user or role from certain moderation actions',
  usage: `${CONFIG.prefix}whitelist <mention, userID, roleID>`,
  main: async (client, msg, hasArgs) => {
    if (mainModule.locks[msg.guild.id].whitelist)
      return utils.commandError(msg, 'Lock Error', 'Only one user at a time may be editing this configuration', module.exports.usage);

    if (!await utils.checkPermission(msg.author, msg, 'admin')) {
      mainModule.locks[msg.guild.id].whitelist = false;
      return utils.commandError(msg, 'Permission Error', 'You must be an administrator to execute this command', module.exports.usage);
    }

    if (!hasArgs) {
      mainModule.locks[msg.guild.id].whitelist = false;
      return utils.commandError(msg, 'Argument Error', 'You must provide a mention, userID or roleID', module.exports.usage);
    }

    mainModule.locks[msg.guild.id].whitelist = true;

    const whitelistRaw = await utils.getDBItem(msg.guild, 'whitelist');
    let whitelist = JSON.parse(whitelistRaw);

    if (!whitelist)
      whitelist = {};

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
      mainModule.locks[msg.guild.id].whitelist = false;
      return utils.commandError(msg, 'Argument Error', 'User or role not found', module.exports.usage);
    }

    if (!whitelist[target.id])
      whitelist[target.id] = {};

    const embed = {embed: {
      color: 7506394,
      title: 'Modify Whitelist',
      author: {
        name: `${msg.author.tag}, type a number or 'exit' to exit`,
        iconURL: msg.author.avatarURL() == null ? '' : msg.author.avatarURL()
      },
      timestamp: new Date(),
      description: `Modify whitelist for ${type}: ${type == 'user' ? target.tag : target.name}`,
      fields: [{
        name: 'Log Anti-Deletion',
        value: `**1.** ${whitelist[target.id].logAntiDelete ? 'Deny ' : 'Allow'} log anti-deletion bypass`
      }, {
        name: 'Anti-Spam',
        value: `**2.** ${whitelist[target.id].antiSpam ? 'Deny ' : 'Allow'} anti-spam bypass`
      }, {
        name: 'Anti-Ping-Spam',
        value: `**3.** ${whitelist[target.id].antiPing ? 'Deny ' : 'Allow'} anti-ping-spam bypass`
      }]
    }};

    msg.channel.send(embed);

    const collector = msg.channel.createMessageCollector(m => m, { time: 45000 });

    collector.on('collect', async m => {
      if (m.author === msg.author) {
        switch (m.content) {
          case '1':
            whitelist[target.id].logAntiDelete = !whitelist[target.id].logAntiDelete;
            await utils.setDBItem(msg.guild, 'whitelist', JSON.stringify(whitelist));

            utils.sendResponse(msg, 'Updated whitelist configuration', 'success');

            collector.stop('done');
            break;

          case '2':
            whitelist[target.id].antiSpam = !whitelist[target.id].antiSpam;
            await utils.setDBItem(msg.guild, 'whitelist', JSON.stringify(whitelist));

            utils.sendResponse(msg, 'Updated whitelist configuration', 'success');

            collector.stop('done');
            break;

          case '3':
            whitelist[target.id].antiPing = !whitelist[target.id].antiPing;
            await utils.setDBItem(msg.guild, 'whitelist', JSON.stringify(whitelist));

            utils.sendResponse(msg, 'Updated whitelist configuration', 'success');

            collector.stop('done');
            break;

          case 'exit':
            collector.stop('abort');
        }
      }
    });

    collector.on('end', (col, reason) => {
      if (reason === 'abort')
        utils.sendResponse(msg, 'Aborted.', 'info');
      else if (reason !== 'done')
        utils.sendResponse(msg, 'Whitelist menu timed out', 'info');

      mainModule.locks[msg.guild.id].whitelist = false;
    });
  }
};