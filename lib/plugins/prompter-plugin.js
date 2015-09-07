var moment  = require('moment');
var Promise = require('bluebird');

var Plugin = require('../plugin');

var MessagesPlugin = require('./messages-plugin');


/* ================ */
/* === PROMPTER === */

function Prompter (owner, emitter, options) {
    this.owner = owner;
    this.emitter = emitter;

    var collName = (options.prompter && options.prompter.collection)
        ? options.prompter.collection
        : 'paperdrone_' + owner + '_prompter';

    this.mongo = options.mongo.client.collection(collName);

    this.logger = options.logger;
}

Prompter.ORDER = Date.now();

Prompter.prototype.prompt = function prompt (chat, user, name, order_) {
    var self = this;

    var order = order_ || Prompter.ORDER++;

    self.logger.silly('[Prompter]  creating prompt "%s:%s:%s"', chat, user, name);

    return self.mongo.insert({
        'chat': chat,
        'user': user,
        'name': name,

        'order': moment().toDate()
    }).then(function () {
        var prompt = {
            'chat': chat,
            'user': user,
            'name': name
        };
        return self.emitter.emit(['prompt.request', 'prompt.request.'+name], prompt);
    });
};

Prompter.prototype.get = function get (chat, user) {
    var self = this;

    self.logger.silly('[Prompter]  finding next prompt for "%s:%s"', chat, user);

    return self.mongo.findOne({
        $query: { 'chat': chat, 'user': user },
        $orderby: { 'order': 1 }
    }).then(function (doc) {
        return doc ? { 'name': doc.name, 'chat': doc.chat, 'user': doc.user } : null;
    });
};

Prompter.prototype._remove = function _remove (chat, user, name) {
    var q = { 'chat': chat, 'user': user };
    if (name !== undefined) {
        q.name = name;
    }

    return this.mongo.remove(q);
};

Prompter.prototype.complete = function complete (chat, user, name, result) {
    var self = this;

    self.logger.silly('[Prompter]  completing prompt "%s:%s:%s"', chat, user, name);

    return this._remove(chat, user, name).then(function () {
        var prompt = { 'name': name, 'chat': chat, 'user': user };
        self.emitter.emit(['prompt.complete', 'prompt.complete.'+name], prompt, result);
    });
};

Prompter.prototype.cancel = function cancel (chat, user, name) {
    var self = this;

    self.logger.silly('[Prompter]  cancelling prompt "%s:%s:%s"', chat, user, name || '*');

    return this._remove(chat, user, name);
};


module.exports = Plugin.define('Prompter', function (bot, options) {
    bot.prompter = new Prompter(bot.id, bot, options);

    bot.on('message', function ($evt, msg, type) {
        return bot.prompter.get(msg.chat.id, msg.from.id).then(function (prompt) {
            if (prompt) {
                /* Found -- end the prompt, stop the event */
                $evt.stop();
                return bot.prompter.complete(prompt.chat, prompt.user, prompt.name, msg);
            }

            /* Not found -- continue */
            return null;
        });
    }, bot.PRIORITY_VERY_HIGH);
});
