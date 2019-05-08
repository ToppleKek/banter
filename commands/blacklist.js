const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'Add/remove a word to the blacklist (toggle)',
  usage: `${CONFIG.prefix}blacklist badword`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR) {
      if (hasArgs) {
        if (!msg.guild.roles.find(role => role.name === 'Muted')) return utils.sendResponse(msg, 'You must make a role named "Muted" for the blacklist to work', 'err');
        mainModule.db.get(`SELECT blacklist FROM servers WHERE id = ${msg.guild.id}`, (err, row) => {
          msg.content = msg.content.toLowerCase();
          if (err) return console.log(`[SQL_ERROR] ${err}`);
          let words;
          let rem = false;
          if (row.blacklist) {
            if (row.blacklist.includes(msg.content.split(' ')[0])) {
              rem = true;
              words = row.blacklist.split(' ');
              const i = words.indexOf(msg.content.split(' ')[0]);
              words.splice(i, 1);
            } else {
              words = row.blacklist.split(' ');
              words.push(msg.content.split(' ')[0]);
            }
          } else {
            let word = msg.content.split(' ')[0];
            words = [word];
          }
          mainModule.db.run(`UPDATE servers SET blacklist = ? WHERE id = ${msg.guild.id}`, words.join(' ').toLowerCase(), err => {
            if (err) return utils.sendResponse(msg, `SQL_ERROR: ${err}`, 'err');
            utils.sendResponse(msg, `${rem ? 'Removed' : 'Added'} ${msg.content.split(' ')[0]} ${rem ? 'from' : 'to'} the word filter`, 'success');
            utils.writeToModlog(msg.guild.id, `Word \`${msg.content.split(' ')[0]}\` was ${rem ? 'unblacklisted' : 'blacklisted'}`, 'N/A', 'server', false, msg.author);
          });
        });
      } else {
        utils.sendResponse(msg, `You must provide a word to blacklist\nUsage:${module.exports.usage}\nNOTE: Multi-word blacklists should be made as 1 word`, 'err');
      }
    } else utils.sendResponse(msg, 'You must be an administrator to use this command', 'err');
  }
};