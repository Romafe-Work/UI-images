/* =========================================================
   GOPARTS — 11 · Catálogo v6: o motor das transições e dos estados vivos (14 out. 2026)
   Do briefing dela («todo o ciclo do catálogo»). Por cima do comportamento da v5 (que continua a fazer
   os passos, os filtros, as tabelas e a árvore), esta camada acrescenta:
   - O CONTEXTO DO VEÍCULO: uma barra no topo do catálogo com o logótipo, a marca, o modelo e o veículo
     (cada um leva de volta ao seu passo); fica em todos os passos depois das Marcas.
   - AS TRANSIÇÕES PARTILHADAS (View Transitions, ganchos `partilhado` em catalogo-v3.ts): o logótipo da
     marca escolhida voa do cartão para a barra do contexto (e volta, para trás); a referência voa da linha
     da tabela para o título dos Detalhes; só o conteúdo do catálogo desliza, para a frente ou para trás.
   - A RISCA LARANJA que desliza nas abas do portal e nos passos do catálogo (para debaixo do rato e de volta
     ao escolhido, 200 ms); o escolhido mantém sempre a sua marca.
   - IDENTIFICAR O VEÍCULO: valida a matrícula (formato AA-00-AA) e o chassis (17 caracteres) com o resumo dos
     erros; com dados certos, o rolamento roda no botão, o veículo «encaixa» na barra de contexto e o
     catálogo passa aos Veículos.
   - O CARRINHO: «Pedir» fica pendente (o rolamento no botão); só depois da confirmação a peça voa para o
     carrinho do topo e o número sobe. (Neste protótipo sem servidor, a confirmação chega ao fim de 0,7 s.)
   - A ESTRELA da marca favorita dá um pequeno salto ao acender.
   Com «reduzir movimento», tudo troca sem voar nem deslizar.
   ========================================================= */
import { partilhado, encherVeiculos, ir, type Vista } from './catalogo-v3';
import { rolamentoSvg } from '../../../comum/rolamento-svg';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando');
const $ = <T extends Element = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s);
let n = 0;

/* ---------- o contexto do veículo ---------- */
function contexto(main: HTMLElement, vista: Vista): void {
  let barra = $(main, '.cat6__contexto');
  if (!barra) {
    barra = document.createElement('nav');
    barra.className = 'cat6__contexto';
    barra.setAttribute('aria-label', 'O veículo escolhido');
    main.prepend(barra);
  }
  const universal = main.dataset.refs === 'universal' && (vista === 'referencias' || vista === 'detalhes');
  const mostra = vista !== 'marcas' && vista !== 'universal' && (!!main.dataset.marca || universal);
  barra.hidden = !mostra;
  if (!mostra) return;
  const logo = universal ? '' : $(main, `.cat2__marca[data-nome="${CSS.escape(main.dataset.marca || '')}"] .cat2__logo`)?.outerHTML || '';
  const parte = (t: string, para: Vista | '', atual: boolean) => t ? `<li><button type="button" class="cat6__ctx-parte"${para ? ` data-ir-vista="${para}"` : ''}${atual ? ' aria-current="step"' : ''}>${t}</button></li>` : '';
  const partes = universal
    ? parte('Universal', 'universal', false) + parte(main.dataset.uGrupo || 'Todos os grupos', 'universal', vista === 'referencias')
    : parte(main.dataset.marca || '', 'modelos', vista === 'modelos') + parte(main.dataset.modelo || '', 'veiculos', vista === 'veiculos') + parte(main.dataset.versao || '', 'grupos', vista === 'grupos');
  const ref = vista === 'detalhes' && main.dataset.ref ? `<li><span class="cat6__ctx-ref">${main.dataset.ref}</span></li>` : '';
  barra.innerHTML = `<span class="cat6__ctx-logo">${logo || '<span class="cat6__ctx-u">U</span>'}</span><ol class="cat6__ctx-caminho">${partes}${ref}</ol>${main.dataset.identificado ? `<span class="cat6__ctx-ok" role="status">${rolamentoSvg('ctx-' + ++n, 'carregar', 'cat6__rs-ok')}Veículo identificado · ${main.dataset.identificado}</span>` : ''}`;
}

