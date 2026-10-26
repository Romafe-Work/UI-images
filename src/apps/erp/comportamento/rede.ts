/* =========================================================
   ERP — v10 do início de sessão: o comportamento (19 out. 2026)
   - UM canvas e UMA cena (rede-cena.ts, carregada à parte com o Three.js). Quando um ecrã da v10 aparece,
     o canvas muda-se para o palco dele e a cena recebe a fase (data-rede). Nada recomeça.
   - O correio: com o campo em foco a rede arruma-se; quando o endereço tem a forma certa, «Continuar»
     acende-se e uma ligação fecha-se até ao centro. Isto só valida a forma: não diz que a conta existe.
   - «Continuar»: a espera no botão e a rede concentrada (0,6 s, o pedido); depois, no mesmo cartão, o campo
     dá lugar à identificação e aparece a palavra-passe (0,38 s); só então o protótipo passa ao 02, que é
     o mesmo desenho, e o foco vai para a palavra-passe. Um endereço @grupo-exemplo.pt segue para o 03.
   - «Mudar» faz o caminho inverso, com o correio de volta no campo.
   - «Entrar»: a espera e a rede concentrada (0,8 s, o pedido ao servidor). Neste protótipo qualquer
     palavra-passe entra, exceto «errada», que dá a recusa. Só depois da resposta: a rede alinha-se (0,55 s),
     o cartão sai e a moldura do ERP desenha-se no sítio dela (0,6 s), e abre o 10 · Compras.
   - Maiúsculas ligadas: aviso por baixo do campo. O olho mostra e esconde a palavra-passe.
   - O rato desloca a cena um pouco (paralaxe); o cartão nunca se mexe com o rato.
   - Fora destes ecrãs, ou com a página escondida, a cena para. Com «reduzir movimento» ou sem WebGL fica o
     desenho parado e tudo é imediato. No editor não há nada disto (o clique escolhe peças).
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { CORREIO } from '../entrar-rede';
import type { CenaRede, Fase } from './rede-cena';
import { destinoAoEntrar } from './inicio';
import { abrirSessao, terminarSessao, escolherEmpresa, lerEmpresa, lerSessao, ultimaEmpresa } from '../sessao';
import { EMPRESAS } from '../entrar-central';

/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CORREIO_FORMA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const espera = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

let cena: CenaRede | null = null;
let carregar: Promise<CenaRede | null> | null = null;
let raiz: HTMLElement | null = null;
let semWebgl = false;
let ocupado = false;
/* de onde se leem as cores quando a rede está fora destes ecrãs (na 00 · Abertura) */
let fonteCores: HTMLElement | null = null;

const temWebgl = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };
const cores = () => {
  const s = getComputedStyle(raiz ?? fonteCores ?? document.documentElement);
  const v = (n: string, d: string) => s.getPropertyValue(n).trim() || d;
  return { no: v('--rede-no', '#ffffff'), aresta: v('--rede-aresta', '#0873bc'), linha: v('--rede-linha', '#9aa6b2'), pulso: v('--rede-pulso', '#0873bc'), laranja: v('--rede-laranja', '#f58214') };
};

function obterCena(): Promise<CenaRede | null> {
  if (cena) return Promise.resolve(cena);
  if (semWebgl) return Promise.resolve(null);
  carregar = carregar || import('./rede-cena').then(({ CenaRede: C }) => {
    const cv = document.createElement('canvas'); cv.className = 'rede__canvas';
    /* só a primeira vez aparece devagar; ao mudar de ecrã o canvas muda de sítio sem piscar */
    cv.style.opacity = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { cv.style.opacity = ''; }));
    try { cena = new C(cv, cores); } catch { semWebgl = true; cena = null; }
    return cena;
  });
  return carregar;
}

/** A 00 · Abertura (abertura.ts) começa a rede no palco dela; ao passar ao 01, armar() muda o mesmo canvas
 *  para o palco do 01, e a rede continua sem recomeçar. */
