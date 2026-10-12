/* =========================================================
   ERP — 10 · Compras, o primeiro ecrã do ERP (12 out. 2026)
   Ela: «o ERP vai ser feito por módulo; o primeiro é Compras; implementa
   isto como primeiro ecrã do ERP». É o que se vê ao entrar: o módulo de
   Compras, aberto nas encomendas a fornecedor. Em cima, os números do
   módulo; ao meio, as encomendas por estado; à direita, o que espera
   aprovação e as entregas desta semana.
   Os números e as encomendas são de exemplo (os mesmos dos estados).
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import type { IdErp } from './ids';
import { erp, I } from './moldura';

export type IdCompras = 'compras';

const IC = {
  mais: '<path d="M12 5v14M5 12h14"/>',
  filtro: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
  exportar: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  caixa: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  aprovar: '<path d="M9 12l2 2 4-4"/><path d="M12 3 19 6v6c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6Z"/>',
  euro: '<path d="M17 6.5A7 7 0 1 0 17 17.5"/><path d="M4 10h9M4 14h9"/>',
  camiao: '<path d="M1.5 6.5h13v9h-13Z"/><path d="M14.5 9.5h4l3.5 3.5v2.5h-7.5Z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  seta: '<path d="m9 6 6 6-6 6"/>',
  lembrar: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
};
const BOTAO = (texto: string, icone: string, tipo = 'btn--acao', extra = '') => `<button type="button" class="btn ${tipo}"${extra}>${I(icone, 'btn__icone')}<span class="btn__rotulo">${texto}</span></button>`;

/* as encomendas de exemplo: número, fornecedor, data, entrega, linhas, total, estado */
const ENCOMENDAS: string[][] = [
  ['EF 2026/0413', 'Bosch', '12/10/2026', '—', '6', '1 840,20 €', 'Rascunho'],
  ['EF 2026/0412', 'SKF', '09/10/2026', '16/10/2026', '24', '18 420,00 €', 'A aprovar'],
  ['EF 2026/0411', 'Brembo', '08/10/2026', '20/10/2026', '9', '6 312,40 €', 'Parcialmente recebida'],
  ['EF 2026/0410', 'UFI Filters', '07/10/2026', '14/10/2026', '15', '2 980,15 €', 'Recebida'],
  ['EF 2026/0409', 'Gates', '06/10/2026', '13/10/2026', '11', '4 105,75 €', 'Enviada'],
  ['EF 2026/0408', 'TRW', '03/10/2026', '10/10/2026', '18', '9 870,00 €', 'Atrasada'],
  ['EF 2026/0407', 'Valeo', '02/10/2026', '09/10/2026', '7', '3 215,60 €', 'Atrasada'],
  ['EF 2026/0406', 'NGK', '01/10/2026', '08/10/2026', '12', '1 452,30 €', 'Recebida'],
];
const COR: Record<string, string> = {
  'Rascunho': 'cinza', 'A aprovar': 'aviso', 'Enviada': 'azul', 'Parcialmente recebida': 'aviso', 'Recebida': 'ok', 'Atrasada': 'erro',
};
const estado = (e: string) => `<span class="cp-estado cp-estado--${COR[e]}">${e}</span>`;
const linha = (l: string[]) => `<tr>
        <td><a href="#">${l[0]}</a></td><td>${l[1]}</td><td>${l[2]}</td><td${l[6] === 'Atrasada' ? ' class="cp-atraso"' : ''}>${l[3]}</td>
        <td class="erp-num">${l[4]}</td><td class="erp-num">${l[5]}</td><td>${estado(l[6])}</td>
        <td>${BOTAO('Abrir', IC.olho, 'btn--ghost btn--sm')}</td>
      </tr>`;

const numero = (icone: string, cor: string, rotulo: string, valor: string, sub: string) => `<section class="cp-numero">
      <span class="cp-numero__icone cp-numero__icone--${cor}">${I(icone)}</span>
      <div><p class="cp-numero__rotulo">${rotulo}</p><p class="cp-numero__valor">${valor}</p><p class="cp-numero__sub">${sub}</p></div>
    </section>`;

const ABAS: [string, number, boolean][] = [['Todas', 126, true], ['Rascunho', 4, false], ['A aprovar', 2, false], ['Enviadas', 9, false], ['Por receber', 18, false], ['Atrasadas', 3, false], ['Recebidas', 90, false]];

