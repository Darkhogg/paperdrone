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
APIError.prototype.name = 'APIError';


class API extends EnhancedEmitter {
    constructor (token, options) {
        super();

        this._token = token;
        this._debug = options.debug;
    }

    _request (method, data, options) {
        var self = this;

        options.uri = 'https://api.telegram.org/bot' + this._token + '/' + method;
        if (data) {
            options.uri += '?' + qs.stringify(data);
        }

        return self.emit(['request', 'request.'+method], method, data).then(function () {
            return Promise.cast(rp(options));
        }).then(function (text) {
            return JSON.parse(text);
        }).tap(function (result) {
            return self.emit(['response', 'response.'+method], method, data, result);
        }).then(function (result) {
            if (!result.ok) {
                throw new APIError(result);
            }
            return result;
        });
    }

    _get (method, data) {
        return this._request(method, data, {
            'method': 'GET'
        });
    };

    _post (method, data) {
        return this._request(method, null, {
            'method': 'POST',
            'form': data
        });
    };

    getMe (data) {
        return this._get('getMe', data);
    }

    getFile (data) {
        return this._get('getFile', data);
    }

    getUserProfilePhotos (data) {
        return this._get('getUserProfilePhotos', data);
    }

    getUpdates (data) {
        return this._get('getUpdates', data);
    }

    sendMessage (data) {
        return this._post('sendMessage', data);
    }

    forwardMessage (data) {
        return this._post('forwardMessage', data);
    }

    sendPhoto (data) {
        return this._post('sendPhoto', data);
    }

    sendAudio (data) {
        return this._post('sendAudio', data);
    }

    sendDocument (data) {
        return this._post('sendDocument', data);
    }

    sendSticker (data) {
        return this._post('sendSticker', data);
    }

    sendVideo (data) {
        return this._post('sendVideo', data);
    }

    sendLocation (data) {
        return this._post('sendLocation', data);
    }

    sendChatAction (data) {
        return this._post('sendChatAction', data);
    }

    setWebhook (data) {
        return this._post('setWebhook', data);
    }
}

module.exports = API;
module.exports.APIError = APIError;
