const SCHEMA = require('../serverConfigSchema.json');
const atob = require('atob');
const btoa = require('btoa');
const Ajv = require('ajv');
const mainModule = require('../bot.js');
const CONFIG = require('../config.json');
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
    if (!validate(json)) console.log(validate.errors);
    return validate(json);
  },

  getConfig(guild) {
    return new Promise((resolve, reject) => {
      mainModule.db.get(`SELECT config FROM servers WHERE id = ${guild.id}`, (err, row) => {
        if (err) reject(err);
        else if (row && row.config) {
          let conf = module.exports.decodeConfig(row.config);
          if (module.exports.validateConfig(conf)) resolve(conf);
        }
        else {
          conf = module.exports.decodeConfig(CONFIG.defaultConfig);
          if (module.exports.validateConfig(conf)) resolve(conf);
          else reject(new Error('error:config:defaultConfigInvalid'));
        }
      });
    });
  },

  getAllRows() {
    return new Promise((resolve, reject) => {
      mainModule.db.all('SELECT * FROM servers', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  fixConfigs(errors) {
    return new Promise(async (resolve, reject) => {
      const configs = [];
      const rows = await module.exports.getAllRows()
                         .catch(err => console.log(`[ERROR] fixConfigs:getAllConfigs:Failed to get all configs: ${err}`));

      for (let i = 0; i < rows.length; i += 1) {
        configs.push({
          'config': rows[i].config,
          'guild_id': rows[i].id
        });
      }

      for (let i = 0; i < configs.length; i += 1) {
        const conf = module.exports.decodeConfig(configs[i].config);
      }
    });
  }
};