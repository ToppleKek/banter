const mainModule = require('../bot.js');
const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const configTools = require('../utils/configTools.js');
module.exports = {
  message: async (placeholder, message) => {
    if (!message.guild || message.author.bot) return;
    if (message.guild.member(message.author) && utils.checkPermission(message.author, message, 'admin') && message.content.startsWith(`${CONFIG.prefix}blacklist`)) return;
    let conf = await configTools.getConfig(message.guild)
        .catch(err => console.log(err));
    if (!conf) conf = CONFIG.defaultConfig;
    conf = configTools.decodeConfig(conf);
    if (configTools.validateConfig(conf)) {
      console.log(`[DEBUG] Ignoring admins? ${conf.blIgnoreAdmins} Guild: ${message.guild.name}`);
      if (conf.blIgnoreAdmins && utils.checkPermission(message.author, message, 'admin')) return;
    }
    mainModule.db.get(`SELECT blacklist FROM servers WHERE id = ${message.guild.id}`, async (err, row) => {
      if (err) return console.log(`[ERROR] blacklistEventHandler: message: ${err}`);
      if (row && row.blacklist) {
        let toCheck;
        let conf = await configTools.getConfig(message.guild)
            .catch(err => console.log(err));
        if (!conf) conf = CONFIG.defaultConfig;
        conf = configTools.decodeConfig(conf);
        console.log(`[DEBUG] Conf validated? ${configTools.validateConfig(conf)} Guild: ${message.guild.name}`);
        if (configTools.validateConfig(conf)) {
          switch (conf.blLevel) {
            case 0:
              toCheck = message.content;
              break;
            case 1:
              toCheck = message.content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*`_]/g, '');
              break;
            case 2:
              toCheck = message.content.toLowerCase().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*`_]/g, '');
              break;
            default:
              toCheck = message.content.toLowerCase().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[*`_]/g, '');
          }
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
                const guild = message.guild;
                const member = message.guild.member(message.author);
                const fields = [];
                let conf = await configTools.getConfig(message.guild)
                    .catch(err => console.log(err));
                if (!conf) conf = CONFIG.defaultConfig;
                conf = configTools.decodeConfig(conf);
                if (configTools.validateConfig(conf)) {
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
                utils.timedMute(member.user.id, member.guild.id, 600, true, mainModule.client.user, 'Word filter infraction', false, true);
                utils.writeToModlog(msg.guild.id, 'Word filter broken', `User ${member.user.tag} was muted for 10 minutes for breaking the word filter`, true, mainModule.client.user, fields);
                member.createDM()
                    .then(chan => {
                      chan.send({
                        embed: {
                          color: 1571692,
                          title: `Your message was deleted on ${guild.name} for breaking the word filter`,
                          description: `A 10 minute mute was applied`,
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