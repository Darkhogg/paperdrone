var util = require('util');

function Plugin (name) {
    this.name = name;
}


Plugin.prototype.onAttach = function (bot, options) {
    /* DUMMY -- Meant for overriding */
}


Plugin.define = function definePlugin (name, attachFn) {
    var $P = function (n) {
        Plugin.call(this, n);
    }
    util.inherits($P, Plugin);
    $P.prototype.onAttach = attachFn;
    return $P;
}

Plugin.new = function newPlugin (name, attachFn) {
    return new (Plugin.define('Plugin$' + Date.now(), attachFn))(name);
}


module.exports = Plugin;
