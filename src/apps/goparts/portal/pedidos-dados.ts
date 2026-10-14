/* =========================================================
   GOPARTS — os pedidos de exemplo do Pedidos v3 (13 out. 2026)
   Os mesmos seis da v2, agora com todos os artigos (as linhas somam o valor
   da tabela), a quantidade servida e o percurso de cada pedido.
   ========================================================= */

/** quantidade pedida · servida · referência e descrição · total da linha */
export type Artigo = [number, number, string, number];
/** passo do percurso: nome · quando (vazio se ainda não aconteceu) · nota */
export type Passo = [string, string, string?];

export interface Pedido { num: string; artigos: Artigo[]; percurso: Passo[]; guia?: string; fatura?: string }

export const PEDIDOS: Pedido[] = [
  { num: 'P2024/001256', guia: 'GR2024/08812', fatura: 'FT2024/05530', artigos: [
    [2, 2, 'Disco de travão Brembo 09.A727.11', 172.80], [2, 2, 'Pastilhas TRW GDB1550', 104.20], [1, 1, 'Filtro de óleo UFI 23.130.00', 7.85],
    [1, 1, 'Sensor de desgaste TRW GIC291', 32.40], [1, 1, 'Líquido de travões ATE DOT 4, 1 L', 25.25]],
    percurso: [['Recebido', '15/04 09:12'], ['Separado', '15/04 11:40'], ['Expedido', '15/04 16:05', 'Guia GR2024/08812'], ['Entregue', '16/04 10:30']] },
  { num: 'P2024/001233', guia: 'GR2024/08640', fatura: 'FT2024/05402', artigos: [
    [4, 4, 'Rolamento de roda SKF VKBA 3525', 612.40], [4, 2, 'Amortecedor Monroe G8017', 498.00], [1, 1, 'Filtro de ar Mann C 30 005', 13.40],
    [1, 1, 'Filtro de habitáculo Mann CU 2939', 10.80], [2, 2, 'Filtro de óleo Mann W 712/75', 13.40], [4, 4, 'Lâmpada H7 Osram 64210', 15.60],
    [1, 1, 'Escovas Bosch Aerotwin A929S', 22.90], [1, 1, 'Fusíveis, caixa sortida', 6.90], [10, 10, 'Abraçadeira 12–22 mm', 4.50],
    [2, 2, 'Junta do cárter Elring', 3.60], [2, 2, 'Líquido de refrigeração, 1 L', 13.80], [4, 4, 'Óleo 5W-30, 1 L', 30.60]],
    percurso: [['Recebido', '10/04 08:47'], ['Separado', '10/04 10:15', 'Faltam 2 amortecedores'], ['Expedido em parte', '10/04 15:30', 'Guia GR2024/08640'], ['Entregue', '', 'Os 2 em falta chegam a 17/04']] },
  { num: 'P2024/001198', artigos: [
    [1, 0, 'Correia Gates 6PK1070', 24.90], [1, 0, 'Escova Bosch Aerotwin A863S', 31.20], [1, 0, 'Escova traseira Bosch H352', 31.20]],
    percurso: [['Recebido', '02/04 17:58'], ['Em separação', '', 'À espera de confirmar o stock'], ['Pronto a levantar', ''], ['Levantado', '']] },
  { num: 'P2024/001175', guia: 'GR2024/08321', fatura: 'FT2024/05188', artigos: [
    [1, 1, 'Kit de embraiagem Valeo 826317', 318.20], [1, 1, 'Cilindro recetor Valeo 804731', 38.90], [1, 1, 'Rolamento de encosto SKF VKC 3616', 29.40],
    [2, 2, 'Óleo de caixa Castrol 75W-90, 1 L', 19.60], [1, 1, 'Parafusos do volante, jogo', 7.45], [1, 1, 'Retentor da cambota Elring', 2.60], [1, 1, 'Junta da tampa Elring', 2.60]],
    percurso: [['Recebido', '28/03 09:30'], ['Separado', '28/03 10:55'], ['Expedido', '28/03 14:20', 'Guia GR2024/08321'], ['Entregue', '29/03 09:45']] },
  { num: 'P2024/001142', artigos: [
    [4, 0, 'Velas NGK BKR6E', 51.20], [1, 0, 'Cabo de vela Bosch 0 986 356 300', 12.90]],
    percurso: [['Recebido', '21/03 12:05'], ['Em separação', '', 'Levanta no balcão'], ['Pronto a levantar', ''], ['Levantado', '']] },
  { num: 'P2024/001120', guia: 'GR2024/08105', fatura: 'FT2024/05011', artigos: [
    [1, 1, 'Bomba de água SKF VKPC 85309', 96.30], [1, 1, 'Kit de distribuição SKF VKMA 01250', 214.60], [2, 2, 'Kit de rolamento de roda SKF VKBA 6556', 107.88],
    [2, 2, 'Amortecedor Bilstein B4 22-145741', 186.40], [2, 2, 'Líquido de refrigeração, 1 L', 13.80], [1, 1, 'Correia SKF VKMV 6PK1873', 14.76],
    [1, 1, 'Tensor SKF VKM 38236', 35.22], [1, 1, 'Filtro de óleo Mann W 712/75', 6.70], [1, 1, 'Termóstato Wahler 4256.87D', 57.94]],
    percurso: [['Recebido', '14/03 08:20'], ['Separado', '14/03 09:50'], ['Expedido', '14/03 13:10', 'Guia GR2024/08105'], ['Entregue', '15/03 11:20']] },
];

/* os milhares sempre separados por espaço (o pt-PT do browser não separa os de 4 algarismos: «2892,15») */
export const euros = (n: number) => { const [i, d] = Math.abs(n).toFixed(2).split('.'); return `${n < 0 ? '−' : ''}${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d} €`; };

/* (15 out. 2026) o que a tabela mostra de cada pedido — o mesmo que estava escrito no HTML da v2, agora em dados
   para os Pedidos v4 se desenharem a partir daqui (o valor é a soma dos artigos) */
export interface LinhaPedido { num: string; data: string; armazem: string; morada: [string, string]; obs: string; estado: 'proc' | 'sem'; recolher: boolean }
export const LINHAS: LinhaPedido[] = [
  { num: 'P2024/001256', data: '15/04/2024', armazem: 'Porto (1)', morada: ['Rua da Indústria, 123', '4100-168 Porto'], obs: 'Entrega prioritária', estado: 'proc', recolher: false },
  { num: 'P2024/001233', data: '10/04/2024', armazem: 'Lisboa (2)', morada: ['Av. Infante D. Henrique, 55', '1800-218 Lisboa'], obs: '', estado: 'proc', recolher: false },
  { num: 'P2024/001198', data: '02/04/2024', armazem: 'Porto (1)', morada: ['Rua da Indústria, 123', '4100-168 Porto'], obs: 'Confirmar stock', estado: 'sem', recolher: true },
  { num: 'P2024/001175', data: '28/03/2024', armazem: 'Porto (1)', morada: ['Rua da Indústria, 123', '4100-168 Porto'], obs: '', estado: 'proc', recolher: false },
  { num: 'P2024/001142', data: '21/03/2024', armazem: 'Lisboa (2)', morada: ['Av. Infante D. Henrique, 55', '1800-218 Lisboa'], obs: 'Levanta no balcão', estado: 'sem', recolher: true },
  { num: 'P2024/001120', data: '14/03/2024', armazem: 'Porto (1)', morada: ['Rua da Indústria, 123', '4100-168 Porto'], obs: '', estado: 'proc', recolher: false },
];
