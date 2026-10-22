/* =========================================================
   ERP — 05 · Início v4: a área de trabalho (22 out. 2026), do briefing dela «ROMAFE ERP V4 — Enterprise desktop
   workspace»: «pastas para os módulos, separadores para o trabalho, janelas para o contexto».
   Deixa de ser um painel: é um ambiente de trabalho, como um explorador de ficheiros moderno.
     - à esquerda, a árvore das pastas (o ERP, a área de trabalho, Compras e os seus ecrãs);
     - em cima, os separadores do trabalho aberto (a área de trabalho fica sempre; os outros abrem, fecham,
       reordenam-se a arrastar e guardam o que lá estava — filtros, scroll, seleções — porque não se destroem);
     - por baixo, a barra de ações do separador ativo, com as teclas do ERP antigo (Novo F5, Editar F6,
       Eliminar F8, Atualizar F9, Imprimir F11);
     - na área de trabalho, o explorador: Módulos (pastas), Acesso rápido, Recentes e Em curso. Abrir uma pasta
       anima-a (a aba levanta-se e a pasta cresce para a área) e mostra o que tem; abrir um ecrã abre um separador;
     - janelas flutuantes só para o contexto (o fornecedor, o artigo e o stock por armazém): arrastam-se,
       redimensionam-se, minimizam-se para a doca, maximizam-se e vêm para a frente;
     - Ctrl+K: a paleta de comandos (módulos, ecrãs, comandos, fornecedores, artigos e documentos).
   A árvore sai das linhas do menu (MENU_ERP), como viriam da base de dados: id estável, aplicação, módulo, pai,
   rótulo, ícone, rota, ordem, permissões e se está ativa. A rota só abre se estiver registada (ROTAS); o resto
   não se executa. Os módulos do ERP antigo aparecem como pastas fechadas, para referência da migração — não como
   se funcionassem.
   Este ficheiro só desenha (funções puras de estado → HTML); comportamento/espaco.ts guarda o estado, redesenha
   e mexe nos separadores e nas janelas. CSS: css/espaco.css.
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdErp } from './ids';
import { topoErp } from './inicio-v2';
import { PERFIS, RECENTES, type IdPerfil } from './inicio-dados';
import { FORNECEDORES, ARTIGOS, encomendas, stock } from './compras/dominio';
import file from 'lucide-static/icons/file.svg?raw';
import table from 'lucide-static/icons/table.svg?raw';
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
import monitorCog from 'lucide-static/icons/monitor-cog.svg?raw';
import lifeBuoy from 'lucide-static/icons/life-buoy.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import packageX from 'lucide-static/icons/package-x.svg?raw';
import clipboardList from 'lucide-static/icons/clipboard-list.svg?raw';
import scale from 'lucide-static/icons/scale.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import undo2 from 'lucide-static/icons/undo-2.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import minus from 'lucide-static/icons/minus.svg?raw';
import maximize2 from 'lucide-static/icons/maximize-2.svg?raw';
import minimize2 from 'lucide-static/icons/minimize-2.svg?raw';
import pin from 'lucide-static/icons/pin.svg?raw';
import pinOff from 'lucide-static/icons/pin-off.svg?raw';
import rotateCw from 'lucide-static/icons/rotate-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import trash2 from 'lucide-static/icons/trash-2.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import folderOpen from 'lucide-static/icons/folder-open.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import appWindow from 'lucide-static/icons/app-window.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import fileClock from 'lucide-static/icons/file-clock.svg?raw';
import externalLink from 'lucide-static/icons/external-link.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import shieldX from 'lucide-static/icons/shield-x.svg?raw';
import compass from 'lucide-static/icons/compass.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import sun from 'lucide-static/icons/sun.svg?raw';
import moon from 'lucide-static/icons/moon.svg?raw';
import monitor from 'lucide-static/icons/monitor.svg?raw';
import logOut from 'lucide-static/icons/log-out.svg?raw';
import command from 'lucide-static/icons/command.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const IC = { x, minus, maximize2, minimize2, pin, pinOff, rotateCw, printer, plus, pencil, trash2, ellipsis, search, lock, appWindow, chevronRight, sun, moon, monitor, logOut, command, externalLink, warehouse, users, fileText, history };

/* =========================================================
   O menu, como viria da base de dados — e o registo das rotas que existem
   ========================================================= */
export interface LinhaMenu { id: string; app: 'erp'; modulo: string; pai: string | null; rotulo: string; icone: string; rota: string | null; ordem: number; permissoes: IdPerfil[] | '*'; ativo: boolean }
const M = (id: string, rotulo: string, icone: string, ordem: number, ativo = false): LinhaMenu => ({ id, app: 'erp', modulo: id, pai: null, rotulo, icone, rota: null, ordem, permissoes: '*', ativo });
const S = (id: string, rotulo: string, icone: string, rota: string, ordem: number, permissoes: IdPerfil[] | '*' = '*'): LinhaMenu => ({ id, app: 'erp', modulo: 'compras', pai: 'compras', rotulo, icone, rota, ordem, permissoes, ativo: true });
/** Os módulos do ERP antigo (a referência da migração) e, em Compras, o que já existe. */
export const MENU_ERP: LinhaMenu[] = [
  M('ficheiros', 'Ficheiros', 'file', 10), M('tabelas', 'Tabelas', 'table', 20), M('vendas', 'Vendas', 'trending-up', 30), M('stocks', 'Stocks', 'boxes', 40),
  { ...M('compras', 'Compras', 'shopping-cart', 50, true), permissoes: ['compras', 'armazem', 'financeiro', 'admin'] },
  M('cobrancas', 'Cobranças', 'hand-coins', 60), M('pagamentos', 'Pagamentos', 'wallet', 70), M('bancos', 'Bancos', 'landmark', 80), M('servicos', 'Serviços', 'wrench', 90),
  M('crm', 'CRM', 'users', 100), M('bi', 'BI', 'chart-column', 110), M('relatorios', 'Relatórios', 'file-text', 120), M('configuracoes', 'Configurações', 'sliders-horizontal', 130),
  M('sistema', 'Sistema', 'monitor-cog', 140), M('ajuda', 'Ajuda', 'life-buoy', 150),
  S('compras-faltas', 'Lista de faltas', 'package-x', 'compras.faltas', 10),
  S('compras-encomendas', 'Encomendas de compra', 'file-text', 'compras.encomendas', 20),
  S('compras-fornecedores', 'Fornecedores', 'users', 'compras.fornecedores', 30),
  S('compras-requisicoes', 'Requisições', 'clipboard-list', 'compras.requisicoes', 40),
  S('compras-cotacoes', 'Cotações', 'scale', 'compras.cotacoes', 50),
  S('compras-rececoes', 'Receções', 'package-check', 'compras.rececoes', 60, ['compras', 'armazem', 'admin']),
  S('compras-devolucoes', 'Devoluções a fornecedor', 'undo-2', 'compras.devolucoes', 70),
];
const ICONES: Record<string, string> = { 'layout-grid': layoutGrid, file, table, 'trending-up': trendingUp, boxes, 'hand-coins': handCoins, wallet, landmark, wrench, users, 'chart-column': chartColumn, 'file-text': fileText, 'sliders-horizontal': slidersHorizontal, 'monitor-cog': monitorCog, 'life-buoy': lifeBuoy, 'shopping-cart': shoppingCart, 'package-x': packageX, 'clipboard-list': clipboardList, scale, 'package-check': packageCheck, 'undo-2': undo2 };
export const icone = (n: string, cls = '') => L(ICONES[n] ?? file, cls);

