import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
const entries = ['index.html', 'assets', 'src'];
await rm(out, { recursive: true, force: true });
await mkdir(out);
for (const name of entries) await cp(new URL(name, root), new URL(name, out), { recursive: true });

const adUnitId = process.env.KOBOLD_REWARDED_AD_UNIT_ID?.trim();
if (adUnitId) {
  await writeFile(new URL('src/ad-config.mjs', out), `export const rewindAdUnitId = ${JSON.stringify(adUnitId)};\n`);
}

const files = await readdir(out, { recursive: true, withFileTypes: true });
let bytes = 0;
let count = 0;
for (const entry of files) {
  if (!entry.isFile()) continue;
  const url = new URL(entry.name, `file://${entry.parentPath}/`);
  bytes += (await stat(url)).size;
  count += 1;
}
const index = await readFile(new URL('index.html', out), 'utf8');
if (/["']\/(assets|src)\//.test(index)) throw new Error('正式包入口需要相对资源路径');
console.log(`已构建 ${fileURLToPath(out)}，${count} 个文件，${bytes} 字节`);
