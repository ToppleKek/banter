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
    if (type === 'admin') return msg.guild.member(usr).permissions.has('ADMINISTRATOR');
    else if (type === 'server') return msg.guild.member(usr).permissions.has('MANAGE_GUILD');
    else if (type === 'voice') {
      return !!(msg.guild.member(usr).voiceChannel && msg.guild.member(usr).voiceChannel.id === msg.guild.voiceConnection.channel.id);
    } else if (type === 'owner') {
      return usr.id === CONFIG.ownerid;
    }
    return false;
  },

  fileExists(path) {
    return new Promise((resolve) => {
      fs.stat(path, (err, stats) => {
        if (err) resolve(false);
        else resolve(true);
      });
    });
  },

  findModlog(guildID) {
    return new Promise((resolve, reject) => {
      mainModule.db.get(`SELECT * FROM servers WHERE id = ${guildID}`, (err, row) => {
        if (err) reject(err);
        else resolve(row.modlog);
      });
    });
  },

  writeToModlog(guildID, author, message, auto) {
    s
  },
};
