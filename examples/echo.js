const pd = require('..');

module.exports = pd.Plugin.define('ex.echo', ['messages'], {
  async start (config) {
    /* Register the update event of the bot */
    this.on('message.text', async ($evt, message) => {
      this.logger.info({'message': message}, 'echoing back message: %s', message.text);

      /* Use the bot's API to return the message */
      return new pd.APIRequest('sendMessage', {
        'chat_id': message.chat.id,
        'text': message.text,
      });
    });
  },
});
