const Plugin = require('../plugin');
const utils = require('../utils');

module.exports = Plugin.define('inline', ['updates', 'info'], {
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
    });
  },
});
