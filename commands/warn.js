const utils = require('../utils/utils.js');
const CONFIG = require('../config.json');
module.exports = {
  help: 'Warn a user',
  usage: `${CONFIG.prefix}warn @someone broke the rules again`,
  main: async (client, msg, hasArgs) => {
    //const hasMR = await utils.checkPermission(msg.author, msg, 'admin');
    if (await utils.checkPermission(msg.author, msg, 'kick') || await utils.checkPermission(msg.author, msg, 'ban')) {
      if (!hasArgs) return utils.sendResponse(msg, `Invalid syntax\nUsage: ${module.exports.usage}`, 'err');

      const userRegex = RegExp('^((?!<@>).)[0-9]{17,19}$');
      const args = msg.content.split(' ');
      const usrArg = args[0];
      const userObj = userRegex.test(usrArg) ? await client.users.fetch(usrArg).catch(err => console.log(err)) : null;

      args.shift();

      const warnMsg = args.length >= 1 ? args.join(' ') : 'no warning message provided';
      let target;

      if (msg.mentions.users.first())
        target = msg.mentions.users.first();
      else if
        (userObj) target = userObj;
      else
        return utils.sendResponse(msg, `Invalid user\nUsage: ${module.exports.usage}`, 'err');

      const punished = await utils.issueWarning(target.id, msg.guild.id, {issuer:msg.author.id,message:warnMsg});

      utils.sendResponse(msg, `Warned ${punished ? 'and punished ' : ''}\`${target.tag}\` for \`${warnMsg}\``, 'success');
    } else utils.sendResponse(msg, 'You must have permission to kick/ban members to use this command', 'err');
  }
};