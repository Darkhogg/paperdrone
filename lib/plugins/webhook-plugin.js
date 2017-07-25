const bodyParser = require('body-parser');
const crypto = require('crypto');
const Promise = require('bluebird');

const Plugin = require('../plugin');


module.exports = Plugin.define('webhook', [], {
  async start (config) {
    this.logger.trace('configuring webhook with prefix: %s', config.uri_prefix);

    const tokenHash = crypto.createHash('sha1').update(this.bot.api.token).digest('hex');

    const webhookPath = `/paperdrone/${tokenHash}/webhook`;
    config.express_router.post(webhookPath, bodyParser.json(), this.webhook.bind(this));

    this.bot.webhook = {
      get path () {
        return webhookPath;
      },
    };

    await this.api.setWebhook({
      'url': `${config.uri_prefix}${webhookPath}`,
    });
  },

  async webhook (req, res) {
    const update = req.body || {};

    if (!update || !update.update_id) {
      return res.status(400).end();
    }

    try {
      const requests = await this.bot.update(update);

      if (requests.length >= 1) {
        res.json(requests[0].getForm());

        await Promise.map(requests.slice(1), async request => await this.api.sendRequest(request), {'concurrency': 1});
      }

    } catch (err) {
      this.logger.error({'err': err}, 'Error while processing update %s:', update.update_id, err);

    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return res.status(200).end();
    }
  },
});
