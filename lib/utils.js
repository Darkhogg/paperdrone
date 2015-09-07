exports.detectMessageType = function detectMessageType (message) {
    if (message.text && message.text.indexOf('/') == 0) {
        return 'command'
    }
    if (message.text) {
        return 'text';
    }
    if (message.document) {
        return 'document';
    }
    if (message.audio) {
        return 'audio';
    }
    if (message.photo) {
        return 'photo';
    }
    if (message.sticker) {
        return 'sticker';
    }
    if (message.video) {
        return 'video';
    }
    if (message.voice) {
        return 'voice';
    }
    if (message.contact) {
        return 'contact';
    }
    if (message.location) {
        return 'location';
    }
    return null;
};
