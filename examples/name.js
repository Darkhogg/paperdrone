const pd = require('..');


module.exports = pd.Plugin.define('ex.name', ['messages', 'commands', 'prompter'], {
  async start (config) {
    this.on('command.start', async ($evt, cmd, msg) => {
      await this.bot.prompter.prompt(msg.chat.id, msg.from.id, 'name');
      await this.bot.prompter.prompt(msg.chat.id, msg.from.id, 'age');
      await this.bot.prompter.notify(msg.chat.id, msg.from.id, 'done');
    });

    /* Allow users to cancel the prompt */
    this.on('prompt.response', async ($evt, prompt, response) => {
      if (response.text.indexOf('/cancel') === 0) {
        $evt.stop();
        return pd.plugins.PrompterPlugin.PROMPT_CANCEL;
      }
    }, -100);

    /* Name prompt setup */
    this.on('prompt.request.name', async ($evt, prompt) => {
      await this.api.sendMessage({
        'chat_id': prompt.chat,
        'text': 'Tell me your name',
      });
    });

    this.on('prompt.complete.name', async ($evt, prompt, result) => {
      await this.api.sendMessage({
        'chat_id': prompt.chat,
        'text': `Hello, ${result}!`,
      });
    });

    /* Age prompt setup */
    this.on('prompt.request.age', async ($evt, prompt) => {
      await this.api.sendMessage({
        'chat_id': prompt.chat,
        'text': 'Tell me your age',
      });
    });

    this.on('prompt.response.age', async ($evt, prompt, response) => {
      const age = parseInt(response.text);
      if (isNaN(age) || age <= 0) {
        await this.api.sendMessage({
          'chat_id': prompt.chat,
          'text': 'That\'s not an age!',
        });
        return pd.plugins.PrompterPlugin.PROMPT_REPEAT;
      }

      return age;
    });

    this.on('prompt.complete.age', async ($evt, prompt, result) => {
      await this.api.sendMessage({
        'chat_id': prompt.chat,
        'text': `Hello, ${result} years old person!`,
      });
    });

    /* All done notification */
    this.on('prompt.notify.done', async ($evt, prompt) => {
      await this.api.sendMessage({
        'chat_id': prompt.chat,
        'text': 'All done!',
      });
    });
  },
});
