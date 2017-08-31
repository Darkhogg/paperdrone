const Plugin = require('../plugin');


module.exports = Plugin.define('keyvalue', ['mongo'], {
  defaultConfig: {
    'collection': '_keyvalue_',
  },
}, {
  async start (config) {
    const kvColl = this.bot.mongo.collection(config.collection);

    this.bot.keyvalue = {
      async get (key) {
        const doc = await kvColl.findOne({key});
        return doc && doc.value;
      },

      async set (key, value) {
        await kvColl.update({key}, {$set: {value}}, {upsert: true});
      },

      async del (key) {
        await kvColl.remove({key});
      },
    };
  },
});
