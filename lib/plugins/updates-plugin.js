const Promise = require('bluebird');

const API = require('../api');
const Plugin = require('../plugin');
const utils = require('../utils');


module.exports = Plugin.define('updates', [], {
    async start (options) {
        const logger = this.logger;
        this.bot.update = async function (upd) {
            const updid = upd.update_id;
            logger.trace({'update': upd}, 'received raw update:', updid);

            const $res = await this.emit('update', upd);
            return $res.values.filter(v => v instanceof API.APIRequest);
        };
    },
});
