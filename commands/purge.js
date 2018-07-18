const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Mass delete messages (that are younger than 2 weeks old) in a channel',
  usage: `${CONFIG.prefix}purge 10`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'admin')) {
      if (hasArgs) {
        msg.channel.bulkDelete(Number.parseInt(msg.content, 10))
          .then(messages => utils.writeToModlog(msg.guild.id, 'Manual action', `${messages.size} messages were deleted in #${msg.channel.name}`, false, msg.author))
          .catch(err => utils.sendResponse(msg, `Error deleting messages: ${err}`, 'err'));
      } else {
        utils.sendResponse(msg, `You must provide a number of messages to purge\nUsage: ${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must be an administrator to execute this command', 'err');
    }
  }
};