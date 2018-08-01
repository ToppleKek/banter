const SCHEMA = require('../serverConfigSchema.json');
const atob = require('atob');
const btoa = require('btoa');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(SCHEMA);

module.exports = {
  decodeConfig(base64) {
    try {
      return JSON.parse(atob(base64));
    } catch (e) {
      console.log(`[ERROR] Parsing config failed! ${e}`);
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
};