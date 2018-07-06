const utils = require('../utils/utils.js');
module.exports = {
  help: 'Pong!',
  main: (client, msg, hasArgs) => {
    const ping = msg.createdAt.getTime() - Date.now();
    utils.sendResponse(msg, `Pong! \`${ping}ms\``, 'success');
  }
};