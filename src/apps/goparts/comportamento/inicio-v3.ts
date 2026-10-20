/* =========================================================
   GOPARTS — 10 · Início v3: o que mexe (14 out. 2026)
   - Os modos: os separadores (role=tab; ← → Home End entre eles), as setas e o arrastar no ecrã
     tátil mudam o cartão ativo. Cada cartão recebe --d (−1, 0, 1) e o CSS põe-no no sítio (280 ms);
     o que passa de um lado para o outro salta sem atravessar. Só o ativo recebe o foco (os outros
     ficam `inert`); um clique num cartão de lado traz esse modo. O que se escreveu fica em cada
     cartão. O último modo usado fica guardado (localStorage) e o Início abre nele.
   - A risca laranja do modo ativo, e a das abas do portal (desliza para a aba debaixo do rato e volta
     à escolhida), medem-se aqui (transform e width, 200 ms).
   - As sugestões (referência e marca): ao escrever (2+ letras) «A procurar…» e depois os resultados
     dos dados de exemplo, ou «nenhuma»; vazio e em foco, as recentes. ↑ ↓ escolhem, Enter usa, Esc fecha.
   - Pesquisar (botão ou Enter num campo): o botão fica em «A pesquisar…» e segue para o Catálogo.
   - «Repetir» (pesquisas recentes, veículos guardados): muda para o modo, preenche e pesquisa.
   - Ctrl+K / ⌘K, ou a caixa de procura do topo: a pesquisa global. Filtra ao escrever; ↑ ↓, Enter, Esc;
     o foco fica dentro dela enquanto está aberta e volta ao sítio de onde veio.
   - O primeiro campo do modo ativo recebe o foco só quando o Início abre e nada mais o tem (nunca a meio
     de uma navegação). No editor nada disto rouba o clique.
   ========================================================= */
