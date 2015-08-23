module.exports = {
    /* Export classes */
    API: require('./lib/api'),
    Bot: require('./lib/bot'),
    Marker: require('./lib/marker'),
    Plugin: require('./lib/plugin'),

    /* Export built-in markers */
    markers: {
        RamMarker: require('./lib/markers/ram-marker'),
    },

    /* Export built-in deciders */
    deciders: {
        DirectDecider: require('./lib/deciders/direct-decider'),
    },

    /* Export built-in plugins */
    plugins: {
        BotInfoPlugin: require('./lib/plugins/bot-info-plugin'),
        MessagesPlugin: require('./lib/plugins/messages-plugin'),
    },
};
