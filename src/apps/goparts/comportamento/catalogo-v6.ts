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
import { escolherGrupo, abrirReferencias, ramo } from './catalogo-v5';
import { REFERENCIAS, euros } from '../portal/catalogo-dados';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { imagemModelo, silhueta } from '../portal/carros';

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
  const carro = !universal && main.dataset.modelo && vista !== 'modelos' ? `<span class="cat6__ctx-carro">${silhueta(main.dataset.carrocaria || '')}</span>` : '';
  barra.innerHTML = `<span class="cat6__ctx-logo">${logo || '<span class="cat6__ctx-u">U</span>'}</span>${carro}<ol class="cat6__ctx-caminho">${partes}${ref}</ol>${main.dataset.identificado ? `<span class="cat6__ctx-ok" role="status">${rolamentoSvg('ctx-' + ++n, 'carregar', 'cat6__rs-ok')}Veículo identificado · ${main.dataset.identificado}</span>` : ''}`;
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
    if (para === 'detalhes' && main.dataset.ref) nomear($(main, `.cat5__ref[data-ref="${CSS.escape(main.dataset.ref)}"] .cat5__imagem`), 'cat-foto');
    if (de === 'detalhes') nomear($(main, '.cat5__peca-imagem'), 'cat-foto');
    /* o carro e o nome do modelo: do cartão para a barra do contexto (e de volta) */
    if (de === 'modelos' && para === 'veiculos') { const c = cartaoModelo(main); nomear(c?.querySelector('.cat6__foto'), 'cat-carro'); nomear(c?.querySelector('.cat4__modelo-nome'), 'cat-modelo'); }
    if (de === 'veiculos' && para === 'modelos') { nomear($(main, '.cat6__ctx-carro'), 'cat-carro'); nomear($(main, '.cat6__ctx-parte[data-ir-vista="veiculos"]'), 'cat-modelo'); }
  };
  partilhado.depois = (main, de, para) => {
    nomes.forEach((el) => { el.style.viewTransitionName = ''; });
    nomes.clear();
    contexto(main, para);
    if (para === 'marcas' || de === 'marcas') limparEscolha(main);
    nomear(main, 'cat-conteudo');
    if (para === 'marcas') nomear($(main, `.cat2__marca[data-nome="${CSS.escape(main.dataset.marca || '')}"] .cat2__logo`), 'cat-marca');
    else if (de === 'marcas') nomear($(main, '.cat6__ctx-logo .cat2__logo'), 'cat-marca');
    else nomear($(main, '.cat6__ctx-logo'), 'cat-marca');
    if (para === 'detalhes') { fichaV6(main); nomear($(main, '.cat5__peca-ref'), 'cat-ref'); nomear($(main, '.cat5__peca-imagem'), 'cat-foto'); }
    if (de === 'detalhes' && main.dataset.ref) nomear($(main, `.cat5__ref[data-ref="${CSS.escape(main.dataset.ref)}"] .cat5__imagem`), 'cat-foto');
    if (de === 'detalhes' && main.dataset.ref) nomear($(main, `.cat5__ref[data-ref="${CSS.escape(main.dataset.ref)}"] .cat5__referencia`), 'cat-ref');
    if (de === 'modelos' && para === 'veiculos') { nomear($(main, '.cat6__ctx-carro'), 'cat-carro'); nomear($(main, '.cat6__ctx-parte[data-ir-vista="veiculos"]'), 'cat-modelo'); }
    if (de === 'veiculos' && para === 'modelos') { decorarModelos(main); const c = cartaoModelo(main); nomear(c?.querySelector('.cat6__foto'), 'cat-carro'); nomear(c?.querySelector('.cat4__modelo-nome'), 'cat-modelo'); }
    if (para === 'modelos' || de === 'modelos') main.querySelectorAll('.is-modelo-escolhido').forEach((x) => x.classList.remove('is-modelo-escolhido'));
    main.querySelector('.cat3__vista[data-so="modelos"]')?.classList.remove('is-a-escolher');
    if (para === 'modelos') decorarModelos(main);
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
  /* (ela, 14 out.: «só quero uma barra») — a risca que desliza é a da v2 (v2-animacao.ts); esta não se desenha */
  void portal; void risca;
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
    const mainP = botao.closest<HTMLElement>('.cat6');
    if (mainP && botao.closest('.cat5__peca-compra')) { aviso(mainP, `${VISTO}${qtd} ${qtd > 1 ? 'unidades adicionadas' : 'unidade adicionada'} ao carrinho. <button type="button" class="cat3__ligacao" disabled title="Ainda sem ecrã">Ver carrinho</button>`); mainP.querySelector('.cat5__peca-imagem')?.animate([{ transform: 'scale(1)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' }); }
    const avisoSr = document.querySelector<HTMLElement>('.ecra:not([hidden]) .cat6__aviso');
    if (avisoSr) avisoSr.textContent = `${qtd} ${qtd > 1 ? 'unidades adicionadas' : 'unidade adicionada'} ao carrinho.`;
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

/* =========================================================
   As Marcas, vivas (14 out., o briefing da galeria das marcas) — sem mudar o desenho:
   - a inclinação: o cartão inclina até 3° para o lado do rato e o logótipo mexe-se um pouco mais (profundidade),
     com inércia; volta ao sítio ao sair. Só com rato fino e sem «reduzir movimento». Variáveis CSS, sem estado.
   - a escolha: o cartão escolhido fica laranja e cresce; os outros vão a 40 % e afastam-se um pouco; depois o
     logótipo voa para o cabeçalho dos Modelos (a transição partilhada de cima). Para trás, o caminho inverso.
   - a entrada: o título, a procura e o filtro aparecem; os cartões visíveis entram 8 px por baixo, 25 ms entre
     cada (só os primeiros 24), tudo em ~650 ms. Só na primeira vez que o ecrã aparece.
   - a estrela: ao acender cresce a 1,25 e roda 12°, fica laranja e assenta; ao apagar encolhe.
   - Favoritas / Todas: o fundo do escolhido desliza com a risca laranja por baixo (250 ms).
   - a procura vazia: a lupa procura uma vez e «Limpar pesquisa»; Esc limpa a procura.
   ========================================================= */
const fino = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches && !quieto();
function inclinar(): void {
  let alvo: HTMLElement | null = null, x = 0, y = 0, rx = 0, ry = 0, ciclo = 0;
  const passo = () => {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    alvo?.style.setProperty('--tx', rx.toFixed(3)); alvo?.style.setProperty('--ty', ry.toFixed(3));
    ciclo = Math.abs(x - rx) + Math.abs(y - ry) > 0.002 ? requestAnimationFrame(passo) : 0;
  };
  document.addEventListener('pointermove', (ev) => {
    if (!fino()) return;
    const li = (ev.target as Element).closest?.<HTMLElement>('.cat6 .cat2__marca');
    if (li !== alvo) { if (alvo) { alvo.style.setProperty('--tx', '0'); alvo.style.setProperty('--ty', '0'); } alvo = li; rx = ry = 0; }
    if (!li) return;
    const r = li.getBoundingClientRect();
    x = ((ev.clientX - r.left) / r.width) * 2 - 1; y = ((ev.clientY - r.top) / r.height) * 2 - 1;
    if (!ciclo) ciclo = requestAnimationFrame(passo);
  }, { passive: true });
}
const entrou = new WeakSet<HTMLElement>();
function entradaMarcas(main: HTMLElement): void {
  if (entrou.has(main) || quieto() || (main.dataset.vista || 'marcas') !== 'marcas') return;
  entrou.add(main);
  const sec = $(main, '.cat2__marcas'); if (!sec) return;
  [$(sec, '.cat2__marcas-cabeca'), $(sec, '.cat2__procura'), $(sec, '.cat2__filtro')].forEach((el, i) => el?.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: i * 50, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' }));
  Array.from(sec.querySelectorAll<HTMLElement>('.cat2__marca:not([hidden])')).slice(0, 24).forEach((m, i) => m.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 120 + i * 25, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' }));
}
/** O fundo e a risca do Favoritas / Todas, no escolhido. */
function segmento(main: HTMLElement): void {
  const nav = $(main, '.cat2__filtro'); if (!nav) return;
  let s = nav.querySelector<HTMLElement>(':scope > .cat6__seg');
  if (!s) { s = document.createElement('i'); s.className = 'cat6__seg'; s.setAttribute('aria-hidden', 'true'); nav.prepend(s); }
  const a = nav.querySelector<HTMLElement>('.cat2__filtro-aba[aria-current]'); if (!a) return;
  s.style.setProperty('--x', `${a.offsetLeft}px`); s.style.setProperty('--w', `${a.offsetWidth}px`); s.style.setProperty('--h', `${a.offsetHeight}px`); s.style.setProperty('--y', `${a.offsetTop}px`);
}
/** A procura vazia: a lupa e «Limpar pesquisa». */
function vazioMarcas(main: HTMLElement): void {
  const v = $(main, '.cat2__vazio'); if (!v || v.dataset.v6) return;
  v.dataset.v6 = '1';
  v.innerHTML = '<svg class="cat6__lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><span>Nenhuma marca com esse nome.</span><button type="button" class="btn btn--ghost btn--sm cat6__limpar-marca" data-limpar-marca><span class="btn__rotulo">Limpar pesquisa</span></button>';
}
function limparProcura(main: HTMLElement): void {
  const i = $<HTMLInputElement>(main, '.cat2__procura input'); if (!i) return;
  i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus();
}
/** A escolha em foco: o cartão fica laranja e cresce, os outros recuam e afastam-se; depois o clique segue. */
let aEscolher = false;
function escolherMarca(main: HTMLElement, botao: HTMLElement): boolean {
  if (aEscolher || quieto() || (main.dataset.vista || 'marcas') !== 'marcas') return false;
  const li = botao.closest<HTMLElement>('.cat2__marca')!, grelha = li.parentElement!;
  const c = li.getBoundingClientRect(), cx = c.left + c.width / 2, cy = c.top + c.height / 2;
  grelha.querySelectorAll<HTMLElement>('.cat2__marca:not([hidden])').forEach((m) => {
    if (m === li) return;
    const r = m.getBoundingClientRect(), dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy, d = Math.hypot(dx, dy) || 1;
    m.style.setProperty('--ox', `${(dx / d * 6).toFixed(1)}px`); m.style.setProperty('--oy', `${(dy / d * 6).toFixed(1)}px`);
  });
  li.classList.add('is-escolhida'); grelha.classList.add('is-a-escolher');
  aEscolher = true;
  window.setTimeout(() => { botao.click(); aEscolher = false; }, 200);
  return true;
}
function limparEscolha(main: HTMLElement): void {
  main.querySelectorAll('.cat2__marca.is-escolhida').forEach((m) => m.classList.remove('is-escolhida'));
  main.querySelector('.cat2__grelha')?.classList.remove('is-a-escolher');
}

/* =========================================================
   Os Modelos em cartões (14 out., o briefing da montra): cada linha da tabela passa a cartão — em cima o nome
   e o período, ao meio a imagem do carro (60 %), em baixo o tipo e a seta. A filtragem e a ordenação são as de
   sempre (as linhas continuam a ser as mesmas); só se acrescenta a imagem.
   - hover: o carro cresce a 1,06 e anda 8 px para a direita, a borda azul, a linha laranja, a seta anda, sobe 3 px;
   - escolher: o cartão fica laranja e o carro cresce, os outros recuam; depois o carro e o nome voam para a barra
     do contexto dos Veículos (e voltam para trás);
   - ao rolar, os carros mexem-se uns píxeis (até 6) conforme a posição no ecrã.
   ========================================================= */
function decorarModelos(main: HTMLElement): void {
  /* (ela, 14 out.: «não estou a gostar disto» — o painel dos filtros) as carroçarias em botões com a silhueta */
  main.querySelectorAll<HTMLElement>('.cat4__filtrar .cat4__tipo-opcao').forEach((l) => {
    if (l.querySelector('.cat6__tipo-carro')) return;
    const v = l.querySelector<HTMLInputElement>('input')?.value || '';
    l.insertAdjacentHTML('afterbegin', `<span class="cat6__tipo-carro" aria-hidden="true">${silhueta(v)}</span>`);
  });
  temFiltros(main);
  main.querySelectorAll<HTMLElement>('.cat3__vista[data-so="modelos"] tbody .cat3__linha[data-modelo]').forEach((tr) => {
    if (tr.querySelector('.cat6__foto')) return;
    tr.insertAdjacentHTML('afterbegin', `<td class="cat6__foto" aria-hidden="true"><span class="cat6__carro">${imagemModelo(tr.dataset.modelo || '', tr.dataset.carrocaria || '')}</span></td>`);
    const img = tr.querySelector('img');
    img?.addEventListener('error', () => { img.outerHTML = silhueta(img.dataset.silhueta || ''); }, { once: true });
  });
}
/** «Limpar» só aparece quando há algum filtro dos modelos ativo. */
function temFiltros(main: HTMLElement): void {
  const c = main.querySelector<HTMLElement>('.cat4__filtrar'); if (!c) return;
  const sim = Array.from(c.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')).some((x) => (x instanceof HTMLInputElement && x.type === 'checkbox') ? x.checked : !!x.value);
  c.classList.toggle('tem-filtros', sim);
}
const cartaoModelo = (main: HTMLElement) => main.querySelector<HTMLElement>(`.cat3__vista[data-so="modelos"] .cat3__linha[data-modelo="${CSS.escape(main.dataset.modelo || '')}"]`);
let aEscolherModelo = false;
function escolherModelo(main: HTMLElement, tr: HTMLElement): boolean {
  if (aEscolherModelo || quieto()) return false;
  main.dataset.carrocaria = tr.dataset.carrocaria || '';
  tr.classList.add('is-modelo-escolhido');
  tr.closest('.cat3__vista')?.classList.add('is-a-escolher');
  aEscolherModelo = true;
  window.setTimeout(() => { tr.click(); aEscolherModelo = false; }, 200);
  return true;
}
function profundidade(): void {
  let pedido = 0;
  const fazer = () => {
    pedido = 0;
    const main = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .cat6[data-vista="modelos"]');
    if (!main || quieto()) return;
    const meio = innerHeight / 2;
    main.querySelectorAll<HTMLElement>('.cat6__carro').forEach((c) => {
      const r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      c.style.setProperty('--py', `${Math.max(-6, Math.min(6, (r.top + r.height / 2 - meio) * -0.015)).toFixed(1)}px`);
    });
  };
  window.addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(fazer); }, { passive: true });
}

/* =========================================================
   O Grupo de montagem — um só explorador (14 out., o briefing dela: «uma só forma de navegar, sem Árvore,
   Lista e Colunas»). Serve ao Grupo montagem do veículo e ao Universal (o mesmo componente).
   - À esquerda (40 %), a árvore: o ramo aberto ganha a risca laranja a crescer, a seta roda, a linha da hierarquia
     desce e os grupos entram em cascata; a procura mantém os pais, abre os caminhos e destaca o que corresponde.
     ↑ ↓ andam entre as linhas visíveis, → abre e ← fecha (ou volta ao pai); Enter escolhe.
   - À direita (60 %), o grupo escolhido: o nome voa da linha para o cabeçalho (View Transition), o caminho, os
     fabricantes como escolha (Todos e os do grupo), uma pré-visualização das referências (as primeiras quatro) e
     «Ver referências». Sem referências: diz que o grupo não tem peças no catálogo e desliga o botão.
   - No telemóvel, um painel de cada vez: escolher o grupo abre o painel; «Grupos» volta.
   ========================================================= */
let fabU = '';
function ladoGrupo(main: HTMLElement): void {
  const grupo = main.dataset.uGrupo; const lado = $(main, '.cat5__u-lado'); if (!grupo || !lado) return;
  const refs = REFERENCIAS.filter((r) => r[0] === grupo);
  const fabs = Array.from(new Set(refs.map((r) => r[1])));
  if (fabU && !fabs.includes(fabU)) fabU = '';
  const ver = refs.filter((r) => !fabU || r[1] === fabU);
  let caixa = lado.querySelector<HTMLElement>('.cat6__u-escolha');
  if (!caixa) { caixa = document.createElement('div'); caixa.className = 'cat6__u-escolha'; lado.appendChild(caixa); }
  caixa.innerHTML = refs.length ? `
    <div class="cat6__u-fabs" role="radiogroup" aria-label="Fabricante">${['', ...fabs].map((f) => `<button type="button" role="radio" class="cat6__u-fab" data-u-fab="${f}" aria-checked="${f === fabU}">${f || 'Todos'}<span>${f ? refs.filter((r) => r[1] === f).length : refs.length}</span></button>`).join('')}</div>
    <ul class="cat6__u-refs" aria-label="Referências deste grupo">${ver.slice(0, 4).map((r, i) => `<li style="--i:${i}"><b>${r[1]} ${r[2]}</b><span>${r[3]}</span><em>${euros(r[4] * (1 - r[5] / 100))}</em><i class="cat6__u-stock${r[6] + r[7] ? '' : ' is-sem'}">${r[6] + r[7] ? `${r[6] + r[7]} un.` : 'Por encomenda'}</i></li>`).join('')}</ul>
    <div class="cat6__u-pe"><span>${ver.length} ${ver.length === 1 ? 'referência' : 'referências'}${fabU ? ` da ${fabU}` : ''}${ver.length > 4 ? ' · as primeiras 4' : ''}</span><button type="button" class="btn btn--acao cat6__u-ver" data-ver-refs><span class="btn__rotulo">Ver referências</span><svg class="btn__icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-i="arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button></div>`
    : `<p class="cat6__u-vazio">O grupo «${grupo}» ainda não tem referências no catálogo de exemplo. Escolha outro grupo, ou peça a peça ao apoio da Romafe.</p><div class="cat6__u-pe"><span></span><button type="button" class="btn btn--acao cat6__u-ver" disabled><span class="btn__rotulo">Ver referências</span></button></div>`;
  if (!lado.querySelector('.cat6__u-voltar')) lado.insertAdjacentHTML('afterbegin', '<button type="button" class="cat6__u-voltar" data-u-voltar><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-i="chevron-left"><path d="m15 18-6-6 6-6"/></svg>Grupos</button>');
  /* o ícone do grupo ao lado do título (o mesmo da linha da árvore) */
  const tit = lado.querySelector<HTMLElement>('.cat5__u-grupo');
  const icone = main.querySelector('.cat5__folha[aria-current="true"] .cat5__folha-icone')?.innerHTML || '';
  let ic = lado.querySelector<HTMLElement>('.cat6__u-icone');
  if (!ic && tit) { tit.insertAdjacentHTML('beforebegin', '<span class="cat6__u-icone" aria-hidden="true"></span>'); ic = lado.querySelector<HTMLElement>('.cat6__u-icone'); }
  if (ic) ic.innerHTML = icone;
  const sub = lado.querySelector('.cat5__u-sub'); if (sub) sub.textContent = refs.length ? 'Escolha o fabricante e veja as referências deste grupo.' : '';
  main.querySelector('.cat5__universal')?.classList.add('is-com-grupo');
}
function escolherGrupoV6(main: HTMLElement, folha: HTMLElement): void {
  const doc = document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };
  const grupo = folha.dataset.grupo || '';
  fabU = '';
  const fazer = () => { escolherGrupo(main, grupo); ladoGrupo(main); };
  if (!doc.startViewTransition || quieto()) { fazer(); return; }
  const de = folha.querySelector<HTMLElement>('.cat5__folha-nome')!, deIc = folha.querySelector<HTMLElement>('.cat5__folha-icone');
  de.style.viewTransitionName = 'cat-grupo'; if (deIc) deIc.style.viewTransitionName = 'cat-grupo-ic';
  const t = doc.startViewTransition(() => { de.style.viewTransitionName = ''; if (deIc) deIc.style.viewTransitionName = ''; fazer(); const para = $(main, '.cat5__u-grupo'); if (para) para.style.viewTransitionName = 'cat-grupo'; const ic = $(main, '.cat6__u-icone'); if (ic) ic.style.viewTransitionName = 'cat-grupo-ic'; });
  t.finished.finally(() => { const para = $(main, '.cat5__u-grupo'); if (para) para.style.viewTransitionName = ''; const ic = $(main, '.cat6__u-icone'); if (ic) ic.style.viewTransitionName = ''; });
}
function tecladoArvore(ev: KeyboardEvent): void {
  const el = ev.target as HTMLElement; if (!el.matches?.('.cat6 .cat5__arvore :is(.cat5__abrir-ramo, .cat5__folha)')) return;
  const arv = el.closest<HTMLElement>('.cat5__arvore')!;
  const linhas = Array.from(arv.querySelectorAll<HTMLElement>('.cat5__abrir-ramo, .cat5__folha')).filter((b) => b.offsetParent);
  const i = linhas.indexOf(el);
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); linhas[Math.max(0, Math.min(linhas.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))]?.focus(); }
  else if (ev.key === 'ArrowRight' && el.matches('.cat5__abrir-ramo')) { ev.preventDefault(); if (el.getAttribute('aria-expanded') !== 'true') ramo(el, true); else linhas[i + 1]?.focus(); }
  else if (ev.key === 'ArrowLeft') { ev.preventDefault(); if (el.matches('.cat5__abrir-ramo') && el.getAttribute('aria-expanded') === 'true') ramo(el, false); else el.closest('.cat5__ramo')?.querySelector<HTMLElement>('.cat5__abrir-ramo')?.focus(); }
}

