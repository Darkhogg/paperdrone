const Plugin = require('../plugin');
const utils = require('../utils');

module.exports = Plugin.define('callbacks', ['updates', 'info'], {
  async start (bot, options) {
    /* When the bot sends an update, emit a *query* event of the given type */
    this.on('update', ($evt, update) => {
      if (update.callback_query) {
        const callback = update.callback_query;
        callback.from.full_name = utils.fullName(callback.from.first_name, callback.from.last_name);
        callback.message.from.full_name = utils.fullName(callback.message.from.first_name, callback.message.from.last_name);
        callback.message.chat.full_name = callback.message.chat.title || utils.fullName(callback.message.chat.first_name, callback.message.chat.last_name);

        this.logger.trace({'callback_query': callback}, 'received callback query from #%s', callback.from.id);

        const eventNames = ['callback'];

        if ((callback.data || '').indexOf('\0') > 0) {
          const dataCmd = callback.data.split('\0', 1)[0];
          const dataPload = callback.data.substring(dataCmd.length + 1);

          callback.data_command = dataCmd;
          callback.data_payload = dataPload;

          eventNames.push(`callback.${dataCmd}`);
        }

        return this.bot.emit(eventNames, callback);
      }
    });
  },
});
