import Promise from 'bluebird';

import {APIRequest} from '../api';
import Plugin from '../plugin';
import utils from '../utils';


export default class PollingPlugin extends Plugin {
    constructor () {
        super('polling', []);
    }

    async onEnable (bot, options) {
        let nextPollId = 0;

        let lastPollId = -1;
        bot.pollUpdates = async (timeout=0, proc=true) => {
            if (lastPollId !== nextPollId) {
                this.logger.trace('polling for updates (starting at %s)...', nextPollId);
            }

            try {
                let updates = (await bot.api.getUpdates({'offset': nextPollId, 'timeout': timeout})).result;
                lastPollId = nextPollId;

                if (proc && updates.length > 0) {
                    this.logger.trace('received %s update(s)', updates.length);

                    for (let update of updates) {
                        try {
                            nextPollId = Math.max(nextPollId, update.update_id + 1);

                            let $res = await bot.emit('raw-update', update);

                            for (let value of $res.values) {
                                if (value instanceof APIRequest) {
                                    await bot.api.sendRequest(value);
                                }
                            }
                        } catch (err) {
                            this.logger.error({ 'err': err }, 'Error while processing update %s:', update.update_id, err);
                        }
                    }
                }
            } catch (err) {
                this.logger.error({ 'err': err }, 'Error while obtaining updates:', update.update_id, err);
            }
        };

        let currentPollLoopId = null;
        bot.startPolling = async function (timeout=1) {
            let errorCount = 0;
            let delayTime = 500;

            let pollLoopId = Date.now();
            currentPollLoopId = pollLoopId;

            let _iter = async () => {
                await this.api.deleteWebhook();
                await this.pollUpdates(timeout);

                if (currentPollLoopId === pollLoopId) {
                    process.nextTick(_iter);
                } else {
                    await this.pollUpdates(0, false);
                }
            };

            process.nextTick(_iter);
        }
        bot.stopPolling = function () {
            currentPollLoopId = null;
        }
    }
}
