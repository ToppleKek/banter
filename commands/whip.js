const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Whip (unban) a user from the server',
  usage: `${CONFIG.prefix}whip userID`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.testCheckPermission(msg.author, msg);
  	if (hasMR) {
  		utils.sendResponse(msg, 'Has modrole', 'info');
  	} else {
  		utils.sendResponse(msg, 'Doesnt have modrole', 'info');
  	}
  }
};