import * as path from 'path';
import axios from 'axios';
var uniq = require('lodash.uniq');
const fs = require('fs');
var pkg = require('../../package.json');

export async function integrityCheck(waPage, notifier, spinner, debugInfo) {
    const waitForIdle = catchRequests(waPage);
    spinner.start('Checking client integrity');
    await waitForIdle();
    const wapi = fs.readFileSync(path.join(__dirname, '../lib', 'wapi.js'), 'utf8');
    const methods = uniq(wapi.match(/(Store[.\w]*)\(/g).map((x:string)=>x.replace("(","")));
    const check = async ()=> await waPage.evaluate((checkList)=>{
      return checkList.filter(check=> {
        try{
          return eval(check)?false:true;
        } catch(error) {
          return true;
        }
      })
    },methods);
    let BROKEN_METHODS = await check();
    if(BROKEN_METHODS.length>0){
      spinner.info('Broken methods detected. Attempting repair.');
      await new Promise(resolve => setTimeout(resolve, 2500));
      //attempting repair
      const unconditionalInject = wapi.replace('!window.Store||!window.Store.Msg', 'true');
      await waPage.evaluate(s=>eval(s),unconditionalInject);
      await waitForIdle();
      //check again
      BROKEN_METHODS = await check();
      if(BROKEN_METHODS.length>0)  {
        spinner.info('Unable to repair. Reporting broken methods.');
        //report broken methods:
        if(notifier.update) {
          //needs an updated
          spinner.fail("!!!BROKEN METHODS DETECTED!!!\n\n Please update to the latest version: " + notifier.update.latest)
        } else {
          //hmm latest version
      const report : any = await axios.post(pkg.brokenMethodReportUrl, {...debugInfo,BROKEN_METHODS}).catch(e=>false);
      if(report?.data) {
        spinner.fail(`Unable to repair broken methods. Sometimes this happens the first time after a new WA version, please try again. An issue has been created, add more detail if required: ${report?.data}` );
      } else spinner.fail(`Unable to repair broken methods. Sometimes this happens the first time after a new WA version, please try again. Please check the issues in the repo for updates: https://github.com/open-wa/wa-automate-nodejs/issues`);
        }
    } else spinner.info('Session repaired.');
  } else spinner.info('Passed Integrity Test');
  return true;
}

function catchRequests(page, reqs = 0) {
  const started = () => (reqs = reqs + 1);
  const ended = () => (reqs = reqs - 1);
  page.on('request', started);
  page.on('requestfailed', ended);
  page.on('requestfinished', ended);
  return async (timeout = 5000, success = false) => {
    while (true) {
      if (reqs < 1) break;
      await new Promise((yay) => setTimeout(yay, 100));
      if ((timeout = timeout - 100) < 0) {
        throw new Error('Timeout');
      }
    }
    page.off('request', started);
    page.off('requestfailed', ended);
    page.off('requestfinished', ended);
  };
}