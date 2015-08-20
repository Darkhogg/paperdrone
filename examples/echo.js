var paperdrone = require('..');

/* Create a bot with the telegram token passed on the command line */
var bot = new paperdrone.Bot({
    'token': process.argv[2],
});

/* Add a plugin to the bot created inline froma function */
bot.addPlugin(paperdrone.Plugin.new('echo', function (bot, options) {
    /* Register the update event of the bot */
    bot.on('update', function (update) {

        /* Use the bot's API to return the message */
        return bot.api.sendMessage({
            'chat_id': update.message.chat.id,
            'text': update.message.text
        });
    });
}));

bot.setupPollLoop();
