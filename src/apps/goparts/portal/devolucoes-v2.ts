/* =========================================================
   PEÇA A PEÇA — 16 · Devoluções v2 (26 nov. 2026)
   Briefing «Redesign de Faturas e Devoluções»: o motor comum (portal/historico.ts) e a «Nova devolução» em quatro
   passos (comportamento/devolucao-nova.ts). Só os estados que os dados têm: Por enviar, Enviada, Creditada — nada
   de «em análise», «aprovada» ou «recebida», que o sistema não regista. O acompanhamento mostra os eventos que
   existem (criada, enviada, nota de crédito emitida) com as datas; o que ainda não aconteceu fica por fazer, e a
   aprovação é da Romafe (não se promete). Os motivos não estão configurados no sistema: o motivo escreve-se.
   Artigos elegíveis = os das guias de remessa da conta, menos o que já está noutras devoluções dessa guia.
   As devoluções criadas aqui ficam no navegador (num servidor, seriam as da conta).
   ========================================================= */
import { historicoHtml, esc, dataCurta, selo, secao, pares, ligacao, type Estado, type Registo, type Historico } from './historico';
import { L } from './inicio-espaco';
import { DEVOLUCOES, estadoDev, NOME_ESTADO, type Devolucao } from './devolucoes-dados';
import { GUIAS } from './guias-dados';
import pencil from 'lucide-static/icons/pencil-line.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import receiptText from 'lucide-static/icons/receipt-text.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import clipboardList from 'lucide-static/icons/clipboard-list.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import x from 'lucide-static/icons/x.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';

const I = (raw: string) => L(raw);
export const CHAVE_DEV_NOVAS = 'goparts:devolucoes-novas:v1';
/** As devoluções da conta: as de exemplo e as criadas neste navegador. */
export function todasDevolucoes(): Devolucao[] {
  let novas: Devolucao[] = [];
  try { novas = JSON.parse(localStorage.getItem(CHAVE_DEV_NOVAS) || '[]'); } catch { /* sem armazenamento */ }
  return [...novas, ...DEVOLUCOES];
}
const estado = (d: Devolucao): Estado => {
  const e = estadoDev(d);
  return e === 'creditada' ? { k: e, nome: NOME_ESTADO[e], tom: 'ok', icone: I(receiptText) } : e === 'enviada' ? { k: e, nome: NOME_ESTADO[e], tom: 'curso', icone: I(send) } : { k: e, nome: NOME_ESTADO[e], tom: 'atencao', icone: I(pencil) };
};
const proxima = (d: Devolucao) => ({ rascunho: 'Falta enviar à Romafe', enviada: 'A aguardar a resposta da Romafe', creditada: 'Concluída: nota de crédito emitida' }[estadoDev(d)]);

/** Os artigos que ainda se podem devolver de uma guia: o servido menos o que já está noutras devoluções dela. */
export function elegiveis(guia: string, devs = todasDevolucoes()): { desc: string; max: number }[] {
  const g = GUIAS.find((x) => x.num === guia); if (!g || g.tipo !== 'fatura') return [];
  return g.linhas.map(([q, desc]) => ({ desc, max: q - devs.filter((d) => d.origem === guia).reduce((s, d) => s + d.linhas.filter((l) => l[1] === desc).reduce((a, l) => a + l[0], 0), 0) })).filter((a) => a.max > 0);
}

