const camelCase = require('lodash.camelcase');
const upperFirst = require('lodash.upperfirst');

const REGEX_NAME = /^[a-z_.]+$/;

class Plugin {
  static define (name, dependencies, optionsOrPrototype, maybePrototype) {
    if (!REGEX_NAME.exec(name)) {
      throw new Error(`invalid Plugin name: "${name}", should match: ${REGEX_NAME}`);
    }

    const options = (maybePrototype === undefined) ? {} : optionsOrPrototype;
    const prototype = (maybePrototype === undefined) ? optionsOrPrototype : maybePrototype;

    const SubPlgCls = class SubPlgCls extends Plugin {
      constructor (...args) {
        super(SubPlgCls, ...args);
      }
    };
    const className = `${upperFirst(camelCase(name)).replace(/Plugin$/, '')}Plugin`;
    Object.defineProperty(SubPlgCls, 'name', {value: className, writable: false});
    Object.assign(SubPlgCls.prototype, prototype);

    SubPlgCls.options = options;
    SubPlgCls.shortName = name;
    SubPlgCls.dependencies = new Set(dependencies);

    return SubPlgCls;
  }

  constructor (Cls, bot, logger) {
    this.bot = bot;
    this.logger = logger;
    this._hooks = [];
  }

  get api () {
    return this.bot.api;
  }

  async on (name, ...args) {
    const hook = this.bot.on(name, ...args);
    this._hooks.push({name, hook});
  }

  async _start (config) {
    const finalConfig = Object.assign({}, config, this.constructor.options.defaultConfig);
    await this.start(finalConfig);
  }

  async _stop (config) {
    const finalConfig = Object.assign({}, config, this.constructor.options.defaultConfig);
    await this.stop(finalConfig);

    for (const {name, hook} of this._hooks) {
      this.bot.off(name, hook);
    }
  }

  async start (config) {/* overridable */}
  async stop (config) {/* overridable */}
}

module.exports = Plugin;
