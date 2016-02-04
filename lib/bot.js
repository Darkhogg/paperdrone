'use strict';
const Promise = require('bluebird');
const moment = require('moment');
const util = require('util');
const winston = require('winston');

const API = require('./api');
const EnhancedEmitter = require('./enhanced-emitter');

const RamMarker = require('./markers/ram-marker');

const Decider = require('./decider');
const DirectDecider = require('./deciders/direct-decider');


class Bot extends EnhancedEmitter {
    constructor (options) {
        super();

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

    addPlugin (plugin) {
        let name = plugin.name;

        /* If already added, ignore */
        if (this._namedPlugins[name]) {
            this.logger.silly('[Bot]  ignoring already included plugin:', name);

        } else {
            this.logger.debug('[Bot]  adding plugin:', name);

            /* Add it to the structures */
            this._plugins.push(plugin);
            this._namedPlugins[name] = plugin;

            /* Notify the plugin */
            plugin.onAttach(this, this._options);
        }
    }

    processUpdate (upd) {
        let updid = upd.update_id;

        this.logger.silly('[Bot]  received update:', updid);

        return Promise.all([
            Promise.cast(this._marker.isPending(updid)),
            Promise.cast(this._marker.isProcessing(updid)),
            Promise.cast(this._marker.isDone(updid))

        ]).spread((pend, proc, done) => {
            if (pend) {
                return Promise.cast(this._marker.setProcessing(updid))
                .then(() => this._decider.decide(upd))
                .then((decission) => {
                    if (decission == Decider.DECISSION_PROCESS) {
                        /* PROCESS -- process it, then mark it as done */
                        return Promise.cast(this._doProcessUpdate(upd))
                            .finally(() => Promise.cast(this._marker.setDone(updid)))
                            .return(true);

                    } else if (decission == Decider.DECISSION_CANCEL) {
                        /* CANCEL -- set it as done, but don't do anything */
                        return Promise.cast(this._marker.setDone(updid)).return(true);

                    } else {
                        /* DELAY or invalid -- set it as pending again */
                        return Promise.cast(this._marker.setPending(updid)).return(false);
                    }
                });
            }

            return true;
        });
    }

    processTick (when_) {
        var when = moment(when_) || moment();

        this.logger.silly('[Bot]  received tick:', when.format());

        return this.emit('tick', when);
    }

    _doProcessUpdate (update) {
        this.logger.debug('[Bot]  processing update:', update.update_id);

        return this.emit('update', update);
    }

/* === APPLICATION-LEVEL UTILITIES === */

    pollUpdates (timeout_) {
        let timeout = timeout_ || 0;

        return Promise.cast(this._marker.getFirstNotDone())
        .then((fnd_) => {
            let fnd = (fnd_ && fnd_ >= 0) ? fnd_ : -1;

            this.logger.silly('[Bot]  requesting updates (starting at %s)', fnd);

            return this.api.getUpdates({
                'offset': fnd >= 0 ? fnd : 0,
                'timeout': timeout
            }).then((result) => {
                let updates = result.result;

                if (updates.length > 0 && (fnd === undefined || fnd === null || fnd < 0)) {
                    let min = Math.min.apply(null, updates.map(u => u.update_id));
                    return Promise.cast(this._marker.setFirstNotDone(min))
                        .return(updates);
                }

                return updates;
            });
        }).then((updates) => {
            if (updates.length > 0) {
                this.logger.silly('[Bot]  received %s update(s)', updates.length);
            }

            return Promise.map(updates, (update) => this.processUpdate(update));
        }).return(null);
    }

    setupPollLoop () {
        var self = this;

        var _iter = () => this.pollUpdates(60).then(_iter);
        process.nextTick(_iter);
    }

    setupTickLoop (interval_) {
        var self = this;
        var interval = Math.ceil(interval_ || 60) * 1000;

        var _tick = () => this.processTick();

        setInterval(_tick, interval);
        process.nextTick(_tick);
    }
}

module.exports = Bot;
