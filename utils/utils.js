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
      case 'admin':  return msg.guild.member(usr).permissions.has('ADMINISTRATOR');
      case 'server': return msg.guild.member(usr).permissions.has('MANAGE_GUILD');
      case 'ban':    return msg.guild.member(usr).permissions.has('BAN_MEMBERS');
      case 'kick':   return msg.guild.member(usr).permissions.has('KICK_MEMBERS');
      case 'owner':  return msg.guild.member(usr).id === CONFIG.ownerid;
      default:       return false;
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
        else if (!row[type]) reject(null);
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
  }
};
