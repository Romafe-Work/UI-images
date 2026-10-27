/* =========================================================
   ERP — 10 · Encomendas a Fornecedores v3 (26 out. 2026), do briefing dela «Gestão de Encomendas a Fornecedores V2» e do
   print do ERP antigo (Compras ▸ Encomendas, com o EDI). A v1 e a v2 do 10 ficam como estavam; esta é a v3.
   As colunas do antigo: Número, Data, T.Enc., N. Doc. For., Desp. Cliente, Fornecedor, Descrição, Em Recepção, Fechada,
   Anulado, Moeda, Valor. Os estados e as passagens são os de compras/dominio.ts (Rascunho → A aprovar → Aprovada →
   Emitida → Parcialmente recebida → Recebida → Fechada; Cancelada) — «Em receção», «Fechada» e «Anulada» mostram-se em
   colunas próprias, sem se deduzir uma da outra (fechada não quer dizer recebida).
   - Ficha: criar e editar o rascunho (dominio.criar/guardar, com a versão); os outros estados só se veem.
   - Anular (F8) = cancelar, com o motivo; o domínio só deixa antes de haver receções.
   - Receções: as linhas encomendadas, recebidas e pendentes e as receções ligadas (rececoesDe); registar uma receção
     abre o ecrã da receção — o stock só mexe por lá.
   - EDI: as ações do antigo, com as mesmas teclas. O protótipo não tem adaptadores de envio: as que geram ficheiro
     (Encomenda Fornecedor, SKF Web) geram-no a sério e dizem «gerado», nunca «enviado»; as outras dizem porque não estão
     disponíveis. Cada ficheiro fica no histórico da encomenda e não se gera duas vezes para a mesma versão sem perguntar.
   - Despesa do cliente e tipo de encomenda não existem no protótipo: as colunas ficam, com «—».
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha } from './docs-v2';
import { toast, dialogo, fecharDialogo, tudo, abrirDoc, ativoDe, quieto, nf, inspetor, fecharMenus, abrirMenu } from './docs-v2-comportamento';
import { encomendas, encomenda, rececoesDe, totais, linhaLiquida, acoesDe, transitar, criar, guardar, anotar, artigo, fornecedor, FORNECEDORES, ARTIGOS, euros, dia, pct, lerEuros, lerPercentagem, HOJE, ARMAZEM, NOME_ACAO, Recusa, pode, type Encomenda, type LinhaEnc, type Acao } from './dominio';
import { cotacoes } from './dominio2';
import { descarregar } from './xlsx';
import { PERFIS } from '../inicio-dados';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import plug from 'lucide-static/icons/plug.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import circleHelp from 'lucide-static/icons/circle-help.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import external from 'lucide-static/icons/external-link.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import scale from 'lucide-static/icons/scale.svg?raw';
import fileDown from 'lucide-static/icons/file-down.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';

/* ---------- as linhas ---------- */
const nomeF = (id: string) => fornecedor(id)?.nome ?? id;
const enc_ = (d: Doc) => encomenda(String(d.ref))!;
const recebido = (e: Encomenda) => { const q = e.linhas.reduce((s, l) => s + l.qtd, 0), r = e.linhas.reduce((s, l) => s + l.recebida, 0); return { q, r, pct: q ? r / q : 0 }; };
function linhas(x: EstDoc): Doc[] {
  return encomendas().map((e): Doc => {
    const t = totais(e), rc = recebido(e), u = e.historico[e.historico.length - 1];
    const anulada = e.estado === 'Cancelada' || x.extra.anuladaSim === e.ref, fechada = e.estado === 'Fechada' || x.extra.fechadaSim === e.ref;
    return { id: e.ref, ref: e.ref, numero: e.ref, n: e.ref.split(' ')[1] ?? e.ref, serie: e.ref.split('/')[0], data: e.data, tipo: '', docForn: e.refForn, despCli: '', forn: e.forn, fornNome: nomeF(e.forn),
      desc: e.notas || `${e.linhas.length} ${e.linhas.length === 1 ? 'linha' : 'linhas'} · entrega a ${dia(e.entrega)}`, estado: anulada ? 'Cancelada' : fechada ? 'Fechada' : e.estado,
      emRececao: !anulada && !fechada && (e.estado === 'Parcialmente recebida' || x.extra.parcialSim === e.ref), fechada, anulado: anulada, moeda: e.moeda, valor: t.base, recebidoPct: rc.pct, semPreco: t.semPreco, uAlt: u?.quem ?? '' };
  });
}