export async function redeNaAbertura(lugar: HTMLElement): Promise<CenaRede | null> {
  if (quieto() || !temWebgl()) return null;
  fonteCores = lugar;
  const c = await obterCena();
  if (!c || !lugar.isConnected) return null;
  lugar.appendChild(c.canvas); c.medir(); c.pintar(); c.repor(); c.ligar();
  return c;
}

const fase = (f: Fase) => { cena?.irPara(f); if (raiz) raiz.dataset.rede = f; };

/** O ecrã à vista mudou: o canvas vai para o palco dele, e a cena para a fase dele. */
async function armar(): Promise<void> {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .rede');
  if (!r) { raiz = null; if (!document.querySelector('.ecra:not([hidden]) > .versao:not([hidden]) .erp-ab')) cena?.parar(); return; }
  const mudou = r !== raiz;
  raiz = r;
  r.classList.remove('is-a-abrir');
  if (mudou) { prepararCorreio(r); if (r.dataset.passo === 'central') prepararCentral(r); }
  if (editando() || quieto() || (!cena && !temWebgl())) { semWebgl = semWebgl || !temWebgl(); r.classList.add('is-parado'); return; }
  const c = await obterCena();
  if (!c || raiz !== r) { if (!c) r.classList.add('is-parado'); return; }
  const lugar = r.querySelector<HTMLElement>('.rede__lugar')!;
  if (c.canvas.parentElement !== lugar) lugar.appendChild(c.canvas);
  c.medir(); c.pintar();
  if (mudou) { if (c.faseAtual === 'alinhar') c.repor(); c.irPara((r.dataset.rede as Fase) || 'neutro'); }
  c.ligar();
  r.classList.add('is-cena');
}

/* no 01, o botão acende-se conforme o que está escrito (o ecrã pode vir com o campo preenchido) */
function prepararCorreio(r: HTMLElement): void {
  const inp = r.querySelector<HTMLInputElement>('.rede__passo--correio:not([inert]) input[type="email"]');
  if (inp) validar(inp, false);
}

function validar(inp: HTMLInputElement, mostrarErro: boolean): boolean {
  const ok = CORREIO_FORMA.test(inp.value.trim());
  const form = inp.closest('form')!;
  const b = form.querySelector<HTMLButtonElement>('.rede__botao')!;
  if (!b.hasAttribute('aria-busy')) b.disabled = !ok;
  const campo = inp.closest('.rede__campo')!, erro = campo.querySelector<HTMLElement>('.rede__erro')!;
  if (mostrarErro && !ok && inp.value.trim()) {
    campo.classList.add('is-erro'); inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', erro.id);
    erro.hidden = false; erro.querySelector('span')!.textContent = inp.value.includes('@') ? 'Falta o fim do endereço, por exemplo «@romafe.pt».' : 'Escreve o endereço completo, com «@».';
  } else if (ok || !inp.value.trim()) {
    campo.classList.remove('is-erro'); inp.removeAttribute('aria-invalid'); erro.hidden = true;
  }
  return ok;
}

function ocupar(b: HTMLButtonElement, texto: string | null): void {
  const rot = b.querySelector<HTMLElement>('.btn__rotulo')!;
  if (texto) { b.dataset.rotulo = rot.textContent || ''; rot.textContent = texto; b.setAttribute('aria-busy', 'true'); b.disabled = true; }
  else { rot.textContent = b.dataset.rotulo || rot.textContent; b.removeAttribute('aria-busy'); b.disabled = false; }
}

