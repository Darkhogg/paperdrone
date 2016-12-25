import pd from'../..';
import moment from'moment';


export default class MemoryExPlg extends pd.Plugin {
    constructor () {
        super('ex/name', ['messages', 'commands', 'prompter']);
    }

    async onEnable (bot, options) {
        bot.on('command.start', async ($evt, cmd, msg) => {
            await bot.prompter.prompt(msg.chat.id, msg.from.id, 'name');
            await bot.prompter.prompt(msg.chat.id, msg.from.id, 'age');
        });

        /* Name prompt setup */
        bot.on('prompt.request.name', async ($evt, prompt) => {
            await bot.api.sendMessage({
                'chat_id': prompt.chat,
                'text': 'Tell me your name'
            });
        });

        bot.on('prompt.complete.name', async ($evt, prompt, result) => {
            await bot.api.sendMessage({
                'chat_id': prompt.chat,
                'text': 'Hello, ' + result.text + '!'
            });
        });

        /* Age prompt setup */
        bot.on('prompt.request.age', async ($evt, prompt) => {
            await bot.api.sendMessage({
                'chat_id': prompt.chat,
                'text': 'Tell me your age'
            });
        });

        bot.on('prompt.complete.age', async ($evt, prompt, result) => {
            await bot.api.sendMessage({
                'chat_id': prompt.chat,
                'text': 'Hello, ' + result.text + ' years old person!'
            });
        });
    }
}
