import mongo from 'mongodb-bluebird';

import Plugin from '../plugin';


const CHARS = '0123456789QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm';
function randomId () {
    let id = new Array(12);

    for (let i = 0; i < id.length; i++) {
        id[i] = CHARS[Math.floor(Math.random() * CHARS.length)];
    }

    return id.join('');
}


class MongoStorage {
    constructor (collection) {
        this.coll = collection;
    }

    async insert (id, data) {
        data._id = id || randomId();
        delete data.id;
        await this.coll.insert(data);
        return data._id;
    }

    async update (id, data) {
        delete data.id;
        await this.coll.update({ '_id': id}, {$set: data});
    }

    async upsert (id, data) {
        delete data.id;
        await this.coll.update({ '_id': id}, {$set: data}, { upsert: true });
    }

    async delete (...ids) {
        await this.coll.remove({ '_id': { $in: ids } });
    }

    async fetch (id) {
        let data = await this.coll.findOne({ '_id': id });
        if (data) {
            delete data._id;
        }
        return data;
    }

    async list (skip=0, limit=null, sort={}) {
        if (sort && sort.id) {
            sort._id = sort.id;
            delete sort.id;
        }

        let datas = await this.coll.find({}, {}, {'skip': skip, 'limit': limit, 'sort': sort});
        return datas.map(data => {
            data.id = data._id;
            delete data._id;
            return data;
        })
    }

    async query (query, skip=0, limit=null, sort={}) {
        if (sort && sort.id) {
            sort._id = sort.id;
            delete sort.id;
        }

        if (query && query.id) {
            query._id = query.id;
            delete query.id;
        }

        let results = await this.coll.find(query, {}, {'skip': skip, 'limit': limit, 'sort': sort});
        return results.map(result => {
            result.id = result._id;
            delete result._id;
            return result;
        });
    }

    async queryOne (query, sort={}) {
        let results = await this.query(query, 0, 1, sort);
        return results.length ? results[0] : null;
    }
}

export default class KeyedStoragePlugin extends Plugin {
    constructor () {
        super('storage');
    }

    async onEnable (bot, options) {
        let db = await mongo.connect(options.mongo);
        let prefix = (options.prefix || 'pd{}.').replace('{}', bot.id);

        let storages = new Map();
        bot.storage = function (collName) {
            if (!storages.has(collName)) {
                let collection = db.collection(prefix + collName, {'ObjectId': false});
                storages.set(collName, new MongoStorage(collection));
            }

            return storages.get(collName);
        };
    }
}
