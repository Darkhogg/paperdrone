const EEE = require('enhanced-event-emitter');
const request = require('request-promise');


class APIError extends Error {
    constructor (res) {
        super();

        this.message = `API Error ${res.error_code}: ${res.description}`;
        this.apiResult = res;
    }
}


class APIRequest {
    constructor (method, data) {
        this.method = method;
        this.data = data;
    }

    getForm () {
        return Object.assign({'method': this.method}, APIRequest.serializeForm(this.data));
    }

    static serializeForm (data) {
        const formData = Object.assign({}, data);

        for (const key in formData) {
            if (typeof formData[key] === 'object') {
                formData[key] = JSON.stringify(formData[key]);
            }
        }

        return formData;
    }
}


class API extends EEE {
    constructor (token, options) {
        super();

        this.token = this._token = token;
        this._debug = options.debug;
    }

    async _request (method, data_) {
        const data = data_ || {};
        const options = {
            'method': 'POST',
            'form': APIRequest.serializeForm(data),
            'uri': `https://api.telegram.org/bot${this._token}/${method}`,
        }

        await this.emit(['request', `request.${method}`], method, data);

        try {
            const result = JSON.parse(await request(options));
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
    'editMessageText', 'editMessageCaption', 'editMessageReplyMarkup', 'deleteMessage',
    /* Downloads */
    'getFile',
    /* Chats */
    'getChat', 'getChatAdministrators', 'getChatMembersCount', 'getChatMember',
    'leaveChat', 'setchatPhoto', 'deletechatPhoto', 'setChatTitle', 'setChatDescription',
    'pinChatMessage', 'unpinChatMessage', 'kickChatMember', 'unbanChatMember',
    'restrictChatMember', 'promoteChatMember', 'exportChatInviteLink',
    /* Inline Queries */
    'answerCallbackQuery', 'answerInlineQuery',
    /* Games */
    'sendGame', 'setGameScore', 'getGameHighScores',
    /* Payments */
    'sendInvoice', 'answerShippingQuery', 'answerPreCheckoutQuery',
]

for (const method of METHODS) {
    API.prototype[method] = ((m) => async function (data) {
        return await this._request(m, data);
    })(method);
}

module.exports = API;
module.exports.APIRequest = APIRequest;
module.exports.APIError = APIError;
