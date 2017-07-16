const Promise = require('bluebird');

const Plugin = require('../plugin');
const utils = require('../utils');


module.exports = Plugin.define('updates', [], {
    async start (options) {
        this.on('raw-update', async ($evt, upd) => {
            const updid = upd.update_id;
            this.logger.trace({'update': upd}, 'received raw update:', updid);

            // TODO
            return await this.bot.emit('update', upd);
        })
    },
});
