/* Testa os Fluxos ecrã a ecrã (21 out. 2026): cada diagrama desenha-se sem erros, passa as regras (verificar.ts:
   ecrãs que existem, sem becos nem órfãos), escolher um ecrã abre o painel, a procura encontra e o PNG sai.
   node scripts/testar-fluxos.mjs [endereço]   (por omissão http://localhost:5173; corre contra npm run ver) */
const pw = await import(process.env.PLAYWRIGHT || 'playwright');
const { chromium } = pw.default ?? pw;
const BASE = process.argv[2] || 'http://localhost:5173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, reducedMotion: 'reduce' });
const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(e.message));
let falhas = 0; const certo = (v, m) => { if (!v) { falhas++; console.log(`FALHA ${m}`); } else console.log(`ok    ${m}`); };
await p.goto(`${BASE}/fluxos/`); await p.waitForTimeout(2000);
const ids = await p.$$eval('[data-diagrama]', (l) => l.map((x) => x.dataset.diagrama));
for (const id of ids) {
  await p.click(`[data-diagrama="${id}"]`); await p.waitForTimeout(700);
  const r = await p.evaluate(() => ({ nos: document.querySelectorAll('#fx-palco g.node[data-no]').length, ok: !!document.querySelector('#fx-verificacao .fx-ok'), falha: !!document.querySelector('.fx-falha') }));
  certo(r.nos > 2 && r.ok && !r.falha, `${id}: ${r.nos} nós, regras ${r.ok ? 'cumpridas' : 'FALHAM'}`);
}
await p.click('[data-diagrama="inventario"]'); await p.waitForTimeout(700);
await p.click('#fx-palco g.node[data-no="qtd"]', { force: true }); await p.waitForTimeout(400);
certo((await p.textContent('#fx-painel h2'))?.includes('Quantidade'), 'escolher «Quantidade» abre o painel com o ecrã verdadeiro');
certo((await p.$$('#fx-palco path.flowchart-link.is-aceso')).length > 0, 'o caminho até ao ecrã acende-se');
await p.fill('#fx-procura', 'posição'); await p.waitForTimeout(200);
certo((await p.$$('#fx-resultados li button')).length > 0, 'a procura encontra «posição»');
await p.click('.fx-exportar summary');
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.click('[data-exportar="png"]')]);
certo(dl && dl.suggestedFilename().endsWith('.png'), 'exporta o PNG');
certo(!erros.length, `sem erros na página${erros.length ? `: ${erros[0]}` : ''}`);
await b.close();
console.log(falhas ? `\n${falhas} falharam.` : '\nTodos passaram.');
process.exit(falhas ? 1 : 0);
