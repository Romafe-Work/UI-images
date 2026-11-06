/* =========================================================
   ERP — 05 · Início v3, a área de trabalho como um IDE (6 nov. 2026): o desenho.
   Funções puras: disposição (ide/modelo.ts) → HTML. O motor (comportamento/ide.ts) chama-as a cada mudança da árvore;
   os ecrãs não se redesenham — cada documento é um iframe que vive numa camada à parte e só muda de sítio.
   Peças: barra de menus, barra de comandos, a área (bordas com as janelas ocultas, a árvore de divisões e grupos, as
   janelas flutuantes), a barra de estado; e o conteúdo das janelas de ferramenta (Explorador, Pesquisa, Propriedades,
   Stock por armazém, Documentos relacionados, Histórico, Notificações, Mensagens do sistema).
   ========================================================= */
import { L, esc, icone, ROTAS } from '../espaco';
import { navegacao, type NoNav } from '../navegacao';
import type { IdPerfil } from '../inicio-dados';
import { PERFIS } from '../inicio-dados';
import { FORNECEDORES, ARTIGOS, ARMAZEM, artigo, fornecedor, encomenda, encomendas, rececoesDe, stock, aCaminho, pendente, atrasada, totais, euros, dia, db } from '../compras/dominio';
import {
  PRESETS, grupos, soFerramentas, flutDe,
  type Disposicao, type No, type Grupo, type Flutuante, type Item, type IdFerr, type Contexto, type Lado,
} from './modelo';
import x from 'lucide-static/icons/x.svg?raw';
import pin from 'lucide-static/icons/pin.svg?raw';
import pinOff from 'lucide-static/icons/pin-off.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import maximize2 from 'lucide-static/icons/maximize-2.svg?raw';
import minimize2 from 'lucide-static/icons/minimize-2.svg?raw';
import appWindow from 'lucide-static/icons/app-window.svg?raw';
import panelLeft from 'lucide-static/icons/panel-left.svg?raw';
import columns2 from 'lucide-static/icons/columns-2.svg?raw';
import rows2 from 'lucide-static/icons/rows-2.svg?raw';
import star from 'lucide-static/icons/star.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import folderTree from 'lucide-static/icons/folder-tree.svg?raw';
import layoutGrid from 'lucide-static/icons/layout-grid.svg?raw';
import packageSearch from 'lucide-static/icons/package-search.svg?raw';
import idCard from 'lucide-static/icons/id-card.svg?raw';
import fileStack from 'lucide-static/icons/file-stack.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';
import folder from 'lucide-static/icons/folder.svg?raw';
import slidersHorizontal from 'lucide-static/icons/sliders-horizontal.svg?raw';
import warehouse from 'lucide-static/icons/warehouse.svg?raw';
import link from 'lucide-static/icons/link.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import bell from 'lucide-static/icons/bell.svg?raw';
import messageSquare from 'lucide-static/icons/message-square.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import refreshCw from 'lucide-static/icons/refresh-cw.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import layoutTemplate from 'lucide-static/icons/layout-template.svg?raw';
import wifi from 'lucide-static/icons/wifi.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import user from 'lucide-static/icons/user.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import packageIc from 'lucide-static/icons/package.svg?raw';
import users from 'lucide-static/icons/users.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import squareSplitVertical from 'lucide-static/icons/square-split-vertical.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import settings from 'lucide-static/icons/settings.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import copy from 'lucide-static/icons/copy.svg?raw';
import trash2 from 'lucide-static/icons/trash-2.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw';

export const I = { x, pin, pinOff, chevronDown, chevronRight, maximize2, minimize2, appWindow, panelLeft, columns2, rows2, star, clock, search, folderTree, folder, slidersHorizontal, warehouse, link, history, bell, messageSquare, plus, pencil, save, ban, refreshCw, download, printer, layoutTemplate, wifi, wifiOff, user, fileText, packageIc, users, packageCheck, loader, circleAlert, info, eye, squareSplitVertical, keyboard, check };
const ICONE_FERR: Record<IdFerr, string> = { explorador: layoutGrid, pesquisa: packageSearch, propriedades: idCard, stock: warehouse, relacionados: fileStack, historico: history, notificacoes: triangleAlert, mensagens: messageSquare };
export const iconeItem = (it: Item | undefined) => !it ? L(fileText) : it.tipo === 'ferr' ? L(ICONE_FERR[it.ferr!]) : icone(ROTAS[it.rota!]?.icone ?? 'file-text');

/* =========================================================
   A casca: menus, comandos, área, estado
   ========================================================= */
export const MENUS: [string, string][] = [['ficheiro', 'Ficheiro'], ['editar', 'Editar'], ['ver', 'Ver'], ['modulos', 'Módulos'], ['janela', 'Janela'], ['ferramentas', 'Ferramentas'], ['ajuda', 'Ajuda']];
/** Os comandos da barra: o comando, o ícone, o rótulo, a tecla (a do ERP antigo, quando existe). */
export const COMANDOS: [string, string, string, string][] = [
  ['novo', plus, 'Novo', 'F5'], ['editar', pencil, 'Editar', 'F6'], ['guardar', save, 'Guardar', ''], ['anular', ban, 'Anular', 'F8'],
  ['|', '', '', ''], ['atualizar', refreshCw, 'Atualizar', 'F9'], ['exportar', download, 'Exportar', ''], ['imprimir', printer, 'Imprimir', 'F11'],
];
export interface Casca { cenario: string; perfil: IdPerfil; d: Disposicao }
export function casca(c: Casca): string {
  return `<div class="ide" data-ide data-ide-cenario="${esc(c.cenario)}">
  <header class="ide-topo">
    <a class="ide-marca" href="#" data-ide-cmd="explorador" aria-label="ROMAFE ERP"><span class="romafe ide-romafe">ROMAFE</span><i aria-hidden="true"></i><span>ERP</span></a>
    <nav class="ide-menus" role="menubar" aria-label="Menu da aplicação">${MENUS.map(([k, t]) => `<div class="ide-m" data-ide-m="${k}"><button type="button" class="ide-m-b" role="menuitem" aria-haspopup="true" aria-expanded="false" data-ide-menu="${k}">${t}</button></div>`).join('')}</nav>
    <button type="button" class="ide-procura" data-ide-cmd="abrir-rapido" title="Ir para um ecrã ou separador; com «>» à frente, os comandos">${L(search)}<span>Ir para um ecrã, separador ou comando…</span><kbd data-ide-kbd="abrir-rapido">Ctrl P</kbd></button>
  </header>
  <div class="ide-cmds ide-acoes" data-ide-acoes role="toolbar" aria-label="Ações do ecrã em uso"></div>
  <div class="ide-corpo">
    <nav class="ide-atv" data-ide-atv aria-label="Barra de atividade"></nav>
    <div class="ide-borda ide-borda--esq" data-ide-borda="esq" role="tablist" aria-label="Janelas ocultas à esquerda" aria-orientation="vertical"></div>
    <div class="ide-area" data-ide-area>
      <div class="ide-arvore" data-ide-arvore>${arvore(c.d, c.d.raiz)}</div>
      <div class="ide-camada" data-ide-camada aria-hidden="false"></div>
      <div class="ide-flut" data-ide-flut>${c.d.flut.map((f) => flutuante(c.d, f, f.z === Math.max(...c.d.flut.map((y) => y.z)))).join('')}</div>
      <div class="ide-voo" data-ide-voo hidden></div>
      <p class="ide-pequena" data-ide-pequena hidden>${L(info)}<span>A janela é estreita para as divisões: vê-se só o grupo ativo. Alarga a janela ou <button type="button" data-ide-cmd="ver-todas">ver todas as divisões</button>.</span></p>
    </div>
    <div class="ide-borda ide-borda--dir" data-ide-borda="dir" role="tablist" aria-label="Janelas ocultas à direita" aria-orientation="vertical"></div>
  </div>
  <div class="ide-borda ide-borda--baixo" data-ide-borda="baixo" role="tablist" aria-label="Janelas ocultas em baixo"></div>
  <footer class="ide-estado" data-ide-estado${c.d.barraEstado ? '' : ' hidden'}></footer>
  <div class="ide-guias" data-ide-guias hidden></div>
  <div class="ide-fantasma" data-ide-fantasma hidden></div>
  <div class="ide-pop" data-ide-pop hidden></div>
  <div class="ide-dlg" data-ide-dlg hidden></div>
  <p class="ide-aviso" data-ide-aviso role="status" aria-live="polite"></p>
  <div class="ide-garagem" data-ide-garagem hidden></div>
</div>`;
}

