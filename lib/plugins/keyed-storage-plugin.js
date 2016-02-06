'use strict';
const _ = require('lodash');
const Promise = require('bluebird');

const Plugin = require('../plugin');

class KeyedStorage {
    constructor (owner, options) {
        this.logger = options.logger;
        this.owner = owner;

        let collName = (options.storage && options.storage.collection)
            ? options.storage.collection
            : 'pd_' + owner + '_keyed_storage';

        this.mongo = options.mongo.client.collection(collName);

        this.mongo.createIndex({ '__type': 1 });
        this.mongo.createIndex({ '__key': 1 });
    }

    get (type, key) {
        this.logger.silly('[KeyedStorage]  finding entry for %s:%s', type, key);

        return this.mongo.findOne({'__type': type, '__key': key}).then((obj) => {
            if (!obj) {
                this.logger.silly('[KeyedStorage]  entry for %s:%s not found', type, key);
                return {};
            }

            delete obj._id;
            delete obj.__key;
            delete obj.__type;
            return obj;
        }).tap((obj) => this.logger.silly('[KeyedStorage]  found entry for %s:%s', type, key));
    }

    list (type) {
        this.logger.silly('[KeyedStorage]  listing entries for %s', type);

        return this.mongo.find({'__type': type}).then((list) => list.map((obj) => {
            var key = obj.__key;
            delete obj._id;
            delete obj.__key;
            delete obj.__type;
            return { 'key': key, 'value': obj };
        })).tap((list) => this.logger.silly('[KeyedStorage]  listed %s entries for %s', list.length, type));
    }

    set (type, key, value) {
        this.logger.silly('[KeyedStorage]  setting entry for %s:%s', type, key, value);

        var obj = _.clone(value);
        obj.__type = type;
        obj.__key = key;

        return this.mongo.findOne({'__type': type, '__key': key}).then((oldObj) => {
            if (oldObj) {
                obj._id = oldObj._id;
            }

            return this.mongo.save(obj);
        }).tap(() => this.logger.silly('[KeyedStorage]  set entry for %s:%s', type, key));
    }

    del (type, key) {
        this.logger.silly('[KeyedStorage]  removing entry for %s:%s', type, key);

        return this.mongo.remove({'__type': type, '__key': key})
            .tap(() =>this.logger.silly('[KeyedStorage]  removed entry for %s:%s', type, key));
    };

    empty (type) {
        this.logger.silly('[KeyedStorage]  emptying entries for %s', type);

        return this.mongo.remove({'__type': type})
            .tap(() => this.logger.silly('[KeyedStorage]  emptied entries for %s', type));
    }
}

module.exports = Plugin.define('KeyedStorage', function (bot, options) {
    bot.storage = new KeyedStorage(bot.id, options || {});
});
