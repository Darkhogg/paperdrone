var paperdrone = require('..');
var winston = require('winston');

/* Setup the Winston logger */
winston.level = 'silly';
winston.cli();

/* Create a bot with the telegram token passed on the command line */
var bot = new paperdrone.Bot({
    'token': process.argv[2],
});

/* Add our dependencies */
bot.addPlugin(new paperdrone.plugins.MessagesPlugin());
bot.addPlugin(new paperdrone.plugins.CommandsPlugin());

/* Register the update event of the bot */
bot.on(['message.text', 'message.command'], function (message) {

    /* Use the bot's API to return the message */
    return bot.api.sendMessage({
        'chat_id': message.chat.id,
        'text': message.text
    });
});

/* Run the polling loop */
bot.setupPollLoop();

/* Run the ticking loop */
bot.setupTickLoop();
