import * as utils from './utils';

import API, { APIError, APIRequest } from './api';
import Bot from './bot';
import Plugin from './plugin';

import CommandsPlugin from './plugins/commands-plugin';
import HelpPlugin from './plugins/help-plugin';
import InfoPlugin from './plugins/info-plugin';
import StoragePlugin from './plugins/storage-plugin';
import MessagesPlugin from './plugins/messages-plugin';
import PrompterPlugin from './plugins/prompter-plugin';
import PollingPlugin from './plugins/polling-plugin';
import SchedulerPlugin from './plugins/scheduler-plugin';
import TickerPlugin from './plugins/ticker-plugin';
import UpdatesPlugin from './plugins/updates-plugin';
import UsersPlugin from './plugins/users-plugin';

/* Export built-in plugins */
export const plugins = {
    'CommandsPlugin': CommandsPlugin,
    'HelpPlugin': HelpPlugin,
    'InfoPlugin': InfoPlugin,
    'StoragePlugin': StoragePlugin,
    'MessagesPlugin': MessagesPlugin,
    'PrompterPlugin': PrompterPlugin,
    'PollingPlugin': PollingPlugin,
    'SchedulerPlugin': SchedulerPlugin,
    'TickerPlugin': TickerPlugin,
    'UpdatesPlugin': UpdatesPlugin,
    //'UsersPlugin': UsersPlugin,
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
    await bot.enable('updates', options);
    await bot.enable('info', options);

    return bot;
};

/* Export utils */
export { utils };

/* Export classes */
export { API, APIError, APIRequest, Bot, Plugin };
