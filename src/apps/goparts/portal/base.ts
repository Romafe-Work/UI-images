/* =========================================================
   GOPARTS — a base do portal: o topo, as abas e o rodapé
   Os ecrãs vieram do Figma-WebShop-GoParts (8 out. 2026) e cada um traz só
   o corpo; o que se repete está aqui uma vez. Melhorado com o que ela foi
   pedindo nos logins: o ROMAFE na letra Motor e no azul RGB(0, 99, 170),
   botões com ícone e texto.
   ========================================================= */
import type { IdGoParts } from '../ids';

export type IdPortal = Extract<IdGoParts, 'inicio' | 'pesquisa' | 'catalogo' | 'pedidos' | 'guias' | 'faturas' | 'lista' | 'devolucoes' | 'tecnica'>;

/** De que produto é o portal: o Peça A Peça, ou o GoShop, que usa a mesma moldura
    (8 out. 2026, para os ecrãs de carregamento das duas apps). `ligar` diz se
    as abas levam a ecrãs que existem nesta app. */
export interface Produto { nome: string; sub: string; ligar: boolean }
export const GOPARTS: Produto = { nome: 'Peça A Peça', sub: 'O marketplace de peças auto', ligar: true };
export const GOSHOP: Produto = { nome: 'GoShop', sub: 'A loja online de peças', ligar: false };

