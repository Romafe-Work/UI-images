/* =========================================================
   ERP — 18 · Orçamentos a Fornecedores v2 (26 out. 2026), do briefing dela «Gestão de Orçamentos a Fornecedores V2» e do
   print do ERP antigo (Compras ▸ Orçamentos). A v1 (os pedidos de cotação da fase 2) fica como estava.
   No ERP antigo um orçamento é de um fornecedor: Número, Data, T.Enc., Fornecedor, Descrição, Transferido, Anulado,
   Moeda, Valor, Utilizador de inserção e de alteração; «Transferir p/ Encomenda» (Ctrl+F2) e Anexos. No protótipo os
   orçamentos vivem nos pedidos de cotação (compras/dominio2.ts): cada orçamento é um fornecedor convidado de um pedido,
   e as regras são as de lá —
     - Transferir (Ctrl+F2) = escolher a proposta: cria a encomenda em rascunho, o pedido fica Decidido e mais nenhum
       orçamento dele se transfere (não há transferências repetidas); a encomenda guarda a origem;
     - Editar (F6): no rascunho, os artigos, os prazos e a descrição; enviado, registar ou corrigir a resposta do
       fornecedor (preços, descontos, validade, prazo, portes); decidido ou anulado, só se vê;
     - Anular (F8) = cancelar o pedido, com o motivo; no protótipo anula-se o pedido inteiro, e diz-se;
     - O tipo de encomenda não existe no protótipo: a coluna fica, com «—».
   Motor: compras/docs-v2.ts e docs-v2-comportamento.ts.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha } from './docs-v2';
import { toast, dialogo, fecharDialogo, tudo, abrirDoc, ativoDe, quieto, nf, emSeparador } from './docs-v2-comportamento';
import { cotacoes, cotacao, acoesPc, avaliar, caducada, criarPc, guardarPc, responderPc, cancelarPc, escolher, problemasPc, pode2, type Cotacao, type Oferta } from './dominio2';
import { ARTIGOS, FORNECEDORES, fornecedor, artigo, euros, dia, pct, lerEuros, lerPercentagem, somarDias, HOJE, Recusa } from './dominio';
import { PERFIS } from '../inicio-dados';
import scale from 'lucide-static/icons/scale.svg?raw';
import arrowRL from 'lucide-static/icons/arrow-right-left.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import link from 'lucide-static/icons/link.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import external from 'lucide-static/icons/external-link.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';

/* ---------- as linhas: um orçamento por fornecedor de cada pedido ---------- */
const nomeF = (id: string) => fornecedor(id)?.nome ?? id;
const pessoa = (p: string) => PERFIS[p as keyof typeof PERFIS]?.pessoa ?? p;
function linhas(e: EstDoc): Doc[] {
  return cotacoes().flatMap((c) => c.fornecedores.map((f): Doc => {
    const o = c.ofertas.find((x) => x.forn === f), a = o ? avaliar(c, o) : undefined, ultimo = c.historico[c.historico.length - 1];
    const anulado = c.estado === 'Cancelado' || e.extra.anuladoSim === `${c.ref}|${f}`;
    return { id: `${c.ref}|${f}`, ref: c.ref, numero: c.ref, n: c.ref.split(' ')[1] ?? c.ref, serie: c.ref.split('/')[0], data: c.data, tipo: '', forn: f, fornNome: nomeF(f),
      desc: c.notas || (c.origem.length ? `Da ${c.origem.join(', ')} · ${c.linhas.length} ${c.linhas.length === 1 ? 'artigo' : 'artigos'}` : `${c.linhas.length} ${c.linhas.length === 1 ? 'artigo' : 'artigos'}`),
      transferido: c.escolhido === f && !!c.encomenda, enc: c.escolhido === f ? c.encomenda ?? '' : '', anulado, moeda: 'EUR', valor: a ? a.total : null,
      resposta: !o ? 'sem' : caducada(o) ? 'caducada' : 'ok', estadoPc: c.estado, uIns: pessoa(c.comprador), uAlt: ultimo ? ultimo.quem : pessoa(c.comprador) };
  }));
}
const c_ = (d: Doc) => cotacao(String(d.ref))!;
const oferta = (d: Doc) => c_(d)?.ofertas.find((o) => o.forn === d.forn);

