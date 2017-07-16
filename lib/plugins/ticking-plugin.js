const moment = require('moment');
const Promise = require('bluebird');

const APIRequest = require('../api');
const Plugin = require('../plugin');
const utils = require('../utils');

module.exports = Plugin.define('ticking', [], {
    defaultConfig: {
        'interval': 60,
    },
}, {
    async start (config) {
        this.bot.tick = async (when_) => {
            const when = moment(when_) || moment();

            try {
                const $res = await this.bot.emit('tick', when);

                for (const value of $res.values) {
                    if (value instanceof API.APIRequest) {
                        await this.api.sendRequest(value);
                    }
                }

            } catch (err) {
                this.logger.error({ 'err': err }, 'Error while processing tick at %s:', when, err);
            }
        }

        const _tick = this.bot.tick.bind(this);
        process.nextTick(_tick);

        this.tickLoopInterval = setInterval(_tick, config.interval * 1000);
    },

    async stop (config) {
        clearInterval(this.tickLoopInterval);
    }
});
