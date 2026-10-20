/* =========================================================
   GOPARTS — a barra de topo a funcionar (16 out. 2026, o briefing «Implementação completa da Navbar»)
   Cada controlo do topo (portal/base.ts) abre uma camada por cima, uma de cada vez:
   - Menu (☰ → ✕): a gaveta das secções, com a atual marcada e os submenus (Catálogo, Documentos, Minha lista);
     no telemóvel é a navegação principal e traz também Pesquisar, Mensagens, Definições e Ajuda.
   - ROMAFE abre romafe.com noutra janela; GoParts vai ao Início (data-ir).
   - Pesquisa (clique, Ctrl+K ou ⌘K): a paleta global — referências, categorias, marcas e modelos de veículos,
     pedidos, guias, faturas e listas, dos dados que o portal já tem; agrupada, com o que coincide marcado, ↑ ↓ Enter
     Esc, pesquisas recentes, referência normalizada (VKBA6556 = VKBA 6556) e tolerância a uma letra trocada.
   - Mensagens: os avisos da conta tirados dos documentos (fatura vencida ou por pagar, guia expedida, pedido à
     espera de stock, nota de crédito), com lida/por ler. As mensagens da Romafe ainda não têm serviço: diz-se.
   - Carrinho: o mini-carrinho, ligado ao estado único (carrinho.ts): quantidade, tirar com «Desfazer», totais.
   - Definições (o ícone redondo; já se chamava assim): o tema Claro · Escuro · Sistema e os atalhos.
   - Ajuda: as perguntas do ecrã em que se está primeiro, e o contacto do apoio.
   - Conta (avatar, nome, seta): o utilizador, a conta (só uma: não há troca), Definições, Minhas listas e
     «Terminar sessão» (limpa o que é da conta neste navegador e volta ao Entrar).
   Esc fecha; clicar fora fecha; o foco volta ao botão; nas camadas modais o Tab fica dentro e a página não rola.
   Sem servidor: o que precisa dele está em LEIA-ME («A barra de topo»).
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { aplicar as aplicarTema, actual as temaActual, type Tema } from '../../../comum/tema';
import { REFERENCIAS, GRUPOS, MODELOS } from '../portal/catalogo-dados';
import { LINHAS, PEDIDOS } from '../portal/pedidos-dados';
import { GUIAS } from '../portal/guias-dados';
import { FATURAS } from '../portal/faturas-dados';
import { LISTAS } from '../portal/lista';
import { azulejoPeca } from '../portal/pecas-img';
import * as carrinho from './carrinho';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando');
const portalVisivel = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal');
const ecraActual = () => { const e = document.querySelector<HTMLElement>('.ecra:not([hidden])'); return e?.dataset.estadoDe || e?.dataset.ecra || ''; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const euros = (n: number) => { const [i, d] = Math.abs(n).toFixed(2).split('.'); return `${n < -0.004 ? '−' : ''}${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d} €`; };
const guardado = <T,>(k: string, v: T): T => { try { const x = localStorage.getItem(k); return x === null ? v : JSON.parse(x) as T; } catch { return v; } };
const guardar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };

/* ---------- ícones (Lucide, desenhados aqui para a camada não depender do portal) ---------- */
const I = (d: string, nome = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${nome ? ` data-i="${nome}"` : ''}>${d}</svg>`;
const IC = {
  x: I('<path d="M18 6 6 18M6 6l12 12"/>', 'x'),
  casa: I('<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/>', 'house'),
  caixa: I('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m12 12 8-4.5M12 12v9M12 12 4 7.5"/>', 'package'),
  doc: I('<path d="M6 3h9l4 4v14H6Z"/><path d="M9 12h7M9 16h7"/>', 'file-text'),
  camiao: I('<path d="M1.5 6.5h13v9h-13Z"/><path d="M14.5 9.5h4l3.5 3.5v2.5h-7.5Z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>', 'truck'),
  recibo: I('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>', 'receipt'),
  voltar: I('<path d="M3 7v5h5"/><path d="M3.5 12a8.5 8.5 0 1 0 2.2-5.7L3 9"/>', 'undo-2'),
  chave: I('<path d="m14 4 6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2Z"/><path d="m12 6 6 6"/>', 'wrench'),
  estrela: I('<path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8Z"/>', 'star'),
  pastas: I('<path d="M3 6h7l2 2h9v11H3Z"/>', 'folder'),
  seta: I('<path d="m9 6 6 6-6 6"/>', 'chevron-right'),
  lupa: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>', 'search'),
  carta: I('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6 9 6 9-6"/>', 'mail'),
  roda: I('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>', 'settings'),
  ajuda: I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.6 2.6 0 1 1 3.4 2.5c-.7.3-1 .8-1 1.6v.3"/><path d="M12 17.4h.01"/>', 'circle-help'),
  carro: I('<path d="M5 17h14v-5l-2-5H7l-2 5Z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>', 'car'),
  relogio: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'clock'),
  menos: I('<path d="M5 12h14"/>', 'minus'),
  mais: I('<path d="M12 5v14M5 12h14"/>', 'plus'),
  lixo: I('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>', 'trash-2'),
  desfazer: I('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', 'undo-2'),
  visto: I('<path d="M20 6 9 17l-5-5"/>', 'check'),
  sair: I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>', 'log-out'),
  sol: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'sun'),
  lua: I('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>', 'moon'),
  ecra: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', 'monitor'),
  telefone: I('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z"/>', 'phone'),
  aviso: I('<path d="M12 3 2 20h20Z"/><path d="M12 9v5M12 17.5h.01"/>', 'triangle-alert'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 'info'),
  carrinho: I('<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>', 'shopping-cart'),
  teclado: I('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>', 'keyboard'),
};

/* ---------- ir a um sítio do portal (com o que abrir lá dentro) ---------- */
function ir(id: string, chave?: string, valor?: string): void {
  fechar(false);
  if (chave) try { sessionStorage.setItem(chave, valor ?? ''); } catch { /* sem armazenamento: abre só o ecrã */ }
  /* a Minha lista com alterações por guardar pergunta antes de sair (o seu guarda apanha os [data-ir]) */
  const suja = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--lista:not(.portal--estado) .lst[data-sujo="1"]');
  if (suja && id !== 'lista') { const b = document.createElement('button'); b.type = 'button'; b.dataset.ir = id; b.hidden = true; suja.closest('.portal--lista')!.appendChild(b); b.click(); b.remove(); return; }
  mostrar(id);
}
const abrirCatalogo = (o: Record<string, string>) => ir('catalogo', 'goparts:catalogo-abrir', JSON.stringify(o));

/* =========================================================
   A camada: uma de cada vez
   ========================================================= */
type Tipo = 'menu' | 'pesquisa' | 'avisos' | 'carrinho' | 'definicoes' | 'ajuda' | 'conta';
const MODAL: Tipo[] = ['menu', 'pesquisa', 'carrinho'];
let aberta: { tipo: Tipo; el: HTMLElement; de: HTMLElement | null } | null = null;

function fechar(devolver = true): void {
  if (!aberta) return;
  const { el, de, tipo } = aberta;
  aberta = null;
  document.querySelectorAll(`[data-barra="${tipo}"][aria-expanded]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
  document.documentElement.classList.remove('barra-presa');
  const caixa = el.querySelector<HTMLElement>('.bc__caixa');
  const fim = () => el.remove();
  if (quieto() || !caixa) fim();
  else {
    el.classList.add('is-a-sair');
    const sai = tipo === 'menu' ? [{ transform: 'none' }, { transform: 'translateX(-100%)' }] : tipo === 'carrinho' ? [{ transform: 'none' }, { transform: 'translateX(100%)' }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: tipo === 'pesquisa' ? 'scale(.98)' : 'translateY(-4px)' }];
    caixa.animate(sai, { duration: tipo === 'menu' || tipo === 'carrinho' ? 200 : 140, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
    el.querySelector('.bc__veu')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    window.setTimeout(fim, 200);
  }
  if (devolver && de?.isConnected) de.focus({ preventScroll: true });
}
function abrir(tipo: Tipo, de: HTMLElement | null, html: string): HTMLElement | null {
  const ja = aberta?.tipo === tipo;
  fechar(false);
  if (ja) { de?.focus(); return null; }
  const portal = de?.closest<HTMLElement>('.portal') ?? portalVisivel();
  if (!portal) return null;
  const modal = MODAL.includes(tipo);
  portal.insertAdjacentHTML('beforeend', `<div class="bc bc--${tipo}${modal ? ' bc--modal' : ''}" data-camada="${tipo}">${modal ? '<div class="bc__veu" data-fechar></div>' : ''}${html}</div>`);
  const el = portal.lastElementChild as HTMLElement;
  aberta = { tipo, el, de };
  document.querySelectorAll(`[data-barra="${tipo}"][aria-expanded]`).forEach((b) => b.setAttribute('aria-expanded', String(b === de || !de)));
  if (modal) document.documentElement.classList.add('barra-presa');
  else ancorar(el, de);
  return el;
}
/** Os painéis pequenos ficam por baixo do botão que os abriu, sem sair da janela. */
function ancorar(el: HTMLElement, de: HTMLElement | null): void {
  const caixa = el.querySelector<HTMLElement>('.bc__caixa'); if (!caixa || !de) return;
  const r = de.getBoundingClientRect(), w = caixa.offsetWidth, vw = document.documentElement.clientWidth;
  caixa.style.top = `${Math.round(r.bottom + 8)}px`;
  caixa.style.left = `${Math.round(Math.max(8, Math.min(r.right - w, vw - w - 8)))}px`;
  caixa.style.setProperty('--seta', `${Math.round(r.left + r.width / 2 - Math.max(8, Math.min(r.right - w, vw - w - 8)))}px`);
}
const focaveis = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not([disabled]), [tabindex="0"]')).filter((x) => x.offsetParent !== null && !x.closest('[hidden]'));
const focarPrimeiro = (el: HTMLElement, sel?: string) => requestAnimationFrame(() => ((sel && el.querySelector<HTMLElement>(sel)) || focaveis(el)[0])?.focus());

/* =========================================================
   1 · O menu (gaveta das secções)
   ========================================================= */
type Item = { id: string; nome: string; ic: string; ir?: () => void; filhos?: { nome: string; ir: () => void; eAtual?: boolean }[] };
function itensMenu(): Item[] {
  const actual = ecraActual();
  const vistaLista = document.querySelector('.ecra:not([hidden]) .lst')?.getAttribute('data-vista');
  return [
    { id: 'inicio', nome: 'Início', ic: IC.casa, ir: () => ir('inicio') },
    /* (20 out., V5) a pesquisa de peças saiu do Início para o seu ecrã */
    { id: 'pesquisa', nome: 'Pesquisar peças', ic: IC.lupa, ir: () => ir('pesquisa') },
    { id: 'catalogo', nome: 'Catálogo', ic: IC.caixa, filhos: [
      { nome: 'Marcas e modelos', ir: () => ir('catalogo') },
      { nome: 'Pesquisa universal (por grupo)', ir: () => abrirCatalogo({ tipo: 'vista', vista: 'universal' }) }] },
    { id: 'documentos', nome: 'Documentos', ic: IC.pastas, filhos: [
      { nome: 'Pedidos', ir: () => ir('pedidos'), eAtual: actual === 'pedidos' },
      { nome: 'Guias de remessa', ir: () => ir('guias'), eAtual: actual === 'guias' },
      { nome: 'Faturas', ir: () => ir('faturas'), eAtual: actual === 'faturas' },
      { nome: 'Devoluções', ir: () => ir('devolucoes'), eAtual: actual === 'devolucoes' }] },
    { id: 'tecnica', nome: 'Informação técnica', ic: IC.chave, ir: () => ir('tecnica') },
    { id: 'lista', nome: 'Minha lista', ic: IC.estrela, filhos: [
      { nome: 'A lista aberta', ir: () => ir('lista'), eAtual: actual === 'lista' && vistaLista !== 'listas' },
      { nome: 'Minhas listas', ir: () => ir('lista', 'goparts:lista-vista', 'listas'), eAtual: actual === 'lista' && vistaLista === 'listas' }] },
  ];
}
let acoesMenu: (() => void)[] = [];
function abrirMenu(de: HTMLElement | null): void {
  const actual = ecraActual(), itens = itensMenu();
  const eDoc = ['pedidos', 'guias', 'faturas', 'devolucoes'].includes(actual);
  acoesMenu = [];
  const acao = (f: () => void) => { acoesMenu.push(f); return acoesMenu.length - 1; };
  let i = 0;
  const html = `<nav class="bc__caixa bc-menu" role="dialog" aria-modal="true" aria-label="Menu do GoParts">
    <header class="bc-menu__topo"><span class="bc-menu__marca"><span class="romafe">ROMAFE</span><b>GoParts</b></span><button type="button" class="bc__fechar" data-fechar aria-label="Fechar o menu">${IC.x}</button></header>
    <ul class="bc-menu__lista" role="list">${itens.map((it) => {
      const atual = it.id === actual || (it.id === 'documentos' && eDoc);
      if (!it.filhos) return `<li style="--i:${i++}"><button type="button" class="bc-menu__item" data-acao="${acao(it.ir!)}"${atual ? ' aria-current="page"' : ''}>${it.ic}<span>${it.nome}</span></button></li>`;
      return `<li style="--i:${i++}"><button type="button" class="bc-menu__item bc-menu__pai" aria-expanded="${atual}" aria-controls="bc-sub-${it.id}"${atual ? ' data-atual' : ''}>${it.ic}<span>${it.nome}</span>${IC.seta}</button>
        <ul class="bc-menu__sub" id="bc-sub-${it.id}" role="list"${atual ? '' : ' hidden'}>${it.filhos.map((f) => `<li><button type="button" class="bc-menu__item bc-menu__filho" data-acao="${acao(f.ir)}"${f.eAtual || (atual && it.filhos!.length === 2 && it.id === 'catalogo' && f.nome.startsWith('Marcas')) ? ' aria-current="page"' : ''}><span>${f.nome}</span></button></li>`).join('')}</ul></li>`;
    }).join('')}</ul>
    <ul class="bc-menu__lista bc-menu__movel" role="list" aria-label="Ferramentas">
      <li style="--i:${i++}"><button type="button" class="bc-menu__item" data-acao="${acao(() => abrirPesquisa(de))}">${IC.lupa}<span>Pesquisar</span><kbd>Ctrl K</kbd></button></li>
      <li style="--i:${i++}"><button type="button" class="bc-menu__item" data-acao="${acao(() => abrirAvisos(document.querySelector('.ecra:not([hidden]) [data-barra="avisos"]')))}">${IC.carta}<span>Mensagens e avisos</span>${porLer() ? `<span class="bc__conta">${porLer()}</span>` : ''}</button></li>
      <li style="--i:${i++}"><button type="button" class="bc-menu__item" data-acao="${acao(() => abrirDefinicoes(document.querySelector('.ecra:not([hidden]) [data-barra="conta"]')))}">${IC.roda}<span>Definições</span></button></li>
      <li style="--i:${i++}"><button type="button" class="bc-menu__item" data-acao="${acao(() => abrirAjuda(document.querySelector('.ecra:not([hidden]) [data-barra="conta"]')))}">${IC.ajuda}<span>Ajuda</span></button></li>
    </ul>
    <p class="bc-menu__pe">Apoio a clientes · <a href="tel:+351226158300">+351 226 158 300</a></p>
  </nav>`;
  const el = abrir('menu', de, html); if (!el) return;
  focarPrimeiro(el, '[aria-current="page"], .bc-menu__item');
}
function teclasMenu(ev: KeyboardEvent, el: HTMLElement): void {
  const itens = focaveis(el).filter((x) => x.matches('.bc-menu__item'));
  const i = itens.indexOf(document.activeElement as HTMLElement);
  const a = document.activeElement as HTMLElement;
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); itens[(i + (ev.key === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length]?.focus(); }
  else if (ev.key === 'Home') { ev.preventDefault(); itens[0]?.focus(); }
  else if (ev.key === 'End') { ev.preventDefault(); itens[itens.length - 1]?.focus(); }
  else if (ev.key === 'ArrowRight' && a.matches('.bc-menu__pai') && a.getAttribute('aria-expanded') === 'false') { ev.preventDefault(); sub(a, true); }
  else if (ev.key === 'ArrowLeft') { const pai = a.matches('.bc-menu__pai') ? a : a.closest('.bc-menu__sub')?.previousElementSibling as HTMLElement | null; if (pai) { ev.preventDefault(); sub(pai, false); pai.focus(); } }
}
function sub(pai: HTMLElement, abrirSub: boolean): void {
  const s = document.getElementById(pai.getAttribute('aria-controls')!); if (!s) return;
  pai.setAttribute('aria-expanded', String(abrirSub)); s.hidden = !abrirSub;
  if (abrirSub && !quieto()) s.querySelectorAll<HTMLElement>('li').forEach((li, k) => li.animate([{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: k * 25, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' }));
}

/* =========================================================
   2 · A pesquisa global (Ctrl+K)
   ========================================================= */
type Res = { grupo: string; titulo: string; sub: string; ic: string; chaves: string[]; acao: () => void; ref?: string; desc?: string };
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SEP = /[\s\-./_()·,]/;
const compacto = (s: string) => norm(s).split('').filter((c) => !SEP.test(c)).join('');
let INDICE: Res[] | null = null;
function indice(): Res[] {
  if (INDICE) return INDICE;
  const r: Res[] = [];
  REFERENCIAS.forEach((x) => r.push({ grupo: 'Referências', titulo: `${x[1]} ${x[2]}`, sub: `${x[3]} · ${x[0]}`, ic: '', ref: x[2], desc: x[3], chaves: [x[1], x[2], x[3], x[0]], acao: () => abrirCatalogo({ tipo: 'ref', fab: x[1], ref: x[2] }) }));
  GRUPOS.forEach((g) => r.push({ grupo: 'Categorias', titulo: g, sub: `${REFERENCIAS.filter((x) => x[0] === g).length} referências no catálogo`, ic: IC.caixa, chaves: [g], acao: () => abrirCatalogo({ tipo: 'grupo', grupo: g }) }));
  Object.keys(MODELOS).forEach((m) => r.push({ grupo: 'Marcas de veículos', titulo: m, sub: `${MODELOS[m].length} modelos`, ic: IC.carro, chaves: [m], acao: () => abrirCatalogo({ tipo: 'marca', marca: m }) }));
  Object.entries(MODELOS).forEach(([m, ms]) => ms.forEach((x) => r.push({ grupo: 'Modelos', titulo: `${m} ${x[0]}`, sub: `${x[3]} · ${x[1]}–${x[2] || 'hoje'}`, ic: IC.carro, chaves: [m, x[0], x[3]], acao: () => abrirCatalogo({ tipo: 'modelo', marca: m, modelo: x[0] }) })));
  LINHAS.forEach((p) => { const ped = PEDIDOS.find((q) => q.num === p.num); r.push({ grupo: 'Pedidos', titulo: p.num, sub: `${p.data} · ${p.armazem}${p.obs ? ` · ${p.obs}` : ''}`, ic: IC.doc, chaves: ['pedido', p.num, p.data, p.armazem, p.obs, ...(ped?.artigos.map((a) => a[2]) ?? [])], acao: () => ir('pedidos', 'goparts:abrir-pedido', p.num) }); });
  GUIAS.forEach((g) => r.push({ grupo: 'Guias de remessa', titulo: g.num, sub: `${g.data} · ${g.armazem} · pedido ${g.pedido}`, ic: IC.camiao, chaves: ['guia de remessa', g.num, g.data, g.pedido, g.obs, ...g.linhas.map((l) => l[1])], acao: () => ir('guias', 'goparts:abrir-guia', g.num) }));
  FATURAS.forEach((f) => r.push({ grupo: 'Faturas', titulo: f.num, sub: `${f.guia.data} · ${f.num.startsWith('NC') ? 'nota de crédito' : { paga: 'paga', aberto: 'por pagar', vencida: 'vencida', creditada: 'creditada' }[f.pagamento]}`, ic: IC.recibo, chaves: [f.num.startsWith('NC') ? 'nota de crédito' : 'fatura', f.num, f.guia.num, f.guia.pedido, { paga: 'paga', aberto: 'por pagar em aberto', vencida: 'vencida', creditada: 'creditada' }[f.pagamento]], acao: () => ir('faturas', 'goparts:abrir-fatura', f.num) }));
  LISTAS.forEach((l) => r.push({ grupo: 'Listas guardadas', titulo: l.nome, sub: `${l.id} · ${l.pecas.length} peças`, ic: IC.estrela, chaves: ['lista', 'orçamento', l.nome, l.id, ...l.pecas.map((p) => `${p.marca} ${p.ref}`)], acao: () => ir('lista', 'goparts:lista-abrir', l.id) }));
  r.forEach((x) => { x.chaves = x.chaves.filter(Boolean).map(norm); });
  return (INDICE = r);
}
/** Distância de edição (com troca de letras vizinhas): 1 = uma letra a mais, a menos, errada ou trocada.
 *  Aceita-se 1 em palavras de 4 a 6 letras e 2 a partir de 7 («Peugot», «Renalt», «rolamneto»). */
function distancia(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
type Achado = Res & { pontos: number; aproximado: boolean };
const cache = new Map<string, Achado[]>();
function procurar(q: string): Achado[] {
  const chave = norm(q.trim()); if (!chave) return [];
  if (cache.has(chave)) return cache.get(chave)!;
  const tokens = chave.split(/\s+/).filter(Boolean), qc = compacto(q);
  const out: Achado[] = [];
  for (const r of indice()) {
    const tudo = r.chaves.join(' '), comp = r.chaves.map(compacto).join(' ');
    let pontos = 0, aproximado = false;
    if (qc.length >= 3 && compacto(r.titulo).startsWith(qc)) pontos = 100;
    else if (qc.length >= 3 && comp.includes(qc)) pontos = 80;
    else if (tokens.every((t) => tudo.includes(t))) pontos = 60 + (tokens.some((t) => tudo.split(/\s+/).some((w) => w.startsWith(t))) ? 10 : 0);
    else if (tokens.every((t) => tudo.includes(t) || (t.length >= 4 && tudo.split(/\s+/).some((w) => w.length >= 3 && Math.min(distancia(t, w), distancia(t, w.slice(0, t.length))) <= (t.length >= 7 ? 2 : 1))))) { pontos = 30; aproximado = true; }
    if (pontos) out.push({ ...r, pontos, aproximado });
  }
  out.sort((a, b) => b.pontos - a.pontos);
  cache.set(chave, out);
  return out;
}
/** Marca o que coincide (letras seguidas, ignorando acentos, maiúsculas e separadores). */
function marcar(texto: string, q: string): string {
  const qc = compacto(q); if (!qc) return esc(texto);
  const idx: number[] = []; let c = '';
  texto.split('').forEach((ch, i) => { const n = norm(ch); if (n && !SEP.test(ch)) { c += n[0]; idx.push(i); } });
  const marcas: [number, number][] = [];
  const procura = (agulha: string) => { const k = c.indexOf(agulha); if (k >= 0 && agulha) marcas.push([idx[k], idx[k + agulha.length - 1] + 1]); };
  procura(qc);
  if (!marcas.length) norm(q).split(/\s+/).filter((t) => t.length >= 2).forEach((t) => procura(compacto(t)));
  if (!marcas.length) return esc(texto);
  marcas.sort((a, b) => a[0] - b[0]);
  let out = '', p = 0;
  for (const [a, b] of marcas) { if (a < p) continue; out += esc(texto.slice(p, a)) + `<mark>${esc(texto.slice(a, b))}</mark>`; p = b; }
  return out + esc(texto.slice(p));
}
const RECENTES = 'goparts:pesquisas:v1';
const recentes = () => guardado<string[]>(RECENTES, []);
function lembrar(q: string): void { const v = q.trim(); if (!v) return; guardar(RECENTES, [v, ...recentes().filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 5)); }

const SECCOES: Res[] = [
  { grupo: 'Ir para', titulo: 'Catálogo', sub: 'Marcas, modelos e referências', ic: IC.caixa, chaves: [], acao: () => ir('catalogo') },
  { grupo: 'Ir para', titulo: 'Pedidos', sub: 'O histórico e o estado', ic: IC.doc, chaves: [], acao: () => ir('pedidos') },
  { grupo: 'Ir para', titulo: 'Faturas', sub: 'Por pagar, pagas e notas de crédito', ic: IC.recibo, chaves: [], acao: () => ir('faturas') },
  { grupo: 'Ir para', titulo: 'Minhas listas', sub: 'Orçamentos guardados', ic: IC.estrela, chaves: [], acao: () => ir('lista', 'goparts:lista-vista', 'listas') },
];
let resultados: Res[] = [];
let consulta = '';
function abrirPesquisa(de: HTMLElement | null, texto = ''): void {
  const html = `<div class="bc__caixa bc-pal" role="dialog" aria-modal="true" aria-label="Pesquisa global">
    <label class="bc-pal__campo">${IC.lupa}<span class="sr-only">Pesquisar no GoParts</span>
      <input type="text" role="combobox" aria-expanded="true" aria-controls="bc-pal-lista" aria-autocomplete="list" placeholder="Referência, marca, modelo, pedido, fatura, lista…" autocomplete="off" spellcheck="false" value="${esc(texto)}">
      <kbd>Esc</kbd></label>
    <div class="bc-pal__corpo"><span class="bc-pal__ativo" aria-hidden="true"></span><ul class="bc-pal__lista" id="bc-pal-lista" role="listbox" aria-label="Resultados"></ul></div>
    <p class="bc-pal__estado" role="status" aria-live="polite"></p>
    <footer class="bc-pal__pe"><span><kbd>↑</kbd><kbd>↓</kbd> escolher</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span><span class="bc-pal__fonte">Procura nos dados deste portal (exemplo)</span></footer>
  </div>`;
  const el = abrir('pesquisa', de, html); if (!el) return;
  const inp = el.querySelector<HTMLInputElement>('input')!;
  pintarPesquisa(el, texto);
  requestAnimationFrame(() => { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); });
}
function pintarPesquisa(el: HTMLElement, q: string): void {
  consulta = q;
  const ul = el.querySelector<HTMLElement>('.bc-pal__lista')!, estado = el.querySelector<HTMLElement>('.bc-pal__estado')!;
  let html = '', n = 0;
  resultados = [];
  const opcao = (r: Res, extra = '') => { resultados.push(r); const i = n++; return `<li role="option" id="bc-op-${i}" class="bc-res" data-i="${i}" aria-selected="${i === 0}" style="--k:${Math.min(i, 8)}">${r.ref ? azulejoPeca(r.desc || '', 'bc-res__img', r.ref) : `<span class="bc-res__ic">${r.ic}</span>`}<span class="bc-res__t"><b>${marcar(r.titulo, q)}</b><small>${marcar(r.sub, q)}</small></span>${extra}${IC.seta}</li>`; };
  if (!q.trim()) {
    const rec = recentes();
    if (rec.length) html += `<li class="bc-grupo" role="presentation">Pesquisas recentes <button type="button" class="bc-grupo__b" data-limpar-recentes>Limpar</button></li>${rec.map((t) => opcao({ grupo: 'Recentes', titulo: t, sub: 'Pesquisar outra vez', ic: IC.relogio, chaves: [], acao: () => { const inp = el.querySelector<HTMLInputElement>('input')!; inp.value = t; pintarPesquisa(el, t); } })).join('')}`;
    html += `<li class="bc-grupo" role="presentation">Ir para</li>${SECCOES.map((r) => opcao(r)).join('')}`;
    estado.textContent = 'Escreva uma referência (com ou sem espaços), uma marca, um modelo, um n.º de pedido, guia ou fatura.';
  } else {
    const achados = procurar(q), grupos = new Map<string, Achado[]>();
    achados.forEach((a) => { if (!grupos.has(a.grupo)) grupos.set(a.grupo, []); grupos.get(a.grupo)!.push(a); });
    const MAX: Record<string, number> = { 'Referências': 6, 'Modelos': 5 };
    grupos.forEach((lista, g) => { html += `<li class="bc-grupo" role="presentation">${g} <span>${lista.length}</span></li>${lista.slice(0, MAX[g] ?? 4).map((a) => opcao(a, a.aproximado ? '<span class="bc-res__aprox">aproximado</span>' : '')).join('')}`; });
    const aprox = achados.length && achados.every((a) => a.aproximado);
    estado.innerHTML = !achados.length ? '' : aprox ? `Sem resultados exatos para «${esc(q)}» — estes são aproximados.` : `${achados.length} ${achados.length === 1 ? 'resultado' : 'resultados'}`;
    if (!achados.length) html = `<li class="bc-pal__nada" role="presentation"><b>Nada encontrado para «${esc(q)}».</b><span>Confirme a referência ou o número do documento. No Catálogo pode procurar pela marca e modelo do veículo.</span><button type="button" class="bc-pal__ir" data-ir-catalogo>${IC.caixa}Abrir o Catálogo</button></li>`;
  }
  ul.innerHTML = html;
  ativar(el, 0);
}
function ativar(el: HTMLElement, i: number): void {
  const ops = Array.from(el.querySelectorAll<HTMLElement>('.bc-res'));
  const inp = el.querySelector<HTMLInputElement>('input')!, ind = el.querySelector<HTMLElement>('.bc-pal__ativo')!;
  if (!ops.length) { inp.removeAttribute('aria-activedescendant'); ind.style.opacity = '0'; return; }
  const k = (i + ops.length) % ops.length;
  ops.forEach((o, j) => o.setAttribute('aria-selected', String(j === k)));
  inp.setAttribute('aria-activedescendant', ops[k].id);
  ops[k].scrollIntoView({ block: 'nearest' });
  ind.style.opacity = '1'; ind.style.height = `${ops[k].offsetHeight}px`; ind.style.transform = `translateY(${ops[k].offsetTop}px)`;
}
function escolher(el: HTMLElement, i?: number): void {
  const sel = i ?? Number(el.querySelector<HTMLElement>('.bc-res[aria-selected="true"]')?.dataset.i ?? -1);
  const r = resultados[sel]; if (!r) return;
  if (r.grupo !== 'Recentes' && consulta.trim()) lembrar(consulta);
  r.acao();
}
let espera = 0;

/* =========================================================
   3 · Mensagens e avisos
   ========================================================= */
type Aviso = { id: string; fonte: string; titulo: string; texto: string; data: string; ic: string; acao: () => void };
const LIDOS = 'goparts:avisos-lidos:v1';
const dataNum = (d: string) => { const [dd, mm, aa] = d.split('/').map(Number); return aa * 10000 + mm * 100 + dd; };
function avisos(): Aviso[] {
  const a: Aviso[] = [];
  FATURAS.forEach((f) => {
    if (f.pagamento === 'vencida') a.push({ id: `fv-${f.num}`, fonte: 'Faturação', titulo: `Fatura ${f.num} vencida`, texto: `Venceu a ${f.vencimento}. Abra a fatura para ver os valores e o pagamento.`, data: f.vencimento, ic: IC.aviso, acao: () => ir('faturas', 'goparts:abrir-fatura', f.num) });
    if (f.pagamento === 'aberto') a.push({ id: `fa-${f.num}`, fonte: 'Faturação', titulo: `Fatura ${f.num} por pagar`, texto: `Vence a ${f.vencimento}.`, data: f.guia.data, ic: IC.recibo, acao: () => ir('faturas', 'goparts:abrir-fatura', f.num) });
    if (f.pagamento === 'creditada') a.push({ id: `nc-${f.num}`, fonte: 'Faturação', titulo: `Nota de crédito ${f.num}`, texto: f.guia.obs !== '—' ? f.guia.obs : 'Emitida.', data: f.guia.data, ic: IC.voltar, acao: () => ir('faturas', 'goparts:abrir-fatura', f.num) });
  });
  GUIAS.filter((g) => g.tipo === 'fatura').slice(0, 2).forEach((g) => a.push({ id: `gr-${g.num}`, fonte: 'Expedição', titulo: `Guia ${g.num} expedida`, texto: `${g.armazem} · pedido ${g.pedido}${g.obs !== '—' ? ` · ${g.obs}` : ''}`, data: g.data, ic: IC.camiao, acao: () => ir('guias', 'goparts:abrir-guia', g.num) }));
  LINHAS.filter((p) => p.estado === 'sem').forEach((p) => a.push({ id: `ps-${p.num}`, fonte: 'Pedidos', titulo: `Pedido ${p.num} à espera de stock`, texto: p.obs || 'Ainda sem stock para todos os artigos.', data: p.data, ic: IC.doc, acao: () => ir('pedidos', 'goparts:abrir-pedido', p.num) }));
  return a.sort((x, y) => dataNum(y.data) - dataNum(x.data));
}
const lidos = () => new Set(guardado<string[]>(LIDOS, []));
const porLer = () => { const l = lidos(); return avisos().filter((a) => !l.has(a.id)).length; };
function marcarLido(ids: string[]): void { const l = lidos(); ids.forEach((i) => l.add(i)); guardar(LIDOS, [...l]); pintarSelos(); }
let todosAvisos = false;
function abrirAvisos(de: HTMLElement | null): void {
  todosAvisos = false;
  const el = abrir('avisos', de, `<section class="bc__caixa bc-pop bc-avisos" role="dialog" aria-label="Mensagens e avisos"></section>`); if (!el) return;
  pintarAvisos(el);
  ancorar(el, de);
  focarPrimeiro(el, '.bc-aviso__abrir');
}
function pintarAvisos(el: HTMLElement): void {
  const l = lidos(), todos = avisos(), n = todos.filter((a) => !l.has(a.id)).length;
  const mostra = todosAvisos ? todos : todos.slice(0, 4);
  el.querySelector('.bc-avisos')!.innerHTML = `
    <header class="bc-pop__topo"><h2>Mensagens <span class="bc__conta${n ? '' : ' is-zero'}">${n} por ler</span></h2>${n ? '<button type="button" class="bc-ligacao" data-ler-todos>Marcar todas como lidas</button>' : ''}</header>
    <p class="bc-avisos__nota">${IC.info}<span>As mensagens da Romafe ainda não têm serviço ligado. Aqui ficam os avisos dos seus documentos.</span></p>
    <ul class="bc-avisos__lista" role="list">${mostra.map((a) => { const novo = !l.has(a.id); return `<li class="bc-aviso${novo ? ' is-novo' : ''}" data-aviso="${a.id}">
      <button type="button" class="bc-aviso__abrir"><span class="bc-aviso__ic">${a.ic}</span><span class="bc-aviso__t"><small>${a.fonte} · ${a.data}${novo ? ' · <b>por ler</b>' : ''}</small><b>${a.titulo}</b><span>${a.texto}</span></span></button>
      ${novo ? `<button type="button" class="bc-aviso__lida" data-lida="${a.id}" aria-label="Marcar como lida: ${a.titulo}" data-dica="Marcar como lida">${IC.visto}</button>` : ''}</li>`; }).join('') || '<li class="bc-vazio">Sem avisos.</li>'}</ul>
    ${todos.length > 4 ? `<footer class="bc-pop__pe"><button type="button" class="bc-ligacao" data-todos-avisos>${todosAvisos ? 'Ver só os mais recentes' : `Ver todas (${todos.length})`}</button></footer>` : ''}`;
}

/* =========================================================
   4 · O mini-carrinho
   ========================================================= */
let desfazerCarrinho: { linha: carrinho.LinhaCarrinho; indice: number } | null = null;
function abrirCarrinho(de: HTMLElement | null): void {
  const el = abrir('carrinho', de, `<section class="bc__caixa bc-carr" role="dialog" aria-modal="true" aria-labelledby="bc-carr-t"></section>`); if (!el) return;
  desfazerCarrinho = null;
  pintarCarrinho(el);
  focarPrimeiro(el, '.bc-carr__fechar');
}
function pintarCarrinho(el: HTMLElement, foco?: string): void {
  const linhas = carrinho.todas(), c = carrinho.contas();
  el.querySelector('.bc-carr')!.innerHTML = `
    <header class="bc-carr__topo"><h2 id="bc-carr-t">${IC.carrinho}Carrinho <span class="bc__conta">${c.unidades} ${c.unidades === 1 ? 'artigo' : 'artigos'}</span></h2><button type="button" class="bc__fechar bc-carr__fechar" data-fechar aria-label="Fechar o carrinho">${IC.x}</button></header>
    ${desfazerCarrinho ? `<p class="bc-carr__desfazer" role="status">${IC.lixo}<span>Tirou <b>${carrinho.referencia(desfazerCarrinho.linha.ref)?.[1]} ${desfazerCarrinho.linha.ref}</b>.</span><button type="button" class="bc-ligacao" data-desfazer-carrinho>${IC.desfazer}Desfazer</button></p>` : ''}
    ${linhas.length ? `<ul class="bc-carr__linhas" role="list">${linhas.map((l) => {
      const r = carrinho.referencia(l.ref)!, liq = carrinho.liquido(r), disp = r[6] + r[7] === 0 ? 'sem' : r[6] ? 'ok' : 'pouco';
      return `<li class="bc-carr__linha" data-ref="${esc(l.ref)}" data-flip>
        ${azulejoPeca(r[3], 'bc-carr__img', r[2])}
        <div class="bc-carr__id"><small>${r[1]}</small><b>${r[2]}</b><span>${r[3]}</span><span class="bc-carr__disp bc-carr__disp--${disp}"><i aria-hidden="true"></i>${carrinho.disponibilidade(r)}</span></div>
        <div class="bc-carr__qtd" role="group" aria-label="Quantidade de ${r[1]} ${r[2]}">
          <button type="button" data-passo="-1" aria-label="Menos um"${l.qtd <= 1 ? ' disabled' : ''}>${IC.menos}</button>
          <input inputmode="numeric" value="${l.qtd}" aria-label="Quantidade de ${r[1]} ${r[2]}" data-campo="qtd">
          <button type="button" data-passo="1" aria-label="Mais um">${IC.mais}</button>
        </div>
        <div class="bc-carr__preco"><b>${euros(liq * l.qtd)}</b><small>${euros(liq)}/un. · PVP ${euros(r[4])} −${r[5]} %</small></div>
        <button type="button" class="bc-carr__tirar" data-tirar aria-label="Tirar ${r[1]} ${r[2]} do carrinho" data-dica="Tirar">${IC.lixo}</button>
      </li>`; }).join('')}</ul>` : `<div class="bc-vazio bc-carr__vazio">${IC.carrinho}<b>O carrinho está vazio.</b><span>No Catálogo, abra uma referência e carregue em «Pedir».</span><button type="button" class="btn btn--acao" data-ir-catalogo>${IC.caixa}<span class="btn__rotulo">Ir ao Catálogo</span></button></div>`}
    ${linhas.length ? `<footer class="bc-carr__pe">
      <dl><div><dt>Total sem IVA</dt><dd>${euros(c.base)}</dd></div><div><dt>IVA 23 %</dt><dd>${euros(c.iva)}</dd></div><div class="bc-carr__total"><dt>Total com IVA</dt><dd>${euros(c.total)}</dd></div></dl>
      <button type="button" class="btn btn--ghost" data-ir-catalogo>${IC.caixa}<span class="btn__rotulo">Continuar a comprar</span></button>
      <p class="bc-carr__nota">${IC.info}<span>Encomendar ainda não tem ecrã: falta o carrinho completo e o serviço de encomendas do GoParts. Preços líquidos de exemplo.</span></p>
    </footer>` : ''}`;
  if (foco) el.querySelector<HTMLElement>(foco)?.focus();
}
function linhaDe(b: Element) { return b.closest<HTMLElement>('.bc-carr__linha')?.dataset.ref ?? ''; }

/* =========================================================
   5 · Definições · 6 · Ajuda · 7 · Conta
   ========================================================= */
function abrirDefinicoes(de: HTMLElement | null): void {
  const t = temaActual(), op = (v: Tema, nome: string, ic: string) => `<button type="button" role="radio" class="bc-tema__op" data-tema="${v}" aria-checked="${t === v}">${ic}<span>${nome}</span></button>`;
  const el = abrir('definicoes', de, `<section class="bc__caixa bc-pop bc-def" role="dialog" aria-labelledby="bc-def-t">
    <header class="bc-pop__topo"><h2 id="bc-def-t">Definições</h2></header>
    <div class="bc-def__grupo"><h3 id="bc-def-tema">Tema da aplicação</h3><div class="bc-tema" role="radiogroup" aria-labelledby="bc-def-tema">${op('light', 'Claro', IC.sol)}${op('dark', 'Escuro', IC.lua)}${op('auto', 'Sistema', IC.ecra)}</div><p class="bc-def__nota">Fica guardado neste navegador.</p></div>
    <div class="bc-def__grupo"><h3>${IC.teclado}Atalhos</h3><dl class="bc-atalhos"><div><dt><kbd>Ctrl</kbd> <kbd>K</kbd></dt><dd>Pesquisa global</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Fechar o que está aberto</dd></div><div><dt><kbd>Alt</kbd> <kbd>A</kbd></dt><dd>Adicionar peças (Minha lista)</dd></div><div><dt><kbd>Ctrl</kbd> <kbd>S</kbd></dt><dd>Guardar a lista</dd></div></dl></div>
  </section>`);
  if (!el) return; ancorar(el, de); focarPrimeiro(el, '[aria-checked="true"]');
}
type Topico = { id: string; p: string; r: string; ir?: [string, string] };
const TOPICOS: Topico[] = [
  { id: 'pesquisar', p: 'Como pesquisar peças', r: 'Escreva a referência (com ou sem espaços), a marca ou a descrição na pesquisa do topo, ou carregue em Ctrl + K em qualquer ecrã. No Catálogo também pode ir por marca → modelo → veículo.', ir: ['Abrir a pesquisa', 'pesquisa'] },
  { id: 'veiculo', p: 'Como identificar um veículo', r: 'No Catálogo, escreva a matrícula e carregue em «Identificar», ou escolha a marca, o modelo e a motorização. As peças que aparecem a seguir são as desse veículo.', ir: ['Ir ao Catálogo', 'catalogo'] },
  { id: 'stock', p: 'Como consultar o stock', r: 'Abra a referência no Catálogo: o separador «Stock» mostra as unidades no Porto e em Sacavém e o prazo de entrega de cada armazém.', ir: ['Ir ao Catálogo', 'catalogo'] },
  { id: 'encomendar', p: 'Como encomendar', r: 'Na ficha da peça escolha a quantidade e carregue em «Pedir». O carrinho, no topo, mostra o que já pediu e o total com IVA.', ir: ['Abrir o carrinho', 'carrinho'] },
  { id: 'documentos', p: 'Onde estão as guias e as faturas', r: 'Em Documentos: Pedidos, Guias de remessa, Faturas e Devoluções. Cada documento abre num painel com o percurso Pedido → Guia → Fatura.', ir: ['Ir às Faturas', 'faturas'] },
  { id: 'lista', p: 'Como fazer um orçamento', r: 'Na Minha lista junte peças (Alt + A), mão-de-obra e outros custos; o resumo mostra o total sem e com IVA. «Pré-visualizar» mostra o orçamento como sai; «Guardar lista» fica em «Minhas listas».', ir: ['Abrir a Minha lista', 'lista'] },
];
const CONTEXTO: Record<string, string[]> = {
  inicio: ['pesquisar', 'veiculo', 'encomendar'], catalogo: ['pesquisar', 'veiculo', 'stock', 'encomendar'],
  pedidos: ['documentos', 'encomendar'], guias: ['documentos'], faturas: ['documentos'], devolucoes: ['documentos'], lista: ['lista', 'pesquisar'],
};
function abrirAjuda(de: HTMLElement | null): void {
  const actual = ecraActual(), primeiros = CONTEXTO[actual] ?? [];
  const ordem = [...TOPICOS].sort((a, b) => (primeiros.includes(a.id) ? primeiros.indexOf(a.id) : 99) - (primeiros.includes(b.id) ? primeiros.indexOf(b.id) : 99));
  const nomeEcra = { inicio: 'o Início', catalogo: 'o Catálogo', pedidos: 'os Pedidos', guias: 'as Guias', faturas: 'as Faturas', devolucoes: 'as Devoluções', lista: 'a Minha lista', tecnica: 'as Informações técnicas' }[actual];
  const el = abrir('ajuda', de, `<section class="bc__caixa bc-pop bc-ajuda" role="dialog" aria-labelledby="bc-aj-t">
    <header class="bc-pop__topo"><h2 id="bc-aj-t">Ajuda</h2>${nomeEcra ? `<small>Primeiro, o que serve para ${nomeEcra}</small>` : ''}</header>
    <ul class="bc-ajuda__lista" role="list">${ordem.map((t, i) => `<li${primeiros.includes(t.id) ? ' class="is-daqui"' : ''}><button type="button" class="bc-ajuda__p" aria-expanded="false" aria-controls="bc-aj-${i}">${t.p}${IC.seta}</button><div class="bc-ajuda__r" id="bc-aj-${i}" hidden><p>${t.r}</p>${t.ir ? `<button type="button" class="bc-ligacao" data-ajuda-ir="${t.ir[1]}">${t.ir[0]}</button>` : ''}</div></li>`).join('')}</ul>
    <footer class="bc-pop__pe bc-ajuda__apoio">${IC.telefone}<span>Apoio a clientes</span><a href="tel:+351226158300">+351 226 158 300</a></footer>
  </section>`);
  if (!el) return; ancorar(el, de); focarPrimeiro(el, '.bc-ajuda__p');
}
function abrirConta(de: HTMLElement | null): void {
  const el = abrir('conta', de, `<section class="bc__caixa bc-pop bc-conta" aria-label="Conta">
    <header class="bc-conta__quem"><span class="conta__inicial" aria-hidden="true">FF</span><span><b>Fernando F. França</b><small>Cliente GoParts · Porto</small></span></header>
    <div class="bc-conta__grupo"><h3 id="bc-conta-contas">Conta de cliente</h3>
      <ul role="list" aria-labelledby="bc-conta-contas"><li class="bc-conta__atual">${IC.visto}<span><b>Porto</b><small>A conta em uso · a única associada a este utilizador</small></span></li></ul></div>
    <div class="bc-conta__menu" role="menu" aria-label="Ações da conta">
      <button type="button" role="menuitem" data-conta="definicoes">${IC.roda}<span>Definições e tema</span></button>
      <button type="button" role="menuitem" data-conta="listas">${IC.estrela}<span>Minhas listas</span></button>
      <button type="button" role="menuitem" data-conta="ajuda">${IC.ajuda}<span>Ajuda e apoio</span></button>
      <span role="separator"></span>
      <button type="button" role="menuitem" class="bc-conta__sair" data-conta="sair">${IC.sair}<span>Terminar sessão</span></button>
    </div>
  </section>`);
  if (!el) return; ancorar(el, de); focarPrimeiro(el, '[role="menuitem"]');
}
function terminarSessao(): void {
  /* o que é da conta sai deste navegador: carrinho, avisos lidos, pesquisas, documentos abertos */
  carrinho.esquecer();
  try { [LIDOS, RECENTES].forEach((k) => localStorage.removeItem(k)); Object.keys(sessionStorage).filter((k) => k.startsWith('goparts:')).forEach((k) => sessionStorage.removeItem(k)); } catch { /* nada */ }
  cache.clear();
  fechar(false);
  mostrar('entrada');
}

/* =========================================================
   Os números do topo: o carrinho e as mensagens
   ========================================================= */
function pintarSelos(saltar = false): void {
  const u = carrinho.unidades(), n = porLer();
  document.querySelectorAll<HTMLElement>('[data-barra="carrinho"], .portal__icone[aria-label^="Carrinho"]').forEach((b) => {
    b.setAttribute('aria-label', `Carrinho, ${u} ${u === 1 ? 'artigo' : 'artigos'}`);
    const s = b.querySelector<HTMLElement>('.portal__selo'); if (!s) return;
    const antes = s.textContent;
    s.textContent = String(u); s.hidden = u === 0;
    if (saltar && antes !== String(u) && !quieto() && b.offsetParent) s.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
  });
  document.querySelectorAll<HTMLElement>('[data-barra="avisos"], .portal__icone[aria-label^="Mensagens"]').forEach((b) => {
    b.setAttribute('aria-label', n ? `Mensagens, ${n} por ler` : 'Mensagens');
    const p = b.querySelector<HTMLElement>('.portal__ponto'); if (p) p.hidden = !n;
  });
}
let avisoTimer = 0;
function avisoGlobal(texto: string, erro = false): void {
  const portal = portalVisivel(); if (!portal) return;
  portal.querySelector('.bc-aviso-global')?.remove();
  portal.insertAdjacentHTML('beforeend', `<p class="bc-aviso-global${erro ? ' is-erro' : ''}" role="${erro ? 'alert' : 'status'}">${erro ? IC.aviso : IC.visto}<span>${esc(texto)}</span></p>`);
  window.clearTimeout(avisoTimer);
  avisoTimer = window.setTimeout(() => portal.querySelector('.bc-aviso-global')?.remove(), 4000);
}

/* =========================================================
   Ligar
   ========================================================= */
export { abrirPesquisa };
const QUAL: Record<string, (de: HTMLElement) => void> = {
  menu: abrirMenu, pesquisa: (de) => abrirPesquisa(de), avisos: abrirAvisos, carrinho: abrirCarrinho, definicoes: abrirDefinicoes, ajuda: abrirAjuda, conta: abrirConta,
};
/** Os topos mais antigos (sem data-barra) também respondem, pelo nome do botão. */
function qualBotao(t: Element): [string, HTMLElement] | null {
  const b = t.closest<HTMLElement>('.portal__topo [data-barra], .linha [data-barra]');
  if (b) return [b.dataset.barra!, b];
  const v = t.closest<HTMLElement>('.portal__menu, .procura, .portal__icone, .conta');
  if (!v || !v.closest('.portal__topo, .linha, .lado, .lado5, header')) return null;
  if (v.matches('.portal__menu')) return ['menu', v];
  if (v.matches('.procura')) return ['pesquisa', v];
  if (v.matches('.conta')) return ['conta', v];
  const n = v.getAttribute('aria-label') || '';
  return n.startsWith('Mensagens') ? ['avisos', v] : n.startsWith('Carrinho') ? ['carrinho', v] : n === 'Definições' ? ['definicoes', v] : n === 'Ajuda' ? ['ajuda', v] : null;
}

export function iniciar(): void {
  carrinho.ouvir((m) => {
    pintarSelos(m.tipo === 'mudou');
    if (m.tipo === 'falhou') avisoGlobal(m.texto || 'O carrinho não mudou.', true);
    if (aberta?.tipo === 'carrinho') { const f = document.activeElement?.closest('.bc-carr__linha') ? `[data-ref="${CSS.escape(linhaDe(document.activeElement!))}"] [data-campo="qtd"]` : undefined; pintarCarrinho(aberta.el, f); }
  });
  const armar = () => requestAnimationFrame(() => pintarSelos());
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => { if (aberta && !aberta.el.isConnected) aberta = null; armar(); }));
  window.addEventListener('hashchange', armar);
  armar();

  /* abrir: na captura, antes de outros comportamentos (o Início tinha o seu Ctrl+K) */
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const qual = qualBotao(t);
    if (qual && !t.closest('.bc')) {
      const abre = QUAL[qual[0]]; if (!abre) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      abre(qual[1]); return;
    }
    /* clicar fora de um painel fecha-o */
    if (aberta && !t.closest('.bc__caixa') && !t.closest('.bc-aviso-global')) { fechar(!t.closest('button, a, input')); if (!t.closest('.bc')) return; }
    const camada = t.closest<HTMLElement>('.bc'); if (!camada || !aberta) return;
    const el = aberta.el;
    if (t.closest('[data-fechar]')) { fechar(); return; }
    if (t.closest('[data-ir-catalogo]')) { ir('catalogo'); return; }
    /* o menu */
    const ac = t.closest<HTMLElement>('[data-acao]'); if (ac && aberta.tipo === 'menu') { const f = acoesMenu[Number(ac.dataset.acao)]; f?.(); return; }
    const pai = t.closest<HTMLElement>('.bc-menu__pai'); if (pai) { sub(pai, pai.getAttribute('aria-expanded') !== 'true'); return; }
    /* a pesquisa */
    if (t.closest('[data-limpar-recentes]')) { guardar(RECENTES, []); pintarPesquisa(el, ''); el.querySelector<HTMLInputElement>('input')?.focus(); return; }
    const op = t.closest<HTMLElement>('.bc-res'); if (op) { escolher(el, Number(op.dataset.i)); return; }
    /* os avisos */
    const lida = t.closest<HTMLElement>('[data-lida]'); if (lida) { marcarLido([lida.dataset.lida!]); pintarAvisos(el); el.querySelector<HTMLElement>('.bc-aviso__abrir')?.focus(); return; }
    if (t.closest('[data-ler-todos]')) { marcarLido(avisos().map((a) => a.id)); pintarAvisos(el); focarPrimeiro(el, '.bc-aviso__abrir'); return; }
    if (t.closest('[data-todos-avisos]')) { todosAvisos = !todosAvisos; pintarAvisos(el); el.querySelector<HTMLElement>('[data-todos-avisos]')?.focus(); return; }
    const av = t.closest<HTMLElement>('.bc-aviso__abrir'); if (av) { const id = av.closest<HTMLElement>('[data-aviso]')!.dataset.aviso!; marcarLido([id]); avisos().find((a) => a.id === id)?.acao(); return; }
    /* o carrinho */
    const passo = t.closest<HTMLElement>('.bc-carr__qtd [data-passo]');
    if (passo) { const ref = linhaDe(passo), l = carrinho.todas().find((x) => x.ref === ref); if (l) void carrinho.quantidade(ref, Math.max(1, l.qtd + Number(passo.dataset.passo))); return; }
    const tirar = t.closest<HTMLElement>('[data-tirar]');
    if (tirar) {
      const ref = linhaDe(tirar), indice = carrinho.todas().findIndex((x) => x.ref === ref), linha = carrinho.todas()[indice], li = tirar.closest<HTMLElement>('.bc-carr__linha')!;
      const feito = () => { desfazerCarrinho = { linha, indice }; void carrinho.tirar(ref); requestAnimationFrame(() => el.querySelector<HTMLElement>('[data-desfazer-carrinho]')?.focus()); };
      if (quieto()) feito(); else li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(16px)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).onfinish = feito;
      return;
    }
    if (t.closest('[data-desfazer-carrinho]') && desfazerCarrinho) { const d = desfazerCarrinho; desfazerCarrinho = null; void carrinho.repor(d.linha, d.indice); return; }
    /* definições */
    const tema = t.closest<HTMLElement>('[data-tema]');
    if (tema) { aplicarTema(tema.dataset.tema as Tema); el.querySelectorAll('[data-tema]').forEach((b) => b.setAttribute('aria-checked', String(b === tema))); return; }
    /* ajuda */
    const pr = t.closest<HTMLElement>('.bc-ajuda__p');
    if (pr) { const r = document.getElementById(pr.getAttribute('aria-controls')!)!; const sim = pr.getAttribute('aria-expanded') !== 'true'; pr.setAttribute('aria-expanded', String(sim)); r.hidden = !sim; if (sim && !quieto()) r.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' }); return; }
    const aj = t.closest<HTMLElement>('[data-ajuda-ir]');
    if (aj) { const d = aj.dataset.ajudaIr!; const de = aberta.de; if (d === 'pesquisa') abrirPesquisa(de); else if (d === 'carrinho') abrirCarrinho(document.querySelector('.ecra:not([hidden]) [data-barra="carrinho"]')); else ir(d); return; }
    /* conta */
    const ct = t.closest<HTMLElement>('[data-conta]');
    if (ct) { const de = aberta.de; const k = ct.dataset.conta; if (k === 'definicoes') abrirDefinicoes(de); else if (k === 'ajuda') abrirAjuda(de); else if (k === 'listas') ir('lista', 'goparts:lista-vista', 'listas'); else if (k === 'sair') terminarSessao(); return; }
  }, true);

  document.addEventListener('input', (ev) => {
    const i = ev.target as HTMLInputElement;
    if (aberta?.tipo === 'pesquisa' && i.closest('.bc-pal')) { const el = aberta.el; window.clearTimeout(espera); espera = window.setTimeout(() => pintarPesquisa(el, i.value), 90); return; }
    if (i.matches?.('.bc-carr__qtd input')) { i.removeAttribute('aria-invalid'); }
  });
  document.addEventListener('change', (ev) => {
    const i = ev.target as HTMLInputElement;
    if (!i.matches?.('.bc-carr__qtd input')) return;
    const v = Number(i.value.trim());
    if (!Number.isInteger(v) || v < 1) { i.setAttribute('aria-invalid', 'true'); i.title = 'Quantidade inteira, de 1 para cima'; avisoGlobal('Quantidade inteira, de 1 para cima: o carrinho ficou como estava.', true); return; }
    void carrinho.quantidade(linhaDe(i), v);
  });

  document.addEventListener('keydown', (ev) => {
    if (editando()) return;
    /* Ctrl+K / ⌘K: a pesquisa, de qualquer ecrã do portal (e fecha-a se já está aberta) */
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k' && portalVisivel()) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      if (aberta?.tipo === 'pesquisa') fechar(); else abrirPesquisa(document.querySelector<HTMLElement>('.ecra:not([hidden]) [data-barra="pesquisa"].procura') ?? null);
      return;
    }
    if (!aberta) return;
    const el = aberta.el;
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); fechar(); return; }
    if (aberta.tipo === 'pesquisa' && (ev.target as Element).closest?.('.bc-pal')) {
      const sel = Number(el.querySelector<HTMLElement>('.bc-res[aria-selected="true"]')?.dataset.i ?? 0);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); ativar(el, sel + (ev.key === 'ArrowDown' ? 1 : -1)); return; }
      if (ev.key === 'Enter') { ev.preventDefault(); window.clearTimeout(espera); const i = el.querySelector<HTMLInputElement>('input')!; if (i.value !== consulta) pintarPesquisa(el, i.value); escolher(el); return; }
    }
    if (aberta.tipo === 'menu') teclasMenu(ev, el);
    if (aberta.tipo === 'conta' && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      const it = Array.from(el.querySelectorAll<HTMLElement>('[role="menuitem"]')), i = it.indexOf(document.activeElement as HTMLElement);
      ev.preventDefault(); it[(i + (ev.key === 'ArrowDown' ? 1 : -1) + it.length) % it.length]?.focus();
    }
    if (aberta.tipo === 'definicoes' && (ev.target as Element).matches?.('[data-tema]') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
      const it = Array.from(el.querySelectorAll<HTMLElement>('[data-tema]')), i = it.indexOf(document.activeElement as HTMLElement);
      ev.preventDefault(); const b = it[(i + (ev.key === 'ArrowRight' ? 1 : -1) + it.length) % it.length]; b.focus(); b.click();
    }
    /* Tab: nas camadas modais fica dentro; nos painéis, sair deles fecha-os */
    if (ev.key === 'Tab') {
      const f = focaveis(el); if (!f.length) return;
      const primeiro = f[0], ultimo = f[f.length - 1];
      if (MODAL.includes(aberta.tipo)) {
        if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
        else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
      } else if ((!ev.shiftKey && document.activeElement === ultimo) || (ev.shiftKey && document.activeElement === primeiro)) { ev.preventDefault(); fechar(); }
    }
  }, true);
  window.addEventListener('resize', () => { if (aberta && !MODAL.includes(aberta.tipo)) ancorar(aberta.el, aberta.de); });
  window.addEventListener('scroll', () => { if (aberta && !MODAL.includes(aberta.tipo)) fechar(false); }, { passive: true });
  window.addEventListener('online', () => avisoGlobal('A ligação voltou.'));
  window.addEventListener('offline', () => avisoGlobal('Sem ligação à Internet: o carrinho e a pesquisa nos documentos esperam pela ligação.', true));
}
