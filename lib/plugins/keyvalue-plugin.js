const Plugin = require('../plugin');

const ESCAPE = /[\\^$*+?.()|[\]{}]/g;
function escapeRegex (str) {
  return str.replace(ESCAPE, '\\$&');
}


module.exports = Plugin.define('keyvalue', ['mongo'], {
  defaultConfig: {
    'collection': '_keyvalue_',
  },
}, {
  async start (config) {
    const kvColl = this.bot.mongo.collection(config.collection);
    await kvColl.createIndex({key: 1});

    this.bot.keyvalue = {
      async get (key) {
        const doc = await kvColl.findOne({key});
        return doc && doc.value;
      },

      async list (prefix = '') {
        const regex = new RegExp('^' + escapeRegex(prefix) + '.*');
        const docs = await kvColl.find({key: regex}).toArray();
        return docs.map(doc => ({'key': doc.key, 'value': doc.value}));
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
