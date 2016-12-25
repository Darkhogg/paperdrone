import Promise from 'bluebird';
import moment from 'moment';
import _ from 'lodash';

import Plugin from '../plugin';


class UsersManager {
    constructor (bot, options, logger) {
        this.bot = bot;
        this.logger = logger;
        this.storage = bot.storage('_users_');
    }

    async get (id) {
        return await this.storage.fetch(id);
    };

    list (since, a1, a2) {
        var sinceDate = moment(since).toDate();
        var skip = (a2 !== undefined) ? a1 : 0;
        var howMany = (a2 !== undefined) ? a2 : a1 || 100;

        return self.mongo.find({'last_active': { $gt: sinceDate }}, {}, {
            'sort': {'last_active': -1},
            'skip': skip,
            'limit': howMany
        }).then(function (users) {
            return users.map(function (user) {
                user.id = user._id;
                delete user._id;
                return user;
            });
        });
    };

    countActive (date, spec) {
        var self = this;

        var date = moment(date)
        var spec = spec || {
            'year': moment.duration(1, 'year').asSeconds(),
            'month': moment.duration(30, 'days').asSeconds(),
            'week': moment.duration(7, 'days').asSeconds(),
            'day': moment.duration(1, 'day').asSeconds(),
        };

        return Promise.map(_.toPairs(spec), (pair) => {
            return self.mongo.count({
                'last_active': {
                    $gt: date.subtract(pair[1], 'seconds').toDate()
                }
            }).then((num) => [pair[0], num]);
        }).then((pairs) => _.fromPairs(pairs));
    }

    async updateActive (userId, date=Date.now()) {
        let when = moment(date).toDate();

        let user = await this.storage.fetch(userId);
        if (user && user.last_active < when) {
            user.last_active = when;
            await this.storage.update(userId, user);
        }
    };

    async _onReceiveMessage (message) {
        var self = this;

        var user = message.from;
        var chat = message.chat;

        var now = new Date();

        await this.storage.upsert(user.id, {
            'user_id': user.id,
            'chat_id': chat.id,

            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.full_name,
            'username': user.username,

            'last_message': now,
            'last_active': now
        });
    }
}


export default class UsersPlugin extends Plugin {
    constructor () {
        super('users', ['messages', 'storage']);
    }

    async onEnable (bot, options) {
        bot.users = new UsersManager(bot, options, this.logger);

        bot.on('message', async ($evt, msg) => {
            await bot.users._onReceiveMessage(msg);
        });
    }
}
