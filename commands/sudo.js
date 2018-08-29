const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const commandHandler = require('../utils/commandHandler.js');
const mainModule = require('../bot.js');

module.exports = {
  help: 'Execute a command as another user (Bot owner only)',
  usage: `${CONFIG.prefix}sudo @someone naenae(...)`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'owner');
    if (hasMR) {
      if (hasArgs) {
        const args = msg.content.split(' ');
        const regex = new RegExp(/<@!?[0-9]+>/g);
        let target;

        console.log(`Args before splice: ${args.join(' ')}`);

        if (regex.test(args[0]) && client.users.get(args[0].replace(/[<@!>]/g, ''))) {
          target = client.users.get(args[0].replace(/[<@!>]/g, ''));
          args.splice(0, 1);
        } else if (client.users.get(args[0])) {
          target = client.users.get(args[0]);
          args.splice(0, 1);
        }

        else return utils.sendResponse(msg, `Invalid user\nUsage:${module.exports.usage}`, 'err');
        console.log(`Args after splice: ${args.join(' ')}`);

        let newMsg = utils.cloneObj(msg);

        newMsg.author = target;
        newMsg.guild = msg.guild;
        newMsg.mentions.users.delete(newMsg.mentions.users.findKey(user => user === target));

        utils.sendResponse(msg, `Executing ${args[0]} as ${target.tag}...`, 'success');

        if (mainModule.commands[args[0]]) {
          try {
            const newArgs = args.slice(0);
            newArgs.splice(0, 1);
            newMsg.content = newArgs.join(' ');
            mainModule.commands[args[0]].main(client, newMsg, args.length > 1);
          } catch (e) {
            utils.sendResponse(msg, `Executing command failed. Does the command exist? Error: ${e.stack}`, 'err');
          }
        } else {
          utils.sendResponse(msg, 'Executing command failed. Does the command exist?', 'err');
        }
      } else {
        utils.sendResponse(msg, `Missing arguments\nUsage:${module.exports.usage}`, 'err');
      }
    } else {
      utils.sendResponse(msg, 'Only the owner can use this command', 'err');
    }
  }
};