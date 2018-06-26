const forever = require('forever');

forever.start('bot.js', { stream: true });
