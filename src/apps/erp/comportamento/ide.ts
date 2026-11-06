/* =========================================================
   ERP — 05 · Início v3, o motor da área de trabalho como um IDE (6 nov. 2026). Ver ide/ecra.ts.
   - WorkspaceManager: o estado (a disposição, ide/modelo.ts) vive aqui; cada mudança da árvore redesenha a casca
     (grupos, separadores, bordas, janelas flutuantes) e volta a pôr cada ecrã no seu sítio.
   - Os documentos são iframes numa camada à parte (data-ide-camada) que NUNCA mudam de pai: só mudam de posição e de
     tamanho, por cima do «lugar» (data-ide-slot) que o grupo desenha. Mover, dividir, flutuar, maximizar ou aplicar uma
     disposição não recarrega nada — filtros, seleção, scroll, paginação e alterações por guardar ficam.
   - As janelas de ferramenta são nós do DOM que se movem de grupo para grupo (o que se escreveu e o scroll ficam).
   - Arrastar: um separador (ou um ecrã do Explorador, ou uma janela flutuante pela barra) mostra as guias no grupo
     por baixo do rato e nas bordas da área; a zona escolhida fica sombreada já; largar fora das guias põe a flutuar.
   - Contexto partilhado: um clique numa linha de um ecrã (artigo, encomenda, fornecedor) muda o contexto; os
     inspetores seguem-no, ou ficam fixados num registo.
   - Disposições guardadas neste computador por utilizador (erp:ide:<correio>), com versão do esquema; ao repor,
     revalida as rotas e as permissões. Nunca se guardam dados dos documentos.
   ========================================================= */
import { ROTAS, MENU_ERP, FICHA_PARA, rotaDoEcra, esc, L } from '../espaco';
import { navegacao, type NoNav } from '../navegacao';
import { perfilDaSessao, lerSessao } from '../sessao';
import { PERFIS, type IdPerfil } from '../inicio-dados';
import { ARTIGOS, artigo, encomenda, fornecedor, recarregar } from '../compras/dominio';
import { irIdentidade } from './abertura-v4';
import {
  ESQUEMA, FERRAMENTAS, PRESETS, preset, grupos, grupo as grupoPorId, grupoDe, flutDe, naArvore, visivel, soFerramentas, arrumar, tirar, porNoGrupo, dividir, acoplarBorda, validar, filtrar, copiar, novoId, idDoc, idFerr, itemFerr,
  type Disposicao, type Grupo, type Item, type IdFerr, type Lado, type Zona, type Contexto, type Flutuante, type Oculto,
} from '../ide/modelo';
import { disposicaoDoCenario } from '../ide/ecra';
import {
  arvore, flutuante, borda, gaveta, menu, estado as estadoHtml, cabFerr, corpoFerr, segue, alvoDe, dlgDisposicoes, dlgFecharSujo, dlgAtalhos, dlgSessao, dlgDefinicoes, listaSeps, iconeItem, atividade, paleta as paletaHtml, I,
  type ItemMenu, type DadosFerr, type Fav, type LinhaAtalho, type ItemPaleta,
} from '../ide/vista';

/* no editor, sem «Interagir», o ecrã fica parado (como as outras versões) */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MIN_W = 340, MIN_H = 140, MIN_FERR_W = 180;
/** Documentos que saíram da disposição sem ser fechados (outra disposição aplicada): o iframe fica escondido e volta
    intacto se a disposição seguinte o trouxer. Fechar um documento destrói-o. No máximo 10, o mais antigo sai primeiro. */
const ESTACIONADOS_MAX = 10;
const estacionados = new Map<string, number>(), destruir = new Set<string>();

/* =========================================================
   Estado
   ========================================================= */
let raiz: HTMLElement | null = null, area: HTMLElement | null = null, camada: HTMLElement | null = null;
let d: Disposicao = preset('padrao');
let cenario = 'normal', normal = false, persistir = true;
let perfil: IdPerfil = 'compras';
/** os iframes: chave = id do item (e «id#2» para a segunda vista de um documento dividido) */
const frames = new Map<string, HTMLIFrameElement>();
const nosFerr = new Map<string, HTMLElement>();
const sujos = new Set<string>(), aCarregar = new Set<string>();
let fechados: (Fav & { chave?: string; modo?: string })[] = [];
let nomeDisp = 'Padrão', alterada = false;
let gav = '';
let compacto = false;
let pendente: string | null = null;
/* os estados do ecrã (05.60…): sem rede, ecrãs que não chegam a abrir, ecrãs que falharam, vista simples à força */
let semRede = false, pararCargas = false, forcarCompacto = false;
const falhados = new Set<string>();
const dados: DadosFerr = { perfil: 'compras', ctx: {}, favoritos: [], recentes: [], abertos: new Set(), q: '', abertosExp: {}, mensagens: [] };
const qFerr: Record<string, string> = { explorador: '', pesquisa: '' };
interface Guardado { v: number; atual: Disposicao; nome: string; alterada: boolean; nomeadas: Record<string, Disposicao>; favoritos: Fav[]; recentes: Fav[]; teclas: Record<string, string>; exp: Record<string, boolean> }
let nomeadas: Record<string, Disposicao> = {};
let teclasUser: Record<string, string> = {};

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode | null = raiz) => r?.querySelector<T>(s) ?? null;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode | null = raiz) => [...(r?.querySelectorAll<T>(s) ?? [])];
const utilizador = () => lerSessao()?.correio ?? PERFIS[perfil].correio;
const CHAVE = () => `erp:ide:${utilizador()}`;
const hora = () => new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

function mensagem(t: string, tipo: 'info' | 'aviso' | 'erro' = 'info'): void {
  dados.mensagens.unshift({ quando: hora(), tipo, t }); dados.mensagens = dados.mensagens.slice(0, 40);
  pintarFerr(idFerr('mensagens'));
}
let avisoT = 0;
function dizer(t: string): void {
  const el = $('[data-ide-aviso]'); if (!el) return;
  el.textContent = t; el.classList.add('is-visivel'); window.clearTimeout(avisoT); avisoT = window.setTimeout(() => el.classList.remove('is-visivel'), 2600);
}

/* ---------- guardar ---------- */
let guardarT = 0;
function guardar(mudou = true): void {
  if (mudou) alterada = true;
  if (!persistir) return;
  window.clearTimeout(guardarT);
  guardarT = window.setTimeout(() => {
    const g: Guardado = { v: ESQUEMA, atual: d, nome: nomeDisp, alterada, nomeadas, favoritos: dados.favoritos, recentes: dados.recentes.slice(0, 12), teclas: teclasUser, exp: dados.abertosExp };
    try { localStorage.setItem(CHAVE(), JSON.stringify(g)); } catch { mensagem('Não foi possível guardar a disposição neste computador (armazenamento cheio ou bloqueado).', 'erro'); }
  }, 200);
}
/** Pode abrir-se? A rota tem de estar registada e o perfil tem de ter acesso (como no servidor). */
function podeAbrir(rota: string): boolean {
  const r = ROTAS[rota]; if (!r) return false;
  const l = MENU_ERP.find((x) => x.rota === rota);
  if (l && l.permissoes !== '*' && !l.permissoes.includes(perfil)) return false;
  const top = MENU_ERP.find((x) => x.id === 'compras');
  if (rota.startsWith('compras.') && top && top.permissoes !== '*' && !top.permissoes.includes(perfil)) return false;
  return !!document.querySelector(`.ecra[data-ecra="${CSS.escape(r.ecra)}"]`);
}
const podeItem = (i: Item) => i.tipo === 'ferr' ? !!(i.ferr && FERRAMENTAS[i.ferr]) : !!(i.rota && podeAbrir(i.rota));
function ler(): void {
  let g: Guardado | null = null;
  try { const s = localStorage.getItem(CHAVE()); g = s ? JSON.parse(s) as Guardado : null; } catch { g = null; }
  if (!g) { d = preset('padrao'); nomeDisp = 'Padrão'; alterada = false; return; }
  nomeadas = {};
  Object.entries(g.nomeadas ?? {}).forEach(([k, v]) => { const x = validar(v); if (x) nomeadas[k] = x; });
  dados.favoritos = Array.isArray(g.favoritos) ? g.favoritos.filter((f) => f && ROTAS[f.rota]) : [];
  dados.recentes = Array.isArray(g.recentes) ? g.recentes.filter((f) => f && ROTAS[f.rota]) : [];
  teclasUser = g.teclas && typeof g.teclas === 'object' ? g.teclas : {};
  dados.abertosExp = g.exp ?? {};
  const v = validar(g.atual);
  if (!v) { d = preset('padrao'); nomeDisp = 'Padrão'; alterada = false; mensagem('A disposição guardada não era válida (talvez de outra versão do ERP). Abrimos a disposição padrão.', 'aviso'); return; }
  d = v; nomeDisp = g.nome || 'Personalizado'; alterada = !!g.alterada;
  const fora = filtrar(d, podeItem);
  if (fora.length) mensagem(`Ao repor a disposição, ${fora.length === 1 ? 'saiu' : 'saíram'} ${fora.map((i) => `«${i.titulo}»`).join(', ')}: já não ${fora.length === 1 ? 'existe ou não tens acesso' : 'existem ou não tens acesso'}.`, 'aviso');
  if (!grupos(d).length) d = preset('padrao');
  mensagem(`Disposição «${nomeDisp}» reposta.`);
}

/* =========================================================
   Desenhar
   ========================================================= */
function desenhar(): void {
  if (!raiz || !area) return;
  arrumar(d);
  /* as ferramentas saem para a garagem antes de redesenhar (guardando o scroll) */
  const gar = $('[data-ide-garagem]')!;
  nosFerr.forEach((n) => { const c = n.querySelector<HTMLElement>('[data-ide-ferr-corpo]'); if (c && n.isConnected) n.dataset.scroll = String(c.scrollTop); gar.appendChild(n); });
  const arv = $('[data-ide-arvore]')!; arv.innerHTML = arvore(d, d.raiz);
  /* as janelas flutuantes nunca ficam fora da área (a janela do navegador pode ter encolhido) */
  const aw = area.clientWidth, ah = area.clientHeight;
  if (aw && ah) d.flut.forEach((f) => { f.w = Math.min(f.w, Math.max(300, aw - 16)); f.h = Math.min(f.h, Math.max(180, ah - 16)); f.x = limitar(f.x, 0, Math.max(0, aw - f.w)); f.y = limitar(f.y, 0, Math.max(0, ah - 40)); });
  const top = Math.max(0, ...d.flut.map((f) => f.z));
  $('[data-ide-flut]')!.innerHTML = d.flut.map((f) => flutuante(d, f, f.z === top)).join('');
  (['esq', 'dir', 'baixo'] as const).forEach((l) => { const b = $(`[data-ide-borda="${l}"]`)!; b.innerHTML = borda(d, l, gav); b.classList.toggle('is-vazia', !d.ocultos.some((o) => o.lado === l)); });
  area.classList.toggle('is-max', !!d.max || compacto);
  if (compacto && !d.max) $(`[data-ide-grupo="${d.grupo}"]`)?.classList.add('is-max');
  $('[data-ide-pequena]')!.hidden = !compacto;
  /* o lugar de cada coisa dentro dos grupos */
  grupos(d).forEach((g) => {
    const corpo = $(`[data-ide-corpo="${g.id}"]`); if (!corpo) return;
    const it = d.itens[g.ativo]; if (!it) return;
    if (it.tipo === 'ferr') corpo.appendChild(noFerr(it));
    else corpo.innerHTML = lugarDoc(it);
  });
  pintarGaveta();
  nosFerr.forEach((n) => { if (n.isConnected) { const c = n.querySelector<HTMLElement>('[data-ide-ferr-corpo]'); if (c) c.scrollTop = Number(n.dataset.scroll || 0); } });
  sujos.forEach((s) => $$(`[data-ide-sujo="${CSS.escape(s)}"]`).forEach((i) => { i.hidden = false; }));
  posicionar(); comandos(); barraEstado();
  dados.abertos = new Set(Object.values(d.itens).filter((i) => i.rota && grupoDe(d, i.id)).map((i) => i.rota!));
  dados.editores = grupos(d).flatMap((g) => g.itens).map((i) => d.itens[i]).filter((i) => i?.tipo === 'doc').map((i) => ({ id: i.id, titulo: i.titulo, rota: i.rota, ativo: i.id === d.ativo, sujo: sujos.has(i.id) }));
  pintarFerr(idFerr('explorador'));
  const n = $('[data-ide-disp-nome]'); if (n) n.textContent = nomeDisp;
  $('[data-ide-estado]')!.hidden = !d.barraEstado;
  $$('[data-ide-tabs]').forEach(tabsAVista);
}
/** O lugar de um documento: um só, ou dois (documento dividido) com a barra entre eles. */
function lugarDoc(it: Item): string {
  const k = esc(it.id);
  /* por baixo do ecrã: «A abrir…» enquanto carrega; e, se não abriu, o que aconteceu e como tentar outra vez */
  const fundo = (chave: string) => falhados.has(chave)
    ? `<div class="ide-slot-erro" role="alert">${L(I.circleAlert)}<b>Não foi possível abrir «${esc(it.titulo)}».</b><span>O ecrã não respondeu a tempo. O resto da área de trabalho continua a funcionar e nada se perdeu.</span><button type="button" class="ide-btn is-acao" data-ide-recarregar="${esc(chave)}">${L(I.refreshCw)}Tentar outra vez</button></div>`
    : `<div class="ide-slot-carga">${L(I.loader, 'ide-roda')}A abrir ${esc(it.titulo)}…</div>`;
  if (!it.dividido) return `<div class="ide-slot" data-ide-slot="${k}">${fundo(it.id)}</div>`;
  const { dir, frac } = it.dividido;
  return `<div class="ide-dv ide-dv--${dir}"><div class="ide-slot" data-ide-slot="${k}" style="flex:${frac} 1 0">${fundo(it.id)}</div><div class="ide-dv-sep" role="separator" tabindex="0" aria-label="Redimensionar as vistas" data-ide-dv-sep="${k}"></div><div class="ide-dv-b" style="flex:${1 - frac} 1 0"><p class="ide-dv-rot">${L(I.eye)}Vista 2 · só leitura — mostra o que está gravado<button type="button" class="ide-lk" data-ide-dv-juntar="${k}">Juntar as vistas</button></p><div class="ide-slot" data-ide-slot="${k}#2">${fundo(`${it.id}#2`)}</div></div></div>`;
}
/** O separador ativo fica à vista na barra (rola-se com a roda do rato). */
function tabsAVista(t: HTMLElement): void {
  const a = t.querySelector<HTMLElement>('.ide-tab.is-ativo'); if (!a) return;
  if (a.offsetLeft < t.scrollLeft) t.scrollLeft = a.offsetLeft - 4;
  else if (a.offsetLeft + a.offsetWidth > t.scrollLeft + t.clientWidth) t.scrollLeft = a.offsetLeft + a.offsetWidth - t.clientWidth + 4;
  t.classList.toggle('is-transborda', t.scrollWidth > t.clientWidth + 1);
}

/* ---------- os iframes: criar quando ficam à vista, nunca mudar de pai ---------- */
function endereco(it: Item, segunda = false): string {
  const r = ROTAS[it.rota!];
  return `${location.pathname}?separador=1#so=ecra&ecra=${encodeURIComponent(r.ecra)}${it.modo ? `&modo=${encodeURIComponent(it.modo)}` : ''}${it.chave ? `&doc=${encodeURIComponent(it.chave)}` : ''}${segunda ? '&vista=2' : ''}`;
}
function posicionar(): void {
  if (!area || !camada || !normal) return;
  const ra = area.getBoundingClientRect();
  const vivos = new Set<string>();
  Object.values(d.itens).forEach((it) => { if (it.tipo === 'doc' && grupoDe(d, it.id)) { vivos.add(it.id); if (it.dividido) vivos.add(`${it.id}#2`); } });
  frames.forEach((f, k) => {
    if (vivos.has(k)) { estacionados.delete(k); return; }
    if (destruir.has(k.split('#')[0]) || k.endsWith('#2')) { f.remove(); frames.delete(k); aCarregar.delete(k); sujos.delete(k); estacionados.delete(k); return; }
    if (!estacionados.has(k)) { estacionados.set(k, Date.now()); f.style.visibility = 'hidden'; f.tabIndex = -1; }
  });
  destruir.clear();
  if (estacionados.size > ESTACIONADOS_MAX) [...estacionados.entries()].sort((a, b) => a[1] - b[1]).slice(0, estacionados.size - ESTACIONADOS_MAX).forEach(([k]) => { frames.get(k)?.remove(); frames.delete(k); estacionados.delete(k); });
  vivos.forEach((k) => {
    const slot = area!.querySelector<HTMLElement>(`[data-ide-slot="${CSS.escape(k)}"]`);
    let f = frames.get(k);
    if (!slot) { if (f) { f.style.visibility = 'hidden'; f.tabIndex = -1; } return; }
    if (!f) { if (pararCargas || falhados.has(k)) return; f = criarFrame(k); }
    const r = slot.getBoundingClientRect();
    const fj = slot.closest<HTMLElement>('[data-ide-fj]'), noMax = slot.closest('.ide-g.is-max');
    const escondido = area!.classList.contains('is-max') && !fj && !noMax;
    const z = fj ? Number(fj.style.zIndex || 10) + 1 : noMax ? 3 : 1;
    Object.assign(f.style, { left: `${r.left - ra.left}px`, top: `${r.top - ra.top}px`, width: `${Math.max(0, r.width)}px`, height: `${Math.max(0, r.height)}px`, visibility: r.width > 2 && r.height > 2 && !escondido && !aCarregar.has(k) ? 'visible' : 'hidden', zIndex: String(z) });
    f.removeAttribute('tabindex');
    tamanhoDoEcra(f, r.width, r.height);
  });
}
/** A classe do tamanho dentro do ecrã (o CSS de COMPACTO decide o que sai). */
function tamanhoDoEcra(f: HTMLIFrameElement, w = f.getBoundingClientRect().width, h = f.getBoundingClientRect().height): void {
  try {
    const html = f.contentDocument?.documentElement; if (!html || !w) return;
    html.classList.toggle('ide-pequeno', w < 860 || h < 560);
    html.classList.toggle('ide-mini', w < 600 || h < 420);
  } catch { /* outra origem */ }
}
let posT = 0;
const posicionarJa = () => { cancelAnimationFrame(posT); posT = requestAnimationFrame(posicionar); };