/* ---------- as transições partilhadas ---------- */
const nomes = new Set<HTMLElement>();
const nomear = (el: Element | null | undefined, nome: string) => { if (!el) return; (el as HTMLElement).style.viewTransitionName = nome; nomes.add(el as HTMLElement); };
function ligarGanchos(): void {
  partilhado.antes = (main, de, para) => {
    nomear(main, 'cat-conteudo');
    /* para a frente: o logótipo do cartão da marca; para trás: o da barra do contexto */
    if (de === 'marcas' && para === 'modelos') nomear($(main, `.cat2__marca[data-nome="${CSS.escape(main.dataset.marca || '')}"] .cat2__logo`), 'cat-marca');
    else if (para === 'marcas') nomear($(main, '.cat6__ctx-logo .cat2__logo'), 'cat-marca');
    else nomear($(main, '.cat6__ctx-logo'), 'cat-marca');
    if (para === 'detalhes' && main.dataset.ref) nomear($(main, `.cat5__ref[data-ref="${CSS.escape(main.dataset.ref)}"] .cat5__referencia`), 'cat-ref');
    if (de === 'detalhes') nomear($(main, '.cat5__peca-ref'), 'cat-ref');
  };
  partilhado.depois = (main, de, para) => {
    nomes.forEach((el) => { el.style.viewTransitionName = ''; });
    nomes.clear();
    contexto(main, para);
    nomear(main, 'cat-conteudo');
    if (para === 'marcas') nomear($(main, `.cat2__marca[data-nome="${CSS.escape(main.dataset.marca || '')}"] .cat2__logo`), 'cat-marca');
    else if (de === 'marcas') nomear($(main, '.cat6__ctx-logo .cat2__logo'), 'cat-marca');
    else nomear($(main, '.cat6__ctx-logo'), 'cat-marca');
    if (para === 'detalhes') nomear($(main, '.cat5__peca-ref'), 'cat-ref');
    if (de === 'detalhes' && main.dataset.ref) nomear($(main, `.cat5__ref[data-ref="${CSS.escape(main.dataset.ref)}"] .cat5__referencia`), 'cat-ref');
    riscas(main.closest('.portal') as HTMLElement);
  };
  partilhado.fim = () => { nomes.forEach((el) => { el.style.viewTransitionName = ''; }); nomes.clear(); };
}

/* ---------- a risca laranja que desliza (abas do portal e passos do catálogo) ---------- */
function risca(nav: HTMLElement | null, itens: string, ativo: string): void {
  if (!nav) return;
  let r = nav.querySelector<HTMLElement>(':scope > .i3-risca-abas');
  const atual = () => nav.querySelector<HTMLElement>(ativo);
  const ir2 = (a: HTMLElement | null) => { if (!a || !r) return; r.style.setProperty('--x', `${a.offsetLeft}px`); r.style.setProperty('--w', `${a.offsetWidth}px`); r.style.opacity = '1'; };
  if (!r) {
    r = document.createElement('i'); r.className = 'i3-risca-abas'; r.setAttribute('aria-hidden', 'true'); nav.appendChild(r);
    nav.addEventListener('pointerover', (e) => { const a = (e.target as Element).closest<HTMLElement>(itens); if (a && !(a as HTMLButtonElement).disabled) ir2(a); });
    nav.addEventListener('pointerleave', () => ir2(atual()));
  }
  ir2(atual());
}
function riscas(portal: HTMLElement | null): void {
  if (!portal || !portal.classList.contains('portal--cat6')) return;
  risca(portal.querySelector('.portal__abas'), '.aba', '.aba[aria-current]');
  const fluxo = portal.querySelector<HTMLElement>('.cat5__fluxo');
  risca(fluxo?.querySelector('ol, ul') ?? fluxo, '.cat2__passo', '.cat2__passo[aria-current]');
}

