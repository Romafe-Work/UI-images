/* =========================================================
   ERP — Início v3 (o IDE): os 13 passos do briefing, com o rato verdadeiro (6 nov. 2026).
   Uso: node scripts/testar-ide.mjs [endereço base] [pasta das capturas]
   Ex.: npm run ver (noutra janela) e depois node scripts/testar-ide.mjs http://localhost:5173 /tmp/ide
   ========================================================= */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const OUT = process.argv[3] ?? '';
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
let falhas = 0, n = 0;
const ok = (c, t) => { n++; if (c) console.log(`  ✓ ${t}`); else { falhas++; console.log(`  ✗ ${t}`); } };
const passo = async (t, f) => { console.log(`${t}`); await f(); if (OUT) await p.screenshot({ path: `${OUT}/${String(++passo.i).padStart(2, '0')}.png` }); };
passo.i = 0;
const centro = async (sel) => { const r = await p.locator(sel).first().boundingBox(); if (!r) throw new Error(`sem ${sel}`); return { x: r.x + r.width / 2, y: r.y + r.height / 2, r }; };
async function arrastar(de, para, passos = 14) {
  await p.mouse.move(de.x, de.y); await p.mouse.down();
  await p.mouse.move(de.x + 12, de.y + 8, { steps: 3 });
  await p.mouse.move(para.x, para.y, { steps: passos });
  await p.waitForTimeout(80);
  await p.mouse.up(); await p.waitForTimeout(250);
}
/** O centro de uma guia do grupo que tem este separador (calculado como o motor: losango ao centro do corpo). */
async function guia(selGrupo, zona) {
  const r = (await p.locator(selGrupo).first().boundingBox());
  const cx = r.x + r.width / 2, cy = r.y + 30 + (r.height - 30) / 2, d = 38;
  return { esq: { x: cx - d, y: cy }, dir: { x: cx + d, y: cy }, cima: { x: cx, y: cy - d }, baixo: { x: cx, y: cy + d }, centro: { x: cx, y: cy } }[zona];
}
async function guiaBorda(lado) {
  const r = await p.locator(R + '[data-ide-area]').boundingBox();
  return { esq: { x: r.x + 25, y: r.y + r.height / 2 }, dir: { x: r.x + r.width - 25, y: r.y + r.height / 2 }, cima: { x: r.x + r.width / 2, y: r.y + 25 }, baixo: { x: r.x + r.width / 2, y: r.y + r.height - 25 } }[lado];
}
const R = '.ecra:not([hidden]) > .versao:not([hidden]) .ide ';
const grupoCom = (id) => `${R}[data-ide-grupo]:has(:is([data-ide-tab="${id}"], [data-ide-tit="${id}"]))`;
const pega = (id) => `${R}:is([data-ide-tab="${id}"], [data-ide-tit="${id}"]):visible`;
const frame = (id) => p.frameLocator(`iframe[data-ide-frame="${id}"]`);
const FALTAS = 'doc:compras.faltas', ENC = 'doc:compras.encomendas', STOCK = 'ferr:stock', EXP = 'ferr:explorador';

await p.goto(`${BASE}/erp/#so=ecra&ecra=inicio&v=v3`);
await p.evaluate(() => { Object.keys(localStorage).filter((k) => k.startsWith('erp:ide:')).forEach((k) => localStorage.removeItem(k)); });
await p.reload(); await p.waitForTimeout(2500);
await p.addStyleTag({ content: '.versoes { display: none !important; }' });

