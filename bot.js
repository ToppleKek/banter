const CONFIG = require('./config.json');
const Discord = require('discord.js');
const commandHandler = require('./utils/commandHandler.js');
const utils = require('./utils/utils.js');
const guildMemberAddEventHandler = require('./events/guildMemberAdd.js');
const loggingEventHandler = require('./events/loggingEventHandler.js');
const guildConfigEventHandler = require('./events/guildConfigEventHandler.js');
const blacklistEventHandler = require('./events/blacklistEventHandler.js');
const starboardEventHandler = require('./events/starboardEventHandler.js');
const spamDetectionHandler = require('./events/spamDetectionHandler.js');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const events = {
  MESSAGE_REACTION_ADD: 'messageReactionAdd',
  MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

module.exports.db = new sqlite3.Database('./data.db', (err) => {
  if (err) {
    console.log(`[ERROR] Failed to connect to sqlite3 database! ${err}`);
  } else {
    console.log('Connected to sqlite3 database (data.db)');
  }
});

module.exports.client = new Discord.Client({ autoReconnect: true, disableEveryone: true });
module.exports.commands = {};
module.exports.guilds = {};

// -- FUNCTIONS --
function loadCommands() {
  let files = fs.readdirSync(`./commands`);
  for (let file of files) {
    if (file.endsWith('.js')) {
      module.exports.commands[file.slice(0, -3)] = require(`./commands/${file}`);
      console.log(`Loaded ${file}`);
    }
  }
  console.log('———— All Commands Loaded! ————');
}
// -- END FUNCTIONS --
// -- COMMANDS --
module.exports.commands.help = {};
module.exports.commands.help.help = 'Displays this list';
module.exports.commands.help.usage = `${CONFIG.prefix}help <command>`;
module.exports.commands.help.main = (client, msg, hasArgs) => {
  if (!hasArgs) {
    const cmds = [];
    for (const command in module.exports.commands) cmds.push(`**${CONFIG.prefix}${command}** - ${module.exports.commands[command].help}`);

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
      if (module.exports.commands[msg.content].usage) usage = module.exports.commands[msg.content].usage;
      else usage = 'No usage info';
      utils.sendResponse(msg, `**${msg.content}** - ${module.exports.commands[msg.content].help}\n**Usage:** ${usage}`, 'info');
    } catch (err) {
      utils.sendResponse(msg, 'Command not found', 'err');
    }
  }
};

module.exports.commands.load = {};
module.exports.commands.load.help = 'Load a command from ./commands/';
module.exports.commands.load.main = async (client, msg, hasArgs) => {
  const hasMR = await utils.checkPermission(msg.author, msg, 'owner');
  if (hasMR) {
    if (!hasArgs) {
      return utils.sendResponse(msg, 'Missing arguments. Provide a command to unload.', 'err');
    }
    try {
      delete module.exports.commands[msg.content];
      delete require.cache[`${__dirname}/commands/${msg.content}.js`];
      module.exports.commands[msg.content] = require(`./commands/${msg.content}.js`);
      utils.sendResponse(msg, `Loaded command: \`${msg.content}\``, 'success');
    } catch(err) {
      utils.sendResponse(msg, `That command was not found or there was an error loading it. Info:\n\`\`\`${err}\`\`\``, 'err');
    }
  } else {
    utils.sendResponse(msg, 'Only the owner can use this command', 'err');
  }
};

module.exports.commands.unload = {};
module.exports.commands.unload.help = 'Unload a loaded command';
module.exports.commands.unload.main = async (client, msg, hasArgs) => {
  const hasMR = await utils.checkPermission(msg.author, msg, 'owner');
  if (hasMR) {
    if (!hasArgs) {
      return utils.sendResponse(msg, 'Missing arguments. Provide a command to unload.', 'err');
    }
    const fileExists = await utils.fileExists(`./commands/${msg.content}.js`);
    if (!fileExists) {
      return utils.sendResponse(msg, `File \`./commands/${msg.content}.js\` not found!`, 'err');
    }
    try {
      delete module.exports.commands[msg.content];
      delete require.cache[`${__dirname}/commands/${msg.content}.js`];
      utils.sendResponse(msg, `Unloaded command: \`${msg.content}\``, 'success');
    }
    catch(err){
      utils.sendResponse(msg, `That command was not found or there was an error unloading it. Info:\n\`\`\`${err.stack}\`\`\``, 'err');
    }
  }else {
    utils.sendResponse(msg, 'Only the owner can use this command', 'err');
  }
};

