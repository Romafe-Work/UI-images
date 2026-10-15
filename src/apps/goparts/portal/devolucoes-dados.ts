/* =========================================================
   GOPARTS — as devoluções de exemplo (15 out. 2026; 16 · Devoluções)
   Os campos são os da tabela do GO REPAIR: n.º da devolução, data de criação, data de envio, total de referências,
   total de unidades, observações e utilizador. Cada devolução sai de uma guia com fatura (a de onde vêm os artigos) e,
   quando a Romafe já a creditou, liga à nota de crédito que existe nas Guias e nas Faturas (GR2024/08511 e
   GR2024/07988). Não há estados inventados: o estado diz-se só pelos dados — sem data de envio é «Por enviar»; com
   data de envio é «Enviada»; com nota de crédito ligada é «Creditada». Não há valores de crédito estimados: o valor
   só aparece quando a nota de crédito existe, e é o dela.
   ========================================================= */

/** quantidade devolvida · descrição (a mesma da guia de origem) */
export type LinhaDevolucao = [number, string];
export interface Devolucao {
  num: string; criada: string; enviada: string; utilizador: string; obs: string;
  /** a guia de remessa (com fatura) de onde vêm os artigos */
  origem: string;
  /** a guia da nota de crédito, quando a Romafe já creditou */
  credito?: string;
  linhas: LinhaDevolucao[];
}

export const DEVOLUCOES: Devolucao[] = [
  { num: 'DV2024/00036', criada: '16/04/2024', enviada: '', utilizador: 'Fernando F. França', obs: 'Filtro pedido em duplicado', origem: 'GR2024/08812',
    linhas: [[1, 'Filtro de óleo UFI 23.130.00']] },
  { num: 'DV2024/00035', criada: '12/04/2024', enviada: '12/04/2024', utilizador: 'Marta Lopes', obs: 'Lâmpadas a mais; escovas de outra medida', origem: 'GR2024/08640',
    linhas: [[2, 'Lâmpada H7 Osram 64210'], [1, 'Escovas Bosch Aerotwin A929S']] },
  { num: 'DV2024/00031', criada: '02/04/2024', enviada: '03/04/2024', utilizador: 'Fernando F. França', obs: 'Retentor danificado', origem: 'GR2024/08321', credito: 'GR2024/08511',
    linhas: [[1, 'Retentor da cambota Elring']] },
  { num: 'DV2024/00027', criada: '07/03/2024', enviada: '07/03/2024', utilizador: 'Marta Lopes', obs: 'Peça errada', origem: 'GR2024/07940', credito: 'GR2024/07988',
    linhas: [[2, 'Pastilhas TRW GDB1550']] },
];

export const referencias = (d: Devolucao) => d.linhas.length;
export const unidades = (d: Devolucao) => d.linhas.reduce((s, l) => s + l[0], 0);
/** O estado, só pelo que os dados confirmam. */
export type EstadoDev = 'rascunho' | 'enviada' | 'creditada';
export const estadoDev = (d: Devolucao): EstadoDev => d.credito ? 'creditada' : d.enviada ? 'enviada' : 'rascunho';
export const NOME_ESTADO: Record<EstadoDev, string> = { rascunho: 'Por enviar', enviada: 'Enviada', creditada: 'Creditada' };