await passo('1. Abrir Encomendas', async () => {
  ok(await p.locator(`${R}[data-ide-tab="${ENC}"]`).count() === 1, 'as Encomendas estão abertas (disposição padrão)');
  await frame(ENC).locator('tr[data-dv2-id]:visible').first().waitFor({ timeout: 15000 });
  ok(true, 'o ecrã das Encomendas carregou');
});
await passo('2. Abrir a Lista de Faltas', async () => {
  await p.locator(R + '[data-ide-abrir="compras.faltas"]').first().click(); await p.waitForTimeout(400);
  ok(await p.locator(`${R}[data-ide-tab="${FALTAS}"]`).count() === 1, 'separador da Lista de Faltas aberto');
  ok(await p.locator(`${grupoCom(FALTAS)} [data-ide-tab="${ENC}"]`).count() === 1, 'no mesmo grupo das Encomendas');
  await frame(FALTAS).locator('tr[data-lf2-ref]:visible').first().waitFor({ timeout: 15000 });
});
/* o estado que tem de sobreviver: um filtro escrito e uma linha escolhida na Lista de Faltas */
const FILTRO = '0 98';
await frame(FALTAS).locator('[data-lf2-q]:visible').first().fill(FILTRO);
await p.waitForTimeout(300);
await frame(FALTAS).locator('tr[data-lf2-ref="0 986 494 524"]:visible').first().click();
await p.waitForTimeout(300);
const marca = await p.evaluate(() => { const f = document.querySelector('iframe[data-ide-frame="doc:compras.faltas"]'); f.contentWindow.__marca = 'vivo'; return true; });