/* ---------- o EDI do ERP antigo ---------- */
interface Integ { k: string; t: string; tecla: string; formato: string; tipo: 'ficheiro' | 'auto' | 'ligacao' | 'sem'; forn?: string }
export const EDI: Integ[] = [
  { k: 'auto', t: 'Encomendas Auto', tecla: 'Ctrl+F2', formato: 'Encomendas a partir das faltas', tipo: 'auto' },
  { k: 'fornecedor', t: 'Encomenda Fornecedor', tecla: 'Ctrl+F7', formato: 'Ficheiro CSV (referência do fornecedor, quantidade, preço)', tipo: 'ficheiro' },
  { k: 'bea', t: 'Encomenda BEA', tecla: 'Ctrl+F6', formato: 'Ficheiro BEA', tipo: 'sem', forn: 'BEA' },
  { k: 'bea-desc', t: 'Encomenda BEA/Descrição', tecla: 'Ctrl+F5', formato: 'Ficheiro BEA com descrição', tipo: 'sem', forn: 'BEA' },
  { k: 'endorsia', t: 'Encomenda Endorsia', tecla: 'Ctrl+F3', formato: 'Ficheiro Endorsia', tipo: 'sem', forn: 'Endorsia' },
  { k: 'dormer', t: 'Encomenda Dormer', tecla: 'Ctrl+F4', formato: 'Ficheiro Dormer', tipo: 'sem', forn: 'Dormer' },
  { k: 'timken', t: 'Encomenda Timken', tecla: 'Ctrl+F9', formato: 'Ficheiro Timken', tipo: 'sem', forn: 'Timken' },
  { k: 'snr', t: 'Encomenda SNR', tecla: 'Ctrl+F8', formato: 'Ficheiro SNR', tipo: 'sem', forn: 'SNR' },
  { k: 'esab', t: 'Encomenda Esab', tecla: 'Shift+F11', formato: 'Ficheiro Esab', tipo: 'sem', forn: 'Esab' },
  { k: 'skf-web', t: 'Encomenda SKF Web', tecla: 'Shift+F12', formato: 'Ficheiro para carregar no portal SKF (CSV)', tipo: 'ficheiro', forn: 'skf' },
  { k: 'teccom', t: 'Enviar TecCom', tecla: '', formato: 'TecCom (ORDERS)', tipo: 'ligacao' },
];
interface Registo { ref: string; k: string; versao: number; quando: string; ficheiro: string; quem: string }
const CHAVE_EDI = 'erp:edi:v1';
const registos = (): Registo[] => { try { return JSON.parse(localStorage.getItem(CHAVE_EDI) ?? '[]') as Registo[]; } catch { return []; } };
const registosDe = (ref: string) => registos().filter((x) => x.ref === ref).sort((a, b) => b.quando.localeCompare(a.quando));
/** Porque esta integração não serve esta encomenda (vazio = serve). */
function porqueEdi(x: EstDoc, i: Integ, e: Encomenda | undefined): string {
  if (i.tipo === 'auto') return '';
  if (!e) return 'Escolhe uma encomenda na lista.';
  if (i.tipo === 'sem') return `Não configurada: o protótipo não tem o fornecedor ${i.forn} nem o formato dele.`;
  if (i.tipo === 'ligacao') return 'Não configurada: não há ligação TecCom neste protótipo, por isso nada se envia.';
  if (i.forn && e.forn !== i.forn) return `Só para encomendas de ${nomeF(i.forn)}.`;
  if (!pode(x.perfil, 'emitir')) return 'O teu perfil não envia encomendas a fornecedores.';
  if (['Rascunho', 'A aprovar', 'Aprovada'].includes(e.estado)) return `Uma encomenda «${e.estado}» ainda não se envia: primeiro emite-se.`;
  if (e.estado === 'Cancelada') return 'A encomenda está anulada.';
  if (e.estado === 'Fechada') return 'A encomenda está fechada.';
  return '';
}
function csvDe(e: Encomenda, i: Integ): string {
  const cab = i.k === 'skf-web' ? ['PO number', 'SKF designation', 'Quantity', 'Requested date'] : ['Encomenda', 'Referência do fornecedor', 'Artigo', 'Descrição', 'Quantidade', 'Unidade', 'Preço unitário', 'Desconto %', 'Entrega'];
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const ls = e.linhas.filter((l) => l.qtd - l.recebida > 0).map((l) => { const a = artigo(l.ref); return i.k === 'skf-web' ? [e.ref, a?.refForn || l.ref, l.qtd - l.recebida, l.entrega] : [e.ref, a?.refForn || '', l.ref, a?.desc ?? '', l.qtd - l.recebida, a?.un ?? '', l.preco === null ? '' : (l.preco / 100).toFixed(2).replace('.', ','), (l.desc / 100).toString().replace('.', ','), l.entrega]; });
  return '﻿' + [cab, ...ls].map((r) => r.map(q).join(';')).join('\r\n');
}
function gerarEdi(r: HTMLElement, x: EstDoc, i: Integ, b: HTMLElement | null, confirmado = false): void {
  fecharMenus(r);
  const d = ativoDe(r, x), e = d ? enc_(d) : undefined;
  if (i.tipo === 'auto') { toast(r, 'No ERP antigo, «Encomendas Auto» cria as encomendas das faltas. No ERP novo faz-se na Lista de Faltas (Para encomenda, Ctrl+F7).'); abrirDoc(b ?? r.querySelector('[data-dv2-acao="edi"]'), 'compras.faltas', 'Lista de Faltas', 'compras-faltas'); return; }
  const porque = porqueEdi(x, i, e); if (porque || !e) { x.tab = 'edi'; inspetor(r, x); toast(r, porque); return; }
  const ja = registosDe(e.ref).find((y) => y.k === i.k && y.versao === e.versao);
  if (ja && !confirmado) {
    dialogo(r, `<h2 id="dv2-dlg-t">${L(circleAlert)}Já foi gerado para esta versão</h2><p>O ficheiro «${esc(i.t)}» da ${esc(e.ref)} (versão ${e.versao}) já foi gerado a ${new Date(ja.quando).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} por ${esc(ja.quem)}. Se o enviaste ao fornecedor, gerar outra vez pode duplicar a encomenda do lado dele.</p>
      <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar data-dv2-primeiro>${L(xIc)}<span>Não gerar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="edi-outra" data-k="${i.k}">${L(fileDown)}<span>Gerar outra vez</span></button></div>`);
    return;
  }
  try {
    const nome = `${e.ref.replace(/\W+/g, '-')}-${i.k}-v${e.versao}.csv`;
    descarregar(new Blob([csvDe(e, i)], { type: 'text/csv;charset=utf-8' }), nome);
    const reg: Registo = { ref: e.ref, k: i.k, versao: e.versao, quando: new Date().toISOString(), ficheiro: nome, quem: PERFIS[x.perfil].pessoa };
    localStorage.setItem(CHAVE_EDI, JSON.stringify([...registos(), reg]));
    anotar(e.ref, x.perfil, `Gerou o ficheiro EDI · ${i.t}`, `${nome} · versão ${e.versao} · por enviar ao fornecedor`);
    fecharDialogo(r); x.tab = 'edi'; tudo(r, x);
    toast(r, `Ficheiro gerado: ${nome}. Ainda não foi enviado — envia-o ao fornecedor${i.k === 'skf-web' ? ' pelo portal SKF' : ''}.`);
    const li = r.querySelector<HTMLElement>('.dv2-edi-reg li'); if (li && !quieto()) li.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
  } catch { toast(r, 'Não foi possível gerar o ficheiro. Nada ficou registado; tenta outra vez.'); }
}
function menuEdi(r: HTMLElement, x: EstDoc): void {
  const m = r.querySelector<HTMLElement>('[data-dv2-menu="edi"]'); if (!m) return;
  const d = ativoDe(r, x), e = d ? enc_(d) : undefined;
  const item = (i: Integ) => { const p = porqueEdi(x, i, e); return `<button type="button" role="menuitem" data-dv2-acao="edi:${i.k}"${p ? ' aria-disabled="true"' : ''} title="${esc(p || i.formato)}"><span><b>${esc(i.t)}</b><small>${esc(p || i.formato)}</small></span>${i.tecla ? `<kbd>${i.tecla}</kbd>` : ''}</button>`; };
  const ok = EDI.filter((i) => !porqueEdi(x, i, e)), nao = EDI.filter((i) => porqueEdi(x, i, e));
  m.innerHTML = `<p class="ak-menu-t">Enviar / Integrar${e ? ` · ${esc(e.ref)}` : ''}</p>${ok.map(item).join('') || '<p>Nenhuma integração serve esta encomenda.</p>'}${nao.length ? `<p class="ak-menu-t">Indisponíveis (${nao.length})</p>${nao.map(item).join('')}` : ''}<p>O protótipo não envia: gera o ficheiro e regista-o. «Enviado» só depois da confirmação do fornecedor.</p>`;
}

