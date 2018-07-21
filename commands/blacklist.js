const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'Add/remove a word to the blacklist (toggle)',
  usage: `${CONFIG.prefix}blacklist badword`,
  main: (client, msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'admin')) {
      if (hasArgs) {
        mainModule.db.get(`SELECT blacklist FROM servers WHERE id = ${msg.guild.id}`, (err, row) => {
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
            words = [];
            words.push(word);
          }
          mainModule.db.run(`UPDATE servers SET blacklist = ? WHERE id = ${msg.guild.id}`, words.join(' '), err => {
            if (err) return utils.sendResponse(msg, `SQL_ERROR: ${err}`, 'err');
            utils.sendResponse(msg, `${rem ? 'Removed' : 'Added'} ${msg.content.split(' ')[0]} ${rem ? 'from' : 'to'} the word filter`, 'success');
            utils.writeToModlog(msg.guild.id, 'Manual action', `Word \`${msg.content.split(' ')[0]}\` was ${rem ? 'unblacklisted' : 'blacklisted'} on this server`, false, msg.author);
          });
        });
      } else {
        utils.sendResponse(msg, `You must provide a word to blacklist\nUsage:${module.exports.usage}\nNOTE: Multi-word blacklists should be made as 1 word`, 'err');
      }
    } else utils.sendResponse(msg, 'You msut be an administrator to use this command', 'err');
  }
};