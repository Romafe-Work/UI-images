/* =========================================================
   PEÇA A PEÇA — o histórico de documentos (26 nov. 2026)
   Um só desenho para os Pedidos v6 e as Guias de remessa v4 (briefings «Redesign premium do Histórico de pedidos»
   e «Redesign das Guias de remessa»: «devem parecer partes ligadas da mesma aplicação»). Cada ecrã dá os seus
   registos e colunas; aqui ficam o cabeçalho com o resumo, a barra de filtros com as etiquetas ativas, a cronologia
   por ano e mês (meses recolhíveis), a tabela (ordenável), o vazio e o painel de detalhe à direita.
   Os estados vêm separados por tipo (estado da encomenda / entrega, processamento, modalidade, documento) e têm
   sempre ícone e texto — a cor é só um reforço. Nada é inventado: cada registo traz só o que os dados dizem.
   O comportamento está em comportamento/historico.ts.
   ========================================================= */
import { L } from './inicio-espaco';
import search from 'lucide-static/icons/search.svg?raw';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import listTree from 'lucide-static/icons/list-tree.svg?raw';
import table from 'lucide-static/icons/table-2.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
/** dd/mm/aaaa → «15 abr 2024» */
export const dataCurta = (d: string) => { const [dd, mm, aa] = d.split('/'); return `${+dd} ${MESES[+mm - 1].slice(0, 3)} ${aa}`; };
const iso = (d: string) => { const [dd, mm, aa] = d.split('/'); return `${aa}-${mm}-${dd}`; };

/** Um estado: a chave (para a cor e o filtro), o nome escrito e o tom — ok (verde), curso (azul), atencao (âmbar),
    neutro (cinzento), erro (vermelho, só quando os dados dizem que há um problema). */
export type Tom = 'ok' | 'curso' | 'atencao' | 'neutro' | 'erro';
export type Estado = { k: string; nome: string; tom: Tom; icone: string };
export const selo = (e: Estado, cls = '') => `<span class="hx__estado hx__estado--${e.tom}${cls ? ` ${cls}` : ''}">${e.icone}<span>${esc(e.nome)}</span></span>`;

export interface Registo {
  id: string;
  /** dd/mm/aaaa */
  data: string;
  /** a linha de baixo do identificador (sem a data, que já está na coluna da cronologia) */
  meta: string;
  /** uma linha opcional mais apagada (morada, observação) */
  nota?: string;
  /** o estado principal (na cronologia, a cor do ponto) e os secundários, cada um com o seu rótulo */
  principal: Estado;
  outros: { rotulo: string; estado: Estado }[];
  valor?: string;
  valorRotulo?: string;
  /** valores dos filtros (chave do filtro → valor) e o texto pesquisável */
  filtros: Record<string, string>;
  procura: string;
  /** o conteúdo do painel de detalhe */
  detalhe: string;
}
export interface Coluna { rotulo: string; html: (r: Registo) => string; ordenar?: (r: Registo) => string | number; num?: boolean }
export interface Filtro { k: string; rotulo: string; opcoes: [string, string][] }
export interface Historico {
  chave: string; titulo: string; sub: string;
  /** o resumo do cabeçalho: [rótulo, número] contados dos registos */
  resumo: [string, number | string][];
  procura: string; filtros: Filtro[]; colunas: Coluna[]; registos: Registo[];
  /** «pedido», «pedidos»; «guia», «guias» */
  um: string; varios: string;
  rotuloAbrir: string;
}

