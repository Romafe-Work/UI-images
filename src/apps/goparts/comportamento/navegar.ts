/* =========================================================
   GOPARTS — andar entre os ecrãs do portal (20 out. 2026, V5)
   Do briefing: a passagem do Início para a Pesquisar peças (e entre os ecrãs do portal) sem recarregar a moldura.
   - A transição é a View Transitions do navegador: o topo e a barra lateral ficam parados (têm nome próprio e
     não animam); o conteúdo antigo sai (140 ms, sobe 6 px e desvanece) e o novo entra (260 ms, sobe 8 px).
     Uns 300 ms no total. O indicador da barra desliza da secção antiga para a nova (lado.ts).
   - Ao chegar à Pesquisar peças, o foco vai para o primeiro campo do formulário aberto (e para o modo pedido,
     quando um atalho o escolhe).
   - O botão «voltar» do navegador: cada passagem entre ecrãs do portal fica no histórico; voltar mostra o ecrã
     anterior. (O protótipo, sozinho, só reescreve o endereço; os estados 10.x e o editor não entram.)
   Sem View Transitions, com «reduzir movimento», no editor ou na demonstração (que tem as suas), muda logo.
   ========================================================= */
import { mostrar, definirTransicao } from '../../../comum/ecras';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo');
const ecraVisivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden])');
/** Um ecrã do portal (com a barra lateral) e não um estado. */
const doPortal = (e: HTMLElement | null) => !!e && !e.dataset.estadoDe && !!e.querySelector(':scope > .versao:not([hidden]) .portal--lateral');
const CHAVE_MODO = 'goparts:pesquisa-modo';

type Doc = Document & { startViewTransition?: (f: () => void | Promise<void>) => { finished: Promise<void> } };
let comDemo = false;
/** Muda de ecrã com a transição do portal (ou sem ela). */
function transitar(mudar: () => void): void {
  const doc = document as Doc;
  if (comDemo || !doc.startViewTransition || quieto() || editando() || !doPortal(ecraVisivel())) { mudar(); return; }
  const raiz = document.documentElement;
  raiz.classList.add('gp-vt');
  doc.startViewTransition(mudar).finished.finally(() => raiz.classList.remove('gp-vt'));
}
/** Ir para um ecrã do portal; `modo` escolhe o formulário da Pesquisar peças (0 matrícula, 1 veículo, 2 referência). */
export function irPara(id: string, modo?: number): void {
  if (modo !== undefined) try { sessionStorage.setItem(CHAVE_MODO, String(modo)); } catch { /* abre no último */ }
  transitar(() => { mostrar(id); });
}

/** (20 out., V6) Ir para a ficha de uma peça no Catálogo com a imagem dela a passar do sítio de onde se veio
    (um resultado da Pesquisar peças) para a ficha: o mesmo nome de transição (cat-foto) nos dois lados. */
export function irComFoto(id: string, origem: HTMLElement | null, preparar?: () => void): void {
  const doc = document as Doc;
  if (comDemo || !doc.startViewTransition || quieto() || editando() || !origem) { mostrar(id); return; }
  const raiz = document.documentElement;
  raiz.classList.add('gp-vt');
  origem.style.viewTransitionName = 'cat-foto';
  const t = doc.startViewTransition(() => {
    origem.style.viewTransitionName = '';
    mostrar(id);
    /* o ecrã de chegada abre já o que ficou pedido (durante a transição não há quadros: requestAnimationFrame espera) */
    preparar?.();
    const foto = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .cat6__ficha:not([hidden]) .cat5__peca-imagem');
    if (foto) foto.style.viewTransitionName = 'cat-foto';
  });
  t.finished.finally(() => { raiz.classList.remove('gp-vt'); origem.style.viewTransitionName = ''; document.querySelectorAll<HTMLElement>('.cat5__peca-imagem').forEach((f) => { if (f.style.viewTransitionName === 'cat-foto') f.style.viewTransitionName = ''; }); });
}

/* ---------- ao chegar à Pesquisar peças: o modo pedido e o foco ---------- */
function chegar(): void {
  const e = ecraVisivel(); if (!e || e.dataset.ecra !== 'pesquisa' || editando()) return;
  const ini = e.querySelector<HTMLElement>(':scope > .versao:not([hidden]) .ini3'); if (!ini) return;
  let modo: string | null = null; try { modo = sessionStorage.getItem(CHAVE_MODO); sessionStorage.removeItem(CHAVE_MODO); } catch { /* */ }
  if (modo !== null) ini.querySelector<HTMLElement>(`.ini3__separador[data-modo="${modo}"]`)?.click();
  const m = Number(ini.dataset.modo ?? 0);
  ini.querySelectorAll<HTMLElement>('.ini3__cartao')[m]?.querySelector<HTMLInputElement>('input:not([type="checkbox"]):not([type="radio"])')?.focus({ preventScroll: true });
}

/* ---------- o histórico ---------- */
let anterior: { ecra: string; hash: string } | null = null;
let aVoltar = false;
function registar(): void {
  const e = ecraVisivel(); if (!e) return;
  const agora = { ecra: e.dataset.ecra ?? '', hash: location.hash };
  if (anterior && anterior.ecra !== agora.ecra && !aVoltar && !editando()) {
    const de = document.querySelector<HTMLElement>(`.ecra[data-ecra="${anterior.ecra}"]`);
    /* só entre ecrãs do portal: o endereço antigo fica atrás, o novo à frente */
    if (de && !de.dataset.estadoDe && !e.dataset.estadoDe && de.querySelector('.portal--lateral') && e.querySelector('.portal--lateral')) {
      try { history.replaceState(null, '', anterior.hash); history.pushState(null, '', agora.hash); } catch { /* ficheiro local */ }
      /* depois de a pesquisa escolher o formulário com que abre (inicio-v3.ts, no quadro seguinte) */
      requestAnimationFrame(() => requestAnimationFrame(chegar));
    }
  }
  aVoltar = false;
  anterior = agora;
}

/* (V6) voltar ao sítio: cada ecrã guarda onde estava a página; o «voltar» do navegador repõe-no (os filtros e os
   resultados ficam porque o ecrã não se refaz ao sair) */
const posicoes = new Map<string, number>();
export function iniciar(): void {
  let raf = 0;
  window.addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const e = ecraVisivel()?.dataset.ecra; if (e) posicoes.set(e, window.scrollY); }); }, { passive: true });
  comDemo = /(?:^|[#&])demo=1(?:&|$)/.test(location.hash) || document.body.classList.contains('demo');
  /* as ligações do protótipo (data-ir) passam pela mesma transição; a demonstração, quando liga, troca-a pela dela */
  if (!comDemo) definirTransicao((mudar) => transitar(mudar));
  requestAnimationFrame(registar);
  document.addEventListener('romafe:versao', () => registar());
  window.addEventListener('popstate', () => {
    const m = /(?:^|[#&])ecra=([^&]+)/.exec(location.hash);
    if (!m) return;
    const atual = ecraVisivel()?.dataset.ecra;
    if (m[1] === atual) return;
    aVoltar = true;
    const id = decodeURIComponent(m[1]), y = posicoes.get(id) ?? 0;
    transitar(() => { mostrar(id); window.scrollTo(0, y); });
  });
}
