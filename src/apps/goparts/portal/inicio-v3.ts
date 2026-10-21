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
import { REFERENCIAS, euros, MODELOS, veiculosDe } from './catalogo-dados';
import { resultadosHtml, FILTROS } from './pesquisa-resultados';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { blocosPesquisa, veiculoHtml, naoEncontradoHtml, candidatosHtml, dadosIniciais, IDENTIFICADOS, type EstadoEspaco } from './inicio-espaco';
import lock from 'lucide-static/icons/lock.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import house from 'lucide-static/icons/house.svg?raw';
import carFront from 'lucide-static/icons/car-front.svg?raw';
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import packageIcon from 'lucide-static/icons/package.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
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
import car from 'lucide-static/icons/car.svg?raw';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import tag from 'lucide-static/icons/tag.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import textIcon from 'lucide-static/icons/text.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import engine from 'lucide-static/icons/engine.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');

/** Os estados do Início (10.1…), escolhidos no próprio ecrã. */
export type EstadoInicio = '' | 'carga' | 'sugestoes' | 'pesquisa' | 'sem-resultados' | 'erro' | 'rede' | 'falha' | 'vazio' | 'comando'
  /* (14 out.: o briefing dos 17 estados) os que eram da moldura comum passam a ser do Início v3 */
  | 'esqueleto' | 'pecas' | '404' | '500' | 'sessao' | 'erros'
  /* (16 out.: o briefing do espaço de trabalho) os dos blocos novos — inicio-espaco.ts */
  | 'veiculo' | 'veiculo-nao' | 'linha' | 'repetir' | 'sucesso' | 'personalizar' | 'arrastar' | 'compacta' | 'atualizar' | 'parcial' | 'permissao' | 'sem-stock'
  /* (20 out., V6: os estados da pesquisa do briefing) */
  | 'parcial-form' | 'vin' | 'candidatos' | 'sugestoes-marca' | 'marca' | 'modelos-carga' | 'modelos-nada' | 'veic-escolhido' | 'resultados' | 'filtros' | 'servico' | 'limpa';
let uid = 0;
const rs = (modo: Parameters<typeof rolamentoSvg>[1], cls: string) => rolamentoSvg(`i3-${++uid}`, modo, cls);

/* (20 out., briefing V4) os nomes dos modos: a matrícula (e o n.º de chassis, VIN), o veículo pela marca e modelo, a referência */
/* (20 out., V5) «Como queres pesquisar?» — Matrícula, Veículo, Referência */
const MODOS: [string, string, string][] = [['identificar', 'Matrícula', carFront], ['selecionar', 'Veículo', sliders], ['referencia', 'Referência', hash]];

/* ---------- os três cartões ----------
   (ela, 14 out., com uma imagem: «assim») — como os cartões da v2.2: em cima uma faixa com a cor do modo
   (azul, azul, laranja), o ícone num quadrado, o título, o subtítulo e o desenho de linhas; por baixo, o corpo
   liso com todos os campos, um por linha, cada um com o seu ícone; «Pesquisa avançada» (ou «Limpar») e a
   ação a laranja. Os outros dois cartões veem-se dos lados, inclinados. */
