/* =========================================================
   ERP — Compras: o que mexe nas listas de documentos v2 (26 out. 2026). Ver compras/docs-v2.ts.
   Cada página (e cada estado no editor) tem o seu estado (WeakMap); tudo se desenha a partir dele e da configuração.
     - Pesquisa como no ERP antigo: F1 Número, F2 Data, F10 Código (do fornecedor), F12 Descrição; Shift+F1 Iniciado por,
       Shift+F2 Contendo. Compara sem maiúsculas nem espaços; a data compara-se como se escreve (dd/mm/aaaa). F4 vai à Série.
     - Filtros aplicam-se logo; etiquetas; «Limpar filtros». Enter passa ao campo seguinte; na pesquisa, vai para a lista.
     - Grelha: ordenar (Shift junta), filtrar por coluna, alargar, reordenar, mostrar/esconder, compactas/normais;
       ↑ ↓ PgUp PgDn Home End, Espaço e Shift+↑ ↓ escolhem vários, Enter abre a ficha. Acima de 150 linhas, só as que se veem.
     - Ficha (Novo F5, Editar F6, Enter): nasce da linha (ou da barra) e volta para ela; Enter passa ao campo seguinte;
       Esc fecha e, com alterações, pergunta. Gravar só diz «gravado» depois de as regras do domínio aceitarem.
     - Anular (F8): pede confirmação e o motivo (o domínio exige-o); nunca apaga — o documento fica, anulado.
     - Anexos: ver, carregar (com o progresso da leitura), descarregar, pré-visualizar e remover (Compras).
     - Guarda-se neste computador o que se estava a ver (filtros, pesquisa, colunas, documento) — nunca os dados.
   Movimento só em transform/opacity; com «reduzir movimento», muda logo.
   ========================================================= */
import { CFGS, MODOS, F0, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha, type Modo, type ColDoc } from './docs-v2';
import { anexosDe, anexar, removerAnexo, anexo, tamanho, podeVer, MAX_ANEXO } from './anexos';
import { dia, pode, Recusa } from './dominio';
import { perfilDaSessao } from '../sessao';
import { PERFIS } from '../inicio-dados';
import { xlsx, descarregar, type Celula } from './xlsx';
import { mostrar } from '../../../comum/ecras';
import xIc from 'lucide-static/icons/x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import arrowUp from 'lucide-static/icons/arrow-up.svg?raw';
import arrowDown from 'lucide-static/icons/arrow-down.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import funnel from 'lucide-static/icons/funnel.svg?raw';
import sheet from 'lucide-static/icons/file-spreadsheet.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import upload from 'lucide-static/icons/upload.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';

/* ---------- o estado ---------- */
const estados = new WeakMap<HTMLElement, EstDoc>();
export const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const raiz = (t: Element | null) => t?.closest<HTMLElement>('[data-dv2]') ?? null;
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-dv2]');
export const cfgDe = (r: HTMLElement): CfgDoc => CFGS.get(r.dataset.dv2!)!;
export const nf = (v: number) => v.toLocaleString('pt-PT');
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
export const emSeparador = () => window.self !== window.top;
const CHAVE = (c: CfgDoc, e: EstDoc) => `erp:dv2:${c.k}:${e.perfil}`;
function novo(c: CfgDoc): EstDoc {
  return { modo: 'numero', comp: 'inicio', q: '', f: F0(), cols: c.cols.map((x) => x.k), ocultas: new Set(c.cols.filter((x) => !c.verIniciais.includes(x.k)).map((x) => x.k)), larg: {}, ordem: [], filtrosCol: {}, filtrosAbertos: false,
    dens: 'compacta', sel: new Set(), ativo: '', tab: c.tabs[0].k, alt: 340, fase: 'ok', perfil: perfilDaSessao(), aviso: '', editor: editando(), ocupado: '', recusa: '', vazia: false, extra: {} };
}
export const de = (r: HTMLElement) => { let e = estados.get(r); if (!e) { e = novo(cfgDe(r)); estados.set(r, e); } return e; };
const colDe = (c: CfgDoc, k: string): ColDoc => c.cols.find((x) => x.k === k)!;
const texto = (c: CfgDoc, d: Doc, k: string) => { const v = c.valor(d, k); return colDe(c, k)?.tipo === 'data' ? dia(String(v)) : String(v ?? ''); };

/** As linhas que passam na pesquisa e nos filtros, pela ordem pedida (ou pela do modo). */
export function filtradas(r: HTMLElement, e: EstDoc): Doc[] {
  const c = cfgDe(r), f = e.f, q = norm(e.q), campo = c.campos[e.modo];
  const ls = (e.vazia ? [] : c.linhas(e)).filter((d) => (!f.serie || c.serieDe(d) === f.serie) && (!f.forn || c.fornDe(d) === f.forn)
    && (!f.estado || c.estadoPassa(d, f.estado)) && (!f.de || c.dataDe(d) >= f.de) && (!f.ate || c.dataDe(d) <= f.ate) && (!f.moeda || c.moedaDe(d) === f.moeda)
    && (!q || (() => { const v = norm(e.modo === 'data' ? dia(String(c.valor(d, campo))) : String(c.valor(d, campo) ?? '')); return e.comp === 'inicio' ? v.startsWith(q) : v.includes(q); })())
    && Object.entries(e.filtrosCol).every(([k, v]) => !v.trim() || norm(texto(c, d, k)).includes(norm(v))));
  const ordem = e.ordem.length ? e.ordem : [{ k: campo, dir: (e.modo === 'numero' || e.modo === 'data' ? -1 : 1) as 1 | -1 }];
  return ls.sort((a, b) => { for (const o of ordem) { const x = c.valor(a, o.k), y = c.valor(b, o.k); const k = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), 'pt', { numeric: true }); if (k) return k * o.dir; } return 0; });
}
export const ativoDe = (r: HTMLElement, e: EstDoc): Doc | undefined => e.fase === 'ok' || e.fase === 'atualizar' ? filtradas(r, e).find((d) => d.id === e.ativo) : undefined;

/* ---------- guardar o que se estava a ver ---------- */
function guardarVista(r: HTMLElement, e: EstDoc): void {
  if (e.editor) return;
  try { localStorage.setItem(CHAVE(cfgDe(r), e), JSON.stringify({ modo: e.modo, comp: e.comp, q: e.q, f: e.f, cols: e.cols, ocultas: [...e.ocultas], larg: e.larg, ordem: e.ordem, dens: e.dens, ativo: e.ativo, tab: e.tab, alt: e.alt, quando: Date.now() })); } catch { /* sem armazenamento */ }
}
function repor(r: HTMLElement, e: EstDoc): number | null {
  try {
    const c = cfgDe(r), v = JSON.parse(localStorage.getItem(CHAVE(c, e)) ?? 'null'); if (!v) return null;
    Object.assign(e, { modo: v.modo ?? 'numero', comp: v.comp ?? 'inicio', q: v.q ?? '', f: { ...F0(), ...v.f }, larg: v.larg ?? {}, ordem: v.ordem ?? [], dens: v.dens ?? 'compacta', ativo: v.ativo ?? '', tab: c.tabs.some((t) => t.k === v.tab) ? v.tab : c.tabs[0].k, alt: v.alt ?? 340 });
    if (Array.isArray(v.cols) && v.cols.length === c.cols.length) e.cols = v.cols; e.ocultas = new Set(v.ocultas ?? []);
    return v.quando ?? null;
  } catch { return null; }
}

/* ---------- avisos e diálogos ---------- */
const avisos = new WeakMap<HTMLElement, number>();
export function toast(r: HTMLElement, t: string): void {
  const p = r.querySelector<HTMLElement>('[data-hm-aviso]'); if (!p) return;
  p.textContent = t; p.classList.add('is-visivel'); clearTimeout(avisos.get(r));
  avisos.set(r, window.setTimeout(() => p.classList.remove('is-visivel'), 3400));
}
let voltaFoco: HTMLElement | null = null;
export function dialogo(r: HTMLElement, html: string): HTMLElement {
  const d = r.querySelector<HTMLElement>('[data-dv2-dlg]')!, cen = r.dataset.dv2Cenario ?? 'normal';
  if (d.hidden) voltaFoco = document.activeElement as HTMLElement;
  d.innerHTML = `<div class="lf2-dlg" role="dialog" aria-modal="true" aria-labelledby="dv2-dlg-t">${html}</div>`.replace(/(id|for|aria-labelledby|aria-describedby)="(dv2-[a-z-]+)"/g, `$1="$2-${r.dataset.dv2}-${cen}"`); d.hidden = false;
  (d.querySelector<HTMLElement>('[data-dv2-primeiro]') ?? d.querySelector<HTMLElement>('textarea, input, select, button'))?.focus();
  return d;
}
export function fecharDialogo(r: HTMLElement): boolean {
  const d = r.querySelector<HTMLElement>('[data-dv2-dlg]')!; if (d.hidden) return false;
  d.hidden = true; d.innerHTML = ''; voltaFoco?.focus({ preventScroll: true }); return true;
}
/** Abre outro documento: na área de trabalho, num separador que nasce do elemento (data-dk-doc, que a área de trabalho
    apanha); sozinho, o ecrã dele. O clique que se dispara leva detail = -1, e os ouvintes deste motor ignoram-no. */
