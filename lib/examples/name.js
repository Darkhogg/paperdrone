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

        /* Allow users to cancel the prompt */
        bot.on('prompt.response', async ($evt, prompt, response) => {
            if (response.text.indexOf('/cancel') === 0) {
                $evt.stop();
                return pd.plugins.PrompterPlugin.PROMPT_CANCEL;
            }
        }, -100);

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
                'text': 'Hello, ' + result + '!'
            });
        });

        /* Age prompt setup */
        bot.on('prompt.request.age', async ($evt, prompt) => {
            await bot.api.sendMessage({
                'chat_id': prompt.chat,
                'text': 'Tell me your age'
            });
        });

        bot.on('prompt.response.age', async ($evt, prompt, response) => {
            let age = parseInt(response.text);
            if (isNaN(age) || age <= 0) {
                await bot.api.sendMessage({
                    'chat_id': prompt.chat,
                    'text': 'That\'s not an age!'
                });
                return pd.plugins.PrompterPlugin.PROMPT_REPEAT;
            }

            return age;
        });

        bot.on('prompt.complete.age', async ($evt, prompt, result) => {
            await bot.api.sendMessage({
                'chat_id': prompt.chat,
                'text': 'Hello, ' + result + ' years old person!'
            });
        });
    }
}
