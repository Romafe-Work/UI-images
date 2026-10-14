/* =========================================================
   GOPARTS — 12 · Histórico de pedidos v4 (15 out. 2026)
   Do briefing dela («ROMAFE GoParts — Histórico de Pedidos»): filtros compactos num painel liso (nada de painel
   azul), o estado num seletor com a risca laranja, a tabela com o pedido que se abre na própria linha (resumo,
   percurso, artigos, entrega, documentos e ações) e, em alternativa, o mesmo pedido num painel à direita.
   O percurso mostra só os passos que o pedido tem, com as horas que tem; nada se inventa. Os dados são os de
   pedidos-dados.ts (os mesmos seis pedidos da v2 e da v3). Feito em TypeScript e CSS, sem React.
   O comportamento está em comportamento/pedidos-v4.ts e o CSS em css/pedidos-v4.css.
   ========================================================= */
import { PEDIDOS, LINHAS, euros, type Pedido, type LinhaPedido } from './pedidos-dados';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import barcode from 'lucide-static/icons/barcode.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';
import panelRight from 'lucide-static/icons/panel-right-open.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';
import slidersHorizontal from 'lucide-static/icons/sliders-horizontal.svg?raw';
import layoutList from 'lucide-static/icons/list.svg?raw';
import table from 'lucide-static/icons/table.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const ICONES = { check: L(check), truck: L(truck), pkg: L(pkg), packageCheck: L(packageCheck), inbox: L(inbox), rotateCcw: L(rotateCcw, 'btn__icone'), clock: L(clock), circleCheck: L(circleCheck) };

/** O valor do pedido: a soma dos artigos. */
export const valorDe = (p: Pedido) => p.artigos.reduce((s, a) => s + a[3], 0);
export const pedidoDe = (num: string) => PEDIDOS.find((p) => p.num === num)!;
export const linhaDe = (num: string) => LINHAS.find((l) => l.num === num)!;
const aaaammdd = (d: string) => d.split('/').reverse().join('');

/* ---------- os estados, em texto e ícone (nunca só a cor) ---------- */
export const ESTADO = (e: 'proc' | 'sem') => e === 'proc'
  ? `<span class="ped4__selo ped4__selo--ok">${L(circleCheck)}Processado</span>`
  : `<span class="ped4__selo ped4__selo--espera">${L(clock)}Sem processamento</span>`;
export const RECOLHA = (r: boolean) => r ? `<span class="ped4__selo ped4__selo--recolher">${L(pkg)}Por recolher</span>` : '<span class="ped4__nada" aria-label="Sem recolha">—</span>';

/* ---------- o percurso: só os passos que o pedido tem ---------- */
/** O ícone do passo onde o pedido está: camião ao sair, embalagem pronta ao levantar, visto no fim. */
const iconeDoPasso = (nome: string) => /Expedido/i.test(nome) ? L(truck) : /levantar/i.test(nome) ? L(packageCheck) : /Entregue|Levantado/i.test(nome) ? L(circleCheck) : /Recebido/i.test(nome) ? L(inbox) : L(pkg);
export function percurso(p: Pedido): string {
  const n = p.percurso.length;
  const ultimo = p.percurso.reduce((k, s, i) => (s[1] ? i : k), 0);
  const fim = ultimo === n - 1 && !!p.percurso[n - 1][1];
  const prox = fim ? -1 : ultimo + 1;
  const passos = p.percurso.map(([nome, quando, nota], i) => {
    const cls = quando ? 'is-feito' : i === prox ? 'is-proximo' : 'is-por';
    const est = quando ? 'concluído' : i === prox ? 'o passo seguinte' : 'por acontecer';
    return `<li class="ped4__tl-passo ${cls}" style="--i:${i}"${i === ultimo ? ' aria-current="step"' : ''}><span class="ped4__tl-ponto" aria-hidden="true">${quando ? L(check) : ''}</span><b>${esc(nome)}</b><small>${quando ? esc(quando) : i === prox ? 'Ainda não' : '—'}</small>${nota ? `<em>${esc(nota)}</em>` : ''}<span class="sr-only">${est}</span></li>`;
  }).join('');
  return `<div class="ped4__tl" style="--n:${n};--p:${n > 1 ? (ultimo / (n - 1)).toFixed(4) : 0}">
      <span class="ped4__tl-linha" aria-hidden="true"><span class="ped4__tl-cheia"></span></span>
      <span class="ped4__tl-mover" aria-hidden="true"><span class="ped4__tl-icone">${iconeDoPasso(p.percurso[ultimo][0])}</span></span>
      <ol class="ped4__tl-passos" aria-label="Percurso do pedido">${passos}</ol>
    </div>`;
}

