var Promise = require('bluebird');
var qs      = require('querystring');
var rp      = require('request-promise');
var util    = require('util');
var http    = require('http');


function APIError (res) {
    this.message = 'API Error ' + res.error_code + ': ' + res.description;
    this.apiResult = res;
}
util.inherits(APIError, Error);
APIError.prototype.name = 'APIError';


function API (token, options) {
    this._token = token;
    this._debug = options.debug;
}


API.prototype._request = function (options) {
    var p = Promise.cast(rp(options));

    return p.then(function (text) {
        var result = JSON.parse(text);
        if (!result.ok) {
            throw new APIError(result);
        }
        return result;
    });
}

API.prototype._get = function (method, data) {
    var uri = 'https://api.telegram.org/bot' + this._token + '/' + method;

    if (data) {
        uri += '?' + qs.stringify(data);
    }

    return this._request({
        'uri': uri,
        'method': 'GET'
    });
};

API.prototype._post = function (method, data) {
    var uri = 'https://api.telegram.org/bot' + this._token + '/' + method;

    return this._request({
        'uri': uri,
        'method': 'POST',
        'form': data
    });
};

API.prototype.getMe = function getMe (data) {
    return this._get('getMe', data);
}

API.prototype.getFile = function getFile (data) {
    return this._get('getFile', data);
}

API.prototype.getUserProfilePhotos = function getUserProfilePhotos (data) {
    return this._get('getUserProfilePhotos', data);
}
API.prototype.getUpdates = function getUpdates (data) {
    return this._get('getUpdates', data);
}

API.prototype.sendMessage = function sendMessage (data) {
    return this._post('sendMessage', data);
};

API.prototype.forwardMessage = function forwardMessage (data) {
    return this._post('forwardMessage', data);
};

API.prototype.sendPhoto = function sendPhoto (data) {
    return this._post('sendPhoto', data);
};

API.prototype.sendAudio = function sendAudio (data) {
    return this._post('sendAudio', data);
};

API.prototype.sendDocument = function sendDocument (data) {
    return this._post('sendDocument', data);
};

API.prototype.sendSticker = function sendSticker (data) {
    return this._post('sendSticker', data);
};

API.prototype.sendVideo = function sendVideo (data) {
    return this._post('sendVideo', data);
};

API.prototype.sendLocation = function sendLocation (data) {
    return this._post('sendLocation', data);
};

API.prototype.sendChatAction = function sendChatAction (data) {
    return this._post('sendChatAction', data);
};

API.prototype.setWebhook = function setWebhook (data) {
    return this._post('setWebhook', data);
};


module.exports = API;
module.exports.APIError = APIError;
