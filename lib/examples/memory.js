import pd from '../..';

export default class MemoryExPlg extends pd.Plugin {
    constructor () {
        super('ex/memory', ['commands', 'storage']);
    }

    async onEnable (bot, options) {
        let storage = bot.storage('memory');

        bot.on('command.set', async ($evt, cmd, message) => {
            let idx = cmd.payload.search(/\s/);

            let key = cmd.payload.substring(0, idx);
            let val = cmd.payload.substring(idx).trim();

            this.logger.info({ 'chat': message.chat.id }, 'storing value: [%s] = %s', key, val);

            await storage.upsert(key, { 'value': val })
            return new pd.APIRequest('sendMessage', {
                'chat_id': message.chat.id,
                'text': '[' + key + '] = ' + val,
            });
        });

        bot.on('command.get', async ($evt, cmd, message) => {
            let key = cmd.payload.trim();

            this.logger.info({ 'chat': message.chat.id }, 'getting value: [%s]', key);

            let obj = await storage.fetch(key);
            let val = obj ? obj.value : '<NULL>';
            return new pd.APIRequest('sendMessage', {
                'chat_id': message.chat.id,
                'text': '[' + key + '] = ' + val
            });
        });

        bot.on('command.list', async ($evt, cmd, message) => {
            this.logger.info({ 'chat': message.chat.id }, 'listing values');

            let list = await storage.list(0, null, { 'id': 1 });
            let listText = list.map((obj) => '[' + obj.id + '] = ' + obj.value).join('\n');
            return new pd.APIRequest('sendMessage', {
                'chat_id': message.chat.id,
                'text': listText || '<EMPTY>'
            });
        });

        bot.on('command.del', async ($evt, cmd, message) => {
            let key = cmd.payload.trim();

            this.logger.info({ 'chat': message.chat.id }, 'deleting value: [%s]', key);

            await storage.delete(key)
            return new pd.APIRequest('sendMessage', {
                'chat_id': message.chat.id,
                'text': '[' + key + '] = <NULL>'
            });
        });
    }
}
