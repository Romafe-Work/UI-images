/* Testa o Início do GoParts (16 out. 2026): o veículo identificado, a garagem, as encomendas, repetir, as peças, o stock,
   os atalhos e «Personalizar Início». Corre contra o site compilado (npm run ver).

   node scripts/testar-inicio.mjs [endereço]   (por omissão http://localhost:5173)
   Precisa do Playwright: PLAYWRIGHT=/caminho/para/playwright/index.mjs */
const pw = await import(process.env.PLAYWRIGHT || 'playwright');
const { chromium } = pw.default ?? pw;
const BASE = process.argv[2] || 'http://localhost:5173';

const browser = await chromium.launch();
const falhas = [];
const erros = [];
async function caso(nome, largura, f) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(`${nome}: ${e.message}`));
  await p.goto(`${BASE}/goparts/#so=ecra&ecra=lista`);
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.versoes { display: none !important; }'; document.head.appendChild(s); }); });
  await p.goto(`${BASE}/goparts/#so=ecra&ecra=inicio`); await p.reload();
  await p.waitForTimeout(900);
  try { await f(p); console.log(`ok    ${nome}`); }
  catch (e) { falhas.push(nome); console.log(`FALHA ${nome}\n      ${String(e.message || e).split('\n')[0]}`); }
  await ctx.close();
}
const I = '.ecra:not([hidden]) > .versao:not([hidden]) .ini4';
const P = '.ecra:not([hidden]) > .versao:not([hidden]) .portal--ini4';
const ecra = (p) => p.evaluate(() => document.querySelector('.ecra:not([hidden])')?.dataset.ecra);
const certo = (v, msg) => { if (!v) throw new Error(msg); };
/* sem nada guardado, o carrinho é o de exemplo da primeira visita (3 unidades, carrinho.ts) */
const unidades = (p) => p.evaluate(() => { const v = localStorage.getItem('goparts:carrinho:v1'); return v === null ? 3 : JSON.parse(v).reduce((s, l) => s + l.qtd, 0); });
async function identificar(p, mat) {
  await p.click(`${I} .ini3__separador[data-modo="0"]`);
  await p.fill(`${I} #i3-matricula`, mat);
  await p.click(`${I} #i3-cartao-identificar [data-pesquisar]`);
  await p.waitForTimeout(400);
}

