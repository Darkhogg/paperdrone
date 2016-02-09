'use strict';
const pd = require('..');

module.exports = pd.Plugin.define('Example_Echo', function (bot, options) {
    /* Add our dependencies */
    bot.addPlugin(new pd.plugins.MessagesPlugin());

    /* Register the update event of the bot */
    bot.on('message.text', function ($evt, message) {
        /* Use the bot's API to return the message */
        return bot.api.sendMessage({
            'chat_id': message.chat.id,
            'text': message.text
        });
    });

    bot.api.on('request', function ($evt, method, data) {
        ///bot.logger.verbose('[API]  request to "%s":', method, data);
    });

    bot.api.on('response', function ($evt, method, data, result) {
        //bot.logger.verbose('[API]  response of "%s":', method, result);
    });
});
