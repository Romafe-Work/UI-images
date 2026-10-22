/* =========================================================
   ERP — 05 · Início v2 (22 out. 2026), do briefing dela «redesenhar o ecrã inicial do ERP… moderno, clean,
   industrial, robusto e premium» e da nota «quero simples e wow»
   A porta de entrada do trabalho diário, em cinco partes, de cima para baixo:
     1. o cabeçalho leve — ROMAFE · ERP, o caminho, a procura (Ctrl+K), ajuda, definições, avisos e a pessoa;
     2. a faixa de boas-vindas — «Bom dia, Rui», a data, o resumo do dia e onde se está (empresa, armazém, área);
     3. quatro números, com contadores — por aprovar, em curso, atrasadas, artigos em rutura (dos dados do
        protótipo, não inventados aqui); cada um abre o sítio onde se resolve;
     4. os módulos — onze atalhos numa grelha; só Compras abre (os outros dizem «em breve»);
     5. em baixo, lado a lado: «Requer atenção» (as prioridades do perfil, com o prazo) e «Atividade e
        sugestões» (o que mudou e três frases curtas que saem dos números).
   Não substitui a v1 (o espaço de trabalho de 19 out.): fica ao lado, e é a que abre.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdErp } from './ids';
import { PERFIS, EMPRESA, PRIORIDADES, ATIVIDADE, AVISOS, type IdPerfil } from './inicio-dados';
import { ARTIGOS, FORNECEDORES, encomendas, stock, HOJE as HOJE_CP } from './compras/dominio';
import search from 'lucide-static/icons/search.svg?raw';
import bell from 'lucide-static/icons/bell.svg?raw';
import lifeBuoy from 'lucide-static/icons/life-buoy.svg?raw';
import settings from 'lucide-static/icons/settings.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import trendingUp from 'lucide-static/icons/trending-up.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import handCoins from 'lucide-static/icons/hand-coins.svg?raw';
import wallet from 'lucide-static/icons/wallet.svg?raw';
import landmark from 'lucide-static/icons/landmark.svg?raw';
import wrench from 'lucide-static/icons/wrench.svg?raw';
import users from 'lucide-static/icons/users.svg?raw';
import chartColumn from 'lucide-static/icons/chart-column.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import slidersHorizontal from 'lucide-static/icons/sliders-horizontal.svg?raw';
import clipboardCheck from 'lucide-static/icons/clipboard-check.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import clockAlert from 'lucide-static/icons/clock-alert.svg?raw';
import packageX from 'lucide-static/icons/package-x.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import lightbulb from 'lucide-static/icons/lightbulb.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import listTodo from 'lucide-static/icons/list-todo.svg?raw';

const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export const VERSAO_INICIO_V2 = 'v2';

/** Os números do dia, dos dados do protótipo (Compras). */
export function numerosDoDia() {
  const l = encomendas();
  const aprovar = l.filter((e) => e.estado === 'A aprovar');
  const curso = l.filter((e) => e.estado === 'Aprovada' || e.estado === 'Emitida' || e.estado === 'Parcialmente recebida');
  const atrasadas = curso.filter((e) => e.estado !== 'Aprovada' && e.entrega < HOJE_CP);
  const rutura = ARTIGOS.filter((a) => stock(a.ref) <= 0);
  const baixo = ARTIGOS.filter((a) => { const s = stock(a.ref); return s > 0 && s <= 12; });
  return { aprovar, curso, atrasadas, rutura, baixo };
}

const MODULOS: [string, string, string, boolean][] = [
  ['compras', 'Compras', shoppingCart, true], ['vendas', 'Vendas', trendingUp, false], ['stocks', 'Stocks', boxes, false], ['cobrancas', 'Cobranças', handCoins, false],
  ['pagamentos', 'Pagamentos', wallet, false], ['bancos', 'Bancos', landmark, false], ['servicos', 'Serviços', wrench, false], ['crm', 'CRM', users, false],
  ['bi', 'BI', chartColumn, false], ['relatorios', 'Relatórios', fileText, false], ['configuracoes', 'Configurações', slidersHorizontal, false],
];

export type CenarioInicioV2 = 'normal' | 'carregar' | 'avisos' | 'vazio';
export type IdInicioV2 = 'hm-carregar' | 'hm-avisos' | 'hm-vazio';