/* ---------- o pedido aberto (na linha ou no painel) ---------- */
export function detalhe(p: Pedido, l: LinhaPedido, onde: 'linha' | 'gaveta' = 'linha'): string {
  const pend = p.artigos.filter((a) => a[1] < a[0]).length;
  const artigos = p.artigos.map(([ped, serv, desc, valor], i) => `<tr style="--i:${i}"><td class="ped4__num">${ped}</td><td class="ped4__num">${serv}</td><td class="ped4__num${serv < ped ? ' ped4__falta' : ''}">${ped - serv}</td><td>${esc(desc)}</td><td class="ped4__num">${euros(valor)}</td></tr>`).join('');
  const entrega = l.recolher
    ? `<p class="ped4__ent">${L(store)}<span><b>Levanta no balcão</b>Armazém ${esc(l.armazem)}</span></p>`
    : `<p class="ped4__ent">${L(mapPin)}<span><b>${esc(l.morada[0])}</b>${esc(l.morada[1])}</span></p>`;
  const docs = [
    p.guia ? `<li><span class="ped4__doc-i">${L(fileText)}</span><span><b>Guia de remessa</b>${p.guia}</span><button type="button" class="btn btn--ghost btn--sm" data-ir="guias">${L(fileText, 'btn__icone')}<span class="btn__rotulo">Ver guia</span></button></li>` : '',
    p.fatura ? `<li><span class="ped4__doc-i">${L(receipt)}</span><span><b>Fatura</b>${p.fatura}</span><button type="button" class="btn btn--ghost btn--sm" data-ir="faturas">${L(receipt, 'btn__icone')}<span class="btn__rotulo">Ver fatura</span></button></li>` : '',
  ].join('');
  return `<div class="ped4__det ped4__det--${onde}">
    <section class="ped4__det-resumo" aria-label="Resumo">
      <dl class="ped4__dl">
        <div><dt>Data</dt><dd>${l.data}</dd></div><div><dt>Armazém</dt><dd>${esc(l.armazem)}</dd></div>
        <div><dt>Artigos</dt><dd>${p.artigos.length}${pend ? ` <span class="ped4__falta">· ${pend} ${pend === 1 ? 'pendente' : 'pendentes'}</span>` : ''}</dd></div>
        <div><dt>Valor</dt><dd>${euros(valorDe(p))}</dd></div>
        ${l.obs ? `<div class="ped4__dl-largo"><dt>Observações</dt><dd>${esc(l.obs)}</dd></div>` : ''}
      </dl>
      <div class="ped4__det-estado">${ESTADO(l.estado)}${l.recolher ? RECOLHA(true) : ''}</div>
    </section>
    <section class="ped4__det-percurso" aria-label="Percurso"><h3 class="ped4__h">Percurso</h3>${percurso(p)}</section>
    <section class="ped4__det-artigos" aria-label="Artigos"><h3 class="ped4__h">Artigos <span>${p.artigos.length}</span></h3>
      <div class="ped4__art-rolo"><table class="ped4__art"><thead><tr><th class="ped4__num">Pedida</th><th class="ped4__num">Servida</th><th class="ped4__num">Pendente</th><th>Artigo</th><th class="ped4__num">Valor</th></tr></thead><tbody>${artigos}</tbody>
      <tfoot><tr><td colspan="4">Total</td><td class="ped4__num">${euros(valorDe(p))}</td></tr></tfoot></table></div>
    </section>
    <section class="ped4__det-lado" aria-label="Entrega e documentos">
      <h3 class="ped4__h">${l.recolher ? 'Recolha' : 'Entrega'}</h3>${entrega}
      <h3 class="ped4__h">Documentos</h3>${docs ? `<ul class="ped4__docs">${docs}</ul>` : '<p class="ped4__sem-docs">Ainda sem guia nem fatura: são emitidas quando o pedido sai do armazém.</p>'}
      <div class="ped4__det-accoes">
        <button type="button" class="btn btn--ghost btn--sm" data-repetir="${p.num}">${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Repetir pedido</span></button>
        ${onde === 'linha' ? `<button type="button" class="btn btn--ghost btn--sm" data-gaveta="${p.num}">${L(panelRight, 'btn__icone')}<span class="btn__rotulo">Abrir no painel</span></button>` : ''}
      </div>
    </section>
  </div>`;
}

