const mainModule = require('../bot.js');
module.exports = {
  guildCreate: guild => {
    console.log(`[INFO] Added to guild ${guild.name}`);
    mainModule.db.run(`INSERT INTO servers VALUES(NULL, ?, '${guild.id}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`, guild.name, err => {
      if (err) return console.log(err);
    });
  },

  guildDelete: guild => {
    console.log(`[INFO] Removed from guild ${guild.name}`);
    mainModule.db.run(`DELETE FROM servers WHERE id = ${guild.id}`, err => {
      if (err) return console.log(err);
    });
  },
};