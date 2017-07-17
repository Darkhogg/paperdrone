const Promise = require('bluebird');
const moment = require('moment');

const Plugin = require('../plugin');


class Scheduler {
  constructor (collection, logger) {
    this.collection = collection;
    this.logger = logger;
  }

  async schedule (key, time_, data) {
    const time = moment(time_);

    this.logger.trace('scheduling "%s" event for %s', key, time.format());
    await this.collection.insert({'key': key, 'time': time.toDate(), 'data': data});
  }

  async unschedule (...ids) {
    await this.collection.remove({'_id': {$in: [...ids]}});
  }

  async unscheduleAll (key) {
    const found = await this.list(key);
    const ids = found.map(obj => obj._id);
    await this.unschedule(...ids);
  }

  async list (key) {
    return await this.collection.find({'key': key});
  }
}


module.exports = Plugin.define('scheduler', ['ticking', 'mongo'], {
  async start (config) {
    const collection = await this.bot.mongo.collection('_scheduler_');
    const scheduler = new Scheduler(collection, this.logger);

    this.on('tick', async ($evt, when) => {
      const entries = await collection.find({'time': {$lt: when.toDate()}}).sort({'time': 1}).toArray();
      if (entries.length > 0) {
        this.logger.debug('found %s pending scheduled event(s)', entries.length);
      }

      await Promise.map(entries, async (entry) => {
        const time = moment(entry.time);
        this.logger.trace('triggering "%s" event due at %s', entry.key, time.format());

        await scheduler.unschedule(entry._id);
        await this.bot.emit(['scheduled', `scheduled.${entry.key}`], entry.key, time, entry.data);
      });
    });

    this.bot.scheduler = scheduler;
  },
});
