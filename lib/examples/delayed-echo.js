import pd from '../..';
import moment from 'moment';

export default class DelayedEchoExPlg extends pd.Plugin {
    constructor () {
        super('ex/delayed-echo', ['messages', 'commands', 'scheduler']);
    }

    async onEnable (bot, options) {
        /* Register the update event of the bot */
        bot.on('message.text', async ($evt, message) => {
            /* Schedule the echo half a minute from now */
            if (!message.command || message.command.name !== 'list') {
                return await bot.scheduler.schedule('echo', moment().add(30, 'seconds'), { 'chat': message.chat.id, 'text': message.text });
            }
        });

        bot.on('scheduled.echo', async ($evt, type, when, data) => {
            /* Use the bot's API to return the message */
            await bot.api.sendMessage({
                'chat_id': data.chat,
                'text': data.text
            });
        });

        bot.on('command.list', async ($evt, cmd, message) => {
            let list = await bot.scheduler.list('echo');
            let strList = list
                .filter((entry) => entry.data.chat == message.chat.id)
                .map((entry) => moment(entry.time).format() + ' -- ' + entry.data.text)
                .join('\n');

            await bot.api.sendMessage({'chat_id': message.chat.id, 'text': strList || 'nothing scheduled'});
        });
    }
}