function detalhe(d: Devolucao): string {
  const e = estadoDev(d), g = GUIAS.find((x) => x.num === d.origem), nc = d.credito ? GUIAS.find((x) => x.num === d.credito) : undefined;
  const passos: [string, string, string][] = [
    ['Criada', d.criada, `por ${esc(d.utilizador)}`],
    ['Enviada à Romafe', d.enviada, e === 'rascunho' ? 'Ainda não foi enviada.' : ''],
    ['Nota de crédito emitida', nc ? nc.data : '', nc ? `${esc(nc.doc)} · a Romafe creditou os artigos` : e === 'enviada' ? 'A aprovação e o crédito são da Romafe.' : ''],
  ];
  const ultimo = passos.reduce((k, p, i) => (p[1] ? i : k), 0);
  const docs = [
    g ? ligacao('guias', 'goparts:abrir-guia', g.num, `<b>${g.num}</b><small>Guia de onde vêm os artigos</small>`, I(fileText)) : '',
    g ? ligacao('pedidos', 'goparts:abrir-pedido', g.pedido, `<b>${g.pedido}</b><small>Pedido original</small>`, I(clipboardList)) : '',
    g ? ligacao('faturas', 'goparts:abrir-fatura', g.doc, `<b>${g.doc}</b><small>Fatura dos artigos</small>`, I(receiptText)) : '',
    nc ? ligacao('faturas', 'goparts:abrir-fatura', nc.doc, `<b>${nc.doc}</b><small>Nota de crédito</small>`, I(receiptText)) : '',
  ].join('');
  return secao('Estado', `<div class="hx__estados-g">${selo(estado(d), 'hx__estado--forte')}</div><p class="hx__semdados">${proxima(d)}.</p>`)
    + secao('Acompanhamento', `<ol class="hx__passos">${passos.map(([n, q, t], i) => `<li class="${!q ? 'is-por' : i === ultimo && e !== 'creditada' ? 'is-ultimo' : ''}"><i aria-hidden="true"></i><div><b>${n}</b>${t ? `<span>${t}</span>` : ''}</div><time>${q ? esc(q) : '—'}</time></li>`).join('')}</ol>`)
    + secao('Devolução', pares([['Criada', dataCurta(d.criada)], ['Guia de origem', esc(d.origem)], ['Pedido', g ? esc(g.pedido) : ''], ['Motivo', esc(d.obs)]]))
    + secao('Artigos', `<table class="hx__artigos"><thead><tr><th scope="col">Artigo</th><th scope="col" class="hx__num">Qtd.</th></tr></thead><tbody>${d.linhas.map(([q, desc]) => `<tr><td>${esc(desc)}</td><td class="hx__num">${q}</td></tr>`).join('')}</tbody></table>`)
    + secao('Documentos relacionados', `<div class="hx__docs">${docs}</div>`);
}

/** A «Nova devolução»: um diálogo com quatro passos (o comportamento está em comportamento/devolucao-nova.ts). */
function novaHtml(): string {
  const guias = GUIAS.filter((g) => g.tipo === 'fatura' && elegiveis(g.num).length);
  const PASSOS = ['Guia ou pedido', 'Artigos', 'Motivo', 'Confirmar'];
  return `<dialog class="hx__gaveta dvn" data-dvn aria-labelledby="dvn-t">
    <form class="hx__gaveta-caixa dvn__caixa" data-dvn-form novalidate>
      <header class="hx__gaveta-topo"><h2 id="dvn-t" class="hx__gaveta-t dvn__t">Nova devolução</h2><button type="button" class="hx__fechar" data-dvn-fechar aria-label="Fechar">${I(x)}</button></header>
      <ol class="dvn__passos" aria-label="Passos">${PASSOS.map((p, i) => `<li data-dvn-p="${i}"${i === 0 ? ' aria-current="step"' : ''}><span>${i + 1}</span>${p}</li>`).join('')}</ol>
      <div class="hx__gaveta-corpo dvn__corpo">
        <fieldset class="dvn__passo" data-dvn-passo="0"><legend class="hx__sec-t">De que entrega vêm os artigos?</legend>
          <p class="hx__semdados">Só aparecem as guias de remessa com artigos que ainda se podem devolver.</p>
          <div class="dvn__guias">${guias.map((g) => `<label class="dvn__guia"><input type="radio" name="dvn-guia" value="${g.num}"><span><b>${g.num}</b><small>${dataCurta(g.data)} · Pedido ${g.pedido} · ${elegiveis(g.num).length} artigos elegíveis</small></span></label>`).join('')}</div>
        </fieldset>
        <fieldset class="dvn__passo" data-dvn-passo="1" hidden><legend class="hx__sec-t">Que artigos e quantas unidades?</legend><div data-dvn-artigos></div></fieldset>
        <fieldset class="dvn__passo" data-dvn-passo="2" hidden><legend class="hx__sec-t">Qual é o motivo?</legend>
          <label class="dvn__rotulo" for="dvn-motivo">Motivo <small>(a Romafe lê-o; obrigatório)</small></label>
          <textarea id="dvn-motivo" class="dvn__texto" rows="4" maxlength="300" data-dvn-motivo placeholder="Ex.: peça errada, chegou danificada, não serve no veículo"></textarea>
          <p class="hx__aviso-l">${I(info)}<span>Os motivos não estão configurados no sistema: escreva-o como o explicaria ao balcão.</span></p>
        </fieldset>
        <section class="dvn__passo" data-dvn-passo="3" hidden aria-labelledby="dvn-r-t"><h3 class="hx__sec-t" id="dvn-r-t">Confirme antes de submeter</h3><div data-dvn-resumo></div>
          <p class="hx__aviso-l">${I(info)}<span>Submeter envia o pedido de devolução à Romafe. A aprovação, a receção dos artigos e o crédito são da Romafe e aparecem aqui quando acontecerem.</span></p></section>
        <p class="dvn__erro" data-dvn-erro role="alert"></p>
      </div>
      <footer class="dvn__pe"><button type="button" class="btn hx__btn" data-dvn-voltar hidden>${L(arrowLeft, 'btn__icone')}<span class="btn__rotulo">Voltar</span></button>
        <button type="submit" class="btn btn--acao dvn__seguir" data-dvn-seguir>${L(arrowRight, 'btn__icone')}<span class="btn__rotulo">Seguinte</span></button></footer>
    </form>
  </dialog>`;
}

