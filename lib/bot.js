import _ from 'lodash';
import bunyan from 'bunyan';
import EEE from 'enhanced-event-emitter';
import Promise from 'bluebird';

import API from './api';
import Plugin from './plugin';

export default class Bot extends EEE {
    constructor (token, options) {
        super();

        this._options = options;
        this.id = token.split(':')[0];

        this.logger = (options.logger || bunyan.createLogger({'name': 'paperdrone'})).child({
            'bot': this.id,
        });

        this.api = new API(token, options);

        this._enabledPlugins = new Set();
    }

    static define (plugin) {
        Bot.plugins.set(plugin.name, plugin);
        return true;
    }

    async enable (pluginOrName, options) {
        if (pluginOrName instanceof Plugin) {
            if (!Bot.plugins.has(pluginOrName.name)) {
                Bot.define(pluginOrName);
            }
        }

        let name = pluginOrName.name || pluginOrName;

        if (!this._enabledPlugins.has(name)) {
            this._enabledPlugins.add(name);

            let plugin = Bot.plugins.get(name);
            if (!plugin) {
                throw new Error('cannot find plugin: ' + name);
            }
            plugin.logger = this.logger.child({'plugin': name});

            for (let dependency of plugin.dependencies) {
                await this.enable(dependency, options);
            }

            this.logger.trace('enabled plugin "%s"', plugin.name);
            await plugin.onEnable(this, options);
        }
    }
}

Bot.plugins = new Map();