/** As teclas do ERP antigo, numa barra que muda com o separador. */
export type Acao = 'novo' | 'editar' | 'eliminar' | 'atualizar' | 'imprimir';
export const TECLA: Record<Acao, string> = { novo: 'F5', editar: 'F6', eliminar: 'F8', atualizar: 'F9', imprimir: 'F11' };
export interface Rota { ecra: string; titulo: string; icone: string; acoes: Acao[]; novo?: [string, string]; editar?: [string, string] }
/** O registo: a rota da base de dados → um ecrã que existe. O que não está aqui não abre (nunca se executa código vindo da base). */
export const ROTAS: Record<string, Rota> = {
  'compras.faltas': { ecra: 'compras-faltas', titulo: 'Lista de faltas', icone: 'package-x', acoes: ['novo', 'editar', 'eliminar', 'atualizar', 'imprimir'], novo: ['compras-encomenda', 'Nova encomenda'], editar: ['compras-encomenda', 'EF 2026/0413'] },
  'compras.encomendas': { ecra: 'compras', titulo: 'Encomendas de compra', icone: 'file-text', acoes: ['novo', 'editar', 'eliminar', 'atualizar', 'imprimir'], novo: ['compras-encomenda', 'Nova encomenda'], editar: ['compras-encomenda', 'EF 2026/0413'] },
  'compras.fornecedores': { ecra: 'compras-fornecedores', titulo: 'Fornecedores', icone: 'users', acoes: ['novo', 'editar', 'atualizar', 'imprimir'], novo: ['compras-fornecedor', 'Novo fornecedor'], editar: ['compras-fornecedor', 'Fornecedor · SKF'] },
  'compras.requisicoes': { ecra: 'compras-requisicoes', titulo: 'Requisições', icone: 'clipboard-list', acoes: ['novo', 'editar', 'eliminar', 'atualizar'], novo: ['compras-requisicao', 'Nova requisição'], editar: ['compras-requisicao', 'Requisição'] },
  'compras.cotacoes': { ecra: 'compras-cotacoes', titulo: 'Cotações', icone: 'scale', acoes: ['novo', 'atualizar', 'imprimir'], novo: ['compras-cotacao', 'Nova cotação'] },
  'compras.rececoes': { ecra: 'compras-rececoes', titulo: 'Receções', icone: 'package-check', acoes: ['novo', 'atualizar', 'imprimir'], novo: ['compras-rececao', 'Nova receção'] },
  /* os documentos (abrem a partir das listas, dos recentes e da paleta) */
  'compras.encomenda': { ecra: 'compras-encomenda', titulo: 'Encomenda', icone: 'file-text', acoes: ['editar', 'eliminar', 'atualizar', 'imprimir'] },
  'compras.fornecedor': { ecra: 'compras-fornecedor', titulo: 'Fornecedor', icone: 'users', acoes: ['editar', 'atualizar', 'imprimir'] },
  'compras.requisicao': { ecra: 'compras-requisicao', titulo: 'Requisição', icone: 'clipboard-list', acoes: ['editar', 'eliminar', 'atualizar'] },
  'compras.cotacao': { ecra: 'compras-cotacao', titulo: 'Cotação', icone: 'scale', acoes: ['atualizar', 'imprimir'] },
  'compras.rececao': { ecra: 'compras-rececao', titulo: 'Receção', icone: 'package-check', acoes: ['atualizar', 'imprimir'] },
};
export const rotaDoEcra = (ecra: string) => Object.keys(ROTAS).find((k) => ROTAS[k].ecra === ecra);
const pode = (l: LinhaMenu, p: IdPerfil) => l.permissoes === '*' || l.permissoes.includes(p);
/** Os módulos do perfil, pela ordem da base; os inativos vêm marcados (referência), não como se funcionassem. */
export const modulos = (p: IdPerfil) => MENU_ERP.filter((l) => !l.pai && pode(l, p)).sort((a, b) => a.ordem - b.ordem);
export const filhos = (pai: string, p: IdPerfil) => MENU_ERP.filter((l) => l.pai === pai && l.ativo).sort((a, b) => a.ordem - b.ordem).map((l) => ({ ...l, permitido: pode(l, p), registada: !!(l.rota && ROTAS[l.rota]) }));

/* =========================================================
   O estado da área de trabalho
   ========================================================= */
