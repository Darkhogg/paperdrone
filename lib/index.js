import * as utils from './utils';

import API, { APIError, APIRequest } from './api';
import Bot from './bot';
import Plugin from './plugin';

import CommandsPlugin from './plugins/commands-plugin';
import HelpPlugin from './plugins/help-plugin';
import InfoPlugin from './plugins/info-plugin';
import MessagesPlugin from './plugins/messages-plugin';
import PollingPlugin from './plugins/polling-plugin';
import PrompterPlugin from './plugins/prompter-plugin';
import QueriesPlugin from './plugins/queries-plugin';
import SchedulerPlugin from './plugins/scheduler-plugin';
import StoragePlugin from './plugins/storage-plugin';
import TickerPlugin from './plugins/ticker-plugin';
import UpdatesPlugin from './plugins/updates-plugin';
import UsersPlugin from './plugins/users-plugin';
import WebhookPlugin from './plugins/webhook-plugin';

/* Export built-in plugins */
export const plugins = {
    'CommandsPlugin': CommandsPlugin,
    'HelpPlugin': HelpPlugin,
    'InfoPlugin': InfoPlugin,
    'MessagesPlugin': MessagesPlugin,
    'PollingPlugin': PollingPlugin,
    'PrompterPlugin': PrompterPlugin,
    'QueriesPlugin': QueriesPlugin,
    'SchedulerPlugin': SchedulerPlugin,
    'StoragePlugin': StoragePlugin,
    'TickerPlugin': TickerPlugin,
    'UpdatesPlugin': UpdatesPlugin,
    //'UsersPlugin': UsersPlugin,
    'WebhookPlugin': WebhookPlugin,
};

for (let plugin in plugins) {
    Bot.define(new plugins[plugin]());
}

/* Export bot creation main function */
export async function createBot (token, options) {
    let bot = new Bot(token, options);

    /* Enable basic plugins */
    await bot.enable('ticker', options);
    await bot.enable('polling', options);
    await bot.enable('webhook', options);
    await bot.enable('updates', options);
    await bot.enable('info', options);

    return bot;
};

/* Export utils */
export { utils };

/* Export classes */
export { API, APIError, APIRequest, Bot, Plugin };
