/* =========================================================
   ERP — a moldura dos ecrãs depois de entrar (12 out. 2026)
   Ainda não há ecrãs do ERP além do início de sessão; esta moldura nasceu
   para os estados de carregamento e de erro. Em cima: o ROMAFE, a empresa
   (o mandante), a procura, os avisos e a conta. À esquerda: os módulos.
   O primeiro módulo a fazer é Compras (reunião de 6 out.); os outros estão
   na lista mas sem ecrã, e os nomes são provisórios até haver a lista
   da especificação.

   Ajustável: ocupa pelo menos a janela e rola; a coluna dos módulos fica
   presa; abaixo de 1100 px fica só com os ícones e o nome por baixo.
   ========================================================= */
export const I = (d: string, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const IC = {
  inicio: '<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/>',
  compras: '<path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20 7H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
  vendas: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  stocks: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m12 12 8-4.5M12 12v9M12 12 4 7.5"/>',
  armazem: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M7 17h10"/>',
  clientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  faturacao: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>',
  definicoes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>',
  sino: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.6 2.6 0 1 1 3.4 2.5c-.7.3-1 .8-1 1.6v.3"/><path d="M12 17.4h.01"/>',
  baixo: '<path d="m6 9 6 6 6-6"/>',
  empresa: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M3 21h18"/>',
};

export type Modulo = 'inicio' | 'compras' | 'vendas' | 'stocks' | 'armazem' | 'clientes' | 'faturacao' | 'definicoes';
const MODULOS: [Modulo, string][] = [
  ['inicio', 'Início'], ['compras', 'Compras'], ['vendas', 'Vendas'], ['stocks', 'Stocks'],
  ['armazem', 'Armazém'], ['clientes', 'Clientes'], ['faturacao', 'Faturação'], ['definicoes', 'Definições'],
];
/* os submenus de Compras, o único módulo desenhado */
const COMPRAS = ['Encomendas a fornecedor', 'Fornecedores', 'Faturas de fornecedor'];

function topo(): string {
  return `<header class="erp__topo">
    <div class="erp__marca">
      <span class="romafe erp__romafe">ROMAFE</span>
      <span class="erp__risco" aria-hidden="true"></span>
      <span class="erp__produto">ERP<span class="erp__produto-sub">Enterprise Resource Planning</span></span>
    </div>
    <button type="button" class="erp__empresa">${I(IC.empresa)}<span>Romafe, SA</span>${I(IC.baixo, 'erp__seta')}</button>
    <div class="procura erp__procura">
      ${I(IC.lupa, 'procura__lupa')}
      <input class="procura__campo" type="search" placeholder="Procurar artigos, fornecedores, documentos…" aria-label="Procurar">
      <kbd class="procura__atalho">Ctrl + K</kbd>
    </div>
    <div class="erp__accoes">
      <button type="button" class="portal__icone" aria-label="Avisos, 2 por ler">${I(IC.sino)}<span class="portal__selo">2</span></button>
      <button type="button" class="portal__icone" aria-label="Ajuda">${I(IC.ajuda)}</button>
      <button type="button" class="conta">
        <span class="conta__inicial" aria-hidden="true">RM</span>
        <span class="conta__texto"><span class="conta__nome">Rui Matos</span><span class="conta__local">Compras</span></span>
        ${I(IC.baixo)}
      </button>
    </div>
  </header>`;
}

function lado(ativo: Modulo | null, sub: number | null): string {
  return `<nav class="erp__lado" aria-label="Módulos">${MODULOS.map(([id, nome]) => {
    const tem = id === 'inicio' || id === 'compras';
    const btn = `<button type="button" class="erp__modulo"${tem ? ` data-ir="${id}"` : ' disabled title="Ainda sem ecrã"'}${id === ativo ? ' aria-current="true"' : ''}>${I(IC[id])}<span>${nome}</span></button>`;
    if (id !== 'compras' || ativo !== 'compras') return btn;
    return btn + `<div class="erp__sub">${COMPRAS.map((s, i) => `<button type="button" class="erp__subitem"${i === sub ? ' aria-current="true"' : ''}>${s}</button>`).join('')}</div>`;
  }).join('')}
  </nav>`;
}

/** O ecrã do ERP: a barra em cima, os módulos à esquerda e o corpo. `extra` vai
    por cima de tudo (véus e diálogos). */
export function erp(corpo: string, o: { modulo?: Modulo | null; sub?: number | null; extra?: string; classe?: string } = {}): string {
  return `<div class="erp${o.classe ? ' ' + o.classe : ''}">
  ${topo()}
  ${lado(o.modulo === undefined ? 'compras' : o.modulo, o.sub === undefined ? 0 : o.sub)}
  <main class="erp__corpo">${corpo}</main>
  ${o.extra || ''}
</div>`;
}
