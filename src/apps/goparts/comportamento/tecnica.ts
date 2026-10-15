/* =========================================================
   GOPARTS — 17 · Informações técnicas: o comportamento (15 out. 2026; portal/tecnica.ts)
   - ESCOLHER: a pesquisa (marca, modelo, código do motor) filtra ao escrever; as marcas trocam a lista; clicar
     numa linha (ou Enter) escolhe o veículo: a silhueta e o nome voam da linha para a barra (300 ms), as secções
     entram uma a uma e o explorador aparece.
   - NAVEGAR: a risca laranja desliza para a secção aberta (220 ms); o conteúdo troca com 250 ms; os grupos
     abrem e fecham (sem animar a altura: os itens entram com opacidade e deslocamento).
   - EXPLORAR: passar num sistema acende a zona; escolher deixa-a acesa e lista os documentos dele.
   - DOCUMENTOS: abrir mostra o leitor (o esqueleto enquanto o fornecedor responde, 300 ms); a miniatura de uma
     figura cresce até ao visor (400 ms); zoom com +/−, roda do rato e teclado; arrastar para mover; Esc fecha e a
     figura volta à miniatura.
   - PESQUISA TÉCNICA: secções, sistemas e documentos do veículo ao escrever, com as setas e Enter.
   Só transform e opacity nas animações; com «reduzir movimento» as trocas são imediatas.
   ========================================================= */
import { contexto, escolher, trabalho, conteudo, docsSistema, sugestoes, visorCorpo, linhasVeiculos, contaVeiculos, semVeiculos, faixa, GIRA, type Opcoes } from '../portal/tecnica';
import { veiculoDe, docsDe, procurarVeiculos, veiculosDaMarca, type IdSeccao, type IdSistema } from '../portal/tecnica-dados';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAIDA = 'cubic-bezier(.22, 1, .36, 1)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--tec:not(.portal--estado) .tec');
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));

/** O que está aberto em cada ecrã vivo. */
interface Estado { veiculo?: string; seccao: IdSeccao | 'geral'; doc?: string; sistema?: IdSistema; q: string; marca: string; fig?: number }
const estados = new WeakMap<HTMLElement, Estado>();
const est = (m: HTMLElement) => { let e = estados.get(m); if (!e) { e = { veiculo: m.dataset.veiculo, seccao: 'geral', q: '', marca: 'BMW' }; estados.set(m, e); } return e; };
const ops = (m: HTMLElement, extra: Partial<Opcoes> = {}): Opcoes => { const e = est(m); return { px: m.dataset.px, veiculo: e.veiculo, seccao: e.seccao, doc: e.doc, sistema: e.sistema, q: e.q, marca: e.marca, ...extra }; };

/* ---------- escolher ---------- */
let tPesquisa = 0;
function listar(m: HTMLElement, espera = true): void {
  const e = est(m);
  const lista = e.q ? procurarVeiculos(e.q) : veiculosDaMarca(e.marca);
  const conta = $(m, '.tec__conta')!, caixa = $(m, '.tec__lista')!;
  $$(m, '.tec__marca').forEach((b) => b.setAttribute('aria-checked', String(!e.q && b.dataset.marca === e.marca)));
  const pintar = () => {
    conta.innerHTML = contaVeiculos(lista, e.q, e.marca);
    caixa.innerHTML = lista.length ? `<table class="tec__tabela">${CABECA()}${linhasVeiculos(lista)}</table>` : semVeiculos(e.q);
    if (!lista.length) caixa.dataset.vazio = '1'; else delete caixa.dataset.vazio;
    if (!quieto()) $$(caixa, '.tec__v, .tec__m, .tec__vazio').slice(0, 24).forEach((r, i) => r.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 18, easing: SAIDA, fill: 'backwards' }));
  };
  window.clearTimeout(tPesquisa);
  if (!espera || quieto()) { pintar(); return; }
  /* a pesquisa pendente: o que já lá estava fica esbatido e a contagem diz que está a pesquisar */
  conta.innerHTML = `${GIRA()} A pesquisar${e.q ? ` «${e.q.replace(/</g, '&lt;')}»` : ''}…`;
  $(caixa, '.tec__tabela')?.classList.add('is-a-pesquisar');
  tPesquisa = window.setTimeout(pintar, 260);
}
/* a tabela das motorizações guarda o cabeçalho: se a lista ficou vazia, vem do HTML do ecrã */
const CABECA = () => `<thead><tr><th scope="col">Veículo</th><th scope="col">Código do motor</th><th scope="col">Combustível</th><th scope="col" class="tec__num">Potência</th><th scope="col" class="tec__num">Fabricado desde</th><th scope="col" class="tec__num">Fabricado até</th><th scope="col"><span class="tec__sr">Escolher</span></th></tr></thead>`;

