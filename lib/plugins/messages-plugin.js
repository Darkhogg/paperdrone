'use strict';
const Promise = require('bluebird');

const Plugin = require('../plugin');
const utils = require('../utils');

module.exports = Plugin.define('Messages', function (bot, options) {
    /* When the bot sends an update, emit a *message* event of the given type */
    bot.on('update', function ($evt, update) {
        let message = update.message;

        let msgType = utils.detectMessageType(message);
        let actionType = utils.detectActionType(message);

        let username = message.from.username || '~';
        message.from.full_name = [message.from.first_name, message.from.last_name].join(' ').trim();
        message.chat.full_name = message.chat.title || message.from.full_name;

        bot.logger.debug('[Messages]  received "%s" from #%s (@%s, %s) on <#%s, %s>: ',
            msgType, message.from.id, username, message.from.full_name, message.chat.id, message.chat.full_name, message.text||'');

        if (msgType) {
            return bot.emit(['message', 'message.'+msgType], message, msgType);
        }
        if (actionType) {
            return bot.emit(['action', 'action.'+actionType], message, msgType);
        }
    });
});