await passo('3. Arrastar a Lista de Faltas para a direita', async () => {
  const de = await centro(`${R}[data-ide-tab="${FALTAS}"]`);
  await arrastar(de, await guia(grupoCom(FALTAS), 'dir'));
  const gF = await p.locator(grupoCom(FALTAS)).boundingBox(), gE = await p.locator(grupoCom(ENC)).boundingBox();
  ok(gF && gE && gF.x > gE.x + 50 && Math.abs(gF.y - gE.y) < 4, 'Lista de Faltas num grupo à direita das Encomendas');
});
await passo('4. Redimensionar as duas', async () => {
  const gE0 = (await p.locator(grupoCom(ENC)).boundingBox()).width;
  const sep = await centro(`${R}[data-ide-no]:has(> [data-ide-grupo] [data-ide-tab="${ENC}"]) + [data-ide-sep]`);
  await arrastar(sep, { x: sep.x - 160, y: sep.y });
  const gE1 = (await p.locator(grupoCom(ENC)).boundingBox()).width;
  ok(gE1 < gE0 - 100, `Encomendas mais estreitas (${Math.round(gE0)} → ${Math.round(gE1)} px)`);
});
await passo('5. Abrir o Stock por armazém por baixo', async () => {
  await p.locator(R + '[data-ide-menu="ver"]').click();
  await p.locator(R + '[data-ide-pop] [data-ide-cmd="ver:stock"]').click(); await p.waitForTimeout(300);
  const gS = await p.locator(grupoCom(STOCK)).boundingBox(), gE = await p.locator(grupoCom(ENC)).boundingBox(), gF = await p.locator(grupoCom(FALTAS)).boundingBox();
  ok(gS && gS.y > gE.y + gE.height - 4 && gS.y > gF.y + gF.height - 4, 'o Stock fica por baixo dos dois');
  ok((await p.locator(`${grupoCom(STOCK)} .ide-f-alvo`).innerText()).includes('0 986 494 524'), 'o Stock segue o artigo escolhido na Lista de Faltas');
});
await passo('6. Ocultar o Explorador', async () => {
  await p.locator(`${grupoCom(EXP)} [data-ide-g-acao="ocultar"]`).click(); await p.waitForTimeout(300);
  ok(await p.locator(`${R}[data-ide-borda="esq"] [data-ide-oculto="${EXP}"]`).count() === 1, 'o Explorador está na borda esquerda');
  await p.locator(`${R}[data-ide-oculto="${EXP}"]`).click(); await p.waitForTimeout(300);
  ok(await p.locator(R + '[data-ide-gav] [data-ide-f-q="explorador"]').count() === 1, 'um clique abre-o por cima');
  await p.mouse.click(900, 500); await p.waitForTimeout(300);
  ok(await p.locator(R + '[data-ide-gav]').count() === 0, 'fecha ao carregar fora');
});
await passo('7. Mover o Stock para a esquerda', async () => {
  await arrastar(await centro(pega(STOCK)), await guiaBorda('esq'));
  const gS = await p.locator(grupoCom(STOCK)).boundingBox(), gE = await p.locator(grupoCom(ENC)).boundingBox();
  ok(gS && gS.x + gS.width <= gE.x + 4, 'o Stock está acoplado à esquerda de tudo');
});
await passo('8. Pôr uma janela de ferramenta a flutuar', async () => {
  const de = await centro(pega(STOCK));
  await arrastar(de, { x: 760, y: 200 }, 18);
  ok(await p.locator(`${R}[data-ide-fj] [data-ide-corpo] [data-ide-ferr="${STOCK}"]`).count() === 1, 'o Stock flutua');
  const fj = await centro(R + '[data-ide-fj-arrastar]');
  await arrastar(fj, { x: fj.x + 60, y: fj.y + 40 });
  ok(await p.locator(`${R}[data-ide-fj] [data-ide-corpo] [data-ide-ferr="${STOCK}"]`).count() === 1, 'arrasta-se pela barra sem acoplar');
});
await passo('9. Acoplar outra vez', async () => {
  await p.locator(R + '[data-ide-fj-acao="acoplar"]').click(); await p.waitForTimeout(300);
  ok(await p.locator(R + '[data-ide-fj]').count() === 0 && await p.locator(`${R}[data-ide-arvore] [data-ide-ferr="${STOCK}"]`).count() === 1, 'o Stock voltou à árvore');
});
await passo('10. Guardar a disposição como «Compras»', async () => {
  await p.locator(R + '[data-ide-cmd="menu-disposicoes"]').click();
  await p.locator(R + '[data-ide-pop] [data-ide-cmd="guardar-disp"]').click();
  await p.locator(R + '[data-ide-disp-nome-in]').fill('Compras');
  await p.locator(R + '[data-ide-disp-form] button[type="submit"]').click(); await p.waitForTimeout(300);
  await p.keyboard.press('Escape');
  ok((await p.locator(R + '[data-ide-disp-nome]').innerText()) === 'Compras', 'a disposição chama-se «Compras»');
});
await passo('11. Aplicar outra disposição (Gestão de Artigos)', async () => {
  await p.locator(R + '[data-ide-cmd="menu-disposicoes"]').click();
  await p.locator(R + '[data-ide-pop] [data-ide-cmd="preset:artigos"]').click(); await p.waitForTimeout(600);
  ok(await p.locator(R + '[data-ide-tab="doc:ficheiros.artigos"]').count() === 1 && await p.locator(`${R}[data-ide-tab="${FALTAS}"]`).count() === 0, 'Artigos à vista; a Lista de Faltas saiu');
});
await passo('12. Repor «Compras»', async () => {
  await p.locator(R + '[data-ide-cmd="menu-disposicoes"]').click();
  await p.locator(R + '[data-ide-pop] [data-ide-cmd="disp:Compras"]').click(); await p.waitForTimeout(600);
  ok(await p.locator(`${R}[data-ide-tab="${FALTAS}"]`).count() === 1 && await p.locator(`${R}[data-ide-arvore] [data-ide-ferr="${STOCK}"]`).count() === 1, 'a disposição «Compras» voltou');
});
await passo('13. A seleção e o filtro ficaram', async () => {
  ok(await p.evaluate(() => document.querySelector('iframe[data-ide-frame="doc:compras.faltas"]')?.contentWindow.__marca === 'vivo'), 'o ecrã é o mesmo (não recarregou)');
  ok((await frame(FALTAS).locator('[data-lf2-q]:visible').first().inputValue()) === FILTRO, `o filtro «${FILTRO}» ficou`);
  ok(await frame(FALTAS).locator('tr[data-lf2-ref="0 986 494 524"].is-ativo, tr[data-lf2-ref="0 986 494 524"][aria-selected="true"]').count() >= 1, 'a linha escolhida ficou');
});
await passo('Depois de fechar e voltar a abrir o ERP', async () => {
  await p.reload(); await p.waitForTimeout(2500); await p.addStyleTag({ content: '.versoes { display: none !important; }' });
  ok((await p.locator(R + '[data-ide-disp-nome]').innerText()) === 'Compras', 'a disposição «Compras» foi reposta');
  ok(await p.locator(`${R}[data-ide-tab="${FALTAS}"]`).count() === 1 && await p.locator(`${R}[data-ide-oculto="${EXP}"]`).count() === 1, 'com os documentos e o Explorador oculto');
});

