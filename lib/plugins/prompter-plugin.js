'use strict';
const moment  = require('moment');
const Promise = require('bluebird');

const Plugin = require('../plugin');
const MessagesPlugin = require('./messages-plugin');


/* ================ */
/* === PROMPTER === */

class Prompter {
    constructor (owner, emitter, options) {
        this.owner = owner;
        this.emitter = emitter;

        let collName = (options.prompter && options.prompter.collection)
            ? options.prompter.collection
            : 'pd_' + owner + '_prompter';

        this.mongo = options.mongo.client.collection(collName);

        this.logger = options.logger;
        this._order = Date.now();
    }


    prompt (chat, user, name, data) {
        let order = this._order++;

        this.logger.debug('[Prompter]  creating prompt "%s:%s:%s"', chat, user, name);

        return this.mongo.insert({
            'chat': chat,
            'user': user,
            'name': name,

            'order': order,
            'data': data,
            'active': false
        })
        .then(() => self._checkAndActivateNext(chat, user, name));
    }

    _get (chat, user) {
        this.logger.silly('[Prompter]  finding next prompt for "%s:%s"', chat, user);

        return this.mongo.findOne({ 'chat': chat, 'user': user }, {}, {sort: {'order': 1}});
    }

    _remove (chat, user, name) {
        this.logger.silly('[Prompter]  removing prompt "%s:%s:%s"', chat, user, name);

        return this.mongo.findAndModify(
            { 'chat': chat, 'user': user, 'name': name },
            {},
            null,
            { remove: true }
        ).then((result) => result.value);
    }

    complete (chat, user, name, result) {
        this.logger.debug('[Prompter]  completing prompt "%s:%s:%s"', chat, user, name);

        return this._remove(chat, user, name)
            .then((prompt) => this.emitter.emit(['prompt.complete', 'prompt.complete.'+name], prompt, result))
            .then(() => this._checkAndActivateNext(chat, user));
    }

    cancel (chat, user, name) {
        this.logger.debug('[Prompter]  cancelling prompt "%s:%s:%s"', chat, user, name || '*');

        return this._remove(chat, user, name)
            .then(() => this._checkAndActivateNext(chat, user));
    }

    _checkAndActivateNext (chat, user) {
        this.logger.silly('[Prompter]  trying to activate prompt for "%s:%s"...', chat, user);

        return self.mongo.findAndModify(
            { 'chat': chat, 'user': user },
            { 'order': 1 },
            { $set: { 'active': true } }
        ).then((res) => {
            var prompt = res.value;

            if (prompt && !prompt.active) {
                self.logger.silly('[Prompter]  activated prompt "%s:%s:%s"...', chat, user, prompt.name);

                return self.emitter.emit(['prompt.request', 'prompt.request.' + prompt.name], prompt, prompt.data);
            }
        });
    }
}

/* === PLUGIN DEFINITION === */

module.exports = Plugin.define('Prompter', function (bot, options) {
    bot.prompter = new Prompter(bot.id, bot, options);

    bot.on('message', function ($evt, msg, type) {
        return bot.prompter._get(msg.chat.id, msg.from.id).then((prompt) => {
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
