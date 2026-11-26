/* =========================================================
   PEÇA A PEÇA — 13 · Guias de remessa v4 (26 nov. 2026)
   Briefing «Redesign das Guias de remessa»: o mesmo motor dos Pedidos v6 (portal/historico.ts). Separados:
   o TIPO de guia (de remessa, ou de devolução — a que acompanha uma nota de crédito), o ESTADO DA ENTREGA (só o
   que o percurso do pedido diz: entregue, em entrega; sem pedido na conta, «sem registo de entrega») e o
   DOCUMENTO FINANCEIRO associado (fatura ou nota de crédito), que é um documento próprio com ligação. O valor é
   o da guia (base sem IVA e total com IVA, dos dados da guia), não o do pedido. Ligações reais: pedido, fatura ou
   nota de crédito, devoluções feitas a partir da guia e a guia de origem de uma devolução creditada.
   ========================================================= */
import { historicoHtml, esc, dataCurta, selo, secao, pares, ligacao, type Estado, type Registo, type Historico } from './historico';
import { L } from './inicio-espaco';
import { GUIAS, base, iva, total, euros, type Guia } from './guias-dados';
import { PEDIDOS } from './pedidos-dados';
import { DEVOLUCOES } from './devolucoes-dados';
import check from 'lucide-static/icons/check.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import circleDashed from 'lucide-static/icons/circle-dashed.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import receiptText from 'lucide-static/icons/receipt-text.svg?raw';
import clipboardList from 'lucide-static/icons/clipboard-list.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';

const I = (raw: string) => L(raw);
/** O estado da entrega pelo percurso do pedido (o critério da v3); a guia de devolução tem o seu. */
export function estadoEntrega(g: Guia): Estado {
  if (g.tipo === 'credito') return { k: 'devolucao', nome: 'Devolução', tom: 'neutro', icone: I(undo) };
  const p = PEDIDOS.find((x) => x.num === g.pedido && x.guia === g.num);
  if (!p) return { k: 'sem-registo', nome: 'Sem registo de entrega', tom: 'neutro', icone: I(circleDashed) };
  const fim = p.percurso[p.percurso.length - 1];
  return /Entregue/i.test(fim[0]) && fim[1] ? { k: 'entregue', nome: 'Entregue', tom: 'ok', icone: I(check) } : { k: 'em-entrega', nome: 'Em entrega', tom: 'curso', icone: I(truck) };
}
const tipoGuia = (g: Guia): Estado => (g.tipo === 'credito' ? { k: 'devolucao', nome: 'Guia de devolução', tom: 'neutro', icone: I(undo) } : { k: 'remessa', nome: 'Guia de remessa', tom: 'neutro', icone: I(fileText) });
const docFin = (g: Guia): Estado => (g.tipo === 'credito' ? { k: 'nc', nome: `Nota de crédito ${g.doc}`, tom: 'neutro', icone: I(receiptText) } : { k: 'ft', nome: `Fatura ${g.doc}`, tom: 'neutro', icone: I(receipt) });

