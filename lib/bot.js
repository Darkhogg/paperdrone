var Promise = require('bluebird');
var moment  = require('moment');
var util    = require('util');
var winston = require('winston');

var API = require('./api');
var EnhancedEmitter = require('./enhanced-emitter');

var RamMarker = require('./markers/ram-marker');

var Decider = require('./decider');
var DirectDecider = require('./deciders/direct-decider');


function Bot (options) {
    this._options = options;
    this.id = options.token.split(':')[0];

    this.logger = options.logger = (options.logger || winston);
    this.logger.setLevels(winston.config.npm.levels);

    this.api = new API(options.token, options);

    this._decider = options.decider || new DirectDecider();
    this._marker = options.marker || new RamMarker();

    this._plugins = [];
    this._namedPlugins = {};
}

util.inherits(Bot, EnhancedEmitter);


Bot.prototype.addPlugin = function addPlugin (plugin) {
    var name = plugin.name;

    /* If already added, ignore */
    if (this._namedPlugins[name]) {
        this.logger.silly('[Bot] ignoring already included plugin:', name);

    } else {
        this.logger.debug('[Bot] adding plugin:', name);

        /* Add it to the structures */
        this._plugins.push(plugin);
        this._namedPlugins[name] = plugin;

        /* Notify the plugin */
        plugin.onAttach(this, this._options);
    }
};

Bot.prototype.processUpdate = function processUpdate (upd) {
    var self = this;

    var updid = upd.update_id;

    this.logger.silly('[Bot] received update:', updid);

    return Promise.all([
        Promise.cast(self._marker.isPending(updid)),
        Promise.cast(self._marker.isProcessing(updid)),
        Promise.cast(self._marker.isDone(updid))

    ]).spread(function (pend, proc, done) {
        if (pend) {
            return Promise.cast(self._marker.setProcessing(updid)).then(function () {
                return self._decider.decide(upd);
            }).then(function (decission) {
                if (decission == Decider.DECISSION_PROCESS) {
                    /* PROCESS -- process it, then mark it as done */
                    return Promise.cast(self._doProcessUpdate(upd)).finally(function () {
                        return Promise.cast(self._marker.setDone(updid)).return(true);
                    });

                } else if (decission == Decider.DECISSION_CANCEL) {
                    /* CANCEL -- set it as done, but don't do anything */
                    return Promise.cast(self._marker.setDone(updid)).return(true);

                } else {
                    /* DELAY or invalid -- set it as pending again */
                    return Promise.cast(self._marker.setPending(updid)).return(false);
                }
            });
        }

        return true;
    });
};

Bot.prototype.processTick = function processTick (when_) {
    var when = moment(when_) || moment();

    this.logger.silly('[Bot] received tick:', when.format());

    return this.emit('tick', when);
};

Bot.prototype._doProcessUpdate = function (update) {
    this.logger.verbose('[Bot] processing update:', update.update_id);

    return this.emit('update', update);
};

/* === APPLICATION-LEVEL UTILITIES === */

Bot.prototype.pollUpdates = function pollUpdates (timeout_) {
    var self = this;

    var timeout = timeout_ || 0;

    return Promise.cast(self._marker.getFirstNotDone())
    .then(function (fnd_) {
        fnd = (fnd_ && fnd_ >= 0) ? fnd_ : -1;

        self.logger.silly('[Bot] requesting updates (starting at %s)', fnd);

        return self.api.getUpdates({
            'offset': fnd >= 0 ? fnd : 0,
            'timeout': timeout
        }).then(function (result) {
            var updates = result.result;

            if (updates.length > 0 && (fnd === undefined || fnd === null || fnd < 0)) {
                var min = Math.min.apply(null, updates.map(function (u) {
                    return u.update_id;
                }));

                return Promise.cast(self._marker.setFirstNotDone(min))
                    .return(updates);
            }

            return updates;
        });
    }).then(function (updates) {
        if (updates.length > 0) {
            self.logger.silly('[Bot] received %s update(s)', updates.length);
        }

        return Promise.map(updates, function (update) {
            return self.processUpdate(update);
        });
    }).return(null);
};

Bot.prototype.setupPollLoop = function () {
    var self = this;

    var _iter = function _iter () {
        self.pollUpdates(30).finally(_iter);
    };

    process.nextTick(_iter);
};

Bot.prototype.setupTickLoop = function (interval_) {
    var self = this;

    var interval = Math.ceil(interval_ || 60) * 1000;

    setInterval(function () {
        self.processTick();
    }, interval);

    self.processTick();
}

module.exports = Bot;
