/* =========================================================
   PEÇA A PEÇA — 12 · Os meus pedidos v6 (26 nov. 2026)
   Briefing «Redesign premium do Histórico de pedidos». O motor é o comum (portal/historico.ts). Três estados
   separados, todos tirados dos dados: o da ENCOMENDA (do percurso: em preparação, pronto a levantar, expedido em
   parte, concluído), o PROCESSAMENTO (processado / sem processamento) e a MODALIDADE (entrega / levantamento no
   balcão). O painel tem o percurso com as horas reais, os artigos pedidos e servidos, a entrega e os documentos
   que existem (guia, fatura, devoluções feitas a partir da guia) — nada de seguimento nem documentos inventados.
   ========================================================= */
import { historicoHtml, esc, dataCurta, selo, secao, pares, ligacao, type Estado, type Registo, type Historico } from './historico';
import { L } from './inicio-espaco';
import { LINHAS, PEDIDOS, euros, type Pedido, type LinhaPedido } from './pedidos-dados';
import { DEVOLUCOES } from './devolucoes-dados';
import check from 'lucide-static/icons/check.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import cog from 'lucide-static/icons/cog.svg?raw';
import pause from 'lucide-static/icons/circle-pause.svg?raw';
import store from 'lucide-static/icons/store.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';

const I = (raw: string) => L(raw);
/** O estado da encomenda pelo último passo do percurso que já aconteceu (o mesmo critério da v5). */
export function estadoEncomenda(p: Pedido): Estado {
  const n = p.percurso.length, ultimo = p.percurso.reduce((k, s, i) => (s[1] ? i : k), 0), feito = p.percurso[ultimo][0];
  if (p.percurso[n - 1][1]) return { k: 'concluido', nome: 'Concluído', tom: 'ok', icone: I(check) };
  if (/Expedido/i.test(feito)) return { k: 'expedido', nome: /parte/i.test(feito) ? 'Expedido em parte' : 'Expedido', tom: 'curso', icone: I(truck) };
  if (/levantar/i.test(feito)) return { k: 'recolher', nome: 'Pronto a levantar', tom: 'atencao', icone: I(packageCheck) };
  if (/Separado/i.test(feito)) return { k: 'preparado', nome: 'Preparado', tom: 'curso', icone: I(pkg) };
  return { k: 'preparacao', nome: 'Em preparação', tom: 'atencao', icone: I(clock) };
}
const processamento = (l: LinhaPedido): Estado => (l.estado === 'proc' ? { k: 'proc', nome: 'Processado', tom: 'ok', icone: I(cog) } : { k: 'sem', nome: 'Sem processamento', tom: 'neutro', icone: I(pause) });
const modalidade = (l: LinhaPedido): Estado => (l.recolher ? { k: 'recolha', nome: 'Levantamento no balcão', tom: 'neutro', icone: I(store) } : { k: 'entrega', nome: 'Entrega', tom: 'neutro', icone: I(truck) });
const valorDe = (p: Pedido) => p.artigos.reduce((s, a) => s + a[3], 0);
const unidades = (p: Pedido) => p.artigos.reduce((s, a) => s + a[0], 0);

