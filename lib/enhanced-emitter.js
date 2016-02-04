'use strict';
const Promise = require('bluebird');
const _ = require('lodash');

/* ============= */
/* === EVENT === */

class Event {
    constructor (name, args, emitter) {
        this.name = name;
        this.arguments = args;
        this.emitter = emitter;

        this._cancelled = false;
        this._stopped = false;
    }

    cancel () {
        this._cancelled = true;
    }

    stop () {
        this.cancel();
        this._stopped = true;
    }
}

/* ==================== */
/* === EVENT RESULT === */

class EventResult {
    constructor () {
        this.events = [];
    }

    _add ($evt) {
        this.events.push($evt);
    }

    isCancelled () {
        return this.events.some(($evt) => $evt._cancelled);
    }

    isStopped () {
        return this.events.some(($evt) => $evt._stopped);
    }

    toString () {
        return 'EventResult{"' + this.event.name + '"' + (this.isCancelled() ? ' C' : '') + (this.isStopped() ? ' S' : '') + '}';
    }
}

/* ===================== */
/* === EVENT EMITTER === */

const EE = Object.freeze({
    'PRIORITY_VERY_HIGH': -100,
    'PRIORITY_HIGH':       -10,
    'PRIORITY_NORMAL':       0,
    'PRIORITY_LOW':        +10,
    'PRIORITY_VERY_LOW':  +100,
});

class EnhancedEmitter {

    on (names_, hook, priority, thisArg) {
        let names = names_;
        if (typeof names_ !== 'object' || names_.constructor.name !== 'Array') {
            names = [names_];
        }

        for (let i in names) {
            let name = names[i];

            if (!this.__EnhancedEmitter__hooks) {
                this.__EnhancedEmitter__hooks = {};
            }
            if (!this.__EnhancedEmitter__hooks[name]) {
                this.__EnhancedEmitter__hooks[name] = {
                    funcs: []
                };
            }

            this.__EnhancedEmitter__hooks[name].funcs.push({
                'hook': hook,
                'this': thisArg || this,
                'order': EnhancedEmitter._SEQ_ORDER++,
                'priority': priority || EE.PRIORITY_NORMAL
            });
        }
    }

    emit (names_) {
        let self = this;
        let args = Array.prototype.slice.call(arguments, 0);

        let names = names_;
        if (typeof names_ !== 'object' || names_.constructor.name !== 'Array') {
            names = [names_];
        }

        return Promise.reduce(names, function ($res, name) {
            /* If stopped, skip */
            if ($res.isStopped()) {
                return $res;
            }

            if (!self.__EnhancedEmitter__hooks || !self.__EnhancedEmitter__hooks[name]) {
                return $res;
            }

            let $evt = new Event(name, args.slice(1), self);
            args[0] = $evt;

            let handlers = _.sortBy(_.sortBy(self.__EnhancedEmitter__hooks[name].funcs, 'order'), 'priority');

            return Promise.reduce(handlers, function (_1, obj) {
                /* If stopped, skip */
                if ($evt._stopped) {
                    return null;
                }

                return Promise.cast(obj.hook.apply(obj.this, args));
            }, 0).then(() => {
                $res._add($evt);
                return $res;
            });
        }, new EventResult());
    }
}

EnhancedEmitter._SEQ_ORDER = 0;

EnhancedEmitter.PRIORITY_VERY_HIGH = EE.PRIORITY_VERY_HIGH;
EnhancedEmitter.PRIORITY_HIGH      = EE.PRIORITY_HIGH;
EnhancedEmitter.PRIORITY_NORMAL    = EE.PRIORITY_NORMAL;
EnhancedEmitter.PRIORITY_LOW       = EE.PRIORITY_LOW;
EnhancedEmitter.PRIORITY_VERY_LOW  = EE.PRIORITY_VERY_LOW;

module.exports = EnhancedEmitter;
