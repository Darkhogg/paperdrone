var setfn = require('function-name');
var util = require('util');


function Plugin (name) {
    this.name = name;
}


Plugin.prototype.onAttach = function (bot, options) {
    /* DUMMY -- Meant for overriding */
}


Plugin.define = function definePlugin (name, attachFn) {
    var $P = function () {
        Plugin.call(this, name);
    }
    util.inherits($P, Plugin);
    setfn($P, name);
    $P.prototype.onAttach = attachFn;
    return $P;
}

Plugin.new = function newPlugin (name, attachFn) {
    return new (Plugin.define(name, attachFn))(name);
}


module.exports = Plugin;