function criarFrame(k: string): HTMLIFrameElement {
  const [id, n2] = k.split('#'), it = d.itens[id], segunda = n2 === '2';
  const f = document.createElement('iframe');
  f.className = `ide-frame${segunda ? ' is-espelho' : ''}`; f.title = segunda ? `${it.titulo} (vista 2, só leitura)` : it.titulo; f.dataset.ideFrame = k;
  f.src = endereco(it, segunda);
  aCarregar.add(k); barraEstado();
  /* 20 s sem abrir: desiste, diz porquê e deixa tentar outra vez (o resto da área continua) */
  const falhou = window.setTimeout(() => {
    if (!aCarregar.has(k)) return;
    aCarregar.delete(k); f.remove(); frames.delete(k); falhados.add(k);
    mensagem(`«${it.titulo}» não abriu: o ecrã não respondeu em 20 segundos.`, 'erro'); desenhar();
  }, 20000);
  f.addEventListener('load', () => {
    window.clearTimeout(falhou); aCarregar.delete(k); barraEstado(); posicionarJa();
    try { ganchos(f, id, segunda); } catch { mensagem(`Não foi possível ligar «${it.titulo}» à área de trabalho.`, 'erro'); }
    if (id === d.ativo && !segunda) comandos();
  });
  camada!.appendChild(f); frames.set(k, f);
  return f;
}
/** Os ganchos dentro de cada ecrã: quem tem o foco, a seleção (o contexto), o que está por guardar e as teclas. */
function ganchos(f: HTMLIFrameElement, id: string, segunda: boolean): void {
  const w = f.contentWindow!, doc = f.contentDocument!;
  let t = 'auto'; try { t = localStorage.getItem('uiux:tema') || 'auto'; } catch { /* */ }
  if (t === 'auto') doc.documentElement.removeAttribute('data-theme'); else doc.documentElement.setAttribute('data-theme', t);
  if (!doc.getElementById('ide-compacto')) { const st = doc.createElement('style'); st.id = 'ide-compacto'; st.textContent = COMPACTO; doc.head.appendChild(st); }
  tamanhoDoEcra(f);
  doc.addEventListener('pointerdown', () => { fecharPop(); if (gav) fecharGaveta(); if (d.ativo !== id) ativar(id, false); }, true);
  /* o foco que a página põe sozinha ao abrir (a procura das listas) não muda o documento ativo */
  const t0 = performance.now();
  doc.addEventListener('focusin', () => { if (d.ativo === id) return; if (performance.now() - t0 < 2500) { (doc.activeElement as HTMLElement | null)?.blur(); return; } ativar(id, false); });
  const verSel = (alvo: Element | null) => { const c = alvo && registo(alvo); if (c) mudarContexto(c, id); };
  doc.addEventListener('click', (ev) => { verSel(ev.target as Element); window.setTimeout(comandos, 60); }, true);
  /* os pedidos que os ecrãs fazem à área de trabalho: abrir um documento num separador («Abrir» na Lista de Faltas) e
     as janelas de contexto (o stock de um artigo, um fornecedor), que aqui são as janelas de ferramenta */
  doc.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const pd = t.closest<HTMLElement>('[data-dk-doc]');
    if (pd) {
      let rota = pd.dataset.dkDoc!; const tit = pd.dataset.dkTitulo, ecra = ROTAS[rota]?.ecra;
      if (ecra && FICHA_PARA[ecra] && !document.querySelector(`.ecra[data-ecra="${CSS.escape(ecra)}"]`)) rota = rotaDoEcra(FICHA_PARA[ecra]) ?? rota;
      abrirDoc(rota, { titulo: tit, chave: tit && /\d{4}\/\d+/.test(tit) ? tit : undefined });
      return;
    }
    const pj = t.closest<HTMLElement>('[data-dk-janela]');
    if (pj) { const [tipo, ...ch] = pj.dataset.dkJanela!.split(':'); const forn = tipo === 'fornecedor'; mudarContexto({ tipo: forn ? 'fornecedor' : 'artigo', chave: ch.join(':') }, id); verFerr(forn ? 'propriedades' : 'stock'); }
  });
  doc.addEventListener('keyup', (ev) => { if (/^Arrow|^Page|^Home|^End/.test(ev.key)) verSel(doc.activeElement); });
  if (segunda) { espelho(doc, w); return; }
  doc.addEventListener('input', (ev) => {
    const el = ev.target as HTMLElement;
    if (el.closest('form, .cp, [data-cp], [role="dialog"], .dv2-jan, [data-dv2-ficha]') && !el.closest('.lf-filtros, [type="search"]') && !(el as HTMLInputElement).type?.match(/search|checkbox/)) { if (!sujos.has(id)) { sujos.add(id); desenharSujos(); } }
  }, true);
  w.addEventListener('keydown', (ev) => {
    /* as teclas que a página declara como suas (F2, F6, Alt+1…) ficam para ela; Ctrl F6 não é F6 */
    const k = ev.ctrlKey || ev.altKey || ev.metaKey ? combinacao(ev) : ev.key;
    const declaradas = !!k && doc.querySelector(`.ecra:not([hidden]) [data-teclas~="${CSS.escape(k)}"]`);
    /* F5 sem dono recarregava o iframe e perdia-se tudo: aqui é «Novo» */
    if (ev.key === 'F5' && !declaradas) { ev.preventDefault(); comando('novo'); return; }
    if (declaradas) return;
    if (atalho(ev)) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);
}
/* 6 nov. (ela: «os ecrãs terão de ficar mais simples quando estão assim»): numa divisão estreita, o ecrã simplifica-se.
   Pequeno (menos de 860 × 560): sem subtítulo nem ícone no cabeçalho, sem as teclas escritas nos botões, sem resumos
   nem rodapé de estado (a barra de estado da área de trabalho já diz o essencial), filtros mais juntos.
   Mini (menos de 600 × 420): também sem o cabeçalho (o nome está no separador) e dos filtros fica só a procura.
   As ações ficam todas: só sai o que repete ou explica. */
const COMPACTO = `
html.ide-pequeno :is(.ak-cab, .fx-cab) { padding-top: 8px !important; padding-bottom: 8px !important; min-height: 0 !important; gap: 8px !important; }
html.ide-pequeno :is(.ak-cab, .fx-cab) :is(p, .fx-sub), html.ide-pequeno :is(.ak-cab-ic, .fx-ic) { display: none !important; }
html.ide-pequeno :is(.ak-cab, .fx-cab) h1 { font-size: 17px !important; }
html.ide-pequeno .ak-barra { min-height: 0 !important; padding-top: 3px !important; padding-bottom: 3px !important; }
html.ide-pequeno .ak-btn kbd, html.ide-pequeno .ak-btn:not(.ak-btn--acao) > span { display: none !important; }
html.ide-pequeno :is(.lf-filtros, .lf2-filtros, .dv2-filtros, .fx-filtros) { padding-top: 6px !important; padding-bottom: 6px !important; margin-top: 4px !important; margin-bottom: 4px !important; }
html.ide-pequeno :is(.lf2-rapidos, .dv2-rapidos, .dv2c-linha) { gap: 6px !important; }
html.ide-pequeno .ak-campo > span:first-child { font-size: 11px !important; }
html.ide-pequeno :is(.ak-estado, .lf2-estado, .lf2-resumo, .hm-aviso) { display: none !important; }
html.ide-pequeno :is(.lf2-lista-cab) { min-height: 0 !important; padding-top: 6px !important; padding-bottom: 6px !important; }
html.ide-mini :is(.ak-cab, .fx-cab) { display: none !important; }
html.ide-mini :is(.lf2-filtros, .dv2-filtros) :is(label.ak-campo, .ak-campo):not(:has(input[type="search"])):not(.lf2-pesquisa):not(.dv2c-pq) { display: none !important; }
html.ide-mini :is(.lf2-mais-f, .ak-sep, .ak-menu-c > .ak-btn:not(.ak-btn--acao) > span) { display: none !important; }
html.ide-mini .lf2-lista-cab { display: none !important; }
`;
/** A segunda vista de um documento dividido: só de leitura. Rola, muda de vista e escolhe linhas; não escreve nem grava. */
function espelho(doc: Document, w: Window): void {
  doc.documentElement.classList.add('ide-espelho');
  const st = doc.createElement('style');
  st.textContent = 'input:not([type="search"]), select, textarea { pointer-events: none !important; opacity: .75; }';
  doc.head.appendChild(st);
  const navegar = (el: HTMLElement) => ['tab', 'radio'].includes(el.getAttribute('role') ?? '') || Object.keys(el.dataset).some((k) => /vista|tab|janacao|modo/i.test(k));
  doc.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('button, [role="button"], a[href], input[type="checkbox"]');
    if (b && !navegar(b)) { ev.preventDefault(); ev.stopImmediatePropagation(); dizer('A vista 2 é só de leitura: as alterações fazem-se na vista de cima.'); }
  }, true);
  w.addEventListener('keydown', (ev) => { const t = ev.target as HTMLElement; if (t.matches('input:not([type="search"]), textarea, select') || /^F\d+$/.test(ev.key)) { if (!/^(Tab|Arrow.*|Page.*|Home|End|Escape)$/.test(ev.key)) { ev.preventDefault(); ev.stopImmediatePropagation(); } } }, true);
}
function desenharSujos(): void {
  $$('[data-ide-sujo]').forEach((i) => { i.hidden = !sujos.has(i.dataset.ideSujo!); });
  barraEstado(); guardar(false);
}

/* ---------- o contexto: que registo está escolhido ---------- */
const RE_ENC = /^E[A-Z] \d{4}\/\d{4}$/;
function registo(el: Element): Contexto | null {
  for (let e: Element | null = el; e && e.tagName !== 'BODY'; e = e.parentElement) {
    for (const a of Array.from(e.attributes)) {
      if (!a.name.startsWith('data-')) continue;
      const v = a.value.trim().split('|')[0];
      if (artigo(v)) return { tipo: 'artigo', chave: v };
      if (RE_ENC.test(v) && encomenda(v)) return { tipo: 'encomenda', chave: v };
      if (/forn/.test(a.name) && fornecedor(v)) return { tipo: 'fornecedor', chave: v };
    }
    if (e.tagName === 'TR') {
      const textos = [...e.querySelectorAll('td, td > *')].map((c) => (c.textContent ?? '').trim());
      const a = ARTIGOS.find((x) => textos.includes(x.ref)); if (a) return { tipo: 'artigo', chave: a.ref };
      const n = textos.find((t) => RE_ENC.test(t) && encomenda(t)); if (n) return { tipo: 'encomenda', chave: n };
      return null;
    }
  }
  return null;
}
function mudarContexto(c: Contexto, origem?: string): void {
  const ja = dados.ctx[c.tipo];
  dados.ultimo = c.tipo;
  if (ja && ja.chave === c.chave) return;
  dados.ctx[c.tipo] = { ...c, origem };
  ['propriedades', 'stock', 'relacionados', 'historico'].forEach((f) => pintarFerr(idFerr(f as IdFerr)));
}

/* ---------- as janelas de ferramenta ---------- */
function noFerr(it: Item): HTMLElement {
  let n = nosFerr.get(it.id);
  if (!n) {
    n = document.createElement('div'); n.className = `ide-ferr ide-ferr--${it.ferr}`; n.dataset.ideFerr = it.id;
    n.innerHTML = `${cabFerr(it.ferr!)}<div class="ide-ferr-corpo" data-ide-ferr-corpo></div>`;
    nosFerr.set(it.id, n);
    const q = n.querySelector<HTMLInputElement>('[data-ide-f-q]'); if (q) q.value = qFerr[it.ferr!] ?? '';
  }
  pintarFerr(it.id, n);
  return n;
}
function pintarFerr(id: string, n = nosFerr.get(id)): void {
  const it = d.itens[id]; if (!n || !it) return;
  const dd = { ...dados, q: qFerr[it.ferr!] ?? '' };
  const seg = n.querySelector<HTMLElement>('[data-ide-f-seg]'); if (seg) seg.innerHTML = segue(it, alvoDe(it, dd));
  const c = n.querySelector<HTMLElement>('[data-ide-ferr-corpo]'); if (c) c.innerHTML = corpoFerr(it, dd);
}
const pintarFerrs = () => Object.values(d.itens).filter((i) => i.tipo === 'ferr').forEach((i) => pintarFerr(i.id));

/* =========================================================
   Abrir, ativar, fechar
   ========================================================= */
/** O grupo onde abrem os documentos: o ativo, se tiver documentos; senão o último que teve; senão um que os tenha;
    senão o grupo vazio; senão uma divisão nova à direita da área. */
