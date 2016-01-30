var _ = require('lodash');
var Promise = require('bluebird');

var Plugin = require('../plugin');

function KeyedStorage (owner, options) {
    this.logger = options.logger;
    this.owner = owner;

    var collName = (options.storage && options.storage.collection)
        ? options.storage.collection
        : 'pd_' + owner + '_keyed_storage';

    this.mongo = options.mongo.client.collection(collName);

    this.mongo.createIndex({ '__type': 1 });
    this.mongo.createIndex({ '__key': 1 });
};

KeyedStorage.prototype.get = function get (type, key) {
    var self = this;

    self.logger.debug('[KeyedStorage]  finding entry for %s:%s', type, key);

    return self.mongo.findOne({'__type': type, '__key': key}).then(function (obj) {
        if (!obj) {
            self.logger.silly('[KeyedStorage]  entry for %s:%s not found', type, key);
            return {};
        }

        delete obj._id;
        delete obj.__key;
        delete obj.__type;
        return obj;
    }).tap(function (obj) {
        self.logger.silly('[KeyedStorage]  found entry for %s:%s', type, key);
    });
};

KeyedStorage.prototype.list = function list (type) {
    var self = this;

    self.logger.debug('[KeyedStorage]  listing entries for %s', type);

    return self.mongo.find({'__type': type}).then(function (list) {
        return list.map(function (obj) {
            var key = obj.__key;
            delete obj._id;
            delete obj.__key;
            delete obj.__type;
            return { 'key': key, 'value': obj };
        });
    }).tap(function (list) {
        self.logger.silly('[KeyedStorage]  listed %s entries for %s', list.length, type);
    });
};

KeyedStorage.prototype.set = function set (type, key, value) {
    var self = this;

    self.logger.debug('[KeyedStorage]  setting entry for %s:%s', type, key, value);

    var obj = _.clone(value);
    obj.__type = type;
    obj.__key = key;

    return self.mongo.findOne({'__type': type, '__key': key}).then(function (oldObj) {
        if (oldObj) {
            obj._id = oldObj._id;
        }

        return self.mongo.save(obj);
    }).tap(function () {
        self.logger.silly('[KeyedStorage]  set entry for %s:%s', type, key);
    });
};

KeyedStorage.prototype.del = function del (type, key) {
    var self = this;

    self.logger.debug('[KeyedStorage]  removing entry for %s:%s', type, key);

    return self.mongo.remove({'__type': type, '__key': key}).tap(function () {
        self.logger.silly('[KeyedStorage] removed entry for %s:%s', type, key);
    });
};

KeyedStorage.prototype.empty = function empty (type) {
    var self = this;

    self.logger.debug('[KeyedStorage]  emptying entries for %s', type);

    return self.mongo.remove({'__type': type}).tap(function () {
        self.logger.silly('[KeyedStorage]  emptied entries for %s', type);
    });
};

module.exports = Plugin.define('KeyedStorage', function (bot, options) {
    bot.storage = new KeyedStorage(bot.id, options || {});
});
