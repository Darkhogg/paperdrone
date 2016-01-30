var paperdrone = require('..');
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
    bot.addPlugin(new paperdrone.plugins.CommandsPlugin());
    bot.addPlugin(new paperdrone.plugins.KeyedStoragePlugin());

    /* Define our commands */
    bot.on('command.set', function ($evt, cmd, message) {
        var idx = cmd.payload.search(/\s/);

        var key = cmd.payload.substring(0, idx);
        var val = cmd.payload.substring(idx).trim();

        bot.logger.info('[chat:%s] storing value: [%s] = %s', message.chat.id, key, val);

        return bot.storage.set('memory', key, {'_':val}).then(function () {
            return bot.api.sendMessage({'chat_id': message.chat.id, 'text': '[' + key + '] = ' + val});
        });
    });

    bot.on('command.get', function ($evt, cmd, message) {
        var key = cmd.payload.trim();

        bot.logger.info('[chat:%s] getting value: [%s]', message.chat.id, key);

        return bot.storage.get('memory', key).then(function (obj) {
            var val = obj._ || '<NULL>';
            return bot.api.sendMessage({'chat_id': message.chat.id, 'text': '[' + key + '] = ' + val});
        });
    });

    bot.on('command.list', function ($evt, cmd, message) {
        bot.logger.info('[chat:%s] listing values', message.chat.id);

        return bot.storage.list('memory').then(function (list) {
            var listText = list.map(function (obj) { return '[' + obj.key + '] = ' + obj.value._; }).join('\n');
            return bot.api.sendMessage({'chat_id': message.chat.id, 'text': listText || '<EMPTY>'});
        });
    });

    bot.on('command.del', function ($evt, cmd, message) {
        var key = cmd.payload.trim();

        bot.logger.info('[chat:%s] deleting value: [%s]', message.chat.id, key);

        return bot.storage.del('memory', key).then(function () {
            return bot.api.sendMessage({'chat_id': message.chat.id, 'text': '[' + key + '] = <NULL>'});
        });
    });

    bot.on('command.empty', function ($evt, cmd, message) {
        var key = cmd.payload.trim();

        bot.logger.info('[chat:%s] emptying values', message.chat.id);

        return bot.storage.empty('memory').then(function () {
            return bot.api.sendMessage({'chat_id': message.chat.id, 'text': '<EMPTY>'});
        });
    });

    /* Run the polling loop */
    bot.setupPollLoop();
});
