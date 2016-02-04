'use strict';
const Promise = require('bluebird');

class Marker {
    setPending (num) {
        return Promise.cast(this.set(num, Marker.STATE_PENDING));
    }

    setProcessing (num) {
        return Promise.cast(this.set(num, Marker.STATE_PROCESSING));
    }

    setDone (num) {
        return Promise.cast(this.set(num, Marker.STATE_DONE));
    }

    isPending (num) {
        return Promise.cast(this.get(num))
            .then((state) => state == Marker.STATE_PENDING);
    }

    isProcessing (num) {
        return Promise.cast(this.get(num))
            .then((state) => state == Marker.STATE_PROCESSING);
    }

    isDone (num) {
        return Promise.cast(this.get(num))
            .then((state) => state == Marker.STATE_DONE);
    }

    setFirstNotDone (num) {
        return Promise.resolve(null);
    }

    getFirstNotDone () {
        return Promise.resolve(null);
    }
}

Marker.STATE_PENDING = '-';
Marker.STATE_PROCESSING = 'p';
Marker.STATE_DONE = 'D';

module.exports = Marker;
