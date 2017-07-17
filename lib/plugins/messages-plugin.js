const Plugin = require('../plugin');
const utils = require('../utils');

module.exports = Plugin.define('messages', ['updates'], {
  async start (config) {
    /* When the bot sends an update, emit a *message* event of the given type */
    this.on('update', async ($evt, update) => {
      if (update.message) {
        const message = update.message;

        const msgType = utils.detectMessageType(message);
        const actionType = utils.detectActionType(message);

        message.from.full_name = utils.fullName(message.from.first_name, message.from.last_name);
        message.chat.full_name = message.chat.title || utils.fullName(message.chat.first_name, message.chat.last_name);

        this.bot.logger.trace({'message': message}, 'received "%s" from #%s', msgType || actionType, message.from.id);

        if (msgType) {
          return await this.bot.emit(['message', `message.${msgType}`], message, msgType);
        }

        if (actionType) {
          return await this.bot.emit(['action', `action.${actionType}`], message, msgType);
        }
      }
    });
  },
});
