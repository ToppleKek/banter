const CONFIG = require('../config.json');
const fs = require('fs');
const mainModule = require('../bot.js');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const configTools = require('./configTools.js');

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

  logError(reason, p) {
    mainModule.client.channels.get(CONFIG.errorChan).send({embed: {
      color: 11736341,
      description: 'Unhandled Promise Rejection',
      fields: [{
        name: 'AT:',
        value: `\`${p} :: See console for more details\``
      }, {
        name: 'REASON:',
        value: `\`\`\`${reason}\`\`\``,
      }],
      timestamp: new Date()
    }});
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

  getModRoles(guild_id) {
    return new Promise((resolve, reject) => {
      mainModule.db.get(`SELECT modroles FROM servers WHERE id = ${guild_id}`, (err, row) => {
        if (err) reject(err);
        else if (!row || !row.modroles) reject(null);
        else resolve(row.modroles);
      });
    }); 
  },

  getSelfRoles(guild_id) {
    return new Promise((resolve, reject) => {
      mainModule.db.get(`SELECT selfroles FROM servers WHERE id = ${guild_id}`, (err, row) => {
        if (err) reject(err);
        else if (!row || !row.selfroles) reject(null);
        else resolve(row.selfroles);
      });
    }); 
  },

  getAntiSpamEnabled(guild_id) {
    return new Promise((resolve, reject) => {
      mainModule.db.get(`SELECT spam_filter_enabled FROM servers WHERE id = ${guild_id}`, (err, row) => {
        if (err) reject(err);
        else if (!row || !row.spam_filter_enabled) resolve(0);
        else resolve(row.spam_filter_enabled);
      });
    }); 
  },

  async checkPermission(usr, msg, type, realAdmin = false) {
    switch (type) {
      case 'admin':
        let modRoles = await module.exports.getModRoles(msg.guild.id).catch(e => console.log(`[DEBUG] Catch get modroles, this guild probably has none GUILD: ${msg.guild.name}  ERROR: ${e}`));
        if (modRoles) modRoles = modRoles.split(' ');
        else return msg.guild.member(usr).permissions.has('ADMINISTRATOR');
        if (realAdmin) return msg.guild.member(usr).permissions.has('ADMINISTRATOR');
        for (let i = 0; i < modRoles.length; i += 1) {
          if (msg.guild.member(usr).roles.get(modRoles[i])) return true;
        }
        return msg.guild.member(usr).permissions.has('ADMINISTRATOR');
      case 'server':
        return msg.guild.member(usr).permissions.has('MANAGE_GUILD');
      case 'ban':
        return msg.guild.member(usr).permissions.has('BAN_MEMBERS');
      case 'kick':
        return msg.guild.member(usr).permissions.has('KICK_MEMBERS');
      case 'roles':
        return msg.guild.member(usr).permissions.has('MANAGE_ROLES');
      case 'messages':
        return msg.guild.member(usr).permissions.has('MANAGE_MESSAGES');
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
      if (!['log', 'modlog', 'starboard'].includes(type)) reject('Invalid type');
      mainModule.db.get(`SELECT * FROM servers WHERE id = ${guildID}`, (err, row) => {
        if (err) reject(err);
        else if (!row || !row[type]) reject(null);
        else if (!mainModule.client.channels.get(row[type])) reject('Channel no longer exists!');
        else resolve(row[type]);
      });
    });
  },

  writeToModlog(guildID, action, reason, target, auto, author = 'N/A', warnings = 0, extraFields = []) {
    module.exports.getActionChannel(guildID, 'modlog').then(modlog => {
      let embedAuthor;
      if (auto) {
        embedAuthor = {
          name: 'Moderator action taken',
          iconURL: mainModule.client.user.avatarURL(),
        };
      } else {
        embedAuthor = {
          name: 'Moderator action taken',
          iconURL: author.avatarURL(),
        };
      }

      const fields = [{
        name: `${auto ? 'Automatic' : ''} Action`,
        value: action,
        inline: true,
      }, {
        name: 'Responsible Moderator',
        value: auto ? `${mainModule.client.user.tag}` : author.tag,
        inline: true,
      }, {
        name: 'Target',
        value: target,
        inline: true,
      }, {
        name: 'Warnings Issued',
        value: warnings,
        inline: true,
      }];

      fields.push(...extraFields);

      mainModule.client.channels.get(modlog).send({
        embed: {
          color: 34303,
          author: embedAuthor,
          description: reason,
          fields: fields,
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
                module.exports.writeToModlog(guildID, `timed mute for ${secs / 60} minutes`, reason, mainModule.client.users.get(userID).tag, true);
              } else {
                module.exports.writeToModlog(guildID, `timed mute for ${secs / 60} minutes`, reason, mainModule.client.users.get(userID).tag, false, author);
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
                    module.exports.writeToModlog(guildID, `timed mute end`, 'time is up', mainModule.client.users.get(userID).tag, true);
                  } else {
                    module.exports.writeToModlog(guildID, `timed mute end`, 'time is up', mainModule.client.users.get(userID).tag, false, author);
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

  permaMute(userID, guildID, auto, author, reason = 'No reason specified', writeToML = true) {
    mainModule.db.run(`INSERT INTO muted VALUES(NULL, "${userID}", "${guildID}")`, err => {
      const guildObj = mainModule.client.guilds.get(guildID);
      if (err) return console.log(err);
      else {
        guildObj.member(userID).roles.add(guildObj.roles.find(role => role.name === 'Muted'), 'Permanent mute from bot')
          .then(member => {
            console.log(`[INFO] Muted user ${userID} on guild ${guildID}`);
            if (writeToML) {
              if (auto) {
                module.exports.writeToModlog(guildID, 'mute', reason, mainModule.client.users.get(userID).tag, true);
              } else {
                module.exports.writeToModlog(guildID, `mute`, reason, mainModule.client.users.get(userID).tag, false, author);
              }
            }
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

  getIgnoredChannels(guild_id, type = 'log') {
    return new Promise((resolve, reject) => {
      if (!['log', 'blacklist', 'starboard', 'spam'].includes(type)) reject('Invalid type');
      mainModule.db.get(`SELECT ignored_channels_${type} FROM servers WHERE id = ?`, guild_id, (err, row) => {
        if (err) reject(err);
        else if (!row || !row[`ignored_channels_${type}`]) reject(null);
        else resolve(row[`ignored_channels_${type}`]);
      });    
    });
  },

  issueWarning(user_id, guild_id, warning) {
    return new Promise(async (resolve, reject) => {
      const conf = await configTools.getConfig(mainModule.client.guilds.get(guild_id)).catch(err => console.log(err));
      mainModule.db.run('INSERT INTO warnings VALUES(NULL, ?, ?, ?)', user_id, guild_id, JSON.stringify(warning), async e => {
        if (e) reject(e);
        const usr = await mainModule.client.users.fetch(user_id);
        const guild = mainModule.client.guilds.get(guild_id);
        const issuer = await mainModule.client.users.fetch(warning.issuer);
        module.exports.writeToModlog(guild_id, 'warn', warning.message, usr.tag, false, issuer, 1);
        mainModule.db.all('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?', guild_id, user_id, async (err, rows) => {
          if (err) reject(err);
          else if (!rows) reject(new Error('warnings:noRowsAfterInsert'));

          if (!(conf instanceof Error)) {
            if (rows.length >= conf.wLim) {
              const humanWarnings = [];
              const dmChan = await usr.createDM();
              for (let i = 0; i < rows.length; i += 1) {
                const warningObj = JSON.parse(rows[i].warning);
                humanWarnings.push(`${i} - ${issuer.tag}: ${warningObj.message}`);
              }
              switch (conf.punish) {
                case 0:
                  dmChan.send({
                    embed: {
                      color: 1571692,
                      title: `Watch your step on ${guild.name}`,
                      description: `You have been warned too many times! However, this server has set no punishment for exceeding the warning limit...`,
                      fields: [{
                        name: 'Warnings',
                        value: humanWarnings.join('\n').substring(0, 1000),
                      }],
                      timestamp: new Date(),
                  }}).catch(err => console.log(`[ERROR] failed to dm user: ${err}`));
                  mainModule.db.run('DELETE FROM warnings WHERE user_id = ? AND guild_id = ?', user_id, guild_id, err => {
                    if (err) reject(err);
                    else console.log(`[INFO] Deleted rows because someone was punished for warnings user_id: ${user_id}`);
                  });
                  resolve(true);
                  break;
                case 1:
                  module.exports.timedMute(user_id, guild_id, conf.wmLen * 60, true, mainModule.client.user, 'Warning limit punishment', true, true);
                  dmChan.send({
                    embed: {
                      color: 1571692,
                      title: `You have been muted on ${guild.name}`,
                      description: `You have been warned too many times! Muted for ${conf.wmLen} minutes`,
                      fields: [{
                        name: 'Warnings',
                        value: humanWarnings.join('\n').substring(0, 1000),
                      }],
                      timestamp: new Date(),
                  }}).catch(err => console.log(`[ERROR] failed to dm user: ${err}`));
                  mainModule.db.run('DELETE FROM warnings WHERE user_id = ? AND guild_id = ?', user_id, guild_id, err => {
                    if (err) reject(err);
                    else console.log(`[INFO] Deleted rows because someone was punished for warnings user_id: ${user_id}`);
                  });
                  resolve(true);
                  break;
                case 2:
                  await dmChan.send({
                    embed: {
                      color: 1571692,
                      title: `You have been kicked from ${guild.name}`,
                      description: `You have been warned too many times! You have been kicked`,
                      fields: [{
                        name: 'Warnings',
                        value: humanWarnings.join('\n').substring(0, 1000),
                      }],
                      timestamp: new Date(),
                  }}).catch(err => console.log(`[ERROR] failed to dm user: ${err}`));
                  module.exports.writeToModlog(guild_id, 'kick', 'user exceeded warning limit', usr.tag, true, mainModule.client.user);
                  await guild.member(usr).kick( {reason: 'user exceeded warning limit'} ).catch(err => console.log(`[ERROR] Failed to kick user: ${err}`));
                  mainModule.db.run('DELETE FROM warnings WHERE user_id = ? AND guild_id = ?', user_id, guild_id, err => {
                    if (err) reject(err);
                    else console.log(`[INFO] Deleted rows because someone was punished for warnings user_id: ${user_id}`);
                  });
                  resolve(true);
                  break;
              case 3:
                await dmChan.send({
                  embed: {
                    color: 1571692,
                    title: `You have been banned from ${guild.name}`,
                    description: `You have been warned too many times! You have been banned`,
                    fields: [{
                      name: 'Warnings',
                      value: humanWarnings.join('\n').substring(0, 1000),
                    }],
                    timestamp: new Date(),
                }}).catch(err => console.log(`[ERROR] failed to dm user: ${err}`));
                module.exports.writeToModlog(guild_id, 'ban', 'user exceeded warning limit', usr.tag, true, mainModule.client.user);
                await guild.member(usr).ban( {days: 0, reason: 'user exceeded warning limit'} ).catch(err => console.log(`[ERROR] Failed to ban user: ${err}`));
                mainModule.db.run('DELETE FROM warnings WHERE user_id = ? AND guild_id = ?', user_id, guild_id, err => {
                  if (err) reject(err);
                  else console.log(`[INFO] Deleted rows because someone was punished for warnings user_id: ${user_id}`);
                });
                resolve(true);
                break;
              }
            } else resolve(false);
          }
        });  
      });
    });
  }
};
