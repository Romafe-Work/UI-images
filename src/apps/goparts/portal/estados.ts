/* =========================================================
   GOPARTS — os estados do 10 · Início (v2.2) e do 11 · Catálogo (v2)
   12 out. 2026. Ela: «por baixo do screen 10 e 11 quero que cries os
   respetivos screens de loading, error… e faz 10.1, 10.2…».
   Cada estado parte do HTML do ecrã (inicio-v22.html, catalogo-v2.html) e
   muda só o que esse estado muda, pelo DOM de um <template>: carregar,
   pesquisar, sem resultados, erros de formulário, sem ligação, falha de uma
   parte e vazio. As regras são as dos ecrãs de carregamento e de erro:
   o esqueleto tem a forma do que vem; cada erro diz o que aconteceu, o que
   fazer, e dá uma saída com ícone e texto.
   ========================================================= */
import type { EcraGoParts, IdGoParts } from '../ids';
import { portal } from './base';
import inicioV22 from './inicio-v22.html?raw';
import catalogoV2 from './catalogo-v2.html?raw';
import { catalogoV3 } from './catalogo-v3';
import { mostrar, passos, encherModelos, encherVeiculos } from '../comportamento/catalogo-v3';
import { catalogoV5 } from './catalogo-v5';
import { abrirReferencias, escolherGrupo, ramo } from '../comportamento/catalogo-v5';
import pedidosV2 from './pedidos-v2.html?raw';

export type IdEstadoInicio = 'inicio-carga' | 'inicio-modelos' | 'inicio-pesquisa' | 'inicio-sem-resultados' | 'inicio-formulario' | 'inicio-rede' | 'inicio-falha' | 'inicio-vazio';
export type IdEstadoPedidos = 'pedidos-carga' | 'pedidos-filtrar' | 'pedidos-vazio' | 'pedidos-datas' | 'pedidos-rede' | 'pedidos-falha';
export type IdEstadoCatalogo = 'catalogo-carga' | 'catalogo-identificar' | 'catalogo-nao-encontrada' | 'catalogo-formulario' | 'catalogo-modelos' | 'catalogo-procura' | 'catalogo-sem-favoritas' | 'catalogo-falha' | 'catalogo-lista-modelos' | 'catalogo-veiculos' | 'catalogo-referencias' | 'catalogo-universal';

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
const GIRADOR = (cls = '') => `<span class="girador${cls ? ' ' + cls : ''}" aria-hidden="true"></span>`;
const E = (largura: number | string, cls = '') => `<span class="esq${cls ? ' ' + cls : ''}" style="width:${typeof largura === 'number' ? largura + '%' : largura}"></span>`;
const APOIO = `<p class="est-apoio">${I(IC.telefone)}<span>Apoio Romafe · <strong>+351 226 158 300</strong></span></p>`;

/* ---------- mexer no HTML de um ecrã pelo DOM ---------- */
function mudar(html: string, prefixo: string, f: (raiz: HTMLElement) => void): string {
  const t = document.createElement('template');
  /* ids próprios em cada estado: o mesmo id em dois ecrãs liga o rótulo ao campo errado */
  t.innerHTML = html.replace(/\b(v22|cat2|cat3|cat4|cat5|ped2)-/g, `${prefixo}-`);
  const raiz = t.content.firstElementChild as HTMLElement;
  f(raiz);
  return raiz.outerHTML;
}
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));

