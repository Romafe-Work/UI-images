/* =========================================================
   GOPARTS — as animações das três versões da v2 (v2.1, v2.2, v2.3)
   12 out. 2026. Ela colou uma proposta e pediu-a «nas três versões da v2»:
   animações modernas, suaves e funcionais, sem brilhos nem sombras
   exageradas, com alguma profundidade 3D. Aqui fica o que precisa de
   JavaScript; o resto é CSS (css/inicio-v2-animacao.css):

   - menu com indicador deslizante (200 ms): a risca laranja desliza para a
     opção por baixo do rato e volta à escolhida ao sair; ao escolher outra,
     desliza para ela;
   - transição entre campos (180 ms): escolher a marca ativa o Modelo com
     os modelos dessa marca; escolher o modelo ativa o Veículo;
   - feedback de pesquisa (250 ms): «Pesquisar» em Pesquisar referências
     mostra um girador discreto e depois os resultados entram com um fade
     e um pequeno movimento vertical (resultados de exemplo).

   No editor (body.editando) nada disto corre: o clique escolhe peças.
   ========================================================= */
const V2 = '.portal--v21, .portal--v22, .portal--v23';
const editando = () => document.body.classList.contains('editando');

/* ---------- o indicador deslizante ---------- */
const MENUS = '.linha__abas, .portal__abas, .carrossel__escolha';
const ITENS = '.linha__aba, .aba, .carrossel__opcao';
const escolhido = (m: HTMLElement) => m.querySelector<HTMLElement>(`:is(${ITENS}):is([aria-current="true"], [aria-selected="true"])`);

/* A escolhida tem a sua própria risca (CSS) e fica sempre marcada. Esta risca é
   a pré-visualização: vai para a opção por baixo do rato e desaparece quando
   chega à escolhida; ao escolher outra, desliza até ela e funde-se com a dela. */
function pousar(m: HTMLElement, alvo: HTMLElement | null): void {
  const risca = m.querySelector<HTMLElement>(':scope > .risca');
  if (!risca) return;
  window.clearTimeout(Number(risca.dataset.apagar || 0));
  if (!alvo || !alvo.offsetWidth) { risca.style.opacity = '0'; return; }
  risca.style.transform = `translateX(${alvo.offsetLeft}px)`;
  risca.style.width = alvo.offsetWidth + 'px';
  if (alvo === escolhido(m)) {
    /* já está na escolhida: acaba de deslizar e apaga-se por cima da risca dela */
    risca.dataset.apagar = String(window.setTimeout(() => { risca.style.opacity = '0'; }, 200));
  } else risca.style.opacity = '1';
}

function ligarMenus(): void {
  document.querySelectorAll<HTMLElement>(`:is(${V2}) :is(${MENUS})`).forEach((m) => {
    m.classList.add('com-risca');
    const risca = document.createElement('span');
    risca.className = 'risca';
    risca.setAttribute('aria-hidden', 'true');
    m.appendChild(risca);
    m.addEventListener('pointerover', (ev) => {
      const item = (ev.target as Element).closest<HTMLElement>(ITENS);
      if (item && m.contains(item) && !item.hasAttribute('disabled')) pousar(m, item);
    });
    m.addEventListener('pointerleave', () => pousar(m, escolhido(m)));
    /* a escolha muda (o carrossel troca o aria-selected): a risca vai atrás */
    new MutationObserver(() => pousar(m, escolhido(m))).observe(m, { subtree: true, attributes: true, attributeFilter: ['aria-selected', 'aria-current'] });
  });
  /* as medidas só existem quando o ecrã se vê: repor ao trocar de ecrã, de versão e de tamanho */
  const repor = () => document.querySelectorAll<HTMLElement>('.com-risca').forEach((m) => pousar(m, escolhido(m)));
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(repor)));
  window.addEventListener('resize', repor);
  window.addEventListener('hashchange', () => requestAnimationFrame(repor));
  if (document.fonts) document.fonts.ready.then(repor);
  requestAnimationFrame(repor);
}

