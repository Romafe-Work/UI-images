/* =========================================================
   ERP — 05 · Início v5, a área de trabalho V6 (22 out. 2026, briefing «ROMAFE ERP V6 — Premium enterprise home workspace»)
   O ERP clássico com acabamento atual: cabeçalho (marca, empresa, procura, perfil) → menu horizontal (Ficheiro, os
   módulos da configuração, Ajuda) → separadores → barra de ações → o explorador. Sem árvore lateral.
   - O menu: Ficheiro e Ajuda são da aplicação; os módulos vêm das linhas do menu (MENU_ERP, como viriam da base),
     só os ativos e com permissão; o que não tem rota registada aparece desligado («No ERP antigo»). Nada do ERP
     antigo aparece só por ter existido.
   - Pastas: um clique abre a pasta num separador seu («pasta:compras»), com a aba a levantar e a pasta a crescer.
   - O teu trabalho: «Recentes» são os ecrãs abertos de verdade (erp:espaco → historico); «Em curso» são os
     separadores com alterações por guardar e os rascunhos e encomendas por aprovar do domínio, com a data do
     histórico do documento. Sem nada, o vazio diz-o; não se inventam linhas.
   - Só a vista em grelha (ela tirou a lista, 22 out.); no escuro, o fundo é preto (ela, 22 out.).
   - A v4 (paginaEspaco) fica como ela a viu; o comportamento é o mesmo (comportamento/espaco.ts).
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdErp } from './ids';
import { topoErp } from './inicio-v2';
import { FORNECEDORES, encomendas } from './compras/dominio';
import {
  L, esc, icone, MENU_ERP, ROTAS, modulos, filhos, novoEstado, ecrasCasa, cartoesEcras, separadores, corpoEspaco, menuConta, dialogo, explorador,
  ESTADOS, estadosEspaco, type Estado, type LinhaMenu, type Hist,
} from './espaco';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import pin from 'lucide-static/icons/pin.svg?raw';
import pinOff from 'lucide-static/icons/pin-off.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import fileClock from 'lucide-static/icons/file-clock.svg?raw';
import folderOpen from 'lucide-static/icons/folder-open.svg?raw';
import building2 from 'lucide-static/icons/building-2.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import bookOpen from 'lucide-static/icons/book-open.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import shieldX from 'lucide-static/icons/shield-x.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';

export const VERSAO_INICIO_V5 = 'v5';
const NOTA6 = 'O Início v5, a área de trabalho V6 (22 out., briefing «ROMAFE ERP V6 — Premium enterprise home workspace»): cabeçalho, menu horizontal (Ficheiro, os módulos da configuração, Ajuda), separadores, barra de ações e o explorador de pastas; Compras abre num separador seu; «O teu trabalho» só com o que existe; F10 vai ao menu, F1 mostra os atalhos.';

export const estadoV6 = (o: Partial<Estado> = {}): Estado => ({ ...novoEstado(o.perfil), ...o, v6: true });
const modDe = (rota: string) => MENU_ERP.find((l) => l.id === (MENU_ERP.find((m) => m.rota === rota)?.pai ?? rota.split('.')[0]))?.rotulo ?? '';

/** «há 5 min», «hoje, 08:42», «ontem, 17:20» ou a data. */
export function quando(ts: number, agora = Date.now()): string {
  const d = new Date(ts), m = Math.round((agora - ts) / 60000), hh = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0);
  if (ts >= hoje.getTime()) return `hoje, ${hh}`;
  if (ts >= hoje.getTime() - 864e5) return `ontem, ${hh}`;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}, ${hh}`;
}

/* ---------- o menu horizontal ---------- */
type Item = { t: string; ic: string; attr: string; k?: string; off?: string } | '-';
export function menuV6(e: Estado): string {
  const mods = e.semModulos ? [] : modulos(e.perfil).filter((m) => m.ativo);
  const fix = ecrasCasa(e);
  const doModulo = (m: LinhaMenu): Item[] => [
    { t: `Abrir a pasta ${m.rotulo}`, ic: L(folderOpen), attr: `data-dk-pasta-abrir="${m.id}"`, k: 'Enter' }, '-',
    ...filhos(m.id, e.perfil).map((f): Item => {
      const i = fix.indexOf(f.rota!);
      return { t: f.rotulo, ic: icone(f.icone), attr: f.registada && f.permitido ? `data-dk-atalho="${f.rota}"` : '', off: !f.registada ? 'No ERP antigo' : !f.permitido ? 'Sem permissão' : undefined, k: i >= 0 && i < 9 ? `Alt ${i + 1}` : undefined };
    }),
  ];
  const menus: [string, string, Item[]][] = [
    ['ficheiro', 'Ficheiro', [
      { t: 'Área de trabalho', ic: L(layoutGrid), attr: 'data-dk-casa' },
      { t: 'Procurar ou executar…', ic: L(search), attr: 'data-dk-paleta', k: 'Ctrl K' }, '-',
      { t: 'Fechar o separador', ic: L(x), attr: 'data-dk-fechar-ativo', k: 'Alt W' },
      { t: 'Fechar todos os separadores', ic: L(x), attr: 'data-dk-acao="fechar-todos"' }, '-',
      { t: 'Terminar sessão', ic: L(logOut), attr: 'data-dk-sair' },
    ]],
    ...mods.map((m): [string, string, Item[]] => [m.id, m.rotulo, doModulo(m)]),
    ['ajuda', 'Ajuda', [
      { t: 'Atalhos de teclado', ic: L(keyboard), attr: 'data-dk-ajuda-atalhos', k: 'F1' },
      { t: 'Manual do ERP', ic: L(bookOpen), attr: '', off: 'Em preparação' },
    ]],
  ];
  return menus.map(([id, rot, its]) => `<div class="dk6-m" data-dk6-m="${id}">
    <button type="button" role="menuitem" class="dk6-m-b" aria-haspopup="menu" aria-expanded="${e.menu === id}" data-dk6-abrir="${id}" tabindex="${id === 'ficheiro' ? 0 : -1}">${esc(rot)}</button>
    <div class="dk6-drop" role="menu" data-por-cima aria-label="${esc(rot)}"${e.menu === id ? '' : ' hidden'}>${its.map((it) => it === '-' ? '<i class="dk6-sep" role="separator"></i>'
      : `<button type="button" role="menuitem" class="dk6-i" tabindex="-1" ${it.attr}${it.off ? ' aria-disabled="true"' : ''}>${it.ic}<span>${esc(it.t)}</span>${it.off ? `<small>${esc(it.off)}</small>` : it.k ? `<kbd>${esc(it.k)}</kbd>` : ''}</button>`).join('')}</div>
  </div>`).join('');
}

/* ---------- o explorador ---------- */
function rapidoV6(e: Estado): string {
  const l = e.fixados.filter((r) => ROTAS[r]);
  return `<section class="dk6-sec dk6-sec--rapido" aria-labelledby="dk6-ar-t"><div class="dk6-sec-cab"><h2 id="dk6-ar-t">Acesso rápido</h2><small>Ctrl D fixa o ecrã escolhido</small></div>
    ${l.length ? `<ul class="dk6-atalhos">${l.map((r, i) => `<li style="--i:${i}"><button type="button" class="dk6-atalho" data-dk-atalho="${r}" title="Abrir ${esc(ROTAS[r].titulo)}"><span class="dk6-atalho-ic">${icone(ROTAS[r].icone)}</span><span class="dk6-atalho-t"><b>${esc(ROTAS[r].titulo)}</b><small>${esc(modDe(r))}</small></span></button><button type="button" class="dk6-atalho-pin" data-dk-desafixar="${r}" aria-label="Desafixar ${esc(ROTAS[r].titulo)}" title="Desafixar">${L(pinOff)}</button></li>`).join('')}</ul>`
    : `<p class="dk6-vazio">${L(pin)}<span><b>Sem atalhos.</b>Abre uma pasta, escolhe um ecrã e carrega em Ctrl D para o fixar aqui.</span></p>`}
  </section>`;
}
type Linha = { ic: string; nome: string; doc?: boolean; ent: string; q: string; estado: string; tom?: string; alvo: string };
function trabalhoV6(e: Estado): string {
  const hist: Hist[] = e.primeira ? [] : (e.historico ?? []);
  const rec: Linha[] = hist.slice(0, 6).map((h) => {
    const doc = encomendas().find((x) => x.ref === h.titulo), aberto = e.seps.some((s) => s.rota === h.rota && s.titulo === h.titulo);
    return { ic: icone(ROTAS[h.rota]?.icone ?? 'file'), doc: !!doc, nome: h.titulo, ent: doc ? FORNECEDORES.find((f) => f.id === doc.forn)?.nome ?? doc.forn : modDe(h.rota), q: quando(h.quando), estado: doc ? doc.estado : aberto ? 'Aberto num separador' : 'Ecrã', alvo: `data-dk-doc="${h.rota}" data-dk-titulo="${esc(h.titulo)}"` };
  });
  const cur: Linha[] = e.primeira || e.semCurso ? [] : [
    ...e.seps.filter((s) => s.sujo).map((s): Linha => ({ ic: L(fileClock), nome: s.titulo, ent: modDe(s.rota), q: 'neste separador', estado: 'Alterações por guardar', tom: 'aprov', alvo: `data-dk-sep="${s.id}"` })),
    ...encomendas().filter((x) => x.estado === 'Rascunho' || x.estado === 'A aprovar').map((x): Linha => {
      const ult = x.historico[x.historico.length - 1]?.quando ?? x.data;
      return { ic: L(fileText), doc: true, nome: x.ref, ent: FORNECEDORES.find((f) => f.id === x.forn)?.nome ?? x.forn, q: ult.replace(/^(\d\d\/\d\d)\/\d{4}/, '$1,'), estado: x.estado, tom: x.estado === 'Rascunho' ? 'rasc' : 'aprov', alvo: `data-dk-doc="compras.encomenda" data-dk-titulo="${esc(x.ref)}"` };
    }),
  ];
  const aba = e.trabalho ?? (rec.length ? 'recentes' : 'curso');
  const lista = aba === 'recentes' ? rec : cur;
  const tabela = lista.length ? `<div class="dk6-tab"><p class="dk6-tab-cab" aria-hidden="true"><span></span><span>Documento ou ecrã</span><span>Entidade</span><span>Última atividade</span><span>Estado</span><span></span></p>
    <ul>${lista.map((l, i) => `<li style="--i:${i}"><button type="button" class="dk6-l" ${l.alvo}>${l.ic}<span class="dk6-l-nome${l.doc ? ' is-doc' : ''}">${esc(l.nome)}</span><span class="dk6-l-ent">${esc(l.ent)}</span><span class="dk6-l-q">${esc(l.q)}</span><span class="dk6-l-est${l.tom ? ` dk6-l-est--${l.tom}` : ''}">${esc(l.estado)}</span><span class="dk6-l-abrir">Abrir${L(chevronRight)}</span></button></li>`).join('')}</ul></div>`
    : `<p class="dk6-vazio dk6-vazio--linha">${aba === 'recentes' ? `${L(history)}<span><b>Ainda não abriste nada.</b>Os ecrãs e documentos que abrires aparecem aqui, com a hora.</span>` : `${L(fileClock)}<span><b>Nada em curso.</b>Os rascunhos, as encomendas por aprovar e os separadores com alterações por guardar aparecem aqui.</span>`}</p>`;
  return `<section class="dk6-sec dk6-sec--trab" aria-labelledby="dk6-tr-t"><div class="dk6-sec-cab"><h2 id="dk6-tr-t">O teu trabalho</h2>
    <div class="dk-seg" role="tablist" aria-label="O teu trabalho"><button type="button" role="tab" aria-selected="${aba === 'recentes'}" data-dk-trab="recentes">${L(history)}Recentes <span>${rec.length}</span></button><button type="button" role="tab" aria-selected="${aba === 'curso'}" data-dk-trab="curso">${L(fileClock)}Em curso <span>${cur.length}</span></button></div></div>
    ${tabela}</section>`;
}
export function exploradorV6(e: Estado): string {
  if (e.pasta !== 'raiz') return explorador(e);
  const cab = `<header class="dk6-cab"><h1>Área de trabalho</h1><p>Os teus módulos e documentos.</p></header>`;
  if (e.carga === 'espaco') return `<div class="dk-exp dk6-exp" aria-busy="true">${cab}<div class="dk6-grade"><span class="dk-esq dk6-esq--pasta"></span><span class="dk-esq dk6-esq--rapido"></span></div><span class="dk-esq dk6-esq--tab"></span></div>`;
  const mods = e.semModulos ? [] : modulos(e.perfil).filter((m) => m.ativo);
  if (!mods.length) return `<div class="dk-exp dk6-exp">${cab}<p class="dk6-vazio dk6-vazio--grande">${L(shieldX)}<span><b>A tua conta ainda não tem módulos do ERP.</b>Pede o acesso ao administrador da tua empresa.</span></p></div>`;
  return `<div class="dk-exp dk6-exp" data-vista="grelha">${cab}
    <div class="dk6-grade">
      <section class="dk6-sec dk6-sec--mods" aria-labelledby="dk6-mo-t"><div class="dk6-sec-cab"><h2 id="dk6-mo-t">${mods.map((m) => esc(m.rotulo)).join(' · ')}</h2></div>${cartoesEcras(e)}</section>
      ${rapidoV6(e)}
    </div>
    ${trabalhoV6(e)}
  </div>`;
}

/* ---------- a página ---------- */
export function paginaV6(e: Estado = estadoV6(), extra = '', cen = 'normal'): string {
  const topo = topoErp([['Área de trabalho', '']], false, e.perfil)
    .replace('<header class="hm-topo">', '<header class="hm-topo dk-topo dk6-topo">')
    .replace(/<nav class="hm-caminho"[\s\S]*?<\/nav>/, `<p class="dk6-emp" title="Empresa e armazém da sessão">${L(building2)}<span><b>Romafe, SA</b><small>Armazém 60 · Coimbra</small></span></p>`)
    .replace(/<label class="hm-procura">[\s\S]*?<\/label>/, `<button type="button" class="dk-procura" data-dk-paleta>${L(search)}<span>Procurar ou executar…</span><kbd>Ctrl K</kbd></button>`);
  return `<div class="hm sh dkr dk6" data-hm data-sh>
  ${topo}
  <div class="sh-corpo dk6-corpo">
    <nav class="dk6-menu sh-r" style="--r:0" role="menubar" aria-label="Menu do ERP" data-dk6-menu>${menuV6(e)}</nav>
    <div class="dk6-seps sh-r" style="--r:1"><div class="dk-seps" role="tablist" aria-label="Separadores abertos" data-dk-seps>${separadores(e)}</div></div>
    <main class="dk" data-dk data-dk-cenario="${cen}" data-dk-estado="${esc(JSON.stringify(e))}">${corpoEspaco(e, exploradorV6)}</main>
  </div>
  ${menuConta(e)}
  <div class="dk-paleta" data-dk-paleta-caixa data-por-cima hidden></div>
  <div data-dk-dialogo data-por-cima>${dialogo(e)}</div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
  ${extra}