/** Põe ao centro do carrossel da v2.2 o cartão i (0 Identificar, 1 Selecionar, 2 Pesquisar). */
function centro(r: HTMLElement, i: number): void {
  const n = 3;
  $$(r, '.c22__cartao').forEach((c, j) => {
    c.classList.remove('is-ant', 'is-atual', 'is-seg');
    const d = (j - i + n) % n;
    c.classList.add(d === 0 ? 'is-atual' : d === 1 ? 'is-seg' : 'is-ant');
    if (d === 0) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
  });
  $$(r, '.carrossel__ponto').forEach((p, j) => p.classList.toggle('is-atual', j === i));
}
/** O botão principal de um cartão em «a carregar». */
function aCarregar(b: HTMLElement, texto: string): void {
  b.classList.add('is-a-carregar');
  b.setAttribute('disabled', '');
  b.innerHTML = `${GIRADOR('girador--claro')}<span class="btn__rotulo">${texto}</span>`;
}
const iniciar = (html: string, extra = '') => portal('inicio', html.replace('portal--noite', `portal--noite portal--estado ${extra}`), undefined, { menu: true, rodape: false });
const catalogo = (html: string, extra = '') => portal('catalogo', html.replace('portal--noite', `portal--noite portal--estado ${extra}`), undefined, { menu: true, rodape: false });
/** Os estados do catálogo são parados: sem data-catalogo, o comportamento não lhes mexe. */
const parado = (r: HTMLElement) => {
  $$(r, '[data-catalogo]').forEach((x) => x.removeAttribute('data-catalogo'));
  /* o separador ativo é «Favoritas»: só elas à vista, como o comportamento faria */
  $$(r, '.cat2__marca:not([data-favorita])').forEach((m) => m.setAttribute('hidden', ''));
};

/* ================= 10 · Início ================= */

/* 10.1 · esqueleto: a forma do carrossel, das categorias e dos dois cartões */
function inicioCarga(): string {
  const cartao = (cls: string, linhas: number) => `<div class="est-cartao ${cls}" aria-hidden="true">
      <div class="est-cartao__cabeca">${E('64px', 'esq--escuro est-quadrado')}<div>${E('60%', 'esq--escuro esq--titulo')}${E('80%', 'esq--escuro esq--texto')}</div></div>
      ${Array.from({ length: linhas }, () => `<div class="est-campo">${E(30, 'esq--escuro esq--rotulo')}${E('100%', 'esq--escuro esq--campo')}</div>`).join('')}
    </div>`;
  return iniciar(`<div class="portal portal--v3 portal--v22 portal--noite">
  <main class="c22" aria-busy="true">
    <p class="sr-only" role="status">A carregar o Início</p>
    <div class="est-carrossel">${cartao('est-cartao--lado', 2)}${cartao('est-cartao--centro', 4)}${cartao('est-cartao--lado', 2)}</div>
    <div class="c22__pontos" aria-hidden="true"><span class="carrossel__ponto"></span><span class="carrossel__ponto is-atual"></span><span class="carrossel__ponto"></span></div>
    <div class="inicio-mais" aria-hidden="true">
      <div class="est-linha">${E('180px', 'esq--titulo')}</div>
      <div class="est-chips">${Array.from({ length: 10 }, (_, i) => E(`${90 + (i % 3) * 22}px`, 'esq--botao')).join('')}</div>
      <div class="recentes">${[0, 1].map(() => `<div class="cartao4">${E('40%', 'esq--titulo')}${Array.from({ length: 3 }, () => `<div class="est-lista">${E('62%', 'esq--texto')}${E('18%', 'esq--texto')}</div>`).join('')}</div>`).join('')}</div>
    </div>
  </main>
</div>`);
}

/* 10.2 · a marca escolhida, os modelos a carregar */
const inicioModelos = () => iniciar(mudar(inicioV22, 'e102', (r) => {
  centro(r, 1);
  const marca = $<HTMLSelectElement>(r, '#e102-marca');
  marca.innerHTML = '<option>Renault</option>';
  const modelo = $(r, '#e102-modelo').closest('.campo__caixa')!;
  modelo.outerHTML = `<div class="cg-select est-select">${GIRADOR('girador--pequeno girador--claro')}<span>A carregar os modelos da Renault…</span></div>`;
  $(r, '.c22__cartao.is-atual .c22__botao').setAttribute('disabled', '');
}));

