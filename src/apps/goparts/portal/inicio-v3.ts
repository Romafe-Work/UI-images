/* =========================================================
   GOPARTS — 10 · Início v3 (14 out. 2026): o espaço de trabalho de todos os dias
   Do briefing dela: o Início é uma ferramenta usada muitas vezes por dia — impressiona pela
   rapidez e pela fluidez, não por efeitos. Uma versão só («só quero uma versão por screen»).
   - Em cima, a pesquisa: os três modos (Identificar, Selecionar, Referência) em separadores
     diretos, com a risca laranja que desliza, e o carrossel com o cartão ativo ao centro e os
     outros a espreitar (perspetiva de 3° no máximo, escala 0,94); setas, ← → nos separadores,
     arrastar no ecrã tátil. Só o cartão ativo recebe o foco (os outros são `inert`); o que se
     escreveu em cada modo fica. Abre no último modo usado.
   - Sugestões enquanto se escreve (referências, marcas), com os estados: a carregar, sem
     resultados, erro e recentes. Ctrl+K (ou ⌘K) abre a pesquisa global.
   - Por baixo, zonas compactas: categorias, pesquisas recentes (repetir num clique), últimos
     pedidos (estado, valor, ir para o pedido) e veículos guardados.
   - Sem gradientes, sem brilhos, sem vidro, sem sombras; sem entradas animadas a cada visita
     nem movimento contínuo. Os dados são os de exemplo do resto do protótipo.
   Comportamento: comportamento/inicio-v3.ts. CSS: css/inicio-v3-trabalho.css.
   ========================================================= */
import { REFERENCIAS, euros } from './catalogo-dados';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import packageIcon from 'lucide-static/icons/package.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import disc from 'lucide-static/icons/disc.svg?raw';
import arrowDownUp from 'lucide-static/icons/arrow-down-up.svg?raw';
import droplet from 'lucide-static/icons/droplet.svg?raw';
import battery from 'lucide-static/icons/battery.svg?raw';
import filter from 'lucide-static/icons/filter.svg?raw';
import lightbulb from 'lucide-static/icons/lightbulb.svg?raw';
import link from 'lucide-static/icons/link.svg?raw';
import cog from 'lucide-static/icons/cog.svg?raw';
import gauge from 'lucide-static/icons/gauge.svg?raw';
import snowflake from 'lucide-static/icons/snowflake.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import car from 'lucide-static/icons/car.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

/** Os estados do Início (10.1…), escolhidos no próprio ecrã. */
export type EstadoInicio = '' | 'carga' | 'sugestoes' | 'pesquisa' | 'sem-resultados' | 'erro' | 'rede' | 'falha' | 'vazio' | 'comando';

const MODOS: [string, string, string][] = [['identificar', 'Identificar', carFront], ['selecionar', 'Selecionar', sliders], ['referencia', 'Referência', hash]];

/* ---------- os três cartões ----------
   (ela, 14 out.: «os cards devem manter a cor que tinham, ocupar a width toda e parecer menos IA» e «tudo o
   que der para escrever deve aparecer no card, não quero a tab matrícula/VIN») — os cartões da v2.2 (azul,
   azul, laranja), a toda a largura, com todos os campos à vista; sem separadores de tipo nem teclas. */
