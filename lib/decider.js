'use strict';
const Promise = require('bluebird');

class Decider {
    decide (update) {
        return Promise.resolve(null);
    }
}

Decider.DECISSION_DELAY   = 'delay';
Decider.DECISSION_PROCESS = 'process';
Decider.DECISSION_CANCEL  = 'cancel';

module.exports = Decider;
