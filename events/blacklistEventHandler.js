const mainModule = require('../bot.js');
const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const configTools = require('../utils/configTools.js');
module.exports = {
  message: async (placeholder, message) => {
    if (!message.guild || message.author.bot) return;
    const guild = message.guild;
    const ingoredChannels = await utils.getIgnoredChannels(guild.id, 'blacklist')
                            .catch(err => console.log(`[DEBUG] Failed to get ingoredChannels ${err}`));
    if (ingoredChannels) {
      const arr = ingoredChannels.split(' ');
      if (arr.includes(message.channel.id)) return;
    }
    const isAdmin = await utils.checkPermission(message.author, message, 'admin');
    if (guild.member(message.author) && isAdmin && message.content.startsWith(`${CONFIG.prefix}blacklist`)) return;
    let conf = await configTools.getConfig(guild)
        .catch(err => console.log(err));
    // if (!conf) conf = CONFIG.defaultConfig;
    // conf = configTools.decodeConfig(conf);
    if (!(conf instanceof Error)) {
      console.log(`[DEBUG] Ignoring admins? ${conf.blIgnoreAdmins} Guild: ${guild.name}`);
      if (conf.blIgnoreAdmins && isAdmin) return;
    }
    mainModule.db.get(`SELECT blacklist FROM servers WHERE id = ${guild.id}`, async (err, row) => {
      if (err) return console.log(`[ERROR] blacklistEventHandler: message: ${err}`);
      if (row && row.blacklist) {
        let toCheck;
        let conf = await configTools.getConfig(guild)
            .catch(err => console.log(err));
        // if (!conf) conf = CONFIG.defaultConfig;
        // conf = configTools.decodeConfig(conf);
        if (!(conf instanceof Error)) {
          switch (conf.blLevel) {
            case 0:
              toCheck = message.content;
              break;
            case 1:
              toCheck = message.content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*`_​]/g, '').replace("⁣", '');
              break;
            case 2:
              toCheck = message.content.toLowerCase().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*`_​]/g, '').replace("⁣", '');
              break;
            default:
              toCheck = message.content.toLowerCase().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*`_​]/g, '').replace("⁣", '');
          }
        } else {
          console.log(`[ERROR] conf is instanceof Error: ${conf} Guild: ${guild.name}`);
        }
        const bWords = row.blacklist.toLowerCase().split(' ');
        const infractions = [];
        const wordsFound = [];

        for (let i = 0; i < bWords.length; i += 1) {
          console.log(`[DEBUG] toCheck: ${toCheck}`);
          if (toCheck.includes(bWords[i])) {
            infractions.push(`Word \`${bWords[i]}\` found at index ${toCheck.indexOf(bWords[i])}`);
            wordsFound.push(bWords[i]);
          }
        }

        if (infractions.length > 0) {
          for (let i = 0; i < wordsFound.length; i += 1) {
            toCheck = toCheck.replace(wordsFound[i], `**${wordsFound[i]}**`);
          }

          message.delete({reason: 'Word filter broken'})
              .then(async msg => {
                const member = guild.member(message.author);
                const fields = [];
                let conf = await configTools.getConfig(guild)
                    .catch(err => console.log(err));
                if (!(conf instanceof Error)) {
                  if (conf.blShowInfractions) {
                    fields.push({
                      name: 'Message',
                      value: toCheck.substring(0, 1000),
                    }, {
                      name: 'Infractions',
                      value: infractions.join('\n').substring(0, 1000),
                    });
                  }
                }

                if (member.roles.find(role => role.name === 'Muted')) return;
                
                utils.timedMute(member.user.id, member.guild.id, conf.bmLen * 60, true, mainModule.client.user, 'Word filter infraction', false, true);
                utils.writeToModlog(guild.id, `timed mute for ${conf.bmLen} minutes`, 'word filter broken', member.user.tag, true, mainModule.client.user.tag, 0, fields);
                member.createDM()
                    .then(chan => {
                      chan.send({
                        embed: {
                          color: 1571692,
                          title: `Your message was deleted on ${guild.name} for breaking the word filter`,
                          description: `A ${conf.bmLen} minute mute was applied`,
                          fields: [{
                            name: 'Message',
                            value: toCheck.substring(0, 1000),
                          }, {
                            name: 'Infractions',
                            value: infractions.join('\n').substring(0, 1000),
                          }],
                          timestamp: new Date(),
                        }
                      })
                          .catch(e => console.log(`[ERROR] Failed to send dm to user ${e}`));
                    })
                    .catch(e => console.log(`[ERROR] Failed to create dm with user ${e}`));
              })
              .catch(err => console.log(`[ERROR] Failed to delete message ${err} ${err.stack}`));
        }
      }
    });
  }
};