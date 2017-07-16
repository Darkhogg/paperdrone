const Promise = require('bluebird');

const Plugin = require('../plugin');


module.exports = Plugin.define('commands', ['info', 'messages'], {
    async start (config) {
        this.on('message.text', async ($evt, message) => {
            const info = await this.bot.info();

            for (const entity of message.entities || []) {
                if (entity.type == 'bot_command' && entity.offset == 0) {
                    const entityText = message.text.substring(entity.offset, entity.length);
                    const atIdx = entityText.indexOf('@');

                    const cmd = message.command = {
                        'name': entityText.substring(1, atIdx < 0 ? undefined : atIdx).toLowerCase(),
                        'bot': atIdx < 0 ? null : entityText.substring(atIdx + 1),
                        'payload': message.text.substring(entity.length).trim(),
                    };

                    if (!cmd.bot || cmd.bot === info.username) {
                        this.logger.trace({'command': cmd, 'message': message}, 'received command: /%s -- %s', cmd.name, cmd.payload);
                        return await this.bot.emit(['command', 'command.'+cmd.name], cmd, message);
                    }
                }
            }
        });
    },
});