const botao = (texto: string, icone = search, estado = '') => `<button type="button" class="btn ini3__botao${estado === 'pesquisa' ? ' is-a-pesquisar' : ''}" data-pesquisar${estado === 'pesquisa' ? ' aria-busy="true" disabled' : ''}>${estado === 'pesquisa' ? '<span class="ini3__roda" aria-hidden="true"></span><span class="btn__rotulo">A pesquisar…</span>' : `${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span>`}</button>`;
const campo = (id: string, rotulo: string, input: string, extra = '') => `<div class="ini3__campo${extra}"><label for="${id}">${rotulo}</label><div class="ini3__caixa">${input}</div></div>`;

function cartaoIdentificar(e: EstadoInicio): string {
  const erro = e === 'erro';
  return `<div class="ini3__grelha ini3__grelha--4">
      <div class="ini3__campo${erro ? ' is-erro' : ''}"><label for="i3-matricula">Matrícula</label><div class="ini3__caixa"><span class="ini3__pais" aria-hidden="true">P</span><input id="i3-matricula" value="${erro ? 'AA-12' : ''}" placeholder="AA-00-AA" autocomplete="off" spellcheck="false"${erro ? ' aria-invalid="true" aria-describedby="i3-matricula-erro"' : ''}></div>${erro ? `<p class="ini3__erro" id="i3-matricula-erro">${L(triangleAlert)}A matrícula tem 6 caracteres: AA-00-AA.</p>` : ''}</div>
      ${campo('i3-chassis', 'N.º de chassis (VIN)', '<input id="i3-chassis" placeholder="17 caracteres" autocomplete="off" spellcheck="false">')}
      ${campo('i3-descricao', 'Descrição', '<input id="i3-descricao" placeholder="Ex.: Clio IV 1.5 dCi 2017" autocomplete="off">')}
      ${campo('i3-motor', 'Motor', '<input id="i3-motor" placeholder="Ex.: K9K 608" autocomplete="off" spellcheck="false">')}
    </div>
    <div class="ini3__pe"><p class="ini3__nota">Com a matrícula ou o chassis, encontramos o veículo exato.</p>${botao('Identificar veículo', carFront, e)}</div>`;
}

function cartaoSelecionar(e: EstadoInicio): string {
  const marca = e === 'sugestoes' ? 'Ren' : '';
  return `<div class="ini3__grelha ini3__grelha--4">
      ${campo('i3-tipo', 'Tipo de veículo', '<select id="i3-tipo"><option>Automóvel ligeiro</option><option>Comercial ligeiro</option><option>Pesado</option><option>Motociclo</option></select>')}
      <div class="ini3__campo ini3__sugere">
        <label for="i3-marca">Marca</label>
        <div class="ini3__caixa"><input id="i3-marca" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="i3-marca-lista" value="${marca}" placeholder="Ex.: Renault" autocomplete="off" data-sugerir="marca"></div>
        <ul class="ini3__lista" id="i3-marca-lista" role="listbox" hidden></ul>
      </div>
      ${campo('i3-modelo', 'Modelo', '<select id="i3-modelo" disabled><option>Escolha a marca</option></select>')}
      ${campo('i3-variante', 'Veículo', '<select id="i3-variante" disabled><option>Escolha o modelo</option></select>')}
    </div>
    <div class="ini3__pe"><p class="ini3__nota">Encontre as peças certas para o veículo, passo a passo.</p>${botao('Selecionar veículo', arrowRight, e)}</div>`;
}

/* cada cópia do cartão (o ecrã e os estados estão todos na página) tem o seu grupo de rádios */
let grupoOrigem = 0;
function cartaoReferencia(e: EstadoInicio): string {
  const nome = `i3-origem-${++grupoOrigem}`;
  const ref = e === 'sugestoes' ? 'VKBA' : e === 'pesquisa' ? 'VKBA 6556' : e === 'sem-resultados' ? 'XQ-99812' : '';
  return `<div class="ini3__grelha ini3__grelha--ref">
      <div class="ini3__campo ini3__sugere">
        <label for="i3-referencia">Referência</label>
        <div class="ini3__caixa">${L(search, 'ini3__lupa')}<input id="i3-referencia" role="combobox" aria-autocomplete="list" aria-expanded="${e === 'sugestoes' || e === 'sem-resultados' ? 'true' : 'false'}" aria-controls="i3-ref-lista" value="${ref}" placeholder="Ex.: VKBA 6556, 0 986 494 525…" autocomplete="off" spellcheck="false" data-sugerir="referencia"></div>
        <ul class="ini3__lista" id="i3-ref-lista" role="listbox"${e === 'sugestoes' || e === 'sem-resultados' ? '' : ' hidden'}>${e === 'sugestoes' ? listaReferencias('VKBA') : e === 'sem-resultados' ? `<li class="ini3__lista-vazio" role="presentation">${L(search)}<span>Nenhuma referência começa por «XQ-99812». Experimente a pesquisa parcial, ou procure pelo veículo.</span></li>` : ''}</ul>
      </div>
      <fieldset class="ini3__opcoes"><legend>Origem</legend>
        ${['Todas', 'IAM', 'OE'].map((t, i) => `<label class="ini3__marcar"><input type="radio" name="${nome}"${i === 0 ? ' checked' : ''}> ${t}</label>`).join('')}
        <label class="ini3__marcar"><input type="checkbox" checked> Equivalências</label>
        <label class="ini3__marcar"><input type="checkbox"> Pesquisa parcial</label>
      </fieldset>
    </div>
    <div class="ini3__pe"><p class="ini3__nota">IAM, OE ou todas, com as equivalências entre marcas.</p>${botao('Pesquisar', search, e)}</div>`;
}

/** As sugestões de referências (os dados de exemplo do catálogo), com a parte escrita em negrito. */
export function listaReferencias(q: string): string {
  const m = REFERENCIAS.filter(([, fab, ref]) => `${fab} ${ref}`.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  return m.map(([grupo, fab, ref, , preco, , porto, sacavem], i) => `<li role="option" id="i3-sug-${i}" class="ini3__sug"${i === 0 ? ' aria-selected="true"' : ''} data-valor="${fab} ${ref}"><span class="ini3__sug-ref">${fab} <b>${ref.replace(new RegExp(`(${q})`, 'i'), '<mark>$1</mark>')}</b></span><span class="ini3__sug-grupo">${grupo}</span><span class="ini3__sug-preco">${euros(preco)}</span><span class="ini3__sug-stock${porto ? ' is-hoje' : ''}">${porto ? 'Porto · hoje' : sacavem ? 'Sacavém · amanhã' : 'Por encomenda'}</span></li>`).join('');
}

/* ---------- as zonas de baixo ---------- */
const CATEGORIAS: [string, string][] = [['Travagem', disc], ['Suspensão', arrowDownUp], ['Óleo motor', droplet], ['Bateria', battery], ['Filtros', filter], ['Iluminação', lightbulb], ['Correias', link], ['Embraiagem', cog], ['Direção', gauge], ['Ar condicionado', snowflake]];
const RECENTES: [string, string, string, string][] = [
  ['referencia', 'SKF VKBA 6556', 'Rolamento de roda · referência', 'Hoje, 09:42'],
  ['identificar', 'AA-12-BC · Renault Clio IV 1.5 dCi', 'Pastilhas de travão', 'Hoje, 08:15'],
  ['selecionar', 'VW Golf VII 2.0 TDI', 'Kit de distribuição', 'Ontem, 17:15'],
  ['referencia', 'BOSCH 0 986 494 525', 'Pastilhas de travão · referência', '10 out., 11:03'],
];
const PEDIDOS: [string, string, string, string, string][] = [
  ['P2024/001256', '15/04/2024', 'Em preparação', 'prep', euros(342.5)],
  ['P2024/001233', '10/04/2024', 'Expedido', 'exp', euros(1245.9)],
  ['P2024/001198', '02/04/2024', 'Entregue', 'ok', euros(87.3)],
  ['P2024/001177', '28/03/2024', 'Entregue', 'ok', euros(512.0)],
];
const VEICULOS: [string, string][] = [['AA-12-BC', 'Renault Clio IV 1.5 dCi · 2017'], ['45-XZ-91', 'Peugeot 308 1.6 BlueHDi · 2019'], ['12-RT-08', 'VW Golf VII 2.0 TDI · 2015']];

function zonas(e: EstadoInicio): string {
  const vazio = e === 'vazio', falha = e === 'falha', carga = e === 'carga';
  const esq = (n: number, cls = 'ini3__linha') => Array.from({ length: n }, () => `<li class="${cls} ini3__esq" aria-hidden="true"><i></i><i></i></li>`).join('');
  return `<section class="ini3__zona ini3__zona--categorias" aria-labelledby="i3-cat-t">
      <header class="ini3__zona-cabeca"><h2 id="i3-cat-t">${L(layoutGrid)}Categorias populares</h2><a href="#" class="ini3__mais" data-ir="catalogo">Todas as categorias${L(chevronRight)}</a></header>
      <ul class="ini3__categorias">${carga ? esq(10, 'ini3__categoria') : CATEGORIAS.map(([n, ic]) => `<li><button type="button" class="ini3__categoria" data-ir="catalogo">${L(ic)}<span>${n}</span></button></li>`).join('')}</ul>
    </section>
    <div class="ini3__tres">
      <section class="ini3__zona" aria-labelledby="i3-rec-t">
        <header class="ini3__zona-cabeca"><h2 id="i3-rec-t">${L(history)}Pesquisas recentes</h2>${vazio ? '' : '<a href="#" class="ini3__mais">Ver todas' + L(chevronRight) + '</a>'}</header>
        ${vazio ? `<p class="ini3__vazio">${L(history)}As pesquisas que fizer aparecem aqui, para as repetir num clique.</p>` : `<ul class="ini3__linhas">${carga ? esq(4) : RECENTES.map(([modo, titulo, sub, quando]) => `<li class="ini3__linha ini3__recente"><button type="button" class="ini3__linha-botao" data-repetir="${modo}" data-valor="${titulo}"><span class="ini3__linha-icone">${L(modo === 'referencia' ? hash : modo === 'identificar' ? carFront : sliders)}</span><span class="ini3__linha-texto"><b>${titulo}</b><span>${sub}</span></span><time class="ini3__quando">${quando}</time><span class="ini3__repetir">${L(rotateCcw)}Repetir</span></button></li>`).join('')}</ul>`}
      </section>
      <section class="ini3__zona" aria-labelledby="i3-ped-t">
        <header class="ini3__zona-cabeca"><h2 id="i3-ped-t">${L(packageIcon)}Últimos pedidos</h2>${vazio ? '' : `<a href="#" class="ini3__mais" data-ir="pedidos">Ver todos${L(chevronRight)}</a>`}</header>
        ${falha ? `<div class="ini3__falha" role="alert">${L(triangleAlert)}<div><b>Os pedidos não carregaram.</b><span>O resto do Início funciona. Pode tentar outra vez agora.</span></div><button type="button" class="ini3__tentar">${L(rotateCcw)}Tentar de novo</button></div>`
          : vazio ? `<p class="ini3__vazio">${L(packageIcon)}Ainda não fez pedidos. Quando fizer, vê aqui o estado de cada um.</p>`
          : `<ul class="ini3__linhas">${carga ? esq(4) : PEDIDOS.map(([n, d, est, k, v]) => `<li class="ini3__linha"><button type="button" class="ini3__linha-botao ini3__pedido" data-ir="pedidos"><span class="ini3__linha-texto"><b>${n}</b><span>${d}</span></span><span class="ini3__estado ini3__estado--${k}">${est}</span><span class="ini3__valor">${v}</span><span class="ini3__seta">${L(chevronRight)}</span></button></li>`).join('')}</ul>`}
      </section>
      <section class="ini3__zona" aria-labelledby="i3-vei-t">
        <header class="ini3__zona-cabeca"><h2 id="i3-vei-t">${L(star)}Veículos guardados</h2></header>
        ${vazio ? `<p class="ini3__vazio">${L(car)}Guarde os veículos que entram mais vezes na oficina para pesquisar peças sem os identificar de novo.</p>` : `<ul class="ini3__linhas">${carga ? esq(3) : VEICULOS.map(([mat, mod]) => `<li class="ini3__linha"><button type="button" class="ini3__linha-botao" data-repetir="identificar" data-valor="${mat}"><span class="ini3__matricula">${mat}</span><span class="ini3__linha-texto"><b>${mod.split(' · ')[0]}</b><span>${mod.split(' · ')[1]}</span></span><span class="ini3__repetir">${L(search)}Peças</span></button></li>`).join('')}</ul>`}
      </section>
    </div>`;
}

/* ---------- a pesquisa global (Ctrl+K) ---------- */
export const COMANDO = (aberto: boolean) => `<div class="ini3__comando" role="dialog" aria-modal="true" aria-label="Pesquisa global"${aberto ? '' : ' hidden'}>
  <div class="ini3__comando-caixa">
    <div class="ini3__comando-campo">${L(search)}<input type="search" placeholder="Referência, matrícula, veículo, categoria ou página…" aria-label="Pesquisa global" role="combobox" aria-expanded="true" aria-controls="i3-cmd-lista" autocomplete="off"${aberto ? ' value=""' : ''}><kbd>Esc</kbd></div>
    <ul class="ini3__comando-lista" id="i3-cmd-lista" role="listbox">
      <li class="ini3__comando-grupo" role="presentation">Pesquisas recentes</li>
      ${RECENTES.slice(0, 3).map(([modo, t, sub], i) => `<li role="option" class="ini3__comando-item"${i === 0 ? ' aria-selected="true"' : ''} data-repetir="${modo}" data-valor="${t}">${L(history)}<span><b>${t}</b><small>${sub}</small></span></li>`).join('')}
      <li class="ini3__comando-grupo" role="presentation">Ir para</li>
      ${([['catalogo', 'Catálogo', layoutGrid, 'G C'], ['pedidos', 'Pedidos', packageIcon, 'G P'], ['guias', 'Guias de remessa', truck, 'G G'], ['faturas', 'Faturas', receipt, 'G F']] as const).map(([id, n, ic, k]) => `<li role="option" class="ini3__comando-item" data-ir="${id}">${L(ic)}<span><b>${n}</b></span><kbd>${k}</kbd></li>`).join('')}
    </ul>
    <p class="ini3__comando-pe">${L(keyboard)}<span><kbd>↑</kbd><kbd>↓</kbd> escolher</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></p>
  </div>
</div>`;

/** O Início (ou um estado dele). */
export function inicioV3(e: EstadoInicio = ''): string {
  const atual = e === 'sugestoes' || e === 'pesquisa' || e === 'sem-resultados' ? 2 : e === 'erro' ? 0 : 2;
  const cartoes: [string, string, (e: EstadoInicio) => string][] = [
    ['Identificar veículo', 'Introduza os dados do veículo para uma pesquisa mais precisa.', cartaoIdentificar],
    ['Selecionar veículo', 'Navegue pelas características do veículo.', cartaoSelecionar],
    ['Pesquisar referências', 'Pesquise pela referência da peça, aplicável a várias marcas.', cartaoReferencia],
  ];
  /* a posição de cada cartão já vem no HTML (o comportamento só a muda): o ativo ao centro, os outros de lado,
     `inert` e escondidos dos leitores de ecrã */
  const lado = (i: number) => { const d = ((i - atual + 4) % 3) - 1; return ` style="--d:${d}" data-lado="${d < 0 ? 'ant' : d > 0 ? 'seg' : 'atual'}"${d ? ' inert aria-hidden="true"' : ''}`; };
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3">
  <main class="ini3${e === 'rede' ? ' is-offline' : ''}" data-modo="${atual}"${e ? ` data-estado="${e}"` : ''}>
    ${e === 'rede' ? `<p class="ini3__rede" role="status">${L(wifiOff)}<span><b>Sem ligação.</b> As pesquisas voltam assim que a ligação voltar; o que já está no ecrã continua à vista.</span></p>` : ''}
    <section class="ini3__pesquisa" aria-label="Pesquisar peças">
      <header class="ini3__cabeca">
        <div class="ini3__separadores" role="tablist" aria-label="Como quer pesquisar">
          ${MODOS.map(([id, nome, ic], i) => `<button type="button" role="tab" class="ini3__separador" id="i3-tab-${id}" aria-controls="i3-cartao-${id}" aria-selected="${i === atual}" tabindex="${i === atual ? 0 : -1}" data-modo="${i}">${L(ic)}${nome}</button>`).join('')}
          <i class="ini3__risca" aria-hidden="true"></i>
        </div>
      </header>
      <div class="ini3__palco">
        <button type="button" class="ini3__seta ini3__seta--ant" data-passo="-1" aria-label="Modo anterior">${L(chevronLeft)}</button>
        <div class="ini3__pista">
          ${cartoes.map(([t, s, corpo], i) => `<section class="ini3__cartao ini3__cartao--${i === 2 ? 'laranja' : 'azul'}" id="i3-cartao-${MODOS[i][0]}" role="tabpanel" aria-labelledby="i3-tab-${MODOS[i][0]}" data-cartao="${i}"${lado(i)}${e === 'carga' ? ' aria-busy="true"' : ''}>
            <header class="ini3__cartao-cabeca"><h2>${L(MODOS[i][2])}${t}</h2><p>${s}</p></header>
            ${e === 'carga' ? '<div class="ini3__esq-bloco" aria-hidden="true"><i></i><i></i><i></i></div>' : corpo(e)}
          </section>`).join('')}
        </div>
        <button type="button" class="ini3__seta ini3__seta--seg" data-passo="1" aria-label="Modo seguinte">${L(chevronRight)}</button>
      </div>
    </section>
    ${zonas(e)}
  </main>
  ${COMANDO(e === 'comando')}
  <p class="ini3__aviso" role="status" aria-live="polite"></p>
</div>`;
}
