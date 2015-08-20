var Promise = require('bluebird');

function Marker () {
}

Marker.STATE_PENDING = '-';
Marker.STATE_PROCESSING = 'p';
Marker.STATE_DONE = 'D';


Marker.prototype.setPending = function setPending (num) {
    return Promise.cast(this.set(num, Marker.STATE_PENDING));
};

Marker.prototype.setProcessing = function setProcessing (num) {
    return Promise.cast(this.set(num, Marker.STATE_PROCESSING));
};

Marker.prototype.setDone = function setDone (num) {
    return Promise.cast(this.set(num, Marker.STATE_DONE));
};


Marker.prototype.isPending = function isPending (num) {
    return Promise.cast(this.get(num)).then(function (state) {
        return state == Marker.STATE_PENDING;
    });
};

Marker.prototype.isProcessing = function isProcessing (num) {
    return Promise.cast(this.get(num)).then(function (state) {
        return state == Marker.STATE_PROCESSING;
    });
};

Marker.prototype.isDone = function isDone (num) {
    return Promise.cast(this.get(num)).then(function (state) {
        return state == Marker.STATE_DONE;
    });
};


Marker.prototype.setFirstNotDone = function (num) {
    return Promise.resolve(null);
};

Marker.prototype.getFirstNotDone = function () {
    return Promise.resolve(null);
};




module.exports = Marker;