/* ---------- a configuração ---------- */
const COLS: CfgDoc['cols'] = [
  { k: 'numero', t: 'Número', tipo: 'mono', w: 130, presa: true, antiga: true },
  { k: 'data', t: 'Data', tipo: 'data', w: 100, antiga: true },
  { k: 'tipo', t: 'Tipo de encomenda', tipo: 'txt', w: 130, antiga: true },
  { k: 'forn', t: 'Fornecedor', tipo: 'mono', w: 100, antiga: true },
  { k: 'fornNome', t: 'Nome do fornecedor', tipo: 'txt', w: 170 },
  { k: 'desc', t: 'Descrição', tipo: 'txt', w: 260, antiga: true },
  { k: 'estado', t: 'Estado', tipo: 'estado', w: 210 },
  { k: 'transferido', t: 'Transferido', tipo: 'sim', w: 176, antiga: true },
  { k: 'anulado', t: 'Anulado', tipo: 'sim', w: 90, antiga: true },
  { k: 'moeda', t: 'Moeda', tipo: 'txt', w: 70, antiga: true },
  { k: 'valor', t: 'Valor', tipo: 'eur', w: 120, antiga: true },
  { k: 'uIns', t: 'Utilizador de inserção', tipo: 'txt', w: 160, antiga: true },
  { k: 'uAlt', t: 'Utilizador de alteração', tipo: 'txt', w: 160, antiga: true },
];
const badge = (cls: string, ic: string, t: string, title = '') => `<span class="lf2-b ${cls}"${title ? ` title="${esc(title)}"` : ''}>${L(ic)}${t}</span>`;
function celula(d: Doc, k: string): string {
  switch (k) {
    case 'numero': return `<span class="lf2-art"><b>${esc(String(d.numero))}</b></span>`;
    case 'data': return dia(String(d.data));
    case 'tipo': return '<span class="is-nada" title="O protótipo ainda não tem tipos de encomenda">—</span>';
    case 'estado': return `<span class="lf2-badges">${d.anulado ? badge('lf2-b--rutura', ban, 'Anulado') : d.transferido ? badge('lf2-b--pend', circleCheck, 'Transferido') : badge('lf2-b--enc', arrowRL, 'Por transferir')}${d.resposta === 'sem' ? badge('lf2-b--baixo', clock, 'Sem resposta') : d.resposta === 'caducada' ? badge('lf2-b--baixo', circleAlert, 'Proposta caducada') : ''}</span>`;
    case 'transferido': return d.transferido ? `<span class="dv2-sim">${L(check)}<b>Sim</b> <small class="is-mono">${esc(String(d.enc))}</small></span>` : '<span class="is-nada">—</span>';
    case 'anulado': return d.anulado ? `<span class="dv2-sim dv2-sim--nao">${L(ban)}<b>Sim</b></span>` : '<span class="is-nada">—</span>';
    case 'valor': return d.valor === null ? '<span class="is-nada" title="O fornecedor ainda não respondeu">sem resposta</span>' : `${euros(d.valor as number)}`;
    default: return esc(String(d[k] ?? '')) || '<span class="is-nada">—</span>';
  }
}
function valor(d: Doc, k: string): string | number {
  if (k === 'estado') return d.anulado ? 'Anulado' : d.transferido ? 'Transferido' : 'Por transferir';
  if (k === 'transferido' || k === 'anulado') return d[k] ? 'Sim' : '';
  if (k === 'valor') return d.valor === null ? '' : d.valor as number;
  return (d[k] as string | number) ?? '';
}
/** Porque não se transfere (vazio = pode). As mesmas regras de dominio2.escolher. */
function porqueTransferir(e: EstDoc, d: Doc | undefined): string {
  if (!d) return 'Escolhe um orçamento na lista.';
  if (!pode2(e.perfil, 'pc-gerir')) return 'O teu perfil não transfere orçamentos.';
  const c = c_(d), o = oferta(d);
  if (d.anulado) return 'O orçamento está anulado.';
  if (d.transferido) return `Já foi transferido para a ${d.enc}.`;
  if (c.estado === 'Decidido') return `O pedido ${c.ref} já foi decidido: transferiu-se o orçamento de ${nomeF(c.escolhido ?? '')} para a ${c.encomenda}.`;
  if (!o) return `${nomeF(String(d.forn))} ainda não respondeu: regista a resposta primeiro (Editar, F6).`;
  if (caducada(o)) return `A proposta caducou a ${dia(o.validade)}: pede uma nova.`;
  if (!acoesPc(c, e.perfil).includes('escolher')) return `Um pedido «${c.estado}» não se transfere.`;
  return '';
}
function editavel(e: EstDoc, d: Doc | undefined): 'rascunho' | 'resposta' | '' { if (!d) return ''; const a = acoesPc(c_(d), e.perfil); return a.includes('editar') ? 'rascunho' : a.includes('responder') ? 'resposta' : ''; }

/* ---------- o painel do orçamento escolhido ---------- */
const dd = (t: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${t}</dt><dd>${v}</dd></div>`;
const docBtn = (rota: string, ref: string, ecra: string, t: string, ic = fileText) => `<button type="button" class="dv2-doc" data-dv2-acao="abrir-doc" data-rota="${rota}" data-titulo="${esc(ref)}" data-ecra="${ecra}">${L(ic)}<span><small>${t}</small><b class="is-mono">${esc(ref)}</b></span>${L(external)}</button>`;
function painel(e: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  const c = c_(d), o = oferta(d), f = fornecedor(String(d.forn)), a = o ? avaliar(c, o) : undefined;
  if (tab === '_alvo') return `<b>${esc(String(d.numero))}</b><span>${esc(String(d.fornNome))} · ${c.linhas.length} ${c.linhas.length === 1 ? 'artigo' : 'artigos'}${d.valor !== null ? ` · ${euros(d.valor as number)} s/ IVA` : ''}</span><span class="lf2-insp-ir"><button type="button" class="ak-btn" data-dk-janela="fornecedor:${esc(String(d.forn))}">${L(building)}<span>${esc(String(d.fornNome))}</span></button></span>`;
  if (tab === 'detalhes') {
    const t = porqueTransferir(e, d);
    return `${e.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(e.recusa)}</p>` : ''}
      <div class="dv2-estado-faixa ${d.anulado ? 'is-anulado' : d.transferido ? 'is-ok' : t ? 'is-espera' : 'is-pronto'}">${d.anulado ? `${L(ban)}<span><b>Anulado.</b> Fica no histórico; não se transfere nem se altera.</span>` : d.transferido ? `${L(circleCheck)}<span><b>Transferido para a ${esc(String(d.enc))}.</b> A encomenda guarda a origem.</span>${docBtn('compras.encomenda', String(d.enc), 'compras-encomenda', 'Encomenda', link)}` : t ? `${L(clock)}<span><b>Por transferir.</b> ${esc(t)}</span>` : `${L(arrowRL)}<span><b>Pronto a transferir.</b> Ctrl+F2 cria a encomenda em rascunho para ${esc(String(d.fornNome))}.</span>`}</div>
      <dl class="lf2-dl dv2-dl">${dd('Número', `<b class="is-mono">${esc(c.ref)}</b>`)}${dd('Data', dia(c.data))}${dd('Fornecedor', `${esc(String(d.fornNome))}<small>Código ${esc(String(d.forn))} · ${esc(f?.nif ?? '')}</small>`)}${dd('Moeda', 'EUR · euro')}
        ${dd('Descrição', esc(c.notas || String(d.desc)), 'is-largo')}
        ${dd('Prazo de resposta', dia(c.prazoResposta))}${dd('Entrega desejada', dia(c.entrega))}${dd('Local de entrega', esc(c.local))}${dd('Estado do pedido', esc(c.estado))}
        ${dd('Valor (sem IVA)', a ? `<b>${euros(a.total)}</b><small>${euros(a.base)} + portes ${euros(o!.portes)}</small>` : '<span class="is-nada">sem resposta</span>')}${dd('Validade da proposta', o ? `${dia(o.validade)}${caducada(o) ? ' <span class="lf2-b lf2-b--baixo">caducada</span>' : ''}` : '—')}${dd('Prazo de entrega', o ? `${o.prazo} dias · ${dia(somarDias(HOJE, o.prazo))}` : '—')}${dd('Pagamento', o ? esc(o.pagamento) : esc(f?.pagamento ?? '—'))}
        ${dd('Inserido por', esc(String(d.uIns)))}${dd('Alterado por', `${esc(String(d.uAlt))}<small>${esc(c.historico[c.historico.length - 1]?.quando ?? '')}</small>`)}</dl>
      <details class="dv2-hist"><summary>Histórico do pedido (${c.historico.length})</summary><ol>${c.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b>${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}<small>${esc(h.quem)}</small></li>`).join('')}</ol></details>`;
  }
  if (tab === 'linhas') return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Qtd.</th><th>Un.</th><th>Ref. do fornecedor</th><th class="is-num">Preço unitário</th><th class="is-num">Desconto</th><th class="is-num">Valor líquido</th></tr></thead><tbody>${c.linhas.map((l) => { const x = o?.linhas.find((y) => y.id === l.id), v = a?.linhas.find((y) => y.id === l.id), art = artigo(l.ref);
      return `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(art?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)}</td><td>${esc(art?.un ?? '')}</td><td class="is-mono">${esc(x?.refForn || '—')}</td><td class="is-num">${x?.preco == null ? '<span class="is-nada">—</span>' : euros(x.preco)}</td><td class="is-num">${x ? pct(x.desc) : '—'}</td><td class="is-num"><b>${v?.liquido == null ? '—' : euros(v.liquido)}</b>${v?.abaixoMinimo ? ` <span class="lf2-b lf2-b--baixo" title="Abaixo da quantidade mínima do fornecedor (${x?.minimo})">mín. ${nf(x?.minimo ?? 0)}</span>` : ''}</td></tr>`; }).join('')}</tbody>
      ${a ? `<tfoot><tr><td colspan="7">Soma das linhas</td><td class="is-num">${euros(a.base)}</td></tr><tr><td colspan="7">Portes</td><td class="is-num">${euros(o!.portes)}</td></tr><tr class="is-total"><td colspan="7">Total sem IVA</td><td class="is-num"><b>${euros(a.total)}</b></td></tr></tfoot>` : ''}</table>
      ${o ? '' : `<p class="lf2-nota">${esc(String(d.fornNome))} ainda não respondeu: as linhas não têm preço. Regista a resposta com Editar (F6).</p>`}<p class="lf2-nota">O IVA entra na encomenda, com as taxas de cada artigo.</p>`;
  if (tab === 'documentos') {
    const outros = c.fornecedores.filter((x) => x !== d.forn).map((x) => { const oo = c.ofertas.find((y) => y.forn === x); return `<li><b>${esc(nomeF(x))}</b><span>${oo ? `${euros(avaliar(c, oo).total)}${caducada(oo) ? ' · caducada' : ''}` : 'sem resposta'}${c.escolhido === x ? ' · transferido' : ''}</span></li>`; }).join('');
    return `<ol class="dv2-cadeia" aria-label="Documentos ligados">
      ${c.origem.map((rq) => `<li>${docBtn('compras.requisicao', rq, 'compras-requisicao', 'Requisição de origem')}</li>`).join('') || '<li class="dv2-cadeia-nada">Sem requisição de origem</li>'}
      <li>${docBtn('compras.cotacao', c.ref, 'compras-cotacao', 'Pedido de cotação', scale)}</li>
      <li class="dv2-cadeia-este"><span class="dv2-doc is-este">${L(fileText)}<span><small>Este orçamento</small><b>${esc(String(d.fornNome))}</b></span></span></li>
      <li>${d.enc ? docBtn('compras.encomenda', String(d.enc), 'compras-encomenda', 'Encomenda criada', link) : '<span class="dv2-cadeia-nada">Ainda sem encomenda</span>'}</li></ol>
      ${outros ? `<h3 class="dv2-h3">Os outros orçamentos do mesmo pedido</h3><ul class="dv2-outros">${outros}</ul>` : ''}`;
  }
  return '';
}

