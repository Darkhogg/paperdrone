const pd = require('..');

const MESSAGE_BASE_TEXT = 'This is a message with an inline example keyboard!';


module.exports = pd.Plugin.define('ex/callbacks', ['commands', 'queries'], {
    async start (config) {
        /* The /start command will generate the default message */
        this.on('command.start', async ($evt, cmd, msg) => {
            return new pd.APIRequest('sendMessage', {
                'chat_id': msg.chat.id,
                'text': MESSAGE_BASE_TEXT + '\nPress a button...',
                'reply_markup': {
                    'inline_keyboard': [[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
                        'text': ' '+n+' ', 'callback_data': String(n),
                    }))]
                },
            })
        });

        this.on('callback', async ($evt, callback) => {
            return new pd.APIRequest('editMessageText', {
                'chat_id': callback.message.chat.id,
                'message_id': callback.message.message_id,
                'text': MESSAGE_BASE_TEXT + '\nPressed button *' + callback.data + '*.',
                'parse_mode': 'markdown',
                'reply_markup': {
                    'inline_keyboard': [[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
                        'text': callback.data == n ? '('+n+')' : ' '+n+' ', 'callback_data': String(n),
                    }))]
                },
            })
        });
    }
});