export interface Sep { id: string; rota: string; titulo: string; sujo?: boolean }
export interface Janela { id: string; tipo: 'fornecedor' | 'artigo'; chave: string; x: number; y: number; w: number; h: number; min?: boolean; max?: boolean; z: number }
export type Banner = '' | 'offline' | 'restaurada' | 'primeira' | 'sem-permissao' | 'navegacao' | 'rota' | 'desconhecido';
export interface Estado {
  perfil: IdPerfil; seps: Sep[]; ativo: string; pasta: string; sel: string; vista: 'grelha' | 'lista'; fixados: string[]; arvore: Record<string, boolean>;
  janelas: Janela[]; banner: Banner; bannerTexto?: string; dialogo: string; carga?: 'pasta'; semModulos?: boolean; semRecentes?: boolean; primeira?: boolean; pastaVazia?: boolean; largura: number;
}
export const novoEstado = (perfil: IdPerfil = 'compras'): Estado => ({ perfil, seps: [], ativo: 'inicio', pasta: 'raiz', sel: '', vista: 'grelha', fixados: ['compras.faltas', 'compras.encomendas'], arvore: { compras: true }, janelas: [], banner: '', dialogo: '', largura: 260 });

/* =========================================================
   As peças
   ========================================================= */
/** A pasta: o fundo com a aba, a folha que espreita e a frente (que se levanta ao abrir); o ícone do módulo gravado. */
export function pasta(id: string, rotulo: string, ic: string, o: { inativo?: boolean; sel?: boolean; i?: number } = {}): string {
  return `<button type="button" class="dk-pasta${o.inativo ? ' is-inativo' : ''}" data-dk-pasta="${id}"${o.inativo ? ' aria-disabled="true" title="Ainda no ERP antigo"' : ''} aria-selected="${!!o.sel}" style="--i:${o.i ?? 0}">
    <span class="dk-pasta-g" aria-hidden="true"><svg viewBox="0 0 120 92"><path class="dk-p-fundo" d="M8 12a6 6 0 0 1 6-6h28a6 6 0 0 1 4.6 2.2L54 16h52a6 6 0 0 1 6 6v58a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6Z"/><rect class="dk-p-folha" x="16" y="20" width="88" height="44" rx="2"/><path class="dk-p-frente" d="M4 32a6 6 0 0 1 6-6h100a6 6 0 0 1 6 6l-3.4 48a6 6 0 0 1-6 5.6H13.4a6 6 0 0 1-6-5.6Z"/></svg>${icone(ic, 'dk-pasta-ic')}${o.inativo ? L(lock, 'dk-pasta-cad') : ''}</span>
    <span class="dk-pasta-t">${esc(rotulo)}</span>${o.inativo ? '<small>No ERP antigo</small>' : ''}
  </button>`;
}
/** Um ecrã (um «ficheiro»): a folha com o canto dobrado e o ícone. */
export function ficheiro(rota: string, rotulo: string, ic: string, o: { sel?: boolean; i?: number; estado?: 'sem-rota' | 'sem-permissao'; sub?: string } = {}): string {
  return `<button type="button" class="dk-fich${o.estado ? ` is-${o.estado}` : ''}" data-dk-abrir="${rota}" aria-selected="${!!o.sel}" style="--i:${o.i ?? 0}"${o.estado ? ' aria-disabled="true"' : ''}>
    <span class="dk-fich-g" aria-hidden="true"><svg viewBox="0 0 80 96"><path class="dk-f-folha" d="M10 4h42l20 20v62a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6Z"/><path class="dk-f-canto" d="M52 4v14a6 6 0 0 0 6 6h14"/></svg>${icone(ic, 'dk-fich-ic')}</span>
    <span class="dk-fich-t">${esc(rotulo)}</span>${o.sub ? `<small>${esc(o.sub)}</small>` : o.estado === 'sem-rota' ? '<small>Ainda sem ecrã</small>' : o.estado === 'sem-permissao' ? '<small>Sem permissão</small>' : ''}
  </button>`;
}

/* ---------- a árvore ---------- */
export function arvore(e: Estado): string {
  const mods = e.semModulos ? [] : modulos(e.perfil).filter((m) => m.ativo);
  const ativoRota = e.seps.find((s) => s.id === e.ativo)?.rota;
  return `<p class="dk-arv-raiz">${L(appWindow)}ROMAFE ERP</p>
  <ul class="dk-arv" role="tree" aria-label="Pastas do ERP">
    <li role="treeitem" aria-selected="${e.ativo === 'inicio' && e.pasta === 'raiz'}"><button type="button" class="dk-arv-i${e.ativo === 'inicio' && e.pasta === 'raiz' ? ' is-ativo' : ''}" data-dk-ir="raiz">${L(layoutGrid)}<span>Área de trabalho</span></button></li>
    ${mods.map((m) => { const aberta = !!e.arvore[m.id]; const fs = filhos(m.id, e.perfil); return `<li role="treeitem" aria-expanded="${aberta}">
      <button type="button" class="dk-arv-i${e.ativo === 'inicio' && e.pasta === m.id ? ' is-ativo' : ''}" data-dk-ir="${m.id}"><span class="dk-arv-seta" data-dk-dobrar="${m.id}" aria-hidden="true">${L(chevronRight)}</span>${icone(m.icone)}<span>${esc(m.rotulo)}</span></button>
      <ul role="group"${aberta ? '' : ' hidden'}>${fs.map((f) => `<li role="treeitem"><button type="button" class="dk-arv-i dk-arv-f${ativoRota === f.rota ? ' is-ativo' : ''}${!f.registada || !f.permitido ? ' is-off' : ''}" data-dk-abrir="${f.rota}">${icone(f.icone)}<span>${esc(f.rotulo)}</span>${!f.registada ? '<small>em breve</small>' : !f.permitido ? L(lock, 'dk-arv-cad') : ''}</button></li>`).join('')}</ul></li>`; }).join('')}
  </ul>
  ${e.semModulos ? '' : `<details class="dk-arv-antigo"><summary>Ainda no ERP antigo <span>${modulos(e.perfil).filter((m) => !m.ativo).length}</span></summary><ul>${modulos(e.perfil).filter((m) => !m.ativo).map((m) => `<li>${icone(m.icone)}${esc(m.rotulo)}</li>`).join('')}</ul></details>`}`;
}

