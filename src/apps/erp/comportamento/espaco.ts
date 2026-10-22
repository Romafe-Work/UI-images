/* =========================================================
   ERP — 05 · Início v4, a área de trabalho: o que mexe (22 out. 2026). Ver espaco.ts.
   - O estado (Estado) vive aqui; cada mudança redesenha as partes (árvore, separadores, ações, explorador,
     janelas, doca, aviso, diálogo). Os painéis dos separadores NÃO se redesenham: cada ecrã aberto vive num
     iframe que se esconde e mostra — por isso os filtros, o scroll e as seleções ficam como estavam.
   - Guarda-se neste computador (erp:espaco): os separadores, o ativo, os fixados, as pastas abertas, a vista e a
     largura da árvore. Ao voltar, revalidam-se (só rotas registadas e permitidas). Não se guardam dados dos
     documentos nem rascunhos.
   - Pastas: um clique escolhe, duplo clique ou Enter abre (no toque, um toque abre). Abrir anima a pasta: a aba
     levanta-se e a pasta cresce para a área (≈300 ms). Setas mudam a escolha; Alt+← volta.
   - Teclas do ERP antigo: F5 Novo, F6 Editar, F8 Eliminar, F9 Atualizar, F11 Imprimir (também dentro dos
     separadores). Ctrl+K abre a paleta. Esc fecha o que estiver aberto por cima.
   - Dentro de um separador (?separador=1): a página esconde a sua moldura (o cabeçalho e o menu), porque a
     moldura é a da área de trabalho.
   ========================================================= */
import {
  novoEstado, arvore, separadores, ordemSeps, semSeparadores, pastaDe, acoes, explorador, banner, dialogo, janela, doca, ROTAS, MENU_ERP, TECLA, filhos, rotaDoEcra, esc, L, IC,
  type Estado, type Acao, type Janela,
} from '../espaco';
import { exploradorV6, menuV6 } from '../espaco-v6';
import { FORNECEDORES, ARTIGOS, encomendas } from '../compras/dominio';
import { irIdentidade } from './abertura-v4';
import { mostrar } from '../../../comum/ecras';

const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHAVE = 'erp:espaco', CHAVE_PALETA = 'erp:paleta-recentes';
let pg: HTMLElement | null = null, dk: HTMLElement | null = null;
let e: Estado = novoEstado();
let normal = false, restaurou = false, aviso = 0;
const frames = new Map<string, HTMLIFrameElement>();

/** O explorador da versão à vista (a V6 tem o seu; a v4 fica igual). */
const exp = (x: Estado) => x.v6 ? exploradorV6(x) : explorador(x);
const $ = <T extends HTMLElement = HTMLElement>(s: string) => pg?.querySelector<T>(s) ?? null;
function dizer(t: string): void {
  const el = $('[data-hm-aviso]'); if (!el) return;
  el.textContent = t; el.classList.add('is-visivel'); window.clearTimeout(aviso); aviso = window.setTimeout(() => el.classList.remove('is-visivel'), 2400);
}
function guardar(): void {
  if (!normal) return;
  try { localStorage.setItem(CHAVE, JSON.stringify({ seps: e.seps.map(({ id, rota, titulo }) => ({ id, rota, titulo })), ativo: e.ativo, fixados: e.fixados, arvore: e.arvore, vista: e.vista, largura: e.largura, rail: !!e.rail, trabalho: e.trabalho, casa: e.casa ?? 0, semCasa: !!e.semCasa, presos: e.presos ?? [], historico: (e.historico ?? []).slice(0, 12) })); } catch { /* */ }
}

/* ---------- desenhar ---------- */
function desenhar(o: { exp?: boolean; entrar?: boolean } = { exp: true }): void {
  if (!pg || !dk) return;
  const put = (s: string, h: string) => { const el = $(s); if (el) el.innerHTML = h; };
  put('[data-dk-arvore]', arvore(e));
  put('[data-dk-seps]', separadores(e));
  put('[data-dk-acoes]', acoes(e));
  put('[data-dk-banner]', banner(e));
  if (o.exp !== false) { const x = $('[data-dk-exp]'); if (x) { x.innerHTML = e.semCasa ? semSeparadores() : exp(e); if (o.entrar) { x.classList.remove('is-entrar'); void x.offsetWidth; x.classList.add('is-entrar'); } } }
  if (o.exp !== false) pg.querySelectorAll<HTMLElement>('[data-dk-exp-pasta]').forEach((p) => { p.innerHTML = exp({ ...e, pasta: p.dataset.dkExpPasta! }); });
  if (e.v6) put('[data-dk6-menu]', menuV6({ ...e, menu: '' }));
  const top = Math.max(0, ...e.janelas.map((j) => j.z));
  put('[data-dk-janelas]', e.janelas.map((j) => janela(j, j.z === top)).join(''));
  put('[data-dk-doca]', doca(e));
  put('[data-dk-dialogo]', dialogo(e));
  paineis(); indicador(); guardar();
}
function indicador(): void {
  const a = $('.dk-sep.is-ativo'), ind = $('[data-dk-seps-ind]'), barra = $('.dk-barra');
  if (!a || !ind || !barra) return;
  const ra = a.getBoundingClientRect(), rb = barra.getBoundingClientRect();
  ind.style.transform = `translateX(${ra.left - rb.left + (barra.scrollLeft || 0)}px)`; ind.style.width = `${ra.width}px`;
}

