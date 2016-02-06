'use strict';
const Promise = require('bluebird');
const moment = require('moment');

const Plugin = require('../plugin');
const MessagesPlugin = require('./messages-plugin');

class Scheduler {
    constructor (owner, options) {
        this.owner = owner;

        let collName = (options.scheduler && options.scheduler.collection)
            ? options.scheduler.collection
            : 'pd_' + owner + '_scheduler';

        this.mongo = options.mongo.client.collection(collName);

        this.logger = options.logger;
        this._order = Date.now();
    }


    schedule (key, time_, data) {
        var time = moment(time_);

        this.logger.debug('[Scheduler]  scheduling "%s" event for %s', key, time.format());
        return this.mongo.save({ 'key': key, 'time': time.toDate(), 'data': data });
    }

    unschedule (key, time) {
        var query = { 'key': key };
        if (time) {
            query.time = moment(time).toDate();
        }

        return this.mongo.remove(query);
    }

    list (key) {
        return this.mongo.find({ 'key': key }).toArray((found) => found.map((obj) => {
            delete obj._id;
            return obj;
        }));
    }
}

module.exports = Plugin.define('Scheduler', function (bot, options) {
    bot.scheduler = new Scheduler(bot.id, options || {});

    bot.on('tick', function ($evt, when) {
        return bot.scheduler.mongo.find({ 'time': {$lt: when.toDate()} }, {}, {sort: { 'time': 1 }}).then((entries) => {
            if (entries.length > 0) {
                bot.logger.debug('[Scheduler]  found %s pending scheduled event(s)', entries.length);
            }

            return Promise.map(entries, function (entry) {
                let time = moment(entry.time);
                bot.logger.silly('[Scheduler]  triggering "%s" event due at %s', entry.key, time.format())

                /* Remove the object from the database */
                return bot.scheduler.mongo.remove({ _id: entry._id })
                    .then(() => bot.emit(['scheduled', 'scheduled.'+entry.key], entry.key, time, entry.data));
            }, {concurrency: 1});

        });
    });
});
