/* ERP — corre as demonstrações com o rato, uma a uma, e diz se alguma parou a meio (6 nov. 2026).
   Uso: node scripts/testar-rato-erp.mjs [base] [ids separados por vírgula] [pasta das capturas] */
import { chromium } from 'playwright';
const BASE = process.argv[2] ?? 'http://localhost:5173';
const IDS = (process.argv[3] ?? 'erp-faltas,erp-encomendas,erp-orcamentos,erp-guias-faturas,erp-mapas,erp-mapas-2,erp-area-trabalho,erp-vscode,erp-contexto,erp-estados-inicio').split(',');
const OUT = process.argv[4] ?? '';
/* LIMITE=<s> para os percursos longos (por omissão 600 s); RAPIDO=1 corre com «reduzir movimento» (as pausas encurtam) */
const LIMITE = Number(process.env.LIMITE ?? 600) * 1000;
const b = await chromium.launch();
let falhas = 0;
for (const id of IDS) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: process.env.RAPIDO ? 'reduce' : 'no-preference' });
  const erros = []; p.on('pageerror', (e) => erros.push(e.message));
  await p.goto(`${BASE}/erp/#so=ecra&demo=1&anim=instantaneo&ecra=inicio&rato=${id}`);
  const t0 = Date.now();
  await p.waitForFunction(() => document.body.classList.contains('demo-a-tocar'), null, { timeout: 15000 }).catch(() => {});
  const acabou = await p.waitForFunction(() => !document.body.classList.contains('demo-a-tocar'), null, { timeout: LIMITE, polling: 500 }).then(() => true, () => false);
  if (!acabou) erros.push(`não acabou em ${LIMITE / 1000} s`);
  const fim = await p.evaluate(() => `${document.querySelector('.demo-legenda__t')?.textContent ?? ''} (${document.querySelector('.demo-legenda__passo')?.textContent ?? ''})`);
  const ok = !/parou/.test(fim) && !erros.length;
  if (!ok) falhas++;
  console.log(`${ok ? '✓' : '✗'} ${id} · ${Math.round((Date.now() - t0) / 1000)} s${/parou/.test(fim) ? ` · ${fim}` : ''}${erros.length ? ` · erros: ${erros.join(' | ')}` : ''}`);
  if (OUT) await p.screenshot({ path: `${OUT}/rato-${id}.png` });
  await p.close();
}
await b.close();
process.exit(falhas ? 1 : 0);
