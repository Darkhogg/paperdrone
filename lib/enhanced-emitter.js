var Promise = require('bluebird');
var _ = require('lodash');

function __log () {
    if (global.__debug__) {
        var args = new Array(arguments.length);
        args[0] = '\033[90m  [EE] ' + arguments[0] + '\033[m';
        for (var i = 1; i < args.length; i++) {
            args[i] = arguments[i];
        }
        console.log.apply(console, args);
    }
}

/* ============= */
/* === EVENT === */

function Event (name, args, emitter) {
    this.name = name;
    this.arguments = args;
    this.emitter = emitter;

    this._cancelled = false;
    this._stopped = false;
}

Event.prototype.cancel = function cancel () {
    this._cancelled = true;
};

Event.prototype.stop = function stop () {
    this.cancel();
    this._stopped = true;
};

/* ==================== */
/* === EVENT RESULT === */

function EventResult () {
    this.events = [];
}

EventResult.prototype._add = function add ($evt) {
    this.events.push($evt);
}

EventResult.prototype.isCancelled = function isCancelled () {
    return this.events.some(function ($evt) {
        return $evt._cancelled;
    });
};

EventResult.prototype.isStopped = function isStopped () {
    return this.events.some(function ($evt) {
        return $evt._stopped;
    });
};

EventResult.prototype.toString = function toString () {
    return 'EventResult{"' + this.event.name + '"' + (this.isCancelled() ? ' C' : '') + (this.isStopped() ? ' S' : '') + '}';
}


/* ===================== */
/* === EVENT EMITTER === */

function EnhancedEmitter () {
}

EnhancedEmitter._SEQ_ORDER = 0;

EnhancedEmitter.prototype.PRIORITY_VERY_HIGH = EnhancedEmitter.PRIORITY_VERY_HIGH = -100;
EnhancedEmitter.prototype.PRIORITY_HIGH      = EnhancedEmitter.PRIORITY_HIGH      = -10;
EnhancedEmitter.prototype.PRIORITY_NORMAL    = EnhancedEmitter.PRIORITY_NORMAL    = 0;
EnhancedEmitter.prototype.PRIORITY_LOW       = EnhancedEmitter.PRIORITY_LOW       = +10;
EnhancedEmitter.prototype.PRIORITY_VERY_LOW  = EnhancedEmitter.PRIORITY_VERY_LOW  = +100;


EnhancedEmitter.prototype.on = function (names_, hook, priority, thisArg) {
    var names = names_;
    if (typeof names_ !== 'object' || names_.constructor.name !== 'Array') {
        names = [names_];
    }

    for (var i in names) {
        var name = names[i];

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
            'priority': priority || EnhancedEmitter.PRIORITY_NORMAL
        });
    }
};

EnhancedEmitter.prototype.emit = function (names_) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 0);

    var names = names_;
    if (typeof names_ !== 'object' || names_.constructor.name !== 'Array') {
        names = [names_];
    }

    return Promise.reduce(names, function ($res, name) {
        /* If stopped, skip */
        if ($res.isStopped()) {
            return $res;
        }

        __log('emitting "%s" event', name);

        if (!self.__EnhancedEmitter__hooks || !self.__EnhancedEmitter__hooks[name]) {
            return $res;
        }

        var $evt = new Event(name, args.slice(1), self);
        args[0] = $evt;

        var handlers = _.sortBy(_.sortBy(self.__EnhancedEmitter__hooks[name].funcs, 'order'), 'priority');

        return Promise.reduce(handlers, function (_1, obj) {
            /* If stopped, skip */
            if ($evt._stopped) {
                return null;
            }

            return Promise.cast(obj.hook.apply(obj.this, args));
        }, 0).then(function () {
            $res._add($evt);
            return $res;
        });
    }, new EventResult());
}

module.exports = EnhancedEmitter;
