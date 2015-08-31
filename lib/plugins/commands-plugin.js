var Promise = require('bluebird');

var Plugin = require('../plugin');

var MessagesPlugin = require('./messages-plugin');

module.exports = Plugin.define('Commands', function (bot, options) {
    var log = options.logger;

    bot.addPlugin(new MessagesPlugin());

    bot.on('message.command', function ($evt, message) {
        var match = message.text.match(/^\/([a-zA-Z0-9_]{1,32})(?:\@([a-zA-Z0-9_]+))?\s*(.*)$/);

        if (match) {
            var cmd = {
                name: match[1],
                bot: match[2],
                payload: match[3]
            };

            log.verbose('[Commands] parsed command: /%s (@%s) -- %s', cmd.name, (cmd.bot || '~'), cmd.payload);

            return bot.emit('command', cmd, message).then(function ($res) {
                if (!$res.isStopped()) {
                    return bot.emit('command.' + cmd.name, cmd, message);
                }
            });
        }
    });
});