/* ---------- os painéis: um iframe por separador, que fica vivo ---------- */
function paineis(): void {
  const caixa = $('[data-dk-paineis]'); if (!caixa) return;
  const ids = new Set(['inicio', ...e.seps.map((s) => s.id)]);
  caixa.querySelectorAll<HTMLElement>('[data-painel]').forEach((p) => { if (!ids.has(p.dataset.painel!)) { p.remove(); frames.delete(p.dataset.painel!); } });
  for (const s of e.seps) {
    let p = caixa.querySelector<HTMLElement>(`[data-painel="${s.id}"]`);
    const pasta = s.rota.startsWith('pasta:') ? s.rota.slice(6) : '';
    if (!p) { p = document.createElement('section'); p.className = 'dk-painel'; p.dataset.painel = s.id; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-label', s.titulo); p.innerHTML = pasta ? `<div class="is-entrar" data-dk-exp-pasta="${pasta}">${exp({ ...e, pasta })}</div>` : `<div class="dk-carga"><span></span>A abrir ${esc(s.titulo)}…</div>`; caixa.appendChild(p); }
    if (pasta) continue;
    if (s.id === e.ativo && !frames.has(s.id) && !pg?.hasAttribute('data-sh-abertura')) carregar(s.id, p);
  }
  caixa.querySelectorAll<HTMLElement>('[data-painel]').forEach((p) => p.classList.toggle('is-ativo', p.dataset.painel === e.ativo));
}
function endereco(rota: string, emSeparador = true): string {
  const r = ROTAS[rota];
  return `${location.pathname}${emSeparador ? '?separador=1' : ''}#so=ecra&ecra=${encodeURIComponent(r?.ecra ?? 'inicio')}`;
}
function carregar(id: string, p: HTMLElement): void {
  const s = e.seps.find((x) => x.id === id); if (!s) return;
  if (!ROTAS[s.rota]) { p.innerHTML = `<div class="dk-carga dk-carga--erro">${L(IC.lock)}Este ecrã ainda não existe no ERP novo.</div>`; return; }
  const f = document.createElement('iframe');
  f.className = 'dk-frame'; f.title = s.titulo; f.src = endereco(s.rota);
  f.addEventListener('load', () => {
    p.querySelector('.dk-carga')?.remove();
    try {
      const w = f.contentWindow!, d = f.contentDocument!;
      /* alterações por guardar: qualquer escrita num formulário marca o separador */
      d.addEventListener('input', (ev) => { const t = ev.target as HTMLElement; if (t.closest('form, .cp, [data-cp], .lf-filtros') && !t.closest('.lf-filtros, [type="search"]')) { const x = e.seps.find((y) => y.id === id); if (x && !x.sujo) { x.sujo = true; desenhar({ exp: false }); } } }, true);
      /* as teclas da área de trabalho também funcionam dentro do separador */
      w.addEventListener('keydown', (ev) => teclas(ev), true);
    } catch { /* outra origem: sem ganchos */ }
  });
  p.appendChild(f); frames.set(id, f);
}

/* ---------- separadores ---------- */
let seq = 0;
function linhaDaRota(rota: string) { return MENU_ERP.find((l) => l.rota === rota); }
function abrirRota(rota: string, titulo?: string, novo = false): void {
  const r = ROTAS[rota];
  const l = linhaDaRota(rota);
  if (!r) { e.banner = 'rota'; e.bannerTexto = `«${l?.rotulo ?? rota}» ainda não existe no ERP novo. Continua no ERP antigo.`; desenhar({ exp: false }); return; }
  if (l && l.permissoes !== '*' && !l.permissoes.includes(e.perfil)) { e.banner = 'sem-permissao'; e.bannerTexto = `A tua conta não tem acesso a ${l.rotulo}. Pede-o ao administrador.`; desenhar({ exp: false }); return; }
  const t = titulo ?? r.titulo;
  const ja = !novo && e.seps.find((s) => s.rota === rota && s.titulo === t);
  e.historico = [{ rota, titulo: t, quando: Date.now() }, ...(e.historico ?? []).filter((h) => !(h.rota === rota && h.titulo === t))].slice(0, 12);
  if (ja) e.ativo = ja.id;
  else { const id = `s${Date.now().toString(36)}${seq++}`; e.seps.push({ id, rota, titulo: t }); e.ativo = id; }
  if (e.banner === 'rota' || e.banner === 'sem-permissao' || e.banner === 'primeira') e.banner = '';
  desenhar({ exp: false });
}
/** A área de trabalho fecha-se como as outras; volta pela marca, pelo menu ou pelo vazio. */
function fecharCasa(): void {
  const ordem = ordemSeps(e), i = ordem.indexOf('inicio');
  e.casa = i; e.semCasa = true; e.presos = (e.presos ?? []).filter((x) => x !== 'inicio');
  if (e.ativo === 'inicio' && e.seps.length) { const resto = ordem.filter((x) => x !== 'inicio'); e.ativo = resto[Math.max(0, i - 1)] ?? resto[0]; }
  desenhar();
}
function abrirCasa(): void { e.semCasa = false; e.ativo = 'inicio'; e.pasta = 'raiz'; e.sel = ''; desenhar({ exp: true, entrar: true }); }
function prender(id: string): void { const p = e.presos ?? []; e.presos = p.includes(id) ? p.filter((x) => x !== id) : [...p, id]; desenhar({ exp: false }); }
function fechar(id: string, forcar = false): void {
  if (id === 'inicio') { fecharCasa(); return; }
  const s = e.seps.find((x) => x.id === id); if (!s) return;
  if (s.sujo && !forcar) { e.dialogo = `fechar:${id}`; desenhar({ exp: false }); $<HTMLElement>('[data-dk-dialogo] button')?.focus(); return; }
  const ordem = ordemSeps(e), i = ordem.indexOf(id); e.seps.splice(e.seps.indexOf(s), 1); e.presos = (e.presos ?? []).filter((x) => x !== id);
  if (e.ativo === id) { const resto = ordem.filter((x) => x !== id); e.ativo = resto[Math.max(0, i - 1)] ?? 'inicio'; }
  if (!e.seps.length && e.ativo !== 'inicio') e.ativo = 'inicio';
  e.dialogo = '';
  desenhar({ exp: e.ativo === 'inicio' });
}
function ativar(id: string): void { if (e.ativo === id) return; e.ativo = id; desenhar({ exp: id === 'inicio' }); }

/* ---------- pastas ---------- */
function abrirPasta(id: string, de?: HTMLElement | null): void {
  const m = MENU_ERP.find((l) => l.id === id && !l.pai);
  if (!m) { e.banner = 'desconhecido'; e.bannerTexto = `O módulo «${id}» não existe no ERP. Abrimos a área de trabalho.`; e.pasta = 'raiz'; desenhar(); return; }
  if (!m.ativo) { dizer(`«${m.rotulo}» ainda está no ERP antigo.`); return; }
  const primeiro = filhos(id, e.perfil).find((f) => f.registada && f.permitido)?.rota ?? '';
  /* V6: a pasta abre num separador seu */
  const fazer = e.v6 ? () => {
    const sid = `p-${id}`;
    if (!e.seps.some((s) => s.id === sid)) e.seps.push({ id: sid, rota: `pasta:${id}`, titulo: m.rotulo });
    e.ativo = sid; e.sel = primeiro; desenhar({ exp: false });
    $<HTMLElement>(`[data-painel="${sid}"] .dk-ecra[aria-selected="true"]`)?.focus();
  } : () => { e.semCasa = false; e.ativo = 'inicio'; e.pasta = id; e.sel = filhos(id, e.perfil).find((f) => f.registada && f.permitido)?.rota ?? ''; e.arvore[id] = true; desenhar({ exp: true, entrar: true }); $<HTMLElement>('.dk-fich[aria-selected="true"]')?.focus(); };
  const alvo = e.v6 ? $('[data-dk-paineis]') : $('[data-dk-exp]');
  if (!de || quieto() || !alvo) { fazer(); return; }
  /* a assinatura: a aba levanta-se e a pasta cresce para a área */
  de.classList.add('is-abrir');
  const g = de.querySelector<HTMLElement>('.dk-arte, .dk-pasta-g')!, r = g.getBoundingClientRect(), ra = alvo.getBoundingClientRect();
  const c = g.cloneNode(true) as HTMLElement; c.classList.add('dk-voo');
  Object.assign(c.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  document.body.appendChild(c);
  const dx = ra.left + ra.width / 2 - (r.left + r.width / 2), dy = ra.top + Math.min(ra.height, 420) / 2 - (r.top + r.height / 2), k = Math.min(ra.width / r.width, 6);
  const an = c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * .5}px, ${dy * .5}px) scale(${k * .5})`, opacity: .9, offset: .55 }, { transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.4, 0, .2, 1)' });
  window.setTimeout(fazer, 150);
  an.onfinish = () => c.remove();
}
function voltar(): void {
  const pa = pastaDe(e);
  if (pa === null || pa === 'raiz') return;
  let area: DOMRect | undefined;
  if (e.v6) {
    /* V6: o separador da pasta fecha-se e a pasta volta ao seu lugar na área de trabalho */
    area = $('[data-dk-paineis]')?.getBoundingClientRect();
    e.seps = e.seps.filter((s) => s.rota !== `pasta:${pa}`); e.presos = (e.presos ?? []).filter((x) => x !== `p-${pa}`);
    e.semCasa = false; e.ativo = 'inicio'; e.sel = pa; desenhar({ exp: true });
  } else { area = $('[data-dk-exp]')?.getBoundingClientRect(); e.pasta = 'raiz'; e.sel = pa; desenhar({ exp: true, entrar: true }); }
  const de = pa;
  const b = $<HTMLElement>(`[data-dk-pasta="${de}"]`); b?.focus();
  /* o caminho de volta: a pasta encolhe da área para o seu lugar e fecha a aba */
  const g = b?.querySelector<HTMLElement>('.dk-arte');
  if (!g || !area || quieto()) return;
  const r = g.getBoundingClientRect(), k = Math.min(area.width / r.width, 5);
  const dx = area.left + area.width / 2 - (r.left + r.width / 2), dy = area.top + Math.min(area.height, 420) / 2 - (r.top + r.height / 2);
  b!.classList.add('is-abrir');
  g.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: 0 }, { transform: 'translate(0, 0) scale(1)', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.4, 0, .2, 1)' }).onfinish = () => window.setTimeout(() => b!.classList.remove('is-abrir'), 60);
}
/** Escolher não redesenha o explorador (o duplo clique precisa do mesmo elemento): só a marcação, a barra e o detalhe. */
function escolher(id: string): void {
  e.sel = id;
  pg?.querySelectorAll<HTMLElement>('.dk-exp [data-dk-pasta], .dk-exp [data-dk-abrir]').forEach((t) => { const sim = (t.dataset.dkPasta ?? t.dataset.dkAbrir) === id; t.setAttribute('aria-selected', String(sim)); t.closest('.dk-mod')?.classList.toggle('is-sel', sim); });
  const a = $('[data-dk-acoes]'); if (a) a.innerHTML = acoes(e);
  const d = $('.dk-painel.is-ativo .dk-detalhe'); if (d) { const tmp = document.createElement('div'); tmp.innerHTML = exp({ ...e, pasta: pastaDe(e) ?? e.pasta }); const n = tmp.querySelector('.dk-detalhe'); if (n) d.innerHTML = n.innerHTML; }
  $<HTMLElement>(`.dk-exp [data-dk-pasta="${CSS.escape(id)}"], .dk-exp [data-dk-abrir="${CSS.escape(id)}"]`)?.focus();
}
function abrirEscolhido(): void {
  if (!e.sel) return;
  if (MENU_ERP.some((l) => l.id === e.sel && !l.pai)) abrirPasta(e.sel, $(`[data-dk-pasta="${e.sel}"]`));
  else abrirRota(e.sel);
}

/* ---------- janelas ---------- */
const topo = () => Math.max(1, ...e.janelas.map((j) => j.z));
function abrirJanela(tipo: Janela['tipo'], chave: string): void {
  const ja = e.janelas.find((j) => j.tipo === tipo && j.chave === chave);
  if (ja) { ja.min = false; ja.z = topo() + 1; desenhar({ exp: false }); return; }
  const n = e.janelas.length, area = dk?.getBoundingClientRect();
  const x = Math.max(16, Math.min((area?.width ?? 900) - 380, 300 + n * 28)), y = 90 + n * 28;
  e.janelas.push({ id: `j${Date.now().toString(36)}`, tipo, chave, x, y, w: 360, h: 340, z: topo() + 1 });
  desenhar({ exp: false });
}
function acaoJanela(id: string, a: string): void {
  const j = e.janelas.find((x) => x.id === id); if (!j) return;
  if (a === 'fechar') e.janelas = e.janelas.filter((x) => x !== j);
  else if (a === 'min') j.min = true;
  else if (a === 'max') { j.max = !j.max; j.z = topo() + 1; }
  desenhar({ exp: false });
}
let arrasto: { j: Janela; el: HTMLElement; dx: number; dy: number } | null = null;

/* ---------- ações da barra ---------- */
function acao(a: string, botao?: HTMLElement): void {
  const s = e.seps.find((x) => x.id === e.ativo), r = s && ROTAS[s.rota], f = s && frames.get(s.id);
  switch (a) {
    case 'voltar': voltar(); return;
    case 'abrir': abrirEscolhido(); return;
    case 'fixar': { const k = e.sel; if (!k || !ROTAS[k]) return; e.fixados = e.fixados.includes(k) ? e.fixados.filter((y) => y !== k) : [...e.fixados, k]; dizer(e.fixados.includes(k) ? `«${ROTAS[k].titulo}» fixado no acesso rápido.` : `«${ROTAS[k].titulo}» saiu do acesso rápido.`); desenhar(); return; }
    case 'fixar-sep': if (!s) return; e.fixados = e.fixados.includes(s.rota) ? e.fixados.filter((y) => y !== s.rota) : [...e.fixados, s.rota]; dizer(e.fixados.includes(s.rota) ? 'Fixado no acesso rápido.' : 'Saiu do acesso rápido.'); desenhar({ exp: false }); return;
    case 'atualizar':
      if (e.banner === 'navegacao') e.banner = '';
      if (f) { f.contentWindow?.location.reload(); dizer(`«${s!.titulo}» atualizado.`); }
      else { e.carga = e.pasta !== 'raiz' ? 'pasta' : undefined; desenhar(); window.setTimeout(() => { e.carga = undefined; desenhar({ exp: true, entrar: true }); dizer('Atualizado.'); }, 350); }
      return;
    case 'novo': if (r?.novo) { const k = rotaDoEcra(r.novo[0]); if (k) abrirRota(k, r.novo[1], true); } return;
    case 'editar': if (r?.editar) { const k = rotaDoEcra(r.editar[0]); if (k) abrirRota(k, r.editar[1]); } else if (s) dizer(`Já estás a editar «${s.titulo}».`); return;
    case 'eliminar': if (!s) return; e.dialogo = 'eliminar'; desenhar({ exp: false }); return;
    case 'imprimir': if (f?.contentWindow) f.contentWindow.print(); return;
    case 'mais': { const m = $('[data-dk-menu-mais]'); if (m) { m.hidden = !m.hidden; botao?.setAttribute('aria-expanded', String(!m.hidden)); } return; }
    case 'duplicar': if (s) abrirRota(s.rota, s.titulo, true); return;
    case 'externo': if (s) window.open(endereco(s.rota, false), '_blank', 'noopener'); return;
    case 'fechar-outros': e.seps = e.seps.filter((x) => x.id === e.ativo || x.sujo); desenhar({ exp: false }); if (e.seps.some((x) => x.sujo && x.id !== e.ativo)) dizer('Ficaram abertos os separadores com alterações por guardar.'); return;
    case 'fechar-todos': e.seps = e.seps.filter((x) => x.sujo); e.ativo = e.seps[0]?.id ?? 'inicio'; e.banner = ''; desenhar(); fecharMenus(); if (e.seps.length) dizer('Ficaram abertos os separadores com alterações por guardar.'); return;
  }
}
function fecharMenus(): void { pg?.querySelectorAll<HTMLElement>('[data-dk-menu-mais], [data-dk-menu-conta]').forEach((m) => { m.hidden = true; }); fecharMenu6(); }
/* ---------- o menu horizontal (V6): clique, passar com o menu aberto, F10, setas, Enter e Esc ---------- */
let menu6 = '';
function fecharMenu6(foco = false): void {
  if (!menu6) return;
  const m = $(`[data-dk6-m="${menu6}"]`); m?.querySelector('.dk6-drop')?.setAttribute('hidden', ''); m?.querySelector('.dk6-m-b')?.setAttribute('aria-expanded', 'false');
  if (foco) m?.querySelector<HTMLElement>('.dk6-m-b')?.focus();
  menu6 = '';
}
function abrirMenu6(id: string, item: 'primeiro' | 'ultimo' | '' = ''): void {
  fecharMenu6();
  const m = $(`[data-dk6-m="${id}"]`); if (!m) return;
  m.querySelector('.dk6-drop')?.removeAttribute('hidden'); m.querySelector('.dk6-m-b')?.setAttribute('aria-expanded', 'true'); menu6 = id;
  const its = [...m.querySelectorAll<HTMLElement>('.dk6-i:not([aria-disabled="true"])')];
  if (item) (item === 'primeiro' ? its[0] : its[its.length - 1])?.focus(); else m.querySelector<HTMLElement>('.dk6-m-b')?.focus();
}
function teclasMenu6(ev: KeyboardEvent, alvo: HTMLElement): boolean {
  const m = alvo.closest<HTMLElement>('[data-dk6-m]'); if (!m) return false;
  const bs = [...($('[data-dk6-menu]')?.querySelectorAll<HTMLElement>('.dk6-m-b') ?? [])], b = m.querySelector<HTMLElement>('.dk6-m-b')!, i = bs.indexOf(b);
  const lado = (d: number) => { const n = bs[(i + d + bs.length) % bs.length]; bs.forEach((x) => x.tabIndex = x === n ? 0 : -1); if (menu6) abrirMenu6(n.closest<HTMLElement>('[data-dk6-m]')!.dataset.dk6M!, 'primeiro'); else n.focus(); };
  if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { lado(ev.key === 'ArrowRight' ? 1 : -1); return true; }
  if (ev.key === 'Escape') { fecharMenu6(true); return true; }
  if (alvo === b) {
    if (ev.key === 'ArrowDown' || ev.key === 'Enter' || ev.key === ' ') { abrirMenu6(m.dataset.dk6M!, 'primeiro'); return true; }
    if (ev.key === 'ArrowUp') { abrirMenu6(m.dataset.dk6M!, 'ultimo'); return true; }
    return false;
  }
  const its = [...m.querySelectorAll<HTMLElement>('.dk6-i:not([aria-disabled="true"])')], j = its.indexOf(alvo);
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { its[(j + (ev.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length]?.focus(); return true; }
  if (ev.key === 'Home' || ev.key === 'End') { (ev.key === 'Home' ? its[0] : its[its.length - 1])?.focus(); return true; }
  if (ev.key === 'Tab') { fecharMenu6(); return false; }
  return false;
}
function sair(): void { try { sessionStorage.removeItem('romafe:sessao'); sessionStorage.removeItem('erp:sessao'); } catch { /* */ } irIdentidade(); }
function tema(t: string): void {
  try { localStorage.setItem('uiux:tema', t); } catch { /* */ }
  const aplicar = (d: Document) => { if (t === 'auto') d.documentElement.removeAttribute('data-theme'); else d.documentElement.setAttribute('data-theme', t); };
  aplicar(document); frames.forEach((f) => { try { aplicar(f.contentDocument!); } catch { /* */ } });
  pg?.querySelectorAll<HTMLElement>('[data-dk-tema]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dkTema === t)));
}

/* ---------- a paleta (Ctrl+K) ---------- */
type Item = { k: string; g: string; t: string; s?: string; ic: string; fazer: () => void };
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');
function itens(): Item[] {
  const l: Item[] = [
    { k: 'cmd:inicio', g: 'Comandos', t: 'Ir para a área de trabalho', ic: 'layout-grid', fazer: abrirCasa },
    { k: 'cmd:compras', g: 'Comandos', t: 'Abrir a pasta Compras', ic: 'shopping-cart', fazer: () => abrirPasta('compras') },
    { k: 'cmd:fechar', g: 'Comandos', t: 'Fechar todos os separadores', ic: 'x', fazer: () => acao('fechar-todos') },
    { k: 'cmd:claro', g: 'Comandos', t: 'Tema claro', ic: 'sun', fazer: () => tema('light') },
    { k: 'cmd:escuro', g: 'Comandos', t: 'Tema escuro', ic: 'moon', fazer: () => tema('dark') },
    { k: 'cmd:sair', g: 'Comandos', t: 'Terminar sessão', ic: 'log-out', fazer: sair },
  ];
  filhos('compras', e.perfil).filter((f) => f.registada && f.permitido).forEach((f) => l.push({ k: `ecra:${f.rota}`, g: 'Ecrãs', t: f.rotulo, s: 'Compras', ic: f.icone, fazer: () => abrirRota(f.rota!) }));
  FORNECEDORES.forEach((f) => l.push({ k: `forn:${f.id}`, g: 'Fornecedores', t: f.nome, s: `${f.cidade} · ${f.nif}`, ic: 'users', fazer: () => abrirJanela('fornecedor', f.id) }));
  ARTIGOS.forEach((a) => l.push({ k: `art:${a.ref}`, g: 'Artigos', t: a.ref, s: `${a.marca} · ${a.desc}`, ic: 'warehouse', fazer: () => abrirJanela('artigo', a.ref) }));
  encomendas().forEach((x) => l.push({ k: `doc:${x.ref}`, g: 'Documentos', t: x.ref, s: `${FORNECEDORES.find((f) => f.id === x.forn)?.nome ?? x.forn} · ${x.estado}`, ic: 'file-text', fazer: () => abrirRota('compras.encomenda', x.ref) }));
  return l;
}
const ICP: Record<string, string> = { 'layout-grid': IC.appWindow, 'shopping-cart': IC.fileText, x: IC.x, sun: IC.sun, moon: IC.moon, 'log-out': IC.logOut, users: IC.users, warehouse: IC.warehouse, 'file-text': IC.fileText };
let pal: { q: string; i: number; lista: Item[] } | null = null;
function abrirPaleta(q = ''): void {
  pal = { q, i: 0, lista: [] }; fecharMenus();
  const c = $('[data-dk-paleta-caixa]'); if (!c) return;
  c.hidden = false;
  c.innerHTML = `<div class="dk-veu" data-dk-paleta-fechar></div><section class="dk-pal" role="dialog" aria-label="Procurar ou executar"><label class="dk-pal-campo">${L(IC.search)}<input type="text" placeholder="Módulos, ecrãs, comandos, fornecedores, artigos, documentos…" value="${esc(q)}" data-dk-paleta-q aria-controls="dk-pal-l" aria-autocomplete="list"><kbd>Esc</kbd></label><div class="dk-pal-lista" id="dk-pal-l" role="listbox" data-dk-paleta-lista></div><p class="dk-pal-pe"><kbd>↑</kbd><kbd>↓</kbd> escolher · <kbd>Enter</kbd> abrir · <kbd>Esc</kbd> fechar</p></section>`;
  const inp = c.querySelector<HTMLInputElement>('[data-dk-paleta-q]')!; inp.focus(); inp.setSelectionRange(q.length, q.length);
  pintarPaleta();
}
function pintarPaleta(): void {
  if (!pal) return;
  const todos = itens(), q = norm(pal.q);
  let rec: string[] = []; try { rec = JSON.parse(localStorage.getItem(CHAVE_PALETA) ?? '[]'); } catch { /* */ }
  let lista: Item[];
  if (!q) lista = [...rec.map((k) => todos.find((x) => x.k === k)).filter(Boolean).map((x) => ({ ...x!, g: 'Recentes' })), ...todos.filter((x) => x.g === 'Ecrãs' || x.g === 'Comandos')];
  else { const por: Record<string, Item[]> = {}; todos.filter((x) => norm(x.t + (x.s ?? '')).includes(q)).forEach((x) => { (por[x.g] ??= []).push(x); }); lista = Object.values(por).flatMap((g) => g.slice(0, 6)); }
  pal.lista = lista; pal.i = Math.min(pal.i, Math.max(0, lista.length - 1));
  const el = $('[data-dk-paleta-lista]'); if (!el) return;
  let g = '';
  el.innerHTML = lista.length ? lista.map((x, i) => { const cab = x.g !== g ? `<p class="dk-pal-g">${x.g}</p>` : ''; g = x.g; return `${cab}<button type="button" class="dk-pal-i${i === pal!.i ? ' is-ativo' : ''}" role="option" aria-selected="${i === pal!.i}" data-dk-pal-i="${i}">${L(ICP[x.ic] ?? IC.fileText)}<span><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ''}</span></button>`; }).join('')
    : `<p class="dk-pal-nada">Nada para «${esc(pal.q)}». Procura um ecrã, um fornecedor, um artigo (ex.: GDB2042) ou um documento (ex.: EF 2026/0412).</p>`;
  el.querySelector('.is-ativo')?.scrollIntoView({ block: 'nearest' });
}
function executarPaleta(i: number): void {
  const x = pal?.lista[i]; if (!x) return;
  try { const rec = [x.k, ...JSON.parse(localStorage.getItem(CHAVE_PALETA) ?? '[]').filter((k: string) => k !== x.k)].slice(0, 5); localStorage.setItem(CHAVE_PALETA, JSON.stringify(rec)); } catch { /* */ }
  fecharPaleta(); x.fazer();
}
function fecharPaleta(): void { pal = null; const c = $('[data-dk-paleta-caixa]'); if (c) { c.hidden = true; c.innerHTML = ''; } }

/* ---------- teclas ---------- */
function teclas(ev: KeyboardEvent): void {
  if (!pg || editando()) return;
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); ev.stopImmediatePropagation(); if (pal) fecharPaleta(); else abrirPaleta(); return; }
  if (e.v6 && ev.key === 'F1') { ev.preventDefault(); ev.stopImmediatePropagation(); e.dialogo = 'atalhos'; desenhar({ exp: false }); $<HTMLElement>('[data-dk-dialogo] button')?.focus(); return; }
  if (e.v6 && ev.key === 'F10') { ev.preventDefault(); ev.stopImmediatePropagation(); fecharMenus(); $<HTMLElement>('.dk6-m-b')?.focus(); return; }
  if (ev.altKey && !ev.ctrlKey && !ev.metaKey && /^Digit[1-9]$/.test(ev.code)) { const r = e.fixados.filter((x) => ROTAS[x])[Number(ev.code.slice(5)) - 1]; if (r) { ev.preventDefault(); ev.stopImmediatePropagation(); abrirRota(r); } return; }
  /* atalhos para fixar (22 out.): Ctrl D no acesso rápido, Alt P o separador; Alt W fecha o separador */
  const k = ev.key.toLowerCase();
  if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && !ev.altKey && k === 'd') {
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (e.ativo === 'inicio' && e.sel && ROTAS[e.sel]) acao('fixar'); else if (e.ativo !== 'inicio') acao('fixar-sep'); else dizer('Escolhe um ecrã para o fixar no acesso rápido.');
    return;
  }
  if (ev.altKey && !ev.ctrlKey && !ev.metaKey && (k === 'p' || k === 'w')) { ev.preventDefault(); ev.stopImmediatePropagation(); if (k === 'p') { prender(e.ativo); dizer((e.presos ?? []).includes(e.ativo) ? 'Separador fixado.' : 'Separador desafixado.'); } else fechar(e.ativo); return; }
  const f = ({ F5: 'novo', F6: 'editar', F8: 'eliminar', F9: 'atualizar', F11: 'imprimir' } as Record<string, Acao>)[ev.key];
  if (f) {
    const b = $<HTMLButtonElement>(`[data-dk-acoes] [data-dk-acao="${f}"]`);
    if (b && !b.disabled) { ev.preventDefault(); ev.stopImmediatePropagation(); acao(f, b); }
    return;
  }
}

/* ---------- ligar ---------- */
function ler(): Estado {
  const base = dk?.dataset.dkEstado ? JSON.parse(dk.dataset.dkEstado) as Estado : novoEstado();
  if (!normal) return base;
  try {
    const g = JSON.parse(localStorage.getItem(CHAVE) ?? 'null');
    if (!g) return base;
    const seps = (g.seps ?? []).filter((s: { rota: string }) => { if (base.v6 && s.rota.startsWith('pasta:')) return MENU_ERP.some((m) => m.id === s.rota.slice(6) && m.ativo); const l = MENU_ERP.find((x) => x.rota === s.rota); return ROTAS[s.rota] && (!l || l.permissoes === '*' || l.permissoes.includes(base.perfil)); });
    const est = { ...base, seps, ativo: seps.some((s: { id: string }) => s.id === g.ativo) ? g.ativo : g.semCasa && seps.length ? seps[0].id : 'inicio', fixados: (g.fixados ?? base.fixados).filter((r: string) => ROTAS[r]), arvore: g.arvore ?? base.arvore, vista: 'grelha' as const, largura: g.largura ?? base.largura, rail: !!g.rail, trabalho: g.trabalho ?? base.trabalho, casa: g.casa ?? 0, semCasa: !!g.semCasa && seps.length > 0, historico: Array.isArray(g.historico) ? g.historico.filter((h: { rota: string }) => ROTAS[h.rota]) : [], presos: (g.presos ?? []).filter((i: string) => i === 'inicio' || seps.some((s: { id: string }) => s.id === i)) };
    if (seps.length && !restaurou) { est.banner = 'restaurada'; est.bannerTexto = `Recuperámos a tua área de trabalho: ${seps.length} ${seps.length === 1 ? 'separador' : 'separadores'}. Os rascunhos por guardar não se recuperam.`; }
    return est;
  } catch { return base; }
}
function armar(): void {
  const p = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .dkr');
  if (p === pg) return;
  pg = p; dk = p?.querySelector<HTMLElement>('[data-dk]') ?? null; frames.clear();
  if (!p || !dk) return;
  normal = dk.dataset.dkCenario === 'normal' && !p.hasAttribute('data-sh-abertura') && !editando();
  e = ler(); restaurou = true;
  /* o endereço: #…&abrir=<rota> abre um separador; #…&pasta=<módulo> abre a pasta (ou diz que não existe) */
  const h = new URLSearchParams(location.hash.slice(1));
  if (normal && h.get('abrir')) abrirRota(h.get('abrir')!);
  if (normal && h.get('pasta')) { const id = h.get('pasta')!; if (MENU_ERP.some((l) => l.id === id && !l.pai && l.ativo)) { e.pasta = id; e.arvore[id] = true; } else { e.banner = 'desconhecido'; e.bannerTexto = `O módulo «${id}» não existe no ERP. Abrimos a área de trabalho.`; } }
  if (normal && !navigator.onLine) e.banner = 'offline';
  const c = p.querySelector<HTMLElement>('.dk-corpo'); c?.style.setProperty('--sh-lado', `${e.rail ? 72 : e.largura}px`); c?.classList.toggle('is-rail', !!e.rail);
  let t = 'auto'; try { t = localStorage.getItem('uiux:tema') || 'auto'; } catch { /* */ }
  p.querySelectorAll<HTMLElement>('[data-dk-tema]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dkTema === t)));
  desenhar();
}

/** (22 out.) ela: «quero o menu do ERP em todos os ecrãs, no topo, como as janelas do Windows ou do Chrome» — no
    protótipo (#so=ecra), um ecrã de um módulo nunca aparece sozinho: abre num separador da área de trabalho. */
function paraSeparador(): void {
  if (!document.body.classList.contains('so-ecra') || editando() || document.documentElement.classList.contains('em-separador')) return;
  const ec = document.querySelector<HTMLElement>('.ecra:not([hidden])'); if (!ec || ec.dataset.estadoDe) return;
  const rota = rotaDoEcra(ec.dataset.ecra!); if (!rota) return;
  mostrar('inicio');
  requestAnimationFrame(() => { armar(); if (pg && normal) abrirRota(rota); });
}
export function iniciar(): void {
  /* dentro de um separador, a página esconde a sua moldura */
  if (new URLSearchParams(location.search).has('separador')) document.documentElement.classList.add('em-separador');
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => { pg = null; requestAnimationFrame(() => { paraSeparador(); armar(); }); }));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', indicador);
  requestAnimationFrame(paraSeparador);
  window.addEventListener('keydown', (ev) => {
    if (!pg || editando() || !pg.isConnected || pg.closest('[hidden]')) return;
    if (pal) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharPaleta(); return; }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); pal.i = (pal.i + (ev.key === 'ArrowDown' ? 1 : -1) + pal.lista.length) % Math.max(1, pal.lista.length); pintarPaleta(); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); executarPaleta(pal.i); return; }
    }
    if (e.v6 && teclasMenu6(ev, ev.target as HTMLElement)) { ev.preventDefault(); ev.stopImmediatePropagation(); return; }
    teclas(ev);
    if (ev.defaultPrevented) return;
    if (ev.key === 'Escape') { if (e.dialogo && e.dialogo !== 'sessao') { e.dialogo = ''; desenhar({ exp: false }); } fecharMenus(); return; }
    const alvo = ev.target as HTMLElement;
    if (alvo.closest('input, textarea, select')) return;
    if (ev.altKey && ev.key === 'ArrowLeft') { ev.preventDefault(); voltar(); return; }
    /* o explorador: setas e Enter */
    const tile = alvo.closest<HTMLElement>('.dk-exp [data-dk-pasta], .dk-exp [data-dk-abrir]');
    if (tile && ev.key === 'Enter') { ev.preventDefault(); const id = tile.dataset.dkPasta ?? tile.dataset.dkAbrir!; e.sel = id; if (tile.dataset.dkPasta) abrirPasta(id, tile); else abrirRota(id); return; }
    if (tile && /^Arrow/.test(ev.key)) {
      const grelha = [...(tile.closest('.dk-grelha')?.querySelectorAll<HTMLElement>('[data-dk-pasta], [data-dk-abrir]') ?? [])];
      const i = grelha.indexOf(tile), gr = tile.closest<HTMLElement>('.dk-grelha'), cols = gr ? Math.max(1, Math.round(gr.offsetWidth / (tile.offsetWidth + 12))) : 1;
      const n = ev.key === 'ArrowRight' ? i + 1 : ev.key === 'ArrowLeft' ? i - 1 : ev.key === 'ArrowDown' ? i + cols : i - cols;
      const prox = grelha[Math.max(0, Math.min(grelha.length - 1, n))];
      if (prox) { ev.preventDefault(); escolher(prox.dataset.dkPasta ?? prox.dataset.dkAbrir!); }
      return;
    }
    /* os separadores: setas */
    const sep = alvo.closest<HTMLElement>('[data-dk-sep]');
    if (sep && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { const ids = ordemSeps(e); const i = ids.indexOf(sep.dataset.dkSep!); ativar(ids[(i + (ev.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length]); $<HTMLElement>('.dk-sep.is-ativo')?.focus(); }
  }, true);

  /* com um menu aberto, passar o rato por outro abre-o (como no Windows) */
  window.addEventListener('pointerover', (ev) => { if (!menu6 || !pg) return; const b = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-dk6-abrir]'); if (b && pg.contains(b) && b.dataset.dk6Abrir !== menu6) abrirMenu6(b.dataset.dk6Abrir!); });
  /* a marca leva à área de trabalho, mesmo fechada */
  window.addEventListener('click', (ev) => { const t = ev.target as HTMLElement; if (!pg || editando() || !pg.contains(t) || !t.closest('.dk-topo .hm-marca')) return; ev.preventDefault(); ev.stopImmediatePropagation(); abrirCasa(); }, true);
  window.addEventListener('click', (ev) => {
    if (!pg || editando()) return;
    const t = ev.target as HTMLElement; if (!pg.contains(t)) return;
    let b: HTMLElement | null;
    if ((b = t.closest('.hm-pessoa, [data-hm-dica="Definições"]'))) { ev.preventDefault(); ev.stopImmediatePropagation(); const m = $('[data-dk-menu-conta]'); if (m) { const vai = m.hidden; fecharMenus(); m.hidden = !vai; } return; }
    if (t.closest('.hm-procura')) { ev.preventDefault(); ev.stopImmediatePropagation(); abrirPaleta(); return; }
    if ((b = t.closest('[data-dk-tema]'))) { tema(b.dataset.dkTema!); return; }
    if (t.closest('[data-dk-sair]')) { sair(); return; }
    if ((b = t.closest('[data-dk6-abrir]'))) { const id = b.dataset.dk6Abrir!; if (menu6 === id) fecharMenu6(); else abrirMenu6(id); return; }
    if ((b = t.closest('.dk6-i'))) { if (b.getAttribute('aria-disabled') === 'true') { dizer(`${b.querySelector('span')?.textContent}: ${b.querySelector('small')?.textContent?.toLowerCase()}.`); return; } fecharMenu6(); }
    if (t.closest('[data-dk-fechar-ativo]')) { fechar(e.ativo); return; }
    if (t.closest('[data-dk-ajuda-atalhos]')) { e.dialogo = 'atalhos'; desenhar({ exp: false }); $<HTMLElement>('[data-dk-dialogo] button')?.focus(); return; }
    if (t.closest('[data-dk-dialogo-fora]')) { e.dialogo = ''; desenhar({ exp: false }); return; }
    if (!t.closest('[data-dk-menu-mais], [data-dk-menu-conta], [data-dk-acao="mais"], [data-dk6-menu]')) fecharMenus();
    if (t.closest('[data-dk-paleta-fechar]')) { fecharPaleta(); return; }
    if ((b = t.closest('[data-dk-pal-i]'))) { executarPaleta(Number(b.dataset.dkPalI)); return; }
    if ((b = t.closest('[data-dk-paleta]'))) { abrirPaleta(b.dataset.dkPaleta ?? ''); return; }
    if ((b = t.closest('[data-dk-dialogo]')) && b.matches('button')) { const d = b.dataset.dkDialogo; const id = e.dialogo.startsWith('fechar:') ? e.dialogo.slice(7) : ''; e.dialogo = ''; if (d === 'fechar' && id) fechar(id, true); else { if (d === 'eliminar') dizer('Protótipo: nada foi eliminado. No ERP, fica registado no histórico.'); desenhar({ exp: false }); } return; }
    if (t.closest('[data-dk-banner-fechar]')) { e.banner = ''; desenhar({ exp: false }); return; }
    if ((b = t.closest('[data-dk-prender]'))) { ev.stopPropagation(); prender(b.dataset.dkPrender!); return; }
    if (t.closest('[data-dk-casa]')) { abrirCasa(); return; }
    if ((b = t.closest('[data-dk-fechar]'))) { ev.stopPropagation(); fechar(b.dataset.dkFechar!); return; }
    if ((b = t.closest('[data-dk-sep]'))) { ativar(b.dataset.dkSep!); return; }
    if ((b = t.closest('[data-dk-acao]'))) { acao(b.dataset.dkAcao!, b); return; }
    if ((b = t.closest('[data-dk-vista]'))) { e.vista = b.dataset.dkVista as Estado['vista']; desenhar(); return; }
    if ((b = t.closest('[data-dk-dobrar]'))) { ev.stopPropagation(); const id = b.dataset.dkDobrar!; e.arvore[id] = !e.arvore[id]; desenhar({ exp: false }); return; }
    if ((b = t.closest('[data-dk-ir]'))) { const id = b.dataset.dkIr!; pg.classList.remove('is-menu-aberto'); if (id === 'raiz') abrirCasa(); else abrirPasta(id); return; }
    if ((b = t.closest('[data-dk-atalho]'))) { pg.classList.remove('is-menu-aberto'); abrirRota(b.dataset.dkAtalho!); return; }
    if ((b = t.closest('[data-dk-desafixar]'))) { const r = b.dataset.dkDesafixar!; e.fixados = e.fixados.filter((x) => x !== r); dizer(`«${ROTAS[r]?.titulo ?? r}» saiu do acesso rápido.`); desenhar(); return; }
    if ((b = t.closest('[data-dk-pasta-abrir]'))) { const id = b.dataset.dkPastaAbrir!; abrirPasta(id, $(`[data-dk-pasta="${id}"]`)); return; }
    if ((b = t.closest('[data-dk-trab]'))) { e.trabalho = b.dataset.dkTrab as Estado['trabalho']; desenhar(); $<HTMLElement>(`[data-dk-trab="${e.trabalho}"]`)?.focus(); return; }
    if (t.closest('[data-dk-rail]')) { e.rail = !e.rail; const c = $('.dk-corpo'); c?.classList.toggle('is-rail', e.rail); c?.style.setProperty('--sh-lado', `${e.rail ? 72 : e.largura}px`); desenhar({ exp: false }); return; }
    if ((b = t.closest('[data-dk-janela]'))) { const [tipo, chave] = b.dataset.dkJanela!.split(':'); abrirJanela(tipo as Janela['tipo'], chave); return; }
    if ((b = t.closest('[data-dk-restaurar]'))) { const j = e.janelas.find((x) => x.id === b!.dataset.dkRestaurar); if (j) { j.min = false; j.z = topo() + 1; desenhar({ exp: false }); } return; }
    if ((b = t.closest('[data-dk-jan-acao]'))) { acaoJanela(b.closest<HTMLElement>('[data-dk-jan]')!.dataset.dkJan!, b.dataset.dkJanAcao!); return; }
    if ((b = t.closest('[data-dk-doc]'))) { abrirRota(b.dataset.dkDoc!, b.dataset.dkTitulo); return; }
    /* o explorador: um clique escolhe (no toque, abre); na árvore, abre */
    if ((b = t.closest('[data-dk-pasta]'))) { const id = b.dataset.dkPasta!; if (b.getAttribute('aria-disabled') === 'true') { dizer(`«${b.querySelector('.dk-pasta-t')?.textContent}» ainda está no ERP antigo.`); return; } if (e.v6 || (ev as PointerEvent).pointerType === 'touch' || b.closest('.dk-titulo--pasta')) abrirPasta(id, b); else escolher(id); return; }
    if ((b = t.closest('[data-dk-abrir]'))) { const id = b.dataset.dkAbrir!; if (b.closest('.dk-arvore') || (ev as PointerEvent).pointerType === 'touch') abrirRota(id); else { if (b.getAttribute('aria-disabled') === 'true') { e.sel = id; abrirRota(id); return; } escolher(id); } return; }
  }, true);
  window.addEventListener('dblclick', (ev) => {
    if (!pg || editando()) return;
    const b = (ev.target as HTMLElement).closest<HTMLElement>('.dk-exp [data-dk-pasta], .dk-exp [data-dk-abrir]'); if (!b || !pg.contains(b)) return;
    if (b.dataset.dkPasta) abrirPasta(b.dataset.dkPasta, b); else abrirRota(b.dataset.dkAbrir!);
  });
  window.addEventListener('auxclick', (ev) => { const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-dk-sep]'); if (pg?.contains(b as Node) && ev.button === 1) fechar(b!.dataset.dkSep!); });
  document.addEventListener('input', (ev) => { const t = ev.target as HTMLElement; if (pal && t.matches('[data-dk-paleta-q]')) { pal.q = (t as HTMLInputElement).value; pal.i = 0; pintarPaleta(); } });

  /* reordenar os separadores a arrastar */
  let arrastado = '';
  document.addEventListener('dragstart', (ev) => { const s = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-dk-sep][draggable]'); if (!s || !pg?.contains(s)) return; arrastado = s.dataset.dkSep!; ev.dataTransfer?.setData('text/plain', arrastado); s.classList.add('is-arrasta'); });
  document.addEventListener('dragover', (ev) => { const s = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-dk-sep]'); if (arrastado && s && pg?.contains(s)) ev.preventDefault(); });
  document.addEventListener('drop', (ev) => {
    const s = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-dk-sep]'); if (!arrastado || !s || !pg?.contains(s)) return;
    ev.preventDefault();
    const ordem = ordemSeps(e), de = ordem.indexOf(arrastado), para = ordem.indexOf(s.dataset.dkSep!);
    if (de >= 0 && para >= 0 && de !== para) {
      ordem.splice(para, 0, ...ordem.splice(de, 1));
      e.seps = ordem.filter((x) => x !== 'inicio').map((x) => e.seps.find((y) => y.id === x)!); if (!e.semCasa) e.casa = ordem.indexOf('inicio');
      desenhar({ exp: false });
    }
    arrastado = '';
  });
  document.addEventListener('dragend', () => { arrastado = ''; pg?.querySelectorAll('.is-arrasta').forEach((x) => x.classList.remove('is-arrasta')); });

  /* as janelas: trazer para a frente, arrastar, e o tamanho depois de redimensionar */
  document.addEventListener('pointerdown', (ev) => {
    const t = ev.target as HTMLElement, w = t.closest?.<HTMLElement>('[data-dk-jan]'); if (!w || !pg?.contains(w)) return;
    const j = e.janelas.find((x) => x.id === w.dataset.dkJan); if (!j) return;
    if (j.z !== topo()) { j.z = topo() + 1; w.style.zIndex = String(j.z); pg.querySelectorAll('.dk-jan.is-foco').forEach((x) => x.classList.remove('is-foco')); w.classList.add('is-foco'); }
    if (t.closest('[data-dk-arrastar]') && !t.closest('button') && !j.max) { arrasto = { j, el: w, dx: ev.clientX - j.x, dy: ev.clientY - j.y }; w.setPointerCapture(ev.pointerId); w.classList.add('is-arrasta'); }
  });
  document.addEventListener('pointermove', (ev) => {
    if (!arrasto) return;
    const area = dk!.getBoundingClientRect();
    arrasto.j.x = Math.max(0, Math.min(area.width - 120, ev.clientX - arrasto.dx)); arrasto.j.y = Math.max(0, Math.min(area.height - 40, ev.clientY - arrasto.dy));
    arrasto.el.style.left = `${arrasto.j.x}px`; arrasto.el.style.top = `${arrasto.j.y}px`;
  });
  document.addEventListener('pointerup', (ev) => {
    if (arrasto) { arrasto.el.classList.remove('is-arrasta'); arrasto = null; guardar(); return; }
    const w = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-dk-jan]'); if (!w) return;
    const j = e.janelas.find((x) => x.id === w.dataset.dkJan); if (j && !j.max) { j.w = w.offsetWidth; j.h = w.offsetHeight; }
  });
  /* a largura da árvore: arrasta-se o puxador */
  let puxa: { x: number; w: number } | null = null;
  document.addEventListener('pointerdown', (ev) => { if ((ev.target as HTMLElement).closest?.('[data-dk-puxador]') && pg?.contains(ev.target as Node) && !e.rail) { puxa = { x: ev.clientX, w: e.largura }; ev.preventDefault(); } });
  document.addEventListener('pointermove', (ev) => { if (!puxa) return; e.largura = Math.max(200, Math.min(420, puxa.w + ev.clientX - puxa.x)); pg?.querySelector<HTMLElement>('.dk-corpo')?.style.setProperty('--sh-lado', `${e.largura}px`); indicador(); });
  document.addEventListener('pointerup', () => { if (puxa) { puxa = null; guardar(); } });

  window.addEventListener('online', () => { if (normal && e.banner === 'offline') { e.banner = ''; desenhar({ exp: false }); dizer('Ligação de volta.'); } });
  window.addEventListener('offline', () => { if (normal) { e.banner = 'offline'; desenhar({ exp: false }); } });
}
export { TECLA };
