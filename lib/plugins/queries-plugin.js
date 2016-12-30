'use strict';
import Promise from 'bluebird';

import Plugin from '../plugin';
import utils from '../utils';

export default class MessagesPlugin extends Plugin {
    constructor () {
        super('queries', ['updates']);
    }

    async onEnable (bot, options) {
        /* When the bot sends an update, emit a *query* event of the given type */
        bot.on('update', ($evt, update) => {
            if (update.inline_query) {
                let inline = update.inline_query;

                let username = inline.from.username || '~';
                inline.from.full_name = utils.fullName(inline.from.first_name, inline.from.last_name);

                bot.logger.trace({'inline_query': inline}, 'received inline query from #%s', inline.from.id);

                return bot.emit(['inline'], inline);
            }

            if (update.chosen_inline_result) {
                let result = update.chosen_inline_result;

                let username = result.from.username || '~';
                result.from.full_name = utils.fullName(result.from.first_name, result.from.last_name);

                bot.logger.trace({'inline_chosen': result}, 'received chosen inline result from #%s', result.from.id);

                return bot.emit(['inline-chosen'], result);
            }

            if (update.callback_query) {
                let callback = update.callback_query;

                let username = callback.from.username || '~';
                callback.from.full_name = utils.fullName(callback.from.first_name, callback.from.last_name);
                callback.message.from.full_name = utils.fullName(callback.message.from.first_name,callback.message.from.last_name);
                callback.message.chat.full_name = callback.message.chat.title || utils.fullName(callback.message.chat.first_name,callback.message.chat.last_name);

                bot.logger.trace({'callback_query': callback}, 'received callback query from #%s', callback.from.id);

                return bot.emit(['callback'], callback);
            }
        });
    }
}
