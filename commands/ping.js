const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Pong!',
  usage: `${CONFIG.prefix}ping`,
  main: (client, msg, hasArgs) => {
    const ping = msg.createdAt.getTime() - Date.now();
    utils.sendResponse(msg, `Pong! \`${ping}ms\``, 'success');
  }
};