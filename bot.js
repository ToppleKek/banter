const CONFIG = require('./config.json');
const Discord = require('discord.js');
const commandHandler = require('./utils/commandHandler.js');
const utils = require('./utils/utils.js');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const client = new Discord.Client({ autoReconnect: true, disableEveryone: true });

module.exports.db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.log(`[ERROR] Failed to connect to sqlite3 database! ${err}`);
  } else {
    console.log('Connected to sqlite3 database (data.db)');
  }
});

module.exports.client = client;

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
client.on('ready', () => {
  loadCommands();
  console.log(`Ready. \nClient: ${client.user.tag}\nOwner: ${client.users.get(CONFIG.ownerid).tag}\nServers: ${client.guilds.array().length}`);
});

client.on('message', msg => {
  if (msg.content.startsWith(`<@${client.user.id}>`) || msg.content.startsWith(`<@!${client.user.id}>`)) {
    commandHandler.checkCommand(client, commands, msg, true);
  } else if (msg.content.startsWith(CONFIG.prefix)) {
    commandHandler.checkCommand(client, commands, msg, false);
  }
});

client.on('error', (err) => {
  console.log('————— ERROR —————');
  console.log(err);
  console.log('——— END ERROR ———');
});

client.on('disconnected', () => {
  console.log('[WARN] The client has disconnected');
});
// -- END EVENTS --
client.login(CONFIG.token);