/* ---------- identificar o veículo ---------- */
const FORMATOS: [string, string, RegExp, string][] = [
  ['matrícula', 'Matrícula', /^[A-Z0-9]{2}-?[A-Z0-9]{2}-?[A-Z0-9]{2}$/i, 'o formato é AA-00-AA'],
  ['chassis', 'N.º de chassis', /^[A-HJ-NPR-Z0-9]{17}$/i, 'tem 17 letras e números (sem I, O nem Q)'],
];
function identificar(main: HTMLElement, botao: HTMLButtonElement): void {
  const cartao = botao.closest<HTMLElement>('.cat2__pesquisa, .c22__cartao, .cat3__cartao') ?? main;
  const campos = Array.from(cartao.querySelectorAll<HTMLInputElement>('input'));
  const achar = (rot: string) => campos.find((c) => (cartao.querySelector(`label[for="${c.id}"]`)?.textContent || c.placeholder || '').toLowerCase().includes(rot));
  cartao.querySelector('.cat6__resumo')?.remove();
  campos.forEach((c) => { c.removeAttribute('aria-invalid'); c.closest('.campo')?.classList.remove('is-erro'); c.closest('.campo')?.querySelector('.cat6__erro')?.remove(); });
  const erros: [HTMLInputElement, string, string][] = [];
  for (const [rot, nome, re, como] of FORMATOS) { const c = achar(rot); if (c && c.value.trim() && !re.test(c.value.trim())) erros.push([c, nome, como]); }
  const algum = campos.some((c) => c.type !== 'checkbox' && c.value.trim());
  if (!algum) { const c = achar('matrícula') ?? campos[0]; if (c) erros.push([c, 'Matrícula', 'escreva a matrícula, o chassis, o motor ou a descrição']); }
  if (erros.length) {
    erros.forEach(([c, , como]) => { c.setAttribute('aria-invalid', 'true'); const campo = c.closest('.campo'); campo?.classList.add('is-erro'); campo?.insertAdjacentHTML('beforeend', `<p class="cat6__erro" id="${c.id}-erro">${como.charAt(0).toUpperCase() + como.slice(1)}.</p>`); c.setAttribute('aria-describedby', `${c.id}-erro`); });
    if (erros.length > 1) {
      botao.closest('.cat2__form, form, .cat2__campos')?.insertAdjacentHTML('beforebegin', `<div class="cat6__resumo" role="alert"><b>${erros.length} campos precisam de correção</b><ul>${erros.map(([c, nome, como]) => `<li><a href="#" data-focar="${c.id}">${nome} — ${como}</a></li>`).join('')}</ul></div>`);
    }
    erros[0][0].focus();
    return;
  }
  /* certo: o rolamento no botão; depois o veículo encaixa na barra do contexto e passa aos Veículos */
  const antes = botao.innerHTML;
  botao.disabled = true; botao.setAttribute('aria-busy', 'true');
  botao.innerHTML = `${rolamentoSvg('id-' + ++n, 'pesquisar', 'cat6__rs-botao')}<span class="btn__rotulo">A identificar…</span>`;
  window.setTimeout(() => {
    botao.innerHTML = antes; botao.disabled = false; botao.removeAttribute('aria-busy');
    const mat = achar('matrícula')?.value.trim().toUpperCase();
    main.dataset.marca = 'Renault';
    main.dataset.identificado = mat || 'pelo chassis';
    encherVeiculos(main, 'Renault', 'Scénic II (JM0/1_)');
    ir(main, 'veiculos');
  }, quieto() ? 150 : 900);
}

