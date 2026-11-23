const{spawnSync}=require('node:child_process');
const cli=process.env.npm_execpath;
function fail(message){console.error(message);process.exit(1);}
if(!cli)fail('Run this check using npm run check:deps with npm 11.21.2.');
const version=spawnSync(process.execPath,[cli,'--version'],{encoding:'utf8',windowsHide:true});
const found=version.stdout?.trim().match(/^11\.(\d+)\.(\d+)$/);
if(version.status!==0||!found||Number(found[1])<21||Number(found[1])===21&&Number(found[2])<2)fail('Use npm 11.21.2 (npx --yes npm@11.21.2 run check:deps). Older npm workspace overrides may be ignored.');
const result=spawnSync(process.execPath,[cli,'ls','--all','--json'],{encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});
let tree;try{tree=JSON.parse(result.stdout);}catch{fail('Could not read the installed dependency tree.');}
if(result.status!==0||tree.problems?.length){if(tree.problems?.length)console.error(tree.problems.slice(0,3).join('\n'));fail('Dependency tree is invalid or incomplete. Run npx --yes npm@11.21.2 ci --ignore-scripts, then retry.');}
console.log(`Dependency tree valid (npm ${version.stdout.trim()}): no missing, invalid or extraneous packages.`);
