const EEE = require('enhanced-event-emitter');

const Plugin = require('../plugin');


const PROMPT_REPEAT = Symbol('pd.prompt.repeat');
const PROMPT_CANCEL = Symbol('pd.prompt.cancel');
const PROMPT_CANCEL_ALL = Symbol('pd.prompt.cancelAll');
const PROMPT_CONTINUE = Symbol('pd.prompt.continue');


let ORDER = Date.now();

class Prompter {
  constructor (bot, collection, logger) {
    this.bot = bot;
    this.logger = logger;
    this.collection = collection;
  }

  async prompt (chat, user, name, data) {
    const order = ORDER++;

    this.logger.trace('creating prompt "%s:%s:%s"', chat, user, name);

    await this.collection.insert({
      'chat': chat,
      'user': user,
      'name': name,

      'type': 'prompt',
      'order': order,
      'data': data || {},
      'active': false,
    });

    await this._checkAndActivateNext(chat, user, name);
  }

  async notify (chat, user, name, data) {
    const order = ORDER++;

    this.logger.trace('creating notify "%s:%s:%s"', chat, user, name);

    await this.collection.insert({
      'chat': chat,
      'user': user,
      'name': name,

      'type': 'notify',
      'order': order,
      'data': data || {},
      'active': false,
    });

    await this._checkAndActivateNext(chat, user, name);
  }

  async _findNext (chat, user) {
    this.logger.trace('finding next prompt for "%s:%s"', chat, user);
    return await this.collection.findOne({
      $query: {'chat': chat, 'user': user},
      $orderby: {'order': 1},
    });
  }

  async _get (chat, user, name) {
    this.logger.trace('getting prompt "%s:%s:%s"', chat, user, name);

    const prompt = await this.collection.findOne({
      $query: {'chat': chat, 'user': user, 'name': name},
      $orderby: {'order': 1},
    });

    return prompt;
  }

  async _updatePrompt (prompt) {
    await this.collection.update({'_id': prompt._id}, prompt);
  }

  async _remove (chat, user, name) {
    this.logger.trace('removing prompt "%s:%s:%s"', chat, user, name);

    const prompt = await this.collection.findOne({
      $query: {'chat': chat, 'user': user, 'name': name},
      $orderby: {'order': 1},
    });

    await this.collection.remove({'_id': prompt._id});
    return prompt;
  }

  async respond (chat, user, name, response) {
    this.logger.trace('responding to prompt prompt "%s:%s:%s"', chat, user, name);

    const prompt = await this._get(chat, user, name);

    if (prompt) {
      const $res = await this.bot.emit(['prompt.respond', `prompt.respond.${name}`], prompt, response);
      await this._updatePrompt(prompt);

      // let actionCancelAll = false;
      let actionCancel = false;
      let actionRepeat = false;
      let actionContinue = false;

      let result;
      for (const value of $res.values.filter(v => (v !== undefined))) {
        // if (value === PrompterPlugin.PROMPT_CANCEL_ALL) {
        //     actionCancelAll = true;
        // }
        if (value === PrompterPlugin.PROMPT_CANCEL) {
          actionCancel = true;
        }
        if (value === PrompterPlugin.PROMPT_REPEAT) {
          actionRepeat = true;
        }
        if (value === PrompterPlugin.PROMPT_CONTINUE) {
          actionContinue = true;
        }
        if (value !== undefined && typeof value !== 'symbol') {
          result = value;
        }
      }

      // TODO cancelAll
      if (actionCancel) {
        return await this.cancel(chat, user, name);
      }

      if (actionRepeat) {
        return await this.bot.emit(['prompt.request', `prompt.request.${prompt.name}`], prompt);
      }

      if (actionContinue) {
        return null;
      }

      /* if no event handler overrode the result use the message text */
      if (result === undefined) {
        result = response.text;
      }

      /* normal completion */
      await this.complete(chat, user, name, result);
    }
  }

  async complete (chat, user, name, result) {
    this.logger.trace('completing prompt "%s:%s:%s"', chat, user, name);

    const prompt = await this._remove(chat, user, name);

    if (prompt) {
      await this.bot.emit(['prompt.complete', `prompt.complete.${name}`], prompt, result);
    }
    await this._checkAndActivateNext(chat, user);
  }

  async cancel (chat, user, name) {
    this.logger.trace('cancelling prompt "%s:%s:%s"', chat, user, name || '*');

    const prompt = await this._remove(chat, user, name);

    if (prompt) {
      await this.bot.emit(['prompt.cancel', `prompt.cancel.${name}`], prompt);
    }
    await this._checkAndActivateNext(chat, user);
  }

  async _checkAndActivateNext (chat, user) {
    this.logger.trace('trying to activate prompt for "%s:%s"...', chat, user);

    const prompt = await this.collection.findOne({
      $query: {'chat': chat, 'user': user},
      $orderby: {'order': 1},
    });

    if (prompt && !prompt.active) {
      prompt.active = true;
      await this.collection.update({'_id': prompt._id}, prompt);

      switch (prompt.type) {
        case null:
        case 'prompt': {
          this.logger.trace('activated prompt "%s:%s:%s"...', chat, user, prompt.name);
          return await this.bot.emit(['prompt.request', `prompt.request.${prompt.name}`], prompt);
        }

        case 'notify': {
          this.logger.trace('activated notify "%s:%s:%s"...', chat, user, prompt.name);
          await this._remove(chat, user, prompt.name);
          return await this.bot.emit(['prompt.notify', `prompt.notify.${prompt.name}`], prompt);
        }
      }
    }
  }
}

/* === PLUGIN DEFINITION === */

const PrompterPlugin = Plugin.define('prompter', ['messages', 'mongo'], {
  defaultConfig: {
    'collection': '_prompter_',
  },
}, {
  async start (config) {
    const collection = this.bot.mongo.collection(config.collection);
    const prompter = new Prompter(this.bot, collection, this.logger);

    this.on('message', async ($evt, msg, type) => {
      const prompt = await prompter._findNext(msg.chat.id, msg.from.id);
      if (prompt && prompt.active) {
        /* Found -- end the prompt, stop the event */
        $evt.stop();
        return await prompter.respond(prompt.chat, prompt.user, prompt.name, msg);
      }
    }, EEE.PRIORITY.HIGH);

    this.bot.prompter = prompter;
  },
});

PrompterPlugin.PROMPT_REPEAT = PROMPT_REPEAT;
PrompterPlugin.PROMPT_CANCEL = PROMPT_CANCEL;
PrompterPlugin.PROMPT_CANCEL_ALL = PROMPT_CANCEL_ALL;
PrompterPlugin.PROMPT_CONTINUE = PROMPT_CONTINUE;

module.exports = PrompterPlugin;
