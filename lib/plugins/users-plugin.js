var Promise = require('bluebird');
var moment = require('moment');

var Plugin = require('../plugin');

function UsersManager (owner, options) {
    this.owner = owner;

    var collName = (options.scheduler && options.scheduler.collection)
        ? options.scheduler.collection
        : 'pd_' + owner + '_users';

    this.mongo = options.mongo.client.collection(collName);

    this.logger = options.logger;
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
}

UsersManager.prototype._onReceiveMessage = function _onReceiveMessage (message) {
    var self = this;

    var user = message.from;
    var chat = message.chat;

    var now = new Date();

    return self.mongo.update({_id: user.id}, {
        $set: {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'display_name': user.first_name + ' ' + user.last_name,
            'username': user.username,

            'last_message': now,
            'last_active': now
        }
    }, {upsert: true})
}

module.exports = Plugin.define('Users', function (bot, options) {
    bot.users = new UsersManager(bot.id, options || {});

    bot.on('message', function ($evt, msg) {
        return bot.users._onReceiveMessage(msg);
    });
});