export function devolucoesV2(): string {
  const devs = todasDevolucoes();
  const registos: Registo[] = devs.map((d) => {
    const e = estado(d), g = GUIAS.find((x) => x.num === d.origem), n = d.linhas.reduce((s, l) => s + l[0], 0);
    return {
      id: d.num, data: d.criada,
      meta: `${dataCurta(d.criada)} · ${g ? `Pedido ${esc(g.pedido)} · ` : ''}${n} ${n === 1 ? 'unidade' : 'unidades'}`,
      nota: esc(d.obs),
      principal: e, outros: [{ rotulo: 'Próximo passo', estado: { k: 'p', nome: proxima(d), tom: 'neutro', icone: '' } }],
      filtros: { estado: e.k },
      procura: `${d.num} ${d.origem} ${g?.pedido ?? ''} ${d.obs} ${d.linhas.map((l) => l[1]).join(' ')}`,
      detalhe: detalhe(d),
    };
  });
  const conta = (k: string) => registos.filter((r) => r.principal.k === k).length;
  const h: Historico = {
    chave: 'devolucoes', titulo: 'Devoluções', sub: 'Acompanha os teus pedidos de devolução e consulta o estado de cada processo.',
    resumo: [['Devoluções', registos.length], ['Por enviar', conta('rascunho')], ['Enviadas', conta('enviada')], ['Creditadas', conta('creditada')]],
    procura: 'Pesquisar devolução, guia, pedido ou artigo', um: 'devolução', varios: 'devoluções', rotuloAbrir: 'Ver detalhes',
    filtros: [{ k: 'estado', rotulo: 'Estado', opcoes: [['rascunho', 'Por enviar'], ['enviada', 'Enviada'], ['creditada', 'Creditada']] }],
    colunas: [
      { rotulo: 'Devolução', html: (r) => esc(r.id), ordenar: (r) => r.id },
      { rotulo: 'Criada', html: (r) => dataCurta(r.data), ordenar: (r) => r.data.split('/').reverse().join('') },
      { rotulo: 'Pedido / unidades', html: (r) => r.meta.split(' · ').slice(1).join(' · ') },
      { rotulo: 'Estado', html: (r) => selo(r.principal), ordenar: (r) => r.principal.nome },
      { rotulo: 'Próximo passo', html: (r) => r.outros[0].estado.nome },
    ],
    registos,
  };
  return historicoHtml(h)
    .replace('<dl class="hx__resumo">', `<button type="button" class="btn btn--acao dvn__nova" data-dvn-abrir>${L(plus, 'btn__icone')}<span class="btn__rotulo">Nova devolução</span></button><dl class="hx__resumo">`)
    .replace('<p class="sr-only" role="status"', `${novaHtml()}<p class="sr-only" role="status"`);
}
