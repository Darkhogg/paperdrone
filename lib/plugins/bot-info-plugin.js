'use strict';
const Promise = require('bluebird');

const Plugin = require('../plugin');

const INTERVAL = 300000;

module.exports = Plugin.define('BotInfo', function (bot, options) {
    let log = options.logger;

    let lastTime = Date.now() - INTERVAL;
    let lastPromise = null;

    bot.info = function info () {
        if (Date.now() - lastTime >= INTERVAL) {
            lastPromise = bot.api.getMe().then(function (resp) {
                let me = resp.result;
                me.full_name = ((me.first_name||'') + ' ' + (me.last_name||'')).trim();

                return me;
            });
        }

        return Promise.cast(lastPromise);
    };
});
