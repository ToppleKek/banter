const utils = require('../utils/utils.js');
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
    const Plotter = new Chartjs(1000, 1000);
    console.log("got plotter");

    // const chartOptions = {};

    // chartOptions.type = 'bar';
    // chartOptions.options = {};
    // chartOptions.options.scales = {};
    // chartOptions.options.scales.yAxes = [{ticks: {beginAtZero: true}}];
    var chartConfig = {
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
          label: '# of Votes',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
          'rgba(255,99,132,1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        width: 400,
        height: 400,
        animation: false,
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        },
        tooltips: {
          mode: 'label'
        }
      }
    };

    var chartNode = new Chartjs(600, 600);
    chartNode.drawChart(chartConfig)
        .then(() => {
            return chartNode.writeImageToFile('image/png', `../cache/${msg.id}.png`);
        })
        .then(async () => {
            // clean up
            await msg.channel.send({
              embed: {
                image: {
                  url: `attachment://${msg.id}.png`
                }
              },
              files: [{
                attachment: `../cache/${msg.id}.png`,
                name: `${msg.id}.png`
              }]
            });
            fs.unlinkSync(`../cache/${msg.id}.png`);
        });

    // console.log("drawing");
    // const chart = Plotter.drawChart(chartConfig).then(() => {
    // // chart is created

    // // get image as png buffer
    // return Plotter.getImageBuffer('image/png').then(buffer => {
    // // as a stream
    // Plotter.getImageStream('image/png').then(streamResult => {
    // console.log("WRITING!");
    // return Plotter.writeImageToFile('image/png', `../cache/${msg.id}.png`).then(async () => {

  //   // fs.unlinkSync(`../cache/${msg.id}.png`);
  // });

    // console.log("drawchart");
    // const buffer = await Plotter.getImageBuffer('image/png');
    // console.log("got buffer");
    // const stream = await buffer.getImageStream('image/png');
    // console.log("got stream");
    // console.log("writing");

    //await stream.writeImageToFile('image/png', `../cache/${msg.id}.png`);
    chartNode.destroy();
    Plotter.destroy();
  }
};