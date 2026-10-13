/* =========================================================
   GOPARTS — listas de escolha animadas (12 out. 2026)
   Ela: «quero animação nos select». A lista de um <select> nativo é do
   sistema operativo e não se anima; por isso, nos ecrãs no estilo da v2.2
   (.portal--v22: Início, Catálogo, Pedidos e os seus estados), cada
   select.input ganha por cima um botão e uma lista própria que abre a
   deslizar, com as opções em cascata, o visto na escolhida e a risca
   laranja. O <select> continua por baixo e manda: escolher na lista muda
   o valor dele e dispara «change» (a marca ativa o modelo, etc.); se o
   código mudar as opções ou o desligar, a lista acompanha.
   A lista vive no <body> (os cartões cortam o que sai deles) e copia as
   cores do ecrã onde está. Teclado: ↑ ↓ Enter Esc Tab. No editor
   (body.editando) abre com um segundo clique na lista já escolhida. Com «reduzir movimento», abre sem animar.
   ========================================================= */
const editando = () => document.body.classList.contains('editando');
const VISTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-lucide="check"><path d="M20 6 9 17l-5-5"/></svg>';
const SETA = '<svg class="sel__seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-lucide="chevron-down"><path d="m6 9 6 6 6-6"/></svg>';
const CORES = ['--c-superficie', '--c-superficie-2', '--c-superficie-3', '--c-borda', '--c-borda-forte', '--c-texto', '--c-texto-2', '--c-texto-3', '--c-marca', '--c-marca-suave', '--c-acao'];
let n = 0;
/** o select de cada botão (para o editor abrir a lista pelo segundo clique) */
const doBotao = new WeakMap<HTMLButtonElement, HTMLSelectElement>();
let aberta: { sel: HTMLSelectElement; botao: HTMLButtonElement; lista: HTMLUListElement; ativa: number } | null = null;

function pintarBotao(sel: HTMLSelectElement, botao: HTMLButtonElement): void {
  const o = sel.options[sel.selectedIndex];
  botao.querySelector('.sel__texto')!.textContent = o ? o.text : '';
  botao.disabled = sel.disabled;
  botao.classList.toggle('sel__botao--vazio', sel.selectedIndex <= 0 && /^Selecione/.test(o?.text || ''));
}

function posicionar(): void {
  if (!aberta) return;
  const r = aberta.botao.getBoundingClientRect();
  const caixa = (aberta.botao.closest('.campo__caixa') || aberta.botao).getBoundingClientRect();
  const l = aberta.lista;
  const altura = Math.min(l.scrollHeight, 280);
  const abaixo = window.innerHeight - r.bottom;
  const paraCima = abaixo < altura + 12 && r.top > abaixo;
  l.style.left = caixa.left + 'px';
  l.style.width = caixa.width + 'px';
  l.style.top = (paraCima ? r.top - altura - 6 : r.bottom + 6) + 'px';
  l.classList.toggle('sel__lista--cima', paraCima);
}

function marcar(i: number): void {
  if (!aberta) return;
  const itens = Array.from(aberta.lista.querySelectorAll<HTMLLIElement>('.sel__opcao'));
  if (!itens.length) return;
  aberta.ativa = (i + itens.length) % itens.length;
  itens.forEach((li, j) => li.classList.toggle('is-ativa', j === aberta!.ativa));
  const li = itens[aberta.ativa];
  aberta.botao.setAttribute('aria-activedescendant', li.id);
  li.scrollIntoView({ block: 'nearest' });
}

function fechar(focar = true): void {
  if (!aberta) return;
  const { lista, botao } = aberta;
  aberta = null;
  botao.setAttribute('aria-expanded', 'false');
  botao.removeAttribute('aria-activedescendant');
  lista.classList.remove('is-aberta');
  lista.classList.add('is-a-fechar');
  const fim = () => lista.remove();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) fim(); else window.setTimeout(fim, 130);
  if (focar) botao.focus();
}

