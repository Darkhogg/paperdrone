import Promise from 'bluebird';
import moment from 'moment';

import Plugin from '../plugin';
import MessagesPlugin from './messages-plugin';


class Scheduler {
    constructor (bot, options, logger) {
        this.bot = bot;
        this.storage = bot.storage('_scheduler_');
        this.logger = logger;
    }

    async schedule (key, time_, data) {
        var time = moment(time_);

        this.logger.trace('scheduling "%s" event for %s', key, time.format());
        return await this.storage.insert(null, { 'key': key, 'time': time.toDate(), 'data': data });
    }

    async unschedule (...ids) {
        await this.storage.delete(...ids);
    }

    async unscheduleAll (key) {
        let found = await this.list(key);
        let ids = found.map(obj => obj.id);
        await this.unschedule(...ids);
    }

    async list (key) {
        return await this.storage.query({ 'key': key });
    }
}


export default class SchedulerPlugin extends Plugin {
    constructor () {
        super('scheduler', ['ticker', 'storage']);
    }

    async onEnable (bot, options) {
        bot.scheduler = new Scheduler(bot, options || {}, this.logger);

        bot.on('tick', async ($evt, when) => {
            let entries = await bot.scheduler.storage.query({ 'time': {$lt: when.toDate()} }, 0, null, { 'time': 1 });
            if (entries.length > 0) {
                this.logger.debug('found %s pending scheduled event(s)', entries.length);
            }

            for (let entry of entries) {
                let time = moment(entry.time);
                this.logger.trace('triggering "%s" event due at %s', entry.key, time.format());

                await bot.scheduler.storage.delete(entry.id);
                await bot.emit(['scheduled', 'scheduled.'+entry.key], entry.key, time, entry.data);
            }
        });
    }
}
