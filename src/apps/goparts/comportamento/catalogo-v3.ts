/* =========================================================
   GOPARTS — o Catálogo v3 (13 out. 2026): Marcas → Modelos → Veículos
   A marca abre a tabela dos modelos; o modelo, a dos veículos; escolher um
   veículo marca a linha e acende o passo «Grupo montagem». Os passos de cima
   e os botões «‹ Marcas» / «‹ Modelos» voltam atrás.
   O cartão azul fica no sítio e troca o que tem dentro (os filtros do passo);
   a secção de baixo troca de tabela a deslizar na horizontal, como na v2.
   Os filtros mostram e escondem linhas sem animar alturas.
   No editor (body.editando) nada disto corre: para ver os passos parados
   estão os estados 11.9 e 11.10.
   ========================================================= */
import { linhasModelos, linhasVeiculos, MODELOS, veiculosDe, anos, ano, ANO_HOJE } from '../portal/catalogo-dados';

type Vista = 'marcas' | 'modelos' | 'veiculos';
const PASSO: Record<Vista, number> = { marcas: 0, modelos: 1, veiculos: 2 };
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => Array.from(r.querySelectorAll<T>(s));

/** Os passos de cima: o atual marcado, os seguintes desligados (Universal fica sempre). */
export function passos(portal: ParentNode, atual: number, ate = atual): void {
  $$<HTMLButtonElement>(portal, '.cat2__passo').forEach((b) => {
    const n = Number(b.dataset.passo);
    if (n === atual) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    b.disabled = !(n <= ate || n === 6);
  });
}

/** Mostra uma vista: o que é dela aparece, o resto esconde-se. */
export function mostrar(main: HTMLElement, vista: Vista): void {
  main.dataset.vista = vista;
  $$(main, '[data-so]').forEach((x) => { x.hidden = x.dataset.so !== vista; });
  const vazio = main.querySelector<HTMLElement>('.cat2__vazio');
  if (vazio && vista !== 'marcas') vazio.hidden = true;
}

function opcoes(sel: HTMLSelectElement, valores: (string | number)[]): void {
  sel.innerHTML = '<option value="">Todos</option>' + valores.map((v) => `<option value="${v}">${v}</option>`).join('');
}

/** Preenche a vista dos modelos de uma marca. */
export function encherModelos(main: HTMLElement, marca: string): void {
  main.dataset.marca = marca;
  $$(main, '[data-so="modelos"] .cat3__de').forEach((s) => { s.textContent = '· ' + marca; });
  const vista = $(main, '.cat3__vista[data-so="modelos"]');
  const corpo = $(vista, 'tbody');
  corpo.innerHTML = linhasModelos(marca) || '<tr class="cat3__sem"><td colspan="4">Ainda não há modelos de exemplo para esta marca: os exemplos são das oito favoritas de origem.</td></tr>';
  const m = MODELOS[marca] || [];
  const de = m.length ? Math.min(...m.map((x) => ano(x[1]))) : ANO_HOJE;
  opcoes($(main, '[data-so="modelos"] select'), anos(de, ANO_HOJE));
  $<HTMLInputElement>(main, '[data-so="modelos"] input').value = '';
  contar(vista);
}

/** Preenche a vista dos veículos de um modelo. */
export function encherVeiculos(main: HTMLElement, marca: string, modelo: string): void {
  main.dataset.modelo = modelo;
  $$(main, '[data-so="veiculos"] .cat3__de').forEach((s) => { s.textContent = '· ' + marca + ' ' + modelo; });
  const vista = $(main, '.cat3__vista[data-so="veiculos"]');
  $(vista, 'tbody').innerHTML = linhasVeiculos(marca, modelo);
  const vs = veiculosDe(marca, modelo);
  const unicos = <K extends 'motor' | 'kw' | 'cv' | 'cc'>(k: K) => Array.from(new Set(vs.map((v) => v[k]))).sort((a, b) => (a < b ? -1 : 1));
  const cartao = $(main, '.cat3__cartao[data-so="veiculos"]');
  const sel = (k: string) => $<HTMLSelectElement>(cartao, `select[data-filtro="${k}"]`);
  opcoes(sel('ano'), vs.length ? anos(Math.min(...vs.map((v) => v.desde)), Math.max(...vs.map((v) => v.ate))) : []);
  opcoes(sel('motor'), unicos('motor'));
  opcoes(sel('kw'), unicos('kw'));
  opcoes(sel('cv'), unicos('cv'));
  opcoes(sel('cc'), unicos('cc'));
  $<HTMLInputElement>(cartao, 'input').value = '';
  contar(vista);
}

function contar(vista: HTMLElement): void {
  const n = $$(vista, 'tbody .cat3__linha:not([hidden])').length;
  $(vista, '.cat3__conta strong').textContent = String(n);
  const sem = !!vista.querySelector('.cat3__sem');
  $(vista, '.cat3__vazio').hidden = n > 0 || sem;
}

/** Aplica os filtros do cartão à tabela da vista atual. */
function filtrar(main: HTMLElement): void {
  const vista = main.dataset.vista as Vista;
  if (vista === 'marcas') return;
  const cartao = $(main, `.cat3__cartao[data-so="${vista}"]`);
  const tabela = $(main, `.cat3__vista[data-so="${vista}"]`);
  const texto = ($<HTMLInputElement>(cartao, 'input').value || '').trim().toLowerCase();
  const valor = (k: string) => cartao.querySelector<HTMLSelectElement>(`select[data-filtro="${k}"]`)?.value || '';
  const a = Number(valor('ano'));
  $$(tabela, 'tbody .cat3__linha').forEach((l) => {
    const nome = (l.dataset.modelo || l.dataset.nome || '').toLowerCase();
    let ver = !texto || nome.includes(texto);
    if (a) ver = ver && Number(l.dataset.desde) <= a && a <= Number(l.dataset.ate);
    (['motor', 'kw', 'cv', 'cc'] as const).forEach((k) => { const v = valor(k); if (v) ver = ver && l.dataset[k] === v; });
    l.hidden = !ver;
  });
  contar(tabela);
}

