function generateConfig() {
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
    "logNoD": document.getElementById('logNoD').checked
  };

  const e = document.getElementById("b64string");
  const strJSON = JSON.stringify(configJSON);
  e.innerHTML = `.!loadcfg ${btoa(strJSON)}`;
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

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}