</div>`;
}

/* ---------- a versão e os estados ---------- */
export const versaoInicioV5 = () => ({ id: VERSAO_INICIO_V5, nota: NOTA6, html: paginaV6() });
/** Os estados da v4 na V6: a pasta aberta passa a ser um separador seu. */
function paraV6(o: Partial<Estado>): Estado {
  const e = estadoV6(o);
  if (e.pasta !== 'raiz') {
    const m = MENU_ERP.find((l) => l.id === e.pasta && !l.pai), id = `p-${e.pasta}`;
    e.seps = [...e.seps, { id, rota: `pasta:${e.pasta}`, titulo: m?.rotulo ?? e.pasta }]; e.ativo = id; e.pasta = 'raiz';
  }
  return e;
}
const agora = Date.now(), H = (rota: string, titulo: string, min: number): Hist => ({ rota, titulo, quando: agora - min * 60000 });
const NOVOS: [string, string, string, Partial<Estado>][] = [
  ['dk-carregar', '05.33 · A carregar', 'A área de trabalho a carregar: as formas das pastas, do acesso rápido e da tabela, sem números falsos.', { carga: 'espaco' }],
  ['dk-sem-atalhos', '05.34 · Acesso rápido vazio', 'Nada fixado: diz como se fixa (Ctrl D num ecrã escolhido).', { fixados: [] }],
  ['dk-sem-curso', '05.35 · Nada em curso', '«Em curso» vazio: diz o que lá vai aparecer.', { trabalho: 'curso', semCurso: true }],
  ['dk-recentes', '05.36 · Recentes', 'Os ecrãs e documentos abertos nesta área de trabalho, com a hora e o estado do documento.', { historico: [H('compras.encomenda', 'EF 2026/0413', 6), H('compras.faltas', 'Lista de faltas', 25), H('compras.fornecedor', 'Fornecedor · SKF', 70), H('compras.encomendas', 'Encomendas de compra', 60 * 20)] }],
  ['dk-menu', '05.37 · Menu Compras aberto', 'O menu horizontal: a pasta, os ecrãs com as teclas do acesso rápido e o que ainda está no ERP antigo, desligado.', { menu: 'compras' }],
  ['dk-atalhos', '05.38 · Atalhos de teclado', 'F1 (ou Ajuda → Atalhos de teclado): todas as teclas do ERP numa folha.', { dialogo: 'atalhos' }],
];
export function estadosEspacoV6(): Ecra<IdErp>[] {
  const antigos = estadosEspaco().map((ec) => {
    const o = ESTADOS.find(([id]) => id === ec.id)?.[3] ?? {};
    return { ...ec, versoes: [...ec.versoes, { id: VERSAO_INICIO_V5, nota: NOTA6, html: paginaV6(paraV6(o), '', ec.id) }] };
  });
  const novos = NOVOS.map(([id, nome, objetivo, o]) => ({ id: id as IdErp, nome, fluxo: 'Início', estadoDe: 'inicio' as IdErp, objetivo, versoes: [{ id: VERSAO_INICIO_V5, nota: NOTA6, html: paginaV6(estadoV6(o), '', id) }] }));
  return [...antigos, ...novos] as Ecra<IdErp>[];
}
