const util = require('util');
const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');

module.exports = {
  help: 'Mass ban users that joined in the specified time period',
  usage: `${CONFIG.prefix}massnaenae 1d 15h 30m`,
  main: async (client, msg, hasArgs) => {
    if (!await utils.checkPermission(msg.author, msg, 'ban'))
      return utils.commandError(msg, 'Permission Error', 'You must have permission to ban members to execute this command', module.exports.usage);

    if (!hasArgs)
      return utils.commandError(msg, 'Syntax Error', 'You must provide an amount of time (example: "1d 6h 9m" will ban members who joined in the last 1 day, 6 hours, and 9 minutes)', module.exports.usage);
  
    let args = msg.content.split(' ');
    let now = new Date().getTime();
    let unit;
    let time = 0;
    let days = 0;
    let hours = 0;
    let minutes = 0;

    for (let i = 0; i < args.length; i++) {
      unit = args[i][args[i].length - 1];
      args[i] = args[i].substring(0, args[i].length - 1);

      if (Number.isNaN(Number.parseInt(args[i], 10)) || !(['h', 'm', 'd'].includes(unit)))
        return utils.commandError(msg, 'Syntax Error', 'Time format invalid', module.exports.usage);

      switch (unit) {
        case 'd':
          days += Number.parseInt(args[i], 10);
          break;

        case 'h':
          hours += Number.parseInt(args[i], 10);
          break;

        case 'm':
          minutes += Number.parseInt(args[i], 10);
          break;

        default:
          return utils.commandError(msg, 'Syntax Error', 'Time format invalid', module.exports.usage);
      }
    }

    console.log(now);
    console.log("DEBUG: days " + days + " ms: " + days * 86400000 + " DATE: " + now);

    time += days * 86400000;
    time += hours * 3600000;
    time += minutes * 60000;

    console.log(now - time);

    let members = await msg.guild.members.fetch();

    members = members.filter(member => member.joinedTimestamp > (now - time));

    utils.sendResponse(msg, `This will ban ***${members.size}*** users from **"${msg.guild.name}"** that joined in the last ${days} days, ${hours} hours and ${minutes} minutes. Are you sure you want to do this? (y/N) (20s timeout)`, 'info');
    const collector = msg.channel.createMessageCollector(m => m, { time: 20000 });

    collector.on('collect', async m => {
      if (m.author === msg.author && m.content.toLowerCase() === 'y') {
        const message = await msg.channel.send({embed: {
          color: 7506394,
          timestamp: new Date(),
          description: `Banning ${members.size} users. This may take some time; please wait... (0/${members.size} banned)`
        }});

        collector.stop('start');

        let banArr = members.array();
        const timeoutAsync = util.promisify(setTimeout);

        for (let i = 0; i < banArr.length; i++) {
          if (banArr[i].bannable)
            await banArr[i].ban({days: 1});

          if ((i + 1) % 4 === 0) {
            await message.edit({embed: {
              color: 7506394,
              timestamp: new Date(),
              description: `Banning ${members.size} users. This may take some time; please wait... (${i}/${members.size} banned)`
            }});

            await timeoutAsync(() => {console.log('RATELIMIT TIMEOUT: over')}, 7000);
          }
        }

        utils.sendResponse(msg, `Finished banning ${members.size} users`, 'success');
      } else if (m.author === msg.author && m.content.toLowerCase() === 'n')
        collector.stop('abort');
    });

    collector.on('end', (col, reason) => {
      if (reason === 'abort')
        utils.sendResponse(msg, 'Aborted.', 'info');
    });
  }
};
