/* ERP — abre TODOS os ecrãs e estados da lista, um a um, como a demonstração os abre (mostrar), e diz os que
   rebentam (erro na página), os que ficam vazios e os que mostram «undefined», «NaN» ou «[object Object]» (6 nov. 2026).
   Uso: npm run ver (noutra janela) e depois node scripts/testar-ecras-erp.mjs [base] */
import { chromium } from 'playwright';
const BASE = process.argv[2] ?? 'http://localhost:5173';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await p.goto(`${BASE}/erp/#so=ecra&ecra=inicio`); await p.waitForTimeout(3000);
const ids = await p.evaluate(() => [...document.querySelectorAll('.ecra[data-ecra]')].filter((e) => !e.hasAttribute('data-fora-da-lista')).map((e) => [e.dataset.ecra, e.dataset.nome ?? '']));
let atual = '', erros = [];
p.on('pageerror', (e) => erros.push(`${e.message} ← ${(e.stack ?? '').split('\n')[1]?.trim() ?? ''}`));
const maus = [];
for (const [id, nome] of ids) {
  atual = id; erros = [];
  await p.evaluate((id) => window.__mostrar(id), id);
  await p.waitForTimeout(id.startsWith('ide-') ? 900 : 200);
  const r = await p.evaluate(() => {
    const v = document.querySelector('.ecra:not([hidden]) > .versao:not([hidden])');
    if (!v) return { vazio: true };
    let t = v.innerText;
    /* nos ecrãs da área de trabalho, o texto dos separadores abertos também conta */
    v.querySelectorAll('iframe').forEach((f) => { try { t += ' ' + (f.contentDocument?.body?.innerText ?? ''); } catch { /* */ } });
    const lixo = /\bundefined\b|\bNaN\b|\[object Object\]/.exec(t);
    return { vazio: t.trim().length < 20, lixo: lixo ? t.slice(Math.max(0, lixo.index - 40), lixo.index + 30).replace(/\s+/g, ' ') : '' };
  });
  const prob = [...erros.map((e) => `erro: ${e}`), ...(r.vazio ? ['ecrã vazio'] : []), ...(r.lixo ? [`texto estragado: «${r.lixo}»`] : [])];
  if (prob.length) { maus.push(id); console.log(`✗ ${nome || id} (${id})\n   ${prob.slice(0, 4).join('\n   ')}`); }
}
console.log(`\n${ids.length - maus.length}/${ids.length} ecrãs e estados sem problemas.`);
await b.close();
process.exit(maus.length ? 1 : 0);
