const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');

module.exports = {
  help: 'Unmutes ALL muted users on the server',
  usage: `${CONFIG.prefix}unmuteall`,
  main: async (client, msg, hasArgs) => {
    if (!await utils.checkPermission(msg.author, msg, 'roles'))
      return utils.commandError(msg, 'Permission Error', 'You must have permission to manage roles to execute this command', module.exports.usage);
    
    const members = await msg.guild.members.fetch();
    const mutes = members.filter(member => member.roles.find(role => role.name === 'Muted'));

    utils.sendResponse(msg, `This will unmute ***ALL*** muted users on **"${msg.guild.name}"**. This will unmute ***${mutes.size}*** users. Are you sure you want to do this? (y/N) (20s timeout)`, 'info');
    const collector = msg.channel.createMessageCollector(m => m, { time: 20000 });

    collector.on('collect', async m => {
      if (m.author === msg.author && m.content.toLowerCase() === 'y') {
        utils.sendResponse(msg, `Unmuting ${mutes.size} users. This may take some time; please wait...`, 'info');
        collector.stop('start');

        let muteArr = mutes.array();

        for (let i = 0; i < muteArr.length; i++) {
          muteArr[i].roles.remove(msg.guild.roles.find(role => role.name === 'Muted'));
          mainModule.db.run(`DELETE FROM muted WHERE user_id = ${muteArr[i].id} AND guild_id = ${msg.guild.id}`, (err, row) => console.log(`[DEBUG] Tried to delete ${row}`));

          if ((i + 1) % 4 === 0)
            await module.exports.timeoutAsync(() => {console.log('RATELIMIT TIMEOUT: over')}, 7000);
        }

        utils.sendResponse(msg, 'Finished unmuting all users', 'success');
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