/* ---------- a tabela ---------- */
const ord = (k: string, t: string, cls = '') => `<th${cls ? ` class="${cls}"` : ''} aria-sort="none"><button type="button" class="ped4__ordenar" data-ordenar="${k}">${t}${L(arrowUpDown)}</button></th>`;
export function linha(p: Pedido, l: LinhaPedido, i: number): string {
  const id = `ped4-d-${p.num.replace(/\D/g, '')}`;
  return `<tr class="ped4__linha" data-num="${p.num}" data-estado="${l.estado}" data-data="${aaaammdd(l.data)}" data-valor="${valorDe(p).toFixed(2)}" style="--i:${i}">
      <td class="ped4__c-abrir"><button type="button" class="ped4__abrir" aria-expanded="false" aria-controls="${id}" aria-label="Abrir o pedido ${p.num}">${L(chevronRight)}</button></td>
      <td data-r="Pedido"><span class="ped4__ref">${p.num}</span></td>
      <td data-r="Data" class="ped4__data">${l.data}</td><td data-r="Armazém" class="ped4__c-arm">${esc(l.armazem)}</td>
      <td data-r="Entrega" class="ped4__c-ent">${l.recolher ? `<span class="ped4__m1">Levanta no balcão</span><span class="ped4__m2">${esc(l.armazem)}</span>` : `<span class="ped4__m1">${esc(l.morada[0])}</span><span class="ped4__m2">${esc(l.morada[1])}</span>`}</td>
      <td data-r="Artigos" class="ped4__num ped4__c-art">${p.artigos.length}</td>
      <td data-r="Observações" class="ped4__c-obs">${l.obs ? esc(l.obs) : '<span class="ped4__nada">—</span>'}</td>
      <td data-r="Valor" class="ped4__num ped4__valor">${euros(valorDe(p))}</td>
      <td data-r="Estado" class="ped4__c-est">${ESTADO(l.estado)}</td>
      <td data-r="Recolha" class="ped4__c-rec">${RECOLHA(l.recolher)}</td>
    </tr>
    <tr class="ped4__linha-det" id="${id}" data-de="${p.num}" hidden><td colspan="10"></td></tr>`;
}
const campo = (id: string, rotulo: string, icone: string, extra: string) => `<div class="ped4__campo"><label for="${id}">${rotulo}</label><span class="ped4__caixa">${L(icone)}<input class="ped4__input" id="${id}" ${extra}></span><small class="ped4__erro" id="${id}-erro" hidden></small></div>`;

