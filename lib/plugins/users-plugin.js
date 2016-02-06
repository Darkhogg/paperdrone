var Promise = require('bluebird');
var moment = require('moment');
var _ = require('lodash');

var Plugin = require('../plugin');

function UsersManager (owner, options) {
    this.owner = owner;

    var collName = (options.scheduler && options.scheduler.collection)
        ? options.scheduler.collection
        : 'pd_' + owner + '_users';

    this.mongo = options.mongo.client.collection(collName);

    this.logger = options.logger;
}

UsersManager.prototype.get = function getUser (id) {
    var self = this;

    return self.mongo.findOne({_id: id}).then(function (user) {
        user.id = user._id;
        delete user._id;
        return user;
    });
};

UsersManager.prototype.list = function listUsers (since, a1, a2) {
    var self = this;

    var sinceDate = moment(since).toDate();
    var skip = (a2 !== undefined) ? a1 : 0;
    var howMany = (a2 !== undefined) ? a2 : a1 || 100;

    return self.mongo.find({'last_active': { $gt: sinceDate }}, {}, {
        'sort': {'last_active': -1},
        'skip': skip,
        'limit': howMany
    }).then(function (users) {
        return users.map(function (user) {
            user.id = user._id;
            delete user._id;
            return user;
        });
    });
};

UsersManager.prototype.countActive = function (date, spec) {
    var self = this;

    var date = moment(date)
    var spec = spec || {
        'year': moment.duration(1, 'year').asSeconds(),
        'month': moment.duration(30, 'days').asSeconds(),
        'week': moment.duration(7, 'days').asSeconds(),
        'day': moment.duration(1, 'day').asSeconds(),
    };

    return Promise.map(_.toPairs(spec), (pair) => {
        return self.mongo.count({
            'last_active': {
                $gt: date.subtract(pair[1], 'seconds').toDate()
            }
        }).then((num) => [pair[0], num]);
    }).then((pairs) => _.fromPairs(pairs));
}

UsersManager.prototype.updateActive = function updateActive (userId, when_) {
    var self = this;

    var when = moment(when_).toDate();

    return self.mongo.update({
        _id: userId,
        'last_active': {$lt: when}
    }, {
        $set: {
            'last_active': when
        }
    }, {upsert: true});
};

UsersManager.prototype._onReceiveMessage = function _onReceiveMessage (message) {
    var self = this;

    var user = message.from;
    var chat = message.chat;

    var now = new Date();

    return self.mongo.update({_id: user.id}, {
        $set: {
            'user_id': user.id,
            'chat_id': chat.id,

            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.full_name,
            'username': user.username,

            'last_message': now,
            'last_active': now
        }
    }, {upsert: true});
}

module.exports = Plugin.define('Users', function (bot, options) {
    bot.users = new UsersManager(bot.id, options || {});

    bot.on('message', function ($evt, msg) {
        return bot.users._onReceiveMessage(msg);
    });
});
