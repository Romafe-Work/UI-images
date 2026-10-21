/* =========================================================
   PEÇA A PEÇA — 10 · Início V10: a montra (21 out. 2026)
   Dos briefings «The Living Machine» e «Beyond the Dashboard» (ela: «o Início passa a ser a montra do Peça a
   Peça»). Deixa de ser um painel: é uma página para encontrar peças, com o rolamento como fio condutor.
   1. Abertura: à esquerda «A peça certa. À primeira.», «Encontrar peças», «Explorar catálogo», os três atalhos
      da pesquisa (Matrícula, Veículo, Referência) e, discreto, o que a conta tem em curso e o que é urgente;
      à direita o SKF 6206 em 3D, grande.
   2. O rolamento vivo: a mesma cena fica presa enquanto se desce; o scroll desmonta-o (anel exterior, gaiola,
      esferas, anel interior) e acaba em «Da engenharia à peça certa.» → «Explorar rolamentos».
   3. «Encontra o que procuras.»: os grupos que o catálogo tem de facto, com o número de referências.
   4. «Precisão em cada componente.»: uma referência verdadeira do catálogo (preço líquido, stock, equivalentes).
   5. «Continuar de onde ficaste»: o pedido em curso, o veículo favorito e a lista em rascunho — só o que existe.
   6. No fim, outra vez a pesquisa.
   Os desenhos das peças são ilustrativos (pecas-img.ts); não há fotografias inventadas nem especificações a mais.
   Comportamento: comportamento/montra.ts. CSS: css/montra.css.
   ========================================================= */
import { REFERENCIAS, saida } from './catalogo-dados';
import { LINHAS_TODAS, alertasPn, euros } from './painel-dados';
import { PEDIDOS } from './pedidos-dados';
import { GARAGEM, nomeCarro, saudacao, liquido, L } from './inicio-espaco';
import { LISTAS } from './lista';
import { azulejoPeca } from './pecas-img';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import car from 'lucide-static/icons/car.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import packageIcon from 'lucide-static/icons/package.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import scanSearch from 'lucide-static/icons/scan-search.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import trendingUp from 'lucide-static/icons/trending-up.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';

