const mainModule = require('../bot.js');
const utils = require('../utils/utils.js');

module.exports = {
  guildCreate: guild => {
    utils.info(`Added to guild ${guild.name}`);
    mainModule.db.run(`INSERT INTO servers VALUES(NULL, ?, '${guild.id}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL)`, guild.name, err => {
      if (err) return console.log(err);
    });
  },

  guildDelete: guild => {
    utils.info(`Removed from guild ${guild.name}`);
  },
};