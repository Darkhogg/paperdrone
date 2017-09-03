const mongodb = require('mongodb');

const Plugin = require('../plugin');


module.exports = Plugin.define('mongo', [], {
  defaultConfig: {
    'uri': null,
    'prefix': '',
  },
}, {
  async start (config) {
    if (!config.uri) {
      throw new Error('MongoDB URI (config path: "uri") not set');
    }

    const mongo = await mongodb.MongoClient.connect(config.uri);

    this.mongo = mongo;
    this.bot.mongo = {
      collection (name, ...rest) {
        return mongo.collection(`${config.prefix}${name}`, ...rest);
      },
    };
  },

  async stop (config) {
    await this.mongo.close();
  },
});

module.exports.ObjectId = mongodb.ObjectId;
