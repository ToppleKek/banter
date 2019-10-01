const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');

module.exports = {
  help: 'Unbans ALL users from the server',
  usage: `${CONFIG.prefix}whipall`,
  main: async (client, msg, hasArgs) => {
    if (!await utils.checkPermission(msg.author, msg, 'ban'))
      return utils.commandError(msg, 'Permission Error', 'You must have permission to ban members to execute this command', module.exports.usage);

    const bans = await msg.guild.fetchBans();

    utils.sendResponse(msg, `This will unban ***ALL*** users from **"${msg.guild.name}"**. This will remove the ban on ***${bans.size}*** users. Are you sure you want to do this? (y/N) (20s timeout)`, 'info');
    const collector = msg.channel.createMessageCollector(m => m, { time: 20000 });

    collector.on('collect', async m => {
      if (m.author === msg.author && m.content.toLowerCase() === 'y') {
        utils.sendResponse(msg, `Unbanning ${bans.size} users. This may take some time; please wait...`, 'info');
        collector.stop('start');

        let banArr = bans.array();

        for (let i = 0; i < banArr.length; i++) {
          await msg.guild.members.unban(banArr[i].user);

          if ((i + 1) % 4 === 0)
            await module.exports.timeoutAsync(() => {console.log('RATELIMIT TIMEOUT: over')}, 7000);
        }

        utils.sendResponse(msg, 'Finished unbanning all users', 'success');
      } else if (m.author === msg.author && m.content.toLowerCase() === 'n')
        collector.stop('abort');
    });

    collector.on('end', (col, reason) => {
      if (reason === 'abort')
        utils.sendResponse(msg, 'Aborted.', 'info');
    });
  },

  timeoutAsync: (callback, time) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        callback();
        resolve(true);
      }, time);
    });
  }
};