/* ---------- a configuração ---------- */
const COLS: CfgDoc['cols'] = [
  { k: 'numero', t: 'Número', tipo: 'mono', w: 130, presa: true, antiga: true },
  { k: 'data', t: 'Data', tipo: 'data', w: 100, antiga: true },
  { k: 'tipo', t: 'Tipo de encomenda', tipo: 'txt', w: 130, antiga: true },
  { k: 'docForn', t: 'N.º do documento do fornecedor', tipo: 'mono', w: 160, antiga: true },
  { k: 'despCli', t: 'Despesa do cliente', tipo: 'txt', w: 130, antiga: true },
  { k: 'forn', t: 'Fornecedor', tipo: 'mono', w: 96, antiga: true },
  { k: 'fornNome', t: 'Nome do fornecedor', tipo: 'txt', w: 160 },
  { k: 'desc', t: 'Descrição', tipo: 'txt', w: 240, antiga: true },
  { k: 'estado', t: 'Estado', tipo: 'estado', w: 200 },
  { k: 'emRececao', t: 'Em receção', tipo: 'sim', w: 150, antiga: true },
  { k: 'fechada', t: 'Fechada', tipo: 'sim', w: 90, antiga: true },
  { k: 'anulado', t: 'Anulada', tipo: 'sim', w: 90, antiga: true },
  { k: 'moeda', t: 'Moeda', tipo: 'txt', w: 70, antiga: true },
  { k: 'valor', t: 'Valor (sem IVA)', tipo: 'eur', w: 130, antiga: true },
  { k: 'uAlt', t: 'Última alteração', tipo: 'txt', w: 150 },
];
const COR: Record<string, string> = { Rascunho: 'lf2-b--rasc', 'A aprovar': 'lf2-b--baixo', Aprovada: 'lf2-b--enc', Emitida: 'lf2-b--enc', 'Parcialmente recebida': 'lf2-b--baixo', Recebida: 'lf2-b--pend', Fechada: 'lf2-b--pend', Cancelada: 'lf2-b--rutura' };
const IC: Record<string, string> = { Rascunho: fileText, 'A aprovar': clock, Aprovada: check, Emitida: send, 'Parcialmente recebida': truck, Recebida: packageCheck, Fechada: lock, Cancelada: ban };
function celula(d: Doc, k: string): string {
  switch (k) {
    case 'numero': return `<span class="lf2-art"><b>${esc(String(d.numero))}</b></span>`;
    case 'data': return dia(String(d.data));
    case 'tipo': return '<span class="is-nada" title="O protótipo ainda não tem tipos de encomenda">—</span>';
    case 'despCli': return '<span class="is-nada" title="O protótipo ainda não tem despesas de cliente">—</span>';
    case 'estado': return `<span class="lf2-badges"><span class="lf2-b ${COR[String(d.estado)] ?? ''}">${L(IC[String(d.estado)] ?? fileText)}${esc(String(d.estado))}</span>${d.semPreco ? `<span class="lf2-b lf2-b--baixo" title="Linhas sem preço">${d.semPreco} sem preço</span>` : ''}</span>`;
    case 'emRececao': return d.emRececao ? `<span class="dv2-sim">${L(truck)}<b>Sim</b> <small>${Math.round((d.recebidoPct as number) * 100)} % recebido</small></span>` : '<span class="is-nada">—</span>';
    case 'fechada': return d.fechada ? `<span class="dv2-sim">${L(lock)}<b>Sim</b></span>` : '<span class="is-nada">—</span>';
    case 'anulado': return d.anulado ? `<span class="dv2-sim dv2-sim--nao">${L(ban)}<b>Sim</b></span>` : '<span class="is-nada">—</span>';
    case 'valor': return euros(d.valor as number);
    default: return esc(String(d[k] ?? '')) || '<span class="is-nada">—</span>';
  }
}
function valor(d: Doc, k: string): string | number {
  if (k === 'emRececao' || k === 'fechada' || k === 'anulado') return d[k] ? 'Sim' : '';
  return (d[k] as string | number) ?? '';
}
const dd = (t: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${t}</dt><dd>${v}</dd></div>`;
const docBtn = (rota: string, titulo: string, ecra: string, t: string, ic = fileText, ref = titulo) => `<button type="button" class="dv2-doc" data-dv2-acao="abrir-doc" data-rota="${rota}" data-titulo="${esc(titulo)}" data-ecra="${ecra}" data-ref="${esc(ref)}">${L(ic)}<span><small>${t}</small><b class="is-mono">${esc(titulo)}</b></span>${L(external)}</button>`;
/** As passagens que o domínio deixa fazer, como botões (as que pedem motivo abrem um diálogo). */
const PASSAGENS: Acao[] = ['submeter', 'aprovar', 'rejeitar', 'emitir', 'fechar', 'lembrar'];
function painel(x: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  const e = enc_(d), t = totais(e), f = fornecedor(e.forn), rc = recebido(e), recs = rececoesDe(e.ref), orig = cotacoes().find((c) => c.encomenda === e.ref);
  if (tab === '_alvo') return `<b>${esc(e.ref)}</b><span>${esc(String(d.fornNome))} · ${e.linhas.length} ${e.linhas.length === 1 ? 'linha' : 'linhas'} · ${euros(t.base)} s/ IVA</span><span class="lf2-insp-ir"><button type="button" class="ak-btn" data-dk-janela="fornecedor:${esc(e.forn)}">${L(building)}<span>${esc(String(d.fornNome))}</span></button></span>`;
  if (tab === 'detalhes') {
    const acoes = acoesDe(e, x.perfil).filter((a) => PASSAGENS.includes(a));
    return `${x.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(x.recusa)}</p>` : ''}
      <div class="dv2-estado-faixa ${d.anulado ? 'is-anulado' : d.fechada || e.estado === 'Recebida' ? 'is-ok' : acoes.length ? 'is-pronto' : 'is-espera'}">${L(IC[String(d.estado)] ?? fileText)}<span><b>${esc(String(d.estado))}.</b> ${d.anulado ? 'Fica no histórico; não se altera nem se recebe.' : d.fechada ? `Fechada${rc.pct < 1 ? ` com ${Math.round(rc.pct * 100)} % recebido — fechar não quer dizer recebida` : ', tudo recebido'}.` : e.estado === 'Rascunho' ? 'Altera-se na ficha (F6) e depois submete-se.' : e.estado === 'Parcialmente recebida' ? `${Math.round(rc.pct * 100)} % recebido; faltam ${nf(rc.q - rc.r)} unidades.` : acoes.length ? 'O que se pode fazer agora:' : 'Nada a fazer com o teu perfil.'}</span>
        ${acoes.map((a) => `<button type="button" class="ak-btn${a === 'emitir' || a === 'submeter' || a === 'aprovar' ? ' ak-btn--acao' : ' ak-btn--linha'}" data-dv2-acao="passar" data-a="${a}">${L(a === 'rejeitar' ? xIc : a === 'fechar' ? lock : a === 'lembrar' ? clock : arrowRight)}<span>${esc(NOME_ACAO[a])}</span></button>`).join('')}</div>
      <dl class="lf2-dl dv2-dl">${dd('Número', `<b class="is-mono">${esc(e.ref)}</b>`)}${dd('Data', dia(e.data))}${dd('Fornecedor', `${esc(String(d.fornNome))}<small>Código ${esc(e.forn)} · ${esc(f?.nif ?? '')}</small>`)}${dd('N.º do documento do fornecedor', esc(e.refForn || '—'))}
        ${dd('Descrição / observações', esc(e.notas || '—'), 'is-largo')}${dd('Armazém de destino', esc(e.armazem))}${dd('Entrega prevista', dia(e.entrega))}
        ${dd('Pagamento', esc(e.pagamento))}${dd('Moeda', 'EUR · euro')}${dd('Comprador', esc(PERFIS[e.comprador].pessoa))}${dd('Despesa do cliente', '<span class="is-nada">—</span>')}
        ${dd('Bruto', euros(t.bruto))}${dd('Descontos', euros(t.descontos))}${dd('Portes', euros(t.portes))}${dd('Valor sem IVA', `<b>${euros(t.base)}</b>`)}
        ${dd('IVA', t.iva.map((v) => `${pct(v.taxa)}: ${euros(v.valor)}`).join(' · ') || '—')}${dd('Total com IVA', `<b>${euros(t.total)}</b>`)}${dd('Origem', orig ? docBtn('compras.cotacao', orig.ref, 'compras-cotacao', 'Orçamento / pedido', scale) : '<span class="is-nada">Sem orçamento de origem</span>', 'is-largo')}</dl>
      <details class="dv2-hist"><summary>Histórico (${e.historico.length})</summary><ol>${e.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b>${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}<small>${esc(h.quem)}</small></li>`).join('')}</ol></details>`;
  }
  if (tab === 'linhas') return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Ref. do fornecedor</th><th>Descrição</th><th class="is-num">Qtd.</th><th>Un.</th><th class="is-num">Preço</th><th class="is-num">Desc.</th><th class="is-num">Valor líquido</th><th class="is-num">Recebida</th><th class="is-num">Pendente</th><th>Entrega</th></tr></thead><tbody>${e.linhas.map((l) => { const a = artigo(l.ref), liq = linhaLiquida(l);
      return `<tr><td class="is-mono">${esc(l.ref)}</td><td class="is-mono">${esc(a?.refForn ?? '')}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)}</td><td>${esc(a?.un ?? '')}</td><td class="is-num">${l.preco === null ? '<span class="lf2-b lf2-b--baixo">sem preço</span>' : euros(l.preco)}</td><td class="is-num">${pct(l.desc)}</td><td class="is-num">${liq === null ? '—' : euros(liq)}</td><td class="is-num">${nf(l.recebida)}${l.rejeitada ? ` <small>(${nf(l.rejeitada)} rej.)</small>` : ''}</td><td class="is-num"><b>${nf(Math.max(0, l.qtd - l.recebida))}</b></td><td>${dia(l.entrega)}</td></tr>`; }).join('')}</tbody>
      <tfoot><tr><td colspan="7">Líquido</td><td class="is-num">${euros(t.liquido)}</td><td colspan="3"></td></tr><tr><td colspan="7">Portes</td><td class="is-num">${euros(t.portes)}</td><td colspan="3"></td></tr><tr class="is-total"><td colspan="7">Valor sem IVA</td><td class="is-num"><b>${euros(t.base)}</b></td><td colspan="3"></td></tr></tfoot></table>`;
  if (tab === 'rececoes') {
    if (x.extra.rececoesCarregar) return '<div class="lf2-esq lf2-esq--peq" aria-label="A carregar as receções"><i></i><i></i><i></i></div>';
    const podeReceber = acoesDe(e, x.perfil).includes('receber');
    return `<ul class="dv2-prog-l" aria-label="Recebido por linha">${e.linhas.map((l) => `<li data-dv2-linha-ref="${esc(l.ref)}"><span class="is-mono">${esc(l.ref)}</span><span class="dv2-barra-p" role="img" aria-label="${nf(l.recebida)} de ${nf(l.qtd)} recebidos"><i data-dv2-p="${l.qtd ? l.recebida / l.qtd : 0}" style="transform:scaleX(${l.qtd ? l.recebida / l.qtd : 0})"></i></span><small>${nf(l.recebida)} / ${nf(l.qtd)} · faltam <b>${nf(Math.max(0, l.qtd - l.recebida))}</b></small></li>`).join('')}</ul>
      <div class="dv2-anexos-cab"><h3>Receções ligadas (${recs.length})</h3>${podeReceber ? docBtn('compras.rececao', `Receção · ${e.ref}`, 'compras-rececao', 'Registar receção', packageCheck, e.ref) : `<small>${e.estado === 'Emitida' || e.estado === 'Parcialmente recebida' ? 'Quem regista receções é o Armazém.' : `Uma encomenda «${esc(e.estado)}» não recebe mercadoria.`}</small>`}</div>
      ${recs.length ? `<div class="dv2-recs">${recs.map((rc) => `<article class="dv2-rec" tabindex="0" data-dv2-rec="${esc(rc.linhas.map((l) => l.ref).join('|'))}"><header><b>${esc(rc.ref)}</b><span class="lf2-b lf2-b--pend">${L(packageCheck)}Registada</span></header><p>${dia(rc.data)} · guia ${esc(rc.guia)} · ${esc(PERFIS[rc.por].pessoa)}</p><p>${rc.linhas.map((l) => `${esc(l.ref)}: ${nf(l.aceite)} aceites${l.rejeitada ? `, ${nf(l.rejeitada)} rejeitadas (${esc(l.motivo)})` : ''}`).join(' · ')}</p>${docBtn('compras.rececoes', 'Receções', 'compras-rececoes', 'Ver nas receções', external, rc.ref)}</article>`).join('')}</div>`
        : `<p class="lf2-sem">${L(truck)}Ainda não há receções desta encomenda. A mercadoria só conta depois de a receção ser registada.</p>`}`;
  }
  if (tab === 'edi') {
    const regs = registosDe(e.ref), cen = x.extra.ediCenario as string | undefined;
    const sim = cen === 'a-enviar' ? `<li class="is-a-enviar"><span><b>${L(loader)} Enviar TecCom · a enviar</b><small>À espera da confirmação da TecCom. Não feches; se não chegar, o resultado fica por saber e nada se reenvia sozinho.</small></span></li>`
      : cen === 'confirmado' ? `<li><span><b>${L(circleCheck)} Enviar TecCom · confirmado</b><small>A TecCom confirmou a receção (ORDRSP) às 10:14. Só agora se diz «enviado».</small></span></li>`
      : cen === 'falhou' ? `<li><span><b>${L(circleAlert)} Enviar TecCom · falhou</b><small>A TecCom recusou: «Fornecedor sem GLN configurado» (erro 4012). Nada ficou enviado; corrige a ficha do fornecedor e tenta outra vez.</small></span></li>`
      : cen === 'desconhecido' ? `<li><span><b>${L(circleHelp)} Enviar TecCom · sem resposta</b><small>Passaram 60 s sem confirmação: não se sabe se chegou. Não se reenvia sozinho — confirma no portal TecCom antes de enviar outra vez.</small></span></li>` : '';
    return `${cen ? `<p class="lf2-nota">Como fica com a ligação TecCom configurada; o protótipo não envia.</p><ul class="dv2-edi-l dv2-edi-reg">${sim}</ul>` : ''}
      <h3 class="dv2-h3">Integrações</h3><ul class="dv2-edi-l">${EDI.map((i) => { const p = porqueEdi(x, i, e); return `<li class="${p ? 'is-off' : ''}"><span><b>${esc(i.t)}${i.tecla ? ` <kbd>${i.tecla}</kbd>` : ''}</b><small>${esc(p || i.formato)}</small></span>${p ? '' : `<button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="edi:${i.k}">${L(i.tipo === 'auto' ? arrowRight : fileDown)}<span>${i.tipo === 'auto' ? 'Abrir a Lista de Faltas' : 'Gerar ficheiro'}</span></button>`}</li>`; }).join('')}</ul>
      <h3 class="dv2-h3">Registo (${regs.length})</h3>${regs.length ? `<ul class="dv2-edi-l dv2-edi-reg">${regs.map((g) => `<li><span><b>${esc(EDI.find((i) => i.k === g.k)?.t ?? g.k)} · gerado</b><small>${esc(g.ficheiro)} · versão ${g.versao} · ${esc(g.quem)} · ${new Date(g.quando).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · por enviar ao fornecedor</small></span></li>`).join('')}</ul>` : '<p class="lf2-sem">Nenhum ficheiro gerado para esta encomenda.</p>'}`;
  }
  return '';
}

