const cachefn = require('cachefn');
const Promise = require('bluebird');

const Plugin = require('../plugin');
const utils = require('../utils');


async function getBotInfo () {
  const info = await this.api.getMe();
  info.full_name = utils.fullName(info.first_name, info.last_name);
  return info;
}

async function getFilePath (api, fileId) {
  const file = await api.getFile({'file_id': fileId});
  return api.buildFileLink(file.file_path);
}

async function getBotAvatar () {
  const photos = await this.api.getUserProfilePhotos({'user_id': this.id});
  if (photos.total_count === 0) {
    return {};
  }

  const mainPhoto = photos.photos[0];
  const mainSizes = mainPhoto.sort((sa, sb) => (sa.width * sa.height) - (sb.width * sb.height));

  const sizes = {
    'small': getFilePath(this.api, mainSizes[0].file_id),
    'medium': getFilePath(this.api, mainSizes[Math.floor(mainSizes.length / 2)].file_id),
    'big': getFilePath(this.api, mainSizes[mainSizes.length - 1].file_id),
  };

  return await Promise.props(sizes);
}

module.exports = Plugin.define('info', [], {
  defaultConfig: {
    'cache_timeout': '5min',
  },
}, {
  async start (config) {
    this.bot.info = cachefn(getBotInfo, '5min', this.bot);
    this.bot.avatar = cachefn(getBotAvatar, '30min', this.bot);
  },

  time () {
    const t = process.hrtime();
    return t[0] + (t[1] * 1e-9);
  },
});
