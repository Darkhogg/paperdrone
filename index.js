'use strict';
const pd = module.exports = {
    /* Export misc */
    utils: require('./dist/utils'),

    /* Export classes */
    API: require('./dist/api').default,
    APIError: require('./dist/api').APIError,
    APIRequest: require('./dist/api').APIRequest,
    Bot: require('./dist/bot').default,
    Plugin: require('./dist/plugin').default,

    /* Export built-in plugins */
    plugins: {
        CommandsPlugin: require('./dist/plugins/commands-plugin').default,
        HelpPlugin: require('./dist/plugins/help-plugin').default,
        InfoPlugin: require('./dist/plugins/info-plugin').default,
        StoragePlugin: require('./dist/plugins/storage-plugin').default,
        MessagesPlugin: require('./dist/plugins/messages-plugin').default,
        PrompterPlugin: require('./dist/plugins/prompter-plugin').default,
        PollingPlugin: require('./dist/plugins/polling-plugin').default,
        SchedulerPlugin: require('./dist/plugins/scheduler-plugin').default,
        TickerPlugin: require('./dist/plugins/ticker-plugin').default,
        UpdatesPlugin: require('./dist/plugins/updates-plugin').default,
        //UsersPlugin: require('./dist/plugins/users-plugin'),
    },

    /* Export bot creation main function */
    createBot (token, options) {
        let bot = new pd.Bot(token, options);

        /* Enable basic plugins */
        bot.enable('ticker', options);
        bot.enable('polling', options);
        bot.enable('updates', options);
        bot.enable('info', options);

        return bot;
    },
};


for (let plugin in pd.plugins) {
    bot.define(new pd.plugins[plugin]());
}