export function abrirDoc(b: HTMLElement | null, rota: string, titulo: string, ecra: string, ref = titulo): void {
  /* o ecrã do documento lê a referência da sessão (compras/comportamento.ts, refDe) */
  try { sessionStorage.setItem(`erp:ref:${ecra}`, JSON.stringify(ref)); } catch { /* sem sessão: abre o de omissão */ }
  if (emSeparador() && b) { b.dataset.dkDoc = rota; b.dataset.dkTitulo = titulo; b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: -1 })); delete b.dataset.dkDoc; delete b.dataset.dkTitulo; return; }
  mostrar(ecra as never);
}

/* ---------- desenhar ---------- */
function filtrosNaPagina(r: HTMLElement, e: EstDoc): void {
  const s = (k: string, v: string) => { const el = r.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-dv2-f="${k}"]`); if (el && el.value !== v) el.value = v; };
  (Object.keys(e.f) as (keyof EstDoc['f'])[]).forEach((k) => s(k, e.f[k]));
  const m = MODOS.find((x) => x.k === e.modo)!, q = r.querySelector<HTMLInputElement>('[data-dv2-q]')!;
  if (q.value !== e.q) q.value = e.q;
  q.placeholder = e.modo === 'numero' ? 'Número, ex.: 2026/04' : e.modo === 'data' ? 'Data, ex.: 12/10/2026' : e.modo === 'codigo' ? 'Código do fornecedor, ex.: bosch' : 'Descrição ou notas';
  q.setAttribute('aria-label', `Pesquisar por ${m.t.toLowerCase()}, ${e.comp === 'inicio' ? 'iniciado por' : 'contendo'}`);
  r.querySelectorAll<HTMLElement>('[data-dv2-modo]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.dv2Modo === e.modo)));
  r.querySelectorAll<HTMLElement>('[data-dv2-comp]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.dv2Comp === e.comp)));
  const nAv = [e.f.de, e.f.ate, e.f.moeda].filter(Boolean).length;
  r.querySelector<HTMLElement>('[data-dv2-n-av]')!.textContent = nAv ? String(nAv) : '';
  etiquetas(r, e);
}
function etiquetas(r: HTMLElement, e: EstDoc): void {
  const caixa = r.querySelector<HTMLElement>('[data-dv2-ativos]')!, f = e.f;
  const nome = (k: string) => r.querySelector<HTMLSelectElement>(`select[data-dv2-f="${k}"]`)?.selectedOptions[0]?.textContent ?? '';
  const ch: [string, string][] = [];
  if (f.serie) ch.push(['serie', `Série ${f.serie}`]); if (f.forn) ch.push(['forn', nome('forn')]); if (f.estado) ch.push(['estado', nome('estado')]);
  if (f.de || f.ate) ch.push(['periodo', `${f.de ? dia(f.de) : '…'} a ${f.ate ? dia(f.ate) : '…'}`]); if (f.moeda) ch.push(['moeda', f.moeda]);
  if (e.q) ch.push(['q', `${MODOS.find((m) => m.k === e.modo)!.t} ${e.comp === 'inicio' ? 'iniciado por' : 'contendo'} «${e.q}»`]);
  const ncol = Object.values(e.filtrosCol).filter((v) => v.trim()).length; if (ncol) ch.push(['colunas', `${ncol} ${ncol === 1 ? 'filtro de coluna' : 'filtros de coluna'}`]);
  const antes = new Set([...caixa.querySelectorAll<HTMLElement>('[data-dv2-chip]')].map((x) => x.dataset.dv2Chip));
  caixa.innerHTML = ch.length ? `${ch.map(([k, t]) => `<span class="lf2-chip${antes.has(k) ? '' : ' is-nova'}" data-dv2-chip="${k}">${esc(t)}<button type="button" aria-label="Tirar o filtro ${esc(t)}" data-dv2-tirar="${k}">${L(xIc)}</button></span>`).join('')}<button type="button" class="lf2-limpar" data-dv2-acao="limpar">${L(undo)}<span>Limpar filtros</span></button>` : '';
  caixa.hidden = !ch.length;
}
function vazio(ic: string, t: string, d: string, botao = ''): string { return `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p>${botao}</div>`; }
const BT = (acao: string, ic: string, t: string, cls = '') => `<button type="button" class="ak-btn${cls}" data-dv2-acao="${acao}">${L(ic)}<span>${t}</span></button>`;
const VLIM = 150;
const vis = (c: CfgDoc, e: EstDoc) => e.cols.filter((k) => !e.ocultas.has(k)).map((k) => colDe(c, k));
export function grelha(r: HTMLElement, e: EstDoc, animar = false): void {
  const c = cfgDe(r), g = r.querySelector<HTMLElement>('[data-dv2-grelha]')!;
  r.classList.toggle('is-compacta', e.dens === 'compacta'); r.classList.toggle('is-ocupada', e.fase === 'atualizar');
  if (e.fase === 'carregar') { g.innerHTML = `<div class="lf2-esq" aria-label="A carregar">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>`; return; }
  if (e.fase === 'erro') {
    const [ic, t, d] = e.erro === 'offline' ? [wifiOff, 'Sem ligação à rede.', 'A lista precisa do servidor. Os filtros e a pesquisa ficam; tenta outra vez quando a ligação voltar.']
      : e.erro === 'sessao' ? [logIn, 'A sessão terminou.', 'Volta a entrar para continuar. O que estava escrito fica neste ecrã.']
      : [serverOff, 'O servidor das compras não respondeu.', `Não foi possível ler ${c.o === 'a' ? 'as' : 'os'} ${c.um}s (ERP-COMP-503). Os filtros ficam.`];
    g.innerHTML = vazio(ic, t, d, e.erro === 'sessao' ? `<button type="button" class="ak-btn ak-btn--acao" data-login>${L(logIn)}<span>Voltar a entrar</span></button>` : BT('repetir', refresh, 'Tentar outra vez', ' ak-btn--acao')); return;
  }
  const todas = e.vazia ? [] : c.linhas(e), ls = filtradas(r, e), cs = vis(c, e);
  if (!todas.length) { g.innerHTML = vazio(inbox, `Ainda não há ${c.um}s.`, `${c.o === 'a' ? 'A primeira' : 'O primeiro'} cria-se com Novo (F5).`, BT('novo', check, `Novo ${c.um}`, ' ak-btn--acao')); return; }
  if (!cs.length) { g.innerHTML = vazio(funnel, 'Não há colunas à vista.', 'Escolhe pelo menos uma em Mais ações.', BT('todas-colunas', check, 'Mostrar as colunas iniciais')); return; }
  if (!ls.length) {
    const m = MODOS.find((x) => x.k === e.modo)!;
    g.innerHTML = e.q ? vazio(searchX, `Nada encontrado para «${esc(e.q)}».`, `Procura-se em «${m.t}», ${e.comp === 'inicio' ? 'no início' : 'em qualquer parte'}. Experimenta Contendo (Shift+F2) ou outro modo (F1, F2, F10, F12).`, BT('limpar-q', xIc, 'Limpar a pesquisa'))
      : vazio(searchX, `Nenhum ${c.um} com estes filtros.`, `Há ${nf(todas.length)} sem eles. Tira um filtro, ou limpa-os.`, BT('limpar', undo, 'Limpar filtros'));
    return;
  }
  if (!ls.some((d) => d.id === e.ativo) && e.ativo !== '-') e.ativo = ls[0].id;
  const antes = new Map<string, number>(); if (animar && !quieto()) g.querySelectorAll<HTMLElement>('tr[data-dv2-id]').forEach((t) => antes.set(t.dataset.dv2Id!, t.getBoundingClientRect().top));
  const sc = g.scrollTop, sl = g.scrollLeft, w = (x: ColDoc) => e.larg[x.k] ?? x.w;
  const ord = (k: string) => { const i = e.ordem.findIndex((o) => o.k === k); return i < 0 ? '' : `<span class="lf2-ord">${L(e.ordem[i].dir === 1 ? arrowUp : arrowDown)}${e.ordem.length > 1 ? `<i>${i + 1}</i>` : ''}</span>`; };
  const sort = (k: string) => { const o = e.ordem.find((x) => x.k === k); return o ? (o.dir === 1 ? 'ascending' : 'descending') : 'none'; };
  const campoModo = c.campos[e.modo], num = (x: ColDoc) => x.tipo === 'n' || x.tipo === 'eur';
  const cab = `<tr><th class="lf2-th-sel is-presa"><input type="checkbox" aria-label="Escolher todas" data-dv2-todas${ls.every((d) => e.sel.has(d.id)) ? ' checked' : ''}></th>${cs.map((x) => `<th scope="col" class="${x.presa ? 'is-presa is-presa2 ' : ''}${num(x) ? 'is-num ' : ''}${x.k === campoModo ? 'is-modo' : ''}" aria-sort="${sort(x.k)}" draggable="${!x.presa}" data-dv2-col="${x.k}"><button type="button" data-dv2-ordenar="${x.k}" title="Ordenar (Shift junta outra ordem)">${esc(x.t)}${ord(x.k)}</button><i class="lf2-redim" data-dv2-redim="${x.k}" aria-hidden="true"></i></th>`).join('')}</tr>`
    + (e.filtrosAbertos ? `<tr class="lf2-filtros-col"><th class="is-presa"></th>${cs.map((x) => `<th class="${x.presa ? 'is-presa is-presa2' : ''}"><input type="search" data-dv2-fcol="${x.k}" value="${esc(e.filtrosCol[x.k] ?? '')}" aria-label="Filtrar ${esc(x.t)}" placeholder="Filtrar…"></th>`).join('')}</tr>` : '');
  const hl = e.dens === 'compacta' ? 34 : 42, virtual = ls.length > VLIM;
  const ini = virtual ? Math.max(0, Math.floor(sc / hl) - 15) : 0, fim = virtual ? Math.min(ls.length, ini + Math.ceil((g.clientHeight || 600) / hl) + 30) : ls.length;
  const linha = (d: Doc) => { const s = e.sel.has(d.id), a = d.id === e.ativo;
    return `<tr data-dv2-id="${esc(d.id)}" tabindex="${a ? 0 : -1}" aria-selected="${s}" class="${a ? 'is-ativo' : ''}${d.anulado ? ' is-anulado' : ''}"><td class="lf2-td-sel is-presa"><input type="checkbox" tabindex="-1" aria-label="Escolher ${esc(String(d.numero ?? d.id))}" data-dv2-escolher="${esc(d.id)}"${s ? ' checked' : ''}></td>${cs.map((x) => `<td class="${x.presa ? 'is-presa is-presa2 ' : ''}${num(x) ? 'is-num ' : ''}${x.tipo === 'mono' ? 'is-mono ' : ''}${x.k === campoModo ? 'is-modo' : ''}" data-col="${x.k}">${c.celula(d, x.k)}</td>`).join('')}</tr>`; };
  const corpo = (virtual && ini ? `<tr class="lf2-esp" aria-hidden="true"><td colspan="${cs.length + 1}" style="height:${ini * hl}px"></td></tr>` : '') + ls.slice(ini, fim).map(linha).join('')
    + (virtual && fim < ls.length ? `<tr class="lf2-esp" aria-hidden="true"><td colspan="${cs.length + 1}" style="height:${(ls.length - fim) * hl}px"></td></tr>` : '');
  g.innerHTML = `<table class="lf2-tab" aria-label="${esc(c.titulo)}" aria-rowcount="${ls.length}" aria-multiselectable="true"><colgroup><col style="width:36px">${cs.map((x) => `<col data-dv2-w="${x.k}" style="width:${w(x)}px">`).join('')}</colgroup><thead>${cab}</thead><tbody>${corpo}</tbody></table>`;
  g.scrollTop = sc; g.scrollLeft = sl; g.dataset.dv2Virtual = virtual ? '1' : '';
  if (animar && !quieto()) g.querySelectorAll<HTMLElement>('tbody tr[data-dv2-id]').forEach((t, i) => {
    const a = antes.get(t.dataset.dv2Id!), b = t.getBoundingClientRect().top;
    if (a !== undefined && Math.abs(a - b) > 1) t.animate([{ transform: `translateY(${a - b}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    else if (a === undefined && i < 30) t.animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: Math.min(i, 12) * 12, easing: 'ease-out', fill: 'backwards' });
  });
}
function resumo(r: HTMLElement, e: EstDoc): void {
  const p = r.querySelector<HTMLElement>('[data-dv2-resumo]')!;
  p.innerHTML = e.fase === 'ok' || e.fase === 'atualizar' ? cfgDe(r).resumo(filtradas(r, e)) : '';
}
function estado(r: HTMLElement, e: EstDoc): void {
  const c = cfgDe(r), ok = e.fase === 'ok' || e.fase === 'atualizar', ls = ok ? filtradas(r, e) : [], todas = ok && !e.vazia ? c.linhas(e).length : 0, m = MODOS.find((x) => x.k === e.modo)!, d = ativoDe(r, e);
  const fase = e.fase === 'carregar' ? 'A carregar…' : e.fase === 'atualizar' ? 'A atualizar…' : e.fase === 'erro' ? 'Sem dados' : e.ocupado ? String(e.extra.ocupadoTexto ?? 'A gravar…') : e.ficha?.sujo ? 'Alterações por gravar' : 'Pronto';
  const livre = e.fase === 'ok' && !e.ocupado;
  r.querySelector<HTMLElement>('[data-dv2-estado]')!.innerHTML = `<span>${c.um[0].toUpperCase()}${c.um.slice(1)}s <b>${nf(ls.length)}</b>${todas && todas !== ls.length ? ` de ${nf(todas)}` : ''}</span><span>Escolhidos <b>${nf(e.sel.size)}</b></span><span>Pesquisar por <b>${esc(m.t)}</b> · ${e.comp === 'inicio' ? 'iniciado por' : 'contendo'}</span><span>Utilizador <b>${esc(PERFIS[e.perfil].pessoa)}</b></span><span class="ak-estado-f is-${livre && !e.ficha?.sujo ? 'ok' : 'a-gerar'}">${livre ? '' : L(loader)}${fase}</span>${e.aviso ? `<span class="ak-estado-aviso">${esc(e.aviso)}</span>` : ''}`;
  const porque: Record<string, string> = {
    novo: e.ficha ? 'Já há uma ficha aberta.' : c.porque.novo(e),
    editar: e.ficha?.modo === 'editar' ? 'A ficha já está em edição.' : c.porque.editar(e, d),
    anular: e.ficha && e.ficha.modo !== 'editar' && !d ? 'Grava ou fecha a ficha primeiro.' : c.porque.anular(e, d),
    atualizar: e.fase === 'atualizar' ? 'A lista já está a ser lida.' : e.ficha?.sujo ? 'Grava ou fecha a ficha primeiro: Atualizar perdia as alterações.' : '',
    imprimir: !ls.length && !e.ficha ? 'Não há linhas para imprimir.' : '',
    anexos: !d && !e.ficha ? `Escolhe ${c.o === 'a' ? 'uma' : 'um'} ${c.um}.` : '',
  };
  Object.entries(porque).forEach(([k, t]) => r.querySelectorAll<HTMLElement>(`.dv2-barra [data-dv2-acao="${k}"]`).forEach((b) => { b.setAttribute('aria-disabled', String(!!t)); if (t) b.title = t; else b.title = `${b.querySelector('span')?.textContent ?? ''}${b.getAttribute('aria-keyshortcuts') ? ` (${b.getAttribute('aria-keyshortcuts')})` : ''}`; }));
  r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="atualizar"]')?.classList.toggle('is-carregar', e.fase === 'atualizar');
  c.acao(r, e, '_barra', r);
}
export function inspetor(r: HTMLElement, e: EstDoc, mudou = false): void {
  const c = cfgDe(r), d = ativoDe(r, e), alvo = r.querySelector<HTMLElement>('[data-dv2-alvo]')!, p = r.querySelector<HTMLElement>('[data-dv2-p]')!;
  r.querySelectorAll<HTMLElement>('[data-dv2-tab]').forEach((b) => { const s = b.dataset.dv2Tab === e.tab; b.setAttribute('aria-selected', String(s)); b.tabIndex = s ? 0 : -1; });
  r.querySelector('[data-dv2-p]')?.setAttribute('aria-labelledby', r.querySelector<HTMLElement>(`[data-dv2-tab="${e.tab}"]`)?.id ?? '');
  const nA = r.querySelector<HTMLElement>('[data-dv2-n-tab="anexos"]'); if (nA) nA.textContent = d ? String(anexosDe(c.docAnexo(d)).length || '') : '';
  if (e.fase === 'carregar') { alvo.innerHTML = ''; p.innerHTML = '<div class="lf2-esq lf2-esq--peq"><i></i><i></i><i></i><i></i></div>'; return; }
  if (!d) { alvo.innerHTML = ''; p.innerHTML = `<p class="lf2-sem">${L(paperclip)}${e.fase === 'erro' ? 'Sem dados enquanto a lista não carregar.' : `Escolhe ${c.o === 'a' ? 'uma' : 'um'} ${c.um} na lista para ver os detalhes.`}</p>`; return; }
  alvo.innerHTML = c.painel(e, d, '_alvo');
  p.innerHTML = e.tab === 'anexos' ? painelAnexos(r, e, d) : c.painel(e, d, e.tab);
  if (mudou && !quieto()) p.animate([{ opacity: .3, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
function menuMais(r: HTMLElement, e: EstDoc): void {
  const c = cfgDe(r), m = r.querySelector<HTMLElement>('[data-dv2-menu="mais"]'); if (!m) return;
  m.innerHTML = `<p class="ak-menu-t">Colunas</p>
    <div class="lf2-cols">${e.cols.map((k, i, xs) => { const x = colDe(c, k); return `<div class="ak-col-i"><label><input type="checkbox" data-dv2-ver="${k}"${e.ocultas.has(k) ? '' : ' checked'}${x.presa ? ' disabled' : ''}>${esc(x.t)}${x.antiga ? '' : ' <small>(nova)</small>'}</label><button type="button" data-dv2-mover="${k}:-1" aria-label="Subir ${esc(x.t)}"${i > 1 ? '' : ' disabled'}>${L(arrowUp)}</button><button type="button" data-dv2-mover="${k}:1" aria-label="Descer ${esc(x.t)}"${i && i < xs.length - 1 ? '' : ' disabled'}>${L(arrowDown)}</button></div>`; }).join('')}</div>
    <button type="button" role="menuitem" data-dv2-acao="todas-colunas"><span>${L(check)} Repor as colunas iniciais</span></button>
    <p class="ak-menu-t">Linhas</p>
    <div class="ak2-dens" role="group" aria-label="Linhas"><button type="button" role="menuitemradio" data-dv2-dens="compacta" aria-checked="${e.dens === 'compacta'}">Compactas</button><button type="button" role="menuitemradio" data-dv2-dens="normal" aria-checked="${e.dens === 'normal'}">Normais</button></div>
    <button type="button" role="menuitemcheckbox" aria-checked="${e.filtrosAbertos}" data-dv2-acao="filtros-col"><span>${L(funnel)} Filtrar por coluna</span></button>
    <p class="ak-menu-t">Exportar</p>
    <button type="button" role="menuitem" data-dv2-acao="excel"><span>${L(sheet)} Exportar para Excel</span><small>${nf(e.fase === 'ok' ? filtradas(r, e).length : 0)} linhas</small></button>`;
}
export function tudo(r: HTMLElement, e: EstDoc, animar = false): void {
  filtrosNaPagina(r, e); grelha(r, e, animar); resumo(r, e); inspetor(r, e); estado(r, e); menuMais(r, e);
  r.style.setProperty('--lf2-alt', `${e.alt}px`); r.querySelector('[data-dv2-div]')?.setAttribute('aria-valuenow', String(e.alt));
}
export function escolher(r: HTMLElement, e: EstDoc, id: string, focar = true): void {
  if (e.ativo === id) return;
  e.ativo = id; e.recusa = '';
  r.querySelectorAll('tr.is-ativo').forEach((t) => { t.classList.remove('is-ativo'); (t as HTMLElement).tabIndex = -1; });
  const tr = r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(id)}"]`);
  if (tr) { tr.classList.add('is-ativo'); tr.tabIndex = 0; if (focar) tr.focus({ preventScroll: true }); tr.scrollIntoView({ block: 'nearest' }); }
  inspetor(r, e, true); estado(r, e); guardarVista(r, e);
  /* o painel acende-se: a ligação entre a linha e os detalhes */
  const a = r.querySelector<HTMLElement>('[data-dv2-alvo] b'); if (a && !quieto()) a.animate([{ backgroundColor: 'color-mix(in srgb, var(--h-laranja) 28%, transparent)' }, { backgroundColor: 'transparent' }], { duration: 600, easing: 'ease-out' });
}

/* ---------- anexos ---------- */
function painelAnexos(r: HTMLElement, e: EstDoc, d: Doc): string {
  const c = cfgDe(r), xs = anexosDe(c.docAnexo(d)), escreve = pode(e.perfil, 'editar');
  const prog = e.extra.anexoProgresso as number | undefined, falha = e.extra.anexoErro as string | undefined;
  return `<div class="dv2-anexos">
    <div class="dv2-anexos-cab"><h3>Anexos de ${esc(String(d.numero))}</h3>${escreve ? `<button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="carregar-anexo">${L(upload)}<span>Carregar ficheiro</span></button>` : '<small>O teu perfil só consulta.</small>'}</div>
    ${prog !== undefined ? `<div class="dv2-progresso" role="progressbar" aria-label="A carregar o anexo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(prog * 100)}"><i style="transform:scaleX(${prog})"></i><span>A carregar… ${Math.round(prog * 100)} %</span></div>` : ''}
    ${falha ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(falha)}</p>` : ''}
    ${xs.length ? `<ul class="dv2-anexos-l">${xs.map((a) => `<li><span class="dv2-anexo-ic">${L(paperclip)}</span><span class="dv2-anexo-n"><b>${esc(a.nome)}</b><small>${esc(a.tipo.split('/')[1]?.toUpperCase() ?? a.tipo)} · ${tamanho(a.tamanho)} · ${esc(a.quem)} · ${new Date(a.quando).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></span>
        <span class="dv2-anexo-acoes">${podeVer(a.tipo) ? `<button type="button" class="ak-btn" data-dv2-anexo-ver="${a.id}">${L(eye)}<span>Ver</span></button>` : ''}<a class="ak-btn" href="${a.dados}" download="${esc(a.nome)}">${L(download)}<span>Descarregar</span></a>${escreve ? `<button type="button" class="ak-btn" data-dv2-anexo-x="${a.id}" aria-label="Remover ${esc(a.nome)}">${L(trash)}<span>Remover</span></button>` : ''}</span></li>`).join('')}</ul>`
      : `<p class="lf2-sem">${L(paperclip)}Sem anexos. Carrega a proposta, a tabela de preços ou a confirmação do fornecedor (até ${tamanho(MAX_ANEXO)} neste protótipo).</p>`}
  </div>`;
}
async function carregarAnexos(r: HTMLElement, e: EstDoc, fs: FileList): Promise<void> {
  const c = cfgDe(r), d = ativoDe(r, e); if (!d) return;
  e.extra.anexoErro = undefined;
  for (const f of [...fs]) {
    e.extra.anexoProgresso = 0; inspetor(r, e);
    try {
      const a = await anexar(c.docAnexo(d), f, PERFIS[e.perfil].pessoa, (p) => { e.extra.anexoProgresso = p; const b = r.querySelector<HTMLElement>('.dv2-progresso i'); if (b) b.style.transform = `scaleX(${p})`; });
      e.extra.anexoProgresso = undefined; inspetor(r, e); toast(r, `«${a.nome}» anexado a ${d.numero}.`);
      const li = r.querySelector<HTMLElement>('.dv2-anexos-l li'); if (li && !quieto()) li.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
    } catch (x) { e.extra.anexoProgresso = undefined; e.extra.anexoErro = (x as Error).message; inspetor(r, e); }
  }
}
function verAnexo(r: HTMLElement, id: string): void {
  const a = anexo(id); if (!a) return;
  const corpo = a.tipo.startsWith('image/') ? `<img class="dv2-ver-img" src="${a.dados}" alt="${esc(a.nome)}">` : a.tipo === 'application/pdf' ? `<iframe class="dv2-ver-pdf" src="${a.dados}" title="${esc(a.nome)}"></iframe>` : `<pre class="dv2-ver-txt">${esc(atob(a.dados.split(',')[1] ?? '').slice(0, 20000))}</pre>`;
  dialogo(r, `<h2 id="dv2-dlg-t">${L(eye)}${esc(a.nome)}</h2><p class="lf2-dlg-sub">${tamanho(a.tamanho)} · ${esc(a.quem)}</p>${corpo}<div class="lf2-dlg-acoes"><a class="ak-btn ak-btn--linha" href="${a.dados}" download="${esc(a.nome)}">${L(download)}<span>Descarregar</span></a><button type="button" class="ak-btn ak-btn--acao" data-dv2-dlg-fechar data-dv2-primeiro>${L(xIc)}<span>Fechar</span><kbd>Esc</kbd></button></div>`);
  r.querySelector('.lf2-dlg')?.classList.add('lf2-dlg--largo');
}

/* ---------- a ficha ---------- */
function trilho(r: HTMLElement, e: EstDoc): void {
  const c = cfgDe(r), t = r.querySelector<HTMLElement>('[data-dv2-trilho]')!;
  t.hidden = !e.ficha;
  t.innerHTML = e.ficha ? `<button type="button" class="hm-caminho-ir" data-dv2-acao="fechar-ficha">${L(arrowLeft)}${esc(c.titulo)}</button><i>›</i><b>${e.ficha.modo === 'criar' ? `Novo ${c.um}` : esc(e.ficha.ref)}</b>${e.ficha.sujo ? '<span class="dv2-sujo" title="Alterações por gravar">●</span>' : ''}` : '';
}
export function abrirFicha(r: HTMLElement, e: EstDoc, modo: Ficha['modo'], d?: Doc): void {
  const c = cfgDe(r), lista = r.querySelector<HTMLElement>('[data-dv2-lista]')!, fx = r.querySelector<HTMLElement>('[data-dv2-ficha]')!;
  const origem = d ? r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(d.id)}"]`) : r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="novo"]');
  const de_ = origem?.getBoundingClientRect();
  e.ficha = { modo, ref: d ? String(d.numero) : '', sujo: false, erro: '', campo: '' };
  fx.innerHTML = c.ficha(e, e.ficha, d); fx.hidden = false; lista.hidden = true; trilho(r, e); estado(r, e);
  /* a ficha nasce da linha (ou do botão Novo): só transform e opacity */
  const card = fx.querySelector<HTMLElement>('.dv2-ficha-c');
  if (card && de_ && !quieto()) { const p = card.getBoundingClientRect(); card.animate([{ transform: `translate(${de_.left - p.left}px, ${de_.top - p.top}px) scale(${Math.max(.2, de_.width / p.width)}, ${Math.max(.04, de_.height / p.height)})`, opacity: .35, transformOrigin: '0 0' }, { transform: 'none', opacity: 1, transformOrigin: '0 0' }], { duration: 280, easing: 'cubic-bezier(.22, 1, .36, 1)' }); }
  c.acao(r, e, '_ficha-aberta', fx);
  (fx.querySelector<HTMLElement>('[data-dv2-ff]:not([disabled]):not([readonly])') ?? fx.querySelector<HTMLElement>('button'))?.focus({ preventScroll: true });
  scrollTo({ top: 0 });
}
export function fecharFicha(r: HTMLElement, e: EstDoc, forcar = false, ref = ''): void {
  if (!e.ficha) return;
  if (e.ficha.sujo && !forcar) {
    dialogo(r, `<h2 id="dv2-dlg-t">${L(circleAlert)}Há alterações por gravar</h2><p>Se fechares agora, o que escreveste nesta ficha perde-se. ${e.ficha.modo === 'criar' ? `${cfgDe(r).o === 'a' ? 'A' : 'O'} ${cfgDe(r).um} não chega a ser ${cfgDe(r).o === 'a' ? 'criada' : 'criado'}.` : 'O documento fica como estava.'}</p>
      <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar data-dv2-primeiro>${L(pencil)}<span>Continuar a editar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--perigo" data-dv2-acao="descartar">${L(trash)}<span>Descartar alterações</span></button></div>`);
    return;
  }
  const lista = r.querySelector<HTMLElement>('[data-dv2-lista]')!, fx = r.querySelector<HTMLElement>('[data-dv2-ficha]')!;
  e.ficha = undefined; fx.hidden = true; fx.innerHTML = ''; lista.hidden = false; trilho(r, e);
  if (ref) e.ativo = ref;
  tudo(r, e);
  const tr = r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(e.ativo)}"]`);
  if (tr) { tr.focus({ preventScroll: true }); tr.scrollIntoView({ block: 'nearest' }); if (!quieto()) tr.querySelectorAll('td').forEach((td) => td.animate([{ backgroundColor: 'color-mix(in srgb, var(--h-laranja) 22%, var(--h-sup))' }, { backgroundColor: '' }], { duration: 900, easing: 'ease-out' })); }
}
async function gravarFicha(r: HTMLElement, e: EstDoc): Promise<void> {
  const f = e.ficha; if (!f || e.ocupado) return;
  const fx = r.querySelector<HTMLElement>('[data-dv2-ficha]')!, b = fx.querySelector<HTMLElement>('[data-dv2-acao="gravar"]');
  e.ocupado = 'gravar'; e.extra.ocupadoTexto = 'A gravar…'; b?.classList.add('is-carregar'); b?.setAttribute('aria-disabled', 'true'); estado(r, e);
  fx.querySelectorAll('[aria-invalid="true"]').forEach((x) => x.removeAttribute('aria-invalid'));
  await new Promise((ok) => requestAnimationFrame(() => ok(null)));
  try {
    const { ref, msg } = cfgDe(r).gravar(r, e, f);
    e.ocupado = ''; f.sujo = false; fecharFicha(r, e, true, ref); toast(r, msg);
  } catch (x) {
    e.ocupado = ''; b?.classList.remove('is-carregar'); b?.removeAttribute('aria-disabled');
    const m = x instanceof Recusa ? x.message : 'Não foi possível gravar. Nada se gravou; as alterações continuam na ficha.';
    const caixa = fx.querySelector<HTMLElement>('[data-dv2-ficha-erro]'); if (caixa) { caixa.hidden = false; caixa.innerHTML = `${L(circleAlert)}<span>${esc(m)}</span>`; }
    const campo = (x as { campo?: string }).campo; if (campo) { const el = fx.querySelector<HTMLElement>(`[data-dv2-ff="${campo}"]`); el?.setAttribute('aria-invalid', 'true'); el?.focus(); }
    estado(r, e);
  }
}

