const SCHEMA = require('../serverConfigSchema.json');
const atob = require('atob');
const btoa = require('btoa');
const Ajv = require('ajv');
const mainModule = require('../bot.js');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(SCHEMA);

module.exports = {
  decodeConfig(base64) {
    try {
      return JSON.parse(atob(base64));
    } catch (e) {
      console.log(`[ERROR] Parsing config failed! ERROR\n${e}\nEND ERROR\n base64: ${base64}`);
      return e;
    }
  },

  encodeConfig(json) {
    try {
      return btoa(JSON.stringify(json));
    } catch (e) {
      console.log(`[ERROR] Encoding config failed! ${e}`);
      return e;
    }
  },

  validateConfig(json) {
    return validate(json);
  },

  getConfig(guild) {
    return new Promise((resolve, reject) => {
      mainModule.db.get(`SELECT config FROM servers WHERE id = ${guild.id}`, (err, row) => {
        if (err) reject(err);
        else if (row && row.config) resolve(row.config);
        else resolve(null);
      });
    });
  }
};