function escolher(i: number): void {
  if (!aberta) return;
  const { sel, botao } = aberta;
  if (sel.options[i] && !sel.options[i].disabled && sel.selectedIndex !== i) {
    sel.selectedIndex = i;
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  pintarBotao(sel, botao);
  botao.classList.remove('is-escolhido'); void botao.offsetWidth; botao.classList.add('is-escolhido');
  fechar();
}

function abrir(sel: HTMLSelectElement, botao: HTMLButtonElement): void {
  if (aberta) fechar(false);
  const lista = document.createElement('ul');
  lista.className = 'sel__lista';
  lista.setAttribute('role', 'listbox');
  lista.id = botao.getAttribute('aria-controls')!;
  /* as cores do ecrã de onde vem (a v2.2 no escuro tem as suas) */
  const cs = getComputedStyle(botao);
  CORES.forEach((c) => lista.style.setProperty(c, cs.getPropertyValue(c)));
  lista.innerHTML = Array.from(sel.options).map((o, i) => `<li class="sel__opcao${i === sel.selectedIndex ? ' is-escolhida' : ''}${o.disabled ? ' is-desligada' : ''}" role="option" id="${lista.id}-${i}" data-i="${i}" aria-selected="${i === sel.selectedIndex}" style="--i:${i}"><span class="sel__visto">${VISTO}</span><span></span></li>`).join('');
  lista.querySelectorAll('.sel__opcao > span:last-child').forEach((s, i) => { s.textContent = sel.options[i].text; });
  document.body.appendChild(lista);
  aberta = { sel, botao, lista, ativa: sel.selectedIndex };
  botao.setAttribute('aria-expanded', 'true');
  posicionar();
  requestAnimationFrame(() => lista.classList.add('is-aberta'));
  marcar(Math.max(0, sel.selectedIndex));
}

function melhorar(sel: HTMLSelectElement): void {
  if (sel.dataset.sel) return;
  sel.dataset.sel = '1';
  const id = `sel-${++n}`;
  const botao = document.createElement('button');
  doBotao.set(botao, sel);
  botao.type = 'button';
  botao.className = 'input sel__botao';
  botao.setAttribute('aria-haspopup', 'listbox');
  botao.setAttribute('aria-expanded', 'false');
  botao.setAttribute('aria-controls', id);
  const rotulo = sel.id ? document.querySelector(`label[for="${sel.id}"]`) : null;
  if (rotulo) { rotulo.id ||= `${id}-rotulo`; botao.setAttribute('aria-labelledby', rotulo.id); rotulo.setAttribute('for', ''); rotulo.addEventListener('click', () => botao.focus()); }
  botao.innerHTML = `<span class="sel__texto"></span>${SETA}`;
  sel.after(botao);
  sel.classList.add('sel__nativo');
  sel.tabIndex = -1;
  sel.setAttribute('aria-hidden', 'true');
  pintarBotao(sel, botao);
  /* o código muda as opções ou desliga o select (a marca ativa o modelo): a lista acompanha */
  new MutationObserver(() => {
    pintarBotao(sel, botao);
    if (sel.classList.contains('is-ativado')) { botao.classList.remove('is-ativado'); void botao.offsetWidth; botao.classList.add('is-ativado'); }
  }).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'class'] });
  sel.addEventListener('change', () => pintarBotao(sel, botao));

  botao.addEventListener('click', () => {
    if (editando() || botao.disabled) return;
    if (aberta?.botao === botao) fechar(); else abrir(sel, botao);
  });
  botao.addEventListener('keydown', (ev) => {
    if (editando()) return;
    const k = ev.key;
    if (!aberta || aberta.botao !== botao) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { ev.preventDefault(); abrir(sel, botao); }
      return;
    }
    if (k === 'ArrowDown') { ev.preventDefault(); marcar(aberta.ativa + 1); }
    else if (k === 'ArrowUp') { ev.preventDefault(); marcar(aberta.ativa - 1); }
    else if (k === 'Home') { ev.preventDefault(); marcar(0); }
    else if (k === 'End') { ev.preventDefault(); marcar(-1); }
    else if (k === 'Enter' || k === ' ') { ev.preventDefault(); escolher(aberta.ativa); }
    else if (k === 'Escape') { ev.preventDefault(); fechar(); }
    else if (k === 'Tab') fechar(false);
  });
}

export function iniciar(): void {
  document.querySelectorAll<HTMLSelectElement>('.portal--v22 select.input').forEach(melhorar);
  /* No editor (ela, 13 out.: «quero animações nos selects»): o primeiro clique escolhe a
     peça, como sempre; clicar outra vez numa lista já escolhida abre-a, a animar.
     Corre antes do editor (na janela, em captura) e só nesse caso lhe tira o clique. */
  window.addEventListener('click', (ev) => {
    if (!editando()) return;
    const botao = (ev.target as Element).closest<HTMLButtonElement>('.sel__botao');
    const sel = botao && doBotao.get(botao);
    if (!botao || !sel || botao.disabled) return;
    const escolhida = botao.closest('[data-ed-sel]');
    if (!escolhida || !(escolhida === botao || escolhida.matches('.campo, .campo *, .sel'))) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (aberta?.botao === botao) fechar(); else abrir(sel, botao);
  }, true);
  document.addEventListener('pointerdown', (ev) => {
    if (!aberta) return;
    const t = ev.target as Element;
    const op = t.closest<HTMLElement>('.sel__opcao');
    if (op && aberta.lista.contains(op)) { ev.preventDefault(); if (!op.classList.contains('is-desligada')) escolher(Number(op.dataset.i)); return; }
    if (!aberta.lista.contains(t) && !aberta.botao.contains(t)) fechar(false);
  }, true);
  document.addEventListener('pointerover', (ev) => {
    const op = (ev.target as Element).closest<HTMLElement>('.sel__opcao');
    if (aberta && op && aberta.lista.contains(op)) marcar(Number(op.dataset.i));
  });
  window.addEventListener('scroll', posicionar, true);
  window.addEventListener('resize', () => fechar(false));
  /* trocar de ecrã ou de versão fecha a lista */
  ['romafe:versao', 'hashchange'].forEach((e) => window.addEventListener(e, () => fechar(false)));
  document.addEventListener('romafe:versao', () => fechar(false));
}
