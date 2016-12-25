#!/usr/bin/env node
'use strict';
const pd = require('.');
const bunyan = require('bunyan');
const sourceMaps = require('source-map-support');

sourceMaps.install();

var bot = pd.createBot(process.argv[3], {
    'logger': bunyan.createLogger({
        'name': 'pd-ex-' + process.argv[2],
        'level': 'trace'
    })
});

process.on('unhandledRejection', (err) => {
    bot.logger.error(err);
    process.exit(1);
});

const ExamplePlugin = require('./dist/examples/' + process.argv[2]).default;
bot.enable(new ExamplePlugin(), { 'mongo': 'mongodb://127.0.0.1/paperdrone', 'prefix': 'pd-ex.'+process.argv[2]+'.' }).then(() => {
    bot.startPolling(3);
    bot.startTicking(5);
});
