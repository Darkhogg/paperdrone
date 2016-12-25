import Promise from 'bluebird';

import Plugin from '../plugin';


export default class Commands extends Plugin {
    constructor () {
        super('commands', ['info', 'messages']);
    }

    async onEnable (bot, options) {
        bot.on('message.text', async ($evt, message) => {
            let match = message.text.match(/^\/([a-zA-Z0-9_]{1,32})(?:\@([a-zA-Z0-9_]+))?\s*(.*)$/);
            if (!match) return;

            let cmd = message.command = {
                name: match[1],
                bot: match[2],
                payload: match[3]
            };


            let info = await bot.info();
            if (!cmd.bot || cmd.bot === info.username) {
                this.logger.trace({'command': cmd, 'message': message}, 'received command: /%s -- %s', cmd.name, cmd.payload);
                return await bot.emit(['command', 'command.'+cmd.name], cmd, message);
            }
        });
    }
}
