/* =========================================================
   GOPARTS — as faturas de exemplo (13 out. 2026)
   Uma por guia de remessa (guias-dados.ts): as faturas das guias expedidas e
   as notas de crédito das devoluções, com os mesmos valores. O GO REPAIR tem
   três pares base/IVA (para taxas diferentes); nas peças auto é tudo a 23 %,
   por isso o segundo e o terceiro ficam vazios — como ficariam na realidade.
   Junta-se o que uma oficina quer saber de uma fatura: o vencimento e se está
   paga, em aberto ou vencida.
   ========================================================= */
import { GUIAS, base, iva, total, type Guia } from './guias-dados';

export type Pagamento = 'paga' | 'aberto' | 'vencida' | 'creditada';
export interface Fatura { num: string; guia: Guia; vencimento: string; pagamento: Pagamento; pagaEm?: string }

const ESTADO: Record<string, [string, Pagamento, string?]> = {
  'FT2024/05530': ['15/05/2024', 'aberto'],
  'FT2024/05402': ['10/05/2024', 'aberto'],
  'NC2024/00412': ['—', 'creditada'],
  'FT2024/05188': ['27/04/2024', 'vencida'],
  'FT2024/05011': ['13/04/2024', 'paga', '10/04/2024'],
  'NC2024/00377': ['—', 'creditada'],
  'FT2024/04870': ['05/04/2024', 'paga', '02/04/2024'],
  'FT2024/04711': ['31/03/2024', 'paga', '28/03/2024'],
};

export const FATURAS: Fatura[] = GUIAS.map((g) => {
  const [vencimento, pagamento, pagaEm] = ESTADO[g.doc];
  return { num: g.doc, guia: g, vencimento, pagamento, pagaEm };
});

export { base, iva, total };
