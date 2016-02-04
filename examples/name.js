'use strict';
const pd = require('..');
const moment = require('moment');

moodule.exports = pd.Plugin.define('Example_Name', function (bot, options) {
    /* Add our dependencies */
    bot.addPlugin(new pd.plugins.MessagesPlugin());
    bot.addPlugin(new pd.plugins.CommandsPlugin());
    bot.addPlugin(new pd.plugins.PrompterPlugin());

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
});
