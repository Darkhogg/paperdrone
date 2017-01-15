import bodyParser from 'body-parser';
import crypto from 'crypto';
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

        bot.startWebhook = async function (prefix, expressApp) {
            this.logger.trace('configuring webhook with prefix: %s', prefix);

            let sha1 = crypto.createHash('sha1');
            sha1.update(bot.api.token);
            let tokenHash = sha1.digest('hex');

            let path = `/telegram-bot-webhook/${tokenHash}`;
            expressApp.post(path, bodyParser.json(), this.getWebhookMiddleware());

            await bot.api.setWebhook({
                'url': `${prefix}${path}`,
                'max_connections': 1, // temporary
            });
        }
    }

    async webhook (bot, req, res) {
        let update = req.body || {};

        if (!update || !update.update_id) {
            return res.status(400).end();
        }

        try {
            let $res = await bot.emit('raw-update', update);
            let requests = [];

            for (let value of $res.values) {
                if (value instanceof APIRequest) {
                    requests.push(value);
                }
            }

            if (requests.length >= 1) {
                res.json(requests[0].getForm());

                for (let request of requests.slice(1)) {
                    await bot.api.sendRequest(value);
                }
            }
        } catch (err) {
            this.logger.error({ 'err': err }, 'Error while processing update %s:', update.update_id, err);
        } finally {
            return res.status(200).end();
        }
    }
}