/* ---------- o carrinho: pendente, confirmado, e a peça voa ---------- */
function pedir(botao: HTMLButtonElement): void {
  if (botao.dataset.pendente) return;
  const antes = botao.innerHTML;
  botao.dataset.pendente = '1'; botao.setAttribute('aria-busy', 'true');
  botao.innerHTML = `${rolamentoSvg('cr-' + ++n, 'pesquisar', 'cat6__rs-botao')}<span class="btn__rotulo">A adicionar…</span>`;
  const qtd = Number(botao.parentElement?.querySelector<HTMLInputElement>('.cat5__qtd-n')?.value || 1);
  window.setTimeout(() => {
    /* a confirmação chegou: o botão confirma, a peça voa para o carrinho e o número sobe */
    botao.innerHTML = `<svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="cat6__visto" d="M20 6 9 17l-5-5"/></svg><span class="btn__rotulo">Adicionado</span>`;
    botao.classList.add('is-feito'); botao.removeAttribute('aria-busy');
    const carrinho = document.querySelector<HTMLElement>('.ecra:not([hidden]) .portal__icone[aria-label^="Carrinho"]');
    const selo = carrinho?.querySelector<HTMLElement>('.portal__selo');
    const subir = () => { if (selo) { const v = Number(selo.textContent || 0) + qtd; selo.textContent = String(v); carrinho!.setAttribute('aria-label', `Carrinho, ${v} artigos`); selo.classList.remove('is-subir'); void selo.offsetWidth; selo.classList.add('is-subir'); } };
    const aviso = document.querySelector<HTMLElement>('.ecra:not([hidden]) .cat6__aviso');
    if (aviso) aviso.textContent = `${qtd} ${qtd > 1 ? 'unidades adicionadas' : 'unidade adicionada'} ao carrinho.`;
    if (carrinho && !quieto()) {
      const de = botao.getBoundingClientRect(), para = carrinho.getBoundingClientRect();
      const peca = document.createElement('span');
      peca.className = 'cat6__voo';
      peca.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/></svg>';
      peca.style.left = `${de.left + de.width / 2 - 14}px`; peca.style.top = `${de.top + de.height / 2 - 14}px`;
      document.body.appendChild(peca);
      const dx = para.left + para.width / 2 - (de.left + de.width / 2), dy = para.top + para.height / 2 - (de.top + de.height / 2);
      const voo = peca.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy - 60}px) scale(.9)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: 0.2 },
      ], { duration: 650, easing: 'cubic-bezier(.4, 0, .2, 1)' });
      voo.onfinish = () => { peca.remove(); subir(); };
    } else subir();
    window.setTimeout(() => { botao.innerHTML = antes; botao.classList.remove('is-feito'); delete botao.dataset.pendente; }, 1800);
  }, quieto() ? 150 : 700);
}

/* ---------- ligar ---------- */
function armar(): void {
  const portal = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--cat6');
  if (!portal) return;
  if (!portal.querySelector('.cat6__aviso')) portal.insertAdjacentHTML('beforeend', '<p class="cat6__aviso sr-only" role="status" aria-live="polite"></p>');
  const main = portal.querySelector<HTMLElement>('.cat6');
  if (main) contexto(main, (main.dataset.vista || 'marcas') as Vista);
  requestAnimationFrame(() => riscas(portal));
}

export function iniciar(): void {
  ligarGanchos();
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => riscas(document.querySelector('.ecra:not([hidden]) > .versao:not([hidden]) .portal--cat6')));
  /* antes do comportamento da v5 (fase de captura, na janela): identificar, pedir, estrela, contexto, erros */
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const main = t.closest?.<HTMLElement>('.cat6');
    if (!main || main.closest('.portal--estado')) return;
    const id = t.closest<HTMLButtonElement>('.cat2__pesquisar');
    if (id) { ev.preventDefault(); ev.stopPropagation(); identificar(main, id); return; }
    const ad = t.closest<HTMLButtonElement>('.cat5__adicionar');
    if (ad && !ad.disabled) { ev.preventDefault(); ev.stopPropagation(); pedir(ad); return; }
    const foc = t.closest<HTMLElement>('[data-focar]');
    if (foc) { ev.preventDefault(); ev.stopPropagation(); document.getElementById(foc.dataset.focar!)?.focus(); return; }
    const est = t.closest<HTMLElement>('.cat2__estrela');
    if (est && !quieto()) { est.classList.remove('is-saltar'); void est.offsetWidth; est.classList.add('is-saltar'); }
    const parte = t.closest<HTMLElement>('.cat6__ctx-parte');
    if (parte?.dataset.irVista) { ev.preventDefault(); ev.stopPropagation(); ir(main, parte.dataset.irVista as Vista); }
  }, true);
}
