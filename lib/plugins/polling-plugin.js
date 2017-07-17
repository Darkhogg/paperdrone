const Promise = require('bluebird');

const Plugin = require('../plugin');


module.exports = Plugin.define('polling', [], {
  defaultConfig: {
    'timeout': 30,
  },
}, {
  async pollUpdates (timeout = 0, proc = true) {
    if (this.lastPollId !== this.nextPollId) {
      this.logger.trace('polling for updates (starting at %s)...', this.nextPollId);
    }

    try {
      const updates = await this.api.getUpdates({'offset': this.nextPollId, 'timeout': timeout});
      this.lastPollId = this.nextPollId;

      if (proc && updates.length > 0) {
        this.logger.trace('received %s update(s)', updates.length);

        for (const update of updates) {
          try {
            this.nextPollId = Math.max(this.nextPollId, update.update_id + 1);

            const requests = await this.bot.update(update);
            await Promise.map(requests, async request => await this.api.sendRequest(request), {'concurrency': 1});
          } catch (err) {
            this.logger.error({'err': err}, 'Error while processing update %s:', update.update_id, err);
          }
        }
      }
    } catch (err) {
      this.logger.error({'err': err}, 'Error while obtaining updates:', this.lastPollId, err);
    }
  },

  async start (config) {
    this.nextPollId = 0;
    this.lastPollId = -1;

    const pollLoopId = Date.now();
    this.currentPollLoopId = pollLoopId;

    await this.api.deleteWebhook();
    const _iter = async () => {
      await this.pollUpdates(config.timeout);

      if (this.currentPollLoopId === pollLoopId) {
        process.nextTick(_iter);
      } else {
        await this.pollUpdates(0, false);
        this.__onStop();
      }
    };

    process.nextTick(_iter);
  },

  async stop (config) {
    return new Promise((accept, reject) => {
      this.__onStop = accept;
      this.currentPollLoopId = null;
    });
  },
});