/* ---------- o resto: alterações por guardar, teclas, menus, contexto ligado, vista simples ---------- */
const sel = (x) => p.locator(R + x);
await passo('Alterações por guardar não se perdem ao fechar', async () => {
  await sel('[data-ide-cmd="menu-disposicoes"]').click(); await sel('[data-ide-pop] [data-ide-cmd="preset:compras"]').click(); await p.waitForTimeout(800);
  const enc = frame(ENC);
  await enc.locator('tr[data-dv2-id="EF 2026/0413"]:visible').first().click(); await p.waitForTimeout(500);
  await enc.locator('body').press('F6'); await p.waitForTimeout(700);
  await enc.locator('[data-dv2-ficha] input[type="text"]:not([readonly]):visible').first().pressSequentially('x'); await p.waitForTimeout(200);
  ok(await sel(`[data-ide-sujo="${ENC}"]:not([hidden])`).count() >= 1, 'o separador mostra o ponto das alterações por guardar');
  ok((await sel('[data-ide-estado]').innerText()).includes('alterações por guardar'), 'a barra de estado diz quantos documentos têm alterações');
  await enc.locator('body').press('Alt+w'); await p.waitForTimeout(300);
  ok(await sel('[data-ide-dlg]:not([hidden]) [data-ide-sujo-fechar]').count() === 1, 'Alt W pergunta antes de fechar');
  await sel('[data-ide-dlg] [data-ide-dlg-fechar]').first().click(); await p.waitForTimeout(200);
  ok(await sel(`[data-ide-tab="${ENC}"]`).count() === 1, '«Voltar ao documento» deixa-o aberto');
  await sel('[data-ide-cmd="menu-disposicoes"]').click(); await sel('[data-ide-pop] [data-ide-cmd="preset:artigos"]').click(); await p.waitForTimeout(600);
  ok(await sel(`[data-ide-tab="${ENC}"]`).count() === 1, 'ao aplicar outra disposição, o documento com alterações vem junto');
  await sel('[data-ide-cmd="menu-disposicoes"]').click(); await sel('[data-ide-pop] [data-ide-cmd="preset:compras"]').click(); await p.waitForTimeout(600);
});
await passo('Teclas da área de trabalho', async () => {
  await sel(`[data-ide-tab="${FALTAS}"]`).click(); await p.waitForTimeout(150);
  const g0 = await sel('.ide-g.is-ativo').getAttribute('data-ide-grupo');
  await p.keyboard.press('Control+F6'); await p.waitForTimeout(250);
  const g1 = await sel('.ide-g.is-ativo').getAttribute('data-ide-grupo');
  ok(g0 !== g1, 'Ctrl F6 passa ao grupo seguinte');
  await sel(`[data-ide-tab="${FALTAS}"]`).click(); await p.waitForTimeout(150);
  await p.keyboard.press('Alt+Shift+ArrowRight'); await p.waitForTimeout(300);
  ok(await p.locator(`${grupoCom(FALTAS)} [data-ide-tab="${ENC}"]`).count() === 1, 'Alt Shift → leva o separador para o grupo seguinte');
  await p.keyboard.press('Control+Shift+E'); await p.waitForTimeout(200);
  ok(await sel('[data-ide-pop] [data-ide-lista-q]').count() === 1, 'Ctrl Shift E abre a procura nos separadores');
  await p.keyboard.type('falt'); await p.waitForTimeout(150);
  ok(await sel('[data-ide-pop] .ide-lista-l [data-ide-ir]').count() === 1, 'a procura filtra os separadores');
  await p.keyboard.press('Escape');
});
await passo('Menu do separador: nova divisão em baixo', async () => {
  await sel(`[data-ide-tab="${FALTAS}"]`).click({ button: 'right' }); await p.waitForTimeout(150);
  await sel('[data-ide-pop] [data-ide-cmd="mover:baixo"]').click(); await p.waitForTimeout(300);
  const gF = await p.locator(grupoCom(FALTAS)).boundingBox(), gE = await p.locator(grupoCom(ENC)).boundingBox();
  ok(gF.y > gE.y + gE.height - 4 && Math.abs(gF.x - gE.x) < 4, 'a Lista de Faltas ficou por baixo das Encomendas');
});
await passo('Contexto ligado: o documento relacionado abre noutro grupo', async () => {
  await frame(FALTAS).locator('tr[data-lf2-ref="0 986 494 524"]:visible').first().click(); await p.waitForTimeout(300);
  await p.keyboard.press('Control+Alt+R'); await p.waitForTimeout(300);
  ok((await sel('[data-ide-ferr="ferr:relacionados"] .ide-f-alvo').innerText()).includes('0 986 494 524'), 'os Documentos relacionados seguem o artigo escolhido');
  const n = await sel('[data-ide-ferr="ferr:relacionados"] [data-ide-enc]').count();
  if (n) {
    const ref = await sel('[data-ide-ferr="ferr:relacionados"] [data-ide-enc]').first().getAttribute('data-ide-enc');
    await sel('[data-ide-ferr="ferr:relacionados"] [data-ide-enc]').first().click(); await p.waitForTimeout(500);
    const id = `doc:compras.encomendas|${ref}`;
    ok(await sel(`[data-ide-tab="${id}"]`).count() === 1, `a encomenda ${ref} abriu num separador`);
    ok(await p.locator(`${grupoCom(id)} [data-ide-tab="${FALTAS}"]`).count() === 0, 'noutro grupo, não no da Lista de Faltas');
  } else ok(true, 'sem encomendas com este artigo (nada a abrir)');
});
await passo('Inspetor fixado não muda com a seleção', async () => {
  await p.keyboard.press('Control+Alt+P'); await p.waitForTimeout(250);
  await sel('[data-ide-ferr="ferr:propriedades"] [data-ide-f-pin]').click(); await p.waitForTimeout(150);
  const antes = await sel('[data-ide-ferr="ferr:propriedades"] .ide-f-alvo').innerText();
  await frame(FALTAS).locator('tr[data-lf2-ref="0 986 424 797"]:visible').first().click(); await p.waitForTimeout(300);
  ok((await sel('[data-ide-ferr="ferr:propriedades"] .ide-f-alvo').innerText()) === antes, 'Propriedades fixadas ficam no mesmo registo');
  ok((await sel('[data-ide-ferr="ferr:stock"] .ide-f-alvo').innerText()).includes('0 986 424 797'), 'o Stock (a seguir a seleção) mudou');
});
await passo('Menus pelo teclado', async () => {
  await sel('[data-ide-menu="janela"]').click(); await p.waitForTimeout(150);
  ok(await sel('[data-ide-pop] [data-ide-cmd="dividir-dir"]').count() === 1, 'o menu Janela abre');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
  ok((await sel('[data-ide-menu="ferramentas"]').getAttribute('aria-expanded')) === 'true', '→ passa ao menu Ferramentas');
  await p.keyboard.press('Escape');
});
await passo('Janela pequena: só o grupo ativo', async () => {
  await p.setViewportSize({ width: 740, height: 600 }); await p.waitForTimeout(500);
  ok(await sel('[data-ide-pequena]:not([hidden])').count() === 1, 'aviso da vista simples');
  await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(500);
  ok(await sel('[data-ide-pequena]:not([hidden])').count() === 0, 'ao alargar, voltam as divisões');
});
ok(erros.length === 0, `sem erros na página${erros.length ? `: ${erros.join(' | ')}` : ''}`);
console.log(`\n${n - falhas}/${n} verificações passaram.`);
await b.close();
process.exit(falhas ? 1 : 0);
