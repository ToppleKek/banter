const { exec } = require('child_process');
const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Execute shell commands (Bot owner only)',
  usage: `${CONFIG.prefix}exec df -h`,
  unmanageable: true,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'owner');
    if (!hasMR) {
      utils.sendResponse(msg, 'Only the owner can use this command', 'err');
      return;
    }
    if (!hasArgs) utils.sendResponse(msg, 'You must provide a command to execute', 'err');
    else {
      exec(msg.content, (err, stdout, stderr) => {
        if (err) utils.sendResponse(msg, `ERROR: ${err}`, 'err');
        else {
          let error;
          let out;

          if (!stderr) error = 'N/A';
          else error = stderr;

          if (!stdout) out = 'N/A';
          else out = stdout;

          const embed = {
            title: `Results of ${msg.content}`,
            fields: [{
              name: 'stdout',
              value: out,
            }, {
                name: 'stderr',
                value: error,
              }],
            color: 7506394,
          };
          msg.channel.send({ embed }).catch((e) => utils.sendResponse(msg, `Failed to send message: ${e}`, 'err'));
        }
      });
    }
  }
};