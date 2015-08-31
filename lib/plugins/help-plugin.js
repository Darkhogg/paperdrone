var Promise = require('bluebird');

var Plugin = require('../plugin');

var CommandsPlugin = require('./commands-plugin');

module.exports = Plugin.define('Help', function (bot, options) {
    var log = options.logger;

    bot.addPlugin(new CommandsPlugin());

    bot.help = {
        'commands': [ 'help' ],
        'text': null
    };

    bot.on('command', function ($evt, cmd, message) {
        /* Check if the help text has been set up and the command is in the list */
        if (bot.help.text && bot.help.commands.indexOf(cmd.name) >= 0) {
            log.silly('[Help] sending help message on /%s command', cmd.name);

            $evt.stop();

            return bot.api.sendMessage({
                'chat_id': message.chat.id,
                'text': bot.help.text
            });
        }
    });
});