function cronologia(h: Historico): string {
  const grupos = new Map<string, Registo[]>();
  h.registos.forEach((r) => { const [, mm, aa] = r.data.split('/'); const k = `${aa}-${mm}`; grupos.set(k, [...(grupos.get(k) ?? []), r]); });
  let ano = '';
  return `<div class="hx__crono" data-hx-crono>${[...grupos].map(([k, rs]) => {
    const [aa, mm] = k.split('-'), cab = aa !== ano ? `<h2 class="hx__ano">${aa}</h2>` : ''; ano = aa;
    const idm = `hx-${h.chave}-${k}`;
    return `${cab}<section class="hx__mes" data-hx-mes="${k}">
      <h3 class="hx__mes-cab"><button type="button" class="hx__mes-botao" aria-expanded="true" aria-controls="${idm}">${L(chevronDown, 'hx__mes-seta')}<span>${MESES[+mm - 1]} ${aa}</span><span class="hx__mes-n" data-hx-mes-n>${rs.length} ${rs.length === 1 ? h.um : h.varios}</span></button></h3>
      <ol class="hx__lista" id="${idm}">${rs.map((r) => {
        const [dd, mm2] = r.data.split('/');
        return `<li class="hx__item" data-hx-reg="${esc(r.id)}" ${atributos(r)}>
          <span class="hx__dia" aria-hidden="true"><b>${dd}</b>${MESES[+mm2 - 1].slice(0, 3)}</span>
          <span class="hx__ponto hx__ponto--${r.principal.tom}" aria-hidden="true">${r.principal.icone}</span>
          <button type="button" class="hx__cartao" data-hx-abrir="${esc(r.id)}" aria-haspopup="dialog" aria-label="${esc(r.id)}, ${dataCurta(r.data)}, ${esc(r.principal.nome)}${r.valor ? `, ${esc(r.valor)}` : ''}. ${h.rotuloAbrir}">
            <span class="hx__id"><b class="hx__ref">${esc(r.id)}</b><span class="hx__meta">${r.meta}</span>${r.nota ? `<span class="hx__nota">${r.nota}</span>` : ''}</span>
            <span class="hx__estados">${selo(r.principal, 'hx__estado--forte')}${r.outros.map((o) => `<span class="hx__outro"><span class="hx__outro-r">${o.rotulo}</span>${selo(o.estado)}</span>`).join('')}</span>
            <span class="hx__fim">${r.valor ? `<span class="hx__valor">${r.valor}${r.valorRotulo ? `<small>${r.valorRotulo}</small>` : ''}</span>` : ''}<span class="hx__ver">${h.rotuloAbrir}${L(chevronRight)}</span></span>
          </button>
        </li>`;
      }).join('')}</ol>
    </section>`;
  }).join('')}</div>`;
}
const atributos = (r: Registo) => `data-data="${iso(r.data)}" data-procura="${esc(r.procura.toLowerCase())}" ${Object.entries(r.filtros).map(([k, v]) => `data-f-${k}="${esc(v)}"`).join(' ')}`;

