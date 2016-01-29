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
        : 'pd_' + owner + '_prompter';

    this.mongo = options.mongo.client.collection(collName);

    this.logger = options.logger;
}

Prompter.ORDER = Date.now();

Prompter.prototype.prompt = function prompt (chat, user, name, data) {
    var self = this;

    var order = Prompter.ORDER++;

    self.logger.debug('[Prompter]  creating prompt "%s:%s:%s"', chat, user, name);

    return self.mongo.insert({
        'chat': chat,
        'user': user,
        'name': name,

        'order': order,
        'data': data,
        'active': false
    }).then(function () {
        return self._checkAndActivateNext(chat, user, name);
    });
};

Prompter.prototype._get = function _get (chat, user) {
    var self = this;

    self.logger.silly('[Prompter]  finding next prompt for "%s:%s"', chat, user);

    return self.mongo.find({ 'chat': chat, 'user': user }).sort({ 'order': 1 }).limit(1).then(function (docs) {
        var doc = docs[0];
        return doc || null;
    });
};

Prompter.prototype._remove = function _remove (chat, user, name) {
    var q = { 'chat': chat, 'user': user, 'name': name };

    this.logger.silly('[Prompter]  removing prompt "%s:%s:%s"', chat, user, name);

    return this.mongo.findAndModify({
        query: q,
        remove: true
    }).then(function (result) {
        return result.value;
    });
};

Prompter.prototype.complete = function complete (chat, user, name, result) {
    var self = this;

    self.logger.debug('[Prompter]  completing prompt "%s:%s:%s"', chat, user, name);

    return this._remove(chat, user, name).then(function (prompt) {
        return self.emitter.emit(['prompt.complete', 'prompt.complete.'+name], prompt, result);
    }).then(function () {
        self._checkAndActivateNext(chat, user);
    });
};

Prompter.prototype.cancel = function cancel (chat, user, name) {
    var self = this;

    self.logger.debug('[Prompter]  cancelling prompt "%s:%s:%s"', chat, user, name || '*');

    return this._remove(chat, user, name).then(function () {
        self._checkAndActivateNext(chat, user);
    });
};

Prompter.prototype._checkAndActivateNext = function (chat, user) {
    var self = this;

    self.logger.silly('[Prompter]  trying to activate prompt for "%s:%s"...', chat, user);

    self.mongo.findAndModify({
        query: { 'chat': chat, 'user': user },
        sort: { 'order': 1 },
        update: {
            $set: { 'active': true }
        }
    }).then(function (res) {
        var prompt = res.value;

        if (prompt && !prompt.active) {
            self.logger.silly('[Prompter]  activated prompt "%s:%s:%s"...', chat, user, prompt.name);

            return self.emitter.emit(['prompt.request', 'prompt.request.' + prompt.name], prompt, prompt.data);
        }
    });
};

/* === PLUGIN DEFINITION === */

module.exports = Plugin.define('Prompter', function (bot, options) {
    bot.prompter = new Prompter(bot.id, bot, options);

    bot.on('message', function ($evt, msg, type) {
        return bot.prompter._get(msg.chat.id, msg.from.id).then(function (prompt) {
            if (prompt && prompt.active) {
                /* Found -- end the prompt, stop the event */
                $evt.stop();
                return bot.prompter.complete(prompt.chat, prompt.user, prompt.name, msg);
            }

            /* Not found -- continue */
            return null;
        });
    }, bot.PRIORITY_VERY_HIGH);
});