/* ---------- a cronologia (15 out., o segundo briefing dela: «Order journey») ----------
   Os pedidos do mais recente para o mais antigo, agrupados por mês, ligados por uma linha vertical que se desenha
   com o scroll. Cada cartão abre-se no sítio com o mesmo detalhe da tabela. */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export function item(p: Pedido, l: LinhaPedido, i: number): string {
  const [d, m] = l.data.split('/');
  const id = `ped4-c-${p.num.replace(/\D/g, '')}`;
  return `<li class="ped4__c-item" data-num="${p.num}" data-estado="${l.estado}" style="--i:${i}">
      <span class="ped4__c-data" aria-hidden="true"><b>${d}</b>${MESES[+m - 1].slice(0, 3)}</span>
      <span class="ped4__c-marca" aria-hidden="true"></span>
      <article class="ped4__c-cartao">
        <button type="button" class="ped4__c-cabeca" aria-expanded="false" aria-controls="${id}">
          <span class="ped4__c-id"><span class="ped4__ref">${p.num}</span><span class="ped4__c-meta">${l.data} · ${esc(l.armazem)} · ${p.artigos.length} ${p.artigos.length === 1 ? 'artigo' : 'artigos'}</span><span class="ped4__c-encontrado" hidden></span></span>
          <span class="ped4__c-obs">${l.obs ? esc(l.obs) : ''}</span>
          <span class="ped4__c-selos">${ESTADO(l.estado)}${l.recolher ? RECOLHA(true) : `<span class="ped4__selo ped4__selo--neutro">${L(mapPin)}Entrega</span>`}</span>
          <span class="ped4__c-valor">${euros(valorDe(p))}</span>
          <span class="ped4__c-seta" aria-hidden="true">${L(chevronRight)}</span>
        </button>
        <div class="ped4__c-det" id="${id}" hidden></div>
      </article>
    </li>`;
}
export function cronologia(): string {
  const meses = new Map<string, LinhaPedido[]>();
  [...LINHAS].sort((a, b) => aaaammdd(b.data).localeCompare(aaaammdd(a.data))).forEach((l) => { const [, m, a] = l.data.split('/'); const k = `${a}-${m}`; meses.set(k, [...(meses.get(k) || []), l]); });
  let i = 0;
  return `<div class="ped4__crono">
      <span class="ped4__c-linha" aria-hidden="true"><span class="ped4__c-linha-cheia"></span></span>
      ${Array.from(meses).map(([k, ls]) => { const [a, m] = k.split('-'); return `<section class="ped4__mes" data-mes="${k}" aria-label="${MESES[+m - 1]} de ${a}"><h2 class="ped4__mes-t"><span>${MESES[+m - 1][0].toUpperCase()}${MESES[+m - 1].slice(1)} de ${a}</span><small><b>${ls.length}</b> ${ls.length === 1 ? 'pedido' : 'pedidos'}</small></h2><ol class="ped4__c-lista">${ls.map((l) => item(pedidoDe(l.num), l, i++)).join('')}</ol></section>`; }).join('')}
      <p class="ped4__c-fim"><span class="ped4__c-marca" aria-hidden="true"></span>Não há pedidos mais antigos neste período.</p>
    </div>`;
}

