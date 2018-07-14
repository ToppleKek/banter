module.exports = {
  event: (client, db, member) => {
    db.serialize(() => {
      db.get(`SELECT * FROM muted WHERE guild_id = ${member.guild.id} AND user_id = ${member.id}`, (err, row) => {
        if (err) {
          console.log(`[ERROR] guildmemberAddEventHandler: SQL ERROR: ${err}`);
        } else if (row) {
          member.roles.add(member.guild.roles.find(role => role.name === 'Muted'))
              .catch(e => {
                console.log(`[ERROR] Failed promise in guildMemberAddEventHandler: ${e}`);
              });
        }
      });
    });
  },
};