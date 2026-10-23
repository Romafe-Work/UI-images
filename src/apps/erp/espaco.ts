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
import { MENU_ANTIGO } from './compras/menu-antigo-ids';
import { topoErp, numerosDoDia } from './inicio-v2';
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
import chartBar from 'lucide-static/icons/chart-bar.svg?raw';
import fileCheck from 'lucide-static/icons/file-check.svg?raw';
import hourglass from 'lucide-static/icons/hourglass.svg?raw';
import fileMinus from 'lucide-static/icons/file-minus.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import fileInput from 'lucide-static/icons/file-input.svg?raw';
import userStar from 'lucide-static/icons/user-star.svg?raw';
import calendarClock from 'lucide-static/icons/calendar-clock.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import packageIc from 'lucide-static/icons/package.svg?raw';
import folderTree from 'lucide-static/icons/folder-tree.svg?raw';
import tag from 'lucide-static/icons/tag.svg?raw';
import ruler from 'lucide-static/icons/ruler.svg?raw';
import house from 'lucide-static/icons/house.svg?raw';
import keyboardIc from 'lucide-static/icons/keyboard.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-lucide="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const IC = { x, minus, maximize2, minimize2, pin, pinOff, rotateCw, printer, plus, pencil, trash2, ellipsis, search, lock, appWindow, chevronRight, sun, moon, monitor, logOut, command, externalLink, warehouse, users, fileText, history };

/* =========================================================
   O menu, como viria da base de dados — e o registo das rotas que existem
   ========================================================= */
