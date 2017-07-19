const bunyan = require('bunyan');
const tsort = require('tsort');
const EEE = require('enhanced-event-emitter');
const Promise = require('bluebird');

const API = require('./api');

class Bot extends EEE {
  constructor (token, options) {
    super();

    this._options = options;
    this.id = token.split(':')[0];

    this.logger = (options.logger || bunyan.createLogger({'name': 'paperdrone'})).child({
      'bot': this.id,
    });

    this.api = new API(token, options);
    this.plugins = new Map();

    this._enabledPlugins = new Map();
    this._configPlugins = new Map();
  }

  static use (PluginCls) {
    const name = PluginCls.shortName;
    Bot.plugins.set(name, PluginCls);
    return name;
  }

  use (PluginCls) {
    const name = PluginCls.shortName;
    this.plugins.set(name, PluginCls);
    return name;
  }

  _getPlugin (name) {
    return this.plugins.get(name)
            || Bot.plugins.get(name);
  }

  configure (name, config) {
    const oldConfig = this._configPlugins.has(name) ? this._configPlugins.get(name) : {};
    this._configPlugins.set(name, Object.assign({}, oldConfig, config));
  }

  _getConfig (name) {
    const userConfig = this._configPlugins.get(name);
    const dfltConfig = this._getPlugin(name).options.defaultConfig || {};

    return Object.assign({}, dfltConfig, userConfig);
  }

  enable (...names) {
    for (let name of names) {
      if (!this._enabledPlugins.has(name)) {
        const PluginCls = this._getPlugin(name);
        if (!PluginCls) {
          throw new Error('cannot find plugin: ' + name);
        }
        const plugin = new PluginCls(this, this.logger.child({'plugin': name}));
        this._enabledPlugins.set(name, plugin);
        this.enable(...PluginCls.dependencies.filter(d => d[0] !== '%'));
      }
    }
  }

  useAndEnable (PluginCls) {
    const name = this.use(PluginCls);
    this.enable(name);
    return name;
  }

  configureAndEnable (name, config) {
    this.configure(name, config);
    this.enable(name);
    return name;
  }

  useConfigureAndEnable (PluginCls, config) {
    const name = this.use(PluginCls);
    this.configure(name, config);
    this.enable(name);
    return name;
  }

  async start (...names) {
    this.enable(...names);

    /* build start order */
    const graph = tsort();
    for (const name of this._enabledPlugins.keys()) {
      const deps = this._getPlugin(name).dependencies.map(d => d.replace('%', ''));
      graph.add(name);
      for (const dep of deps) {
        graph.add(dep, name);
      }
    }
    const sortedNames = graph.sort();

    /* run start methods */
    const startPromises = {};
    for (const name of sortedNames) {
      const plugin = this._enabledPlugins.get(name);
      if (plugin) {
        const config = this._getConfig(name);

        const depPromises = graph.nodes[name].map(dep => startPromises[dep]);
        startPromises[name] = Promise.all(depPromises)
          .then(() => plugin._start(config));
      }
    }

    /* wait for all to start */
    await Promise.all(Object.values(startPromises));
    this.logger.trace('Bot #%s has started', this.id);
  }


  async stop () {
    const graph = tsort();
    for (const name of this._enabledPlugins.keys()) {
      const deps = this._getPlugin(name).dependencies.map(d => d.replace('%', ''));
      graph.add(name);
      for (const dep of deps) {
        graph.add(name, dep);
      }
    }
    const sortedNames = graph.sort();

    const stopPromises = {};
    for (const name of sortedNames) {
      const plugin = this._enabledPlugins.get(name);
      if (plugin) {
        const config = this._getConfig(name);

        const depPromises = graph.nodes[name].map(dep => stopPromises[dep]);
        stopPromises[name] = Promise.all(depPromises)
          .then(() => plugin._stop(config));
      }
    }

    await Promise.all(Object.values(stopPromises));
    this.logger.trace('Bot #%s has stopped', this.id);
  }
}

Bot.plugins = new Map();

module.exports = Bot;