function escolherVeiculo(m: HTMLElement, chave: string, linha?: HTMLElement | null): void {
  const v = veiculoDe(chave); if (!v) return;
  const e = est(m);
  const de = linha ? { carro: $(linha, '.tec__v-carro')?.getBoundingClientRect(), nome: $(linha, '.tec__v-nome b, td:first-child')?.getBoundingClientRect() } : undefined;
  Object.assign(e, { veiculo: chave, seccao: 'geral', doc: undefined, sistema: undefined });
  m.dataset.veiculo = chave;
  $(m, '.tec__ctx')!.outerHTML = contexto(v, ops(m));
  const corpo = $(m, '.tec__escolher, .tec__trabalho')!;
  corpo.outerHTML = trabalho(v, ops(m));
  const topo = $(m, '.tec__cabeca')!.getBoundingClientRect().top;
  if (topo < 0) { $(m, '.tec__cabeca')!.scrollIntoView({ block: 'start' }); }
  armarIndicador(m, false);
  if (quieto()) { $<HTMLElement>(m, '.tec__item[aria-current]')?.focus({ preventScroll: true }); return; }
  /* o elemento partilhado: a silhueta e o nome partem do sítio da linha */
  const voar = (el: HTMLElement | null, r?: DOMRect, escala = true) => {
    if (!el || !r) return;
    const a = el.getBoundingClientRect();
    const sx = escala ? r.width / a.width : 1, sy = escala ? r.height / a.height : 1;
    el.animate([{ transform: `translate(${r.left - a.left}px, ${r.top - a.top}px) scale(${sx}, ${sy})`, transformOrigin: 'top left' }, { transform: 'none', transformOrigin: 'top left' }], { duration: 300, easing: SAIDA });
  };
  voar($(m, '.tec__ctx-carro'), de?.carro);
  voar($(m, '.tec__migalhas'), de?.nome, false);
  $(m, '.tec__ctx')!.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 300, easing: SAIDA });
  $(m, '.tec__ctx-dados')?.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 120, easing: SAIDA, fill: 'backwards' });
  m.classList.add('tec--entrar');
  window.setTimeout(() => m.classList.remove('tec--entrar'), 900);
  $<HTMLElement>(m, '.tec__item[aria-current]')?.focus({ preventScroll: true });
}

function mudarVeiculo(m: HTMLElement): void {
  const e = est(m), v = e.veiculo ? veiculoDe(e.veiculo) : undefined;
  if (v) { e.marca = v.marca; e.q = ''; }
  const antes = e.veiculo;
  Object.assign(e, { veiculo: undefined, seccao: 'geral', doc: undefined, sistema: undefined });
  delete m.dataset.veiculo;
  fecharSugestoes(m);
  $(m, '.tec__ctx')!.outerHTML = contexto(undefined);
  $(m, '.tec__trabalho, .tec__escolher')!.outerHTML = escolher(ops(m));
  const linha = antes ? $$(m, '.tec__v').find((r) => r.dataset.chave === antes) : undefined;
  if (linha) { linha.classList.add('is-anterior'); linha.scrollIntoView({ block: 'center', behavior: quieto() ? 'auto' : 'smooth' }); linha.focus({ preventScroll: true }); }
  if (!quieto()) $(m, '.tec__escolher')?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: SAIDA });
}

