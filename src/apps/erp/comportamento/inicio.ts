/* =========================================================
   ERP — 05 · Início: o comportamento (19 out. 2026)
   - O estado de cada pessoa (preferências, tarefas tratadas, avisos lidos, «Continuar onde fiquei»,
     rascunhos criados, procuras recentes) guarda-se no navegador, numa chave por pessoa
     (erp:espaco:<correio>): os recentes de uma pessoa nunca aparecem a outra. No produto é a API que
     guarda isto, por utilizador; aqui o «servidor» é uma espera curta (ESPERA) antes da resposta.
   - O perfil é o da sessão; neste protótipo escolhe-se na conta («Ver como»), e fica na sessão do
     navegador. Os estados do ecrã (05.x) trazem o que mudam em data-ws-* e isso ganha.
   - Redesenha-se com as funções de inicio.ts; as mudanças pequenas (tratar uma tarefa, escolher uma
     etapa do fluxo, ler um aviso) mexem só no sítio, para as animações correrem.
   - Animações: só opacidade e transform (nunca width/height). A barra lateral e o contexto mudam de
     largura de uma vez e o conteúdo entra com um desvanecer; ao tirar uma tarefa da lista, as linhas de
     baixo sobem com um FLIP (transform). Com «reduzir movimento», tudo é imediato.
   - Teclado: Ctrl+K (ou Cmd+K) abre a procura; ↑ ↓ Enter Esc lá dentro; setas na barra lateral;
     Alt+N «Nova encomenda a fornecedor»; Esc fecha a camada aberta e devolve o foco a quem a abriu.
   ========================================================= */
import { mostrar, mostrarVersao } from '../../../comum/ecras';
import { VERSAO_REDE } from '../entrar-rede';
import * as cp from '../compras/dominio';
import {
  corpo, casca, paginaInicio, estadoPadrao, prefsPadrao, podeTratar, blocoPrioridades, blocoContinuar, blocoFluxo, contas, doc, pode,
  menuConta, menuAvisos, menuCriar, menuEmpresa, procura, buscar, sugestoes, painel, criar, personalizar,
  type Estado, type Bloco, type Pagina,
} from '../inicio';
import { PERFIS, AVISOS, OPERACOES, ETAPAS, type IdPerfil, type Achado, type Doc, type Modulo } from '../inicio-dados';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const espera = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const ESPERA = 550;
const CHAVE_PERFIL = 'erp:perfil';
const chave = (p: IdPerfil) => `erp:espaco:${PERFIS[p].correio}`;
const ler = <T,>(k: string, s: Storage = localStorage): T | null => { try { const v = s.getItem(k); return v ? JSON.parse(v) as T : null; } catch { return null; } };
const gravar = (k: string, v: unknown, s: Storage = localStorage) => { try { s.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento: dura até recarregar */ } };

interface Guardado { prefs: Estado['prefs']; feitos: Estado['feitos']; lidas: string[]; recentes: Estado['recentes']; criados: Doc[]; procuras: Achado[] }

let raiz: HTMLElement | null = null;
let e: Estado = estadoPadrao();
let procuras: Achado[] = [];
let camada: { tipo: string; volta: HTMLElement | null } | null = null;

/** O ecrã onde se entra depois do login (o 01 v10 pergunta isto). */
export function destinoAoEntrar(): 'inicio' | 'compras' {
  const g = ler<Guardado>(chave('compras'));
  return g?.prefs?.omissao === 'compras' ? 'compras' : 'inicio';
}

/* ---------- o estado ---------- */
function carregar(r: HTMLElement): void {
  const perfil = (r.dataset.wsPerfil as IdPerfil) || ler<IdPerfil>(CHAVE_PERFIL, sessionStorage) || 'compras';
  const g = ler<Guardado>(chave(perfil));
  e = estadoPadrao(perfil);
  if (g) {
    e.prefs = { ...prefsPadrao(perfil), ...g.prefs, blocos: { ...prefsPadrao(perfil).blocos, ...g.prefs?.blocos } };
    /* operações novas que não estavam na ordem guardada vão para o fim */
    e.prefs.ordem = [...e.prefs.ordem.filter((id) => OPERACOES.some((o) => o.id === id)), ...OPERACOES.map((o) => o.id).filter((id) => !e.prefs.ordem.includes(id))];
    e.feitos = g.feitos || {}; e.lidas = g.lidas || []; e.recentes = g.recentes?.length ? g.recentes : e.recentes; e.criados = g.criados || [];
  }
  procuras = g?.procuras || [];
  e.carga = r.dataset.wsCarga as Estado['carga'];
  if (r.dataset.wsDensidadeFixa) e.prefs.densidade = r.dataset.wsDensidadeFixa as Estado['prefs']['densidade'];
  if (r.dataset.wsLadoFixo) e.prefs.lado = r.dataset.wsLadoFixo as Estado['prefs']['lado'];
  const h = new Date().getHours();
  e.saudacao = h < 6 ? 'Boa noite' : h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
}
function guardar(): void {
  gravar(chave(e.perfil), { prefs: e.prefs, feitos: e.feitos, lidas: e.lidas, recentes: e.recentes, criados: e.criados, procuras } satisfies Guardado);
}

/* ---------- as páginas: o Início e as que os módulos registam (Compras) ---------- */
let outras: ((id: string, e: Estado) => Pagina) | null = null;
export const registarPaginas = (f: typeof outras) => { outras = f; };
const idPagina = () => raiz?.dataset.wsPagina || 'inicio';
function pagina(): Pagina { const id = idPagina(); return id === 'inicio' || !outras ? paginaInicio(e) : outras(id, e); }
const desenhado = () => document.dispatchEvent(new CustomEvent('erp:desenhou', { detail: idPagina() }));

