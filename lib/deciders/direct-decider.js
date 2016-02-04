'use strict';
const Promise = require('bluebird');

const Decider = require('../decider');

class DirectDecider extends Decider {
    decide (update) {
        return Promise.resolve(Decider.DECISSION_PROCESS);
    }
}

module.exports = DirectDecider;
