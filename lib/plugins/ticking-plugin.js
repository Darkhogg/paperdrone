const moment = require('moment');
const Promise = require('bluebird');

const APIRequest = require('../api');
const Plugin = require('../plugin');
const utils = require('../utils');

module.exports = Plugin.define('ticking', [], {
    defaultConfig: {
        'interval': 0,
    },
}, {
    async start (config) {
        this.bot.tick = async (when_) => {
            const when = moment(when_) || moment();

            try {
                const $res = await this.bot.emit('tick', when);
                return $res.values.filter(v => v instanceof API.APIRequest);

            } catch (err) {
                this.logger.error({ 'err': err }, 'Error while processing tick at %s:', when, err);
            }
        }

        if (config.interval) {
            const _tick = async () => {
                const requests = await this.bot.tick();
                await Promise.map(requests, async request => await this.api.sendRequest(request), {'concurrency': 1});
            }
            process.nextTick(_tick);

            this.tickLoopInterval = setInterval(_tick, config.interval * 1000);
        }
    },

    async stop (config) {
        clearInterval(this.tickLoopInterval);
    }
});
