import Promise from 'bluebird';

import Plugin from '../plugin';
import utils from '../utils';


export default class UpdatesPlugin extends Plugin {
    constructor () {
        super('updates', []);
    }

    async onEnable (bot, options) {
        bot.on('raw-update', async ($evt, upd) => {
            let updid = upd.update_id;
            this.logger.trace({'update': upd}, 'received raw update:', updid);

            // TODO
            return await bot.emit('update', upd);
        })
    }
}