import { abrirPesquisa } from './barra';
import { mostrar } from '../../../comum/ecras';
import { listaReferencias, GUIA_TEXTOS } from '../portal/inicio-v3';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { identificar, prepararCatalogo, modoPreferido } from './inicio-espaco';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHAVE = 'goparts:inicio-modo';
const lerModo = () => { try { const v = Number(localStorage.getItem(CHAVE)); return Number.isInteger(v) && v >= 0 && v < 3 ? v : null; } catch { return null; } };
const guardarModo = (m: number) => { try { localStorage.setItem(CHAVE, String(m)); } catch { /* sem armazenamento */ } };
const visivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ini3');
const MARCAS = ['Alfa Romeo', 'Audi', 'BMW', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Mercedes-Benz', 'Nissan', 'Opel', 'Peugeot', 'Renault', 'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo'];
const MODELOS: Record<string, string[]> = { Renault: ['Clio IV', 'Mégane IV', 'Captur', 'Kangoo'], Volkswagen: ['Golf VII', 'Polo VI', 'Passat B8'], Peugeot: ['208', '308', '3008'] };

/* ---------- os modos e o carrossel ---------- */
function porModo(ini: HTMLElement, m: number, focar = false): void {
  const anterior = Number(ini.dataset.modo ?? 0);
  ini.dataset.modo = String(m);
  ini.querySelectorAll<HTMLElement>('.ini3__cartao').forEach((c, i) => {
    const d = ((i - m + 4) % 3) - 1, dAntes = ((i - anterior + 4) % 3) - 1;
    /* o que passa de um lado para o outro salta, sem atravessar o ecrã */
    c.classList.toggle('is-sem-transicao', Math.abs(d - dAntes) > 1);
    c.style.setProperty('--d', String(d));
    c.inert = d !== 0;
    c.dataset.lado = d < 0 ? 'ant' : d > 0 ? 'seg' : 'atual';
    c.setAttribute('aria-hidden', String(d !== 0));
  });
  requestAnimationFrame(() => ini.querySelectorAll('.is-sem-transicao').forEach((c) => c.classList.remove('is-sem-transicao')));
  ini.querySelectorAll<HTMLElement>('.ini3__separador').forEach((t, i) => { t.setAttribute('aria-selected', String(i === m)); t.tabIndex = i === m ? 0 : -1; if (i === m && focar) t.focus(); });
  /* as pílulas das setas dizem o nome do modo vizinho */
  const nomes = Array.from(ini.querySelectorAll<HTMLElement>('.ini3__cartao h2')).map((h) => h.textContent ?? '');
  const ant = ini.querySelector('.ini3__seta--ant span'), seg = ini.querySelector('.ini3__seta--seg span');
  if (ant) ant.textContent = nomes[(m + 2) % 3]; if (seg) seg.textContent = nomes[(m + 1) % 3];
  medirRisca(ini);
  if (!ini.dataset.estado) guardarModo(m);
}
function medirRisca(ini: HTMLElement): void {
  const sep = ini.querySelector<HTMLElement>('.ini3__separadores'), ativo = ini.querySelector<HTMLElement>('.ini3__separador[aria-selected="true"]'), risca = ini.querySelector<HTMLElement>('.ini3__risca');
  if (!sep || !ativo || !risca) return;
  risca.style.setProperty('--x', `${ativo.offsetLeft + 12}px`); risca.style.setProperty('--w', `${ativo.offsetWidth - 24}px`);
}
/* a risca das abas do portal: segue o rato e volta à escolhida */
function rIscaAbas(raiz: HTMLElement): void {
  const nav = raiz.querySelector<HTMLElement>('.portal__abas');
  if (!nav || nav.querySelector('.i3-risca-abas')) return;
  const r = document.createElement('i'); r.className = 'i3-risca-abas'; r.setAttribute('aria-hidden', 'true'); nav.appendChild(r);
  const ir = (a: HTMLElement | null) => { if (!a) return; r.style.setProperty('--x', `${a.offsetLeft}px`); r.style.setProperty('--w', `${a.offsetWidth}px`); };
  const atual = () => nav.querySelector<HTMLElement>('.aba[aria-current]');
  ir(atual());
  nav.addEventListener('pointerover', (e) => { const a = (e.target as Element).closest<HTMLElement>('.aba:not(:disabled)'); if (a) ir(a); });
  nav.addEventListener('pointerleave', () => ir(atual()));
}

/* ---------- as sugestões ---------- */
const recentesRef = ['SKF VKBA 6556', 'BOSCH 0 986 494 525', 'SKF VKMC 01250-2'];
let espera = 0;
function sugerir(inp: HTMLInputElement): void {
  const lista = document.getElementById(inp.getAttribute('aria-controls')!) as HTMLElement | null;
  if (!lista) return;
  const q = inp.value.trim(), tipo = inp.dataset.sugerir;
  const abrir = (html: string) => { lista.innerHTML = html; lista.hidden = false; inp.setAttribute('aria-expanded', 'true'); };
  window.clearTimeout(espera);
  if (q.length < 2) {
    if (tipo === 'referencia') abrir(`<li class="ini3__lista-grupo" role="presentation">Recentes</li>${recentesRef.map((r, i) => `<li role="option" class="ini3__sug" data-valor="${r}"${i === 0 ? ' aria-selected="true"' : ''}><span class="ini3__sug-ref">${r}</span></li>`).join('')}`);
    else fechar(inp);
    return;
  }
  /* a carregar primeiro (a resposta da pesquisa demora), depois os resultados */
  abrir(`<li class="ini3__lista-estado" role="presentation"><span class="ini3__roda" aria-hidden="true"></span>A procurar «${q}»…</li>`);
  espera = window.setTimeout(() => {
    if (tipo === 'referencia') {
      const html = listaReferencias(q);
      abrir(html || `<li class="ini3__lista-vazio" role="presentation"><span>Nenhuma referência com «${q}». Experimente a pesquisa parcial, ou procure pelo veículo.</span></li>`);
    } else {
      const m = MARCAS.filter((x) => x.toLowerCase().startsWith(q.toLowerCase()));
      abrir(m.length ? m.map((x, i) => `<li role="option" class="ini3__sug" data-valor="${x}"${i === 0 ? ' aria-selected="true"' : ''}><span>${x.replace(new RegExp(`^(${q})`, 'i'), '<mark>$1</mark>')}</span></li>`).join('') : `<li class="ini3__lista-vazio" role="presentation"><span>Nenhuma marca começa por «${q}».</span></li>`);
    }
  }, quieto() ? 0 : 220);
}
function fechar(inp: HTMLInputElement): void {
  const lista = document.getElementById(inp.getAttribute('aria-controls')!) as HTMLElement | null;
  if (lista) lista.hidden = true;
  inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant');
}
function usar(inp: HTMLInputElement, valor: string): void {
  inp.value = valor; fechar(inp);
  if (inp.dataset.sugerir === 'marca') {
    const card = inp.closest('.ini3__cartao')!, mod = card.querySelector<HTMLSelectElement>('#i3-modelo'), vari = card.querySelector<HTMLSelectElement>('#i3-variante');
    if (mod) { mod.disabled = false; mod.innerHTML = `<option>Escolha o modelo</option>${(MODELOS[valor] ?? ['Todos os modelos']).map((m) => `<option>${m}</option>`).join('')}`; mod.focus(); }
    if (vari) { vari.disabled = true; vari.innerHTML = '<option>Escolha o modelo</option>'; }
  }
}
function moverSugestao(inp: HTMLInputElement, passo: number): void {
  const lista = document.getElementById(inp.getAttribute('aria-controls')!) as HTMLElement | null;
  if (!lista || lista.hidden) { sugerir(inp); return; }
  const ops = Array.from(lista.querySelectorAll<HTMLElement>('[role="option"]'));
  if (!ops.length) return;
  const i = ops.findIndex((o) => o.getAttribute('aria-selected') === 'true');
  const j = (i + passo + ops.length) % ops.length;
  ops.forEach((o, k) => o.setAttribute('aria-selected', String(k === j)));
  if (!ops[j].id) ops[j].id = `${lista.id}-${j}`;
  inp.setAttribute('aria-activedescendant', ops[j].id);
  ops[j].scrollIntoView({ block: 'nearest' });
}

/* ---------- pesquisar ---------- */
function pesquisar(card: HTMLElement): void {
  /* (16 out.) com matrícula ou VIN, o veículo identifica-se aqui mesmo (inicio-espaco.ts); o resto segue para o Catálogo */
  if (card.id === 'i3-cartao-identificar' && identificar(card)) return;
  const b = card.querySelector<HTMLButtonElement>('[data-pesquisar]');
  if (!b || b.disabled) return;
  prepararCatalogo(card);
  const antes = b.innerHTML;
  b.disabled = true; b.setAttribute('aria-busy', 'true'); b.classList.add('is-a-pesquisar');
  b.innerHTML = `${rolamentoSvg('i3-b-' + Date.now(), 'pesquisar', 'ini3__rs-botao')}<span class="btn__rotulo">A pesquisar…</span>`;
  const aviso = visivel()?.parentElement?.querySelector<HTMLElement>('.ini3__aviso'); if (aviso) aviso.textContent = 'A pesquisar…';
  window.setTimeout(() => { b.innerHTML = antes; b.disabled = false; b.removeAttribute('aria-busy'); b.classList.remove('is-a-pesquisar'); mostrar('catalogo'); }, quieto() ? 200 : 700);
}
function repetir(ini: HTMLElement, modo: string, valor: string): void {
  const m = modo === 'identificar' ? 0 : modo === 'selecionar' ? 1 : 2;
  porModo(ini, m);
  const card = ini.querySelectorAll<HTMLElement>('.ini3__cartao')[m];
  const inp = card.querySelector<HTMLInputElement>(m === 0 ? '#i3-matricula' : m === 1 ? '#i3-marca' : '#i3-referencia');
  if (inp) inp.value = m === 0 ? valor.split(' · ')[0] : m === 1 ? valor.split(' ')[0] : valor;
  pesquisar(card);
}

/* ---------- a pesquisa global ---------- */
let deOnde: HTMLElement | null = null;
const painel = () => visivel()?.parentElement?.querySelector<HTMLElement>('.ini3__comando') ?? null;
function fecharComando(): void { const p = painel(); if (!p || p.hidden) return; p.hidden = true; fundoInerte(p, false); deOnde?.focus?.(); }
/** Com a pesquisa global aberta (modal), o resto do portal fica inerte e escondido dos leitores de ecrã. */
function fundoInerte(p: HTMLElement, sim: boolean): void {
  p.parentElement!.querySelectorAll<HTMLElement>(':scope > .portal__topo, :scope > .portal__abas, :scope > .portal__lado, :scope > .ini3').forEach((el) => { el.inert = sim; if (sim) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
function filtrar(p: HTMLElement, q: string): void {
  const lista = p.querySelector<HTMLElement>('.ini3__comando-lista')!;
  lista.querySelectorAll('[data-dinamico]').forEach((x) => x.remove());
  const itens = Array.from(lista.querySelectorAll<HTMLElement>('.ini3__comando-item'));
  itens.forEach((it) => { it.hidden = !!q && !it.textContent!.toLowerCase().includes(q.toLowerCase()); });
  lista.querySelectorAll<HTMLElement>('.ini3__comando-grupo').forEach((g) => { let n = g.nextElementSibling as HTMLElement | null, algum = false; while (n && !n.classList.contains('ini3__comando-grupo')) { if (!n.hidden) algum = true; n = n.nextElementSibling as HTMLElement | null; } g.hidden = !algum; });
  if (q.length >= 2) {
    const refs = listaReferencias(q);
    if (refs) {
      const tmp = document.createElement('ul'); tmp.innerHTML = refs;
      const g = document.createElement('li'); g.className = 'ini3__comando-grupo'; g.setAttribute('role', 'presentation'); g.dataset.dinamico = ''; g.textContent = 'Referências';
      lista.prepend(g);
      Array.from(tmp.children).reverse().forEach((li) => { const el = li as HTMLElement; el.className = 'ini3__comando-item'; el.dataset.dinamico = ''; el.dataset.repetir = 'referencia'; el.removeAttribute('aria-selected'); g.after(el); });
    }
  }
  const vis = Array.from(lista.querySelectorAll<HTMLElement>('.ini3__comando-item:not([hidden])'));
  vis.forEach((it, i) => it.setAttribute('aria-selected', String(i === 0)));
  if (!vis.length && !lista.querySelector('.ini3__comando-nada')) { const li = document.createElement('li'); li.className = 'ini3__lista-vazio ini3__comando-nada'; li.dataset.dinamico = ''; li.textContent = `Nada com «${q}».`; lista.append(li); }
}
function escolherComando(p: HTMLElement): void {
  const it = p.querySelector<HTMLElement>('.ini3__comando-item[aria-selected="true"]:not([hidden])');
  if (!it) return;
  fecharComando();
  if (it.dataset.ir) mostrar(it.dataset.ir);
  else if (it.dataset.repetir) { const ini = visivel(); if (ini) repetir(ini, it.dataset.repetir, it.dataset.valor ?? ''); }
}


/* ---------- os estados (14 out., o briefing dos 17 estados) ---------- */
/** Um botão em carregamento: o rolamento pequeno no lugar do ícone; devolve a função que o repõe. */
function aCarregar(b: HTMLElement, texto: string): () => void {
  const antes = b.innerHTML;
  b.setAttribute('aria-busy', 'true'); (b as HTMLButtonElement).disabled = true;
  b.innerHTML = `${rolamentoSvg('i3-t-' + Date.now(), 'pesquisar')}<span>${texto}</span>`;
  return () => { b.innerHTML = antes; b.removeAttribute('aria-busy'); (b as HTMLButtonElement).disabled = false; };
}
/** 10.6: «Tentar novamente» — o rolamento retoma, confirma-se a ligação e a faixa sai. */
function religar(b: HTMLElement): void {
  const faixa = b.closest<HTMLElement>('.ini3__rede')!, repor = aCarregar(b, 'A ligar…');
  window.setTimeout(() => {
    repor(); b.hidden = true;
    faixa.classList.add('is-ligado');
    faixa.querySelector('.rs')?.classList.add('is-retomar');
    faixa.querySelector('.ini3__rede-texto')!.innerHTML = '<b>Ligação recuperada.</b><span>Já podes continuar.</span>';
    faixa.closest('.ini3')?.classList.remove('is-offline');
    window.setTimeout(() => { faixa.classList.add('is-a-sair'); window.setTimeout(() => faixa.remove(), 400); }, 2400);
  }, quieto() ? 200 : 900);
}
/** 10.7: «Tentar novamente» nos pedidos — o seu carregamento, e depois os pedidos no lugar do erro. */
function tentarPedidos(b: HTMLElement): void {
  const falha = b.closest<HTMLElement>('.ini3__falha')!, repor = aCarregar(b, 'A carregar…');
  window.setTimeout(() => { repor(); const lista = falha.nextElementSibling as HTMLElement | null; falha.remove(); if (lista) lista.hidden = false; }, quieto() ? 200 : 900);
}
/** 10.8: a visita guiada — passo a passo, cada passo põe o seu cartão ao centro; no fim (ou «Saltar») não volta. */
function guiar(ini: HTMLElement, passo: number | 'saltar'): void {
  const g = ini.querySelector<HTMLElement>('.ini3__guia'); if (!g) return;
  const n = passo === 'saltar' ? 3 : Number(g.dataset.guia) + passo;
  if (n < 0) return;
  if (n > 2) { try { localStorage.setItem('goparts:guia-vista', '1'); } catch { /* sem armazenamento */ } g.remove(); ini.classList.remove('is-guia'); return; }
  g.dataset.guia = String(n);
  g.querySelector('.ini3__guia-passo b')!.textContent = String(n + 1);
  g.querySelector('.ini3__guia-titulo')!.textContent = GUIA_TEXTOS[n][0];
  g.querySelector('.ini3__guia-texto p:last-child')!.textContent = GUIA_TEXTOS[n][1];
  (g.querySelector('[data-guia-passo="-1"]') as HTMLButtonElement).disabled = n === 0;
  g.querySelector('.ini3__guia-seguinte .btn__rotulo')!.textContent = n === 2 ? 'Começar' : 'Seguinte';
  porModo(ini, n);
}

/* ---------- ligar ---------- */
let atual: HTMLElement | null = null;
function armar(): void {
  const ini = visivel();
  if (!ini || ini === atual) { if (!ini) atual = null; return; }
  const primeira = !atual;
  atual = ini;
  const m = ini.dataset.estado ? Number(ini.dataset.modo) : modoPreferido() ?? lerModo() ?? Number(ini.dataset.modo ?? 2);
  porModo(ini, m);
  /* (14 out.: «só quero uma barra») a risca das abas é a da v2; rIscaAbas fica por chamar */
  void rIscaAbas;
  /* o foco no primeiro campo só quando o Início abre e nada mais o tem */
  if (primeira && !ini.dataset.estado && !editando() && (document.activeElement === document.body || !document.activeElement)) {
    ini.querySelectorAll<HTMLElement>('.ini3__cartao')[m]?.querySelector<HTMLInputElement>('input:not([type="checkbox"])')?.focus({ preventScroll: true });
  }
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => { const ini = visivel(); if (ini) medirRisca(ini); });

  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const alvo = ev.target as Element, ini = alvo.closest?.<HTMLElement>('.ini3');
    /* (16 out.) a pesquisa global é a da barra de topo (barra.ts), a mesma em todos os ecrãs */
    if (alvo.closest?.('.ini3 [data-comando]')) { ev.preventDefault(); abrirPesquisa(alvo.closest<HTMLElement>('[data-comando]')); return; }
    const p = alvo.closest?.<HTMLElement>('.ini3__comando');
    if (p) { if (alvo === p) { fecharComando(); return; } const it = alvo.closest<HTMLElement>('.ini3__comando-item'); if (it) { p.querySelectorAll('.ini3__comando-item').forEach((x) => x.setAttribute('aria-selected', String(x === it))); ev.preventDefault(); ev.stopPropagation(); escolherComando(p); } return; }
    if (!ini) return;
    const sep = alvo.closest<HTMLElement>('.ini3__separador'); if (sep) { porModo(ini, Number(sep.dataset.modo)); return; }
    const passo = alvo.closest<HTMLElement>('[data-passo]'); if (passo) { porModo(ini, (Number(ini.dataset.modo) + Number(passo.dataset.passo) + 3) % 3); return; }
    const lado = alvo.closest<HTMLElement>('.ini3__cartao[inert]'); if (lado) { porModo(ini, Number(lado.dataset.cartao)); return; }
    const tipo = alvo.closest<HTMLElement>('.ini3__tipo'); if (tipo) { tipo.parentElement!.querySelectorAll('.ini3__tipo').forEach((t) => t.setAttribute('aria-checked', String(t === tipo))); trocarTipo(tipo); return; }
    const sug = alvo.closest<HTMLElement>('.ini3__sug'); if (sug) { const inp = sug.closest('.ini3__campo')!.querySelector<HTMLInputElement>('input')!; usar(inp, sug.dataset.valor!); inp.focus(); return; }
    const religa = alvo.closest<HTMLElement>('[data-religar]'); if (religa) { religar(religa); return; }
    const tp = alvo.closest<HTMLElement>('[data-tentar-pedidos]'); if (tp) { tentarPedidos(tp); return; }
    const tpag = alvo.closest<HTMLElement>('[data-tentar-pagina]'); if (tpag) { const repor = aCarregar(tpag, 'A tentar…'); window.setTimeout(() => { repor(); mostrar('inicio'); }, quieto() ? 200 : 800); return; }
    const foc = alvo.closest<HTMLElement>('[data-focar]'); if (foc) { ev.preventDefault(); document.getElementById(foc.dataset.focar!)?.focus(); return; }
    const gp = alvo.closest<HTMLElement>('[data-guia-passo]'); if (gp) { guiar(ini, Number(gp.dataset.guiaPasso)); return; }
    if (alvo.closest('[data-guia-saltar]')) { guiar(ini, 'saltar'); return; }
    const eq = alvo.closest<HTMLElement>('[data-equivalencias]'); if (eq) { const c = eq.closest<HTMLElement>('.ini3__cartao')!; c.querySelectorAll<HTMLInputElement>('.ini3__marcar input[type="checkbox"]').forEach((x, i) => { if (i === 0) x.checked = true; }); c.querySelector('.ini3__nada')?.remove(); pesquisar(c); return; }
    const limpar = alvo.closest<HTMLElement>('[data-limpar]'); if (limpar) { limpar.closest('.ini3__cartao')!.querySelector('.ini3__nada')?.remove(); limpar.closest('.ini3__cartao')!.querySelectorAll<HTMLInputElement>('input:not([type="radio"]):not([type="checkbox"])').forEach((x) => { x.value = ''; }); return; }
    const pes = alvo.closest<HTMLElement>('[data-pesquisar]'); if (pes) { pesquisar(pes.closest('.ini3__cartao')!); return; }
    const rep = alvo.closest<HTMLElement>('[data-repetir]'); if (rep) { ev.preventDefault(); ev.stopPropagation(); repetir(ini, rep.dataset.repetir!, rep.dataset.valor ?? ''); return; }
    if (!alvo.closest('.ini3__sugere')) ini.querySelectorAll<HTMLInputElement>('[data-sugerir]').forEach(fechar);
  }, true);

  document.addEventListener('input', (ev) => {
    const inp = ev.target as HTMLInputElement;
    if (inp.matches?.('.ini3 [data-sugerir]')) sugerir(inp);
    if (inp.matches?.('.ini3__comando input')) filtrar(inp.closest('.ini3__comando')!, inp.value.trim());
  });
  document.addEventListener('focusin', (ev) => { const inp = ev.target as HTMLInputElement; if (inp.matches?.('.ini3 [data-sugerir="referencia"]') && !inp.value) sugerir(inp); });

  document.addEventListener('keydown', (ev) => {
    if (editando()) return;
    const ini = visivel();
    /* Ctrl+K / ⌘K: a pesquisa global, de qualquer sítio do Início */
    const alvo = ev.target as HTMLElement;
    const p = alvo.closest?.<HTMLElement>('.ini3__comando');
    if (p) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharComando(); }
      else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        const vis = Array.from(p.querySelectorAll<HTMLElement>('.ini3__comando-item:not([hidden])')); if (!vis.length) return;
        const i = vis.findIndex((x) => x.getAttribute('aria-selected') === 'true'), j = (i + (ev.key === 'ArrowDown' ? 1 : -1) + vis.length) % vis.length;
        vis.forEach((x, k) => x.setAttribute('aria-selected', String(k === j))); vis[j].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') { ev.preventDefault(); escolherComando(p); }
      else if (ev.key === 'Tab') { ev.preventDefault(); p.querySelector<HTMLInputElement>('input')!.focus(); }
      return;
    }
    if (!ini || !ini.contains(alvo)) return;
    /* os separadores: ← → Home End */
    if (alvo.matches('.ini3__separador')) {
      const n = Number(ini.dataset.modo);
      const m = ev.key === 'ArrowRight' ? (n + 1) % 3 : ev.key === 'ArrowLeft' ? (n + 2) % 3 : ev.key === 'Home' ? 0 : ev.key === 'End' ? 2 : -1;
      if (m >= 0) { ev.preventDefault(); porModo(ini, m, true); }
      return;
    }
    if (alvo.matches('[data-sugerir]')) {
      const inp = alvo as HTMLInputElement, lista = document.getElementById(inp.getAttribute('aria-controls')!) as HTMLElement | null;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); moverSugestao(inp, ev.key === 'ArrowDown' ? 1 : -1); return; }
      if (ev.key === 'Escape' && lista && !lista.hidden) { ev.preventDefault(); fechar(inp); return; }
      if (ev.key === 'Enter' && lista && !lista.hidden) { const sel = lista.querySelector<HTMLElement>('[aria-selected="true"]'); if (sel) { ev.preventDefault(); usar(inp, sel.dataset.valor!); if (inp.dataset.sugerir === 'referencia') pesquisar(inp.closest('.ini3__cartao')!); return; } }
    }
    if (ev.key === 'Enter' && alvo.matches('.ini3__cartao input:not([type="checkbox"])')) { ev.preventDefault(); pesquisar(alvo.closest('.ini3__cartao')!); }
  });

  /* arrastar no ecrã tátil (fora dos campos): muda de modo */
  let x0: number | null = null;
  document.addEventListener('pointerdown', (ev) => { const pal = (ev.target as Element).closest?.('.ini3__palco'); x0 = pal && ev.pointerType !== 'mouse' && !(ev.target as Element).closest('input, select, button, label') ? ev.clientX : null; });
  document.addEventListener('pointerup', (ev) => { if (x0 === null) return; const dx = ev.clientX - x0; x0 = null; const ini = visivel(); if (ini && Math.abs(dx) > 60) porModo(ini, (Number(ini.dataset.modo) + (dx < 0 ? 1 : 2)) % 3); });
}

/** Identificar: o tipo escolhido muda o rótulo, o exemplo e o «P» da matrícula. */
function trocarTipo(tipo: HTMLElement): void {
  const card = tipo.closest('.ini3__cartao'); if (!card || card.id !== 'i3-cartao-identificar') return;
  const t = Number(tipo.dataset.tipo), label = card.querySelector('label[for="i3-matricula"]'), inp = card.querySelector<HTMLInputElement>('#i3-matricula'), pais = card.querySelector<HTMLElement>('.ini3__pais');
  const [rot, ex] = ([['Matrícula', 'AA-00-AA'], ['VIN / chassis', '17 caracteres, ex.: VF1RFB00X56789012'], ['Descrição', 'Ex.: Clio IV 1.5 dCi 2017'], ['Código do motor', 'Ex.: K9K 608']] as const)[t];
  if (label) label.textContent = rot; if (inp) { inp.placeholder = ex; inp.focus(); } if (pais) pais.hidden = t !== 0;
}
