var Promise = require('bluebird');
var util = require('util');

var Decider = require('../decider');

function DirectDecider () {
}

util.inherits(DirectDecider, Decider);

DirectDecider.prototype.decide = function decide (update) {
    return Promise.resolve(Decider.DECISSION_PROCESS);
};


module.exports = DirectDecider;
