'use strict';
const Promise = require('bluebird');

const Plugin = require('../plugin');
const utils = require('../utils');

module.exports = Plugin.define('Messages', function (bot, options) {
    /* When the bot sends an update, emit a *message* event of the given type */
    bot.on('update', function ($evt, update) {
        let message = update.message;
        let type = utils.detectMessageType(message);

        let username = message.from.username || '~';
        message.from.full_name = [message.from.first_name, message.from.last_name].join(' ').trim();
        message.chat.full_name = message.chat.title || message.from.full_name;

        bot.logget.debug('[Messages]  received "%s" from #%s (@%s, %s) on <#%s, %s>: ',
            type, message.from.id, username, message.from.full_name, message.chat.id, message.chat.full_name, message.text);
        return bot.emit(['message', 'message.'+type], message, type);
    });
});