let ultimoGrupoDoc = '';
function grupoDocs(evitar?: string): string {
  const temDoc = (g: Grupo | null) => !!g && (g.itens.length === 0 || g.itens.some((i) => d.itens[i]?.tipo === 'doc'));
  const cands = [d.grupo, ultimoGrupoDoc, ...grupos(d).filter((g) => naArvore(d, g.id)).map((g) => g.id)];
  for (const id of cands) { const g = grupoPorId(d, id); if (g && temDoc(g) && g.id !== evitar && naArvore(d, g.id)) return g.id; }
  if (evitar) { const g = grupoPorId(d, evitar); if (g && temDoc(g)) return evitar; }
  return '';
}
function abrirDoc(rota: string, o: { titulo?: string; chave?: string; grupo?: string; lado?: Lado; evitar?: string; modo?: string } = {}): string {
  let modo = o.modo ?? ROTAS[rota]?.modo; if (ROTAS[rota]?.alias) rota = ROTAS[rota].alias!;
  const r = ROTAS[rota];
  if (!r) { dizer(`«${o.titulo ?? rota}» ainda não existe no ERP novo. Continua no ERP antigo.`); mensagem(`Pedido para abrir «${o.titulo ?? rota}», que ainda não existe no ERP novo: não abriu.`, 'aviso'); return ''; }
  if (!podeAbrir(rota)) { const t = o.titulo ?? r.titulo; dizer(`A tua conta não tem acesso a «${t}».`); mensagem(`Sem acesso a «${t}»: não abriu.`, 'aviso'); return ''; }
  const id = idDoc(rota, o.chave);
  dados.recentes = [{ rota, titulo: o.titulo ?? r.titulo }, ...dados.recentes.filter((x) => !(x.rota === rota && x.titulo === (o.titulo ?? r.titulo)))].slice(0, 12);
  if (grupoDe(d, id)) {
    ativar(id);
    if (modo) frames.get(id)?.contentWindow?.postMessage({ romafe: 'cf-modo', modo }, '*');
    return id;
  }
  const it: Item = { id, tipo: 'doc', rota, titulo: o.titulo ?? (o.chave ?? r.titulo), ...(o.chave ? { chave: o.chave } : {}), ...(modo ? { modo } : {}) };
  d.itens[id] = it;
  if (o.lado) { const alvo = o.grupo ?? d.grupo; if (grupoPorId(d, alvo) && naArvore(d, alvo)) dividir(d, alvo, o.lado, id); else acoplarBorda(d, o.lado, id, .5); }
  else {
    const g = o.grupo ?? grupoDocs(o.evitar);
    if (g) porNoGrupo(d, id, g); else acoplarBorda(d, 'dir', id, .72);
  }
  d.ativo = id; d.grupo = grupoDe(d, id)!.id; ultimoGrupoDoc = d.grupo;
  desenhar(); guardar();
  return id;
}
function ativar(id: string, foco = true): void {
  const g = grupoDe(d, id);
  if (!g) { const o = d.ocultos.find((x) => x.item === id); if (o) abrirGaveta(id); return; }
  if ((d.escondidos ?? []).includes(g.id)) { d.escondidos = d.escondidos!.filter((x) => x !== g.id); g.ativo = id; d.ativo = id; d.grupo = g.id; desenhar(); guardar(); return; }
  const mudouGrupo = g.ativo !== id;
  g.ativo = id; d.ativo = id; d.grupo = g.id;
  if (d.itens[id]?.tipo === 'doc') ultimoGrupoDoc = g.id;
  const f = flutDe(d, g.id); if (f) f.z = Math.max(0, ...d.flut.map((x) => x.z)) + 1;
  if (mudouGrupo || f) desenhar();
  else { $$('.ide-g.is-ativo').forEach((x) => x.classList.toggle('is-ativo', x.dataset.ideGrupo === g.id)); $(`[data-ide-grupo="${g.id}"]`)?.classList.add('is-ativo'); comandos(); barraEstado(); }
  guardar(mudouGrupo);
  if (foco) { const fr = frames.get(id); if (fr) fr.focus({ preventScroll: true }); else $<HTMLElement>(`[data-ide-tab="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }); }
}
let pedidoFechar: { id: string; acao: 'fechar' | 'atualizar'; depois?: () => void } | null = null;
function fechar(id: string, forcar = false, depois?: () => void): void {
  const it = d.itens[id]; if (!it) return;
  if (sujos.has(id) && !forcar) { pedidoFechar = { id, acao: 'fechar', depois }; abrirDlg(dlgFecharSujo(it.titulo, 'fechar')); return; }
  if (it.tipo === 'doc') fechados = [{ rota: it.rota!, titulo: it.titulo, chave: it.chave, modo: it.modo }, ...fechados.filter((x) => !(x.rota === it.rota && x.chave === it.chave))].slice(0, 10);
  const g = grupoDe(d, id);
  tirar(d, id); d.ocultos = d.ocultos.filter((o) => o.item !== id);
  if (gav === id) gav = '';
  if (it.tipo === 'doc') { delete d.itens[id]; destruir.add(id); }
  sujos.delete(id);
  if (d.ativo === id) { d.ativo = g?.ativo || grupos(d).find((x) => x.ativo)?.ativo || ''; if (g) d.grupo = g.id; }
  desenhar(); guardar(); depois?.();
}
/** Fechar vários, um de cada vez (os que têm alterações perguntam). */
function fecharVarios(ids: string[]): void { const [p, ...resto] = ids; if (!p) return; fechar(p, false, () => fecharVarios(resto)); }
function reabrir(i = 0): void { const f = fechados[i]; if (!f) { dizer('Não há separadores fechados há pouco.'); return; } fechados.splice(i, 1); abrirDoc(f.rota, { titulo: f.titulo, chave: f.chave, modo: f.modo }); }

/* ---------- ferramentas: ver, esconder, ocultar na borda ---------- */
const aberta = (f: IdFerr) => !!grupoDe(d, idFerr(f)) || d.ocultos.some((o) => o.item === idFerr(f));
function verFerr(f: IdFerr, alternar = false): void {
  const id = idFerr(f);
  if (!d.itens[id]) d.itens[id] = itemFerr(f);
  const it = d.itens[id];
  if (d.ocultos.some((o) => o.item === id)) { if (alternar && gav === id) { fecharGaveta(); return; } abrirGaveta(id); return; }
  const g = grupoDe(d, id);
  if (g) { if (alternar && visivel(d, id)) { fechar(id); return; } ativar(id); return; }
  const v = it.volta;
  if (v?.grupo && grupoPorId(d, v.grupo) && naArvore(d, v.grupo)) porNoGrupo(d, id, v.grupo);
  else {
    /* junta-se a outra ferramenta do mesmo lado, se houver; senão acopla-se à borda */
    const lado = FERRAMENTAS[f].lado;
    const vizinho = grupos(d).find((x) => naArvore(d, x.id) && soFerramentas(d, x) && x.itens.some((i) => d.itens[i]?.ferr && FERRAMENTAS[d.itens[i].ferr!].lado === lado));
    if (vizinho) porNoGrupo(d, id, vizinho.id); else acoplarBorda(d, lado, id, lado === 'baixo' ? .28 : .2);
  }
  d.ativo = id; d.grupo = grupoDe(d, id)!.id;
  desenhar(); guardar();
}
function ocultarGrupo(gid: string): void {
  const g = grupoPorId(d, gid), el = $(`[data-ide-grupo="${gid}"]`); if (!g || !el || !area) return;
  const r = el.getBoundingClientRect(), ra = area.getBoundingClientRect();
  const dist = { esq: r.left - ra.left, dir: ra.right - r.right, baixo: ra.bottom - r.bottom };
  const lado = (Object.entries(dist).sort((a, b) => a[1] - b[1])[0][0]) as Oculto['lado'];
  const tam = Math.round(lado === 'baixo' ? r.height : r.width);
  /* só as janelas de ferramenta se ocultam; os documentos ficam */
  g.itens.filter((i) => d.itens[i]?.tipo === 'ferr').forEach((i) => { tirar(d, i); d.ocultos.push({ item: i, lado, tam }); });
  gav = '';
  desenhar(); guardar();
  dizer('Oculto na borda: um clique no nome abre-o; o alfinete volta a acoplá-lo.');
}
function abrirGaveta(id: string): void { gav = id; desenhar(); requestAnimationFrame(() => $<HTMLElement>('[data-ide-gav] [data-ide-f-q], [data-ide-gav] button')?.focus({ preventScroll: true })); }
function fecharGaveta(): void { if (!gav) return; const g = $('[data-ide-gav]'); gav = ''; if (g && !quieto()) { const lado = g.className.match(/ide-gav--(\w+)/)?.[1]; const n = nosFerr.get(g.dataset.ideGav!); if (n) $('[data-ide-garagem]')!.appendChild(n); const a = g.animate([{ transform: 'none' }, { transform: lado === 'esq' ? 'translateX(-100%)' : lado === 'dir' ? 'translateX(100%)' : 'translateY(100%)' }], { duration: 160, easing: 'cubic-bezier(.4,0,1,1)' }); a.onfinish = () => desenhar(); } else desenhar(); }
function pintarGaveta(): void {
  $('[data-ide-gav]')?.remove();
  if (!gav || !area) return;
  const o = d.ocultos.find((x) => x.item === gav); if (!o) { gav = ''; return; }
  area.insertAdjacentHTML('beforeend', gaveta(d, gav, o.lado, Math.min(o.tam, o.lado === 'baixo' ? area.clientHeight * .7 : area.clientWidth * .6)));
  const g = $('[data-ide-gav]')!;
  g.querySelector('[data-ide-gav-corpo]')!.appendChild(noFerr(d.itens[gav]));
  if (!quieto() && !g.dataset.entrou) g.animate([{ transform: o.lado === 'esq' ? 'translateX(-100%)' : o.lado === 'dir' ? 'translateX(100%)' : 'translateY(100%)' }, { transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.22,1,.36,1)' });
}
function afixar(id: string): void {
  const o = d.ocultos.find((x) => x.item === id); if (!o || !area) return;
  const irmaos = d.ocultos.filter((x) => x.lado === o.lado).map((x) => x.item);
  const frac = Math.min(.45, o.tam / (o.lado === 'baixo' ? area.clientHeight : area.clientWidth));
  d.ocultos = d.ocultos.filter((x) => !irmaos.includes(x.item));
  const gid = acoplarBorda(d, o.lado, irmaos[0], frac);
  irmaos.slice(1).forEach((i) => porNoGrupo(d, i, gid));
  const g = grupoPorId(d, gid); if (g) g.ativo = id;
  gav = ''; d.ativo = id; d.grupo = gid; desenhar(); guardar();
}

/* ---------- mover, dividir, flutuar ---------- */
function moverPara(item: string, gid: string, zona: Zona, pos?: number): void {
  const origem = grupoDe(d, item);
  if (zona === 'centro') {
    if (origem?.id === gid && pos !== undefined) { const i = origem.itens.indexOf(item); origem.itens.splice(i, 1); origem.itens.splice(pos > i ? pos - 1 : pos, 0, item); origem.ativo = item; }
    else { tirar(d, item); porNoGrupo(d, item, gid, pos); }
  } else {
    if (origem?.id === gid && origem.itens.length === 1) return;
    if (!naArvore(d, gid)) { tirar(d, item); porNoGrupo(d, item, gid, pos); }
    else { tirar(d, item); dividir(d, gid, zona, item); }
  }
  d.ativo = item; arrumar(d); d.grupo = grupoDe(d, item)?.id ?? d.grupo;
  if (d.itens[item]?.tipo === 'doc') ultimoGrupoDoc = d.grupo;
  desenhar(); guardar(); entrar(d.grupo);
}
function flutuar(item: string, x?: number, y?: number): void {
  if (!area) return;
  const g0 = grupoDe(d, item); if (g0 && flutDe(d, g0.id) && g0.itens.length === 1) return;
  const el = g0 ? $(`[data-ide-grupo="${g0.id}"]`) : null, ra = area.getBoundingClientRect();
  const r = el?.getBoundingClientRect();
  const w = Math.round(Math.min(Math.max(r?.width ?? 520, 380), ra.width * .6)), h = Math.round(Math.min(Math.max(r?.height ?? 360, 260), ra.height * .7));
  tirar(d, item);
  const fx = x !== undefined ? x - ra.left - 60 : (r ? r.left - ra.left + 28 : 120), fy = y !== undefined ? y - ra.top - 14 : (r ? r.top - ra.top + 28 : 80);
  const f: Flutuante = { id: novoId('f'), grupo: { t: 'grupo', id: novoId('g'), itens: [item], ativo: item }, x: limitar(fx, 0, ra.width - 160), y: limitar(fy, 0, ra.height - 60), w, h, z: Math.max(0, ...d.flut.map((q) => q.z)) + 1 };
  d.flut.push(f); d.ativo = item; d.grupo = f.grupo.id;
  desenhar(); guardar();
  if (!quieto()) $(`[data-ide-fj="${f.id}"]`)?.animate([{ opacity: .4, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 170, easing: 'cubic-bezier(.22,1,.36,1)' });
}
/** Acoplar uma janela flutuante: volta ao grupo de onde saiu, se ainda existir; senão ao grupo dos documentos (ou à borda das ferramentas). */
function acoplarFlut(fid: string): void {
  const f = d.flut.find((x) => x.id === fid); if (!f) return;
  const itens = [...f.grupo.itens], ativo = f.grupo.ativo;
  d.flut = d.flut.filter((x) => x !== f);
  itens.forEach((i) => {
    const it = d.itens[i], v = it?.volta;
    if (v?.grupo && grupoPorId(d, v.grupo) && naArvore(d, v.grupo)) porNoGrupo(d, i, v.grupo);
    else if (it?.tipo === 'ferr') { const lado = FERRAMENTAS[it.ferr!].lado; acoplarBorda(d, lado, i, lado === 'baixo' ? .28 : .2); }
    else { const g = grupoDocs(); if (g) porNoGrupo(d, i, g); else acoplarBorda(d, 'dir', i, .6); }
  });
  d.ativo = ativo; d.grupo = grupoDe(d, ativo)?.id ?? d.grupo;
  desenhar(); guardar(); entrar(d.grupo);
}
/** Uma janela flutuante largada numa guia: os itens todos vão para lá. */
function acoplarFlutEm(fid: string, alvo: Alvo): void {
  const f = d.flut.find((x) => x.id === fid); if (!f || alvo.k === 'flutuar') return;
  const itens = [...f.grupo.itens], ativo = f.grupo.ativo;
  d.flut = d.flut.filter((x) => x !== f);
  let gid = '';
  if (alvo.k === 'borda') gid = acoplarBorda(d, alvo.lado, itens[0], fracBorda(itens[0], alvo.lado));
  else if (alvo.zona === 'centro') { gid = alvo.g; porNoGrupo(d, itens[0], gid, alvo.pos); }
  else gid = dividir(d, alvo.g, alvo.zona, itens[0]);
  itens.slice(1).forEach((i) => porNoGrupo(d, i, gid));
  const g = grupoPorId(d, gid); if (g) g.ativo = ativo;
  d.ativo = ativo; d.grupo = gid; desenhar(); guardar(); entrar(gid);
}
const fracBorda = (item: string, lado: Lado) => d.itens[item]?.tipo === 'ferr' ? (lado === 'baixo' || lado === 'cima' ? .28 : .2) : .5;
/** O grupo que acabou de receber algo entra curto (sem mexer no tamanho de nada). */
function entrar(gid: string): void {
  if (quieto()) return;
  $(`[data-ide-grupo="${gid}"]`)?.animate([{ opacity: .55 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
}
const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* =========================================================
   Arrastar: separadores, ecrãs do Explorador, janelas flutuantes
   ========================================================= */
type Alvo = { k: 'grupo'; g: string; zona: Zona; pos?: number } | { k: 'borda'; lado: Lado } | { k: 'flutuar' };
interface Arrasto { tipo: 'tab' | 'novo' | 'fj'; item?: string; rota?: string; titulo?: string; fj?: string; x0: number; y0: number; ativo: boolean; alvo: Alvo | null; dx?: number; dy?: number; id: number }
let arr: Arrasto | null = null, largouEm = 0;
const GUIA = 34, FOLGA = 4;

function comecar(a: Omit<Arrasto, 'ativo' | 'alvo'>): void { arr = { ...a, ativo: false, alvo: null }; }
function mover(ev: PointerEvent): void {
  if (!arr || !area || !raiz) return;
  if (!arr.ativo) {
    if (Math.hypot(ev.clientX - arr.x0, ev.clientY - arr.y0) < 6) return;
    arr.ativo = true; raiz.classList.add('is-arrastar'); fecharPop();
    if (arr.tipo !== 'fj') { const fan = $('[data-ide-fantasma]')!; const it = arr.item ? d.itens[arr.item] : null; fan.innerHTML = `${it ? iconeItem(it) : L(I.fileText)}<span>${esc(it?.titulo ?? arr.titulo ?? '')}</span>`; fan.hidden = false; }
    if (arr.tipo === 'fj' && gav) fecharGaveta();
  }
  if (arr.tipo === 'fj') {
    const f = d.flut.find((x) => x.id === arr!.fj); const el = $(`[data-ide-fj="${arr.fj}"]`);
    if (f && el) { const ra = area.getBoundingClientRect(); f.x = limitar(ev.clientX - ra.left - arr.dx!, -f.w + 120, ra.width - 80); f.y = limitar(ev.clientY - ra.top - arr.dy!, 0, ra.height - 32); el.style.left = `${f.x}px`; el.style.top = `${f.y}px`; posicionarJa(); }
  } else { const fan = $('[data-ide-fantasma]')!; fan.style.transform = `translate(${ev.clientX + 12}px, ${ev.clientY + 14}px)`; }
  arr.alvo = alvoEm(ev.clientX, ev.clientY);
  pintarGuias(ev.clientX, ev.clientY);
}
/** O grupo por baixo do rato (as janelas flutuantes primeiro, a de cima primeiro), sem contar com o que se arrasta. */
function grupoEm(x: number, y: number): { g: string; el: HTMLElement; flut: boolean } | null {
  const fjs = $$('[data-ide-fj]').filter((f) => f.dataset.ideFj !== arr?.fj).sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));
  for (const fj of fjs) { const r = fj.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { const g = fj.querySelector<HTMLElement>('[data-ide-grupo]')!; return { g: g.dataset.ideGrupo!, el: g, flut: true }; } }
  for (const el of $$('[data-ide-arvore] [data-ide-grupo]')) {
    if ((d.max || compacto) && !el.classList.contains('is-max')) continue;
    const r = el.getBoundingClientRect(); if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return { g: el.dataset.ideGrupo!, el, flut: false };
  }
  return null;
}
/** As guias: o losango ao centro do grupo (cima, esquerda, centro, direita, baixo) e as quatro setas das bordas. */
function guiasDe(x: number, y: number): { tipo: 'g' | 'b'; zona: Zona; r: DOMRect; ok: boolean; g?: string }[] {
  if (!area) return [];
  const ra = area.getBoundingClientRect(), out: { tipo: 'g' | 'b'; zona: Zona; r: DOMRect; ok: boolean; g?: string }[] = [];
  const meio = (cx: number, cy: number) => new DOMRect(cx - GUIA / 2, cy - GUIA / 2, GUIA, GUIA);
  if (!d.max && !compacto) {
    out.push({ tipo: 'b', zona: 'esq', r: meio(ra.left + 8 + GUIA / 2, ra.top + ra.height / 2), ok: ra.width > MIN_W * 2 });
    out.push({ tipo: 'b', zona: 'dir', r: meio(ra.right - 8 - GUIA / 2, ra.top + ra.height / 2), ok: ra.width > MIN_W * 2 });
    out.push({ tipo: 'b', zona: 'cima', r: meio(ra.left + ra.width / 2, ra.top + 8 + GUIA / 2), ok: ra.height > MIN_H * 2 });
    out.push({ tipo: 'b', zona: 'baixo', r: meio(ra.left + ra.width / 2, ra.bottom - 8 - GUIA / 2), ok: ra.height > MIN_H * 2 });
  }
  const h = grupoEm(x, y);
  if (h) {
    const r = h.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + 30 + (r.height - 30) / 2, p = GUIA + FOLGA;
    const mesmo = arr?.item && grupoDe(d, arr.item)?.id === h.g && grupoPorId(d, h.g)!.itens.length === 1;
    out.push({ tipo: 'g', zona: 'centro', r: meio(cx, cy), ok: !mesmo, g: h.g });
    if (!h.flut) {
      const cabeW = r.width / 2 >= MIN_W, cabeH = (r.height - 30) / 2 >= MIN_H;
      out.push({ tipo: 'g', zona: 'esq', r: meio(cx - p, cy), ok: cabeW && !mesmo, g: h.g }, { tipo: 'g', zona: 'dir', r: meio(cx + p, cy), ok: cabeW && !mesmo, g: h.g });
      out.push({ tipo: 'g', zona: 'cima', r: meio(cx, cy - p), ok: cabeH && !mesmo, g: h.g }, { tipo: 'g', zona: 'baixo', r: meio(cx, cy + p), ok: cabeH && !mesmo, g: h.g });
    }
  }
  return out;
}
function alvoEm(x: number, y: number): Alvo | null {
  const dentro = (r: DOMRect) => x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2;
  for (const gu of guiasDe(x, y)) if (dentro(gu.r)) return gu.ok ? (gu.tipo === 'b' ? { k: 'borda', lado: gu.zona as Lado } : { k: 'grupo', g: gu.g!, zona: gu.zona }) : null;
  /* em cima da barra de separadores: junta-se naquela posição */
  const h = grupoEm(x, y);
  if (h) {
    const tabs = h.el.querySelector<HTMLElement>('[data-ide-tabs]')!, rt = h.el.querySelector('.ide-g-cab')!.getBoundingClientRect();
    if (y >= rt.top && y <= rt.bottom && h.el.classList.contains('is-ferr')) return { k: 'grupo', g: h.g, zona: 'centro' };
    if (y >= rt.top && y <= rt.bottom) {
      const ts = [...tabs.querySelectorAll<HTMLElement>('[data-ide-tab]')];
      let pos = ts.length; for (let i = 0; i < ts.length; i++) { const r = ts[i].getBoundingClientRect(); if (x < r.left + r.width / 2) { pos = i; break; } }
      return { k: 'grupo', g: h.g, zona: 'centro', pos };
    }
    if (arr?.tipo === 'novo') return { k: 'grupo', g: h.g, zona: 'centro' };
  }
  if (arr?.tipo === 'tab') return { k: 'flutuar' };
  return null;
}
function pintarGuias(x: number, y: number): void {
  const c = $('[data-ide-guias]'); if (!c || !area) return;
  const gs = guiasDe(x, y), a = arr?.alvo;
  const SETA: Record<Zona, string> = { esq: 'M15 6l-6 6 6 6', dir: 'M9 6l6 6-6 6', cima: 'M6 15l6-6 6 6', baixo: 'M6 9l6 6 6-6', centro: '' };
  const ic = (z: Zona) => z === 'centro' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="7" width="14" height="11" rx="1.5"/><path d="M5 10.5h14"/></svg>' : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${SETA[z]}"/></svg>`;
  const sel = (g: { tipo: 'g' | 'b'; zona: Zona; g?: string }) => !!a && ((a.k === 'borda' && g.tipo === 'b' && g.zona === a.lado) || (a.k === 'grupo' && g.tipo === 'g' && a.g === g.g && a.zona === g.zona && a.pos === undefined));
  const prev = previa(a);
  c.hidden = false;
  c.innerHTML = `${prev ? `<div class="ide-prev${a?.k === 'flutuar' ? ' is-flut' : ''}" style="left:${prev.left}px;top:${prev.top}px;width:${prev.width}px;height:${prev.height}px"></div>` : ''}${a?.k === 'grupo' && a.pos !== undefined ? marcaPos(a) : ''}
    ${gs.map((g) => `<span class="ide-guia ide-guia--${g.tipo} ide-guia--${g.zona}${sel(g) ? ' is-sel' : ''}${g.ok ? '' : ' is-off'}" style="left:${g.r.left}px;top:${g.r.top}px">${ic(g.zona)}</span>`).join('')}`;
}
/** A zona que vai ficar ocupada, sombreada antes de largar. */
function previa(a: Alvo | null | undefined): DOMRect | null {
  if (!a || !area) return null;
  const ra = area.getBoundingClientRect();
  if (a.k === 'flutuar') { const w = 420, h = 280; const fan = $('[data-ide-fantasma]')!.getBoundingClientRect(); return new DOMRect(fan.left - 12, fan.top - 6, w, h); }
  if (a.k === 'borda') { const f = arr?.item ? fracBorda(arr.item, a.lado) : arr?.tipo === 'novo' ? .5 : .3; return a.lado === 'esq' ? new DOMRect(ra.left, ra.top, ra.width * f, ra.height) : a.lado === 'dir' ? new DOMRect(ra.right - ra.width * f, ra.top, ra.width * f, ra.height) : a.lado === 'cima' ? new DOMRect(ra.left, ra.top, ra.width, ra.height * f) : new DOMRect(ra.left, ra.bottom - ra.height * f, ra.width, ra.height * f); }
  const el = $(`[data-ide-grupo="${a.g}"]`); if (!el) return null;
  const r = el.getBoundingClientRect();
  switch (a.zona) {
    case 'esq': return new DOMRect(r.left, r.top, r.width / 2, r.height);
    case 'dir': return new DOMRect(r.left + r.width / 2, r.top, r.width / 2, r.height);
    case 'cima': return new DOMRect(r.left, r.top, r.width, r.height / 2);
    case 'baixo': return new DOMRect(r.left, r.top + r.height / 2, r.width, r.height / 2);
    default: return r;
  }
}
function marcaPos(a: { g: string; pos?: number }): string {
  const el = $(`[data-ide-grupo="${a.g}"]`); if (!el) return '';
  const ts = [...el.querySelectorAll<HTMLElement>('[data-ide-tab]')], cab = el.querySelector('.ide-g-cab')!.getBoundingClientRect();
  const x = ts.length === 0 ? cab.left + 4 : a.pos! < ts.length ? ts[a.pos!].getBoundingClientRect().left : ts[ts.length - 1].getBoundingClientRect().right;
  return `<i class="ide-pos" style="left:${x - 1}px;top:${cab.top + 4}px;height:${cab.height - 8}px"></i>`;
}
function largar(ev: PointerEvent | null, cancelar = false): void {
  const a = arr; arr = null;
  if (!raiz) return;
  raiz.classList.remove('is-arrastar');
  $('[data-ide-guias]')!.hidden = true; $('[data-ide-guias]')!.innerHTML = ''; $('[data-ide-fantasma]')!.hidden = true;
  /* sem arrastar, é um clique: o clique trata disso */
  if (!a || !a.ativo) return;
  largouEm = Date.now();
  if (cancelar || !a.alvo) { if (a.tipo === 'fj') guardar(); return; }
  const alvo = a.alvo;
  if (a.tipo === 'fj') { if (alvo.k !== 'flutuar') acoplarFlutEm(a.fj!, alvo); else guardar(); return; }
  let item = a.item;
  if (a.tipo === 'novo') {
    if (!a.rota || !podeAbrir(a.rota)) { dizer('Este ecrã não abre aqui.'); return; }
    const id = idDoc(ROTAS[a.rota].alias ?? a.rota);
    if (!grupoDe(d, id)) { const rr = ROTAS[a.rota].alias ?? a.rota; d.itens[id] = { id, tipo: 'doc', rota: rr, titulo: a.titulo ?? ROTAS[rr].titulo }; }
    item = id;
  }
  if (!item) return;
  if (alvo.k === 'flutuar') flutuar(item, ev?.clientX, ev?.clientY);
  else if (alvo.k === 'borda') { tirar(d, item); acoplarBorda(d, alvo.lado, item, fracBorda(item, alvo.lado)); d.ativo = item; arrumar(d); d.grupo = grupoDe(d, item)!.id; desenhar(); guardar(); entrar(d.grupo); }
  else moverPara(item, alvo.g, alvo.zona, alvo.pos);
}

/* ---------- divisórias ---------- */
interface Divide { div: string; ia: number; ib: number; dir: 'h' | 'v'; a: HTMLElement; b: HTMLElement; unidade: number; tam: number[]; x0: number; minA: number; minB: number }
let dv: Divide | null = null;
function minNo(el: HTMLElement, dir: 'h' | 'v'): number {
  const gs = [...el.querySelectorAll<HTMLElement>('[data-ide-grupo]')];
  const ferr = gs.length > 0 && gs.every((g) => g.classList.contains('is-ferr'));
  return dir === 'h' ? (ferr ? MIN_FERR_W : MIN_W) : MIN_H;
}
function comecarDivisoria(sep: HTMLElement, x: number, y: number): void {
  /* os índices são os do modelo: entre os dois pode haver nós escondidos (a barra lateral fechada com Ctrl B) */
  const [div, si] = sep.dataset.ideSep!.split(':'), ib = Number(si), ia = Number(sep.dataset.ideSepA ?? ib - 1);
  const no = findDiv(div); if (!no) return;
  const a = sep.previousElementSibling as HTMLElement, b = sep.nextElementSibling as HTMLElement, dir = no.dir;
  const tam = (el: HTMLElement) => dir === 'h' ? el.getBoundingClientRect().width : el.getBoundingClientRect().height;
  const px = tam(a) + tam(b), unidades = no.tam[ia] + no.tam[ib];
  dv = { div, ia, ib, dir, a, b, unidade: px / (unidades || 1), tam: [...no.tam], x0: dir === 'h' ? x : y, minA: minNo(a, dir), minB: minNo(b, dir) };
  raiz!.classList.add('is-arrastar', dir === 'h' ? 'is-col' : 'is-lin'); sep.classList.add('is-ativa');
}
function findDiv(id: string) { const andar = (n: Disposicao['raiz']): Extract<Disposicao['raiz'], { t: 'div' }> | null => n.t === 'grupo' ? null : n.id === id ? n : n.filhos.map(andar).find(Boolean) ?? null; return andar(d.raiz); }
function moverDivisoria(px: number): void {
  if (!dv) return;
  const no = findDiv(dv.div); if (!no) return;
  const { ia, ib, unidade } = dv, par = dv.tam[ia] + dv.tam[ib];
  const parPx = par * unidade;
  if (parPx < dv.minA + dv.minB) return;
  const na = limitar(dv.tam[ia] * unidade + px, dv.minA, parPx - dv.minB) / unidade;
  no.tam[ia] = na; no.tam[ib] = par - na;
  dv.a.style.flex = `${no.tam[ia].toFixed(5)} 1 0`; dv.b.style.flex = `${no.tam[ib].toFixed(5)} 1 0`;
  posicionarJa();
}
function acabarDivisoria(): void {
  if (!dv) return;
  raiz?.classList.remove('is-arrastar', 'is-col', 'is-lin'); $$('.ide-sep.is-ativa').forEach((s) => s.classList.remove('is-ativa'));
  dv = null; guardar(); posicionar();
  $$('[data-ide-tabs]').forEach(tabsAVista);
}
/** A divisória das duas vistas de um documento dividido. */
let dvDoc: { id: string; box: HTMLElement; dir: 'h' | 'v' } | null = null;

/* ---------- janelas flutuantes: redimensionar ---------- */
let rz: { f: Flutuante; el: HTMLElement; k: string; x0: number; y0: number; r0: { x: number; y: number; w: number; h: number } } | null = null;

/* =========================================================
   Comandos
   ========================================================= */
const TECLA_LEGADO: Record<string, string> = { novo: 'F5', editar: 'F6', anular: 'F8', atualizar: 'F9', imprimir: 'F11' };
const TEXTO_CMD: Record<string, RegExp> = { novo: /^(\+\s*)?Nov[oa]\b/i, editar: /^(Editar|Corrigir)\b/i, guardar: /^(Guardar|Gravar)\b/i, anular: /^(Anular|Eliminar|Apagar)\b/i, atualizar: /^Atualizar\b/i, exportar: /^Exportar\b/i, imprimir: /^Imprimir\b/i };
const docAtivo = () => { const it = d.itens[d.ativo]; return it?.tipo === 'doc' ? it : null; };
/** O botão do ecrã ativo que faz este comando: pela tecla (aria-keyshortcuts ou <kbd>) ou pelo nome. A janela do
    documento aberta por cima (Gravar, Anular) tem prioridade sobre a barra da lista. */
function botaoDaPagina(k: string): HTMLElement | null {
  const it = docAtivo(); if (!it) return null;
  const f = frames.get(it.id); let doc: Document | null = null;
  try { doc = f?.contentDocument ?? null; } catch { return null; }
  if (!doc) return null;
  const base = doc.querySelector('.ecra:not([hidden]) > .versao:not([hidden])') ?? doc.body;
  const vis = (b: HTMLElement) => !!(b.offsetWidth || b.offsetHeight) && !(b as HTMLButtonElement).disabled && b.getAttribute('aria-disabled') !== 'true' && !b.closest('[hidden]');
  const tecla = TECLA_LEGADO[k], re = TEXTO_CMD[k];
  const zonas = [...base.querySelectorAll<HTMLElement>('[role="dialog"]:not([hidden]), .dv2-jan:not([hidden]), [data-dv2-jan]:not([hidden])')].reverse();
  for (const z of [...zonas, base]) {
    const bs = [...z.querySelectorAll<HTMLElement>('button, [role="button"]')].filter(vis);
    const porTecla = tecla && bs.find((b) => (b.getAttribute('aria-keyshortcuts') ?? '').split(/\s+/).includes(tecla) || [...b.querySelectorAll('kbd')].some((x) => x.textContent?.trim() === tecla));
    if (porTecla) return porTecla;
    const porNome = bs.find((b) => re.test((b.textContent ?? '').trim()) || re.test(b.getAttribute('aria-label') ?? '') || re.test(b.getAttribute('title') ?? ''));
    if (porNome) return porNome;
  }
  return null;
}
function declara(k: string): boolean {
  const it = docAtivo(), tecla = TECLA_LEGADO[k]; if (!it || !tecla) return false;
  try { return !!frames.get(it.id)?.contentDocument?.querySelector(`.ecra:not([hidden]) [data-teclas~="${tecla}"]`); } catch { return false; }
}
const disponivel = (k: string) => k === 'atualizar' ? !!docAtivo() : !!botaoDaPagina(k) || declara(k);
function comando(k: string): void {
  const it = docAtivo();
  if (k === 'atualizar') { if (!it) return; if (sujos.has(it.id)) { pedidoFechar = { id: it.id, acao: 'atualizar' }; abrirDlg(dlgFecharSujo(it.titulo, 'atualizar')); return; } recarregarDoc(it.id); return; }
  const b = botaoDaPagina(k);
  if (b) { b.click(); if (k === 'guardar') window.setTimeout(() => { if (it) { sujos.delete(it.id); desenharSujos(); } }, 400); window.setTimeout(comandos, 120); return; }
  if (declara(k) && it) { try { const f = frames.get(it.id)!; const doc = f.contentDocument!; (doc.activeElement ?? doc.body).dispatchEvent(new KeyboardEvent('keydown', { key: TECLA_LEGADO[k], bubbles: true, cancelable: true })); f.focus(); } catch { /* */ } return; }
  dizer(it ? `«${it.titulo}» não tem ${k === 'guardar' ? 'Guardar' : k === 'exportar' ? 'Exportar' : 'este comando'} neste momento.` : 'Escolhe um documento primeiro.');
}
function recarregarDoc(id: string): void {
  [id, `${id}#2`].forEach((k) => { const f = frames.get(k); if (!f) return; aCarregar.add(k); barraEstado(); f.addEventListener('load', () => { if (k === id) dizer(`«${d.itens[id]?.titulo}» atualizado.`); }, { once: true }); try { f.contentWindow!.location.reload(); } catch { f.src = f.src; } });
  sujos.delete(id); desenharSujos();
}
/* 6 nov. (ela: «remove a redundância de ter Novo duas vezes, Editar…»): a barra de comandos saiu — cada ecrã tem a sua
   (F5, F6, F8, F9, F11), e o menu Editar e as teclas chegam a ela. Aqui fica o que é da casca: as teclas mostradas
   (Ctrl ou ⌘) e a barra de atividade. */
function comandos(): void {
  $$('[data-ide-kbd]').forEach((k) => { k.textContent = at(k.dataset.ideKbd!); });
  pintarAtividade();
  document.title = `${d.itens[d.ativo]?.titulo ? `${d.itens[d.ativo].titulo} — ` : ''}ROMAFE ERP`;
}
/* ---------- a barra de atividade (VS Code): um ícone por vista ---------- */
const VISTAS: IdFerr[] = ['explorador', 'pesquisa', 'propriedades', 'stock', 'relacionados', 'historico', 'notificacoes', 'mensagens'];
const TECLA_VISTA: Partial<Record<IdFerr, string>> = { explorador: 'explorador', pesquisa: 'pesquisa', mensagens: 'ver-mensagens', propriedades: 'ver-propriedades', stock: 'ver-stock', relacionados: 'ver-relacionados', notificacoes: 'ver-notificacoes' };
function nNotificacoes(): number {
  const tmp = document.createElement('div'); tmp.innerHTML = corpoFerr(itemFerr('notificacoes'), { ...dados, q: '' });
  return [...tmp.querySelectorAll('.ide-n b')].reduce((s, b) => s + (parseInt(b.textContent ?? '', 10) || 0), 0);
}
function pintarAtividade(): void {
  const el = $('[data-ide-atv]'); if (!el) return;
  el.innerHTML = atividade(VISTAS.map((f) => ({ f, titulo: FERRAMENTAS[f].titulo, tecla: TECLA_VISTA[f] ? at(TECLA_VISTA[f]!) : '', ativo: visivel(d, idFerr(f)), aberto: aberta(f), badge: f === 'notificacoes' ? nNotificacoes() : 0 })), perfil, at('paleta-cmd'));
}
/** Carregar num ícone, como no VS Code: a vista à vista fecha o lugar onde está (a barra lateral, o painel); escondida, aparece. */
function cliqueAtividade(f: IdFerr): void {
  const id = idFerr(f), g = grupoDe(d, id);
  if (g && (d.escondidos ?? []).includes(g.id)) { mostrarGrupo(g.id); ativar(id); return; }
  if (g && visivel(d, id) && naArvore(d, g.id) && soFerramentas(d, g)) { esconderGrupo(g.id); return; }
  verFerr(f);
}
function barraEstado(): void {
  const el = $('[data-ide-estado]'); if (!el) return;
  const it = d.itens[d.ativo];
  el.innerHTML = estadoHtml({ ligado: navigator.onLine && !semRede, perfil, doc: it?.titulo ?? '', sujos: sujos.size, carregar: aCarregar.size, disposicao: nomeDisp, alterada, acorde: acorde ? fmt(acorde) : undefined });
}

/* ---------- comandos da área de trabalho ---------- */
function proximoGrupo(passo: 1 | -1): Grupo | null {
  const gs = grupos(d).filter((g) => g.itens.length && (!d.max || d.max === g.id));
  const i = gs.findIndex((g) => g.id === d.grupo);
  return gs.length ? gs[(i + passo + gs.length) % gs.length] : null;
}
function executar(cmd: string, alvo = d.ativo): void {
  const it = d.itens[alvo], g = grupoDe(d, alvo);
  if (cmd.startsWith('abrir:')) { abrirDoc(cmd.slice(6)); return; }
  if (cmd.startsWith('ir:')) { ativar(cmd.slice(3)); return; }
  if (cmd.startsWith('ver:')) { verFerr(cmd.slice(4) as IdFerr, true); return; }
  if (cmd.startsWith('disp:')) { aplicarNomeada(cmd.slice(5)); return; }
  if (cmd.startsWith('preset:')) { aplicar(preset(cmd.slice(7)), PRESETS.find((p) => p.id === cmd.slice(7))?.nome ?? 'Padrão'); return; }
  if (cmd.startsWith('tema:')) { tema(cmd.slice(5)); return; }
  if (cmd.startsWith('mover:')) { dividirEm(alvo, cmd.slice(6) as Lado); return; }
  switch (cmd) {
    case 'novo': case 'editar': case 'guardar': case 'anular': case 'atualizar': case 'exportar': case 'imprimir': comando(cmd); return;
    case 'pesquisa': verFerr('pesquisa'); requestAnimationFrame(() => $<HTMLInputElement>('[data-ide-f-q="pesquisa"]')?.focus()); return;
    case 'explorador': if (!aberta('explorador') || !visivel(d, idFerr('explorador'))) verFerr('explorador'); else ativar(idFerr('explorador')); requestAnimationFrame(() => $<HTMLInputElement>('[data-ide-f-q="explorador"]')?.focus()); return;
    case 'dividir-dir': dividirEm(alvo, 'dir'); return;
    case 'dividir-baixo': dividirEm(alvo, 'baixo'); return;
    case 'flutuar': if (it) { const f = g && flutDe(d, g.id); if (f && g!.itens.length === 1) acoplarFlut(f.id); else flutuar(alvo); } return;
    case 'acoplar': { if (!it) return; if (d.ocultos.some((o) => o.item === alvo)) { afixar(alvo); return; } const f = g && flutDe(d, g.id); if (f) acoplarFlut(f.id); else dizer('Já está acoplado.'); return; }
    case 'ocultar': if (g && naArvore(d, g.id)) ocultarGrupo(g.id); return;
    case 'max': { const gg = g ?? grupoPorId(d, d.grupo); if (!gg || !naArvore(d, gg.id)) return; d.max = d.max === gg.id ? undefined : gg.id; desenhar(); guardar(); return; }
    case 'ver-todas': compacto = false; forcarDivisoes = true; desenhar(); return;
    case 'fechar': if (it) fechar(alvo); return;
    case 'fechar-outros': if (g) fecharVarios(g.itens.filter((i) => i !== alvo && !d.itens[i]?.fixo)); return;
    case 'fechar-direita': if (g) fecharVarios(g.itens.slice(g.itens.indexOf(alvo) + 1).filter((i) => !d.itens[i]?.fixo)); return;
    case 'fechar-todos': fecharVarios(Object.values(d.itens).filter((i) => i.tipo === 'doc' && !i.fixo && grupoDe(d, i.id)).map((i) => i.id)); return;
    case 'fixar': if (it && g) { it.fixo = !it.fixo; g.itens.splice(g.itens.indexOf(alvo), 1); porNoGrupo(d, alvo, g.id, it.fixo ? 0 : undefined); desenhar(); guardar(); dizer(it.fixo ? `«${it.titulo}» fixado.` : `«${it.titulo}» desafixado.`); } return;
    case 'reabrir': reabrir(); return;
    case 'dividir-doc': if (it?.tipo === 'doc') { it.dividido = it.dividido ? undefined : { dir: 'v', frac: .55 }; desenhar(); guardar(); } return;
    case 'dividir-doc-lado': if (it?.tipo === 'doc' && it.dividido) { it.dividido.dir = it.dividido.dir === 'v' ? 'h' : 'v'; desenhar(); guardar(); } return;
    case 'grupo-seg': case 'grupo-ant': { const p = proximoGrupo(cmd === 'grupo-seg' ? 1 : -1); if (p) ativar(p.ativo); return; }
    case 'mover-dir': case 'mover-esq': { const p = proximoGrupo(cmd === 'mover-dir' ? 1 : -1); if (it && p && p.id !== g?.id) moverPara(alvo, p.id, 'centro'); else dizer('Não há outro grupo: divide primeiro.'); return; }
    case 'lista': abrirLista(null); return;
    case 'menu-disposicoes': abrirPopDisp(); return;
    case 'disposicoes': case 'guardar-disp': abrirDlg(dlgDisposicoes(Object.keys(nomeadas), nomeDisp)); requestAnimationFrame(() => $<HTMLInputElement>('[data-ide-disp-nome-in]')?.focus()); return;
    case 'repor': aplicar(preset('padrao'), 'Padrão'); fecharDlg(); return;
    case 'barra-estado': d.barraEstado = !d.barraEstado; desenhar(); guardar(); return;
    case 'atalhos': atalhoEditar = ''; atalhoErro = ''; abrirDlg(htmlAtalhos()); return;
    case 'menu': abrirMenu('ficheiro', true); return;
    case 'sair': irIdentidade(); return;
    case 'recarregar-menu': dados.menu = undefined; pintarFerr(idFerr('explorador')); return;
    /* ---- os do VS Code ---- */
    case 'paleta-cmd': abrirPaleta('>'); return;
    case 'abrir-rapido': abrirPaleta(''); return;
    case 'tema-escolher': abrirPaleta('>Tema: '); return;
    case 'definicoes': dlgAtual = 'definicoes'; abrirDlg(dlgDefinicoes(temaAtual(), d.barraEstado, at('atalhos'))); return;
    case 'lateral': alternarRegiao('esq'); return;
    case 'lateral2': alternarRegiao('dir'); return;
    case 'painel': alternarRegiao('baixo'); return;
    case 'focar-lateral': { const g = regiao('esq')[0]; if (!g || (d.escondidos ?? []).includes(g.id)) { alternarRegiao('esq'); return; } ativar(g.ativo); requestAnimationFrame(() => $<HTMLElement>(`[data-ide-grupo="${g.id}"] :is(input, button.ide-x-i, button.ide-p-i)`)?.focus()); return; }
    case 'zen': zen(!raiz?.classList.contains('is-zen')); return;
    case 'grupo-1': case 'grupo-2': case 'grupo-3': { const gs = $$('[data-ide-arvore] [data-ide-grupo]:not(.is-ferr)'); const el = gs[Number(cmd.slice(-1)) - 1]; const gg = el && grupoPorId(d, el.dataset.ideGrupo!); if (gg?.ativo) ativar(gg.ativo); return; }
    case 'tab-seg': case 'tab-ant': { const gg = grupoPorId(d, d.grupo); if (!gg || gg.itens.length < 2) return; const i = gg.itens.indexOf(gg.ativo), n = gg.itens.length; ativar(gg.itens[(i + (cmd === 'tab-seg' ? 1 : -1) + n) % n]); return; }
    case 'tab-dir': case 'tab-esq': { const gg = grupoPorId(d, d.grupo); if (!gg) return; const i = gg.itens.indexOf(gg.ativo), j = i + (cmd === 'tab-dir' ? 1 : -1); if (j < 0 || j >= gg.itens.length) return; [gg.itens[i], gg.itens[j]] = [gg.itens[j], gg.itens[i]]; desenhar(); guardar(); return; }
    case 'fechar-grupo': { const gg = grupoPorId(d, d.grupo); if (gg) fecharVarios([...gg.itens].filter((i) => !d.itens[i]?.fixo)); return; }
    case 'fechar-guardados': fecharVarios(Object.values(d.itens).filter((i) => i.tipo === 'doc' && !i.fixo && !sujos.has(i.id) && grupoDe(d, i.id)).map((i) => i.id)); return;
    case 'nova-janela': { const x = docAtivo(); if (!x) { dizer('Escolhe um documento primeiro.'); return; } window.open(endereco(x).replace('?separador=1', ''), `romafe-${x.id}`, 'popup,width=1280,height=820'); dizer(`«${x.titulo}» abriu numa janela nova do navegador: pode ir para outro monitor.`); return; }
  }
}
/** Nova divisão com o separador: o grupo dele divide-se (numa janela flutuante, divide-se o grupo dos documentos).
    Com um só separador não há o que dividir (como no Visual Studio). */
const podeDividir = (item: string) => { const g = grupoDe(d, item); return !!g && !compacto && (!naArvore(d, g.id) || g.itens.length > 1); };
function dividirEm(item: string, lado: Lado): void {
  const g = grupoDe(d, item); if (!g) return;
  if (!podeDividir(item)) { dizer('Este grupo só tem este separador: abre outro documento ou arrasta o separador para outro grupo.'); return; }
  const alvo = naArvore(d, g.id) ? g.id : grupoDocs() || d.raiz.id;
  if (alvo === d.raiz.id && d.raiz.t === 'div') { tirar(d, item); acoplarBorda(d, lado, item, .5); d.ativo = item; arrumar(d); d.grupo = grupoDe(d, item)!.id; desenhar(); guardar(); return; }
  moverPara(item, alvo, lado);
}

/* ---------- disposições ---------- */
function aplicar(nova: Disposicao, nome: string): void {
  /* os documentos com alterações por guardar não se fecham: vêm para a disposição nova */
  const carregar = [...sujos].map((k) => d.itens[k]).filter((i): i is Item => !!i && !nova.itens[i.id]);
  const n = copiar(nova);
  const fora = filtrar(n, podeItem);
  carregar.forEach((i) => { n.itens[i.id] = { ...i }; d = n; const g = grupoDocs(); if (g) porNoGrupo(n, i.id, g); else acoplarBorda(n, 'dir', i.id, .5); });
  d = n; nomeDisp = nome; alterada = false; gav = ''; compacto = false; forcarDivisoes = false;
  arrumar(d);
  desenhar(); guardar(false);
  if (!quieto()) area?.animate([{ opacity: .6 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  if (fora.length) mensagem(`Na disposição «${nome}» ${fora.length === 1 ? 'ficou de fora' : 'ficaram de fora'} ${fora.map((i) => `«${i.titulo}»`).join(', ')} (sem acesso ou ainda sem ecrã).`, 'aviso');
  if (carregar.length) dizer(`Disposição «${nome}». ${carregar.length === 1 ? 'Um documento com alterações por guardar veio contigo.' : `${carregar.length} documentos com alterações por guardar vieram contigo.`}`);
  else dizer(`Disposição «${nome}».`);
  mensagem(`Disposição «${nome}» aplicada.`);
}
function aplicarNomeada(nome: string): void { const x = nomeadas[nome]; if (!x) return; aplicar(x, nome); fecharDlg(); fecharPop(); }
function guardarComo(nome: string): void {
  nome = nome.trim().slice(0, 40); if (!nome) return;
  const novo = !nomeadas[nome];
  const c = copiar(d); delete c.max;
  nomeadas[nome] = c; nomeDisp = nome; alterada = false; guardar(false); barraEstado();
  const n = $('[data-ide-disp-nome]'); if (n) n.textContent = nome;
  mensagem(`Disposição «${nome}» ${novo ? 'guardada' : 'atualizada'}.`);
  dizer(`Disposição «${nome}» ${novo ? 'guardada' : 'atualizada'}.`);
}

/* =========================================================
   Menus, listas e diálogos
   ========================================================= */
let pop: { tipo: string; alvo: string; ancora: HTMLElement | null } | null = null;
function fecharPop(): void {
  const p = $('[data-ide-pop]'); if (!p || p.hidden) return;
  p.hidden = true; p.innerHTML = '';
  $$('[data-ide-menu][aria-expanded="true"], [data-ide-cmd="menu-disposicoes"][aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  pop = null;
}
function mostrarPop(html: string, x: number, y: number, tipo: string, alvo = '', ancora: HTMLElement | null = null): void {
  const p = $('[data-ide-pop]')!; p.innerHTML = html; p.hidden = false; pop = { tipo, alvo, ancora };
  const r = p.firstElementChild!.getBoundingClientRect();
  p.style.left = `${Math.max(4, Math.min(x, innerWidth - r.width - 6))}px`; p.style.top = `${Math.max(4, Math.min(y, innerHeight - r.height - 6))}px`;
}
const at = (id: string) => { const t = teclaDe(id); return t ? fmt(t) : ''; };
function itensMenu(k: string): ItemMenu[] {
  const it = d.itens[d.ativo], g = grupoDe(d, d.ativo), doc = docAtivo(), fl = !!(g && flutDe(d, g.id));
  const cmd = (c: string, t: string, tecla = '', off = false, ic = ''): ItemMenu => ({ cmd: c, t, tecla, off, ic });
  const pagina = (c: string, t: string, ic: string) => cmd(c, t, TECLA_LEGADO[c] ?? '', !doc || !disponivel(c), L(ic));
  switch (k) {
    case 'ficheiro': return [cmd('pesquisa', 'Abrir…', at('pesquisa'), false, L(I.search)), { sep: true }, pagina('atualizar', 'Atualizar', I.refreshCw), pagina('exportar', 'Exportar', I.download), pagina('imprimir', 'Imprimir', I.printer), { sep: true }, cmd('fechar', 'Fechar documento', at('fechar'), !it), cmd('fechar-todos', 'Fechar todos os documentos', '', !Object.values(d.itens).some((i) => i.tipo === 'doc')), { sep: true }, cmd('sair', 'Terminar sessão')];
    case 'editar': return [pagina('novo', 'Novo', I.plus), pagina('editar', 'Editar', I.pencil), pagina('guardar', 'Guardar', I.save), pagina('anular', 'Anular', I.ban)];
    case 'ver': return [...(Object.keys(FERRAMENTAS) as IdFerr[]).map((f): ItemMenu => ({ cmd: `ver:${f}`, t: FERRAMENTAS[f].titulo, tecla: ATALHOS.find((a) => a.id === `ver-${f}`) ? at(`ver-${f}`) : f === 'explorador' ? at('explorador') : '', marcado: aberta(f) })), { sep: true }, { cmd: 'barra-estado', t: 'Barra de estado', marcado: d.barraEstado }, { sep: true }, { t: 'Tema', ic: L(I.slidersHorizontal), sub: (['light', 'dark', 'auto'] as const).map((t) => ({ cmd: `tema:${t}`, t: t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Como o sistema', marcado: temaAtual() === t })) }];
    case 'modulos': {
      const ramo = (ns: NoNav[]): ItemMenu[] => ns.filter((n) => !n.antigo).map((n) => n.filhos.length ? { t: n.rotulo, ic: L(I.folder), sub: ramo(n.filhos) } : { cmd: `abrir:${n.rota}`, t: n.rotulo, off: !(n.rota && ROTAS[n.rota]) }).filter((x) => !x.sub || x.sub.length);
      return ramo(navegacao(perfil).filter((n) => n.id === 'compras'));
    }
    case 'janela': {
      const docs = Object.values(d.itens).filter((i) => grupoDe(d, i.id));
      return [cmd('dividir-dir', 'Nova divisão vertical', at('dividir-dir'), !it, L(I.columns2)), cmd('dividir-baixo', 'Nova divisão horizontal', at('dividir-baixo'), !it, L(I.rows2)),
        { t: 'Mover separador', off: !it, sub: [cmd('mover-dir', 'Para o grupo seguinte', at('mover-dir')), cmd('mover-esq', 'Para o grupo anterior', at('mover-esq')), { sep: true }, cmd('mover:esq', 'Para uma divisão à esquerda'), cmd('mover:dir', 'Para uma divisão à direita'), cmd('mover:cima', 'Para uma divisão em cima'), cmd('mover:baixo', 'Para uma divisão em baixo')] },
        cmd('flutuar', fl ? 'Acoplar janela' : 'Janela flutuante', '', !it, L(I.appWindow)), cmd('acoplar', 'Acoplar janela', '', !(fl || (it && d.ocultos.some((o) => o.item === it.id))), L(I.panelLeft)),
        cmd('dividir-doc', doc?.dividido ? 'Juntar as vistas do documento' : 'Dividir documento', '', !doc, L(I.squareSplitVertical)), cmd('max', d.max ? 'Restaurar grupo' : 'Maximizar grupo', at('max'), !g || fl, L(d.max ? I.minimize2 : I.maximize2)),
        { sep: true }, cmd('fechar', 'Fechar separador', at('fechar'), !it), cmd('fechar-outros', 'Fechar outros', '', !g || g.itens.length < 2), cmd('fechar-direita', 'Fechar à direita', '', !g || g.itens.indexOf(d.ativo) === g.itens.length - 1), cmd('reabrir', 'Reabrir o último fechado', at('reabrir'), !fechados.length), cmd('lista', 'Procurar separador…', at('lista'), false, L(I.search)),
        { sep: true }, cmd('repor', 'Repor disposição'), cmd('guardar-disp', 'Guardar disposição…', at('guardar-disp'), false, L(I.save)),
        { t: 'Aplicar disposição', ic: L(I.layoutTemplate), sub: [...Object.keys(nomeadas).map((n) => ({ cmd: `disp:${n}`, t: n, marcado: n === nomeDisp })), ...(Object.keys(nomeadas).length ? [{ sep: true }] : []), ...PRESETS.map((p) => ({ cmd: `preset:${p.id}`, t: p.nome }))] },
        ...(docs.length ? [{ sep: true }, { titulo: 'Abertos' }, ...docs.slice(0, 12).map((i): ItemMenu => ({ cmd: `ir:${i.id}`, t: i.titulo, marcado: i.id === d.ativo }))] : [])];
    }
    case 'ferramentas': return [cmd('atalhos', 'Atalhos de teclado…', '', false, L(I.keyboard)), cmd('disposicoes', 'Disposições…', at('menu-disposicoes'), false, L(I.layoutTemplate)), cmd('ver:mensagens', 'Mensagens do sistema', '', false, L(I.messageSquare))];
    case 'ajuda': return [cmd('atalhos', 'Atalhos de teclado', 'F1', false, L(I.keyboard)), cmd('ver:notificacoes', 'Notificações', at('ver-notificacoes'), false, L(I.bell))];
    default: return [];
  }
}
let menuAberto = '';
function abrirMenu(k: string, foco = false): void {
  const b = $(`[data-ide-menu="${k}"]`); if (!b) return;
  fecharPop();
  const r = b.getBoundingClientRect();
  mostrarPop(menu(itensMenu(k)), r.left, r.bottom + 2, 'menu', k, b);
  b.setAttribute('aria-expanded', 'true'); menuAberto = k;
  if (foco) $<HTMLElement>('[data-ide-pop] .ide-menu-i:not([disabled])')?.focus();
}
function menuTab(id: string, x: number, y: number): void {
  const it = d.itens[id], g = grupoDe(d, id); if (!it || !g) return;
  const fl = !!flutDe(d, g.id), doc = it.tipo === 'doc';
  const c = (cmd: string, t: string, tecla = '', off = false, ic = ''): ItemMenu => ({ cmd, t, tecla, off, ic });
  mostrarPop(menu([c('fechar', 'Fechar', at('fechar'), false, L(I.x)), c('fechar-outros', 'Fechar outros', '', g.itens.length < 2), c('fechar-direita', 'Fechar à direita', '', g.itens.indexOf(id) === g.itens.length - 1), { sep: true },
    c('fixar', it.fixo ? 'Desafixar separador' : 'Fixar separador', at('fixar'), false, L(it.fixo ? I.pinOff : I.pin)), { sep: true },
    c('mover:dir', 'Nova divisão à direita', '', false, L(I.columns2)), c('mover:esq', 'Nova divisão à esquerda'), c('mover:cima', 'Nova divisão em cima'), c('mover:baixo', 'Nova divisão em baixo', '', false, L(I.rows2)),
    c('mover-dir', 'Mover para o grupo seguinte', at('mover-dir')), c('mover-esq', 'Mover para o grupo anterior', at('mover-esq')),
    c('flutuar', fl && g.itens.length === 1 ? 'Acoplar' : 'Janela flutuante', '', false, L(I.appWindow)),
    ...(doc ? [{ sep: true }, c('dividir-doc', it.dividido ? 'Juntar as vistas' : 'Dividir documento', '', false, L(I.squareSplitVertical)), ...(it.dividido ? [c('dividir-doc-lado', it.dividido.dir === 'v' ? 'Vistas lado a lado' : 'Vistas em cima e em baixo')] : [])] : [{ sep: true }, c('ocultar', 'Ocultar automaticamente', '', fl, L(I.pin))])]), x, y, 'tab', id);
  $<HTMLElement>('[data-ide-pop] .ide-menu-i')?.focus();
}
function abrirLista(gid: string | null, ancora?: HTMLElement, q = ''): void {
  const r = ancora?.getBoundingClientRect();
  mostrarPop(listaSeps(d, gid, q, fechados), r ? r.right - 300 : innerWidth / 2 - 160, r ? r.bottom + 2 : 90, 'lista', gid ?? '');
  sujos.forEach((s) => $$(`[data-ide-pop] [data-ide-sujo="${CSS.escape(s)}"]`).forEach((i) => { i.hidden = false; }));
  $<HTMLInputElement>('[data-ide-lista-q]')?.focus();
}
function abrirPopDisp(): void {
  const b = $('[data-ide-cmd="menu-disposicoes"]'); if (!b) return;
  if (pop?.tipo === 'disp') { fecharPop(); return; }
  const r = b.getBoundingClientRect();
  const ns = Object.keys(nomeadas);
  const deBaixo = r.top > innerHeight / 2;
  mostrarPop(menu([...(ns.length ? [{ titulo: 'As minhas' }, ...ns.map((n): ItemMenu => ({ cmd: `disp:${n}`, t: n, marcado: n === nomeDisp }))] : []), { titulo: 'Prontas' }, ...PRESETS.map((p): ItemMenu => ({ cmd: `preset:${p.id}`, t: p.nome, ic: L(I.layoutTemplate) })), { sep: true }, { cmd: 'guardar-disp', t: 'Guardar disposição…', tecla: at('guardar-disp'), ic: L(I.save) }, { cmd: 'disposicoes', t: 'Gerir disposições…' }, { cmd: 'repor', t: 'Restaurar a padrão' }]), r.right - 260, r.bottom + 2, 'disp', '', b);
  if (deBaixo) { const m = $('[data-ide-pop]')!; m.style.top = `${Math.max(4, r.top - m.getBoundingClientRect().height - 4)}px`; }
  b.setAttribute('aria-expanded', 'true');
}
/** Os menus da barra de atividade (a conta, Gerir) e o «…» de cada grupo. */
function menuAtividade(k: string, b: HTMLElement): void {
  if (pop?.tipo === `atv-${k}`) { fecharPop(); return; }
  const p = PERFIS[perfil], r = b.getBoundingClientRect();
  const itens: ItemMenu[] = k === 'conta'
    ? [{ titulo: `${p.pessoa} · ${p.cargo}` }, { cmd: 'sair', t: 'Terminar sessão', ic: L(I.user) }]
    : [{ cmd: 'paleta-cmd', t: 'Paleta de comandos', tecla: at('paleta-cmd'), ic: L(I.search) }, { sep: true }, { cmd: 'definicoes', t: 'Definições', tecla: at('definicoes'), ic: L(I.slidersHorizontal) }, { cmd: 'atalhos', t: 'Atalhos de teclado', tecla: at('atalhos'), ic: L(I.keyboard) }, { cmd: 'disposicoes', t: 'Disposições…', ic: L(I.layoutTemplate) },
      { t: 'Tema', ic: L(I.eye), sub: (['light', 'dark', 'auto'] as const).map((t) => ({ cmd: `tema:${t}`, t: t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Como o sistema', marcado: temaAtual() === t })) }];
  mostrarPop(menu(itens), r.right + 6, r.bottom, `atv-${k}`, '', b);
  const m = $('[data-ide-pop]')!; m.style.top = `${Math.max(4, r.bottom - m.getBoundingClientRect().height)}px`;
}
function menuGrupo(gid: string, b: HTMLElement): void {
  const g = grupoPorId(d, gid); if (!g) return;
  const r = b.getBoundingClientRect();
  const c = (cmd: string, t: string, tecla = '', off = false, ic = ''): ItemMenu => ({ cmd, t, tecla, off, ic });
  ativar(g.ativo, false);
  mostrarPop(menu([c('dividir-dir', 'Dividir à direita', at('dividir-dir'), !podeDividir(g.ativo), L(I.columns2)), c('dividir-baixo', 'Dividir em baixo', at('dividir-baixo'), !podeDividir(g.ativo), L(I.rows2)), c('max', d.max === gid ? 'Restaurar o grupo' : 'Maximizar o grupo', at('max'), false, L(d.max === gid ? I.minimize2 : I.maximize2)), { sep: true },
    c('lista', 'Mostrar todos os separadores', at('lista')), c('nova-janela', 'Abrir numa janela nova', at('nova-janela'), !docAtivo(), L(I.appWindow)), { sep: true },
    c('fechar-grupo', 'Fechar todos do grupo', at('fechar-grupo')), c('fechar-guardados', 'Fechar os que não têm alterações', at('fechar-guardados'))]), r.right - 260, r.bottom + 2, 'grupo', g.ativo, b);
}
let dlgAtual = '';
let focoAntes: HTMLElement | null = null;
function abrirDlg(html: string): void {
  fecharPop();
  const c = $('[data-ide-dlg]')!; if (c.hidden) focoAntes = document.activeElement as HTMLElement;
  c.innerHTML = html; c.hidden = false;
  requestAnimationFrame(() => c.querySelector<HTMLElement>('input, button.is-perigo, button')?.focus());
}
function fecharDlg(): void { const c = $('[data-ide-dlg]'); if (!c || c.hidden) return; c.hidden = true; c.innerHTML = ''; pedidoFechar = null; atalhoEditar = ''; dlgAtual = ''; focoAntes?.focus?.(); }

/* ---------- tema ---------- */
const temaAtual = () => { try { return localStorage.getItem('uiux:tema') || 'auto'; } catch { return 'auto'; } };
function tema(t: string): void {
  try { localStorage.setItem('uiux:tema', t); } catch { /* */ }
  const aplicar = (doc: Document) => { if (t === 'auto') doc.documentElement.removeAttribute('data-theme'); else doc.documentElement.setAttribute('data-theme', t); };
  aplicar(document); frames.forEach((f) => { try { aplicar(f.contentDocument!); } catch { /* */ } });
}

/* =========================================================
   Teclado: as teclas do ERP antigo ficam; as da área de trabalho são configuráveis
   ========================================================= */
/* 6 nov. (ela: «coloca os mesmos atalhos no ERP que o Visual Studio tem, desde Ctrl B e ⌘ B dependendo do sistema
   operativo… todos os atalhos»): as do VS Code, com Ctrl no Windows e no Linux e ⌘ no Mac. Uma tecla com espaço é uma
   sequência: «Ctrl+K Ctrl+W» é Ctrl K e depois Ctrl W (Ctrl K sozinho, ao fim de um segundo, é a pesquisa do ERP).
   As do navegador (Ctrl W, Ctrl Tab, Ctrl 1…) ficam marcadas: num navegador são dele; na aplicação instalada
   funcionam. Para essas há uma alternativa. As teclas do ERP antigo (F2–F12) ganham sempre. */
const A = (id: string, cmd: string, t: string, tecla: string, grupo: string, navegador = false): LinhaAtalho & { cmd: string } => ({ id, cmd, t, tecla, grupo, navegador });
const G1 = 'Geral', G2 = 'Vistas', G3 = 'Separadores', G4 = 'Grupos e divisões', G5 = 'Disposições';
const ATALHOS: (LinhaAtalho & { cmd: string })[] = [
  A('paleta-cmd', 'paleta-cmd', 'Paleta de comandos', 'Ctrl+Shift+P', G1),
  A('abrir-rapido', 'abrir-rapido', 'Ir para um ecrã ou separador', 'Ctrl+P', G1),
  A('pesquisa', 'pesquisa', 'Pesquisa (artigos, fornecedores, encomendas)', 'Ctrl+Shift+F', G1),
  A('definicoes', 'definicoes', 'Definições', 'Ctrl+,', G1),
  A('atalhos', 'atalhos', 'Atalhos de teclado', 'Ctrl+K Ctrl+S', G1),
  A('tema', 'tema-escolher', 'Escolher o tema', 'Ctrl+K Ctrl+T', G1),
  A('menu', 'menu', 'Ir para a barra de menus', 'Alt+Shift+M', G1),
  A('guardar', 'guardar', 'Guardar o documento', 'Ctrl+S', G1),
  A('lateral', 'lateral', 'Mostrar ou esconder a barra lateral', 'Ctrl+B', G2),
  A('lateral2', 'lateral2', 'Mostrar ou esconder a barra lateral secundária', 'Ctrl+Alt+B', G2),
  A('painel', 'painel', 'Mostrar ou esconder o painel', 'Ctrl+J', G2),
  A('painel-2', 'painel', 'Mostrar ou esconder o painel', 'Ctrl+`', G2),
  A('zen', 'zen', 'Modo zen (só o documento; Esc sai)', 'Ctrl+K Z', G2),
  A('focar-lateral', 'focar-lateral', 'Ir para a barra lateral', 'Ctrl+0', G2),
  A('explorador', 'explorador', 'Explorador', 'Ctrl+Shift+E', G2),
  A('ver-mensagens', 'ver:mensagens', 'Mensagens do sistema', 'Ctrl+Shift+M', G2),
  A('ver-propriedades', 'ver:propriedades', 'Propriedades', 'Ctrl+Alt+P', G2),
  A('ver-stock', 'ver:stock', 'Stock por armazém', 'Ctrl+Alt+S', G2),
  A('ver-relacionados', 'ver:relacionados', 'Documentos relacionados', 'Ctrl+Alt+R', G2),
  A('ver-notificacoes', 'ver:notificacoes', 'Notificações', 'Ctrl+Alt+N', G2),
  A('fechar', 'fechar', 'Fechar o separador', 'Ctrl+W', G3, true),
  A('fechar-f4', 'fechar', 'Fechar o separador', 'Ctrl+F4', G3, true),
  A('fechar-alt', 'fechar', 'Fechar o separador', 'Alt+W', G3),
  A('fechar-grupo', 'fechar-grupo', 'Fechar os separadores do grupo', 'Ctrl+K W', G3),
  A('fechar-todos', 'fechar-todos', 'Fechar todos', 'Ctrl+K Ctrl+W', G3),
  A('fechar-guardados', 'fechar-guardados', 'Fechar os que não têm alterações', 'Ctrl+K U', G3),
  A('reabrir', 'reabrir', 'Reabrir o último fechado', 'Ctrl+Shift+T', G3, true),
  A('reabrir-alt', 'reabrir', 'Reabrir o último fechado', 'Alt+Shift+T', G3),
  A('fixar', 'fixar', 'Fixar ou desafixar o separador', 'Ctrl+K Shift+Enter', G3),
  A('tab-seg', 'tab-seg', 'Separador seguinte', 'Ctrl+PageDown', G3, true),
  A('tab-ant', 'tab-ant', 'Separador anterior', 'Ctrl+PageUp', G3, true),
  A('tab-seg-alt', 'tab-seg', 'Separador seguinte', 'Ctrl+K Ctrl+PageDown', G3),
  A('tab-ant-alt', 'tab-ant', 'Separador anterior', 'Ctrl+K Ctrl+PageUp', G3),
  A('tab-dir', 'tab-dir', 'Mover o separador para a direita', 'Ctrl+Shift+PageDown', G3, true),
  A('tab-esq', 'tab-esq', 'Mover o separador para a esquerda', 'Ctrl+Shift+PageUp', G3, true),
  A('lista', 'lista', 'Mostrar todos os separadores', 'Ctrl+K Ctrl+P', G3),
  A('nova-janela', 'nova-janela', 'Abrir o separador numa janela nova (outro monitor)', 'Ctrl+K O', G3),
  A('dividir-dir', 'dividir-dir', 'Dividir à direita', 'Ctrl+\\', G4),
  A('dividir-baixo', 'dividir-baixo', 'Dividir em baixo', 'Ctrl+K Ctrl+\\', G4),
  A('grupo-1', 'grupo-1', 'Ir para o 1.º grupo', 'Ctrl+1', G4, true),
  A('grupo-2', 'grupo-2', 'Ir para o 2.º grupo', 'Ctrl+2', G4, true),
  A('grupo-3', 'grupo-3', 'Ir para o 3.º grupo', 'Ctrl+3', G4, true),
  A('grupo-seg', 'grupo-seg', 'Ir para o grupo seguinte', 'Ctrl+K Ctrl+ArrowRight', G4),
  A('grupo-ant', 'grupo-ant', 'Ir para o grupo anterior', 'Ctrl+K Ctrl+ArrowLeft', G4),
  A('grupo-seg-f6', 'grupo-seg', 'Ir para o grupo seguinte', 'Ctrl+F6', G4),
  A('mover-dir', 'mover-dir', 'Mover o separador para o grupo seguinte', 'Ctrl+Alt+ArrowRight', G4),
  A('mover-esq', 'mover-esq', 'Mover o separador para o grupo anterior', 'Ctrl+Alt+ArrowLeft', G4),
  A('max', 'max', 'Maximizar ou restaurar o grupo', 'Ctrl+K Ctrl+M', G4),
  A('menu-disposicoes', 'menu-disposicoes', 'Aplicar uma disposição', 'Alt+Shift+D', G5),
  A('guardar-disp', 'guardar-disp', 'Guardar a disposição', 'Alt+Shift+S', G5),
];
/** As do ERP antigo (e as que os ecrãs declaram) e as do navegador que não se podem tirar. */
const RESERVADAS = new Set(['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Ctrl+F9', 'Escape', 'Enter', 'Tab', 'Alt+1', 'Alt+2', 'Alt+3', 'Alt+4', 'Alt+5', 'Alt+6', 'Alt+7', 'Alt+8', 'Alt+9', 'Ctrl+D',
  'Ctrl+T', 'Ctrl+N', 'Ctrl+Tab', 'Ctrl+Shift+Tab', 'Ctrl+Shift+N', 'Ctrl+Shift+W', 'Ctrl+L', 'Ctrl+R', 'Ctrl+F', 'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+Z', 'Ctrl+Y', 'Ctrl+A', 'Alt+F4', 'Alt+ArrowLeft', 'Alt+ArrowRight', 'Alt+ArrowUp', 'Alt+ArrowDown']);
const teclaDe = (id: string) => teclasUser[id] ?? ATALHOS.find((a) => a.id === id)?.tecla ?? '';
/** No Mac, «Ctrl» dos atalhos é o ⌘ (como no VS Code). */
const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const SIMBOLO: Record<string, string> = { ArrowRight: '→', ArrowLeft: '←', ArrowUp: '↑', ArrowDown: '↓', PageDown: 'PgDn', PageUp: 'PgUp', Enter: 'Enter' };
/** Uma tecla como se mostra: «Ctrl K Ctrl W» no Windows, «⌘K ⌘W» no Mac. */
function fmt(t: string): string {
  return t.split(' ').map((p) => p.split('+').map((k) => MAC ? ({ Ctrl: '⌘', Alt: '⌥', Shift: '⇧' }[k] ?? SIMBOLO[k] ?? k) : (SIMBOLO[k] ?? k)).join(MAC ? '' : ' ')).join(MAC ? ' ' : ', ');
}
const CODIGO: Record<string, string> = { Backslash: '\\', Backquote: '`', Comma: ',', Period: '.', Slash: '/', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'" };
function combinacao(ev: KeyboardEvent): string {
  if (['Control', 'Alt', 'Shift', 'Meta', 'AltGraph'].includes(ev.key)) return '';
  const mod = ev.ctrlKey || ev.metaKey || ev.altKey;
  const k = mod && ev.code.startsWith('Key') ? ev.code.slice(3) : mod && ev.code.startsWith('Digit') ? ev.code.slice(5) : mod && CODIGO[ev.code] ? CODIGO[ev.code] : ev.key.length === 1 ? ev.key.toUpperCase() : ev.key;
  return [MAC ? (ev.metaKey || ev.ctrlKey ? 'Ctrl' : '') : (ev.ctrlKey || ev.metaKey ? 'Ctrl' : ''), ev.altKey ? 'Alt' : '', ev.shiftKey && (ev.key.length > 1 || mod) ? 'Shift' : '', k].filter(Boolean).join('+');
}
/** A primeira tecla de uma sequência (Ctrl K …) à espera da segunda. */
let acorde: string | null = null, acordeT = 0;
function correr(a: { cmd: string }): void { executar(a.cmd); }
/** Uma tecla da área de trabalho? Executa-a e diz que sim. */
function atalho(ev: KeyboardEvent): boolean {
  const c = combinacao(ev); if (!c) return false;
  /* Ctrl+Alt a escrever num campo é o AltGr (€, @, {…}): fica para o campo */
  const t = ev.target as HTMLElement;
  if (ev.ctrlKey && ev.altKey && t?.matches?.('input, textarea, [contenteditable="true"]') && ev.key.length === 1 && !/^[A-Z]$/i.test(ev.key)) return false;
  if (acorde) {
    const tudo = `${acorde} ${c}`; window.clearTimeout(acordeT); acorde = null; barraEstado();
    const a = ATALHOS.find((x) => teclaDe(x.id) === tudo);
    if (a) correr(a); else dizer(`«${fmt(tudo)}» não é um atalho.`);
    return true;
  }
  if (ATALHOS.some((x) => teclaDe(x.id).startsWith(`${c} `))) {
    acorde = c; barraEstado();
    /* Ctrl K sozinho continua a ser a pesquisa global do ERP */
    acordeT = window.setTimeout(() => { acorde = null; barraEstado(); if (c === 'Ctrl+K') executar('pesquisa'); }, 1000);
    return true;
  }
  const a = ATALHOS.find((x) => teclaDe(x.id) === c);
  if (!a) return false;
  correr(a);
  return true;
}
let atalhoEditar = '', atalhoErro = '';
const LEGADO: [string, string][] = [['Novo', 'F5'], ['Editar', 'F6'], ['Anular / Apagar', 'F8'], ['Atualizar', 'F9'], ['Imprimir', 'F11'], ['Paleta de comandos (fora dos ecrãs)', 'F1'], ['As de cada ecrã', 'F2 F3 F4 F10 F12 · Alt 1…9']];
const htmlAtalhos = () => dlgAtalhos(ATALHOS.map((a) => ({ ...a, tecla: at(a.id) })), LEGADO, atalhoEditar, atalhoErro);
function gravarAtalho(ev: KeyboardEvent): void {
  ev.preventDefault(); ev.stopPropagation();
  if (ev.key === 'Escape') { atalhoEditar = ''; atalhoErro = ''; abrirDlg(htmlAtalhos()); return; }
  const c = combinacao(ev); if (!c) return;
  const nome = fmt;
  if (!ev.ctrlKey && !ev.metaKey && !ev.altKey && !/^F\d+$/.test(c)) { atalhoErro = `«${nome(c)}» serve para escrever: usa Ctrl ou Alt.`; abrirDlg(htmlAtalhos()); return; }
  if (RESERVADAS.has(c)) { atalhoErro = `«${nome(c)}» é do ERP antigo ou do navegador. Escolhe outra.`; abrirDlg(htmlAtalhos()); return; }
  const outro = ATALHOS.find((a) => a.id !== atalhoEditar && (teclaDe(a.id) === c || teclaDe(a.id).startsWith(`${c} `)));
  if (outro) { atalhoErro = `«${nome(c)}» já é «${outro.t}».`; abrirDlg(htmlAtalhos()); return; }
  teclasUser[atalhoEditar] = c; atalhoEditar = ''; atalhoErro = ''; guardar(false); abrirDlg(htmlAtalhos());
}

/* =========================================================
   Responsivo: abaixo do mínimo, só o grupo ativo à vista (a disposição fica)
   ========================================================= */
let forcarDivisoes = false;
/** Na demonstração (#…&demo=1), a barra dela flutua no fundo: a área de trabalho encolhe para caber por cima dela. */
function caberAcimaDaDemo(): void {
  if (!raiz) return;
  const b = document.querySelector<HTMLElement>('.demo-barra');
  const visivelB = !!b && b.getClientRects().length > 0 && getComputedStyle(b).visibility !== 'hidden' && getComputedStyle(b).display !== 'none';
  const h = visivelB ? Math.max(0, innerHeight - b!.getBoundingClientRect().top + 10) : 0;
  raiz.style.height = h ? `calc(100vh - ${Math.round(h)}px)` : '';
}
function medir(): void {
  if (!area) return;
  const r = area.getBoundingClientRect();
  const antes = compacto;
  compacto = forcarCompacto || !forcarDivisoes && grupos(d).filter((g) => naArvore(d, g.id)).length > 1 && (r.width < 760 || r.height < 340);
  const fora = d.flut.some((f) => f.x + f.w > r.width || f.y + 40 > r.height);
  if (compacto !== antes || fora) desenhar(); else posicionar();
  $$('[data-ide-tabs]').forEach(tabsAVista);
}

/* =========================================================
   Armar e ouvir
   ========================================================= */
let ro: ResizeObserver | null = null;
function armar(): void {
  const p = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ide');
  if (p === raiz) return;
  /* a versão saiu de cena: os iframes vão com ela */
  frames.forEach((f) => f.remove()); frames.clear(); nosFerr.clear(); sujos.clear(); aCarregar.clear(); ro?.disconnect();
  raiz = p; area = p?.querySelector<HTMLElement>('[data-ide-area]') ?? null; camada = p?.querySelector<HTMLElement>('[data-ide-camada]') ?? null;
  if (!p || !area || editando()) { raiz = editando() ? null : raiz; return; }
  cenario = p.dataset.ideCenario ?? 'normal';
  /* 05.80 · Sem acesso às Compras: uma conta de Vendas */
  perfil = cenario === 'sem-acesso' ? 'vendas' : perfilDaSessao(); dados.perfil = perfil;
  normal = true;
  semRede = cenario === 'offline'; pararCargas = cenario === 'a-abrir'; forcarCompacto = cenario === 'pequena'; falhados.clear(); dados.menu = undefined;
  if (cenario === 'normal') ler();
  else {
    const c = disposicaoDoCenario(cenario); d = c.d; nomeDisp = c.nome; alterada = false; dados.mensagens = []; fechados = [];
    filtrar(d, podeItem);
    if (cenario === 'falha') falhados.add('doc:compras.faltas');
  }
  persistir = cenario === 'normal';
  desenhar();
  ro = new ResizeObserver(() => medir()); ro.observe(area);
  caberAcimaDaDemo(); window.setTimeout(caberAcimaDaDemo, 600);
  if (cenario !== 'normal') requestAnimationFrame(() => prepararCenario(cenario));
  if (pendente) { const r = pendente; pendente = null; abrirDoc(r); }
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('abrir')) abrirDoc(h.get('abrir')!);
}
/* =========================================================
   Barra lateral, painel e barra lateral secundária (como no VS Code): são os grupos de ferramentas encostados à
   esquerda, em baixo e à direita da área. Ctrl B, Ctrl J e Ctrl Alt B escondem-nos e voltam a mostrá-los; os
   documentos ficam com o espaço. Se não houver nenhum, abre-se a vista de cada lado.
   ========================================================= */
type Regiao = 'esq' | 'dir' | 'baixo';
const POR_OMISSAO: Record<Regiao, IdFerr> = { esq: 'explorador', dir: 'propriedades', baixo: 'stock' };
/** Os grupos de uma região: os de ferramentas encostados a esse lado (o painel pode estar dividido em vários). */
function regiao(lado: Regiao): Grupo[] {
  const guardado = (d.regioes?.[lado] ?? []).map((x) => grupoPorId(d, x)).filter((g): g is Grupo => !!g);
  if (guardado.length) return guardado;
  if (!area) return [];
  const ra = area.getBoundingClientRect();
  return $$('[data-ide-arvore] .ide-g.is-ferr').filter((g) => {
    const r = g.getBoundingClientRect(); if (!r.width) return false;
    return lado === 'esq' ? r.left - ra.left < 14 && r.height > ra.height * .4 && r.width < ra.width * .6
      : lado === 'dir' ? ra.right - r.right < 14 && r.height > ra.height * .4 && r.width < ra.width * .6
      : ra.bottom - r.bottom < 14 && r.height < ra.height * .7 && r.left - ra.left > 14;
  }).map((el) => grupoPorId(d, el.dataset.ideGrupo!)).filter((g): g is Grupo => !!g);
}
function esconderGrupos(gs: string[], lado?: Regiao): void {
  d.escondidos = [...new Set([...(d.escondidos ?? []), ...gs])];
  if (lado) d.regioes = { ...d.regioes, [lado]: gs };
  if (gs.includes(d.grupo)) { const outro = grupos(d).find((g) => !gs.includes(g.id) && !(d.escondidos ?? []).includes(g.id) && g.itens.length); if (outro) { d.grupo = outro.id; d.ativo = outro.ativo; } }
  desenhar(); guardar();
}
const esconderGrupo = (gid: string) => { const l = (['esq', 'dir', 'baixo'] as Regiao[]).find((x) => regiao(x).some((g) => g.id === gid)); esconderGrupos(l ? regiao(l).map((g) => g.id) : [gid], l); };
function mostrarGrupo(gid: string): void {
  const l = (Object.keys(d.regioes ?? {}) as Regiao[]).find((x) => d.regioes![x]!.includes(gid));
  const juntos = l ? d.regioes![l]! : [gid];
  d.escondidos = (d.escondidos ?? []).filter((x) => !juntos.includes(x));
  if (l) delete d.regioes![l];
  desenhar(); guardar();
}
function alternarRegiao(lado: Regiao): void {
  const gs = regiao(lado);
  if (gs.length && gs.every((g) => (d.escondidos ?? []).includes(g.id))) { mostrarGrupo(gs[0].id); gs.forEach((g) => entrar(g.id)); return; }
  if (gs.length) { esconderGrupos(gs.map((g) => g.id), lado); return; }
  verFerr(POR_OMISSAO[lado]);
}
/** O modo zen (Ctrl K Z): só o documento — sem barras, sem ferramentas; Esc sai. Não se guarda. */
function zen(ligar: boolean): void {
  if (!raiz) return;
  raiz.classList.toggle('is-zen', ligar);
  if (ligar) { const g = grupoDocs(); if (g) { d.max = g; d.grupo = g; } dizer('Modo zen: Esc para sair.'); }
  else d.max = undefined;
  desenhar();
}

/* =========================================================
   A paleta (VS Code): Ctrl P vai para um ecrã ou separador; com «>» (Ctrl Shift P, F1), os comandos
   ========================================================= */
const pal: { q: string; sel: number; itens: (ItemPaleta & { fazer: () => void })[] } = { q: '', sel: 0, itens: [] };
function itensPaleta(q: string): (ItemPaleta & { fazer: () => void })[] {
  const cmd = q.startsWith('>'), qq = (cmd ? q.slice(1) : q).trim().toLowerCase();
  const passa = (...t: string[]) => !qq || qq.split(/\s+/).every((w) => t.join(' ').toLowerCase().includes(w));
  if (cmd) {
    const vistos = new Set<string>(), r: (ItemPaleta & { fazer: () => void })[] = [];
    ATALHOS.forEach((a) => { if (vistos.has(a.cmd)) return; vistos.add(a.cmd); if (passa(a.grupo, a.t)) r.push({ t: `${a.grupo}: ${a.t}`, tecla: at(a.id), ic: L(I.keyboard), grupo: 'Comandos', fazer: () => executar(a.cmd) }); });
    const doc = docAtivo();
    ([['novo', 'Novo', I.plus], ['editar', 'Editar', I.pencil], ['anular', 'Anular', I.ban], ['atualizar', 'Atualizar', I.refreshCw], ['exportar', 'Exportar', I.download], ['imprimir', 'Imprimir', I.printer]] as [string, string, string][])
      .forEach(([k, t, ic]) => { if (doc && disponivel(k) && passa('Documento', t)) r.push({ t: `Documento: ${t}`, s: doc.titulo, tecla: TECLA_LEGADO[k], ic: L(ic), grupo: 'Comandos', fazer: () => comando(k) }); });
    PRESETS.forEach((p) => { if (passa('Disposição', p.nome)) r.push({ t: `Disposição: ${p.nome}`, ic: L(I.layoutTemplate), grupo: 'Comandos', fazer: () => executar(`preset:${p.id}`) }); });
    Object.keys(nomeadas).forEach((n) => { if (passa('Disposição', n)) r.push({ t: `Disposição: ${n}`, s: 'guardada', ic: L(I.layoutTemplate), grupo: 'Comandos', fazer: () => executar(`disp:${n}`) }); });
    ([['light', 'Claro'], ['dark', 'Escuro'], ['auto', 'Como o sistema']] as [string, string][]).forEach(([k, t]) => { if (passa('Tema', t)) r.push({ t: `Tema: ${t}`, s: temaAtual() === k ? 'em uso' : '', ic: L(I.slidersHorizontal), grupo: 'Comandos', fazer: () => executar(`tema:${k}`) }); });
    VISTAS.forEach((f) => { if (passa('Ver', FERRAMENTAS[f].titulo)) r.push({ t: `Ver: ${FERRAMENTAS[f].titulo}`, ic: iconeItem(itemFerr(f)), grupo: 'Comandos', fazer: () => verFerr(f) }); });
    return r;
  }
  const abertos = Object.values(d.itens).filter((i) => i.tipo === 'doc' && grupoDe(d, i.id) && passa(i.titulo)).map((i) => ({ t: i.titulo, s: i.id === d.ativo ? 'à vista' : '', ic: iconeItem(i), grupo: 'Abertos', fazer: () => ativar(i.id) }));
  const ecras: (ItemPaleta & { fazer: () => void })[] = [];
  const andar = (ns: NoNav[], caminho: string) => ns.forEach((n) => { if (n.filhos.length) andar(n.filhos, caminho ? `${caminho} › ${n.rotulo}` : n.rotulo); else if (n.rota && ROTAS[n.rota] && !n.antigo && passa(n.rotulo, caminho)) ecras.push({ t: n.rotulo, s: caminho, ic: L(I.fileText), grupo: 'Ecrãs', fazer: () => abrirDoc(n.rota!, { titulo: n.rotulo }) }); });
  andar(navegacao(perfil), '');
  Object.entries(ROTAS).filter(([k, r]) => k.startsWith('ficheiros.') && podeAbrir(k) && passa(r.titulo, 'Ficheiros')).forEach(([k, r]) => ecras.push({ t: r.titulo, s: 'Ficheiros', ic: L(I.fileText), grupo: 'Ecrãs', fazer: () => abrirDoc(k) }));
  const fch = fechados.filter((f) => passa(f.titulo)).slice(0, 5).map((f) => ({ t: f.titulo, s: 'fechado há pouco', ic: L(I.history), grupo: 'Fechados há pouco', fazer: () => abrirDoc(f.rota, { titulo: f.titulo, chave: f.chave, modo: f.modo }) }));
  return [...abertos, ...ecras, ...fch];
}
function abrirPaleta(q: string): void {
  fecharPop();
  pal.q = q; pal.sel = 0; pal.itens = itensPaleta(q);
  const w = Math.min(640, innerWidth - 32);
  mostrarPop(paletaHtml(q, pal.itens, 0), (innerWidth - w) / 2, 44, 'pal');
  const i = $<HTMLInputElement>('[data-ide-pal-q]'); if (i) { i.focus(); i.setSelectionRange(q.length, q.length); }
}
function pintarPaleta(): void {
  const l = $('[data-ide-pal-l]'); if (!l) return;
  const tmp = document.createElement('div'); tmp.innerHTML = paletaHtml(pal.q, pal.itens, pal.sel);
  l.innerHTML = tmp.querySelector('[data-ide-pal-l]')!.innerHTML;
  l.querySelector('.is-sel')?.scrollIntoView({ block: 'nearest' });
}
function executarPaleta(i: number): void { const x = pal.itens[i]; fecharPop(); x?.fazer(); }

/** Os estados do ecrã: depois de desenhar a disposição deles, o que cada um mostra aberto. */
function prepararCenario(c: string): void {
  const ENC = 'doc:compras.encomendas', FALTAS = 'doc:compras.faltas';
  const enc = () => { sujos.add(ENC); desenharSujos(); };
  switch (c) {
    case 'oculto': abrirGaveta(idFerr('explorador')); break;
    case 'disposicoes': executar('disposicoes'); break;
    case 'guias': mudarContexto({ tipo: 'artigo', chave: '0 986 424 797' }); demoGuias(); break;
    case 'compras': mudarContexto({ tipo: 'artigo', chave: '0 986 424 797' }); break;
    case 'artigos': mudarContexto({ tipo: 'artigo', chave: '6206-2RSH' }); break;
    case 'lista': abrirLista(null, undefined, 'enc'); break;
    case 'fechados':
      fechados = [{ rota: 'compras.compras-faturas', titulo: 'Faturas' }, { rota: 'compras.cotacoes', titulo: 'Orçamentos' }, { rota: 'compras.mapas-recap', titulo: 'Mapa recapitulativo de fornecedores' }];
      abrirLista(null); break;
    case 'sujo': enc(); break;
    case 'fechar-sujo': enc(); fechar(ENC); break;
    case 'max': { const g = grupoDe(d, FALTAS); if (g) { d.max = g.id; desenhar(); } break; }
    case 'menu-janela': abrirMenu('janela'); break;
    case 'menu-tab': { const r = $(`[data-ide-tab="${FALTAS}"]`)?.getBoundingClientRect(); if (r) menuTab(FALTAS, r.left + 24, r.bottom + 2); break; }
    case 'atalhos': executar('atalhos'); break;
    case 'atalho-conflito': atalhoEditar = 'fechar'; atalhoErro = '«Ctrl W» é do navegador: fecha o separador do navegador. Escolhe outra.'; abrirDlg(htmlAtalhos()); break;
    case 'pesquisa': qFerr.pesquisa = 'skf'; verFerr('pesquisa'); { const i = $<HTMLInputElement>('[data-ide-f-q="pesquisa"]'); if (i) i.value = 'skf'; } pintarFerr(idFerr('pesquisa')); break;
    case 'relacionados': mudarContexto({ tipo: 'encomenda', chave: 'EF 2026/0411' }); verFerr('relacionados'); break;
    case 'fixado': {
      mudarContexto({ tipo: 'artigo', chave: '6206-2RSH' });
      const pr = d.itens[idFerr('propriedades')]; if (pr) pr.preso = { tipo: 'artigo', chave: '6206-2RSH' };
      mudarContexto({ tipo: 'artigo', chave: '0 986 424 797' });
      const g = grupoDe(d, idFerr('stock')); if (g && pr) moverPara(pr.id, g.id, 'dir');
      break;
    }
    case 'notificacoes': verFerr('notificacoes'); break;
    case 'reposta':
      mensagem('Disposição «Compras» reposta.');
      mensagem('Ao repor a disposição, saiu «Fornecedores»: já não existe no ERP novo ou não tens acesso.', 'aviso');
      verFerr('mensagens'); dizer('Disposição «Compras» reposta. Um ecrã ficou de fora: vê as Mensagens do sistema.'); break;
    case 'invalida':
      mensagem('A disposição guardada não era válida (talvez de outra versão do ERP). Abrimos a disposição padrão.', 'aviso');
      verFerr('mensagens'); dizer('A disposição guardada não se pôde repor: abrimos a padrão.'); break;
    case 'sem-acesso': abrirDoc('compras.encomendas'); break;
    case 'sem-rota': abrirDoc('compras.fornecedores', { titulo: 'Fornecedores' }); verFerr('mensagens'); break;
    case 'offline': dizer('Sem ligação ao servidor. O que está aberto continua à vista; o que grava espera pela ligação.'); break;
    case 'falha': mensagem('«Lista de Faltas» não abriu: o ecrã não respondeu em 20 segundos.', 'erro'); break;
    case 'sessao': abrirDlg(dlgSessao()); break;
    case 'menu-a-carregar': dados.menu = 'a-carregar'; pintarFerr(idFerr('explorador')); break;
    case 'menu-falhou': dados.menu = 'falhou'; pintarFerr(idFerr('explorador')); break;
  }
}
/** O estado «A acoplar um separador»: as guias por cima do grupo da direita, com a zona de baixo escolhida. */
function demoGuias(): void {
  const g = $$('[data-ide-arvore] [data-ide-grupo]').find((x) => x.querySelector('[data-ide-tab="doc:compras.encomendas"]')); if (!g) return;
  const r = g.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + 30 + (r.height - 30) / 2;
  const item = 'doc:compras.faltas';
  arr = { tipo: 'tab', item, x0: 0, y0: 0, ativo: true, alvo: null, id: -1 };
  raiz!.classList.add('is-arrastar');
  const fan = $('[data-ide-fantasma]')!; fan.innerHTML = `${iconeItem(d.itens[item])}<span>${esc(d.itens[item].titulo)}</span>`; fan.hidden = false;
  const x = cx, y = cy + GUIA + FOLGA;
  fan.style.transform = `translate(${x + 12}px, ${y + 14}px)`;
  arr.alvo = alvoEm(x, y); pintarGuias(x, y);
}

function cliques(ev: MouseEvent): void {
  if (!raiz) return;
  const t = ev.target as HTMLElement;
  let b: HTMLElement | null;
  if ((b = t.closest('[data-ide-dlg-fechar]'))) { fecharDlg(); return; }
  if ((b = t.closest('[data-ide-sujo-fechar]'))) { const p = pedidoFechar; fecharDlg(); if (p?.acao === 'atualizar') recarregarDoc(p.id); else if (p) fechar(p.id, true, p.depois); return; }
  if ((b = t.closest('[data-ide-disp-aplicar]'))) { aplicarNomeada(b.dataset.ideDispAplicar!); return; }
  if ((b = t.closest('[data-ide-disp-duplicar]'))) { const n = b.dataset.ideDispDuplicar!; let k = `${n} (cópia)`, i = 2; while (nomeadas[k]) k = `${n} (cópia ${i++})`; nomeadas[k] = copiar(nomeadas[n]); guardar(false); abrirDlg(dlgDisposicoes(Object.keys(nomeadas), nomeDisp)); mensagem(`Disposição «${n}» duplicada como «${k}».`); return; }
  if ((b = t.closest('[data-ide-disp-eliminar]'))) { const n = b.dataset.ideDispEliminar!; delete nomeadas[n]; if (nomeDisp === n) { nomeDisp = 'Personalizado'; alterada = true; } guardar(false); abrirDlg(dlgDisposicoes(Object.keys(nomeadas), nomeDisp)); mensagem(`Disposição «${n}» eliminada.`); barraEstado(); return; }
  if ((b = t.closest('[data-ide-preset]'))) { const p = PRESETS.find((x) => x.id === b!.dataset.idePreset); if (p) { aplicar(p.criar(), p.nome); fecharDlg(); } return; }
  if ((b = t.closest('[data-ide-at-mudar]'))) { atalhoEditar = b.dataset.ideAtMudar!; atalhoErro = ''; abrirDlg(htmlAtalhos()); return; }
  if ((b = t.closest('[data-ide-at-repor]'))) { teclasUser = {}; atalhoErro = ''; guardar(false); abrirDlg(htmlAtalhos()); dizer('Teclas de origem repostas.'); return; }
  if (t.closest('[data-ide-dlg]') && t === $('[data-ide-dlg]')) { fecharDlg(); return; }
  if ((b = t.closest('[data-ide-menu]'))) { const k = b.dataset.ideMenu!; if (menuAberto === k && pop) { fecharPop(); menuAberto = ''; } else abrirMenu(k); return; }
  if ((b = t.closest('[data-ide-pal-i]'))) { executarPaleta(Number(b.dataset.idePalI)); return; }
  if ((b = t.closest('[data-ide-atv-f]'))) { fecharPop(); cliqueAtividade(b.dataset.ideAtvF as IdFerr); return; }
  if ((b = t.closest('[data-ide-atv-menu]'))) { menuAtividade(b.dataset.ideAtvMenu!, b); return; }
  if ((b = t.closest('[data-ide-fechar-item]'))) { fechar(b.dataset.ideFecharItem!); return; }
  if ((b = t.closest('[data-ide-pop] [data-ide-cmd]'))) { const c = b.dataset.ideCmd!, alvo = pop?.tipo === 'tab' || pop?.tipo === 'grupo' ? pop.alvo : d.ativo; fecharPop(); menuAberto = ''; executar(c, alvo); return; }
  if ((b = t.closest('[data-ide-ir]'))) { const id = b.dataset.ideIr!; fecharPop(); ativar(id); return; }
  if ((b = t.closest('[data-ide-reabrir]'))) { fecharPop(); reabrir(Number(b.dataset.ideReabrir)); return; }
  if ((b = t.closest('[data-ide-cmd]'))) { ev.preventDefault(); if (!(b as HTMLButtonElement).disabled) { executar(b.dataset.ideCmd!); if (dlgAtual === 'definicoes' && b.closest('[data-ide-dlg]') && !$('[data-ide-dlg]')!.hidden && /^(tema:|barra-estado)/.test(b.dataset.ideCmd!)) abrirDlg(dlgDefinicoes(temaAtual(), d.barraEstado, at('atalhos'))); } return; }
  if (!t.closest('[data-ide-pop]')) { fecharPop(); menuAberto = ''; }
  if (gav && !t.closest('[data-ide-gav], [data-ide-borda]')) fecharGaveta();
  if ((b = t.closest('[data-ide-tab-acao]'))) { const id = b.closest<HTMLElement>('[data-ide-tab]')!.dataset.ideTab!; if (b.dataset.ideTabAcao === 'fechar') fechar(id); else executar('fixar', id); return; }
  if ((b = t.closest('[data-ide-g-acao]'))) {
    const gid = b.closest<HTMLElement>('[data-ide-grupo]')!.dataset.ideGrupo!, g = grupoPorId(d, gid)!;
    switch (b.dataset.ideGAcao) {
      case 'lista': abrirLista(gid, b); break;
      case 'dividir': if (g.ativo) dividirEm(g.ativo, 'dir'); break;
      case 'mais': menuGrupo(gid, b); break;
      case 'ocultar': ocultarGrupo(gid); break;
      case 'max': d.max = d.max === gid ? undefined : gid; desenhar(); guardar(); break;
      case 'fechar': fecharVarios([...g.itens]); break;
    }
    return;
  }
  if ((b = t.closest('[data-ide-fj-acao]'))) {
    const fid = b.closest<HTMLElement>('[data-ide-fj]')!.dataset.ideFj!, f = d.flut.find((x) => x.id === fid)!;
    if (b.dataset.ideFjAcao === 'acoplar') acoplarFlut(fid);
    else if (b.dataset.ideFjAcao === 'max') { f.max = !f.max; desenhar(); guardar(); }
    else fecharVarios([...f.grupo.itens]);
    return;
  }
  if ((b = t.closest('[data-ide-oculto]'))) { const id = b.dataset.ideOculto!; if (gav === id) fecharGaveta(); else abrirGaveta(id); return; }
  if ((b = t.closest('[data-ide-gav-acao]'))) { const id = b.closest<HTMLElement>('[data-ide-gav]')!.dataset.ideGav!; if (b.dataset.ideGavAcao === 'afixar') afixar(id); else { gav = ''; fechar(id); } return; }
  if ((b = t.closest('[data-ide-recarregar]'))) { const k = b.dataset.ideRecarregar!; falhados.delete(k); pararCargas = false; desenhar(); return; }
  if ((b = t.closest('[data-ide-dv-juntar]'))) { executar('dividir-doc', b.dataset.ideDvJuntar!); return; }
  /* janelas de ferramenta */
  if ((b = t.closest('[data-ide-fav]'))) { const r = b.dataset.ideFav!, ti = b.dataset.ideTitulo!; dados.favoritos = dados.favoritos.some((f) => f.rota === r) ? dados.favoritos.filter((f) => f.rota !== r) : [...dados.favoritos, { rota: r, titulo: ti }]; pintarFerr(idFerr('explorador')); guardar(false); return; }
  if ((b = t.closest('[data-ide-exp-g]'))) { const k = b.dataset.ideExpG!; dados.abertosExp[k] = b.getAttribute('aria-expanded') !== 'true'; pintarFerr(idFerr('explorador')); guardar(false); $<HTMLElement>(`[data-ide-exp-g="${CSS.escape(k)}"]`)?.focus(); return; }
  if ((b = t.closest('[data-ide-abrir]'))) { if (Date.now() - largouEm < 300) return; abrirDoc(b.dataset.ideAbrir!, { titulo: b.dataset.ideTitulo, ...(ev.ctrlKey ? { lado: 'dir' as Lado, grupo: grupoDocs() } : {}) }); return; }
  if ((b = t.closest('[data-ide-ctx]'))) { const [tipo, ...ch] = b.dataset.ideCtx!.split(':'); mudarContexto({ tipo: tipo as Contexto['tipo'], chave: ch.join(':') }); if (!['propriedades', 'stock', 'relacionados', 'historico'].some((f) => visivel(d, idFerr(f as IdFerr)))) verFerr('propriedades'); return; }
  if ((b = t.closest('[data-ide-enc]'))) {
    /* o documento relacionado abre noutro grupo: não por cima do documento onde se escolheu a linha */
    const doc = dados.ultimo && dados.ctx[dados.ultimo]?.origem, origem = (doc && grupoDe(d, doc)?.id) || grupoDe(d, d.ativo)?.id;
    const ref = b.dataset.ideEnc!; mudarContexto({ tipo: 'encomenda', chave: ref }); abrirDoc('compras.encomendas', { chave: ref, titulo: ref, evitar: origem }); return;
  }
  if ((b = t.closest('[data-ide-f-pin]'))) { const id = b.closest<HTMLElement>('[data-ide-ferr]')!.dataset.ideFerr!, it = d.itens[id]; it.preso = it.preso ? null : alvoDe(it, dados); pintarFerr(id); guardar(); return; }
  /* um clique num grupo ativa-o */
  const gel = t.closest<HTMLElement>('[data-ide-grupo]');
  if ((b = t.closest('[data-ide-tab]'))) { ativar(b.dataset.ideTab!); return; }
  if ((b = t.closest('[data-ide-tit]'))) { ativar(b.dataset.ideTit!); return; }
  if (gel) { const g = grupoPorId(d, gel.dataset.ideGrupo!); if (g && g.ativo && d.grupo !== g.id) ativar(g.ativo, false); }
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  /* no protótipo, um ecrã de módulo aberto sozinho vem para um separador (espaco.ts → paraSeparador) */
  document.addEventListener('erp:abrir', (ev) => { const r = (ev as CustomEvent<string>).detail; if (raiz && normal) abrirDoc(r); else pendente = r; });
  document.addEventListener('romafe:rato-inicio', () => { raiz = null; requestAnimationFrame(armar); });
  window.addEventListener('resize', () => { if (raiz) { caberAcimaDaDemo(); medir(); fecharPop(); } });
  /* a barra da demonstração aparece e desaparece (durante o rato, esconde-se): a área acompanha */
  new MutationObserver(() => requestAnimationFrame(caberAcimaDaDemo)).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('online', barraEstado); window.addEventListener('offline', barraEstado);
  /* o que os ecrãs gravam chega aqui: os inspetores e a segunda vista dos documentos divididos atualizam-se */
  let stT = 0;
  window.addEventListener('storage', (ev) => {
    if (!raiz || !ev.key?.startsWith('erp:') || ev.key.startsWith('erp:ide:')) return;
    window.clearTimeout(stT); stT = window.setTimeout(() => {
      recarregar(); pintarFerrs();
      frames.forEach((f, k) => { if (!k.endsWith('#2')) return; try { const w = f.contentWindow!, y = w.document.scrollingElement?.scrollTop ?? 0; f.addEventListener('load', () => { try { f.contentWindow!.document.scrollingElement!.scrollTop = y; } catch { /* */ } }, { once: true }); w.location.reload(); } catch { /* */ } });
    }, 350);
  });
  document.addEventListener('click', (ev) => { if (raiz?.isConnected && raiz.contains(ev.target as Node)) cliques(ev); else if (raiz) { fecharPop(); } });
  document.addEventListener('dblclick', (ev) => {
    const t = ev.target as HTMLElement; if (!raiz?.contains(t)) return;
    const sep = t.closest<HTMLElement>('[data-ide-sep]');
    if (sep) { const no = findDiv(sep.dataset.ideSep!.split(':')[0]); if (no) { no.tam = no.tam.map(() => 1 / no.tam.length); desenhar(); guardar(); } return; }
    if (t.closest('.ide-tabs') && !t.closest('[data-ide-tab]') || (t.closest('.ide-g-cab') && !t.closest('button, [data-ide-tab], [data-ide-tit]'))) { const g = t.closest<HTMLElement>('[data-ide-grupo]'); if (g && !t.closest('[data-ide-fj]')) { const id = g.dataset.ideGrupo!; d.max = d.max === id ? undefined : id; desenhar(); guardar(); } return; }
    const tab = t.closest<HTMLElement>('[data-ide-tab]'); if (tab && t.closest('[data-ide-fj]')) { executar('acoplar', tab.dataset.ideTab!); return; }
    /* duplo clique no título de uma janela de ferramenta: flutua (como no Visual Studio) */
    const tit = t.closest<HTMLElement>('[data-ide-tit]'); if (tit) { executar('flutuar', tit.dataset.ideTit!); return; }
    const fj = t.closest<HTMLElement>('[data-ide-fj-arrastar]'); if (fj) { const f = d.flut.find((x) => x.id === fj.closest<HTMLElement>('[data-ide-fj]')!.dataset.ideFj); if (f) { f.max = !f.max; desenhar(); guardar(); } }
  });
  document.addEventListener('contextmenu', (ev) => {
    const tab = (ev.target as HTMLElement).closest<HTMLElement>('[data-ide-tab], [data-ide-tit]');
    if (!tab || !raiz?.contains(tab)) return;
    ev.preventDefault(); menuTab(tab.dataset.ideTab ?? tab.dataset.ideTit!, ev.clientX, ev.clientY);
  });
  document.addEventListener('auxclick', (ev) => { const tab = (ev.target as HTMLElement).closest<HTMLElement>('[data-ide-tab]'); if (ev.button === 1 && tab && raiz?.contains(tab) && !d.itens[tab.dataset.ideTab!]?.fixo) { ev.preventDefault(); fechar(tab.dataset.ideTab!); } });
  document.addEventListener('pointerdown', (ev) => {
    if (!raiz?.contains(ev.target as Node) || ev.button !== 0 || editando()) return;
    const t = ev.target as HTMLElement;
    if (t.closest('[data-ide-pop], [data-ide-dlg]')) return;
    let b: HTMLElement | null;
    if ((b = t.closest('[data-ide-sep]'))) { ev.preventDefault(); try { b.setPointerCapture(ev.pointerId); } catch { /* a demonstração com o rato não tem ponteiro de verdade */ } comecarDivisoria(b, ev.clientX, ev.clientY); return; }
    if ((b = t.closest('[data-ide-dv-sep]'))) { ev.preventDefault(); try { b.setPointerCapture(ev.pointerId); } catch { /* a demonstração com o rato não tem ponteiro de verdade */ } const it = d.itens[b.dataset.ideDvSep!]; if (it?.dividido) { dvDoc = { id: it.id, box: b.parentElement!, dir: it.dividido.dir }; raiz.classList.add('is-arrastar', it.dividido.dir === 'v' ? 'is-lin' : 'is-col'); } return; }
    if ((b = t.closest('[data-ide-fj-r]'))) { ev.preventDefault(); const el = b.closest<HTMLElement>('[data-ide-fj]')!, f = d.flut.find((x) => x.id === el.dataset.ideFj)!; try { b.setPointerCapture(ev.pointerId); } catch { /* a demonstração com o rato não tem ponteiro de verdade */ } rz = { f, el, k: b.dataset.ideFjR!, x0: ev.clientX, y0: ev.clientY, r0: { x: f.x, y: f.y, w: f.w, h: f.h } }; raiz.classList.add('is-arrastar'); return; }
    if ((b = t.closest('[data-ide-gav-r]'))) { ev.preventDefault(); try { b.setPointerCapture(ev.pointerId); } catch { /* a demonstração com o rato não tem ponteiro de verdade */ } const g = b.closest<HTMLElement>('[data-ide-gav]')!; rzGav = { id: g.dataset.ideGav!, el: g }; raiz.classList.add('is-arrastar'); return; }
    if (t.closest('button:not([data-ide-abrir]), input, a')) return;
    const fjc = t.closest<HTMLElement>('[data-ide-fj-arrastar]');
    if (fjc) { const el = fjc.closest<HTMLElement>('[data-ide-fj]')!, f = d.flut.find((x) => x.id === el.dataset.ideFj)!; f.z = Math.max(0, ...d.flut.map((x) => x.z)) + 1; el.style.zIndex = String(10 + f.z * 2); posicionar(); const r = el.getBoundingClientRect(); comecar({ tipo: 'fj', fj: f.id, x0: ev.clientX, y0: ev.clientY, dx: ev.clientX - r.left, dy: ev.clientY - r.top, id: ev.pointerId }); return; }
    const tab = t.closest<HTMLElement>('[data-ide-tab], [data-ide-tit]');
    if (tab) { comecar({ tipo: 'tab', item: tab.dataset.ideTab ?? tab.dataset.ideTit!, x0: ev.clientX, y0: ev.clientY, id: ev.pointerId }); return; }
    const ab = t.closest<HTMLElement>('[data-ide-abrir]');
    if (ab) { ev.preventDefault(); comecar({ tipo: 'novo', rota: ab.dataset.ideAbrir!, titulo: ab.dataset.ideTitulo, x0: ev.clientX, y0: ev.clientY, id: ev.pointerId }); return; }
    const fjEl = t.closest<HTMLElement>('[data-ide-fj]');
    if (fjEl) { const f = d.flut.find((x) => x.id === fjEl.dataset.ideFj); if (f && f.z !== Math.max(...d.flut.map((x) => x.z))) { f.z = Math.max(...d.flut.map((x) => x.z)) + 1; $$('[data-ide-fj]').forEach((x) => x.classList.toggle('is-foco', x === fjEl)); fjEl.style.zIndex = String(10 + f.z * 2); posicionar(); } }
  });
  document.addEventListener('pointermove', (ev) => {
    if (dv) { moverDivisoria(dv.dir === 'h' ? ev.clientX - dv.x0 : ev.clientY - dv.x0); return; }
    if (dvDoc) { const it = d.itens[dvDoc.id], r = dvDoc.box.getBoundingClientRect(); if (it?.dividido) { const f = dvDoc.dir === 'v' ? (ev.clientY - r.top) / r.height : (ev.clientX - r.left) / r.width; it.dividido.frac = limitar(f, .15, .85); const [a, , c] = [...dvDoc.box.children] as HTMLElement[]; a.style.flex = `${it.dividido.frac} 1 0`; c.style.flex = `${1 - it.dividido.frac} 1 0`; posicionarJa(); } return; }
    if (rz) { const dx = ev.clientX - rz.x0, dy = ev.clientY - rz.y0, { f, k, r0 } = rz; if (k.includes('e')) f.w = Math.max(300, r0.w + dx); if (k.includes('s')) f.h = Math.max(180, r0.h + dy); if (k.includes('w')) { f.w = Math.max(300, r0.w - dx); f.x = r0.x + r0.w - f.w; } if (k.includes('n')) { f.h = Math.max(180, r0.h - dy); f.y = Math.max(0, r0.y + r0.h - f.h); } Object.assign(rz.el.style, { left: `${f.x}px`, top: `${f.y}px`, width: `${f.w}px`, height: `${f.h}px` }); posicionarJa(); return; }
    if (rzGav) { const o = d.ocultos.find((x) => x.item === rzGav!.id), ra = area!.getBoundingClientRect(); if (o) { o.tam = Math.round(limitar(o.lado === 'esq' ? ev.clientX - ra.left : o.lado === 'dir' ? ra.right - ev.clientX : ra.bottom - ev.clientY, 180, (o.lado === 'baixo' ? ra.height : ra.width) * .7)); rzGav.el.style[o.lado === 'baixo' ? 'height' : 'width'] = `${o.tam}px`; } return; }
    if (arr && arr.id !== -1) mover(ev);
  });
  const fim = (ev: PointerEvent) => {
    if (dv) { acabarDivisoria(); return; }
    if (dvDoc) { dvDoc = null; raiz?.classList.remove('is-arrastar', 'is-lin', 'is-col'); guardar(); posicionar(); return; }
    if (rz) { rz = null; raiz?.classList.remove('is-arrastar'); guardar(); posicionar(); return; }
    if (rzGav) { rzGav = null; raiz?.classList.remove('is-arrastar'); guardar(); return; }
    if (arr) largar(ev, ev.type === 'pointercancel' || arr.id === -1);
  };
  document.addEventListener('pointerup', fim); document.addEventListener('pointercancel', fim);
  /* o rato por cima de outro menu, com um aberto, muda de menu (como no Windows) */
  document.addEventListener('pointerover', (ev) => { const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-ide-menu]'); if (b && menuAberto && pop?.tipo === 'menu' && b.dataset.ideMenu !== menuAberto) abrirMenu(b.dataset.ideMenu!); });
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement; if (!raiz?.contains(t)) return;
    if (t.matches('[data-ide-f-q]')) { qFerr[t.dataset.ideFQ!] = t.value; pintarFerr(idFerr(t.dataset.ideFQ as IdFerr)); return; }
    if (t.matches('[data-ide-pal-q]')) { pal.q = t.value; pal.sel = 0; pal.itens = itensPaleta(t.value); pintarPaleta(); return; }
    if (t.matches('[data-ide-lista-q]')) { const p = $('[data-ide-pop]')!; const tmp = document.createElement('div'); tmp.innerHTML = listaSeps(d, pop?.alvo || null, t.value, fechados); p.querySelector('.ide-lista-l')!.innerHTML = tmp.querySelector('.ide-lista-l')!.innerHTML; }
  });
  document.addEventListener('submit', (ev) => { const f = (ev.target as HTMLElement).closest('[data-ide-disp-form]'); if (!f || !raiz?.contains(f)) return; ev.preventDefault(); guardarComo((f.querySelector('input') as HTMLInputElement).value); abrirDlg(dlgDisposicoes(Object.keys(nomeadas), nomeDisp)); });
  document.addEventListener('wheel', (ev) => { const t = (ev.target as HTMLElement).closest<HTMLElement>('[data-ide-tabs]'); if (t && raiz?.contains(t) && Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { t.scrollLeft += ev.deltaY; ev.preventDefault(); } }, { passive: false });
  window.addEventListener('keydown', teclado, true);
}
let rzGav: { id: string; el: HTMLElement } | null = null;

function teclado(ev: KeyboardEvent): void {
  if (!raiz?.isConnected || editando() || raiz.closest('[hidden]')) return;
  if (atalhoEditar) { gravarAtalho(ev); return; }
  const t = ev.target as HTMLElement;
  if (ev.key === 'Escape') {
    if (arr) { largar(null, true); ev.preventDefault(); return; }
    if (pop?.tipo === 'pal') { fecharPop(); ev.preventDefault(); return; }
    if (pop) { const a = pop.ancora; fecharPop(); menuAberto = ''; a?.focus(); ev.preventDefault(); return; }
    if (!$('[data-ide-dlg]')!.hidden) { fecharDlg(); ev.preventDefault(); return; }
    if (gav) { const id = gav; fecharGaveta(); $<HTMLElement>(`[data-ide-oculto="${CSS.escape(id)}"]`)?.focus(); ev.preventDefault(); return; }
    if (raiz.classList.contains('is-zen')) { zen(false); ev.preventDefault(); return; }
  }
  /* a paleta: setas, Enter */
  if (pop?.tipo === 'pal') {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); pal.sel = (pal.sel + (ev.key === 'ArrowDown' ? 1 : -1) + Math.max(1, pal.itens.length)) % Math.max(1, pal.itens.length); pintarPaleta(); return; }
    if (ev.key === 'Enter') { ev.preventDefault(); executarPaleta(pal.sel); return; }
  }
  /* menus abertos: setas, Enter */
  if (pop && (pop.tipo === 'menu' || pop.tipo === 'tab' || pop.tipo === 'disp' || pop.tipo === 'lista')) {
    const is = $$('[data-ide-pop] .ide-menu > .ide-menu-i:not([disabled]), [data-ide-pop] .ide-menu > .ide-menu-sub > .ide-menu-i:not([disabled]), [data-ide-pop] .ide-lista-l .ide-menu-i');
    const i = is.indexOf(document.activeElement as HTMLElement);
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); is[(i + (ev.key === 'ArrowDown' ? 1 : -1) + is.length) % is.length]?.focus(); return; }
    if (pop.tipo === 'menu' && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') && !(document.activeElement as HTMLElement)?.closest('.ide-menu-sub')) { ev.preventDefault(); const ks = ['ficheiro', 'editar', 'ver', 'modulos', 'janela', 'ferramentas', 'ajuda']; abrirMenu(ks[(ks.indexOf(menuAberto) + (ev.key === 'ArrowRight' ? 1 : -1) + ks.length) % ks.length], true); return; }
    if (ev.key === 'ArrowRight' && (document.activeElement as HTMLElement)?.matches('.ide-menu-sub > .ide-menu-i')) { ev.preventDefault(); (document.activeElement as HTMLElement).parentElement!.querySelector<HTMLElement>('.ide-menu .ide-menu-i:not([disabled])')?.focus(); return; }
    if (ev.key === 'ArrowLeft' && (document.activeElement as HTMLElement)?.closest('.ide-menu-sub .ide-menu .ide-menu')) { ev.preventDefault(); (document.activeElement as HTMLElement).closest('.ide-menu-sub')!.querySelector<HTMLElement>(':scope > .ide-menu-i')?.focus(); return; }
    if (ev.key === 'Enter' && t.matches('[data-ide-lista-q]')) { ev.preventDefault(); $<HTMLElement>('[data-ide-pop] .ide-lista-l .ide-menu-i')?.click(); return; }
  }
  /* separadores: setas entre eles, Delete fecha */
  if (t.matches?.('[data-ide-tab]') && !ev.ctrlKey && !ev.altKey) {
    const ts = [...t.parentElement!.querySelectorAll<HTMLElement>('[data-ide-tab]')], i = ts.indexOf(t);
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { ev.preventDefault(); const n = ts[(i + (ev.key === 'ArrowRight' ? 1 : -1) + ts.length) % ts.length]; ativar(n.dataset.ideTab!, false); $<HTMLElement>(`[data-ide-tab="${CSS.escape(n.dataset.ideTab!)}"]`)?.focus(); return; }
    if (ev.key === 'Delete') { ev.preventDefault(); fechar(t.dataset.ideTab!); return; }
    if (ev.key === 'ContextMenu' || (ev.shiftKey && ev.key === 'F10')) { ev.preventDefault(); const r = t.getBoundingClientRect(); menuTab(t.dataset.ideTab!, r.left, r.bottom); return; }
  }
  /* divisórias: setas redimensionam; Enter repõe */
  if (t.matches?.('[data-ide-sep]')) {
    const [div, si] = t.dataset.ideSep!.split(':'); const no = findDiv(div);
    const passo = (no?.dir === 'h' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']).indexOf(ev.key);
    if (no && passo >= 0) { ev.preventDefault(); comecarDivisoria(t, 0, 0); moverDivisoria(passo ? 24 : -24); acabarDivisoria(); requestAnimationFrame(() => $<HTMLElement>(`[data-ide-sep="${div}:${si}"]`)?.focus()); return; }
    if (no && ev.key === 'Enter') { ev.preventDefault(); no.tam = no.tam.map(() => 1 / no.tam.length); desenhar(); guardar(); $<HTMLElement>(`[data-ide-sep="${div}:${si}"]`)?.focus(); return; }
  }
  if (!$('[data-ide-dlg]')!.hidden) return;
  if (ev.key === 'F1') { ev.preventDefault(); executar('paleta-cmd'); return; }
  /* as teclas do ERP antigo, com o foco fora dos ecrãs: vão para o documento ativo */
  const legado = ({ F5: 'novo', F6: 'editar', F8: 'anular', F9: 'atualizar', F11: 'imprimir' } as Record<string, string>)[ev.key];
  if (legado && !ev.ctrlKey && !ev.altKey) { ev.preventDefault(); comando(legado); return; }
  if (atalho(ev)) { ev.preventDefault(); ev.stopPropagation(); }
}
