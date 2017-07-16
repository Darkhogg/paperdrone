const fs = require('fs');
const path = require('path');

const utils = require('./utils');

const API = require('./api');
const Bot = require('./bot');
const Plugin = require('./plugin');

exports.plugins = {};
for (const plgFile of fs.readdirSync(path.join(__dirname, 'plugins'))) {
    const PluginCls = require(`./plugins/${plgFile}`);
    Bot.use(PluginCls);
    exports.plugins[PluginCls.name] = PluginCls;
}

/* Export bot creation main function */
exports.createBot = function createBot (token, options) {
    const bot = new Bot(token, options);
    bot.enable('updates', 'info');
    return bot;
};

/* Export utils */
exports.utils = utils;

/* Export classes */
exports.API = API;
exports.APIError = API.APIError;
exports.APIRequest = API.APIRequest;
exports.Bot = Bot;
exports.Plugin = Plugin
