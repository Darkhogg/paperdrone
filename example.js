#!/usr/bin/env node
'use strict';
const crashit = require('crashit');
const pd = require('.');
const bunyan = require('bunyan');

crashit.handleUncaught(true);
crashit.handleSignals(['SIGINT', 'SIGTERM'], true);
process.on('unhandledRejection', (err) => crashit.crash(err));

crashit.addHook((cause) => {
    console.error(cause.stack || cause);
});

(async () => {
    const logger = bunyan.createLogger({
        'name': `pdex.${process.argv[2]}`,
        'level': 'trace',
    });

    const ExamplePlugin = require(`./examples/${process.argv[2]}`);

    const bot = await pd.createBot(process.argv[3], {'logger': logger});
    bot.useAndEnable(ExamplePlugin);
    bot.configure('mongo', {'uri': 'mongodb://127.0.0.1/paperdrone', 'prefix': `pd-ex.${process.argv[2]}.`})
    bot.configureAndEnable('polling', {'timeout': 3});
    bot.configureAndEnable('ticking', {'interval': 5});

    await bot.start();
})();