/* 10.3 · a pesquisar uma referência */
const inicioPesquisa = () => iniciar(mudar(inicioV22, 'e103', (r) => {
  centro(r, 2);
  $<HTMLInputElement>(r, '#e103-referencia').setAttribute('value', 'VKBA 3525');
  aCarregar($(r, '.c22__cartao.is-atual .c22__botao'), 'A pesquisar…');
  $(r, '.c22__cartao.is-atual .c22__form').insertAdjacentHTML('afterend', `<div class="est-progresso"><div class="progresso progresso--indeterminado progresso--fino" aria-hidden="true"><span></span></div><p role="status">A procurar VKBA 3525 e as equivalências…</p></div>`);
}));

/* 10.4 · a referência não existe */
const inicioSemResultados = () => iniciar(mudar(inicioV22, 'e104', (r) => {
  centro(r, 2);
  $<HTMLInputElement>(r, '#e104-referencia').setAttribute('value', '0986 4B 99X');
  $(r, '.c22__cartao.is-atual .c22__form').insertAdjacentHTML('afterend', `<div class="est-aviso" role="alert">
      ${I(IC.caixa)}<div><p class="est-aviso__titulo">Não encontrámos a referência 0986 4B 99X</p>
      <p>Pode ser um carácter trocado. Procure só o início (<strong>0986 4B</strong>), inclua as de origem (OE), ou pesquise pela matrícula.</p>
      <div class="est-aviso__botoes">${BOTAO('Procurar 0986 4B', IC.lupa, 'btn--claro btn--sm')}${BOTAO('Pesquisar pela matrícula', IC.carro, 'btn--claro btn--sm')}</div></div></div>`);
}));

