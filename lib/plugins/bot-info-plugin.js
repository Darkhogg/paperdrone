var Promise = require('bluebird');

var Plugin = require('../plugin');

var INTERVAL = 300000;

module.exports = Plugin.define('BotInfo', function (bot, options) {
    var log = options.logger;

    var lastTime = Date.now() - INTERVAL;
    var lastPromise = null;

    bot.info = function info () {
        if (Date.now() - lastTime >= INTERVAL) {
            lastPromise = bot.api.getMe().then(function (resp) {
                var me = resp.result;
                me.full_name = ((me.first_name||'') + ' ' + (me.last_name||'')).trim();

                return me;
            });
        }

        return Promise.cast(lastPromise);
    };
});
