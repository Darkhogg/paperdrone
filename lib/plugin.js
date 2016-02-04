'use strict';
const setfn = require('function-name');

class Plugin {
    constructor (name) {
        this.name = name;
    }

    onAttach (bot, options) {
        /* DUMMY -- Meant for overriding */
    }

    static define (name, attachFn) {
        let $P = class extends Plugin {
            constructor () {
                super(name);
            }
            onAttach (/* ... */) {
                attachFn.apply(this, arguments);
            }
        };
        setfn($P, name);
        return $P;
    }

    static new (name, attachFn) {
        return new (Plugin.define(name, attachFn))(name);
    }
}

module.exports = Plugin;