/* 10.5 · erros no formulário (Identificar veículo) */
const inicioFormulario = () => iniciar(mudar(inicioV22, 'e105', (r) => {
  centro(r, 0);
  const erro = (id: string, valor: string, msg: string) => {
    const i = $<HTMLInputElement>(r, `#${id}`);
    i.setAttribute('value', valor); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${id}-msg`);
    i.closest('.campo')!.classList.add('campo--erro');
    i.closest('.campo')!.insertAdjacentHTML('beforeend', `<p class="campo__erro" id="${id}-msg">${I(IC.aviso)}${msg}</p>`);
  };
  erro('e105-matricula', 'AA-0-BB', 'A matrícula tem 6 letras ou números: AA-00-BB.');
  erro('e105-chassis', 'VF1RFB00X5', 'O n.º de chassis tem 17 caracteres. Este tem 10.');
  $(r, '.c22__cartao.is-atual .c22__form').insertAdjacentHTML('beforebegin', `<div class="est-aviso est-aviso--erro" role="alert">${I(IC.aviso)}<div><p class="est-aviso__titulo">Há 2 campos a corrigir</p></div></div>`);
}));

/* 10.6 · sem ligação: uma faixa em cima, o que já estava continua à vista */
const inicioRede = () => iniciar(mudar(inicioV22, 'e106', (r) => {
  $(r, '.c22').insertAdjacentHTML('afterbegin', `<div class="er-faixa est-faixa" role="alert">${I(IC.semrede)}<span><strong>Sem ligação à internet.</strong> Está a ver o Início de há 4 minutos. Pesquisar volta quando a ligação voltar.</span>${BOTAO('Tentar de novo', IC.denovo, 'btn--ghost btn--sm')}</div>`);
  $$(r, '.c22__botao, .heroi2__botao').forEach((b) => { b.setAttribute('disabled', ''); b.setAttribute('title', 'Sem ligação'); });
  r.classList.add('est-desligado');
}));

/* 10.7 · uma parte falhou: os Últimos pedidos não carregaram */
const inicioFalha = () => iniciar(mudar(inicioV22, 'e107', (r) => {
  const lista = $$(r, '.cartao4')[1].querySelector('.cartao4__lista')!;
  lista.outerHTML = `<div class="cg-falha est-falha">${I(IC.aviso)}<div><p class="cg-falha__titulo">Não foi possível carregar os últimos pedidos</p><p class="cg-falha__texto">O resto do Início está bem. Tente de novo; se continuar, ligue para o apoio.</p></div>${BOTAO('Tentar de novo', IC.denovo, 'btn--ghost btn--sm')}</div>`;
}));

/* 10.8 · primeira vez: ainda sem pesquisas nem pedidos */
const inicioVazio = () => iniciar(mudar(inicioV22, 'e108', (r) => {
  const [pesq, ped] = $$(r, '.cartao4');
  pesq.querySelector('.cartao4__lista')!.outerHTML = `<div class="est-vazio">${I(IC.lupa)}<p><strong>Ainda não pesquisou nada.</strong> As últimas pesquisas aparecem aqui, para as repetir com um clique.</p></div>`;
  ped.querySelector('.cartao4__lista')!.outerHTML = `<div class="est-vazio">${I(IC.caixa)}<p><strong>Ainda não tem pedidos.</strong> Quando encomendar, acompanha-os aqui.</p>${BOTAO('Ver o catálogo', IC.grelha, 'btn--ghost btn--sm', ' data-ir="catalogo"')}</div>`;
  $$(r, '.cartao4 .mais').forEach((a) => a.remove());
}));

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
const catalogoModelos = () => catalogo(mudar(catalogoV2, 'e115', (r) => {
  parado(r);
  $$(r, '.cat2__passo').forEach((b) => { b.removeAttribute('aria-current'); if (b.dataset.passo === '1') { b.setAttribute('aria-current', 'true'); b.removeAttribute('disabled'); } });
  $(r, '.cat2__marcas-cabeca').setAttribute('hidden', '');
  $(r, '.cat2__grelha').setAttribute('hidden', '');
  const m = $(r, '.cat2__modelos');
  m.removeAttribute('hidden');
  $(r, '.cat2__escolhida').textContent = '· Renault';
  $(r, '.cat2__exemplo').innerHTML = `${GIRADOR('girador--pequeno')} A carregar modelos…`;
  $(r, '.cat2__lista-modelos').innerHTML = Array.from({ length: 5 }, () => `<li class="est-modelo">${E('60%', 'esq--titulo')}${E('35%', 'esq--texto')}</li>`).join('');
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
const catalogoListaModelos = () => catalogo(mudar(catalogoV3, 'e119', (r) => {
  parado(r);
  const main = $(r, '.cat3');
  encherModelos(main, 'BMW');
  mostrar(main, 'modelos');
  passos(r, 1);
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

/* 11.11 · v5: as referências do BMW 1 (E81) 118d, com a SKF e duas marcadas para comparar */
const catalogoReferencias = () => catalogo(mudar(catalogoV5, 'e1111', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  Object.assign(main.dataset, { marca: 'BMW', modelo: '1 (E81)', versao: '118d' });
  abrirReferencias(main, '', ['SKF'], 'veiculo');
  mostrar(main, 'referencias');
  passos(r, 4);
  const logo = $(r, '.cat2__marca[data-nome="BMW"] .cat2__logo');
  $(r, '.cat5__logo').innerHTML = logo.outerHTML;
  $(r, '.cat5__m-marca').textContent = 'BMW';
  $(r, '.cat5__m-modelo').textContent = '1 (E81)';
  /* duas marcadas: o «Comparar (2)» fica ativo */
  $$<HTMLInputElement>(r, '.cat5__refs tbody input[type="checkbox"]').slice(0, 2).forEach((c) => { c.setAttribute('checked', ''); c.closest('tr')!.classList.add('is-marcada'); });
  $(r, '.cat5__n-comparar').textContent = '2';
  $(r, '.cat5__comparar').removeAttribute('disabled');
}));

/* 11.12 · v5: o Universal, com «Comando da correia» aberto e o Kit de distribuição escolhido */
const catalogoUniversal = () => catalogo(mudar(catalogoV5, 'e1112', (r) => {
  parado(r);
  const main = $(r, '.cat5');
  mostrar(main, 'universal');
  passos(r, 6, 0);
  const b = $$(r, '.cat5__abrir-ramo').find((x) => (x.textContent || '').includes('Comando da correia'))!;
  ramo(b, true);
  escolherGrupo(main, 'Kit de distribuição');
}));

/* ================= 12 · Pedidos ================= */
const pedidos = (html: string) => portal('pedidos', html.replace('portal--noite', 'portal--noite portal--estado'), undefined, { menu: true, rodape: false });
const semPedidos = (r: HTMLElement) => $$(r, '[data-pedidos]').forEach((x) => x.removeAttribute('data-pedidos'));
const linhasEsq = (n: number) => Array.from({ length: n }, (_, i) => `<tr>${[70, 55, 50, 85, 45, 60, 45, 55, 40].map((c) => `<td>${E(Math.max(30, c - (i % 3) * 10), 'esq--texto')}</td>`).join('')}</tr>`).join('');
const erroCampo = (r: HTMLElement, id: string, valor: string, msg: string) => {
  const i = $<HTMLInputElement>(r, `#${id}`);
  i.setAttribute('value', valor); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', `${id}-msg`);
  i.closest('.campo')!.classList.add('campo--erro');
  i.closest('.campo')!.insertAdjacentHTML('beforeend', `<p class="campo__erro" id="${id}-msg">${I(IC.aviso)}${msg}</p>`);
};

/* 12.1 · esqueleto: os filtros já lá estão; o resumo e as linhas chegam */
const pedidosCarga = () => pedidos(mudar(pedidosV2, 'e121', (r) => {
  semPedidos(r);
  $(r, '.ped2').setAttribute('aria-busy', 'true');
  $(r, '.ped2__resumo').innerHTML = `${E('130px', 'esq--botao')}${E('170px', 'esq--botao')}`;
  $(r, 'tbody').innerHTML = linhasEsq(7);
  $$(r, '.ped2__n').forEach((n) => n.remove());
  $(r, '.ped2__pe').innerHTML = `<span role="status">${GIRADOR('girador--pequeno')} A carregar os pedidos…</span>`;
}));

/* 12.2 · a pesquisar com filtros: o botão espera, as linhas antigas esbatem */
const pedidosFiltrar = () => pedidos(mudar(pedidosV2, 'e122', (r) => {
  semPedidos(r);
  $<HTMLInputElement>(r, '#e122-ref').setAttribute('value', 'VKBA 3525');
  aCarregar($(r, '.ped2__pesquisar'), 'A pesquisar…');
  $(r, '.ped2__tabela').insertAdjacentHTML('afterbegin', '<div class="progresso progresso--indeterminado progresso--fino" aria-hidden="true"><span></span></div>');
  $(r, '.ped2__tabela tbody').classList.add('est-esbatido');
  $(r, '.ped2__pe').innerHTML = `<span role="status">${GIRADOR('girador--pequeno')} A procurar pedidos com a referência VKBA 3525…</span>`;
}));

/* 12.3 · sem pedidos no período */
const pedidosVazio = () => pedidos(mudar(pedidosV2, 'e123', (r) => {
  semPedidos(r);
  $<HTMLInputElement>(r, '#e123-de').setAttribute('value', '01/10/2026');
  $(r, '.ped2__conta').textContent = '0';
  $(r, '.ped2__total').textContent = '0,00 €';
  $$(r, '.ped2__n').forEach((n) => { n.textContent = '0'; });
  $(r, 'tbody').innerHTML = '';
  $(r, '.ped2__vazio').outerHTML = `<div class="est-vazio est-vazio--largo est-vazio--tabela">${I(IC.caixa)}<p><strong>Nenhum pedido desde 01/10/2026.</strong> O último pedido da conta foi a 15/04/2024.</p><div class="est-aviso__botoes">${BOTAO('Ver o último ano', IC.denovo, 'btn--ghost btn--sm')}${BOTAO('Ver o catálogo', IC.grelha, 'btn--acao btn--sm', ' data-ir="catalogo"')}</div></div>`;
  $(r, '.ped2__pe').innerHTML = '<span>A mostrar 0 · de 01/10/2026 até hoje</span>';
}));

/* 12.4 · erro nas datas */
const pedidosDatas = () => pedidos(mudar(pedidosV2, 'e124', (r) => {
  semPedidos(r);
  erroCampo(r, 'e124-ate', '01/02/2024', '«Data até» é antes de «Data a partir de» (01/03/2024).');
  erroCampo(r, 'e124-num', 'P24-1256', 'O n.º do pedido escreve-se P2024/001256.');
  $(r, '.ped2__campos').insertAdjacentHTML('beforebegin', `<div class="est-aviso est-aviso--erro" role="alert">${I(IC.aviso)}<div><p class="est-aviso__titulo">Há 2 campos a corrigir antes de pesquisar</p></div></div>`);
  $(r, '.ped2__campos').classList.add('est-com-erros');
}));

/* 12.5 · sem ligação */
const pedidosRede = () => pedidos(mudar(pedidosV2, 'e125', (r) => {
  semPedidos(r);
  $(r, '.ped2').insertAdjacentHTML('afterbegin', `<div class="er-faixa est-faixa" role="alert">${I(IC.semrede)}<span><strong>Sem ligação à internet.</strong> Está a ver os pedidos de há 4 minutos. Pesquisar volta quando a ligação voltar.</span>${BOTAO('Tentar de novo', IC.denovo, 'btn--ghost btn--sm')}</div>`);
  const b = $(r, '.ped2__pesquisar'); b.setAttribute('disabled', ''); b.setAttribute('title', 'Sem ligação');
  $(r, '.ped2__tabela tbody').classList.add('est-esbatido');
}));

/* 12.6 · a tabela não carregou */
const pedidosFalha = () => pedidos(mudar(pedidosV2, 'e126', (r) => {
  semPedidos(r);
  $(r, '.ped2__resumo').innerHTML = '';
  $(r, 'tbody').innerHTML = '';
  $(r, '.ped2__vazio').outerHTML = `<div class="cg-falha est-falha est-falha--largo est-falha--tabela">${I(IC.aviso)}<div><p class="cg-falha__titulo">Não foi possível carregar os pedidos</p><p class="cg-falha__texto">Os filtros ficaram como estavam. Referência do erro: <code>GP-20261012-5E19</code></p>${APOIO}</div>${BOTAO('Tentar de novo', IC.denovo, 'btn--ghost btn--sm')}</div>`;
  $(r, '.ped2__pe').remove();
}));

/* ---------- a lista: cada estado logo a seguir ao seu ecrã ---------- */
const PAI: Record<string, IdGoParts> = { inicio: 'inicio', catalogo: 'catalogo', pedidos: 'pedidos' };
const e = (id: IdGoParts, nome: string, objetivo: string, html: () => string): EcraGoParts =>
  ({ id, nome, fluxo: 'Portal', objetivo, estadoDe: PAI[id.split('-')[0]], versoes: [{ id: 'v1', nota: 'No estilo do ecrã de cima (12 out.)', html: html() }] });

export const estadosInicio = (): EcraGoParts[] => [
  e('inicio-carga', '10.1 · A carregar o Início', 'O Início com a forma do carrossel, das categorias e dos dois cartões em esqueleto: quando chegam, nada salta.', inicioCarga),
  e('inicio-modelos', '10.2 · A carregar modelos', 'Escolhida a marca, o campo Modelo diz o que está a vir; o botão espera por ele.', inicioModelos),
  e('inicio-pesquisa', '10.3 · A pesquisar a referência', 'O botão em «A pesquisar…» e uma barra fina com o que se procura.', inicioPesquisa),
  e('inicio-sem-resultados', '10.4 · Referência sem resultados', 'A referência não existe: dentro do cartão, o que pode estar mal e dois caminhos.', inicioSemResultados),
  e('inicio-formulario', '10.5 · Erros no formulário', 'Identificar veículo com dois campos errados: quantos são, e cada campo diz como deve ser.', inicioFormulario),
  e('inicio-rede', '10.6 · Sem ligação', 'Uma faixa em cima, o Início de há pouco à vista, e as pesquisas desligadas até a ligação voltar.', inicioRede),
  e('inicio-falha', '10.7 · Os pedidos não carregaram', 'Só uma parte falhou: o cartão diz qual, o resto continua a funcionar, e «Tentar de novo».', inicioFalha),
  e('inicio-vazio', '10.8 · Primeira vez', 'Um cliente novo: sem pesquisas nem pedidos, cada cartão diz o que vai aparecer ali.', inicioVazio),
];
export const estadosCatalogo = (): EcraGoParts[] => [
  e('catalogo-carga', '11.1 · A carregar o Catálogo', 'O cartão da pesquisa e a grelha das marcas em esqueleto.', catalogoCarga),
  e('catalogo-identificar', '11.2 · A identificar o veículo', 'A matrícula escrita, o botão em «A identificar…» e uma barra fina.', catalogoIdentificar),
  e('catalogo-nao-encontrada', '11.3 · Matrícula não encontrada', 'Nenhum veículo com aquela matrícula: porquê pode ser e o que tentar.', catalogoNaoEncontrada),
  e('catalogo-formulario', '11.4 · Erros no formulário', 'Matrícula e chassis com o formato errado, cada um com a correção.', catalogoFormulario),
  e('catalogo-modelos', '11.5 · A carregar modelos', 'Escolhida a marca, o passo Modelos fica ativo e os modelos chegam em esqueleto.', catalogoModelos),
  e('catalogo-procura', '11.6 · Marca não encontrada', 'A procura de marca não encontra nada: sugere a escrita certa e outro caminho.', catalogoProcura),
  e('catalogo-sem-favoritas', '11.7 · Sem favoritas', 'Ainda sem favoritas: explica a estrela e leva a «Todas».', catalogoSemFavoritas),
  e('catalogo-falha', '11.8 · As marcas não carregaram', 'A grelha falhou: o que continua a funcionar, a referência do erro, o apoio e «Tentar de novo».', catalogoFalha),
  e('catalogo-lista-modelos', '11.9 · Modelos da marca', 'Catálogo v3: escolhida a BMW, a tabela dos modelos com Fabricado desde e até; os filtros Modelo e Ano no cartão azul.', catalogoListaModelos),
  e('catalogo-veiculos', '11.10 · Veículos do modelo', 'Catálogo v3: os veículos do Scénic II com motor, kW, cv, cc, tração e carroçaria; o 1.5 dCi escolhido acende «Grupo montagem».', catalogoVeiculos),
  e('catalogo-referencias', '11.11 · Referências', 'Catálogo v5: as peças do BMW 1 (E81) 118d com a SKF, preço, desconto, líquido e stock no Porto e em Sacavém; duas marcadas para comparar.', catalogoReferencias),
  e('catalogo-universal', '11.12 · Universal', 'Catálogo v5: os grupos de montagem sem veículo, em árvore; o Kit de distribuição escolhido mostra os fabricantes e «Ver referências».', catalogoUniversal),
];
export const estadosPedidos = (): EcraGoParts[] => [
  e('pedidos-carga', '12.1 · A carregar os pedidos', 'Os filtros já à vista; o resumo e as linhas da tabela chegam em esqueleto.', pedidosCarga),
  e('pedidos-filtrar', '12.2 · A pesquisar', 'Com uma referência escrita: o botão em «A pesquisar…», uma barra fina por cima da tabela e as linhas antigas esbatidas.', pedidosFiltrar),
  e('pedidos-vazio', '12.3 · Sem pedidos no período', 'Nenhum pedido nas datas escolhidas: diz quando foi o último e dá dois caminhos.', pedidosVazio),
  e('pedidos-datas', '12.4 · Erro nos filtros', 'A data final antes da inicial e o n.º mal escrito: cada campo diz como deve ser.', pedidosDatas),
  e('pedidos-rede', '12.5 · Sem ligação', 'Uma faixa em cima, os pedidos de há pouco esbatidos e a pesquisa desligada.', pedidosRede),
  e('pedidos-falha', '12.6 · Os pedidos não carregaram', 'A tabela falhou: os filtros ficam, a referência do erro, o apoio e «Tentar de novo».', pedidosFalha),
];
