#!/usr/bin/env node
const crashit = require('crashit');
const express = require('express');
const pd = require('.');
const bunyan = require('bunyan');

crashit.handleUncaught(true);
crashit.handleSignals(['SIGINT', 'SIGTERM'], true);
process.on('unhandledRejection', (err) => crashit.crash(err));

crashit.addHook((cause) => {
  // eslint-disable-next-line no-console
  console.error(cause.stack || cause);
});

(async () => {
  const logger = bunyan.createLogger({
    'name': `pdex.${process.argv[2]}`,
    'level': 'trace',
  });

  const app = express();

  const ExamplePlugin = require(`./examples/${process.argv[2]}`);

  const bot = await pd.createBot(process.argv[3], {'logger': logger});
  bot.useAndEnable(ExamplePlugin);

  bot.configure('mongo', {'uri': 'mongodb://127.0.0.1/paperdrone', 'prefix': `pd-ex.${process.argv[2]}.`});
  bot.configureAndEnable('polling', {'timeout': 3});
  bot.configureAndEnable('ticking', {'interval': 5});
  // bot.configureAndEnable('monitor', {'express_router': app});
  bot.configureAndEnable('help', {'text': 'Thisis an example bot running as @%%USERNAME%%'});

  bot.enable('chats');

  await bot.start();

  bot.monitor.addTab('test', {name: 'Test'});

  app.listen(1234);
})();
