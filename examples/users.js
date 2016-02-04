'use strict';
const pd = require('..');

moodule.exports = pd.Plugin.define('Example_Users', function (bot, options) {
    /* Add our dependencies */
    bot.addPlugin(new pd.plugins.MessagesPlugin());
    bot.addPlugin(new pd.plugins.UsersPlugin());

    /* Register the update event of the bot */
    bot.on('message.text', function ($evt, message) {
        bot.logger.info('[chat:%s] (#%s) @%s: %s', message.chat.id, message.from.id, message.from.username, message.text);
    });
});
