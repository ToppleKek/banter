const CONFIG = require('./config.json');
const Discord = require('discord.js');
const commandHandler = require('./utils/commandHandler.js');
const utils = require('./utils/utils.js');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

module.exports.db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.log(`[ERROR] Failed to connect to sqlite3 database! ${err}`);
  } else {
    console.log('Connected to sqlite3 database (data.db)');
  }
});

module.exports.client = new Discord.Client({ autoReconnect: true, disableEveryone: true });

let commands = {};

// -- FUNCTIONS --
function loadCommands() {
  let files = fs.readdirSync(`./commands`);
  for (let file of files) {
    if (file.endsWith('.js')) {
      commands[file.slice(0, -3)] = require(`./commands/${file}`);
      console.log('Loaded ' + file);
    }
  }
  console.log('———— All Commands Loaded! ————');
}
// -- END FUNCTIONS --
// -- COMMANDS --
commands.help = {};
commands.help.help = 'Displays this list';
commands.help.main = (client, msg, hasArgs) => {
  if (!hasArgs) {
    const cmds = [];
    for (const command in commands) cmds.push(`**${CONFIG.prefix}${command}** - ${commands[command].help}`);

    const embed = {
      color: 0xED5228,
      title: 'List of commands',
      description: `Prefix: \`${CONFIG.prefix}\` You may also mention me as a prefix.\n\n${cmds.join('\n')}`,
      timestamp: new Date(),
    };
    msg.channel.send('', { embed }).catch(err => utils.sendResponse(msg, `ERROR: ${err}`, 'err'));
  } else {
    try {
      let usage;
      if (commands[msg.content].usage) usage = commands[msg.content].usage;
      else usage = 'No usage info';
      utils.sendResponse(msg, `**${msg.content}** - ${commands[msg.content].help}\n**Usage:** ${usage}`, 'info');
    } catch (err) {
      utils.sendResponse(msg, 'Command not found', 'err');
    }
  }
};

commands.load = {};
commands.load.help = 'Load a command from ./commands/';
commands.load.main = (client, msg, hasArgs) => {
  if (utils.checkPermission(msg.author, msg, 'owner')) {
    if (!hasArgs) {
      utils.sendResponse(msg, 'Missing arguments. Provide a command to unload.', 'err');
      return;
    }
    try {
      delete commands[msg.content];
      delete require.cache[`${__dirname}/commands/${msg.content}.js`];
      commands[msg.content] = require(`./commands/${msg.content}.js`);
      utils.sendResponse(msg, `Loaded command: \`${msg.content}\``, 'success');
    } catch(err) {
      utils.sendResponse(msg, `That command was not found or there was an error loading it. Info:\n\`\`\`${err}\`\`\``, 'err');
    }
  } else {
    utils.sendResponse(msg, 'Only the owner can use this command', 'err');
  }
};

commands.unload = {};
commands.unload.help = 'Unload a loaded command';
commands.unload.main = (client, msg, hasArgs) => {
  if (utils.checkPermission(msg.author, msg, 'owner')) {
    if (!hasArgs) {
      utils.sendResponse(msg, 'Missing arguments. Provide a command to unload.', 'err');
      return;
    }
    try {
      delete commands[msg.content];
      delete require.cache[`${__dirname}/commands/${msg.content}.js`];
      utils.sendResponse(msg, `Unloaded command: \`${msg.content}\``, 'success');
    }
    catch(err){
      utils.sendResponse(msg, `That command was not found or there was an error unloading it. Info:\n\`\`\`${err}\`\`\``, 'err');
    }
  }else {
    utils.sendResponse(msg, 'Only the owner can use this command', 'err');
  }
};

commands.reload = {};
commands.reload.help = 'Reloads a loaded command';
commands.reload.main = (client, msg, hasArgs) => {
  if (utils.checkPermission(msg.author, msg, 'owner')) {
    if (!hasArgs) {
      utils.sendResponse(msg, 'Missing arguments. Provide a command to unload.', 'err');
      return;
    }
    try {
      delete commands[msg.content];
      delete require.cache[`${__dirname}/commands/${msg.content}.js`];
      commands[msg.content] = require(`./commands/${msg.content}.js`);
      utils.sendResponse(msg, `Reloaded command: \`${msg.content}\``, 'success');
    }
    catch(err){
      utils.sendResponse(msg, `That command was not found or there was an error reloading it. Info:\n\`\`\`${err}\`\`\``, 'err');
    }
  } else {
    utils.sendResponse(msg, 'Only the owner can use this command', 'err');
  }
};
// -- END COMMANDS --
// -- EVENTS --
module.exports.client.on('ready', () => {
  loadCommands();
  console.log(`Ready. \nClient: ${module.exports.client.user.tag}\nOwner: ${module.exports.client.users.get(CONFIG.ownerid).tag}\nServers: ${module.exports.client.guilds.array().length}`);
});

module.exports.client.on('message', msg => {
  if (msg.content.startsWith(`<@${module.exports.client.user.id}>`) || msg.content.startsWith(`<@!${module.exports.client.user.id}>`)) {
    commandHandler.checkCommand(module.exports.client, commands, msg, true);
  } else if (msg.content.startsWith(CONFIG.prefix)) {
    commandHandler.checkCommand(module.exports.client, commands, msg, false);
  }
});

module.exports.client.on('error', (err) => {
  console.log('————— ERROR —————');
  console.log(err);
  console.log('——— END ERROR ———');
});

module.exports.client.on('disconnected', () => {
  console.log('[WARN] The client has disconnected');
});
// -- END EVENTS --
module.exports.client.login(CONFIG.token);