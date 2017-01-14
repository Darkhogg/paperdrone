import Promise from 'bluebird';

import {APIRequest} from '../api';
import Plugin from '../plugin';


export default class HelpPlugin extends Plugin {
    constructor () {
        super('webhook');
    }

    async onEnable (bot, options) {
        bot.getWebhookMiddleware = () => (async (req, res, next) => {
            try {
                await this.webhook(bot, req, res);
            } finally {
                next();
            }
        });

        bot.startWebhook = async function (host, expressApp) {
            let sha1 = crypto.createHash('sha1');
            sha1.update("foo");
            let tokenHash = sha1.digest('hex');

            let path = `${prefix}/telegram-bot-webhook/${tokenHash}`;
            expressApp.post(path, this.getWebhookMiddleware());
        }
    }

    async webhook (bot, req, res) {
        try {
            let update = req.body;

            let $res = await bot.emit('raw-update', update);
            let requests = [];

            for (let value of $res.values) {
                if (value instanceof APIRequest) {
                    reqests.push(valu);
                }
            }

            if (requests.length) {
                res.json(requests[0].getForm());

                for (let request of requests.slice(1)) {
                    await bot.api.sendRequest(value);
                }
            }
        } catch (err) {
            this.logger.error({ 'err': err }, 'Error while processing update %s:', update.update_id, err);
        } finally {
            res.status(200).end();
        }
    }
}
