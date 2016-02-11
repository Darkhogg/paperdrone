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


exports.detectActionType = function detectActionType (message) {
    if (message.new_chat_participant) {
        return 'participantAdded';
    }
    if (message.left_chat_participant) {
        return 'participantRemoved';
    }
    if (message.new_chat_title) {
        return 'chatTitle'
    }
    if (message.new_chat_photo) {
        return 'chatPhoto'
    }
    if (message.group_chat_created) {
        return 'newGroup';
    }
    if (message.supergroup_chat_created) {
        return 'newSupergroup';
    }
    if (message.channel_chat_created) {
        return 'newChannel';
    }
    if (message.migrate_to_chat_id) {
        return 'migrateTo';
    }
    if (message.migrate_from_chat_id) {
        return 'migrateFrom';
    }

    return null;
}