function ecra(): string {
  return erp(`<div class="erp-pagina cp">
    <header class="erp-cabeca">
      <div><p class="erp-cabeca__caminho">Compras</p><h1 class="erp-cabeca__titulo">Encomendas a fornecedor</h1><p class="erp-cabeca__sub">O que se encomendou aos fornecedores e o que falta receber no armazém 60 · Coimbra.</p></div>
      <div class="erp-cabeca__botoes">${BOTAO('Exportar', IC.exportar, 'btn--ghost')}${BOTAO('Nova encomenda', IC.mais)}</div>
    </header>

    <div class="cp-numeros">
      ${numero(IC.caixa, 'azul', 'Por receber', '18', '142 380,00 € em encomendas')}
      ${numero(IC.relogio, 'erro', 'Atrasadas', '3', 'a mais antiga há 3 dias')}
      ${numero(IC.aprovar, 'aviso', 'À espera de aprovação', '2', 'acima de 10 000 €')}
      ${numero(IC.euro, 'ok', 'Comprado em outubro', '48 196,40 €', '9 encomendas enviadas')}
    </div>

    <div class="cp-dois">
      <section class="cg-tabela erp-tabela cp-lista">
        <div class="cp-lista__topo">
          <nav class="cp-abas" aria-label="Estado">${ABAS.map(([n, c, a]) => `<button type="button" class="cp-aba"${a ? ' aria-current="true"' : ''}>${n}<span class="cp-aba__conta">${c}</span></button>`).join('')}</nav>
          <div class="cp-lista__filtros">
            <div class="procura erp__procura cp-procura">${I('<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>', 'procura__lupa')}<input class="procura__campo" type="search" placeholder="Encomenda, fornecedor ou artigo" aria-label="Procurar encomendas"></div>
            ${BOTAO('Filtros', IC.filtro, 'btn--ghost btn--sm')}
          </div>
        </div>
        <div class="erp-tabela__rolo"><table>
          <thead><tr><th>Encomenda</th><th>Fornecedor</th><th>Data</th><th>Entrega prevista</th><th class="erp-num">Linhas</th><th class="erp-num">Total</th><th>Estado</th><th></th></tr></thead>
          <tbody>${ENCOMENDAS.map(linha).join('')}</tbody>
        </table></div>
        <div class="cp-lista__pe"><span>A mostrar 8 de 126</span>${BOTAO('Ver mais', IC.seta, 'btn--ghost btn--sm')}</div>
      </section>

      <aside class="cp-lado">
        <section class="cp-caixa">
          <h2 class="cp-caixa__titulo">${I(IC.aprovar)}À espera de aprovação</h2>
          <ul class="cp-itens">
            <li><div><p class="cp-item__nome">EF 2026/0412 · SKF</p><p class="cp-item__sub">18 420,00 € · enviada para aprovação a 09/10</p></div></li>
            <li><div><p class="cp-item__nome">EF 2026/0402 · Brembo</p><p class="cp-item__sub">12 060,00 € · enviada para aprovação a 29/09</p></div></li>
          </ul>
          ${BOTAO('Lembrar a direção', IC.lembrar, 'btn--ghost btn--sm btn--bloco')}
        </section>
        <section class="cp-caixa">
          <h2 class="cp-caixa__titulo">${I(IC.camiao)}Entregas desta semana</h2>
          <ul class="cp-itens">
            <li><span class="cp-dia">Ter<br><strong>13</strong></span><div><p class="cp-item__nome">Gates · EF 2026/0409</p><p class="cp-item__sub">11 linhas · enviada</p></div></li>
            <li><span class="cp-dia">Qua<br><strong>14</strong></span><div><p class="cp-item__nome">UFI Filters · EF 2026/0410</p><p class="cp-item__sub">Já recebida a 12/10</p></div></li>
            <li><span class="cp-dia">Sex<br><strong>16</strong></span><div><p class="cp-item__nome">SKF · EF 2026/0412</p><p class="cp-item__sub">24 linhas · à espera de aprovação</p></div></li>
          </ul>
        </section>
      </aside>
    </div>
  </div>`, { modulo: 'compras', sub: 0 });
}

export function ecrasCompras(): Ecra<IdErp>[] {
  return [{
    id: 'compras', nome: '10 · Compras', fluxo: 'Compras',
    objetivo: 'O primeiro ecrã do ERP, que se faz por módulo e começa por Compras: os números do módulo, as encomendas a fornecedor por estado, o que espera aprovação e as entregas da semana.',
    versoes: [{ id: 'v1', nota: 'Primeira versão: o módulo de Compras aberto nas encomendas a fornecedor', html: ecra() }],
  }];
}

export const DESCRICAO_COMPRAS = 'O módulo de Compras, o primeiro do ERP: encomendas a fornecedor, aprovações e entregas.';