/* =========================================================
   (14 out., o segundo briefing do explorador) — as colunas: num ecrã largo, as famílias (A) e os grupos da família
   aberta (B) ficam lado a lado; a coluna B entra da direita (320 ms); com procura, volta a árvore (os caminhos
   abertos e o texto destacado). O fabricante (C) está no painel da direita.
   ========================================================= */
const largo = () => window.matchMedia('(min-width: 1100px)').matches;
function colunaB(main: HTMLElement, botao: HTMLElement): void {
  const uni = $(main, '.cat5__universal'), sec = $(main, '.cat5__u-grupos'); if (!uni || !sec) return;
  const termo = $<HTMLInputElement>(main, '.cat5__u-campo input')?.value.trim();
  if (!largo() || termo) { uni.classList.remove('is-colunas'); return; }
  /* uma família aberta de cada vez */
  main.querySelectorAll<HTMLElement>('.cat5__arvore .cat5__abrir-ramo[aria-expanded="true"]').forEach((b) => { if (b !== botao) ramo(b, false); });
  ramo(botao, true);
  uni.classList.add('is-colunas');
  let col = sec.querySelector<HTMLElement>('.cat6__col-b');
  if (!col) { col = document.createElement('div'); col.className = 'cat6__col-b'; sec.querySelector('.cat5__arvore')?.after(col); }
  const li = botao.closest('.cat5__ramo')!;
  const nome = botao.querySelector('.cat5__folha-nome')?.textContent || '';
  col.innerHTML = `<p class="cat6__col-b-titulo"><span aria-hidden="true">${botao.querySelector('.cat5__ramo-icone')?.innerHTML || ''}</span>${nome}</p><ul>${Array.from(li.querySelectorAll('.cat5__folhas > li')).map((x) => x.outerHTML).join('')}</ul>`;
  if (!quieto()) col.animate([{ opacity: 0, transform: 'translateX(16px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}

/* =========================================================
   A ficha da peça em três regiões (14 out.): à esquerda a imagem, ao centro a informação e os separadores, à
   direita a compra (presa ao rolar). A imagem e a referência voam da linha da tabela para a ficha. Nos veículos
   aplicáveis, uma procura.
   ========================================================= */
function fichaV6(main: HTMLElement): void {
  const peca = $(main, '.cat5__peca'), det = $(main, '.cat5__detalhes'); if (!peca || !det) return;
  let f = main.querySelector<HTMLElement>('.cat6__ficha');
  if (!f) { f = document.createElement('div'); f.className = 'cat6__ficha'; f.dataset.so = 'detalhes'; peca.before(f); f.append(peca, det); }
  f.hidden = main.dataset.vista !== 'detalhes';
  /* a ficha refaz-se a cada referência (abrirDetalhes): as melhorias voltam a pôr-se sozinhas */
  if (!f.dataset.obs) { f.dataset.obs = '1'; new MutationObserver(() => decorarFicha(main)).observe(f, { childList: true, subtree: false }); new MutationObserver(() => decorarFicha(main)).observe($(main, '.cat5__peca')!, { childList: true }); main.querySelectorAll('.cat5__aba-corpo').forEach((c) => new MutationObserver(() => decorarFicha(main)).observe(c, { childList: true })); }
  decorarFicha(main);
  const aplic = main.querySelector<HTMLElement>('[data-corpo="veiculos"]');
  if (aplic && !aplic.querySelector('.cat6__aplic-procura')) aplic.insertAdjacentHTML('afterbegin', '<label class="cat6__aplic-procura"><span class="sr-only">Procurar nos veículos aplicáveis</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" data-i="search"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/></svg><input type="search" placeholder="Procurar modelo ou motor…" data-aplic-procura></label>');
}

/* =========================================================
   A ficha da peça (14 out., o briefing da ficha): a escolha do armazém (a linha e a barra da distribuição do stock
   andam juntas; o painel de compra diz de onde sai), copiar com «Copiado», a quantidade com o − desligado no 1,
   o separador com a risca que desliza, «Adicionar à minha lista» com o seu fluxo, e o carrinho com a confirmação
   visível. Sem fotografias da peça: a imagem diz «Fotografia indisponível» (nada de zoom nem 360° falsos).
   ========================================================= */
let armazem = '';
function decorarFicha(main: HTMLElement): void {
  const corpo = main.querySelector<HTMLElement>('[data-corpo="stock"]'); if (!corpo) return;
  const linhas = Array.from(corpo.querySelectorAll<HTMLElement>('tbody tr.cat5__arm'));
  const qtd = linhas.map((tr) => Number((tr.querySelector('.cat5__stock')?.textContent || '').replace(/\D/g, '')) || 0);
  const nomes = linhas.map((tr) => tr.querySelector('strong')?.textContent || '');
  const total = qtd.reduce((a, b) => a + b, 0);
  if (!armazem || !nomes.includes(armazem)) armazem = nomes[qtd.findIndex((q) => q > 0)] || nomes[0] || '';
  /* a barra da distribuição, por cima da tabela */
  if (!corpo.querySelector('.cat6__dist')) corpo.insertAdjacentHTML('afterbegin', `<div class="cat6__dist" role="img" aria-label="${nomes.map((n, i) => `${n}: ${qtd[i]} unidades`).join('; ')}">${nomes.map((n, i) => `<span class="cat6__dist-seg" data-armazem="${n}" style="flex:${Math.max(qtd[i], total ? 0 : 1)}"><b>${n}</b> ${qtd[i]} un.</span>`).join('')}</div>`);
  linhas.forEach((tr, i) => {
    tr.dataset.armazem = nomes[i];
    tr.tabIndex = 0;
    tr.setAttribute('aria-selected', String(nomes[i] === armazem));
  });
  corpo.querySelectorAll<HTMLElement>('.cat6__dist-seg').forEach((sg) => sg.classList.toggle('is-escolhido', sg.dataset.armazem === armazem));
  /* o painel de compra: de onde sai */
  const compra = main.querySelector<HTMLElement>('.cat5__peca-compra');
  if (compra) {
    const tr = linhas.find((l) => l.dataset.armazem === armazem);
    const prazo = tr?.querySelectorAll('td')[2]?.textContent?.trim() || '';
    let sai = compra.querySelector<HTMLElement>('.cat6__sai');
    if (!sai) { compra.querySelector('.cat5__peca-pedir')?.insertAdjacentHTML('beforebegin', '<p class="cat6__sai" aria-live="polite"></p>'); sai = compra.querySelector<HTMLElement>('.cat6__sai'); }
    if (sai) sai.innerHTML = armazem ? `Sai de <b>${armazem}</b> · ${prazo}` : '';
    const q = compra.querySelector<HTMLInputElement>('.cat5__qtd-n'); const menos = compra.querySelector<HTMLButtonElement>('.cat5__qtd-menos');
    if (q && menos) menos.disabled = Number(q.value) <= 1;
  }
  /* o separador ativo: a risca que desliza */
  const abas = main.querySelector<HTMLElement>('.cat5__abas');
  if (abas) { let r = abas.querySelector<HTMLElement>('.cat6__aba-risca'); if (!r) { r = document.createElement('i'); r.className = 'cat6__aba-risca'; r.setAttribute('aria-hidden', 'true'); abas.appendChild(r); } const a = abas.querySelector<HTMLElement>('.cat5__aba[aria-selected="true"]'); if (a) { r.style.setProperty('--x', `${a.offsetLeft}px`); r.style.setProperty('--w', `${a.offsetWidth}px`); } }
  /* OE: copiar cada número */
  main.querySelectorAll<HTMLElement>('.cat5__oe li').forEach((li) => { if (li.querySelector('[data-copiar]')) return; const n = li.querySelector('strong')?.textContent || ''; li.insertAdjacentHTML('beforeend', `<button type="button" class="cat5__copiar" data-copiar="${n}" aria-label="Copiar ${n}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" data-i="copy"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>`); });
}
function escolherArmazem(main: HTMLElement, nome: string): void { armazem = nome; decorarFicha(main); }
const VISTO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="cat6__visto" d="M20 6 9 17l-5-5"/></svg>';
function copiar(b: HTMLElement): void {
  const t = b.dataset.copiar || ''; navigator.clipboard?.writeText(t).catch(() => {});
  if (b.classList.contains('is-copiado')) return;
  const antes = b.innerHTML; b.classList.add('is-copiado'); b.innerHTML = `${VISTO}<span>Copiado</span>`;
  window.setTimeout(() => { b.innerHTML = antes; b.classList.remove('is-copiado'); }, 1600);
}
function aviso(main: HTMLElement, html: string): void {
  const compra = main.querySelector<HTMLElement>('.cat5__peca-compra'); if (!compra) return;
  compra.querySelector('.cat6__toast')?.remove();
  compra.insertAdjacentHTML('beforeend', `<p class="cat6__toast" role="status"><span>${html}</span></p>`);
  const t = compra.querySelector<HTMLElement>('.cat6__toast')!;
  window.setTimeout(() => { t.classList.add('is-a-sair'); window.setTimeout(() => t.remove(), 300); }, 3200);
}
function guardarNaLista(main: HTMLElement, b: HTMLButtonElement): void {
  if (b.dataset.pendente) return;
  const ja = b.getAttribute('aria-pressed') === 'true';
  b.dataset.pendente = '1'; b.setAttribute('aria-busy', 'true');
  const antes = b.innerHTML;
  b.innerHTML = `${rolamentoSvg('ls-' + ++n, 'pesquisar', 'cat6__rs-botao')}<span class="btn__rotulo">${ja ? 'A tirar…' : 'A guardar…'}</span>`;
  window.setTimeout(() => {
    delete b.dataset.pendente; b.removeAttribute('aria-busy');
    b.setAttribute('aria-pressed', String(!ja));
    b.innerHTML = antes.replace(/Adicionar à minha lista|Na minha lista/, ja ? 'Adicionar à minha lista' : 'Na minha lista');
    b.classList.toggle('is-na-lista', !ja);
    if (!ja) { b.querySelector('svg')?.classList.add('is-ligar'); aviso(main, `${VISTO}Guardada na minha lista. <button type="button" class="cat3__ligacao" data-ir="lista">Abrir a lista</button>`); }
    else aviso(main, 'Tirada da minha lista.');
  }, quieto() ? 150 : 700);
}

/* ---------- ligar ---------- */
function armar(): void {
  const portal = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--cat6');
  if (!portal) return;
  if (!portal.querySelector('.cat6__aviso')) portal.insertAdjacentHTML('beforeend', '<p class="cat6__aviso sr-only" role="status" aria-live="polite"></p>');
  const main = portal.querySelector<HTMLElement>('.cat6');
  if (main) { fichaV6(main); if (main.dataset.uGrupo) ladoGrupo(main); const aberto = main.querySelector<HTMLElement>('.cat5__arvore .cat5__abrir-ramo[aria-expanded="true"]'); if (aberto && !main.querySelector('.cat6__col-b')) colunaB(main, aberto); decorarModelos(main); contexto(main, (main.dataset.vista || 'marcas') as Vista); vazioMarcas(main); if (!portal.classList.contains('portal--estado')) entradaMarcas(main); requestAnimationFrame(() => segmento(main)); }
  requestAnimationFrame(() => riscas(portal));
}

export function iniciar(): void {
  ligarGanchos();
  inclinar();
  profundidade();
  document.addEventListener('keydown', tecladoArvore);
  document.addEventListener('keydown', (ev) => { const tr = (ev.target as Element).closest?.<HTMLElement>('.cat6 [data-corpo="stock"] tr[data-armazem]'); if (tr && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); escolherArmazem(tr.closest<HTMLElement>('.cat6')!, tr.dataset.armazem || ''); } });
  document.addEventListener('pointerover', (ev) => { const el = (ev.target as Element).closest?.<HTMLElement>('.cat6 [data-corpo="stock"] [data-armazem]'); const corpo = el?.closest('[data-corpo="stock"]'); if (!corpo) return; corpo.querySelectorAll<HTMLElement>('[data-armazem]').forEach((x) => x.classList.toggle('is-sobre', x.dataset.armazem === el!.dataset.armazem)); });
  document.addEventListener('pointerout', (ev) => { const corpo = (ev.target as Element).closest?.('.cat6 [data-corpo="stock"]'); if (corpo && !corpo.contains(ev.relatedTarget as Node)) corpo.querySelectorAll('.is-sobre').forEach((x) => x.classList.remove('is-sobre')); });
  document.addEventListener('input', (ev) => {
    const i = ev.target as HTMLInputElement, m = i.closest?.<HTMLElement>('.cat6'); if (!m) return;
    if (i.matches('.cat5__u-campo input')) { const uni = $(m, '.cat5__universal'); if (i.value.trim()) uni?.classList.remove('is-colunas'); else { const b = m.querySelector<HTMLElement>('.cat5__arvore .cat5__abrir-ramo[aria-expanded="true"]'); if (b) colunaB(m, b); } }
    if (i.matches('[data-aplic-procura]')) { const q = i.value.trim().toLowerCase(); i.closest('[data-corpo]')!.querySelectorAll<HTMLElement>('tbody tr').forEach((tr) => { tr.hidden = !!q && !tr.textContent!.toLowerCase().includes(q); }); }
  });
  ['input', 'change'].forEach((t) => document.addEventListener(t, (ev) => { const m = (ev.target as Element).closest?.<HTMLElement>('.cat6'); if (m && (ev.target as Element).closest('.cat4__filtrar')) temFiltros(m); }));
  document.addEventListener('click', (ev) => { const m = (ev.target as Element).closest?.<HTMLElement>('.cat6'); if (m && (ev.target as Element).closest('.cat4__filtrar .cat3__limpar')) requestAnimationFrame(() => temFiltros(m)); });
  document.addEventListener('keydown', (ev) => { const i = ev.target as HTMLInputElement; if (ev.key === 'Escape' && i.matches?.('.cat6 .cat2__procura input') && i.value) { ev.preventDefault(); limparProcura(i.closest<HTMLElement>('.cat6')!); } });
  document.addEventListener('click', (ev) => { const t = ev.target as Element; const m = t.closest?.<HTMLElement>('.cat6'); if (m && t.closest('.cat2__filtro-aba')) requestAnimationFrame(() => segmento(m)); });
  window.addEventListener('resize', () => { const m = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .cat6'); if (m) segmento(m); });
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
    if (est && !quieto()) { const liga = est.getAttribute('aria-pressed') !== 'true'; est.classList.remove('is-ligar', 'is-desligar'); void est.offsetWidth; est.classList.add(liga ? 'is-ligar' : 'is-desligar'); return; }
    if (t.closest('[data-limpar-marca]')) { ev.preventDefault(); ev.stopPropagation(); limparProcura(main); return; }
    const cp = t.closest<HTMLElement>('.cat6 [data-copiar]'); if (cp) { ev.preventDefault(); ev.stopPropagation(); copiar(cp); return; }
    const lista = t.closest<HTMLButtonElement>('.cat5__lista'); if (lista) { ev.preventDefault(); ev.stopPropagation(); guardarNaLista(main, lista); return; }
    const arm = t.closest<HTMLElement>('[data-corpo="stock"] tr[data-armazem], .cat6__dist-seg'); if (arm && !t.closest('button, input')) { escolherArmazem(main, arm.dataset.armazem || ''); return; }
    if (t.closest('.cat5__aba')) requestAnimationFrame(() => decorarFicha(main));
    if (t.closest('.cat5__peca-compra .cat5__qtd-menos, .cat5__peca-compra .cat5__qtd-mais')) requestAnimationFrame(() => decorarFicha(main));
    const fam = t.closest<HTMLElement>('.cat5__arvore .cat5__abrir-ramo');
    if (fam && largo() && !$<HTMLInputElement>(main, '.cat5__u-campo input')?.value.trim()) { ev.preventDefault(); ev.stopPropagation(); colunaB(main, fam); return; }
    const folha = t.closest<HTMLElement>('.cat5__universal .cat5__folha');
    if (folha) { ev.preventDefault(); ev.stopPropagation(); escolherGrupoV6(main, folha); return; }
    const uf = t.closest<HTMLElement>('[data-u-fab]');
    if (uf) { fabU = uf.dataset.uFab || ''; ladoGrupo(main); return; }
    if (t.closest('[data-ver-refs]')) { const g = main.dataset.uGrupo || ''; abrirReferencias(main, g, fabU ? [fabU] : [], main.dataset.vista === 'grupos' ? 'veiculo' : 'universal'); ir(main, 'referencias'); return; }
    if (t.closest('[data-u-voltar]')) { main.querySelector('.cat5__universal')?.classList.remove('is-com-grupo'); main.querySelector<HTMLElement>('.cat5__folha[aria-current="true"]')?.focus(); return; }
    const mod = t.closest<HTMLElement>('.cat3__vista[data-so="modelos"] .cat3__linha[data-modelo]');
    if (mod) { main.dataset.carrocaria = mod.dataset.carrocaria || ''; if (!aEscolherModelo && escolherModelo(main, mod)) { ev.preventDefault(); ev.stopPropagation(); return; } }
    const marca = t.closest<HTMLElement>('.cat2__marca-botao');
    if (marca && !aEscolher && escolherMarca(main, marca)) { ev.preventDefault(); ev.stopPropagation(); return; }
    const parte = t.closest<HTMLElement>('.cat6__ctx-parte');
    if (parte?.dataset.irVista) { ev.preventDefault(); ev.stopPropagation(); ir(main, parte.dataset.irVista as Vista); }
  }, true);
}
