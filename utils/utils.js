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

  writeToModlog(guildID, title, desc, auto, author = 'N/A', extraFields = []) {
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
          fields: extraFields,
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

  timedMute(userID, guildID, secs, auto, author, reason = 'No reason specified', writeToMLFirst = true, writeToMLSecond = true) {
    mainModule.db.run(`INSERT INTO muted VALUES(NULL, "${userID}", "${guildID}")`, err => {
      const guildObj = mainModule.client.guilds.get(guildID);
      if (err) return console.log(err);
      else {
        guildObj.member(userID).roles.add(guildObj.roles.find(role => role.name === 'Muted'), 'Timed mute')
          .then(member => {
            console.log(`[INFO] Timed mute started for user ${userID} on guild ${guildID} for ${secs} seconds`);
            if (writeToMLFirst) {
              if (auto) {
                module.exports.writeToModlog(guildID, 'Automatic action', `User ${mainModule.client.users.get(userID).tag} MUTED for ${secs} seconds. Reason: \`${reason}\``, true);
              } else {
                module.exports.writeToModlog(guildID, `Manual action`, `User ${mainModule.client.users.get(userID).tag} MUTED for ${secs} seconds. Reason: \`${reason}\``, false, author);
              }
            }
            setTimeout(() => {
              mainModule.db.run(`DELETE FROM muted WHERE user_id = "${userID}" AND guild_id = "${guildID}"`);
              if (mainModule.client.guilds.get(guildID) && mainModule.client.guilds.get(guildID).member(userID) && guildObj.member(userID).roles.find(role => role.name === 'Muted')) {
                guildObj.member(userID).roles.remove(guildObj.roles.find(role => role.name === 'Muted'), 'Timed mute end')
                  .catch(err => {
                    console.log(`[ERROR] Rejected promise in guild ${guildID} from timed mute ending: ${err}`);
                  });
                if (writeToMLSecond) {
                  if (auto) {
                    module.exports.writeToModlog(guildID, 'Automatic action', `User ${mainModule.client.users.get(userID).tag} UNMUTED`, true);
                  } else {
                    module.exports.writeToModlog(guildID, `Automatic action`, `User ${mainModule.client.users.get(userID).tag} UNMUTED`, false, author);
                  }
                }
              } else {
                console.log('[WARN] Somethings not right here, user left? Timed mute over');
              }
            }, secs * 1000)
          })
          .catch(err => {
            console.log(`[ERROR] Rejected promise in guild ${guildID} from timed mute: ${err}`);
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
  },

  regexIndexOf(arr, regex) {
    for (let i = 0; i < arr.length; i += 1) {
      if (arr[i].toString().match(regex)) return i;
    }
    return -1;
  },


  secondsToHms(d) {
    d = Number.parseInt(d, 10);

    const h = Math.floor(d / 3600),
          m = Math.floor(d % 3600 / 60),
          s = Math.floor(d % 3600 % 60);

    return `${h}:${(`0${m}`).slice(-2)}:${(`0${s}`).slice(-2)}`;
  },

  getContentType(url) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', url, true);
      xhr.onreadystatechange = function () {
        if (this.readyState === this.DONE) {
          console.log(`[DEBUG] Status of XMLHTTPREQUEST: ${this.status}`);
          console.log(`[DEBUG] Content type: ${this.getResponseHeader('Content-Type')}`);
          resolve(this.getResponseHeader('Content-Type'));
        }
      };
      xhr.send();
    });
  },

  cloneObj(obj) {
    let target = {};
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        target[prop] = obj[prop];
      }
    }
    return target;
  },
};
