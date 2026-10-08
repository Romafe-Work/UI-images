/* =========================================================
   GOPARTS — a base do portal: o topo, as abas e o rodapé
   Os ecrãs vieram do Figma-WebShop-GoParts (8 out. 2026) e cada um traz só
   o corpo; o que se repete está aqui uma vez. Melhorado com o que ela foi
   pedindo nos logins: o ROMAFE na letra Motor e no azul RGB(0, 99, 170),
   botões com ícone e texto.
   ========================================================= */
import type { IdGoParts } from '../ids';

export type IdPortal = Extract<IdGoParts, 'inicio' | 'catalogo' | 'pedidos' | 'guias'>;

const I = (d: string, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;

/* as oito abas do portal atual; as que ainda não têm ecrã ficam sem destino */
const ABAS: [IdPortal | null, string, string][] = [
  ['inicio', 'Início', '<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/>'],
  ['catalogo', 'Catálogo', '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m12 12 8-4.5M12 12v9M12 12 4 7.5"/>'],
  ['pedidos', 'Pedidos', '<path d="M6 3h9l4 4v14H6Z"/><path d="M9 12h7M9 16h7"/>'],
  ['guias', 'Guias de remessa', '<path d="M1.5 6.5h13v9h-13Z"/><path d="M14.5 9.5h4l3.5 3.5v2.5h-7.5Z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'],
  [null, 'Faturas', '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>'],
  [null, 'Devoluções', '<path d="M3 7v5h5"/><path d="M3.5 12a8.5 8.5 0 1 0 2.2-5.7L3 9"/>'],
  [null, 'Inf. técnica', '<path d="m14 4 6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2Z"/><path d="m12 6 6 6"/>'],
  [null, 'Minha lista', '<path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.8l6-.8Z"/>'],
];

function topo(): string {
  return `<header class="portal__topo">
    <div class="portal__marca">
      <span class="romafe portal__romafe">ROMAFE</span>
      <span class="portal__risco" aria-hidden="true"></span>
      <span class="portal__produto">GoParts<span class="portal__produto-sub">O marketplace de peças auto</span></span>
    </div>
    <div class="procura">
      ${I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>', ' class="procura__lupa"')}
      <input class="procura__campo" type="search" placeholder="Pesquisar por referência, marca, modelo, etc." aria-label="Pesquisar">
      <kbd class="procura__atalho">Ctrl + K</kbd>
    </div>
    <div class="portal__accoes">
      <button type="button" class="portal__icone" aria-label="Mensagens">${I('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 6 9 6 9-6"/>')}<span class="portal__ponto" aria-label="Novas mensagens"></span></button>
      <button type="button" class="portal__icone" aria-label="Carrinho, 3 artigos">${I('<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>')}<span class="portal__selo">3</span></button>
      <button type="button" class="portal__icone" aria-label="Definições">${I('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>')}</button>
      <button type="button" class="portal__icone" aria-label="Ajuda">${I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.6 2.6 0 1 1 3.4 2.5c-.7.3-1 .8-1 1.6v.3"/><path d="M12 17.4h.01"/>')}</button>
      <button type="button" class="conta">
        <span class="conta__inicial" aria-hidden="true">FF</span>
        <span class="conta__texto"><span class="conta__nome">Fernando F. França</span><span class="conta__local">Porto · 1 conta</span></span>
        ${I('<path d="m6 9 6 6 6-6"/>')}
      </button>
    </div>
  </header>`;
}

function abas(ativa: IdPortal): string {
  return `<nav class="portal__abas" aria-label="Secções">${ABAS.map(([id, nome, d]) => `
    <button type="button" class="aba"${id ? ` data-ir="${id}"` : ' disabled title="Ainda sem ecrã"'}${id === ativa ? ' aria-current="true"' : ''}>${I(d)}${nome}</button>`).join('')}
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

/** O ecrã inteiro: o corpo vindo do ficheiro .html, com o topo, as abas e o rodapé à volta. */
export function portal(ativa: IdPortal, corpo: string): string {
  const abre = corpo.indexOf('>') + 1;
  const fecha = corpo.lastIndexOf('</div>');
  return corpo.slice(0, abre) + topo() + abas(ativa) + corpo.slice(abre, fecha) + rodape() + corpo.slice(fecha);
}
