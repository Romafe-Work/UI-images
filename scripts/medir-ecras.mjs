/* Mede todos os ecrãs de todas as versões das quatro apps em vários tamanhos
   de janela e diz onde algo não cabe: scroll para o lado, peças cortadas por
   um contentor, peças fora da janela, ou controlos e textos uns por cima dos
   outros. O scroll vertical é permitido; esconder o que não cabe não é.

   node scripts/medir-ecras.mjs [endereço]   (por omissão http://localhost:5173)
   Precisa do Playwright: PLAYWRIGHT=/caminho/para/playwright/index.mjs */
const pw = await import(process.env.PLAYWRIGHT || 'playwright');
const { chromium } = pw.default ?? pw;
const BASE = process.argv[2] || 'http://localhost:5173';

const LARGAS = [[1024, 700], [1280, 720], [1448, 787], [1440, 900], [1920, 1080]];
const ESTREITAS = [[320, 533], [360, 640], [412, 780]];
const APPS = [['erp', LARGAS], ['goshop', LARGAS], ['goparts', LARGAS], ['mobile', ESTREITAS]];

function medir() {
  const visivel = (e) => {
    const s = getComputedStyle(e);
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const decorativo = (e) => e.closest('[aria-hidden="true"], .sr-only, .versoes, [hidden]');
  const ecra = document.querySelector('.ecra:not([hidden]) > .versao:not([hidden])');
  if (!ecra) return { erro: 'sem ecrã visível' };
  const W = innerWidth;
  const problemas = [];
  const nome = (e) => {
    const t = (e.getAttribute('aria-label') || e.getAttribute('placeholder') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : ''}${t ? ` «${t}»` : ''}`;
  };
  if (document.documentElement.scrollWidth > W + 1) problemas.push(`scroll para o lado: ${document.documentElement.scrollWidth}px numa janela de ${W}px`);

  const SEL = 'button, input:not([type=hidden]), select, textarea, a, label, h1, h2, h3, h4, p, li, td, th, img';
  const pecas = [...ecra.querySelectorAll(SEL)].filter((e) => visivel(e) && !decorativo(e));
  for (const e of pecas) {
    const r = e.getBoundingClientRect();
    /* dentro de uma caixa que rola de lado (uma tabela larga), sair da janela é o normal: rola-se */
    const rola = (() => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; })();
    if (!rola && (r.right > W + 2 || r.left < -2)) { problemas.push(`fora da janela: ${nome(e)}`); continue; }
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      if (s.overflowX === 'auto' || s.overflowY === 'auto' || s.overflowX === 'scroll' || s.overflowY === 'scroll') break;
      const q = a.getBoundingClientRect();
      if (r.bottom > q.bottom + 2 || r.right > q.right + 2 || r.top < q.top - 2 || r.left < q.left - 2) {
        problemas.push(`cortado por ${nome(a).split(' ')[0]}: ${nome(e)}`); break;
      }
    }
  }
  /* a parte que se vê: o que passou para lá de uma caixa que rola (ou corta) está escondido, não sobreposto */
  const recortado = (e) => {
    const r = e.getBoundingClientRect(); let { left, top, right, bottom } = r;
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a); if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const q = a.getBoundingClientRect(); left = Math.max(left, q.left); top = Math.max(top, q.top); right = Math.min(right, q.right); bottom = Math.min(bottom, q.bottom);
    }
    return { left, top, right, bottom };
  };
  /* sobreposições: controlos e textos que se tocam sem um estar dentro do outro */
  const SOB = 'button, input:not([type=hidden]), select, textarea, h1, h2, h3, label, p';
  const sob = [...ecra.querySelectorAll(SOB)].filter((e) => visivel(e) && !decorativo(e) && getComputedStyle(e).position !== 'absolute');
  for (let i = 0; i < sob.length; i++) for (let j = i + 1; j < sob.length; j++) {
    const a = sob[i], b = sob[j];
    if (a.contains(b) || b.contains(a)) continue;
    /* uma lista de sugestões aberta (role=listbox) fica por cima do conteúdo de propósito */
    if (!!a.closest('[role="listbox"]') !== !!b.closest('[role="listbox"]')) continue;
    if (a.tagName === 'LABEL' && (a.control === b || a.htmlFor === b.id)) continue;
    if (b.tagName === 'LABEL' && (b.control === a || b.htmlFor === a.id)) continue;
    const p = recortado(a), q = recortado(b);
    const l = Math.min(p.right, q.right) - Math.max(p.left, q.left);
    const h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
    if (l > 3 && h > 3) problemas.push(`sobrepostos: ${nome(a)} × ${nome(b)}`);
  }
  return { problemas: [...new Set(problemas)] };
}

const browser = await chromium.launch();
let total = 0, ecras = 0;
for (const [app, tamanhos] of APPS) {
  const page = await browser.newPage({ viewport: { width: tamanhos[0][0], height: tamanhos[0][1] } });
  await page.goto(`${BASE}/${app}/#so=ecra`);
  await page.waitForTimeout(1200);
  const lista = await page.evaluate(() => [...document.querySelectorAll('.ecra[data-ecra]')].map((e) => [e.dataset.ecra, [...e.querySelectorAll(':scope > .versao')].map((v) => v.dataset.versao)]));
  for (const [id, versoes] of lista) for (const v of versoes) {
    ecras++;
    await page.evaluate(([id, v]) => {
      document.querySelectorAll('.ecra').forEach((e) => { e.hidden = e.dataset.ecra !== id; });
      const e = document.querySelector(`.ecra[data-ecra="${id}"]`);
      e.querySelectorAll(':scope > .versao').forEach((x) => { x.hidden = x.dataset.versao !== v; });
      scrollTo(0, 0);
    }, [id, v]);
    for (const [w, h] of tamanhos) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(60);
      const r = await page.evaluate(medir);
      const lista = r.erro ? [r.erro] : r.problemas;
      if (lista.length) {
        total += lista.length;
        console.log(`\n${app} · ${id} · ${v} · ${w}×${h}`);
        for (const p of lista.slice(0, 8)) console.log('   ' + p);
        if (lista.length > 8) console.log(`   … e mais ${lista.length - 8}`);
      }
    }
  }
  await page.close();
}
await browser.close();
console.log(`\n${ecras} ecrãs×versões medidos; ${total} problemas.`);
process.exit(total ? 1 : 0);
