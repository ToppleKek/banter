const utils = require('../utils/utils.js');
const configTools = require('../utils/configTools.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Mass delete messages (that are younger than 2 weeks old) in a channel',
  usage: `${CONFIG.prefix}purge 10 cleaning up chat`,
  main: async (client, msg, hasArgs) => {
    const hasMM = await utils.checkPermission(msg.author, msg, 'messages');
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR || hasMM) {
      let conf = await configTools.getConfig(msg.guild)
          .catch(err => console.log(err));
      // if (!conf) conf = CONFIG.defaultConfig;
      // conf = configTools.decodeConfig(conf);
      if (!(conf instanceof Error)) {
        const log = await utils.getActionChannel(msg.guild.id, 'log').catch(err => console.log(`[INFO] Purge check if in log channel failed: ${err}`));
        if (conf.logNoP && msg.channel.id === log) return utils.sendResponse(msg, 'Purging logs has been disabled in your servers configuration', 'err');
        if (hasArgs) {
          const args = msg.content.split(' ');
          let mentionIndex = utils.regexIndexOf(args, /<@!?(1|\d{17,19})>/);
          let num;
          let reason;
          let userTarget;
          if (msg.mentions.users.first() && mentionIndex >= 0) {
            if (!Number.isNaN(Number.parseInt(args[mentionIndex - 1], 10)) && Number.isNaN(Number.parseInt(args[mentionIndex + 1], 10)) || !args[mentionIndex + 1]) {
              num = args[mentionIndex - 1];
            } else if (!Number.isNaN(Number.parseInt(args[mentionIndex + 1], 10)) && Number.isNaN(Number.parseInt(args[mentionIndex - 1], 10)) || !args[mentionIndex - 1]) {
              num = args[mentionIndex + 1];
            } else if (!Number.isNaN(Number.parseInt(args[mentionIndex - 1], 10)) && !Number.isNaN(Number.parseInt(args[mentionIndex + 1], 10))) {
              utils.sendResponse(msg, 'num value before and after the mention is ambiguous', 'info');
              if (args[mentionIndex + 2] && !args[mentionIndex - 2]) {
                num = args[mentionIndex - 1];
              } else if (args[mentionIndex - 2] && !args[mentionIndex + 2]) {
                num = args[mentionIndex + 1];
              } else {
                utils.sendResponse(msg, 'Can\'t autoselect a num value based on surrounding text. Defaulting to first value', 'info');
                num = args[mentionIndex - 1];
              }
            } else return utils.sendResponse(msg, `num must be before or after the user mention\nUsage: ${module.exports.usage}`);


            if (!Number.isNaN(Number.parseInt(num, 10))) args.splice(args.indexOf(num), 1);
            args.splice(utils.regexIndexOf(args, /<@!?(1|\d{17,19})>/), 1);

            reason = args.join(' ');

            userTarget = msg.mentions.users.first();

          } else {
            num = args[0];
            args.shift();
            reason = args.join(' ');
          }

          if (!reason) reason = 'No reason provided';

          if (Number.isNaN(Number.parseInt(num, 10))) return utils.sendResponse(msg, `The number of messages to delete must be a number\nUsage: ${module.exports.usage}`, 'err');
          if (Number.parseInt(num, 10) > (userTarget ? 100 : 2000) || Number.parseInt(num, 10) < 1) return utils.sendResponse(msg, `The number of messages to delete must be between 1 and ${userTarget ? 100 : 2000}\nUsage: ${module.exports.usage}`, 'err');

          let messages = null;

          if (userTarget) {
            let unfiltered = await msg.channel.messages.fetch({limit: Number.parseInt(num, 10)});
            messages = unfiltered.filter(message => message.author.id === userTarget.id);
          }

          msg.channel.bulkDelete(messages ? messages : (Number.parseInt(num, 10) + 1))
              .then(messages => utils.writeToModlog(msg.guild.id, `bulk delete ${num} messages ${userTarget ? `from ${userTarget.tag}` : ''}`, reason, `#${msg.channel.name}`, false, msg.author))
              .catch(err => utils.sendResponse(msg, `Error deleting messages: ${err}`, 'err'));
        } else {
          utils.sendResponse(msg, `You must provide a number of messages to purge\nUsage: ${module.exports.usage}`, 'err');
        }
      } else {
        utils.sendResponse(msg, 'You must have permission to manage messages to execute this command', 'err');
      }
    }
  }
};