/* =========================================================
   A árvore
   ========================================================= */
/** Um nó escondido (a barra lateral ou o painel fechados com Ctrl B / Ctrl J): não se desenha, e os outros ocupam o lugar. */
const escondido = (d: Disposicao, n: No): boolean => n.t === 'grupo' ? (d.escondidos ?? []).includes(n.id) : n.filhos.every((f) => escondido(d, f));
export function arvore(d: Disposicao, n: No): string {
  if (n.t === 'grupo') return grupo(d, n);
  const vis = n.filhos.map((f, i) => ({ f, i })).filter(({ f }) => !escondido(d, f));
  return `<div class="ide-div ide-div--${n.dir}" data-ide-div="${n.id}">${vis.map(({ f, i }, k) => `${k ? `<div class="ide-sep ide-sep--${n.dir}" role="separator" tabindex="0" aria-orientation="${n.dir === 'h' ? 'vertical' : 'horizontal'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(n.tam.slice(0, i).reduce((a, b) => a + b, 0) * 100)}" aria-label="Redimensionar" data-ide-sep="${n.id}:${i}" data-ide-sep-a="${vis[k - 1].i}"></div>` : ''}<div class="ide-no" style="flex:${n.tam[i].toFixed(5)} 1 0" data-ide-no="${f.id}">${arvore(d, f)}</div>`).join('')}</div>`;
}
/** Um grupo de separadores (na árvore ou numa janela flutuante). */
export function grupo(d: Disposicao, g: Grupo): string {
  const ferr = soFerramentas(d, g), fl = !!flutDe(d, g.id), ativo = d.grupo === g.id;
  const it = d.itens[g.ativo];
  const vazio = !g.itens.length;
  /* numa janela flutuante com uma só coisa, a barra da janela já diz o que é: o separador não se repete */
  const so = fl && g.itens.length === 1;
  const tabs = `<div class="ide-tabs${ferr ? ' ide-tabs--pe' : ''}" role="tablist" data-ide-tabs="${g.id}" aria-label="Separadores">${g.itens.map((i) => separador(d, g, i)).join('')}</div>`;
  /* as janelas de ferramenta, como no Visual Studio: o título em cima (arrasta-se por ele) e, se houver mais de uma, os separadores em baixo */
  return `<section class="ide-g${ferr ? ' is-ferr' : ''}${ativo ? ' is-ativo' : ''}${d.max === g.id ? ' is-max' : ''}${vazio ? ' is-vazio' : ''}" data-ide-grupo="${g.id}" aria-label="${esc(it?.titulo ?? 'Grupo vazio')}">
    <div class="ide-g-cab"${so ? ' hidden' : ''}>
      ${ferr ? `<div class="ide-g-tit" data-ide-tit="${esc(g.ativo)}" title="${esc(it?.titulo ?? '')} — arrasta para acoplar noutro sítio">${iconeItem(it)}<span>${esc(it?.titulo ?? '')}</span></div>` : tabs}
      <div class="ide-g-acoes">
        ${!ferr && !vazio && !fl ? `<button type="button" class="ide-g-b" data-ide-g-acao="dividir" title="Dividir à direita (Ctrl \\)">${L(columns2)}</button>` : ''}
        ${g.itens.length > 1 || !ferr ? `<button type="button" class="ide-g-b" data-ide-g-acao="lista" aria-haspopup="true" title="Separadores abertos (Ctrl K Ctrl P)">${L(chevronDown)}</button>` : ''}
        ${!ferr && !vazio ? `<button type="button" class="ide-g-b" data-ide-g-acao="mais" aria-haspopup="true" title="Mais ações">${L(ellipsis)}</button>` : ''}
        ${ferr && !fl ? `<button type="button" class="ide-g-b" data-ide-g-acao="ocultar" title="Ocultar automaticamente">${L(pin)}</button>` : ''}
        ${!fl && !vazio ? `<button type="button" class="ide-g-b" data-ide-g-acao="max" title="${d.max === g.id ? 'Restaurar' : 'Maximizar'} (duplo clique na barra)">${L(d.max === g.id ? minimize2 : maximize2)}</button>` : ''}
        ${ferr && !fl ? `<button type="button" class="ide-g-b" data-ide-g-acao="fechar" title="Fechar">${L(x)}</button>` : ''}
      </div>
    </div>
    <div class="ide-g-corpo" data-ide-corpo="${g.id}">${vazio ? vazioHtml() : ''}</div>
    ${ferr && g.itens.length > 1 ? `<div class="ide-g-pe">${tabs}</div>` : ''}
  </section>`;
}
const vazioHtml = () => `<div class="ide-vazio">${L(layoutTemplate)}<p><b>Sem documentos abertos</b>Abre um ecrã em Módulos, arrasta um separador para aqui ou aplica uma disposição.</p></div>`;
export function separador(d: Disposicao, g: Grupo, id: string): string {
  const it = d.itens[id]; if (!it) return '';
  const a = g.ativo === id;
  return `<div class="ide-tab${a ? ' is-ativo' : ''}${it.fixo ? ' is-fixo' : ''}${it.tipo === 'ferr' ? ' is-ferr' : ''}" role="tab" tabindex="${a ? 0 : -1}" aria-selected="${a}" data-ide-tab="${esc(id)}" title="${esc(it.titulo)}${it.chave ? '' : it.rota ? ` · ${esc(ROTAS[it.rota]?.titulo ?? '')}` : ''}">
    ${iconeItem(it)}<span class="ide-tab-t">${esc(it.titulo)}</span><i class="ide-tab-sujo" data-ide-sujo="${esc(id)}" hidden aria-label="Alterações por guardar"></i>${it.dividido ? `<span class="ide-tab-div" title="Documento dividido">${L(squareSplitVertical)}</span>` : ''}
    ${it.fixo ? `<button type="button" class="ide-tab-b" data-ide-tab-acao="desafixar" tabindex="-1" aria-label="Desafixar ${esc(it.titulo)}" title="Desafixar">${L(pin)}</button>` : `<button type="button" class="ide-tab-b" data-ide-tab-acao="fechar" tabindex="-1" aria-label="Fechar ${esc(it.titulo)}" title="Fechar (Alt W)">${L(x)}</button>`}
  </div>`;
}
export function flutuante(d: Disposicao, f: Flutuante, topo: boolean): string {
  const it = d.itens[f.grupo.ativo];
  return `<section class="ide-fj${topo ? ' is-foco' : ''}${f.max ? ' is-max' : ''}" data-ide-fj="${f.id}" role="dialog" aria-label="${esc(it?.titulo ?? '')}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;z-index:${10 + f.z * 2}">
    <header class="ide-fj-cab" data-ide-fj-arrastar>${iconeItem(it)}<b>${esc(it?.titulo ?? '')}</b>
      <button type="button" class="ide-g-b" data-ide-fj-acao="acoplar" title="Acoplar (volta ao sítio de onde saiu)">${L(panelLeft)}</button>
      <button type="button" class="ide-g-b" data-ide-fj-acao="max" title="${f.max ? 'Restaurar' : 'Maximizar na área'}">${L(f.max ? minimize2 : maximize2)}</button>
      <button type="button" class="ide-g-b" data-ide-fj-acao="fechar" title="Fechar">${L(x)}</button>
    </header>
    ${grupo(d, f.grupo)}
    ${(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const).map((k) => `<span class="ide-fj-r ide-fj-r--${k}" data-ide-fj-r="${k}" aria-hidden="true"></span>`).join('')}
  </section>`;
}
export function borda(d: Disposicao, lado: Exclude<Lado, 'cima'>, aberto: string): string {
  return d.ocultos.filter((o) => o.lado === lado).map((o) => { const it = d.itens[o.item]; return it ? `<button type="button" class="ide-borda-t${aberto === o.item ? ' is-aberto' : ''}" role="tab" aria-selected="${aberto === o.item}" data-ide-oculto="${esc(o.item)}">${iconeItem(it)}<span>${esc(it.titulo)}</span></button>` : ''; }).join('');
}
/** O painel que desliza da borda quando se escolhe uma janela oculta. */
export function gaveta(d: Disposicao, item: string, lado: string, tam: number): string {
  const it = d.itens[item];
  return `<section class="ide-gav ide-gav--${lado}" data-ide-gav="${esc(item)}" style="${lado === 'baixo' ? `height:${tam}px` : `width:${tam}px`}" role="complementary" aria-label="${esc(it?.titulo ?? '')}">
    <header class="ide-g-cab ide-gav-cab"><span class="ide-gav-t">${iconeItem(it)}<b>${esc(it?.titulo ?? '')}</b></span>
      <button type="button" class="ide-g-b" data-ide-gav-acao="afixar" title="Afixar (deixa de se ocultar)">${L(pinOff)}</button>
      <button type="button" class="ide-g-b" data-ide-gav-acao="fechar" title="Fechar">${L(x)}</button></header>
    <div class="ide-g-corpo" data-ide-gav-corpo></div>
    <span class="ide-gav-r" data-ide-gav-r aria-hidden="true"></span>
  </section>`;
}

