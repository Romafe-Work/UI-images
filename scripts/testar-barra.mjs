/* Testa a barra de topo do GoParts (16 out. 2026): cada controlo abre o que deve, o teclado funciona, e o que muda
   (carrinho, mensagens lidas, tema) fica certo. Corre contra o site compilado (npm run ver).

   node scripts/testar-barra.mjs [endereço]   (por omissão http://localhost:5173)
   Precisa do Playwright: PLAYWRIGHT=/caminho/para/playwright/index.mjs */
const pw = await import(process.env.PLAYWRIGHT || 'playwright');
const { chromium } = pw.default ?? pw;
const BASE = process.argv[2] || 'http://localhost:5173';

const browser = await chromium.launch();
const falhas = [];
const erros = [];
async function caso(nome, largura, f) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: 860 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(`${nome}: ${e.message}`));
  await p.goto(`${BASE}/goparts/#so=ecra&ecra=lista`);
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.goto(`${BASE}/goparts/#so=ecra&ecra=inicio`); await p.reload();
  /* as barras de versões e de estados do protótipo ficam por cima do ecrã: fora, para os cliques chegarem à barra */
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.versoes { display: none !important; }'; document.head.appendChild(s); }); });
  await p.reload();
  await p.waitForTimeout(900);
  try { await f(p); console.log(`ok    ${nome}`); }
  catch (e) { falhas.push(nome); console.log(`FALHA ${nome}\n      ${String(e.message || e).split('\n')[0]}`); }
  await ctx.close();
}
const T = '.ecra:not([hidden]) > .versao:not([hidden]) .portal__topo';
const ecra = (p) => p.evaluate(() => document.querySelector('.ecra:not([hidden])')?.dataset.ecra);
const certo = (v, msg) => { if (!v) throw new Error(msg); };

