// Run from the clean pinned upstream checkout; pass its absolute directory.
import {pathToFileURL} from 'node:url';
const root=process.argv[2];
if(!root)throw new Error('Usage: node build.mjs /absolute/upstream');
process.chdir(root);
const {rollup}=await import(pathToFileURL(`${root}/node_modules/rollup/dist/es/rollup.js`));
const {default:configs}=await import(pathToFileURL(`${root}/rollup.config.js`));
const {rm}=await import('node:fs/promises');
await rm(`${root}/dist`,{recursive:true,force:true});
for(const config of configs){
 const {output,...input}=config;
 const bundle=await rollup(input);
 try{await bundle.write(output)}finally{await bundle.close()}
 console.log('Built',output.file??output.dir);
}
// Upstream plugins retain handles after all writes/close promises settle on macOS.
// Exit only after every bundle and declaration has succeeded; errors exit nonzero.
console.log('All configured outputs written and bundles closed.');
process.exit(0);
