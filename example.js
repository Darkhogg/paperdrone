'use strict';
const pd = require('.');
const mongodb = require('mongodb-bluebird');
const winston = require('winston');

const ExamplePlugin = require('./examples/' + process.argv[2]);

/* Setup the Winston logger */
winston.level = 'silly';
winston.cli();

/* Connect to mongo, create and run bot */
mongodb.connect('mongodb://localhost/paperdrone').then((db) => {
    /* Create a bot with the telegram token passed on the command line */
    var bot = new pd.Bot({
        'token': process.argv[3],
        'mongo': {
            'client': db
        }
    });

    bot.addPlugin(new ExamplePlugin());

    bot.setupPollLoop();
    bot.setupTickLoop();
});
