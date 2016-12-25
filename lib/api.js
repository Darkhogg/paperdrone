import EEE from 'enhanced-event-emitter';
import rp from 'request-promise';


export class APIError extends Error {
    constructor (res) {
        super();

        this.message = 'API Error ' + res.error_code + ': ' + res.description;
        this.apiResult = res;
    }
}


export class APIRequest {
    constructor (method, data) {
        this.method = method;
        this.data = data;
    }
}


export default class API extends EEE {
    constructor (token, options) {
        super();

        this.token = this._token = token;
        this._debug = options.debug;
    }

    async _request (method, data_) {
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

        await this.emit('request', method, data);
        await this.emit('request.' + method, method, data);

        try {
            let result = JSON.parse(await rp(options));
            await this.emit('response', method, data, result);
            await this.emit('response.' + method, method, data, result);

            return result;

        } catch (err) {
            if (err.response) {
                throw new APIError(JSON.parse(err.response.body));
            }
            throw err;
        }
    }

    async sendRequest (req) {
        return await this._request(req.method, req.data);
    }
}

const METHODS = [
    /* Updates */
    'getUpdates', 'setWebhook', 'deleteWebhook', 'getWebhookInfo',
    /* Info */
    'getMe', 'getUserProfilePhotos',
    /* Messages */
    'sendMessage', 'forwardMessage', 'sendPhoto', 'sendAudio', 'sendDocument', 'sendSticker',
    'sendVideo', 'sendVoice', 'sendLocation', 'sendVenue', 'sendContact', 'sendChatAction',
    /* Editing */
    'editMessageText', 'editMessageCaption', 'editMessageReplyMarkup',
    /* Downloads */
    'getFile',
    /* Chats */
    'getChat', 'kickChatMember', 'leaveChat', 'unbanChatMember', 'getChatAdministrators',
    'getChatMembersCount', 'getChatMember',
    /* Inline Queries */
    'answerCallbackQuery', 'answerInlineQuery',
    /* Games */
    'sendGame', 'setGameScore', 'getGameHighScores',
]

for (let method of METHODS) {
    API.prototype[method] = ((m) => async function (data) {
        return await this._request(m, data);
    })(method);
}
