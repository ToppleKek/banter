function generateConfig() {
  const errors = findErrors();
  if (errors.length > 0) {
    const humanErrors = [];
    for (let i = 0; i < errors.length; i++) humanErrors.push(`Error: ${errors[i].type} - ${errors[i].message}`);
    document.getElementById('errorsText').innerHTML = humanErrors.join('<br>');
    document.getElementById('b64string').innerHTML = 'Please fix all errors to generate a new command';
  } else {
    let blLevelRadio;
    if (document.getElementById('blLevelLow').checked) blLevelRadio = 0;
    else if (document.getElementById('blLevelMed').checked) blLevelRadio = 1;
    else if (document.getElementById('blLevelHigh').checked) blLevelRadio = 2;
    else blLevelRadio = 2;

    const configJSON = {
      "blShowInfractions": document.getElementById('blacklistShowInfractions').checked,
      "blIgnoreAdmins": document.getElementById('blacklistIgnoreAdmins').checked,
      "logMassDelHaste": document.getElementById('logMassDelHaste').checked,
      "blLevel": blLevelRadio,
      "logNoP": document.getElementById('logNoP').checked,
      "logNoD": document.getElementById('logNoD').checked,
      "starR": Number.parseInt(document.getElementById('starR').value, 10),
      "bmLen": Number.parseInt(document.getElementById('bmLen').value, 10),
      "wmLen": Number.parseInt(document.getElementById('wmLen').value, 10),
      "wLim": Number.parseInt(document.getElementById('wLim').value, 10),
      "punish": Number.parseInt(document.getElementById('punishSel').value, 10),
      "asMInRow": Number.parseInt(document.getElementById('asMInRow').value, 10),
      "asCool": Number.parseInt(document.getElementById('asCool').value, 10),
      "prefix": document.getElementById('prefix').value,
      "aBotMInRow":Number.parseInt(document.getElementById('aBotMInRow').value, 10),
      "aBotCool": Number.parseInt(document.getElementById('aBotCool').value, 10),
      "aBotTCool": Number.parseInt(document.getElementById('aBotTCool').value, 10),
      "asPing": Number.parseInt(document.getElementById('asPing').value, 10),
      "asPCool": Number.parseInt(document.getElementById('asPCool').value, 10)
    };

    const e = document.getElementById("b64string");
    const strJSON = JSON.stringify(configJSON);
    document.getElementById('errorsText').innerHTML = '';
    e.innerHTML = `.!loadcfg ${btoa(strJSON)}`;
  }
}

function loadConfig() {
  const b64 = getParameterByName('cfg');
  console.log(b64);
  if (b64) {
    try {
      const json = JSON.parse(atob(b64));
      document.getElementById('blacklistShowInfractions').checked = json.blShowInfractions;
      document.getElementById('blacklistIgnoreAdmins').checked = json.blIgnoreAdmins;
      document.getElementById('logMassDelHaste').checked = json.logMassDelHaste;
      document.getElementById('logNoP').checked = json.logNoP;
      document.getElementById('logNoD').checked = json.logNoD;
      document.getElementById('starR').value = json.starR;
      document.getElementById('bmLen').value = json.bmLen;
      document.getElementById('wmLen').value = json.wmLen;
      document.getElementById('wLim').value = json.wLim;
      document.getElementById('punishSel').value = json.punish;
      document.getElementById('asMInRow').value = json.asMInRow;
      document.getElementById('asCool').value = json.asCool;
      document.getElementById('prefix').value = json.prefix;
      document.getElementById('aBotMInRow').value = json.aBotMInRow;
      document.getElementById('aBotCool').value = json.aBotCool;
      document.getElementById('aBotTCool').value = json.aBotTCool;
      document.getElementById('asPing').value = json.asPing;
      document.getElementById('asPCool').value = json.asPCool;

      switch (json.blLevel) {
        case 0:
          document.getElementById('blLevelLow').checked = true;
          break;
        case 1:
          document.getElementById('blLevelMed').checked = true;
          break;
        case 2:
          document.getElementById('blLevelHigh').checked = true;
          break;
        default:
          document.getElementById('blLevelHigh').checked = true;
      }
      document.getElementById('b64string').innerHTML = `.!loadcfg ${b64}`;
    } catch (e) {
      alert(`Failed to load config from url: ${e}`);
    }
  }
}

