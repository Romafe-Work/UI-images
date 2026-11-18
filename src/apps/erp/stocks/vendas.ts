/* =========================================================
   ERP — Stocks ▸ Mapas: as vendas de exemplo para o mapa Artigos/clientes (18 nov. 2026).
   O protótipo não tinha vendas nem clientes; aqui ficam clientes inventados (nomes genéricos, nenhum do ERP real: o
   repositório é público) e as linhas dos documentos de venda de 2026, geradas sempre iguais (semente fixa), com os
   campos das colunas do ERP antigo: Nr. Doc., Dt. Doc., Tipo Doc., Nr. Req. Cli., #Cliente, #Artigo, #Uni, Qt.,
   Pr. Unit., Desc 1, Desc 2, #STx, Pr. Unit. Liq. e Valor.
     - as notas de crédito têm a quantidade e o valor negativos (devolvem);
     - o preço de venda parte do último preço do fornecedor (artigo.preco) com a margem de cada família;
     - o artigo novo na tabela (0 986 424 797) ainda não se vendeu: serve o «sem vendas».
   Valores em cêntimos; descontos em percentagem inteira.
   ========================================================= */
import { ARTIGOS, artigo, HOJE } from '../compras/dominio';

export interface Cliente { num: string; nome: string; cidade: string; nif: string }
export const CLIENTES: Cliente[] = [
  { num: '1', nome: 'Consumidor final', cidade: '—', nif: '999 999 990' },
  { num: '10231', nome: 'Auto Peças do Mondego, Lda.', cidade: 'Coimbra', nif: 'PT 510 000 231' },
  { num: '10264', nome: 'Oficina Central da Beira, Lda.', cidade: 'Viseu', nif: 'PT 510 000 264' },
  { num: '10302', nome: 'Transportes Litoral Centro, S.A.', cidade: 'Aveiro', nif: 'PT 510 000 302' },
  { num: '10345', nome: 'Mecânica Rápida do Choupal', cidade: 'Coimbra', nif: 'PT 510 000 345' },
  { num: '10388', nome: 'Agro Máquinas do Vouga, Lda.', cidade: 'Águeda', nif: 'PT 510 000 388' },
  { num: '10412', nome: 'Frota Urbana de Exemplo, E.M.', cidade: 'Aveiro', nif: 'PT 510 000 412' },
  { num: '10457', nome: 'Metalomecânica da Bairrada, Lda.', cidade: 'Anadia', nif: 'PT 510 000 457' },
  { num: '10490', nome: 'Garagem São Martinho', cidade: 'Leiria', nif: 'PT 510 000 490' },
  { num: '10533', nome: 'Tratores do Baixo Mondego, Lda.', cidade: 'Montemor-o-Velho', nif: 'PT 510 000 533' },
  { num: '10571', nome: 'Serralharia Moderna, Lda.', cidade: 'Pombal', nif: 'PT 510 000 571' },
  { num: '10604', nome: 'Indústria de Papel do Centro, S.A.', cidade: 'Figueira da Foz', nif: 'PT 510 000 604' },
  { num: '10648', nome: 'Pneus e Travões da Lousã', cidade: 'Lousã', nif: 'PT 510 000 648' },
  { num: '10692', nome: 'Cerâmica do Vale, S.A.', cidade: 'Coimbra', nif: 'PT 510 000 692' },
];
export const cliente = (num: string) => CLIENTES.find((c) => c.num === num);

export type TipoVenda = 'FT' | 'FR' | 'VD' | 'NC';
export const NOME_VENDA: Record<TipoVenda, string> = { FT: 'Fatura', FR: 'Fatura-recibo', VD: 'Venda a dinheiro', NC: 'Nota de crédito' };

export interface LinhaVenda {
  id: string; doc: string; data: string; tipo: TipoVenda; req: string; cli: string; ref: string; un: string;
  qtd: number; preco: number; d1: number; d2: number; stx: string; iva: number; liq: number; valor: number;
}

/* a semente fixa: as mesmas vendas em todas as aberturas */
function aleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const MARGEM: Record<string, number> = { SKF: 1.62, TRW: 1.48, Brembo: 1.45, Bosch: 1.5, Valeo: 1.38, Gates: 1.46, NGK: 1.7, UFI: 1.65 };
/* os mais vendidos saem mais vezes (o peso de cada artigo) */
const PESO: Record<string, number> = { '6206-2RSH': 9, '6205-2Z': 7, GDB1330: 6, '23.443.00': 6, BKR6E: 5, '6PK1050': 4, 'LGMT 2/1': 4, 'VKBA 6556': 3, '30205': 3 };
const NOVO = '0 986 424 797';
export const precoVenda = (ref: string) => { const a = artigo(ref)!; return Math.round((a.preco ?? 1800) * (MARGEM[a.marca] ?? 1.5) / 5) * 5; };

let cache: LinhaVenda[] | null = null;
/** Todas as linhas de venda de 2026 (até hoje), da mais recente para a mais antiga. */
export function vendas(): LinhaVenda[] {
  if (cache) return cache;
  const r = aleatorio(60_2026), escolha = <T>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const arts = ARTIGOS.filter((a) => a.ref !== NOVO).flatMap((a) => Array<string>(PESO[a.ref] ?? 2).fill(a.ref));
  const clis = CLIENTES.flatMap((c, i) => Array<string>(i === 0 ? 2 : i < 6 ? 4 : 2).fill(c.num));
  const conta: Record<TipoVenda, number> = { FT: 380, FR: 120, VD: 90, NC: 14 };
  const out: LinhaVenda[] = [], inicio = Date.parse('2026-01-05T12:00:00Z'), fim = Date.parse(`${HOJE}T12:00:00Z`);
  for (let n = 0; n < 190; n++) {
    const data = new Date(inicio + Math.floor(r() * (fim - inicio))).toISOString().slice(0, 10);
    const cli = escolha(clis), tipo: TipoVenda = cli === '1' ? 'VD' : r() < 0.06 ? 'NC' : r() < 0.22 ? 'FR' : 'FT';
    const doc = `${tipo} 2026/${String(++conta[tipo]).padStart(4, '0')}`;
    const req = tipo !== 'VD' && r() < 0.55 ? `OC ${String(400 + Math.floor(r() * 900))}` : '';
    const nl = tipo === 'NC' ? 1 : 1 + Math.floor(r() * 4), usados = new Set<string>();
    for (let k = 0; k < nl; k++) {
      const ref = escolha(arts); if (usados.has(ref)) continue; usados.add(ref);
      const a = artigo(ref)!, preco = precoVenda(ref);
      const d1 = cli === '1' ? 0 : escolha([0, 5, 10, 10, 15, 20, 25]), d2 = d1 && r() < 0.25 ? escolha([2, 3, 5]) : 0;
      const liq = Math.round(preco * (100 - d1) / 100 * (100 - d2) / 100);
      const base = a.un === 'jogo' || a.preco! > 5000 ? 1 + Math.floor(r() * 4) : 1 + Math.floor(r() * 12);
      const qtd = tipo === 'NC' ? -Math.max(1, Math.floor(base / 3)) : base;
      out.push({ id: `${doc}#${k + 1}`, doc, data, tipo, req, cli, ref, un: a.un, qtd, preco, d1, d2, stx: 'NOR', iva: a.iva, liq, valor: liq * qtd });
    }
  }
  cache = out.sort((a, b) => b.data.localeCompare(a.data) || b.doc.localeCompare(a.doc));
  return cache;
}