/* ---------- a ficha ---------- */
const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="dv2-ff-${k}"><span>${t}</span>${input}</label>`;
const datalist = `<datalist id="dv2-artigos-enc">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)} · ${esc(a.marca)}</option>`).join('')}</datalist>`;
const eur = (c: number | null) => c === null ? '' : (c / 100).toFixed(2).replace('.', ',');
function linhaFicha(i: number, l: Partial<LinhaEnc> & { ref?: string }, dis: boolean): string {
  const a = artigo(l.ref ?? '');
  return `<tr data-dv2-linha="${i}" data-id="${esc(l.id ?? '')}" data-recebida="${l.recebida ?? 0}"><td><input type="text" list="dv2-artigos-enc" value="${esc(l.ref ?? '')}" data-dv2-ff="art-${i}" data-dv2-l="ref" aria-label="Artigo, linha ${i + 1}" placeholder="Referência"${dis ? ' disabled' : ''}></td><td data-dv2-l-desc>${esc(a?.desc ?? '')}</td>
    <td><input type="text" inputmode="numeric" class="is-num" value="${l.qtd ?? ''}" data-dv2-ff="qtd-${i}" data-dv2-l="qtd" aria-label="Quantidade, linha ${i + 1}"${dis ? ' disabled' : ''}></td><td data-dv2-l-un>${esc(a?.un ?? '')}</td>
    <td><input type="text" inputmode="decimal" class="is-num" value="${eur(l.preco ?? (a?.preco ?? null))}" data-dv2-ff="pr-${i}" data-dv2-l="preco" aria-label="Preço unitário, linha ${i + 1}" placeholder="sem preço"${dis ? ' disabled' : ''}></td>
    <td><input type="text" inputmode="decimal" class="is-num" value="${((l.desc ?? 0) / 100).toString().replace('.', ',')}" data-dv2-ff="ds-${i}" data-dv2-l="desc" aria-label="Desconto em %, linha ${i + 1}"${dis ? ' disabled' : ''}></td>
    <td><input type="date" value="${l.entrega ?? ''}" data-dv2-ff="en-${i}" data-dv2-l="entrega" aria-label="Entrega, linha ${i + 1}"${dis ? ' disabled' : ''}></td>
    <td class="is-num" data-dv2-l-liq>—</td><td>${dis ? '' : `<button type="button" class="dv2-x" data-dv2-acao="del-linha" aria-label="Tirar a linha ${i + 1}">${L(trash)}</button>`}</td></tr>`;
}
const editavel = (x: EstDoc, d: Doc | undefined) => !!d && enc_(d).estado === 'Rascunho' && pode(x.perfil, 'editar');
function ficha(x: EstDoc, f: Ficha, d: Doc | undefined): string {
  const e = d ? enc_(d) : undefined, ver = f.modo === 'editar' && !editavel(x, d), forn = e?.forn ?? '';
  const ls: Partial<LinhaEnc>[] = e?.linhas ?? [{ ref: '', qtd: undefined, desc: 0 }];
  return `<div class="dv2-ficha-c"><header class="dv2-ficha-cab"><span class="dv2-ficha-ic">${L(fileText)}</span><div><small>${f.modo === 'criar' ? 'Criação' : ver ? 'Visualização' : 'Edição'}</small><h2>${f.modo === 'criar' ? 'Nova encomenda' : `${esc(e!.ref)} · ${esc(String(d!.fornNome))}`}</h2></div>
      <div class="dv2-ficha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-ficha">${L(arrowLeft)}<span>${ver ? 'Voltar à lista' : 'Cancelar'}</span><kbd>Esc</kbd></button>${ver ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="gravar">${L(save)}<span>Gravar rascunho</span><kbd>Ctrl Enter</kbd></button>`}</div></header>
    <p class="lf2-recusa" data-dv2-ficha-erro role="alert" hidden></p>
    <p class="dv2-ficha-modo">${f.modo === 'criar' ? 'A encomenda nasce em rascunho. Depois submete-se (até 10 000,00 € fica aprovada; acima, vai à Administração).' : ver ? `A encomenda está «${esc(e!.estado)}»: só o rascunho se altera.` : 'Rascunho: grava-se com a versão que abriste; se outra pessoa gravou entretanto, o domínio recusa.'}</p>
    <div class="dv2-ficha-g">
      ${campo('serie', 'Série', '<select id="dv2-ff-serie" disabled><option>EF 2026</option></select>')}
      ${campo('numero', 'Número', `<input type="text" id="dv2-ff-numero" value="${esc(e?.ref ?? 'Atribuído ao gravar')}" readonly>`)}
      ${campo('data', 'Data', `<input type="date" id="dv2-ff-data" value="${e?.data ?? HOJE}" readonly>`)}
      ${campo('forn', 'Fornecedor', `<select id="dv2-ff-forn" data-dv2-ff="forn"${f.modo === 'criar' ? '' : ' disabled'}>${f.modo === 'criar' ? '<option value="">Escolhe o fornecedor…</option>' : ''}${FORNECEDORES.filter((x_) => x_.ativo || x_.id === forn).map((x_) => `<option value="${x_.id}"${x_.id === forn ? ' selected' : ''}>${esc(x_.nome)} · ${x_.id}</option>`).join('')}</select>`)}
      ${campo('refForn', 'N.º do documento do fornecedor', `<input type="text" id="dv2-ff-refForn" value="${esc(e?.refForn ?? '')}" data-dv2-ff="refForn" placeholder="A que ele der"${ver ? ' disabled' : ''}>`)}
      ${campo('entrega', 'Entrega prevista', `<input type="date" id="dv2-ff-entrega" value="${e?.entrega ?? ''}" data-dv2-ff="entrega"${ver ? ' disabled' : ''}>`)}
      ${campo('pagamento', 'Pagamento', `<input type="text" id="dv2-ff-pagamento" value="${esc(e?.pagamento ?? '')}" data-dv2-ff="pagamento" placeholder="O do fornecedor"${ver ? ' disabled' : ''}>`)}
      ${campo('portes', 'Portes (€)', `<input type="text" inputmode="decimal" id="dv2-ff-portes" value="${eur(e?.portes ?? 0)}" data-dv2-ff="portes"${ver ? ' disabled' : ''}>`)}
      ${campo('armazem', 'Armazém de destino', `<input type="text" id="dv2-ff-armazem" value="${esc(e?.armazem ?? ARMAZEM)}" readonly>`)}
      ${campo('moeda', 'Moeda', '<select id="dv2-ff-moeda" disabled><option>EUR · euro</option></select>')}
      ${campo('notas', 'Descrição / observações', `<textarea id="dv2-ff-notas" rows="2" data-dv2-ff="notas"${ver ? ' disabled' : ''}>${esc(e?.notas ?? '')}</textarea>`, 'is-largo')}
    </div>
    <h3 class="dv2-h3">Linhas</h3>${datalist}
    <div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Qtd.</th><th>Un.</th><th class="is-num">Preço unitário (€)</th><th class="is-num">Desconto (%)</th><th>Entrega</th><th class="is-num">Valor líquido</th><th><span class="sr">Tirar</span></th></tr></thead><tbody data-dv2-linhas>${ls.map((l, i) => linhaFicha(i, l, ver)).join('')}</tbody>
      <tfoot><tr><td colspan="7">Líquido</td><td class="is-num" data-dv2-t="liquido">—</td><td></td></tr><tr><td colspan="7">IVA (pelas taxas dos artigos)</td><td class="is-num" data-dv2-t="iva">—</td><td></td></tr><tr class="is-total"><td colspan="7">Total com IVA</td><td class="is-num" data-dv2-t="total">—</td><td></td></tr></tfoot></table></div>
    ${ver ? '' : `<button type="button" class="ak-btn ak-btn--linha dv2-mais-linha" data-dv2-acao="add-linha">${L(plus)}<span>Juntar linha</span></button>`}
    <p class="dv2-ficha-dica">Enter passa ao campo seguinte; no último, vai a Gravar. Preços com vírgula (ex.: 15,50); vazio = sem preço (não se submete). Esc fecha (com alterações, pergunta).</p></div>`;
}
const recusa = (m: string, c: string) => Object.assign(new Recusa(m), { campo: c });
function lerLinhas(r: HTMLElement, validar: boolean): LinhaEnc[] {
  return [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr')].map((tr, i): LinhaEnc | null => {
    const v = (k: string) => tr.querySelector<HTMLInputElement>(`[data-dv2-l="${k}"]`)?.value.trim() ?? '';
    const ref = v('ref'), q = v('qtd'), p = v('preco'), ds = v('desc') || '0';
    if (!ref && !q) return null;
    const a = artigo(ref); if (validar && !a) throw recusa(ref ? `«${ref}» não é um artigo conhecido.` : 'Escreve o artigo de cada linha.', `art-${i}`);
    const qtd = Number(q.replace(/\s/g, '')); if (validar && (!Number.isInteger(qtd) || qtd <= 0)) throw recusa(`${ref}: a quantidade é um número inteiro maior do que zero.`, `qtd-${i}`);
    const preco = p ? lerEuros(p) : null; if (validar && p && preco === null) throw recusa(`${ref}: o preço é um valor em euros, ex.: 15,50.`, `pr-${i}`);
    const desc = lerPercentagem(ds); if (validar && desc === null) throw recusa(`${ref}: o desconto vai de 0 a 100 %.`, `ds-${i}`);
    const rec = Number(tr.dataset.recebida ?? 0);
    return { id: tr.dataset.id || `n${Date.now().toString(36)}${i}`, ref, qtd: Number.isFinite(qtd) ? qtd : 0, preco, desc: desc ?? 0, iva: a?.iva ?? 2300, entrega: v('entrega'), recebida: rec, rejeitada: 0 };
  }).filter((l): l is LinhaEnc => !!l);
}
function gravar(r: HTMLElement, x: EstDoc, f: Ficha): { ref: string; msg: string } {
  const v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
  const linhas_ = lerLinhas(r, true);
  const portes = lerEuros(v('portes') || '0'); if (portes === null) throw recusa('Os portes são um valor em euros, ex.: 12,50.', 'portes');
  if (f.modo === 'criar') {
    if (!v('forn')) throw recusa('Escolhe o fornecedor.', 'forn');
    const n = criar(x.perfil, v('forn'));
    const g = guardar(x.perfil, { ...n, refForn: v('refForn'), entrega: v('entrega') || n.entrega, pagamento: v('pagamento') || n.pagamento, portes, notas: v('notas'), linhas: linhas_.map((l) => ({ ...l, entrega: l.entrega || v('entrega') || n.entrega })) }, n.versao);
    return { ref: g.ref, msg: `Rascunho ${g.ref} criado para ${nomeF(g.forn)}: ${euros(totais(g).base)} s/ IVA.` };
  }
  const d = ativoDe(r, x); if (!d) throw new Recusa('A encomenda já não está na lista.');
  const e = enc_(d);
  const g = guardar(x.perfil, { ...e, refForn: v('refForn'), entrega: v('entrega') || e.entrega, pagamento: v('pagamento') || e.pagamento, portes, notas: v('notas'), linhas: linhas_.map((l) => ({ ...l, entrega: l.entrega || e.entrega })) }, e.versao);
  return { ref: g.ref, msg: `${g.ref} gravada (versão ${g.versao}).` };
}
function recalcular(r: HTMLElement): void {
  let ls: LinhaEnc[] = []; try { ls = lerLinhas(r, false); } catch { return; }
  const portes = lerEuros(r.querySelector<HTMLInputElement>('[data-dv2-ficha] [data-dv2-ff="portes"]')?.value.trim() || '0') ?? 0, t = totais({ linhas: ls, portes });
  r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr').forEach((tr) => { const l = ls.find((y) => y.ref === tr.querySelector<HTMLInputElement>('[data-dv2-l="ref"]')?.value.trim() && String(y.qtd) === tr.querySelector<HTMLInputElement>('[data-dv2-l="qtd"]')?.value.trim()); const c = tr.querySelector<HTMLElement>('[data-dv2-l-liq]'); if (c) c.textContent = l ? (linhaLiquida(l) === null ? 'sem preço' : euros(linhaLiquida(l)!)) : '—'; });
  const s = (k: string, val: string) => { const c = r.querySelector<HTMLElement>(`[data-dv2-ficha] [data-dv2-t="${k}"]`); if (c) c.textContent = val; };
  s('liquido', euros(t.liquido)); s('iva', euros(t.total - t.base)); s('total', euros(t.total));
}

/* ---------- as passagens de estado ---------- */
function passar(r: HTMLElement, x: EstDoc, a: Acao, motivo = ''): void {
  const d = ativoDe(r, x); if (!d) return;
  const pede = a === 'rejeitar' || (a === 'fechar' && enc_(d).estado === 'Parcialmente recebida');
  if (pede && !motivo) {
    dialogo(r, `<h2 id="dv2-dlg-t">${L(a === 'fechar' ? lock : xIc)}${esc(NOME_ACAO[a])} a ${esc(String(d.ref))}?</h2><p>${a === 'fechar' ? 'Ainda falta mercadoria: fechar não a dá como recebida. Diz porque fechas.' : 'O comprador precisa de saber porquê.'}</p><label class="ak-campo dv2-motivo" for="dv2-motivo"><span>Motivo (obrigatório)</span><textarea id="dv2-motivo" rows="3" data-dv2-motivo data-dv2-primeiro></textarea></label><p class="ak-erro-campo" data-dv2-dlg-erro role="alert" hidden></p>
      <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="passar-sim" data-a="${a}">${L(check)}<span>${esc(NOME_ACAO[a])}</span></button></div>`);
    return;
  }
  try { const e = transitar(x.perfil, String(d.ref), a, motivo); fecharDialogo(r); x.recusa = ''; tudo(r, x, true); toast(r, `${e.ref}: ${NOME_ACAO[a].toLowerCase()} — agora «${e.estado}».`); }
  catch (y) { const m = y instanceof Recusa ? y.message : 'Não foi possível. Nada mudou.'; const er = r.querySelector<HTMLElement>('[data-dv2-dlg-erro]'); if (er) { er.hidden = false; er.textContent = m; } else { x.recusa = m; inspetor(r, x); } }
}

/* ---------- registar ---------- */
export const CFG = registar({
  k: 'enc', titulo: 'Encomendas a Fornecedores', sub: 'Consulta, cria e acompanha as encomendas aos fornecedores.', icone: fileText, um: 'encomenda', o: 'a',
  caminho: [['ERP', 'inicio'], ['Compras', 'compras'], ['Encomendas', '']],
  cols: COLS, verIniciais: ['numero', 'data', 'tipo', 'docForn', 'despCli', 'forn', 'fornNome', 'desc', 'estado', 'emRececao', 'fechada', 'anulado', 'moeda', 'valor'],
  campos: { numero: 'n', data: 'data', codigo: 'forn', descricao: 'desc' },
  linhas, series: () => [...new Set(encomendas().map((e) => e.ref.split('/')[0]))], serieDe: (d) => String(d.serie), fornDe: (d) => String(d.forn), dataDe: (d) => String(d.data), moedaDe: (d) => String(d.moeda),
  estados: [['', 'Todos'], ['rascunho', 'Rascunho e a aprovar'], ['curso', 'Em curso (aprovada, emitida)'], ['rececao', 'Em receção'], ['recebida', 'Recebidas'], ['fechada', 'Fechadas'], ['anulada', 'Anuladas']],
  estadoPassa: (d, v) => { const s = String(d.estado); return v === 'rascunho' ? s === 'Rascunho' || s === 'A aprovar' : v === 'curso' ? s === 'Aprovada' || s === 'Emitida' : v === 'rececao' ? !!d.emRececao : v === 'recebida' ? s === 'Recebida' : v === 'fechada' ? !!d.fechada : v === 'anulada' ? !!d.anulado : true; },
  celula, valor,
  resumo: (ls) => { const c = (f: (d: Doc) => boolean) => ls.filter(f).length, n = (f: (d: Doc) => boolean) => nf(c(f)), eur_ = ls.filter((d) => d.moeda === 'EUR').reduce((s, d) => s + (d.valor as number), 0), fe = c((d) => !!d.fechada); return ls.length ? `<span><b>${n((d) => d.estado === 'Rascunho' || d.estado === 'A aprovar')}</b> por emitir</span><span><b>${n((d) => !!d.emRececao)}</b> em receção</span><span><b>${n((d) => d.estado === 'Emitida')}</b> à espera</span><span><b>${nf(fe)}</b> ${fe === 1 ? 'fechada' : 'fechadas'}</span><span>Soma em EUR <b>${euros(eur_)}</b> s/ IVA</span>` : ''; },
  barra: `<span class="ak-menu-c">${BTN('edi', send, 'Enviar / Integrar', '', ' aria-haspopup="menu" aria-expanded="false"', 'lf2-btn-compra')}${L(chevronDown, 'dv2-seta-menu')}<div class="ak-menu dv2-edi-menu" role="menu" data-dv2-menu="edi" data-por-cima hidden></div></span>`, teclasExtra: '',
  tabs: [{ k: 'detalhes', t: 'Detalhes', ic: info }, { k: 'linhas', t: 'Linhas', ic: list }, { k: 'rececoes', t: 'Receções', ic: truck }, { k: 'edi', t: 'EDI', ic: plug }, { k: 'anexos', t: 'Anexos', ic: paperclip }],
  painel, ficha, gravar,
  porque: {
    novo: (x) => pode(x.perfil, 'criar') ? '' : 'O teu perfil não cria encomendas.',
    editar: (x, d) => !d ? 'Escolhe uma encomenda na lista.' : !pode(x.perfil, 'editar') ? 'O teu perfil só consulta as encomendas.' : editavel(x, d) ? '' : `A encomenda está «${d.estado}»: só o rascunho se altera; Enter abre-a para ver.`,
    anular: (x, d) => !d ? 'Escolhe uma encomenda na lista.' : d.anulado ? 'Já está anulada.' : acoesDe(enc_(d), x.perfil).includes('cancelar') ? '' : !pode(x.perfil, 'cancelar') ? 'O teu perfil não anula encomendas.' : enc_(d).linhas.some((l) => l.recebida > 0) ? 'Já há mercadoria recebida: a encomenda fecha-se, não se anula.' : `Uma encomenda «${d.estado}» não se anula.`,
  },
  anular: {
    texto: (d) => [`Anular a ${d.ref}?`, `A encomenda a ${esc(String(d.fornNome))} fica anulada e no histórico; nada se apaga. ${d.estado === 'Emitida' ? 'Já foi emitida: avisa o fornecedor.' : ''}`],
    fazer: (x, d, motivo) => { const e = transitar(x.perfil, String(d.ref), 'cancelar', motivo); return `${e.ref} anulada. Fica no histórico.`; },
  },
  docAnexo: (d) => String(d.ref),
  teclas: EDI.filter((i) => i.tecla).map((i) => ({ tecla: i.tecla, acao: `edi:${i.k}` })),
  acao(r, x, k, b) {
    if (k === '_barra') { menuEdi(r, x); return true; }
    if (k === '_ficha-aberta') { recalcular(r); return true; }
    if (k === '_ficha-input') { const i = b as HTMLInputElement; if (i.dataset.dv2L === 'ref') { const tr = i.closest('tr')!, a = artigo(i.value.trim()); tr.querySelector('[data-dv2-l-desc]')!.textContent = a?.desc ?? ''; tr.querySelector('[data-dv2-l-un]')!.textContent = a?.un ?? ''; const p = tr.querySelector<HTMLInputElement>('[data-dv2-l="preco"]'); if (a && p && !p.value) p.value = eur(a.preco); } recalcular(r); return true; }
    if (k === 'edi') { menuEdi(r, x); abrirMenu(r, 'edi'); return true; }
    if (k.startsWith('edi:')) { const i = EDI.find((y) => y.k === k.slice(4)); if (i) gerarEdi(r, x, i, null); return true; }
    if (k === 'edi-outra') { const i = EDI.find((y) => y.k === b.dataset.k); if (i) gerarEdi(r, x, i, b, true); return true; }
    if (k === 'abrir-doc') { abrirDoc(b, b.dataset.rota!, b.dataset.titulo!, b.dataset.ecra!, b.dataset.ref || b.dataset.titulo!); return true; }
    if (k === 'passar') { passar(r, x, b.dataset.a as Acao); return true; }
    if (k === 'passar-sim') { passar(r, x, b.dataset.a as Acao, r.querySelector<HTMLTextAreaElement>('[data-dv2-motivo]')?.value.trim() || ' '); return true; }
    if (k === 'add-linha') { const tb = r.querySelector<HTMLElement>('[data-dv2-linhas]')!, i = tb.children.length; tb.insertAdjacentHTML('beforeend', linhaFicha(i, { desc: 0 }, false)); const tr = tb.lastElementChild as HTMLElement; if (!quieto()) tr.animate([{ opacity: 0, transform: 'scaleY(.4)', transformOrigin: 'top' }, { opacity: 1, transform: 'none', transformOrigin: 'top' }], { duration: 180, easing: 'ease-out' }); tr.querySelector<HTMLElement>('input')?.focus(); if (x.ficha) x.ficha.sujo = true; return true; }
    if (k === 'del-linha') { const tr = b.closest('tr'), tb = tr?.parentElement; if (!tr || !tb) return true; if (Number(tr.dataset.recebida ?? 0) > 0) { toast(r, 'Esta linha já tem mercadoria recebida: não se tira.'); return true; } if (tb.children.length > 1) { tr.remove(); if (x.ficha) x.ficha.sujo = true; recalcular(r); } else toast(r, 'A encomenda precisa de pelo menos uma linha.'); return true; }
    return false;
  },
  cenario(r, x, cen) {
    const es = encomendas(), por = (s: string) => es.find((e) => e.estado === s)?.ref ?? es[0]?.ref ?? '';
    const alvo: Record<string, string> = { editar: por('Rascunho'), fechada: por('Fechada'), parcial: por('Parcialmente recebida'), recebida: por('Recebida'), 'rececoes-carregar': por('Parcialmente recebida'), 'edi-indisponivel': por('Emitida'), 'edi-a-enviar': por('Emitida'), 'edi-confirmado': por('Emitida'), 'edi-falhou': por('Emitida'), 'edi-desconhecido': por('Emitida'), anular: por('Emitida'), anulada: por('Emitida'), gravado: por('Rascunho') };
    if (alvo[cen]) x.ativo = alvo[cen];
    if (cen === 'fechada' || cen === 'parcial' || cen === 'recebida') x.tab = cen === 'fechada' ? 'detalhes' : 'rececoes';
    if (cen === 'rececoes-carregar') { x.tab = 'rececoes'; x.extra.rececoesCarregar = true; }
    if (cen === 'anulada') { x.extra.anuladaSim = alvo[cen]; x.aviso = `${alvo[cen]} anulada: «O fornecedor deixou de fazer o artigo». Fica no histórico.`; }
    if (cen.startsWith('edi-')) { x.tab = 'edi'; if (cen !== 'edi-indisponivel') x.extra.ediCenario = cen.slice(4); }
    if (cen === 'edi-indisponivel') requestAnimationFrame(() => { menuEdi(r, x); abrirMenu(r, 'edi'); });
  },
  dica: 'Período e moeda juntam-se à pesquisa. Enter passa ao campo seguinte.',
});
void CFG;
/* passar por uma receção acende as linhas que ela cobriu (a ligação entre a encomenda e a receção) */
['mouseover', 'focusin'].forEach((t) => document.addEventListener(t, (ev) => {
  const c = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-dv2-rec]'), r = (ev.target as HTMLElement).closest?.<HTMLElement>('[data-dv2="enc"], [data-dv2="enc4"]'); if (!r) return;
  const refs = new Set(c?.dataset.dv2Rec?.split('|') ?? []);
  r.querySelectorAll<HTMLElement>('[data-dv2-linha-ref]').forEach((li) => li.classList.toggle('is-realce', refs.has(li.dataset.dv2LinhaRef!)));
}));

/* ---------- os ecrãs ---------- */
const NOTA = 'Encomendas a Fornecedores v3 (26 out., briefing «Gestão de Encomendas a Fornecedores V2» e o print do ERP antigo): as colunas do antigo, Pesquisar por Número/Data/Código/Descrição (F1 F2 F10 F12) com Iniciado por/Contendo (Shift+F1/F2), Série (F4), o painel (detalhes com as passagens de estado, linhas, receções, EDI, anexos), a ficha do rascunho, Anular (F8) e o EDI do antigo com as mesmas teclas — só gera ficheiros; nunca diz «enviado».';
export const ESTADOS: [string, string, string][] = [
  ['carregar', '10.31 · A carregar', 'A lista em esqueleto; a pesquisa e os filtros já servem.'],
  ['vazia', '10.32 · Sem encomendas', 'Ainda não há encomendas: Novo (F5).'],
  ['sem-resultados', '10.33 · Pesquisa sem resultados', 'Diz em que modo se procurou e como se compara.'],
  ['criar', '10.34 · Nova encomenda', 'A ficha nasce do botão Novo: fornecedor, documento, entrega, pagamento, portes e linhas, com os totais.'],
  ['editar', '10.35 · Editar o rascunho', 'O rascunho na ficha: linhas, preços e descontos; os totais e o IVA pelas regras do domínio.'],
  ['por-gravar', '10.36 · Alterações por gravar', 'Fechar a ficha com alterações: continuar a editar ou descartar.'],
  ['a-gravar', '10.37 · A gravar', 'O botão espera; nada se diz antes de o domínio aceitar.'],
  ['gravado', '10.38 · Gravada', 'A ficha fecha, a linha acende e a barra de estado diz o que se gravou.'],
  ['gravar-falhou', '10.39 · Gravar falhou', 'O servidor não respondeu: as alterações ficam na ficha.'],
  ['fechada', '10.40 · Fechada', 'Fechada não quer dizer recebida: a faixa diz quanto se recebeu.'],
  ['anular', '10.41 · Anular (F8)', 'A confirmação e o motivo; só antes de haver receções.'],
  ['anulada', '10.42 · Anulada', 'Fica, com «Anulada»; não se altera nem se recebe.'],
  ['parcial', '10.43 · Parcialmente recebida', 'As barras por linha (encomendado, recebido, pendente) e as receções ligadas.'],
  ['recebida', '10.44 · Recebida', 'Tudo recebido: as barras cheias e as receções; fechar é com Compras.'],
  ['rececoes-carregar', '10.45 · A carregar as receções', 'O separador das receções espera no seu sítio.'],
  ['edi-indisponivel', '10.46 · Integrações indisponíveis', 'O menu Enviar / Integrar: as que servem e as que não estão configuradas, com o motivo.'],
  ['edi-a-enviar', '10.47 · EDI a enviar', 'Como fica com a TecCom ligada: a enviar, à espera da confirmação.'],
  ['edi-confirmado', '10.48 · EDI confirmado', 'Só depois da confirmação do fornecedor se diz «enviado».'],
  ['edi-falhou', '10.49 · EDI falhou', 'O erro do fornecedor e o que fazer; nada ficou enviado.'],
  ['edi-desconhecido', '10.50 · EDI sem resposta', 'Sem confirmação no tempo: o resultado é desconhecido e nada se reenvia sozinho.'],
  ['anexos', '10.51 · Anexos', 'Os anexos da encomenda: ver, descarregar, carregar e remover.'],
  ['anexo-enviar', '10.52 · A carregar um anexo', 'O progresso real da leitura do ficheiro.'],
  ['anexo-falhou', '10.53 · O anexo falhou', 'Ficheiro grande demais: diz o limite; nada se guardou.'],
  ['imprimir', '10.54 · Imprimir (F11)', 'Imprime-se só a lista, com as colunas à vista.'],
  ['permissao', '10.55 · Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['sessao', '10.56 · Sessão terminada', 'Voltar a entrar pelo login comum; o que estava escrito fica.'],
  ['offline', '10.57 · Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['servidor', '10.58 · Servidor indisponível', 'O servidor das compras não respondeu: Tentar outra vez.'],
  ['restaurada', '10.59 · Área de trabalho reposta', 'Ao voltar: a pesquisa, os filtros e a encomenda escolhida como estavam.'],
];
export const fornecedoresDaLista = (): [string, string][] => [...new Set(encomendas().map((e) => e.forn))].map((f) => [f, nomeF(f)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], 'pt'));
const versao = (cen = 'normal') => ({ id: 'v3', nota: NOTA, html: paginaDoc(CFG, cen, fornecedoresDaLista()) });
/** O 10 ganha a v3 (abre por omissão) e os estados só da v3. */
export function comEncomendasV3(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  return [...ecras.map((e) => e.id === 'compras' ? { ...e, versoes: [...e.versoes, versao()] as Ecra<IdErp>['versoes'] } : e),
    ...ESTADOS.map(([cen, nome, objetivo]) => ({ id: `enc3-${cen}` as IdErp, nome, fluxo: 'Compras', estadoDe: 'compras' as IdErp, objetivo, versoes: [versao(cen)] as Ecra<IdErp>['versoes'] }))];
}
export type IdEnc3 = `enc3-${string}`;
