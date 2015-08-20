var Promise = require('bluebird');

function EnhancedEmitter () {
}

EnhancedEmitter.prototype.on = function (name, hook, thisArg) {
    if (!this.__hooks) {
        this.__hooks = {};
    }
    if (!this.__hooks[name]) {
        this.__hooks[name] = {
            funcs: []
        };
    }

    this.__hooks[name].funcs.push({
        'hook': hook,
        'this': thisArg || this
    });
};

EnhancedEmitter.prototype.emit = function (name) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);

    if (!this.__hooks || !this.__hooks[name]) {
        return Promise.resolve(null);
    }

    return Promise.map(this.__hooks[name].funcs, function (obj) {
        return Promise.cast(obj.hook.apply(obj.this, args));
    }).return(null);
}

module.exports = EnhancedEmitter;
