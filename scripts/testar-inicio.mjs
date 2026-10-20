/* Testa o Início do GoParts e a Pesquisar peças (20 out. 2026, V5): no painel, o período, o gráfico, os números, os
   estados, os alertas, os pedidos, o acesso rápido, a passagem para a pesquisa e o «voltar», e «Personalizar»; na
   pesquisa (o que era o Início até à V4), o veículo identificado, a garagem, as peças e o stock. Corre contra o site
   compilado (npm run ver).

   node scripts/testar-inicio.mjs [endereço]   (por omissão http://localhost:5173)
   Precisa do Playwright: PLAYWRIGHT=/caminho/para/playwright/index.mjs */
const pw = await import(process.env.PLAYWRIGHT || 'playwright');
const { chromium } = pw.default ?? pw;
const BASE = process.argv[2] || 'http://localhost:5173';

const browser = await chromium.launch();
const falhas = [];
const erros = [];
async function caso(nome, largura, f, inicial = 'inicio') {
  const ctx = await browser.newContext({ viewport: { width: largura, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erros.push(`${nome}: ${e.message}`));
  await p.goto(`${BASE}/goparts/#so=ecra&ecra=lista`);
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.versoes { display: none !important; }'; document.head.appendChild(s); }); });
  await p.goto(`${BASE}/goparts/#so=ecra&ecra=${inicial}`); await p.reload();
  await p.waitForTimeout(900);
  try { await f(p); console.log(`ok    ${nome}`); }
  catch (e) { falhas.push(nome); console.log(`FALHA ${nome}\n      ${String(e.message || e).split('\n')[0]}`); }
  await ctx.close();
}
const I = '.ecra:not([hidden]) > .versao:not([hidden]) .ini4';
const P = '.ecra:not([hidden]) > .versao:not([hidden]) .portal--ini4';
const N = '.ecra:not([hidden]) > .versao:not([hidden]) .pn';
const NP = '.ecra:not([hidden]) > .versao:not([hidden]) .portal--pn';
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
}, 'pesquisa');
await caso('identificar: matrícula incompleta e matrícula desconhecida', 1440, async (p) => {
  await identificar(p, 'AA-12');
  certo(await p.getAttribute(`${I} #i3-matricula`, 'aria-invalid') === 'true', 'não marcou o erro');
  await identificar(p, 'AB-34-ZZ');
  certo((await p.textContent(`${I} .ini4__veiculo`)).includes('Não encontrámos'), 'não disse que não encontrou');
  certo(!(await p.$(`${I} #i3-matricula[aria-invalid="true"]`)), 'o erro anterior ficou');
}, 'pesquisa');
await caso('garagem: guardar o veículo identificado, favorito passa para a frente', 1440, async (p) => {
  await identificar(p, '78-QL-22');
  await p.click(`${I} [data-guardar-matricula]`); await p.waitForTimeout(300);
  certo(await p.$(`${I} .ini4__carro[data-matricula="78-QL-22"]`), 'não entrou na garagem');
  certo(await p.$(`${I} .ini4__veiculo .ini4__na-garagem`), 'o botão não mudou para «Está na garagem»');
  await p.click(`${I} .ini4__carro[data-matricula="12-RT-08"] [data-favorito]`);
  const ordem = await p.$$eval(`${I} .ini4__carro[data-carro]`, (l) => l.map((x) => x.dataset.matricula));
  certo(ordem.indexOf('12-RT-08') < ordem.indexOf('45-XZ-91'), `os favoritos não vieram para a frente: ${ordem}`);
}, 'pesquisa');
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
}, 'pesquisa');
await caso('peças: adicionar ao carrinho, favoritas e ver o stock', 1440, async (p) => {
  const antes = await unidades(p);
  await p.click(`${I} [data-pedir="VKM 38236"]`); await p.waitForTimeout(600);
  certo(await unidades(p) === antes + 1, 'não entrou no carrinho');
  await p.click(`${I} .ini4__peca[data-ref="VKM 38236"] [data-favorita-peca]`);
  await p.click(`${I} [data-pecas-filtro="favoritas"]`);
  const fav = await p.$$eval(`${I} .ini4__peca:not([hidden])`, (l) => l.map((x) => x.dataset.ref));
  certo(fav.includes('VKM 38236') && fav.includes('VKBA 6556') && fav.length === 2, `favoritas erradas: ${fav}`);
  await p.click(`${I} [data-ver-stock="VKBA 6556"]`); await p.waitForTimeout(500);
  certo(await p.$eval(`${I} [data-disp-ref]`, (s) => s.value) === 'VKBA 6556', 'o stock não mudou de referência');
  certo((await p.textContent(`${I} .ini4__armazem [data-qtd]`)).trim() === '12', 'o Porto devia ter 12');
}, 'pesquisa');
await caso('painel: a pesquisa já não está no Início; os seis números e o período', 1440, async (p) => {
  certo(!(await p.$(`${N} .ini3__cartao`)), 'o Início ainda tem os formulários da pesquisa');
  const n = await p.$$eval(`${N} .pn__kpi`, (l) => l.length); certo(n === 6, `há ${n} números`);
  const ef = () => p.textContent(`${N} [data-kpi="efetuados"] .pn__kpi-valor`);
  certo((await ef()).trim() === '2', `7 dias devia dar 2 pedidos, deu ${await ef()}`);
  const curso = await p.textContent(`${N} [data-kpi="curso"] .pn__kpi-valor`);
  await p.click(`${N} [data-periodo="30"]`); await p.waitForTimeout(500);
  certo((await ef()).trim() === '5', `30 dias devia dar 5 pedidos, deu ${await ef()}`);
  certo((await p.textContent(`${N} [data-kpi="curso"] .pn__kpi-valor`)) === curso, 'o «em curso» mudou com o período');
  certo(!(await p.textContent(`${N} [data-kpi="efetuados"] [data-antes]`)).trim(), '30 dias não tem histórico para comparar e mostrou o anterior');
  await p.click(`${N} [data-periodo="hoje"]`); await p.waitForTimeout(500);
  certo((await ef()).trim() === '0', 'hoje devia dar 0');
});
await caso('painel: personalizado — datas trocadas dão erro, as certas aplicam-se', 1440, async (p) => {
  await p.click(`${N} [data-periodo="pers"]`);
  await p.fill(`${N} [data-pers] [name="de"]`, '2024-04-10'); await p.fill(`${N} [data-pers] [name="ate"]`, '2024-04-01');
  await p.click(`${N} [data-pers] [type="submit"]`);
  certo((await p.textContent(`${N} .pn__pers-erro`)).includes('antes'), 'não disse que as datas estão trocadas');
  await p.fill(`${N} [data-pers] [name="de"]`, '2024-03-14'); await p.fill(`${N} [data-pers] [name="ate"]`, '2024-04-16');
  await p.click(`${N} [data-pers] [type="submit"]`); await p.waitForTimeout(500);
  certo((await p.textContent(`${N} [data-kpi="efetuados"] .pn__kpi-valor`)).trim() === '6', 'o período personalizado não contou os 6 pedidos');
  certo((await p.textContent(`${N} [data-graf-total]`)).includes('2 892,15'), `o gráfico não acompanhou: ${await p.textContent(`${N} [data-graf-total]`)}`);
});
await caso('gráfico: número de pedidos, 90 dias com os dias sem dados, a dica pelo teclado', 1440, async (p) => {
  await p.evaluate((s) => document.querySelector(s).scrollIntoView(), `${N} [data-graf]`); await p.waitForTimeout(1200);
  await p.click(`${N} [data-metrica="pedidos"]`); await p.waitForTimeout(600);
  certo((await p.textContent(`${N} [data-graf-total]`)).trim() === '2 pedidos', `o total em pedidos ficou «${await p.textContent(`${N} [data-graf-total]`)}»`);
  await p.click(`${N} [data-graf-periodo="90"]`); await p.waitForTimeout(700);
  certo(await p.$(`${N} .pn__g-sem`), 'os dias antes do histórico não aparecem tracejados');
  certo((await p.textContent(`${N} [data-graf-total]`)).trim() === '6 pedidos', 'os 90 dias deviam ter os 6 pedidos');
  await p.focus(`${N} [data-graf]`); await p.keyboard.press('End');
  const d = await p.textContent(`${N} [data-dica]`);
  certo(d.includes('16 de abril de 2024') && d.includes('Acumulado: 6 pedidos'), `a dica diz «${d}»`);
  const y0 = await p.$$eval(`${N} .pn__g text`, (l) => l.find((t) => t.textContent === '0')?.textContent);
  certo(y0 === '0', 'a escala não começa no zero');
});
await caso('estados e números levam às listas filtradas; o zero não se clica', 1440, async (p) => {
  certo(await p.$eval(`${N} [data-kpi="recolha"]`, (b) => b.disabled), 'o zero da recolha devia estar desligado');
  await p.click(`${N} .pn__estado--expedido`); await p.waitForTimeout(700);
  certo(await ecra(p) === 'pedidos', 'não foi aos Pedidos');
  certo(await p.$eval('.ecra:not([hidden]) > .versao:not([hidden]) .ped4__etapa-f[aria-pressed="true"]', (b) => b.dataset.etapa) === 'expedido', 'os Pedidos não vieram filtrados');
  await p.goBack(); await p.waitForTimeout(700);
  certo(await ecra(p) === 'inicio', `o «voltar» do navegador foi a ${await ecra(p)}`);
  await p.click(`${N} .pn__alerta-li:first-child .pn__alerta-acao`); await p.waitForTimeout(700);
  certo(await ecra(p) === 'faturas', 'o alerta da fatura vencida não abriu as Faturas');
});
await caso('últimos pedidos: a linha abre o pedido; ver todos', 1440, async (p) => {
  const n = await p.$$eval(`${N} .pn__linha`, (l) => l.length); certo(n === 5, `há ${n} linhas`);
  await p.click(`${N} .pn__linha:first-child td[data-r="Total"]`); await p.waitForTimeout(700);
  certo(await ecra(p) === 'pedidos', 'a linha não abriu os Pedidos');
});
await caso('acesso rápido: Pesquisar peças abre o ecrã da pesquisa com o foco no campo; voltar', 1440, async (p) => {
  await p.click(`${N} [data-pn-atalho="pesquisa"]`); await p.waitForTimeout(800);
  certo(await ecra(p) === 'pesquisa', 'não foi à Pesquisar peças');
  certo(await p.evaluate(() => document.activeElement?.closest('.ini3__cartao') !== null && document.activeElement?.tagName === 'INPUT'), 'o foco não ficou no campo');
  certo(await p.$eval('.ecra:not([hidden]) > .versao:not([hidden]) .lado__item[aria-current="page"]', (b) => b.dataset.ladoItem) === 'pesquisa', 'a barra não marca a pesquisa');
  const vis = await p.$$eval('.ecra:not([hidden]) > .versao:not([hidden]) .ini3__cartao', (l) => l.filter((c) => getComputedStyle(c).display !== 'none').length);
  certo(vis === 1, `vêem-se ${vis} formulários`);
  await p.goBack(); await p.waitForTimeout(700);
  certo(await ecra(p) === 'inicio', 'o «voltar» não voltou ao Início');
  for (const [a, e] of [['pedidos', 'pedidos'], ['faturas', 'faturas'], ['devolucoes', 'devolucoes'], ['tecnica', 'tecnica'], ['lista', 'lista']]) {
    await p.click(`.ecra:not([hidden]) > .versao:not([hidden]) .lado__item[data-lado-item="inicio"]`); await p.waitForTimeout(500);
    await p.click(`${N} [data-pn-atalho="${a}"]`); await p.waitForTimeout(600);
    certo(await ecra(p) === e, `o atalho ${a} foi a ${await ecra(p)}`);
  }
});
await caso('personalizar: esconder, mover com o teclado, atalhos e período ao abrir; guarda e repõe', 1440, async (p) => {
  await p.click(`${N} [data-pn-personalizar]:not([data-pn-personalizar="atalhos"])`);
  await p.waitForSelector(`${NP} .pn__gaveta:not([hidden])`);
  await p.click(`${NP} [data-pn-mostrar="atividade"] + .sr-only + i`);
  certo(await p.$(`${N} [data-w="atividade"][hidden]`), 'a atividade não se escondeu');
  await p.focus(`${NP} [data-w-ordem="atencao"] [data-pn-pega]`); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp');
  await p.click(`${NP} [data-pn-periodo-omissao][value="30"] + span`);
  await p.click(`${NP} [data-pn-atalho-escolha="guias"]`);
  await p.keyboard.press('Escape');
  await p.reload(); await p.waitForTimeout(900);
  certo(await p.$(`${N} [data-w="atividade"][hidden]`), 'não guardou o escondido');
  certo(await p.getAttribute(N, 'data-periodo') === '30', 'não guardou o período ao abrir');
  certo(await p.$(`${N} [data-pn-atalho="guias"]`), 'não guardou o atalho');
  const o = await p.$$eval(`${N} [data-w]`, (l) => Object.fromEntries(l.map((x) => [x.dataset.w, Number(x.style.order)])));
  certo(o.atencao === 0, `a ordem não mudou: ${JSON.stringify(o)}`);
  await p.click(`${N} [data-pn-personalizar]:not([data-pn-personalizar="atalhos"])`); await p.click(`${NP} [data-pn-repor]`); await p.click(`${NP} .pn__gaveta-pe [data-pn-fechar]`);
  await p.waitForTimeout(300);
  certo(!(await p.$(`${N} [data-w="atividade"][hidden]`)), 'repor não mostrou a atividade');
});
await caso('personalizar: arrastar os pedidos para o topo pela pega', 1440, async (p) => {
  await p.click(`${N} [data-pn-personalizar]:not([data-pn-personalizar="atalhos"])`); await p.waitForSelector(`${NP} .pn__gaveta:not([hidden])`);
  const de = await p.$(`${NP} [data-w-ordem="pedidos"] [data-pn-pega]`), para = await p.$(`${NP} [data-w-ordem]`);
  const a = await de.boundingBox(), b = await para.boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  for (let k = 1; k <= 8; k++) await p.mouse.move(a.x + a.width / 2, a.y + (b.y + 4 - a.y) * k / 8);
  certo(await p.$(`${NP} .pn__ordem-lugar`), 'o lugar onde cai não aparece');
  await p.mouse.up(); await p.waitForTimeout(200);
  const ordem = await p.$$eval(`${NP} [data-w-ordem]`, (l) => l.map((x) => x.dataset.wOrdem));
  certo(ordem[0] === 'pedidos', `a ordem ficou ${ordem}`);
  certo(await p.$eval(`${N} [data-w="pedidos"]`, (x) => x.style.order) === '0', 'o Início atrás não mudou');
});
await caso('barra lateral: os três grupos, recolhe e fica guardada', 1440, async (p) => {
  const L = '.ecra:not([hidden]) > .versao:not([hidden]) .portal__lado';
  const g = await p.$$eval(`${L} .lado__grupo`, (l) => l.map((x) => x.textContent.trim()));
  certo(g.join() === 'Principal,Documentos,Ferramentas', `os grupos são ${g}`);
  await p.click(`${L} [data-lado-recolher]`); await p.waitForTimeout(400);
  certo((await p.$eval(L, (n) => n.getBoundingClientRect().width)) <= 70, 'não recolheu');
  await p.reload(); await p.waitForTimeout(900);
  certo(await p.evaluate(() => document.documentElement.classList.contains('gp-lado-recolhido')), 'a escolha não ficou guardada');
});
await caso('tablet: a barra fica recolhida e o ☰ não aparece', 1000, async (p) => {
  certo((await p.$eval('.ecra:not([hidden]) > .versao:not([hidden]) .portal__lado', (n) => n.getBoundingClientRect().width)) <= 70, 'a barra não está recolhida');
  certo(await p.isHidden('.ecra:not([hidden]) > .versao:not([hidden]) .portal__menu'), 'o ☰ aparece no tablet');
});
await caso('telemóvel: sem barra lateral, o ☰ abre a gaveta com a Pesquisar peças', 390, async (p) => {
  certo(await p.isHidden('.ecra:not([hidden]) > .versao:not([hidden]) .portal__lado'), 'a barra lateral aparece no telemóvel');
  await p.click('.ecra:not([hidden]) > .versao:not([hidden]) .portal__menu');
  certo(await p.waitForSelector('.bc-menu', { state: 'visible', timeout: 2000 }), 'a gaveta não abriu');
  certo((await p.textContent('.bc-menu')).includes('Pesquisar peças'), 'a gaveta não tem a Pesquisar peças');
});
await caso('telemóvel: atenção primeiro, sem deslocação horizontal, a tabela em cartões', 390, async (p) => {
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  certo(w <= 390, `a página tem ${w} px de largura`);
  const topo = await p.$$eval(`${N} [data-w]`, (l) => l.map((x) => [x.dataset.w, x.getBoundingClientRect().top]).sort((a, b) => a[1] - b[1])[0][0]);
  certo(topo === 'atencao', `o primeiro bloco é ${topo}`);
  certo(await p.$eval(`${N} .pn__tabela thead`, (t) => getComputedStyle(t).display === 'none'), 'a tabela não passou a cartões');
});
await caso('pesquisa no telemóvel: sem deslocação horizontal', 390, async (p) => {
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  certo(w <= 390, `a página tem ${w} px de largura`);
}, 'pesquisa');

await browser.close();
if (erros.length) console.log(`\nErros na página:\n  ${erros.join('\n  ')}`);
console.log(`\n${falhas.length ? `${falhas.length} falharam` : 'Todos passaram'}.`);
process.exit(falhas.length || erros.length ? 1 : 0);