/* ---------- navegar ---------- */
function armarIndicador(m: HTMLElement, animar = true): void {
  const lista = $(m, '.tec__nav-lista'), ind = $(m, '.tec__indicador'); if (!lista || !ind) return;
  const item = $(lista, '.tec__item[aria-current]');
  const visivel = item && item.offsetParent !== null && !item.closest('ul[hidden]');
  $$(m, '.tec__grupo').forEach((g) => g.classList.toggle('tem-atual', !!item && g.contains(item) && !visivel));
  $(m, '.tec__nav')?.classList.toggle('tem-indicador', !!visivel);
  if (!visivel) { ind.style.opacity = '0'; return; }
  const y = item!.getBoundingClientRect().top - lista.getBoundingClientRect().top;
  ind.style.transition = animar && !quieto() ? 'transform 220ms cubic-bezier(.22, 1, .36, 1), opacity 150ms ease' : 'none';
  ind.style.height = `${item!.offsetHeight}px`;
  ind.style.transform = `translateY(${y}px)`;
  ind.style.opacity = '1';
}
function pintarConteudo(m: HTMLElement, extra: Partial<Opcoes> = {}, direcao = 1): void {
  const e = est(m), v = veiculoDe(e.veiculo!); if (!v) return;
  const c = $(m, '.tec__conteudo')!;
  c.innerHTML = conteudo(v, ops(m, extra));
  c.dataset.atual = e.doc ? docsDe(v).find((d) => d.id === e.doc)?.seccao ?? e.seccao : e.seccao;
  const atual = c.dataset.atual;
  $$(m, '.tec__item').forEach((b) => { if (b.dataset.sec === atual) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const rotulo = $(m, '.tec__nav-abrir b'); if (rotulo) rotulo.textContent = $(m, `.tec__item[data-sec="${atual}"] .tec__item-nome`)?.textContent ?? 'Visão geral';
  armarIndicador(m);
  if (!quieto()) c.firstElementChild?.animate([{ opacity: 0, transform: `translateY(${8 * direcao}px)` }, { opacity: 1, transform: 'none' }], { duration: 250, easing: SAIDA });
}
function irSeccao(m: HTMLElement, sec: IdSeccao | 'geral', sistema?: IdSistema): void {
  const e = est(m);
  Object.assign(e, { seccao: sec, doc: undefined, sistema });
  fecharNav(m);
  pintarConteudo(m);
  const c = $(m, '.tec__conteudo')!;
  if (c.getBoundingClientRect().top < 0) c.scrollIntoView({ block: 'start', behavior: quieto() ? 'auto' : 'smooth' });
  if (sistema && sec === 'geral') $(m, '.tec__expl')?.scrollIntoView({ block: 'nearest' });
}
function abrirDoc(m: HTMLElement, id: string, aviso = ''): void {
  const e = est(m);
  const v = veiculoDe(e.veiculo!); if (!v) return;
  const d = docsDe(v).find((x) => x.id === id); if (!d) return;
  Object.assign(e, { doc: id, seccao: d.seccao });
  fecharNav(m);
  /* o esqueleto enquanto o fornecedor responde; depois o documento */
  pintarConteudo(m, { carga: 'doc', aviso });
  const c = $(m, '.tec__conteudo')!;
  if (c.getBoundingClientRect().top < 0) c.scrollIntoView({ block: 'start' });
  window.setTimeout(() => {
    if (est(m).doc !== id) return;
    c.innerHTML = conteudo(v, ops(m, { aviso }));
    if (!quieto()) $$(c, '.tec__fonte, .tec__figs > *').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: i * 40, easing: SAIDA, fill: 'backwards' }));
    $<HTMLElement>(c, '.tec__pag-titulo')?.focus?.();
  }, quieto() ? 120 : 480);
}
function fecharNav(m: HTMLElement): void { const b = $(m, '.tec__nav-abrir'); if (b?.getAttribute('aria-expanded') === 'true') { b.setAttribute('aria-expanded', 'false'); $(m, '.tec__nav')!.classList.remove('is-aberta'); } }

