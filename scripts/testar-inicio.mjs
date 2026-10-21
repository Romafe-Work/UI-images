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
await caso('painel: sem os formulários da pesquisa; os quatro números do agora', 1440, async (p) => {
  certo(!(await p.$(`${N} .ini3__cartao`)), 'o Início ainda tem os formulários da pesquisa');
  const v = await p.$$eval(`${N} .pn__kpi`, (l) => l.map((b) => [b.dataset.kpi, b.querySelector('.pn__kpi-valor').textContent.trim()]));
  certo(JSON.stringify(v) === JSON.stringify([['curso', '03'], ['transporte', '01'], ['recolha', '00'], ['devolucoes', '02']]), `os números são ${JSON.stringify(v)}`);
  certo(await p.$eval(`${N} [data-kpi="recolha"]`, (b) => b.disabled), 'o zero da recolha devia estar desligado');
});
await caso('gráfico: personalizado — datas trocadas dão erro, as certas aplicam-se', 1440, async (p) => {
  await p.click(`${N} [data-periodo="pers"]`);
  await p.fill(`${N} [data-pers] [name="de"]`, '2024-04-10'); await p.fill(`${N} [data-pers] [name="ate"]`, '2024-04-01');
  await p.click(`${N} [data-pers] [type="submit"]`);
  certo((await p.textContent(`${N} .pn__pers-erro`)).includes('antes'), 'não disse que as datas estão trocadas');
  await p.fill(`${N} [data-pers] [name="de"]`, '2024-03-14'); await p.fill(`${N} [data-pers] [name="ate"]`, '2024-04-16');
  await p.click(`${N} [data-pers] [type="submit"]`); await p.waitForTimeout(600);
  certo((await p.textContent(`${N} [data-graf-total]`)).includes('2 892,15'), `o gráfico não mudou: ${await p.textContent(`${N} [data-graf-total]`)}`);
});
await caso('gráfico: número de pedidos, 90 dias com os dias sem dados, a dica pelo teclado', 1440, async (p) => {
  await p.evaluate((s) => document.querySelector(s).scrollIntoView(), `${N} [data-graf]`); await p.waitForTimeout(1200);
  await p.click(`${N} [data-metrica="pedidos"]`); await p.waitForTimeout(600);
  certo((await p.textContent(`${N} [data-graf-total]`)).trim() === '5 pedidos', `o total em pedidos (30 dias) ficou «${await p.textContent(`${N} [data-graf-total]`)}»`);
  await p.click(`${N} [data-periodo="90"]`); await p.waitForTimeout(700);
  certo(await p.$(`${N} .pn__g-sem`), 'os dias antes do histórico não aparecem tracejados');
  certo((await p.textContent(`${N} [data-graf-total]`)).trim() === '6 pedidos', 'os 90 dias deviam ter os 6 pedidos');
  await p.focus(`${N} [data-graf]`); await p.keyboard.press('End');
  const d = await p.textContent(`${N} [data-dica]`);
  certo(d.includes('16 de abril de 2024') && d.includes('Acumulado: 6 pedidos'), `a dica diz «${d}»`);
  const y0 = await p.$$eval(`${N} .pn__g text`, (l) => l.find((t) => t.textContent === '0')?.textContent);
  certo(y0 === '0', 'a escala não começa no zero');
});
await caso('números e alertas levam às listas filtradas; o voltar do navegador', 1440, async (p) => {
  await p.click(`${N} [data-kpi="transporte"]`); await p.waitForTimeout(700);
  certo(await ecra(p) === 'pedidos', 'não foi aos Pedidos');
  certo(await p.$eval('.ecra:not([hidden]) > .versao:not([hidden]) .ped4__etapa-f[aria-pressed="true"]', (b) => b.dataset.etapa) === 'expedido', 'os Pedidos não vieram filtrados');
  await p.goBack(); await p.waitForTimeout(700);
  certo(await ecra(p) === 'inicio', `o «voltar» do navegador foi a ${await ecra(p)}`);
  await p.click(`${N} .pn__grupo--urgente .pn__alerta-cab`);
  certo(await p.isVisible(`${N} .pn__grupo--urgente .pn__alerta-det`), 'o alerta não abriu o pormenor');
  await p.click(`${N} .pn__grupo--urgente .pn__alerta-det .btn`); await p.waitForTimeout(700);
  certo(await ecra(p) === 'faturas', 'o alerta da fatura vencida não abriu as Faturas');
});
await caso('cabeçalho: «Pesquisar peças» abre o ecrã da pesquisa com o foco num campo', 1440, async (p) => {
  certo(!(await p.$(`${N} .ini3__cartao, ${N} #i3-matricula, ${N} .pq__modo`)), 'o Início tem formulários da pesquisa');
  await p.click(`${N} .pn__pesquisar`); await p.waitForTimeout(800);
  certo(await ecra(p) === 'pesquisa', 'não foi à Pesquisar peças');
  certo(await p.evaluate(() => document.activeElement?.tagName) === 'INPUT', 'o foco não ficou num campo');
});
await caso('últimos pedidos: a linha abre o percurso; «Ver» abre o pedido', 1440, async (p) => {
  const n = await p.$$eval(`${N} .pn__linha`, (l) => l.length); certo(n === 5, `há ${n} linhas`);
  await p.click(`${N} .pn__linha:nth-child(3) td[data-r="Valor"]`); await p.waitForTimeout(300);
  certo(await p.isVisible(`${N} .pn__linha-det:not([hidden]) .pn__percurso`), 'o percurso não abriu');
  certo(await p.$(`${N} .pn__percurso [aria-current="step"]`), 'o passo atual não está marcado');
  await p.click(`${N} .pn__linha:first-child .pn__ver`); await p.waitForTimeout(700);
  certo(await ecra(p) === 'pedidos', '«Ver» não abriu os Pedidos');
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
  for (const [a, e] of [['faturas', 'faturas'], ['guias', 'guias'], ['tecnica', 'tecnica'], ['lista', 'lista']]) {
    await p.click(`.ecra:not([hidden]) > .versao:not([hidden]) .lado__item[data-lado-item="inicio"]`); await p.waitForTimeout(500);
    await p.click(`${N} [data-pn-atalho="${a}"]`); await p.waitForTimeout(600);
    certo(await ecra(p) === e, `o atalho ${a} foi a ${await ecra(p)}`);
  }
});
await caso('definições: esconder o gráfico, período ao abrir e atalhos; guarda e repõe', 1440, async (p) => {
  await p.click(`${N} [data-pn-personalizar]`);
  await p.waitForSelector(`${NP} .pn__gaveta:not([hidden])`);
  await p.click(`${NP} [data-pn-mostrar="evolucao"] + .sr-only + i`);
  certo(await p.$(`${N} [data-w="evolucao"][hidden]`), 'o gráfico não se escondeu');
  await p.click(`${NP} [data-pn-periodo-omissao][value="90"] + span`);
  await p.click(`${NP} [data-pn-atalho-escolha="pedidos"]`);
  await p.keyboard.press('Escape');
  await p.reload(); await p.waitForTimeout(900);
  certo(await p.$(`${N} [data-w="evolucao"][hidden]`), 'não guardou o escondido');
  certo(await p.$(`${N} [data-periodo="90"][aria-checked="true"]`), 'não guardou o período ao abrir');
  certo(await p.$(`${N} [data-pn-atalho="pedidos"]`), 'não guardou o atalho');
  await p.click(`${N} [data-pn-personalizar]`); await p.click(`${NP} [data-pn-repor]`); await p.click(`${NP} .pn__gaveta-pe [data-pn-fechar]`);
  await p.waitForTimeout(300);
  certo(!(await p.$(`${N} [data-w="evolucao"][hidden]`)), 'repor não mostrou o gráfico');
});
await caso('atualizar: os dados ficam e a hora muda', 1440, async (p) => {
  await p.click(`${N} [data-pn-atualizar]`);
  certo((await p.textContent(`${N} [data-atualizado]`)).includes('A atualizar'), 'não disse que estava a atualizar');
  certo((await p.$$(`${N} .pn__linha`)).length === 5, 'os pedidos saíram durante a atualização');
  await p.waitForTimeout(1200);
  certo((await p.textContent(`${N} [data-atualizado]`)).startsWith('Atualizado às'), 'a hora não voltou');
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
await caso('pesquisa: três cartões e um só formulário; mudar de cartão guarda o que se escreveu', 1440, async (p) => {
  certo((await p.$$(`${I} .pq__modo`)).length === 3, 'não há três cartões');
  const vis = () => p.$$eval(`${I} .ini3__cartao`, (l) => l.filter((c) => getComputedStyle(c).display !== 'none').length);
  certo(await vis() === 1, 'vê-se mais de um formulário');
  await p.click(`${I} .pq__modo[data-modo="0"]`); await p.fill(`${I} #i3-matricula`, 'AA-12');
  await p.click(`${I} .pq__modo[data-modo="2"]`); certo(await vis() === 1, 'vê-se mais de um formulário');
  await p.click(`${I} .pq__modo[data-modo="0"]`);
  certo(await p.inputValue(`${I} #i3-matricula`) === 'AA-12', 'perdeu a matrícula');
  certo(await p.isHidden(`${I} #i3-chassis`), 'o VIN devia estar em «Mais opções», fechado');
}, 'pesquisa');
await caso('pesquisa por referência: escrita de qualquer forma, exata primeiro, filtros e limpar', 1440, async (p) => {
  await p.click(`${I} .pq__modo[data-modo="2"]`);
  await p.fill(`${I} #i3-referencia`, 'vkba-6556'); await p.keyboard.press('Escape');
  await p.click(`${I} #i3-cartao-referencia [data-pesquisar]`); await p.waitForTimeout(900);
  const primeira = await p.$eval(`${I} .pr__item`, (li) => li.dataset.ref);
  certo(primeira === 'VKBA 6556', `a primeira é ${primeira}`);
  certo(await p.$(`${I} .pr__tipo--equivalente`), 'não juntou as equivalentes');
  await p.click(`${I} [data-pr-vista="grelha"]`);
  certo(await p.$(`${I} .pr__lista[data-vista="grelha"]`), 'a grelha não mudou');
  await p.click(`${I} [data-pr-marca="FAG"]`);
  certo((await p.$$eval(`${I} .pr__item`, (l) => l.map((x) => x.querySelector('.pr__fab').textContent))).every((m) => m === 'FAG'), 'o filtro da marca não filtrou');
  await p.click(`${I} [data-pr-limpar]`); await p.waitForTimeout(400);
  certo(await p.isHidden(`${I} [data-pr]`), 'os resultados não saíram');
  certo(await p.evaluate(() => document.activeElement?.id) === 'i3-referencia', 'o foco não voltou ao campo');
}, 'pesquisa');
await caso('pesquisa por referência: não encontrada → pesquisa parcial', 1440, async (p) => {
  await p.click(`${I} .pq__modo[data-modo="2"]`);
  await p.fill(`${I} #i3-referencia`, 'XQ-99812'); await p.keyboard.press('Escape');
  await p.click(`${I} #i3-cartao-referencia [data-pesquisar]`); await p.waitForTimeout(900);
  certo((await p.textContent(`${I} [data-pr]`)).includes('Não encontrámos'), 'não disse que não encontrou');
  certo(await p.$(`${I} [data-pr-parcial]`), 'não ofereceu a pesquisa parcial');
}, 'pesquisa');
await caso('por veículo: marca → modelo → motorização, nada antes do tempo; selecionar mostra o veículo', 1440, async (p) => {
  await p.click(`${I} .pq__modo[data-modo="1"]`);
  certo(await p.$eval(`${I} #i3-modelo`, (s) => s.disabled), 'o modelo devia esperar pela marca');
  await p.fill(`${I} #i3-marca`, 'Ren'); await p.waitForTimeout(400);
  await p.click(`${I} #i3-marca-lista [data-valor="Renault"]`); await p.waitForTimeout(700);
  certo(!(await p.$eval(`${I} #i3-modelo`, (s) => s.disabled)), 'o modelo não acendeu');
  certo(await p.$eval(`${I} #i3-variante`, (s) => s.disabled), 'a motorização devia esperar pelo modelo');
  await p.selectOption(`${I} #i3-modelo`, 'Clio IV (BH_)'); await p.waitForTimeout(200);
  await p.selectOption(`${I} #i3-variante`, '1'); await p.waitForTimeout(200);
  certo((await p.textContent(`${I} [data-passos]`)).includes('Clio IV'), 'o resumo não mostra o modelo');
  await p.click(`${I} #i3-cartao-selecionar [data-pesquisar]`); await p.waitForTimeout(500);
  certo((await p.textContent(`${I} .ini4__veiculo`)).includes('Renault Clio IV'), 'o veículo não apareceu');
}, 'pesquisa');
await caso('por veículo: uma marca sem modelos no catálogo di-lo', 1440, async (p) => {
  await p.click(`${I} .pq__modo[data-modo="1"]`);
  await p.fill(`${I} #i3-marca`, 'Fia'); await p.waitForTimeout(400);
  await p.click(`${I} #i3-marca-lista [data-valor="Fiat"]`); await p.waitForTimeout(700);
  certo((await p.textContent(`${I} #i3-cartao-selecionar`)).includes('ainda não tem modelos da Fiat'), 'não disse que não há modelos');
}, 'pesquisa');
await caso('por matrícula: pela descrição, os veículos possíveis e confirmar um', 1440, async (p) => {
  await p.click(`${I} .pq__modo[data-modo="0"]`);
  await p.click(`${I} #i3-cartao-identificar .pq__mais > summary`);
  await p.fill(`${I} #i3-descricao`, 'Clio 1.5 dCi');
  await p.click(`${I} #i3-cartao-identificar [data-pesquisar]`); await p.waitForTimeout(900);
  const n = await p.$$eval(`${I} [data-confirmar-veiculo]`, (l) => l.length); certo(n > 1, `há ${n} veículos possíveis`);
  await p.click(`${I} [data-confirmar-veiculo]`); await p.waitForTimeout(400);
  certo((await p.textContent(`${I} .ini4__veiculo`)).includes('a partir da descrição'), 'não mostrou o veículo confirmado');
}, 'pesquisa');
await caso('resultado → ficha no catálogo (com a compatibilidade por confirmar) → voltar aos mesmos resultados', 1440, async (p) => {
  await p.click(`${I} .pq__modo[data-modo="2"]`);
  await p.fill(`${I} #i3-referencia`, 'VKBA 6556'); await p.keyboard.press('Escape');
  await p.click(`${I} #i3-cartao-referencia [data-pesquisar]`); await p.waitForTimeout(900);
  await p.click(`${I} [data-pr-ficha="VKBA 6556"]`); await p.waitForTimeout(900);
  certo(await ecra(p) === 'catalogo', 'não foi ao catálogo');
  certo((await p.textContent('.ecra:not([hidden]) .cat6__ficha:not([hidden]) .cat5__peca-ref')).trim() === 'VKBA 6556', 'a ficha não é a da peça');
  certo(await p.$('.ecra:not([hidden]) .cat6__ficha .cat5__compat--duvida'), 'sem veículo, a compatibilidade devia estar por confirmar');
  certo(await p.$('.ecra:not([hidden]) .cat6__ficha .cat5__peca-azulejo'), 'a ficha não tem o desenho da peça');
  await p.goBack(); await p.waitForTimeout(800);
  certo(await ecra(p) === 'pesquisa', 'o voltar não voltou à pesquisa');
  certo(await p.isVisible(`${I} .pr__item[data-ref="VKBA 6556"]`), 'os resultados não ficaram');
}, 'pesquisa');
await caso('pesquisa no telemóvel: sem deslocação horizontal', 390, async (p) => {
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  certo(w <= 390, `a página tem ${w} px de largura`);
}, 'pesquisa');

await browser.close();
if (erros.length) console.log(`\nErros na página:\n  ${erros.join('\n  ')}`);
console.log(`\n${falhas.length ? `${falhas.length} falharam` : 'Todos passaram'}.`);
process.exit(falhas.length || erros.length ? 1 : 0);