function limpar(main: HTMLElement): void {
  const cartao = main.querySelector<HTMLElement>(`.cat3__cartao[data-so="${main.dataset.vista}"]`);
  if (!cartao) return;
  $$<HTMLInputElement>(cartao, 'input').forEach((i) => { i.value = ''; });
  $$<HTMLSelectElement>(cartao, 'select').forEach((s) => { s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); });
  filtrar(main);
}

/** Troca de vista: o cartão azul fica e troca o conteúdo; a secção de baixo desliza. */
function ir(main: HTMLElement, vista: Vista): void {
  const antes = (main.dataset.vista || 'marcas') as Vista;
  if (antes === vista) return;
  const frente = PASSO[vista] > PASSO[antes];
  const portal = main.closest('.portal') || document;
  /* os passos já percorridos continuam à mão: volta-se às Marcas e pode-se ir de novo aos Modelos */
  const ate = Math.max(PASSO[vista], main.dataset.modelo ? 2 : main.dataset.marca ? 1 : 0);
  passos(portal, PASSO[vista], ate);
  const baixo = $(main, '.cat2__marcas');
  const conteudo = $$(main, '.cat2__pesquisa > [data-so]');
  if (quieto()) { mostrar(main, vista); return; }
  const dx = frente ? 24 : -24;
  const sai = baixo.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dx}px)` }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
  conteudo.forEach((c) => { if (!c.hidden) c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in', fill: 'forwards' }); });
  sai.onfinish = () => {
    mostrar(main, vista);
    baixo.getAnimations().forEach((x) => x.cancel());
    conteudo.forEach((c) => c.getAnimations().forEach((x) => x.cancel()));
    baixo.animate([{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    conteudo.forEach((c) => { if (!c.hidden) c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); });
  };
}

function escolherVeiculo(main: HTMLElement, linha: HTMLElement): void {
  $$(main, '.cat3__vista[data-so="veiculos"] .cat3__linha').forEach((l) => l.removeAttribute('aria-selected'));
  linha.setAttribute('aria-selected', 'true');
  /* o passo seguinte fica disponível e chama a atenção uma vez */
  const p = (main.closest('.portal') || document).querySelector<HTMLButtonElement>('.cat2__passo[data-passo="3"]');
  if (p) {
    p.disabled = false;
    p.classList.remove('is-a-chamar'); void p.offsetWidth; p.classList.add('is-a-chamar');
  }
}

/** Devolve true se o clique foi do catálogo v3 (e o comportamento da v2 não lhe deve mexer). */
export function clique(t: Element): boolean {
  const main = t.closest<HTMLElement>('.cat3') || t.closest('.portal--cat3')?.querySelector<HTMLElement>('.cat3') || null;
  if (!main || !main.hasAttribute('data-vista')) return false;
  const passo = t.closest<HTMLButtonElement>('.cat2__passo');
  if (passo) {
    if (passo.disabled) return true;
    const n = Number(passo.dataset.passo);
    if (n === 0) ir(main, 'marcas');
    else if (n === 1 && main.dataset.marca) ir(main, 'modelos');
    else if (n === 2 && main.dataset.modelo) ir(main, 'veiculos');
    return true;
  }
  const marca = t.closest<HTMLElement>('.cat2__marca-botao');
  if (marca) {
    const nome = marca.closest<HTMLElement>('.cat2__marca')!.dataset.nome || '';
    if (main.dataset.marca !== nome) delete main.dataset.modelo;
    encherModelos(main, nome);
    ir(main, 'modelos');
    return true;
  }
  const voltar = t.closest<HTMLElement>('.cat3__voltar');
  if (voltar) { ir(main, voltar.dataset.voltar as Vista); return true; }
  if (t.closest('.cat3__limpar')) { limpar(main); return true; }
  const linha = t.closest<HTMLElement>('.cat3__linha');
  if (linha) {
    if (linha.dataset.modelo) {
      encherVeiculos(main, main.dataset.marca || '', linha.dataset.modelo);
      ir(main, 'veiculos');
    } else escolherVeiculo(main, linha);
    return true;
  }
  return false;
}

export function iniciar(): void {
  document.addEventListener('input', (ev) => {
    const i = ev.target as HTMLElement;
    if (document.body.classList.contains('editando') || !i.matches('.cat3__cartao [data-filtro]')) return;
    filtrar(i.closest<HTMLElement>('.cat3')!);
  });
  document.addEventListener('change', (ev) => {
    const i = ev.target as HTMLElement;
    if (document.body.classList.contains('editando') || !i.matches('.cat3__cartao select[data-filtro]')) return;
    filtrar(i.closest<HTMLElement>('.cat3')!);
  });
  /* Enter numa linha da tabela abre-a, como o clique */
  document.addEventListener('keydown', (ev) => {
    const l = (ev.target as Element).closest?.('.cat3__linha');
    if (!l || document.body.classList.contains('editando') || (ev.key !== 'Enter' && ev.key !== ' ')) return;
    ev.preventDefault();
    clique(l);
  });
}
