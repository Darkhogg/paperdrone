'use strict';
const Promise = require('bluebird');

const Marker = require('../marker');

class RamMarker extends Marker {
    constructor () {
        super();

        this.firstNotDone = -1;

        this.processingSet = new Set();
        this.doneSet = new Set();
    }

    _isPending (num) {
        return num >= this.firstNotDone
            && !this.processingSet.has(num)
            && !this.doneSet.has(num)
    }

    _isProcessing (num) {
        return this.processingSet.has(num);
    };

    _isDone (num) {
        return num < this.firstNotDone
            || this.doneSet.has(num);
    };

    _setPending (num) {
        let pend = this._isPending(num);
        let proc = this._isProcessing(num);
        let done = this._isDone(num);

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

    _setProcessing (num) {
        let pend = this._isPending(num);
        let proc = this._isProcessing(num);
        let done = this._isDone(num);

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

    _setDone (num) {
        let pend = this._isPending(num);
        let proc = this._isProcessing(num);
        let done = this._isDone(num);

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


    _setFirstNotDone (newFirst_) {
        let oldFirst = this._getFirstNotDone();
        let newFirst = Math.max(newFirst_, oldFirst);

        this.processingSet.forEach((n) => {
            if (n < newFirst) {
                this.processingSet.delete(n);
            }
        });

        this.doneSet.forEach((n) => {
            if (n < newFirst) {
                this.doneSet.delete(n);
            }
        });

        this.firstNotDone = newFirst;
    };

    _getFirstNotDone () {
        return this.firstNotDone;
    };


    isPending (num) {
        return Promise.resolve(this._isPending(num));
    };

    isProcessing (num) {
        return Promise.resolve(this._isProcessing(num));
    };

    isDone (num) {
        return Promise.resolve(this._isDone(num));
    };


    setPending (num) {
        return Promise.resolve(this._setPending(num));
    };

    setProcessing (num) {
        return Promise.resolve(this._setProcessing(num));
    };

    setDone (num) {
        return Promise.resolve(this._setDone(num));
    };


    setFirstNotDone (num) {
        return Promise.resolve(this._setFirstNotDone(num));
    };

    getFirstNotDone () {
        return Promise.resolve(this._getFirstNotDone());
    };


    toString () {
        let procNums = '';
        this.processingSet.forEach((n) => procNums += (n + ','));

        let doneNums = '';
        this.doneSet.forEach((n) => doneNums += (n + ','));

        return 'RAM-Marker{\n'
             + '  proc=' + procNums + '\n'
             + '  done=[' + (this.firstNotDone - 1) + ']:' + doneNums + '\n'
             + '}';
    }
}

module.exports = RamMarker;
