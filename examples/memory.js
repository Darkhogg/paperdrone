'use strict';
const pd = require('..');

module.exports = pd.Plugin.define('Example_Memory', function (bot, options) {
    /* Add our dependencies */
    bot.addPlugin(new pd.plugins.CommandsPlugin());
    bot.addPlugin(new pd.plugins.KeyedStoragePlugin());

    /* Define our commands */
    bot.on('command.set', function ($evt, cmd, message) {
        let idx = cmd.payload.search(/\s/);

        let key = cmd.payload.substring(0, idx);
        let val = cmd.payload.substring(idx).trim();

        bot.logger.info('[chat:%s] storing value: [%s] = %s', message.chat.id, key, val);

        return bot.storage.set('memory', key, {'_': val}).then(() => bot.api.sendMessage({
            'chat_id': message.chat.id,
            'text': '[' + key + '] = ' + val,
        }));
    });

    bot.on('command.get', function ($evt, cmd, message) {
        let key = cmd.payload.trim();

        bot.logger.info('[chat:%s] getting value: [%s]', message.chat.id, key);

        return bot.storage.get('memory', key).then((obj) => {
            let val = obj._ || '<NULL>';
            return bot.api.sendMessage({
                'chat_id': message.chat.id,
                'text': '[' + key + '] = ' + val
            });
        });
    });

    bot.on('command.list', function ($evt, cmd, message) {
        bot.logger.info('[chat:%s] listing values', message.chat.id);

        return bot.storage.list('memory').then((list) => {
            let listText = list.map((obj) => '[' + obj.key + '] = ' + obj.value._).join('\n');
            return bot.api.sendMessage({
                'chat_id': message.chat.id,
                'text': listText || '<EMPTY>'
            });
        });
    });

    bot.on('command.del', function ($evt, cmd, message) {
        let key = cmd.payload.trim();

        bot.logger.info('[chat:%s] deleting value: [%s]', message.chat.id, key);

        return bot.storage.del('memory', key).then(() => bot.api.sendMessage({
            'chat_id': message.chat.id,
            'text': '[' + key + '] = <NULL>'
        }));
    });

    bot.on('command.empty', function ($evt, cmd, message) {
        let key = cmd.payload.trim();

        bot.logger.info('[chat:%s] emptying values', message.chat.id);

        return bot.storage.empty('memory').then(() => bot.api.sendMessage({
            'chat_id': message.chat.id,
            'text': '<EMPTY>'
        }));
    });
});
