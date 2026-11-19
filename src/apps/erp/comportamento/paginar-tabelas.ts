/* =========================================================
   ERP — paginação em todas as tabelas (19 nov. 2026). Ela: «quero paginação em todas as tabelas».
     - Qualquer tabela de dados do ecrã à vista (listas, mapas, comparativos…) com mais linhas do que uma página ganha
       por baixo: «1–25 de 85», anterior/seguinte, a página e Por página (10, 25, 50, Todos; fica guardado);
     - as faixas dos grupos e os subtotais acompanham as suas linhas; o total do rodapé continua a ser o de todas;
     - quando as setas, o Enter ou o próprio ecrã escolhem uma linha que está noutra página, a página muda para ela;
     - as tabelas que já paginam sozinhas (78, 77 v2) marcam-se com data-paginada e ficam de fora; as pequenas
       (lf2-mini dentro das janelas, o histórico) também.
   ========================================================= */
import chevL from 'lucide-static/icons/chevron-left.svg?raw';
import chevR from 'lucide-static/icons/chevron-right.svg?raw';

const TABELAS = 'table:is(.lf2-tab, .cp-tabela, .ak-tab, .ws-tabela, .lf-tabela, .fx-tab, .dk-tab):not([data-paginada])';
const NAO_DADOS = '.mac-g, .rc-g-cab, .rc-g-soma, .mst-det, .mva-abertura, .lf2-filtros-col, [data-nao-paginar]';
const GRUPO = '.mac-g, .rc-g-cab', SUBTOTAL = '.rc-g-soma', AGARRADA = '.mst-det';
const OPCOES = [10, 25, 50, 0];
const CHAVE = 'erp:por-pagina';
const porOmissao = () => { try { const n = Number(localStorage.getItem(CHAVE)); return OPCOES.includes(n) && localStorage.getItem(CHAVE) !== null ? n : 25; } catch { return 25; } };

interface Pag { pagina: number; pp: number; el: HTMLElement }
const estados = new WeakMap<Element, Pag>();
const svg = (s: string) => s.replace('<svg', '<svg aria-hidden="true" focusable="false"');
const nf = (n: number) => n.toLocaleString('pt-PT');

/** O contentor que se redesenha com a tabela (a pager fica logo a seguir, fora dele). */
const contentor = (t: HTMLElement) => t.closest<HTMLElement>('.lf2-grelha, .cp-tabela-c, .ws-tabela-c, .lf-grelha, [data-paginar-c]') ?? t.parentElement!;
const linhasDados = (t: HTMLElement) => [...t.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr')].filter((tr) => !tr.matches(NAO_DADOS) && !tr.hidden && !tr.classList.contains('is-oculta'));

function aplicar(t: HTMLElement): void {
  const c = contentor(t); if (!c) return;
  let p = estados.get(c);
  const dados = linhasDados(t), total = dados.length;
  if (!p) {
    const pp = porOmissao(), el = document.createElement('nav');
    el.className = 'pag-t'; el.setAttribute('aria-label', 'Páginas da tabela'); el.dataset.pagT = '';
    p = { pagina: 0, pp, el }; estados.set(c, p);
    /* a linha escolhida pelo próprio ecrã fica à vista */
    const i = dados.findIndex((tr) => tr.matches('.is-ativo, [aria-selected="true"]'));
    if (i >= 0 && pp) p.pagina = Math.floor(i / pp);
  }
  if (!p.el.isConnected || p.el.previousElementSibling !== c) c.after(p.el);
  const pp = p.pp || total || 1, nPags = Math.max(1, Math.ceil(total / pp));
  p.pagina = Math.max(0, Math.min(nPags - 1, p.pagina));
  const de = p.pagina * pp, ate = p.pp ? de + pp : total;
  const ver = new Set(dados.slice(de, ate));
  /* as linhas que não são dados: a faixa mostra-se se algum dos seus dados se vê; o subtotal se o último se vê */
  const todas = [...t.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr')];
  /* uma faixa fechada (sem linhas de dados à vista) mostra sempre o cabeçalho, para se poder abrir */
  let grupo: HTMLTableRowElement | null = null, grupoVisto = false, ultimoVisto = false, grupoDados = 0;
  const fechar = () => { if (grupo) grupo.classList.toggle('is-pag-fora', grupoDados > 0 && !grupoVisto); };
  todas.forEach((tr) => {
    if (tr.matches(GRUPO)) { fechar(); grupo = tr; grupoVisto = false; grupoDados = 0; return; }
    if (tr.matches(SUBTOTAL)) { tr.classList.toggle('is-pag-fora', !ultimoVisto); return; }
    if (tr.matches(AGARRADA)) { tr.classList.toggle('is-pag-fora', !ultimoVisto); return; }
    if (tr.matches(NAO_DADOS) || tr.hidden) return;
    const v = ver.has(tr); tr.classList.toggle('is-pag-fora', !v); ultimoVisto = v; grupoDados++; if (v) grupoVisto = true;
  });
  fechar();
  const precisa = total > 0;
  p.el.hidden = !precisa;
  if (!precisa) return;
  const sig = `${total}|${p.pagina}|${p.pp}`; if (p.el.dataset.sig === sig) return; p.el.dataset.sig = sig;
  p.el.innerHTML = `<span class="pag-t-n">${total ? `${nf(de + 1)}–${nf(Math.min(ate, total))} de ${nf(total)}` : '0 linhas'}</span>
    <button type="button" class="ak-btn ak-btn--linha" data-pag-ir="-1" ${p.pagina === 0 ? 'disabled' : ''} aria-label="Página anterior" title="Página anterior">${svg(chevL)}</button>
    <span class="pag-t-p">Página <b>${p.pagina + 1}</b> de ${nPags}</span>
    <button type="button" class="ak-btn ak-btn--linha" data-pag-ir="1" ${p.pagina >= nPags - 1 ? 'disabled' : ''} aria-label="Página seguinte" title="Página seguinte">${svg(chevR)}</button>
    <label class="pag-t-pp"><span>Por página</span><select data-pag-pp aria-label="Linhas por página">${OPCOES.map((n) => `<option value="${n}"${n === p!.pp ? ' selected' : ''}>${n || 'Todas'}</option>`).join('')}</select></label>`;
}

/** As tabelas do ecrã que se vê (e as das páginas abertas num separador do IDE, que só têm um ecrã). */
function tabelasAVista(): HTMLElement[] {
  const vs = document.querySelectorAll<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden])');
  return [...vs].flatMap((v) => [...v.querySelectorAll<HTMLElement>(TABELAS)]).filter((t) => !t.closest('.lf2-jan, [data-dv2-jan], [data-lf2-jan], [hidden]'));
}
let pedido = 0;
const tudo = () => { pedido = 0; tabelasAVista().forEach(aplicar); };
const pedir = () => { if (!pedido) pedido = requestAnimationFrame(tudo); };

