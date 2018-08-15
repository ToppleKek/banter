const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
const atob = require('atob');
const btoa = require('btoa');
const configTools = require('../utils/configTools.js');
module.exports = {
  help: 'Evaluate JavaScript (Bot owner only)',
  usage: `${CONFIG.prefix}evaljs code`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'owner')) {
      if (hasArgs) {
        const code = msg.content;
        let out;
        try {
          out = eval(code);
          console.log(`[EVAL] ${out}`);
        } catch (error) {
          msg.channel.send({
            embed: {
              color: 11736341,
              author: {
                name: 'Eval Error',
              },
              title: 'An Exception Occurred!',
              fields: [{
                name: 'Error Name:',
                value: error.name,
              },
                {
                  name: 'Error Message:',
                  value: error.message,
                },
              ],
              timestamp: new Date(),
            },
          }); // end send message
          return;
        } // end catch
        msg.channel.send(out).catch(error => msg.channel.send(`Promise rejected, probably an empty message.\n${error.name}\n${error.message}`));
      } else utils.sendResponse(msg, `Argument error. Usage: \`${module.exports.usage}\``, 'err');
    } else utils.sendResponse(msg, 'Only the owner can use this command.', 'err');
  }
};
