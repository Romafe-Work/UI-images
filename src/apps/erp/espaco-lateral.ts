/* =========================================================
   ERP — 05 · Início v6 (23 out. 2026), briefing «ROMAFE ERP — Modern Classic Workspace with Left Sidebar».
   A casa que a gestão aprovou fica: a página clara, os seis cartões (Artigos, Armazéns, Famílias, Marcas,
   Unidades de medida, Encomendas) com o ícone, o nome, o código e Alt+N. Muda a navegação:
     - o menu horizontal da v5 passa a um menu lateral (Principal · Ficheiros · Compras · Ajuda), vindo das linhas
       de navegação (navegacao.ts, como da API); recolhe a um carril de ícones com dicas, os grupos abrem e
       fecham, a rota do separador ativo fica marcada, e tudo isto fica guardado; no telemóvel é uma gaveta;
     - um só cabeçalho: ROMAFE ERP, a empresa da sessão, Procurar (Ctrl K), os atalhos e a conta. Sem avisos:
       o ERP ainda não tem um serviço de avisos;
     - por baixo dos cartões, pouco e só com o que existe: Requer atenção (só o que tem número), Favoritos,
       Recentes e Em curso; o que está vazio diz-o numa linha;
     - separadores e a barra de ações da v4/v5 (o mesmo motor: comportamento/espaco.ts).
   A v5 (espaco-v6.ts) fica como a viram. CSS: css/espaco-lateral.css.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdErp } from './ids';
import { topoErp, numerosDoDia } from './inicio-v2';
import { FORNECEDORES, encomendas } from './compras/dominio';
import { L, esc, icone, ROTAS, MENU_ERP, separadores, corpoEspaco, menuConta, dialogo, explorador, acoes, ESTADOS, type Estado, type Hist } from './espaco';
import { quando, estadoV6 } from './espaco-v6';
import { navegacao, atalhosCasa, type NoNav } from './navegacao';
import search from 'lucide-static/icons/search.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import panelLeftClose from 'lucide-static/icons/panel-left-close.svg?raw';
import panelLeftOpen from 'lucide-static/icons/panel-left-open.svg?raw';
import menu from 'lucide-static/icons/menu.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import fileClock from 'lucide-static/icons/file-clock.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import shieldX from 'lucide-static/icons/shield-x.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-cw.svg?raw';
import folder from 'lucide-static/icons/folder.svg?raw';
import folderOpen from 'lucide-static/icons/folder-open.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import abrirFora from 'lucide-static/icons/square-arrow-out-up-right.svg?raw';

export const VERSAO_INICIO_V6 = 'v6';
const NOTA7 = 'O Início v6 (23 out., briefing «Modern Classic Workspace with Left Sidebar»): a casa aprovada (os seis cartões) com um menu lateral vindo da navegação configurada — recolhe, guarda-se, marca a rota ativa e vira gaveta no telemóvel —, um só cabeçalho, Favoritos, Recentes, Em curso e Requer atenção só com o que existe, separadores e a barra de ações.';

export const estadoLat = (o: Partial<Estado> = {}): Estado => ({ ...estadoV6(), arvore: { ficheiros: true, compras: true, ajuda: true }, ...o, v6: true, lat: true });

/* ---------- o menu lateral ---------- */
const rotaAtiva = (e: Estado) => e.ativo === 'inicio' ? '' : e.seps.find((s) => s.id === e.ativo)?.rota ?? '';
function itemNav(n: NoNav, e: Estado): string {
  const ativa = n.acao === 'casa' ? e.ativo === 'inicio' && !e.semCasa : !!n.rota && n.rota === rotaAtiva(e);
  const alvo = n.rota ? `data-dk-atalho="${n.rota}"` : n.acao === 'casa' ? 'data-dk-casa' : n.acao === 'atalhos' ? 'data-dk-ajuda-atalhos' : '';
  const tecla = n.acao === 'atalhos' ? '<kbd>F1</kbd>' : '';
  return `<li><button type="button" class="dk7-i${ativa ? ' is-ativo' : ''}" ${alvo}${ativa ? ' aria-current="page"' : ''} data-dica="${esc(n.rotulo)}">${icone(n.icone)}<span>${esc(n.rotulo)}</span>${tecla}</button></li>`;
}
function grupoNav(g: NoNav, e: Estado, nivel = 0): string {
  /* Principal não se dobra; os outros grupos sim (e os sub-grupos, se a configuração os tiver) */
  if (g.id === 'principal') return `<ul class="dk7-l">${g.filhos.map((f) => itemNav(f, e)).join('')}</ul>`;
  const aberto = e.arvore[g.id] !== false, temAtivo = (n: NoNav): boolean => n.rota === rotaAtiva(e) || n.filhos.some(temAtivo);
  const corpo = g.filhos.map((f) => f.filhos.length ? `<li>${grupoNav(f, e, nivel + 1)}</li>` : itemNav(f, e)).join('');
  /* v7 (vivo): cada grupo é uma pasta que abre e fecha; a de um módulo (Compras) também se abre como espaço de trabalho */
  const pastaIc = e.vivo ? `<span class="dk8-pasta-ic" aria-hidden="true">${L(folder, 'dk8-fechada')}${L(folderOpen, 'dk8-aberta')}</span>` : nivel ? icone(g.icone) : '';
  const modulo = e.vivo && !nivel && MENU_ERP.some((m) => m.id === g.id && !m.pai && m.ativo);
  const abrirPasta = modulo && !e.rail ? `<button type="button" class="dk8-abrir" data-dk8-pasta="${g.id}" aria-label="Abrir a pasta ${esc(g.rotulo)} na área de trabalho" title="Abrir a pasta ${esc(g.rotulo)}">${L(abrirFora)}</button>` : '';
  return `<section class="dk7-g${nivel ? ' dk7-g--sub' : ''}${aberto ? ' is-aberto' : ''}${!aberto && temAtivo(g) ? ' tem-ativo' : ''}" data-dk8-g="${g.id}">
    <div class="dk8-g-cab"><button type="button" class="dk7-g-t" data-dk7-grupo="${g.id}" aria-expanded="${aberto}" aria-controls="dk7-g-${g.id}"${e.rail ? ' tabindex="-1" aria-hidden="true"' : ''}>${pastaIc}<span>${esc(g.rotulo)}</span>${L(chevronDown, 'dk7-g-seta')}</button>${abrirPasta}</div>
    <ul class="dk7-l" id="dk7-g-${g.id}"${aberto || e.rail ? '' : ' hidden'}>${corpo}</ul>
  </section>`;
}
export function ladoLat(e: Estado): string {
  const rail = !!e.rail;
  const pe = `<div class="dk7-pe"><button type="button" class="dk7-rail" data-dk7-rail aria-expanded="${!rail}" aria-label="${rail ? 'Expandir o menu' : 'Recolher o menu'}" data-dica="${rail ? 'Expandir o menu' : 'Recolher o menu'}">${L(rail ? panelLeftOpen : panelLeftClose)}<span>Recolher o menu</span></button></div>`;
  if (e.nav === 'carregar') return `<div class="dk7-lista" aria-busy="true">${[5, 3, 6, 4].map((k) => `<span class="dk7-esq dk7-esq--t"></span>${Array.from({ length: Math.min(k, 3) }, () => '<span class="dk7-esq"></span>').join('')}`).join('')}</div>${pe}`;
  if (e.nav === 'falha') return `<div class="dk7-lista"><ul class="dk7-l">${itemNav({ id: 'inicio', app: 'erp', pai: 'principal', rotulo: 'Início', icone: 'house', rota: null, acao: 'casa', ordem: 10, permissoes: '*', ativo: true, filhos: [] }, e)}</ul>
    <p class="dk7-falha">${L(circleAlert)}<span><b>O menu não carregou.</b>Os separadores abertos continuam a funcionar.</span><button type="button" class="dk7-falha-b" data-dk7-nav-repetir>${L(rotateCw)}<span>Tentar outra vez</span></button></p></div>${pe}`;
  const arv = e.semModulos ? [] : navegacao(e.perfil);
  return `<div class="dk7-lista">${arv.map((g) => grupoNav(g, e)).join('')}</div>${pe}`;
}