/* =========================================================
   Menus (desenhados quando se abrem, com o estado do momento)
   ========================================================= */
export interface ItemMenu { cmd?: string; t?: string; tecla?: string; off?: boolean; marcado?: boolean; sep?: boolean; sub?: ItemMenu[]; titulo?: string; ic?: string }
export function menu(itens: ItemMenu[]): string {
  return `<div class="ide-menu" role="menu">${itens.map((m) => m.sep ? '<hr role="separator">' : m.titulo ? `<p class="ide-menu-tit">${esc(m.titulo)}</p>` : m.sub ? `<div class="ide-menu-sub"><button type="button" role="menuitem" aria-haspopup="true" class="ide-menu-i"${m.off ? ' disabled' : ''}><span class="ide-menu-ic">${m.ic ?? ''}</span><span>${esc(m.t!)}</span>${L(chevronRight, 'ide-seta')}</button>${menu(m.sub)}</div>` : `<button type="button" role="${m.marcado === undefined ? 'menuitem' : 'menuitemcheckbox'}"${m.marcado !== undefined ? ` aria-checked="${m.marcado}"` : ''} class="ide-menu-i" data-ide-cmd="${esc(m.cmd!)}"${m.off ? ' disabled' : ''}><span class="ide-menu-ic">${m.marcado ? L(check) : m.ic ?? ''}</span><span>${esc(m.t!)}</span>${m.tecla ? `<kbd>${esc(m.tecla)}</kbd>` : ''}</button>`).join('')}</div>`;
}

/* =========================================================
   A barra de estado
   ========================================================= */
export interface InfoEstado { ligado: boolean; perfil: IdPerfil; doc: string; sujos: number; carregar: number; disposicao: string; alterada: boolean; acorde?: string }
export function estado(s: InfoEstado): string {
  return `<span class="ide-e${s.ligado ? ' is-ok' : ' is-erro'}">${L(s.ligado ? wifi : wifiOff)}${s.ligado ? 'Ligado' : 'Sem ligação'}</span>
    <span class="ide-e ide-e-doc">${s.doc ? `${L(eye)}${esc(s.doc)}` : 'Nenhum documento ativo'}</span>
    ${s.acorde ? `<span class="ide-e is-acorde">(${esc(s.acorde)}) à espera da segunda tecla…</span>` : ''}
    ${s.sujos ? `<span class="ide-e is-aviso"><i class="ide-tab-sujo"></i>${s.sujos === 1 ? '1 documento com alterações por guardar' : `${s.sujos} documentos com alterações por guardar`}</span>` : ''}
    ${s.carregar ? `<span class="ide-e">${L(loader, 'ide-roda')}A abrir ${s.carregar === 1 ? '1 ecrã' : `${s.carregar} ecrãs`}…</span>` : ''}
    <button type="button" class="ide-e ide-e-fim ide-e-b" data-ide-cmd="menu-disposicoes" aria-haspopup="true" title="Disposições (Alt Shift D)">${L(layoutTemplate)}Disposição: <b data-ide-disp-nome>${esc(s.disposicao)}</b>${s.alterada ? ' · alterada' : ''}</button>`;
}

/* =========================================================
   A barra de atividade (como a do VS Code): um ícone por vista; carregar no ícone da vista que está aberta na barra
   lateral fecha a barra lateral; em baixo, a conta e Gerir
   ========================================================= */