/* ---------- os separadores ---------- */
export function separadores(e: Estado): string {
  const sep = (id: string, titulo: string, ic: string, fixo = false, sujo = false) => `<div class="dk-sep${e.ativo === id ? ' is-ativo' : ''}${sujo ? ' is-sujo' : ''}" role="tab" aria-selected="${e.ativo === id}" tabindex="${e.ativo === id ? 0 : -1}" data-dk-sep="${id}"${fixo ? '' : ' draggable="true"'} title="${esc(titulo)}">
    ${icone(ic, 'dk-sep-ic')}<span class="dk-sep-t">${esc(titulo)}</span>${sujo ? '<i class="dk-sep-sujo" aria-label="Alterações por guardar"></i>' : ''}${fixo ? '' : `<button type="button" class="dk-sep-x" data-dk-fechar="${id}" aria-label="Fechar ${esc(titulo)}">${L(x)}</button>`}</div>`;
  return sep('inicio', 'Área de trabalho', 'layout-grid', true) + e.seps.map((s) => sep(s.id, s.titulo, ROTAS[s.rota]?.icone ?? 'file', false, !!s.sujo)).join('');
}

/* ---------- a barra de ações (muda com o separador) ---------- */
const NOME_ACAO: Record<Acao, [string, string]> = { novo: ['Novo', plus], editar: ['Editar', pencil], eliminar: ['Eliminar', trash2], atualizar: ['Atualizar', rotateCw], imprimir: ['Imprimir', printer] };
export function acoes(e: Estado): string {
  const off = e.banner === 'offline' ? ' disabled' : '';
  const btn = (k: string, t: string, ic: string, tecla = '', extra = '') => `<button type="button" class="dk-acao" data-dk-acao="${k}"${extra}${off && k !== 'atualizar' ? '' : ''}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
  if (e.ativo === 'inicio') {
    const r = e.sel && ROTAS[e.sel], fixado = !!e.sel && e.fixados.includes(e.sel);
    return `${e.pasta !== 'raiz' ? btn('voltar', 'Voltar', arrowLeft, 'Alt ←') : ''}
      ${btn('abrir', 'Abrir', folderOpen, 'Enter', e.sel ? '' : ' disabled')}
      ${btn('fixar', fixado ? 'Desafixar' : 'Fixar no acesso rápido', fixado ? pinOff : pin, '', r ? '' : ' disabled')}
      ${btn('atualizar', 'Atualizar', rotateCw, 'F9')}
      <span class="dk-acoes-sep"></span>
      <div class="dk-vista" role="group" aria-label="Vista"><button type="button" data-dk-vista="grelha" aria-pressed="${e.vista === 'grelha'}" aria-label="Ícones">${L(layoutGrid)}</button><button type="button" data-dk-vista="lista" aria-pressed="${e.vista === 'lista'}" aria-label="Lista">${L(list)}</button></div>
      <button type="button" class="dk-paleta-btn" data-dk-paleta>${L(search)}<span>Procurar ou executar…</span><kbd>Ctrl K</kbd></button>`;
  }
  const s = e.seps.find((x) => x.id === e.ativo); const r = s && ROTAS[s.rota];
  if (!r) return '';
  return `${r.acoes.map((a) => btn(a, NOME_ACAO[a][0], NOME_ACAO[a][1], TECLA[a], off && a !== 'atualizar' && a !== 'imprimir' ? ' disabled' : '')).join('')}
    <span class="dk-acoes-mais"><button type="button" class="dk-acao" data-dk-acao="mais" aria-haspopup="menu" aria-expanded="false">${L(ellipsis)}<span>Mais ações</span></button>
      <div class="dk-menu" data-dk-menu-mais role="menu" hidden>
        <button type="button" role="menuitem" data-dk-acao="fixar-sep">${L(pin)}${e.fixados.includes(s!.rota) ? 'Desafixar do acesso rápido' : 'Fixar no acesso rápido'}</button>
        <button type="button" role="menuitem" data-dk-acao="duplicar">${L(appWindow)}Abrir noutro separador</button>
        <button type="button" role="menuitem" data-dk-acao="externo">${L(externalLink)}Abrir numa janela do navegador</button>
        <button type="button" role="menuitem" data-dk-acao="fechar-outros">${L(x)}Fechar os outros separadores</button>
      </div></span>
    <button type="button" class="dk-paleta-btn" data-dk-paleta>${L(search)}<span>Procurar ou executar…</span><kbd>Ctrl K</kbd></button>`;
}

/* ---------- o explorador ---------- */
function recentes(e: Estado): string {
  const rec = e.semRecentes || e.primeira ? [] : RECENTES[e.perfil] ?? [];
  if (!rec.length) return `<p class="dk-vazio">${L(history)}${e.primeira ? 'Ainda não abriste nada. O que abrires aparece aqui.' : 'Sem recentes. Os documentos que abrires aparecem aqui.'}</p>`;
  return `<ul class="dk-linhas">${rec.slice(0, 5).map((r, i) => {
    const alvo = r.tipo === 'registo' ? `data-dk-janela="fornecedor:${(FORNECEDORES.find((f) => r.titulo.includes(f.nome.split(' ')[0]))?.id ?? 'trw')}"` : r.tipo === 'pesquisa' ? `data-dk-paleta="${esc(r.procura ?? '')}"` : r.doc ? `data-dk-doc="compras.encomenda" data-dk-titulo="${esc(r.doc)}"` : 'data-dk-abrir="compras.encomendas"';
    const ic = r.tipo === 'registo' ? users : r.tipo === 'pesquisa' ? search : r.tipo === 'espaco' ? pin : fileText;
    return `<li style="--i:${i}"><button type="button" class="dk-linha" ${alvo}>${L(ic, 'dk-linha-ic')}<span class="dk-linha-t"><b>${esc(r.titulo)}</b><small>${esc(r.sub)}</small></span><span class="dk-linha-q">${esc(r.quando)}</span></button></li>`;
  }).join('')}</ul>`;
}
function emCurso(e: Estado): string {
  const l = e.primeira ? [] : encomendas().filter((x) => x.estado === 'Rascunho' || x.estado === 'A aprovar').slice(0, 4);
  if (!l.length) return `<p class="dk-vazio">${L(fileClock)}Nada em curso.</p>`;
  return `<ul class="dk-linhas">${l.map((x, i) => { const f = FORNECEDORES.find((ff) => ff.id === x.forn); return `<li style="--i:${i}"><button type="button" class="dk-linha" data-dk-doc="compras.encomenda" data-dk-titulo="${esc(x.ref)}">${L(fileClock, 'dk-linha-ic')}<span class="dk-linha-t"><b>${esc(x.ref)} · ${esc(f?.nome ?? x.forn)}</b><small>${esc(x.estado)} · ${x.linhas.length} linhas</small></span><span class="dk-linha-q dk-estado dk-estado--${x.estado === 'Rascunho' ? 'rasc' : 'aprov'}">${esc(x.estado)}</span></button></li>`; }).join('')}</ul>`;
}
export function explorador(e: Estado): string {
  const p = PERFIS[e.perfil];
  const raiz = e.pasta === 'raiz';
  const mod = !raiz ? MENU_ERP.find((l) => l.id === e.pasta && !l.pai) : undefined;
  const cab = `<header class="dk-exp-cab">
    <button type="button" class="dk-voltar" data-dk-acao="voltar" aria-label="Voltar"${raiz ? ' disabled' : ''}>${L(arrowLeft)}</button>
    <nav class="dk-migalhas" aria-label="Onde estou"><button type="button" data-dk-ir="raiz">ROMAFE ERP</button>${L(chevronRight)}<button type="button" data-dk-ir="raiz"${raiz ? ' aria-current="page"' : ''}>Início</button>${mod ? `${L(chevronRight)}<span aria-current="page">${esc(mod.rotulo)}</span>` : ''}</nav>
  </header>`;
  if (raiz) {
    const mods = e.semModulos ? [] : modulos(e.perfil);
    return `${cab}<div class="dk-exp dk-exp--raiz" data-vista="${e.vista}">
      <div class="dk-titulo"><h1>Área de trabalho</h1><p>Os teus módulos, documentos e tarefas · ${esc(p.pessoa)}, ${esc(p.cargo)}</p></div>
      <section class="dk-sec" aria-labelledby="dk-mod-t"><h2 id="dk-mod-t">Módulos</h2>
        ${mods.length ? `<div class="dk-grelha dk-grelha--pastas">${mods.map((m, i) => pasta(m.id, m.rotulo, m.icone, { inativo: !m.ativo, sel: e.sel === m.id, i })).join('')}</div>`
        : `<p class="dk-vazio dk-vazio--grande">${L(shieldX)}<span><b>A tua conta ainda não tem módulos do ERP.</b>Pede o acesso ao administrador da tua empresa.</span></p>`}
      </section>
      ${mods.length ? `<section class="dk-sec" aria-labelledby="dk-ac-t"><h2 id="dk-ac-t">Acesso rápido</h2>
        ${e.fixados.length ? `<div class="dk-grelha">${e.fixados.filter((r) => ROTAS[r]).map((r, i) => ficheiro(r, ROTAS[r].titulo, ROTAS[r].icone, { sel: e.sel === r, i, sub: 'Compras' })).join('')}</div>` : `<p class="dk-vazio">${L(pin)}Fixa aqui os ecrãs que usas mais: escolhe um e «Fixar no acesso rápido».</p>`}
      </section>
      <div class="dk-duas">
        <section class="dk-sec" aria-labelledby="dk-re-t"><h2 id="dk-re-t">Recentes</h2>${recentes(e)}</section>
        <section class="dk-sec" aria-labelledby="dk-ec-t"><h2 id="dk-ec-t">Em curso</h2>${emCurso(e)}</section>
      </div>` : ''}
    </div>`;
  }
  const fs = e.pastaVazia ? [] : filhos(e.pasta, e.perfil);
  const sel = fs.find((f) => f.rota === e.sel);
  return `${cab}<div class="dk-exp dk-exp--pasta" data-vista="${e.vista}">
    <div class="dk-titulo dk-titulo--pasta">${pasta(e.pasta, mod?.rotulo ?? e.pasta, mod?.icone ?? 'file', {})}<div><h1>${esc(mod?.rotulo ?? e.pasta)}</h1><p>${e.carga === 'pasta' ? 'A abrir a pasta…' : `${fs.filter((f) => f.registada && f.permitido).length} ecrãs disponíveis`}</p></div></div>
    ${e.carga === 'pasta' ? `<div class="dk-grelha">${Array.from({ length: 6 }, () => '<span class="dk-esq"></span>').join('')}</div>`
    : fs.length ? `<div class="dk-grelha">${fs.map((f, i) => ficheiro(f.rota!, f.rotulo, f.icone, { sel: e.sel === f.rota, i, estado: !f.registada ? 'sem-rota' : !f.permitido ? 'sem-permissao' : undefined })).join('')}</div>
      <p class="dk-detalhe" aria-live="polite">${sel ? `${icone(sel.icone)}<b>${esc(sel.rotulo)}</b><span>${sel.registada && sel.permitido ? 'Enter ou duplo clique abre num separador' : sel.registada ? 'A tua conta não tem acesso a este ecrã' : 'Este ecrã ainda não existe no ERP novo'}</span>` : `${L(folderOpen)}<span>Escolhe um ecrã. Enter ou duplo clique abre-o num separador.</span>`}</p>`
    : `<p class="dk-vazio dk-vazio--grande">${L(folderOpen)}<span><b>Esta pasta está vazia.</b>Ainda não há ecrãs neste módulo para a tua conta.</span></p>`}
  </div>`;
}

/* ---------- as janelas flutuantes ---------- */
export function conteudoJanela(j: Janela): [string, string] {
  if (j.tipo === 'fornecedor') {
    const f = FORNECEDORES.find((x) => x.id === j.chave) ?? FORNECEDORES[0];
    const enc = encomendas().filter((e) => e.forn === f.id);
    return [`Fornecedor · ${f.nome}`, `<dl class="dk-dl"><div><dt>Nome legal</dt><dd>${esc(f.legal)}</dd></div><div><dt>NIF</dt><dd>${esc(f.nif)}</dd></div><div><dt>Cidade</dt><dd>${esc(f.cidade)}</dd></div><div><dt>Pagamento</dt><dd>${esc(f.pagamento)}</dd></div><div><dt>Prazo</dt><dd>${f.prazo} dias</dd></div><div><dt>Entrega</dt><dd>${esc(f.entrega)}</dd></div><div><dt>Contacto</dt><dd>${esc(f.contacto.papel)} · ${esc(f.contacto.telefone)}</dd></div><div><dt>Encomendas</dt><dd>${enc.length}</dd></div></dl>
      <button type="button" class="dk-acao dk-acao--cheia" data-dk-doc="compras.fornecedor" data-dk-titulo="Fornecedor · ${esc(f.nome)}">${L(appWindow)}<span>Abrir a ficha num separador</span></button>`];
  }
  const a = ARTIGOS.find((x) => x.ref === j.chave) ?? ARTIGOS[0];
  const s60 = stock(a.ref);
  const linhas: [string, number][] = [['60 · Coimbra', s60], ['10 · Porto', Math.max(0, Math.round(s60 * .4))], ['20 · Sacavém', Math.max(0, Math.round(s60 * .2))]];
  return [`Artigo · ${a.ref}`, `<p class="dk-jan-sub">${esc(a.marca)} · ${esc(a.desc)}</p>
    <table class="dk-tab"><thead><tr><th>Armazém</th><th class="is-num">Stock</th></tr></thead><tbody>${linhas.map(([n, q]) => `<tr><td>${L(warehouse)}${n}</td><td class="is-num${q <= 0 ? ' is-zero' : ''}">${q}</td></tr>`).join('')}</tbody></table>
    <p class="dk-jan-sub">Fornecedor: ${esc(FORNECEDORES.find((f) => f.id === a.forn)?.nome ?? a.forn)} · ref. ${esc(a.refForn)}</p>`];
}
export function janela(j: Janela, focada: boolean): string {
  const [titulo, corpo] = conteudoJanela(j);
  return `<section class="dk-jan${j.max ? ' is-max' : ''}${focada ? ' is-foco' : ''}" data-dk-jan="${j.id}" role="dialog" aria-label="${esc(titulo)}" style="left:${j.x}px;top:${j.y}px;width:${j.w}px;height:${j.h}px;z-index:${j.z}"${j.min ? ' hidden' : ''}>
    <header class="dk-jan-cab" data-dk-arrastar>${L(j.tipo === 'fornecedor' ? users : warehouse)}<b>${esc(titulo)}</b>
      <button type="button" data-dk-jan-acao="min" aria-label="Minimizar">${L(minus)}</button><button type="button" data-dk-jan-acao="max" aria-label="${j.max ? 'Restaurar' : 'Maximizar'}">${L(j.max ? minimize2 : maximize2)}</button><button type="button" data-dk-jan-acao="fechar" aria-label="Fechar">${L(x)}</button></header>
    <div class="dk-jan-corpo">${corpo}</div>
  </section>`;
}
export function doca(e: Estado): string {
  const m = e.janelas.filter((j) => j.min);
  return m.map((j) => `<button type="button" class="dk-doca-i" data-dk-restaurar="${j.id}">${L(j.tipo === 'fornecedor' ? users : warehouse)}${esc(conteudoJanela(j)[0])}</button>`).join('');
}

/* ---------- avisos, diálogos ---------- */
export function banner(e: Estado): string {
  const b = (ic: string, t: string, extra = '') => `<p class="dk-banner dk-banner--${e.banner}" role="status">${L(ic)}<span>${t}</span>${extra}<button type="button" class="dk-banner-x" data-dk-banner-fechar aria-label="Fechar">${L(x)}</button></p>`;
  switch (e.banner) {
    case 'offline': return b(wifiOff, 'Sem ligação ao servidor. O que está aberto continua à vista; as ações que gravam esperam pela ligação.');
    case 'restaurada': return b(history, e.bannerTexto ?? 'Recuperámos a tua área de trabalho.', '<button type="button" class="dk-banner-acao" data-dk-acao="fechar-todos">Começar do zero</button>');
    case 'primeira': return b(compass, 'Bem-vindo ao ERP novo. Os módulos são pastas: abre Compras para começar. Ctrl+K procura tudo.');
    case 'sem-permissao': return b(shieldX, e.bannerTexto ?? 'A tua conta não tem acesso a este ecrã.');
    case 'navegacao': return b(circleAlert, e.bannerTexto ?? 'Não foi possível abrir o ecrã. Tenta outra vez.', '<button type="button" class="dk-banner-acao" data-dk-acao="atualizar">Tentar outra vez</button>');
    case 'rota': return b(circleAlert, e.bannerTexto ?? 'Este ecrã ainda não existe no ERP novo.');
    case 'desconhecido': return b(compass, e.bannerTexto ?? 'O módulo pedido não existe. Abrimos a área de trabalho.');
    default: return '';
  }
}
export function dialogo(e: Estado): string {
  if (!e.dialogo) return '';
  if (e.dialogo.startsWith('fechar:')) {
    const s = e.seps.find((x) => x.id === e.dialogo.slice(7));
    return `<div class="dk-veu"></div><section class="dk-dialogo" role="alertdialog" aria-labelledby="dk-d-t"><h2 id="dk-d-t">Fechar «${esc(s?.titulo ?? '')}»?</h2><p>Há alterações por guardar neste separador. Se fechares agora, perdem-se.</p>
      <div class="dk-dialogo-acoes"><button type="button" class="dk-acao" data-dk-dialogo="cancelar">Continuar a editar</button><button type="button" class="dk-acao dk-acao--perigo" data-dk-dialogo="fechar">${L(trash2)}<span>Fechar sem guardar</span></button></div></section>`;
  }
  if (e.dialogo.startsWith('eliminar')) {
    const s = e.seps.find((x) => x.id === e.ativo);
    return `<div class="dk-veu"></div><section class="dk-dialogo" role="alertdialog" aria-labelledby="dk-d-t"><h2 id="dk-d-t">Eliminar em «${esc(s?.titulo ?? '')}»?</h2><p>Elimina o que está escolhido neste ecrã. Não se desfaz, e fica registado no histórico.</p>
      <div class="dk-dialogo-acoes"><button type="button" class="dk-acao" data-dk-dialogo="cancelar">Cancelar</button><button type="button" class="dk-acao dk-acao--perigo" data-dk-dialogo="eliminar">${L(trash2)}<span>Eliminar</span></button></div></section>`;
  }
  if (e.dialogo === 'sessao') return `<div class="dk-veu"></div><section class="dk-dialogo" role="alertdialog" aria-labelledby="dk-d-t"><h2 id="dk-d-t">A sessão terminou</h2><p>Por segurança, entra outra vez. Os separadores abertos voltam a abrir.</p>
      <div class="dk-dialogo-acoes"><button type="button" class="dk-acao dk-acao--cheia" data-dk-sair>${L(logOut)}<span>Iniciar sessão</span></button></div></section>`;
  return '';
}
export function menuConta(e: Estado): string {
  const p = PERFIS[e.perfil];
  return `<div class="dk-menu dk-menu--conta" data-dk-menu-conta data-por-cima role="menu" hidden>
    <p class="dk-menu-quem"><b>${esc(p.pessoa)}</b><small>${esc(p.correio)}</small></p>
    <p class="dk-menu-rot">Tema</p>
    <div class="dk-tema" role="group" aria-label="Tema"><button type="button" data-dk-tema="light">${L(sun)}Claro</button><button type="button" data-dk-tema="dark">${L(moon)}Escuro</button><button type="button" data-dk-tema="auto">${L(monitor)}Sistema</button></div>
    <button type="button" role="menuitem" data-dk-acao="fechar-todos">${L(x)}Fechar todos os separadores</button>
    <button type="button" role="menuitem" data-dk-sair>${L(logOut)}Terminar sessão</button>
  </div>`;
}

/* =========================================================
   A página
   ========================================================= */
export function corpoEspaco(e: Estado): string {
  return `<div class="dk-acoes sh-r" style="--r:1" role="toolbar" aria-label="Ações" data-dk-acoes>${acoes(e)}</div>
    <div data-dk-banner>${banner(e)}</div>
    <div class="dk-paineis" data-dk-paineis>
      <section class="dk-painel${e.ativo === 'inicio' ? ' is-ativo' : ''}" data-painel="inicio" role="tabpanel" aria-label="Área de trabalho"><div class="sh-r" style="--r:2" data-dk-exp>${explorador(e)}</div></section>
      ${e.seps.map((s) => `<section class="dk-painel${e.ativo === s.id ? ' is-ativo' : ''}" data-painel="${s.id}" role="tabpanel" aria-label="${esc(s.titulo)}"><div class="dk-carga"><span></span>A abrir ${esc(s.titulo)}…</div></section>`).join('')}
    </div>
    <div class="dk-janelas" data-dk-janelas data-por-cima>${e.janelas.map((j) => janela(j, j.z === Math.max(...e.janelas.map((y) => y.z)))).join('')}</div>
    <div class="dk-doca" data-dk-doca data-por-cima>${doca(e)}</div>`;
}
export function paginaEspaco(e: Estado = novoEstado(), extra = '', cen = 'normal'): string {
  return `<div class="hm sh dkr" data-hm data-sh>
  ${topoErp([['Área de trabalho', '']], false, e.perfil)
    .replace('<header class="hm-topo">', `<header class="hm-topo dk-topo"><button type="button" class="sh-menu-movel" data-sh-movel aria-label="Abrir as pastas">${L(list)}</button>`)
    .replace(/<nav class="hm-caminho"[\s\S]*?<\/nav>/, `<div class="dk-barra sh-r" style="--r:0"><div class="dk-seps" role="tablist" aria-label="Separadores abertos" data-dk-seps>${separadores(e)}</div><i class="dk-seps-ind" data-dk-seps-ind aria-hidden="true"></i></div>`)
    .replace(/<label class="hm-procura">[\s\S]*?<\/label>/, '')}
  <div class="sh-corpo dk-corpo" style="--sh-lado:${e.largura}px">
    <nav class="sh-lado dk-arvore" aria-label="Pastas" data-dk-arvore>${arvore(e)}</nav>
    <i class="dk-puxador" data-dk-puxador aria-hidden="true"></i>
    <main class="dk" data-dk data-dk-cenario="${cen}" data-dk-estado="${esc(JSON.stringify(e))}">${corpoEspaco(e)}</main>
  </div>
  ${menuConta(e)}
  <div class="dk-paleta" data-dk-paleta-caixa data-por-cima hidden></div>
  <div data-dk-dialogo data-por-cima>${dialogo(e)}</div>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
  ${extra}
</div>`;
}

/* ---------- os estados do ecrã ---------- */
const sep = (id: string, rota: string, titulo: string, sujo = false): Sep => ({ id, rota, titulo, sujo });
const J = (id: string, tipo: Janela['tipo'], chave: string, x: number, y: number, z: number, o: Partial<Janela> = {}): Janela => ({ id, tipo, chave, x, y, w: 360, h: 330, z, ...o });
type Est = [string, string, string, Partial<Estado>];
const ESTADOS: Est[] = [
  ['dk-compras', '05.16 · Pasta Compras aberta', 'A pasta Compras aberta: os seus ecrãs como ficheiros; um escolhido (Enter ou duplo clique abre num separador); «Devoluções a fornecedor» ainda sem ecrã.', { pasta: 'compras', sel: 'compras.faltas' }],
  ['dk-separadores', '05.17 · Vários separadores', 'Quatro separadores abertos (Lista de faltas ativo, uma encomenda, um fornecedor): a barra de ações é a da Lista de faltas, com as teclas.', { seps: [sep('s1', 'compras.faltas', 'Lista de faltas'), sep('s2', 'compras.encomenda', 'EF 2026/0413'), sep('s3', 'compras.fornecedor', 'Fornecedor · SKF')], ativo: 's1' }],
  ['dk-janela', '05.18 · Janela de contexto', 'Duas janelas flutuantes por cima da área de trabalho: o fornecedor e o stock do artigo por armazém (arrastar, redimensionar, minimizar, maximizar).', { janelas: [J('j1', 'fornecedor', 'trw', 200, 60, 2), J('j2', 'artigo', 'GDB2042', 380, 150, 3)] }],
  ['dk-minimizada', '05.19 · Janela minimizada', 'A janela do fornecedor minimizada na doca, em baixo; um clique devolve-a.', { janelas: [J('j1', 'fornecedor', 'trw', 380, 120, 2, { min: true })] }],
  ['dk-por-guardar', '05.20 · Alterações por guardar', 'Fechar um separador com alterações: o ponto no separador e a confirmação.', { seps: [sep('s1', 'compras.faltas', 'Lista de faltas'), sep('s2', 'compras.encomenda', 'EF 2026/0413', true)], ativo: 's2', dialogo: 'fechar:s2' }],
  ['dk-restaurada', '05.21 · Área de trabalho recuperada', 'Ao voltar: os separadores da última vez, revalidados (só os ecrãs que existem e a que a conta tem acesso).', { seps: [sep('s1', 'compras.faltas', 'Lista de faltas'), sep('s2', 'compras.encomenda', 'EF 2026/0413')], ativo: 's1', banner: 'restaurada', bannerTexto: 'Recuperámos a tua área de trabalho: 2 separadores. Os rascunhos por guardar não se recuperam.' }],
  ['dk-primeira', '05.22 · Primeiro acesso', 'Sem recentes nem trabalho em curso: o aviso de boas-vindas diz por onde começar.', { primeira: true, banner: 'primeira' }],
  ['dk-sem-modulos', '05.23 · Sem módulos', 'A conta entrou, mas não tem módulos do ERP: a árvore e os módulos vazios, e a quem pedir.', { semModulos: true }],
  ['dk-sem-recentes', '05.24 · Sem recentes', 'Os Recentes vazios dizem o que vai aparecer.', { semRecentes: true }],
  ['dk-pasta-carregar', '05.25 · Pasta a carregar', 'A pasta a abrir: os ficheiros em esqueleto, com a forma deles.', { pasta: 'compras', carga: 'pasta' }],
  ['dk-pasta-vazia', '05.26 · Pasta vazia', 'Uma pasta sem ecrãs para a conta.', { pasta: 'compras', pastaVazia: true }],
  ['dk-desconhecido', '05.27 · Módulo desconhecido', 'Um endereço com um módulo que não existe: abre a área de trabalho e diz-se porquê.', { banner: 'desconhecido', bannerTexto: 'O módulo «armazem-velho» não existe no ERP. Abrimos a área de trabalho.' }],
  ['dk-rota', '05.28 · Ecrã ainda sem rota', '«Devoluções a fornecedor» está no menu, mas a rota não está registada: não abre, e diz-se porquê.', { pasta: 'compras', sel: 'compras.devolucoes', banner: 'rota', bannerTexto: '«Devoluções a fornecedor» ainda não existe no ERP novo. Continua no ERP antigo.' }],
  ['dk-sem-permissao', '05.29 · Sem permissão', 'O perfil Financeiro abre Compras: Receções tem o cadeado e, ao tentar, o aviso.', { perfil: 'financeiro', pasta: 'compras', sel: 'compras.rececoes', banner: 'sem-permissao', bannerTexto: 'A tua conta não tem acesso a Receções. Pede-o ao administrador.' }],
  ['dk-offline', '05.30 · Sem ligação', 'Sem rede: o aviso por cima e as ações que gravam desligadas; o que está aberto continua.', { seps: [sep('s1', 'compras.faltas', 'Lista de faltas')], ativo: 's1', banner: 'offline' }],
  ['dk-sessao', '05.31 · Sessão expirada', 'A sessão terminou: o diálogo por cima, «Iniciar sessão» leva ao login comum.', { dialogo: 'sessao' }],
  ['dk-navegacao', '05.32 · Falha a abrir', 'O ecrã pedido não abriu: o aviso e «Tentar outra vez».', { seps: [sep('s1', 'compras.cotacoes', 'Cotações')], ativo: 's1', banner: 'navegacao', bannerTexto: 'Não foi possível abrir «Cotações» (ERP-NAV-504).' }],
];
const NOTA = 'O Início v4, a área de trabalho (22 out., briefing «ERP V4 — Enterprise desktop workspace»): pastas para os módulos, separadores para o trabalho, janelas para o contexto; árvore das pastas a partir das linhas do menu; barra de ações com F5/F6/F8/F9/F11; Ctrl+K';
export const VERSAO_INICIO_V4 = 'v4';
export const versaoInicioV4 = () => ({ id: VERSAO_INICIO_V4, nota: NOTA, html: paginaEspaco() });
export function estadosEspaco(): Ecra<IdErp>[] {
  return ESTADOS.map(([id, nome, objetivo, o]) => ({ id: id as IdErp, nome, fluxo: 'Início', estadoDe: 'inicio' as IdErp, objetivo, versoes: [{ id: VERSAO_INICIO_V4, nota: NOTA, html: paginaEspaco({ ...novoEstado(o.perfil), ...o }, '', id) }] }));
}
export type IdEspaco = 'dk-compras' | 'dk-separadores' | 'dk-janela' | 'dk-minimizada' | 'dk-por-guardar' | 'dk-restaurada' | 'dk-primeira' | 'dk-sem-modulos' | 'dk-sem-recentes' | 'dk-pasta-carregar' | 'dk-pasta-vazia' | 'dk-desconhecido' | 'dk-rota' | 'dk-sem-permissao' | 'dk-offline' | 'dk-sessao' | 'dk-navegacao';
