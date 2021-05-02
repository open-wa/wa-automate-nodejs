const ensureGitignore = require('ensure-gitignore'),
findUp = require('find-up');

const gitignoreCheck = async () => {
    if(process.env.WA_SKIP_GITIGNORE_CHECK) {
        console.log( '**INFO** Skipping .gitignore check. "WA_SKIP_GITIGNORE_CHECK" environment variable was found.')
        return;
    }
    const gitignorepath = await findUp('.gitignore')
    if(!gitignorepath) {
        console.log('**INFO** .gitignore not found. Please make sure to keep **.data.json files secure and private')
    }
    console.log('**INFO** Ensuring **.data.json pattern is present in .gitignore')
    await ensureGitignore({
        patterns: ['**.data.json'],
        filepath: gitignorepath,
        comment: 'managed by open-wa. see: https://github.com/open-wa/wa-automate-nodejs/issues/1632'
      });
   }

gitignoreCheck() 