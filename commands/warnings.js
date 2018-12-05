const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
const mainModule = require('../bot.js');
module.exports = {
  help: 'View and edit warings for a user',
  usage: `${CONFIG.prefix}warnings @someone`,
  main: async (client, msg, hasArgs) => {
    const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (hasMR) {
      if (!hasArgs) return utils.sendResponse(msg, `Invalid syntax\nUsage: ${module.exports.usage}`, 'err');
      const userRegex = RegExp('^((?!<@>).)[0-9]{17,19}$');
      const args = msg.content.split(' ');
      const usrArg = args[0];
      const userObj = userRegex.test(usrArg) ? await client.users.fetch(usrArg).catch(err => console.log(err)) : null;
      args.shift();
      const warnMsg = args.length > 1 ? args.join(' ') : 'no warning message provided';
      let target;
      if (msg.mentions.users.first()) target = msg.mentions.users.first();
      else if (userObj) target = userObj;
      else return utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}`, 'err');

      mainModule.db.all('SELECT * FROM warnings WHERE user_id = ? AND guild_id = ?', target.id, msg.guild.id, async (err, rows) => {
        if (err) return utils.sendResponse(msg, `SQL ERROR: ${err}`, 'err');
        else if (rows.length < 1) return utils.sendResponse(msg, 'This user has no warnings', 'err');

        const warnings = [];
        const pages = [];
        const humanPages = [];

        while (rows.length) {
          let chunk = rows.splice(0, 3);
          pages.push(chunk);
          humanPages.push([]);
          for (let i = 0; i < chunk.length; i += 1) {
            let warning = JSON.parse(chunk[i].warning);
            const issuer = await client.users.fetch(warning.issuer);
            humanPages[pages.length -1 ].push(`\`${i}\` - **${issuer.tag}:** ${warning.message}`);
            warnings.push(chunk[i]);
          }
        }

        console.log(pages);
        console.log(humanPages);

        let embed = {
          embed: {
            color: 7506394,
            title: `Page 0/${pages.length - 1} of warnings for ${target.tag}`,
            description: `Reply with "delete n" to delete\n${humanPages[0].join('\n')}`,
            footer: {
              text: 'Reply with "exit" to stop, "page n" to change pages',
              iconURL: client.user.avatarURL(),
            },
          }
        };

        let pageMsg = await msg.channel.send(embed);
        let page = 0;

        const collector = msg.channel.createMessageCollector(m => m, { time: 45000 });
        collector.on('collect', async m => {
          if (m.author === msg.author) {
            if (m.content === 'exit') collector.stop('user');
            else if (m.content.startsWith('page')) {
              let args = m.content.split(' ');
              if (!Number.isNaN(Number.parseInt(args[1], 10)) && Number.parseInt(args[1], 10) < pages.length) {
                page = args[1];
                embed = {
                    embed: {
                    color: 7506394,
                    title: `Page ${args[1]}/${pages.length - 1} of warnings for ${target.tag}`,
                    description: `Reply with "delete n" to delete\n${humanPages[args[1]].join('\n')}`,
                    footer: {
                      text: 'Reply with "exit" to stop, "page n" to change pages',
                      iconURL: client.user.avatarURL(),
                    },
                  }
                };
                await pageMsg.edit(embed);
              }
            } else if (m.content.startsWith('delete')) {
              let args = m.content.split(' ');
              if (!Number.isNaN(Number.parseInt(args[1], 10)) && Number.parseInt(args[1], 10) < pages.length) {
                mainModule.db.run('DELETE FROM warnings WHERE row_id = ?', pages[page][args[1]].row_id, err => {
                  if (err) utils.sendResponse(msg, `SQL_ERROR: ${err}`, 'err');
                  else {
                    utils.sendResponse(msg, `Deleted warning for ${target.tag} at row_id ${pages[page][args[1]].row_id} and exited warnings menu`, 'success');
                    collector.stop('delete');
                  }
                });
              }
            }
          }
        });

        collector.on('end', (col, reason) => {
          if (reason === 'user') utils.sendResponse(msg, 'Exited warnings menu', 'success');
          else if (reason !== 'delete') utils.sendResponse(msg, 'Warnings menu timed out after 45 seconds', 'info');
        });
      });

    } else utils.sendResponse(msg, 'You must be an administrator to use this command', 'err');
  }
};