/** O cabeçalho do ERP (o mesmo no Início e nos ecrãs dos módulos): o caminho é uma lista [nome, ecrã para onde vai]. */
export function topoErp(caminho: [string, string][], avisosAbertos = false, perfil: IdPerfil = 'compras'): string {
  const p = PERFIS[perfil], avisos = AVISOS[perfil] ?? [], cen = avisosAbertos ? 'avisos' : 'normal';
  const trilho = caminho.map(([nome, ir], k) => k === caminho.length - 1 ? `<b>${esc(nome)}</b>` : `<button type="button" class="hm-caminho-ir" data-hm-ir="${ir}">${esc(nome)}</button>`).join('');
  return `  <header class="hm-topo">
    <a class="ws-marca hm-marca" href="#" data-hm-ir="inicio" aria-label="ROMAFE ERP, Início"><span class="romafe hm-romafe">ROMAFE</span><i aria-hidden="true"></i><span class="hm-erp">ERP</span></a>
    <nav class="hm-caminho" aria-label="Onde estou"><span>${L(building)}${esc(EMPRESA.nome)}</span>${trilho}</nav>
    <label class="hm-procura">${L(search)}<input type="search" placeholder="Procurar documentos, artigos, fornecedores…" aria-label="Procurar no ERP"><kbd>Ctrl K</kbd></label>
    <div class="hm-icones">
      <button type="button" class="hm-icone" aria-label="Ajuda" data-hm-dica="Ajuda">${L(lifeBuoy)}</button>
      <button type="button" class="hm-icone" aria-label="Definições" data-hm-dica="Definições">${L(settings)}</button>
      <button type="button" class="hm-icone" aria-label="Avisos, ${avisos.length} por ler" aria-expanded="${cen === 'avisos'}" data-hm-avisos>${L(bell)}${avisos.length ? `<span class="hm-badge">${avisos.length}</span>` : ''}</button>
      <button type="button" class="hm-pessoa" aria-label="${esc(p.pessoa)}"><span class="hm-inicial">${p.iniciais}</span><span class="hm-pessoa-t"><b>${esc(p.pessoa)}</b><small>${esc(p.cargo)}</small></span></button>
    </div>
    <section class="hm-avisos" data-hm-avisos-painel${cen === 'avisos' ? '' : ' hidden'} aria-label="Avisos">
      <h2>Avisos</h2>
      <ul>${avisos.map((a) => `<li><b>${esc(a.titulo)}</b><span>${esc(a.texto)}</span><small>${esc(a.quando)}</small></li>`).join('')}</ul>
    </section>
  </header>`;
}

