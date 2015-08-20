var Promise = require('bluebird');
var util = require('util');

var API = require('./api');
var EnhancedEmitter = require('./enhanced-emitter');

var RamMarker = require('./markers/ram-marker');

var Decider = require('./decider');
var DirectDecider = require('./deciders/direct-decider');


function Bot (options) {
    this._options = options;

    this.logger = options.logger;
    this.api = new API(options.token, options);

    this._decider = options.decider || new DirectDecider();
    this._marker = options.marker || new RamMarker();

    this._plugins = [];
    this._namedPlugins = {};
}

util.inherits(Bot, EnhancedEmitter);


Bot.prototype.addPlugin = function addPlugin (plugin) {
    var name = plugin.name;

    /* Add it to the structures */
    this._plugins.push(plugin);
    this._namedPlugins[name] = plugin;

    /* Notify the plugin */
    plugin.onAttach(this, this._options);
};

Bot.prototype.processUpdate = function processUpdate (upd) {
    var self = this;

    var updid = upd.update_id;

    return Promise.all([
        Promise.cast(self._marker.isPending(updid)),
        Promise.cast(self._marker.isProcessing(updid)),
        Promise.cast(self._marker.isDone(updid))

    ]).spread(function (pend, proc, done) {
        console.log(pend, proc, done);

        if (pend) {
            return Promise.cast(self._marker.setProcessing(updid)).then(function () {
                return self._decider.decide(upd);
            }).then(function (decission) {
                console.log('%s:', updid, decission);

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
            }).tap(function () {console.log(self._marker.toString())});
        }

        return true;
    });
};

Bot.prototype._doProcessUpdate = function (update) {
    return this.emit('update', update);
};

/* === APPLICATION-LEVEL UTILITIES === */

Bot.prototype.pollUpdates = function pollUpdates (timeout_) {
    var self = this;

    var timeout = timeout_ || 0;

    return Promise.cast(self._marker.getFirstNotDone())
    .then(function (fnd) {
        return self.api.getUpdates({
            'offset': fnd,
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
        return Promise.map(updates, function (update) {
            return self.processUpdate(update);
        });
    }).return(null);
};

Bot.prototype.setupPollLoop = function () {
    var self = this;

    var _iter = function _iter () {
        console.log('\n---', Date.now())

        self.pollUpdates(30)
            .finally(_iter);
    };

    process.nextTick(_iter);
};

module.exports = Bot;