/* ---------- anular ---------- */
function dlgAnular(r: HTMLElement, e: EstDoc): void {
  const c = cfgDe(r), d = ativoDe(r, e); if (!d) return;
  const [t, txt] = c.anular.texto(d);
  dialogo(r, `<h2 id="dv2-dlg-t" class="is-perigo">${L(ban)}${esc(t)}</h2><p>${txt}</p>
    <label class="ak-campo dv2-motivo" for="dv2-motivo"><span>Motivo (obrigatório)</span><textarea id="dv2-motivo" rows="3" maxlength="300" data-dv2-motivo data-dv2-primeiro placeholder="Porque se anula — fica no histórico"></textarea></label>
    <p class="ak-erro-campo" data-dv2-dlg-erro role="alert" hidden></p>
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Manter</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--perigo" data-dv2-acao="anular-sim">${L(ban)}<span>Anular</span></button></div>`);
}
function anularSim(r: HTMLElement, e: EstDoc): void {
  const c = cfgDe(r), d = ativoDe(r, e), m = r.querySelector<HTMLTextAreaElement>('[data-dv2-motivo]'), erro = r.querySelector<HTMLElement>('[data-dv2-dlg-erro]'); if (!d || !m || !erro) return;
  try { const msg = c.anular.fazer(e, d, m.value); fecharDialogo(r); tudo(r, e, true); toast(r, msg); }
  catch (x) { erro.hidden = false; erro.textContent = x instanceof Recusa ? x.message : 'Não foi possível anular. Nada mudou.'; m.setAttribute('aria-invalid', 'true'); m.focus(); }
}