function detalhe(g: Guia): string {
  const e = estadoEntrega(g), p = PEDIDOS.find((x) => x.num === g.pedido);
  const partes = GUIAS.filter((x) => x.pedido === g.pedido && x.tipo === 'fatura');
  const devs = DEVOLUCOES.filter((d) => d.origem === g.num), daDev = DEVOLUCOES.find((d) => d.credito === g.num);
  const docs = [
    p ? ligacao('pedidos', 'goparts:abrir-pedido', g.pedido, `<b>${g.pedido}</b><small>Pedido de origem</small>`, I(clipboardList)) : '',
    ligacao('faturas', 'goparts:abrir-fatura', g.doc, `<b>${g.doc}</b><small>${g.tipo === 'credito' ? 'Nota de crédito' : 'Fatura'}</small>`, I(g.tipo === 'credito' ? receiptText : receipt)),
    ...devs.map((d) => ligacao('devolucoes', 'goparts:abrir-devolucao', d.num, `<b>${d.num}</b><small>Devolução feita a partir desta guia · ${esc(d.obs)}</small>`, I(undo))),
    daDev ? ligacao('devolucoes', 'goparts:abrir-devolucao', daDev.num, `<b>${daDev.num}</b><small>A devolução que esta guia credita</small>`, I(undo)) : '',
    daDev ? ligacao('guias', 'goparts:abrir-guia', daDev.origem, `<b>${daDev.origem}</b><small>A guia de onde vieram os artigos</small>`, I(fileText)) : '',
  ].join('');
  return secao('Documento', `<div class="hx__estados-g">${selo(e, 'hx__estado--forte')}${selo(tipoGuia(g))}</div>` + pares([['Emitida', dataCurta(g.data)], ['Pedido', esc(g.pedido)], ['Documento financeiro', esc(g.doc)], ['Observações', g.obs && g.obs !== '—' ? esc(g.obs) : '']]))
    + (partes.length > 1 ? `<p class="hx__aviso-l">${I(info)}<span>O pedido ${esc(g.pedido)} saiu em ${partes.length} guias: ${partes.map((x) => esc(x.num)).join(', ')}.</span></p>` : '')
    + secao(g.tipo === 'credito' ? 'Origem' : 'Destino', pares([['Cliente', 'Fernando F. França · Porto'], [g.tipo === 'credito' ? 'Recebida em' : 'Morada', `${esc(g.morada[0])}<br>${esc(g.morada[1])}`], ['Armazém', esc(g.armazem)]]))
    + secao('Artigos', `<table class="hx__artigos"><thead><tr><th scope="col">Artigo</th><th scope="col" class="hx__num">Qtd.</th><th scope="col" class="hx__num">Valor líquido</th></tr></thead>
        <tbody>${g.linhas.map(([q, d, v]) => `<tr><td>${esc(d)}</td><td class="hx__num">${q}</td><td class="hx__num">${euros(v)}</td></tr>`).join('')}</tbody></table>
        <dl class="hx__somas"><div><dt>Base (sem IVA)</dt><dd>${euros(base(g))}</dd></div><div><dt>IVA 23 %</dt><dd>${euros(iva(g))}</dd></div><div class="is-total"><dt>Total com IVA</dt><dd>${euros(total(g))}</dd></div></dl>`)
    + secao('Documentos relacionados', `<div class="hx__docs">${docs}</div>`)
    + `<div class="hx__acoes"><button type="button" class="btn btn--acao" data-hx-imprimir="${esc(g.num)}">${L(printer, 'btn__icone')}<span class="btn__rotulo">Imprimir ou guardar em PDF</span></button></div>`;
}

export function guiasV4(): string {
  const registos: Registo[] = GUIAS.map((g) => {
    const e = estadoEntrega(g);
    return {
      id: g.num, data: g.data,
      meta: `${dataCurta(g.data)} · Pedido ${esc(g.pedido)}`,
      nota: `${esc(g.armazem)} · ${esc(g.morada[0])}`,
      principal: e, outros: [{ rotulo: 'Tipo', estado: tipoGuia(g) }, { rotulo: 'Documento', estado: docFin(g) }],
      valor: euros(total(g)), valorRotulo: 'com IVA',
      filtros: { estado: e.k, tipo: tipoGuia(g).k, destino: g.armazem },
      procura: `${g.num} ${g.pedido} ${g.doc} ${g.linhas.map((l) => l[1]).join(' ')}`,
      detalhe: detalhe(g),
    };
  });
  const conta = (k: string) => registos.filter((r) => r.principal.k === k).length;
  const estados = [...new Map(registos.map((r) => [r.principal.k, r.principal.nome])).entries()];
  const h: Historico = {
    chave: 'guias', titulo: 'Guias de remessa', sub: 'Consulta documentos, acompanha entregas e acede aos pedidos associados.',
    resumo: [['Guias', registos.length], ['Entregues', conta('entregue')], ['Em entrega', conta('em-entrega')], ['Devoluções', conta('devolucao')]],
    procura: 'Pesquisar guia, pedido, fatura ou artigo', um: 'guia', varios: 'guias', rotuloAbrir: 'Ver guia',
    filtros: [
      { k: 'estado', rotulo: 'Estado', opcoes: estados },
      { k: 'tipo', rotulo: 'Tipo', opcoes: [['remessa', 'Guia de remessa'], ['devolucao', 'Guia de devolução']] },
      { k: 'destino', rotulo: 'Armazém', opcoes: [...new Set(GUIAS.map((g) => g.armazem))].map((a) => [a, a]) },
    ],
    colunas: [
      { rotulo: 'Guia', html: (r) => esc(r.id), ordenar: (r) => r.id },
      { rotulo: 'Data', html: (r) => dataCurta(r.data), ordenar: (r) => r.data.split('/').reverse().join('') },
      { rotulo: 'Pedido', html: (r) => r.meta.split('Pedido ')[1], ordenar: (r) => r.meta.split('Pedido ')[1] },
      { rotulo: 'Destino', html: (r) => r.nota ?? '' },
      { rotulo: 'Estado', html: (r) => selo(r.principal), ordenar: (r) => r.principal.nome },
      { rotulo: 'Documento', html: (r) => selo(r.outros[1].estado) },
      { rotulo: 'Valor', html: (r) => r.valor ?? '', ordenar: (r) => Number((r.valor ?? '0').replace(/[^\d,−-]/g, '').replace('−', '-').replace(',', '.')), num: true },
    ],
    registos,
  };
  return historicoHtml(h);
}
