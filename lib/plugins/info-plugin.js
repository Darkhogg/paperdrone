const Promise = require('bluebird');

const Plugin = require('../plugin');
const utils = require('../utils');


const INTERVAL = 5 * 60;


module.exports = Plugin.define('info', [], {
    async start (config) {
        let lastTime = this.time();
        let lastInfo = null;

        this.bot.info = async () => {
            const currTime = this.time();

            if (!lastInfo || currTime - lastTime >= INTERVAL) {
                lastTime = currTime;

                lastInfo = await this.bot.api.getMe();
                lastInfo.full_name = utils.fullName(lastInfo.first_name, lastInfo.last_name);
            }

            return lastInfo;
        };
    },

    time () {
        const t = process.hrtime();
        return t[0] + (t[1] * 1e-9);
    },
});
