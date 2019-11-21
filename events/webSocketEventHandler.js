const mainModule = require('../bot.js');
const utils = require('../utils/utils.js');

module.exports = {
    resetIPS() {
        mainModule.ips = {};
    },

    message(message, req, ws) {
        if (req.headers.origin != 'http://banter.topplekek.xyz' && req.headers.origin != 'https://banter.topplekek.xyz') {
            ws.terminate();
            return;
        }

        if (!mainModule.ips[req.headers['x-forwarded-for']])
            mainModule.ips[req.headers['x-forwarded-for']] = 0;

        if (mainModule.ips[req.headers['x-forwarded-for']] > 5)
            return ws.send('ratelimit');

        utils.info(`WebSocket: Message: ${message}`);

        utils.info(`WebSocket: URL: ${req.url.slice(1, req.url.length)}`);

        mainModule.db.get('SELECT * FROM servers WHERE vanity_url = ?', req.url.slice(1, req.url.length), async (err, row) => {
            if (!row || !row.vanity_url)
                return ws.send('unknown invite');

            let guild = mainModule.client.guilds.get(row.id);

            const auto = await utils.getDBItem(guild, 'vanity_invite');

            if (auto !== 'auto')
                return ws.send(`https://discord.gg/${auto}`);

            let chan = guild.channels.find(c => c.type === 'text');;

            if (!chan) {
                ws.isAlive = false;
                return ws.send('discord setup failure');
            }

            let invite = await chan.createInvite({ maxAge: 600, maxUses: 1, unique: true });

            mainModule.ips[req.headers['x-forwarded-for']]++;

            if (!invite)
                return ws.send('error');

            ws.send(invite.url);

            const log = await utils.getActionChannel(guild.id, 'log');

            await guild.channels.get(log).send({
                embed: {
                    color: 1571692,
                    title: '✅ Invite Created',
                    fields: [{
                        name: 'Referrer',
                        value: message ? message : 'no referrer',
                    }, {
                        name: 'User Agent',
                        value: req.headers['user-agent'] ? req.headers['user-agent'] : 'no user agent',
                    }, {
                        name: 'Invite',
                        value: invite.url,
                    }],
                    timestamp: new Date(),
                },
            });
        });
    }
};