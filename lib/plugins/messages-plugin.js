'use strict';
import Promise from 'bluebird';

import Plugin from '../plugin';
import utils from '../utils';

export default class MessagesPlugin extends Plugin {
    constructor () {
        super('messages', ['updates']);
    }

    async onEnable (bot, options) {
        /* When the bot sends an update, emit a *message* event of the given type */
        bot.on('update', ($evt, update) => {
            let message = update.message;

            let msgType = utils.detectMessageType(message);
            let actionType = utils.detectActionType(message);

            let username = message.from.username || '~';
            message.from.full_name = utils.fullName(message.first_name, message.last_name);
            message.chat.full_name = message.chat.title || message.from.full_name;

            bot.logger.trace({'message': message}, 'received "%s" from #%s', msgType||actionType, message.from.id);

            if (msgType) {
                return bot.emit(['message', 'message.'+msgType], message, msgType);
            }

            if (actionType) {
                return bot.emit(['action', 'action.'+actionType], message, msgType);
            }
        });
    }
}
