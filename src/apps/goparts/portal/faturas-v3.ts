/* =========================================================
   PEÇA A PEÇA — 14 · Faturas v3 (26 nov. 2026)
   Briefing «Redesign de Faturas e Devoluções»: o motor comum (portal/historico.ts). Dois tipos de documento, os
   que os dados têm: Fatura e Nota de crédito (um documento próprio, com valor negativo e a ligação à devolução e
   à guia de onde vieram os artigos). O estado do pagamento vem dos dados (paga, em aberto, vencida; a nota de
   crédito está creditada) — nada se deduz só por existir a fatura. O resumo separa o faturado, o que está em
   aberto (com o vencido à parte) e os créditos. O painel tem os valores (base, IVA, total), o pagamento, os
   artigos e as ligações reais (pedido, guia, devoluções, notas de crédito do mesmo pedido).
   ========================================================= */
import { historicoHtml, esc, dataCurta, selo, secao, pares, ligacao, type Estado, type Registo, type Historico } from './historico';
import { L } from './inicio-espaco';
import { FATURAS, type Fatura } from './faturas-dados';
import { base, iva, total, euros } from './guias-dados';
import { PEDIDOS } from './pedidos-dados';
import { DEVOLUCOES } from './devolucoes-dados';
import check from 'lucide-static/icons/check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import alert from 'lucide-static/icons/circle-alert.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import receiptText from 'lucide-static/icons/receipt-text.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import clipboardList from 'lucide-static/icons/clipboard-list.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';

const I = (raw: string) => L(raw);
export function pagamento(f: Fatura): Estado {
  switch (f.pagamento) {
    case 'paga': return { k: 'paga', nome: f.pagaEm ? `Paga a ${f.pagaEm}` : 'Paga', tom: 'ok', icone: I(check) };
    case 'aberto': return { k: 'aberto', nome: `Em aberto · vence a ${f.vencimento}`, tom: 'atencao', icone: I(clock) };
    case 'vencida': return { k: 'vencida', nome: `Vencida a ${f.vencimento}`, tom: 'erro', icone: I(alert) };
    default: return { k: 'creditada', nome: 'Crédito emitido', tom: 'neutro', icone: I(receiptText) };
  }
}
const tipo = (f: Fatura): Estado => (f.guia.tipo === 'credito' ? { k: 'nc', nome: 'Nota de crédito', tom: 'neutro', icone: I(receiptText) } : { k: 'ft', nome: 'Fatura', tom: 'neutro', icone: I(receipt) });

function detalhe(f: Fatura): string {
  const g = f.guia, nc = g.tipo === 'credito', p = PEDIDOS.find((x) => x.num === g.pedido);
  const devs = DEVOLUCOES.filter((d) => d.origem === g.num || d.credito === g.num);
  const outrasNc = nc ? [] : FATURAS.filter((x) => x.guia.tipo === 'credito' && x.guia.pedido === g.pedido);
  const docs = [
    p ? ligacao('pedidos', 'goparts:abrir-pedido', g.pedido, `<b>${g.pedido}</b><small>Pedido</small>`, I(clipboardList)) : '',
    ligacao('guias', 'goparts:abrir-guia', g.num, `<b>${g.num}</b><small>${nc ? 'Guia de devolução' : 'Guia de remessa'}</small>`, I(fileText)),
    ...devs.map((d) => ligacao('devolucoes', 'goparts:abrir-devolucao', d.num, `<b>${d.num}</b><small>Devolução · ${esc(d.obs)}</small>`, I(undo))),
    ...outrasNc.map((x) => ligacao('faturas', 'goparts:abrir-fatura', x.num, `<b>${x.num}</b><small>Nota de crédito do mesmo pedido · ${euros(total(x.guia))}</small>`, I(receiptText))),
  ].join('');
  const pago = f.pagamento === 'paga' ? total(g) : 0;
  return secao('Documento', `<div class="hx__estados-g">${selo(pagamento(f), 'hx__estado--forte')}${selo(tipo(f))}</div>` + pares([['Data', dataCurta(g.data)], ['Cliente', 'Fernando F. França · Porto'], ['Vencimento', nc ? '' : f.vencimento], ['Observações', g.obs && g.obs !== '—' ? esc(g.obs) : '']]))
    + secao('Valores', `<dl class="hx__somas"><div><dt>Bruto</dt><dd>${euros(g.bruto)}</dd></div><div><dt>Desconto</dt><dd>${euros(-g.desconto)}</dd></div>${g.embalagens ? `<div><dt>Embalagens</dt><dd>${euros(g.embalagens)}</dd></div>` : ''}${g.portes ? `<div><dt>Portes</dt><dd>${euros(g.portes)}</dd></div>` : ''}
        <div><dt>Base tributável</dt><dd>${euros(base(g))}</dd></div><div><dt>IVA 23 %</dt><dd>${euros(iva(g))}</dd></div><div class="is-total"><dt>Total</dt><dd>${euros(total(g))}</dd></div>
        ${nc ? '' : `<div><dt>Pago</dt><dd>${euros(pago)}</dd></div><div><dt>Por pagar</dt><dd>${euros(total(g) - pago)}</dd></div>`}</dl>`)
    + secao('Artigos', `<table class="hx__artigos"><thead><tr><th scope="col">Artigo</th><th scope="col" class="hx__num">Qtd.</th><th scope="col" class="hx__num">Preço un.</th><th scope="col" class="hx__num">Valor</th></tr></thead>
        <tbody>${g.linhas.map(([q, d, v]) => `<tr><td>${esc(d)}</td><td class="hx__num">${q}</td><td class="hx__num">${euros(v / q)}</td><td class="hx__num">${euros(v)}</td></tr>`).join('')}</tbody></table>`)
    + secao('Documentos relacionados', `<div class="hx__docs">${docs}</div>`)
    + `<div class="hx__acoes"><button type="button" class="btn btn--acao" data-hx-imprimir="${esc(f.num)}">${L(printer, 'btn__icone')}<span class="btn__rotulo">Imprimir ou guardar em PDF</span></button></div>`;
}

