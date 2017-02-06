import EEE from 'enhanced-event-emitter';
import rp from 'request-promise';


export class APIError extends Error {
    constructor (res) {
        super();

        this.message = `API Error ${res.error_code}: ${res.description}`;
        this.apiResult = res;
    }
}


export class APIRequest {
    constructor (method, data) {
        this.method = method;
        this.data = data;
    }

    getForm () {
        return Object.assign({'method': this.method}, APIRequest.serializeForm(this.data));
    }

    static serializeForm (data) {
        let formData = Object.assign({}, data);

        for (let key in formData) {
            if (typeof formData[key] === 'object') {
                formData[key] = JSON.stringify(formData[key]);
            }
        }

        return formData;
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
            'form': APIRequest.serializeForm(data),
            'uri': `https://api.telegram.org/bot${this._token}/${method}`,
        }

        await this.emit(['request', `request.${method}`], method, data);

        try {
            let result = JSON.parse(await rp(options));
            await this.emit(['response', `response.${method}`], method, data, result);

            return result.result;

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
