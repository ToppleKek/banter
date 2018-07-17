const CONFIG = require('../config.json');
const fs = require('fs');
const mainModule = require('../bot.js');

module.exports = {
  setGame(client, game, type) {
    let gameType;
    switch (type) {
      case 'playing':
        gameType = 'PLAYING';
        break;
      case 'watching':
        gameType = 'WATCHING';
        break;
      case 'listening':
        gameType = 'LISTENING';
        break;
      default:
        gameType = 'ERROR';
    }
    client.user.setPresence({
      activity: {
        name: game,
        type: gameType,
      },
    }).catch((error) => {
      console.log(`[ERROR] In setGame: ${error}`);
    });
  },

  sendResponse(msg, message, type) { // will take "err", "info" or "success" for type
    let colour;

    if (type === 'err') colour = 11736341;
    else if (type === 'info') colour = 7506394;
    else if (type === 'success') colour = 1571692;

    msg.channel.send({
      embed: {
        color: colour,
        description: message,
        timestamp: new Date(),
      },
    });
  },

  checkPermission(usr, msg, type) {
    switch (type) {
      case 'admin':
        return msg.guild.member(usr).permissions.has('ADMINISTRATOR');
      case 'server':
        return msg.guild.member(usr).permissions.has('MANAGE_GUILD');
      case 'ban':
        return msg.guild.member(usr).permissions.has('BAN_MEMBERS');
      case 'kick':
        return msg.guild.member(usr).permissions.has('KICK_MEMBERS');
      case 'owner':
        return msg.guild.member(usr).id === CONFIG.ownerid;
      default:
        return false;
    }
  },

  fileExists(path) {
    return new Promise((resolve) => {
      fs.stat(path, (err, stats) => {
        if (err) resolve(false);
        else resolve(true);
      });
    });
  },

  getActionChannel(guildID, type) {
    return new Promise((resolve, reject) => {
      if (!['log', 'modlog', 'starboard'].includes(type)) throw 'Invalid type';
      mainModule.db.get(`SELECT * FROM servers WHERE id = ${guildID}`, (err, row) => {
        if (err) reject(err);
        else if (!row || !row[type]) reject(null);
        else resolve(row[type]);
      });
    });
  },

  writeToModlog(guildID, title, desc, auto, author = 'N/A') {
    module.exports.getActionChannel(guildID, 'modlog').then(modlog => {
      let embedAuthor;
      if (auto) {
        embedAuthor = {
          name: 'Automatic Action',
          iconURL: mainModule.client.user.avatarURL(),
        };
      } else {
        embedAuthor = {
          name: `Responsible moderator: ${author.tag}`,
          iconURL: author.avatarURL(),
        };
      }
      mainModule.client.channels.get(modlog).send({
        embed: {
          color: 34303,
          author: embedAuthor,
          title: title,
          description: desc,
          timestamp: new Date(),
        },
      }).catch(err => {
        console.log(`[ERROR] Failed to write to modlog! ${err}`);
      });
    }).catch(err => {
      console.log(`[WARN] Tried to log to modlog, but no modlog was found! It could be disabled... ${err}`);
    });
  },

  getHighestRolePos(guildID, usr) {
    return mainModule.client.guilds.get(guildID).member(usr).roles.highest.position;
  },

  timedMute(user, guild, secs, auto, author, reason = 'No reason specified') {
    mainModule.db.run(`INSERT INTO muted VALUES(NULL, "${user}", "${guild}")`, err => {
      const guildObj = mainModule.client.guilds.get(guild);
      if (err) return console.log(err);
      else {
        guildObj.member(user).roles.add(guildObj.roles.find(role => role.name === 'Muted'), 'Timed mute')
          .then(member => {
            console.log(`[INFO] Timed mute started for user ${user} on guild ${guild} for ${secs} seconds`);
            if (auto) {
              module.exports.writeToModlog(guild, 'Automatic action', `User ${mainModule.client.users.get(user).tag} MUTED for ${secs} seconds. Reason: \`${reason}\``, true);
            } else {
              module.exports.writeToModlog(guild, `Manual action`, `User ${mainModule.client.users.get(user).tag} MUTED for ${secs} seconds. Reason: \`${reason}\``, false, author);
            }
            setTimeout(() => {
              mainModule.db.run(`DELETE FROM muted WHERE user_id = "${user}" AND guild_id = "${guild}"`);
              if (mainModule.client.guilds.get(guild) && mainModule.client.guilds.get(guild).member(user) && guildObj.member(user).roles.find(role => role.name === 'Muted')) {
                guildObj.member(user).roles.remove(guildObj.roles.find(role => role.name === 'Muted'), 'Timed mute end')
                  .catch(err => {
                    console.log(`[ERROR] Rejected promise in guild ${guild} from timed mute ending: ${err}`);
                  });
                if (auto) {
                  module.exports.writeToModlog(guild, 'Automatic action', `User ${mainModule.client.users.get(user).tag} UNMUTED`, true);
                } else {
                  module.exports.writeToModlog(guild, `Automatic action`, `User ${mainModule.client.users.get(user).tag} UNMUTED`, false, author);
                }
              } else {
                console.log('[WARN] Somethings not right here, user left? Timed mute over');
              }
            }, secs * 1000)
          })
          .catch(err => {
            console.log(`[ERROR] Rejected promise in guild ${guild} from timed mute: ${err}`);
          })
      }
    })
  },

  getMutualGuilds(user) {
    const clientGuilds = mainModule.client.guilds.array();
    const mutualGuilds = [];

    for (let i = 0; i < clientGuilds.length; i += 1) {
      if (clientGuilds[i].member(user)) mutualGuilds.push(clientGuilds[i]);
    }

    return mutualGuilds;
  }
};
