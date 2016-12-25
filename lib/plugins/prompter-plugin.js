import EEE from 'enhanced-event-emitter';
import moment from 'moment';
import Promise from 'bluebird';

import Plugin from '../plugin';

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
            'data': data,
            'active': false
        });
        await this._checkAndActivateNext(chat, user, name);
    }

    async _get (chat, user) {
        this.logger.trace('finding next prompt for "%s:%s"', chat, user);
        return this.storage.queryOne({ 'chat': chat, 'user': user }, {'order': 1});
    }

    async _remove (chat, user, name) {
        this.logger.trace('removing prompt "%s:%s:%s"', chat, user, name);

        let prompt = await this.storage.queryOne({ 'chat': chat, 'user': user, 'name': name });
        await this.storage.delete(prompt.id);
        return prompt;
    }

    async complete (chat, user, name, result) {
        this.logger.trace('completing prompt "%s:%s:%s"', chat, user, name);

        let prompt = await this._remove(chat, user, name);

        if (prompt) {
            await this.bot.emit(['prompt.complete', 'prompt.complete.'+name], prompt, result);
            await this._checkAndActivateNext(chat, user);
        }
    }

    async cancel (chat, user, name) {
        this.logger.trace('cancelling prompt "%s:%s:%s"', chat, user, name || '*');

        await this._remove(chat, user, name);
        await this._checkAndActivateNext(chat, user);
    }

    async _checkAndActivateNext (chat, user) {
        this.logger.trace('trying to activate prompt for "%s:%s"...', chat, user);

        let prompt = await this.storage.queryOne({ 'chat': chat, 'user': user }, 0, null, { 'order': 1 });

        if (prompt && !prompt.active) {
            prompt.active = true;
            await this.storage.update(prompt.id, prompt);
            this.logger.trace('activated prompt "%s:%s:%s"...', chat, user, prompt.name);

            await this.bot.emit(['prompt.request', 'prompt.request.' + prompt.name], prompt, prompt.data);
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
            let prompt = await bot.prompter._get(msg.chat.id, msg.from.id);
            if (prompt && prompt.active) {
                /* Found -- end the prompt, stop the event */
                $evt.stop();
                await bot.prompter.complete(prompt.chat, prompt.user, prompt.name, msg);
            }
        }, EEE.PRIORITY.HIGH);
    }
}
