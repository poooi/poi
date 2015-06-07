var AdmZip = require('adm-zip');
var path = require('path-extra');
var spawnSync = require('child_process').spawnSync;
var zip = new AdmZip(path.join(path.tempdir(), "poi-update.zip"));
var newApp = path.join(__dirname, '..', '..', 'new-app');
var curApp = path.join(__dirname, '..', '..');
zip.extractAllTo(newApp);
if (process.platform != 'win32') {
  spawnSync('cp', ['-R', path.join(newApp, 'app'), curApp]);
  spawnSync('rm', ['-R', newApp]);
}
