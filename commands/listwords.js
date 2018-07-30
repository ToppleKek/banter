const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'List the blacklisted words on the server',
  usage: `${CONFIG.prefix}listwords`,
  main: (client, msg, hasArgs) => {
    mainModule.db.get(`SELECT blacklist FROM servers WHERE id = ${msg.guild.id}`, (err, row) => {
      if (err) return utils.sendResponse(msg, `ERR: ${err}`, 'err');
      if (row && row.blacklist) {
        msg.channel.send({embed: {
            title: 'List of blacklisted words on this server',
            description: row.blacklist.split(' ').join('\n'),
            timestamp: new Date(),
            color: 7506394,
          }})
            .then(message => {
              setTimeout(() => {
                message.delete()
                    .catch(e => console.log(`[ERROR] Error deleting listwords message ${e}`));
              }, 30000);
            })
            .catch(e => console.log(`[ERROR] Error sending listwords message ${e}`));
      } else {
        utils.sendResponse(msg, 'This server has no blacklisted words', 'err');
      }
    });
  }
};