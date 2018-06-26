const utils = require("../utils/utils.js");
module.exports = {
  help: "Evaluate JavaScript",
  main: (msg, hasArgs) => {
    if (utils.checkPermission(msg.author, msg, 'owner')) {
      if (hasArgs) {
        const code = msg.content;
        let out;
        try {
          out = eval(code);
          console.log(`[EVAL] ${out}`);
        } catch (error) {
          msg.channel.send({
            embed: {
              color: 11736341,
              author: {
                name: 'Eval Error',
              },
              title: 'An Exception Occurred!',
              fields: [{
                name: 'Error Name:',
                value: error.name,
              },
                {
                  name: 'Error Message:',
                  value: error.message,
                },
              ],
              timestamp: new Date(),
            },
          }); // end send message
          return;
        } // end catch
        msg.channel.send(out).catch(error => msg.channel.send(`UNCAUGHT EXCEPTION(Failed promise)\n${error.name}\n${error.message}`));
      } else utils.sendResponse(msg, `Argument error. Usage: \`${CONFIG.prefix}evaljs some really cool code\``, 'err');
    } else utils.sendResponse(msg, 'Only the owner can use this command.', 'err');
  }
};