export interface ItemAtv { f: IdFerr; titulo: string; tecla: string; ativo: boolean; aberto: boolean; badge: number }
export function atividade(xs: ItemAtv[], perfil: IdPerfil, teclaGerir: string): string {
  const p = PERFIS[perfil];
  const b = (x: ItemAtv) => `<button type="button" class="ide-atv-i${x.ativo ? ' is-ativo' : ''}${x.aberto ? ' is-aberto' : ''}" data-ide-atv-f="${x.f}" aria-pressed="${x.ativo}" title="${esc(x.titulo)}${x.tecla ? ` (${esc(x.tecla)})` : ''}" aria-label="${esc(x.titulo)}">${L(ICONE_FERR[x.f])}${x.badge ? `<span class="ide-atv-n">${x.badge > 99 ? '99+' : x.badge}</span>` : ''}</button>`;
  return `<div class="ide-atv-c">${xs.map(b).join('')}</div>
    <div class="ide-atv-c ide-atv-fim">
      <button type="button" class="ide-atv-i ide-atv-conta" data-ide-atv-menu="conta" aria-haspopup="true" title="${esc(p.pessoa)} · ${esc(p.cargo)}" aria-label="Conta: ${esc(p.pessoa)}"><span class="ide-inicial">${p.iniciais}</span></button>
      <button type="button" class="ide-atv-i" data-ide-atv-menu="gerir" aria-haspopup="true" title="Gerir${teclaGerir ? ` (${esc(teclaGerir)})` : ''}" aria-label="Gerir">${L(settings)}</button>
    </div>`;
}
/** A paleta (Ctrl P / Ctrl Shift P): ir para um ecrã ou separador; com «>» à frente, os comandos. */
export interface ItemPaleta { t: string; s?: string; tecla?: string; ic: string; grupo: string }
export function paleta(q: string, xs: ItemPaleta[], sel: number): string {
  let g = '';
  return `<div class="ide-pal" role="dialog" aria-label="Paleta">
    <label class="ide-pal-q">${L(search)}<input type="text" data-ide-pal-q value="${esc(q)}" placeholder="Escreve o nome de um ecrã ou separador; «>» para os comandos" aria-label="Procurar" autocomplete="off" spellcheck="false"></label>
    <div class="ide-pal-l" role="listbox" data-ide-pal-l>${xs.length ? xs.map((x, i) => { const cab = x.grupo !== g ? `<p class="ide-menu-tit">${esc(x.grupo)}</p>` : ''; g = x.grupo; return `${cab}<button type="button" role="option" aria-selected="${i === sel}" class="ide-menu-i${i === sel ? ' is-sel' : ''}" data-ide-pal-i="${i}"><span class="ide-menu-ic">${x.ic}</span><span>${esc(x.t)}${x.s ? ` <small>${esc(x.s)}</small>` : ''}</span>${x.tecla ? `<kbd>${esc(x.tecla)}</kbd>` : ''}</button>`; }).join('') : '<p class="ide-f-nada">Nada encontrado.</p>'}</div>
  </div>`;
}
export function dlgDefinicoes(tema: string, barraEstado: boolean, teclaAtalhos: string): string {
  const op = (v: string, t: string) => `<button type="button" class="ide-btn${tema === v ? ' is-sel' : ''}" aria-pressed="${tema === v}" data-ide-cmd="tema:${v}">${tema === v ? L(check) : ''}${t}</button>`;
  return `<div class="ide-dlg-c ide-dlg-c--p" role="dialog" aria-modal="true" aria-labelledby="ide-dlg-t">
    <header><h2 id="ide-dlg-t">${L(settings)}Definições</h2><button type="button" class="ide-g-b" data-ide-dlg-fechar aria-label="Fechar">${L(x)}</button></header>
    <p class="ide-x-t">Tema</p><div class="ide-def-l">${op('light', 'Claro')}${op('dark', 'Escuro')}${op('auto', 'Como o sistema')}</div>
    <p class="ide-x-t">Barra de estado</p><div class="ide-def-l"><button type="button" class="ide-btn${barraEstado ? ' is-sel' : ''}" aria-pressed="${barraEstado}" data-ide-cmd="barra-estado">${barraEstado ? L(check) : ''}${barraEstado ? 'À vista' : 'Escondida'}</button></div>
    <p class="ide-x-t">Teclado</p><div class="ide-def-l"><button type="button" class="ide-btn" data-ide-cmd="atalhos">${L(keyboard)}Atalhos de teclado${teclaAtalhos ? ` <kbd>${esc(teclaAtalhos)}</kbd>` : ''}</button></div>
  </div>`;
}

/* =========================================================
   As janelas de ferramenta
   ========================================================= */
export interface Fav { rota: string; titulo: string }
export interface DadosFerr { perfil: IdPerfil; ctx: Partial<Record<Contexto['tipo'], Contexto & { origem?: string }>>; ultimo?: Contexto['tipo']; favoritos: Fav[]; recentes: Fav[]; abertos: Set<string>; q: string; abertosExp: Record<string, boolean>; menu?: 'a-carregar' | 'falhou'; editores?: { id: string; titulo: string; rota?: string; ativo: boolean; sujo: boolean }[]; mensagens: { quando: string; tipo: 'info' | 'aviso' | 'erro'; t: string }[] }

/** A cabeça (desenhada uma vez, para o que se escreve não se perder) e o corpo (que se redesenha). */
export function cabFerr(f: IdFerr): string {
  if (f === 'explorador') return `<label class="ide-f-q">${L(search)}<input type="search" placeholder="Procurar nos módulos" aria-label="Procurar nos módulos" data-ide-f-q="explorador"></label>`;
  if (f === 'pesquisa') return `<label class="ide-f-q">${L(search)}<input type="search" placeholder="Ecrãs, artigos, fornecedores, encomendas" aria-label="Pesquisa global" data-ide-f-q="pesquisa"></label>`;
  if (f === 'propriedades' || f === 'stock' || f === 'relacionados' || f === 'historico') return `<div class="ide-f-seg" data-ide-f-seg></div>`;
  return '';
}
/** Inspetores: seguem a seleção ou ficam fixados num registo. */
export function segue(it: Item, alvo: Contexto | null): string {
  return `<span class="ide-f-alvo">${alvo ? `${L(alvo.tipo === 'artigo' ? packageIc : alvo.tipo === 'fornecedor' ? users : fileText)}<b>${esc(nomeCtx(alvo))}</b>` : '<span>Nada escolhido</span>'}</span>
    <button type="button" class="ide-f-pin${it.preso ? ' is-preso' : ''}" data-ide-f-pin aria-pressed="${!!it.preso}" ${alvo ? '' : 'disabled'} title="${it.preso ? 'Fixado neste registo: não muda com a seleção. Carrega para voltar a seguir a seleção.' : 'Segue a seleção. Carrega para fixar neste registo.'}">${L(it.preso ? pin : pinOff)}<span>${it.preso ? 'Fixado' : 'Segue a seleção'}</span></button>`;
}
export const nomeCtx = (c: Contexto) => c.tipo === 'artigo' ? `${c.chave} · ${artigo(c.chave)?.desc ?? ''}` : c.tipo === 'fornecedor' ? fornecedor(c.chave)?.nome ?? c.chave : c.chave;
const nada = (t: string) => `<p class="ide-f-nada">${t}</p>`;
const linha = (k: string, v: string) => `<div class="ide-f-l"><dt>${k}</dt><dd>${v}</dd></div>`;

