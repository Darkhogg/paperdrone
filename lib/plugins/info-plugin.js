import Promise from 'bluebird';

import Plugin from '../plugin';
import utils from '../utils';


const INTERVAL = 5 * 60;

export default class InfoPlugin extends Plugin {
    constructor () {
        super('info', []);
    }

    async onEnable (bot, options) {
        let lastTime = this.time();
        let lastInfo = null;

        bot.info = async () => {
            let currTime = this.time();

            if (!lastInfo || currTime - lastTime >= INTERVAL) {
                lastTime = currTime;

                lastInfo = await bot.api.getMe();
                lastInfo.full_name = utils.fullName(lastInfo.first_name, lastInfo.last_name);
            }

            return lastInfo;
        };

        let info = await bot.info();
        this.logger.trace('bot info: @%s (%s) <#%s>', info.username, info.full_name, info.id);
    }

    time () {
        let t = process.hrtime();
        return t[0] + (t[1] * 1e-9);
    }
}
