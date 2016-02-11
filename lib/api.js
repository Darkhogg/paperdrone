'use strict';
const Promise = require('bluebird');
const qs = require('querystring');
const rp = require('request-promise');
const http = require('http');

const EnhancedEmitter = require('./enhanced-emitter');


class APIError extends Error {
    constructor (res) {
        super();

        this.message = 'API Error ' + res.error_code + ': ' + res.description;
        this.apiResult = res;
    }
}


class APIRequest {
    constructor (method, data) {
        this.method = method;
        this.data = data;
    }
}


class API extends EnhancedEmitter {
    constructor (token, options) {
        super();

        this.token = this._token = token;
        this._debug = options.debug;
    }

    _request (method, data_) {
        let data = data_ || {};
        let options = {
            'method': 'POST',
            'form': data,
            'uri': 'https://api.telegram.org/bot' + this._token + '/' + method
        }

        Object.keys(data).forEach((key) => {
            if (typeof data[key] !== 'string') {
                data[key] = JSON.stringify(data[key]);
            }
        });

        return this.emit(['request', 'request.'+method], method, data)
            .then(() => Promise.cast(rp(options)))
            .then((text) => JSON.parse(text))
            .catch((err) => JSON.parse(err.response.body))
            .tap((result) => this.emit(['response', 'response.'+method], method, data, result))
            .then((result) => {
                if (!result.ok) {
                    throw new APIError(result);
                }
                return result;
            });
    }

    sendRequest (req) {
        return this._request(req.method, req.data);
    }

    getMe (data) {
        return this._request('getMe', data);
    }

    getFile (data) {
        return this._request('getFile', data);
    }

    getUserProfilePhotos (data) {
        return this._request('getUserProfilePhotos', data);
    }

    getUpdates (data) {
        return this._request('getUpdates', data);
    }

    sendMessage (data) {
        return this._request('sendMessage', data);
    }

    forwardMessage (data) {
        return this._request('forwardMessage', data);
    }

    sendPhoto (data) {
        return this._request('sendPhoto', data);
    }

    sendAudio (data) {
        return this._request('sendAudio', data);
    }

    sendDocument (data) {
        return this._request('sendDocument', data);
    }

    sendSticker (data) {
        return this._request('sendSticker', data);
    }

    sendVideo (data) {
        return this._request('sendVideo', data);
    }

    sendLocation (data) {
        return this._request('sendLocation', data);
    }

    sendChatAction (data) {
        return this._request('sendChatAction', data);
    }

    setWebhook (data) {
        return this._request('setWebhook', data);
    }
}

module.exports = API;
module.exports.APIError = APIError;
module.exports.Request = APIRequest;
