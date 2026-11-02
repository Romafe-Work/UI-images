/* Toca cada demonstração da Pick (menos os percursos «Todos os ecrãs») e escreve que ecrãs e estados cada uma mostra,
   em src/apps/mobile/roteiro-ecras.ts: é por aí que o «Ver o fluxo com o rato» escolhe sozinho o caso do ecrã aberto.
   Volta a correr-se quando uma demonstração muda.

   node scripts/roteiro-ecras.mjs [endereço]   (por omissão http://localhost:5173; precisa de um vite preview a correr)
   Precisa do Playwright: PLAYWRIGHT=/caminho/para/playwright/index.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
const pw = await import(process.env.PLAYWRIGHT || 'playwright');
const { chromium } = pw.default ?? pw;
const BASE = process.argv[2] || 'http://localhost:5173';

/* cada roteiro e o ecrã do primeiro passo, lidos do código */
const fonte = readFileSync(new URL('../src/apps/mobile/roteiro.ts', import.meta.url), 'utf8');
/* o primeiro passo pode ser uma constante partilhada (const IN = { ecra: 'ta-inicio', … }) */
const passoComum = (b) => { const k = /\[\s*(\w+),/.exec(b)?.[1]; return k ? new RegExp(`const ${k} = \\{ ecra: '([^']+)'`).exec(fonte)?.[1] : undefined; };
const casos = fonte.split(/(?=registarRoteiro\(')/).slice(1)
  .map((b) => [/^registarRoteiro\('([^']+)'/.exec(b)[1], /\{ ecra: '([^']+)'/.exec(b)?.[1] ?? passoComum(b)])
  .filter(([id, ecra]) => ecra && !id.startsWith('todos-'));

const b = await chromium.launch();
const mapa = {};
for (const [id, ecra] of casos) {
  const p = await b.newPage({ viewport: { width: 900, height: 1000 }, reducedMotion: 'reduce' });
  const vistos = []; let parou = false;
  await p.goto(`${BASE}/mobile/#so=ecra&demo=1&ecra=${ecra}&rato=${id}`);
  for (let t = 0; t < 600; t++) {
    await p.waitForTimeout(500);
    const [e, txt, ativo] = await p.evaluate(() => [document.querySelector('.ecra:not([hidden])')?.dataset.ecra, document.body.innerText.includes('O roteiro parou'), document.body.classList.contains('demo-a-tocar')]);
    if (e && !vistos.includes(e)) vistos.push(e);
    if (txt) { parou = true; break; }
    if (!ativo && t > 4) break;
  }
  await p.close();
  if (parou) { console.error(`${id}: o roteiro parou`); process.exitCode = 1; }
  mapa[id] = vistos;
  console.log(`${id}: ${vistos.length} ecrãs`);
}
await b.close();
writeFileSync(new URL('../src/apps/mobile/roteiro-ecras.ts', import.meta.url),
  `/* Gerado por scripts/roteiro-ecras.mjs: os ecrãs e estados que cada demonstração mostra. Não se edita à mão. */\nexport const ECRAS_DOS_ROTEIROS: Record<string, string[]> = ${JSON.stringify(mapa, null, 1)};\n`);