const I = (d: string, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;

/* as oito abas do portal atual; as que ainda não têm ecrã ficam sem destino */
/* (14 out.) o 4.º elemento é o nome do ícone, para a sua animação (css/icones.css) */
const ABAS: [IdPortal | null, string, string, string?][] = [
  ['inicio', 'Início', '<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/>', 'house'],
  ['catalogo', 'Catálogo', '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m12 12 8-4.5M12 12v9M12 12 4 7.5"/>', 'package'],
  ['pedidos', 'Pedidos', '<path d="M6 3h9l4 4v14H6Z"/><path d="M9 12h7M9 16h7"/>', 'file-text'],
  ['guias', 'Guias de remessa', '<path d="M1.5 6.5h13v9h-13Z"/><path d="M14.5 9.5h4l3.5 3.5v2.5h-7.5Z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>', 'truck'],
  ['faturas', 'Faturas', '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>', 'receipt'],
  ['devolucoes', 'Devoluções', '<path d="M3 7v5h5"/><path d="M3.5 12a8.5 8.5 0 1 0 2.2-5.7L3 9"/>', 'undo-2'],
  ['tecnica', 'Inf. técnica', '<path d="m14 4 6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2Z"/><path d="m12 6 6 6"/>', 'wrench'],
  ['lista', 'Minha lista', '<path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8Z"/>', 'star'],
];

/* (16 out. 2026, o briefing da navbar) cada controlo tem o seu papel em comportamento/barra.ts, que abre a camada
   por cima (menu, pesquisa, avisos, carrinho, definições, ajuda, conta). O número do carrinho e o ponto dos avisos
   vêm do estado (carrinho.ts e os avisos da conta); aqui fica o valor da primeira pintura. */
/* (21 out., briefing do cabeçalho) as Definições saíram do topo: estão no menu da conta («Definições e tema») */
function topo(p: Produto, menu = false, definicoes = false): string {
  return `<header class="portal__topo">
    <div class="portal__marca">${menu ? `
      <button type="button" class="portal__icone portal__menu" data-barra="menu" aria-label="Menu" aria-haspopup="dialog" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path class="portal__menu-l1" d="M4 6h16"/><path class="portal__menu-l2" d="M4 12h16"/><path class="portal__menu-l3" d="M4 18h16"/></svg></button>` : ''}
      <a class="romafe portal__romafe" href="https://www.romafe.com/" target="_blank" rel="noopener" aria-label="ROMAFE — romafe.com (abre noutra janela)">ROMAFE</a>
      <span class="portal__risco" aria-hidden="true"></span>
      ${/* (21 out.) sem o slogan pequeno: a marca da empresa e o nome da aplicação, e mais nada */ ''}${p.ligar ? `<button type="button" class="portal__produto" data-ir="inicio" aria-label="${p.nome} — Início">${p.nome}</button>` : `<span class="portal__produto">${p.nome}</span>`}
    </div>
    <div class="procura" data-barra="pesquisa">
      ${I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>', ' class="procura__lupa" data-i="search"')}
      <input class="procura__campo" type="search" placeholder="Pesquisar referência, marca ou peça…" aria-label="Pesquisar (Ctrl+K)" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" readonly>
      <kbd class="procura__atalho">Ctrl K</kbd>
    </div>
    <div class="portal__accoes">
      <button type="button" class="portal__icone portal__lupa-movel" data-barra="pesquisa" aria-label="Pesquisar" aria-haspopup="dialog">${I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>', ' data-i="search"')}</button>
      <button type="button" class="portal__icone" data-barra="avisos" aria-label="Mensagens" aria-haspopup="dialog" aria-expanded="false" data-dica="Mensagens e avisos">${I('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6 9 6 9-6"/>', ' data-i="mail"')}<span class="portal__ponto" aria-hidden="true"></span></button>
      <button type="button" class="portal__icone" data-barra="ajuda" aria-label="Ajuda" aria-haspopup="dialog" aria-expanded="false" data-dica="Ajuda">${I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.6 2.6 0 1 1 3.4 2.5c-.7.3-1 .8-1 1.6v.3"/><path d="M12 17.4h.01"/>', ' data-i="circle-help"')}</button>
      <button type="button" class="portal__icone" data-barra="carrinho" aria-label="Carrinho, 3 artigos" aria-haspopup="dialog" aria-expanded="false" data-dica="Carrinho">${I('<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>', ' data-i="shopping-cart"')}<span class="portal__selo" aria-hidden="true">3</span></button>
      ${definicoes ? `<button type="button" class="portal__icone" data-barra="definicoes" aria-label="Definições" aria-haspopup="dialog" aria-expanded="false" data-dica="Definições">${I('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>', ' data-i="settings"')}</button>` : ''}
      <button type="button" class="conta" data-barra="conta" aria-haspopup="menu" aria-expanded="false" aria-label="Conta de Fernando F. França, Porto">
        <span class="conta__inicial" aria-hidden="true">FF</span>
        <span class="conta__texto" aria-hidden="true"><span class="conta__nome">Fernando F. França</span></span>
        ${I('<path d="m6 9 6 6 6-6"/>', ' class="conta__seta"')}
      </button>
    </div>
  </header>`;
}

function abas(ativa: IdPortal | null, p: Produto): string {
  return `<nav class="portal__abas" aria-label="Secções">${ABAS.map(([id, nome, d, ic]) => `
    <button type="button" class="aba"${id && p.ligar ? ` data-ir="${id}"` : id ? '' : ' disabled title="Ainda sem ecrã"'}${id && id === ativa ? ' aria-current="true"' : ''}>${I(d, ic ? ` data-i="${ic}"` : '')}${nome}</button>`).join('')}
  </nav>`;
}

function rodape(): string {
  return `<footer class="portal__rodape">
    <ul class="portal__ligacoes">
      <li>2026 © Romafe SA</li>
      <li><a href="#">Aviso legal e política de cookies</a></li>
      <li><a href="#">Condições de venda</a></li>
      <li>+351 226 158 300</li>
    </ul>
  </footer>`;
}

/* ---------- V4 (20 out. 2026, briefing «Collapsible Sidebar & Intelligent Home Dashboard») ----------
   As oito abas passam a uma barra lateral à esquerda, por baixo do topo (a marca fica no topo, uma vez só).
   Aberta ~248 px com ícone e nome; recolhida 68 px só com ícones, a dica com o nome e o indicador do ativo.
   Os documentos (Pedidos, Guias, Faturas, Devoluções) juntos, com o título por cima. Abaixo de 1200 px não
   há barra: o ☰ do topo abre a gaveta das secções (comportamento/barra.ts), que já existia.
   O comportamento (recolher, guardar a escolha, o indicador que vem do ecrã anterior) está em
   comportamento/lado.ts; o desenho em css/lado.css. No lugar das abas fica um marcador vazio, para as
   linhas da grelha de cada ecrã continuarem as mesmas. */
/* (20 out., V5 — briefing «New Command Dashboard & Separate Parts Search Workspace») três grupos com título:
   Principal (Início, Pesquisar peças, Catálogo), Documentos e Ferramentas. O Início e a Pesquisa levam por baixo
   do nome o que têm (só com a barra aberta). A Pesquisar peças é um ecrã à parte do Catálogo (a pesquisa saiu do
   Início); o Catálogo continua com as marcas, os modelos e a pesquisa universal. */
const PESQUISA: typeof ABAS[number] = ['pesquisa', 'Pesquisar peças', '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>', 'search'];
/* (21 out.) ela: «só título mesmo» — saíram os subtítulos do Início e da Pesquisa */
const SUB: Partial<Record<IdPortal, string>> = {};
const GRUPOS: [string, IdPortal[]][] = [['Principal', ['inicio', 'pesquisa', 'catalogo']], ['Documentos', ['pedidos', 'guias', 'faturas', 'devolucoes']], ['Ferramentas', ['tecnica', 'lista']]];
const NOME_LADO: Partial<Record<IdPortal, string>> = { tecnica: 'Informação técnica' };
function lado(ativa: IdPortal | null, p: Produto): string {
  const todas = [...ABAS, PESQUISA];
  const item = ([id, nome0, d, ic]: typeof ABAS[number]) => { const nome = (id && NOME_LADO[id]) || nome0, sub = id ? SUB[id] : undefined;
    return `<li><button type="button" class="lado__item${sub ? ' lado__item--sub' : ''}"${id && p.ligar ? ` data-ir="${id}"` : ' disabled'} data-lado-item="${id}" data-dica="${nome}"${id && id === ativa ? ' aria-current="page"' : ''}>${I(d, ic ? ` data-i="${ic}"` : '')}<span class="lado__rotulo">${nome}${sub ? `<small class="lado__sub">${sub}</small>` : ''}</span></button></li>`; };
  return `<nav class="portal__lado" aria-label="Secções" data-lado>
    <div class="lado__rolo">
      ${GRUPOS.map(([g, ids], i) => `<p class="lado__grupo${i === 0 ? ' lado__grupo--primeiro' : ''}" id="lado-g${i}"><span class="lado__rotulo">${g}</span></p>
      <ul class="lado__lista" role="list" aria-labelledby="lado-g${i}">${ids.map((id) => item(todas.find((a) => a[0] === id)!)).join('')}</ul>`).join('')}
      <span class="lado__ativo" aria-hidden="true"></span>
    </div>
    <div class="lado__pe">
      <button type="button" class="lado__item lado__recolher" data-lado-recolher aria-expanded="true" aria-label="Recolher o menu" data-dica="Abrir o menu">${I('<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>', ' class="lado__seta"')}<span class="lado__rotulo">Recolher o menu</span></button>
    </div>
  </nav><span class="portal__lugar-abas" aria-hidden="true"></span>`;
}

/** O que muda na moldura de uma versão: o botão do menu à esquerda da marca, e sem rodapé (Início v3). */
export interface Moldura { menu?: boolean; rodape?: boolean }

/** O ecrã inteiro: o corpo vindo do ficheiro .html, com o topo, as abas e o rodapé à volta. */
export function portal(ativa: IdPortal | null, corpo: string, p: Produto = GOPARTS, m: Moldura = {}): string {
  const abre = corpo.indexOf('>') + 1;
  const fecha = corpo.lastIndexOf('</div>');
  /* (20 out.) com o ☰ (todos os ecrãs do portal), as abas são a barra lateral */
  const inicio = m.menu ? corpo.slice(0, abre).replace('class="portal', 'class="portal portal--lateral') : corpo.slice(0, abre);
  return inicio + topo(p, m.menu) + (m.menu ? lado(ativa, p) : abas(ativa, p)) + corpo.slice(abre, fecha) + (m.rodape === false ? '' : rodape()) + corpo.slice(fecha);
}

/* ---------- v2 (12 out. 2026): uma barra só ----------
   A partir da imagem dela: as abas sobem para a barra do topo, ao lado da
   marca, e a procura sai da barra para o herói do Início. Sem rodapé. */
function topoLinha(ativa: IdPortal | null, p: Produto): string {
  return `<header class="linha">
    <div class="portal__marca">
      <span class="romafe portal__romafe">ROMAFE</span>
      <span class="portal__risco" aria-hidden="true"></span>
      <span class="portal__produto">${p.nome}<span class="portal__produto-sub">${p.sub}</span></span>
    </div>
    <nav class="linha__abas" aria-label="Secções">${ABAS.map(([id, nome, d]) => `
      <button type="button" class="linha__aba"${id && p.ligar ? ` data-ir="${id}"` : id ? '' : ' disabled title="Ainda sem ecrã"'}${id && id === ativa ? ' aria-current="true"' : ''}>${I(d)}${nome}</button>`).join('')}
    </nav>
    <div class="portal__accoes">
      <button type="button" class="portal__icone" aria-label="Mensagens">${I('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6 9 6 9-6"/>')}</button>
      <button type="button" class="portal__icone" aria-label="Carrinho, 3 artigos">${I('<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>')}<span class="portal__selo">3</span></button>
      <button type="button" class="portal__icone" aria-label="Ajuda">${I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.6 2.6 0 1 1 3.4 2.5c-.7.3-1 .8-1 1.6v.3"/><path d="M12 17.4h.01"/>')}</button>
      <button type="button" class="conta">
        <span class="conta__inicial" aria-hidden="true">FF</span>
        <span class="conta__texto"><span class="conta__nome">Fernando F. França</span><span class="conta__local">Porto · 1 conta</span></span>
        ${I('<path d="m6 9 6 6 6-6"/>')}
      </button>
    </div>
  </header>`;
}

/** O ecrã da v2: a barra única em cima e o corpo por baixo. */
export function portalLinha(ativa: IdPortal | null, corpo: string, p: Produto = GOPARTS): string {
  const abre = corpo.indexOf('>') + 1;
  return corpo.slice(0, abre) + topoLinha(ativa, p) + corpo.slice(abre);
}

/* ---------- v4 (12 out. 2026): o menu à esquerda ----------
   A partir de uma imagem de referência: a marca e as secções numa coluna à
   esquerda, com a caixa de ajuda em baixo; em cima só os ícones e a conta. */
export function portalLateral(ativa: IdPortal | null, corpo: string, p: Produto = GOPARTS): string {
  const lado = `<aside class="lado">
    <div class="lado__marca">
      <span class="romafe lado__romafe">ROMAFE</span>
      <span class="lado__produto">${p.nome}</span>
      <span class="lado__sub">${p.sub}</span>
    </div>
    <nav class="lado__nav" aria-label="Secções">${ABAS.map(([id, nome, d]) => `
      <button type="button" class="lado__item"${id && p.ligar ? ` data-ir="${id}"` : id ? '' : ' disabled title="Ainda sem ecrã"'}${id && id === ativa ? ' aria-current="true"' : ''}>${I(d)}${nome}</button>`).join('')}
    </nav>
    <div class="lado__ajuda">
      ${I('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20a3 3 0 0 1-3 2h-2"/>', ' class="lado__ajuda-icone"')}
      <p class="lado__ajuda-titulo">Precisa de ajuda?</p>
      <p class="lado__ajuda-texto">A nossa equipa está disponível para o ajudar: +351 226 158 300.</p>
      <button type="button" class="btn btn--ghost btn--sm lado__ajuda-botao">${I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>', ' class="btn__icone"')}Contactar suporte</button>
    </div>
  </aside>`;
  const cima = `<header class="cima">
    <div class="portal__accoes">
      <button type="button" class="portal__icone" aria-label="Mensagens">${I('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6 9 6 9-6"/>')}<span class="portal__ponto" aria-label="Novas mensagens"></span></button>
      <button type="button" class="portal__icone" aria-label="Carrinho, 3 artigos">${I('<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>')}<span class="portal__selo">3</span></button>
      <button type="button" class="portal__icone" aria-label="Ajuda">${I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.6 2.6 0 1 1 3.4 2.5c-.7.3-1 .8-1 1.6v.3"/><path d="M12 17.4h.01"/>')}</button>
      <button type="button" class="conta">
        <span class="conta__inicial" aria-hidden="true">FF</span>
        <span class="conta__texto"><span class="conta__nome">Fernando F. França</span><span class="conta__local">Porto · 1 conta</span></span>
        ${I('<path d="m6 9 6 6 6-6"/>')}
      </button>
    </div>
  </header>`;
  const abre = corpo.indexOf('>') + 1;
  const fecha = corpo.lastIndexOf('</div>');
  return corpo.slice(0, abre) + lado + `<div class="lado__resto">` + cima + corpo.slice(abre, fecha) + `</div>` + corpo.slice(fecha);
}

/* ---------- v5 (12 out. 2026): a barra em cima e as secções à esquerda ----------
   A partir de uma imagem de referência: o topo da v1 (marca, procura, ícones,
   conta; sem as definições) por cima de tudo, e as secções numa coluna à
   esquerda, no lugar das abas. */
export function portalTopoLado(ativa: IdPortal | null, corpo: string, p: Produto = GOPARTS): string {
  const lado = `<nav class="lado5" aria-label="Secções">${ABAS.map(([id, nome, d]) => `
    <button type="button" class="lado5__item"${id && p.ligar ? ` data-ir="${id}"` : id ? '' : ' disabled title="Ainda sem ecrã"'}${id && id === ativa ? ' aria-current="true"' : ''}>${I(d)}${nome}</button>`).join('')}
  </nav>`;
  const abre = corpo.indexOf('>') + 1;
  return corpo.slice(0, abre) + topo(p, false, false) + lado + corpo.slice(abre);
}