/* ---------- a casa ---------- */
const casa = (e: Estado) => e.semModulos ? [] : atalhosCasa(e.perfil);
export const ecrasCasaLat = (e: Estado) => casa(e).map((l) => l.rota!);
const codigo = (r: string) => r.split('.')[1].normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
function cartoes(e: Estado): string {
  return `<ul class="dk7-cartoes" aria-label="Atalhos">${casa(e).map((l, i) => { const r = l.rota!, fav = e.fixados.includes(r); return `<li class="dk7-cartao-c" style="--i:${i}">
    <button type="button" class="dk-cartao dk7-cartao" data-dk-atalho="${r}" aria-keyshortcuts="Alt+${i + 1}" title="Abrir ${esc(l.rotulo)} (Alt ${i + 1})">${icone(l.icone, 'dk-cartao-ic')}<b>${esc(l.curto ?? l.rotulo)}</b><small>${codigo(r)}</small><kbd>Alt+${i + 1}</kbd>${e.vivo ? `<span class="dk8-seta" aria-hidden="true">${L(arrowRight)}</span>` : ''}</button>
    <button type="button" class="dk7-fav${fav ? ' is-fav' : ''}" data-dk7-fav="${r}" aria-pressed="${fav}" aria-label="${fav ? 'Tirar dos favoritos' : 'Pôr nos favoritos'}: ${esc(l.curto ?? l.rotulo)}" title="${fav ? 'Tirar dos favoritos' : 'Pôr nos favoritos'}">${L(star)}</button>
  </li>`; }).join('')}</ul>`;
}
/** Requer atenção: só o que tem número; sem nada, a linha não aparece. */
function atencao(e: Estado): string {
  if (e.semModulos || !ROTAS['compras.encomendas']) return '';
  const n = numerosDoDia();
  const its = ([[n.aprovar.length, 'encomenda por aprovar', 'encomendas por aprovar', 'compras.encomendas', 'aviso'], [n.atrasadas.length, 'entrega atrasada', 'entregas atrasadas', 'compras.encomendas', 'erro'], [n.rutura.length, 'artigo em rutura', 'artigos em rutura', 'compras.faltas', 'erro']] as [number, string, string, string, string][]).filter(([k]) => k > 0);
  if (!its.length) return '';
  return `<section class="dk7-aten" aria-labelledby="dk7-at-t"><h2 id="dk7-at-t">${L(circleAlert)}Requer atenção</h2>${its.map(([k, um, varios, r, tom]) => `<button type="button" class="dk7-aten-i is-${tom}" data-dk-atalho="${r}"><b>${k}</b><span>${k === 1 ? um : varios}</span>${L(chevronRight)}</button>`).join('')}</section>`;
}
const modDe = (rota: string) => rota.startsWith('ficheiros.') ? 'Ficheiros' : rota.startsWith('compras.') ? 'Compras' : '';
const vazio = (ic: string, b: string, t: string) => `<p class="dk7-vazio">${L(ic)}<span><b>${b}</b> ${t}</span></p>`;
function favoritos(e: Estado): string {
  const l = e.fixados.filter((r) => ROTAS[r]);
  return `<section class="dk7-sec" aria-labelledby="dk7-fa-t"><h2 id="dk7-fa-t">Favoritos</h2>
    ${l.length ? `<ul class="dk7-lin">${l.map((r) => `<li><button type="button" class="dk7-lin-b" data-dk-atalho="${r}">${icone(ROTAS[r].icone)}<span>${esc(ROTAS[r].titulo)}</span><small>${modDe(r)}</small></button><button type="button" class="dk7-lin-x" data-dk-desafixar="${r}" aria-label="Tirar ${esc(ROTAS[r].titulo)} dos favoritos" title="Tirar dos favoritos">${L(x)}</button></li>`).join('')}</ul>`
      : vazio(star, 'Sem favoritos.', 'Carrega na estrela de um cartão, ou em Ctrl D num separador.')}
  </section>`;
}
function recentes(e: Estado): string {
  const h: Hist[] = e.primeira || e.semRecentes ? [] : (e.historico ?? []).filter((x) => ROTAS[x.rota]).slice(0, 5);
  return `<section class="dk7-sec" aria-labelledby="dk7-re-t"><h2 id="dk7-re-t">Recentes</h2>
    ${h.length ? `<ul class="dk7-lin">${h.map((x) => { const doc = encomendas().find((y) => y.ref === x.titulo); return `<li><button type="button" class="dk7-lin-b" data-dk-doc="${x.rota}" data-dk-titulo="${esc(x.titulo)}">${icone(ROTAS[x.rota].icone)}<span class="${doc ? 'is-doc' : ''}">${esc(x.titulo)}</span><small>${esc(quando(x.quando))}</small></button></li>`; }).join('')}</ul>`
      : vazio(history, 'Nada aberto ainda.', 'Os ecrãs e documentos que abrires aparecem aqui.')}
  </section>`;
}
function emCurso(e: Estado): string {
  const l = e.primeira || e.semCurso ? [] : [
    ...e.seps.filter((s) => s.sujo).map((s) => `<li><button type="button" class="dk7-lin-b" data-dk-sep="${s.id}">${L(fileClock)}<span>${esc(s.titulo)}</span><small class="is-aviso">Por guardar</small></button></li>`),
    ...encomendas().filter((x) => x.estado === 'Rascunho' || x.estado === 'A aprovar').map((x) => `<li><button type="button" class="dk7-lin-b" data-dk-doc="compras.encomenda" data-dk-titulo="${esc(x.ref)}" title="${esc(FORNECEDORES.find((f) => f.id === x.forn)?.nome ?? x.forn)}">${L(fileText)}<span class="is-doc">${esc(x.ref)}</span><small class="${x.estado === 'A aprovar' ? 'is-aviso' : ''}">${esc(x.estado)}</small></button></li>`),
  ];
  return `<section class="dk7-sec" aria-labelledby="dk7-cu-t"><h2 id="dk7-cu-t">Em curso</h2>
    ${l.length ? `<ul class="dk7-lin">${l.slice(0, 5).join('')}</ul>` : vazio(fileClock, 'Nada em curso.', 'Rascunhos e alterações por guardar aparecem aqui.')}
  </section>`;
}
export function exploradorLat(e: Estado): string {
  if (e.pasta !== 'raiz') return explorador(e);
  const cab = `<header class="dk7-cab"><h1>Área de trabalho</h1></header>`;
  if (e.carga === 'espaco') return `<div class="dk-exp dk7-exp" aria-busy="true">${cab}<div class="dk7-cartoes">${Array.from({ length: 6 }, () => '<span class="dk-esq dk7-esq-cartao"></span>').join('')}</div><div class="dk7-secs"><span class="dk-esq"></span><span class="dk-esq"></span><span class="dk-esq"></span></div></div>`;
  if (!casa(e).length) return `<div class="dk-exp dk7-exp">${cab}<p class="dk7-vazio dk7-vazio--grande">${L(shieldX)}<span><b>A tua conta ainda não tem ecrãs do ERP.</b> Pede o acesso ao administrador da tua empresa.</span></p></div>`;
  return `<div class="dk-exp dk7-exp">${e.vivo ? FUNDO : ''}${cab}
    ${cartoes(e)}
    ${atencao(e)}
    <div class="dk7-secs">${favoritos(e)}${recentes(e)}${emCurso(e)}</div>
  </div>`;
}
/** v7: o desenho técnico ao fundo da casa — um rolamento em corte, com cotas —, só na área vazia, muito ténue. */
const FUNDO = `<svg class="dk8-fundo" viewBox="0 0 520 520" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1"><circle cx="260" cy="260" r="236"/><circle cx="260" cy="260" r="206"/><circle cx="260" cy="260" r="120"/><circle cx="260" cy="260" r="92"/><circle cx="260" cy="260" r="163" stroke-dasharray="3 7"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<circle cx="${(260 + 163 * Math.cos(a)).toFixed(1)}" cy="${(260 + 163 * Math.sin(a)).toFixed(1)}" r="34"/>`; }).join('')}<path d="M10 260h500M260 10v500" stroke-dasharray="14 5 2 5"/><path d="M24 500h472M24 492v16M496 492v16"/><path d="M260 24l-8 0M268 24h-8" /></g><text x="260" y="490" text-anchor="middle" fill="currentColor" font-size="13" font-family="monospace">Ø 472</text></svg>`;
/** Na área de trabalho, a barra só tem o que lá funciona: Atualizar. Nos separadores, as ações do ecrã (v4/v5). */
export function acoesLat(e: Estado): string {
  if (e.ativo === 'inicio' && !e.semCasa) return `<button type="button" class="dk-acao" data-dk-acao="atualizar">${L(rotateCw)}<span>Atualizar</span><kbd>F9</kbd></button>`;
  return acoes(e);
}

/* ---------- a página ---------- */
export function paginaLat(e: Estado = estadoLat(), extra = '', cen = 'normal'): string {
  const topo = topoErp([['Área de trabalho', '']], false, e.perfil)
    .replace('<header class="hm-topo">', `<header class="hm-topo dk-topo dk6-topo dk7-topo"><button type="button" class="dk7-gaveta" data-dk7-gaveta aria-label="Abrir o menu" aria-expanded="false">${L(menu)}</button>`)
    .replace(/<nav class="hm-caminho"[\s\S]*?<\/nav>/, '')
    .replace(/<label class="hm-procura">[\s\S]*?<\/label>/, `<button type="button" class="dk-procura" data-dk-paleta>${L(search)}<span>Procurar ou executar…</span><kbd>Ctrl K</kbd></button>`)
    /* um só cabeçalho: sem Ajuda e Definições soltos (a conta tem o tema; os atalhos têm o seu botão) e sem avisos */
    .replace(/<button type="button" class="hm-icone" aria-label="Ajuda"[\s\S]*?<button type="button" class="hm-pessoa"/, `<button type="button" class="hm-icone" aria-label="Atalhos de teclado" title="Atalhos de teclado (F1)" data-dk-ajuda-atalhos>${L(keyboard)}</button>
      <button type="button" class="hm-pessoa"`)
    .replace(/<section class="hm-avisos"[\s\S]*?<\/section>/, '');
  return `<div class="hm sh dkr dk6 dk7${e.vivo ? ' dk8' : ''}${e.rail ? ' is-rail' : ''}" data-hm data-sh>
  ${topo}
  <div class="sh-corpo dk7-corpo">
    <nav class="dk7-lado" aria-label="Menu do ERP" data-dk7-lado>${ladoLat(e)}</nav>
    <div class="dk7-veu" data-dk7-veu aria-hidden="true"></div>
    <div class="dk7-area">
      <div class="dk6-seps"><div class="dk-seps" role="tablist" aria-label="Separadores abertos" data-dk-seps>${separadores(e)}</div>${e.vivo ? '<i class="dk8-ind" data-dk8-ind aria-hidden="true"></i>' : ''}</div>
      <main class="dk" data-dk data-dk-cenario="${cen}" data-dk-estado="${esc(JSON.stringify(e))}">${corpoEspaco(e, exploradorLat).replace(/(<div class="dk-acoes[^>]*>)[\s\S]*?(<\/div>\s*<div data-dk-banner>)/, `$1${acoesLat(e)}$2`)}</main>
    </div>
  </div>
  ${menuConta(e)}
  <div class="dk-paleta" data-dk-paleta-caixa data-por-cima hidden></div>
  <div data-dk-dialogo data-por-cima>${dialogo(e)}</div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
  ${extra}
</div>`;
}

/* ---------- a versão e os estados ---------- */
export const versaoInicioV6 = () => ({ id: VERSAO_INICIO_V6, nota: NOTA7, html: paginaLat() });
/** Os estados da v4/v5 também na v6 (a pasta aberta da v4 não existe aqui: vira o ecrã escolhido). */
const agora = Date.now(), H = (rota: string, titulo: string, min: number): Hist => ({ rota, titulo, quando: agora - min * 60000 });
const DA_V5: Record<string, Partial<Estado>> = {
  'dk-carregar': { carga: 'espaco' }, 'dk-sem-atalhos': { fixados: [] }, 'dk-sem-curso': { semCurso: true },
  'dk-recentes': { historico: [H('compras.encomenda', 'EF 2026/0413', 6), H('ficheiros.artigos', 'Artigos', 18), H('compras.faltas', 'Lista de faltas', 25), H('ficheiros.marcas', 'Marcas', 70), H('compras.encomendas', 'Encomendas de compra', 60 * 20)] },
  'dk-atalhos': { dialogo: 'atalhos' },
};
export function versaoEstadoLat(id: string, vivo?: { id: string; nota: string }) {
  /* o menu horizontal da v5 e a pasta aberta da v4 não existem na v6 */
  if (['dk-menu', 'dk-compras', 'dk-pasta-carregar', 'dk-pasta-vazia'].includes(id)) return null;
  const o = DA_V5[id] ?? NOVOS.find(([k]) => k === id)?.[3] ?? { ...(ESTADOS.find(([k]) => k === id)?.[3] ?? {}) };
  const e = estadoLat(vivo ? { ...o, vivo: true } : o);
  if (e.pasta !== 'raiz') e.pasta = 'raiz';
  return { id: vivo?.id ?? VERSAO_INICIO_V6, nota: vivo?.nota ?? NOTA7, html: paginaLat(e, '', id) };
}
const S = (id: string, rota: string, titulo: string, sujo = false) => ({ id, rota, titulo, sujo });
export type IdLateral = 'dk7-rail' | 'dk7-nav-carregar' | 'dk7-nav-falha' | 'dk7-ficheiro' | 'dk7-sem-permissao';
const NOVOS: [IdLateral, string, string, Partial<Estado>, string?][] = [
  ['dk7-rail', '05.39 · Menu recolhido', 'O menu lateral recolhido a um carril de ícones; passar o rato ou o foco mostra o nome. Fica guardado para a próxima vez.', { rail: true }],
  ['dk7-ficheiro', '05.40 · Artigos num separador', 'Artigos aberto num separador a partir do cartão: Artigos marcado no menu, a barra só com Atualizar e Imprimir (criar e editar fichas ainda não existe).', { seps: [S('s1', 'ficheiros.artigos', 'Artigos'), S('s2', 'compras.encomendas', 'Encomendas de compra')], ativo: 's1', historico: [H('ficheiros.artigos', 'Artigos', 1)] }],
  ['dk7-nav-carregar', '05.41 · Menu a carregar', 'A navegação ainda não chegou da API: o menu em esqueleto; os cartões já servem.', { nav: 'carregar' }],
  ['dk7-nav-falha', '05.42 · O menu não carregou', 'A API da navegação falhou: fica só o Início, o aviso e «Tentar outra vez». Não se inventa um menu.', { nav: 'falha' }],
  ['dk7-sem-permissao', '05.43 · Perfil sem Receções', 'O perfil Financeiro: Receções não aparece no menu (a API não a devolve) e, se vier por um endereço, abrir volta a ser recusado.', { perfil: 'financeiro', banner: 'sem-permissao', bannerTexto: 'A tua conta não tem acesso a Receções. Pede-o ao administrador.' }],
];
export function estadosLat(): Ecra<IdErp>[] {
  return NOVOS.map(([id, nome, objetivo, o, cls]) => ({ id: id as IdErp, nome, fluxo: 'Início', estadoDe: 'inicio' as IdErp, objetivo, versoes: [{ id: VERSAO_INICIO_V6, nota: NOTA7, html: cls ? paginaLat(estadoLat(o), '', id).replace('class="hm sh dkr dk6 dk7', `class="hm sh dkr dk6 dk7${cls}`) : paginaLat(estadoLat(o), '', id) }] }));
}