/* ---------- a ficha ---------- */
const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="dv2-ff-${k}"><span>${t}</span>${input}</label>`;
const opF = (sel: string) => FORNECEDORES.filter((f) => f.ativo).map((f) => `<option value="${f.id}"${f.id === sel ? ' selected' : ''}>${esc(f.nome)} · ${f.id}</option>`).join('');
const datalist = `<datalist id="dv2-artigos">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)} · ${esc(a.marca)}</option>`).join('')}</datalist>`;
function linhaRascunho(i: number, ref = '', qtd = '', dis = false): string {
  const a = artigo(ref);
  return `<tr data-dv2-linha="${i}"><td><input type="text" list="dv2-artigos" value="${esc(ref)}" data-dv2-ff="art-${i}" data-dv2-l="ref" aria-label="Artigo da linha ${i + 1}" placeholder="Referência"${dis ? ' disabled' : ''}></td><td data-dv2-l-desc>${esc(a?.desc ?? '')}</td><td><input type="text" inputmode="numeric" value="${esc(qtd)}" data-dv2-ff="qtd-${i}" data-dv2-l="qtd" aria-label="Quantidade da linha ${i + 1}" class="is-num"${dis ? ' disabled' : ''}></td><td data-dv2-l-un>${esc(a?.un ?? '')}</td><td>${dis ? '' : `<button type="button" class="dv2-x" data-dv2-acao="del-linha" aria-label="Tirar a linha ${i + 1}">${L(trash)}</button>`}</td></tr>`;
}
function ficha(e: EstDoc, f: Ficha, d: Doc | undefined): string {
  const modo = f.modo === 'criar' ? 'rascunho' : editavel(e, d), c = d ? c_(d) : undefined, o = d ? oferta(d) : undefined, ver = f.modo === 'editar' && !modo;
  const titulo = f.modo === 'criar' ? 'Novo orçamento' : modo === 'resposta' ? `Resposta de ${d!.fornNome} · ${c!.ref}` : `${c!.ref} · ${d!.fornNome}`;
  const pe = (txt: string) => `<p class="dv2-ficha-modo">${txt}</p>`;
  const cab = `<header class="dv2-ficha-cab"><span class="dv2-ficha-ic">${L(scale)}</span><div><small>${f.modo === 'criar' ? 'Criação' : ver ? 'Visualização' : 'Edição'}</small><h2>${esc(titulo)}</h2></div>
    <div class="dv2-ficha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-ficha">${L(arrowLeft)}<span>${ver ? 'Voltar à lista' : 'Cancelar'}</span><kbd>Esc</kbd></button>${ver ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="gravar">${L(save)}<span>Gravar</span><kbd>Ctrl Enter</kbd></button>`}</div></header>
    <p class="lf2-recusa" data-dv2-ficha-erro role="alert" hidden></p>`;
  if (modo === 'resposta') {
    const linhasR = c!.linhas.map((l, i) => { const x = o?.linhas.find((y) => y.id === l.id), a = artigo(l.ref);
      return `<tr data-dv2-linha="${i}" data-id="${l.id}"><td class="is-mono">${esc(l.ref)}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)} <small>${esc(a?.un ?? '')}</small></td><td><input type="text" value="${esc(x?.refForn ?? '')}" data-dv2-ff="rf-${i}" aria-label="Referência do fornecedor, linha ${i + 1}"></td><td><input type="text" inputmode="decimal" class="is-num" value="${x?.preco != null ? (x.preco / 100).toFixed(2).replace('.', ',') : ''}" data-dv2-ff="pr-${i}" data-dv2-r="preco" aria-label="Preço unitário, linha ${i + 1}" placeholder="0,00"></td><td><input type="text" inputmode="decimal" class="is-num" value="${x ? (x.desc / 100).toString().replace('.', ',') : '0'}" data-dv2-ff="ds-${i}" data-dv2-r="desc" aria-label="Desconto em %, linha ${i + 1}"></td><td><input type="text" inputmode="numeric" class="is-num" value="${x?.minimo ?? 0}" data-dv2-ff="mn-${i}" aria-label="Quantidade mínima, linha ${i + 1}"></td><td class="is-num" data-dv2-r-liq>—</td></tr>`; }).join('');
    return `<div class="dv2-ficha-c">${cab}${pe(`O pedido está «${esc(c!.estado)}»: regista ou corrige o que ${esc(String(d!.fornNome))} propôs. Os artigos e as quantidades são os do pedido.`)}
      <div class="dv2-ficha-g">${campo('validade', 'Válida até', `<input type="date" id="dv2-ff-validade" value="${o?.validade ?? somarDias(HOJE, 30)}" data-dv2-ff="validade">`)}${campo('prazo', 'Prazo de entrega (dias)', `<input type="text" inputmode="numeric" id="dv2-ff-prazo" value="${o?.prazo ?? fornecedor(String(d!.forn))?.prazo ?? 7}" data-dv2-ff="prazo">`)}${campo('portes', 'Portes (€)', `<input type="text" inputmode="decimal" id="dv2-ff-portes" value="${((o?.portes ?? 0) / 100).toFixed(2).replace('.', ',')}" data-dv2-ff="portes">`)}${campo('pagamento', 'Pagamento', `<input type="text" id="dv2-ff-pagamento" value="${esc(o?.pagamento ?? fornecedor(String(d!.forn))?.pagamento ?? '')}" data-dv2-ff="pagamento">`)}${campo('disp', 'Disponibilidade', `<input type="text" id="dv2-ff-disp" value="${esc(o?.disponibilidade ?? '')}" data-dv2-ff="disp">`, 'is-largo')}${campo('notas', 'Observações do fornecedor', `<textarea id="dv2-ff-notas" rows="2" data-dv2-ff="notas">${esc(o?.notas ?? '')}</textarea>`, 'is-largo')}</div>
      <h3 class="dv2-h3">Linhas</h3><div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Qtd.</th><th>Ref. do fornecedor</th><th class="is-num">Preço unitário (€)</th><th class="is-num">Desconto (%)</th><th class="is-num">Qtd. mínima</th><th class="is-num">Valor líquido</th></tr></thead><tbody>${linhasR}</tbody><tfoot><tr class="is-total"><td colspan="7">Total sem IVA (com portes)</td><td class="is-num" data-dv2-r-total>—</td></tr></tfoot></table></div>
      <p class="dv2-ficha-dica">Enter passa ao campo seguinte; no último, vai a Gravar. Preços com vírgula (ex.: 15,50). Uma linha sem preço fica sem proposta.</p></div>`;
  }
  const dis = ver;
  const ls = c?.linhas ?? [];
  return `<div class="dv2-ficha-c">${cab}${ver ? pe(d!.anulado ? 'O pedido está anulado: só se vê.' : d!.transferido ? `Transferido para a ${esc(String(d!.enc))}: já não se altera.` : `O pedido está «${esc(c!.estado)}»: já não se altera.`) : f.modo === 'criar' ? pe('O orçamento nasce como pedido de cotação em rascunho, para um fornecedor. Depois marca-se como enviado e regista-se a resposta.') : pe('Rascunho: os artigos, os prazos e a descrição alteram-se para todos os fornecedores do pedido.')}
    <div class="dv2-ficha-g">
      ${campo('serie', 'Série', `<select id="dv2-ff-serie" data-dv2-ff="serie" disabled><option>PC 2026</option></select>`)}
      ${campo('numero', 'Número', `<input type="text" id="dv2-ff-numero" value="${esc(c?.ref ?? 'Atribuído ao gravar')}" readonly>`)}
      ${campo('data', 'Data', `<input type="date" id="dv2-ff-data" value="${c?.data ?? HOJE}" readonly>`)}
      ${campo('forn', 'Fornecedor', `<select id="dv2-ff-forn" data-dv2-ff="forn"${f.modo === 'criar' ? '' : ' disabled'}>${f.modo === 'criar' ? '<option value="">Escolhe o fornecedor…</option>' : ''}${opF(String(d?.forn ?? ''))}</select>`)}
      ${campo('prazoResposta', 'Prazo de resposta', `<input type="date" id="dv2-ff-prazoResposta" value="${c?.prazoResposta ?? somarDias(HOJE, 3)}" data-dv2-ff="prazoResposta"${dis ? ' disabled' : ''}>`)}
      ${campo('entrega', 'Entrega desejada', `<input type="date" id="dv2-ff-entrega" value="${c?.entrega ?? somarDias(HOJE, 14)}" data-dv2-ff="entrega"${dis ? ' disabled' : ''}>`)}
      ${campo('moeda', 'Moeda', `<select id="dv2-ff-moeda" disabled><option>EUR · euro</option></select>`)}
      ${campo('notas', 'Descrição / observações', `<textarea id="dv2-ff-notas" rows="2" data-dv2-ff="notas"${dis ? ' disabled' : ''}>${esc(c?.notas ?? '')}</textarea>`, 'is-largo')}
    </div>
    <h3 class="dv2-h3">Artigos</h3>${datalist}
    <div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Quantidade</th><th>Un.</th><th><span class="sr">Tirar</span></th></tr></thead><tbody data-dv2-linhas>${(ls.length ? ls : [{ id: 'a', ref: '', qtd: 0 }]).map((l, i) => linhaRascunho(i, l.ref, l.qtd ? String(l.qtd) : '', dis)).join('')}</tbody></table></div>
    ${dis ? '' : `<button type="button" class="ak-btn ak-btn--linha dv2-mais-linha" data-dv2-acao="add-linha">${L(plus)}<span>Juntar artigo</span></button>`}
    <p class="dv2-ficha-dica">Enter passa ao campo seguinte; no último, vai a Gravar. Ctrl+Enter grava; Esc fecha (com alterações, pergunta).</p></div>`;
}
function lerFicha(r: HTMLElement): { forn: string; prazoResposta: string; entrega: string; notas: string; linhas: { id: string; ref: string; qtd: number }[] } {
  const v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
  const linhas = [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr')].map((tr, i) => ({ id: String.fromCharCode(97 + i), ref: tr.querySelector<HTMLInputElement>('[data-dv2-l="ref"]')!.value.trim(), qtd: Number(tr.querySelector<HTMLInputElement>('[data-dv2-l="qtd"]')!.value.trim().replace(/\s/g, '') || 'NaN') })).filter((l) => l.ref || !Number.isNaN(l.qtd));
  return { forn: v('forn'), prazoResposta: v('prazoResposta'), entrega: v('entrega'), notas: v('notas'), linhas };
}
const recusa = (m: string, campo_: string) => Object.assign(new Recusa(m), { campo: campo_ });
function gravar(r: HTMLElement, e: EstDoc, f: Ficha): { ref: string; msg: string } {
  const d = f.modo === 'editar' ? ativoDe(r, e) : undefined, modo = f.modo === 'criar' ? 'rascunho' : editavel(e, d);
  if (modo === 'resposta' && d) {
    const c = c_(d), v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
    const portes = lerEuros(v('portes') || '0'); if (portes === null) throw recusa('Os portes são um valor em euros, ex.: 12,50.', 'portes');
    const prazo = Number(v('prazo')); if (!Number.isInteger(prazo) || prazo < 0) throw recusa('O prazo de entrega é um número de dias.', 'prazo');
    const linhas = c.linhas.map((l, i) => { const p = v(`pr-${i}`), ds = v(`ds-${i}`) || '0', mn = v(`mn-${i}`) || '0';
      const preco = p ? lerEuros(p) : null; if (p && preco === null) throw recusa(`${l.ref}: o preço é um valor em euros, ex.: 15,50.`, `pr-${i}`);
      const desc = lerPercentagem(ds); if (desc === null) throw recusa(`${l.ref}: o desconto vai de 0 a 100 %.`, `ds-${i}`);
      const minimo = Number(mn); if (!Number.isInteger(minimo) || minimo < 0) throw recusa(`${l.ref}: a quantidade mínima é um número inteiro.`, `mn-${i}`);
      return { id: l.id, preco, desc, minimo, refForn: v(`rf-${i}`) }; });
    const o: Oferta = { forn: String(d.forn), respondida: oferta(d)?.respondida ?? HOJE, prazo, portes, pagamento: v('pagamento'), validade: v('validade'), moeda: 'EUR', disponibilidade: v('disp'), notas: v('notas'), linhas };
    responderPc(e.perfil, c.ref, o);
    return { ref: d.id, msg: `Resposta de ${d.fornNome} gravada no ${c.ref}.` };
  }
  const x = lerFicha(r);
  if (f.modo === 'criar' && !x.forn) throw recusa('Escolhe o fornecedor.', 'forn');
  const mal = x.linhas.findIndex((l) => !artigo(l.ref)); if (mal >= 0) throw recusa(x.linhas[mal].ref ? `«${x.linhas[mal].ref}» não é um artigo conhecido.` : 'Escreve o artigo de cada linha.', `art-${mal}`);
  const mq = x.linhas.findIndex((l) => !Number.isInteger(l.qtd) || l.qtd <= 0); if (mq >= 0) throw recusa(`${x.linhas[mq].ref}: a quantidade tem de ser um número inteiro maior do que zero.`, `qtd-${mq}`);
  if (f.modo === 'criar') {
    const pr = problemasPc({ linhas: x.linhas, fornecedores: [x.forn], prazoResposta: x.prazoResposta, entrega: x.entrega }); if (pr.length) throw recusa(pr[0], pr[0].includes('prazo') ? 'prazoResposta' : pr[0].includes('entrega') ? 'entrega' : 'art-0');
    const c = criarPc(e.perfil, { linhas: x.linhas });
    guardarPc(e.perfil, { ...c, fornecedores: [x.forn], prazoResposta: x.prazoResposta, entrega: x.entrega, notas: x.notas }, c.versao);
    return { ref: `${c.ref}|${x.forn}`, msg: `Orçamento ${c.ref} criado para ${nomeF(x.forn)}, em rascunho.` };
  }
  if (!d) throw new Recusa('O orçamento já não está na lista.');
  const c = c_(d), pr = problemasPc({ linhas: x.linhas, fornecedores: c.fornecedores, prazoResposta: x.prazoResposta, entrega: x.entrega }); if (pr.length) throw recusa(pr[0], pr[0].includes('prazo') ? 'prazoResposta' : 'entrega');
  guardarPc(e.perfil, { ...c, linhas: x.linhas, prazoResposta: x.prazoResposta, entrega: x.entrega, notas: x.notas }, c.versao);
  return { ref: d.id, msg: `${c.ref} gravado.` };
}
/** Recalcula na ficha da resposta o líquido de cada linha e o total (com a regra do domínio). */
function recalcular(r: HTMLElement, e: EstDoc): void {
  const d = ativoDe(r, e); if (!d || editavel(e, d) !== 'resposta') return;
  const c = c_(d), v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
  const o: Oferta = { forn: String(d.forn), respondida: HOJE, prazo: 0, portes: lerEuros(v('portes') || '0') ?? 0, pagamento: '', validade: HOJE, moeda: 'EUR', disponibilidade: '', notas: '', linhas: c.linhas.map((l, i) => ({ id: l.id, preco: lerEuros(v(`pr-${i}`)), desc: lerPercentagem(v(`ds-${i}`) || '0') ?? 0, minimo: 0, refForn: '' })) };
  const a = avaliar(c, o);
  r.querySelectorAll<HTMLElement>('[data-dv2-ficha] tr[data-dv2-linha]').forEach((tr, i) => { const x = tr.querySelector<HTMLElement>('[data-dv2-r-liq]'); if (x) x.textContent = a.linhas[i]?.liquido == null ? '—' : euros(a.linhas[i].liquido!); });
  const t = r.querySelector<HTMLElement>('[data-dv2-r-total]'); if (t) t.textContent = a.artigos ? euros(a.total) : '—';
}

/* ---------- transferir para encomenda (Ctrl+F2) ---------- */
function dlgTransferir(r: HTMLElement, e: EstDoc, erro = ''): void {
  const d = ativoDe(r, e); if (!d) return;
  const porque = porqueTransferir(e, d); if (porque && !erro) { toast(r, porque); return; }
  const c = c_(d), o = oferta(d)!, a = avaliar(c, o), outros = c.fornecedores.length - 1, sem = c.linhas.filter((l) => !o.linhas.find((y) => y.id === l.id && y.preco !== null));
  dialogo(r, `<h2 id="dv2-dlg-t">${L(arrowRL)}Transferir para encomenda</h2><p class="lf2-dlg-sub"><b class="is-mono">${esc(c.ref)}</b> · ${esc(String(d.fornNome))} · proposta de ${dia(o.respondida)}, válida até ${dia(o.validade)}</p>
    <table class="lf2-mini"><thead><tr><th>Artigo</th><th class="is-num">Qtd.</th><th class="is-num">Preço</th><th class="is-num">Desc.</th><th class="is-num">Líquido</th></tr></thead><tbody>${c.linhas.map((l) => { const x = o.linhas.find((y) => y.id === l.id), v = a.linhas.find((y) => y.id === l.id); return `<tr><td class="is-mono">${esc(l.ref)}</td><td class="is-num">${nf(l.qtd)}</td><td class="is-num">${x?.preco == null ? '—' : euros(x.preco)}</td><td class="is-num">${x ? pct(x.desc) : '—'}</td><td class="is-num">${v?.liquido == null ? '<span class="is-nada">fica de fora</span>' : euros(v.liquido)}</td></tr>`; }).join('')}</tbody><tfoot><tr><td colspan="4">Portes</td><td class="is-num">${euros(o.portes)}</td></tr><tr class="is-total"><td colspan="4">Total sem IVA</td><td class="is-num"><b>${euros(a.total)}</b></td></tr></tfoot></table>
    <ul class="dv2-regras"><li>Cria uma encomenda <b>em rascunho</b> para ${esc(String(d.fornNome))}, com entrega a ${dia(a.entrega)} e pagamento a ${esc(o.pagamento)}.</li><li>O pedido ${esc(c.ref)} passa a <b>Decidido</b>${outros ? ` e os outros ${outros} ${outros === 1 ? 'orçamento deixa' : 'orçamentos deixam'} de se poder transferir` : ''}.</li>${sem.length ? `<li>${sem.length} ${sem.length === 1 ? 'artigo sem preço fica' : 'artigos sem preço ficam'} de fora.</li>` : ''}<li>A encomenda guarda a origem: este orçamento e o pedido.</li></ul>
    ${erro ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(erro)}</p>` : ''}
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="transferir-sim" data-dv2-primeiro>${L(arrowRL)}<span>Transferir</span><kbd>Ctrl Enter</kbd></button></div>`);
}
async function transferir(r: HTMLElement, e: EstDoc, b: HTMLElement): Promise<void> {
  const d = ativoDe(r, e); if (!d || e.ocupado) return;
  e.ocupado = 'transferir'; e.extra.ocupadoTexto = 'A transferir…';
  b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.querySelector('span')!.textContent = 'A transferir…';
  r.querySelector<HTMLElement>('[data-dv2-dlg-fechar]')?.setAttribute('disabled', '');
  await new Promise((ok) => requestAnimationFrame(() => ok(null)));
  try {
    const ref = escolher(e.perfil, String(d.ref), String(d.forn));
    e.ocupado = ''; fecharDialogo(r); e.tab = 'detalhes'; tudo(r, e, true);
    /* a passagem do orçamento para a encomenda: a célula «Transferido» acende e a encomenda nasce dela */
    const cel = r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(d.id)}"] td[data-col="transferido"]`) ?? r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(d.id)}"]`);
    if (cel && !quieto()) cel.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    toast(r, `Transferido: criada a ${ref} em rascunho para ${d.fornNome}.`);
    /* na área de trabalho, o separador da encomenda nasce da célula; sozinho, fica-se na lista (a faixa tem «Abrir») */
    if (emSeparador()) window.setTimeout(() => abrirDoc(cel, 'compras.encomenda', ref, 'compras-encomenda'), quieto() ? 0 : 340);
  } catch (x) {
    e.ocupado = ''; dlgTransferir(r, e, x instanceof Recusa ? x.message : 'O servidor não confirmou a transferência. Nada se repete sozinho: atualiza a lista (F9) para ver se a encomenda foi criada antes de tentar outra vez.');
  }
}

/* ---------- registar ---------- */
const CFG = registar({
  k: 'orc', titulo: 'Orçamentos a Fornecedores', sub: 'Gere, consulta e acompanha os orçamentos enviados aos fornecedores.', icone: scale, um: 'orçamento', o: 'o',
  caminho: [['ERP', 'inicio'], ['Compras', 'compras'], ['Orçamentos', '']],
  cols: COLS, verIniciais: ['numero', 'data', 'tipo', 'forn', 'fornNome', 'desc', 'estado', 'transferido', 'anulado', 'moeda', 'valor', 'uIns', 'uAlt'],
  campos: { numero: 'n', data: 'data', codigo: 'forn', descricao: 'desc' },
  linhas, series: () => [...new Set(cotacoes().map((c) => c.ref.split('/')[0]))], serieDe: (d) => String(d.serie), fornDe: (d) => String(d.forn), dataDe: (d) => String(d.data), moedaDe: (d) => String(d.moeda),
  estados: [['', 'Todos'], ['por', 'Por transferir'], ['transf', 'Transferidos'], ['anul', 'Anulados'], ['sem', 'Sem resposta']],
  estadoPassa: (d, v) => v === 'por' ? !d.transferido && !d.anulado : v === 'transf' ? !!d.transferido : v === 'anul' ? !!d.anulado : v === 'sem' ? d.resposta === 'sem' : true,
  celula, valor,
  resumo: (ls) => { const t = ls.filter((d) => d.transferido).length, a = ls.filter((d) => d.anulado).length, s = ls.filter((d) => d.resposta === 'sem' && !d.anulado).length; const pl = (n: number, um: string, v: string) => `<span><b>${nf(n)}</b> ${n === 1 ? um : v}</span>`; return ls.length ? `${pl(ls.length - t - a, 'por transferir', 'por transferir')}${pl(t, 'transferido', 'transferidos')}${pl(a, 'anulado', 'anulados')}${pl(s, 'sem resposta', 'sem resposta')}` : ''; },
  barra: BTN('transferir', arrowRL, 'Transferir para encomenda', 'Ctrl+F2', '', 'ak-btn--acao'), teclasExtra: '',
  janelas: { titulo: 'Orçamento', icone: scale, estados: ['ja-transferido', 'anulado', 'gravado'] },
  tabs: [{ k: 'detalhes', t: 'Detalhes', ic: info }, { k: 'linhas', t: 'Linhas', ic: list }, { k: 'documentos', t: 'Documentos', ic: link }, { k: 'anexos', t: 'Anexos', ic: paperclip }],
  painel, ficha, gravar,
  porque: {
    novo: (e) => pode2(e.perfil, 'pc-gerir') ? '' : 'O teu perfil não faz orçamentos.',
    editar: (e, d) => !d ? 'Escolhe um orçamento na lista.' : !pode2(e.perfil, 'pc-gerir') ? 'O teu perfil só consulta os orçamentos.' : editavel(e, d) ? '' : d.anulado ? 'O orçamento está anulado: só se vê (Enter).' : `O pedido está «${c_(d).estado}»: já não se altera; Enter abre-o para ver.`,
    anular: (e, d) => !d ? 'Escolhe um orçamento na lista.' : !pode2(e.perfil, 'pc-gerir') ? 'O teu perfil não anula orçamentos.' : d.anulado ? 'Já está anulado.' : acoesPc(c_(d), e.perfil).includes('cancelar') ? '' : d.transferido ? `Já foi transferido para a ${d.enc}: anula-se a encomenda, não o orçamento.` : `Um pedido «${c_(d).estado}» não se anula.`,
  },
  anular: {
    texto: (d) => { const c = c_(d); return [`Anular o orçamento ${c.ref}?`, `No protótipo anula-se o pedido de cotação inteiro${c.fornecedores.length > 1 ? `, e com ele os ${c.fornecedores.length} orçamentos (${c.fornecedores.map(nomeF).map(esc).join(', ')})` : ''}. Nada se apaga: fica no histórico, anulado.`]; },
    fazer: (e, d, motivo) => { cancelarPc(e.perfil, String(d.ref), motivo); return `${d.ref} anulado. Fica no histórico.`; },
  },
  docAnexo: (d) => d.id,
  teclas: [{ tecla: 'Ctrl+F2', acao: 'transferir' }],
  acao(r, e, k, b) {
    if (k === '_barra') { const t = porqueTransferir(e, ativoDe(r, e)), x = r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="transferir"]'); if (x && !e.ocupado) { x.setAttribute('aria-disabled', String(!!t)); x.title = t || 'Transferir para encomenda (Ctrl+F2)'; } return true; }
    if (k === '_ficha-aberta') { recalcular(r, e); return true; }
    if (k === '_ficha-input') { if ((b as HTMLInputElement).dataset.dv2L === 'ref') { const tr = b.closest('tr')!, a = artigo((b as HTMLInputElement).value.trim()); tr.querySelector('[data-dv2-l-desc]')!.textContent = a?.desc ?? ''; tr.querySelector('[data-dv2-l-un]')!.textContent = a?.un ?? ''; } recalcular(r, e); return true; }
    if (k === 'transferir') { dlgTransferir(r, e); return true; }
    if (k === 'transferir-sim') { void transferir(r, e, b); return true; }
    if (k === 'abrir-doc') { abrirDoc(b, b.dataset.rota!, b.dataset.titulo!, b.dataset.ecra!); return true; }
    if (k === 'add-linha') { const tb = r.querySelector<HTMLElement>('[data-dv2-linhas]')!, i = tb.children.length; tb.insertAdjacentHTML('beforeend', linhaRascunho(i)); const tr = tb.lastElementChild as HTMLElement; if (!quieto()) tr.animate([{ opacity: 0, transform: 'scaleY(.4)', transformOrigin: 'top' }, { opacity: 1, transform: 'none', transformOrigin: 'top' }], { duration: 180, easing: 'ease-out' }); tr.querySelector<HTMLElement>('input')?.focus(); if (e.ficha) e.ficha.sujo = true; return true; }
    if (k === 'del-linha') { const tr = b.closest('tr'); const tb = tr?.parentElement; if (tr && tb && tb.children.length > 1) { tr.remove(); if (e.ficha) e.ficha.sujo = true; (tb.querySelector('input') as HTMLElement | null)?.focus(); } else toast(r, 'O orçamento precisa de pelo menos um artigo.'); return true; }
    return false;
  },
  cenario(r, e, cen) {
    const ls = linhas(e), por = ls.find((d) => !porqueTransferir(e, d)), transf = ls.find((d) => d.transferido), editar = ls.find((d) => editavel(e, d) === 'resposta');
    if (['transferir', 'a-transferir', 'transferido', 'transferir-falhou'].includes(cen) && por) e.ativo = por.id;
    if (cen === 'ja-transferido' && transf) { e.ativo = transf.id; e.recusa = porqueTransferir(e, transf); }
    if (cen === 'editar' && editar) e.ativo = editar.id;
    if (cen === 'anular-recusado' && transf) e.ativo = transf.id;
    if (cen === 'anulado' && ls[0]) { e.extra.anuladoSim = ls.find((d) => d.ref === 'PC 2026/0016')?.id ?? ls[0].id; e.ativo = String(e.extra.anuladoSim); e.aviso = 'PC 2026/0016 anulado: «O fornecedor deixou de ter o artigo». Fica no histórico.'; }
    if (cen === 'gravado' && ls[0]) e.ativo = ls[0].id;
    requestAnimationFrame(() => {
      if (cen === 'transferir' || cen === 'a-transferir' || cen === 'transferir-falhou') dlgTransferir(r, e, cen === 'transferir-falhou' ? 'O servidor não confirmou a transferência (ERP-COMP-504). Nada se repete sozinho: atualiza a lista (F9) para ver se a encomenda foi criada antes de tentar outra vez.' : '');
      if (cen === 'a-transferir') { const b = r.querySelector<HTMLElement>('[data-dv2-acao="transferir-sim"]'); if (b) { b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.innerHTML = `${L(loader)}<span>A transferir…</span>`; } }
      if (cen === 'transferido' && por) { e.aviso = `Transferido: criada a EF 2026/0414 em rascunho para ${por.fornNome}. O separador da encomenda abre-se ao lado.`; r.querySelector<HTMLElement>('[data-dv2-estado] .ak-estado-aviso')?.remove(); tudo(r, e); }
      if (cen === 'anular-recusado') { dialogo(r, `<h2 id="dv2-dlg-t" class="is-perigo">${L(ban)}Não é possível anular</h2><p>${esc(CFG.porque.anular(e, ativoDe(r, e)))}</p><div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--acao" data-dv2-dlg-fechar data-dv2-primeiro>${L(check)}<span>Percebi</span><kbd>Esc</kbd></button></div>`); }
    });
  },
  dica: 'Período e moeda juntam-se à pesquisa. Enter passa ao campo seguinte.',
});

