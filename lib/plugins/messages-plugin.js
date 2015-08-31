var Promise = require('bluebird');

var Plugin = require('../plugin');


module.exports = Plugin.define('Messages', function (bot, options) {
    var log = options.logger;

    /* When the bot sends an update, emit a *message* event of the given type */
    bot.on('update', function ($evt, update) {
        var message = update.message;

        /* Command message type */
        if (message.text && message.text.indexOf('/') == 0) {
            log.verbose('[Messages] detected message type: command');
            return bot.emit('message.command', message);
        }

        /* Text message type */
        if (message.text) {
            log.verbose('[Messages] detected message type: text');
            return bot.emit('message.text', message);
        }

        /*  Message is a "document" */
        if (message.document) {
            log.verbose('[Messages] detected message type: document');
            return bot.emit('message.document', message);
        }

        /*  Message is a "audio" */
        if (message.audio) {
            log.verbose('[Messages] detected message type: audio');
            return bot.emit('message.audio', message);
        }

        /* Message is a "photo" */
        if (message.photo) {
            log.verbose('[Messages] detected message type: photo');
            return bot.emit('message.photo', message);
        }

        /* Message is a "sticker" */
        if (message.sticker) {
            log.verbose('[Messages] detected message type: sticker');
            return bot.emit('message.sticker', message);
        }

        /* Message is a "video" */
        if (message.video) {
            log.verbose('[Messages] detected message type: video');
            return bot.emit('message.video', message);
        }

        /* Message is a "voice" */
        if (message.voice) {
            log.verbose('[Messages] detected message type: voice');
            return bot.emit('message.voice', message);
        }

        /* Message is a "contact" */
        if (message.contact) {
            log.verbose('[Messages] detected message type: contact');
            return bot.emit('message.contact', message);
        }

        /*  Message is a "location" */
        if (message.location) {
            log.verbose('[Messages] detected message type: location');
            return bot.emit('message.location', message);
        }

    });
});
