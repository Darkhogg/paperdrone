var util = require('util');

var Marker = require('../marker');

function RamMarker () {
    this.firstNotDone = -1;

    this.processingSet = new Set();
    this.doneSet = new Set();
}

util.inherits(RamMarker, Marker);


RamMarker.prototype._isPending = function _isPending (num) {
    return num >= this.firstNotDone
        && !this.processingSet.has(num)
        && !this.doneSet.has(num)
}

RamMarker.prototype._isProcessing = function _isProcessing (num) {
    return this.processingSet.has(num);
};

RamMarker.prototype._isDone = function _isDone (num) {
    return num < this.firstNotDone
        || this.doneSet.has(num);
};



RamMarker.prototype._setPending = function _setPending (num) {
    var pend = this._isPending(num);
    var proc = this._isProcessing(num);
    var done = this._isDone(num);

    /* done -> pending : not allowed! */
    if (done) {
        throw new Error('Illegal transition: (done -> pending)');
    }

    /* processing -> pending : remove it from processing set */
    if (proc) {
        this.processingSet.delete(num);
    }

    /* pending -> pending : idempotent, do nothing */
};

RamMarker.prototype._setProcessing = function _setProcessing (num) {
    var pend = this._isPending(num);
    var proc = this._isProcessing(num);
    var done = this._isDone(num);

    /* done -> processing : not allowed! */
    if (done) {
        throw new Error('Illegal transition: (done -> processing)');
    }

    /* processing -> processing : idempotent, do nothing */

    /* pending -> processing : add it to the processing set */
    if (pend) {
        this.processingSet.add(num);
    }
};

RamMarker.prototype._setDone = function _setDone (num) {
    var pend = this._isPending(num);
    var proc = this._isProcessing(num);
    var done = this._isDone(num);

    /* done -> done : idempotent, do nothind */

    /* processing -> done : remove from processing set, add to done set, check for firstNotDone move */
    if (proc) {
        this.processingSet.delete(num);
        this.doneSet.add(num);

        var fnd = this.firstNotDone;
        while (this.doneSet.has(fnd)) {
            fnd++;
        }

        this._setFirstNotDone(fnd);
    }

    /* pending -> done : not allowed */
    if (pend) {
        throw new Error('Illegal transition: (pending -> done)');
    }
};


Marker.prototype._setFirstNotDone = function _setFirstNotDone (newFirst_) {
    var self = this;

    var oldFirst = self._getFirstNotDone();
    var newFirst = Math.max(newFirst_, oldFirst);

    self.processingSet.forEach(function (n) {
        if (n < newFirst) {
            self.processingSet.delete(n);
        }
    });

    self.doneSet.forEach(function (n) {
        if (n < newFirst) {
            self.doneSet.delete(n);
        }
    });

    self.firstNotDone = newFirst;
};

Marker.prototype._getFirstNotDone = function _getFirstNotDone () {
    return this.firstNotDone;
};


RamMarker.prototype.isPending = function isPending (num) {
    return Promise.resolve(this._isPending(num));
};

RamMarker.prototype.isProcessing = function isProcessing (num) {
    return Promise.resolve(this._isProcessing(num));
};

RamMarker.prototype.isDone = function isDone (num) {
    return Promise.resolve(this._isDone(num));
};


RamMarker.prototype.setPending = function setPending (num) {
    return Promise.resolve(this._setPending(num));
};

RamMarker.prototype.setProcessing = function setProcessing (num) {
    return Promise.resolve(this._setProcessing(num));
};

RamMarker.prototype.setDone = function setDone (num) {
    return Promise.resolve(this._setDone(num));
};


RamMarker.prototype.setFirstNotDone = function setFirstNotDone (num) {
    return Promise.resolve(this._setFirstNotDone(num));
};

RamMarker.prototype.getFirstNotDone = function getFirstNotDone () {
    return Promise.resolve(this._getFirstNotDone());
};


RamMarker.prototype.toString = function toString () {
    var procNums = '';
    this.processingSet.forEach(function (n) {
        procNums += (n + ',');
    });

    var doneNums = '';
    this.doneSet.forEach(function (n) {
        doneNums += (n + ',');
    });

    return 'RAM-Marker{\n'
         + '  proc=' + procNums + '\n'
         + '  done=[' + (this.firstNotDone - 1) + ']:' + doneNums + '\n'
         + '}';
}

module.exports = RamMarker;
