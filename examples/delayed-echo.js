const pd = require('..');
const moment = require('moment');

module.exports = pd.Plugin.define('ex.delayed_echo', ['messages', 'commands', 'scheduler'], {
  async start (config) {
    /* Register the update event of the bot */
    this.on('message.text', async ($evt, message) => {
      /* Schedule the echo half a minute from now */
      if (!message.command || message.command.name !== 'list') {
        return await this.bot.scheduler.schedule('echo', moment().add(10, 'seconds'), {'chat': message.chat.id, 'text': message.text});
      }
    });

    this.on('scheduled.echo', async ($evt, type, when, data) => {
      /* Use the bot's API to return the message */
      await this.api.sendMessage({
        'chat_id': data.chat,
        'text': data.text,
      });
    });

    this.on('command.list', async ($evt, cmd, message) => {
      const list = await this.bot.scheduler.list('echo');
      const strList = list
        .filter((entry) => entry.data.chat == message.chat.id)
        .map((entry) => moment(entry.time).format() + ' -- ' + entry.data.text)
        .join('\n');

      await this.api.sendMessage({'chat_id': message.chat.id, 'text': strList || 'nothing scheduled'});
    });
  },
});
