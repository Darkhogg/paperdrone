import pd from '../..';

export default class EchoExPlg extends pd.Plugin {
    constructor () {
        super('ex/echo', ['messages']);
    }

    async onEnable (bot, options) {
        /* Register the update event of the bot */
        bot.on('message.text', async ($evt, message) => {
            this.logger.info({'message': message}, 'echoing back message: %s', message.text);

            /* Use the bot's API to return the message */
            return new pd.APIRequest('sendMessage', {
                'chat_id': message.chat.id,
                'text': message.text
            });
        });

        bot.api.on('request', async ($evt, method, data) => {
            this.logger.trace('request to API "%s"...', method);
        });

        bot.api.on('response', async ($evt, method, data, result) => {
            this.logger.trace('response from API "%s"', method);
        });
    }
};
