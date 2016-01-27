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

/* Register the update event of the bot */
bot.on('message.text', function ($evt, message) {
    /* Log the message */
    bot.logger.info('[chat:%s] (#%s) @%s: %s', message.chat.id, message.from.id, message.from.username, message.text);
});

/* Run the polling loop */
bot.setupPollLoop();
