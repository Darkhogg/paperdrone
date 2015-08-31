var Promise = require('bluebird');
var moment = require('moment');

var Plugin = require('../plugin');

var MessagesPlugin = require('./messages-plugin');

function Scheduler (owner, options) {
    this.owner = owner;

    var collName = (options.storage && options.storage.collection)
        ? options.storage.collection
        : 'paperdrone_scheduler_' + owner;

    this.mongo = options.mongo.client.collection(collName);

    this.logger = options.logger;
}

Scheduler.prototype.schedule = function (key, time_, data) {
    var self = this;

    var time = moment(time_);

    self.logger.verbose('[Scheduler] scheduling a "%s" event for %s', key, time.format());

    return self.mongo.save({ 'key': key, 'time': time.toDate(), 'data': data });
};

Scheduler.prototype.unschedule = function (key, time) {
    var self = this;

    var query = { 'key': key };
    if (time) {
        query.time = moment(time).toDate();
    }

    return self.mongo.remove(query);
};

Scheduler.prototype.list = function (key) {
    var self = this;

    return self.mongo.find({ 'key': key }).toArray(function (found) {
        return found.map(function (obj) {
            delete obj._id;
            return obj;
        });
    });
};

module.exports = Plugin.define('Scheduler', function (bot, options) {
    bot.scheduler = new Scheduler(bot.id, options || {});

    bot.on('tick', function ($evt, when) {
        return Promise.cast(bot.scheduler.mongo.find({ 'time': {$lt: when.toDate()} }).toArray()).then(function (entries) {
            if (entries.length > 0) {
                bot.logger.silly('[Scheduler] found %s pending scheduled event(s)', entries.length);
            }

            return Promise.map(entries, function (entry) {
                /* Remove the object from the database */
                bot.scheduler.mongo.remove({ _id: entry._id }).then(function () {
                    /* Emit a general event */
                    return bot.emit('scheduled', entry.key, entry.time, entry.data);
                }).then(function ($res) {
                    if (!$res.isStopped()) {
                        /* Emit a more concrete event */
                        return bot.emit('scheduled.' + entry.key, entry.key, entry.time, entry.data);
                    }
                });


            }, {concurrency: 1});

        });
    });
});