/* «Continuar»: o pedido, a passagem no mesmo cartão, e só depois o ecrã seguinte */
async function continuar(b: HTMLButtonElement): Promise<void> {
  const r = raiz!; const inp = r.querySelector<HTMLInputElement>('.rede__passo--correio:not([inert]) input[type="email"]')!;
  if (!validar(inp, true)) { inp.focus(); return; }
  const correio = inp.value.trim();
  const destino = /@grupo-exemplo\.pt$/i.test(correio) ? 'federado' : 'palavra-passe';
  ocupado = true; ocupar(b, 'A continuar…'); fase('pedido');
  await espera(quieto() ? 0 : 600);
  if (raiz !== r) { ocupado = false; ocupar(b, null); return; }
  if (destino === 'palavra-passe' && !quieto()) {
    r.querySelector('.rede__conta-correio')!.textContent = correio;
    r.querySelector('.rede__cartao')!.classList.add('is-passe');
    fase('passe');
    await espera(380);
  }
  ocupar(b, null); ocupado = false;
  mostrar(destino);
  requestAnimationFrame(() => {
    const novo = raiz;
    if (!novo) return;
    novo.querySelectorAll('.rede__conta-correio').forEach((s) => { s.textContent = correio; });
    novo.querySelector<HTMLInputElement>('.rede__passo--passe:not([inert]) input[type="password"]')?.focus();
  });
}

/* «Mudar»: o caminho inverso, com o correio de volta no campo */
async function mudar(): Promise<void> {
  const r = raiz!; const correio = r.querySelector('.rede__passo--passe:not([inert]) .rede__conta-correio')?.textContent || CORREIO;
  if (!quieto()) { r.querySelector('.rede__cartao')!.classList.remove('is-passe'); fase('foco'); await espera(380); }
  mostrar('entrada');
  requestAnimationFrame(() => {
    const inp = raiz?.querySelector<HTMLInputElement>('.rede__passo--correio:not([inert]) input[type="email"]');
    if (!inp) return;
    inp.value = correio; validar(inp, false); inp.focus(); inp.select();
  });
}

/* «Entrar»: o pedido; a recusa, ou a passagem para o ERP depois da resposta */
async function entrar(b: HTMLButtonElement): Promise<void> {
  const r = raiz!; const inp = r.querySelector<HTMLInputElement>('.rede__passo--passe:not([inert]) input[type="password"]');
  const campo = inp?.closest('.rede__campo'), erro = campo?.querySelector<HTMLElement>('.rede__erro');
  if (inp && !inp.value) {
    campo!.classList.add('is-erro'); erro!.hidden = false; erro!.querySelector('span')!.textContent = 'Escreve a palavra-passe.'; inp.focus(); return;
  }
  r.querySelector('.rede__aviso')?.remove();
  ocupado = true; ocupar(b, 'A entrar…'); fase('pedido');
  await espera(quieto() ? 300 : 800);
  if (raiz !== r) { ocupado = false; ocupar(b, null); return; }
  if (inp && inp.value.trim().toLowerCase() === 'errada') {
    ocupar(b, null); ocupado = false; fase('neutro');
    campo!.classList.add('is-erro'); inp.setAttribute('aria-invalid', 'true');
    erro!.hidden = false; erro!.querySelector('span')!.textContent = 'O correio ou a palavra-passe não estão certos. Confirma e tenta outra vez.';
    inp.value = ''; inp.focus();
    return;
  }
  if (r.hasAttribute('data-geral')) await aEmpresa(r, b); else await abrirErp(r, b);
}

/* v11 (20 out.): o início de sessão geral — depois de entrar não se abre o ERP, escolhe-se a empresa
   (06) e depois a aplicação (07). Com uma empresa só, salta-se o 06. */
async function aEmpresa(r: HTMLElement, b: HTMLButtonElement | null): Promise<void> {
  abrirSessao(r.querySelector('.rede__conta-correio')?.textContent?.trim() || CORREIO);
  if (b) ocupar(b, null);
  ocupado = false;
  if (EMPRESAS.length === 1) { escolherEmpresa(EMPRESAS[0].id); mostrar('escolher-app'); }
  else mostrar('escolher-empresa');
  requestAnimationFrame(() => { raiz?.querySelector<HTMLElement>('.central__opcao:not([disabled])')?.focus(); });
}

