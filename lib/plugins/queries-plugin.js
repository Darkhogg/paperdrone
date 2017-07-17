const Plugin = require('../plugin');
const utils = require('../utils');

module.exports = Plugin.define('queries', ['updates', 'info'], {
  async start (bot, options) {
    /* When the bot sends an update, emit a *query* event of the given type */
    this.on('update', ($evt, update) => {
      if (update.inline_query) {
        const inline = update.inline_query;
        inline.from.full_name = utils.fullName(inline.from.first_name, inline.from.last_name);

        this.logger.trace({'inline_query': inline}, 'received inline query from #%s', inline.from.id);

        return this.bot.emit(['inline'], inline);
      }

      if (update.chosen_inline_result) {
        const result = update.chosen_inline_result;
        result.from.full_name = utils.fullName(result.from.first_name, result.from.last_name);

        this.logger.trace({'inline_chosen': result}, 'received chosen inline result from #%s', result.from.id);

        return this.bot.emit(['inline-chosen'], result);
      }

      if (update.callback_query) {
        const callback = update.callback_query;
        callback.from.full_name = utils.fullName(callback.from.first_name, callback.from.last_name);
        callback.message.from.full_name = utils.fullName(callback.message.from.first_name, callback.message.from.last_name);
        callback.message.chat.full_name = callback.message.chat.title || utils.fullName(callback.message.chat.first_name, callback.message.chat.last_name);

        this.logger.trace({'callback_query': callback}, 'received callback query from #%s', callback.from.id);

        return this.bot.emit(['callback'], callback);
      }
    });
  },
});