/** so: 'menu' — só no menu horizontal (o ERP antigo, ainda sem ecrã novo); om: a ordem no menu; sep: um separador antes. */
export interface LinhaMenu { id: string; app: 'erp'; modulo: string; pai: string | null; rotulo: string; icone: string; rota: string | null; ordem: number; permissoes: IdPerfil[] | '*'; ativo: boolean; so?: 'menu'; om?: number; sep?: boolean }
const M = (id: string, rotulo: string, icone: string, ordem: number, ativo = false): LinhaMenu => ({ id, app: 'erp', modulo: id, pai: null, rotulo, icone, rota: null, ordem, permissoes: '*', ativo });
const A = (id: string, pai: string, rotulo: string, icone: string, om: number, sep = false): LinhaMenu => ({ id, app: 'erp', modulo: 'compras', pai, rotulo, icone, rota: null, ordem: om, permissoes: '*', ativo: true, so: 'menu', om, sep });
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
  /* o menu Compras do ERP antigo (22 out., ela mostrou-o): a mesma ordem, os separadores e os mapas em submenus; o que ainda não tem ecrã novo fica desligado */
  A('compras-agendamento', 'compras', 'Agendamento de encomendas', 'calendar-clock', 30, true), A('compras-especiais', 'compras', 'Clientes — encomendas especiais', 'user-star', 35),
  A('compras-guias-entrada', 'compras', 'Guias de entrada', 'file-input', 50, true), A('compras-guias-transporte', 'compras', 'Guias de transporte a fornecedor', 'truck', 60, true),
  A('compras-faturas', 'compras', 'Faturas', 'receipt', 80, true), A('compras-notas-credito', 'compras', 'Notas de crédito', 'file-minus', 90, true),
  A('compras-pendentes', 'compras', 'Pendentes de crédito de fornecedor', 'hourglass', 100, true), A('compras-verificacao', 'compras', 'Verificação de faturas', 'file-check', 110, true),
  A('compras-mapas', 'compras', 'Mapas', 'chart-bar', 200, true),
  A('mapas-tot-enc', 'compras-mapas', 'Totais de documentos de encomenda', '', 10), A('mapas-det-enc', 'compras-mapas', 'Detalhes por documentos de encomenda', '', 20),
  A('mapas-tot-ge', 'compras-mapas', 'Totais de documentos de guia de entrada', '', 30, true), A('mapas-det-ge', 'compras-mapas', 'Detalhes por documentos de guia de entrada', '', 40),
  A('mapas-recap', 'compras-mapas', 'Mapa recapitulativo de fornecedores', '', 50, true),
  A('mapas-analise', 'compras-mapas', 'Análise de compras', '', 60, true), A('mapas-comparativos', 'compras-mapas', 'Comparativos de compras', '', 70),
  A('mapas-analise-forn', 'compras-mapas', 'Análise de fornecedores', '', 80, true), A('mapas-automatico', 'compras-mapas', 'Artigos/compras automático', '', 90, true),
  A('analise-artigo', 'mapas-analise', 'Mapa de compras por artigo', '', 10), A('analise-artigo-forn', 'mapas-analise', 'Mapa de compras por artigo/fornecedor', '', 20),
  A('analise-familia', 'mapas-analise', 'Mapa de compras por família', '', 30, true), A('analise-familia-forn', 'mapas-analise', 'Mapa de compras por família/fornecedor', '', 40),
  A('comp-geral', 'mapas-comparativos', 'Geral', '', 10), A('comp-geral-var', 'mapas-comparativos', 'Geral (variação anual)', '', 20),
  A('comp-artigo', 'mapas-comparativos', 'Por artigo', '', 30, true), A('comp-artigo-var', 'mapas-comparativos', 'Por artigo (variação anual)', '', 40),
  A('comp-familia', 'mapas-comparativos', 'Por família/subfamília', '', 50, true), A('comp-familia-var', 'mapas-comparativos', 'Por família/subfamília (variação anual)', '', 60),
  A('comp-forn', 'mapas-comparativos', 'Por fornecedor', '', 70, true), A('comp-forn-var', 'mapas-comparativos', 'Por fornecedor (variação anual)', '', 80),
];
/* a ordem do ERP antigo para os ecrãs que já existem (Orçamentos → Cotações; Recepção → Receções; Guias de devolução → Devoluções) */
const OM: Record<string, [number, boolean]> = { 'compras-faltas': [10, false], 'compras-cotacoes': [20, true], 'compras-encomendas': [40, true], 'compras-rececoes': [45, false], 'compras-devolucoes': [70, true], 'compras-fornecedores': [120, true], 'compras-requisicoes': [130, false] };
MENU_ERP.forEach((l) => { const o = OM[l.id]; if (o) { l.om = o[0]; l.sep = o[1]; } });
const ICONES: Record<string, string> = { 'layout-grid': layoutGrid, file, table, 'trending-up': trendingUp, boxes, 'hand-coins': handCoins, wallet, landmark, wrench, users, 'chart-column': chartColumn, 'file-text': fileText, 'sliders-horizontal': slidersHorizontal, 'monitor-cog': monitorCog, 'life-buoy': lifeBuoy, 'shopping-cart': shoppingCart, 'package-x': packageX, 'clipboard-list': clipboardList, scale, 'package-check': packageCheck, 'undo-2': undo2, 'folder-open': folderOpen, 'calendar-clock': calendarClock, 'user-star': userStar, 'file-input': fileInput, truck, receipt, 'file-minus': fileMinus, hourglass, 'file-check': fileCheck, 'chart-bar': chartBar,
  /* Ficheiros (23 out., Início v6) */
  package: packageIc, warehouse, 'folder-tree': folderTree, tag, ruler, house, keyboard: keyboardIc };
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
  /* Ficheiros (23 out., Início v6): só consulta — o que não existe (novo, editar) não aparece na barra */
  'ficheiros.artigos': { ecra: 'ficheiros-artigos', titulo: 'Artigos', icone: 'package', acoes: ['atualizar', 'imprimir'] },
  'ficheiros.armazens': { ecra: 'ficheiros-armazens', titulo: 'Armazéns', icone: 'warehouse', acoes: ['atualizar', 'imprimir'] },
  'ficheiros.familias': { ecra: 'ficheiros-familias', titulo: 'Famílias', icone: 'folder-tree', acoes: ['atualizar', 'imprimir'] },
  'ficheiros.marcas': { ecra: 'ficheiros-marcas', titulo: 'Marcas', icone: 'tag', acoes: ['atualizar', 'imprimir'] },
  'ficheiros.unidades': { ecra: 'ficheiros-unidades', titulo: 'Unidades de medida', icone: 'ruler', acoes: ['atualizar', 'imprimir'] },
  /* os documentos (abrem a partir das listas, dos recentes e da paleta) */
  'compras.encomenda': { ecra: 'compras-encomenda', titulo: 'Encomenda', icone: 'file-text', acoes: ['editar', 'eliminar', 'atualizar', 'imprimir'] },
  'compras.fornecedor': { ecra: 'compras-fornecedor', titulo: 'Fornecedor', icone: 'users', acoes: ['editar', 'atualizar', 'imprimir'] },
  'compras.requisicao': { ecra: 'compras-requisicao', titulo: 'Requisição', icone: 'clipboard-list', acoes: ['editar', 'eliminar', 'atualizar'] },
  'compras.cotacao': { ecra: 'compras-cotacao', titulo: 'Cotação', icone: 'scale', acoes: ['atualizar', 'imprimir'] },
  'compras.rececao': { ecra: 'compras-rececao', titulo: 'Receção', icone: 'package-check', acoes: ['atualizar', 'imprimir'] },
};
/* 23 out. (ela: «no figma coloca tudo available»): cada item do menu Compras do ERP antigo abre um ecrã (compras/menu-antigo.ts) */
MENU_ANTIGO.forEach((id) => {
  const l = MENU_ERP.find((x) => x.id === id); if (!l) return;
  const rota = l.rota ?? `compras.${id}`; l.rota = rota;
  ROTAS[rota] = { ecra: `cm-${id}`, titulo: l.rotulo, icone: l.icone || 'chart-bar', acoes: ['atualizar', 'imprimir'] };
});
export const rotaDoEcra = (ecra: string) => Object.keys(ROTAS).find((k) => ROTAS[k].ecra === ecra);
const pode = (l: LinhaMenu, p: IdPerfil) => l.permissoes === '*' || l.permissoes.includes(p);
/** Os módulos do perfil, pela ordem da base; os inativos vêm marcados (referência), não como se funcionassem. */
export const modulos = (p: IdPerfil) => MENU_ERP.filter((l) => !l.pai && pode(l, p)).sort((a, b) => a.ordem - b.ordem);
export const filhos = (pai: string, p: IdPerfil) => MENU_ERP.filter((l) => l.pai === pai && l.ativo && !l.so).sort((a, b) => a.ordem - b.ordem).map((l) => ({ ...l, permitido: pode(l, p), registada: !!(l.rota && ROTAS[l.rota]) }));
/** As linhas do menu horizontal: tudo, pela ordem do menu (om), com os submenus. */
export const linhasMenu = (pai: string, p: IdPerfil) => MENU_ERP.filter((l) => l.pai === pai && l.ativo).sort((a, b) => (a.om ?? a.ordem) - (b.om ?? b.ordem)).map((l) => ({ ...l, permitido: pode(l, p), registada: !!(l.rota && ROTAS[l.rota]), temFilhos: MENU_ERP.some((x) => x.pai === l.id) }));

