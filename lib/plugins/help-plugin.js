const EEE = require('enhanced-event-emitter');

const Plugin = require('../plugin');


module.exports = Plugin.define('help', ['commands', 'info'], {
  defaultConfig: {
    'commands': ['help'],
    'parse_mode': 'markdown',
    'disable_web_page_preview': true,
    'disable_notification': false,
  },

  whitelistConfig: [
    'commands', 'text', 'parse_mode', 'disable_web_page_preview', 'disable_notification',
  ],
}, {
  async start (config) {
    this.config = config;
    const commands = new Set(config.commands);

    this.on('command', async ($evt, cmd, msg) => {
      /* Check if the help text has been set up and the command is in the list */
      if (commands.has(cmd.name)) {
        this.logger.info('sending help message on /%s command to <#%s, %s>', cmd.name, msg.chat.id, msg.chat.full_name);

        $evt.stop();
        return await this.sendHelp(msg.chat.id);
      }
    }, EEE.PRIORITY.HIGHEST);
  },

  async sendHelp (chatId) {
    const info = await this.bot.info();

    const messageParams = Object.assign(this.config, {
      'commands': undefined,
      'chat_id': chatId,
      'text': this.config.text.replace(/%%USERNAME%%/g, info.username),
    });

    return await this.api.sendMessage(messageParams);
  },
});
