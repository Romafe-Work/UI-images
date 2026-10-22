/* =========================================================
   ERP — 05 · Início v3 e a moldura do ERP (22 out. 2026), do briefing dela «ROMAFE ERP V3 — Seamless
   authentication, cinematic opening & main workspace»
   A página principal do ERP, que é onde a abertura acaba (a abertura v6 desenha-se por cima desta mesma página e
   a marca desliza para o sítio dela no cabeçalho). Partes:
     - o cabeçalho do ERP (topoErp, o mesmo do resto);
     - o menu lateral: só os módulos do perfil com ecrãs no protótipo (Início e Compras, com os seus ecrãs), a
       partir da lista de módulos (inicio-dados.ts); recolhe-se a ícones; o indicador desliza para o ativo; no
       telemóvel abre por cima. (Os menus vindos da base de dados ficaram por fazer a 21 out.: ela disse «nada».)
     - a área de trabalho: «Boa tarde, Rui» e «Bem-vindo à tua área de trabalho.»; o painel de Compras, o primeiro
       módulo, com «Abrir Compras»; «Continuar de onde ficaste» e «Requer atenção» (os do protótipo, sem números
       inventados aqui); o acesso rápido só ao que existe.
   Não substitui a v1 nem a v2: fica ao lado, e é a que abre.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdErp } from './ids';
import { topoErp } from './inicio-v2';
import { PECAS, caixa } from './abertura-v3';
import { PERFIS, EMPRESA, MODULOS, RECENTES, PRIORIDADES, type IdPerfil } from './inicio-dados';
import house from 'lucide-static/icons/house.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import panelLeft from 'lucide-static/icons/panel-left.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import listTodo from 'lucide-static/icons/list-todo.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import filePen from 'lucide-static/icons/file-pen.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import pin from 'lucide-static/icons/pin.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import menu from 'lucide-static/icons/menu.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import clipboardList from 'lucide-static/icons/clipboard-list.svg?raw';
import scale from 'lucide-static/icons/scale.svg?raw';
import packageX from 'lucide-static/icons/package-x.svg?raw';
import users from 'lucide-static/icons/users.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const VERSAO_INICIO_V3 = 'v3';

/* ---------- o menu: os módulos do perfil que têm ecrãs (os outros não aparecem como se funcionassem) ---------- */
const ICONE: Record<string, string> = { inicio: house, compras: shoppingCart };
const ECRAS = new Set(['inicio', 'compras', 'compras-rececoes', 'compras-fornecedores', 'compras-requisicoes', 'compras-cotacoes', 'compras-faltas']);
export function menuDoPerfil(perfil: IdPerfil) {
  const p = PERFIS[perfil];
  return MODULOS.filter((m) => p.modulos.includes(m.id) && (m.id === 'inicio' || m.subs.some((s) => s.ecra && ECRAS.has(s.ecra))))
    .map((m) => ({ id: m.id, nome: m.nome, icone: ICONE[m.id] ?? house, subs: m.subs.filter((s) => s.ecra && ECRAS.has(s.ecra)) }));
}
export function lado(perfil: IdPerfil, ativo = 'inicio'): string {
  return `<nav class="sh-lado" aria-label="Módulos do ERP" data-sh-lado>
    <button type="button" class="sh-recolher" data-sh-recolher aria-label="Recolher o menu" aria-expanded="true">${L(panelLeft)}</button>
    <i class="sh-indicador" aria-hidden="true" data-sh-indicador></i>
    <ul class="sh-lista">${menuDoPerfil(perfil).map((m) => m.subs.length
      ? `<li><button type="button" class="sh-item${m.id === 'compras' && ativo !== 'inicio' ? ' is-ativo' : ''}" data-sh-abrir="${m.id}" aria-expanded="true" aria-controls="sh-sub-${m.id}" data-dica="${m.nome}">${L(m.icone, 'sh-ic')}<span>${m.nome}</span>${L(chevronDown, 'sh-seta')}</button>
          <ul class="sh-subs" id="sh-sub-${m.id}">${m.subs.map((s) => `<li><button type="button" class="sh-sub${s.ecra === ativo ? ' is-ativo' : ''}" data-sh-ir="${s.ecra}"${s.ecra === ativo ? ' aria-current="page"' : ''}>${esc(s.nome)}</button></li>`).join('')}</ul></li>`
      : `<li><button type="button" class="sh-item${m.id === ativo ? ' is-ativo' : ''}" data-sh-ir="${m.id}"${m.id === ativo ? ' aria-current="page"' : ''} data-dica="${m.nome}">${L(m.icone, 'sh-ic')}<span>${m.nome}</span></button></li>`).join('')}</ul>
    <p class="sh-lado-pe">${L(building)}<span>${esc(EMPRESA.nome)}<small>${esc(EMPRESA.local)}</small></span></p>
  </nav>`;
}

