/* =========================================================
   GOPARTS — os estados do 10 · Início (v2.2) e do 11 · Catálogo (v2)
   12 out. 2026. Ela: «por baixo do screen 10 e 11 quero que cries os
   respetivos screens de loading, error… e faz 10.1, 10.2…».
   Cada estado parte do HTML do ecrã (catalogo-v2.html…; o Início v3 faz os seus em inicio-v3.ts) e
   muda só o que esse estado muda, pelo DOM de um <template>: carregar,
   pesquisar, sem resultados, erros de formulário, sem ligação, falha de uma
   parte e vazio. As regras são as dos ecrãs de carregamento e de erro:
   o esqueleto tem a forma do que vem; cada erro diz o que aconteceu, o que
   fazer, e dá uma saída com ícone e texto.
   ========================================================= */
import type { EcraGoParts, IdGoParts } from '../ids';
import { portal } from './base';
import { inicioV3, type EstadoInicio } from './inicio-v3';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import catalogoV2 from './catalogo-v2.html?raw';
import { catalogoV3 } from './catalogo-v3';
import { mostrar, passos, encherModelos, encherVeiculos } from '../comportamento/catalogo-v3';
import { catalogoV5 } from './catalogo-v5';
import { abrirReferencias, abrirDetalhes, escolherGrupo, ramo, fluxo, marcarComparar } from '../comportamento/catalogo-v5';
import { pedidosV4, detalhe as detalhePed, pedidoDe, linhaDe, valorDe } from './pedidos-v4';
import { LINHAS as LINHAS_PED, euros as eurosPed } from './pedidos-dados';
import { guiasV3, guiaDe, detalheGuia, cabecaDoc, paginaDoc, rodapeDoc } from './guias-v3';
import { GUIAS } from './guias-dados';
import { faturasV1 } from './faturas-v1';
import { preencher as preencherFatura } from '../comportamento/faturas';

export type IdEstadoInicio = 'inicio-carga' | 'inicio-modelos' | 'inicio-pesquisa' | 'inicio-sem-resultados' | 'inicio-formulario' | 'inicio-rede' | 'inicio-falha' | 'inicio-vazio' | 'inicio-comando';
export type IdEstadoPedidos = 'pedidos-tabela' | 'pedidos-inicio' | 'pedidos-selecionado' | 'pedidos-encontrado' | 'pedidos-repetir' | 'pedidos-repetido' | 'pedidos-repetido-parte' | 'pedidos-a-abrir' | 'pedidos-processamento' | 'pedidos-recolher' | 'pedidos-expedido' | 'pedidos-gaveta' | 'pedidos-sessao' | 'pedidos-sem-permissao' | 'pedidos-documento' | 'pedidos-carga' | 'pedidos-filtrar' | 'pedidos-vazio' | 'pedidos-datas' | 'pedidos-rede' | 'pedidos-falha' | 'pedidos-aberto' | 'pedidos-primeira';
export type IdEstadoFaturas = 'faturas-carga' | 'faturas-pesquisa' | 'faturas-vazio' | 'faturas-filtros' | 'faturas-rede' | 'faturas-falha' | 'faturas-aberta' | 'faturas-vencida' | 'faturas-primeira';
export type IdEstadoGuias = 'guias-inicio' | 'guias-carga' | 'guias-pesquisa' | 'guias-primeira' | 'guias-vazio' | 'guias-filtros' | 'guias-selecionada' | 'guias-aberta' | 'guias-credito' | 'guias-relacionada' | 'guias-pedido-indisponivel' | 'guias-pdf-carga' | 'guias-pdf' | 'guias-pdf-erro' | 'guias-descarga' | 'guias-descarga-erro' | 'guias-rede' | 'guias-falha' | 'guias-sessao' | 'guias-sem-permissao' | 'guias-tabela';
export type IdEstadoCatalogo = 'catalogo-carga' | 'catalogo-identificar' | 'catalogo-nao-encontrada' | 'catalogo-formulario' | 'catalogo-modelos' | 'catalogo-procura' | 'catalogo-sem-favoritas' | 'catalogo-falha' | 'catalogo-lista-modelos' | 'catalogo-veiculos' | 'catalogo-referencias' | 'catalogo-universal' | 'catalogo-detalhes' | 'catalogo-sem-veiculos' | 'catalogo-sem-referencias'
  | 'catalogo-identificado' | 'catalogo-a-pedir' | 'catalogo-carrinho-falhou' | 'catalogo-precos' | 'catalogo-offline' | 'catalogo-grupos-carga'
  | 'catalogo-ficha-carga' | 'catalogo-ficha-indisponivel' | 'catalogo-ficha-sem-stock' | 'catalogo-ficha-stock-carga' | 'catalogo-ficha-stock-erro' | 'catalogo-ficha-qtd' | 'catalogo-ficha-a-adicionar' | 'catalogo-ficha-adicionada' | 'catalogo-ficha-nao-adicionada' | 'catalogo-ficha-sem-equivalencias' | 'catalogo-ficha-sem-oe' | 'catalogo-ficha-sem-veiculos' | 'catalogo-ficha-sem-caracteristicas' | 'catalogo-ficha-sem-documentos' | 'catalogo-ficha-documento-carga' | 'catalogo-ficha-documento-erro' | 'catalogo-ficha-sessao' | 'catalogo-ficha-sem-permissao' | 'catalogo-ficha-offline';

