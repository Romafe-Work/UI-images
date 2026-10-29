/* =========================================================
   ERP · Compras — o domínio (19 out. 2026), fase 1: fornecedores, encomendas a fornecedor e receções
   Ela: «começar com Fornecedores + Encomendas de Compra + Receções, garantindo que estes três processos
   funcionam realmente». O protótipo não tem servidor: este ficheiro faz de API e de base de dados, no
   navegador (localStorage, partilhado por todos os perfis, porque os documentos são da empresa e não da
   pessoa). O que aqui é regra é o que o backend do Rolgest tem de fazer; o resto é andaime:

   - DINHEIRO em cêntimos inteiros (nunca vírgula flutuante). Preço × quantidade é inteiro; o desconto
     (em pontos base, 1 % = 100) arredonda meio para cima ao cêntimo, por linha; o IVA calcula-se por taxa
     sobre a soma das bases dessa taxa e arredonda uma vez. Só euros: outra moeda precisa das regras de
     câmbio, que ainda não existem, e o editor não deixa escolher.
   - ESTADOS da encomenda, com as transições permitidas (TRANSICOES) e nada mais:
       Rascunho → submeter → A aprovar (acima do limite do comprador) ou Aprovada (dentro do limite)
       A aprovar → aprovar → Aprovada · rejeitar (com motivo) → Rascunho
       Aprovada → emitir → Emitida
       Emitida → (receção) → Parcialmente recebida → Recebida → fechar → Fechada
       Parcialmente recebida → fechar com pendentes (com motivo) → Fechada
       Rascunho, A aprovar, Aprovada, Emitida sem nada recebido → cancelar (com motivo) → Cancelada
     «Atrasada» não é um estado: é uma Emitida ou Parcialmente recebida com a entrega prevista já passada.
   - PERMISSÕES por ação (PODE). Quem cria não aprova (separação de funções); o limite de aprovação do
     comprador é configurável (LIMITE_COMPRADOR).
   - NUMERAÇÃO pela série EF 2026 / RC 2026, um contador por série.
   - VERSÃO em cada encomenda: guardar com uma versão antiga recusa (outra pessoa mudou-a entretanto).
   - RECEÇÃO: aceite + rejeitada não passa do que falta; a rejeitada guarda-se à parte e continua a faltar; cada receção leva uma chave, e repetir o pedido
     com a mesma chave devolve a mesma receção (não duplica); o stock mexe-se só pelo inventário (um sítio).
   - HISTÓRICO: cada ação fica com quem, quando, o quê, e o valor antes e depois.
   Hoje, no protótipo, é sempre segunda-feira, 19 de outubro de 2026.
   ========================================================= */
import type { IdPerfil } from '../inicio-dados';
import { PERFIS } from '../inicio-dados';

export const HOJE = '2026-10-19';
export const LIMITE_COMPRADOR = 1_000_000; // 10 000,00 €, em cêntimos
export const ARMAZEM = 'Armazém 60 · Coimbra';