/* nos 06 e 07, o que vem da sessão: o correio de quem entrou, a última empresa usada, a empresa escolhida */
function prepararCentral(r: HTMLElement): void {
  const s = lerSessao();
  if (s) r.querySelectorAll('.rede__conta-correio').forEach((x) => { x.textContent = s.correio; });
  const ultima = ultimaEmpresa();
  if (ultima && r.querySelector(`[data-empresa="${ultima}"]`)) {
    r.querySelectorAll<HTMLElement>('[data-empresa]').forEach((op) => { op.querySelector<HTMLElement>('[data-central-ultima]')!.hidden = op.dataset.empresa !== ultima; });
  }
  /* no 07 (não nos estados, que mostram uma empresa de propósito), a empresa escolhida */
  const e = EMPRESAS.find((x) => x.id === lerEmpresa());
  if (e && r.closest('.ecra')?.getAttribute('data-ecra') === 'escolher-app') r.querySelectorAll('[data-central-empresa]').forEach((x) => { x.textContent = e.nome; });
}

async function abrirErp(r: HTMLElement, b: HTMLButtonElement | null): Promise<void> {
  abrirSessao(r.querySelector('.rede__conta-correio')?.textContent?.trim() || CORREIO);
  if (!quieto()) {
    fase('alinhar');
    await espera(550);
    r.classList.add('is-a-abrir');          // o cartão sai e a moldura do ERP desenha-se
    cena?.apagarRede();
    await espera(600);
  }
  if (b) ocupar(b, null);
  ocupado = false;
  /* 19 out.: entra-se no 05 · Início (o espaço de trabalho), ou nas Encomendas se a pessoa escolheu isso */
  mostrar(destinoAoEntrar());
  const erp = document.querySelector<HTMLElement>('.ecra:not([hidden]) .erp, .ecra:not([hidden]) .ws');
  if (erp && !quieto()) { erp.classList.add('is-chegada'); window.setTimeout(() => erp.classList.remove('is-chegada'), 700); }
}

/* 07: o ERP abre com a espera na própria linha (o pedido da sessão da empresa), e depois como na v10 */
async function abrirDaLista(b: HTMLButtonElement): Promise<void> {
  const r = raiz!; const sitio = b.querySelector<HTMLElement>('.central__abrir');
  const sitioSeta = sitio?.querySelector('svg')?.outerHTML;
  ocupado = true; b.disabled = true; b.setAttribute('aria-busy', 'true');
  if (sitio) sitio.outerHTML = '<span class="central__estado"><span class="central__girar" aria-hidden="true"></span>A abrir…</span>';
  fase('pedido');
  await espera(quieto() ? 200 : 600);
  if (raiz !== r) { ocupado = false; return; }
  await abrirErp(r, null);
  /* a linha volta ao normal, para quando se voltar ao 07 */
  b.disabled = false; b.removeAttribute('aria-busy');
  b.querySelector('.central__estado')?.replaceWith(Object.assign(document.createElement('span'), { className: 'central__abrir', innerHTML: 'Abrir' + (sitioSeta ?? '') }));
}

function aoClicar(ev: MouseEvent): void {
  if (editando() || !raiz) return;
  const alvo = ev.target as Element;
  const b = alvo.closest?.<HTMLElement>('.rede [data-rede-acao]');
  if (!b || !raiz.contains(b)) return;
  const acao = b.dataset.redeAcao;
  if (acao === 'olho') {
    const inp = b.parentElement!.querySelector('input')!, ver = inp.type === 'password';
    inp.type = ver ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(ver)); b.setAttribute('aria-label', ver ? 'Esconder a palavra-passe' : 'Mostrar a palavra-passe');
    inp.focus();
    return;
  }
  /* as ações com espera ganham à navegação imediata do protótipo */
  ev.preventDefault(); ev.stopPropagation();
  if (ocupado) return;
  if (acao === 'continuar') continuar(b as HTMLButtonElement);
  else if (acao === 'mudar') mudar();
  else if (acao === 'entrar') entrar(b as HTMLButtonElement);
  else if (acao === 'empresa') { ocupado = true; ocupar(b as HTMLButtonElement, 'A abrir a página da empresa…'); fase('pedido'); const r = raiz!; window.setTimeout(() => (r.hasAttribute('data-geral') ? aEmpresa(r, b as HTMLButtonElement) : abrirErp(r, b as HTMLButtonElement)), 900); }
  else if (acao === 'empresa-escolher') { escolherEmpresa(b.dataset.empresa || EMPRESAS[0].id); mostrar('escolher-app'); requestAnimationFrame(() => { raiz?.querySelector<HTMLElement>('.central__opcao.is-principal')?.focus(); }); }
  else if (acao === 'abrir-erp') abrirDaLista(b as HTMLButtonElement);
  /* (20 out.) as outras aplicações da plataforma: a página delas, no mesmo modo de ver (#so=…), já no Início */
  else if (acao === 'abrir-app') { const so = new URLSearchParams(location.hash.slice(1)).get('so'); location.href = `../${b.dataset.pagina}/#ecra=inicio${so ? `&so=${so}` : ''}`; }
  else if (acao === 'sair') { terminarSessao(); mostrar('entrada'); }
}