function detalhe(p: Pedido, l: LinhaPedido): string {
  const e = estadoEncomenda(p), ultimo = p.percurso.reduce((k, s, i) => (s[1] ? i : k), 0);
  const faltas = p.artigos.filter((a) => a[1] < a[0]);
  const devs = p.guia ? DEVOLUCOES.filter((d) => d.origem === p.guia) : [];
  const docs = [
    p.guia ? ligacao('guias', 'goparts:abrir-guia', p.guia, `<b>${p.guia}</b><small>Guia de remessa</small>`, I(fileText)) : '',
    p.fatura ? ligacao('faturas', 'goparts:abrir-fatura', p.fatura, `<b>${p.fatura}</b><small>Fatura</small>`, I(receipt)) : '',
    ...devs.map((d) => ligacao('devolucoes', 'goparts:abrir-devolucao', d.num, `<b>${d.num}</b><small>Devolução · ${esc(d.obs)}</small>`, I(undo))),
  ].join('');
  return secao('Estado', `<div class="hx__estados-g">${selo(e, 'hx__estado--forte')}${selo(processamento(l))}${selo(modalidade(l))}</div>
      <ol class="hx__passos">${p.percurso.map(([nome, q, nota], i) => `<li class="${!q ? 'is-por' : i === ultimo && e.k !== 'concluido' ? 'is-ultimo' : ''}"><i aria-hidden="true"></i><div><b>${esc(nome)}</b>${nota ? `<span>${esc(nota)}</span>` : ''}</div><time>${q ? esc(q) : '—'}</time></li>`).join('')}</ol>`)
    + secao('Pedido', pares([['Data', dataCurta(l.data)], ['Conta', 'Fernando F. França · Porto'], ['Armazém', esc(l.armazem)], ['Observações', l.obs ? esc(l.obs) : '']]))
    + secao(`Artigos · ${unidades(p)} un.`, `<table class="hx__artigos"><thead><tr><th scope="col">Artigo</th><th scope="col" class="hx__num">Pedido</th><th scope="col" class="hx__num">Servido</th><th scope="col" class="hx__num">Preço un.</th><th scope="col" class="hx__num">Total</th></tr></thead>
        <tbody>${p.artigos.map(([q, s, d, t]) => `<tr><td>${esc(d)}</td><td class="hx__num">${q}</td><td class="hx__num${s < q ? ' is-falta' : ''}">${s}</td><td class="hx__num">${euros(t / q)}</td><td class="hx__num">${euros(t)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="4">Total sem IVA</td><td class="hx__num">${euros(valorDe(p))}</td></tr></tfoot></table>
        ${faltas.length ? `<p class="hx__aviso-l">${I(info)}<span>${faltas.map((a) => `${a[0] - a[1]} × ${esc(a[2])}`).join(', ')} ainda por servir.</span></p>` : ''}`)
    + secao(l.recolher ? 'Levantamento' : 'Entrega', pares(l.recolher ? [['Onde', `Balcão do armazém ${esc(l.armazem)}`]] : [['Morada', `${esc(l.morada[0])}<br>${esc(l.morada[1])}`], ['Sai de', `Armazém ${esc(l.armazem)}`]]))
    + secao('Documentos', docs ? `<div class="hx__docs">${docs}</div>` : '<p class="hx__semdados">Ainda sem guia nem fatura: o pedido não saiu do armazém.</p>');
}

export function pedidosV6(): string {
  const registos: Registo[] = LINHAS.map((l) => {
    const p = PEDIDOS.find((x) => x.num === l.num)!, e = estadoEncomenda(p), pr = processamento(l), m = modalidade(l), n = p.artigos.length;
    return {
      id: p.num, data: l.data,
      meta: `${dataCurta(l.data)} · ${n} ${n === 1 ? 'artigo' : 'artigos'} · ${esc(l.armazem.replace(/\s*\(\d+\)/, ''))}`,
      nota: l.obs ? esc(l.obs) : undefined,
      principal: e, outros: [{ rotulo: 'Processamento', estado: pr }, { rotulo: 'Modalidade', estado: m }],
      valor: euros(valorDe(p)), valorRotulo: 'sem IVA',
      filtros: { estado: e.k, proc: pr.k, modo: m.k },
      procura: `${p.num} ${p.guia ?? ''} ${p.fatura ?? ''} ${p.artigos.map((a) => a[2]).join(' ')}`,
      detalhe: detalhe(p, l),
    };
  });
  const emCurso = registos.filter((r) => r.principal.k !== 'concluido').length;
  const estados = [...new Map(registos.map((r) => [r.principal.k, r.principal.nome])).entries()];
  const h: Historico = {
    chave: 'pedidos', titulo: 'Os meus pedidos', sub: 'Consulta o histórico, acompanha o estado e acede aos detalhes das tuas encomendas.',
    resumo: [['Pedidos', registos.length], ['Em curso', emCurso], ['Concluídos', registos.length - emCurso]],
    procura: 'Pesquisar pelo n.º do pedido, guia, fatura ou artigo', um: 'pedido', varios: 'pedidos', rotuloAbrir: 'Ver detalhes',
    filtros: [
      { k: 'estado', rotulo: 'Estado', opcoes: estados },
      { k: 'proc', rotulo: 'Processamento', opcoes: [['proc', 'Processado'], ['sem', 'Sem processamento']] },
      { k: 'modo', rotulo: 'Modalidade', opcoes: [['entrega', 'Entrega'], ['recolha', 'Levantamento no balcão']] },
    ],
    colunas: [
      { rotulo: 'Pedido', html: (r) => esc(r.id), ordenar: (r) => r.id },
      { rotulo: 'Data', html: (r) => dataCurta(r.data), ordenar: (r) => r.data.split('/').reverse().join('') },
      { rotulo: 'Artigos', html: (r) => r.meta.split(' · ')[1].replace(/\D+$/, ''), ordenar: (r) => Number(r.meta.split(' · ')[1].replace(/\D+/g, '')), num: true },
      { rotulo: 'Local / modalidade', html: (r) => `${r.meta.split(' · ')[2]} · ${r.outros[1].estado.nome}` },
      { rotulo: 'Estado', html: (r) => selo(r.principal), ordenar: (r) => r.principal.nome },
      { rotulo: 'Processamento', html: (r) => selo(r.outros[0].estado), ordenar: (r) => r.outros[0].estado.nome },
      { rotulo: 'Total', html: (r) => r.valor ?? '', ordenar: (r) => Number((r.valor ?? '0').replace(/[^\d,]/g, '').replace(',', '.')), num: true },
    ],
    registos,
  };
  return historicoHtml(h);
}