/* ---------- dinheiro ---------- */
export const euros = (c: number) => (c < 0 ? '−' : '') + (Math.abs(c) / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
/** «12,5» ou «12.50» → 1250 cêntimos; nada de vírgula flutuante no caminho */
export function lerEuros(t: string): number | null {
  let s = t.replace(/\s|€/g, '');
  /* «1.234,50» (português) ou «1234.50»: com vírgula, os pontos são milhares */
  s = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [i, d = ''] = s.split('.');
  return Number(i) * 100 + Number((d + '00').slice(0, 2));
}
/** «5» ou «2,5» % → pontos base */
export function lerPercentagem(t: string): number | null {
  const s = t.replace(/\s|%/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [i, d = ''] = s.split('.'); const v = Number(i) * 100 + Number((d + '00').slice(0, 2));
  return v > 10000 ? null : v;
}
export const pct = (pb: number) => (pb / 100).toLocaleString('pt-PT', { maximumFractionDigits: 2 }) + ' %';
const arred = (n: number, d: number) => Math.floor((n * 2 + d) / (2 * d)); // n/d, meio para cima (n, d ≥ 0, inteiros)

/* ---------- dados mestres (de exemplo; virão da base comum, por decidir) ---------- */
export interface Fornecedor {
  id: string; nome: string; legal: string; nif: string; cidade: string; morada: string; pagamento: string; prazo: number; moeda: 'EUR';
  entrega: string; contacto: { papel: string; correio: string; telefone: string }; ativo: boolean;
}
export const FORNECEDORES: Fornecedor[] = [
  { id: 'skf', nome: 'SKF Portugal', legal: 'SKF Portugal — Rolamentos, Lda.', nif: 'PT 500 000 001', cidade: 'Lisboa', morada: 'Rua de exemplo, 1 · 1000-001 Lisboa', pagamento: '60 dias', prazo: 10, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Encomendas', correio: 'encomendas@skf.exemplo.pt', telefone: '210 000 001' }, ativo: true },
  { id: 'bosch', nome: 'Bosch', legal: 'Bosch Automotive, S.A.', nif: 'PT 500 000 002', cidade: 'Lisboa', morada: 'Av. de exemplo, 2 · 1000-002 Lisboa', pagamento: '30 dias', prazo: 7, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Serviço a clientes', correio: 'aftermarket@bosch.exemplo.pt', telefone: '210 000 002' }, ativo: true },
  { id: 'brembo', nome: 'Brembo', legal: 'Brembo Ibérica, S.L.', nif: 'ES B00000003', cidade: 'Madrid', morada: 'Calle de ejemplo, 3 · 28001 Madrid', pagamento: '60 dias', prazo: 12, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Pedidos', correio: 'pedidos@brembo.exemplo.es', telefone: '+34 910 000 003' }, ativo: true },
  { id: 'trw', nome: 'TRW', legal: 'ZF Aftermarket Portugal, Lda.', nif: 'PT 500 000 004', cidade: 'Porto', morada: 'Rua de exemplo, 4 · 4000-004 Porto', pagamento: '30 dias', prazo: 7, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Encomendas', correio: 'encomendas@trw.exemplo.pt', telefone: '220 000 004' }, ativo: true },
  { id: 'valeo', nome: 'Valeo', legal: 'Valeo Service Portugal, Lda.', nif: 'PT 500 000 005', cidade: 'Lisboa', morada: 'Rua de exemplo, 5 · 1000-005 Lisboa', pagamento: '45 dias', prazo: 7, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Encomendas', correio: 'encomendas@valeo.exemplo.pt', telefone: '210 000 005' }, ativo: true },
  { id: 'gates', nome: 'Gates', legal: 'Gates Europe, BV', nif: 'BE 0000000006', cidade: 'Erembodegem', morada: 'Straat van voorbeeld, 6 · 9320 Erembodegem', pagamento: '60 dias', prazo: 15, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Order desk', correio: 'orders@gates.exemplo.be', telefone: '+32 2 000 00 06' }, ativo: true },
  { id: 'ngk', nome: 'NGK', legal: 'NGK Spark Plug Europe, GmbH', nif: 'DE 000000007', cidade: 'Ratingen', morada: 'Beispielstraße 7 · 40880 Ratingen', pagamento: '30 dias', prazo: 10, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Vendas', correio: 'vendas@ngk.exemplo.de', telefone: '+49 2102 000 007' }, ativo: true },
  /* dois distribuidores de exemplo (19 out., fase 2): cotam artigos de várias marcas, com a referência deles */
  { id: 'rnorte', nome: 'Rolamentos do Norte', legal: 'Rolamentos do Norte, Lda. (exemplo)', nif: 'PT 500 000 009', cidade: 'Braga', morada: 'Rua de exemplo, 9 · 4700-009 Braga', pagamento: '30 dias', prazo: 3, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Comercial', correio: 'comercial@rnorte.exemplo.pt', telefone: '253 000 009' }, ativo: true },
  { id: 'itrans', nome: 'Ibérica de Transmisiones', legal: 'Ibérica de Transmisiones, S.L. (exemplo)', nif: 'ES B00000010', cidade: 'Vigo', morada: 'Calle de ejemplo, 10 · 36201 Vigo', pagamento: '30 dias', prazo: 15, moeda: 'EUR', entrega: 'Portes à parte (EXW)', contacto: { papel: 'Ventas', correio: 'ventas@itrans.exemplo.es', telefone: '+34 986 000 010' }, ativo: true },
  { id: 'ufi', nome: 'UFI Filters', legal: 'UFI Filters Ibérica, S.L.', nif: 'ES B00000008', cidade: 'Barcelona', morada: 'Calle de ejemplo, 8 · 08001 Barcelona', pagamento: '30 dias', prazo: 6, moeda: 'EUR', entrega: 'Entregue no armazém (DAP)', contacto: { papel: 'Pedidos', correio: 'pedidos@ufi.exemplo.es', telefone: '+34 930 000 008' }, ativo: true },
];
export const fornecedor = (id: string) => FORNECEDORES.find((f) => f.id === id);

export interface Artigo { ref: string; desc: string; marca: string; un: string; iva: number; forn: string; refForn: string; preco: number | null; ean: string }
/** iva em pontos base (23 % = 2300); preco em cêntimos, o último preço do fornecedor (null = sem preço) */
export const ARTIGOS: Artigo[] = [
  { ref: '6206-2RSH', desc: 'Rolamento rígido de esferas', marca: 'SKF', un: 'un.', iva: 2300, forn: 'skf', refForn: '6206-2RSH/C3', preco: 412, ean: '7316577001204' },
  { ref: '6205-2Z', desc: 'Rolamento rígido de esferas', marca: 'SKF', un: 'un.', iva: 2300, forn: 'skf', refForn: '6205-2Z/C3', preco: 344, ean: '7316577001211' },
  { ref: '30205', desc: 'Rolamento de rolos cónicos', marca: 'SKF', un: 'un.', iva: 2300, forn: 'skf', refForn: '30205 J2/Q', preco: 1550, ean: '7316577001228' },
  { ref: 'VKBA 6556', desc: 'Kit de rolamento de roda', marca: 'SKF', un: 'un.', iva: 2300, forn: 'skf', refForn: 'VKBA 6556', preco: 4100, ean: '7316577001235' },
  { ref: 'LGMT 2/1', desc: 'Massa lubrificante, 1 kg', marca: 'SKF', un: 'un.', iva: 2300, forn: 'skf', refForn: 'LGMT 2/1', preco: 2500, ean: '7316577001242' },
  { ref: 'GDB1330', desc: 'Pastilhas de travão', marca: 'TRW', un: 'jogo', iva: 2300, forn: 'trw', refForn: 'GDB1330', preco: 1530, ean: '4006633000013' },
  { ref: 'JTE1001', desc: 'Terminal de direção', marca: 'TRW', un: 'un.', iva: 2300, forn: 'trw', refForn: 'JTE1001', preco: 2500, ean: '4006633000020' },
  { ref: 'P 85 020', desc: 'Pastilhas de travão', marca: 'Brembo', un: 'jogo', iva: 2300, forn: 'brembo', refForn: 'P85020', preco: 2300, ean: '8020584000017' },
  { ref: 'P 23 133', desc: 'Pastilhas de travão', marca: 'Brembo', un: 'jogo', iva: 2300, forn: 'brembo', refForn: 'P23133', preco: 2431, ean: '8020584000024' },
  { ref: '09.A727.11', desc: 'Disco de travão', marca: 'Brembo', un: 'un.', iva: 2300, forn: 'brembo', refForn: '09A72711', preco: 4300, ean: '8020584000031' },
  { ref: '0 986 494 524', desc: 'Pastilhas de travão', marca: 'Bosch', un: 'jogo', iva: 2300, forn: 'bosch', refForn: '0986494524', preco: 2760, ean: '4047024000015' },
  { ref: '0 986 424 797', desc: 'Pastilhas de travão (novas na tabela)', marca: 'Bosch', un: 'jogo', iva: 2300, forn: 'bosch', refForn: '0986424797', preco: null, ean: '4047024000039' },
  { ref: '0 242 236 565', desc: 'Vela de ignição', marca: 'Bosch', un: 'un.', iva: 2300, forn: 'bosch', refForn: '0242236565', preco: 614, ean: '4047024000022' },
  { ref: '826210', desc: 'Kit de embraiagem', marca: 'Valeo', un: 'un.', iva: 2300, forn: 'valeo', refForn: '826210', preco: 16078, ean: '3276428000019' },
  { ref: 'K015603XS', desc: 'Kit de distribuição', marca: 'Gates', un: 'un.', iva: 2300, forn: 'gates', refForn: 'K015603XS', preco: 8950, ean: '5414465000018' },
  { ref: '6PK1050', desc: 'Correia trapezoidal estriada', marca: 'Gates', un: 'un.', iva: 2300, forn: 'gates', refForn: '6PK1050', preco: 1290, ean: '5414465000025' },
  { ref: 'BKR6E', desc: 'Vela de ignição', marca: 'NGK', un: 'un.', iva: 2300, forn: 'ngk', refForn: '2756', preco: 395, ean: '0087295000016' },
  { ref: '23.443.00', desc: 'Filtro de óleo', marca: 'UFI', un: 'un.', iva: 2300, forn: 'ufi', refForn: '2344300', preco: 480, ean: '8025021000017' },
  { ref: '27.A44.00', desc: 'Filtro de ar', marca: 'UFI', un: 'un.', iva: 2300, forn: 'ufi', refForn: '27A4400', preco: 720, ean: '8025021000024' },
  { ref: 'GDB2042', desc: 'Pastilhas de travão', marca: 'TRW', un: 'jogo', iva: 2300, forn: 'trw', refForn: 'GDB2042', preco: null, ean: '4006633000037' },
];
export const artigo = (ref: string) => ARTIGOS.find((a) => a.ref === ref);

/* ---------- os documentos ---------- */
export type EstadoEnc = 'Rascunho' | 'A aprovar' | 'Aprovada' | 'Emitida' | 'Parcialmente recebida' | 'Recebida' | 'Fechada' | 'Cancelada';
export interface LinhaEnc { id: string; ref: string; qtd: number; preco: number | null; desc: number; iva: number; entrega: string; recebida: number; rejeitada: number }
export interface Evento { quando: string; quem: string; acao: string; detalhe?: string; doc?: string }
export interface Encomenda {
  ref: string; forn: string; refForn: string; armazem: string; data: string; entrega: string; moeda: 'EUR'; pagamento: string;
  comprador: IdPerfil; criador: IdPerfil; notas: string; estado: EstadoEnc; portes: number; linhas: LinhaEnc[]; historico: Evento[]; versao: number; lembrada?: string;
}
export interface LinhaRec { linha: string; ref: string; aceite: number; rejeitada: number; motivo: string }
export interface Rececao { ref: string; chave: string; enc: string; guia: string; armazem: string; data: string; por: IdPerfil; linhas: LinhaRec[]; notas: string; anulada?: { quando: string; por: IdPerfil; motivo: string } }
export interface Movimento { quando: string; ref: string; qtd: number; armazem: string; origem: string; chave: string }

const L = (id: string, ref: string, qtd: number, preco: number | null, entrega: string, recebida = 0, desc = 0): LinhaEnc => ({ id, ref, qtd, preco, desc, iva: 2300, entrega, recebida, rejeitada: 0 });
export const ev = (quando: string, quem: IdPerfil | 'sistema', acao: string, detalhe?: string, doc?: string): Evento => ({ quando, quem: quem === 'sistema' ? 'Sistema' : PERFIS[quem].pessoa, acao, detalhe, doc });

function semente(): { enc: Encomenda[]; rec: Rececao[]; mov: Movimento[]; series: Record<string, number> } {
  const enc: Encomenda[] = [
    { ref: 'EF 2026/0413', forn: 'bosch', refForn: '', armazem: ARMAZEM, data: '2026-10-12', entrega: '2026-10-26', moeda: 'EUR', pagamento: '30 dias', comprador: 'compras', criador: 'compras', notas: 'Faltam os preços de 4 artigos novos; a Bosch manda a tabela esta semana.', estado: 'Rascunho', portes: 0, versao: 3,
      linhas: [L('a', '0 986 494 524', 40, 2760, '2026-10-26'), L('b', '0 242 236 565', 120, 614, '2026-10-26')],
      historico: [ev('12/10/2026 09:30', 'compras', 'Criou o rascunho'), ev('19/10/2026 08:42', 'compras', 'Alterou a quantidade', '0 242 236 565: 100 → 120')] },
    { ref: 'EF 2026/0412', forn: 'skf', refForn: 'SKF-PO-77812', armazem: ARMAZEM, data: '2026-10-09', entrega: '2026-10-23', moeda: 'EUR', pagamento: '60 dias', comprador: 'compras', criador: 'compras', notas: 'Reposição do mínimo de 6206-2RSH; entrega única.', estado: 'A aprovar', portes: 0, versao: 2,
      linhas: [L('a', '6206-2RSH', 1200, 412, '2026-10-23'), L('b', '6205-2Z', 900, 344, '2026-10-23'), L('c', 'VKBA 6556', 180, 4100, '2026-10-23'), L('d', 'LGMT 2/1', 120, 2500, '2026-10-23')],
      historico: [ev('09/10/2026 10:05', 'compras', 'Criou o rascunho'), ev('09/10/2026 17:20', 'compras', 'Submeteu', 'Acima do limite do comprador (10 000,00 €): vai à Administração')] },
    { ref: 'EF 2026/0411', forn: 'brembo', refForn: 'BR-55120', armazem: ARMAZEM, data: '2026-10-08', entrega: '2026-10-20', moeda: 'EUR', pagamento: '60 dias', comprador: 'compras', criador: 'compras', notas: '', estado: 'Parcialmente recebida', portes: 0, versao: 5,
      linhas: [L('a', 'P 85 020', 120, 2300, '2026-10-16', 120), L('b', '09.A727.11', 60, 4300, '2026-10-16', 60), L('c', 'P 23 133', 40, 2431, '2026-10-20')],
      historico: [ev('08/10/2026 11:00', 'compras', 'Criou o rascunho'), ev('08/10/2026 11:40', 'compras', 'Submeteu', 'Dentro do limite do comprador: aprovada'), ev('08/10/2026 11:41', 'compras', 'Emitiu a encomenda'), ev('16/10/2026 08:55', 'armazem', 'Registou a receção', '2 de 3 linhas', 'RC 2026/0187')] },
    { ref: 'EF 2026/0410', forn: 'ufi', refForn: 'UF-2026-3391', armazem: ARMAZEM, data: '2026-10-07', entrega: '2026-10-14', moeda: 'EUR', pagamento: '30 dias', comprador: 'compras', criador: 'compras', notas: '', estado: 'Recebida', portes: 0, versao: 4,
      linhas: [L('a', '23.443.00', 300, 480, '2026-10-14', 300), L('b', '27.A44.00', 200, 720, '2026-10-14', 200)],
      historico: [ev('07/10/2026 09:10', 'compras', 'Criou o rascunho'), ev('07/10/2026 09:30', 'compras', 'Submeteu', 'Dentro do limite do comprador: aprovada'), ev('07/10/2026 09:31', 'compras', 'Emitiu a encomenda'), ev('12/10/2026 10:20', 'armazem', 'Registou a receção', 'Tudo recebido', 'RC 2026/0185')] },
    { ref: 'EF 2026/0409', forn: 'gates', refForn: 'GT-889120', armazem: ARMAZEM, data: '2026-10-06', entrega: '2026-10-21', moeda: 'EUR', pagamento: '60 dias', comprador: 'compras', criador: 'compras', notas: '', estado: 'Emitida', portes: 2500, versao: 3,
      linhas: [L('a', 'K015603XS', 30, 8950, '2026-10-21'), L('b', '6PK1050', 110, 1290, '2026-10-21')],
      historico: [ev('06/10/2026 14:00', 'compras', 'Criou o rascunho'), ev('06/10/2026 14:30', 'compras', 'Submeteu', 'Dentro do limite do comprador: aprovada'), ev('06/10/2026 14:31', 'compras', 'Emitiu a encomenda')] },
    { ref: 'EF 2026/0408', forn: 'trw', refForn: 'TRW-PT-40018', armazem: ARMAZEM, data: '2026-10-03', entrega: '2026-10-10', moeda: 'EUR', pagamento: '30 dias', comprador: 'compras', criador: 'compras', notas: '', estado: 'Emitida', portes: 0, versao: 3,
      linhas: [L('a', 'GDB1330', 400, 1530, '2026-10-10'), L('b', 'JTE1001', 150, 2500, '2026-10-10')],
      historico: [ev('03/10/2026 10:00', 'compras', 'Criou o rascunho'), ev('03/10/2026 10:20', 'compras', 'Submeteu', 'Dentro do limite do comprador: aprovada'), ev('03/10/2026 10:21', 'compras', 'Emitiu a encomenda')] },
    { ref: 'EF 2026/0407', forn: 'valeo', refForn: 'VL-10077', armazem: ARMAZEM, data: '2026-10-02', entrega: '2026-10-09', moeda: 'EUR', pagamento: '45 dias', comprador: 'compras', criador: 'compras', notas: '', estado: 'Emitida', portes: 0, versao: 3,
      linhas: [L('a', '826210', 20, 16078, '2026-10-09')],
      historico: [ev('02/10/2026 15:00', 'compras', 'Criou o rascunho'), ev('02/10/2026 15:10', 'compras', 'Submeteu', 'Dentro do limite do comprador: aprovada'), ev('02/10/2026 15:11', 'compras', 'Emitiu a encomenda')] },
    { ref: 'EF 2026/0406', forn: 'ngk', refForn: 'NGK-4410', armazem: ARMAZEM, data: '2026-10-01', entrega: '2026-10-08', moeda: 'EUR', pagamento: '30 dias', comprador: 'compras', criador: 'compras', notas: '', estado: 'Fechada', portes: 0, versao: 5,
      linhas: [L('a', 'BKR6E', 368, 395, '2026-10-08', 368)],
      historico: [ev('01/10/2026 09:00', 'compras', 'Criou o rascunho'), ev('01/10/2026 09:05', 'compras', 'Submeteu', 'Dentro do limite do comprador: aprovada'), ev('01/10/2026 09:06', 'compras', 'Emitiu a encomenda'), ev('07/10/2026 16:10', 'armazem', 'Registou a receção', 'Tudo recebido', 'RC 2026/0183'), ev('08/10/2026 09:00', 'compras', 'Fechou a encomenda')] },
    { ref: 'EF 2026/0402', forn: 'brembo', refForn: '', armazem: ARMAZEM, data: '2026-09-29', entrega: '2026-10-20', moeda: 'EUR', pagamento: '60 dias', comprador: 'compras', criador: 'compras', notas: 'Campanha de travões do inverno.', estado: 'A aprovar', portes: 0, versao: 2,
      linhas: [L('a', 'P 85 020', 300, 2300, '2026-10-20'), L('b', '09.A727.11', 120, 4300, '2026-10-20')],
      historico: [ev('29/09/2026 10:00', 'compras', 'Criou o rascunho'), ev('29/09/2026 11:15', 'compras', 'Submeteu', 'Acima do limite do comprador (10 000,00 €): vai à Administração')] },
  ];
  const rec: Rececao[] = [
    { ref: 'RC 2026/0187', chave: 'semente-187', enc: 'EF 2026/0411', guia: 'GR 88213', armazem: ARMAZEM, data: '2026-10-16', por: 'armazem', notas: '', linhas: [{ linha: 'a', ref: 'P 85 020', aceite: 120, rejeitada: 0, motivo: '' }, { linha: 'b', ref: '09.A727.11', aceite: 60, rejeitada: 0, motivo: '' }] },
    { ref: 'RC 2026/0185', chave: 'semente-185', enc: 'EF 2026/0410', guia: 'GR 41020', armazem: ARMAZEM, data: '2026-10-12', por: 'armazem', notas: '', linhas: [{ linha: 'a', ref: '23.443.00', aceite: 300, rejeitada: 0, motivo: '' }, { linha: 'b', ref: '27.A44.00', aceite: 200, rejeitada: 0, motivo: '' }] },
    { ref: 'RC 2026/0183', chave: 'semente-183', enc: 'EF 2026/0406', guia: 'GR 7710', armazem: ARMAZEM, data: '2026-10-07', por: 'armazem', notas: '', linhas: [{ linha: 'a', ref: 'BKR6E', aceite: 368, rejeitada: 0, motivo: '' }] },
  ];
  return { enc, rec, mov: [], series: { 'EF 2026': 413, 'RC 2026': 187 } };
}

/* ---------- a «base de dados» ---------- */
const CHAVE = 'erp:compras:v1';
type Base = ReturnType<typeof semente>;
let base: Base | null = null;
function ler(): Base {
  try { const v = localStorage.getItem(CHAVE); if (v) return JSON.parse(v) as Base; } catch { /* sem armazenamento */ }
  return semente();
}
export function db(): Base { if (!base) base = ler(); return base; }
function gravar(): void { try { localStorage.setItem(CHAVE, JSON.stringify(base)); } catch { /* fica na memória */ } }
/** Outra janela mudou os dados: volta a ler (é assim que se apanha a alteração concorrente). */
export function recarregar(): void { base = ler(); }
export function repor(): void { base = semente(); gravar(); }

/* ---------- consultas ---------- */
export const encomendas = () => db().enc.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const encomenda = (ref: string) => db().enc.find((e) => e.ref === ref);
export const rececoes = () => db().rec.slice().sort((a, b) => b.ref.localeCompare(a.ref));
export const rececao = (ref: string) => db().rec.find((r) => r.ref === ref);
export const rececoesDe = (enc: string) => db().rec.filter((r) => r.enc === enc);
export const atrasada = (e: Encomenda) => (e.estado === 'Emitida' || e.estado === 'Parcialmente recebida') && e.entrega < HOJE;
export const pendente = (l: LinhaEnc) => Math.max(0, l.qtd - l.recebida);
export const dia = (iso: string) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—';
export const diasAtraso = (iso: string) => Math.round((Date.parse(HOJE) - Date.parse(iso)) / 86_400_000);

/** O stock de um artigo no armazém: o de partida (de exemplo) mais os movimentos que as receções criaram. */
const STOCK0: Record<string, number> = { '6206-2RSH': 140, '6205-2Z': 1320, '30205': 20, 'VKBA 6556': 64, 'LGMT 2/1': 85, 'GDB1330': 12, 'JTE1001': 34, 'P 85 020': 210, 'P 23 133': 6, '09.A727.11': 88, '0 986 494 524': 18, '0 242 236 565': 260, '0 986 424 797': 0, '826210': 3, 'K015603XS': 11, '6PK1050': 72, 'BKR6E': 410, '23.443.00': 340, '27.A44.00': 230, 'GDB2042': 0 };
export const stock = (ref: string) => (STOCK0[ref] ?? 0) + db().mov.filter((m) => m.ref === ref).reduce((s, m) => s + m.qtd, 0);
export const aCaminho = (ref: string) => db().enc.filter((e) => ['Emitida', 'Parcialmente recebida'].includes(e.estado)).flatMap((e) => e.linhas).filter((l) => l.ref === ref).reduce((s, l) => s + pendente(l), 0);

/* ---------- os totais ---------- */
export interface Totais { bruto: number; descontos: number; liquido: number; portes: number; base: number; iva: { taxa: number; base: number; valor: number }[]; total: number; semPreco: number }
export function linhaLiquida(l: LinhaEnc): number | null {
  if (l.preco === null) return null;
  const bruto = l.qtd * l.preco;
  return arred(bruto * (10000 - l.desc), 10000);
}
export function totais(e: Pick<Encomenda, 'linhas' | 'portes'>): Totais {
  let bruto = 0, liquido = 0, semPreco = 0;
  const porTaxa = new Map<number, number>();
  for (const l of e.linhas) {
    const liq = linhaLiquida(l);
    if (liq === null) { semPreco++; continue; }
    bruto += l.qtd * l.preco!; liquido += liq;
    porTaxa.set(l.iva, (porTaxa.get(l.iva) ?? 0) + liq);
  }
  /* os portes levam a taxa normal */
  if (e.portes) porTaxa.set(2300, (porTaxa.get(2300) ?? 0) + e.portes);
  const iva = [...porTaxa.entries()].sort((a, b) => b[0] - a[0]).map(([taxa, b]) => ({ taxa, base: b, valor: arred(b * taxa, 10000) }));
  const base_ = liquido + e.portes;
  return { bruto, descontos: bruto - liquido, liquido, portes: e.portes, base: base_, iva, total: base_ + iva.reduce((s, x) => s + x.valor, 0), semPreco };
}

/* ---------- permissões por ação ---------- */
export type Acao = 'ver' | 'criar' | 'editar' | 'submeter' | 'aprovar' | 'rejeitar' | 'emitir' | 'cancelar' | 'fechar' | 'duplicar' | 'receber' | 'lembrar' | 'fornecedores' | 'guias';
export const PODE: Record<Acao, IdPerfil[]> = {
  ver: ['compras', 'armazem', 'financeiro', 'admin'],
  criar: ['compras', 'admin'], editar: ['compras', 'admin'], submeter: ['compras', 'admin'], duplicar: ['compras', 'admin'],
  aprovar: ['admin'], rejeitar: ['admin'],
  emitir: ['compras', 'admin'], cancelar: ['compras', 'admin'], fechar: ['compras', 'admin'], lembrar: ['compras', 'admin'],
  receber: ['armazem', 'admin'],
  fornecedores: ['compras', 'armazem', 'financeiro', 'admin'],
  /* 29 out.: as guias (Compras ▸ Guias: Novo, Editar, Anular), como no ERP antigo — as Compras também as registam */
  guias: ['compras', 'armazem', 'admin'],
};
export const pode = (p: IdPerfil, a: Acao) => PODE[a].includes(p);

/** As ações que a encomenda deixa fazer agora a este perfil, já com as regras (quem criou não aprova…). */
export function acoesDe(e: Encomenda, p: IdPerfil): Acao[] {
  const r: Acao[] = [];
  const algo = e.linhas.some((l) => l.recebida > 0);
  if (e.estado === 'Rascunho' && pode(p, 'editar')) r.push('submeter');
  if (e.estado === 'A aprovar' && pode(p, 'aprovar') && e.criador !== p) r.push('aprovar', 'rejeitar');
  if (e.estado === 'Aprovada' && pode(p, 'emitir')) r.push('emitir');
  if ((e.estado === 'Emitida' || e.estado === 'Parcialmente recebida') && pode(p, 'receber')) r.push('receber');
  if (atrasada(e) && pode(p, 'lembrar')) r.push('lembrar');
  if ((e.estado === 'Recebida' || e.estado === 'Parcialmente recebida') && pode(p, 'fechar')) r.push('fechar');
  if ((['Rascunho', 'A aprovar', 'Aprovada'].includes(e.estado) || (e.estado === 'Emitida' && !algo)) && pode(p, 'cancelar')) r.push('cancelar');
  if (pode(p, 'duplicar')) r.push('duplicar');
  return r;
}

/* ---------- as operações (o que no produto é um pedido à API) ---------- */
export class Recusa extends Error { constructor(msg: string, readonly tipo: 'validacao' | 'permissao' | 'conflito' | 'estado' = 'validacao') { super(msg); } }
export const agora = () => { const d = new Date(); return `19/10/2026 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const proximo = (serie: string) => { const b = db(); b.series[serie] = (b.series[serie] ?? 0) + 1; return `${serie}/${String(b.series[serie]).padStart(4, '0')}`; };

/** Valida uma encomenda antes de a submeter (o rascunho pode estar incompleto). */
export function problemas(e: Pick<Encomenda, 'forn' | 'linhas' | 'entrega'>): string[] {
  const p: string[] = [];
  if (!e.forn) p.push('Escolhe o fornecedor.');
  if (!e.linhas.length) p.push('Junta pelo menos um artigo.');
  e.linhas.forEach((l) => {
    if (!Number.isInteger(l.qtd) || l.qtd <= 0) p.push(`${l.ref}: a quantidade tem de ser um número inteiro maior do que zero.`);
    if (l.preco === null) p.push(`${l.ref}: falta o preço (o fornecedor não tem preço para este artigo).`);
  });
  if (e.entrega && e.entrega < HOJE) p.push('A entrega prevista já passou.');
  return p;
}

export function criar(p: IdPerfil, forn: string, linhas: LinhaEnc[] = []): Encomenda {
  if (!pode(p, 'criar')) throw new Recusa('O teu perfil não cria encomendas.', 'permissao');
  const f = fornecedor(forn); if (!f) throw new Recusa('Escolhe o fornecedor.');
  if (!f.ativo) throw new Recusa(`${f.nome} está inativo: não recebe encomendas novas.`);
  const entrega = somarDias(HOJE, f.prazo);
  const e: Encomenda = { ref: proximo('EF 2026'), forn, refForn: '', armazem: ARMAZEM, data: HOJE, entrega, moeda: 'EUR', pagamento: f.pagamento, comprador: p, criador: p, notas: '', estado: 'Rascunho', portes: 0, versao: 1, linhas, historico: [ev(agora(), p, 'Criou o rascunho')] };
  db().enc.push(e); gravar();
  return e;
}
export function somarDias(iso: string, n: number): string { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

/** Guarda o rascunho; recusa se a versão que se editou já não é a última (outra pessoa guardou entretanto). */
export function guardar(p: IdPerfil, nova: Encomenda, versao: number): Encomenda {
  recarregar();
  const atual = encomenda(nova.ref); if (!atual) throw new Recusa('A encomenda já não existe.', 'estado');
  if (!pode(p, 'editar')) throw new Recusa('O teu perfil não altera encomendas.', 'permissao');
  if (atual.estado !== 'Rascunho') throw new Recusa(`A encomenda está «${atual.estado}»: só um rascunho se altera.`, 'estado');
  if (atual.versao !== versao) throw new Recusa('Alguém guardou esta encomenda depois de a abrires.', 'conflito');
  const mud = diferencas(atual, nova);
  if (!mud.length) return atual;
  Object.assign(atual, { forn: nova.forn, refForn: nova.refForn, entrega: nova.entrega, notas: nova.notas, portes: nova.portes, pagamento: nova.pagamento, linhas: nova.linhas.map((l) => ({ ...l })) });
  atual.versao++;
  atual.historico.push(...mud.map((m) => ev(agora(), p, m[0], m[1])));
  gravar();
  return atual;
}
function diferencas(a: Encomenda, b: Encomenda): [string, string][] {
  const r: [string, string][] = [];
  if (a.forn !== b.forn) r.push(['Mudou o fornecedor', `${fornecedor(a.forn)?.nome} → ${fornecedor(b.forn)?.nome}`]);
  if (a.entrega !== b.entrega) r.push(['Mudou a entrega prevista', `${dia(a.entrega)} → ${dia(b.entrega)}`]);
  if (a.refForn !== b.refForn) r.push(['Mudou a referência do fornecedor', `${a.refForn || '—'} → ${b.refForn || '—'}`]);
  if (a.portes !== b.portes) r.push(['Mudou os portes', `${euros(a.portes)} → ${euros(b.portes)}`]);
  if (a.notas !== b.notas) r.push(['Mudou as notas', '']);
  const ia = new Map(a.linhas.map((l) => [l.id, l]));
  b.linhas.forEach((l) => {
    const o = ia.get(l.id);
    if (!o) { r.push(['Juntou um artigo', `${l.ref} · ${l.qtd}`]); return; }
    if (o.qtd !== l.qtd) r.push(['Alterou a quantidade', `${l.ref}: ${o.qtd} → ${l.qtd}`]);
    if (o.preco !== l.preco) r.push(['Alterou o preço', `${l.ref}: ${o.preco === null ? 'sem preço' : euros(o.preco)} → ${l.preco === null ? 'sem preço' : euros(l.preco)}`]);
    if (o.desc !== l.desc) r.push(['Alterou o desconto', `${l.ref}: ${pct(o.desc)} → ${pct(l.desc)}`]);
    if (o.entrega !== l.entrega) r.push(['Alterou a entrega da linha', `${l.ref}: ${dia(o.entrega)} → ${dia(l.entrega)}`]);
  });
  a.linhas.forEach((l) => { if (!b.linhas.some((x) => x.id === l.id)) r.push(['Tirou um artigo', `${l.ref} · ${l.qtd}`]); });
  return r;
}

/** Uma transição de estado. Só as de TRANSICOES; o resto recusa. */
export function transitar(p: IdPerfil, ref: string, acao: Acao, motivo = ''): Encomenda {
  recarregar();
  const e = encomenda(ref); if (!e) throw new Recusa('A encomenda já não existe.', 'estado');
  if (!acoesDe(e, p).includes(acao)) {
    if (acao === 'aprovar' && e.criador === p) throw new Recusa('Quem criou a encomenda não a aprova.', 'permissao');
    throw new Recusa(`Não é possível ${NOME_ACAO[acao].toLowerCase()} uma encomenda «${e.estado}» com o teu perfil.`, pode(p, acao) ? 'estado' : 'permissao');
  }
  const antes = e.estado;
  const t = totais(e);
  switch (acao) {
    case 'submeter': {
      const pr = problemas(e); if (pr.length) throw new Recusa(pr.join(' '));
      if (t.base > LIMITE_COMPRADOR) { e.estado = 'A aprovar'; e.historico.push(ev(agora(), p, 'Submeteu', `Acima do limite do comprador (${euros(LIMITE_COMPRADOR)}): vai à Administração`)); }
      else { e.estado = 'Aprovada'; e.historico.push(ev(agora(), p, 'Submeteu', 'Dentro do limite do comprador: aprovada')); }
      break;
    }
    case 'aprovar': e.estado = 'Aprovada'; e.historico.push(ev(agora(), p, 'Aprovou', `${euros(t.base)} s/ IVA`)); break;
    case 'rejeitar': if (!motivo.trim()) throw new Recusa('Diz porque rejeitas: o comprador precisa de saber.'); e.estado = 'Rascunho'; e.historico.push(ev(agora(), p, 'Rejeitou', motivo.trim())); break;
    case 'emitir': e.estado = 'Emitida'; e.historico.push(ev(agora(), p, 'Emitiu a encomenda', 'Documento pronto a enviar ao fornecedor')); break;
    case 'cancelar': if (!motivo.trim()) throw new Recusa('Diz porque cancelas.'); e.estado = 'Cancelada'; e.historico.push(ev(agora(), p, 'Cancelou', motivo.trim())); break;
    case 'fechar':
      if (e.estado === 'Parcialmente recebida' && !motivo.trim()) throw new Recusa('Ainda falta mercadoria: diz porque fechas.');
      e.estado = 'Fechada'; e.historico.push(ev(agora(), p, 'Fechou a encomenda', motivo.trim() || undefined)); break;
    case 'lembrar': e.lembrada = HOJE; e.historico.push(ev(agora(), p, 'Registou um lembrete ao fornecedor', `Entrega prevista a ${dia(e.entrega)}; ${diasAtraso(e.entrega)} dias de atraso`)); break;
    default: throw new Recusa('Ação desconhecida.');
  }
  if (antes !== e.estado) e.historico[e.historico.length - 1].detalhe = `${e.historico[e.historico.length - 1].detalhe ? e.historico[e.historico.length - 1].detalhe + ' · ' : ''}${antes} → ${e.estado}`;
  e.versao++; gravar();
  return e;
}
export const NOME_ACAO: Record<Acao, string> = {
  ver: 'Ver', criar: 'Criar', editar: 'Alterar', submeter: 'Submeter', aprovar: 'Aprovar', rejeitar: 'Rejeitar', emitir: 'Emitir', cancelar: 'Cancelar',
  fechar: 'Fechar', duplicar: 'Duplicar', receber: 'Registar receção', lembrar: 'Lembrar fornecedor', fornecedores: 'Ver fornecedores', guias: 'Registar guias',
};

/** Uma nota no histórico de uma encomenda (outro documento que a criou ou a refere). */
export function anotar(ref: string, quem: IdPerfil, acao: string, detalhe?: string, doc?: string): void {
  const e = encomenda(ref); if (!e) return;
  e.historico.push(ev(agora(), quem, acao, detalhe, doc)); gravar();
}

export function duplicar(p: IdPerfil, ref: string): Encomenda {
  const o = encomenda(ref); if (!o) throw new Recusa('A encomenda já não existe.', 'estado');
  const linhas = o.linhas.map((l, i) => { const a = artigo(l.ref); return { ...l, id: String.fromCharCode(97 + i), preco: a?.preco ?? l.preco, recebida: 0, rejeitada: 0, entrega: '' }; });
  const n = criar(p, o.forn, linhas);
  n.linhas.forEach((l) => { l.entrega = n.entrega; });
  n.historico[0].detalhe = `A partir da ${o.ref}, com os preços de hoje`;
  gravar();
  return n;
}

/* ---------- a receção ---------- */
/** Regista uma receção. Mesma chave → a mesma receção (um segundo clique, ou repetir o pedido, não duplica). */
export function receber(p: IdPerfil, o: { chave: string; enc: string; guia: string; notas: string; linhas: { linha: string; aceite: number; rejeitada: number; motivo: string }[] }, acao: Acao = 'receber'): { rec: Rececao; repetida: boolean } {
  recarregar();
  const ja = db().rec.find((r) => r.chave === o.chave); if (ja) return { rec: ja, repetida: true };
  if (!pode(p, acao)) throw new Recusa(acao === 'guias' ? 'O teu perfil não regista guias.' : 'O teu perfil não regista receções.', 'permissao');
  const e = encomenda(o.enc); if (!e) throw new Recusa('A encomenda já não existe.', 'estado');
  if (!['Emitida', 'Parcialmente recebida'].includes(e.estado)) throw new Recusa(`A encomenda está «${e.estado}»: não recebe mercadoria.`, 'estado');
  if (!o.guia.trim()) throw new Recusa('Escreve o número da guia do fornecedor.');
  const linhas = o.linhas.filter((x) => x.aceite > 0 || x.rejeitada > 0);
  if (!linhas.length) throw new Recusa('Não há quantidades recebidas.');
  for (const x of linhas) {
    const l = e.linhas.find((y) => y.id === x.linha)!;
    if (!Number.isInteger(x.aceite) || !Number.isInteger(x.rejeitada) || x.aceite < 0 || x.rejeitada < 0) throw new Recusa(`${l.ref}: as quantidades são números inteiros.`);
    if (x.aceite + x.rejeitada > pendente(l)) throw new Recusa(`${l.ref}: recebes ${x.aceite + x.rejeitada}, mas só faltam ${pendente(l)}. A mais não se recebe sem autorização.`);
    if (x.rejeitada > 0 && !x.motivo) throw new Recusa(`${l.ref}: diz porque rejeitas ${x.rejeitada}.`);
  }
  const rec: Rececao = { ref: proximo('RC 2026'), chave: o.chave, enc: e.ref, guia: o.guia.trim(), armazem: e.armazem, data: HOJE, por: p, notas: o.notas, linhas: linhas.map((x) => ({ ...x, ref: e.linhas.find((y) => y.id === x.linha)!.ref })) };
  /* tudo ou nada: a receção, as quantidades da encomenda e os movimentos de stock entram juntos */
  for (const x of linhas) {
    const l = e.linhas.find((y) => y.id === x.linha)!;
    /* só a aceite conta como recebida: a rejeitada fica à parte e continua a faltar (o fornecedor manda outra vez) */
    l.recebida += x.aceite; l.rejeitada += x.rejeitada;
    if (x.aceite) inventarioEntrada(l.ref, x.aceite, e.armazem, rec.ref, `${rec.chave}:${x.linha}`);
  }
  const tudo = e.linhas.every((l) => pendente(l) === 0);
  const antes = e.estado;
  e.estado = tudo ? 'Recebida' : 'Parcialmente recebida';
  e.historico.push(ev(agora(), p, 'Registou a receção', `${linhas.length} de ${e.linhas.length} linhas · ${antes} → ${e.estado}`, rec.ref));
  e.versao++;
  db().rec.push(rec); gravar();
  return { rec, repetida: false };
}
/** 29 out. (Guias: Editar F6): o número da guia do fornecedor e as notas corrigem-se; as quantidades não — para isso anula-se. */
export function corrigirGuia(p: IdPerfil, ref: string, guia: string, notas: string): Rececao {
  recarregar();
  if (!pode(p, 'guias')) throw new Recusa('O teu perfil não altera guias.', 'permissao');
  const r = db().rec.find((x) => x.ref === ref); if (!r) throw new Recusa('A guia já não existe.', 'estado');
  if (r.anulada) throw new Recusa(`A guia ${r.guia} está anulada: não se altera.`, 'estado');
  if (!guia.trim()) throw new Recusa('Escreve o número da guia do fornecedor.');
  const antes = r.guia; r.guia = guia.trim(); r.notas = notas;
  const e = encomenda(r.enc); if (e) { e.historico.push(ev(agora(), p, 'Corrigiu a guia', antes !== r.guia ? `${antes} → ${r.guia}` : 'As notas', r.ref)); e.versao++; }
  gravar(); return r;
}
/** 29 out. (Guias: Anular F8): desfaz a guia inteira — as quantidades saem da encomenda, o stock sai pelo inventário
    (movimentos de sentido contrário, idempotentes pela chave) e a encomenda volta ao estado certo. A guia fica, anulada. */
export function anularGuia(p: IdPerfil, ref: string, motivo: string): Rececao {
  recarregar();
  if (!pode(p, 'guias')) throw new Recusa('O teu perfil não anula guias.', 'permissao');
  const r = db().rec.find((x) => x.ref === ref); if (!r) throw new Recusa('A guia já não existe.', 'estado');
  if (r.anulada) throw new Recusa(`A guia ${r.guia} já foi anulada.`, 'estado');
  if (!motivo.trim()) throw new Recusa('Diz porque se anula: fica no histórico.');
  const e = encomenda(r.enc); if (!e) throw new Recusa('A encomenda desta guia já não existe.', 'estado');
  for (const x of r.linhas) {
    const l = e.linhas.find((y) => y.id === x.linha); if (!l) continue;
    l.recebida = Math.max(0, l.recebida - x.aceite); l.rejeitada = Math.max(0, l.rejeitada - x.rejeitada);
    if (x.aceite) inventarioEntrada(l.ref, -x.aceite, r.armazem, r.ref, `${r.chave}:anular:${x.linha}`);
  }
  const antes = e.estado;
  e.estado = e.linhas.every((l) => pendente(l) === 0) ? 'Recebida' : e.linhas.some((l) => l.recebida > 0) ? 'Parcialmente recebida' : 'Emitida';
  e.historico.push(ev(agora(), p, 'Anulou a guia', `${r.guia} · ${motivo.trim()} · ${antes} → ${e.estado}`, r.ref)); e.versao++;
  r.anulada = { quando: agora(), por: p, motivo: motivo.trim() };
  gravar(); return r;
}
/** O inventário: o único sítio que mexe no stock. Idempotente pela chave. */
function inventarioEntrada(ref: string, qtd: number, armazem: string, origem: string, chave: string): void {
  if (db().mov.some((m) => m.chave === chave)) return;
  db().mov.push({ quando: agora(), ref, qtd, armazem, origem, chave });
}
export const movimentosDe = (origem: string) => db().mov.filter((m) => m.origem === origem);

/* ---------- desempenho do fornecedor (com os dados do protótipo) ---------- */
export function desempenho(forn: string) {
  const es = db().enc.filter((e) => e.forn === forn && e.estado !== 'Cancelada' && e.estado !== 'Rascunho');
  const recs = db().rec.filter((r) => es.some((e) => e.ref === r.enc));
  const entregues = recs.map((r) => ({ r, e: es.find((e) => e.ref === r.enc)! }));
  const aTempo = entregues.filter(({ r, e }) => r.data <= e.entrega).length;
  const abertas = es.filter((e) => ['A aprovar', 'Aprovada', 'Emitida', 'Parcialmente recebida'].includes(e.estado));
  const comprado = es.reduce((s, e) => s + totais(e).base, 0);
  return { encomendas: es.length, abertas: abertas.length, receções: recs.length, aTempo, atrasadas: es.filter(atrasada).length, comprado };
}

/** A lista de encomendas em CSV (ponto e vírgula, como o Excel em português espera). */
export function csv(lista: Encomenda[]): string {
  const linhas = [['Encomenda', 'Fornecedor', 'Data', 'Entrega prevista', 'Estado', 'Linhas', 'Base (s/ IVA)', 'IVA', 'Total']];
  lista.forEach((e) => { const t = totais(e); linhas.push([e.ref, fornecedor(e.forn)?.nome ?? '', dia(e.data), dia(e.entrega), atrasada(e) ? `${e.estado} (atrasada)` : e.estado, String(e.linhas.length), (t.base / 100).toFixed(2).replace('.', ','), ((t.total - t.base) / 100).toFixed(2).replace('.', ','), (t.total / 100).toFixed(2).replace('.', ',')]); });
  return '﻿' + linhas.map((l) => l.map((c) => /[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(';')).join('\r\n');
}
