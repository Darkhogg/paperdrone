var Promise = require('bluebird');

var Plugin = require('../plugin');
var utils = require('../utils');

module.exports = Plugin.define('Messages', function (bot, options) {
    var log = options.logger;

    /* When the bot sends an update, emit a *message* event of the given type */
    bot.on('update', function ($evt, update) {
        var message = update.message;
        var type = utils.detectMessageType(message);

        log.debug('[Messages]  detected message type:', type);
        return bot.emit(['message', 'message.'+type], message, type);
    });
});
