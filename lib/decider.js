var Promise = require('bluebird');

function Decider () {
}

Decider.DECISSION_DELAY   = 'delay';
Decider.DECISSION_PROCESS = 'process';
Decider.DECISSION_CANCEL  = 'cancel';


Decider.prototype.decide = function (update) {
    return Promise.resolve(null);
};


module.exports = Decider;
