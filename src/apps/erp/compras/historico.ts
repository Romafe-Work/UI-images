/* =========================================================
   ERP — o histórico de compras de 2024 e 2025 (23 out. 2026), de exemplo como o resto do protótipo.
   O protótipo nasceu com as encomendas de 2026 (compras/dominio.ts); os comparativos anuais precisam de anos
   anteriores, e estes são encomendas fechadas, já recebidas, só de leitura. Saem dos mesmos artigos e fornecedores,
   com o preço do ano (2025: −3 %; 2024: −7 % sobre o preço de 2026), sempre iguais de uma vez para a outra.
   Casos que o comparativo tem de saber mostrar: a UFI começa em 2025 (sem base em 2024: N/D); a Bosch e a Ibérica de
   Transmisiones compraram antes e não em 2026 (−100 %); a Valeo sobe e depois desce.
   Nenhum outro ano tem compras: 2023 ou antes aparece como «sem dados», nunca inventado.
   ========================================================= */
import { ARTIGOS } from './dominio';

export interface LinhaHist { ref: string; qtd: number; preco: number }
export interface EncHist { ref: string; forn: string; data: string; linhas: LinhaHist[] }

/** A quantidade de cada artigo num ano «normal» (base) e quanto cada fornecedor comprou em 2024 e 2025 face a ela. */
const BASE: Record<string, number> = {
  '6206-2RSH': 1100, '6205-2Z': 820, '30205': 60, 'VKBA 6556': 150, 'LGMT 2/1': 110,
  'GDB1330': 260, 'JTE1001': 90, 'P 85 020': 380, 'P 23 133': 70, '09.A727.11': 170,
  '0 986 494 524': 120, '0 986 424 797': 0, '0 242 236 565': 300, '826210': 26, 'K015603XS': 28, '6PK1050': 100,
  'BKR6E': 420, '23.443.00': 220, '27.A44.00': 160, 'GDB2042': 60,
};
const RITMO: Record<string, [number, number]> = {
  skf: [0.82, 0.96], brembo: [1.32, 1.12], trw: [0.58, 0.88], gates: [1.02, 0.98], ngk: [1.6, 1.21],
  valeo: [0.7, 1.45], ufi: [0, 0.62], bosch: [1.1, 0.8],
};
/** A Ibérica de Transmisiones (distribuidor) vendeu correias e kits da Gates em 2024 e 2025. */
const ITRANS: [string, number, number][] = [['K015603XS', 14, 9], ['6PK1050', 60, 35]];
const MESES = ['03-14', '06-18', '11-05'];
const PARTES = [0.4, 0.35, 0.25];

let cache: EncHist[] | null = null;
export function historico(): EncHist[] {
  if (cache) return cache;
  const sai: EncHist[] = [];
  const precoAno = (p: number | null, ano: number) => Math.round((p ?? 0) * (ano === 2025 ? 0.97 : 0.93));
  [2024, 2025].forEach((ano, ia) => {
    let num = ano === 2024 ? 31 : 27;
    const porForn = new Map<string, LinhaHist[][]>();
    for (const a of ARTIGOS) {
      const k = RITMO[a.forn]?.[ia] ?? 0, q = Math.round((BASE[a.ref] ?? 0) * k);
      if (!q || a.preco === null) continue;
      const partes = porForn.get(a.forn) ?? [[], [], []];
      PARTES.forEach((p, i) => { const x = i === PARTES.length - 1 ? q - PARTES.slice(0, -1).reduce((s, y) => s + Math.round(q * y), 0) : Math.round(q * p); if (x > 0) partes[i].push({ ref: a.ref, qtd: x, preco: precoAno(a.preco, ano) }); });
      porForn.set(a.forn, partes);
    }
    const it: LinhaHist[] = ITRANS.map(([ref, q24, q25]) => ({ ref, qtd: ia ? q25 : q24, preco: Math.round(precoAno(ARTIGOS.find((a) => a.ref === ref)?.preco ?? 0, ano) * 0.95) }));
    porForn.set('itrans', [it, [], []]);
    for (const [forn, partes] of porForn) partes.forEach((linhas, i) => { if (linhas.length) sai.push({ ref: `EF ${ano}/${String(num++).padStart(4, '0')}`, forn, data: `${ano}-${MESES[i]}`, linhas }); });
  });
  return (cache = sai.sort((a, b) => a.data.localeCompare(b.data)));
}
