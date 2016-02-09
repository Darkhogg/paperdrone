'use strict';
const pd = require('..');
const moment = require('moment');
const mongodb = require('mongodb-bluebird');
const winston = require('winston');

module.exports = pd.Plugin.define('Example_DelayedEcho', (bot, options) => {
    /* Add our dependencies */
    bot.addPlugin(new pd.plugins.MessagesPlugin());
    bot.addPlugin(new pd.plugins.CommandsPlugin());
    bot.addPlugin(new pd.plugins.SchedulerPlugin());

    /* Register the update event of the bot */
    bot.on('message.text', function ($evt, message) {
        /* Schedule the echo for a mine from now */
        return bot.scheduler.schedule('echo', moment().add(30, 'seconds'), { 'chat': message.chat.id, 'text': message.text });
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
            let strList = list
                .filter((entry) => entry.data.chat == message.chat.id)
                .map((entry) => moment(entry.time).format() + ' -- ' + entry.data.text)
                .join('\n');

            return bot.api.sendMessage({'chat_id': message.chat.id, 'text': strList || 'nothing scheduled'});
        });
    });
});