/** Que contexto mostra cada inspetor: o fixado ou o da seleção (do tipo que ele sabe mostrar). */
export function alvoDe(it: Item, d: DadosFerr): Contexto | null {
  if (it.preso) return it.preso;
  const tipos: Contexto['tipo'][] = it.ferr === 'stock' ? ['artigo'] : it.ferr === 'historico' ? ['encomenda', 'artigo'] : ['artigo', 'encomenda', 'fornecedor'];
  if (d.ultimo && tipos.includes(d.ultimo) && d.ctx[d.ultimo]) return d.ctx[d.ultimo]!;
  for (const t of tipos) if (d.ctx[t]) return d.ctx[t]!;
  return null;
}

export function corpoFerr(it: Item, d: DadosFerr): string {
  switch (it.ferr) {
    case 'explorador': return explorador(d);
    case 'pesquisa': return pesquisa(d);
    case 'propriedades': return propriedades(alvoDe(it, d));
    case 'stock': return stockArm(alvoDe(it, d));
    case 'relacionados': return relacionados(alvoDe(it, d));
    case 'historico': return historico(alvoDe(it, d));
    case 'notificacoes': return notificacoes();
    case 'mensagens': return d.mensagens.length ? `<ol class="ide-f-msgs">${d.mensagens.map((m) => `<li class="is-${m.tipo}">${L(m.tipo === 'erro' ? circleAlert : info)}<time>${esc(m.quando)}</time><span>${esc(m.t)}</span></li>`).join('')}</ol>` : nada('Sem mensagens. Aqui aparece o que a área de trabalho fez por ti: disposições guardadas e repostas, ecrãs que não abriram, documentos que saíram por falta de permissão.');
    default: return '';
  }
}

/* ---------- Explorador ROMAFE (as linhas da navegação, como vêm da base) ---------- */
function explorador(d: DadosFerr): string {
  /* a navegação vem da API central: enquanto não chega, o esqueleto; se falhar, diz e deixa tentar outra vez (sem menu inventado) */
  if (d.menu === 'a-carregar') return `<div class="ide-x-esq" aria-busy="true" aria-label="A carregar o menu">${[70, 55, 62, 48, 66, 52, 58].map((w, i) => `<span style="width:${w}%;margin-left:${i ? 26 : 8}px"></span>`).join('')}</div>`;
  if (d.menu === 'falhou') return `<div class="ide-f-falha" role="alert">${L(circleAlert)}<b>O menu não carregou.</b><span>O servidor da navegação não respondeu. Os ecrãs abertos continuam a funcionar.</span><button type="button" class="ide-btn is-acao" data-ide-cmd="recarregar-menu">${L(refreshCw)}Tentar outra vez</button></div>`;
  const q = d.q.trim().toLowerCase();
  const passa = (t: string) => !q || t.toLowerCase().includes(q);
  const folha = (rota: string, titulo: string, ic: string, nivel: number) => {
    const fav = d.favoritos.some((f) => f.rota === rota);
    return `<div class="ide-x-f" style="--n:${nivel}"><button type="button" class="ide-x-i${d.abertos.has(rota) ? ' is-aberto' : ''}" data-ide-abrir="${esc(rota)}" data-ide-titulo="${esc(titulo)}" title="Abrir ${esc(titulo)} (duplo clique abre ao lado; arrasta para escolher onde)">${icone(ic)}<span>${esc(titulo)}</span></button><button type="button" class="ide-x-fav${fav ? ' is-fav' : ''}" data-ide-fav="${esc(rota)}" data-ide-titulo="${esc(titulo)}" aria-pressed="${fav}" aria-label="${fav ? 'Tirar dos favoritos' : 'Pôr nos favoritos'}">${L(star)}</button></div>`;
  };
  const ramo = (ns: NoNav[], nivel: number): string => ns.map((n) => {
    if (n.antigo) return '';
    if (n.filhos.length) {
      const dentro = ramo(n.filhos, nivel + 1); if (q && !dentro) return '';
      const aberto = q ? true : d.abertosExp[n.id] !== false;
      return `<div class="ide-x-g${aberto ? ' is-aberto' : ''}" style="--n:${nivel}"><button type="button" class="ide-x-gt" data-ide-exp-g="${esc(n.id)}" aria-expanded="${aberto}">${L(chevronRight, 'ide-x-seta')}${L(folder)}<span>${esc(n.rotulo)}</span></button><div class="ide-x-l"${aberto ? '' : ' hidden'}>${dentro}</div></div>`;
    }
    return n.rota && ROTAS[n.rota] && passa(n.rotulo) ? folha(n.rota, n.rotulo, n.icone || ROTAS[n.rota].icone, nivel) : '';
  }).join('');
  /* 23 out. (ela: «para já vamos manter só as compras»): no Explorador, como no menu lateral, só Compras */
  const arv = ramo(navegacao(d.perfil).filter((n) => n.id === 'compras'), 0);
  const favs = d.favoritos.filter((f) => ROTAS[f.rota] && passa(f.titulo));
  const recs = d.recentes.filter((f) => ROTAS[f.rota] && passa(f.titulo)).slice(0, 5);
  /* como no VS Code: os editores abertos em cima, com o ativo marcado, o ● das alterações e o × para fechar */
  const eds = (d.editores ?? []).filter((e) => passa(e.titulo));
  const abertosH = eds.length ? `<p class="ide-x-t">${L(fileText)}Editores abertos <small>${eds.length}</small></p>${eds.map((e) => `<div class="ide-x-f ide-x-ed${e.ativo ? ' is-ativo' : ''}" style="--n:0"><button type="button" class="ide-x-i" data-ide-ir="${esc(e.id)}">${icone(e.rota ? ROTAS[e.rota]?.icone ?? 'file-text' : 'file-text')}<span>${esc(e.titulo)}</span></button>${e.sujo ? '<i class="ide-tab-sujo" aria-label="Alterações por guardar"></i>' : ''}<button type="button" class="ide-x-fav ide-x-x" data-ide-fechar-item="${esc(e.id)}" aria-label="Fechar ${esc(e.titulo)}">${L(x)}</button></div>`).join('')}` : '';
  return `${abertosH}${favs.length ? `<p class="ide-x-t">${L(star)}Favoritos</p>${favs.map((f) => folha(f.rota, f.titulo, ROTAS[f.rota].icone, 0)).join('')}` : ''}
    ${recs.length ? `<p class="ide-x-t">${L(clock)}Abertos há pouco</p>${recs.map((f) => folha(f.rota, f.titulo, ROTAS[f.rota].icone, 0)).join('')}` : ''}
    <p class="ide-x-t">${L(folderTree)}Módulos</p>
    ${arv || nada(q ? `Nada nos módulos com «${esc(d.q)}».` : 'A tua conta ainda não tem módulos no ERP novo. Pede o acesso ao administrador; até lá, continua no ERP antigo.')}`;
}