const botao = (texto: string, icone = search, estado = '') => `<button type="button" class="btn ini3__botao${estado === 'pesquisa' ? ' is-a-pesquisar' : ''}" data-pesquisar${estado === 'pesquisa' ? ' aria-busy="true" disabled' : ''}>${estado === 'pesquisa' ? `${rs('pesquisar', 'ini3__rs-botao')}<span class="btn__rotulo">A pesquisar…</span>` : `${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span>`}</button>`;
const secundario = (texto: string, icone: string, extra = '') => `<button type="button" class="btn ini3__secundario"${extra}>${L(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;
const campo = (id: string, rotulo: string, icone: string, input: string, extra = '', depois = '') => `<div class="ini3__campo${extra}"><label for="${id}">${rotulo}</label><div class="ini3__caixa"><span class="ini3__chip" aria-hidden="true">${icone}</span>${input}</div>${depois}</div>`;

/* (V8) os desenhos de linhas dos cartões antigos (o carro, as engrenagens, o rolamento) voltam aos cartões de escolha */
const DESENHOS = ['<svg class="pq__modo-desenho" viewBox="0 0 160 100" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true">           <path d="M8 70c0-8 4-12 14-14l22-4 26-20c6-4 12-6 22-6h28c10 0 16 4 22 12l12 16"/><path d="M54 52l24-18c4-3 9-4 14-4h22l12 22Z"/>           <path d="M8 70v14h18M60 84h50M146 84h14"/><circle cx="43" cy="84" r="14"/><circle cx="43" cy="84" r="7"/><circle cx="128" cy="84" r="14"/><circle cx="128" cy="84" r="7"/></svg>', '<svg class="pq__modo-desenho" viewBox="0 0 160 100" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">           <g transform="translate(112 44)"><circle r="16"/><circle r="7"/><path d="M0-30v8M0 22v8M-30 0h8M22 0h8M-21-21l6 6M15 15l6 6M21-21l-6 6M-15 15l-6 6"/></g>           <g transform="translate(68 80)"><circle r="12"/><circle r="5"/><path d="M0-22v6M0 16v6M-22 0h6M16 0h6M-15-15l4 4M11 11l4 4M15-15l-4 4M-11 11l-4 4"/></g></svg>', '<svg class="pq__modo-desenho" viewBox="0 0 160 100" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">           <g transform="translate(100 50)"><circle r="44"/><circle r="36"/><circle r="16"/><circle r="7"/>           <circle cx="0" cy="-11" r="2"/><circle cx="10.5" cy="-3.4" r="2"/><circle cx="6.5" cy="9" r="2"/><circle cx="-6.5" cy="9" r="2"/><circle cx="-10.5" cy="-3.4" r="2"/>           <path d="M-44 0a44 44 0 0 1 12-30l6 6M-30-36a44 44 0 0 1 20-8"/></g></svg>'];

/* ---------- (20 out., V6) os três formulários, um de cada vez, por baixo dos cartões de escolha ----------
   Do briefing «Complete UX Refinement, Search Cards…»: o principal à vista (a matrícula; a marca, o modelo e a
   motorização; a referência) e o resto em «Mais opções», que se abre. Os ids dos campos são os de antes: o
   comportamento (inicio-v3.ts, inicio-espaco.ts, pesquisa.ts) é o mesmo. */
const MARCAS_CAT: Record<string, string> = { BMW: 'BMW', Opel: 'Opel', Peugeot: 'Peugeot', Renault: 'Renault', Toyota: 'Toyota', Volkswagen: 'VW' };
export { MARCAS_CAT };
const mais = (resumo: string, corpo: string, aberto = false, rotulo = 'Mais opções de identificação') => `<details class="pq__mais"${aberto ? ' open' : ''}><summary>${L(sliders)}<span><b>${rotulo}</b><small>${resumo}</small></span>${L(chevronRight, 'pq__opcoes-seta')}</summary><div class="pq__mais-corpo">${corpo}</div></details>`;
function cartaoIdentificar(e: EstadoInicio): string {
  /* 18.x: matrícula errada; VIN errado (com o resumo dos erros em cima); a matrícula a meio */
  const erro = e === 'erro' || e === 'erros', varios = e === 'erros' || e === 'vin';
  const ic = `<span class="ini3__erro-icone">${L(triangleAlert)}</span>`;
  const mat = erro ? 'AA-12' : e === 'veiculo' ? 'AA-12-BC' : e === 'veiculo-nao' ? 'AB-34-ZZ' : e === 'parcial-form' ? 'AA-12-B' : '';
  return `${e === 'erros' ? `<div class="ini3__resumo" role="alert" tabindex="-1"><p>${L(listChecks)}<b>2 campos precisam de correção</b></p><ul><li><a href="#" data-focar="i3-matricula">Matrícula — o formato é AA-00-AA</a></li><li><a href="#" data-focar="i3-chassis">N.º de chassis — tem 17 caracteres</a></li></ul></div>` : ''}
    <div class="pq__linha">
      ${campo('i3-matricula', 'Matrícula', '<b class="ini3__pais">P</b>', `<input id="i3-matricula" value="${mat}" placeholder="AA-00-AA" autocomplete="off" spellcheck="false" maxlength="10"${erro ? ' aria-invalid="true" aria-describedby="i3-matricula-erro"' : ' aria-describedby="i3-matricula-ajuda"'}>`, erro ? ' is-erro' : '', erro ? `<p class="ini3__erro" id="i3-matricula-erro">${ic}<span><b>Matrícula incompleta.</b> O formato é AA-00-AA (6 letras ou números).</span></p>` : `<p class="pq__ajuda" id="i3-matricula-ajuda">${e === 'parcial-form' ? 'Falta 1 carácter.' : 'Só a matrícula chega para identificar a versão exata.'}</p>`)}
      ${botao('Identificar veículo', carFront, e)}
    </div>
    ${mais('N.º de chassis (VIN), descrição ou motor', `<div class="ini3__campos pq__campos3">
      ${campo('i3-chassis', 'N.º de chassis (VIN)', L(scanBarcode), `<input id="i3-chassis" value="${varios ? 'VF1RFB00X5' : ''}" placeholder="17 letras e números" autocomplete="off" spellcheck="false" maxlength="20"${varios ? ' aria-invalid="true" aria-describedby="i3-chassis-erro"' : ''}>`, varios ? ' is-erro' : '', varios ? `<p class="ini3__erro" id="i3-chassis-erro">${ic}<span><b>Faltam 7 caracteres.</b> O VIN tem 17 letras e números.</span></p>` : '')}
      ${campo('i3-descricao', 'Descrição', L(textIcon), `<input id="i3-descricao" value="${e === 'candidatos' ? 'Clio 1.5 dCi' : ''}" placeholder="Ex.: Clio 1.5 dCi" autocomplete="off">`)}
      ${campo('i3-motor', 'Código do motor', L(engine), '<input id="i3-motor" placeholder="Ex.: K9K" autocomplete="off" spellcheck="false">')}
    </div><p class="pq__ajuda">Basta um campo. O VIN identifica a versão exata; a descrição e o motor mostram os veículos possíveis, para escolheres o teu.</p>`, varios || e === 'candidatos')}
    <div class="ini3__pe pq__pe">${secundario('Limpar', eraser, ' data-limpar')}</div>`;
}

function cartaoSelecionar(e: EstadoInicio): string {
  /* 18.x: a marca escolhida (os modelos ativos), os modelos a carregar, uma marca sem modelos, o veículo escolhido */
  const marca = e === 'sugestoes-marca' ? 'Ren' : e === 'marca' || e === 'modelos-carga' || e === 'veic-escolhido' ? 'Renault' : e === 'modelos-nada' ? 'Fiat' : '';
  const modelos = e === 'marca' || e === 'veic-escolhido' ? (MODELOS.Renault ?? []).map((m) => m[0]) : [];
  const modelo = e === 'veic-escolhido' ? 'Clio IV (BH_)' : '';
  const vs = modelo ? veiculosDe('Renault', modelo) : [];
  const passo = (n: string, v: string) => `<li class="${v ? 'is-feito' : ''}"><span>${n}</span><b>${v || '—'}</b></li>`;
  return `<ol class="pq__passos" data-passos aria-label="O que já escolheste">${passo('Marca', marca.length > 3 ? marca : '')}${passo('Modelo', modelo ? 'Clio IV' : '')}${passo('Motorização', vs[1] ? `${vs[1].versao} · ${vs[1].cv} cv` : '')}</ol>
    <div class="ini3__campos pq__campos4">
      ${campo('i3-marca', 'Marca', L(tag), `<input id="i3-marca" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="i3-marca-lista" value="${marca}" placeholder="Escreve ou escolhe a marca" autocomplete="off" data-sugerir="marca">`, ' ini3__sugere', `<ul class="ini3__lista" id="i3-marca-lista" role="listbox" hidden></ul>${e === 'modelos-nada' ? `<p class="pq__ajuda pq__ajuda--aviso" role="status">${L(triangleAlert)}O catálogo ainda não tem modelos da Fiat. Pesquisa pela referência ou pela matrícula.</p>` : ''}`)}
      ${campo('i3-modelo', 'Modelo', L(layers), `<select id="i3-modelo"${modelos.length ? '' : ' disabled'}${e === 'modelos-carga' ? ' aria-busy="true"' : ''}><option value="">${e === 'modelos-carga' ? 'A carregar modelos…' : modelos.length ? 'Escolhe o modelo' : 'Escolhe primeiro a marca'}</option>${modelos.map((m) => `<option${m === modelo ? ' selected' : ''}>${m}</option>`).join('')}</select>`, e === 'modelos-carga' ? ' is-a-carregar' : '', e === 'modelos-carga' ? `<p class="pq__ajuda" role="status">${rs('pesquisar', 'pq__rs')}A carregar os modelos da Renault…</p>` : '')}
      ${campo('i3-variante', 'Motorização', L(engine), `<select id="i3-variante"${vs.length ? '' : ' disabled'}><option value="">${vs.length ? 'Escolhe a motorização' : 'Escolhe primeiro o modelo'}</option>${vs.map((v, i) => `<option value="${i}"${i === 1 ? ' selected' : ''}>${v.versao} · ${v.kw} kW / ${v.cv} cv · ${v.motor.split(',')[0]}</option>`).join('')}</select>`)}
      ${campo('i3-ano', 'Ano', L(calendar), `<select id="i3-ano"${vs.length ? '' : ' disabled'}><option value="">${vs.length ? 'Qualquer ano' : 'Escolhe primeiro a motorização'}</option>${vs[1] ? Array.from({ length: Math.max(1, (vs[1].ate || 2026) - vs[1].desde + 1) }, (_, k) => vs[1].desde + k).map((a) => `<option>${a}</option>`).join('') : ''}</select>`)}
    </div>
    ${mais('Tipo de veículo', campo('i3-tipo', 'Tipo de veículo', L(carFront), '<select id="i3-tipo"><option>Automóvel ligeiro</option><option>Comercial ligeiro</option><option>Pesado</option><option>Motociclo</option></select>'), false, 'Mais opções')}
    <div class="ini3__pe pq__pe">${secundario('Limpar', eraser, ' data-limpar')}${botao('Selecionar veículo', circleCheck, e === 'veic-escolhido' ? '' : e).replace('data-pesquisar', `data-pesquisar${modelo ? '' : ' disabled aria-disabled="true"'}`)}</div>`;
}

let grupoOrigem = 0;
function cartaoReferencia(e: EstadoInicio): string {
  const nome = `i3-origem-${++grupoOrigem}`;
  const ref = e === 'sugestoes' ? 'VKBA' : e === 'pesquisa' ? 'VKBA 6556' : e === 'sem-resultados' ? 'XQ-99812' : e === 'resultados' || e === 'servico' ? 'SKF' : e === 'filtros' ? 'kit' : '';
  const aberta = e === 'sugestoes';
  const chip = e === 'pesquisa' ? rs('pesquisar', 'ini3__rs-campo') : L(scanBarcode);
  return `<div class="pq__linha">
      ${campo('i3-referencia', 'Referência', chip, `<input id="i3-referencia" role="combobox" aria-autocomplete="list" aria-expanded="${aberta}" aria-controls="i3-ref-lista" value="${ref}" placeholder="Introduz a referência, marca ou descrição da peça" autocomplete="off" spellcheck="false" data-sugerir="referencia"${e === 'pesquisa' ? ' aria-busy="true"' : ''}>`, ' ini3__sugere',
        `<ul class="ini3__lista" id="i3-ref-lista" role="listbox"${aberta ? '' : ' hidden'}>${aberta ? sugestoesAgrupadas('VKBA') : ''}</ul>${e === 'pesquisa' ? '<p class="ini3__procura" role="status">A procurar referências…</p>' : ''}`)}
      ${botao('Pesquisar referência', search, e)}
    </div>
      <details class="pq__opcoes"><summary>${L(sliders)}Opções avançadas <span class="pq__opcoes-resumo">Origem, equivalências e pesquisa parcial</span>${L(chevronRight, 'pq__opcoes-seta')}</summary>
      <fieldset class="ini3__opcoes"><legend class="sr-only">Origem e opções</legend>
        ${['IAM', 'OE', 'Todas'].map((t, i) => `<label class="ini3__marcar"><input type="radio" name="${nome}"${i === 2 ? ' checked' : ''}> ${t}</label>`).join('')}
        <label class="ini3__marcar"><input type="checkbox" checked data-pq-equivalencias> Incluir equivalências</label>
        <label class="ini3__marcar"><input type="checkbox" data-pq-parcial> Pesquisa parcial</label>
      </fieldset></details>`;
}


/** 10.2 as sugestões agrupadas: referências, fabricantes e pesquisas recentes, com a parte escrita destacada. */
function sugestoesAgrupadas(q: string): string {
  let i = 0;
  const grupo = (t: string) => `<li class="ini3__lista-grupo" role="presentation">${t}</li>`;
  const item = (valor: string, html: string) => `<li role="option" class="ini3__sug" style="--i:${i}" id="i3-sg-${i}" data-valor="${valor}"${i++ === 0 ? ' aria-selected="true"' : ''}>${html}</li>`;
  const marca = (t: string) => t.replace(new RegExp(`(${q})`, 'i'), '<mark>$1</mark>');
  return grupo('Referências') + listaReferencias(q).replace(/<li role="option"[^>]*?data-valor="([^"]+)"[^>]*>/g, (_m, v) => `<li role="option" class="ini3__sug" style="--i:${i}" id="i3-sg-${i}" data-valor="${v}"${i++ === 0 ? ' aria-selected="true"' : ''}>`)
    + grupo('Fabricantes') + item('SKF', `<span class="ini3__sug-ref">SKF · kits de rolamento ${marca('VKBA')}</span><span class="ini3__sug-grupo">412 referências</span>`)
    + grupo('Pesquisas recentes') + item('SKF VKBA 6556', `<span class="ini3__sug-ref">${L(history)} SKF ${marca('VKBA')} 6556</span><span class="ini3__sug-grupo">Hoje, 09:42</span>`);
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

/* ---------- a pesquisa global (Ctrl+K) ---------- */
export const COMANDO = (aberto: boolean) => `<div class="ini3__comando" role="dialog" aria-modal="true" aria-label="Pesquisa global"${aberto ? '' : ' hidden'}>
  <div class="ini3__comando-caixa">
    <div class="ini3__comando-campo">${L(search)}<input type="search" placeholder="Referência, matrícula, veículo, categoria ou página…" aria-label="Pesquisa global" role="combobox" aria-expanded="true" aria-controls="i3-cmd-lista" autocomplete="off"${aberto ? ' value=""' : ''}><kbd>Esc</kbd></div>
    <ul class="ini3__comando-lista" id="i3-cmd-lista" role="listbox">
      <li class="ini3__comando-grupo" role="presentation">Pesquisas recentes</li>
      ${RECENTES.slice(0, 3).map(([modo, t, sub], i) => `<li role="option" class="ini3__comando-item"${i === 0 ? ' aria-selected="true"' : ''} data-repetir="${modo}" data-valor="${t}">${L(history)}<span><b>${t}</b><small>${sub}</small></span></li>`).join('')}
      <li class="ini3__comando-grupo" role="presentation">Pedidos</li>
      ${PEDIDOS.slice(0, 2).map(([n, d, est]) => `<li role="option" class="ini3__comando-item" data-ir="pedidos">${L(packageIcon)}<span><b>${n}</b><small>${d} · ${est}</small></span></li>`).join('')}
      <li class="ini3__comando-grupo" role="presentation">Marcas e modelos</li>
      ${['Renault · Clio IV', 'Volkswagen · Golf VII', 'Peugeot · 308'].map((m) => `<li role="option" class="ini3__comando-item" data-repetir="selecionar" data-valor="${m.split(' · ')[0]}">${L(car)}<span><b>${m}</b></span></li>`).join('')}
      <li class="ini3__comando-grupo" role="presentation">Categorias</li>
      ${CATEGORIAS.slice(0, 3).map(([n, ic]) => `<li role="option" class="ini3__comando-item" data-ir="catalogo">${L(ic)}<span><b>${n}</b></span></li>`).join('')}
      <li class="ini3__comando-grupo" role="presentation">Ir para</li>
      ${([['catalogo', 'Catálogo', layoutGrid, 'G C'], ['pedidos', 'Pedidos', packageIcon, 'G P'], ['guias', 'Guias de remessa', truck, 'G G'], ['faturas', 'Faturas', receipt, 'G F']] as const).map(([id, n, ic, k]) => `<li role="option" class="ini3__comando-item" data-ir="${id}">${L(ic)}<span><b>${n}</b></span><kbd>${k}</kbd></li>`).join('')}
    </ul>
    <p class="ini3__comando-pe">${L(keyboard)}<span><kbd>↑</kbd><kbd>↓</kbd> escolher</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></p>
  </div>
</div>`;

/** O Início (ou um estado dele). */
/* ---------- os estados do briefing (14 out.), na mesma linguagem mecânica ---------- */
/* 10.1 a preparar: o rolamento monta-se e roda, no lugar do carrossel; o resto em esqueleto */
const aPreparar = () => `<div class="ini3__preparar" role="status" aria-live="polite">${rs('carregar', 'ini3__rs-preparar')}<p>A preparar o teu espaço…</p></div>`;
/* 10.6 sem ligação: o rolamento abranda até parar; «Tentar novamente» retoma-o */
const semLigacao = () => `<div class="ini3__rede" role="status" aria-live="polite">${rs('offline', 'ini3__rs-rede')}<div class="ini3__rede-texto"><b>Estás sem ligação à Internet.</b><span>Verifica a ligação e tenta novamente. Continuas a ver o que já estava carregado.</span></div><button type="button" class="ini3__tentar" data-religar>${L(rotateCcw)}<span>Tentar novamente</span></button></div>`;
/* 10.8 primeira vez: a visita guiada, um modo de cada vez; o resto da página fica à vista, esbatido */
const GUIA: [string, string][] = [
  ['Por matrícula', 'Escreve a matrícula: identificamos a versão exata. Em «Mais opções», o VIN, a descrição ou o motor.'],
  ['Por veículo', 'Escolhe a marca, o modelo e a motorização, um passo de cada vez.'],
  ['Por referência', 'Escreve a referência, a marca ou a descrição: os resultados aparecem aqui, com o preço e o stock.'],
];
const guia = () => `<div class="ini3__guia" role="dialog" aria-label="Três formas de encontrar peças" data-guia="0">
  <p class="ini3__guia-passo"><b>1</b> de 3</p>
  <div class="ini3__guia-texto"><p class="ini3__guia-titulo">${GUIA[0][0]}</p><p>${GUIA[0][1]}</p></div>
  <div class="ini3__guia-accoes"><button type="button" class="ini3__guia-saltar" data-guia-saltar>Saltar</button>${secundario('Anterior', chevronLeft, ' data-guia-passo="-1" disabled')}<button type="button" class="btn btn--acao ini3__guia-seguinte" data-guia-passo="1"><span class="btn__rotulo">Seguinte</span>${L(chevronRight, 'btn__icone')}</button></div>
</div>`;
export const GUIA_TEXTOS = GUIA;
/* 10.12 peças a carregar: os filtros e o cabeçalho da tabela ficam; as linhas em esqueleto; o rolamento ao pé da contagem */
const pecasACarregar = () => `<section class="ini3__resultados" aria-busy="true" aria-label="Resultados">
  <header class="ini3__resultados-cabeca"><h2>Resultados para «Pastilhas de travão» · Renault Clio IV 1.5 dCi</h2><p class="ini3__contagem" role="status">${rs('pesquisar', 'ini3__rs-contagem')}A carregar peças…</p></header>
  <div class="ini3__filtros">${['Travagem', 'Eixo dianteiro', 'Em stock', 'Todas as marcas'].map((f) => `<span class="ini3__filtro">${f}</span>`).join('')}</div>
  <div class="ini3__tabela" role="table" aria-label="Peças">
    <div class="ini3__tabela-cabeca" role="row">${['', 'Referência', 'Descrição', 'Fabricante', 'Preço', 'Stock', ''].map((c) => `<span role="columnheader">${c}</span>`).join('')}</div>
    ${Array.from({ length: 6 }, () => `<div class="ini3__tabela-linha" role="row" aria-hidden="true"><i class="ini3__esq-img"></i><i></i><i></i><i></i><i></i><i></i><i class="ini3__esq-botao"></i></div>`).join('')}
  </div>
</section>`;
/* 10.13 404 e 10.14 500: o rolamento que perdeu uma esfera, e o que encrava a meio */
const paginaErro = (e: '404' | '500') => `<section class="ini3__erro-pagina" role="alert">
  ${rs(e === '404' ? '404' : 'erro', 'ini3__rs-erro')}
  <h1>${e === '404' ? '404 — Esta página saiu da rota.' : 'Não conseguimos concluir o pedido.'}</h1>
  <p>${e === '404' ? 'A página que procuras não existe ou foi movida.' : 'Ocorreu um problema temporário. Tenta novamente dentro de momentos.'}</p>
  <div class="ini3__erro-accoes">${e === '404'
    ? `<button type="button" class="btn btn--acao ini3__botao-pagina" data-ir="inicio">${L(house, 'btn__icone')}<span class="btn__rotulo">Voltar ao início</span></button>${secundario('Explorar catálogo', layoutGrid, ' data-ir="catalogo"')}`
    : `<button type="button" class="btn btn--acao ini3__botao-pagina" data-tentar-pagina>${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Tentar novamente</span></button>${secundario('Voltar ao início', house, ' data-ir="inicio"')}`}</div>
</section>`;
/* 10.15 sessão expirada: um diálogo calmo por cima do Início; o cadeado fecha-se uma vez */
const sessao = () => `<div class="ini3__comando ini3__sessao" role="alertdialog" aria-modal="true" aria-labelledby="i3-sessao-t" aria-describedby="i3-sessao-d">
  <div class="ini3__comando-caixa ini3__sessao-caixa">
    <span class="ini3__sessao-icone">${L(lock)}</span>
    <h2 id="i3-sessao-t">A tua sessão expirou.</h2>
    <p id="i3-sessao-d">Por segurança, precisas de iniciar sessão novamente. Depois voltas a esta página.</p>
    <button type="button" class="btn btn--acao ini3__botao-pagina" data-ir="entrada">${L(logIn, 'btn__icone')}<span class="btn__rotulo">Iniciar sessão</span></button>
  </div>
</div>`;

/** 10.17 em manutenção: a página inteira, sem o portal; o rolamento em vista explodida, devagar. */
export function manutencaoV3(): string {
  return `<div class="portal--ini3 ini3-manutencao" role="alert">
  <div class="ini3-manutencao__marca"><span class="romafe">ROMAFE</span><span class="ini3-manutencao__risco" aria-hidden="true"></span><span>GoParts</span></div>
  ${rs('manutencao', 'ini3__rs-manutencao')}
  <h1>Estamos a afinar o motor.</h1>
  <p>O GoParts está temporariamente indisponível para manutenção. Prevemos voltar <b>hoje às 07:00</b>.</p>
  <p class="ini3-manutencao__apoio">Encomendas urgentes: Apoio Romafe · <a href="tel:+351226158300">+351 226 158 300</a> · romafe@romafe.com</p>
</div>`;
}

export function inicioV3(e: EstadoInicio = ''): string {
  const M1 = ['sugestoes-marca', 'marca', 'modelos-carga', 'modelos-nada', 'veic-escolhido'], M2 = ['sugestoes', 'pesquisa', 'sem-resultados', 'resultados', 'filtros', 'servico'];
  const atual = M2.includes(e) ? 2 : M1.includes(e) ? 1 : 0;
  /* (20 out., V6) os três cartões de escolha: ícone, título, o que faz e a ação */
  const cartoes: [string, string, string, (e: EstadoInicio) => string][] = [
    ['Por matrícula', 'Identifica um veículo através da matrícula ou do número de chassis.', 'Identificar veículo', cartaoIdentificar],
    ['Por veículo', 'Seleciona a marca, o modelo e a motorização.', 'Selecionar veículo', cartaoSelecionar],
    ['Por referência', 'Encontra uma peça através da referência, marca ou descrição.', 'Pesquisar referência', cartaoReferencia],
  ];
  const ICONES = [carFront, car, hash];
  const lado = (i: number) => { const d = ((i - atual + 4) % 3) - 1; return ` style="--d:${d}" data-lado="${d < 0 ? 'ant' : d > 0 ? 'seg' : 'atual'}"${d ? ' inert aria-hidden="true"' : ''}`; };
  const d = dadosIniciais(), ee = e as EstadoEspaco;
  if (e === 'vazio') { d.garagem = []; d.atividade = []; d.favoritas = []; d.carrinho = 0; }
  const escolhido = () => { const v = veiculosDe('Renault', 'Clio IV (BH_)')[1]; return veiculoHtml({ id: '', matricula: '', marca: 'Renault', modelo: 'Clio IV (BH_)', v: 1, ano: v?.desde ?? 2013 }, false, 'marca e modelo'); };
  const veiculo = e === 'veiculo' ? veiculoHtml({ id: 'c1', matricula: 'AA-12-BC', ...IDENTIFICADOS['AA-12-BC'] }, true) : e === 'veiculo-nao' ? naoEncontradoHtml('AB-34-ZZ') : e === 'candidatos' ? candidatosHtml('Clio 1.5 dCi') : e === 'veic-escolhido' ? escolhido() : '';
  /* os resultados da referência, no próprio ecrã */
  const f = { ...FILTROS, q: e === 'pesquisa' ? 'VKBA 6556' : e === 'sem-resultados' ? 'XQ-99812' : e === 'filtros' ? 'kit' : 'SKF', marcas: e === 'filtros' ? ['SKF'] : [], stock: e === 'filtros' };
  const comResultados = ['pesquisa', 'sem-resultados', 'resultados', 'filtros', 'servico'].includes(e);
  const resultados = comResultados ? resultadosHtml(f, { estado: e === 'pesquisa' ? 'carga' : e === 'servico' ? 'servico' : '' }) : '';
  /* (20 out., V5) o ecrã «Pesquisar peças»; (V6) os três cartões de escolha em cima, um só formulário por baixo
     (no painel ligado ao cartão escolhido), os resultados a seguir, e o que ajuda a pesquisar. */
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--ini4 portal--pq">
  <main class="ini3 ini4 pq${e === 'rede' ? ' is-offline' : ''}${e === 'vazio' ? ' is-guia' : ''}${comResultados ? ' is-com-resultados' : ''}" data-modo="${atual}"${e ? ` data-estado="${e}"` : ''} data-densidade="${d.prefs.densidade}">
    ${e === '404' || e === '500' ? paginaErro(e) : e === 'pecas' ? pecasACarregar() : `
    ${e === 'rede' ? semLigacao() : ''}
    <header class="pq__cabeca" data-entra="0">
      <div class="pq__cabeca-texto"><h1 class="pq__titulo">Pesquisar peças</h1><p class="pq__sub">Encontra rapidamente as peças certas para o teu veículo.</p></div>
      <div class="pq__cabeca-accoes">${secundario('Catálogo', layoutGrid, ' data-ir="catalogo"')}</div>
    </header>
    <section class="ini3__pesquisa pq__pesquisa" aria-labelledby="i3-pesquisa-t" data-entra="1">
      <h2 class="sr-only" id="i3-pesquisa-t">Como queres pesquisar?</h2>
      <div class="ini3__separadores pq__modos" role="tablist" aria-label="Como queres pesquisar">
        ${cartoes.map(([t, desc, acao], i) => `<button type="button" role="tab" class="ini3__separador pq__modo" id="i3-tab-${MODOS[i][0]}" aria-controls="i3-cartao-${MODOS[i][0]}" aria-selected="${i === atual}" tabindex="${i === atual ? 0 : -1}" data-modo="${i}">
          <span class="pq__modo-icone">${L(ICONES[i])}</span>
          <span class="pq__modo-texto"><b>${t}</b><span>${desc}</span></span>
          <span class="pq__modo-acao">${acao}${L(chevronRight)}</span>
          ${DESENHOS[i]}
        </button>`).join('')}
      </div>
      ${e === 'carga' ? aPreparar() : ''}
      <div class="pq__painel"${e === 'carga' ? ' hidden' : ''}>
        <div class="ini3__palco"><div class="ini3__pista">
          ${cartoes.map(([t, , , corpo], i) => `<section class="ini3__cartao pq__form" id="i3-cartao-${MODOS[i][0]}" role="tabpanel" aria-labelledby="i3-tab-${MODOS[i][0]}" aria-label="${t}" data-cartao="${i}"${lado(i)}${e === 'esqueleto' ? ' aria-busy="true"' : ''}>
            <div class="ini3__corpo">${e === 'esqueleto' ? '<div class="ini3__esq-bloco" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' : corpo(i === atual ? e : '')}</div>
          </section>`).join('')}
        </div></div>
      </div>
      <div class="ini4__veiculo" data-veiculo aria-live="polite"${veiculo ? '' : ' hidden'}>${veiculo}</div>
      <section class="pr" data-pr aria-labelledby="pr-t" aria-live="polite"${comResultados ? '' : ' hidden'}>${resultados}</section>
      ${e === 'limpa' ? '<p class="pq__aviso-limpa" role="status">A pesquisa foi limpa. Escolhe outra forma de pesquisar ou escreve outra referência.</p>' : ''}
      <details class="pq__avancada">
        <summary>${L(list)}<span><b>Pesquisa avançada</b><small>Pelo catálogo: marcas e modelos, grupos de montagem sem veículo, informação técnica</small></span>${L(chevronRight, 'pq__opcoes-seta')}</summary>
        <ul class="pq__avancada-lista" role="list">
          <li>${secundario('Marcas e modelos', layoutGrid, ' data-ir="catalogo"')}</li>
          <li>${secundario('Pesquisa universal por grupo', layers, ' data-pq-universal')}</li>
          <li>${secundario('Informação técnica do veículo', cog, ' data-ir="tecnica"')}</li>
        </ul>
      </details>
      ${e === 'vazio' ? guia() : ''}
    </section>
    ${blocosPesquisa(d, ee)}`}
  </main>
  ${COMANDO(e === 'comando')}${e === 'sessao' ? sessao() : ''}
  <p class="ini3__aviso" role="status" aria-live="polite"></p>
  <div class="ini4__brinde" data-por-cima role="status" aria-live="polite" hidden></div>
</div>`;
}
