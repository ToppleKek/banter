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
      if (!conf) conf = CONFIG.defaultConfig;
      conf = configTools.decodeConfig(conf);
      if (configTools.validateConfig(conf)) {
        const log = await utils.getActionChannel(msg.guild.id, 'log').catch(err => console.log(`[INFO] Purge check if in log channel failed: ${err}`));
        if (conf.logNoP && msg.channel.id === log) return utils.sendResponse(msg, 'Purging logs has been disabled in your servers configuration', 'err');
        if (hasArgs) {
          const args = msg.content.split(' ');
          const num = args[0];
          args.shift();
          let reason = args.join(' ');

          if (!reason) reason = 'No reason provided';

          if (Number.isNaN(Number.parseInt(num, 10))) return utils.sendResponse(msg, `The number of messages to delete must be a number\nUsage: ${module.exports.usage}`, 'err');
          if (Number.parseInt(num, 10) > 2000 || Number.parseInt(num, 10) < 1) return utils.sendResponse(msg, `The number of messages to delete must be between 1 and 2000\nUsage: ${module.exports.usage}`, 'err');

          msg.channel.bulkDelete(Number.parseInt(num, 10) + 1)
              .then(messages => utils.writeToModlog(msg.guild.id, 'Manual action', `${messages.size - 1} messages were deleted in #${msg.channel.name} Reason: ${reason}`, false, msg.author))
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