/* ---------- Pesquisa global ---------- */
function pesquisa(d: DadosFerr): string {
  const q = d.q.trim().toLowerCase();
  if (q.length < 2) return nada('Escreve pelo menos duas letras. Procura nos ecrãs, artigos, fornecedores e encomendas a que tens acesso.');
  const tem = (...s: string[]) => s.some((t) => t.toLowerCase().includes(q));
  const ecras: [string, string][] = [];
  const andar = (ns: NoNav[]) => ns.forEach((n) => { if (n.rota && ROTAS[n.rota] && !n.antigo && tem(n.rotulo)) ecras.push([n.rota, n.rotulo]); andar(n.filhos); });
  andar(navegacao(d.perfil));
  /* os Ficheiros (Artigos…) não estão no Explorador, mas abrem-se daqui */
  Object.entries(ROTAS).filter(([k, r]) => k.startsWith('ficheiros.') && tem(r.titulo)).forEach(([k, r]) => ecras.push([k, r.titulo]));
  const arts = ARTIGOS.filter((a) => tem(a.ref, a.desc, a.marca)).slice(0, 8);
  const forns = FORNECEDORES.filter((f) => tem(f.nome, f.legal)).slice(0, 6);
  const encs = encomendas().filter((e) => tem(e.ref, fornecedor(e.forn)?.nome ?? '')).slice(0, 8);
  const sec = (t: string, xs: string[]) => xs.length ? `<p class="ide-x-t">${t} <small>${xs.length}</small></p>${xs.join('')}` : '';
  const r = sec('Ecrãs', ecras.map(([rota, t]) => `<button type="button" class="ide-p-i" data-ide-abrir="${esc(rota)}" data-ide-titulo="${esc(t)}">${icone(ROTAS[rota].icone)}<span>${esc(t)}</span><small>Abrir</small></button>`))
    + sec('Artigos', arts.map((a) => `<button type="button" class="ide-p-i" data-ide-ctx="artigo:${esc(a.ref)}">${L(packageIc)}<span><b class="ide-mono">${esc(a.ref)}</b> ${esc(a.desc)}</span><small>${esc(a.marca)}</small></button>`))
    + sec('Fornecedores', forns.map((f) => `<button type="button" class="ide-p-i" data-ide-ctx="fornecedor:${esc(f.id)}">${L(users)}<span>${esc(f.nome)}</span><small>${esc(f.cidade)}</small></button>`))
    + sec('Encomendas', encs.map((e) => `<button type="button" class="ide-p-i" data-ide-enc="${esc(e.ref)}">${L(fileText)}<span><b class="ide-mono">${esc(e.ref)}</b> ${esc(fornecedor(e.forn)?.nome ?? '')}</span><small>${esc(e.estado)}</small></button>`));
  return r || nada(`Nada com «${esc(d.q)}».`);
}

/* ---------- Propriedades ---------- */
function propriedades(c: Contexto | null): string {
  if (!c) return nada('Escolhe uma linha num documento (um artigo, uma encomenda, um fornecedor) para ver aqui as propriedades dela.');
  if (c.tipo === 'artigo') {
    const a = artigo(c.chave); if (!a) return nada('Este artigo já não existe.');
    return `<dl class="ide-f-dl">${linha('Referência', `<b class="ide-mono">${esc(a.ref)}</b>`)}${linha('Descrição', esc(a.desc))}${linha('Marca', esc(a.marca))}${linha('Unidade', esc(a.un))}${linha('Fornecedor', `<button type="button" class="ide-lk" data-ide-ctx="fornecedor:${esc(a.forn)}">${esc(fornecedor(a.forn)?.nome ?? a.forn)}</button>`)}${linha('Ref. do fornecedor', `<span class="ide-mono">${esc(a.refForn)}</span>`)}${linha('Último preço', a.preco === null ? '<span class="ide-f-off">Sem preço</span>' : euros(a.preco))}${linha('IVA', `${a.iva / 100} %`)}${linha('EAN', `<span class="ide-mono">${esc(a.ean)}</span>`)}${linha('Stock', `${stock(a.ref)} ${esc(a.un)}`)}</dl>`;
  }
  if (c.tipo === 'encomenda') {
    const e = encomenda(c.chave); if (!e) return nada('Esta encomenda já não existe.');
    const t = totais(e);
    return `<dl class="ide-f-dl">${linha('Número', `<b class="ide-mono">${esc(e.ref)}</b>`)}${linha('Fornecedor', `<button type="button" class="ide-lk" data-ide-ctx="fornecedor:${esc(e.forn)}">${esc(fornecedor(e.forn)?.nome ?? e.forn)}</button>`)}${linha('Estado', `<span class="ide-est${atrasada(e) ? ' is-atraso' : ''}">${esc(e.estado)}${atrasada(e) ? ' · atrasada' : ''}</span>`)}${linha('Data', dia(e.data))}${linha('Entrega prevista', dia(e.entrega))}${linha('Pagamento', esc(e.pagamento))}${linha('Linhas', String(e.linhas.length))}${linha('Total', `<b>${euros(t.total)}</b>${t.semPreco ? ` <span class="ide-f-off">· ${t.semPreco} sem preço</span>` : ''}`)}</dl>`;
  }
  const f = fornecedor(c.chave); if (!f) return nada('Este fornecedor já não existe.');
  return `<dl class="ide-f-dl">${linha('Nome', `<b>${esc(f.nome)}</b>`)}${linha('Designação legal', esc(f.legal))}${linha('NIF', `<span class="ide-mono">${esc(f.nif)}</span>`)}${linha('Morada', esc(f.morada))}${linha('Pagamento', esc(f.pagamento))}${linha('Prazo de entrega', `${f.prazo} dias`)}${linha('Entrega', esc(f.entrega))}${linha(esc(f.contacto.papel), `${esc(f.contacto.correio)}<br>${esc(f.contacto.telefone)}`)}</dl>`;
}

/* ---------- Stock por armazém ---------- */
function stockArm(c: Contexto | null): string {
  if (!c) return nada('Escolhe um artigo (na Lista de Faltas, nos Artigos, numa encomenda ou na Pesquisa) para ver o stock dele.');
  const a = artigo(c.chave); if (!a) return nada('Este artigo já não existe.');
  const s = stock(a.ref), cam = aCaminho(a.ref);
  const abertas = encomendas().filter((e) => ['Emitida', 'Parcialmente recebida', 'Aprovada', 'A aprovar'].includes(e.estado) && e.linhas.some((l) => l.ref === a.ref));
  return `<table class="ide-f-t"><thead><tr><th>Armazém</th><th class="is-num">Em stock</th><th class="is-num">A caminho</th><th class="is-num">Disponível previsto</th></tr></thead>
    <tbody><tr><td>${esc(ARMAZEM.split(' · ')[0])}</td><td class="is-num${s <= 0 ? ' is-rutura' : ''}">${s} ${esc(a.un)}</td><td class="is-num">${cam}</td><td class="is-num">${s + cam}</td></tr></tbody></table>
    ${abertas.length ? `<p class="ide-x-t">Encomendas abertas com este artigo <small>${abertas.length}</small></p>${abertas.map((e) => { const l = e.linhas.find((y) => y.ref === a.ref)!; return `<button type="button" class="ide-p-i" data-ide-enc="${esc(e.ref)}">${L(fileText)}<span><b class="ide-mono">${esc(e.ref)}</b> ${esc(fornecedor(e.forn)?.nome ?? '')}</span><small>${pendente(l)} por receber · ${esc(e.estado)}</small></button>`; }).join('')}` : nada('Nenhuma encomenda aberta com este artigo.')}`;
}