module.exports.commands.reload = {};
module.exports.commands.reload.help = 'Reloads a loaded command';
module.exports.commands.reload.main = async (client, msg, hasArgs) => {
  const hasMR = await utils.checkPermission(msg.author, msg, 'owner');
  if (hasMR) {
    if (!hasArgs) {
      return utils.sendResponse(msg, 'Missing arguments. Provide a command to unload.', 'err');
    }
    try {
      delete module.exports.commands[msg.content];
      delete require.cache[`${__dirname}/commands/${msg.content}.js`];
      module.exports.commands[msg.content] = require(`./commands/${msg.content}.js`);
      utils.sendResponse(msg, `Reloaded command: \`${msg.content}\``, 'success');
    }
    catch(err){
      utils.sendResponse(msg, `That command was not found or there was an error reloading it. Info:\n\`\`\`${err.stack}\`\`\``, 'err');
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
  blacklistEventHandler.message(null, msg);
  spamDetectionHandler.message(msg);
  if (msg.content.startsWith(`<@${module.exports.client.user.id}>`) || msg.content.startsWith(`<@!${module.exports.client.user.id}>`)) {
    commandHandler.checkCommand(module.exports.client, module.exports.commands, msg, true);
  } else if (msg.content.startsWith(CONFIG.prefix)) {
    commandHandler.checkCommand(module.exports.client, module.exports.commands, msg, false);
  }
});

module.exports.client.on('messageUpdate', (oldMessage, newMessage) => blacklistEventHandler.message(oldMessage, newMessage));
module.exports.client.on('guildMemberAdd', member => {
  console.log('[INFO] guildMemberAddEvent');
  guildMemberAddEventHandler.event(module.exports.client, module.exports.db, member);
  loggingEventHandler.guildMemberAdd(member);
});

module.exports.client.on('raw', async event => {
  if (!events.hasOwnProperty(event.t)) return;
  const {d: data} = event;
  if (!module.exports.client.channels.get(data.channel_id).guild) return;
  const user = module.exports.client.users.get(data.user_id);
  const channel = module.exports.client.channels.get(data.channel_id);

  if (channel.messages.has(data.message_id)) return;

  const message = await channel.messages.fetch(data.message_id);
  const emojiKey = (data.emoji.id) ? data.emoji.id : data.emoji.name;
  let reaction = message.reactions.get(emojiKey);

  if (!reaction) {
    const emoji = new Discord.Emoji(module.exports.client.guilds.get(data.guild_id), data.emoji);
    reaction = new Discord.MessageReaction(message, emoji, 1, data.user_id === module.exports.client.user.id);
  }

  module.exports.client.emit(events[event.t], reaction, user);
});

module.exports.client.on('messageReactionAdd', async (messageReaction, user) => {
    const starboard = await utils.getActionChannel(messageReaction.message.guild.id, 'starboard').catch(err => console.log(`[WARN] Starboard promise reject! Err: ${err}`));
    if (!starboard) return;
  starboardEventHandler.messageReactionAdd(messageReaction, user);
});

module.exports.client.on('messageReactionRemove', async (messageReaction, user) => {
    const starboard = await utils.getActionChannel(messageReaction.message.guild.id, 'starboard').catch(err => console.log(`[WARN] Starboard promise reject! Err: ${err}`));
    if (!starboard) return;
  starboardEventHandler.messageReactionRemove(messageReaction, user);
});

module.exports.client.on('guildCreate', guild => guildConfigEventHandler.guildCreate(guild));
module.exports.client.on('guildDelete', guild => guildConfigEventHandler.guildDelete(guild));

// -- LOGGING --
module.exports.client.on('guildMemberRemove', member                   => loggingEventHandler.guildMemberRemove(member));
module.exports.client.on('channelCreate',     channel                  => loggingEventHandler.channelCreate(channel));
module.exports.client.on('channelDelete',     channel                  => loggingEventHandler.channelDelete(channel));
module.exports.client.on('guildMemberUpdate', (oldMember, newMember)   => loggingEventHandler.guildMemberUpdate(oldMember, newMember));
module.exports.client.on('messageDelete',     message                  => loggingEventHandler.messageDelete(message));
module.exports.client.on('messageUpdate',     (oldMessage, newMessage) => loggingEventHandler.messageUpdate(oldMessage, newMessage));
module.exports.client.on('userUpdate',        (oldUser, newUser)       => loggingEventHandler.userUpdate(oldUser, newUser));
module.exports.client.on('channelUpdate',     (oldChannel, newChannel) => loggingEventHandler.channelUpdate(oldChannel, newChannel));
module.exports.client.on('roleCreate',        role                     => loggingEventHandler.roleCreate(role));
module.exports.client.on('roleDelete',        role                     => loggingEventHandler.roleDelete(role));
module.exports.client.on('guildBanAdd',       (guild, user)            => loggingEventHandler.guildBanAdd(guild, user));
module.exports.client.on('guildBanRemove',    (guild, user)            => loggingEventHandler.guildBanRemove(guild, user));
module.exports.client.on('messageDeleteBulk', messages                 => loggingEventHandler.messageDeleteBulk(messages));
// -- END LOGGING --

//module.exports.client.on('presenceUpdate', (oldMember, newMember) => loggingEventHandler.presenceUpdate(oldMember, newMember));

module.exports.client.on('error', (err) => {
  console.log('————— ERROR —————');
  console.log(err);
  console.log('——— END ERROR ———');
});

module.exports.client.on('disconnected', () => {
  console.log('[WARN] The client has disconnected');
});

process.on('unhandledRejection', (reason, p) => {
  console.dir(p);
  utils.logError(reason, p);
});
// -- END EVENTS --
module.exports.client.login(CONFIG.token);