await caso('menu: abre, marca o ecrã, Esc fecha e o foco volta', 700, async (p) => {
  await p.click(`${T} [data-barra="menu"]`);
  await p.waitForSelector('.bc-menu');
  certo(await p.getAttribute(`${T} [data-barra="menu"]`, 'aria-expanded') === 'true', 'o botão não diz aberto');
  certo(await p.$eval('.bc-menu [aria-current="page"]', (e) => e.textContent.trim()) === 'Início', 'o Início não está marcado');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  certo(!(await p.$('.bc-menu')), 'o menu não fechou');
  certo(await p.evaluate(() => document.activeElement?.dataset.barra) === 'menu', 'o foco não voltou ao botão');
});
await caso('menu: Documentos → Faturas leva ao ecrã', 700, async (p) => {
  await p.click(`${T} [data-barra="menu"]`);
  await p.click('.bc-menu__pai:has-text("Documentos")');
  await p.click('.bc-menu__filho:has-text("Faturas")');
  await p.waitForTimeout(400);
  certo(await ecra(p) === 'faturas', `ficou em ${await ecra(p)}`);
});
await caso('GoParts leva ao Início; ROMAFE é ligação para romafe.com', 1440, async (p) => {
  await p.evaluate(() => { location.hash = '#so=ecra&ecra=pedidos'; }); await p.reload(); await p.waitForTimeout(800);
  await p.click(`${T} .portal__produto`); await p.waitForTimeout(300);
  certo(await ecra(p) === 'inicio', 'GoParts não levou ao Início');
  certo((await p.getAttribute(`${T} .portal__romafe`, 'href')).includes('romafe.com'), 'ROMAFE sem destino');
});
await caso('Ctrl+K: abre, normaliza a referência e abre-a no Catálogo', 1440, async (p) => {
  await p.keyboard.press('Control+k');
  await p.waitForSelector('.bc-pal input');
  certo(await p.evaluate(() => document.activeElement?.closest('.bc-pal') !== null), 'o campo não ficou com o foco');
  await p.keyboard.type('vkba6556'); await p.waitForTimeout(250);
  certo((await p.$eval('.bc-res[aria-selected="true"] b', (e) => e.textContent)) === 'SKF VKBA 6556', 'a primeira não é a VKBA 6556');
  certo(await p.$('.bc-res[aria-selected="true"] mark'), 'o que coincide não está marcado');
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  certo(await ecra(p) === 'catalogo', `ficou em ${await ecra(p)}`);
  certo(await p.evaluate(() => document.querySelector('.ecra:not([hidden]) .cat6')?.dataset.ref) === 'VKBA 6556', 'a referência não abriu');
});
await caso('pesquisa: setas, pedido por número, Esc fecha; recentes lembradas', 1440, async (p) => {
  await p.click(`${T} .procura`);
  await p.keyboard.type('001198'); await p.waitForTimeout(250);
  certo(await p.$('.bc-grupo:has-text("Pedidos")'), 'sem o grupo Pedidos');
  await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  certo(await ecra(p) === 'pedidos', `ficou em ${await ecra(p)}`);
  await p.keyboard.press('Control+k'); await p.waitForTimeout(200);
  certo(await p.$('.bc-grupo:has-text("Pesquisas recentes")'), 'a pesquisa não ficou nas recentes');
  await p.keyboard.press('ArrowDown');
  certo(await p.$eval('.bc-res[aria-selected="true"]', (e) => e.dataset.i) === '1', 'a seta não desceu');
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  certo(!(await p.$('.bc-pal')), 'Esc não fechou');
});
await caso('pesquisa: uma letra trocada dá aproximado; nada dá «Nada encontrado»', 1440, async (p) => {
  await p.keyboard.press('Control+k');
  await p.keyboard.type('Peugot'); await p.waitForTimeout(250);
  certo(await p.$('.bc-res__aprox'), 'sem aproximados para «Peugot»');
  await p.fill('.bc-pal input', 'zzzzqqq'); await p.waitForTimeout(250);
  certo(await p.$('.bc-pal__nada'), 'sem o estado vazio');
});
await caso('pesquisa: uma lista guardada abre-se na Minha lista', 1440, async (p) => {
  await p.keyboard.press('Control+k');
  await p.keyboard.type('Revisão BMW'); await p.waitForTimeout(250);
  certo(await p.$('.bc-grupo:has-text("Listas guardadas")'), 'sem o grupo Listas');
  await p.click('.bc-res:has-text("Revisão BMW Série 3")'); await p.waitForTimeout(900);
  certo(await ecra(p) === 'lista', `ficou em ${await ecra(p)}`);
  certo(await p.$eval('.ecra:not([hidden]) .lst', (e) => e.dataset.lista) === 'L2024/000301', 'abriu outra lista');
});
await caso('Minha lista: «Pôr no carrinho» sobe o número do topo', 1440, async (p) => {
  await p.evaluate(() => { location.hash = '#so=ecra&ecra=lista'; }); await p.reload(); await p.waitForTimeout(900);
  await p.click('.ecra:not([hidden]) .lst__carrinho'); await p.waitForTimeout(300);
  const n = Number(await p.$eval(`${T} [data-barra="carrinho"] .portal__selo`, (e) => e.textContent));
  certo(n > 3, `o número ficou em ${n}`);
});
await caso('mensagens: por ler, marcar como lida, o ponto acompanha', 1440, async (p) => {
  const antes = await p.getAttribute(`${T} [data-barra="avisos"]`, 'aria-label');
  certo(/por ler/.test(antes), `o ícone não diz por ler: ${antes}`);
  await p.click(`${T} [data-barra="avisos"]`);
  await p.waitForSelector('.bc-avisos');
  const n1 = await p.$$eval('.bc-aviso.is-novo', (x) => x.length);
  await p.click('.bc-aviso__lida >> nth=0'); await p.waitForTimeout(150);
  certo(await p.$$eval('.bc-aviso.is-novo', (x) => x.length) === n1 - 1, 'não ficou lida');
  await p.click('[data-ler-todos]'); await p.waitForTimeout(150);
  certo(await p.getAttribute(`${T} [data-barra="avisos"]`, 'aria-label') === 'Mensagens', 'o ícone ainda diz por ler');
  certo(await p.$eval(`${T} [data-barra="avisos"] .portal__ponto`, (e) => e.hidden), 'o ponto não saiu');
});
await caso('carrinho: 3 artigos, + sobe para 4, tirar e desfazer, e sobrevive a recarregar', 1440, async (p) => {
  certo(await p.$eval(`${T} [data-barra="carrinho"] .portal__selo`, (e) => e.textContent) === '3', 'o número não é 3');
  await p.click(`${T} [data-barra="carrinho"]`); await p.waitForSelector('.bc-carr');
  await p.click('.bc-carr__linha >> nth=1 >> [data-passo="1"]'); await p.waitForTimeout(150);
  certo(await p.$eval(`${T} [data-barra="carrinho"] .portal__selo`, (e) => e.textContent) === '4', 'não subiu para 4');
  await p.click('.bc-carr__linha >> nth=0 >> [data-tirar]'); await p.waitForTimeout(450);
  certo(await p.$$eval('.bc-carr__linha', (x) => x.length) === 1, 'a linha não saiu');
  await p.click('[data-desfazer-carrinho]'); await p.waitForTimeout(150);
  certo(await p.$$eval('.bc-carr__linha', (x) => x.length) === 2, 'desfazer não repôs');
  await p.reload(); await p.waitForTimeout(900);
  certo(await p.$eval(`${T} [data-barra="carrinho"] .portal__selo`, (e) => e.textContent) === '4', 'não ficou guardado');
});
await caso('carrinho: sem rede a mudança desfaz-se e diz porquê', 1440, async (p) => {
  await p.click(`${T} [data-barra="carrinho"]`); await p.waitForSelector('.bc-carr');
  await p.context().setOffline(true);
  await p.click('.bc-carr__linha >> nth=1 >> [data-passo="1"]'); await p.waitForTimeout(600);
  certo(await p.$eval(`${T} [data-barra="carrinho"] .portal__selo`, (e) => e.textContent) === '3', 'não voltou a 3');
  certo((await p.textContent('.bc-aviso-global.is-erro') || '').includes('carrinho não mudou'), 'sem o aviso do erro');
  await p.context().setOffline(false);
});
await caso('definições: o tema escuro aplica-se e fica', 1440, async (p) => {
  await p.click(`${T} [data-barra="definicoes"]`); await p.waitForSelector('.bc-def');
  await p.click('[data-tema="dark"]');
  certo(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'o tema não mudou');
  await p.click('[data-tema="auto"]');
  certo(await p.evaluate(() => !document.documentElement.hasAttribute('data-theme')), 'Sistema não tirou o tema fixo');
});
await caso('ajuda: no Catálogo, a pesquisa de peças vem primeiro', 1440, async (p) => {
  await p.evaluate(() => { location.hash = '#so=ecra&ecra=catalogo'; }); await p.reload(); await p.waitForTimeout(900);
  await p.click(`${T} [data-barra="ajuda"]`); await p.waitForSelector('.bc-ajuda');
  certo((await p.$eval('.bc-ajuda__p', (e) => e.textContent)).startsWith('Como pesquisar peças'), 'não é a primeira');
  await p.click('.bc-ajuda__p >> nth=0');
  certo(await p.$eval('.bc-ajuda__r', (e) => !e.hidden), 'a resposta não abriu');
  certo(await p.$('.bc-ajuda a[href^="tel:"]'), 'sem o contacto do apoio');
});
await caso('conta: abre com setas e «Terminar sessão» volta ao Entrar e limpa o carrinho', 1440, async (p) => {
  await p.click(`${T} [data-barra="conta"]`); await p.waitForSelector('.bc-conta');
  certo(await p.getAttribute(`${T} [data-barra="conta"]`, 'aria-expanded') === 'true', 'a seta não diz aberto');
  await p.keyboard.press('ArrowUp');
  certo(await p.evaluate(() => document.activeElement?.dataset.conta) === 'sair', 'as setas não andam no menu');
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  certo(await ecra(p) === 'entrada', `ficou em ${await ecra(p)}`);
  certo(await p.evaluate(() => localStorage.getItem('goparts:carrinho:v1')) === null, 'o carrinho ficou no navegador');
});
await caso('só uma camada de cada vez; clicar fora fecha', 1440, async (p) => {
  await p.click(`${T} [data-barra="ajuda"]`); await p.waitForSelector('.bc-ajuda');
  await p.click(`${T} [data-barra="definicoes"]`); await p.waitForTimeout(300);
  certo(await p.$$eval('.bc', (x) => x.filter((e) => !e.classList.contains('is-a-sair')).length) === 1, 'ficaram duas abertas');
  await p.mouse.click(700, 600); await p.waitForTimeout(300);
  certo(!(await p.$('.bc:not(.is-a-sair)')), 'clicar fora não fechou');
});
await caso('telemóvel: lupa, carrinho e conta na barra; o resto no menu; sem scroll de lado', 390, async (p) => {
  certo(await p.isVisible(`${T} .portal__lupa-movel`), 'sem a lupa');
  certo(!(await p.isVisible(`${T} [data-barra="avisos"]`)), 'as mensagens não saíram da barra');
  await p.click(`${T} [data-barra="menu"]`); await p.waitForSelector('.bc-menu');
  certo(await p.isVisible('.bc-menu__movel'), 'o menu não traz as ferramentas');
  certo(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'scroll para o lado');
});

await browser.close();
if (erros.length) console.log(`\nErros na página:\n  ${erros.join('\n  ')}`);
console.log(`\n${falhas.length ? `${falhas.length} falharam` : 'Todos passaram'}.`);
process.exit(falhas.length || erros.length ? 1 : 0);
