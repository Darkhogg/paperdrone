var paperdrone = require('..');
var moment = require('moment');
var pmongo = require('promised-mongo');
var winston = require('winston');

/* Setup the Winston logger */
winston.level = 'silly';
winston.cli();

/* Create a bot with the telegram token passed on the command line */
var bot = new paperdrone.Bot({
    'token': process.argv[2],
    'mongo': {
        'client': pmongo('paperdrone')
    }
});

/* Add our dependencies */
bot.addPlugin(new paperdrone.plugins.MessagesPlugin());
bot.addPlugin(new paperdrone.plugins.CommandsPlugin());
bot.addPlugin(new paperdrone.plugins.PrompterPlugin());

bot.on('command.start', function ($evt, cmd, msg) {
    return bot.prompter.prompt(msg.chat.id, msg.from.id, 'name');
});

bot.on('prompt.request.name', function ($evt, prompt) {
    return bot.api.sendMessage({
        'chat_id': prompt.chat,
        'text': 'Tell me your name'
    });
});

bot.on('prompt.complete.name', function ($evt, prompt, result) {
    return bot.api.sendMessage({
        'chat_id': prompt.chat,
        'text': 'Hello, ' + result.text + '!'
    });
});



/* Run the polling loop */
bot.setupPollLoop();