export function iniciar(): void {
  requestAnimationFrame(() => { armar(); });
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(() => { armar(); })));
  window.addEventListener('hashchange', () => requestAnimationFrame(() => { armar(); }));
  window.addEventListener('click', aoClicar, true);

  /* Enter num formulário = o botão dele */
  document.addEventListener('submit', (ev) => {
    const f = (ev.target as Element).closest?.('.rede form');
    if (!f) return;
    ev.preventDefault();
    const b = f.querySelector<HTMLButtonElement>('[data-rede-acao]');
    if (b && !b.disabled) b.click();
  }, true);

  /* o correio: validar ao escrever (o erro só aparece ao sair do campo ou ao continuar) */
  document.addEventListener('input', (ev) => {
    const inp = ev.target as HTMLInputElement;
    if (!inp.closest?.('.rede')) return;
    if (inp.type === 'email') { const ok = validar(inp, false); if (!ocupado) fase(ok ? 'valido' : 'foco'); }
    if (inp.type === 'password' || inp.closest('.rede__passo--passe')) { const c = inp.closest('.rede__campo'); c?.classList.remove('is-erro'); const e = c?.querySelector<HTMLElement>('.rede__erro'); if (e) e.hidden = true; inp.removeAttribute('aria-invalid'); }
  });
  document.addEventListener('focusin', (ev) => {
    const inp = ev.target as HTMLInputElement;
    if (!inp.closest?.('.rede input[type="email"]') || ocupado) return;
    raiz?.querySelector('.rede__cartao')?.classList.add('is-foco');
    fase(CORREIO_FORMA.test(inp.value.trim()) ? 'valido' : 'foco');
  });
  document.addEventListener('focusout', (ev) => {
    const inp = ev.target as HTMLInputElement;
    if (!inp.closest?.('.rede input[type="email"]')) return;
    raiz?.querySelector('.rede__cartao')?.classList.remove('is-foco');
    if (!editando()) validar(inp, true);
    if (!ocupado && !CORREIO_FORMA.test(inp.value.trim())) fase('neutro');
  });

  /* as maiúsculas: o navegador diz se estão ligadas a cada tecla */
  const maiusculas = (ev: KeyboardEvent) => {
    const inp = ev.target as HTMLInputElement;
    if (!inp.closest?.('.rede input[type="password"]') || typeof ev.getModifierState !== 'function') return;
    const aviso = inp.closest('.rede__campo')?.querySelector<HTMLElement>('[data-rede-maiusculas]');
    if (aviso) aviso.hidden = !ev.getModifierState('CapsLock');
  };
  document.addEventListener('keydown', maiusculas);
  document.addEventListener('keyup', maiusculas);

  /* a paralaxe: só com rato, nunca no cartão */
  window.addEventListener('pointermove', (ev) => {
    if (!raiz || ev.pointerType !== 'mouse') return;
    cena?.ponteiro((ev.clientX / window.innerWidth) * 2 - 1, (ev.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  /* com a página escondida, a cena para */
  document.addEventListener('visibilitychange', () => { if (document.hidden) cena?.parar(); else if (raiz && !raiz.classList.contains('is-parado')) cena?.ligar(); });

  /* as cores da rede seguem o tema */
  new MutationObserver(() => requestAnimationFrame(() => cena?.pintar())).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => cena?.pintar());
}
