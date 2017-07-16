const Promise = require('bluebird');

const Plugin = require('../plugin');


module.exports = Plugin.define('help', ['commands'], {
    defaultConfig: {
        'commands': ['help'],
        'parse_mode': 'markdown',
        'disable_web_page_preview': true,
        'disable_notification': false,
    },

    whitelistConfig: [
        'commands', 'text', 'parse_mode', 'disable_web_page_preview', 'disable_notification'
    ],
}, {
    async start (config) {
        const commands = new Set(this.config.commands || ['help']);

        this.on('command', async ($evt, cmd, msg) => {
            /* Check if the help text has been set up and the command is in the list */
            if (config.commands.has(cmd.name)) {
                bot.logger.info('sending help message on /%s command to <#%s, %s>', cmd.name, msg.chat.id, msg.chat.full_name);

                $evt.stop();
                return await this.sendHelp(msg.chat.id);
            }
        });
    },

    async sendHelp (chatId) {
        return await this.api.sendMessage(Object.assign(this.config, {
            'commands': undefined,
            'chat_id': chatId,
        }));
    },
});