/* ---------- a área de trabalho ---------- */
const ICONE_RECENTE: Record<string, string> = { rascunho: filePen, documento: fileText, registo: users, pesquisa: search, espaco: pin };
function painelCompras(): string {
  const pecas = ['compras', 'documento', 'pacote'].map((id, i) => `<g transform="translate(${[90, 210, 330][i]} ${[120, 70, 125][i]}) scale(1.25)" class="sh-peca" style="--i:${i}">${PECAS.find((p) => p.id === id)!.svg}</g>`).join('');
  return `<svg class="sh-compras-desenho" viewBox="0 0 420 220" aria-hidden="true">
    <path class="sh-fio" d="M90 140 L150 105 L210 90 L270 112 L330 145" pathLength="1"/>
    <g transform="translate(210 175)">${caixa(-60, -60, 0, 120, 120, 8, ' sh-base')}</g>${pecas}</svg>`;
}
const ACESSO: [string, string, string][] = [
  ['compras', 'Encomendas', fileText], ['compras-rececoes', 'Receções', packageCheck], ['compras-fornecedores', 'Fornecedores', users],
  ['compras-requisicoes', 'Requisições', clipboardList], ['compras-cotacoes', 'Cotações', scale], ['compras-faltas', 'Lista de faltas', packageX],
];

export function areaInicio(perfil: IdPerfil): string {
  const p = PERFIS[perfil];
  const recentes = RECENTES[perfil] ?? [], prio = PRIORIDADES[perfil] ?? [];
  return `<main class="sh-area" data-sh-area>
    <header class="sh-ola sh-r" style="--r:0">
      <h1><span data-hm-saudacao>Boa tarde</span>, ${esc(p.primeiro)}</h1>
      <p>Bem-vindo à tua área de trabalho.</p>
      <p class="sh-onde"><span>${L(building)}${esc(EMPRESA.nome)}</span><span>${L(mapPin)}${esc(EMPRESA.local)}</span></p>
    </header>
    <section class="sh-compras sh-r" style="--r:1" aria-labelledby="sh-cp-t">
      <div class="sh-compras-texto">
        <p class="sh-rotulo">O primeiro módulo</p>
        <h2 id="sh-cp-t">${L(shoppingCart)}Compras</h2>
        <p>Encomendas a fornecedor, receções, fornecedores, requisições, cotações e a lista de faltas.</p>
        <button type="button" class="sh-abrir" data-sh-ir="compras">Abrir Compras${L(arrowRight)}</button>
      </div>
      ${painelCompras()}
    </section>
    <div class="sh-duas">
      ${recentes.length ? `<section class="sh-bloco sh-r" style="--r:2" aria-labelledby="sh-ct-t"><h2 class="sh-h" id="sh-ct-t">${L(history)}Continuar de onde ficaste</h2>
        <ul class="sh-recentes">${recentes.slice(0, 4).map((r) => `<li><button type="button" data-sh-ir="${r.ecra ?? (r.doc ? 'compras-encomenda' : 'compras')}"><span class="sh-rec-ic">${L(ICONE_RECENTE[r.tipo] ?? fileText)}</span><span class="sh-rec-t"><b>${esc(r.titulo)}</b><small>${esc(r.sub)}</small></span><small class="sh-quando">${esc(r.quando)}</small></button></li>`).join('')}</ul></section>` : ''}
      ${prio.length ? `<section class="sh-bloco sh-r" style="--r:3" aria-labelledby="sh-at-t"><h2 class="sh-h" id="sh-at-t">${L(listTodo)}Requer atenção <span class="sh-conta">${prio.length}</span></h2>
        <ul class="sh-atencao">${prio.slice(0, 4).map((r) => `<li><button type="button" data-sh-ir="compras"><span class="sh-doc">${esc(r.doc)}</span><span class="sh-rec-t"><b>${esc(r.titulo)}</b><small>${esc(r.quando)}</small></span>${L(arrowRight, 'sh-seta-l')}</button></li>`).join('')}</ul></section>` : ''}
    </div>
    <section class="sh-acesso sh-r" style="--r:4" aria-labelledby="sh-ac-t"><h2 class="sh-h" id="sh-ac-t">Acesso rápido</h2>
      <div>${ACESSO.map(([ir, t, i]) => `<button type="button" data-sh-ir="${ir}">${L(i)}${t}</button>`).join('')}</div></section>
  </main>`;
}

/** A página principal: o cabeçalho, o menu e a área de trabalho. A abertura v6 desenha-se por cima disto. */
export function paginaPrincipal(perfil: IdPerfil = 'compras', extra = ''): string {
  return `<div class="hm sh" data-hm data-sh>
  ${topoErp([['Início', '']], false, perfil).replace('<header class="hm-topo">', `<header class="hm-topo"><button type="button" class="sh-menu-movel" data-sh-movel aria-label="Abrir o menu">${L(menu)}</button>`)}
  <div class="sh-corpo">${lado(perfil)}${areaInicio(perfil)}</div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
  ${extra}
</div>`;
}

const NOTA = 'O Início v3 (22 out., briefing «ERP V3 — main workspace»): a moldura do ERP com o menu lateral (só Início e Compras), «Boa tarde», o painel de Compras, continuar de onde ficaste, requer atenção e acesso rápido; é onde a abertura acaba';
export const versaoInicioV3 = () => ({ id: VERSAO_INICIO_V3, nota: NOTA, html: paginaPrincipal() });
export const ecraInicioV3Estados = (): Ecra<IdErp>[] => [];