/* ---------- os ecrãs ---------- */
const NOTA = 'Orçamentos a Fornecedores v2 (26 out., briefing «Gestão de Orçamentos a Fornecedores V2» e o print do ERP antigo): as colunas do antigo, Pesquisar por Número/Data/Código/Descrição (F1 F2 F10 F12) com Iniciado por/Contendo (Shift+F1/F2), Série (F4), o painel do orçamento (detalhes, linhas, documentos, anexos), a ficha (criar, editar, registar a resposta), Anular (F8) e Transferir para encomenda (Ctrl+F2) com as regras do pedido de cotação.';
export const ESTADOS_ORC: [string, string, string][] = [
  ['carregar', '18.11 · A carregar', 'A lista em esqueleto; a pesquisa e os filtros já servem.'],
  ['vazia', '18.12 · Sem orçamentos', 'Ainda não há orçamentos: Novo (F5).'],
  ['sem-resultados', '18.13 · Pesquisa sem resultados', 'Diz em que modo se procurou e como se compara; oferece Contendo e Limpar.'],
  ['criar', '18.14 · Novo orçamento', 'Novo (F5) abre a ficha numa janela «A criar»: fornecedor, prazos, descrição e artigos; a lista fica à vista.'],
  ['editar', '18.15 · Registar a resposta', 'Um orçamento enviado: preços, descontos, mínimos, validade, prazo e portes; o total recalcula-se.'],
  ['por-gravar', '18.16 · Alterações por gravar', 'Fechar a ficha com alterações: continuar a editar ou descartar.'],
  ['a-gravar', '18.17 · A gravar', 'O botão espera; nada se diz antes de as regras aceitarem.'],
  ['gravado', '18.18 · Gravado', 'A ficha fecha, a linha acende e a barra de estado diz o que se gravou.'],
  ['gravar-falhou', '18.19 · Gravar falhou', 'O servidor não respondeu: as alterações ficam na ficha.'],
  ['anular', '18.20 · Anular (F8)', 'A confirmação diz o que se anula (o pedido inteiro, no protótipo) e pede o motivo.'],
  ['anular-recusado', '18.21 · Anular recusado', 'Um orçamento já transferido não se anula: diz-se porquê.'],
  ['anulado', '18.22 · Anulado', 'O orçamento fica, com «Anulado»; não se transfere nem se altera.'],
  ['transferir', '18.23 · Transferir para encomenda', 'Ctrl+F2: as linhas, o total, o que acontece ao pedido e aos outros orçamentos.'],
  ['a-transferir', '18.24 · A transferir', 'O botão espera e o Cancelar desliga-se: não há transferências repetidas.'],
  ['ja-transferido', '18.25 · Já transferido', 'O orçamento já está numa encomenda: Ctrl+F2 diz qual, e o painel abre-a.'],
  ['transferido', '18.26 · Transferido', 'Depois da resposta: a célula Transferido acende com a encomenda e o separador dela abre-se.'],
  ['transferir-falhou', '18.27 · A transferência falhou', 'Sem confirmação: nada se repete sozinho; atualizar antes de tentar outra vez.'],
  ['anexos', '18.28 · Anexos', 'Os anexos do orçamento: ver, descarregar, carregar e remover.'],
  ['anexo-enviar', '18.29 · A carregar um anexo', 'O progresso real da leitura do ficheiro.'],
  ['anexo-falhou', '18.30 · O anexo falhou', 'Ficheiro grande demais: diz o limite; nada se guardou.'],
  ['imprimir', '18.31 · Imprimir (F11)', 'Imprime-se só a lista, com as colunas à vista.'],
  ['permissao', '18.32 · Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['sessao', '18.33 · Sessão terminada', 'Voltar a entrar pelo login comum; o que estava escrito fica.'],
  ['offline', '18.34 · Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['servidor', '18.35 · Servidor indisponível', 'O servidor das compras não respondeu: Tentar outra vez.'],
  ['restaurada', '18.36 · Área de trabalho reposta', 'Ao voltar: a pesquisa, os filtros e o orçamento escolhido como estavam.'],
  ['janela', '18.37 · Orçamento numa janela', 'Tocar num orçamento abre-o numa janela flutuante: Detalhes, Linhas, Documentos e Anexos lá dentro; a lista fica à vista.'],
  ['janelas', '18.38 · Várias janelas', 'Três orçamentos abertos em cascata (um minimizado, só com o título); a da frente é a última tocada e é a ela que as ações se aplicam.'],
  ['maximizada', '18.39 · Janela maximizada', 'Duplo clique no cabeçalho (ou o botão) enche o ecrã; outra vez, volta ao tamanho que tinha.'],
  ['editar-sujo', '18.40 · A editar, com alterações', 'Editar na janela do orçamento: o ● no título diz que há alterações por gravar; fechar pergunta.'],
];
const fornecedoresDaLista = (): [string, string][] => [...new Set(cotacoes().flatMap((c: Cotacao) => c.fornecedores))].map((f) => [f, nomeF(f)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], 'pt'));
export function versaoOrcamentos(cen = 'normal') { return { id: 'v2', nota: NOTA, html: paginaDoc(CFG, cen, fornecedoresDaLista()) }; }
/** O 18 ganha a v2 (abre por omissão) e os estados só da v2. */
export function comOrcamentosV2(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  return [...ecras.map((e) => e.id === 'compras-cotacoes' ? { ...e, nome: '18 · Orçamentos', versoes: [...e.versoes, versaoOrcamentos()] as Ecra<IdErp>['versoes'] } : e),
    ...ESTADOS_ORC.map(([cen, nome, objetivo]) => ({ id: `orc2-${cen}` as IdErp, nome, fluxo: 'Compras', estadoDe: 'compras-cotacoes' as IdErp, objetivo, versoes: [versaoOrcamentos(cen)] as Ecra<IdErp>['versoes'] }))];
}
export type IdOrc2 = `orc2-${string}`;
