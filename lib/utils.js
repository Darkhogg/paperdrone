exports.detectMessageType = function detectMessageType (message) {
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
  if (message.new_chat_member) {
    return 'memberAdded';
  }
  if (message.left_chat_member) {
    return 'memberRemoved';
  }
  if (message.new_chat_title) {
    return 'chatTitleAdded';
  }
  if (message.new_chat_photo) {
    return 'chatPhotoAdded';
  }
  if (message.delete_chat_photo) {
    return 'chatPhotoDeleted';
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
  if (message.pinned_message) {
    return 'messagePinned';
  }

  return null;
};


exports.fullName = function fullName (first, last) {
  return [first, last].join(' ').trim();
};