export function faturasV3(): string {
  const registos: Registo[] = FATURAS.map((f) => {
    const g = f.guia, pg = pagamento(f), tp = tipo(f);
    return {
      id: f.num, data: g.data,
      meta: `${dataCurta(g.data)} · Pedido ${esc(g.pedido)}`,
      nota: `${tp.nome} · guia ${esc(g.num)}`,
      principal: pg, outros: [{ rotulo: 'Tipo', estado: tp }],
      valor: euros(total(g)), valorRotulo: 'com IVA',
      filtros: { tipo: tp.k, pagamento: pg.k },
      procura: `${f.num} ${g.pedido} ${g.num} ${g.linhas.map((l) => l[1]).join(' ')}`,
      detalhe: detalhe(f),
    };
  });
  const ft = FATURAS.filter((f) => f.guia.tipo === 'fatura'), nc = FATURAS.filter((f) => f.guia.tipo === 'credito');
  const soma = (fs: Fatura[]) => fs.reduce((s, f) => s + total(f.guia), 0);
  const emAberto = ft.filter((f) => f.pagamento === 'aberto' || f.pagamento === 'vencida'), vencidas = ft.filter((f) => f.pagamento === 'vencida');
  const h: Historico = {
    chave: 'faturas', titulo: 'Faturas', sub: 'Consulta os teus documentos de faturação, valores e movimentos associados.',
    resumo: [['Documentos', FATURAS.length], ['Faturado', euros(soma(ft))], ['Em aberto', euros(soma(emAberto))], ['Dos quais vencido', euros(soma(vencidas))], ['Créditos', euros(soma(nc))]],
    procura: 'Pesquisar documento, pedido, guia ou artigo', um: 'documento', varios: 'documentos', rotuloAbrir: 'Ver documento',
    filtros: [
      { k: 'tipo', rotulo: 'Tipo', opcoes: [['ft', 'Fatura'], ['nc', 'Nota de crédito']] },
      { k: 'pagamento', rotulo: 'Pagamento', opcoes: [['paga', 'Paga'], ['aberto', 'Em aberto'], ['vencida', 'Vencida'], ['creditada', 'Crédito emitido']] },
    ],
    colunas: [
      { rotulo: 'Documento', html: (r) => esc(r.id), ordenar: (r) => r.id },
      { rotulo: 'Data', html: (r) => dataCurta(r.data), ordenar: (r) => r.data.split('/').reverse().join('') },
      { rotulo: 'Tipo', html: (r) => r.outros[0].estado.nome, ordenar: (r) => r.outros[0].estado.nome },
      { rotulo: 'Pedido', html: (r) => r.meta.split('Pedido ')[1], ordenar: (r) => r.meta.split('Pedido ')[1] },
      { rotulo: 'Pagamento', html: (r) => selo(r.principal), ordenar: (r) => r.principal.k },
      { rotulo: 'Valor', html: (r) => r.valor ?? '', ordenar: (r) => Number((r.valor ?? '0').replace(/[^\d,−]/g, '').replace('−', '-').replace(',', '.')), num: true },
    ],
    registos,
  };
  return historicoHtml(h);
}