/* ---------- Documentos relacionados ---------- */
function relacionados(c: Contexto | null): string {
  if (!c) return nada('Escolhe um artigo, uma encomenda ou um fornecedor: aqui aparecem os documentos ligados a ele.');
  const enc = (e: ReturnType<typeof encomendas>[number], extra = '') => `<button type="button" class="ide-p-i" data-ide-enc="${esc(e.ref)}">${L(fileText)}<span><b class="ide-mono">${esc(e.ref)}</b> ${esc(fornecedor(e.forn)?.nome ?? '')}</span><small>${extra || esc(e.estado)}</small></button>`;
  if (c.tipo === 'encomenda') {
    const e = encomenda(c.chave); if (!e) return nada('Esta encomenda já não existe.');
    const recs = rececoesDe(e.ref);
    return `<p class="ide-x-t">Fornecedor</p><button type="button" class="ide-p-i" data-ide-ctx="fornecedor:${esc(e.forn)}">${L(users)}<span>${esc(fornecedor(e.forn)?.nome ?? e.forn)}</span><small>Ficha</small></button>
      <p class="ide-x-t">Receções <small>${recs.length}</small></p>${recs.length ? recs.map((r) => `<div class="ide-p-i is-so">${L(packageCheck)}<span><b class="ide-mono">${esc(r.ref)}</b> guia ${esc(r.guia)}</span><small>${dia(r.data)}${r.anulada ? ' · anulada' : ''}</small></div>`).join('') : nada('Ainda sem receções.')}
      <p class="ide-x-t">Artigos <small>${e.linhas.length}</small></p>${e.linhas.map((l) => `<button type="button" class="ide-p-i" data-ide-ctx="artigo:${esc(l.ref)}">${L(packageIc)}<span><b class="ide-mono">${esc(l.ref)}</b> ${esc(artigo(l.ref)?.desc ?? '')}</span><small>${l.qtd} · ${pendente(l)} por receber</small></button>`).join('')}`;
  }
  if (c.tipo === 'artigo') {
    const es = encomendas().filter((e) => e.linhas.some((l) => l.ref === c.chave)).slice(0, 12);
    return `<p class="ide-x-t">Encomendas com ${esc(c.chave)} <small>${es.length}</small></p>${es.length ? es.map((e) => enc(e)).join('') : nada('Nenhuma encomenda com este artigo.')}`;
  }
  const es = encomendas().filter((e) => e.forn === c.chave).slice(0, 12);
  return `<p class="ide-x-t">Encomendas a ${esc(fornecedor(c.chave)?.nome ?? c.chave)} <small>${es.length}</small></p>${es.length ? es.map((e) => enc(e, `${dia(e.data)} · ${esc(e.estado)}`)).join('') : nada('Nenhuma encomenda a este fornecedor.')}`;
}

