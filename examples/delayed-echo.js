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
    bot.addPlugin(new paperdrone.plugins.SchedulerPlugin());

    /* Register the update event of the bot */
    bot.on('message.text', function ($evt, message) {
        /* Schedule the echo for a mine from now */
        return bot.scheduler.schedule('echo', moment().add(60, 's'), { 'chat': message.chat.id, 'text': message.text });
    });

    bot.on('scheduled.echo', function ($evt, type, when, data) {
        /* Use the bot's API to return the message */
        return bot.api.sendMessage({
            'chat_id': data.chat,
            'text': data.text
        });
    });

    bot.on('command.list', function ($evt, cmd, message) {
        return bot.scheduler.list('echo').then(function (list) {
            var strList = list.filter(function (entry) {
                return entry.data.chat == message.chat.id;
            }).map(function (entry) {
                return moment(entry.time).format() + ' -- ' + entry.data.text;
            }).join('\n');

            return bot.api.sendMessage({'chat_id': message.chat.id, 'text': strList || 'nothing scheduled'});
        });
    });

    /* Run the polling and ticking loops */
    bot.setupPollLoop();
    bot.setupTickLoop(10);
});
