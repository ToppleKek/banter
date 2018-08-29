const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Pong!',
  usage: `${CONFIG.prefix}ping`,
  main: async (client, msg, hasArgs) => {
    const ping = Date.now() - msg.createdAt.getTime();
    utils.sendResponse(msg, `Pong!\nMessages: \`${ping}ms\`\nClient: \`${Math.floor(client.ping)}ms\``, 'success');
  }
};