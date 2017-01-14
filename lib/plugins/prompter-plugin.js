import EEE from 'enhanced-event-emitter';
import moment from 'moment';
import Promise from 'bluebird';

import Plugin from '../plugin';


const PROMPT_REPEAT = Symbol('pd.prompt.repeat');
const PROMPT_CANCEL = Symbol('pd.prompt.cancel');
const PROMPT_CANCEL_ALL = Symbol('pd.prompt.cancelAll');
const PROMPT_CONTINUE = Symbol('pd.prompt.continue');


let ORDER = Date.now();

class Prompter {
    constructor (bot, options, logger) {
        this.bot = bot;
        this.logger = logger;
        this.storage = bot.storage('_prompter_');
    }

    async prompt (chat, user, name, data) {
        let order = ORDER++;

        this.logger.trace('creating prompt "%s:%s:%s"', chat, user, name);

        await this.storage.insert(null, {
            'chat': chat,
            'user': user,
            'name': name,

            'order': order,
            'data': data || {},
            'active': false
        });

        await this._checkAndActivateNext(chat, user, name);
    }

    async _findNext (chat, user) {
        this.logger.trace('finding next prompt for "%s:%s"', chat, user);
        return this.storage.queryOne({ 'chat': chat, 'user': user }, {'order': 1});
    }

    async _get (chat, user, name) {
        this.logger.trace('getting prompt "%s:%s:%s"', chat, user, name);

        let prompt = await this.storage.queryOne({ 'chat': chat, 'user': user, 'name': name }, {'order': 1});
        return prompt;
    }

    async _updatePrompt (prompt) {
        await this.storage.update(prompt.id, prompt);
    }

    async _remove (chat, user, name) {
        this.logger.trace('removing prompt "%s:%s:%s"', chat, user, name);

        let prompt = await this.storage.queryOne({ 'chat': chat, 'user': user, 'name': name }, {'order': 1});
        await this.storage.delete(prompt.id);
        return prompt;
    }

    async respond (chat, user, name, response) {
        this.logger.trace('completing prompt "%s:%s:%s"', chat, user, name);

        let prompt = await this._get(chat, user, name);

        if (prompt) {
            let $res = await this.bot.emit(['prompt.response', 'prompt.response.'+name], prompt, response);
            await this._updatePrompt(prompt);

            let actionCancelAll = false;
            let actionCancel = false;
            let actionRepeat = false;
            let actionContinue = false;

            let result;
            for (let value of $res.values.filter(v => (v !== null && v !== undefined))) {
                if (value === PrompterPlugin.PROMPT_CANCEL_ALL) {
                    actionCancelAll = true;
                }
                if (value === PrompterPlugin.PROMPT_CANCEL) {
                    actionCancel = true;
                }
                if (value === PrompterPlugin.PROMPT_REPEAT) {
                    actionRepeat = true;
                }
                if (value === PrompterPlugin.PROMPT_CONTINUE) {
                    actionContinue = true;
                }
                if (result === undefined && typeof value !== 'symbol') {
                    result = value;
                }
            }

            // TODO cancelAll
            if (actionCancel) {
                return await this.cancel(chat, user, name);
            }

            if (actionRepeat) {
                return await this.bot.emit(['prompt.request', 'prompt.request.' + prompt.name], prompt);
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

        let prompt = await this._remove(chat, user, name);

        if (prompt) {
            await this.bot.emit(['prompt.complete', 'prompt.complete.'+name], prompt, result);
        }
        await this._checkAndActivateNext(chat, user);
    }

    async cancel (chat, user, name) {
        this.logger.trace('cancelling prompt "%s:%s:%s"', chat, user, name || '*');

        let prompt = await this._remove(chat, user, name);

        if (prompt) {
            await this.bot.emit(['prompt.cancel', 'prompt.cancel.'+name], prompt);
        }
        await this._checkAndActivateNext(chat, user);
    }

    async _checkAndActivateNext (chat, user) {
        this.logger.trace('trying to activate prompt for "%s:%s"...', chat, user);

        let prompt = await this.storage.queryOne({ 'chat': chat, 'user': user }, 0, null, { 'order': 1 });

        if (prompt && !prompt.active) {
            prompt.active = true;
            await this.storage.update(prompt.id, prompt);
            this.logger.trace('activated prompt "%s:%s:%s"...', chat, user, prompt.name);

            await this.bot.emit(['prompt.request', 'prompt.request.' + prompt.name], prompt);
        }
    }
}

/* === PLUGIN DEFINITION === */

export default class PrompterPlugin extends Plugin {
    constructor () {
        super('prompter', ['messages', 'storage']);
    }

    async onEnable (bot, options) {
        bot.prompter = new Prompter(bot, options, this.logger);

        bot.on('message', async ($evt, msg, type) => {
            let prompt = await bot.prompter._findNext(msg.chat.id, msg.from.id);
            if (prompt && prompt.active) {
                /* Found -- end the prompt, stop the event */
                $evt.stop();
                await bot.prompter.respond(prompt.chat, prompt.user, prompt.name, msg);
            }
        }, EEE.PRIORITY.HIGH);
    }
}

PrompterPlugin.PROMPT_REPEAT = PROMPT_REPEAT;
PrompterPlugin.PROMPT_CANCEL = PROMPT_CANCEL;
PrompterPlugin.PROMPT_CANCEL_ALL = PROMPT_CANCEL_ALL;
PrompterPlugin.PROMPT_CONTINUE = PROMPT_CONTINUE;