await caso('identificar: AA-12-BC mostra o veículo e fica em «Continuar»', 1440, async (p) => {
  await identificar(p, 'aa12bc');
  certo((await p.textContent(`${I} .ini4__veiculo-nome`)).includes('Renault Clio IV'), 'o veículo não apareceu');
  certo(await p.$(`${I} .ini4__carro.is-escolhido[data-matricula="AA-12-BC"]`), 'o cartão da garagem não ficou marcado');
  const at = await p.evaluate(() => JSON.parse(localStorage.getItem('goparts:atividade:v1') || '[]')[0]?.titulo);
  certo(at?.startsWith('Renault Clio IV'), 'não ficou registado');
  await p.click(`${I} .ini4__veiculo [data-pecas-matricula]`); await p.waitForTimeout(400);
  certo(await ecra(p) === 'catalogo', 'não foi ao catálogo');
});
await caso('identificar: matrícula incompleta e matrícula desconhecida', 1440, async (p) => {
  await identificar(p, 'AA-12');
  certo(await p.getAttribute(`${I} #i3-matricula`, 'aria-invalid') === 'true', 'não marcou o erro');
  await identificar(p, 'AB-34-ZZ');
  certo((await p.textContent(`${I} .ini4__veiculo`)).includes('Não encontrámos'), 'não disse que não encontrou');
  certo(!(await p.$(`${I} #i3-matricula[aria-invalid="true"]`)), 'o erro anterior ficou');
});
await caso('garagem: guardar o veículo identificado, favorito passa para a frente', 1440, async (p) => {
  await identificar(p, '78-QL-22');
  await p.click(`${I} [data-guardar-matricula]`); await p.waitForTimeout(300);
  certo(await p.$(`${I} .ini4__carro[data-matricula="78-QL-22"]`), 'não entrou na garagem');
  certo(await p.$(`${I} .ini4__veiculo .ini4__na-garagem`), 'o botão não mudou para «Está na garagem»');
  await p.click(`${I} .ini4__carro[data-matricula="12-RT-08"] [data-favorito]`);
  const ordem = await p.$$eval(`${I} .ini4__carro[data-carro]`, (l) => l.map((x) => x.dataset.matricula));
  certo(ordem.indexOf('12-RT-08') < ordem.indexOf('45-XZ-91'), `os favoritos não vieram para a frente: ${ordem}`);
});
await caso('garagem: mudar o nome, tirar e desfazer, adicionar pela matrícula', 1440, async (p) => {
  const c = `${I} .ini4__carro[data-matricula="45-XZ-91"]`;
  await p.click(`${c} [data-menu-carro]`); await p.click(`${c} [data-renomear]`);
  await p.fill(`${I} .ini4__renomear`, 'Carrinha da oficina'); await p.keyboard.press('Enter');
  certo((await p.textContent(`${c} [data-nome]`)) === 'Carrinha da oficina', 'o nome não mudou');
  await p.click(`${c} [data-menu-carro]`); await p.click(`${c} [data-remover-carro]`); await p.waitForTimeout(300);
  certo(!(await p.$(c)), 'não saiu');
  await p.click(`${P} .ini4__brinde [data-desfazer]`); await p.waitForTimeout(200);
  certo(await p.$(c), 'o «Desfazer» não o repôs');
  await p.fill(`${I} #i4-nova-mat`, 'ZZ'); await p.click(`${I} [data-garagem-nova] button[type="submit"]`);
  certo((await p.textContent(`${I} .ini4__novo-erro`)).includes('formato'), 'não validou');
  await p.fill(`${I} #i4-nova-mat`, '78ql22'); await p.click(`${I} [data-garagem-nova] button[type="submit"]`); await p.waitForTimeout(400);
  certo(await p.$(`${I} .ini4__carro[data-matricula="78-QL-22"]`), 'não adicionou');
});
await caso('encomendas: os contadores filtram; abre o percurso', 1440, async (p) => {
  await p.click(`${I} [data-kpi="entregue"]`);
  const vis = await p.$$eval(`${I} .ini4__enc-li:not([hidden])`, (l) => l.map((x) => x.dataset.estadoEnc));
  certo(vis.length === 3 && vis.every((x) => x === 'entregue'), `filtro errado: ${vis}`);
  await p.click(`${I} [data-kpi="entregue"]`);
  certo((await p.$$(`${I} .ini4__enc-li:not([hidden])`)).length === 4, 'não voltou às quatro');
  await p.click(`${I} .ini4__enc-li[data-enc="P2024/001233"] .ini4__enc`);
  certo(await p.isVisible(`${I} .ini4__enc-li[data-enc="P2024/001233"] .ini4__percurso`), 'o percurso não abriu');
  certo((await p.textContent(`${I} .ini4__enc-li[data-enc="P2024/001233"] [aria-current="step"]`)).includes('Expedido'), 'o passo atual está errado');
});
await caso('repetir encomenda: só os artigos do catálogo atual vão para o carrinho', 1440, async (p) => {
  const antes = await unidades(p);
  await p.click(`${I} [data-kpi="entregue"]`);
  await p.click(`${I} .ini4__enc-li[data-enc="P2024/001120"] .ini4__enc`);
  await p.click(`${I} [data-repetir-enc="P2024/001120"]`);
  await p.waitForSelector(`${P} .ini4__dialogo:not([hidden])`);
  certo((await p.$$(`${P} .ini4__dialogo .ini4__rep-li.is-fora`)).length === 6, 'devia deixar 6 artigos de fora');
  await p.keyboard.press('Escape');
  certo(await p.$(`${P} .ini4__dialogo[hidden]`), 'Esc não fechou');
  await p.click(`${I} [data-repetir-enc="P2024/001120"]`);
  await p.click(`${P} [data-confirmar-repetir]`); await p.waitForTimeout(700);
  certo(await unidades(p) === antes + 4, `o carrinho devia ter mais 4 (tem ${await unidades(p)} de ${antes})`);
  certo((await p.textContent(`${P} .ini4__brinde`)).includes('4 unidades'), 'o aviso não diz quantas');
});
await caso('peças: adicionar ao carrinho, favoritas e ver o stock', 1440, async (p) => {
  const antes = await unidades(p);
  await p.click(`${I} [data-pedir="VKM 38236"]`); await p.waitForTimeout(600);
  certo(await unidades(p) === antes + 1, 'não entrou no carrinho');
  certo((await p.textContent(`${I} [data-atalho="carrinho"] [data-carrinho-num]`)) === String(antes + 1), 'o número do atalho não mudou');
  await p.click(`${I} .ini4__peca[data-ref="VKM 38236"] [data-favorita-peca]`);
  await p.click(`${I} [data-pecas-filtro="favoritas"]`);
  const fav = await p.$$eval(`${I} .ini4__peca:not([hidden])`, (l) => l.map((x) => x.dataset.ref));
  certo(fav.includes('VKM 38236') && fav.includes('VKBA 6556') && fav.length === 2, `favoritas erradas: ${fav}`);
  await p.click(`${I} [data-ver-stock="VKBA 6556"]`); await p.waitForTimeout(500);
  certo(await p.$eval(`${I} [data-disp-ref]`, (s) => s.value) === 'VKBA 6556', 'o stock não mudou de referência');
  certo((await p.textContent(`${I} .ini4__armazem [data-qtd]`)).trim() === '12', 'o Porto devia ter 12');
});
await caso('personalizar: esconder, mover com o teclado, densidade, guarda e repõe', 1440, async (p) => {
  await p.click(`${I} [data-personalizar]`);
  await p.waitForSelector(`${P} .ini4__gaveta:not([hidden])`);
  await p.click(`${P} [data-mostrar-bloco="garagem"] + .sr-only + i`);
  certo(await p.$(`${I} [data-bloco="garagem"][hidden]`), 'a garagem não se escondeu');
  await p.focus(`${P} [data-bloco-ordem="disponibilidade"] [data-pega]`); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp');
  await p.click(`${P} input[data-escolha="densidade"][value="compacta"] + span`);
  await p.keyboard.press('Escape');
  await p.reload(); await p.waitForTimeout(900);
  certo(await p.$(`${I} [data-bloco="garagem"][hidden]`), 'não guardou o escondido');
  certo(await p.getAttribute(I, 'data-densidade') === 'compacta', 'não guardou a densidade');
  const o = await p.$$eval(`${I} .ini4__bloco`, (l) => Object.fromEntries(l.map((x) => [x.dataset.bloco, Number(x.style.order)])));
  certo(o.disponibilidade < o.frequentes && o.disponibilidade < o.categorias, `a ordem não mudou: ${JSON.stringify(o)}`);
  await p.click(`${I} [data-personalizar]`); await p.click(`${P} [data-repor-inicio]`); await p.click(`${P} .ini4__gaveta-pe [data-fechar-gaveta]`);
  await p.waitForTimeout(300);
  certo(!(await p.$(`${I} [data-bloco="garagem"][hidden]`)), 'repor não mostrou a garagem');
});
await caso('personalizar: arrastar a garagem para o topo pela pega', 1440, async (p) => {
  await p.click(`${I} [data-personalizar]`); await p.waitForSelector(`${P} .ini4__gaveta:not([hidden])`);
  const de = await p.$(`${P} [data-bloco-ordem="garagem"] [data-pega]`), para = await p.$(`${P} [data-bloco-ordem="atalhos"]`);
  const a = await de.boundingBox(), b = await para.boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  for (let k = 1; k <= 8; k++) await p.mouse.move(a.x + a.width / 2, a.y + (b.y + 4 - a.y) * k / 8);
  certo(await p.$(`${P} .ini4__ordem-lugar`), 'o lugar onde cai não aparece');
  await p.mouse.up(); await p.waitForTimeout(200);
  const ordem = await p.$$eval(`${P} [data-bloco-ordem]`, (l) => l.map((x) => x.dataset.blocoOrdem));
  certo(ordem[0] === 'garagem', `a ordem ficou ${ordem}`);
  certo(!(await p.$(`${P} .ini4__ordem-lugar`)), 'o lugar ficou para trás');
  certo(await p.$eval(`${I} [data-bloco="garagem"]`, (x) => x.style.order) === '0', 'o Início atrás não mudou');
});
await caso('atalhos: criar lista abre uma lista nova', 1440, async (p) => {
  await p.click(`${I} [data-atalho="lista"]`); await p.waitForTimeout(600);
  certo(await ecra(p) === 'lista', 'não foi à Minha lista');
  certo((await p.textContent('.ecra:not([hidden]) > .versao:not([hidden]) .lst')).includes('Nova lista'), 'não abriu uma lista nova');
});
await caso('telemóvel: sem deslocação horizontal', 390, async (p) => {
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  certo(w <= 390, `a página tem ${w} px de largura`);
});

await browser.close();
if (erros.length) console.log(`\nErros na página:\n  ${erros.join('\n  ')}`);
console.log(`\n${falhas.length ? `${falhas.length} falharam` : 'Todos passaram'}.`);
process.exit(falhas.length || erros.length ? 1 : 0);