/* ---------- Histórico ---------- */
function historico(c: Contexto | null): string {
  if (!c) return nada('Escolhe uma encomenda (o histórico do documento) ou um artigo (os movimentos de stock).');
  if (c.tipo === 'encomenda') {
    const e = encomenda(c.chave); if (!e) return nada('Esta encomenda já não existe.');
    return e.historico.length ? `<ol class="ide-f-hist">${e.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b><span>${esc(h.quem)}${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}</span></li>`).join('')}</ol>` : nada('Sem histórico.');
  }
  if (c.tipo === 'artigo') {
    const ms = db().mov.filter((m) => m.ref === c.chave).slice().reverse();
    return ms.length ? `<ol class="ide-f-hist">${ms.map((m) => `<li><time>${esc(m.quando)}</time><b>${m.qtd > 0 ? '+' : ''}${m.qtd}</b><span>${esc(m.origem)}</span></li>`).join('')}</ol>` : nada(`Sem movimentos de stock de ${esc(c.chave)} neste protótipo.`);
  }
  return nada('O histórico mostra encomendas e artigos.');
}

/* ---------- Notificações (só o que os dados dizem) ---------- */
function notificacoes(): string {
  const aprovar = encomendas().filter((e) => e.estado === 'A aprovar'), atraso = encomendas().filter(atrasada);
  const rut = ARTIGOS.filter((a) => stock(a.ref) <= 0);
  const it = (ic: string, t: string, xs: string) => `<div class="ide-n"><span class="ide-n-ic">${L(ic)}</span><div><b>${t}</b>${xs}</div></div>`;
  const r = [
    aprovar.length ? it(fileText, `${aprovar.length} ${aprovar.length === 1 ? 'encomenda por aprovar' : 'encomendas por aprovar'}`, aprovar.map((e) => `<button type="button" class="ide-lk" data-ide-enc="${esc(e.ref)}">${esc(e.ref)}</button>`).join(' ')) : '',
    atraso.length ? it(clock, `${atraso.length} ${atraso.length === 1 ? 'entrega atrasada' : 'entregas atrasadas'}`, atraso.map((e) => `<button type="button" class="ide-lk" data-ide-enc="${esc(e.ref)}">${esc(e.ref)}</button>`).join(' ')) : '',
    rut.length ? it(warehouse, `${rut.length} ${rut.length === 1 ? 'artigo sem stock' : 'artigos sem stock'}`, rut.map((a) => `<button type="button" class="ide-lk" data-ide-ctx="artigo:${esc(a.ref)}">${esc(a.ref)}</button>`).join(' ')) : '',
  ].join('');
  return r || nada('Nada a pedir atenção.');
}

/* =========================================================
   Diálogos
   ========================================================= */
export function dlgDisposicoes(nomes: string[], atual: string): string {
  return `<div class="ide-dlg-c" role="dialog" aria-modal="true" aria-labelledby="ide-dlg-t">
    <header><h2 id="ide-dlg-t">${L(layoutTemplate)}Disposições</h2><button type="button" class="ide-g-b" data-ide-dlg-fechar aria-label="Fechar">${L(x)}</button></header>
    <form class="ide-dlg-novo" data-ide-disp-form><label><span>Guardar a disposição atual como</span><input type="text" name="nome" maxlength="40" required placeholder="Ex.: Compras da manhã" value="${esc(atual === 'Padrão' ? '' : atual)}" data-ide-disp-nome-in></label><button type="submit" class="ide-btn is-acao">${L(save)}Guardar disposição</button></form>
    <p class="ide-x-t">As tuas disposições <small>${nomes.length}</small></p>
    ${nomes.length ? `<ul class="ide-disp-l">${nomes.map((n) => `<li${n === atual ? ' class="is-atual"' : ''}><b>${esc(n)}</b>${n === atual ? '<small>em uso</small>' : ''}<button type="button" class="ide-btn is-acao" data-ide-disp-aplicar="${esc(n)}">${L(check)}Aplicar</button><button type="button" class="ide-btn" data-ide-disp-duplicar="${esc(n)}">${L(copy)}Duplicar</button><button type="button" class="ide-btn is-perigo" data-ide-disp-eliminar="${esc(n)}">${L(trash2)}Eliminar</button></li>`).join('')}</ul>` : '<p class="ide-f-nada">Ainda não guardaste nenhuma. Arruma a área como te dá jeito e guarda-a aqui.</p>'}
    <p class="ide-x-t">Prontas</p>
    <ul class="ide-disp-l">${PRESETS.map((p) => `<li><b>${esc(p.nome)}</b><small>${esc(p.descricao)}</small><button type="button" class="ide-btn is-acao" data-ide-preset="${p.id}">${L(check)}Aplicar</button></li>`).join('')}</ul>
    <footer><button type="button" class="ide-btn" data-ide-cmd="repor">${L(rotateCcw)}Restaurar a padrão</button></footer>
  </div>`;
}
export function dlgFecharSujo(titulo: string, acao: 'fechar' | 'atualizar'): string {
  const f = acao === 'fechar';
  return `<div class="ide-dlg-c ide-dlg-c--p" role="alertdialog" aria-modal="true" aria-labelledby="ide-dlg-t" aria-describedby="ide-dlg-d">
    <header><h2 id="ide-dlg-t">${L(circleAlert)}${f ? 'Fechar' : 'Atualizar'} «${esc(titulo)}»?</h2></header>
    <p id="ide-dlg-d">Este documento tem alterações por guardar. Se o ${f ? 'fechares' : 'atualizares'} agora, perdem-se. Para as guardar, volta ao documento e usa Guardar.</p>
    <footer><button type="button" class="ide-btn" data-ide-dlg-fechar>${L(arrowLeft)}Voltar ao documento</button><button type="button" class="ide-btn is-perigo" data-ide-sujo-fechar>${L(f ? x : refreshCw)}${f ? 'Fechar' : 'Atualizar'} sem guardar</button></footer>
  </div>`;
}
export function dlgSessao(): string {
  return `<div class="ide-dlg-c ide-dlg-c--p" role="alertdialog" aria-modal="true" aria-labelledby="ide-dlg-t" aria-describedby="ide-dlg-d">
    <header><h2 id="ide-dlg-t">${L(circleAlert)}A sessão terminou</h2></header>
    <p id="ide-dlg-d">Por segurança, a sessão termina depois de algum tempo sem uso. A tua disposição fica guardada; o que estava por guardar nos documentos perde-se.</p>
    <footer><button type="button" class="ide-btn is-acao" data-ide-cmd="sair">${L(user)}Entrar outra vez</button></footer>
  </div>`;
}
export interface LinhaAtalho { id: string; t: string; tecla: string; grupo: string; navegador?: boolean }
export function dlgAtalhos(xs: LinhaAtalho[], legado: [string, string][], editar: string, erro: string): string {
  const grupos = [...new Set(xs.map((a) => a.grupo))];
  return `<div class="ide-dlg-c ide-dlg-c--l" role="dialog" aria-modal="true" aria-labelledby="ide-dlg-t">
    <header><h2 id="ide-dlg-t">${L(keyboard)}Atalhos de teclado</h2><button type="button" class="ide-g-b" data-ide-dlg-fechar aria-label="Fechar">${L(x)}</button></header>
    <p class="ide-dlg-nota">As da área de trabalho são as do VS Code (Ctrl no Windows e no Linux, ⌘ no Mac). As teclas do ERP antigo ganham sempre e não se trocam. «Ctrl K Ctrl W» quer dizer Ctrl K e depois Ctrl W. As marcadas «navegador» são do navegador: funcionam na aplicação instalada. Para trocar uma tecla, carrega em «Mudar» e prime a combinação nova (Esc cancela).</p>
    <div class="ide-at">
      <section><p class="ide-x-t">ERP antigo</p><dl>${legado.map(([t, k]) => `<div><dt>${esc(t)}</dt><dd><kbd>${esc(k)}</kbd></dd></div>`).join('')}</dl></section>
      ${grupos.map((g) => `<section><p class="ide-x-t">${esc(g)}</p><dl>${xs.filter((a) => a.grupo === g).map((a) => `<div${editar === a.id ? ' class="is-editar"' : ''}><dt>${esc(a.t)}${a.navegador ? ' <small class="ide-at-nav" title="No navegador, esta tecla é dele (fechar ou trocar de separador). Na aplicação instalada funciona; aqui usa a alternativa.">navegador</small>' : ''}</dt><dd>${editar === a.id ? '<kbd class="is-espera">Prime as teclas…</kbd>' : `<kbd>${esc(a.tecla)}</kbd>`}<button type="button" class="ide-btn is-p" data-ide-at-mudar="${a.id}">${L(pencil)}Mudar</button></dd></div>`).join('')}</dl></section>`).join('')}
    </div>
    ${erro ? `<p class="ide-dlg-erro" role="alert">${L(circleAlert)}${esc(erro)}</p>` : ''}
    <footer><button type="button" class="ide-btn" data-ide-at-repor>${L(rotateCcw)}Repor as teclas de origem</button></footer>
  </div>`;
}
/** A lista dos separadores (de um grupo ou de todos), com procura e os fechados há pouco. */
export function listaSeps(d: Disposicao, gid: string | null, q: string, fechados: Fav[]): string {
  const qq = q.trim().toLowerCase(), passa = (t: string) => !qq || t.toLowerCase().includes(qq);
  const gs = gid ? grupos(d).filter((g) => g.id === gid) : grupos(d);
  const abertos = gs.flatMap((g) => g.itens.map((i) => ({ g, it: d.itens[i] }))).filter((x) => x.it && passa(x.it.titulo));
  const fch = fechados.filter((f) => passa(f.titulo)).slice(0, 8);
  return `<div class="ide-menu ide-lista" role="dialog" aria-label="Separadores abertos">
    <label class="ide-f-q">${L(search)}<input type="search" placeholder="Procurar nos separadores" aria-label="Procurar nos separadores" data-ide-lista-q value="${esc(q)}"></label>
    <div class="ide-lista-l">
    ${abertos.length ? `<p class="ide-menu-tit">Abertos <small>${abertos.length}</small></p>${abertos.map(({ g, it }) => `<button type="button" class="ide-menu-i${g.ativo === it.id && d.ativo === it.id ? ' is-atual' : ''}" data-ide-ir="${esc(it.id)}"><span class="ide-menu-ic">${iconeItem(it)}</span><span>${esc(it.titulo)}</span>${it.fixo ? `<span class="ide-menu-ic">${L(pin)}</span>` : ''}<i class="ide-tab-sujo" data-ide-sujo="${esc(it.id)}" hidden></i></button>`).join('')}` : ''}
    ${fch.length ? `<p class="ide-menu-tit">Fechados há pouco</p>${fch.map((f, i) => `<button type="button" class="ide-menu-i" data-ide-reabrir="${i}"><span class="ide-menu-ic">${icone(ROTAS[f.rota]?.icone ?? 'file-text')}</span><span>${esc(f.titulo)}</span><kbd>Reabrir</kbd></button>`).join('')}` : ''}
    ${!abertos.length && !fch.length ? `<p class="ide-f-nada">Nenhum separador com «${esc(q)}».</p>` : ''}
    </div>
  </div>`;
}