/* ---------- ícones (Lucide, como no resto da v2.2) ---------- */
const I = (d: string, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  denovo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  semrede: '<path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><path d="m2 2 20 20"/>',
  aviso: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  lupa: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  caixa: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>',
  carro: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  estrela: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  grelha: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  telefone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
};
const BOTAO = (texto: string, icone: string, tipo = 'btn--acao', extra = '') => `<button type="button" class="btn ${tipo}"${extra}>${I(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
/* (14 out. 2026) o carregamento é sempre o rolamento (ela: «carregar deve ser com um rolamento»; o briefing do
   catálogo: uma só linguagem mecânica) — o anel exterior parado e o conjunto de dentro a rodar */
let nGir = 0;
const GIRADOR = (cls = '') => rolamentoSvg(`est-${++nGir}`, 'pesquisar', `girador-rs${cls ? ' ' + cls : ''}`);
/* a barra fina indeterminada dá lugar a uma linha laranja fina que corre (sem percentagem inventada) */
const E = (largura: number | string, cls = '') => `<span class="esq${cls ? ' ' + cls : ''}" style="width:${typeof largura === 'number' ? largura + '%' : largura}"></span>`;
const APOIO = `<p class="est-apoio">${I(IC.telefone)}<span>Apoio Romafe · <strong>+351 226 158 300</strong></span></p>`;

/* ---------- mexer no HTML de um ecrã pelo DOM ---------- */
function mudar(html: string, prefixo: string, f: (raiz: HTMLElement) => void): string {
  const t = document.createElement('template');
  /* ids próprios em cada estado: o mesmo id em dois ecrãs liga o rótulo ao campo errado */
  t.innerHTML = html.replace(/\b(v22|cat2|cat3|cat4|cat5|ped2|ped3|ped4|gui2|gui3|fat)-/g, `${prefixo}-`);
  const raiz = t.content.firstElementChild as HTMLElement;
  f(raiz);
  return raiz.outerHTML;
}
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));

/** O botão principal de um cartão em «a carregar». */
function aCarregar(b: HTMLElement, texto: string): void {
  b.classList.add('is-a-carregar');
  b.setAttribute('disabled', '');
  b.innerHTML = `${GIRADOR('girador--claro')}<span class="btn__rotulo">${texto}</span>`;
}
/* (14 out.) os estados do catálogo com o desenho do v6: liso, o contexto do veículo, a risca laranja */
const catalogo = (html: string, extra = '') => portal('catalogo', html.replace('portal--noite', `portal--noite portal--ini3 portal--cat6 portal--estado ${extra}`).replace('<main class="cat2', '<main class="cat6 cat2'), undefined, { menu: true, rodape: false });
/** Os estados do catálogo são parados: sem data-catalogo, o comportamento não lhes mexe. */
const parado = (r: HTMLElement) => {
  $$(r, '[data-catalogo]').forEach((x) => x.removeAttribute('data-catalogo'));
  /* o separador ativo é «Favoritas»: só elas à vista, como o comportamento faria */
  $$(r, '.cat2__marca:not([data-favorita])').forEach((m) => m.setAttribute('hidden', ''));
};

/* ================= 11 · Catálogo ================= */

/* 11.1 · esqueleto */
function catalogoCarga(): string {
  return catalogo(mudar(catalogoV2, 'e111', (r) => {
    parado(r);
    $(r, '.cat2').setAttribute('aria-busy', 'true');
    $(r, '.cat2__campos').innerHTML = Array.from({ length: 5 }, (_, i) => `<div class="est-campo${i === 4 ? ' cat2__largo' : ''}">${E(35, 'esq--escuro esq--rotulo')}${E('100%', 'esq--escuro esq--campo')}</div>`).join('') + E('100%', 'esq--escuro esq--campo');
    $(r, '.cat2__grelha').innerHTML = Array.from({ length: 16 }, () => `<li class="est-marca">${E('44px', 'est-redondo')}${E('70%', 'esq--texto')}</li>`).join('');
    $(r, '.cat2__marcas-cabeca').insertAdjacentHTML('afterend', '<p class="sr-only" role="status">A carregar as marcas</p>');
  }));
}

/* 11.2 · a identificar o veículo pela matrícula */
const catalogoIdentificar = () => catalogo(mudar(catalogoV2, 'e112', (r) => {
  parado(r);
  $<HTMLInputElement>(r, '#e112-matricula').setAttribute('value', '12-AB-34');
  aCarregar($(r, '.cat2__pesquisar'), 'A identificar…');
  $(r, '.cat2__campos').insertAdjacentHTML('afterend', `<div class="est-progresso"><div class="progresso progresso--indeterminado progresso--fino" aria-hidden="true"><span></span></div><p role="status">A procurar o veículo com a matrícula 12-AB-34…</p></div>`);
}));

/* 11.3 · matrícula sem veículo */
const catalogoNaoEncontrada = () => catalogo(mudar(catalogoV2, 'e113', (r) => {
  parado(r);
  $<HTMLInputElement>(r, '#e113-matricula').setAttribute('value', '99-ZZ-99');
  $(r, '.cat2__campos').insertAdjacentHTML('afterend', `<div class="est-aviso" role="alert">${I(IC.carro)}<div><p class="est-aviso__titulo">Não encontrámos nenhum veículo com a matrícula 99-ZZ-99</p>
      <p>Pode ser recente ou importado. Experimente o n.º de chassis (está no documento único), ou escolha a marca e o modelo em baixo.</p>
      <div class="est-aviso__botoes">${BOTAO('Usar o n.º de chassis', IC.lupa, 'btn--claro btn--sm')}</div></div></div>`);
}));

/* 11.4 · erros no formulário */
const catalogoFormulario = () => catalogo(mudar(catalogoV2, 'e114', (r) => {
  parado(r);
  const erro = (id: string, valor: string, msg: string) => {
    const i = $<HTMLInputElement>(r, `#${id}`);
    i.setAttribute('value', valor); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${id}-msg`);
    i.closest('.campo')!.classList.add('campo--erro');
    i.closest('.campo')!.insertAdjacentHTML('beforeend', `<p class="campo__erro" id="${id}-msg">${I(IC.aviso)}${msg}</p>`);
  };
  erro('e114-matricula', 'AA-0-BB', 'A matrícula tem 6 letras ou números: AA-00-BB.');
  erro('e114-chassis', 'VF1RFB00X5', 'O n.º de chassis tem 17 caracteres. Este tem 10.');
}));

/* 11.5 · a carregar os modelos da marca escolhida */
/* (14 out.) os modelos em cartões, a chegar: a mesma grelha em esqueleto, com a proporção da imagem guardada */
const catalogoModelos = () => catalogo(mudar(catalogoV5, 'e115', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  main.dataset.marca = 'BMW';
  encherModelos(main, 'BMW');
  mostrar(main, 'modelos');
  fluxo(main, 'modelos');
  const vista = $(r, '.cat3__vista[data-so="modelos"]');
  vista.classList.add('cat6__a-carregar'); vista.setAttribute('aria-busy', 'true');
  $$(vista, 'tbody .cat3__linha').slice(8).forEach((l) => l.remove());
  $(vista, '.cat3__conta').innerHTML = `${GIRADOR('girador--pequeno')} A carregar os modelos BMW…`;
}));

/* 11.6 · a procura de marca não encontra nada */
const catalogoProcura = () => catalogo(mudar(catalogoV2, 'e116', (r) => {
  parado(r);
  $(r, '.cat2__procura input').setAttribute('value', 'Lamborgini');
  $(r, '.cat2__grelha').setAttribute('hidden', '');
  const v = $(r, '.cat2__vazio');
  v.removeAttribute('hidden');
  v.className = 'est-vazio est-vazio--largo';
  v.innerHTML = `${I(IC.lupa)}<p><strong>Nenhuma marca com «Lamborgini».</strong> Será <strong>Lamborghini</strong>? Esta marca ainda não está no catálogo: pesquise a peça pela referência, ou ligue para o apoio.</p>${BOTAO('Limpar a procura', IC.denovo, 'btn--ghost btn--sm')}`;
}));

/* 11.7 · ainda sem favoritas */
const catalogoSemFavoritas = () => catalogo(mudar(catalogoV2, 'e117', (r) => {
  parado(r);
  $(r, '.cat2__grelha').setAttribute('hidden', '');
  const v = $(r, '.cat2__vazio');
  v.removeAttribute('hidden');
  v.className = 'est-vazio est-vazio--largo';
  v.innerHTML = `${I(IC.estrela)}<p><strong>Ainda não tem marcas favoritas.</strong> Em «Todas», toque na estrela das marcas com que mais trabalha: ficam aqui, à mão.</p>${BOTAO('Ver todas as marcas', IC.grelha, 'btn--ghost btn--sm')}`;
}));

/* 11.8 · as marcas não carregaram */
const catalogoFalha = () => catalogo(mudar(catalogoV2, 'e118', (r) => {
  parado(r);
  $(r, '.cat2__grelha').outerHTML = `<div class="cg-falha est-falha est-falha--largo">${I(IC.aviso)}<div><p class="cg-falha__titulo">Não foi possível carregar as marcas</p><p class="cg-falha__texto">A pesquisa por matrícula, chassis ou motor continua a funcionar em cima. Referência do erro: <code>GP-20261012-B7D2</code></p>${APOIO}</div>${BOTAO('Tentar de novo', IC.denovo, 'btn--ghost btn--sm')}</div>`;
}));

/* 11.9 · v3: os modelos da BMW, como no GO REPAIR */
const catalogoListaModelos = () => catalogo(mudar(catalogoV5, 'e119', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  main.dataset.marca = 'BMW';
  encherModelos(main, 'BMW');
  mostrar(main, 'modelos');
  fluxo(main, 'modelos');
}));

/* 11.10 · v3: os veículos do Renault Scénic II, com o 1.5 dCi de 78 kW escolhido */
const catalogoVeiculos = () => catalogo(mudar(catalogoV3, 'e1110', (r) => {
  parado(r);
  const main = $(r, '.cat3');
  main.dataset.marca = 'Renault';
  encherModelos(main, 'Renault');
  encherVeiculos(main, 'Renault', 'Scénic II (JM0/1_)');
  mostrar(main, 'veiculos');
  passos(r, 2, 3);
  $$(r, '.cat3__vista[data-so="veiculos"] .cat3__linha').find((l) => l.dataset.kw === '78')?.setAttribute('aria-selected', 'true');
}));

/* 11.11 · v5: as referências do BMW 1 (E81) 118d, de todos os fabricantes, e duas marcadas para comparar */
const catalogoReferencias = () => catalogo(mudar(catalogoV5, 'e1111', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  Object.assign(main.dataset, { marca: 'BMW', modelo: '1 (E81)', versao: '118d' });
  abrirReferencias(main, '', [], 'veiculo');
  mostrar(main, 'referencias');
  fluxo(main, 'referencias');
  const logo = $(r, '.cat2__marca[data-nome="BMW"] .cat2__logo');
  $(r, '.cat5__logo').innerHTML = logo.outerHTML;
  $(r, '.cat5__m-marca').textContent = 'BMW';
  $(r, '.cat5__m-modelo').textContent = '1 (E81)';
  /* duas marcadas: o «Comparar (2)» fica ativo */
  $$<HTMLInputElement>(r, '.cat5__refs tbody input[data-comparar]').slice(0, 2).forEach((c) => marcarComparar(main, c.dataset.comparar || '', true));
  /* o estado é HTML: as caixas marcadas ficam escritas no atributo */
  $$<HTMLInputElement>(r, 'input[data-comparar]').forEach((c) => { if (c.checked) c.setAttribute('checked', ''); });
}));

/* ---------- (14 out., o briefing do catálogo) os estados que faltavam, na linguagem do rolamento ---------- */
/** As referências do BMW 1 (E81) 118d, prontas a mudar (a base dos estados 11.17–11.20). */
const refsBase = (prefixo: string, f: (r: HTMLElement) => void) => catalogo(mudar(catalogoV5, prefixo, (r) => {
  parado(r);
  const main = $(r, '.cat5');
  Object.assign(main.dataset, { marca: 'BMW', modelo: '1 (E81)', versao: '118d' });
  abrirReferencias(main, '', [], 'veiculo');
  mostrar(main, 'referencias');
  fluxo(main, 'referencias');
  f(r);
}));
const faixa = (tipo: 'erro' | 'aviso', icone: string, titulo: string, texto: string, botao = '') =>
  `<div class="cat6__faixa cat6__faixa--${tipo}" role="${tipo === 'erro' ? 'alert' : 'status'}">${icone}<div><b>${titulo}</b><span>${texto}</span></div>${botao}</div>`;

/* 11.16 · veículo identificado: o veículo encaixa na barra do contexto e o catálogo passa aos Veículos */
const catalogoIdentificado = () => catalogo(mudar(catalogoV3, 'e1119', (r) => {
  parado(r);
  const main = $(r, '.cat3');
  Object.assign(main.dataset, { marca: 'Renault', identificado: '12-AB-34' });
  encherModelos(main, 'Renault');
  encherVeiculos(main, 'Renault', 'Scénic II (JM0/1_)');
  mostrar(main, 'veiculos');
  passos(r, 2, 3);
  $$(r, '.cat3__vista[data-so="veiculos"] .cat3__linha').find((l) => l.dataset.kw === '78')?.setAttribute('aria-selected', 'true');
}));

/* 11.17 · a adicionar ao carrinho: o rolamento no botão, à espera da confirmação */
const catalogoAPedir = () => refsBase('e1120', (r) => {
  const b = $(r, '.cat5__adicionar');
  b.setAttribute('aria-busy', 'true'); b.setAttribute('disabled', '');
  b.innerHTML = `${GIRADOR('girador--claro')}<span class="btn__rotulo">A adicionar…</span>`;
});

/* 11.18 · o carrinho não aceitou: nada se finge — o botão diz que não, a faixa explica e deixa tentar de novo */
const catalogoCarrinhoFalhou = () => refsBase('e1121', (r) => {
  const b = $(r, '.cat5__adicionar');
  b.classList.add('cat6__nao');
  b.innerHTML = `${I(IC.aviso)}<span class="btn__rotulo">Não adicionado</span>`;
  $(r, '.cat5__refs').insertAdjacentHTML('afterbegin', faixa('erro', rolamentoSvg('e1121-rs', 'erro', 'cat6__rs-faixa'), 'O carrinho não aceitou a VKBA 6556.', 'Nada foi adicionado; a quantidade escolhida continua na linha.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});

/* 11.19 · os preços não chegaram: o resto (referências, stock) continua certo; «Pedir» espera pelo preço */
const catalogoPrecos = () => refsBase('e1122', (r) => {
  $$(r, '.cat5__ref').forEach((l) => {
    const c = l.querySelectorAll('td');
    [4, 5, 6].forEach((i) => { if (c[i]) c[i].innerHTML = '<span class="cat6__sem-preco" aria-label="Preço indisponível">—</span>'; });
    l.querySelector('.cat5__adicionar')?.setAttribute('disabled', '');
  });
  $(r, '.cat5__refs').insertAdjacentHTML('afterbegin', faixa('aviso', `<span class="cat6__faixa-icone">${I(IC.aviso)}</span>`, 'Os preços estão indisponíveis de momento.', 'As referências e o stock estão certos; os preços voltam assim que o serviço responder.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});

/* 11.20 · sem ligação: o rolamento abranda até parar; as referências de há pouco ficam à vista, esbatidas */
const catalogoOffline = () => refsBase('e1123', (r) => {
  $(r, '.cat5__refs').classList.add('cat6__guardado');
  $$(r, '.cat5__adicionar').forEach((b) => b.setAttribute('disabled', ''));
  $(r, '.cat5__refs').insertAdjacentHTML('beforebegin', faixa('aviso', rolamentoSvg('e1123-rs', 'offline', 'cat6__rs-faixa'), 'Estás sem ligação à Internet.', 'Vês as referências de há pouco (podem já não estar certas); pedir volta quando a ligação voltar.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});

/* 11.24 · os grupos de montagem a chegar: só o painel da esquerda espera (as linhas em esqueleto e o rolamento) */
const catalogoGruposCarga = () => catalogo(mudar(catalogoV5, 'e1124', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  mostrar(main, 'universal');
  fluxo(main, 'universal');
  const arv = $(r, '.cat5__arvore');
  arv.setAttribute('aria-busy', 'true');
  arv.innerHTML = `<li class="cat6__arv-carga" role="status">${GIRADOR('girador--pequeno')} A carregar os grupos de montagem…</li>` + Array.from({ length: 9 }, (_, i) => `<li class="cat6__arv-esq" aria-hidden="true" style="--w:${55 + (i * 17) % 35}%"><i></i><i></i></li>`).join('');
}));

/* 11.12 · v5: o Universal, com «Comando da correia» aberto e o Kit de distribuição escolhido */
const catalogoUniversal = () => catalogo(mudar(catalogoV5, 'e1112', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  mostrar(main, 'universal');
  fluxo(main, 'universal');
  const b = $$(r, '.cat5__abrir-ramo').find((x) => (x.textContent || '').includes('Comando da correia'))!;
  ramo(b, true);
  escolherGrupo(main, 'Kit de distribuição');
}));

/* 11.13 · v5: o detalhe do SKF VKBA 6556 vindo do BMW 1 (E81) 118d */
const catalogoDetalhes = () => catalogo(mudar(catalogoV5, 'e1113', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  Object.assign(main.dataset, { marca: 'BMW', modelo: '1 (E81)', versao: '118d' });
  abrirReferencias(main, '', [], 'veiculo');
  abrirDetalhes(main, 'SKF', 'VKBA 6556');
  mostrar(main, 'detalhes');
  fluxo(main, 'detalhes');
  $(r, '.cat5__logo').innerHTML = $(r, '.cat2__marca[data-nome="BMW"] .cat2__logo').outerHTML;
  $(r, '.cat5__m-marca').textContent = 'BMW';
  $(r, '.cat5__m-modelo').textContent = '1 (E81)';
}));

/* 11.14 · sem dados: os filtros dos veículos não deixam nenhum (13 out.: «exemplos com e sem dados para todos os ecrãs») */
const catalogoSemVeiculos = () => catalogo(mudar(catalogoV3, 'e1117', (r) => {
  parado(r);
  const main = $(r, '.cat3');
  main.dataset.marca = 'Renault';
  encherModelos(main, 'Renault');
  encherVeiculos(main, 'Renault', 'Scénic II (JM0/1_)');
  mostrar(main, 'veiculos');
  passos(r, 2);
  const corpo = $(r, '.cat3__vista[data-so="veiculos"] tbody');
  corpo.innerHTML = '';
  /* o filtro escrito e as contagens a zero, para o ecrã dizer o mesmo que a frase */
  $$<HTMLInputElement>(r, '.cat3__vista[data-so="veiculos"] input[type="text"], .cat3__cartao input[placeholder*="1.5 dCi"]').slice(0, 1).forEach((i) => i.setAttribute('value', '2.0 16V Turbo'));
  const conta = $(r, '.cat3__vista[data-so="veiculos"] .cat3__conta strong'); conta.textContent = '0';
  corpo.closest('table')!.insertAdjacentHTML('afterend', `<div class="est-vazio est-vazio--largo est-vazio--tabela">${I(IC.lupa)}<p><strong>Nenhum Scénic II «2.0 16V Turbo».</strong> Experimente só «2.0» ou limpe o filtro para ver as quatro versões.</p><div class="est-aviso__botoes">${BOTAO('Limpar os filtros', IC.denovo, 'btn--ghost btn--sm')}${BOTAO('Ver todos os Scénic II', IC.grelha, 'btn--acao btn--sm')}</div></div>`);
}));

/* 11.15 · sem dados: o grupo escolhido não tem referências para este veículo */
const catalogoSemReferencias = () => catalogo(mudar(catalogoV5, 'e1118', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  Object.assign(main.dataset, { marca: 'BMW', modelo: '1 (E81)', versao: '118d' });
  abrirReferencias(main, '', [], 'veiculo');
  mostrar(main, 'referencias');
  fluxo(main, 'referencias');
  $(r, '.cat5__logo').innerHTML = $(r, '.cat2__marca[data-nome="BMW"] .cat2__logo').outerHTML;
  $(r, '.cat5__m-marca').textContent = 'BMW';
  $(r, '.cat5__m-modelo').textContent = '1 (E81)';
  const corpo = $(r, '.cat5__refs tbody');
  corpo.innerHTML = '';
  $(r, '.cat5__refs-conta').innerHTML = '<strong>0</strong> referências · Bomba de água';
  corpo.closest('table')!.insertAdjacentHTML('afterend', `<div class="est-vazio est-vazio--largo est-vazio--tabela">${I(IC.caixa)}<p><strong>Ainda não há referências de «Bomba de água» para o BMW 1 (E81) 118d.</strong> A Romafe pode procurá-la ao fabricante: diga a matrícula e ligamos com o preço e o prazo.</p><div class="est-aviso__botoes">${BOTAO('Ver o grupo Universal', IC.grelha, 'btn--ghost btn--sm')}${BOTAO('Pedir à Romafe', IC.denovo, 'btn--acao btn--sm')}</div></div>`);
}));


/* ================= 11.25–11.43 · a ficha da peça (15 out.: o briefing «Product Details V4», ponto 12) =================
   Todos partem do 11.13 (o SKF VKMC 01250-2 do BMW 1 (E81) 116i) e mudam só o que o estado muda. Cada separador
   vazio diz porquê e dá uma saída; os erros não fingem nada (o carrinho só confirma depois do servidor). */
const fichaBase = (prefixo: string, f: (r: HTMLElement, main: HTMLElement) => void) => catalogo(mudar(catalogoV5, prefixo, (r) => {
  parado(r);
  const main = $(r, '.cat5');
  Object.assign(main.dataset, { marca: 'BMW', modelo: '1 (E81)', versao: '116i' });
  abrirReferencias(main, '', [], 'veiculo');
  abrirDetalhes(main, 'SKF', 'VKMC 01250-2');
  mostrar(main, 'detalhes');
  fluxo(main, 'detalhes');
  $(r, '.cat5__logo').innerHTML = $(r, '.cat2__marca[data-nome="BMW"] .cat2__logo').outerHTML;
  f(r, main);
}));
/** O separador aberto num estado. */
const abaEstado = (r: HTMLElement, k: string) => {
  $$(r, '.cat5__aba').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === k)));
  $$(r, '.cat5__aba-corpo').forEach((c) => { if (c.dataset.corpo === k) c.removeAttribute('hidden'); else c.setAttribute('hidden', ''); });
};
const vazioAba = (r: HTMLElement, k: string, icone: string, titulo: string, texto: string, botoes = '') => {
  abaEstado(r, k);
  $(r, `[data-corpo="${k}"]`).innerHTML = `<div class="est-vazio est-vazio--largo cat6__aba-vazia">${I(icone)}<p><strong>${titulo}</strong> ${texto}</p>${botoes ? `<div class="est-aviso__botoes">${botoes}</div>` : ''}</div>`;
  const n = $(r, `.cat5__aba[data-aba="${k}"] .cat5__aba-n`); if (n) n.textContent = '';
};
const compra = (r: HTMLElement) => $(r, '.cat5__peca-compra');
const IC_DOC = '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>';
const IC_CADEADO = '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';

/* 11.25 · a ficha a carregar: o esqueleto tem a forma da ficha (imagem, identidade, compra, separadores) */
const fichaCarga = () => fichaBase('e1125', (r) => {
  $(r, '.cat5__peca-info').innerHTML = `<div class="est-pilha">${E('30%')}${E('55%', 'esq--titulo')}${E('70%')}${E('90%')}${E('80%')}</div>`;
  compra(r).innerHTML = `<div class="est-pilha">${E('40%')}${E('60%', 'esq--titulo')}${E('50%')}${E('100%', 'esq--botao')}${E('100%', 'esq--botao')}</div>`;
  $(r, '[data-corpo="stock"]').innerHTML = `<p class="cat6__carga-aba">${GIRADOR()}<span>A carregar a ficha da VKMC 01250-2…</span></p>${[90, 75].map((w) => `<div class="est-linha">${E(w)}</div>`).join('')}`;
  $$(r, '.cat5__aba-n').forEach((n) => { n.textContent = ''; });
});
/* 11.26 · a referência deixou de ser fornecida: diz-se logo, e a saída são as equivalências */
const fichaIndisponivel = () => fichaBase('e1126', (r) => {
  compra(r).querySelectorAll('button').forEach((b) => b.setAttribute('disabled', ''));
  $(r, '.cat5__peca-info').insertAdjacentHTML('afterbegin', faixa('aviso', `<span class="cat6__faixa-icone">${I(IC.aviso)}</span>`, 'Esta referência deixou de ser fornecida pelo fabricante.', 'Não se pode pedir; as equivalências mostram o que a substitui.', BOTAO('Ver equivalências', IC.grelha, 'btn--claro btn--sm')));
});
/* 11.27 · sem stock nos dois armazéns: não se inventa prazo */
const fichaSemStock = () => fichaBase('e1127', (r) => {
  $$(r, '[data-corpo="stock"] tbody tr').forEach((tr) => { const c = tr.querySelectorAll('td'); c[1].innerHTML = '<span class="cat5__stock cat5__stock--sem">Sem stock</span>'; c[2].textContent = 'Por encomenda · prazo a confirmar'; });
  $(r, '.cat5__peca-stock').innerHTML = '<span class="cat5__stock cat5__stock--sem">Sem stock</span><span>Porto 0 · Sacavém 0</span>';
  compra(r).querySelector('.cat5__adicionar')!.setAttribute('disabled', '');
  $(r, '[data-corpo="stock"]').insertAdjacentHTML('afterbegin', faixa('aviso', `<span class="cat6__faixa-icone">${I(IC.caixa)}</span>`, 'Sem stock no Porto nem em Sacavém.', 'A Romafe confirma o prazo com o fabricante pelo telefone; as equivalências podem ter stock.', BOTAO('Ver equivalências', IC.grelha, 'btn--claro btn--sm')));
});
/* 11.28 · só o stock espera: as linhas em esqueleto, o resto da ficha já está */
const fichaStockCarga = () => fichaBase('e1128', (r) => {
  $(r, '[data-corpo="stock"] tbody').innerHTML = [0, 1].map(() => `<tr><td>${E('60%')}</td><td>${E('40%')}</td><td>${E('70%')}</td><td></td></tr>`).join('');
  $(r, '[data-corpo="stock"]').insertAdjacentHTML('afterbegin', `<p class="cat6__carga-aba">${GIRADOR()}<span>A confirmar o stock no Porto e em Sacavém…</span></p>`);
  $(r, '.cat5__peca-stock').innerHTML = `${E('120px')}`;
});
/* 11.29 · o stock não chegou: o preço continua; pedir espera pelo stock */
const fichaStockErro = () => fichaBase('e1129', (r) => {
  $(r, '[data-corpo="stock"] .cg-tabela').remove();
  $(r, '.cat5__peca-stock').innerHTML = '<span>Stock por confirmar</span>';
  compra(r).querySelector('.cat5__adicionar')!.setAttribute('disabled', '');
  $(r, '[data-corpo="stock"]').insertAdjacentHTML('afterbegin', faixa('erro', rolamentoSvg('e1129-rs', 'erro', 'cat6__rs-faixa'), 'Não foi possível confirmar o stock.', 'O preço está certo; o pedido fica à espera do stock.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});
/* 11.30 · quantidade inválida: diz o que está mal e o que se pode pedir */
const fichaQtd = () => fichaBase('e1130', (r) => {
  const i = compra(r).querySelector<HTMLInputElement>('.cat5__qtd-n')!;
  i.setAttribute('value', '0'); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', 'e1130-erro');
  compra(r).querySelector('.cat5__adicionar')!.setAttribute('disabled', '');
  compra(r).querySelector('.cat5__peca-pedir')!.insertAdjacentHTML('afterend', `<p class="cat6__qtd-erro" id="e1130-erro" role="alert">${I(IC.aviso)}A quantidade tem de ser pelo menos 1 (há 7 un. nos dois armazéns).</p>`);
});
/* 11.31 · a adicionar: o rolamento no botão; nada voa antes da confirmação */
const fichaAAdicionar = () => fichaBase('e1131', (r) => {
  const b = compra(r).querySelector<HTMLElement>('.cat5__adicionar')!;
  b.setAttribute('aria-busy', 'true'); b.setAttribute('disabled', '');
  b.innerHTML = `${GIRADOR('girador--claro')}<span class="btn__rotulo">A adicionar…</span>`;
});
/* 11.32 · adicionada: a confirmação depois do servidor, com «Ver carrinho» */
const fichaAdicionada = () => fichaBase('e1132', (r) => {
  const b = compra(r).querySelector<HTMLElement>('.cat5__adicionar')!;
  b.classList.add('is-feito'); b.innerHTML = `${I('<path d="M20 6 9 17l-5-5"/>', 'btn__icone')}<span class="btn__rotulo">Adicionado</span>`;
  compra(r).insertAdjacentHTML('beforeend', `<p class="cat6__toast" role="status"><span>${I('<path d="M20 6 9 17l-5-5"/>')}1 unidade adicionada ao carrinho. <button type="button" class="cat3__ligacao" disabled title="Ainda sem ecrã">Ver carrinho</button></span></p>`);
});
/* 11.33 · o carrinho não aceitou: nada se finge */
const fichaNaoAdicionada = () => fichaBase('e1133', (r) => {
  const b = compra(r).querySelector<HTMLElement>('.cat5__adicionar')!;
  b.classList.add('cat6__nao'); b.innerHTML = `${I(IC.aviso, 'btn__icone')}<span class="btn__rotulo">Não adicionado</span>`;
  compra(r).insertAdjacentHTML('beforeend', faixa('erro', rolamentoSvg('e1133-rs', 'erro', 'cat6__rs-faixa'), 'O carrinho não aceitou a VKMC 01250-2.', 'Nada foi adicionado; a quantidade continua escolhida.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});
/* 11.34–11.38 · os separadores sem dados */
const fichaSemEquivalencias = () => fichaBase('e1134', (r) => vazioAba(r, 'equivalencias', IC.lupa, 'Não conhecemos equivalências para a VKMC 01250-2.', 'Os outros fabricantes deste grupo podem servir; confirme pelos números OE.', BOTAO('Ver os números OE', IC.grelha, 'btn--ghost btn--sm')));
const fichaSemOe = () => fichaBase('e1135', (r) => vazioAba(r, 'oe', IC.lupa, 'Esta referência não tem números de origem registados.', 'O fabricante não os indicou; a aplicação nos veículos continua confirmada.'));
const fichaSemVeiculos = () => fichaBase('e1136', (r) => vazioAba(r, 'veiculos', IC.carro, 'Não há veículos confirmados para esta referência.', 'Sem confirmação do fabricante, não a damos como compatível com nenhum veículo.', BOTAO('Falar com a Romafe', IC.telefone, 'btn--ghost btn--sm')));
const fichaSemCaracteristicas = () => fichaBase('e1137', (r) => vazioAba(r, 'caracteristicas', IC_DOC, 'O fabricante ainda não enviou as características.', 'As medidas aparecem aqui quando chegarem; a ficha técnica pode tê-las.', BOTAO('Ver documentos', IC_DOC, 'btn--ghost btn--sm')));
const fichaSemDocumentos = () => fichaBase('e1138', (r) => vazioAba(r, 'documentos', IC_DOC, 'Sem documentos para esta referência.', 'O fabricante não publicou instruções nem ficha técnica.'));
/* 11.39 · um documento a preparar: só o seu botão espera */
const fichaDocumentoCarga = () => fichaBase('e1139', (r) => {
  abaEstado(r, 'documentos');
  const b = $$(r, '[data-corpo="documentos"] li button')[1];
  b.setAttribute('aria-busy', 'true'); b.innerHTML = `${GIRADOR()}<span class="btn__rotulo">A preparar…</span>`;
});
/* 11.40 · o documento não descarregou */
const fichaDocumentoErro = () => fichaBase('e1140', (r) => {
  abaEstado(r, 'documentos');
  $(r, '[data-corpo="documentos"]').insertAdjacentHTML('afterbegin', faixa('erro', rolamentoSvg('e1140-rs', 'erro', 'cat6__rs-faixa'), 'Não foi possível descarregar a «Ficha técnica».', 'O ficheiro não respondeu; os outros documentos continuam disponíveis.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});
/* 11.41 · a sessão terminou: a ficha fica onde está, comprar pede para entrar outra vez */
const fichaSessao = () => fichaBase('e1141', (r) => {
  compra(r).querySelectorAll('button').forEach((b) => b.setAttribute('disabled', ''));
  $(r, '.cat5__peca').insertAdjacentHTML('beforebegin', `<div class="cat6__faixa-largo">${faixa('aviso', `<span class="cat6__faixa-icone">${I(IC_CADEADO)}</span>`, 'A sua sessão terminou.', 'Entre outra vez para pedir; a ficha e a quantidade ficam como estão.', BOTAO('Entrar', IC_CADEADO, 'btn--acao btn--sm', ' data-ir="entrada"'))}</div>`);
});
/* 11.42 · sem permissão: esta conta não vê preços nem compra */
const fichaSemPermissao = () => fichaBase('e1142', (r) => {
  const c = compra(r);
  c.innerHTML = `<p class="cat6__sem-perm">${I(IC_CADEADO)}<span><b>A sua conta não tem acesso a preços nem a compras.</b> Peça ao administrador da conta da oficina; a ficha técnica continua aberta.</span></p>`;
});
/* 11.43 · sem ligação: a ficha de há pouco, esbatida; pedir volta com a ligação */
const fichaOffline = () => fichaBase('e1143', (r) => {
  $(r, '.cat5__peca').classList.add('cat6__guardado');
  compra(r).querySelectorAll('button').forEach((b) => b.setAttribute('disabled', ''));
  $(r, '.cat5__detalhes').insertAdjacentHTML('afterbegin', faixa('aviso', rolamentoSvg('e1143-rs', 'offline', 'cat6__rs-faixa'), 'Estás sem ligação à Internet.', 'Vês a ficha de há pouco (o stock pode já não estar certo); pedir volta quando a ligação voltar.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});

/* ================= 12 · Pedidos ================= */
const pedidos = (html: string) => portal('pedidos', html.replace('portal--noite', 'portal--noite portal--estado'), undefined, { menu: true, rodape: false });

/* 15 out. 2026: os estados dos Pedidos v4 (o briefing dela, ponto 11), a partir do mesmo desenho (pedidos-v4.ts).
   Cada um muda só o que esse estado muda; os campos guardam o que se escreveu. */
const ped4 = (prefixo: string, f: (r: HTMLElement) => void, html = pedidosV4()) => pedidos(mudar(html, prefixo, f));
const IC_CADEADO_P = '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
const abertoNaLinha = (r: HTMLElement, num: string) => {
  const tr = $(r, `tr.ped4__linha[data-num="${num}"]`), det = tr.nextElementSibling as HTMLElement;
  tr.classList.add('is-aberto'); $(tr, '.ped4__abrir').setAttribute('aria-expanded', 'true');
  det.removeAttribute('hidden'); det.firstElementChild!.innerHTML = detalhePed(pedidoDe(num), linhaDe(num));
  return det;
};
/** (15 out.) a cronologia é a vista principal: o pedido aberto no seu cartão */
const abertoNaCrono = (r: HTMLElement, num: string) => {
  const li = $(r, `.ped4__c-item[data-num="${num}"]`), det = $(li, '.ped4__c-det');
  li.classList.add('is-aberto', 'is-ativo'); $(li, '.ped4__c-cabeca').setAttribute('aria-expanded', 'true');
  det.removeAttribute('hidden'); det.innerHTML = detalhePed(pedidoDe(num), linhaDe(num));
  return det;
};
const chips = (r: HTMLElement, itens: string[]) => { $(r, '.ped4__chips').innerHTML = itens.map((t) => `<li><span>${t}</span><button type="button" class="ped4__chip-x" aria-label="Tirar o filtro ${t}">${I('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')}</button></li>`).join(''); };
const valorCampo = (r: HTMLElement, id: string, v: string) => $<HTMLInputElement>(r, `#${id}`).setAttribute('value', v);
const erroPed = (r: HTMLElement, id: string, v: string, msg: string) => { const i = $<HTMLInputElement>(r, `#${id}`); i.setAttribute('value', v); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${id}-erro`); const e = $(r, `#${id}-erro`); e.textContent = msg; e.removeAttribute('hidden'); };
const ocupadoPed = (b: HTMLElement, texto: string) => { b.setAttribute('aria-busy', 'true'); b.setAttribute('disabled', ''); b.innerHTML = `${GIRADOR('ped4__rs')}<span class="btn__rotulo">${texto}</span>`; };

/* 12.1 · a carregar: os filtros já servem; os números e as linhas chegam em esqueleto com a forma da tabela */
const ped4Carga = () => ped4('e121', (r) => {
  $$(r, '[data-kpi]').forEach((d) => { d.innerHTML = E('70px'); });
  $(r, '.ped4__conta').innerHTML = `${GIRADOR('ped4__rs')} A carregar os pedidos…`;
  $(r, '.ped4__crono').innerHTML = `<span class="ped4__c-linha" aria-hidden="true"></span>` + [2, 3].map((n, k) => `<section class="ped4__mes"><h2 class="ped4__mes-t">${E(k ? '110px' : '90px', 'esq--titulo')}</h2><ol class="ped4__c-lista">${Array.from({ length: n }, (_, i) => `<li class="ped4__c-item ped4__c-esq"><span class="ped4__c-data">${E('24px')}</span><span class="ped4__c-marca"></span><article class="ped4__c-cartao"><div class="ped4__c-cabeca">${E(Math.max(30, 50 - i * 6))}${E('40%')}${E('90px')}${E('70px')}</div></article></li>`).join('')}</ol></section>`).join('');
  $$(r, '.ped4__est-n').forEach((n) => { n.textContent = '…'; });
});
/* 12.2 · a atualizar: as linhas de antes ficam à vista, esbatidas; o rolamento diz o que está a acontecer */
const ped4Filtrar = () => ped4('e122', (r) => {
  valorCampo(r, 'e122-ref', 'SKF');
  ocupadoPed($(r, '.ped4__pesquisar'), 'A pesquisar…');
  const a = $(r, '.ped4__a-atualizar'); a.removeAttribute('hidden'); a.innerHTML = `${GIRADOR('ped4__rs')}A atualizar…`;
  $(r, '.ped4__tabela').classList.add('is-a-atualizar');
});
/* 12.3 · nenhum pedido com estes filtros: diz quantos há ao todo e como sair */
const ped4Vazio = () => ped4('e123', (r) => {
  valorCampo(r, 'e123-de', '01/05/2024'); valorCampo(r, 'e123-ate', '31/05/2024');
  chips(r, ['Desde 01/05/2024', 'Até 31/05/2024']);
  $$(r, 'tr.ped4__linha').forEach((tr) => tr.setAttribute('hidden', ''));
  $(r, '.ped4__crono').setAttribute('hidden', '');
  $(r, '.ped4__conta b').textContent = '0'; $$(r, '[data-kpi]').forEach((d) => { d.textContent = d.dataset.kpi === 'n' ? '0' : eurosPed(0); });
  $$(r, '.ped4__est-n').forEach((n) => { n.textContent = '0'; });
  const v = $(r, '.ped4__vazio'); v.removeAttribute('hidden');
  v.innerHTML = `<p><strong>Nenhum pedido em maio de 2024.</strong> O último pedido é de 15/04/2024; alargue as datas ou tire um filtro (${LINHAS_PED.length} pedidos no total).</p>${BOTAO('Limpar filtros', IC.denovo, 'btn--ghost btn--sm')}`;
});
/* 12.4 · erro nos filtros: cada campo diz como deve ser; o que se escreveu fica */
const ped4Datas = () => ped4('e124', (r) => {
  erroPed(r, 'e124-de', '31/04/2024', 'Abril só tem 30 dias. Escreva a data como dd/mm/aaaa.');
  erroPed(r, 'e124-ate', '01/03/2024', 'A data final é antes da inicial.');
});
/* 12.5 · sem ligação: os pedidos de há pouco, esbatidos; pesquisar volta com a ligação */
const ped4Rede = () => ped4('e125', (r) => {
  $(r, '.ped4__tabela').classList.add('is-a-atualizar');
  $(r, '.ped4__pesquisar').setAttribute('disabled', '');
  $(r, '.ped4__lista').insertAdjacentHTML('afterbegin', faixa('aviso', rolamentoSvg('e125-rs', 'offline', 'cat6__rs-faixa'), 'Estás sem ligação à Internet.', 'Vês os pedidos de há pouco (podem já não estar certos); a pesquisa volta quando a ligação voltar.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});
/* 12.6 · erro do servidor: os filtros ficam; a tabela diz o que falhou, com a referência do erro */
const ped4Falha = () => ped4('e126', (r) => {
  valorCampo(r, 'e126-num', 'P2024/0012');
  $(r, '.ped4__crono').remove();
  $(r, '.ped4__tabela').outerHTML = `<div class="cg-falha est-falha est-falha--largo" role="alert">${rolamentoSvg('e126-rs', 'erro', 'cat6__rs-faixa')}<div><p class="cg-falha__titulo">Não foi possível carregar os pedidos.</p><p class="cg-falha__texto">O serviço de pedidos não respondeu. Os filtros ficam como estão. Referência do erro: PED-503-0415.</p><div class="est-aviso__botoes">${BOTAO('Tentar novamente', IC.denovo, 'btn--acao btn--sm')}</div>${APOIO}</div></div>`;
  $$(r, '[data-kpi]').forEach((d) => { d.textContent = '—'; });
  $(r, '.ped4__conta').textContent = 'Sem dados';
});
/* 12.7 · um pedido concluído, aberto na linha: o percurso todo feito, os artigos, a entrega, a guia e a fatura */
const ped4Aberto = () => ped4('e127', (r) => { abertoNaCrono(r, 'P2024/001256'); });
/* 12.17 · a mesma página na vista em tabela, com o pedido aberto na linha */
const ped4Tabela = () => ped4('e1217', (r) => { abertoNaLinha(r, 'P2024/001233'); }, pedidosV4({ vista: 'tabela' }));
/* 12.8 · primeira vez: ainda não há pedidos */
const ped4Primeira = () => ped4('e128', (r) => {
  $(r, '.ped4__tabela').setAttribute('hidden', ''); $(r, '.ped4__crono').setAttribute('hidden', ''); $(r, '.ped4__vistas').setAttribute('hidden', '');
  $(r, '.ped4__conta b').textContent = '0'; $$(r, '[data-kpi]').forEach((d) => { d.textContent = d.dataset.kpi === 'n' ? '0' : eurosPed(0); });
  $$(r, '.ped4__est-n').forEach((n) => { n.textContent = '0'; });
  const v = $(r, '.ped4__vazio'); v.removeAttribute('hidden');
  v.innerHTML = `<p><strong>Ainda não tem pedidos.</strong> Cada pedido feito no catálogo aparece aqui com o estado, a guia e a fatura.</p>${BOTAO('Ver o catálogo', IC.grelha, 'btn--acao btn--sm', ' data-ir="catalogo"')}`;
});
/* 12.9 · o pedido a abrir: só a linha espera, em esqueleto */
const ped4AAbrir = () => ped4('e129', (r) => {
  const det = abertoNaCrono(r, 'P2024/001233');
  det.innerHTML = `<div class="ped4__det"><section class="ped4__det-resumo"><p class="ped4__conta">${GIRADOR('ped4__rs')} A abrir o pedido P2024/001233…</p>${E('80%')}${E('60%')}</section><section class="ped4__det-percurso">${E('100%')}${E('70%')}</section><section class="ped4__det-artigos">${[90, 80, 85].map((w) => E(w)).join('')}</section><section class="ped4__det-lado">${E('70%')}${E('50%')}</section></div>`;
});
/* 12.10 · em processamento: o pedido ainda não saiu; o passo seguinte está marcado, sem data */
const ped4Processamento = () => ped4('e1210', (r) => { abertoNaCrono(r, 'P2024/001198'); });
/* 12.11 · por recolher no balcão */
const ped4Recolher = () => ped4('e1211', (r) => { abertoNaCrono(r, 'P2024/001142'); });
/* 12.12 · expedido (em parte): o camião no passo onde o pedido está; os 2 em falta seguem depois */
const ped4Expedido = () => ped4('e1212', (r) => { abertoNaCrono(r, 'P2024/001233'); });
/* 12.13 · o pedido no painel à direita; o resto da página fica inerte, como no comportamento */
const ped4Inerte = (html: string) => html.replace('<header class="portal__topo"', '<header class="portal__topo" inert aria-hidden="true"').replace('<nav class="portal__abas"', '<nav class="portal__abas" inert aria-hidden="true"');
const ped4Gaveta = () => ped4Inerte(ped4('e1213', (r) => {
  const p = pedidoDe('P2024/001233'), l = linhaDe('P2024/001233');
  $(r, '.ped4__veu').removeAttribute('hidden');
  const g = $(r, '.ped4__gaveta'); g.removeAttribute('hidden');
  g.innerHTML = `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">Pedido</p><h2 class="ped4__g-num" id="e1213-g-num">${p.num}</h2><p class="ped4__g-meta">${l.data} · ${l.armazem} · ${eurosPed(valorDe(p))}</p></div><button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)">${I('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')}</button></header>${detalhePed(p, l, 'gaveta')}`;
  g.setAttribute('aria-labelledby', 'e1213-g-num');
  $$(r, '.ped4 > header, .ped4 > section').forEach((el) => { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); });
}));
/* 12.14 · sessão terminada: a página fica; pesquisar pede para entrar outra vez */
const ped4Sessao = () => ped4('e1214', (r) => {
  $(r, '.ped4__pesquisar').setAttribute('disabled', '');
  $(r, '.ped4__filtros').insertAdjacentHTML('beforebegin', faixa('aviso', `<span class="cat6__faixa-icone">${I(IC_CADEADO_P)}</span>`, 'A sua sessão terminou.', 'Entre outra vez para atualizar os pedidos; os filtros ficam como estão.', BOTAO('Entrar', IC_CADEADO_P, 'btn--acao btn--sm', ' data-ir="entrada"')));
});
/* 12.15 · sem permissão: esta conta não vê os pedidos da oficina */
const ped4SemPermissao = () => ped4('e1215', (r) => {
  $(r, '.ped4__filtros').setAttribute('hidden', '');
  $(r, '.ped4__kpi').setAttribute('hidden', '');
  $(r, '.ped4__lista').innerHTML = `<div class="est-vazio est-vazio--largo">${I(IC_CADEADO_P)}<p><strong>A sua conta não tem acesso aos pedidos da oficina.</strong> Peça ao administrador da conta; o catálogo continua aberto.</p><div class="est-aviso__botoes">${BOTAO('Ver o catálogo', IC.grelha, 'btn--ghost btn--sm', ' data-ir="catalogo"')}</div></div>`;
});
/* 12.16 · documento indisponível: a fatura não abriu; o resto do pedido continua */
const ped4Documento = () => ped4('e1216', (r) => {
  const det = abertoNaCrono(r, 'P2024/001175');
  $(det, '.ped4__docs').insertAdjacentHTML('afterend', faixa('erro', `<span class="cat6__faixa-icone">${I(IC.aviso)}</span>`, 'A fatura FT2024/05188 não está disponível.', 'O arquivo de faturas não respondeu; a guia continua disponível.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});

/* ---------- (15 out., ela: «faz os vários estados dos ecrãs de pedidos e guias») os que faltavam ---------- */
/* 12.18 · a primeira carga: os filtros já servem; no lugar da lista, o rolamento */
const ped4Inicio = () => ped4('e1218', (r) => {
  $$(r, '[data-kpi]').forEach((d) => { d.innerHTML = E('60px'); });
  $(r, '.ped4__conta').innerHTML = 'A ligar aos pedidos da conta…';
  $(r, '.ped4__crono').outerHTML = `<div class="est-vazio est-vazio--largo" role="status">${rolamentoSvg('e1218-rs', 'carregar', 'cat6__rs-faixa')}<p><strong>A carregar os pedidos…</strong> Os pedidos desde 01/03/2024, do mais recente para o mais antigo.</p></div>`;
  $(r, '.ped4__vistas').setAttribute('hidden', '');
});
/* 12.19 · pedido selecionado: ativo (anel e borda laranja), ainda fechado */
const ped4Selecionado = () => ped4('e1219', (r) => { $(r, '.ped4__c-item[data-num="P2024/001233"]').classList.add('is-ativo', 'is-passado'); });
/* 12.20 · encontrado pela referência: só os pedidos com a peça, a peça destacada em cada um */
const ped4Encontrado = () => ped4('e1220', (r) => {
  valorCampo(r, 'e1220-ref', 'VKBA');
  chips(r, ['Referência «VKBA»']);
  const com = ['P2024/001233', 'P2024/001120'];
  $$(r, '.ped4__c-item').forEach((li) => {
    const num = li.dataset.num!;
    if (!com.includes(num)) { li.setAttribute('hidden', ''); return; }
    const art = pedidoDe(num).artigos.find((a) => a[2].includes('VKBA'))!;
    const enc = $(li, '.ped4__c-encontrado'); enc.removeAttribute('hidden'); enc.innerHTML = `Contém ${art[2].replace('VKBA', '<mark>VKBA</mark>')}`;
  });
  $$(r, '.ped4__mes').forEach((m) => { const n = $$(m, '.ped4__c-item:not([hidden])').length; if (!n) m.setAttribute('hidden', ''); else $(m, '.ped4__mes-t small').innerHTML = `<b>${n}</b> ${n === 1 ? 'pedido' : 'pedidos'}`; });
  $$(r, 'tr.ped4__linha').forEach((tr) => { if (!com.includes(tr.dataset.num!)) tr.setAttribute('hidden', ''); });
  $(r, '.ped4__conta b').textContent = '2';
  $(r, '[data-kpi="n"]').textContent = '2'; $(r, '[data-kpi="total"]').textContent = eurosPed(com.reduce((t, n) => t + valorDe(pedidoDe(n)), 0));
});
/* 12.21 · repetir o pedido: só o botão espera, com o rolamento */
const ped4Repetir = () => ped4('e1221', (r) => {
  const det = abertoNaCrono(r, 'P2024/001256');
  ocupadoPed($(det, '[data-repetir]'), 'A adicionar…');
});
/* 12.22 · repetido: os artigos no carrinho, com o caminho para lá */
const ped4Repetido = () => ped4('e1222', (r) => {
  const det = abertoNaCrono(r, 'P2024/001256');
  const b = $(det, '[data-repetir]'); b.classList.add('is-feito'); b.innerHTML = `${I('<path d="M20 6 9 17l-5-5"/>', 'btn__icone')}<span class="btn__rotulo">Artigos no carrinho</span>`;
  $(det, '.ped4__det-accoes').insertAdjacentHTML('afterend', faixa('aviso', `<span class="cat6__faixa-icone">${I('<path d="M20 6 9 17l-5-5"/>')}</span>`, 'Os 5 artigos do P2024/001256 estão no carrinho.', 'Com os preços de hoje; reveja as quantidades antes de encomendar.', BOTAO('Ver o carrinho', IC.grelha, 'btn--acao btn--sm')));
});
/* 12.23 · repetido em parte: um artigo sem stock; os outros entraram; diz qual e o que fazer */
const ped4RepetidoParte = () => ped4('e1223', (r) => {
  const det = abertoNaCrono(r, 'P2024/001233');
  $(det, '.ped4__det-accoes').insertAdjacentHTML('afterend', faixa('aviso', `<span class="cat6__faixa-icone">${I(IC.aviso)}</span>`, '11 de 12 artigos foram para o carrinho.', 'O Amortecedor Monroe G8017 está sem stock no armazém de Lisboa. Pode ver as alternativas no catálogo.', BOTAO('Ver alternativas', IC.lupa, 'btn--claro btn--sm', ' data-ir="catalogo"')));
});
const erroCampo = (r: HTMLElement, id: string, valor: string, msg: string) => {
  const i = $<HTMLInputElement>(r, `#${id}`);
  i.setAttribute('value', valor); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${id}-msg`);
  i.closest('.campo')!.classList.add('campo--erro');
  i.closest('.campo')!.insertAdjacentHTML('beforeend', `<p class="campo__erro" id="${id}-msg">${I(IC.aviso)}${msg}</p>`);
};







/* ================= 13 · Guias de remessa (v3, 15 out.: como o Histórico de pedidos) =================
   Do briefing dela (a lista de estados do «Logistics Document Center»). Cada estado parte do ecrã e muda só o
   que esse estado muda; os erros ficam no sítio onde aconteceram (um PDF que falha não fecha a página). */
const guias = (html: string) => portal('guias', html.replace('portal--noite', 'portal--noite portal--estado'), undefined, { menu: true, rodape: false });
const g3 = (prefixo: string, f: (r: HTMLElement) => void, html = guiasV3()) => guias(mudar(html, prefixo, f));
/** Uma guia aberta no seu lugar da cronologia (com ids próprios do estado). */
const guiaAberta = (r: HTMLElement, num: string, prefixo: string) => {
  const li = $(r, `.ped4__c-item[data-num="${num}"]`), det = $(li, '.ped4__c-det');
  li.classList.add('is-aberto', 'is-ativo'); $(li, '.ped4__c-cabeca').setAttribute('aria-expanded', 'true');
  det.removeAttribute('hidden'); det.innerHTML = detalheGuia(guiaDe(num)).replace(/\bgui3-/g, `${prefixo}-`);
  return det;
};
/** O painel do documento aberto; o resto da página inerte, como no comportamento. */
const painelDoc = (r: HTMLElement, num: string, corpo: string) => {
  const g = guiaDe(num);
  $(r, '.ped4__veu').removeAttribute('hidden');
  const gv = $(r, '.gui3__gaveta'); gv.removeAttribute('hidden');
  gv.innerHTML = `${cabecaDoc(g).replace('id="gui3-g-num"', `id="${r.dataset.pref}-g-num"`)}<div class="gui3__g-corpo">${corpo}</div>${rodapeDoc(g)}`;
  gv.setAttribute('aria-labelledby', `${r.dataset.pref}-g-num`);
  $$(r, '.gui3 > header, .gui3 > section').forEach((el) => { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); });
  return gv;
};
const comPainel = (prefixo: string, f: (r: HTMLElement) => void) => ped4Inerte(g3(prefixo, (r) => { r.dataset.pref = prefixo; f(r); delete r.dataset.pref; }));
const semDados = (r: HTMLElement, n = '0') => { $(r, '.ped4__conta b').textContent = n; $$(r, '[data-kpi]').forEach((d) => { d.textContent = d.dataset.kpi === 'total' ? eurosPed(0) : n; }); $$(r, '.ped4__est-n').forEach((x) => { x.textContent = n; }); };
const esqCrono = (r: HTMLElement) => {
  $(r, '.ped4__crono').innerHTML = `<span class="ped4__c-linha" aria-hidden="true"></span><h2 class="gui3__ano">${E('40px')}</h2>` + [3, 2].map((n, k) => `<section class="ped4__mes"><h3 class="ped4__mes-t">${E(k ? '110px' : '90px', 'esq--titulo')}</h3><ol class="ped4__c-lista">${Array.from({ length: n }, (_, i) => `<li class="ped4__c-item ped4__c-esq"><span class="ped4__c-data">${E('24px')}</span><span class="ped4__c-marca"></span><article class="ped4__c-cartao"><div class="ped4__c-cabeca gui3__cabeca">${E(Math.max(30, 55 - i * 6))}${E('60%')}${E('80px')}${E('70px')}</div></article></li>`).join('')}</ol></section>`).join('');
};

/* 13.1 · a primeira carga: os filtros já servem; no lugar da lista, só o rolamento e o que está a acontecer */
const guiasInicio = () => g3('e131', (r) => {
  $$(r, '[data-kpi]').forEach((d) => { d.innerHTML = E('60px'); });
  $(r, '.ped4__conta').innerHTML = 'A ligar ao arquivo de documentos…';
  $(r, '.ped4__crono').outerHTML = `<div class="est-vazio est-vazio--largo" role="status">${rolamentoSvg('e131-rs', 'carregar', 'cat6__rs-faixa')}<p><strong>A carregar as guias de remessa…</strong> As guias desde 01/03/2024, da mais recente para a mais antiga.</p></div>`;
  $(r, '.ped4__vistas').setAttribute('hidden', '');
});
/* 13.2 · esqueleto: a forma da cronologia (ano, meses, guias) enquanto os dados chegam */
const guiasCarga = () => g3('e132', (r) => {
  $$(r, '[data-kpi]').forEach((d) => { d.innerHTML = E('60px'); });
  $(r, '.ped4__conta').innerHTML = `${GIRADOR('ped4__rs')} A carregar as guias…`;
  esqCrono(r);
  $$(r, '.ped4__est-n').forEach((n) => { n.textContent = '…'; });
});
/* 13.3 · a pesquisar uma referência: o botão espera; as guias de antes, esbatidas */
const guiasPesquisa = () => g3('e133', (r) => {
  valorCampo(r, 'e133-ref', 'VKMV 6PK1873');
  ocupadoPed($(r, '.ped4__pesquisar'), 'A pesquisar…');
  const a = $(r, '.ped4__a-atualizar'); a.removeAttribute('hidden'); a.innerHTML = `${GIRADOR('ped4__rs')}A atualizar…`;
  $(r, '.ped4__crono').classList.add('is-a-atualizar');
});
/* 13.4 · sem documentos: um cliente novo */
const guiasPrimeira = () => g3('e134', (r) => {
  semDados(r);
  $(r, '.ped4__crono').setAttribute('hidden', ''); $(r, '.ped4__tabela').setAttribute('hidden', ''); $(r, '.ped4__vistas').setAttribute('hidden', '');
  const v = $(r, '.ped4__vazio'); v.removeAttribute('hidden');
  v.innerHTML = `<p><strong>Ainda não tem guias de remessa.</strong> Quando um pedido sair do armazém, a guia aparece aqui com a fatura; as devoluções aparecem com a nota de crédito.</p>${BOTAO('Ver o catálogo', IC.grelha, 'btn--acao btn--sm', ' data-ir="catalogo"')}`;
});
/* 13.5 · nenhum documento com estes filtros: diz qual foi o último e dá a saída */
const guiasVazio = () => g3('e135', (r) => {
  valorCampo(r, 'e135-de', '01/05/2024'); valorCampo(r, 'e135-ate', '31/05/2024');
  chips(r, ['Desde 01/05/2024', 'Até 31/05/2024']);
  semDados(r);
  $(r, '.ped4__crono').setAttribute('hidden', ''); $(r, '.ped4__tabela').setAttribute('hidden', '');
  const v = $(r, '.ped4__vazio'); v.removeAttribute('hidden');
  v.innerHTML = `<p><strong>Nenhuma guia em maio de 2024.</strong> A última é a GR2024/08812, de 15/04/2024; alargue as datas ou tire um filtro (${GUIAS.length} documentos no total).</p>${BOTAO('Limpar filtros', IC.denovo, 'btn--ghost btn--sm')}`;
});
/* 13.6 · intervalo de datas inválido: cada campo diz como deve ser; o que se escreveu fica */
const guiasFiltros = () => g3('e136', (r) => {
  erroPed(r, 'e136-de', '31/04/2024', 'Abril só tem 30 dias. Escreva a data como dd/mm/aaaa.');
  erroPed(r, 'e136-ate', '01/03/2024', 'A data final é antes da inicial.');
});
/* 13.7 · guia selecionada: ativa (marcador e borda laranja), ainda fechada */
const guiasSelecionada = () => g3('e137', (r) => {
  const li = $(r, '.ped4__c-item[data-num="GR2024/08640"]'); li.classList.add('is-ativo', 'is-passado');
  $(r, '.gui3__mes-atual').textContent = 'abril de 2024';
});
/* 13.8 · guia aberta: o percurso documental, o documento, a entrega, os valores, os artigos e as ações */
const guiasAberta = () => g3('e138', (r) => { guiaAberta(r, 'GR2024/08640', 'e138'); });
/* 13.9 · nota de crédito aberta: a devolução, o pedido, e a fatura do mesmo pedido como ligação */
const guiasCredito = () => g3('e139', (r) => { guiaAberta(r, 'GR2024/08511', 'e139'); });
/* 13.10 · a abrir a guia relacionada: só essa espera, em esqueleto com a forma do detalhe */
const guiasRelacionada = () => g3('e1310', (r) => {
  guiaAberta(r, 'GR2024/08511', 'e1310');
  const b = $(r, '.ped4__c-item[data-num="GR2024/08511"] .gui3__irma'); b.setAttribute('aria-busy', 'true'); b.innerHTML = `${GIRADOR('ped4__rs')}<b>GR2024/08321</b> · a abrir…`;
  const li = $(r, '.ped4__c-item[data-num="GR2024/08321"]'), det = $(li, '.ped4__c-det');
  li.classList.add('is-aberto'); $(li, '.ped4__c-cabeca').setAttribute('aria-expanded', 'true'); det.removeAttribute('hidden');
  det.innerHTML = `<div class="gui3__det" aria-busy="true"><section class="gui3__det-percurso"><p class="ped4__conta">${GIRADOR('ped4__rs')} A abrir a guia GR2024/08321…</p>${E('100%')}</section><section class="gui3__det-doc">${E('70%')}${E('55%')}${E('80%')}</section><section class="gui3__det-artigos">${[90, 75, 85].map((w) => E(w)).join('')}</section><section class="gui3__det-valores">${[60, 60, 60, 80].map((w) => E(w)).join('')}</section></div>`;
});
/* 13.11 · pedido indisponível: a guia e a fatura continuam; o pedido já não está no histórico */
const guiasPedidoIndisponivel = () => g3('e1311', (r) => {
  const det = guiaAberta(r, 'GR2024/07940', 'e1311');
  $(det, '.gui3__ind').removeAttribute('hidden');
});
/* 13.12 · o documento a abrir no painel */
const guiasPdfCarga = () => comPainel('e1312', (r) => { painelDoc(r, 'GR2024/08640', `<p class="gui3__g-carga" role="status">${rolamentoSvg('e1312-rs', 'carregar', 'ped4__rs')}A abrir o documento…</p>`); });
/* 13.13 · a pré-visualização do documento, com a descarga */
const guiasPdf = () => comPainel('e1313', (r) => { painelDoc(r, 'GR2024/08640', paginaDoc(guiaDe('GR2024/08640'))); });
/* 13.14 · documento indisponível: só o painel diz que falhou; a guia e os valores continuam na página */
const guiasPdfErro = () => comPainel('e1314', (r) => {
  guiaAberta(r, 'GR2024/08640', 'e1314');
  const gv = painelDoc(r, 'GR2024/08640', `<div class="gui3__g-erro" role="alert">${rolamentoSvg('e1314-rs', 'erro', 'ped4__rs')}<p><strong>O documento da GR2024/08640 não está disponível.</strong></p><p>O arquivo de documentos não respondeu. A guia, os valores e os artigos continuam na página. Referência do erro: DOC-504-0812.</p>${BOTAO('Tentar novamente', IC.denovo, 'btn--ghost btn--sm')}</div>`);
  const b = $(gv, '[data-descarregar]'); b.setAttribute('disabled', ''); b.setAttribute('title', 'Sem documento para descarregar');
});
/* 13.15 · a descarregar: só esse botão espera */
const guiasDescarga = () => g3('e1315', (r) => {
  const det = guiaAberta(r, 'GR2024/08640', 'e1315');
  ocupadoPed($(det, '[data-descarregar]'), 'A preparar o PDF…');
});
/* 13.16 · a descarga falhou: a faixa no próprio documento, com «Tentar novamente»; o resto continua */
const guiasDescargaErro = () => g3('e1316', (r) => {
  const det = guiaAberta(r, 'GR2024/08640', 'e1316');
  $(det, '.gui3__accoes').insertAdjacentHTML('afterend', faixa('erro', `<span class="cat6__faixa-icone">${I(IC.aviso)}</span>`, 'O PDF da GR2024/08640 não descarregou.', 'A ligação caiu a meio. A guia continua aberta; tente outra vez.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});
/* 13.17 · sem ligação: as guias de há pouco, esbatidas; pesquisar e descarregar esperam */
const guiasRede = () => g3('e1317', (r) => {
  $(r, '.ped4__crono').classList.add('is-a-atualizar');
  $(r, '.ped4__pesquisar').setAttribute('disabled', '');
  $(r, '.ped4__lista').insertAdjacentHTML('afterbegin', faixa('aviso', rolamentoSvg('e1317-rs', 'offline', 'cat6__rs-faixa'), 'Está sem ligação à Internet.', 'Vê as guias de há 6 minutos; pesquisar e descarregar PDF voltam quando a ligação voltar.', BOTAO('Tentar novamente', IC.denovo, 'btn--claro btn--sm')));
});
/* 13.18 · erro do servidor: os filtros ficam; a lista diz o que falhou, com a referência do erro */
const guiasFalha = () => g3('e1318', (r) => {
  valorCampo(r, 'e1318-num', 'GR2024/08');
  $(r, '.ped4__tabela').remove();
  $(r, '.ped4__crono').outerHTML = `<div class="cg-falha est-falha est-falha--largo" role="alert">${rolamentoSvg('e1318-rs', 'erro', 'cat6__rs-faixa')}<div><p class="cg-falha__titulo">Não foi possível carregar as guias de remessa.</p><p class="cg-falha__texto">O serviço de documentos não respondeu. Os filtros ficam como estão. Referência do erro: GR-503-1015.</p><div class="est-aviso__botoes">${BOTAO('Tentar novamente', IC.denovo, 'btn--acao btn--sm')}</div>${APOIO}</div></div>`;
  $$(r, '[data-kpi]').forEach((d) => { d.textContent = '—'; });
  $(r, '.ped4__conta').textContent = 'Sem dados';
});
/* 13.19 · sessão terminada: a página fica; pesquisar pede para entrar outra vez */
const guiasSessao = () => g3('e1319', (r) => {
  $(r, '.ped4__pesquisar').setAttribute('disabled', '');
  $(r, '.ped4__filtros').insertAdjacentHTML('beforebegin', faixa('aviso', `<span class="cat6__faixa-icone">${I(IC_CADEADO_P)}</span>`, 'A sua sessão terminou.', 'Entre outra vez para atualizar as guias e descarregar documentos; os filtros ficam como estão.', BOTAO('Entrar', IC_CADEADO_P, 'btn--acao btn--sm', ' data-ir="entrada"')));
});
/* 13.20 · sem permissão: esta conta não vê os documentos de entrega */
const guiasSemPermissao = () => g3('e1320', (r) => {
  $(r, '.ped4__filtros').setAttribute('hidden', ''); $(r, '.ped4__kpi').setAttribute('hidden', '');
  $(r, '.ped4__lista').innerHTML = `<div class="est-vazio est-vazio--largo">${I(IC_CADEADO_P)}<p><strong>A sua conta não tem acesso às guias de remessa.</strong> As guias e os valores são da conta da oficina; peça acesso ao administrador da conta. Os pedidos e o catálogo continuam abertos.</p><div class="est-aviso__botoes">${BOTAO('Ver os pedidos', IC.grelha, 'btn--ghost btn--sm', ' data-ir="pedidos"')}</div></div>`;
});
/* 13.21 · a mesma página na Tabela, com a guia aberta na linha */
const guiasTabela = () => g3('e1321', (r) => {
  const tr = $(r, 'tr.ped4__linha[data-num="GR2024/08640"]'), det = tr.nextElementSibling as HTMLElement;
  tr.classList.add('is-aberto'); $(tr, '.ped4__abrir').setAttribute('aria-expanded', 'true');
  det.removeAttribute('hidden'); det.firstElementChild!.innerHTML = detalheGuia(guiaDe('GR2024/08640')).replace(/\bgui3-/g, 'e1321-');
}, guiasV3('tabela'));


/* ================= 14 · Faturas ================= */
const faturas = (html: string) => portal('faturas', html.replace('portal--noite', 'portal--noite portal--estado'), undefined, { menu: true, rodape: false });
const semFaturas = (r: HTMLElement) => $$(r, '[data-faturas]').forEach((x) => x.removeAttribute('data-faturas'));
const faturasEsq = (n: number) => Array.from({ length: n }, (_, i) => `<tr>${[70, 50, 60, 85, 45, 45, 40, 40, 50, 40, 30, 30, 30, 30, 50, 60].map((c) => `<td>${E(Math.max(25, c - (i % 3) * 10), 'esq--texto')}</td>`).join('')}</tr>`).join('');

/* 14.1 · esqueleto */
const faturasCarga = () => faturas(mudar(faturasV1, 'e141', (r) => {
  semFaturas(r);
  $(r, '.fat').setAttribute('aria-busy', 'true');
  $(r, '.ped2__resumo').innerHTML = `${E('130px', 'esq--botao')}${E('160px', 'esq--botao')}${E('150px', 'esq--botao')}`;
  $(r, 'tbody').innerHTML = faturasEsq(8);
  $$(r, '.ped2__n').forEach((n) => n.remove());
  $(r, '.ped2__pe').innerHTML = `<span role="status">${GIRADOR('girador--pequeno')} A carregar as faturas…</span>`;
}));
/* 14.2 · a pesquisar um n.º */
const faturasPesquisa = () => faturas(mudar(faturasV1, 'e142', (r) => {
  semFaturas(r);
  $<HTMLInputElement>(r, '#e142-num').setAttribute('value', 'FT2024/05');
  aCarregar($(r, '.ped2__pesquisar'), 'A pesquisar…');
  $(r, '.fat__tabela').insertAdjacentHTML('afterbegin', '<div class="progresso progresso--indeterminado progresso--fino" aria-hidden="true"><span></span></div>');
  $(r, '.fat__tabela tbody').classList.add('est-esbatido');
  $(r, '.ped2__pe').innerHTML = `<span role="status">${GIRADOR('girador--pequeno')} A procurar faturas FT2024/05…</span>`;
}));
/* 14.3 · sem faturas no período */
const faturasVazio = () => faturas(mudar(faturasV1, 'e143', (r) => {
  semFaturas(r);
  $<HTMLInputElement>(r, '#e143-de').setAttribute('value', '01/10/2026');
  $(r, '.ped2__conta').textContent = '0';
  $(r, '.ped2__total').textContent = '0,00 €';
  $(r, '.fat__aberto-valor').textContent = '0,00 €';
  $$(r, '.ped2__n').forEach((n) => { n.textContent = '0'; });
  $(r, 'tbody').innerHTML = '';
  $(r, '.ped2__vazio').outerHTML = `<div class="est-vazio est-vazio--largo est-vazio--tabela">${I(IC.caixa)}<p><strong>Nenhuma fatura desde 01/10/2026.</strong> A última fatura da conta é a FT2024/05530, de 15/04/2024.</p><div class="est-aviso__botoes">${BOTAO('Ver o último ano', IC.denovo, 'btn--ghost btn--sm')}${BOTAO('Ver as guias', IC.grelha, 'btn--acao btn--sm', ' data-ir="guias"')}</div></div>`;
  $(r, '.ped2__pe').innerHTML = '<span>A mostrar 0 · de 01/10/2026 até hoje</span>';
}));
/* 14.4 · erro nos filtros */
const faturasFiltros = () => faturas(mudar(faturasV1, 'e144', (r) => {
  semFaturas(r);
  erroCampo(r, 'e144-ate', '01/02/2024', '«Data até» é antes de «Data a partir de» (01/03/2024).');
  erroCampo(r, 'e144-num', '5530', 'Escreva o n.º completo: FT2024/05530 (fatura) ou NC2024/00412 (nota de crédito).');
  $(r, '.ped2__campos').insertAdjacentHTML('beforebegin', `<div class="est-aviso est-aviso--erro" role="alert">${I(IC.aviso)}<div><p class="est-aviso__titulo">Há 2 campos a corrigir antes de pesquisar</p></div></div>`);
  $(r, '.ped2__campos').classList.add('est-com-erros');
}));
/* 14.5 · sem ligação */
const faturasRede = () => faturas(mudar(faturasV1, 'e145', (r) => {
  semFaturas(r);
  $(r, '.fat').insertAdjacentHTML('afterbegin', `<div class="er-faixa est-faixa" role="alert">${I(IC.semrede)}<span><strong>Sem ligação à internet.</strong> Está a ver as faturas de há 5 minutos. Pesquisar e descarregar PDF voltam quando a ligação voltar.</span>${BOTAO('Tentar de novo', IC.denovo, 'btn--ghost btn--sm')}</div>`);
  const b = $(r, '.ped2__pesquisar'); b.setAttribute('disabled', ''); b.setAttribute('title', 'Sem ligação');
  $(r, '.fat__tabela tbody').classList.add('est-esbatido');
}));
/* 14.6 · a tabela não carregou */
const faturasFalha = () => faturas(mudar(faturasV1, 'e146', (r) => {
  semFaturas(r);
  $(r, '.ped2__resumo').innerHTML = '';
  $(r, 'tbody').innerHTML = '';
  $(r, '.ped2__vazio').outerHTML = `<div class="cg-falha est-falha est-falha--largo est-falha--tabela">${I(IC.aviso)}<div><p class="cg-falha__titulo">Não foi possível carregar as faturas</p><p class="cg-falha__texto">Os filtros ficaram como estavam. Referência do erro: <code>GP-20261013-F2M9</code></p>${APOIO}</div>${BOTAO('Tentar de novo', IC.denovo, 'btn--ghost btn--sm')}</div>`;
  $(r, '.ped2__pe').remove();
}));
/* 14.7 · uma fatura em aberto, no painel, com a referência Multibanco */
const faturasAberta = () => faturas(mudar(faturasV1, 'e147', (r) => { semFaturas(r); preencherFatura(r, $$(r, '.fat__linha')[0]); }));
/* 14.8 · uma fatura vencida, no painel */
const faturasVencida = () => faturas(mudar(faturasV1, 'e148', (r) => { semFaturas(r); preencherFatura(r, $$(r, '.fat__linha')[3]); }));
/* 14.9 · primeira vez */
const faturasPrimeira = () => faturas(mudar(faturasV1, 'e149', (r) => {
  semFaturas(r);
  $(r, '.ped2__resumo').innerHTML = '';
  $$(r, '.ped2__n').forEach((n) => { n.textContent = '0'; });
  $(r, 'tbody').innerHTML = '';
  $(r, '.ped2__vazio').outerHTML = `<div class="est-vazio est-vazio--largo est-vazio--tabela">${I(IC.caixa)}<p><strong>Ainda não tem faturas.</strong> A fatura de cada encomenda aparece aqui quando a guia de remessa sai do armazém; as devoluções aparecem como notas de crédito.</p><div class="est-aviso__botoes">${BOTAO('Ver o catálogo', IC.grelha, 'btn--acao btn--sm', ' data-ir="catalogo"')}</div></div>`;
  $(r, '.ped2__pe').remove();
}));

/* ---------- a lista: cada estado logo a seguir ao seu ecrã ---------- */
const PAI: Record<string, IdGoParts> = { inicio: 'inicio', catalogo: 'catalogo', pedidos: 'pedidos', guias: 'guias', faturas: 'faturas' };
const e = (id: IdGoParts, nome: string, objetivo: string, html: () => string): EcraGoParts =>
  ({ id, nome, fluxo: 'Portal', objetivo, estadoDe: PAI[id.split('-')[0]], versoes: [{ id: 'v1', nota: 'No estilo do ecrã de cima (12 out.)', html: html() }] });

/* 14 out. 2026: o Início v3 (o espaço de trabalho de todos os dias) traz os seus próprios estados, tirados do
   mesmo desenho (inicio-v3.ts); os do v2.2 saíram com ele */
const ini3 = (est: EstadoInicio) => () => {
  const html = portal('inicio', inicioV3(est), undefined, { menu: true, rodape: false });
  /* com a pesquisa global aberta (modal), o resto da página fica inerte, como o comportamento faz */
  return est === 'comando' ? html.replace('<header class="portal__topo"', '<header class="portal__topo" inert aria-hidden="true"').replace('<nav class="portal__abas"', '<nav class="portal__abas" inert aria-hidden="true"').replace('<main class="ini3', '<main inert aria-hidden="true" class="ini3') : html;
};
export const estadosInicio = (): EcraGoParts[] => [
  e('inicio-carga', '10.1 · A carregar o Início', 'O rolamento monta-se e roda no lugar da pesquisa — «A preparar o teu espaço…» — e as zonas aparecem à medida que os dados chegam.', ini3('carga')),
  e('inicio-modelos', '10.2 · Sugestões ao escrever', 'Na referência, «VKBA»: as sugestões agrupadas (referências, fabricantes, pesquisas recentes), a parte escrita destacada, a escolhida com a risca laranja; ↑ ↓ Enter Esc.', ini3('sugestoes')),
  e('inicio-pesquisa', '10.3 · A pesquisar a referência', 'O rolamento roda no lugar do ícone do campo e no botão: «A procurar referências…». Sem cobrir a página.', ini3('pesquisa')),
  e('inicio-sem-resultados', '10.4 · Referência sem resultados', 'O contorno de um disco inspecionado uma vez; «Não encontrámos resultados…» e três saídas: limpar, equivalências, catálogo.', ini3('sem-resultados')),
  e('inicio-formulario', '10.5 · Erro no formulário', 'Identificar: a matrícula incompleta — borda, ícone que se desenha e a explicação por baixo; o que se escreveu fica.', ini3('erro')),
  e('inicio-rede', '10.6 · Sem ligação', 'O rolamento abranda até parar: «Estás sem ligação à Internet.» «Tentar novamente» volta a pô-lo a rodar e confirma a ligação.', ini3('rede')),
  e('inicio-falha', '10.7 · Os pedidos não carregaram', 'Só a zona dos pedidos: a caixa cai uma vez, «Não foi possível carregar os pedidos.» e «Tentar novamente» com o seu próprio carregamento.', ini3('falha')),
  e('inicio-vazio', '10.8 · Primeira vez', 'A visita guiada pelas três formas de encontrar peças, um cartão de cada vez (Seguinte, Anterior, Saltar); não se repete.', ini3('vazio')),
  e('inicio-comando', '10.9 · Pesquisa global (Ctrl+K)', 'Ctrl+K (⌘K): o fundo escurece e a caixa cresce de 0,98 para 1; recentes, pedidos, marcas e modelos, categorias e páginas; ↑ ↓ Enter Esc.', ini3('comando')),
];
export const estadosCatalogo = (): EcraGoParts[] => [
  e('catalogo-carga', '11.1 · A carregar o Catálogo', 'O cartão da pesquisa e a grelha das marcas em esqueleto.', catalogoCarga),
  e('catalogo-identificar', '11.2 · A identificar o veículo', 'A matrícula escrita, o botão em «A identificar…» e uma barra fina.', catalogoIdentificar),
  e('catalogo-nao-encontrada', '11.3 · Matrícula não encontrada', 'Nenhum veículo com aquela matrícula: porquê pode ser e o que tentar.', catalogoNaoEncontrada),
  e('catalogo-formulario', '11.4 · Erros no formulário', 'Matrícula e chassis com o formato errado, cada um com a correção.', catalogoFormulario),
  e('catalogo-modelos', '11.5 · A carregar modelos', 'Escolhida a marca, os cartões dos modelos chegam em esqueleto, com a proporção da imagem guardada (nada salta); o rolamento ao pé da contagem.', catalogoModelos),
  e('catalogo-procura', '11.6 · Marca não encontrada', 'A procura de marca não encontra nada: sugere a escrita certa e outro caminho.', catalogoProcura),
  e('catalogo-sem-favoritas', '11.7 · Sem favoritas', 'Ainda sem favoritas: explica a estrela e leva a «Todas».', catalogoSemFavoritas),
  e('catalogo-falha', '11.8 · As marcas não carregaram', 'A grelha falhou: o que continua a funcionar, a referência do erro, o apoio e «Tentar de novo».', catalogoFalha),
  e('catalogo-lista-modelos', '11.9 · Modelos da marca', 'Catálogo v3: escolhida a BMW, a tabela dos modelos com Fabricado desde e até; os filtros Modelo e Ano no cartão azul.', catalogoListaModelos),
  e('catalogo-veiculos', '11.10 · Veículos do modelo', 'Catálogo v3: os veículos do Scénic II com motor, kW, cv, cc, tração e carroçaria; o 1.5 dCi escolhido acende «Grupo montagem».', catalogoVeiculos),
  e('catalogo-referencias', '11.11 · Referências', 'Catálogo v5: as peças do BMW 1 (E81) 118d de todos os fabricantes, preço, desconto, líquido e stock no Porto e em Sacavém; duas marcadas para comparar.', catalogoReferencias),
  e('catalogo-universal', '11.12 · Universal', 'Catálogo v5: os grupos de montagem sem veículo, em árvore; o Kit de distribuição escolhido mostra os fabricantes; cada um leva às referências.', catalogoUniversal),
  e('catalogo-detalhes', '11.13 · Detalhes da referência', 'Catálogo v5: a peça em cima (preço, desconto, líquido, stock, quantidade, carrinho e minha lista) e os separadores Stock, Equivalências, OE, Veículos aplicáveis, Características e Documentos.', catalogoDetalhes),
  e('catalogo-sem-veiculos', '11.14 · Nenhum veículo com estes filtros', 'Sem dados: os filtros dos veículos não deixam nenhum; diz porquê e dá duas saídas.', catalogoSemVeiculos),
  e('catalogo-sem-referencias', '11.15 · Grupo sem referências', 'Sem dados: o grupo escolhido não tem peças para o veículo; a Romafe procura-a ao fabricante.', catalogoSemReferencias),
  e('catalogo-identificado', '11.16 · Veículo identificado', 'Sucesso: o veículo encaixa na barra do contexto (o rolamento monta-se) e o catálogo passa aos Veículos, já filtrados.', catalogoIdentificado),
  e('catalogo-a-pedir', '11.17 · A adicionar ao carrinho', 'Pendente: o rolamento no botão; a peça só voa para o carrinho depois da confirmação.', catalogoAPedir),
  e('catalogo-carrinho-falhou', '11.18 · O carrinho não aceitou', 'Falha: o botão diz «Não adicionado», a faixa explica e deixa tentar de novo; nada se finge.', catalogoCarrinhoFalhou),
  e('catalogo-precos', '11.19 · Preços indisponíveis', 'Falha parcial: os preços não chegaram; as referências e o stock continuam; «Pedir» espera pelo preço.', catalogoPrecos),
  e('catalogo-grupos-carga', '11.24 · Grupos de montagem a carregar', 'Só o painel da árvore espera: o rolamento e as linhas em esqueleto, com a forma das categorias; o resto do catálogo continua.', catalogoGruposCarga),
  e('catalogo-offline', '11.20 · Sem ligação no catálogo', 'O rolamento abranda até parar; as referências de há pouco ficam à vista, esbatidas; pedir volta com a ligação.', catalogoOffline),
  e('catalogo-ficha-carga', '11.25 · A ficha a carregar', 'O esqueleto com a forma da ficha (identidade, compra, separadores) e o rolamento no separador; nada salta quando os dados chegam.', fichaCarga),
  e('catalogo-ficha-indisponivel', '11.26 · Referência indisponível', 'A referência deixou de ser fornecida: não se pode pedir; a saída são as equivalências.', fichaIndisponivel),
  e('catalogo-ficha-sem-stock', '11.27 · Sem stock', 'Zero no Porto e em Sacavém; «Adicionar» desligado; o prazo não se inventa, confirma-se.', fichaSemStock),
  e('catalogo-ficha-stock-carga', '11.28 · O stock a carregar', 'Só o stock espera: as linhas em esqueleto e o rolamento; preço e identidade já estão.', fichaStockCarga),
  e('catalogo-ficha-stock-erro', '11.29 · O stock não chegou', 'A faixa explica e deixa tentar de novo; o preço continua certo.', fichaStockErro),
  e('catalogo-ficha-qtd', '11.30 · Quantidade inválida', 'A quantidade a zero: a caixa a vermelho, a frase diz o mínimo e quanto há.', fichaQtd),
  e('catalogo-ficha-a-adicionar', '11.31 · A adicionar ao carrinho', 'Pendente: o rolamento no botão; a confirmação só depois do servidor.', fichaAAdicionar),
  e('catalogo-ficha-adicionada', '11.32 · Adicionada ao carrinho', 'A confirmação por baixo da compra, com «Ver carrinho».', fichaAdicionada),
  e('catalogo-ficha-nao-adicionada', '11.33 · O carrinho não aceitou', 'O botão diz «Não adicionado»; a faixa explica e deixa tentar de novo.', fichaNaoAdicionada),
  e('catalogo-ficha-sem-equivalencias', '11.34 · Sem equivalências', 'O separador vazio diz porquê e leva aos números OE.', fichaSemEquivalencias),
  e('catalogo-ficha-sem-oe', '11.35 · Sem números OE', 'O fabricante não os indicou.', fichaSemOe),
  e('catalogo-ficha-sem-veiculos', '11.36 · Sem veículos compatíveis', 'Sem confirmação, não se dá como compatível; fala-se com a Romafe.', fichaSemVeiculos),
  e('catalogo-ficha-sem-caracteristicas', '11.37 · Sem características', 'Ainda não chegaram do fabricante; a ficha técnica pode tê-las.', fichaSemCaracteristicas),
  e('catalogo-ficha-sem-documentos', '11.38 · Sem documentos', 'O fabricante não publicou documentos.', fichaSemDocumentos),
  e('catalogo-ficha-documento-carga', '11.39 · Documento a preparar', 'Só o botão desse documento espera, com o rolamento.', fichaDocumentoCarga),
  e('catalogo-ficha-documento-erro', '11.40 · O documento não descarregou', 'A faixa diz qual e deixa tentar de novo; os outros continuam.', fichaDocumentoErro),
  e('catalogo-ficha-sessao', '11.41 · Sessão terminada', 'A ficha fica onde está; pedir pede para entrar outra vez.', fichaSessao),
  e('catalogo-ficha-sem-permissao', '11.42 · Sem permissão para preços', 'Esta conta não vê preços nem compra; a ficha técnica continua aberta.', fichaSemPermissao),
  e('catalogo-ficha-offline', '11.43 · Sem ligação na ficha', 'A ficha de há pouco, esbatida; pedir volta com a ligação.', fichaOffline),
];

export const estadosPedidos = (): EcraGoParts[] => [
  e('pedidos-carga', '12.1 · A carregar os pedidos', 'Os filtros já servem; os números e as linhas chegam em esqueleto, com a forma da tabela.', ped4Carga),
  e('pedidos-filtrar', '12.2 · A atualizar', 'Com «SKF» na referência: o botão em «A pesquisar…», o rolamento em «A atualizar…» e as linhas de antes esbatidas.', ped4Filtrar),
  e('pedidos-vazio', '12.3 · Nenhum pedido com estes filtros', 'Maio de 2024: diz qual foi o último pedido, mostra os filtros aplicados e dá «Limpar filtros».', ped4Vazio),
  e('pedidos-datas', '12.4 · Erro nos filtros', 'A data que não existe e a final antes da inicial: cada campo diz como deve ser e guarda o que se escreveu.', ped4Datas),
  e('pedidos-rede', '12.5 · Sem ligação', 'Uma faixa por cima da lista; os pedidos de há pouco esbatidos e «Pesquisar» desligado.', ped4Rede),
  e('pedidos-falha', '12.6 · Erro do servidor', 'Os filtros ficam; a tabela diz o que falhou, com a referência do erro, o apoio e «Tentar novamente».', ped4Falha),
  e('pedidos-aberto', '12.7 · Pedido concluído (aberto)', 'O P2024/001256 aberto no seu cartão da cronologia: o percurso todo feito, os artigos, a morada, a guia, a fatura e as ações.', ped4Aberto),
  e('pedidos-primeira', '12.8 · Primeira vez', 'Sem pedidos: diz o que vai aparecer aqui e leva ao catálogo.', ped4Primeira),
  e('pedidos-a-abrir', '12.9 · O pedido a abrir', 'Só a linha aberta espera, em esqueleto com a forma do detalhe.', ped4AAbrir),
  e('pedidos-processamento', '12.10 · Em processamento', 'O P2024/001198 ainda não saiu: o passo seguinte marcado sem data; à espera de confirmar o stock.', ped4Processamento),
  e('pedidos-recolher', '12.11 · Por recolher no balcão', 'O P2024/001142: levanta no balcão de Lisboa; ainda sem guia nem fatura.', ped4Recolher),
  e('pedidos-expedido', '12.12 · Expedido em parte', 'O P2024/001233: o camião no passo onde o pedido está; 2 amortecedores pendentes.', ped4Expedido),
  e('pedidos-gaveta', '12.13 · Pedido no painel', 'O mesmo pedido no painel à direita (no telemóvel, o ecrã inteiro).', ped4Gaveta),
  e('pedidos-sessao', '12.14 · Sessão terminada', 'A página fica; pesquisar pede para entrar outra vez.', ped4Sessao),
  e('pedidos-sem-permissao', '12.15 · Sem permissão', 'Esta conta não vê os pedidos da oficina; o catálogo continua aberto.', ped4SemPermissao),
  e('pedidos-documento', '12.16 · Documento indisponível', 'A fatura não abriu; a guia e o resto do pedido continuam.', ped4Documento),
  e('pedidos-tabela', '12.17 · Vista em tabela', 'A alternativa à cronologia: a tabela ordenável, com o P2024/001233 aberto na linha.', ped4Tabela),
  e('pedidos-inicio', '12.18 · Primeira carga', 'A primeira carga: os filtros já servem; no lugar da lista, o rolamento e o que está a acontecer.', ped4Inicio),
  e('pedidos-selecionado', '12.19 · Pedido selecionado', 'O P2024/001233 ativo, ainda fechado: o anel e a borda a laranja.', ped4Selecionado),
  e('pedidos-encontrado', '12.20 · Encontrado pela referência', 'Com «VKBA»: só os dois pedidos com a peça, e a peça destacada em cada cartão.', ped4Encontrado),
  e('pedidos-repetir', '12.21 · A repetir o pedido', 'Só o botão «Repetir pedido» espera, com o rolamento.', ped4Repetir),
  e('pedidos-repetido', '12.22 · Artigos no carrinho', 'O botão confirma e a faixa diz quantos artigos entraram, com o caminho para o carrinho.', ped4Repetido),
  e('pedidos-repetido-parte', '12.23 · Repetido em parte', 'Um artigo sem stock: diz qual, que os outros entraram, e leva às alternativas.', ped4RepetidoParte),
];
export const estadosGuias = (): EcraGoParts[] => [
  e('guias-inicio', '13.1 · Primeira carga', 'A primeira carga: os filtros já servem; no lugar da lista, o rolamento e o que está a acontecer.', guiasInicio),
  e('guias-carga', '13.2 · Esqueleto', 'A forma da cronologia (o ano, os meses, as guias) enquanto os dados chegam; os números em esqueleto.', guiasCarga),
  e('guias-pesquisa', '13.3 · A pesquisar', 'Com uma referência escrita: o botão em «A pesquisar…», o rolamento em «A atualizar…» e as guias de antes esbatidas.', guiasPesquisa),
  e('guias-primeira', '13.4 · Sem documentos', 'Um cliente novo: diz quando as guias vão aparecer (com a fatura ou a nota de crédito) e leva ao catálogo.', guiasPrimeira),
  e('guias-vazio', '13.5 · Nenhuma com estes filtros', 'Maio de 2024: diz qual foi a última guia, mostra os filtros aplicados e dá «Limpar filtros».', guiasVazio),
  e('guias-filtros', '13.6 · Datas inválidas', 'A data que não existe e a final antes da inicial: cada campo diz como deve ser e guarda o que se escreveu.', guiasFiltros),
  e('guias-selecionada', '13.7 · Guia selecionada', 'A GR2024/08640 ativa, ainda fechada: o marcador e a borda a laranja; o mês dela ao lado da contagem.', guiasSelecionada),
  e('guias-aberta', '13.8 · Guia aberta', 'A GR2024/08640 aberta no sítio: Pedido → Guia → Fatura, a entrega, os valores (a base como subtotal, o total à parte), os artigos e as ações.', guiasAberta),
  e('guias-credito', '13.9 · Nota de crédito aberta', 'A devolução GR2024/08511: o percurso até à nota de crédito e, do mesmo pedido, a guia da fatura como ligação.', guiasCredito),
  e('guias-relacionada', '13.10 · A abrir a guia relacionada', 'Do mesmo pedido: só a guia pedida espera, em esqueleto com a forma do detalhe.', guiasRelacionada),
  e('guias-pedido-indisponivel', '13.11 · Pedido indisponível', 'A GR2024/07940 é de um pedido que já não está no histórico: o nó a tracejado e a nota; a guia e a fatura continuam.', guiasPedidoIndisponivel),
  e('guias-pdf-carga', '13.12 · Documento a abrir', 'O painel abre já com o número e a descarga; a página do documento chega a seguir.', guiasPdfCarga),
  e('guias-pdf', '13.13 · Pré-visualização', 'O documento no painel à direita, com «Descarregar PDF» em baixo; Esc fecha e o foco volta ao botão.', guiasPdf),
  e('guias-pdf-erro', '13.14 · Documento indisponível', 'Só o painel diz que o documento falhou (com a referência do erro); a guia e os valores continuam na página.', guiasPdfErro),
  e('guias-descarga', '13.15 · A descarregar', 'Só o botão do PDF espera, com o rolamento.', guiasDescarga),
  e('guias-descarga-erro', '13.16 · A descarga falhou', 'A faixa no próprio documento, com «Tentar novamente»; o resto da guia continua.', guiasDescargaErro),
  e('guias-rede', '13.17 · Sem ligação', 'Uma faixa por cima da lista; as guias de há pouco esbatidas; pesquisar desligado.', guiasRede),
  e('guias-falha', '13.18 · Erro do servidor', 'Os filtros ficam; a lista diz o que falhou, com a referência do erro, o apoio e «Tentar novamente».', guiasFalha),
  e('guias-sessao', '13.19 · Sessão terminada', 'A página fica; pesquisar e descarregar pedem para entrar outra vez.', guiasSessao),
  e('guias-sem-permissao', '13.20 · Sem permissão', 'Esta conta não vê os documentos de entrega; os pedidos e o catálogo continuam abertos.', guiasSemPermissao),
  e('guias-tabela', '13.21 · Vista em tabela', 'A alternativa à cronologia: as colunas todas do GO REPAIR, ordenáveis, com a GR2024/08640 aberta na linha.', guiasTabela),
];
export const estadosFaturas = (): EcraGoParts[] => [
  e('faturas-carga', '14.1 · A carregar as faturas', 'Os filtros já à vista; o resumo e as linhas chegam em esqueleto.', faturasCarga),
  e('faturas-pesquisa', '14.2 · A pesquisar', 'Com um n.º escrito: o botão em «A pesquisar…», uma barra fina e as faturas de antes esbatidas.', faturasPesquisa),
  e('faturas-vazio', '14.3 · Sem faturas no período', 'Nenhuma fatura nas datas escolhidas: diz qual foi a última e dá dois caminhos.', faturasVazio),
  e('faturas-filtros', '14.4 · Erro nos filtros', 'A data final antes da inicial e o n.º incompleto: cada campo diz como deve ser.', faturasFiltros),
  e('faturas-rede', '14.5 · Sem ligação', 'Uma faixa em cima, as faturas de há pouco esbatidas; pesquisar e descarregar esperam pela ligação.', faturasRede),
  e('faturas-falha', '14.6 · As faturas não carregaram', 'A tabela falhou: os filtros ficam, a referência do erro, o apoio e «Tentar de novo».', faturasFalha),
  e('faturas-aberta', '14.7 · Fatura em aberto', 'A FT2024/05530 no painel: em aberto, com o vencimento e a referência Multibanco, os valores, a guia, o pedido e os artigos.', faturasAberta),
  e('faturas-vencida', '14.8 · Fatura vencida', 'Uma fatura que já venceu: o pagamento a âmbar, o total da linha também, e a referência para pagar.', faturasVencida),
  e('faturas-primeira', '14.9 · Primeira vez', 'Um cliente novo, sem faturas: diz quando vão aparecer e leva ao catálogo.', faturasPrimeira),
];
