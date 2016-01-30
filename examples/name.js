var paperdrone = require('..');
var moment = require('moment');
var mongodb = require('mongodb-bluebird');
var winston = require('winston');

/* Setup the Winston logger */
winston.level = 'silly';
winston.cli();

mongodb.connect('mongodb://localhost/paperdrone').then(function (db) {

    /* Create a bot with the telegram token passed on the command line */
    var bot = new paperdrone.Bot({
        'token': process.argv[2],
        'mongo': {
            'client': db
        }
    });

    /* Add our dependencies */
    bot.addPlugin(new paperdrone.plugins.MessagesPlugin());
    bot.addPlugin(new paperdrone.plugins.CommandsPlugin());
    bot.addPlugin(new paperdrone.plugins.PrompterPlugin());

    bot.on('command.start', function ($evt, cmd, msg) {
        return Promise.all([
            bot.prompter.prompt(msg.chat.id, msg.from.id, 'name'),
            bot.prompter.prompt(msg.chat.id, msg.from.id, 'age')
        ]);
    });


    /* Name prompt setup */

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


    /* Age prompt setup */

    bot.on('prompt.request.age', function ($evt, prompt) {
        return bot.api.sendMessage({
            'chat_id': prompt.chat,
            'text': 'Tell me your age'
        });
    });

    bot.on('prompt.complete.age', function ($evt, prompt, result) {
        return bot.api.sendMessage({
            'chat_id': prompt.chat,
            'text': 'Hello, person of ' + result.text + ' years old!'
        });
    });



    /* Run the polling loop */
    bot.setupPollLoop();
});