function findErrors() {
  const errors = [];
  const starRVal = document.getElementById('starR').value;
  const wmLenVal = document.getElementById('wmLen').value;
  const bmLenVal = document.getElementById('bmLen').value;
  const wLimVal = document.getElementById('wLim').value;
  const asMInRow = document.getElementById('asMInRow').value;
  const asCool = document.getElementById('asCool').value;
  const aBotMInRow = document.getElementById('aBotMInRow').value;
  const aBotCool = document.getElementById('aBotCool').value;
  const aBotTCool = document.getElementById('aBotTCool').value;
  const asPing = document.getElementById('asPing').value;
  const asPCool = document.getElementById('asPCool').value;

  // Good programming yes yes
  if (Number.isNaN(Number.parseInt(starRVal, 10)))
    errors.push({type:'num_is_NaN',message:'The star reaction requirement must be a number.'});

  if (Number.isNaN(Number.parseInt(wmLenVal, 10)))
    if (document.getElementById('punishSel').value !== "1")
      errors.push({type:'num_is_NaN',message:'The warning mute length must be a number.'});

  if (Number.isNaN(Number.parseInt(bmLenVal, 10)))
    errors.push({type:'num_is_NaN',message:'The blacklist mute length must be a number.'});

  if (Number.isNaN(Number.parseInt(wLimVal, 10)))
    errors.push({type:'num_is_NaN',message:'The warning limit must be a number.'});

  if (Number.parseInt(starRVal, 10) < 1 || Number.parseInt(starRVal, 10) > 50)
    errors.push({type:'num_out_of_range',message:'The star reaction requirement must be between 1 and 50'});

  if (Number.parseInt(wmLenVal, 10) < 1 || Number.parseInt(wmLenVal, 10) > 1000)
    errors.push({type:'num_out_of_range',message:'The warning mute length must be between 1 and 1000'});

  if (Number.parseInt(bmLenVal, 10) < 1 || Number.parseInt(bmLenVal, 10) > 1000)
    errors.push({type:'num_out_of_range',message:'The blacklist mute length must be between 1 and 1000'});

  if (Number.parseInt(wLimVal, 10) < 1 || Number.parseInt(wLimVal, 10) > 50)
    errors.push({type:'num_out_of_range',message:'The warning limit must be between 1 and 50'});

  if (Number.parseInt(wLimVal, 10) < 1 || Number.parseInt(wLimVal, 10) > 50)
    errors.push({type:'num_out_of_range',message:'The warning limit must be between 1 and 50'});

  if (Number.isNaN(Number.parseInt(asMInRow, 10)))
    errors.push({type:'num_is_NaN',message:'The amount of identical messages in a row must be a number'});

  if (Number.isNaN(Number.parseInt(asCool, 10)))
    errors.push({type:'num_is_NaN',message:'The message cooldown must be a number'});

  if (Number.isNaN(Number.parseInt(aBotMInRow, 10)))
    errors.push({type:'num_is_NaN',message:'The amount of new users in a row must be a number'});

  if (Number.isNaN(Number.parseInt(aBotCool, 10)))
    errors.push({type:'num_is_NaN',message:'The new user cooldown must be a number'});

  if (Number.isNaN(Number.parseInt(aBotTCool, 10)))
    errors.push({type:'num_is_NaN',message:'The time after anti raid cooldown must be a number'});

  if (Number.isNaN(Number.parseInt(asPing, 10)))
    errors.push({type:'num_is_NaN',message:'The number of pings must be a number'});

  if (Number.isNaN(Number.parseInt(asPCool, 10)))
    errors.push({type:'num_is_NaN',message:'The cooldown time for pings must be a number'});

  return errors;
}

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}