/* ---------- explorar ---------- */
function escolherSistema(m: HTMLElement, sis: IdSistema): void {
  const e = est(m), v = veiculoDe(e.veiculo!); if (!v) return;
  e.sistema = e.sistema === sis ? undefined : sis;
  const ex = $(m, '.tec__expl')!;
  if (e.sistema) ex.dataset.sis = e.sistema; else delete ex.dataset.sis;
  $$(ex, '.tec__sistema').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sis === e.sistema)));
  $$(ex, '.tec__zona').forEach((z) => { if (z.dataset.sis === e.sistema) z.setAttribute('aria-current', 'true'); else z.removeAttribute('aria-current'); });
  const caixa = $(ex, '.tec__expl-docs')!;
  if (e.sistema) caixa.innerHTML = docsSistema(v, docsDe(v), e.sistema);
  else caixa.innerHTML = `<p class="tec__expl-dica">Nenhum sistema escolhido. Os ${docsDe(v).length} documentos deste veículo estão também nas secções, à esquerda.</p>`;
  if (!quieto()) $$(caixa, '.tec__sis-cabeca, li').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 250, delay: i * 30, easing: SAIDA, fill: 'backwards' }));
}
function acender(m: HTMLElement, sis: string | undefined): void { $$(m, '.tec__zona').forEach((z) => z.classList.toggle('is-hover', z.dataset.sis === sis)); }

/* ---------- a pesquisa técnica ---------- */
function abrirSugestoes(m: HTMLElement, q: string): void {
  const e = est(m), v = veiculoDe(e.veiculo!); if (!v) return;
  const caixa = $(m, '.tec__sugestoes')!, campo = $<HTMLInputElement>(m, '.tec__procura-campo')!;
  if (!q.trim()) { fecharSugestoes(m); return; }
  caixa.innerHTML = sugestoes(v, q.trim());
  caixa.hidden = false; campo.setAttribute('aria-expanded', 'true');
  $$(caixa, '[role="option"]').forEach((o, i) => { o.id = `${m.dataset.px}-sug-${i}`; o.setAttribute('aria-selected', 'false'); });
  campo.removeAttribute('aria-activedescendant');
}
function fecharSugestoes(m: HTMLElement): void { const c = $(m, '.tec__sugestoes'); if (c) c.hidden = true; $(m, '.tec__procura-campo')?.setAttribute('aria-expanded', 'false'); }
function escolherSugestao(m: HTMLElement, o: HTMLElement): void {
  fecharSugestoes(m);
  const campo = $<HTMLInputElement>(m, '.tec__procura-campo'); if (campo) campo.value = '';
  if (o.dataset.sec) irSeccao(m, o.dataset.sec as IdSeccao);
  else if (o.dataset.sis) { irSeccao(m, 'geral'); escolherSistema(m, o.dataset.sis as IdSistema); }
  else if (o.dataset.doc) abrirDoc(m, o.dataset.doc);
}

