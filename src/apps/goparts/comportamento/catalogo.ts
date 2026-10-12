/* =========================================================
   GOPARTS — o Catálogo v2 (12 out. 2026), no estilo do Início v2.2
   Favoritas / Todas, a procura de marca, a estrela que marca favoritas, e
   o primeiro passo do catálogo: escolher a marca abre os modelos dela (o
   passo «Modelos» fica ativo). As marcas entram em cascata ao filtrar.
   Os modelos são de exemplo, só para as marcas favoritas de origem.
   No editor (body.editando) nada disto corre.
   ========================================================= */
const MODELOS: Record<string, [string, string][]> = {
  Renault: [['Clio IV', '2012–2019'], ['Clio V', '2019–'], ['Mégane IV', '2016–'], ['Captur', '2013–'], ['Kangoo', '2008–']],
  Peugeot: [['208', '2012–'], ['308', '2013–'], ['2008', '2013–'], ['3008', '2016–'], ['Partner', '2008–']],
  VW: [['Golf VII', '2012–2020'], ['Golf VIII', '2019–'], ['Polo', '2017–'], ['Passat', '2014–'], ['T-Roc', '2017–']],
  'Citroën': [['C3', '2016–'], ['C4', '2020–'], ['Berlingo', '2018–'], ['C5 Aircross', '2018–']],
  'Mercedes-Benz': [['Classe A', '2018–'], ['Classe C', '2014–'], ['Classe E', '2016–'], ['Sprinter', '2018–']],
  BMW: [['Série 1', '2019–'], ['Série 3', '2019–'], ['X1', '2015–'], ['X3', '2017–']],
  Toyota: [['Yaris', '2020–'], ['Corolla', '2019–'], ['C-HR', '2016–'], ['RAV4', '2019–']],
  Opel: [['Corsa F', '2019–'], ['Astra K', '2015–2021'], ['Mokka', '2020–'], ['Combo', '2018–']],
};
const editando = () => document.body.classList.contains('editando');

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* A procura com animação de disposição (FLIP): as marcas que saem desvanecem
   (150 ms) e as que ficam deslizam do sítio antigo para o novo (220 ms), sem
   a grelha saltar. Os separadores Favoritas/Todas usam a entrada em cascata. */
