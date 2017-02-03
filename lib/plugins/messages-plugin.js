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
        bot.on('update', async ($evt, update) => {
            if (update.message) {
                let message = update.message;

                let msgType = utils.detectMessageType(message);
                let actionType = utils.detectActionType(message);

                let username = message.from.username || '~';
                message.from.full_name = utils.fullName(message.from.first_name, message.from.last_name);
                message.chat.full_name = message.chat.title || utils.fullName(message.chat.first_name, message.chat.last_name);

                bot.logger.trace({'message': message}, 'received "%s" from #%s', msgType||actionType, message.from.id);

                if (msgType) {
                    return await bot.emit(['message', `message.${msgType}`], message, msgType);
                }

                if (actionType) {
                    return await bot.emit(['action', `action.${actionType}`], message, msgType);
                }
            }
        });
    }
}