/* ---------- o visor das figuras ---------- */
interface Vista { z: number; x: number; y: number }
const vistas = new WeakMap<HTMLElement, Vista>();
let origemVisor: HTMLElement | null = null;
function aplicarVista(m: HTMLElement, animar = false): void {
  const f = $(m, '.tec__visor-folha'); const v = vistas.get(m) ?? { z: 1, x: 0, y: 0 };
  if (f) { f.style.transition = animar && !quieto() ? 'transform 200ms cubic-bezier(.22, 1, .36, 1)' : 'none'; f.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.z})`; }
  const n = $(m, '.tec__zoom-n'); if (n) n.textContent = `${Math.round(v.z * 100)}%`;
}
function zoom(m: HTMLElement, fator: number, cx?: number, cy?: number): void {
  const v = vistas.get(m) ?? { z: 1, x: 0, y: 0 };
  const z = fator === 0 ? 1 : Math.min(6, Math.max(.5, v.z * fator));
  if (fator === 0) { vistas.set(m, { z: 1, x: 0, y: 0 }); aplicarVista(m, true); return; }
  /* o ponto debaixo do rato fica no sítio */
  const palco = $(m, '.tec__visor-palco')!.getBoundingClientRect();
  const px = (cx ?? palco.left + palco.width / 2) - (palco.left + palco.width / 2), py = (cy ?? palco.top + palco.height / 2) - (palco.top + palco.height / 2);
  const k = z / v.z;
  vistas.set(m, { z, x: px - (px - v.x) * k, y: py - (py - v.y) * k });
  aplicarVista(m, cx === undefined);
}
function abrirVisor(m: HTMLElement, fig: number, de?: HTMLElement | null): void {
  const e = est(m), v = veiculoDe(e.veiculo!); if (!v || !e.doc) return;
  const d = docsDe(v).find((x) => x.id === e.doc); if (!d) return;
  e.fig = fig;
  origemVisor = de ?? origemVisor;
  const visor = $(m, '.tec__visor')!, veu = $(m, '.tec__veu')!;
  visor.innerHTML = visorCorpo(v, d, fig, ops(m));
  vistas.set(m, { z: 1, x: 0, y: 0 });
  const abrir = visor.hidden;
  visor.hidden = false; veu.hidden = false;
  document.documentElement.classList.add('tec-visor-aberto');
  if (abrir && !quieto()) {
    veu.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: SAIDA });
    const f = $(visor, '.tec__visor-folha'), mini = de ? $(de, '.tec__folha-mini') ?? de : null;
    if (f && mini) {
      const a = f.getBoundingClientRect(), r = mini.getBoundingClientRect();
      f.animate([{ transform: `translate(${r.left + r.width / 2 - (a.left + a.width / 2)}px, ${r.top + r.height / 2 - (a.top + a.height / 2)}px) scale(${r.width / a.width})` }, { transform: 'translate(0px, 0px) scale(1)' }], { duration: 400, easing: SAIDA });
    }
    $$(visor, '.tec__visor-barra > *').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 120 + i * 30, easing: SAIDA, fill: 'backwards' }));
  }
  $<HTMLElement>(visor, '.tec__visor-palco')?.focus({ preventScroll: true });
}
function fecharVisor(m: HTMLElement): void {
  const visor = $(m, '.tec__visor')!, veu = $(m, '.tec__veu')!;
  if (visor.hidden) return;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  const fim = () => { visor.hidden = true; veu.hidden = true; visor.innerHTML = ''; document.documentElement.classList.remove('tec-visor-aberto'); origemVisor?.focus({ preventScroll: true }); est(m).fig = undefined; };
  const f = $(visor, '.tec__visor-folha'), mini = origemVisor && origemVisor.isConnected ? $(origemVisor, '.tec__folha-mini') ?? origemVisor : null;
  if (quieto() || !f || !mini) { fim(); return; }
  const a = f.getBoundingClientRect(), r = mini.getBoundingClientRect();
  const ida = f.animate([{ transform: f.style.transform || 'none' }, { transform: `translate(${r.left + r.width / 2 - (a.left + a.width / 2)}px, ${r.top + r.height / 2 - (a.top + a.height / 2)}px) scale(${r.width / a.width})`, opacity: .4 }], { duration: 320, easing: SAIDA, fill: 'forwards' });
  veu.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: SAIDA, fill: 'forwards' });
  $(visor, '.tec__visor-barra')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
  ida.onfinish = fim;
}

/* ---------- a procura de um código de avaria ---------- */
function procurarAvaria(m: HTMLElement, form: HTMLFormElement): void {
  const campo = $<HTMLInputElement>(form, '.tec__avaria-campo')!, nota = $(form, '.tec__avaria-n')!;
  const cod = campo.value.trim().toUpperCase();
  if (!/^[PBCU][0-9A-F]{4}$/.test(cod)) {
    campo.setAttribute('aria-invalid', 'true');
    nota.classList.add('is-erro');
    nota.textContent = cod ? `«${campo.value.trim()}» não é um código de avaria. Escreva uma letra (P, B, C ou U) e quatro algarismos, por exemplo P0401.` : 'Escreva o código de avaria, por exemplo P0401.';
    campo.focus(); return;
  }
  const v = veiculoDe(est(m).veiculo!); if (!v) return;
  const d = docsDe(v).find((x) => x.seccao === 'diagnosticos' && x.tipo === 'Tabela'); if (!d) return;
  abrirDoc(m, d.id, faixa('info', `A procurar ${cod} neste documento do WorkshopData.`, 'A descrição e os passos de diagnóstico são os do fornecedor; se o código não existir para este motor, o documento diz isso.'));
}

/* ---------- o WorkshopData: abre fora ---------- */
function abrirWorkshop(b: HTMLButtonElement): void {
  const rot = $(b, '.btn__rotulo')!; const antes = rot.textContent;
  b.disabled = true; b.setAttribute('aria-busy', 'true'); rot.textContent = 'A abrir…';
  window.setTimeout(() => {
    b.disabled = false; b.removeAttribute('aria-busy'); rot.textContent = antes;
    const c = b.closest('.tec__wd')!;
    $(c, '.tec__faixa')?.remove();
    c.insertAdjacentHTML('afterbegin', faixa('info', 'O WorkshopData abriu numa janela nova.', 'Se não a vê, o navegador pode tê-la bloqueado: permita janelas deste portal e carregue outra vez.'));
  }, quieto() ? 150 : 900);
}

/* ---------- ligar ---------- */
function armar(): void {
  const m = vivo(); if (!m) return;
  est(m);
  requestAnimationFrame(() => armarIndicador(m, false));
}
export function iniciar(): void {
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const m = vivo(); const t = ev.target as Element;
    if (!m || !m.contains(t)) { if (m) fecharSugestoes(m); return; }
    if (!t.closest('.tec__procura')) fecharSugestoes(m);
    /* o visor */
    if (t.closest('[data-fechar-visor]') || t.closest('.tec__veu')) { fecharVisor(m); return; }
    const fz = t.closest<HTMLElement>('[data-zoom]'); if (fz) { const k = Number(fz.dataset.zoom); zoom(m, k === 0 ? 0 : k > 0 ? 1.25 : .8); return; }
    const fi = t.closest<HTMLElement>('[data-fig-ir]'); if (fi) { const f = (est(m).fig ?? 1) + Number(fi.dataset.figIr); abrirVisor(m, f); return; }
    if (t.closest('[data-inteiro]')) { const vz = $(m, '.tec__visor')!; if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined); else vz.requestFullscreen?.().catch(() => undefined); return; }
    if (t.closest('.tec__visor')) return;
    /* escolher */
    const mc = t.closest<HTMLElement>('.tec__marca'); if (mc) { const e = est(m); e.marca = mc.dataset.marca!; e.q = ''; const q = $<HTMLInputElement>(m, '.tec__q'); if (q) q.value = ''; listar(m); return; }
    if (t.closest('[data-limpar]')) { const e = est(m); e.q = ''; const q = $<HTMLInputElement>(m, '.tec__q'); if (q) { q.value = ''; q.focus(); } listar(m, false); return; }
    const linha = t.closest<HTMLElement>('tr.tec__v'); if (linha) { escolherVeiculo(m, linha.dataset.chave!, linha); return; }
    if (t.closest('[data-mudar]')) { mudarVeiculo(m); return; }
    /* a pesquisa técnica */
    const sug = t.closest<HTMLElement>('.tec__sug'); if (sug) { escolherSugestao(m, sug); return; }
    /* navegar */
    const na = t.closest<HTMLElement>('.tec__nav-abrir'); if (na) { const sim = na.getAttribute('aria-expanded') !== 'true'; na.setAttribute('aria-expanded', String(sim)); $(m, '.tec__nav')!.classList.toggle('is-aberta', sim); requestAnimationFrame(() => armarIndicador(m, false)); return; }
    const gt = t.closest<HTMLElement>('.tec__grupo-t');
    if (gt) {
      const sim = gt.getAttribute('aria-expanded') !== 'true';
      gt.setAttribute('aria-expanded', String(sim));
      const ul = gt.nextElementSibling as HTMLElement; ul.hidden = !sim;
      if (sim && !quieto()) $$(ul, 'li').forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 25, easing: SAIDA, fill: 'backwards' }));
      armarIndicador(m); return;
    }
    const sec = t.closest<HTMLElement>('[data-sec]'); if (sec && !t.closest('.tec__sug')) { irSeccao(m, sec.dataset.sec as IdSeccao | 'geral'); return; }
    const fl = t.closest<HTMLElement>('[data-filtro]'); if (fl) { est(m).sistema = (fl.dataset.filtro || undefined) as IdSistema | undefined; pintarConteudo(m); return; }
    const sis = t.closest<HTMLElement>('.tec__sistema, .tec__zona'); if (sis) { escolherSistema(m, sis.dataset.sis as IdSistema); return; }
    /* documentos */
    const fig = t.closest<HTMLElement>('.tec__fig'); if (fig) { abrirVisor(m, Number(fig.dataset.fig), fig); return; }
    const doc = t.closest<HTMLElement>('[data-doc]'); if (doc && doc.matches('button')) { abrirDoc(m, doc.dataset.doc!); return; }
    if (t.closest('[data-voltar]')) { est(m).doc = undefined; pintarConteudo(m, {}, -1); return; }
    const wd = t.closest<HTMLButtonElement>('.tec__wd-abrir'); if (wd) { abrirWorkshop(wd); return; }
  }, true);

  document.addEventListener('input', (ev) => {
    const i = ev.target as HTMLInputElement, m = vivo(); if (!m || !m.contains(i) || editando()) return;
    if (i.matches('.tec__q')) { est(m).q = i.value.trim(); listar(m); return; }
    if (i.matches('.tec__procura-campo')) { abrirSugestoes(m, i.value); return; }
    if (i.matches('.tec__avaria-campo[aria-invalid]')) { i.removeAttribute('aria-invalid'); const n = i.closest('form')!.querySelector<HTMLElement>('.tec__avaria-n')!; n.classList.remove('is-erro'); n.textContent = 'A descrição e os passos de diagnóstico de cada código são os do fornecedor; a Romafe não os escreve.'; }
  });
  document.addEventListener('submit', (ev) => { const m = vivo(); const f = ev.target as HTMLFormElement; if (m && m.contains(f) && f.matches('.tec__avaria')) { ev.preventDefault(); procurarAvaria(m, f); } });

  document.addEventListener('keydown', (ev) => {
    const m = vivo(); if (!m || editando()) return;
    const t = ev.target as HTMLElement;
    const visor = $(m, '.tec__visor')!;
    if (!visor.hidden) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharVisor(m); return; }
      if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); zoom(m, 1.25); return; }
      if (ev.key === '-') { ev.preventDefault(); zoom(m, .8); return; }
      if (ev.key === '0') { ev.preventDefault(); zoom(m, 0); return; }
      if (t.matches('.tec__visor-palco') && ev.key.startsWith('Arrow')) { ev.preventDefault(); const v = vistas.get(m) ?? { z: 1, x: 0, y: 0 }; const d = 40; vistas.set(m, { ...v, x: v.x + (ev.key === 'ArrowLeft' ? d : ev.key === 'ArrowRight' ? -d : 0), y: v.y + (ev.key === 'ArrowUp' ? d : ev.key === 'ArrowDown' ? -d : 0) }); aplicarVista(m, true); return; }
      /* o foco fica no visor */
      if (ev.key === 'Tab') { const fs = $$(visor, 'button:not([disabled]), [tabindex="0"]'); const i = fs.indexOf(document.activeElement as HTMLElement); if (ev.shiftKey && i <= 0) { ev.preventDefault(); fs[fs.length - 1].focus(); } else if (!ev.shiftKey && i === fs.length - 1) { ev.preventDefault(); fs[0].focus(); } }
      return;
    }
    if (t.matches('tr.tec__v') && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); escolherVeiculo(m, t.dataset.chave!, t); return; }
    if (t.matches('tr.tec__v') && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) { ev.preventDefault(); const rs = $$(m, 'tr.tec__v'); rs[Math.max(0, Math.min(rs.length - 1, rs.indexOf(t) + (ev.key === 'ArrowDown' ? 1 : -1)))].focus(); return; }
    if (t.matches('.tec__procura-campo')) {
      const caixa = $(m, '.tec__sugestoes')!; const os = $$(caixa, '[role="option"]');
      if (ev.key === 'Escape') { fecharSugestoes(m); return; }
      if (!os.length || caixa.hidden) return;
      const i = os.findIndex((o) => o.getAttribute('aria-selected') === 'true');
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        const j = ev.key === 'ArrowDown' ? (i + 1) % os.length : (i <= 0 ? os.length - 1 : i - 1);
        os.forEach((o, k) => o.setAttribute('aria-selected', String(k === j)));
        t.setAttribute('aria-activedescendant', os[j].id); os[j].scrollIntoView({ block: 'nearest' });
      } else if (ev.key === 'Enter') { ev.preventDefault(); escolherSugestao(m, os[Math.max(0, i)]); }
    }
  });
  /* passar num sistema acende a zona */
  document.addEventListener('pointerover', (ev) => {
    const m = vivo(); if (!m) return;
    const s = (ev.target as Element).closest?.<HTMLElement>('.tec__sistema, .tec__zona');
    acender(m, s && m.contains(s) ? s.dataset.sis : undefined);
  });
  document.addEventListener('focusin', (ev) => { const m = vivo(); const s = (ev.target as Element).closest?.<HTMLElement>('.tec__sistema'); if (m) acender(m, s && m.contains(s) ? s.dataset.sis : undefined); });
  /* o visor: roda do rato e arrastar */
  document.addEventListener('wheel', (ev) => {
    const m = vivo(); const p = (ev.target as Element).closest?.('.tec__visor-palco'); if (!m || !p || !m.contains(p)) return;
    ev.preventDefault(); zoom(m, ev.deltaY < 0 ? 1.15 : 1 / 1.15, ev.clientX, ev.clientY);
  }, { passive: false });
  let arrasto: { x: number; y: number; v: Vista; id: number } | null = null;
  document.addEventListener('pointerdown', (ev) => {
    const m = vivo(); const p = (ev.target as Element).closest?.<HTMLElement>('.tec__visor-palco'); if (!m || !p || !m.contains(p) || (ev.target as Element).closest('button')) return;
    arrasto = { x: ev.clientX, y: ev.clientY, v: { ...(vistas.get(m) ?? { z: 1, x: 0, y: 0 }) }, id: ev.pointerId };
    p.setPointerCapture(ev.pointerId); p.classList.add('is-a-arrastar');
  });
  document.addEventListener('pointermove', (ev) => {
    const m = vivo(); if (!m || !arrasto || ev.pointerId !== arrasto.id) return;
    vistas.set(m, { ...arrasto.v, x: arrasto.v.x + ev.clientX - arrasto.x, y: arrasto.v.y + ev.clientY - arrasto.y }); aplicarVista(m);
  });
  const largar = () => { arrasto = null; $$(document, '.tec__visor-palco.is-a-arrastar').forEach((p) => p.classList.remove('is-a-arrastar')); };
  document.addEventListener('pointerup', largar); document.addEventListener('pointercancel', largar);

  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => { const m = vivo(); if (m) armarIndicador(m, false); });
}