/* =========================================================
   O estado da área de trabalho
   ========================================================= */
export interface Sep { id: string; rota: string; titulo: string; sujo?: boolean }
export interface Janela { id: string; tipo: 'fornecedor' | 'artigo'; chave: string; x: number; y: number; w: number; h: number; min?: boolean; max?: boolean; z: number }
export type Banner = '' | 'offline' | 'restaurada' | 'primeira' | 'sem-permissao' | 'navegacao' | 'rota' | 'desconhecido';
/** Um ecrã aberto de verdade (V6): o que «Recentes» mostra; nada inventado. */
export interface Hist { rota: string; titulo: string; quando: number }
export interface Estado {
  perfil: IdPerfil; seps: Sep[]; ativo: string; pasta: string; sel: string; vista: 'grelha' | 'lista'; fixados: string[]; arvore: Record<string, boolean>;
  janelas: Janela[]; banner: Banner; bannerTexto?: string; dialogo: string; carga?: 'pasta' | 'espaco'; rail?: boolean; trabalho?: 'recentes' | 'curso'; casa?: number; semCasa?: boolean; presos?: string[]; v6?: boolean; historico?: Hist[]; semCurso?: boolean; menu?: string; semModulos?: boolean; semRecentes?: boolean; primeira?: boolean; pastaVazia?: boolean; largura: number;
  /** v6 (23 out.): o menu lateral; nav = a navegação ainda a chegar da API ou falhada */
  lat?: boolean; nav?: 'carregar' | 'falha';
  /** v7 (23 out.): «The Living Workspace» — as transições ligadas (comportamento/vivo.ts) */
  vivo?: boolean;
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

/* ---------- a árvore (V5): secções, ícones maiores, fixados, e recolhe a um carril de ícones ---------- */
export function arvore(e: Estado): string {
  const mods = e.semModulos ? [] : modulos(e.perfil).filter((m) => m.ativo);
  const ativoRota = e.seps.find((s) => s.id === e.ativo)?.rota;
  const casa = e.ativo === 'inicio' && e.pasta === 'raiz' && !e.semCasa;
  return `<div class="dk-arv-topo"><span></span><button type="button" class="dk-arv-rail" data-dk-rail aria-label="${e.rail ? 'Expandir o menu' : 'Recolher o menu'}" aria-expanded="${!e.rail}">${L(chevronRight)}</button></div>
  <ul class="dk-arv" role="tree" aria-label="Pastas do ERP">
    <li role="treeitem" aria-selected="${casa}"><button type="button" class="dk-arv-i${casa ? ' is-ativo' : ''}" data-dk-ir="raiz" title="Área de trabalho">${L(layoutGrid)}<span>Área de trabalho</span></button></li>
  </ul>
  ${mods.length ? `<p class="dk-arv-h">Módulos</p>` : ''}
  <ul class="dk-arv" role="tree" aria-label="Módulos">
    ${mods.map((m) => { const aberta = !!e.arvore[m.id]; const fs = filhos(m.id, e.perfil); return `<li role="treeitem" aria-expanded="${aberta}">
      <button type="button" class="dk-arv-i${e.ativo === 'inicio' && e.pasta === m.id ? ' is-ativo' : ''}" data-dk-ir="${m.id}" title="${esc(m.rotulo)}">${icone(m.icone)}<span>${esc(m.rotulo)}</span><span class="dk-arv-seta" data-dk-dobrar="${m.id}" aria-hidden="true">${L(chevronRight)}</span></button>
      <ul role="group" class="dk-arv-sub"${aberta ? '' : ' hidden'}>${fs.map((f) => `<li role="treeitem"><button type="button" class="dk-arv-i dk-arv-f${ativoRota === f.rota ? ' is-ativo' : ''}${!f.registada || !f.permitido ? ' is-off' : ''}" data-dk-abrir="${f.rota}" title="${esc(f.rotulo)}"><span>${esc(f.rotulo)}</span>${!f.registada ? '<small>em breve</small>' : !f.permitido ? L(lock, 'dk-arv-cad') : ''}</button></li>`).join('')}</ul></li>`; }).join('')}
  </ul>
  ${e.fixados.length && mods.length ? `<p class="dk-arv-h">Fixados</p><ul class="dk-arv" role="tree" aria-label="Fixados">${e.fixados.filter((r) => ROTAS[r]).map((r) => `<li role="treeitem"><button type="button" class="dk-arv-i${ativoRota === r ? ' is-ativo' : ''}" data-dk-atalho="${r}" title="${esc(ROTAS[r].titulo)}">${icone(ROTAS[r].icone)}<span>${esc(ROTAS[r].titulo)}</span></button></li>`).join('')}</ul>` : ''}`;
}

/* ---------- os separadores ---------- */
/** A ordem dos separadores: a área de trabalho também se mexe, fixa e fecha (22 out.); os fixados vão à frente. */
export function ordemSeps(e: Estado): string[] {
  const ids = e.seps.map((s) => s.id);
  if (!e.semCasa) ids.splice(Math.min(e.casa ?? 0, ids.length), 0, 'inicio');
  const presos = e.presos ?? [];
  return [...ids.filter((i) => presos.includes(i)), ...ids.filter((i) => !presos.includes(i))];
}
export function separadores(e: Estado): string {
  const sep = (id: string, titulo: string, ic: string, sujo = false) => {
    const preso = (e.presos ?? []).includes(id);
    return `<div class="dk-sep${e.ativo === id ? ' is-ativo' : ''}${sujo ? ' is-sujo' : ''}${preso ? ' is-preso' : ''}" role="tab" aria-selected="${e.ativo === id}" tabindex="${e.ativo === id ? 0 : -1}" data-dk-sep="${id}" draggable="true" title="${esc(titulo)}">
    ${icone(ic, 'dk-sep-ic')}<span class="dk-sep-t">${esc(titulo)}</span>${sujo ? '<i class="dk-sep-sujo" aria-label="Alterações por guardar"></i>' : ''}<button type="button" class="dk-sep-pin" data-dk-prender="${id}" aria-pressed="${preso}" aria-label="${preso ? 'Desafixar' : 'Fixar'} ${esc(titulo)}" title="${preso ? 'Desafixar o separador' : 'Fixar o separador'} (Alt P)">${L(preso ? pinOff : pin)}</button>${preso ? '' : `<button type="button" class="dk-sep-x" data-dk-fechar="${id}" aria-label="Fechar ${esc(titulo)}" title="Fechar (Alt W)">${L(x)}</button>`}</div>`;
  };
  return ordemSeps(e).map((id) => { if (id === 'inicio') return sep('inicio', 'Área de trabalho', 'layout-grid'); const s = e.seps.find((y) => y.id === id)!; return sep(s.id, s.titulo, ROTAS[s.rota]?.icone ?? (s.rota.startsWith('pasta:') ? 'folder-open' : 'file'), !!s.sujo); }).join('');
}

/* ---------- a barra de ações (muda com o separador) ---------- */
const NOME_ACAO: Record<Acao, [string, string]> = { novo: ['Novo', plus], editar: ['Editar', pencil], eliminar: ['Eliminar', trash2], atualizar: ['Atualizar', rotateCw], imprimir: ['Imprimir', printer] };
/** A pasta à vista: na V6 cada pasta é um separador («pasta:compras»); na v4, a área de trabalho. */
export function pastaDe(e: Estado): string | null {
  const s = e.seps.find((x) => x.id === e.ativo);
  if (s) return s.rota.startsWith('pasta:') ? s.rota.slice(6) : null;
  return e.ativo === 'inicio' && !e.semCasa ? e.pasta : null;
}
export function acoes(e: Estado): string {
  const off = e.banner === 'offline' ? ' disabled' : '';
  const btn = (k: string, t: string, ic: string, tecla = '', extra = '') => `<button type="button" class="dk-acao" data-dk-acao="${k}"${extra}${off && k !== 'atualizar' ? '' : ''}>${L(ic)}<span>${t}</span>${tecla ? `<kbd>${tecla}</kbd>` : ''}</button>`;
  const pa = pastaDe(e);
  if (pa !== null) {
    const r = e.sel && ROTAS[e.sel], fixado = !!e.sel && e.fixados.includes(e.sel);
    return `${pa !== 'raiz' ? btn('voltar', 'Voltar', arrowLeft, 'Alt ←') : ''}
      ${btn('abrir', 'Abrir', folderOpen, 'Enter', e.sel ? '' : ' disabled')}
      ${btn('fixar', fixado ? 'Desafixar' : 'Fixar no acesso rápido', fixado ? pinOff : pin, 'Ctrl D', r ? '' : ' disabled')}
      ${btn('atualizar', 'Atualizar', rotateCw, 'F9')}
`;
  }
  const s = e.seps.find((x) => x.id === e.ativo); const r = s && ROTAS[s.rota];
  if (!r) return '';
  return `${r.acoes.map((a) => btn(a, NOME_ACAO[a][0], NOME_ACAO[a][1], TECLA[a], off && a !== 'atualizar' && a !== 'imprimir' ? ' disabled' : '')).join('')}
    <span class="dk-acoes-mais"><button type="button" class="dk-acao" data-dk-acao="mais" aria-haspopup="menu" aria-expanded="false">${L(ellipsis)}<span>Mais ações</span></button>
      <div class="dk-menu" data-dk-menu-mais role="menu" hidden>
        <button type="button" role="menuitem" data-dk-acao="fixar-sep">${L(pin)}${e.fixados.includes(s!.rota) ? 'Desafixar do acesso rápido' : 'Fixar no acesso rápido'}<kbd>Ctrl D</kbd></button>
        <button type="button" role="menuitem" data-dk-prender="${s!.id}">${L((e.presos ?? []).includes(s!.id) ? pinOff : pin)}${(e.presos ?? []).includes(s!.id) ? 'Desafixar o separador' : 'Fixar o separador'}<kbd>Alt P</kbd></button>
        <button type="button" role="menuitem" data-dk-acao="duplicar">${L(appWindow)}Abrir noutro separador</button>
        <button type="button" role="menuitem" data-dk-acao="externo">${L(externalLink)}Abrir numa janela do navegador</button>
        <button type="button" role="menuitem" data-dk-acao="fechar-outros">${L(x)}Fechar os outros separadores</button>
      </div></span>`;
}

/* ---------- o explorador (V5) ---------- */
/** O que cada módulo faz (uma linha) e o tipo de cada ecrã — para não serem todos o mesmo ícone de ficheiro. */
export const DESCR: Record<string, string> = { compras: 'Encomendas a fornecedor, receções, fornecedores, requisições, cotações e a lista de faltas.' };
export const TIPO: Record<string, [string, string]> = {
  'compras.faltas': ['Análise', 'O que está em rutura e o que comprar'], 'compras.encomendas': ['Lista', 'Encomendas a fornecedor, por estado'], 'compras.fornecedores': ['Registos', 'Fichas, condições e desempenho'],
  'compras.requisicoes': ['Lista', 'Pedidos internos de compra'], 'compras.cotacoes': ['Comparação', 'Propostas lado a lado'], 'compras.rececoes': ['Operação', 'O que chegou ao armazém'], 'compras.devolucoes': ['Lista', 'Ainda no ERP antigo'],
};
/** A pasta grande (V5): o fundo com a aba, as folhas que espreitam e a frente que se levanta. */
export function pastaArte(ic: string, cls = ''): string {
  return `<span class="dk-arte${cls ? ` ${cls}` : ''}" aria-hidden="true"><svg viewBox="0 0 160 120"><path class="dk-p-fundo" d="M10 16a8 8 0 0 1 8-8h40a8 8 0 0 1 6 2.8L74 22h68a8 8 0 0 1 8 8v74a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8Z"/><rect class="dk-p-folha dk-p-folha--2" x="26" y="22" width="108" height="56" rx="3"/><rect class="dk-p-folha" x="20" y="28" width="120" height="56" rx="3"/><path class="dk-p-frente" d="M4 44a8 8 0 0 1 8-8h136a8 8 0 0 1 8 8l-4.4 60a8 8 0 0 1-8 7.4H16.4a8 8 0 0 1-8-7.4Z"/></svg>${icone(ic, 'dk-arte-ic')}</span>`;
}
/** Os ecrãs que abrem da área de trabalho, pela ordem do menu: os cartões e as teclas Alt 1…9 (como no ERP antigo). */
export const ecrasCasa = (e: Estado) => (e.semModulos ? [] : modulos(e.perfil).filter((m) => m.ativo)).flatMap((m) => filhos(m.id, e.perfil).filter((f) => f.registada && f.permitido)).map((f) => f.rota!);
/** Os cartões (22 out., ela: «quero como» o ERP antigo): brancos, o ícone, o nome, o código e a tecla. Um clique abre. */
export function cartoesEcras(e: Estado): string {
  return `<div class="dk-cartoes">${ecrasCasa(e).map((r, i) => `<button type="button" class="dk-cartao" data-dk-atalho="${r}" style="--i:${i}" title="Abrir ${esc(ROTAS[r].titulo)}${i < 9 ? ` (Alt ${i + 1})` : ''}">${icone(ROTAS[r].icone, 'dk-cartao-ic')}<b>${esc(ROTAS[r].titulo)}</b><small>${esc(r.split('.')[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())}</small>${i < 9 ? `<kbd>Alt+${i + 1}</kbd>` : ''}</button>`).join('')}</div>`;
}
/** Para hoje (22 out.): o que pede ação, numa linha; os números vêm das encomendas e do stock, e cada um abre a lista. */
export function paraHoje(e: Estado): string {
  if (e.semModulos || !ecrasCasa(e).length) return '';
  const n = numerosDoDia();
  const it = (k: number, um: string, varios: string, rota: string, tom: string) => `<button type="button" class="dk-hoje-i${k ? ` is-${tom}` : ' is-zero'}" data-dk-atalho="${rota}"><b>${k}</b><span>${k === 1 ? um : varios}</span>${L(chevronRight)}</button>`;
  return `<section class="dk-hoje" aria-label="Para hoje"><h2>Para hoje</h2>
    ${it(n.aprovar.length, 'encomenda por aprovar', 'encomendas por aprovar', 'compras.encomendas', 'aviso')}
    ${it(n.atrasadas.length, 'entrega atrasada', 'entregas atrasadas', 'compras.encomendas', 'erro')}
    ${it(n.rutura.length, 'artigo em rutura', 'artigos em rutura', 'compras.faltas', 'erro')}
  </section>`;
}
function trabalho(e: Estado): string {
  const aba = e.trabalho ?? 'recentes';
  const rec = e.semRecentes || e.primeira ? [] : RECENTES[e.perfil] ?? [];
  const cur = e.primeira ? [] : encomendas().filter((x) => x.estado === 'Rascunho' || x.estado === 'A aprovar').slice(0, 5);
  const linha = (i: number, ic: string, ref: string, ent: string, estado: string, quando: string, alvo: string, tom = '') => `<li style="--i:${i}"><button type="button" class="dk-tl" ${alvo}>${L(ic, 'dk-tl-ic')}<span class="dk-tl-ref">${esc(ref)}</span><span class="dk-tl-ent">${esc(ent)}</span><span class="dk-tl-est${tom ? ` dk-tl-est--${tom}` : ''}">${esc(estado)}</span><span class="dk-tl-q">${esc(quando)}</span><span class="dk-tl-acao">Abrir${L(chevronRight)}</span></button></li>`;
  const corpo = aba === 'recentes'
    ? (rec.length ? `<ul class="dk-tls">${rec.slice(0, 5).map((r, i) => {
        const alvo = r.tipo === 'registo' ? `data-dk-janela="fornecedor:${(FORNECEDORES.find((f) => r.titulo.includes(f.nome.split(' ')[0]))?.id ?? 'trw')}"` : r.tipo === 'pesquisa' ? `data-dk-paleta="${esc(r.procura ?? '')}"` : r.doc ? `data-dk-doc="compras.encomenda" data-dk-titulo="${esc(r.doc)}"` : 'data-dk-atalho="compras.encomendas"';
        const ic = r.tipo === 'registo' ? users : r.tipo === 'pesquisa' ? search : r.tipo === 'espaco' ? pin : fileText;
        const [ref, ent] = r.titulo.includes(' · ') ? r.titulo.split(' · ') : [r.titulo, ''];
        return linha(i, ic, ref, ent || r.sub.split(' · ')[0], r.sub.split(' · ').slice(ent ? 0 : 1).join(' · ') || r.tipo, r.quando, alvo);
      }).join('')}</ul>` : `<p class="dk-vazio">${L(history)}${e.primeira ? 'Ainda não abriste nada. O que abrires aparece aqui.' : 'Sem recentes. Os documentos que abrires aparecem aqui.'}</p>`)
    : (cur.length ? `<ul class="dk-tls">${cur.map((x, i) => linha(i, fileClock, x.ref, FORNECEDORES.find((f) => f.id === x.forn)?.nome ?? x.forn, x.estado, `${x.linhas.length} linhas`, `data-dk-doc="compras.encomenda" data-dk-titulo="${esc(x.ref)}"`, x.estado === 'Rascunho' ? 'rasc' : 'aprov')).join('')}</ul>` : `<p class="dk-vazio">${L(fileClock)}Nada em curso.</p>`);
  return `<section class="dk-sec dk-trab" aria-labelledby="dk-tr-t"><div class="dk-sec-cab"><h2 id="dk-tr-t">O teu trabalho</h2>
    <div class="dk-seg" role="tablist" aria-label="O teu trabalho"><button type="button" role="tab" aria-selected="${aba === 'recentes'}" data-dk-trab="recentes">${L(history)}Recentes <span>${rec.length}</span></button><button type="button" role="tab" aria-selected="${aba === 'curso'}" data-dk-trab="curso">${L(fileClock)}Em curso <span>${cur.length}</span></button></div></div>
    ${corpo}</section>`;
}
function rapido(e: Estado): string {
  const l = e.fixados.filter((r) => ROTAS[r]);
  return `<section class="dk-sec dk-rapido" aria-labelledby="dk-ac-t"><div class="dk-sec-cab"><h2 id="dk-ac-t">Acesso rápido</h2></div>
    ${l.length ? `<ul class="dk-atalhos">${l.map((r, i) => `<li style="--i:${i}"><button type="button" class="dk-atalho" data-dk-atalho="${r}"><span class="dk-atalho-ic">${icone(ROTAS[r].icone)}</span><span class="dk-atalho-t"><b>${esc(ROTAS[r].titulo)}</b><small>Compras</small></span>${L(chevronRight, 'dk-atalho-seta')}</button><button type="button" class="dk-atalho-pin" data-dk-desafixar="${r}" aria-label="Desafixar ${esc(ROTAS[r].titulo)}" title="Desafixar">${L(pinOff)}</button></li>`).join('')}</ul>`
    : `<p class="dk-vazio">${L(pin)}Fixa aqui os ecrãs que usas mais: abre a pasta, escolhe um e «Fixar».</p>`}
  </section>`;
}
export function explorador(e: Estado): string {
  const p = PERFIS[e.perfil];
  const raiz = e.pasta === 'raiz';
  const mod = !raiz ? MENU_ERP.find((l) => l.id === e.pasta && !l.pai) : undefined;
  if (raiz) {
    const todos = e.semModulos ? [] : modulos(e.perfil), ativos = todos.filter((m) => m.ativo), prep = todos.filter((m) => !m.ativo);
    return `<div class="dk-exp dk-exp--raiz" data-vista="${e.vista}">
      <div class="dk-titulo dk-titulo--raiz"><h1>Área de trabalho</h1><p>Os teus módulos, documentos e tarefas · ${esc(p.pessoa)}, ${esc(p.cargo)}</p></div>
      ${ativos.length ? `<div class="dk-palco">
        <section class="dk-sec dk-mods-sec" aria-labelledby="dk-mod-t"><div class="dk-sec-cab"><h2 id="dk-mod-t">${ativos.map((m) => esc(m.rotulo)).join(' · ')}</h2></div>${cartoesEcras(e)}</section>
        ${paraHoje(e)}
        ${rapido(e)}
      </div>
      ${trabalho(e)}
      ${prep.length ? `<p class="dk-prep"><span>${L(lock)}Em preparação — continuam no ERP antigo:</span>${prep.map((m) => `<span class="dk-prep-i" title="Ainda no ERP antigo">${icone(m.icone)}${esc(m.rotulo)}</span>`).join('')}</p>` : ''}`
      : `<p class="dk-vazio dk-vazio--grande">${L(shieldX)}<span><b>A tua conta ainda não tem módulos do ERP.</b>Pede o acesso ao administrador da tua empresa.</span></p>`}
    </div>`;
  }
  const cab = `<header class="dk-exp-cab">
    <button type="button" class="dk-voltar" data-dk-acao="voltar" aria-label="Voltar à área de trabalho">${L(arrowLeft)}</button>
    <nav class="dk-migalhas" aria-label="Onde estou"><button type="button" data-dk-ir="raiz">Área de trabalho</button>${L(chevronRight)}<span aria-current="page">${esc(mod?.rotulo ?? e.pasta)}</span></nav>
  </header>`;
  const fs = e.pastaVazia ? [] : filhos(e.pasta, e.perfil);
  const sel = fs.find((f) => f.rota === e.sel);
  const docs = e.pastaVazia || e.carga ? [] : encomendas().slice(0, 4);
  const vistas = e.v6 ? [] : (RECENTES[e.perfil] ?? []).filter((r) => r.tipo === 'espaco');
  return `${cab}<div class="dk-exp dk-exp--pasta" data-vista="${e.vista}">
    <div class="dk-titulo dk-titulo--pasta">${pastaArte(mod?.icone ?? 'file', 'is-aberta')}<div><h1>${esc(mod?.rotulo ?? e.pasta)}</h1><p>${e.carga === 'pasta' ? 'A abrir a pasta…' : `${fs.filter((f) => f.registada && f.permitido).length} ecrãs disponíveis · ${esc(DESCR[e.pasta] ?? '')}`}</p></div></div>
    ${e.carga === 'pasta' ? `<div class="dk-grelha dk-grelha--ecras">${Array.from({ length: 6 }, () => '<span class="dk-esq"></span>').join('')}</div>`
    : fs.length ? `<section class="dk-sec"><div class="dk-sec-cab"><h2>Ecrãs</h2></div><div class="dk-grelha dk-grelha--ecras">${fs.map((f, i) => { const est = !f.registada ? 'sem-rota' : !f.permitido ? 'sem-permissao' : ''; const [tipo, d] = TIPO[f.rota!] ?? ['Ecrã', '']; return `<button type="button" class="dk-ecra${est ? ` is-${est}` : ''}" data-dk-abrir="${f.rota}" aria-selected="${e.sel === f.rota}" style="--i:${i}"${est ? ' aria-disabled="true"' : ''}><span class="dk-ecra-ic">${icone(f.icone)}</span><span class="dk-ecra-t"><small>${est === 'sem-rota' ? 'Ainda sem ecrã' : est ? 'Sem permissão' : tipo}</small><b>${esc(f.rotulo)}</b><span>${esc(d)}</span></span>${est ? L(lock, 'dk-ecra-cad') : L(chevronRight, 'dk-ecra-seta')}</button>`; }).join('')}</div></section>
      <p class="dk-detalhe" aria-live="polite">${sel ? `${icone(sel.icone)}<b>${esc(sel.rotulo)}</b><span>${sel.registada && sel.permitido ? 'Enter ou duplo clique abre num separador' : sel.registada ? 'A tua conta não tem acesso a este ecrã' : 'Este ecrã ainda não existe no ERP novo'}</span>` : `${L(folderOpen)}<span>Escolhe um ecrã. Enter ou duplo clique abre-o num separador.</span>`}</p>
      <div class="dk-duas">
        ${vistas.length ? `<section class="dk-sec"><div class="dk-sec-cab"><h2>Vistas guardadas</h2></div><ul class="dk-tls">${vistas.map((v, i) => `<li style="--i:${i}"><button type="button" class="dk-tl" data-dk-atalho="compras.encomendas">${L(pin, 'dk-tl-ic')}<span class="dk-tl-ref">${esc(v.titulo.split(' · ')[1] ?? v.titulo)}</span><span class="dk-tl-ent">${esc(v.titulo.split(' · ')[0])}</span><span class="dk-tl-est">Vista</span><span class="dk-tl-q">${esc(v.quando)}</span><span class="dk-tl-acao">Abrir${L(chevronRight)}</span></button></li>`).join('')}</ul></section>` : ''}
        <section class="dk-sec"><div class="dk-sec-cab"><h2>Documentos recentes</h2></div><ul class="dk-tls">${docs.map((x, i) => `<li style="--i:${i}"><button type="button" class="dk-tl" data-dk-doc="compras.encomenda" data-dk-titulo="${esc(x.ref)}">${L(fileText, 'dk-tl-ic')}<span class="dk-tl-ref">${esc(x.ref)}</span><span class="dk-tl-ent">${esc(FORNECEDORES.find((f) => f.id === x.forn)?.nome ?? x.forn)}</span><span class="dk-tl-est">${esc(x.estado)}</span><span class="dk-tl-q">${x.linhas.length} linhas</span><span class="dk-tl-acao">Abrir${L(chevronRight)}</span></button></li>`).join('')}</ul></section>
      </div>`
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
  /* 23 out.: só o 60 tem stock no protótipo; os outros não se inventam */
  const linhas: [string, number | null][] = [['60 · Coimbra', s60], ['10 · Porto', null], ['20 · Sacavém', null]];
  return [`Artigo · ${a.ref}`, `<p class="dk-jan-sub">${esc(a.marca)} · ${esc(a.desc)}</p>
    <table class="dk-tab"><thead><tr><th>Armazém</th><th class="is-num">Stock</th></tr></thead><tbody>${linhas.map(([n, q]) => `<tr><td>${L(warehouse)}${n}</td><td class="is-num${q !== null && q <= 0 ? ' is-zero' : ''}">${q ?? '—'}</td></tr>`).join('')}</tbody></table>
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
/** Os atalhos (V6): os do ERP antigo e os da área de trabalho; a ajuda mostra-os todos. */
export const ATALHOS: [string, string][] = [
  ['Procurar ou executar', 'Ctrl K'], ['Ir para o menu', 'F10'], ['Abrir o escolhido', 'Enter'], ['Voltar à pasta de cima', 'Alt ←'],
  ['Fixar no acesso rápido', 'Ctrl D'], ['Fixar o separador', 'Alt P'], ['Fechar o separador', 'Alt W'], ['Abrir os ecrãs da área de trabalho', 'Alt 1…9'],
  ['Novo', 'F5'], ['Editar', 'F6'], ['Eliminar', 'F8'], ['Atualizar', 'F9'], ['Imprimir', 'F11'], ['Atalhos de teclado', 'F1'],
];
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
  if (e.dialogo === 'atalhos') return `<div class="dk-veu" data-dk-dialogo-fora></div><section class="dk-dialogo dk-dialogo--atalhos" role="dialog" aria-labelledby="dk-d-t"><h2 id="dk-d-t">${L(command)}Atalhos de teclado</h2>
    <dl class="dk-teclas">${ATALHOS.map(([t, k]) => `<div><dt>${esc(t)}</dt><dd>${k.split(' ').map((x) => `<kbd>${esc(x)}</kbd>`).join('')}</dd></div>`).join('')}</dl>
    <div class="dk-dialogo-acoes"><button type="button" class="dk-acao" data-dk-dialogo="cancelar">${L(x)}<span>Fechar</span></button></div></section>`;
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
/** Fechou-se tudo, até a área de trabalho: um vazio que diz como voltar. */
export function semSeparadores(): string {
  return `<div class="dk-nada">${icone('layout-grid')}<h1>Sem separadores abertos</h1><p>Abre a área de trabalho, um ecrã do menu à esquerda ou procura com Ctrl K.</p><button type="button" class="dk-mod-cta" data-dk-casa>${L(chevronRight)}Abrir a área de trabalho</button></div>`;
}
export function corpoEspaco(e: Estado, exp: (e: Estado) => string = explorador): string {
  return `<div class="dk-acoes sh-r" style="--r:1" role="toolbar" aria-label="Ações" data-dk-acoes>${acoes(e)}</div>
    <div data-dk-banner>${banner(e)}</div>
    <div class="dk-paineis" data-dk-paineis>
      <section class="dk-painel${e.ativo === 'inicio' ? ' is-ativo' : ''}" data-painel="inicio" role="tabpanel" aria-label="Área de trabalho"><div class="sh-r" style="--r:2" data-dk-exp>${e.semCasa ? semSeparadores() : exp(e)}</div></section>
      ${e.seps.map((s) => `<section class="dk-painel${e.ativo === s.id ? ' is-ativo' : ''}" data-painel="${s.id}" role="tabpanel" aria-label="${esc(s.titulo)}">${s.rota.startsWith('pasta:') ? `<div data-dk-exp-pasta="${s.rota.slice(6)}">${exp({ ...e, pasta: s.rota.slice(6) })}</div>` : `<div class="dk-carga"><span></span>A abrir ${esc(s.titulo)}…</div>`}</section>`).join('')}
    </div>
    <div class="dk-janelas" data-dk-janelas data-por-cima>${e.janelas.map((j) => janela(j, j.z === Math.max(...e.janelas.map((y) => y.z)))).join('')}</div>
    <div class="dk-doca" data-dk-doca data-por-cima>${doca(e)}</div>`;
}
export function paginaEspaco(e: Estado = novoEstado(), extra = '', cen = 'normal'): string {
  return `<div class="hm sh dkr" data-hm data-sh>
  ${topoErp([['Área de trabalho', '']], false, e.perfil)
    .replace('<header class="hm-topo">', `<header class="hm-topo dk-topo" style="--dk-lado:${e.rail ? 72 : e.largura}px"><button type="button" class="sh-menu-movel" data-sh-movel aria-label="Abrir as pastas">${L(list)}</button>`)
    .replace(/<nav class="hm-caminho"[\s\S]*?<\/nav>/, `<div class="dk-barra sh-r" style="--r:0"><div class="dk-seps" role="tablist" aria-label="Separadores abertos" data-dk-seps>${separadores(e)}</div><i class="dk-seps-ind" data-dk-seps-ind aria-hidden="true"></i></div>`)
    .replace(/<label class="hm-procura">[\s\S]*?<\/label>/, `<button type="button" class="dk-procura" data-dk-paleta>${L(search)}<span>Procurar ou executar…</span><kbd>Ctrl K</kbd></button>`)}
  <div class="sh-corpo dk-corpo${e.rail ? ' is-rail' : ''}" style="--sh-lado:${e.rail ? 72 : e.largura}px">
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
export type Est = [string, string, string, Partial<Estado>];
export const ESTADOS: Est[] = [
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
export type IdEspaco = 'dk-carregar' | 'dk-sem-atalhos' | 'dk-sem-curso' | 'dk-recentes' | 'dk-menu' | 'dk-atalhos' | 'dk-compras' | 'dk-separadores' | 'dk-janela' | 'dk-minimizada' | 'dk-por-guardar' | 'dk-restaurada' | 'dk-primeira' | 'dk-sem-modulos' | 'dk-sem-recentes' | 'dk-pasta-carregar' | 'dk-pasta-vazia' | 'dk-desconhecido' | 'dk-rota' | 'dk-sem-permissao' | 'dk-offline' | 'dk-sessao' | 'dk-navegacao';