export interface OpcoesPedidos { linhas?: string; conta?: number; total?: number; vista?: 'cronologia' | 'tabela' }
export function pedidosV4(op: OpcoesPedidos = {}): string {
  const total = LINHAS.reduce((s, l) => s + valorDe(pedidoDe(l.num)), 0);
  const n = (e: string) => LINHAS.filter((l) => e === 'todos' || l.estado === e).length;
  const linhas = op.linhas ?? LINHAS.map((l, i) => linha(pedidoDe(l.num), l, i)).join('');
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ped4">
  <main class="ped4" data-pedidos4>
    <header class="ped4__cabeca">
      <div><h1 class="ped4__titulo">Pedidos</h1><p class="ped4__sub">Pesquise e acompanhe os pedidos da sua conta.</p></div>
      <dl class="ped4__kpi">
        <div><dt>Pedidos</dt><dd data-kpi="n">${op.conta ?? LINHAS.length}</dd></div>
        <div><dt>Valor no período</dt><dd data-kpi="total">${euros(op.total ?? total)}</dd></div>
      </dl>
    </header>

    <section class="ped4__filtros" aria-label="Filtrar pedidos">
      <button type="button" class="btn btn--ghost btn--sm ped4__filtros-abrir" aria-expanded="false" aria-controls="ped4-campos">${L(slidersHorizontal, 'btn__icone')}<span class="btn__rotulo">Filtros</span><span class="ped4__filtros-n" hidden></span></button>
      <form class="ped4__campos" id="ped4-campos" novalidate>
        ${campo('ped4-de', 'Data a partir de', calendar, 'type="text" value="01/03/2024" inputmode="numeric" placeholder="dd/mm/aaaa" autocomplete="off"')}
        ${campo('ped4-ate', 'Data até', calendar, 'type="text" inputmode="numeric" placeholder="dd/mm/aaaa" autocomplete="off"')}
        ${campo('ped4-num', 'N.º do pedido', hash, 'type="text" placeholder="P2024/…" autocomplete="off"')}
        ${campo('ped4-ref', 'Referência', barcode, 'type="text" placeholder="Referência da peça" autocomplete="off"')}
        <div class="ped4__botoes">
          <button type="button" class="btn btn--ghost ped4__limpar">${L(eraser, 'btn__icone')}<span class="btn__rotulo">Limpar</span></button>
          <button type="submit" class="btn btn--acao ped4__pesquisar">${L(search, 'btn__icone')}<span class="btn__rotulo">Pesquisar</span></button>
        </div>
      </form>
      <div class="ped4__baixo">
        <div class="ped4__estados" role="group" aria-label="Estado do pedido">
          <button type="button" class="ped4__est" data-filtro="todos" aria-pressed="true">${L(layoutList)}Todos <span class="ped4__est-n">${n('todos')}</span></button>
          <button type="button" class="ped4__est" data-filtro="proc" aria-pressed="false">${L(circleCheck)}Processado <span class="ped4__est-n">${n('proc')}</span></button>
          <button type="button" class="ped4__est" data-filtro="sem" aria-pressed="false">${L(clock)}Sem processamento <span class="ped4__est-n">${n('sem')}</span></button>
          <i class="ped4__est-risca" aria-hidden="true"></i>
        </div>
        <ul class="ped4__chips" aria-label="Filtros aplicados"></ul>
      </div>
    </section>

    <section class="ped4__lista" aria-label="Pedidos" data-vista="${op.vista ?? 'cronologia'}">
      <div class="ped4__lista-cabeca"><p class="ped4__conta" aria-live="polite">A mostrar <b>${op.conta ?? LINHAS.length}</b> de ${LINHAS.length} pedidos</p><p class="ped4__a-atualizar" role="status" hidden></p>
        <div class="ped4__vistas" role="group" aria-label="Ver como"><button type="button" class="ped4__vista" data-vista="cronologia" aria-pressed="${(op.vista ?? 'cronologia') === 'cronologia'}">${L(history)}Cronologia</button><button type="button" class="ped4__vista" data-vista="tabela" aria-pressed="${op.vista === 'tabela'}">${L(table)}Tabela</button></div></div>
      ${cronologia()}
      <div class="ped4__tabela"><table>
        <thead><tr><th class="ped4__c-abrir"><span class="sr-only">Abrir</span></th>${ord('num', 'Pedido')}${ord('data', 'Data')}<th class="ped4__c-arm">Armazém</th><th class="ped4__c-ent">Entrega</th><th class="ped4__num ped4__c-art">Artigos</th><th class="ped4__c-obs">Observações</th>${ord('valor', 'Valor', 'ped4__num')}<th class="ped4__c-est">Estado</th><th class="ped4__c-rec">Recolha</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table></div>
      <div class="ped4__vazio" hidden></div>
      <p class="ped4__pe">Desde 01/03/2024 até hoje · os valores são os do pedido</p>
    </section>

    <div class="ped4__veu" hidden></div>
    <aside class="ped4__gaveta" role="dialog" aria-modal="true" aria-labelledby="ped4-g-num" hidden></aside>
  </main>
</div>`;
}