/* ---------- a transição entre campos ---------- */
const MODELOS: Record<string, string[]> = {
  Peugeot: ['208', '308', '3008'],
  Renault: ['Clio IV', 'Mégane IV', 'Captur'],
  Volkswagen: ['Golf VII', 'Polo', 'Passat'],
};
function ativar(sel: HTMLSelectElement, primeira: string, opcoes: string[]): void {
  sel.innerHTML = `<option>${primeira}</option>` + opcoes.map((o) => `<option>${o}</option>`).join('');
  sel.disabled = opcoes.length === 0;
  if (opcoes.length) {
    sel.classList.remove('is-ativado');
    void sel.offsetWidth;            // recomeçar a animação
    sel.classList.add('is-ativado');
  }
}
function ligarCampos(): void {
  document.addEventListener('change', (ev) => {
    if (editando()) return;
    const sel = ev.target as HTMLSelectElement;
    if (!sel.matches?.(`:is(${V2}) select[id$="-marca"], :is(${V2}) select[id$="-modelo"]`)) return;
    const raiz = sel.closest('section, .c22__cartao') || document;
    const modelo = raiz.querySelector<HTMLSelectElement>('select[id$="-modelo"]');
    const veiculo = raiz.querySelector<HTMLSelectElement>('select[id$="-veiculo"]');
    if (sel.id.endsWith('-marca') && modelo && veiculo) {
      ativar(modelo, 'Selecione o modelo', MODELOS[sel.value] || []);
      ativar(veiculo, 'Selecione o veículo', []);
    } else if (sel.id.endsWith('-modelo') && veiculo) {
      const m = sel.selectedIndex > 0 ? sel.value : '';
      ativar(veiculo, 'Selecione o veículo', m ? [`${m} 1.5 Diesel`, `${m} 1.2 Gasolina`, `${m} Híbrido`] : []);
    }
  });
}

/* ---------- o feedback da pesquisa de referências ---------- */
const RESULTADOS = [
  ['SKF', 'VKBA 3525', 'Kit de rolamento de roda', 'Em stock · Porto'],
  ['FAG', '713 6104 00', 'Kit de rolamento de roda · equivalente', 'Em stock · Lisboa'],
  ['SNR', 'R154.56', 'Kit de rolamento de roda · equivalente', 'Entrega em 2 dias'],
];
const GIRADOR = '<span class="girador girador--claro" aria-hidden="true"></span>';
function ligarPesquisa(): void {
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const b = (ev.target as Element).closest<HTMLButtonElement>(`:is(${V2}) :is(.painel2--acao .painel2__pe .btn--acao, .c22__cartao--laranja .c22__botao)`);
    if (!b || b.disabled) return;
    const cartao = b.closest<HTMLElement>('.painel2, .c22__cartao')!;
    const campo = cartao.querySelector<HTMLInputElement>('input[id$="-referencia"]');
    const termo = (campo?.value || '').trim() || 'VKBA 3525';
    const antes = b.innerHTML;
    b.disabled = true;
    b.classList.add('is-a-carregar');
    b.innerHTML = `${GIRADOR}<span class="btn__rotulo">A pesquisar…</span>`;
    cartao.querySelector('.resultados-ref')?.remove();
    window.setTimeout(() => {
      b.disabled = false;
      b.classList.remove('is-a-carregar');
      b.innerHTML = antes;
      const lista = document.createElement('section');
      lista.className = 'resultados-ref';
      lista.setAttribute('aria-live', 'polite');
      lista.innerHTML = `<p class="resultados-ref__titulo">3 resultados para <strong></strong> <span>(exemplo)</span></p>
        <ul>${RESULTADOS.map((r, i) => `<li style="--i:${i}"><span class="resultados-ref__marca">${r[0]}</span><span class="resultados-ref__ref">${r[1]}<small>${r[2]}</small></span><span class="resultados-ref__stock">${r[3]}</span></li>`).join('')}</ul>`;
      lista.querySelector('strong')!.textContent = termo;
      const onde = cartao.querySelector('.painel2__corpo, .c22__form');
      onde?.after(lista);
    }, 900);
  });
}

/* ---------- os acordeões das pesquisas recentes e dos últimos pedidos ----------
   Ela, 12 out.: «accordions, se possível com animação». Um aberto de cada vez;
   a altura abre com grid-template-rows (0fr → 1fr), 250 ms. */
function ligarAcordeoes(): void {
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const cab = (ev.target as Element).closest<HTMLButtonElement>('.acord__cabeca');
    if (!cab) return;
    const lista = cab.closest('[data-acordeao]');
    const abrir = cab.getAttribute('aria-expanded') !== 'true';
    lista?.querySelectorAll<HTMLButtonElement>('.acord__cabeca[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    cab.setAttribute('aria-expanded', String(abrir));
  });
}

export function iniciar(): void {
  ligarAcordeoes();
  ligarMenus();
  ligarCampos();
  ligarPesquisa();
}