/* ---------- exportar e atualizar ---------- */
function exportar(r: HTMLElement, e: EstDoc): void {
  const c = cfgDe(r), ls = filtradas(r, e), cs = vis(c, e);
  try {
    const linhas: Celula[][] = ls.map((d) => cs.map((x): Celula => { const v = c.valor(d, x.k); return x.tipo === 'data' && v ? { data: String(v) } : x.tipo === 'eur' && typeof v === 'number' ? { euros: v } : typeof v === 'number' ? v : v === '' || v == null ? null : String(v); }));
    const nome = `${c.titulo.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    descarregar(xlsx({ nome: c.titulo.slice(0, 30), colunas: cs.map((x) => x.t), linhas, larguras: cs.map((x) => Math.round((e.larg[x.k] ?? x.w) / 7)) }), nome);
    e.aviso = `Exportado: ${nome} · ${nf(ls.length)} linhas, ${cs.length} colunas.`; estado(r, e); toast(r, e.aviso);
  } catch { toast(r, 'A exportação falhou. A lista fica; tenta outra vez.'); }
}
export function atualizar(r: HTMLElement, e: EstDoc): void {
  if (e.fase === 'atualizar') { toast(r, 'A lista já está a ser lida.'); return; }
  e.fase = 'atualizar'; grelha(r, e); estado(r, e);
  requestAnimationFrame(() => requestAnimationFrame(() => { e.fase = 'ok'; e.erro = undefined; tudo(r, e, true); toast(r, 'Lista atualizada.'); }));
}
function mudarModo(r: HTMLElement, e: EstDoc, k: Modo): void {
  if (e.modo !== k) { e.modo = k; e.ordem = []; e.q = ''; filtrosNaPagina(r, e); const b = r.querySelector<HTMLElement>(`[data-dv2-modo="${k}"]`); if (b && !quieto()) b.animate([{ transform: 'scale(.94)' }, { transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.22, 1, .36, 1)' }); grelha(r, e, true); resumo(r, e); inspetor(r, e); estado(r, e); guardarVista(r, e); }
  const q = r.querySelector<HTMLInputElement>('[data-dv2-q]'); q?.focus();
  if (q && !quieto()) q.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
}
function mudarComp(r: HTMLElement, e: EstDoc, k: 'inicio' | 'contem'): void { e.comp = k; filtrosNaPagina(r, e); grelha(r, e, true); resumo(r, e); estado(r, e); guardarVista(r, e); r.querySelector<HTMLInputElement>('[data-dv2-q]')?.focus(); }

/* ---------- o estado de partida de cada cenário ---------- */
function armar(r: HTMLElement): void {
  if (estados.has(r) || !CFGS.get(r.dataset.dv2!)) return;
  const c = cfgDe(r), e = de(r), cen = r.dataset.dv2Cenario ?? 'normal', aVista = !!r.closest('.ecra:not([hidden]) > .versao:not([hidden])');
  if (cen === 'normal' && !e.editor) {
    const q = repor(r, e);
    if (q && Date.now() - q < 12 * 3600_000) { const x = r.querySelector<HTMLElement>('[data-dv2-restaurada]')!; x.hidden = false; x.innerHTML = `${L(undo)}Reposta como a deixaste às ${new Date(q).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`; window.setTimeout(() => { x.hidden = true; }, 5000); }
  }
  switch (cen) {
    case 'carregar': e.fase = 'carregar'; break;
    case 'vazia': e.vazia = true; break;
    case 'sem-resultados': e.q = '2025/9'; break;
    case 'servidor': e.fase = 'erro'; e.erro = 'servidor'; break;
    case 'offline': e.fase = 'erro'; e.erro = 'offline'; break;
    case 'sessao': e.fase = 'erro'; e.erro = 'sessao'; break;
    case 'permissao': e.perfil = 'armazem'; e.aviso = `O teu perfil (Armazém) só consulta ${c.o === 'a' ? 'as' : 'os'} ${c.um}s: não cria, não edita nem anula.`; break;
    case 'restaurada': { e.modo = 'descricao'; e.comp = 'contem'; const x = r.querySelector<HTMLElement>('[data-dv2-restaurada]')!; x.hidden = false; x.innerHTML = `${L(undo)}Reposta como a deixaste às 09:12`; break; }
    default: break;
  }
  c.cenario(r, e, cen);
  tudo(r, e);
  if (cen === 'criar' || cen === 'por-gravar' || cen === 'gravar-falhou' || cen === 'a-gravar') { abrirFicha(r, e, 'criar'); if (cen !== 'criar') { e.ficha!.sujo = true; trilho(r, e); } }
  if (cen === 'editar') { const d = ativoDe(r, e); if (d) abrirFicha(r, e, 'editar', d); }
  if (cen === 'por-gravar') fecharFicha(r, e);
  if (cen === 'a-gravar') { e.ocupado = 'gravar'; e.extra.ocupadoTexto = 'A gravar…'; const b = r.querySelector<HTMLElement>('[data-dv2-ficha] [data-dv2-acao="gravar"]'); b?.classList.add('is-carregar'); b?.setAttribute('aria-disabled', 'true'); estado(r, e); }
  if (cen === 'gravar-falhou') { const x = r.querySelector<HTMLElement>('[data-dv2-ficha-erro]'); if (x) { x.hidden = false; x.innerHTML = `${L(circleAlert)}<span>Não foi possível gravar: o servidor não respondeu (ERP-COMP-503). Nada se gravou; as alterações continuam na ficha.</span>`; } }
  if (cen === 'gravado') { e.aviso = `${c.o === 'a' ? 'A' : 'O'} ${c.um} ${String(ativoDe(r, e)?.numero ?? '')} foi ${c.o === 'a' ? 'gravada' : 'gravado'}.`; estado(r, e); }
  if (cen === 'anular') dlgAnular(r, e);
  if (cen === 'anexos' || cen === 'anexo-enviar' || cen === 'anexo-falhou') { e.tab = 'anexos'; if (cen === 'anexo-enviar') e.extra.anexoProgresso = .42; if (cen === 'anexo-falhou') e.extra.anexoErro = `«tabela-precos-2027.pdf» tem 4,2 MB; neste protótipo o limite é ${tamanho(MAX_ANEXO)}.`; inspetor(r, e); }
  if (cen === 'imprimir') { e.aviso = 'A preparar a impressão: só a lista, com as colunas à vista.'; estado(r, e); }
  if (!e.editor && cen === 'normal' && aVista && !quieto()) r.classList.add('lf2-entra');
  if (!e.editor && cen === 'normal' && aVista && (emSeparador() || location.hash.includes('so=ecra'))) requestAnimationFrame(() => r.querySelector<HTMLElement>('[data-dv2-q]')?.focus({ preventScroll: true }));
}
const armarTodos = () => document.querySelectorAll<HTMLElement>('[data-dv2]').forEach(armar);

/* ---------- o teclado da grelha ---------- */
function teclaGrelha(r: HTMLElement, e: EstDoc, ev: KeyboardEvent, tr: HTMLElement): void {
  const ls = filtradas(r, e), i = ls.findIndex((d) => d.id === tr.dataset.dv2Id);
  const ir = (j: number, estender = false) => {
    const k = Math.max(0, Math.min(ls.length - 1, j)); if (k === i && !estender) return;
    if (estender) { const a = ls.findIndex((d) => d.id === String(e.extra.ancora ?? ls[i].id)); if (e.extra.ancora === undefined) e.extra.ancora = ls[i].id; e.sel = new Set(ls.slice(Math.min(a, k), Math.max(a, k) + 1).map((d) => d.id)); } else e.extra.ancora = undefined;
    if (estender || r.querySelector<HTMLElement>('[data-dv2-grelha]')!.dataset.dv2Virtual) grelha(r, e);
    e.ativo = ''; escolher(r, e, ls[k].id); estado(r, e);
  };
  const pagina = Math.max(1, Math.floor((r.querySelector<HTMLElement>('[data-dv2-grelha]')!.clientHeight - 40) / (e.dens === 'compacta' ? 34 : 42)));
  switch (ev.key) {
    case 'ArrowDown': ev.preventDefault(); ir(i + 1, ev.shiftKey); break;
    case 'ArrowUp': ev.preventDefault(); ir(i - 1, ev.shiftKey); break;
    case 'PageDown': ev.preventDefault(); ir(i + pagina); break;
    case 'PageUp': ev.preventDefault(); ir(i - pagina); break;
    case 'Home': ev.preventDefault(); ir(0); break;
    case 'End': ev.preventDefault(); ir(ls.length - 1); break;
    case ' ': { ev.preventDefault(); const id = ls[i].id; if (e.sel.has(id)) e.sel.delete(id); else e.sel.add(id); tr.setAttribute('aria-selected', String(e.sel.has(id))); const x = tr.querySelector<HTMLInputElement>('[data-dv2-escolher]'); if (x) x.checked = e.sel.has(id); estado(r, e); break; }
    case 'Enter': ev.preventDefault(); abrirFicha(r, e, 'editar', ls[i]); break;
    default: break;
  }
}

/* ---------- os ouvintes ---------- */
export function iniciar(): void {
  requestAnimationFrame(armarTodos);
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, () => requestAnimationFrame(armarTodos)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armarTodos));
  window.addEventListener('online', () => document.querySelectorAll<HTMLElement>('[data-dv2]').forEach((r) => { const e = estados.get(r); if (e?.erro === 'offline') toast(r, 'A ligação voltou. Tenta outra vez.'); }));

  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando() || ev.detail === -1) return;
    const c = cfgDe(r), e = de(r); let b: HTMLElement | null;
    if (t.closest('.lf2-dlg-fundo') && !t.closest('.lf2-dlg')) { fecharDialogo(r); return; }
    if (!t.closest('.ak-menu-c')) fecharMenus(r);
    if ((b = t.closest('[data-dv2-acao][aria-disabled="true"]'))) { toast(r, b.title || 'Não disponível.'); return; }
    if (t.closest('[data-dv2-dlg-fechar]')) { fecharDialogo(r); return; }
    if ((b = t.closest('[data-dv2-modo]'))) { mudarModo(r, e, b.dataset.dv2Modo as Modo); return; }
    if ((b = t.closest('[data-dv2-comp]'))) { mudarComp(r, e, b.dataset.dv2Comp as 'inicio' | 'contem'); return; }
    if ((b = t.closest('[data-dv2-tirar]'))) { const k = b.dataset.dv2Tirar!; if (k === 'q') e.q = ''; else if (k === 'colunas') e.filtrosCol = {}; else if (k === 'periodo') { e.f.de = ''; e.f.ate = ''; } else (e.f as unknown as Record<string, string>)[k] = ''; tudo(r, e, true); guardarVista(r, e); return; }
    if ((b = t.closest('[data-dv2-tab]'))) { e.tab = b.dataset.dv2Tab!; inspetor(r, e, true); guardarVista(r, e); return; }
    if ((b = t.closest('[data-dv2-dens]'))) { e.dens = b.dataset.dv2Dens as EstDoc['dens']; grelha(r, e); menuMais(r, e); guardarVista(r, e); return; }
    if ((b = t.closest('[data-dv2-mover]'))) { const [k, d] = b.dataset.dv2Mover!.split(':'), i = e.cols.indexOf(k), j = i + +d; if (j >= 1 && j < e.cols.length) { [e.cols[i], e.cols[j]] = [e.cols[j], e.cols[i]]; grelha(r, e); menuMais(r, e); guardarVista(r, e); r.querySelector<HTMLElement>(`[data-dv2-mover="${k}:${d}"]`)?.focus(); } return; }
    if ((b = t.closest('[data-dv2-ordenar]'))) { const k = b.dataset.dv2Ordenar!, o = e.ordem.find((x) => x.k === k); if ((ev as MouseEvent).shiftKey) { if (o) o.dir = o.dir === 1 ? -1 : 1; else e.ordem.push({ k, dir: 1 }); } else e.ordem = [{ k, dir: o && e.ordem.length === 1 && o.dir === 1 ? -1 : 1 }]; grelha(r, e, true); guardarVista(r, e); return; }
    if ((b = t.closest('[data-dv2-todas]'))) { const on = (b as HTMLInputElement).checked; filtradas(r, e).forEach((d) => on ? e.sel.add(d.id) : e.sel.delete(d.id)); grelha(r, e); estado(r, e); return; }
    if ((b = t.closest('[data-dv2-escolher]'))) { const id = b.dataset.dv2Escolher!; if ((b as HTMLInputElement).checked) e.sel.add(id); else e.sel.delete(id); b.closest('tr')?.setAttribute('aria-selected', String(e.sel.has(id))); estado(r, e); return; }
    if ((b = t.closest('[data-dv2-ver]'))) { const k = b.dataset.dv2Ver!; if ((b as HTMLInputElement).checked) e.ocultas.delete(k); else e.ocultas.add(k); grelha(r, e); guardarVista(r, e); return; }
    if ((b = t.closest('[data-dv2-anexo-ver]'))) { verAnexo(r, b.dataset.dv2AnexoVer!); return; }
    if ((b = t.closest('[data-dv2-anexo-x]'))) { const a = anexo(b.dataset.dv2AnexoX!); if (!a) return; dialogo(r, `<h2 id="dv2-dlg-t" class="is-perigo">${L(trash)}Remover «${esc(a.nome)}»?</h2><p>O ficheiro deixa de estar anexado. O documento não muda.</p><div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar data-dv2-primeiro>${L(xIc)}<span>Manter</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--perigo" data-dv2-anexo-sim="${a.id}">${L(trash)}<span>Remover</span></button></div>`); return; }
    if ((b = t.closest('[data-dv2-anexo-sim]'))) { const ok = removerAnexo(b.dataset.dv2AnexoSim!); fecharDialogo(r); inspetor(r, e); toast(r, ok ? 'Anexo removido.' : 'Não foi possível remover o anexo.'); return; }
    if ((b = t.closest('[data-dv2-acao]'))) {
      const k = b.dataset.dv2Acao!;
      if (c.acao(r, e, k, b)) return;
      switch (k) {
        case 'mais': abrirMenu(r, 'mais'); return;
        case 'novo': abrirFicha(r, e, 'criar'); return;
        case 'editar': { const d = ativoDe(r, e); if (d) abrirFicha(r, e, 'editar', d); return; }
        case 'anular': dlgAnular(r, e); return;
        case 'anular-sim': anularSim(r, e); return;
        case 'atualizar': atualizar(r, e); return;
        case 'repetir': e.fase = 'ok'; e.erro = undefined; atualizar(r, e); return;
        case 'imprimir': window.print(); return;
        case 'anexos': if (e.ficha) fecharFicha(r, e); e.tab = 'anexos'; inspetor(r, e, true); r.querySelector<HTMLElement>('[data-dv2-insp]')?.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' }); r.querySelector<HTMLElement>('[data-dv2-tab="anexos"]')?.focus({ preventScroll: true }); return;
        case 'carregar-anexo': r.querySelector<HTMLInputElement>('[data-dv2-ficheiro]')?.click(); return;
        case 'limpar': e.f = F0(); e.q = ''; e.filtrosCol = {}; tudo(r, e, true); guardarVista(r, e); r.querySelector<HTMLElement>('[data-dv2-q]')?.focus(); return;
        case 'limpar-q': e.q = ''; tudo(r, e, true); guardarVista(r, e); r.querySelector<HTMLElement>('[data-dv2-q]')?.focus(); return;
        case 'todas-colunas': e.cols = c.cols.map((x) => x.k); e.ocultas = new Set(c.cols.filter((x) => !c.verIniciais.includes(x.k)).map((x) => x.k)); tudo(r, e); guardarVista(r, e); return;
        case 'mais-filtros': { const av = r.querySelector<HTMLElement>('[data-dv2-av]')!, abrir = av.hidden; av.hidden = !abrir; b.setAttribute('aria-expanded', String(abrir)); if (abrir) { if (!quieto()) av.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'cubic-bezier(.22, 1, .36, 1)' }); av.querySelector<HTMLElement>('[data-dv2-campo]')?.focus(); } return; }
        case 'filtros-col': e.filtrosAbertos = !e.filtrosAbertos; fecharMenus(r); if (!e.filtrosAbertos) e.filtrosCol = {}; tudo(r, e); if (e.filtrosAbertos) r.querySelector<HTMLElement>('[data-dv2-fcol]')?.focus(); return;
        case 'excel': fecharMenus(r); exportar(r, e); return;
        case 'gravar': void gravarFicha(r, e); return;
        case 'fechar-ficha': fecharFicha(r, e); return;
        case 'descartar': fecharDialogo(r); fecharFicha(r, e, true); return;
        default: return;
      }
    }
    if ((b = t.closest('tr[data-dv2-id]')) && !t.closest('input, a, button')) escolher(r, e, b.dataset.dv2Id!);
  });
  document.addEventListener('dblclick', (ev) => { const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const tr = t.closest<HTMLElement>('tr[data-dv2-id]'); if (!tr || t.closest('input')) return; const e = de(r), d = filtradas(r, e).find((x) => x.id === tr.dataset.dv2Id); if (d) abrirFicha(r, e, 'editar', d); });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.matches('[data-dv2-ficheiro]')) { const fs = (t as HTMLInputElement).files; if (fs?.length) void carregarAnexos(r, e, fs); (t as HTMLInputElement).value = ''; return; }
    if (t.matches('[data-dv2-f]')) { (e.f as unknown as Record<string, string>)[t.dataset.dv2F!] = (t as HTMLInputElement).value; filtrosNaPagina(r, e); grelha(r, e, true); resumo(r, e); inspetor(r, e); estado(r, e); guardarVista(r, e); }
  });
  let espera = 0;
  document.addEventListener('input', (ev) => {
    const t = ev.target as HTMLInputElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    if (t.closest('[data-dv2-ficha]') && e.ficha) { if (!e.ficha.sujo) { e.ficha.sujo = true; trilho(r, e); estado(r, e); } cfgDe(r).acao(r, e, '_ficha-input', t); return; }
    if (t.matches('[data-dv2-q], [data-dv2-fcol]')) {
      clearTimeout(espera);
      espera = window.setTimeout(() => {
        if (t.matches('[data-dv2-q]')) e.q = t.value.trim(); else e.filtrosCol[t.dataset.dv2Fcol!] = t.value;
        const foco = t.matches('[data-dv2-fcol]') ? t.dataset.dv2Fcol : '';
        grelha(r, e, true); resumo(r, e); etiquetas(r, e); inspetor(r, e); estado(r, e); guardarVista(r, e);
        if (foco) { const n = r.querySelector<HTMLInputElement>(`[data-dv2-fcol="${foco}"]`); n?.focus(); n?.setSelectionRange(n.value.length, n.value.length); }
      }, 140);
    }
  });
  document.addEventListener('scroll', (ev) => { const g = ev.target as HTMLElement; if (!(g instanceof HTMLElement) || !g.matches('[data-dv2-grelha]') || !g.dataset.dv2Virtual) return; const r = raiz(g); if (r) requestAnimationFrame(() => grelha(r, de(r))); }, true);
  window.addEventListener('beforeunload', (ev) => { const r = visivel(); if (r && estados.get(r)?.ficha?.sujo) { ev.preventDefault(); } });

  document.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t) ?? visivel(); if (!r || editando()) return;
    const c = cfgDe(r), e = de(r), dlg = r.querySelector<HTMLElement>('[data-dv2-dlg]')!;
    if (!dlg.hidden) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharDialogo(r); return; }
      if (ev.key === 'Tab') { const fs = [...dlg.querySelectorAll<HTMLElement>('input, select, textarea, button, a[href]')].filter((x) => !x.closest('[hidden]')); const i = fs.indexOf(t); if (ev.shiftKey && i <= 0) { ev.preventDefault(); fs[fs.length - 1]?.focus(); } else if (!ev.shiftKey && i === fs.length - 1) { ev.preventDefault(); fs[0]?.focus(); } }
      if (ev.key === 'Enter' && ev.ctrlKey) { const s = dlg.querySelector<HTMLElement>('.ak-btn--perigo, .ak-btn--acao'); if (s) { ev.preventDefault(); s.click(); } }
      if (/^F\d+$/.test(ev.key)) ev.preventDefault();
      return;
    }
    const tecla = `${ev.ctrlKey ? 'Ctrl+' : ''}${ev.shiftKey ? 'Shift+' : ''}${ev.key}`;
    if (ev.key === 'Escape') {
      if (fecharMenus(r)) { ev.preventDefault(); return; }
      if (e.ficha) { ev.preventDefault(); fecharFicha(r, e); return; }
      if (e.filtrosAbertos) { e.filtrosAbertos = false; e.filtrosCol = {}; tudo(r, e); ev.preventDefault(); }
      return;
    }
    const menu = t.closest<HTMLElement>('[data-dv2-menu]');
    if (menu && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) { ev.preventDefault(); const bs = [...menu.querySelectorAll<HTMLElement>('button:not(:disabled):not([hidden])')], i = bs.indexOf(t); bs[(i + (ev.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]?.focus(); return; }
    /* as teclas próprias do documento (Ctrl+F2, Shift+F11…) */
    const prop = c.teclas.find((x) => x.tecla === tecla);
    if (prop) { ev.preventDefault(); const b = r.querySelector<HTMLElement>(`[data-dv2-acao="${prop.acao}"]`) ?? r; if (b.getAttribute('aria-disabled') === 'true') toast(r, b.title || 'Não disponível.'); else c.acao(r, e, prop.acao, b); return; }
    if (/^F\d+$/.test(ev.key) && !ev.altKey && !ev.metaKey) {
      if (ev.shiftKey && !ev.ctrlKey) { if (ev.key === 'F1' || ev.key === 'F2') { ev.preventDefault(); if (!e.ficha) mudarComp(r, e, ev.key === 'F1' ? 'inicio' : 'contem'); } return; }
      if (ev.ctrlKey || ev.shiftKey) return;
      const m = MODOS.find((x) => x.tecla === ev.key);
      if (m) { ev.preventDefault(); if (e.ficha) toast(r, 'Fecha a ficha para pesquisar (Esc).'); else mudarModo(r, e, m.k); return; }
      if (ev.key === 'F4') { ev.preventDefault(); const s = r.querySelector<HTMLSelectElement>('[data-dv2-f="serie"]'); if (s && !e.ficha) { s.focus(); try { s.showPicker(); } catch { /* sem showPicker */ } } return; }
      const barra: Record<string, string> = { F5: 'novo', F6: 'editar', F8: 'anular', F9: 'atualizar', F11: 'imprimir' };
      if (barra[ev.key]) { ev.preventDefault(); r.querySelector<HTMLElement>(`.dv2-barra [data-dv2-acao="${barra[ev.key]}"]`)?.click(); }
      return;
    }
    /* Ctrl+Enter grava a ficha */
    if (ev.key === 'Enter' && ev.ctrlKey && e.ficha) { ev.preventDefault(); void gravarFicha(r, e); return; }
    /* Enter passa ao campo seguinte (na lista e na ficha); na pesquisa, vai para a lista */
    if (ev.key === 'Enter' && t.matches('[data-dv2-campo]')) {
      ev.preventDefault();
      if (t.matches('[data-dv2-q]')) { clearTimeout(espera); e.q = (t as HTMLInputElement).value.trim(); tudo(r, e, true); guardarVista(r, e); r.querySelector<HTMLElement>('tr.is-ativo')?.focus(); return; }
      const cs = [...r.querySelectorAll<HTMLElement>('[data-dv2-lista] [data-dv2-campo]')].filter((x) => !x.closest('[hidden]')), i = cs.indexOf(t);
      (i >= 0 && i < cs.length - 1 ? cs[i + 1] : r.querySelector<HTMLElement>('[data-dv2-q]'))?.focus(); return;
    }
    if (ev.key === 'Enter' && t.matches('[data-dv2-ff]') && !t.matches('textarea')) {
      ev.preventDefault();
      const cs = [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-ff]')].filter((x) => !x.closest('[hidden]') && !x.hasAttribute('disabled') && !x.hasAttribute('readonly')), i = cs.indexOf(t);
      if (i >= 0 && i < cs.length - 1) cs[i + 1].focus(); else r.querySelector<HTMLElement>('[data-dv2-ficha] [data-dv2-acao="gravar"]')?.focus();
      return;
    }
    if (t.matches('[data-dv2-tab]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.preventDefault(); const ks = c.tabs.map((x) => x.k), i = ks.indexOf(e.tab); e.tab = ks[(i + (ev.key === 'ArrowRight' ? 1 : ks.length - 1)) % ks.length]; inspetor(r, e, true); r.querySelector<HTMLElement>(`[data-dv2-tab="${e.tab}"]`)?.focus(); return; }
    if (t.matches('[data-dv2-div]') && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) { ev.preventDefault(); e.alt = Math.max(200, Math.min(900, e.alt + (ev.key === 'ArrowDown' ? 24 : -24))); r.style.setProperty('--lf2-alt', `${e.alt}px`); t.setAttribute('aria-valuenow', String(e.alt)); guardarVista(r, e); return; }
    const tr = t.closest<HTMLElement>('tr[data-dv2-id]'); if (tr && t === tr) teclaGrelha(r, e, ev, tr);
  });

  /* alargar colunas, a altura da lista e reordenar colunas */
  document.addEventListener('pointerdown', (ev) => {
    const t = ev.target as HTMLElement, r = raiz(t); if (!r || editando()) return; const e = de(r);
    const h = t.closest<HTMLElement>('[data-dv2-redim]');
    if (h) {
      ev.preventDefault(); ev.stopPropagation(); const k = h.dataset.dv2Redim!, col = r.querySelector<HTMLElement>(`col[data-dv2-w="${k}"]`)!, x0 = ev.clientX, w0 = col.getBoundingClientRect().width || 100;
      const mover = (m: PointerEvent) => { e.larg[k] = Math.max(56, Math.round(w0 + m.clientX - x0)); col.style.width = `${e.larg[k]}px`; };
      const largar = () => { document.removeEventListener('pointermove', mover); document.removeEventListener('pointerup', largar); guardarVista(r, e); };
      document.addEventListener('pointermove', mover); document.addEventListener('pointerup', largar); return;
    }
    const d = t.closest<HTMLElement>('[data-dv2-div]');
    if (d) {
      ev.preventDefault(); const y0 = ev.clientY, a0 = e.alt; d.setPointerCapture(ev.pointerId); r.classList.add('a-redimensionar');
      const mover = (m: PointerEvent) => { e.alt = Math.max(200, Math.min(900, Math.round(a0 + m.clientY - y0))); r.style.setProperty('--lf2-alt', `${e.alt}px`); };
      const largar = () => { d.removeEventListener('pointermove', mover); d.removeEventListener('pointerup', largar); r.classList.remove('a-redimensionar'); d.setAttribute('aria-valuenow', String(e.alt)); guardarVista(r, e); };
      d.addEventListener('pointermove', mover); d.addEventListener('pointerup', largar);
    }
  });
  let arrastada = '';
  document.addEventListener('dragstart', (ev) => { const th = (ev.target as HTMLElement).closest?.<HTMLElement>('th[data-dv2-col]'); if (!th || !raiz(th) || editando()) return; arrastada = th.dataset.dv2Col!; ev.dataTransfer?.setData('text/plain', arrastada); th.classList.add('is-arrastada'); });
  document.addEventListener('dragover', (ev) => { const th = (ev.target as HTMLElement).closest?.<HTMLElement>('th[data-dv2-col]'); if (th && arrastada && th.getAttribute('draggable') === 'true') { ev.preventDefault(); th.classList.add('is-alvo'); } });
  document.addEventListener('dragleave', (ev) => { (ev.target as HTMLElement).closest?.('th[data-dv2-col]')?.classList.remove('is-alvo'); });
  document.addEventListener('drop', (ev) => {
    const th = (ev.target as HTMLElement).closest?.<HTMLElement>('th[data-dv2-col]'), r = th ? raiz(th) : null; if (!th || !r || !arrastada) return; ev.preventDefault();
    const e = de(r), para = th.dataset.dv2Col!; if (para === arrastada || th.getAttribute('draggable') !== 'true') { arrastada = ''; grelha(r, e); return; }
    e.cols.splice(e.cols.indexOf(arrastada), 1); e.cols.splice(e.cols.indexOf(para), 0, arrastada); arrastada = ''; grelha(r, e, true); menuMais(r, e); guardarVista(r, e);
  });
  document.addEventListener('dragend', () => { arrastada = ''; document.querySelectorAll('th.is-arrastada, th.is-alvo').forEach((x) => x.classList.remove('is-arrastada', 'is-alvo')); });
}
export function fecharMenus(r: HTMLElement): boolean {
  let fechou = false;
  r.querySelectorAll<HTMLElement>('[data-dv2-menu]:not([hidden])').forEach((m) => { m.hidden = true; fechou = true; m.parentElement?.querySelector('[aria-haspopup]')?.setAttribute('aria-expanded', 'false'); });
  return fechou;
}
export function abrirMenu(r: HTMLElement, k: string): void {
  const m = r.querySelector<HTMLElement>(`[data-dv2-menu="${k}"]`)!, aberto = !m.hidden; fecharMenus(r);
  if (aberto) return;
  m.hidden = false; m.parentElement?.querySelector('[aria-haspopup]')?.setAttribute('aria-expanded', 'true');
  m.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
}