/* ---------- desenhar ---------- */
function marcarTema(): void {
  let t = 'auto'; try { t = localStorage.getItem('uiux:tema') || 'auto'; } catch { /* */ }
  raiz?.querySelectorAll<HTMLElement>('.segmented__btn[data-tema]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tema === t)));
}
function aplicarRaiz(): void {
  if (!raiz) return;
  raiz.dataset.densidade = e.prefs.densidade; raiz.dataset.lado = e.prefs.lado;
}
/** Redesenha tudo menos as camadas (menus e diálogos ficam abertos). */
function redesenhar(): void {
  if (!raiz) return;
  const lado = raiz.querySelector('.ws-lado')?.scrollTop ?? 0;
  const tmp = document.createElement('div'); tmp.innerHTML = casca(e, pagina());
  raiz.querySelector('.ws-lado')!.replaceWith(tmp.querySelector('.ws-lado')!);
  raiz.querySelector('.ws-principal')!.replaceWith(tmp.querySelector('.ws-principal')!);
  raiz.querySelector('.ws-lado')!.scrollTop = lado;
  aplicarRaiz(); marcarTema(); desenhado();
}
function trocar(sel: string, html: string): HTMLElement | null {
  const velho = raiz?.querySelector(sel); if (!velho) return null;
  const t = document.createElement('div'); t.innerHTML = html; const novo = t.firstElementChild as HTMLElement;
  velho.replaceWith(novo); return novo;
}

/* ---------- avisos curtos ---------- */
function aviso(texto: string, desfazer?: () => void): void {
  const zona = raiz?.querySelector<HTMLElement>('[data-ws-toasts]'); if (!zona) return;
  const t = document.createElement('div'); t.className = 'ws-toast';
  t.innerHTML = `<span>${texto}</span>${desfazer ? '<button type="button" class="ws-ligacao ws-toast__desfazer">Desfazer</button>' : ''}`;
  if (desfazer) t.querySelector('button')!.addEventListener('click', () => { t.remove(); desfazer(); });
  zona.appendChild(t);
  window.setTimeout(() => { t.classList.add('is-sair'); window.setTimeout(() => t.remove(), 250); }, desfazer ? 6000 : 3200);
}
const semEcra = (nome: string) => aviso(`«${nome}» ainda não tem ecrã neste protótipo.`);

/* ---------- camadas: menus, procura, painel, personalizar ---------- */
function fechar(devolver = true): void {
  if (!raiz || !camada) return;
  const c = camada; camada = null;
  const zona = raiz.querySelector<HTMLElement>('[data-ws-camadas]')!;
  const el = zona.firstElementChild as HTMLElement | null;
  raiz.querySelectorAll('[data-ws-menu][aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  if (el && !quieto()) { el.classList.add('is-sair'); window.setTimeout(() => { if (!camada) zona.innerHTML = ''; }, 160); } else zona.innerHTML = '';
  if (devolver && c.volta?.isConnected) c.volta.focus();
}
function abrir(tipo: string, html: string, volta: HTMLElement | null, junto?: HTMLElement): HTMLElement {
  const zona = raiz!.querySelector<HTMLElement>('[data-ws-camadas]')!;
  zona.innerHTML = html; camada = { tipo, volta };
  const el = zona.firstElementChild as HTMLElement;
  /* os menus ficam por baixo do botão que os abriu, encostados à direita dele, sem sair da janela */
  if (junto && el.classList.contains('ws-menu')) {
    const r = junto.getBoundingClientRect(), w = Math.min(el.offsetWidth || 340, innerWidth - 16);
    const esquerda = Math.max(8, Math.min(innerWidth - w - 8, tipo === 'empresa' ? r.left : r.right - w));
    el.style.left = `${esquerda}px`; el.style.top = `${r.bottom + 6}px`; el.style.right = 'auto';
    junto.setAttribute('aria-expanded', 'true');
  }
  const foco = el.querySelector<HTMLElement>('[data-ws-paleta-input], input:not([type=hidden]):checked, select, button:not([disabled]), input');
  requestAnimationFrame(() => foco?.focus());
  return el;
}

/* ---------- a procura (Ctrl+K) ---------- */
let procuraTempo = 0;
let resultados: Achado[] = [];
function abrirProcura(q = '', volta: HTMLElement | null = document.activeElement as HTMLElement): void {
  if (camada?.tipo === 'procura') { raiz!.querySelector<HTMLInputElement>('[data-ws-paleta-input]')?.focus(); return; }
  const el = abrir('procura', procura({ q: '', grupos: null, recentes: procuras.filter((x) => pode(e, x.modulo)).slice(0, 4), sugestoes: sugestoes(e), a: 'pronto' }), volta);
  resultados = [...procuras.filter((x) => pode(e, x.modulo)).slice(0, 4), ...sugestoes(e)];
  const inp = el.querySelector<HTMLInputElement>('[data-ws-paleta-input]')!;
  if (q) { inp.value = q; pedirProcura(q); }
}
function pedirProcura(q: string): void {
  window.clearTimeout(procuraTempo);
  const corpoP = raiz!.querySelector<HTMLElement>('.ws-paleta__corpo'); if (!corpoP) return;
  const pinta = (html: string) => { const t = document.createElement('div'); t.innerHTML = html; corpoP.innerHTML = t.querySelector('.ws-paleta__corpo')!.innerHTML; };
  const recentes = procuras.filter((x) => pode(e, x.modulo)).slice(0, 4);
  if (!q.trim()) { resultados = [...recentes, ...sugestoes(e)]; pinta(procura({ q: '', grupos: null, recentes, sugestoes: sugestoes(e), a: 'pronto' })); return; }
  /* a espera só aparece se a resposta demorar; o pedido sai 120 ms depois da última tecla */
  const mostrarEspera = window.setTimeout(() => pinta(procura({ q, grupos: null, recentes, sugestoes: [], a: 'procura' })), 200);
  procuraTempo = window.setTimeout(async () => {
    await espera(180);
    window.clearTimeout(mostrarEspera);
    const inp = raiz?.querySelector<HTMLInputElement>('[data-ws-paleta-input]');
    if (!inp || inp.value !== q) return;
    if (e.carga === 'offline' || !navigator.onLine) { resultados = recentes; pinta(procura({ q, grupos: null, recentes, sugestoes: [], a: 'erro' }) ); return; }
    const g = buscar(e, q); resultados = g.flatMap(([, xs]) => xs);
    pinta(procura({ q, grupos: g, recentes, sugestoes: [], a: g.length ? 'pronto' : 'nada' }));
    inp.setAttribute('aria-activedescendant', resultados.length ? 'ws-r-0' : '');
  }, 120);
}
function moverProcura(d: number): void {
  const ops = [...raiz!.querySelectorAll<HTMLElement>('.ws-res')]; if (!ops.length) return;
  let i = ops.findIndex((o) => o.getAttribute('aria-selected') === 'true');
  i = (i + d + ops.length) % ops.length;
  ops.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
  ops[i].scrollIntoView({ block: 'nearest' });
  raiz!.querySelector('[data-ws-paleta-input]')!.setAttribute('aria-activedescendant', ops[i].id);
}
function escolherProcura(i?: number): void {
  const ops = [...raiz!.querySelectorAll<HTMLElement>('.ws-res')];
  const el = i !== undefined ? ops[i] : ops.find((o) => o.getAttribute('aria-selected') === 'true');
  if (!el) return;
  const x = resultados[Number(el.dataset.wsRes)]; if (!x) return;
  procuras = [x, ...procuras.filter((p) => p.titulo !== x.titulo)].slice(0, 8); guardar();
  abrirAchado(x, el.querySelector<HTMLElement>('.ws-res__titulo'));
}
/** Abre o que se escolheu: o documento no painel (o título voa da lista para o painel), o ecrã, ou um aviso. */
function abrirAchado(x: Achado, de: HTMLElement | null): void {
  if (x.doc && doc(e, x.doc)) { abrirDoc(x.doc, de); return; }
  if (x.ecra) { fechar(false); irPara(x.ecra, x.ref); return; }
  if (x.tipo === 'Destinos') { fechar(); semEcra(x.titulo); return; }
  transitar(de, () => { fechar(false); abrir('painel', painel(e, '', x), null); });
}

/* ---------- ir a outro ecrã, abrir um documento ---------- */
/** Vai a outro ecrã do ERP; `ref` é o documento a abrir lá (fica na sessão, por página). */
export function irPara(ecra: string, ref?: string): void {
  if (ref) gravar(`erp:ref:${ecra}`, ref, sessionStorage);
  if (ecra === (raiz?.dataset.wsPagina || 'inicio') && !ref) { window.scrollTo({ top: 0 }); return; }
  if (saidaBloqueada && !saidaBloqueada(() => { saidaBloqueada = null; irPara(ecra, ref); })) return;
  /* no mesmo ecrã (outro documento), redesenha-se; noutro, o protótipo muda de ecrã e a casca arma-se lá */
  const mesmo = ecra === (raiz?.dataset.wsPagina || 'inicio') && !!raiz?.isConnected;
  const ir = () => { if (mesmo) redesenhar(); else { mostrar(ecra); if (ecra === 'compras') mostrarVersao('v2'); } window.scrollTo({ top: 0 }); };
  const doc_ = document as Document & { startViewTransition?: (f: () => void) => unknown };
  if (doc_.startViewTransition && !quieto()) doc_.startViewTransition(ir); else ir();
}
/** Uma página com alterações por guardar pode travar a saída: devolve false e chama `seguir` se a pessoa confirmar. */
let saidaBloqueada: ((seguir: () => void) => boolean) | null = null;
export const travarSaida = (f: typeof saidaBloqueada) => { saidaBloqueada = f; };
function transitar(de: HTMLElement | null, f: () => void): void {
  const d = document as Document & { startViewTransition?: (f: () => void) => unknown };
  if (!d.startViewTransition || quieto() || !de) { f(); return; }
  de.style.viewTransitionName = 'ws-doc';
  d.startViewTransition(() => { de.style.viewTransitionName = ''; f(); });
}
function abrirDoc(ref: string, de: HTMLElement | null = null): void {
  const d = doc(e, ref); if (!d) return;
  lembrar(ref);
  const volta = camada?.volta ?? (document.activeElement as HTMLElement);
  transitar(de, () => { if (camada) fechar(false); abrir('painel', painel(e, ref), volta); });
}
/** Abrir um documento põe-no no topo de «Continuar onde fiquei». */
function lembrar(ref: string): void {
  const d = doc(e, ref); if (!d) return;
  const velho = e.recentes.find((r) => r.doc === ref && r.tipo !== 'espaco');
  const r = velho ?? { id: 'r' + Date.now(), tipo: d.estado === 'Rascunho' ? 'rascunho' as const : 'documento' as const, titulo: `${d.ref} · ${d.entidade}`, sub: `${d.estado}${d.total ? ' · ' + d.total : ''}`, quando: 'agora', doc: ref };
  r.quando = 'agora';
  e.recentes = [r, ...e.recentes.filter((x) => x !== r)].slice(0, 8);
  guardar();
  trocar('[data-bloco="continuar"]', blocoContinuar(e));
}

/* ---------- tratar uma tarefa ---------- */
function ocupar(b: HTMLButtonElement, texto: string | null): void {
  const rot = b.querySelector<HTMLElement>('.btn__rotulo')!;
  if (texto) { b.dataset.rotulo = rot.textContent || ''; rot.textContent = texto; b.setAttribute('aria-busy', 'true'); b.disabled = true; }
  else { rot.textContent = b.dataset.rotulo || rot.textContent; b.removeAttribute('aria-busy'); b.disabled = false; }
}
function contar(): void {
  const c = contas(e);
  raiz?.querySelectorAll<HTMLElement>('[data-ws-conta]').forEach((s) => {
    const novo = String(c[s.dataset.wsConta as keyof typeof c] ?? 0);
    if (s.textContent !== novo) { s.textContent = novo; if (!quieto()) { s.classList.remove('is-muda'); void s.offsetWidth; s.classList.add('is-muda'); } }
  });
  const t = document.createElement('div'); t.innerHTML = corpo(e);
  const resumo = raiz?.querySelector('[data-ws-resumo]'); const novoR = t.querySelector('[data-ws-resumo]');
  if (resumo && novoR) resumo.innerHTML = novoR.innerHTML;
}
/** Tira uma linha da lista: ela sai e as de baixo sobem (FLIP, só transform). */
function tirarLinha(li: HTMLElement): void {
  const lista = li.parentElement!;
  const irmaos = [...lista.children].filter((x) => x !== li) as HTMLElement[];
  const antes = new Map(irmaos.map((x) => [x, x.getBoundingClientRect().top]));
  const fim = () => {
    li.remove();
    if (!quieto()) irmaos.forEach((x) => { const d = antes.get(x)! - x.getBoundingClientRect().top; if (d) x.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' }); });
    if (!lista.children.length) trocar('[data-bloco="prioridades"]', blocoPrioridades(e));
  };
  if (quieto()) { fim(); return; }
  li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(24px)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).onfinish = fim;
}
async function tratar(ref: string, b: HTMLButtonElement): Promise<void> {
  const d = doc(e, ref); if (!d?.acao || e.feitos[ref] || !podeTratar(e, d)) return;
  ocupar(b, 'A tratar…');
  await espera(ESPERA);
  if (!raiz) return;
  if (e.carga === 'offline' || !navigator.onLine) { ocupar(b, null); aviso('Sem ligação: não foi possível guardar. Tenta outra vez quando a ligação voltar.'); return; }
  /* as encomendas a fornecedor passam pelo domínio de Compras (as mesmas regras do editor) */
  const doDominio = !!cp.encomenda(ref);
  if (doDominio) {
    try { cp.transitar(e.perfil, ref, d.acao.id as cp.Acao); } catch (err) { ocupar(b, null); aviso(err instanceof cp.Recusa ? err.message : 'Não foi possível guardar.'); return; }
  }
  /* só depois da resposta do servidor: o estado muda, a linha marca-se, e sai da lista */
  e.feitos[ref] = d.acao.feito; guardar();
  const feito = d.acao.feito[0].toUpperCase() + d.acao.feito.slice(1);
  raiz.querySelectorAll<HTMLElement>(`[data-ws-pri="${CSS.escape(ref)}"], .ws-painel`).forEach((el) => {
    if (el.classList.contains('ws-painel') && !el.querySelector(`[data-ws-acao="${CSS.escape(ref)}"]`) && el.querySelector('#ws-painel-t')?.textContent !== ref) return;
    el.querySelectorAll<HTMLElement>('[data-ws-estado-doc]').forEach((s) => { s.textContent = feito; s.className = 'ws-estado ws-estado--feito'; });
    el.querySelector(`[data-ws-acao="${CSS.escape(ref)}"]`)?.remove();
  });
  const li = raiz.querySelector<HTMLElement>(`[data-ws-pri="${CSS.escape(ref)}"]`);
  if (li) {
    li.classList.add('is-feita');
    const n = li.querySelector('.ws-pri__nivel'); if (n) n.innerHTML = n.innerHTML.replace(/<span class="ws-pri__nivel-nome">[^<]*<\/span>/, '<span class="ws-pri__nivel-nome">Feito</span>');
    window.setTimeout(() => { tirarLinha(li); contar(); }, quieto() ? 0 : 650);
  } else contar();
  trocar('[data-bloco="fluxo"]', blocoFluxo(e));
  if (doDominio) { aviso(`${d.ref} ${d.acao.feito}. Está no histórico da encomenda.`); return; }
  aviso(`${d.ref} ${d.acao.feito}.`, () => {
    delete e.feitos[ref]; guardar();
    trocar('[data-bloco="prioridades"]', blocoPrioridades(e))?.classList.add('is-volta');
    trocar('[data-bloco="fluxo"]', blocoFluxo(e)); contar();
    if (camada?.tipo === 'painel') { const vt = camada.volta; fechar(false); abrir('painel', painel(e, ref), vt); }
  });
}

/* ---------- o fluxo ---------- */
function escolherEtapa(id: string): void {
  e.etapa = e.etapa === id ? null : id;
  const sec = raiz!.querySelector<HTMLElement>('[data-bloco="fluxo"]')!;
  const ix = ETAPAS.findIndex((x) => x.id === e.etapa);
  sec.querySelector<HTMLElement>('.ws-fluxo')!.style.setProperty('--sel', String(ix));
  sec.querySelectorAll<HTMLElement>('.ws-fluxo__etapa').forEach((li, i) => {
    li.classList.toggle('is-sel', i === ix); li.classList.toggle('is-antes', ix >= 0 && i < ix);
    li.querySelector('button')!.setAttribute('aria-pressed', String(i === ix));
  });
  const t = document.createElement('div'); t.innerHTML = blocoFluxo(e);
  const novo = t.querySelector('[data-ws-fluxo-det]'), velho = sec.querySelector('[data-ws-fluxo-det]');
  if (velho && novo) velho.replaceWith(novo); else if (novo) sec.appendChild(novo); else velho?.remove();
}

/* ---------- criar um rascunho ---------- */
async function criarRascunho(b: HTMLButtonElement): Promise<void> {
  const f = raiz!.querySelector<HTMLFormElement>('[data-ws-criar]')!; const op = f.dataset.wsCriar!;
  const ent = (f.elements.namedItem('entidade') as HTMLSelectElement).value;
  const erro = f.querySelector<HTMLElement>('.ws-campo__erro')!;
  if (!ent) { erro.hidden = false; (f.elements.namedItem('entidade') as HTMLSelectElement).focus(); return; }
  erro.hidden = true; ocupar(b, 'A criar…');
  await espera(ESPERA);
  if (e.carga === 'offline' || !navigator.onLine) { ocupar(b, null); aviso('Sem ligação: o rascunho não foi criado.'); return; }
  const ef = op === 'nova-ef';
  /* a encomenda a fornecedor é um documento de Compras: cria-se lá e abre-se no editor */
  if (ef) {
    const f = cp.FORNECEDORES.find((x) => x.nome === ent);
    try {
      const x = cp.criar(e.perfil, f?.id ?? '');
      fechar(false); irPara('compras-encomenda', x.ref);
      aviso(`Rascunho ${x.ref} criado. Junta os artigos.`);
    } catch (err) { aviso(err instanceof cp.Recusa ? err.message : 'Não foi possível criar.'); }
    return;
  }
  const n = (ef ? 414 : 1181) + e.criados.filter((d) => d.modulo === (ef ? 'compras' : 'vendas')).length;
  const ref = ef ? `EF 2026/0${n}` : `EC 2026/${n}`;
  const d: Doc = { ref, tipo: ef ? 'Encomenda a fornecedor' : 'Encomenda de cliente', modulo: ef ? 'compras' : 'vendas', entidade: ent, estado: 'Rascunho', nivel: 'normal', datas: [['Começada', 'agora'], ['Armazém', 'Armazém 60 · Coimbra']], nota: 'Ainda sem linhas.', ...(ef ? { ecra: 'compras' as const } : {}) };
  e.criados.push(d);
  e.recentes = [{ id: 'r' + Date.now(), tipo: 'rascunho' as const, titulo: `${ref} · ${ent}`, sub: 'Rascunho · sem linhas', quando: 'agora', doc: ref }, ...e.recentes].slice(0, 8);
  guardar();
  fechar(false);
  trocar('[data-bloco="continuar"]', blocoContinuar(e));
  abrir('painel', painel(e, ref), null);
  aviso(`Rascunho ${ref} criado. Está em «Continuar onde fiquei».`);
}

/* ---------- operações e retomar ---------- */
function operacao(id: string, de: HTMLElement): void {
  const o = OPERACOES.find((x) => x.id === id); if (!o || !pode(e, o.modulo) || !o.perfis.includes(e.perfil)) return;
  if (camada) fechar(false);
  if (o.tipo === 'criar') { if (o.id === 'nova-ef' || o.id === 'nova-ec') abrir('painel', criar(e, o.id), de); return; }
  if (o.tipo === 'procurar') { abrirProcura('', de); const inp = raiz!.querySelector<HTMLInputElement>('[data-ws-paleta-input]'); if (inp) inp.placeholder = `${o.nome}: escreve a referência ou o nome…`; return; }
  if (o.ecra) irPara(o.ecra); else if (o.doc) abrirDoc(o.doc, de);
}
function retomar(id: string, de: HTMLElement): void {
  const r = e.recentes.find((x) => x.id === id); if (!r) return;
  if (r.doc && doc(e, r.doc)) { abrirDoc(r.doc, de.querySelector('.ws-cont__titulo') ?? de); return; }
  if (r.procura !== undefined) { abrirProcura(r.procura, de); return; }
  if (r.ecra) irPara(r.ecra);
}

/* ---------- personalizar ---------- */
function mudarPrefs(f: () => void, redesenharTudo = true): void { f(); guardar(); if (redesenharTudo) redesenhar(); }
function redesenharOrdem(foco?: string): void {
  const t = document.createElement('div'); t.innerHTML = personalizar(e);
  raiz!.querySelector('.ws-ordem')!.replaceWith(t.querySelector('.ws-ordem')!);
  if (foco) raiz!.querySelector<HTMLElement>(foco)?.focus();
}
function mover(id: string, d: number): void {
  const o = e.prefs.ordem, i = o.indexOf(id); const visiveis = o.filter((x) => { const op = OPERACOES.find((y) => y.id === x); return op && pode(e, op.modulo); });
  const j = visiveis.indexOf(id) + d; if (j < 0 || j >= visiveis.length) return;
  const outro = visiveis[j], k = o.indexOf(outro);
  [o[i], o[k]] = [o[k], o[i]];
  mudarPrefs(() => {}); redesenharOrdem(`[data-ws-${d < 0 ? 'subir' : 'descer'}="${id}"]:not([disabled])`) ;
  if (!raiz!.querySelector(`[data-ws-${d < 0 ? 'subir' : 'descer'}="${id}"]:not([disabled])`)) raiz!.querySelector<HTMLElement>(`[data-ws-${d < 0 ? 'descer' : 'subir'}="${id}"]`)?.focus();
}

/* ---------- a barra lateral ---------- */
function procurarModulo(q: string): void {
  const s = q.trim().toLowerCase();
  let algum = false;
  raiz!.querySelectorAll<HTMLElement>('.ws-lado__lista:not(.ws-lado__lista--recentes):not(.ws-lado__lista--fixados) > .ws-lado__li').forEach((li) => {
    const nome = li.querySelector('.ws-lado__nome')!.textContent!.toLowerCase();
    const subs = [...li.querySelectorAll<HTMLElement>('.ws-lado__sub')];
    const subOk = subs.filter((b) => b.textContent!.toLowerCase().includes(s));
    const ok = !s || nome.includes(s) || subOk.length > 0;
    li.hidden = !ok; algum = algum || ok;
    const ul = li.querySelector<HTMLElement>('.ws-lado__subs');
    if (ul && s) { ul.hidden = !subOk.length && !nome.includes(s); li.querySelector('[data-ws-abrir-sub]')!.setAttribute('aria-expanded', String(!ul.hidden)); }
  });
  raiz!.querySelectorAll<HTMLElement>('.ws-lado__grupo, .ws-lado__lista--fixados, .ws-lado__lista--recentes').forEach((g) => { g.hidden = !!s && !g.nextElementSibling?.querySelector?.('.ws-lado__li:not([hidden])') && !g.matches('.ws-lado__lista'); });
  raiz!.querySelectorAll<HTMLElement>('.ws-lado__lista--fixados, .ws-lado__lista--recentes').forEach((g) => { g.hidden = !!s; });
  raiz!.querySelector<HTMLElement>('.ws-lado__nada')!.hidden = algum;
}

/* ---------- os cliques ---------- */
function aoClicar(ev: MouseEvent): void {
  if (editando() || !raiz) return;
  const alvo = ev.target as Element;
  if (!raiz.contains(alvo)) return;
  const q = <T extends HTMLElement = HTMLElement>(sel: string) => alvo.closest?.<T>(sel) ?? null;
  let b: HTMLElement | null;

  /* fora de um menu aberto: fecha-o (o clique segue) */
  if (camada && !q('[data-ws-camadas] > *') && !q('[data-ws-menu]') && !q('[data-ws-toasts]')) fechar(false);
  if (q('.ws-veu') && alvo.classList.contains('ws-veu')) { fechar(); return; }

  if ((b = q('[data-ws-menu]'))) {
    const tipo = b.dataset.wsMenu!;
    if (camada?.tipo === tipo) { fechar(); return; }
    if (camada) fechar(false);
    abrir(tipo, tipo === 'conta' ? menuConta(e) : tipo === 'avisos' ? menuAvisos(e) : tipo === 'criar' ? menuCriar(e) : menuEmpresa(), b, b);
    if (tipo === 'conta') marcarTema();
    return;
  }
  if ((b = q('[data-ws-acao]'))) { tratar(b.dataset.wsAcao!, b as HTMLButtonElement); return; }
  if ((b = q('[data-ws-aviso]'))) {
    const id = b.dataset.wsAviso!;
    if (!e.lidas.includes(id)) { e.lidas.push(id); guardar(); atualizarSino(); }
    if (b.dataset.wsDoc) { abrirDoc(b.dataset.wsDoc, b.querySelector('.ws-aviso__titulo')); return; }
    b.classList.remove('is-novo'); return;
  }
  if (q('[data-ws-ler-todos]')) { AVISOS[e.perfil].forEach((a) => { if (!e.lidas.includes(a.id)) e.lidas.push(a.id); }); guardar(); atualizarSino(); trocar('[data-ws-camada="avisos"]', menuAvisos(e))?.setAttribute('style', raiz.querySelector<HTMLElement>('[data-ws-camadas] > *')?.getAttribute('style') ?? ''); return; }
  if ((b = q('[data-ws-doc]'))) { abrirDoc(b.dataset.wsDoc!, b.querySelector('.ws-ref') ?? b.querySelector('.ws-ctx__nome') ?? b); return; }
  if ((b = q('[data-ws-res]'))) { escolherProcura([...raiz.querySelectorAll('.ws-res')].indexOf(b)); return; }
  if ((b = q('[data-ws-procura]'))) { abrirProcura('', b); return; }
  if ((b = q('[data-ws-procura-texto]'))) { abrirProcura(b.dataset.wsProcuraTexto!, b); return; }
  if ((b = q('[data-ws-op]'))) { operacao(b.dataset.wsOp!, b); return; }
  if ((b = q('[data-ws-retomar]'))) { if (raiz.classList.contains('is-gaveta')) raiz.classList.remove('is-gaveta'); retomar(b.dataset.wsRetomar!, b); return; }
  if ((b = q('[data-ws-fixar-cont]'))) {
    const r = e.recentes.find((x) => x.id === b!.dataset.wsFixarCont); if (!r) return;
    r.fixado = !r.fixado; guardar(); trocar('[data-bloco="continuar"]', blocoContinuar(e));
    raiz.querySelector<HTMLElement>(`[data-ws-fixar-cont="${r.id}"]`)?.focus();
    aviso(r.fixado ? `«${r.titulo}» fixado no topo.` : `«${r.titulo}» deixou de estar fixado.`); return;
  }
  if ((b = q('[data-ws-filtro]'))) { e.filtro = b.dataset.wsFiltro as Estado['filtro']; trocar('[data-bloco="prioridades"]', blocoPrioridades(e)); raiz.querySelector<HTMLElement>(`[data-ws-filtro="${e.filtro}"]`)?.focus(); return; }
  if ((b = q('[data-ws-etapa]'))) { escolherEtapa(b.dataset.wsEtapa!); return; }
  if ((b = q('[data-ws-ir]'))) { ev.preventDefault(); if (camada) fechar(false); raiz.classList.remove('is-gaveta'); irPara(b.dataset.wsIr!, b.dataset.wsRef); return; }
  if ((b = q('[data-ws-sem-ecra]'))) { semEcra(b.dataset.wsSemEcra!); return; }
  if ((b = q('[data-ws-abrir-sub]'))) {
    const ul = raiz.querySelector<HTMLElement>(`#ws-sub-${b.dataset.wsAbrirSub}`)!; ul.hidden = !ul.hidden; b.setAttribute('aria-expanded', String(!ul.hidden));
    if (raiz.dataset.lado === 'recolhido' && !ul.hidden && innerWidth >= 760) { e.prefs.lado = 'aberto'; guardar(); aplicarRaiz(); }
    return;
  }
  if ((b = q('[data-ws-fixar]'))) {
    const m = b.dataset.wsFixar as Modulo;
    mudarPrefs(() => { e.prefs.fixados = e.prefs.fixados.includes(m) ? e.prefs.fixados.filter((x) => x !== m) : [...e.prefs.fixados, m]; });
    raiz.querySelector<HTMLElement>(`[data-ws-fixar="${m}"]`)?.focus(); return;
  }
  if (q('[data-ws-lado]')) { mudarPrefs(() => { e.prefs.lado = e.prefs.lado === 'recolhido' ? 'aberto' : 'recolhido'; }); raiz.querySelector<HTMLElement>('[data-ws-lado]')?.focus(); return; }
  if (q('[data-ws-gaveta]')) { const ab = raiz.classList.toggle('is-gaveta'); raiz.querySelector('[data-ws-gaveta]')!.setAttribute('aria-expanded', String(ab)); if (ab) raiz.querySelector<HTMLElement>('.ws-lado .ws-lado__item')?.focus(); return; }
  if (alvo.classList.contains('ws') && raiz.classList.contains('is-gaveta')) { raiz.classList.remove('is-gaveta'); return; }
  if (q('[data-ws-contexto]')) { mudarPrefs(() => { e.prefs.blocos.contexto = !e.prefs.blocos.contexto; }); raiz.querySelector<HTMLElement>('[data-ws-contexto]')?.focus(); return; }
  if ((b = q('[data-ws-personalizar]'))) { if (camada) fechar(false); abrir('personalizar', personalizar(e), b); marcarTema(); if (b.dataset.wsPersonalizar === 'acesso') requestAnimationFrame(() => raiz!.querySelector('[data-ws-pers="acesso"]')?.scrollIntoView({ block: 'start' })); return; }
  if ((b = q('[data-ws-subir]'))) { mover(b.dataset.wsSubir!, -1); return; }
  if ((b = q('[data-ws-descer]'))) { mover(b.dataset.wsDescer!, 1); return; }
  if (q('[data-ws-repor]')) {
    mudarPrefs(() => { e.prefs = prefsPadrao(e.perfil); });
    const t = document.createElement('div'); t.innerHTML = personalizar(e);
    raiz.querySelector('.ws-dialogo__corpo')!.replaceWith(t.querySelector('.ws-dialogo__corpo')!); marcarTema();
    aviso('O espaço voltou ao de origem.'); return;
  }
  if (q('[data-ws-criar-ok]')) { criarRascunho(q<HTMLButtonElement>('[data-ws-criar-ok]')!); return; }
  if (q('[data-ws-fechar]')) { fechar(); return; }
  if ((b = q('[data-ws-repetir]'))) { repetir(b as HTMLButtonElement); return; }
  if (q('[data-ws-sair]')) { fechar(false); mostrar('entrada'); mostrarVersao(VERSAO_REDE); return; }
}

async function repetir(b: HTMLButtonElement): Promise<void> {
  ocupar(b, 'A tentar…');
  await espera(ESPERA + 300);
  if (!navigator.onLine) { ocupar(b, null); aviso('Continua sem ligação.'); return; }
  e.carga = undefined; raiz?.removeAttribute('data-ws-carga'); redesenhar(); aviso('A ligação voltou. As prioridades estão atualizadas.');
}
function atualizarSino(): void {
  const n = AVISOS[e.perfil].filter((a) => !e.lidas.includes(a.id)).length;
  const sino = raiz!.querySelector<HTMLElement>('.ws-topo__avisos')!;
  sino.setAttribute('aria-label', `Avisos${n ? `, ${n} por ler` : ''}`);
  const selo = sino.querySelector('[data-ws-por-ler]');
  if (n && selo) selo.textContent = String(n); else if (!n) selo?.remove();
  raiz!.querySelectorAll<HTMLElement>('.ws-aviso').forEach((a) => a.classList.toggle('is-novo', !e.lidas.includes(a.dataset.wsAviso!)));
}

function aoMudar(ev: Event): void {
  if (editando() || !raiz) return;
  const t = ev.target as HTMLInputElement;
  if (!raiz.contains(t)) return;
  if (t.matches('[data-ws-perfil-escolha]')) {
    gravar(CHAVE_PERFIL, t.value, sessionStorage); fechar(false);
    raiz.removeAttribute('data-ws-perfil');
    carregar(raiz); redesenhar(); entrar();
    aviso(`A ver o espaço de ${PERFIS[e.perfil].pessoa} (${PERFIS[e.perfil].nome}).`); return;
  }
  if (t.matches('[data-ws-bloco]')) { mudarPrefs(() => { e.prefs.blocos[t.dataset.wsBloco as Bloco] = t.checked; }); return; }
  if (t.matches('[data-ws-mostrar]')) { const id = t.dataset.wsMostrar!; mudarPrefs(() => { e.prefs.escondidas = t.checked ? e.prefs.escondidas.filter((x) => x !== id) : [...e.prefs.escondidas, id]; }); return; }
  if (t.matches('[data-ws-fixar-pers]')) { const m = t.dataset.wsFixarPers as Modulo; mudarPrefs(() => { e.prefs.fixados = t.checked ? [...e.prefs.fixados, m] : e.prefs.fixados.filter((x) => x !== m); }); return; }
  if (t.matches('[data-ws-omissao]')) { mudarPrefs(() => { e.prefs.omissao = t.value as 'inicio' | 'compras'; }, false); aviso(t.value === 'compras' ? 'Ao entrar, abre as Encomendas a fornecedor.' : 'Ao entrar, abre o Início.'); return; }
  if (t.matches('[data-ws-densidade]')) { mudarPrefs(() => { e.prefs.densidade = t.value as 'confortavel' | 'compacta'; }, false); aplicarRaiz(); return; }
  if (t.matches('[name="entidade"]')) raiz.querySelector<HTMLElement>('.ws-campo__erro')!.hidden = true;
}

function aoTeclar(ev: KeyboardEvent): void {
  if (editando() || !raiz) return;
  const k = ev.key;
  if ((ev.ctrlKey || ev.metaKey) && k.toLowerCase() === 'k') { ev.preventDefault(); abrirProcura(); return; }
  if (ev.altKey && k.toLowerCase() === 'n' && OPERACOES.find((o) => o.id === 'nova-ef')!.perfis.includes(e.perfil)) { ev.preventDefault(); operacao('nova-ef', document.activeElement as HTMLElement); return; }
  const alvo = ev.target as HTMLElement;
  if (camada?.tipo === 'procura' && alvo.matches?.('[data-ws-paleta-input]')) {
    if (k === 'ArrowDown') { ev.preventDefault(); moverProcura(1); return; }
    if (k === 'ArrowUp') { ev.preventDefault(); moverProcura(-1); return; }
    if (k === 'Enter') { ev.preventDefault(); escolherProcura(); return; }
  }
  if (k === 'Escape') {
    if (camada) { ev.preventDefault(); fechar(); return; }
    if (raiz.classList.contains('is-gaveta')) { raiz.classList.remove('is-gaveta'); raiz.querySelector<HTMLElement>('[data-ws-gaveta]')?.focus(); }
    return;
  }
  /* o foco não sai de um diálogo aberto */
  if (k === 'Tab' && camada && ['procura', 'painel', 'personalizar'].includes(camada.tipo)) {
    const caixa = raiz.querySelector<HTMLElement>('[data-ws-camadas] .ws-paleta, [data-ws-camadas] .ws-painel, [data-ws-camadas] .ws-dialogo');
    const f = caixa ? [...caixa.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, [tabindex="0"]')].filter((x) => x.offsetParent) : [];
    if (f.length) { const i = f.indexOf(document.activeElement as HTMLElement); if (ev.shiftKey && i <= 0) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && i === f.length - 1) { ev.preventDefault(); f[0].focus(); } }
  }
  /* setas na barra lateral */
  if ((k === 'ArrowDown' || k === 'ArrowUp') && alvo.closest?.('.ws-lado') && alvo.matches('.ws-lado__item, .ws-lado__sub')) {
    ev.preventDefault();
    const itens = [...raiz.querySelectorAll<HTMLElement>('.ws-lado .ws-lado__item, .ws-lado .ws-lado__sub')].filter((x) => x.offsetParent);
    const i = itens.indexOf(alvo); itens[(i + (k === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length]?.focus();
  }
}
function aoEscrever(ev: Event): void {
  if (editando() || !raiz) return;
  const t = ev.target as HTMLInputElement;
  if (t.matches?.('[data-ws-paleta-input]')) pedirProcura(t.value);
  else if (t.matches?.('[data-ws-procura-modulo]')) procurarModulo(t.value);
}

/* arrastar para ordenar o acesso rápido */
let arrastado: string | null = null;
function arrastos(): void {
  document.addEventListener('dragstart', (ev) => { const li = (ev.target as Element).closest?.<HTMLElement>('[data-ws-ordem]'); if (!li || !raiz?.contains(li)) return; arrastado = li.dataset.wsOrdem!; li.classList.add('is-arrastar'); ev.dataTransfer?.setData('text/plain', arrastado); });
  document.addEventListener('dragover', (ev) => { if (arrastado && (ev.target as Element).closest?.('[data-ws-ordem]')) ev.preventDefault(); });
  document.addEventListener('drop', (ev) => {
    const li = (ev.target as Element).closest?.<HTMLElement>('[data-ws-ordem]'); if (!arrastado || !li) return;
    ev.preventDefault();
    const o = e.prefs.ordem.filter((x) => x !== arrastado); o.splice(o.indexOf(li.dataset.wsOrdem!), 0, arrastado);
    e.prefs.ordem = o; arrastado = null; mudarPrefs(() => {}); redesenharOrdem();
  });
  document.addEventListener('dragend', () => { arrastado = null; raiz?.querySelectorAll('.is-arrastar').forEach((x) => x.classList.remove('is-arrastar')); });
}

/* ---------- quando o ecrã aparece ---------- */
function entrar(): void {
  if (!raiz || quieto()) return;
  raiz.classList.remove('is-chegada'); void raiz.offsetWidth; raiz.classList.add('is-chegada');
  window.setTimeout(() => raiz?.classList.remove('is-chegada'), 1100);
}
function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ws');
  if (r === raiz) return;
  camada = null;
  raiz = r;
  if (!r || editando()) return;
  carregar(r);
  /* o que o estado do ecrã traz aberto já está desenhado; o resto redesenha-se com o estado guardado */
  const abrirJa = r.dataset.wsAbrir;
  const t = document.createElement('div'); t.innerHTML = casca(e, pagina());
  r.querySelector('.ws-lado')!.replaceWith(t.querySelector('.ws-lado')!);
  r.querySelector('.ws-principal')!.replaceWith(t.querySelector('.ws-principal')!);
  aplicarRaiz(); marcarTema(); desenhado();
  if (abrirJa) {
    const c = r.querySelector<HTMLElement>('[data-ws-camadas]')!;
    if (abrirJa.startsWith('procura:')) { c.innerHTML = ''; abrirProcura(abrirJa.slice(8), null); }
    else if (abrirJa === 'avisos') { c.innerHTML = ''; const sino = r.querySelector<HTMLElement>('.ws-topo__avisos')!; abrir('avisos', menuAvisos(e), sino, sino); }
    else camada = { tipo: abrirJa.startsWith('painel') || abrirJa.startsWith('criar') ? 'painel' : abrirJa, volta: null };
  } else entrar();
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  document.addEventListener('click', aoClicar);
  document.addEventListener('change', aoMudar);
  document.addEventListener('input', aoEscrever);
  document.addEventListener('keydown', aoTeclar);
  arrastos();
  /* o tema: os botões marcam-se de novo depois do clique (o tema.ts aplica-o) */
  document.addEventListener('click', (ev) => { if ((ev.target as Element).closest?.('.ws .segmented__btn[data-tema]')) requestAnimationFrame(marcarTema); });
  window.addEventListener('online', () => { if (raiz && e.carga === 'offline') aviso('A ligação voltou.'); });
}

/** O que os módulos usam da casca (avisos, camadas, navegação, o perfil). */
export const ws = {
  estado: () => e, raiz: () => raiz, aviso, abrir: (tipo: string, html: string, volta: HTMLElement | null) => abrir(tipo, html, volta), fechar, irPara, redesenhar, ocupar,
  camada: () => camada?.tipo ?? null, espera: (ms = ESPERA) => espera(ms), lembrar: (ref: string) => lembrar(ref),
};
