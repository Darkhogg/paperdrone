const Promise = require('bluebird');

const Plugin = require('../plugin');
const CommandsPlugin = require('./commands-plugin');

module.exports = Plugin.define('Help', function (bot, options) {
    bot.addPlugin(new CommandsPlugin());

    bot.help = {
        'commands': [ 'help' ],
        'text': null,
        send (to) {
            return bot.api.sendMessage({
                'chat_id': to,
                'text': bot.help.text,
                'parse_mode': 'Markdown'
            });
        }
    };

    bot.on('command', function ($evt, cmd, msg) {
        /* Check if the help text has been set up and the command is in the list */
        if (bot.help.text && bot.help.commands.indexOf(cmd.name) >= 0) {
            bot.logger.debug('[Help]  sending help message on /%s command to <#%s, %s>', cmd.name, msg.chat.id, msg.chat.full_name);

            $evt.stop();
            return bot.help.send(msg.chat.id);
        }
    });
});