export type EstadoMontra = '' | 'carga' | 'primeira' | 'sem-3d' | 'offline' | 'sessao' | 'parcial';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const btn = (texto: string, icone: string, extra = '', cls = '') => `<button type="button" class="btn mt__btn${cls ? ` ${cls}` : ''}"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

/* ---------- 1 + 2. A abertura e o rolamento vivo (uma só cena, presa enquanto se desce) ---------- */
function abertura(e: EstadoMontra): string {
  const agora = new Date();
  const emCurso = e === 'primeira' ? 0 : LINHAS_TODAS.filter((x) => x.etapa.k !== 'concluido').length;
  const urgentes = e === 'primeira' ? [] : alertasPn().filter((a) => a.grupo === 'urgente');
  const conta = e === 'primeira' ? '' : `<p class="mt__conta">
      <button type="button" class="mt__conta-item" data-pn-ir="pedidos">${L(packageIcon)}<span><b>${emCurso}</b> ${emCurso === 1 ? 'pedido em curso' : 'pedidos em curso'}</span>${L(arrowRight, 'mt__seta')}</button>
      ${urgentes.length ? `<button type="button" class="mt__conta-item mt__conta-item--urgente"${urgentes[0].attr}>${L(triangleAlert)}<span><b>${urgentes.length}</b> ${urgentes[0].titulo.toLowerCase()}${urgentes.length > 1 ? ' e mais' : ''}</span>${L(arrowRight, 'mt__seta')}</button>` : ''}
    </p>`;
  const ids = Object.keys(EXEMPLOS_TEXTO) as IdExemplo[];
  const passo = (ex: IdExemplo, i: number, titulo: string, texto: string) => `<div class="mt__passo" data-mt-passo="${i}" data-ex="${ex}" aria-hidden="true"><p class="mt__passo-n">0${i}</p><h2 class="mt__passo-t">${titulo}</h2><p>${texto}</p></div>`;
  return `<section class="mt__palco" data-mt-palco aria-labelledby="mt-t">
    <div class="mt__fixo">
      <div class="mt__texto">
        <div class="mt__heroi" data-mt-heroi>
          <p class="mt__ola">${saudacao(agora.getHours())}, Fernando · Conta Porto</p>
          <h1 class="mt__titulo" id="mt-t">A peça certa.<br><span>À primeira.</span></h1>
          <p class="mt__lead">Encontra componentes, confirma referências e encomenda com a confiança de quem conhece o teu negócio.</p>
          <div class="mt__accoes">${btn('Encontrar peças', search, ' data-pn-ir="pesquisa"', 'btn--acao mt__btn--grande')}${btn('Explorar catálogo', layoutGrid, ' data-pn-ir="catalogo"', 'mt__btn--grande')}</div>
          <p class="mt__atalhos"><span>Pesquisar por</span>
            <button type="button" class="mt__atalho" data-pn-modo="0">${L(carFront)}Matrícula</button>
            <button type="button" class="mt__atalho" data-pn-modo="1">${L(car)}Veículo</button>
            <button type="button" class="mt__atalho" data-pn-modo="2">${L(hash)}Referência</button></p>
          ${conta}
        </div>
        ${ids.map((ex) => EXEMPLOS_TEXTO[ex].passos.map(([t, x], i) => passo(ex, i + 1, t, x)).join('')).join('')}
        ${ids.map((ex) => { const [t, x, b, attr] = EXEMPLOS_TEXTO[ex].fim; return `<div class="mt__fim" data-mt-fim data-ex="${ex}" aria-hidden="true"><h2 class="mt__fim-t">${t}</h2><p>${x}</p>${btn(b, arrowRight, `${attr} tabindex="-1"`, 'btn--acao mt__btn--grande')}</div>`; }).join('')}
      </div>
      <div class="mt__cena">
        <canvas class="mt__tela" aria-hidden="true"></canvas>
        <div class="mt__etiquetas" aria-hidden="true">${ids.map((ex) => Object.entries(EXEMPLOS_TEXTO[ex].pecas).map(([k, pc]) => `<div class="mt__insight" data-etq="${k}" data-ex="${ex}"><b>${pc.nome}</b><span>${pc.texto}</span><small>${pc.medida}</small></div>`).join('')).join('')}</div>
        <button type="button" class="mt__explorar" data-mt-explorar aria-pressed="false">${L(scanSearch)}<span>Explorar componente</span></button>
        <aside class="mt__painel3d" data-mt-painel3d hidden aria-live="polite">
          <header><p class="mt__painel3d-sub">Modo de exploração · arrasta para rodar</p><button type="button" class="mt__painel3d-x" data-mt-explorar-fechar aria-label="Sair da exploração">${L(x)}</button></header>
          ${ids.map((ex) => `<div class="mt__painel3d-pecas" data-ex="${ex}" role="group" aria-label="Escolhe uma peça">${Object.entries(EXEMPLOS_TEXTO[ex].pecas).map(([k, pc]) => `<button type="button" class="mt__peca-btn" data-mt-peca="${k}" aria-pressed="false">${pc.nome}</button>`).join('')}</div>`).join('')}
          <div class="mt__painel3d-info" data-mt-info><p class="mt__painel3d-dica">Toca numa peça do rolamento, ou escolhe-a acima.</p></div>
        </aside>
        <div class="mt__reserva"${e === 'sem-3d' ? '' : ' hidden'}>${rolamentoSvg('mt', 'carregar', 'mt__reserva-svg', 1)}<p>O modelo 3D não abriu neste navegador; a página funciona igual.</p></div>
        ${ids.map((ex) => `<p class="mt__nota-3d" data-ex="${ex}">${EXEMPLOS_TEXTO[ex].nota}</p>`).join('')}
      </div>
      <div class="mt__progresso" aria-hidden="true"><i data-mt-barra></i></div>
    </div>
  </section>`;
}

/* ---------- as três peças da montra (comportamento/modelos-3d.ts): o que se diz de cada uma ----------
   Uma por visita ao Início (ela: «pode mudar para um travão… quero 3 exemplos»). Os insights aparecem junto da peça
   quando ela sai (e somem quando volta ao sítio); são também o painel do modo «Explorar componente». Só o que se
   sabe do tipo de peça; as medidas só do 6206, que é o modelo à escala. */
export type IdExemplo = 'rolamento' | 'travao' | 'bomba';
type Peca = { nome: string; texto: string; medida: string };
type Exemplo = { modelo: string; nota: string; pecas: Record<string, Peca>; passos: [string, string][]; fim: [string, string, string, string] };
export const EXEMPLOS_TEXTO: Record<IdExemplo, Exemplo> = {
  rolamento: { modelo: 'SKF 6206 · rolamento rígido de esferas', nota: 'SKF 6206 · ilustrativo',
    pecas: {
      ext: { nome: 'Anel exterior', texto: 'Fica fixo no cubo da roda. A pista cavada na face de dentro guia as esferas.', medida: 'D 62 mm · B 16 mm' },
      gaiola: { nome: 'Gaiola', texto: 'Mantém as esferas à mesma distância umas das outras, para não se tocarem nem se juntarem de um lado.', medida: 'Duas metades, à volta das 9 esferas' },
      esferas: { nome: 'Esferas', texto: 'Rolam entre as duas pistas e levam a carga: é por elas que o rolamento roda com pouco atrito.', medida: '9 × 9,525 mm' },
      int: { nome: 'Anel interior', texto: 'Monta no eixo e roda com ele. A pista da face de fora é o caminho das esferas.', medida: 'd 30 mm · B 16 mm' } },
    passos: [['O anel exterior sai.', 'Fica à vista a pista onde as esferas rolam.'], ['A gaiola e as esferas.', 'Nove esferas de 9,525 mm, guardadas pela gaiola à mesma distância.'], ['Cada peça no seu eixo.', 'A vista explodida do SKF 6206, pela ordem em que se monta.']],
    fim: ['Da engenharia à peça certa.', 'Os rolamentos de roda do catálogo, com o preço da tua conta e o stock de agora.', 'Explorar rolamentos', ' data-mt-grupo="Rolamento de roda"'] },
  travao: { modelo: 'Travão de disco · pinça flutuante', nota: 'Travão de disco · ilustrativo',
    pecas: {
      pinca: { nome: 'Pinça', texto: 'Abraça o disco e aperta as pastilhas contra ele quando se trava.', medida: 'Flutuante, com um êmbolo' },
      pastilhas: { nome: 'Pastilhas', texto: 'O material de atrito, uma de cada lado do disco. Gastam-se e trocam-se aos pares, por eixo.', medida: 'Uma de cada lado do disco' },
      embolo: { nome: 'Êmbolo', texto: 'Empurrado pelo líquido de travões, encosta a pastilha de dentro ao disco.', medida: 'Dentro da pinça, do lado de dentro' },
      disco: { nome: 'Disco', texto: 'Roda com a roda. Ventilado: as aletas entre as duas faces deixam passar o ar e tiram o calor da travagem.', medida: 'Duas faces e o chapéu ao centro' } },
    passos: [['A pinça abre-se.', 'Sobe e deixa ver as pastilhas, uma de cada lado do disco.'], ['As pastilhas e o êmbolo.', 'O êmbolo empurra a pastilha de dentro; a pinça puxa a de fora.'], ['Tudo no mesmo eixo.', 'O disco ventilado ao centro, com o calor a sair pelas aletas.']],
    fim: ['Travar bem, peça a peça.', 'Pastilhas, discos e o que vai com eles, com o preço da tua conta.', 'Pesquisar travagem', ' data-mt-pesquisar="Pastilhas de travão" data-mt-modo="2"'] },
  bomba: { modelo: 'Bomba de água · motor', nota: 'Bomba de água · ilustrativo',
    pecas: {
      polia: { nome: 'Polia', texto: 'Recebe o movimento da correia e faz rodar o veio da bomba.', medida: 'Com as gargantas da correia' },
      rotor: { nome: 'Rotor', texto: 'As pás empurram o líquido de refrigeração pelo motor e pelo radiador.', medida: 'Do lado de dentro, no líquido' },
      veio: { nome: 'Veio e rolamento', texto: 'O rolamento segura o veio a rodar; o vedante impede o líquido de sair por ali.', medida: 'Um só conjunto' },
      corpo: { nome: 'Corpo', texto: 'Aparafusa ao bloco do motor; a junta veda contra o líquido de refrigeração.', medida: 'Com a flange e os furos' } },
    passos: [['A polia sai.', 'É ela que a correia faz rodar.'], ['O rotor e o veio.', 'O rotor empurra o líquido; o veio, num rolamento, liga-o à polia.'], ['A bomba aberta.', 'Polia, veio, corpo e rotor, pela ordem em que se montam.']],
    fim: ['O motor fresco, peça a peça.', 'As bombas de água do catálogo, com o preço da tua conta e o stock de agora.', 'Explorar bombas de água', ' data-mt-grupo="Bomba de água"'] },
};
/** (compatibilidade) as peças do rolamento */
export const PECAS = EXEMPLOS_TEXTO.rolamento.pecas;
export type IdPeca = string;

/* ---------- 3. Os mais pesquisados ----------
   Dados de exemplo (no servidor, as pesquisas da conta nos últimos 30 dias). Cada um volta à pesquisa, já escrito. */
export const MAIS_PESQUISADOS: { termo: string; tipo: 'ref' | 'mat' | 'texto'; vezes: number }[] = [
  { termo: 'SKF VKBA 6556', tipo: 'ref', vezes: 14 }, { termo: 'AA-12-BC', tipo: 'mat', vezes: 11 }, { termo: 'Pastilhas de travão', tipo: 'texto', vezes: 9 },
  { termo: 'Kit de distribuição', tipo: 'texto', vezes: 8 }, { termo: 'Filtro de óleo', tipo: 'texto', vezes: 6 }, { termo: 'VKMV 6PK1873', tipo: 'ref', vezes: 5 },
];
const TIPO_PESQ = { ref: ['Referência', hash, 2], mat: ['Matrícula', carFront, 0], texto: ['Pesquisa', search, 2] } as const;
function maisPesquisados(e: EstadoMontra): string {
  const max = Math.max(...MAIS_PESQUISADOS.map((m) => m.vezes));
  if (e === 'carga') return `<section class="mt__sec" aria-busy="true"><h2 class="mt__sec-t">Os mais pesquisados.</h2><ol class="mt__top">${MAIS_PESQUISADOS.map((_, i) => `<li class="mt__top-esq" style="--i:${i}" aria-hidden="true"></li>`).join('')}</ol></section>`;
  if (e === 'primeira') return '';
  return `<section class="mt__sec" aria-labelledby="mt-top-t">
    <header class="mt__sec-cabeca"><div><h2 class="mt__sec-t" id="mt-top-t">Os mais pesquisados.</h2><p class="mt__sec-sub">${L(history)}O que a tua conta mais procurou nos últimos 30 dias · dados de exemplo</p></div><button type="button" class="mt__mais" data-pn-ir="pesquisa">Nova pesquisa${L(arrowRight)}</button></header>
    <ol class="mt__top" role="list">${MAIS_PESQUISADOS.map((m, i) => { const [nome, ic, modo] = TIPO_PESQ[m.tipo]; return `<li style="--i:${i}"><button type="button" class="mt__top-item" data-mt-pesquisar="${esc(m.termo)}" data-mt-modo="${modo}">
      <span class="mt__top-n">${String(i + 1).padStart(2, '0')}</span>
      <span class="mt__top-texto"><b>${esc(m.termo)}</b><small>${L(ic)}${nome} · ${m.vezes}×</small></span>
      <span class="mt__top-barra" aria-hidden="true"><i style="--v:${(m.vezes / max).toFixed(2)}"></i></span>
      ${L(arrowRight, 'mt__seta')}
    </button></li>`; }).join('')}</ol>
  </section>`;
}

/* ---------- 4. As mais compradas e o que vai com elas (contado dos pedidos da conta) ----------
   Uma faixa de cartões que anda sozinha (para com o rato, o foco ou «reduzir movimento»). Cada cartão: a peça,
   quantas unidades e em quantos pedidos, e as que foram nos mesmos pedidos. As do catálogo abrem a ficha; as
   outras, a pesquisa já escrita. */
type Comprada = { desc: string; qtd: number; pedidos: number; juntas: string[] };
export function maisCompradas(): Comprada[] {
  const m = new Map<string, Comprada>();
  PEDIDOS.forEach((p) => p.artigos.forEach(([q, , d]) => { const c = m.get(d) ?? { desc: d, qtd: 0, pedidos: 0, juntas: [] }; c.qtd += q; c.pedidos++; p.artigos.forEach(([, , o]) => { if (o !== d && !c.juntas.includes(o)) c.juntas.push(o); }); m.set(d, c); }));
  return [...m.values()].sort((a, b) => b.pedidos - a.pedidos || b.qtd - a.qtd).slice(0, 8);
}
const doCatalogo = (desc: string) => REFERENCIAS.find((r) => desc.includes(r[2]));
function comprada(c: Comprada, i: number, copia = false): string {
  const r = doCatalogo(c.desc);
  const acao = r ? ` data-mt-ficha="${esc(r[2])}" data-mt-fab="${esc(r[1])}"` : ` data-mt-pesquisar="${esc(c.desc)}" data-mt-modo="2"`;
  return `<li class="mt__comp" style="--i:${i}"${copia ? ' aria-hidden="true"' : ''}><button type="button" class="mt__comp-card"${acao}${copia ? ' tabindex="-1"' : ''}>
    <span class="mt__comp-img">${azulejoPeca(c.desc, 'mt__comp-azulejo', r?.[2] ?? '')}</span>
    <span class="mt__comp-n">${L(trendingUp)}${c.qtd} ${c.qtd === 1 ? 'unidade' : 'unidades'} · ${c.pedidos} ${c.pedidos === 1 ? 'pedido' : 'pedidos'}</span>
    <b class="mt__comp-nome">${esc(c.desc)}</b>
    ${r ? `<span class="mt__comp-preco">${euros(liquido(r))} <small>sem IVA · ${saida(r[6], r[7])}</small></span>` : '<span class="mt__comp-preco mt__comp-preco--sem">Pesquisar o preço</span>'}
    ${c.juntas.length ? `<span class="mt__comp-juntas"><small>Costuma ir com</small>${c.juntas.slice(0, 2).map((j) => `<em>${esc(j)}</em>`).join('')}</span>` : ''}
  </button></li>`;
}
function compradas(e: EstadoMontra): string {
  if (e === 'primeira') return '';
  const l = maisCompradas();
  const faixa = l.map((c, i) => comprada(c, i)).join(''), copia = l.map((c, i) => comprada(c, i + l.length, true)).join('');
  return `<section class="mt__sec mt__compradas" aria-labelledby="mt-comp-t">
    <header class="mt__sec-cabeca"><div><h2 class="mt__sec-t" id="mt-comp-t">As mais compradas.</h2><p class="mt__sec-sub">${L(packageIcon)}Contado dos teus pedidos, com o que costuma ir no mesmo pedido</p></div><button type="button" class="mt__mais" data-pn-ir="pedidos">Os meus pedidos${L(arrowRight)}</button></header>
    <div class="mt__faixa" data-mt-faixa tabindex="0" aria-label="As mais compradas; passa sozinha, para com o rato ou o foco"><ul class="mt__faixa-pista" role="list">${faixa}${copia}</ul></div>
  </section>`;
}

/* ---------- 5. Continuar de onde ficaste (só o que existe; sem nada, a secção não aparece) ---------- */
function continuar(e: EstadoMontra): string {
  if (e === 'primeira') return '';
  if (e === 'parcial') return `<section class="mt__sec mt__cont" aria-labelledby="mt-cont-t"><h2 class="mt__sec-t mt__sec-t--pequeno" id="mt-cont-t">Continuar de onde ficaste</h2>
    <p class="mt__falha" role="alert">${L(triangleAlert)}<span>A tua atividade não carregou agora. A pesquisa e o catálogo funcionam.</span>${btn('Tentar de novo', rotateCcw, ' data-mt-tentar', 'mt__btn--leve')}</p></section>`;
  const pedido = LINHAS_TODAS.find((x) => x.etapa.k !== 'concluido');
  const carro = GARAGEM.find((c) => c.favorito) ?? GARAGEM[0];
  const lista = LISTAS.find((l) => l.estado === 'rascunho');
  const itens = [
    pedido ? `<li><button type="button" class="mt__cont-item" data-abrir-pedido="${pedido.l.num}">${L(packageIcon)}<span><small>Pedido em curso</small><b>${pedido.l.num}</b><em>${esc(pedido.etapa.nome)}</em></span>${L(arrowRight, 'mt__seta')}</button></li>` : '',
    carro ? `<li><button type="button" class="mt__cont-item" data-pecas-matricula="${carro.matricula}">${L(carFront)}<span><small>Veículo favorito</small><b>${esc(nomeCarro(carro))}</b><em>${carro.matricula} · peças compatíveis</em></span>${L(arrowRight, 'mt__seta')}</button></li>` : '',
    lista ? `<li><button type="button" class="mt__cont-item" data-pn-atalho="lista">${L(listChecks)}<span><small>Lista em rascunho</small><b>${esc(lista.nome)}</b><em>${lista.pecas.length} peças · ${esc(lista.atualizada)}</em></span>${L(arrowRight, 'mt__seta')}</button></li>` : '',
  ].filter(Boolean);
  if (!itens.length) return '';
  return `<section class="mt__sec mt__cont" aria-labelledby="mt-cont-t"><h2 class="mt__sec-t mt__sec-t--pequeno" id="mt-cont-t">Continuar de onde ficaste</h2><ul class="mt__cont-lista" role="list">${itens.join('')}</ul></section>`;
}

/* ---------- 6. No fim, a pesquisa ---------- */
const final = () => `<section class="mt__sec mt__final" aria-labelledby="mt-fim-t">
    <h2 class="mt__sec-t" id="mt-fim-t">Pronto para a próxima peça?</h2>
    <div class="mt__accoes">
      <button type="button" class="mt__atalho mt__atalho--grande" data-pn-modo="0">${L(carFront)}Pela matrícula</button>
      <button type="button" class="mt__atalho mt__atalho--grande" data-pn-modo="1">${L(car)}Pelo veículo</button>
      <button type="button" class="mt__atalho mt__atalho--grande" data-pn-modo="2">${L(hash)}Pela referência</button>
    </div>
  </section>`;

export function montraHtml(e: EstadoMontra = ''): string {
  const aviso = e === 'offline' ? `<p class="mt__aviso" role="status">${L(wifiOff)}<span><b>Sem ligação.</b> Os preços e o stock são os da última vez que a página carregou.</span></p>` : '';
  const sessao = e === 'sessao' ? `<div class="mt__sessao" data-por-cima role="alertdialog" aria-modal="true" aria-labelledby="mt-s-t"><div class="mt__veu"></div><div class="mt__dialogo"><span class="mt__dialogo-icone">${L(lock)}</span><h2 id="mt-s-t">A tua sessão expirou.</h2><p>Por segurança, entra outra vez. Voltas a esta página.</p><button type="button" class="btn btn--acao mt__btn" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Iniciar sessão</span></button></div></div>` : '';
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--mt">
  <main class="mt${e === 'sem-3d' ? ' is-sem-3d' : ''}" data-ex="rolamento"${e ? ` data-estado="${e}"` : ''}${e === 'sessao' ? ' inert aria-hidden="true"' : ''}>
    ${aviso}${abertura(e)}${maisPesquisados(e)}${compradas(e)}${continuar(e)}${final()}
  </main>${sessao}
  <p class="sr-only" role="status" aria-live="polite" data-mt-aviso></p>
</div>`;
}