function tabela(h: Historico): string {
  return `<div class="hx__tabela-caixa" data-hx-tabela hidden><table class="hx__tabela">
    <thead><tr>${h.colunas.map((c, i) => `<th scope="col"${c.num ? ' class="hx__num"' : ''}${c.ordenar ? ` aria-sort="none"` : ''}>${c.ordenar ? `<button type="button" class="hx__ordenar" data-hx-ordenar="${i}">${c.rotulo}${L(arrowUpDown)}</button>` : c.rotulo}</th>`).join('')}<th scope="col"><span class="sr-only">Ações</span></th></tr></thead>
    <tbody>${h.registos.map((r) => `<tr class="hx__linha" data-hx-reg="${esc(r.id)}" ${atributos(r)} ${h.colunas.map((c, i) => (c.ordenar ? `data-o${i}="${esc(String(c.ordenar(r)))}"` : '')).join(' ')}>
      ${h.colunas.map((c, i) => `<td${c.num ? ' class="hx__num"' : ''}>${i === 0 ? `<button type="button" class="hx__ligacao" data-hx-abrir="${esc(r.id)}" aria-haspopup="dialog">${c.html(r)}</button>` : c.html(r)}</td>`).join('')}
      <td class="hx__num"><button type="button" class="hx__ver hx__ver--tabela" data-hx-abrir="${esc(r.id)}" aria-haspopup="dialog" aria-label="${h.rotuloAbrir}: ${esc(r.id)}">${h.rotuloAbrir}${L(chevronRight)}</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

export function historicoHtml(h: Historico): string {
  const n = h.registos.length;
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--hx portal--hx-${h.chave}" data-hx-um="${h.um}" data-hx-varios="${h.varios}">
  <main class="hx" data-hx="${h.chave}">
    <header class="hx__cabeca">
      <div><h1 class="hx__titulo">${h.titulo}</h1><p class="hx__sub">${h.sub}</p></div>
      <dl class="hx__resumo">${h.resumo.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </header>
    <form class="hx__barra" data-hx-filtros role="search" aria-label="Filtrar ${h.varios}" onsubmit="return false">
      <label class="hx__campo hx__campo--procura"><span class="sr-only">${h.procura}</span>${L(search)}<input type="search" data-hx-procura placeholder="${h.procura}" autocomplete="off"></label>
      <fieldset class="hx__periodo"><legend class="sr-only">Período</legend>
        <label class="hx__campo">${L(calendar)}<span class="sr-only">De</span><input type="date" data-hx-de aria-label="Desde"></label>
        <span aria-hidden="true">–</span>
        <label class="hx__campo"><span class="sr-only">Até</span><input type="date" data-hx-ate aria-label="Até"></label>
      </fieldset>
      ${h.filtros.map((f) => `<label class="hx__campo hx__campo--sel"><span class="sr-only">${f.rotulo}</span><select data-hx-filtro="${f.k}" aria-label="${f.rotulo}"><option value="">${f.rotulo}: todos</option>${f.opcoes.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>`).join('')}
      <div class="hx__vistas" role="group" aria-label="Vista">
        <button type="button" class="hx__vista" data-hx-vista="crono" aria-pressed="true">${L(listTree)}Cronologia</button>
        <button type="button" class="hx__vista" data-hx-vista="tabela" aria-pressed="false">${L(table)}Tabela</button>
      </div>
    </form>
    <div class="hx__ativos"><p class="hx__conta" data-hx-conta aria-live="polite">${n} ${n === 1 ? h.um : h.varios}</p><ul class="hx__chips" data-hx-chips></ul><button type="button" class="hx__limpar" data-hx-limpar hidden>${L(rotateCcw)}Limpar filtros</button></div>
    ${cronologia(h)}
    ${tabela(h)}
    <div class="hx__vazio" data-hx-vazio hidden>${L(searchX)}<div><b>Nenhum resultado com estes filtros.</b><p>Experimente outro período ou outro estado — ou limpe os filtros para ver ${n === 1 ? `o ${h.um}` : `os ${n} ${h.varios}`}.</p><button type="button" class="btn hx__btn" data-hx-limpar>${L(rotateCcw, 'btn__icone')}<span class="btn__rotulo">Limpar filtros</span></button></div></div>
  </main>
  ${h.registos.map((r) => `<template data-hx-detalhe="${esc(r.id)}">${r.detalhe}</template>`).join('')}
  <dialog class="hx__gaveta" data-hx-gaveta aria-labelledby="hx-g-t">
    <div class="hx__gaveta-caixa">
      <header class="hx__gaveta-topo"><h2 id="hx-g-t" class="hx__gaveta-t"></h2><button type="button" class="hx__fechar" data-hx-fechar aria-label="Fechar">${L(x)}</button></header>
      <div class="hx__gaveta-corpo" data-hx-corpo></div>
    </div>
  </dialog>
  <p class="sr-only" role="status" aria-live="polite" data-hx-aviso></p>
</div>`;
}

/** Peças do painel de detalhe, iguais nos dois ecrãs. */
export const secao = (t: string, corpo: string) => `<section class="hx__sec"><h3 class="hx__sec-t">${t}</h3>${corpo}</section>`;
export const pares = (ps: [string, string][]) => `<dl class="hx__pares">${ps.filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
/** Uma ligação a outro documento: abre o outro ecrã já nesse documento (sessionStorage, como no resto do portal). */
export const ligacao = (ecra: string, chave: string, valor: string, texto: string, icone: string) =>
  `<button type="button" class="hx__doc" data-hx-ir="${ecra}" data-hx-chave="${chave}" data-hx-valor="${esc(valor)}">${icone}<span>${texto}</span>${L(chevronRight)}</button>`;
