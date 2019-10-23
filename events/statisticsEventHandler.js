const mainModule = require('../bot.js');
const utils = require('../utils/utils.js');
module.exports = {
  guildMemberAdd: async member => {
    const statChans = await utils.getStatChannels(member.guild.id)
                            .catch(e => {
                              return;
                            });

    let json;

    if (statChans)
      json = JSON.parse(statChans);

    if (statChans) {
      if (member.guild) {
        const totalUsers = member.guild.channels.find(channel => channel.id === json.totalUsers);
        const newestUserEdit = member.guild.channels.find(channel => channel.id === json.newestUserEdit);

        if (!totalUsers || !newestUserEdit)
          return;

        await totalUsers.edit({name: `Total Users: ${member.guild.memberCount}`});

        await newestUserEdit.edit({name: `-> ${member.user.username}`.substring(0, 100)});
      }
    }
  },

  guildMemberRemove: async member => {
    const statChans = await utils.getStatChannels(member.guild.id)
                            .catch(e => {
                              return;
                            });

    let json;

    if (statChans)
      json = JSON.parse(statChans);

    if (statChans) {
      if (member.guild) {
        const totalUsers = member.guild.channels.find(channel => channel.id === json.totalUsers);

        if (!totalUsers)
          return;
        
        await totalUsers.edit({name: `Total Users: ${member.guild.memberCount}`});
      }
    }
  },

  dailyUserGain: async guild => {
    const statChans = await utils.getStatChannels(guild.id)
                            .catch(e => {
                              return;
                            });

    let json;

    if (statChans) {
      json = JSON.parse(statChans);

      mainModule.db.get('SELECT today_members FROM servers WHERE id = ?', guild.id, async (err, row) => {
        if (err)
          return;

        // Old name; too lazy to update everyones server with the variable name change
        const totalOnline = guild.channels.find(channel => channel.id === json.totalOnline);
	
        if (!totalOnline)
          return;
        await totalOnline.edit({name: `Gained Users Today: ${Number.parseInt(row.today_members, 10) + 1}`});

        mainModule.db.run('UPDATE servers SET today_members = ? WHERE id = ?', Number.parseInt(row.today_members, 10) + 1, guild.id, err => {
          if (err)
            return console.log(`[ERR] dailyUserGain: ${err}`);
        });
      });
    }
  },

  dailyUserLoss: async guild => {
    const statChans = await utils.getStatChannels(guild.id)
                            .catch(e => {
                              return;
                            });

    let json;

    if (statChans) {
      json = JSON.parse(statChans);

      mainModule.db.get('SELECT today_members FROM servers WHERE id = ?', guild.id, async (err, row) => {
        if (err)
          return;

        // Old name; too lazy to update everyones server with the variable name change
        const totalOnline = guild.channels.find(channel => channel.id === json.totalOnline);
        if (!totalOnline)
          return;
        await totalOnline.edit({name: `Gained Users Today: ${Number.parseInt(row.today_members, 10) - 1}`});

        mainModule.db.run('UPDATE servers SET today_members = ? WHERE id = ?', Number.parseInt(row.today_members, 10) - 1, guild.id, err => {
          if (err)
            return console.log(`[ERR] dailyUserGain: ${err}`);
        });
      });
    }
  },

  resetDailyUsers: async () => {
    const arr = mainModule.client.guilds.array();

    for (let i = 0; i < arr.length; i++) {
      const statChans = await utils.getStatChannels(arr[i].id)
                              .catch(e => {
                                return;
                              });

      let json;

      if (statChans) {
        json = JSON.parse(statChans);

        const totalOnline = arr[i].channels.find(channel => channel.id === json.totalOnline);
        if (!totalOnline)
          return;
        await totalOnline.edit({name: `Gained Users Today: 0`});

        mainModule.db.run('UPDATE servers SET today_members = ? WHERE id = ?', 0, arr[i].id, err => {
          if (err)
            return console.log(`[ERR] resetDailyUsers: ${err}`);
        });
      }
    }
  },

  addNewChannel: async () => {
    const arr = mainModule.client.guilds.array();

    for (let i = 0; i < arr.length; i++) {
      const statChans = await utils.getStatChannels(arr[i].id)
                              .catch(e => {
                                return;
                              });

      let json;

      if (statChans) {
        json = JSON.parse(statChans);
        const newestUser = arr[i].channels.find(channel => channel.id === json.newestUser);
        if (!newestUser)
          return;
        await newestUser.edit({name: `Newest User:`});
      }
    }
  }
};