function procurar(c: HTMLElement): void {
  if (quieto()) { aplicar(c); return; }
  const grelha = c.querySelector<HTMLElement>('.cat2__grelha')!;
  const termo = (c.querySelector<HTMLInputElement>('.cat2__procura input')?.value || '').trim().toLowerCase();
  const filtro = grelha.dataset.filtroAtivo || 'favoritas';
  const marcas = Array.from(grelha.querySelectorAll<HTMLElement>('.cat2__marca'));
  const fica = (m: HTMLElement) => termo ? (m.dataset.nome || '').toLowerCase().includes(termo) : (filtro === 'todas' || m.querySelector('.cat2__estrela')?.getAttribute('aria-pressed') === 'true');
  const antes = new Map(marcas.filter((m) => !m.hidden).map((m) => [m, m.getBoundingClientRect()]));
  const saem = marcas.filter((m) => !m.hidden && !fica(m));
  saem.forEach((m) => m.classList.add('is-a-sair'));
  window.setTimeout(() => {
    grelha.classList.remove('is-a-entrar');
    marcas.forEach((m) => { m.classList.remove('is-a-sair'); m.hidden = !fica(m); });
    const vazio = c.querySelector<HTMLElement>('.cat2__vazio');
    if (vazio) vazio.hidden = marcas.some((m) => !m.hidden);
    marcas.filter((m) => !m.hidden).forEach((m) => {
      const a = antes.get(m);
      const d = m.getBoundingClientRect();
      if (!a) { m.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' }); return; }
      const dx = a.left - d.left, dy = a.top - d.top;
      if (dx || dy) m.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    });
  }, saem.length ? 150 : 0);
}

/** Troca de um bloco para outro na horizontal: o que sai vai para um lado, o que entra vem do outro. */
function deslizar(sai: HTMLElement, entra: HTMLElement, frente: boolean, antes: () => void): void {
  if (quieto()) { antes(); return; }
  const fora = frente ? 'is-a-sair-esq' : 'is-a-sair-dir';
  const dentro = frente ? 'is-a-entrar-dir' : 'is-a-entrar-esq';
  sai.classList.add(fora);
  window.setTimeout(() => {
    sai.classList.remove(fora);
    antes();
    entra.classList.remove(dentro); void entra.offsetWidth; entra.classList.add(dentro);
    window.setTimeout(() => entra.classList.remove(dentro), 260);
  }, 200);
}

function aplicar(c: HTMLElement): void {
  const grelha = c.querySelector<HTMLElement>('.cat2__grelha')!;
  const filtro = grelha.dataset.filtroAtivo || 'favoritas';
  const termo = (c.querySelector<HTMLInputElement>('.cat2__procura input')?.value || '').trim().toLowerCase();
  let k = 0;
  grelha.querySelectorAll<HTMLElement>('.cat2__marca').forEach((m) => {
    const fav = m.querySelector('.cat2__estrela')?.getAttribute('aria-pressed') === 'true';
    /* a procurar, procura em todas; sem procura, segue o separador */
    const ver = termo ? (m.dataset.nome || '').toLowerCase().includes(termo) : (filtro === 'todas' || fav);
    m.hidden = !ver;
    if (ver) m.style.setProperty('--i', String(k++));
  });
  /* recomeçar a entrada em cascata */
  grelha.classList.remove('is-a-entrar'); void grelha.offsetWidth; grelha.classList.add('is-a-entrar');
  const vazio = c.querySelector<HTMLElement>('.cat2__vazio');
  if (vazio) vazio.hidden = k > 0;
}

function passo(portal: Element | null, i: number): void {
  portal?.querySelectorAll<HTMLButtonElement>('.cat2__passo').forEach((b) => {
    const n = Number(b.dataset.passo);
    if (n === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    if (n <= i || n === 6) b.disabled = false; else if (n > i) b.disabled = true;
  });
}

function abrirModelos(c: HTMLElement, nome: string): void {
  const lista = c.querySelector<HTMLElement>('.cat2__lista-modelos')!;
  const modelos = MODELOS[nome] || [];
  lista.innerHTML = modelos.length
    ? modelos.map(([, anos], i) => `<li style="--i:${i}"><button type="button" class="cat2__modelo"><span class="cat2__modelo-nome"></span><span class="cat2__modelo-anos">${anos}</span></button></li>`).join('')
    : '<li class="cat2__sem">Sem modelos de exemplo para esta marca: os exemplos só existem para as favoritas de origem.</li>';
  lista.querySelectorAll('.cat2__modelo-nome').forEach((s, i) => { s.textContent = modelos[i][0]; });
  c.querySelector('.cat2__escolhida')!.textContent = '· ' + nome;
  const grelha = c.querySelector<HTMLElement>('.cat2__grelha')!;
  const bloco = c.querySelector<HTMLElement>('.cat2__modelos')!;
  passo(c.closest('.portal'), 1);
  deslizar(grelha, bloco, true, () => {
    grelha.hidden = true;
    c.querySelector<HTMLElement>('.cat2__vazio')!.hidden = true;
    c.querySelector<HTMLElement>('.cat2__marcas-cabeca')!.hidden = true;
    bloco.hidden = false;
  });
}
function fecharModelos(c: HTMLElement): void {
  const grelha = c.querySelector<HTMLElement>('.cat2__grelha')!;
  const modelos = c.querySelector<HTMLElement>('.cat2__modelos')!;
  passo(c.closest('.portal'), 0);
  if (modelos.hidden) return;
  deslizar(modelos, grelha, false, () => {
    modelos.hidden = true;
    grelha.hidden = false;
    c.querySelector<HTMLElement>('.cat2__marcas-cabeca')!.hidden = false;
  });
}

export function iniciar(): void {
  document.querySelectorAll<HTMLElement>('[data-catalogo]').forEach(aplicar);
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const c = t.closest<HTMLElement>('[data-catalogo]');
    const p = t.closest<HTMLButtonElement>('.cat2__passo');
    if (p && !p.disabled) {
      const cat = p.closest('.portal')?.querySelector<HTMLElement>('[data-catalogo]');
      if (cat && Number(p.dataset.passo) === 0) fecharModelos(cat);
      return;
    }
    if (!c) return;
    const aba = t.closest<HTMLElement>('.cat2__filtro-aba');
    const estrela = t.closest<HTMLElement>('.cat2__estrela');
    const marca = t.closest<HTMLElement>('.cat2__marca-botao');
    if (aba) {
      c.querySelectorAll('.cat2__filtro-aba').forEach((a) => a.removeAttribute('aria-current'));
      aba.setAttribute('aria-current', 'true');
      c.querySelector<HTMLElement>('.cat2__grelha')!.dataset.filtroAtivo = aba.dataset.filtro;
      aplicar(c);
    } else if (estrela) {
      estrela.setAttribute('aria-pressed', String(estrela.getAttribute('aria-pressed') !== 'true'));
      estrela.classList.remove('is-a-marcar'); void estrela.offsetWidth; estrela.classList.add('is-a-marcar');
    } else if (marca) {
      abrirModelos(c, marca.closest<HTMLElement>('.cat2__marca')!.dataset.nome || '');
    } else if (t.closest('.cat2__voltar')) {
      fecharModelos(c);
    }
  });
  document.addEventListener('input', (ev) => {
    const i = ev.target as HTMLElement;
    if (editando() || !i.matches('.cat2__procura input')) return;
    const c = i.closest<HTMLElement>('[data-catalogo]');
    if (c) procurar(c);
  });
}
