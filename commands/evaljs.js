const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
const atob = require('atob');
const btoa = require('btoa');
const { exec } = require('child_process');
const configTools = require('../utils/configTools.js');
const util = require('util');

module.exports = {
  help: 'Evaluate JavaScript (Bot owner only)',
  usage: `${CONFIG.prefix}evaljs code`,
  unmanageable: true,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'owner');
    if (hasMR) {
      if (hasArgs) {
        const code = msg.content;
        let out;
        try {
          out = eval(code);

          if (typeof out === 'object' && Promise.resolve(out) === out) {
            out.then((a) => msg.channel.send({
              embed: {
                color: 7506394,
                title: `Promise resolved`,
                description: `Resolve: \`\`\`${util.inspect(a).slice(0, 1000)}\`\`\``
              }
            }), (err) => msg.channel.send({
              embed: {
                color: 11736341,
                title: `Promise rejected`,
                description: `Reject: \`\`\`${util.inspect(err).slice(0, 1000)}\`\`\``
              }
            }));            
          }
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
              }, {
                  name: 'Error Message:',
                  value: error.message,
                },
              ],
              timestamp: new Date(),
            },
          }); // end send message
          return;
        } // end catch
        msg.channel.send({
          embed: {
            color: 7506394,
            title: `Eval Result`,
            description: `Return: \`\`\`${util.inspect(out).slice(0, 1000)}\`\`\``
          }
        }).catch(error => msg.channel.send(`Promise rejected\n${error.name}\n${error.message}`));
      } else utils.sendResponse(msg, `Argument error. Usage: \`${module.exports.usage}\``, 'err');
    } else utils.sendResponse(msg, 'Only the owner can use this command.', 'err');
  }
};
