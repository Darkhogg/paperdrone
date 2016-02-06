'use strict';
const Promise = require('bluebird');

const Plugin = require('../plugin');
const MessagesPlugin = require('./messages-plugin');

module.exports = Plugin.define('Commands', function (bot, options) {
    bot.addPlugin(new MessagesPlugin());

    bot.on('message.command', function ($evt, message) {
        let match = message.text.match(/^\/([a-zA-Z0-9_]{1,32})(?:\@([a-zA-Z0-9_]+))?\s*(.*)$/);

        if (match) {
            let cmd = {
                name: match[1],
                bot: match[2],
                payload: match[3]
            };

            bot.logger.debug('[Commands]  parsed command: /%s (@%s) -- %s', cmd.name, (cmd.bot || '~'), cmd.payload);

            return bot.emit(['command', 'command.'+cmd.name], cmd, message);
        }
    });
});
