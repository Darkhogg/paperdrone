import moment from 'moment';
import Promise from 'bluebird';

import {APIRequest} from '../api';
import Plugin from '../plugin';
import utils from '../utils';

export default class TickerPlugin extends Plugin {
    constructor () {
        super('ticker', []);
    }

    async onEnable (bot, options) {
        bot.tick = async (when_) => {
            var when = moment(when_) || moment();

            try {
                let $res = await bot.emit('tick', when);

                for (let value of $res.values) {
                    if (value instanceof APIRequest) {
                        await bot.api.sendRequest(value);
                    }
                }

            } catch (err) {
                this.logger.error({ 'err': err }, 'Error while processing tick at %s:', when, err);
            }
        }

        let tickLoopInterval;
        bot.startTicking = function (interval_) {
            this.stopTicking();

            let interval = Math.ceil(interval_ || 60) * 1000;

            let _tick = this.tick.bind(this);

            process.nextTick(_tick);
            tickLoopInterval = setInterval(_tick, interval);
        };
        bot.stopTicking = function () {
            clearInterval(tickLoopInterval);
        };
    }
}
