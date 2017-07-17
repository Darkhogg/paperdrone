const pd = require('..');

module.exports = pd.Plugin.define('ex/memory', ['commands', 'mongo'], {
  async start (config) {
    const collection = this.bot.mongo.collection('memory');

    this.on('command.set', async ($evt, cmd, message) => {
      const idx = cmd.payload.search(/\s/);

      const key = cmd.payload.substring(0, idx);
      const val = cmd.payload.substring(idx).trim();

      this.logger.info({'chat': message.chat.id}, 'storing value: [%s] = %s', key, val);

      await collection.update({'_id': key}, {$set: {'value': val}}, {'upsert': true});
      return new pd.APIRequest('sendMessage', {
        'chat_id': message.chat.id,
        'text': `[${key}] = ${val}`,
      });
    });

    this.on('command.get', async ($evt, cmd, message) => {
      const key = cmd.payload.trim();

      this.logger.info({'chat': message.chat.id}, 'getting value: [%s]', key);

      const obj = await collection.findOne({'_id': key});
      const val = obj ? obj.value : '<NULL>';
      return new pd.APIRequest('sendMessage', {
        'chat_id': message.chat.id,
        'text': `[${key}] = ${val}`,
      });
    });

    this.on('command.list', async ($evt, cmd, message) => {
      this.logger.info({'chat': message.chat.id}, 'listing values');

      const list = await collection.find().sort({'id': 1}).toArray();
      const listText = list.map((obj) => `[${obj._id}] = ${obj.value}`).join('\n');
      return new pd.APIRequest('sendMessage', {
        'chat_id': message.chat.id,
        'text': listText || '<EMPTY>',
      });
    });

    this.on('command.del', async ($evt, cmd, message) => {
      const key = cmd.payload.trim();

      this.logger.info({'chat': message.chat.id}, 'deleting value: [%s]', key);

      await collection.remove({'_id': key});
      return new pd.APIRequest('sendMessage', {
        'chat_id': message.chat.id,
        'text': `[${key}] = <NULL>`,
      });
    });
  },
});
