const utils = require('../utils/utils.js');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
const Chartjs = require('chartjs-node');
const fs = require('fs');

module.exports = {
  help: 'View the top starred messages',
  usage: `${CONFIG.prefix}stars`,
  unmanageable: true,
  main: async (client, msg, hasArgs) => {

    if (!await utils.checkPermission(msg.author, msg, 'owner'))
      return utils.commandError(msg, 'Other Error', 'This command is in development and disabled', module.exports.usage);

    let stars = await module.exports.getSortedStars(msg);
    let rows = await module.exports.getSortedStars(msg, 'rows');

    if (!stars)
      return utils.sendResponse(msg, 'This server has no starred messages', 'err');

    const labels = [];
    const backgroundColor = [];
    const borderColor = [];
    const humanStars = [];

    if (stars.length > 5)
      stars = stars.slice(0, 5);

    for (let i = 0; i < stars.length; i++) {
      backgroundColor.push('rgba(255, 99, 132, 0.4)');
      borderColor.push('rgba(255, 99, 132, 1)');
      labels.push(i + 1);

      const chan = await mainModule.client.channels.fetch(rows[i].channel_id);
      const m = await chan.messages.fetch(rows[i].message_id);
      const content = m.content.slice(0, 40);
      humanStars.push(`${i + 1} - ${m.author.tag} [**Click to jump**](https://canary.discordapp.com/channels/${m.guild.id}/${chan.id}/${m.id}) - **${m.content.length === 0 ? 'EMPTY MESSAGE' : content}${m.content.length > 40 ? '...' : ''}**`);
    }

    const chartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: stars,
          backgroundColor,
          borderColor,
          borderWidth: 1
        }]
      },
      options: {
        width: 600,
        height: 600,
        animation: false,
        title: {
          display: true,
          fontSize: 18,
          text: `Top stars for ${msg.guild.name}`
        },
        plugins: {
          beforeDraw: chartInstance => {
            const ctx = chartInstance.chart.ctx;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
          }
        },
        legend: {
          display: false
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Number of stars'
            },
            ticks: {
              beginAtZero: true,
              callback: value => {return (value % 1 === 0) ? value : null}
            }
          }]
        }
      }
    };

    const chartNode = new Chartjs(600, 600);

    const chart = await chartNode.drawChart(chartConfig);
    const image = await chartNode.writeImageToFile('image/png', `./cache/${msg.id}.png`);
    
    await msg.channel.send({
      embed: {
        title: `Top stars for ${msg.guild.name}`,
        description: humanStars.join('\n'),
        image: {
          url: `attachment://${msg.id}.png`
        }
      },
      files: [{
        attachment: `./cache/${msg.id}.png`,
        name: `${msg.id}.png`
      }]
    });

    fs.unlinkSync(`./cache/${msg.id}.png`);

    chartNode.destroy();
  },

  getSortedStars(msg, type = 'number') {
    return new Promise(resolve => {
      mainModule.db.all('SELECT * FROM starboard WHERE guild_id = ?', msg.guild.id, (err, rows) => {
        if (!rows)
          resolve(null);
        else {
          const stars = [];

          for (let i = 0; i < rows.length; i++) {
            utils.debug(rows[i].star_count);
            stars.push(rows[i].star_count);
          }

          if (type === 'number')
            resolve(stars.sort((a, b) => {return b - a}));
          else
            resolve(rows.sort((a, b) => {return b.star_count - a.star_count}));
        }
      });
    });
  }
};