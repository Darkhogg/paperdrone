const bodyParser = require('body-parser');
const crypto = require('crypto');
const Promise = require('bluebird');

const API = require('../api');
const Plugin = require('../plugin');


module.exports = Plugin.define('webhook', [], {
    async start (options) {
        this.bot.getWebhookMiddleware = () => (async (req, res, next) => {
            try {
                await this.webhook(this.bot, req, res);
            } finally {
                next();
            }
        });

        this.bot.startWebhook = async function (prefix, expressApp) {
            this.logger.trace('configuring webhook with prefix: %s', prefix);

            const tokenHash = crypto.createHash('sha1').update(this.bot.api.token).digest('hex');

            const path = `/telegram-bot-webhook/${tokenHash}`;
            expressApp.post(path, bodyParser.json(), this.getWebhookMiddleware());

            await this.bot.api.setWebhook({
                'url': `${prefix}${path}`,
                'max_connections': 1, // temporary
            });
        }
    },

    async webhook (bot, req, res) {
        const update = req.body || {};

        if (!update || !update.update_id) {
            return res.status(400).end();
        }

        try {
            const $res = await bot.emit('raw-update', update);
            const requests = [];

            for (const value of $res.values) {
                if (value instanceof API.APIRequest) {
                    requests.push(value);
                }
            }

            if (requests.length >= 1) {
                res.json(requests[0].getForm());

                for (const request of requests.slice(1)) {
                    await bot.api.sendRequest(value);
                }
            }
        } catch (err) {
            this.logger.error({ 'err': err }, 'Error while processing update %s:', update.update_id, err);
        } finally {
            return res.status(200).end();
        }
    },
});
