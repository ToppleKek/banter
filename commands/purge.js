const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Mass delete messages (that are younger than 2 weeks old) in a channel',
  usage: `${CONFIG.prefix}purge 10 cleaning up chat`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'admin')) {
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
      utils.sendResponse(msg, 'You must be an administrator to execute this command', 'err');
    }
  }
};