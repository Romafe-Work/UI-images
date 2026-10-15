/* =========================================================
   GOPARTS — as guias de remessa de exemplo da v2 (13 out. 2026)
   Oito guias: seis com fatura e duas notas de crédito (devoluções). As que
   saem de pedidos do Pedidos v3 batem com eles (o mesmo pedido, os mesmos
   artigos; o 001233 foi expedido em parte). Base tributável = bruto −
   desconto + embalagens + portes; IVA a 23 %.
   ========================================================= */
import { PEDIDOS } from './pedidos-dados';

/** quantidade · descrição · valor líquido da linha */
export type LinhaGuia = [number, string, number];
export interface Guia {
  num: string; data: string; tipo: 'fatura' | 'credito'; doc: string; armazem: string; morada: [string, string];
  pedido: string; obs: string; bruto: number; desconto: number; embalagens: number; portes: number; linhas: LinhaGuia[];
}

const PORTO: [string, string] = ['Rua da Indústria, 123', '4100-168 Porto'];
const LISBOA: [string, string] = ['Av. Infante D. Henrique, 55', '1800-218 Lisboa'];
/** as linhas de um pedido do Pedidos v3, só com o que foi servido */
const doPedido = (num: string): LinhaGuia[] => (PEDIDOS.find((p) => p.num === num)?.artigos || [])
  .filter((a) => a[1] > 0).map(([ped, serv, desc, valor]) => [serv, desc, +(valor * serv / ped).toFixed(2)]);

export const GUIAS: Guia[] = [
  { num: 'GR2024/08812', data: '15/04/2024', tipo: 'fatura', doc: 'FT2024/05530', armazem: 'Porto', morada: PORTO, pedido: 'P2024/001256', obs: 'Entrega prioritária',
    bruto: 489.29, desconto: 146.79, embalagens: 0, portes: 0, linhas: doPedido('P2024/001256') },
  { num: 'GR2024/08640', data: '10/04/2024', tipo: 'fatura', doc: 'FT2024/05402', armazem: 'Lisboa', morada: LISBOA, pedido: 'P2024/001233', obs: 'Expedição parcial: faltam 2 amortecedores',
    bruto: 1424.14, desconto: 427.24, embalagens: 3.5, portes: 9.9, linhas: doPedido('P2024/001233') },
  { num: 'GR2024/08511', data: '05/04/2024', tipo: 'credito', doc: 'NC2024/00412', armazem: 'Porto', morada: PORTO, pedido: 'P2024/001175', obs: 'Devolução: retentor danificado',
    bruto: -3.71, desconto: -1.11, embalagens: 0, portes: 0, linhas: [[-1, 'Retentor da cambota Elring', -2.6]] },
  { num: 'GR2024/08321', data: '28/03/2024', tipo: 'fatura', doc: 'FT2024/05188', armazem: 'Porto', morada: PORTO, pedido: 'P2024/001175', obs: '—',
    bruto: 598.21, desconto: 179.46, embalagens: 0, portes: 0, linhas: doPedido('P2024/001175') },
  { num: 'GR2024/08105', data: '14/03/2024', tipo: 'fatura', doc: 'FT2024/05011', armazem: 'Porto', morada: PORTO, pedido: 'P2024/001120', obs: '—',
    bruto: 1048.0, desconto: 314.4, embalagens: 0, portes: 0, linhas: doPedido('P2024/001120') },
  { num: 'GR2024/07988', data: '08/03/2024', tipo: 'credito', doc: 'NC2024/00377', armazem: 'Lisboa', morada: LISBOA, pedido: 'P2024/001087', obs: 'Devolução: peça errada',
    bruto: -120.0, desconto: -36.0, embalagens: 0, portes: 0, linhas: [[-2, 'Pastilhas TRW GDB1550', -84.0]] },
  { num: 'GR2024/07940', data: '06/03/2024', tipo: 'fatura', doc: 'FT2024/04870', armazem: 'Lisboa', morada: LISBOA, pedido: 'P2024/001087', obs: 'Portes de urgência',
    bruto: 220.0, desconto: 66.0, embalagens: 2.5, portes: 12.5, linhas: [[2, 'Pastilhas TRW GDB1550', 104.2], [1, 'Sensor de desgaste TRW GIC291', 32.4], [1, 'Líquido de travões ATE DOT 4, 1 L', 17.4]] },
  { num: 'GR2024/07802', data: '01/03/2024', tipo: 'fatura', doc: 'FT2024/04711', armazem: 'Porto', morada: PORTO, pedido: 'P2024/001061', obs: '—',
    bruto: 310.0, desconto: 93.0, embalagens: 0, portes: 0, linhas: [[1, 'Bomba de água SKF VKPC 88618', 67.44], [1, 'Kit de distribuição INA 530 0089 10', 109.4], [1, 'Correia SKF VKMV 6PK1873', 14.76], [1, 'Tensor SKF VKM 38236', 25.4]] },
];

export const base = (g: Guia) => +(g.bruto - g.desconto + g.embalagens + g.portes).toFixed(2);
export const iva = (g: Guia) => +(base(g) * 0.23).toFixed(2);
export const total = (g: Guia) => +(base(g) + iva(g)).toFixed(2);
/** Euros à portuguesa: espaço nos milhares (também com 4 algarismos: 3 449,60 €), vírgula nas décimas. */
export const euros = (n: number) => { const [i, d] = Math.abs(n).toFixed(2).split('.'); return `${n < 0 ? '−' : ''}${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d} €`; };
