import pd from '../..';

const MESSAGE_BASE_TEXT = 'This is a message with an inline example keyboard!';

export default class InlineExPlg extends pd.Plugin {
    constructor () {
        super('ex/inline', ['queries']);
    }

    async onEnable (bot, options) {
        bot.on('inline', async ($evt, inline) => {
            let isoDate = (new Date()).toISOString();

            let results = (new Array(8)).fill(null).map((o, i) => ({
                'type': 'article',
                'id': isoDate + '_' + i,
                'title': '[' + inline.query + '] ' + isoDate + ' - #' + (i+1),
                'input_message_content': {
                    'message_text': 'Result *#' + (i+1) + '* from _' + isoDate + '_ for:\n' + inline.query,
                    'parse_mode': 'markdown',
                },
            }))

            return new pd.APIRequest('answerInlineQuery', {
                'inline_query_id': inline.id,
                'results': results,
                'cache_time': 60,
                'is_personal': true,
                'next_offset': '',
            })
        });

        bot.on('inline-chosen', async ($evt, inline) => {
            return new pd.APIRequest('sendMessage', {
                'chat_id': inline.from.id,
                'text': 'Responded to <code>' + inline.query + '</code> with <i>#' + inline.result_id + '</i>.',
                'parse_mode': 'html',
            });
        });
    }
};
