var Promise = require('bluebird');

function EnhancedEmitter () {
}

EnhancedEmitter.prototype.event = function (names_, options) {
    var names = names_;
    if (typeof names_ !== 'object' || names_.constructor.name !== 'Array') {
        names = [names_];
    }

    for (var i in names) {
        var name = names[i];

    }
};

EnhancedEmitter.prototype.on = function (names_, hook, thisArg) {
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
            'this': thisArg || this
        });
    }
};

EnhancedEmitter.prototype.emit = function (name) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);

    if (!self.__EnhancedEmitter__hooks || !self.__EnhancedEmitter__hooks[name]) {
        return Promise.resolve(null);
    }

    return Promise.map(self.__EnhancedEmitter__hooks[name].funcs, function (obj) {
        return Promise.cast(obj.hook.apply(obj.this, args));
    }).return(null);
}

module.exports = EnhancedEmitter;
