const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Toggle ignore rules for channels',
  usage: `${CONFIG.prefix}ignore <log|blacklist|starboard|spam|all> #channel`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR) {
      if (!hasArgs) {
        utils.sendResponse(msg, `You must provide something to update and a mention to a channel or a channelID!\nUsage: \`${module.exports.usage}\``, 'err');
        return;
      }
      let selection = msg.content.split(' ')[0];

      let channel;
      if (msg.mentions.channels.first()) channel = msg.mentions.channels.first().id;
      else if (msg.guild.channels.get(msg.content)) channel = msg.content;
      if (!msg.guild.channels.get(channel)) {
        utils.sendResponse(msg, `That channel does not exist on this guild.\nUsage: \`${module.exports.usage}\``, 'err');
        return;
      }
      
      const currentChannelsLog = await utils.getIgnoredChannels(msg.guild.id, 'log')
                              .catch(e => {
                                return;
                              });
      const currentChannelsBlacklist = await utils.getIgnoredChannels(msg.guild.id, 'blacklist')
                              .catch(e => {
                                return;
                              });
      const currentChannelsStarboard = await utils.getIgnoredChannels(msg.guild.id, 'starboard')
                              .catch(e => {
                                return;
                              });

      let rem = false;
      let newChannels;

      switch (selection) {
        case 'log':
          let ccArrLog;
          if (currentChannelsLog) ccArrLog = currentChannelsLog.split(' ');
          else ccArrLog = [];
          rem = false;
          if (ccArrLog.includes(channel)) rem = true;
          if (rem) ccArrLog.splice(ccArrLog.indexOf(channel, 1));
          else ccArrLog.push(channel);
          newChannels = ccArrLog.join(' ');
          mainModule.db.run(`UPDATE servers SET ignored_channels_log = ? WHERE id = ${msg.guild.id}`, newChannels, (err) => {
            if (err) {
              utils.sendResponse(msg, `There was an error updating the channels that the bot will ignore for logging! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            } else {
              utils.sendResponse(msg, `#${msg.guild.channels.get(channel).name} will ${rem ? 'no longer' : 'now'} be ignored by all logging events`, 'success');
              utils.writeToModlog(msg.guild.id, `channel ${rem ? 'no longer' : ''} ignored for logging`, 'N/A', msg.guild.channels.get(channel).name, false, msg.author);
            }
          });
          break;
        case 'blacklist':
          let ccArrBl;
          if (currentChannelsBlacklist) ccArrBl = currentChannelsBlacklist.split(' ');
          else ccArrBl = [];
          rem = false;
          if (ccArrBl.includes(channel)) rem = true;
          if (rem) ccArrBl.splice(ccArrBl.indexOf(channel, 1));
          else ccArrBl.push(channel);
          newChannels = ccArrBl.join(' ');
          mainModule.db.run(`UPDATE servers SET ignored_channels_blacklist = ? WHERE id = ${msg.guild.id}`, newChannels, (err) => {
            if (err) {
              utils.sendResponse(msg, `There was an error updating the channels that the bot will ignore for the blacklist! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            } else {
              utils.sendResponse(msg, `#${msg.guild.channels.get(channel).name} will ${rem ? 'no longer' : 'now'} be ignored by all blacklist events`, 'success');
              utils.writeToModlog(msg.guild.id, `channel ${rem ? 'no longer' : ''} ignored for blacklist events`, 'N/A', msg.guild.channels.get(channel).name, false, msg.author);
            }
          });
          break;
        case 'starboard':
          let ccArrS;
          if (currentChannelsStarboard) ccArrS = currentChannelsStarboard.split(' ');
          else ccArrS = [];
          rem = false;
          if (ccArrS.includes(channel)) rem = true;
          if (rem) ccArrS.splice(ccArrS.indexOf(channel, 1));
          else ccArrS.push(channel);
          newChannels = ccArrS.join(' ');
          mainModule.db.run(`UPDATE servers SET ignored_channels_starboard = ? WHERE id = ${msg.guild.id}`, newChannels, (err) => {
            if (err) {
              utils.sendResponse(msg, `There was an error updating the channels that the bot will ignore for the starboard! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            } else {
              utils.sendResponse(msg, `#${msg.guild.channels.get(channel).name} will ${rem ? 'no longer' : 'now'} be ignored by all starboard events`, 'success');
              utils.writeToModlog(msg.guild.id, `channel ${rem ? 'no longer' : ''} ignored for starboard events`, 'N/A', msg.guild.channels.get(channel).name, false, msg.author);
            }
          });
          break;
        case 'spam':
          let ccArrSpam;
          if (currentChannelsStarboard) ccArrSpam = currentChannelsStarboard.split(' ');
          else ccArrSpam = [];
          rem = false;
          if (ccArrSpam.includes(channel)) rem = true;
          if (rem) ccArrSpam.splice(ccArrSpam.indexOf(channel, 1));
          else ccArrSpam.push(channel);
          newChannels = ccArrSpam.join(' ');
          mainModule.db.run(`UPDATE servers SET ignored_channels_spam = ? WHERE id = ${msg.guild.id}`, newChannels, (err) => {
            if (err) {
              utils.sendResponse(msg, `There was an error updating the channels that the bot will ignore for the anti spam! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            } else {
              utils.sendResponse(msg, `#${msg.guild.channels.get(channel).name} will ${rem ? 'no longer' : 'now'} be ignored by all anti spam events`, 'success');
              utils.writeToModlog(msg.guild.id, `channel ${rem ? 'no longer' : ''} ignored for anti spam events`, 'N/A', msg.guild.channels.get(channel).name, false, msg.author);
            }
          });
          break;
        case 'all':
          let ccArrSA;
          if (currentChannelsStarboard) ccArrSA = currentChannelsStarboard.split(' ');
          else ccArrSA = [];
          rem = false;
          if (ccArrSA.includes(channel)) rem = true;
          if (rem) ccArrSA.splice(ccArrSA.indexOf(channel, 1));
          else ccArrSA.push(channel);
          newChannels = ccArrSA.join(' ');
          mainModule.db.run(`UPDATE servers SET ignored_channels_starboard = ? WHERE id = ${msg.guild.id}`, newChannels, (err) => {
            if (err)  utils.sendResponse(msg, `There was an error updating your starboard! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            else console.log('[DEBUG] Set STAR Ignore in all');
          });

          let ccArrBlA;
          if (currentChannelsBlacklist) ccArrBlA = currentChannelsBlacklist.split(' ');
          else ccArrBlA = [];
          rem = false;
          if (ccArrBlA.includes(channel)) rem = true;
          if (rem) ccArrBlA.splice(ccArrBlA.indexOf(channel, 1));
          else ccArrBlA.push(channel);
          newChannels = ccArrBlA.join(' ');
          mainModule.db.run(`UPDATE servers SET ignored_channels_blacklist = ? WHERE id = ${msg.guild.id}`, newChannels, (err) => {
            if (err) utils.sendResponse(msg, `There was an error updating the channels that the bot will ignore for the blacklist! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            else console.log('[DEBUG] Set BL Ignore in all');
          });

          let ccArr;
          if (currentChannelsLog) ccArr = currentChannelsLog.split(' ');
          else ccArr = [];
          rem = false;
          if (ccArr.includes(channel)) rem = true;
          if (rem) ccArr.splice(ccArr.indexOf(channel, 1));
          else ccArr.push(channel);
          newChannels = ccArr.join(' ');
          mainModule.db.run(`UPDATE servers SET ignored_channels_log = ? WHERE id = ${msg.guild.id}`, newChannels, (err) => {
            if (err) {
              utils.sendResponse(msg, `There was an error updating the channels that the bot will ignore for logging! The database may be configured incorrectly! Error: \`\`\`${err}\`\`\``, 'err');
            } else {
              utils.sendResponse(msg, `All event module rules have been toggled for #${msg.guild.channels.get(channel).name}`, 'success');
              utils.writeToModlog(msg.guild.id, `channel rules toggled for all event modules`, 'N/A', msg.guild.channels.get(channel).name, false, msg.author);
            }
          });
          break;
        default:
          utils.sendResponse(msg, `Invalid type.\nUsage: \`${module.exports.usage}\``, 'err');
      }
    } else {
      utils.sendResponse(msg, 'You must be an administrator to use this command', 'err');
    }
  }
};