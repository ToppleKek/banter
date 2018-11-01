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
    if (!validate(json)) return validate.errors;
    return validate(json);
  },

  getConfig(guild) {
    return new Promise((resolve, reject) => {
      mainModule.db.get(`SELECT config FROM servers WHERE id = ${guild.id}`, (err, row) => {
        if (err) reject(err);
        else if (row && row.config) {
          let conf = this.decodeConfig(row.config);
          if (typeof this.validateConfig(conf) === 'boolean' && this.validateConfig(conf)) resolve(conf);
        } else {
          conf = this.decodeConfig(CONFIG.defaultConfig);
          if (typeof this.validateConfig(conf) === 'boolean' && this.validateConfig(conf)) resolve(conf);
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

  fixConfigs() {
    return new Promise(async (resolve, reject) => {
      const configs = [];
      const rows = await this.getAllRows()
                         .catch(err => console.log(`[ERROR] fixConfigs:getAllConfigs:Failed to get all configs: ${err}`));

      for (let i = 0; i < rows.length; i += 1) {
        configs.push({
          'config': rows[i].config,
          'guild_id': rows[i].id
        });
      }

      for (let i = 0; i < configs.length; i += 1) {
        console.log(`CONFIG: ${configs[i].config}`);
        if (!configs[i].config) continue;
        const conf = this.decodeConfig(configs[i].config);
        const vConf = this.validateConfig(conf);
        const defaultConfig = this.decodeConfig(CONFIG.defaultConfig);
        if (typeof this.validateConfig(defaultConfig) !== 'boolean') reject(new Error('error:config:defaultConfigInvalid'));
        if (Array.isArray(vConf)) {
          for (let j = 0; j < vConf.length; j += 1) {
            if (vConf[j].dataPath)
              conf[vConf[j].dataPath.substring(1)] = defaultConfig[vConf[j].dataPath.substring(1)];
            else {
              if (vConf[j].keyword === 'required')
                conf[vConf[j].params.missingProperty] = defaultConfig[vConf[j].params.missingProperty];
            }
            mainModule.db.run('UPDATE servers SET config = ? WHERE id = ?', this.encodeConfig(conf), configs[i].guild_id, err => {
              console.log(`[INFO] Updated guild ${configs[i].guild_id} set config to ${this.encodeConfig(conf)} with errors: ${err ? err : 'none!'}`);
            });
          }
        }
      }
      console.log('[INFO] Hopefully updated all server configurations correctly...');
      resolve(configs);
    });
  }
};