function html(cen: CenarioInicioV2, perfil: IdPerfil = 'compras'): string {
  const p = PERFIS[perfil];
  const n = numerosDoDia();
  const prio = cen === 'vazio' ? [] : PRIORIDADES[perfil] ?? [];
  /* o fornecedor da entrega mais atrasada, tirado da própria encomenda */
  const atrasada = n.atrasadas.slice().sort((a, b) => a.entrega.localeCompare(b.entrega))[0];
  const maisLento = atrasada ? FORNECEDORES.find((f) => f.id === atrasada.forn) : undefined;
  const cartoes: [string, string, number, string, string, string][] = [
    ['aprovar', 'Encomendas por aprovar', n.aprovar.length, n.aprovar.length ? `a mais antiga: ${n.aprovar[n.aprovar.length - 1].ref}` : 'nada à espera', clipboardCheck, 'aviso'],
    ['curso', 'Encomendas em curso', n.curso.length, `${n.curso.filter((e) => e.estado === 'Parcialmente recebida').length} recebidas em parte`, truck, 'azul'],
    ['atrasadas', 'Entregas atrasadas', n.atrasadas.length, n.atrasadas.length ? 'fala com o fornecedor' : 'tudo dentro do prazo', clockAlert, 'erro'],
    ['rutura', 'Artigos em rutura', n.rutura.length, `${n.baixo.length} com stock baixo`, packageX, 'erro'],
  ];
  const sugestoes = [
    n.rutura.length ? `${n.rutura.length} ${n.rutura.length === 1 ? 'artigo em rutura precisa' : 'artigos em rutura precisam'} de compra.` : '',
    n.aprovar.length ? `${n.aprovar.length} ${n.aprovar.length === 1 ? 'encomenda aguarda' : 'encomendas aguardam'} aprovação.` : '',
    atrasada && maisLento ? `${maisLento.nome}: a ${atrasada.ref} devia ter chegado a ${atrasada.entrega.split('-').reverse().slice(0, 2).join('/')}.` : '',
  ].filter(Boolean);
  const carregar = cen === 'carregar';
  return `<div class="hm${carregar ? ' is-carregar' : ''}" data-hm data-hm-cenario="${cen}">
  ${topoErp([['Início', '']], cen === 'avisos', perfil)}

  <section class="hm-ola">
    <div class="hm-ola-texto">
      <p class="hm-data" data-hm-data>quarta-feira, 22 de outubro</p>
      <h1 class="hm-titulo"><span data-hm-saudacao>Bom dia</span>, ${esc(p.primeiro)}.</h1>
      <p class="hm-resumo">${prio.length ? `Tudo pronto para a operação de hoje. <b>${prio.length} ${prio.length === 1 ? 'assunto pede' : 'assuntos pedem'}</b> a tua atenção.` : 'Tudo em dia. Nada pede a tua atenção agora.'}</p>
      <p class="hm-onde"><span>${L(building)}${esc(EMPRESA.nome)}</span><span>${L(mapPin)}${esc(EMPRESA.local)}</span><span class="is-area">${L(shoppingCart)}Área: ${esc(p.nome)}</span></p>
    </div>
    <svg class="hm-ola-desenho" viewBox="0 0 400 200" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<path d="M${-40 + i * 50} 200 L${60 + i * 50} 0"/>`).join('')}${Array.from({ length: 9 }, (_, i) => `<path d="M${440 - i * 50} 200 L${340 - i * 50} 0"/>`).join('')}<circle class="is-no" cx="200" cy="100" r="5"/><circle class="is-no" cx="150" cy="60" r="3.5"/><circle class="is-no" cx="250" cy="140" r="3.5"/><circle class="is-no is-laranja" cx="250" cy="60" r="4"/></svg>
  </section>

  <section class="hm-numeros" aria-label="O dia em números">${cartoes.map(([k, t, v, s, i, tom], j) => `<button type="button" class="hm-num hm-num--${tom}" data-hm-ir="${k === 'rutura' ? 'compras-faltas' : 'compras'}" style="--i:${j}">
    <span class="hm-num-ic">${L(i)}</span><span class="hm-num-t">${t}</span>
    <b class="hm-num-v" data-hm-contar="${v}">${carregar ? '—' : v}</b><small>${esc(s)}</small>${L(arrowRight, 'hm-num-seta')}
  </button>`).join('')}</section>

  <section class="hm-modulos" aria-labelledby="hm-mod-t">
    <h2 class="hm-h" id="hm-mod-t">Módulos</h2>
    <div class="hm-grelha">${MODULOS.map(([, nome, i, ok], j) => `<button type="button" class="hm-mod${ok ? ' is-ok' : ''}" ${ok ? 'data-hm-ir="compras"' : `data-hm-breve="${nome}"`} style="--i:${j}">${L(i)}<span>${nome}</span>${ok ? '<small>Abrir</small>' : '<small>Em breve</small>'}</button>`).join('')}</div>
  </section>

  <div class="hm-baixo">
    <section class="hm-bloco" aria-labelledby="hm-at-t">
      <h2 class="hm-h" id="hm-at-t">${L(listTodo)}Requer atenção <span class="hm-conta">${prio.length}</span></h2>
      ${carregar ? `<ul class="hm-lista">${Array.from({ length: 4 }, () => '<li class="hm-esq"><i></i><i></i></li>').join('')}</ul>`
      : prio.length ? `<ul class="hm-lista">${prio.map((r, j) => `<li style="--i:${j}"><button type="button" data-hm-ir="compras"><span class="hm-doc">${esc(r.doc)}</span><span class="hm-lista-t">${esc(r.titulo)}<small>${esc(r.quando)}</small></span><span class="hm-prazo${/hoje|atraso|parada/.test(r.prazo + r.quando + r.titulo) ? ' is-urgente' : ''}">${esc(r.prazo)}</span>${L(arrowRight, 'hm-lista-seta')}</button></li>`).join('')}</ul>`
      : `<p class="hm-vazio">${L(clipboardCheck)}Tudo em dia. Quando algo precisar de ti, aparece aqui.</p>`}
    </section>
    <section class="hm-bloco" aria-labelledby="hm-ac-t">
      <h2 class="hm-h" id="hm-ac-t">${L(lightbulb)}Atividade e sugestões</h2>
      <ul class="hm-sugestoes">${(carregar ? [] : sugestoes).map((t, j) => `<li style="--i:${j}">${L(lightbulb)}${esc(t)}</li>`).join('')}</ul>
      <ul class="hm-atividade">${(ATIVIDADE[perfil] ?? []).map((a) => `<li><span class="hm-inicial hm-inicial--peq">${a.quem.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span><span><b>${esc(a.quem)}</b> ${esc(a.texto)}</span><small>${esc(a.quando)}</small></li>`).join('')}</ul>
    </section>
  </div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

const NOTA = 'O Início v2 (22 out., briefing do ecrã inicial do ERP, «simples e wow»): boas-vindas, quatro números com contadores, os onze módulos, «Requer atenção» e «Atividade e sugestões»; dados do protótipo';
export const versaoInicioV2 = () => ({ id: VERSAO_INICIO_V2, nota: NOTA, html: html('normal') });
export function estadosInicioV2(): Ecra<IdErp>[] {
  const e = (id: IdInicioV2, cen: CenarioInicioV2, nome: string, objetivo: string): Ecra<IdErp> => ({ id, nome, fluxo: 'Início', estadoDe: 'inicio', objetivo, versoes: [{ id: VERSAO_INICIO_V2, nota: NOTA, html: html(cen) }] });
  return [
    e('hm-carregar', 'carregar', '05.13 · A carregar (v2)', 'Os números em «—» e a lista em esqueleto, do tamanho das linhas: nada salta quando os dados chegam.'),
    e('hm-avisos', 'avisos', '05.14 · Avisos (v2)', 'O sino aberto: os avisos do perfil, curtos, com quando.'),
    e('hm-vazio', 'vazio', '05.15 · Tudo em dia (v2)', 'Sem prioridades: a faixa diz que está tudo em dia e «Requer atenção» também.'),
  ];
}
