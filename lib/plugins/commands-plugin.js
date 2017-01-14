import Promise from 'bluebird';

import Plugin from '../plugin';


export default class Commands extends Plugin {
    constructor () {
        super('commands', ['info', 'messages']);
    }

    async onEnable (bot, options) {
        bot.on('message.text', async ($evt, message) => {
            let cmd;

            for (let entity of message.entities || []) {
                if (entity.type == 'bot_command' && entity.offset == 0) {
                    let entityText = message.text.substring(entity.offset, entity.length);
                    let atIdx = entityText.indexOf('@');

                    let cmd = message.command = {
                        'name': entityText.substring(1, atIdx < 0 ? undefined : atIdx).toLowerCase(),
                        'bot': atIdx < 0 ? null : entityText.substring(atIdx + 1),
                        'payload': message.text.substring(entity.length).trim(),
                    };

                    let info = await bot.info();
                    if (!cmd.bot || cmd.bot === info.username) {
                        this.logger.trace({'command': cmd, 'message': message}, 'received command: /%s -- %s', cmd.name, cmd.payload);
                        return await bot.emit(['command', 'command.'+cmd.name], cmd, message);
                    }
                }
            }
        });
    }
}