const doPager = (el: Element) => { const n = el.closest<HTMLElement>('[data-pag-t]'); const c = n?.previousElementSibling; return c ? { c, p: estados.get(c), t: c.querySelector<HTMLElement>(TABELAS) ?? (c.matches(TABELAS) ? c as HTMLElement : null) } : null; };

export function iniciar(): void {
  pedir();
  ['romafe:versao', 'romafe:ecra'].forEach((y) => document.addEventListener(y, pedir));
  new MutationObserver((ms) => { if (ms.some((m) => !(m.target instanceof Element && m.target.closest('[data-pag-t]')))) pedir(); })
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-pag-ir]'); if (!b) return;
    const x = doPager(b); if (!x?.p || !x.t) return;
    x.p.pagina += Number(b.dataset.pagIr); aplicar(x.t);
    x.p.el.querySelector<HTMLElement>(`[data-pag-ir="${b.dataset.pagIr}"]:not(:disabled)`)?.focus();
    x.t.closest('.lf2-grelha')?.scrollTo({ top: 0 });
  });
  document.addEventListener('change', (ev) => {
    const s = ev.target as HTMLSelectElement; if (!s.matches('[data-pag-pp]')) return;
    const x = doPager(s); if (!x?.p || !x.t) return;
    x.p.pp = Number(s.value); x.p.pagina = 0; try { localStorage.setItem(CHAVE, s.value); } catch { /* */ }
    aplicar(x.t); x.p.el.querySelector<HTMLElement>('[data-pag-pp]')?.focus();
  });
  /* as setas, o Tab ou o ecrã levaram o foco (ou a escolha) a uma linha de outra página: vai-se para essa página */
  const irPara = (tr: HTMLTableRowElement | null) => {
    if (!tr?.classList.contains('is-pag-fora')) return;
    const t = tr.closest<HTMLElement>(TABELAS); if (!t) return; const c = contentor(t), p = estados.get(c); if (!p || !p.pp) return;
    const i = linhasDados(t).indexOf(tr); if (i < 0) return;
    p.pagina = Math.floor(i / p.pp); aplicar(t); tr.focus({ preventScroll: true }); tr.scrollIntoView({ block: 'nearest' });
  };
  document.addEventListener('focusin', (ev) => irPara((ev.target as HTMLElement).closest?.('tr') ?? null));
  document.addEventListener('keyup', (ev) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(ev.key)) irPara(document.activeElement?.closest?.('tr') ?? null); });
}
