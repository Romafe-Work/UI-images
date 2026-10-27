/* =========================================================
   ERP — Compras: Encomendas v5, «Intelligent Purchasing Workspace» (27 out. 2026, briefing «ROMAFE ERP V3»).
   O mesmo ecrã da v4 (as três vistas e as regras das encomendas), redesenhado à volta da cadeia
   PEDIDO DO CLIENTE → ENCOMENDA → ENTREGA → RECEÇÃO:
     - menos barras: título e barra de ações na mesma zona; os filtros numa só linha (vistas · fornecedor · pesquisa
       com o modo num seletor · Mais filtros); Série, Estado, Período e Moeda em Mais filtros; etiquetas removíveis;
     - a barra muda com a vista: Novo em destaque nas Encomendas; «Abrir encomenda» no Agendamento e nos Pedidos;
       Imprimir e Anexos passam para Mais ações (F11 continua);
     - as vistas com um indicador que desliza; a encomenda escolhida continua ligada nas outras vistas (acende-se);
     - Agendamento em Lista ou Calendário (as datas de entrega reais); Pedidos de clientes com o que cobre cada pedido;
     - a janela das ligações (o «inspetor»): a linha escolhida e a cadeia real, com os documentos verdadeiros —
       abrir a encomenda abre-a na linha do artigo; nada se inventa (sem encomenda, diz-se; sem receção, diz-se).
   Movimento curto (o ERP é calmo: comportamento/calmo.ts). Ver compras/encomendas-v4.ts e docs-v2.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, BTN, L, esc, MODOS, type EstDoc, type CfgDoc } from './docs-v2';
import { nf, dialogo, abrirJanelaDoc, escolher, escolherRel, mudarVista, refrescarJanelas, docDe, ativoDe, toast, emSeparador } from './docs-v2-comportamento';
import { CFG, fornecedoresDaLista } from './encomendas-v3';
import { entregas, pedidos, passa, nomeF, type Entrega, type Pedido } from './encomendas-v4';
import { encomendas, rececoesDe, dia, HOJE } from './dominio';
import { faltas } from './faltas';
import { topoErp } from '../inicio-v2';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import calendarClock from 'lucide-static/icons/calendar-clock.svg?raw';
import calendarDays from 'lucide-static/icons/calendar-days.svg?raw';
import userStar from 'lucide-static/icons/user-star.svg?raw';
import searchX from 'lucide-static/icons/search-x.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import listIc from 'lucide-static/icons/list.svg?raw';
import listChecks from 'lucide-static/icons/list-checks.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import pencil from 'lucide-static/icons/pencil.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import printer from 'lucide-static/icons/printer.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import ellipsis from 'lucide-static/icons/ellipsis.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import sliders from 'lucide-static/icons/sliders-horizontal.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import chevronLeft from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import route from 'lucide-static/icons/route.svg?raw';
import packageCheck from 'lucide-static/icons/package-check.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import box from 'lucide-static/icons/box.svg?raw';
import building from 'lucide-static/icons/building-2.svg?raw';
import arrowRL from 'lucide-static/icons/arrow-right-left.svg?raw';
import openIc from 'lucide-static/icons/square-arrow-out-up-right.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';

const vazio = (ic: string, t: string, d: string) => `<div class="ak-vazio lf2-vazio">${L(ic)}<p><b>${t}</b>${d}</p></div>`;
const semNada = (e: EstDoc, um: string) => vazio(searchX, `Nenhum ${um} com estes filtros.`, e.q ? `Procura-se «${esc(e.q)}» em toda a linha.` : 'Tira um filtro, ou limpa-os.');
const situacao = (entrega: string) => entrega < HOJE ? ['is-atr', `Atrasada ${nf(dias(entrega))} ${dias(entrega) === 1 ? 'dia' : 'dias'}`] : entrega === HOJE ? ['is-hoje', 'Chega hoje'] : ['is-prazo', `Prevista ${dia(entrega)}`];
const dias = (iso: string) => Math.round((Date.parse(HOJE) - Date.parse(iso)) / 86_400_000);

/* ---------- as chaves das linhas das outras vistas (para a janela das ligações) ---------- */
const chaveA = (x: Entrega) => `a:${x.enc}|${x.ref}|${x.entrega}`;
const chaveC = (p: Pedido) => `c:${p.cli}|${p.ref}`;
const deA = (k: string) => { const [enc, ref, entrega] = k.slice(2).split('|'); return entregas().find((x) => x.enc === enc && x.ref === ref && x.entrega === entrega); };
const deC = (k: string) => { const [cli, ref] = k.slice(2).split('|'); return pedidos().find((p) => p.cli === cli && p.ref === ref); };
const liga = (e: EstDoc) => String(e.extra.liga ?? '');

/* ---------- Agendamento: Lista (em grupos) ou Calendário ---------- */
const agenda = (e: EstDoc) => e.extra.semAgenda ? [] : entregas().filter((x) => passa(e, x.forn, x.entrega, [x.enc, nomeF(x.forn), x.ref, x.desc]));
function listaAgenda(e: EstDoc, ls: Entrega[]): string {
  const grupos: [string, string, Entrega[]][] = [['Atrasadas', 'is-atr', ls.filter((x) => x.entrega < HOJE)], ['Hoje', 'is-hoje', ls.filter((x) => x.entrega === HOJE)], ['Próximas entregas', '', ls.filter((x) => x.entrega > HOJE)]];
  return `<table class="lf2-tab dv2-vt dv2c-vt" aria-label="Agendamento das entregas">
    <thead><tr><th scope="col"><span>Entrega prevista</span></th><th scope="col"><span>Situação</span></th><th scope="col"><span>Encomenda</span></th><th scope="col"><span>Fornecedor</span></th><th scope="col"><span>Artigo</span></th><th scope="col" class="is-p3"><span>Descrição</span></th><th scope="col" class="is-num"><span>Por receber</span></th><th scope="col" class="is-num is-p3"><span>Encomendado</span></th></tr></thead>
    <tbody>${grupos.map(([g, cls, xs]) => xs.length ? `<tr class="dv2-vt-grupo ${cls}"><th colspan="8" scope="rowgroup"><i></i>${g} <small>${nf(xs.length)} ${xs.length === 1 ? 'linha' : 'linhas'}</small></th></tr>${xs.map((x) => { const [sc, st] = situacao(x.entrega), k = chaveA(x);
      return `<tr data-dv2-vrel="${esc(k)}" tabindex="${e.extra.rel === k ? 0 : -1}" class="${e.extra.rel === k ? 'is-ativo ' : ''}${x.enc === liga(e) ? 'is-ligada' : ''}">
      <td>${dia(x.entrega)}</td><td><span class="dv2c-sit ${sc}">${st}</span></td>
      <td class="is-mono"><b class="dv2c-ref">${esc(x.enc)}</b></td><td>${esc(nomeF(x.forn))}</td><td class="is-mono">${esc(x.ref)}</td><td class="is-p3 dv2c-desc">${esc(x.desc)}</td>
      <td class="is-num"><b>${nf(x.pend)}</b><small>${esc(x.un)}</small></td><td class="is-num is-p3">${nf(x.qtd)}<small>${esc(x.un)}</small></td></tr>`; }).join('')}` : '').join('')}</tbody></table>`;
}
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
function calendario(e: EstDoc, ls: Entrega[]): string {
  const m = String(e.extra.calMes ?? HOJE.slice(0, 7)), [a, mm] = m.split('-').map(Number), d1 = new Date(Date.UTC(a, mm - 1, 1)), n = new Date(Date.UTC(a, mm, 0)).getUTCDate();
  const lead = (d1.getUTCDay() + 6) % 7, celulas = Math.ceil((lead + n) / 7) * 7, noMes = ls.filter((x) => x.entrega.startsWith(m)), fora = ls.length - noMes.length;
  const dCel = (i: number) => { const dd = i - lead + 1; if (dd < 1 || dd > n) return '<div class="dv2c-cal-d is-fora" aria-hidden="true"></div>';
    const iso = `${m}-${String(dd).padStart(2, '0')}`, xs = noMes.filter((x) => x.entrega === iso);
    return `<div class="dv2c-cal-d${iso === HOJE ? ' is-hoje' : ''}${(i % 7) >= 5 ? ' is-fds' : ''}" role="gridcell" aria-label="${dd} de ${MESES[mm - 1]}${xs.length ? `, ${xs.length} ${xs.length === 1 ? 'entrega' : 'entregas'}` : ''}"><span class="dv2c-cal-n">${dd}</span>
      ${xs.slice(0, 3).map((x) => { const [sc] = situacao(x.entrega), k = chaveA(x); return `<button type="button" class="dv2c-cal-i ${sc}${e.extra.rel === k ? ' is-ativo' : ''}${x.enc === liga(e) ? ' is-ligada' : ''}" data-dv2-vrel="${esc(k)}" title="${esc(`${x.enc} · ${x.ref} · ${nf(x.pend)} ${x.un} por receber`)}"><b>${esc(x.enc.replace('EF 2026/', 'EF '))}</b><span>${esc(x.ref)} · ${nf(x.pend)}</span></button>`; }).join('')}
      ${xs.length > 3 ? `<small>+${xs.length - 3}</small>` : ''}</div>`; };
  return `<div class="dv2c-cal" role="grid" aria-label="Entregas de ${MESES[mm - 1]} de ${a}">
    <div class="dv2c-cal-cab"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="cal-mes" data-d="-1" aria-label="Mês anterior">${L(chevronLeft)}</button><b>${MESES[mm - 1][0].toUpperCase()}${MESES[mm - 1].slice(1)} de ${a}</b><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="cal-mes" data-d="1" aria-label="Mês seguinte">${L(chevronRight)}</button>${fora ? `<span>${nf(fora)} ${fora === 1 ? 'entrega noutro mês' : 'entregas noutros meses'}</span>` : ''}</div>
    <div class="dv2c-cal-s" role="row">${['seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.', 'dom.'].map((x) => `<span role="columnheader">${x}</span>`).join('')}</div>
    <div class="dv2c-cal-g">${Array.from({ length: celulas }, (_, i) => dCel(i)).join('')}</div></div>`;
}
function tabelaAgenda(_r: HTMLElement, e: EstDoc): string {
  const ls = agenda(e);
  if (e.extra.semAgenda || !entregas().length) return vazio(inbox, 'Nada por receber.', 'Nenhuma encomenda aprovada, emitida ou parcialmente recebida tem linhas por receber.');
  if (!ls.length) return semNada(e, 'entrega');
  return e.extra.agCal ? calendario(e, ls) : listaAgenda(e, ls);
}
function resumoAgenda(e: EstDoc): string {
  const ls = agenda(e), atr = ls.filter((x) => x.entrega < HOJE).length, encs = new Set(ls.map((x) => x.enc)).size;
  return `<span><b>${nf(ls.length)}</b> por receber</span><span class="is-atr"><b>${nf(atr)}</b> ${atr === 1 ? 'atrasada' : 'atrasadas'}</span><span><b>${nf(encs)}</b> ${encs === 1 ? 'encomenda' : 'encomendas'}</span>`;
}

/* ---------- Pedidos de clientes: o que cobre cada pedido (as regras da Lista de Faltas) ---------- */
const doCliente = (e: EstDoc) => e.extra.semPedidos ? [] : pedidos().filter((p) => passa(e, p.forn, HOJE, [p.cli, p.ref, p.desc, p.fornNome, p.enc]));
/** A situação de um pedido, pelas regras reais: a encomenda que o cobre (e quando chega); o stock que já chega; a sugestão da Lista de Faltas. */
function cobre(p: Pedido): { cls: string; t: string; acao: 'enc' | 'faltas' | '' } {
  if (p.enc) { const l = encomendas().find((x) => x.ref === p.enc)?.linhas.find((x) => x.ref === p.ref), [sc, st] = l ? situacao(l.entrega) : ['', '']; return { cls: sc === 'is-atr' ? 'is-atr' : 'is-enc', t: `${nf(p.aCaminho)} ${p.un} a caminho · ${st.toLowerCase()}`, acao: 'enc' }; }
  if (p.stock >= p.qtd) return { cls: 'is-ok', t: 'O stock cobre o pedido', acao: '' };
  const f = faltas().find((x) => x.ref === p.ref);
  return f && f.sugestao > 0 ? { cls: 'is-falta', t: `Por encomendar · sugestão ${nf(f.sugestao)} ${p.un}`, acao: 'faltas' } : { cls: '', t: 'Sem sugestão de compra', acao: 'faltas' };
}
function tabelaPedidos(_r: HTMLElement, e: EstDoc): string {
  const ls = doCliente(e);
  if (e.extra.semPedidos || !pedidos().length) return vazio(inbox, 'Sem pedidos de clientes.', 'Nenhum artigo em falta foi pedido por um cliente.');
  if (!ls.length) return semNada(e, 'pedido');
  return `<table class="lf2-tab dv2-vt dv2c-vt" aria-label="Clientes — encomendas especiais">
    <thead><tr><th scope="col"><span>Cliente</span></th><th scope="col"><span>Artigo</span></th><th scope="col" class="is-p3"><span>Descrição</span></th><th scope="col" class="is-num"><span>Pedida</span></th><th scope="col" class="is-num" title="Stock no armazém 60 · Coimbra"><span>Stock · arm. 60</span></th><th scope="col" class="is-p3"><span>Fornecedor</span></th><th scope="col"><span>Encomenda</span></th><th scope="col"><span>Situação</span></th></tr></thead>
    <tbody>${ls.map((p) => { const s = cobre(p), k = chaveC(p);
      return `<tr data-dv2-vrel="${esc(k)}" tabindex="${e.extra.rel === k ? 0 : -1}" class="${e.extra.rel === k ? 'is-ativo ' : ''}${p.enc && p.enc === liga(e) ? 'is-ligada' : ''}">
      <td><b>${esc(p.cli)}</b></td><td class="is-mono">${esc(p.ref)}</td><td class="is-p3 dv2c-desc">${esc(p.desc)}</td>
      <td class="is-num"><b>${nf(p.qtd)}</b><small>${esc(p.un)}</small></td><td class="is-num">${p.stock <= 0 ? `<b class="is-rutura">${nf(p.stock)}</b>` : nf(p.stock)}</td>
      <td class="is-p3">${esc(p.fornNome)}</td><td class="is-mono">${p.enc ? `<b class="dv2c-ref">${esc(p.enc)}</b>` : '<span class="is-nada">—</span>'}</td>
      <td><span class="dv2c-sit ${s.cls}">${esc(s.t)}</span></td></tr>`; }).join('')}</tbody></table>`;
}
function resumoPedidos(e: EstDoc): string {
  const ls = doCliente(e), sem = ls.filter((p) => !p.enc && p.stock < p.qtd).length;
  return `<span><b>${nf(ls.length)}</b> ${ls.length === 1 ? 'pedido' : 'pedidos'}</span><span class="is-falta"><b>${nf(sem)}</b> por cobrir</span><span><b>${nf(new Set(ls.map((p) => p.cli)).size)}</b> clientes</span>`;
}

/* ---------- a janela das ligações: a cadeia real da linha escolhida ---------- */
interface No { k: string; ic: string; t: string; v: string; d: string; est: 'feito' | 'agora' | 'falta' | 'nada' }
function cadeia(chave: string): { nos: No[]; enc: string; ref: string; forn: string; outra?: [string, string, string]; rec: boolean; cli?: Pedido } | null {
  const a = chave.startsWith('a:') ? deA(chave) : undefined, c = chave.startsWith('c:') ? deC(chave) : undefined; if (!a && !c) return null;
  const ref = a?.ref ?? c!.ref, enc = a?.enc ?? c!.enc, x = encomendas().find((y) => y.ref === enc), l = x?.linhas.find((y) => y.ref === ref);
  const cli = c ?? pedidos().find((p) => p.ref === ref && p.enc === enc);
  const recs = enc ? rececoesDe(enc).filter((r) => r.linhas.some((y) => y.ref === ref)) : [];
  const ent = a ?? (enc && l && l.qtd > l.recebida ? entregas().find((y) => y.enc === enc && y.ref === ref) : undefined);
  const nos: No[] = [
    cli ? { k: 'cli', ic: userStar, t: 'Pedido do cliente', v: cli.cli, d: `${nf(cli.qtd)} ${cli.un} de ${cli.ref} · stock ${nf(cli.stock)} no armazém 60`, est: 'feito' }
      : { k: 'cli', ic: userStar, t: 'Pedido do cliente', v: 'Sem pedido de cliente', d: 'Esta entrega é para stock: nenhum cliente pediu o artigo.', est: 'nada' },
    x ? { k: 'enc', ic: fileText, t: 'Encomenda ao fornecedor', v: x.ref, d: `${nomeF(x.forn)} · ${x.estado} · ${dia(x.data)}`, est: 'feito' }
      : { k: 'enc', ic: fileText, t: 'Encomenda ao fornecedor', v: 'Ainda sem encomenda', d: c ? cobre(c).t : '', est: 'falta' },
    ent ? (() => { const [sc, st] = situacao(ent.entrega); return { k: 'ent', ic: calendarClock, t: 'Entrega', v: st, d: `${nf(ent.pend)} de ${nf(ent.qtd)} ${ent.un} por receber`, est: sc === 'is-atr' ? 'falta' as const : 'agora' as const }; })()
      : { k: 'ent', ic: calendarClock, t: 'Entrega', v: x && l ? (l.recebida >= l.qtd ? 'Tudo recebido' : '—') : 'Sem data', d: x && l ? `${nf(l.recebida)} de ${nf(l.qtd)} recebidos` : 'Sem encomenda não há entrega prevista.', est: x && l && l.recebida >= l.qtd ? 'feito' : 'nada' },
    recs.length ? { k: 'rec', ic: packageCheck, t: 'Receção', v: recs.map((r) => r.ref).join(', '), d: `${nf(recs.reduce((s, r) => s + r.linhas.filter((y) => y.ref === ref).reduce((t, y) => t + y.aceite, 0), 0))} aceites · última a ${dia(recs[recs.length - 1].data)}`, est: 'feito' }
      : { k: 'rec', ic: packageCheck, t: 'Receção', v: 'Ainda sem receção', d: x ? 'O armazém ainda não recebeu este artigo desta encomenda.' : '', est: 'nada' },
  ];
  const outra: [string, string, string] | undefined = a && cli ? ['clientes', chaveC(cli), 'Ver nos Pedidos de clientes'] : c && ent ? ['agenda', chaveA(ent), 'Ver no Agendamento'] : undefined;
  return { nos, enc: x ? x.ref : '', ref, forn: x?.forn ?? cli?.forn ?? '', outra, rec: recs.length > 0, cli };
}
function corpoRel(_r: HTMLElement, _e: EstDoc, chave: string): string {
  const k = cadeia(chave);
  if (!k) return `<div class="dv2c-rel"><p class="lf2-sem">${L(circleAlert)}A linha já não existe (a encomenda mudou ou foi recebida). Escolhe outra na lista.</p></div>`;
  const sem = !k.enc && k.cli;
  return `<div class="dv2c-rel">
    <ol class="dv2c-cadeia" aria-label="A cadeia: pedido, encomenda, entrega, receção">${k.nos.map((n) => `<li class="is-${n.est}" data-no="${n.k}"><span class="dv2c-no-ic">${L(n.ic)}</span><div><small>${n.t}</small><b>${esc(n.v)}</b><span>${esc(n.d)}</span></div></li>`).join('')}</ol>
    <div class="dv2c-rel-acoes">
      ${k.enc ? `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="rel-enc" data-enc="${esc(k.enc)}" data-ref="${esc(k.ref)}" data-dv2-rel-principal>${L(openIc)}<span>Abrir a encomenda</span><kbd>Enter</kbd></button>` : ''}
      ${sem ? `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="abrir-doc" data-rota="compras.faltas" data-titulo="Lista de Faltas" data-ecra="compras-faltas" data-ref="${esc(k.ref)}" data-dv2-rel-principal>${L(listChecks)}<span>Lista de Faltas</span><kbd>Enter</kbd></button>` : ''}
      ${k.outra ? `<button type="button" class="ak-btn" data-dv2-acao="rel-vista" data-v="${k.outra[0]}" data-k="${esc(k.outra[1])}">${L(arrowRL)}<span>${k.outra[2]}</span></button>` : ''}
      ${k.rec ? `<button type="button" class="ak-btn" data-dv2-acao="rel-enc" data-enc="${esc(k.enc)}" data-ref="${esc(k.ref)}" data-tab="rececoes">${L(truck)}<span>Consultar a receção</span></button>` : ''}
      <button type="button" class="ak-btn ak-btn--linha" data-dk-janela="artigo:${esc(k.ref)}" data-dv2-acao="rel-fora">${L(box)}<span>Ver o artigo</span></button>
      ${k.forn ? `<button type="button" class="ak-btn ak-btn--linha" data-dk-janela="fornecedor:${esc(k.forn)}" data-dv2-acao="rel-fora">${L(building)}<span>Fornecedor</span></button>` : ''}
    </div></div>`;
}
const tituloRel = (_r: HTMLElement, _e: EstDoc, chave: string) => { const a = chave.startsWith('a:') ? deA(chave) : undefined, c = chave.startsWith('c:') ? deC(chave) : undefined; return a ? `${a.enc} · ${a.ref}` : c ? `${c.cli} · ${c.ref}` : '—'; };

/* ---------- a barra conforme a vista ---------- */
function barraContexto(r: HTMLElement, x: EstDoc): void {
  const v = String(x.extra.vista ?? 'docs');
  /* ao mudar de vista, a linha escolhida passa à linha equivalente da nova vista (a mesma encomenda e o mesmo artigo), se houver */
  const k0 = String(x.extra.rel ?? ''), c0 = k0 ? cadeia(k0) : null, quer = v === 'agenda' ? 'a:' : v === 'clientes' ? 'c:' : '';
  if (quer && c0 && !k0.startsWith(quer)) {
    const par = quer === 'a:' ? entregas().find((y) => y.enc === c0.enc && y.ref === c0.ref) : pedidos().find((p) => p.ref === c0.ref && p.enc === c0.enc);
    if (par) { x.extra.rel = quer === 'a:' ? chaveA(par as Entrega) : chaveC(par as Pedido); r.querySelector<HTMLElement>(`[data-dv2-vista-g] [data-dv2-vrel="${CSS.escape(String(x.extra.rel))}"]`)?.classList.add('is-ativo'); }
  }
  const k = String(x.extra.rel ?? ''), cad = k ? cadeia(k) : null;
  const b = r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="abrir-sel"]');
  if (b) {
    const porque = !k || (v === 'agenda' && !k.startsWith('a:')) || (v === 'clientes' && !k.startsWith('c:')) ? `Escolhe uma linha ${v === 'agenda' ? 'do agendamento' : 'dos pedidos'}.` : !cad?.enc ? 'Este pedido ainda não tem encomenda: vê a Lista de Faltas.' : '';
    b.setAttribute('aria-disabled', String(!!porque)); b.title = porque || 'Abrir a encomenda da linha escolhida (Enter)';
  }
  /* a encomenda ligada acende-se também na lista das encomendas */
  r.querySelectorAll<HTMLElement>('[data-dv2-grelha] tr[data-dv2-id]').forEach((t) => t.classList.toggle('is-ligada', !!liga(x) && t.dataset.dv2Id === liga(x)));
}
/** Abre a encomenda numa janela, no separador pedido, com a linha do artigo acesa. */
function abrirEnc(r: HTMLElement, x: EstDoc, enc: string, ref: string, tab = 'linhas'): void {
  if (!docDe(r, x, enc)) { toast(r, `A ${enc} já não está na lista (filtros?): limpa os filtros para a ver.`); return; }
  x.extra.liga = enc; escolher(r, x, enc, false); abrirJanelaDoc(r, x, enc, tab);
  const jan = r.querySelector<HTMLElement>(`[data-dv2-jan="${CSS.escape(enc)}"]`);
  jan?.querySelector<HTMLElement>(`[data-dv2-jan-tab="${tab}"][aria-selected="false"]`)?.click();
  jan?.querySelectorAll<HTMLElement>(`[data-dv2-linha-ref="${CSS.escape(ref)}"]`).forEach((li) => { li.classList.add('is-ligada-linha'); li.scrollIntoView({ block: 'nearest' }); });
  jan?.focus({ preventScroll: true });
  barraContexto(r, x); r.querySelectorAll<HTMLElement>('[data-dv2-vista-g] [data-dv2-vrel]').forEach((t) => t.classList.toggle('is-ligada', (t.dataset.dv2Vrel ?? '').includes(`${enc}|`) || (cadeia(t.dataset.dv2Vrel ?? '')?.enc === enc)));
}

/* ---------- a página: menos barras ---------- */
const MODO_SEL = [...MODOS.map((m) => [m.k, `${m.t} (${m.tecla})`]), ['geral', 'Pesquisa geral']] as [string, string][];
function pagina(c: CfgDoc, cen: string): string {
  const id = (x: string) => `dv2-${c.k}-${x}-${cen}`, op = (v: string, t: string) => `<option value="${esc(v)}">${esc(t)}</option>`;
  const campo = (k: string, t: string, input: string) => `<label class="ak-campo" for="${id(k)}"><span>${t}</span>${input}</label>`;
  const so = (v: string) => ` data-so="${v}"`;
  return `<div class="hm ak lf2 dv2 dv2--${c.k} dv2c" data-hm data-dv2="${c.k}" data-dv2-vista-atual="docs" data-dv2-cenario="${cen}" data-teclas="F1 F2 F4 F5 F6 F8 F9 F10 F11 F12 Escape ${c.teclasExtra}">
  ${topoErp(c.caminho)}
  <header class="dv2c-cab">
    <div class="dv2c-tit"><span class="ak-cab-ic">${L(c.icone)}</span><div><h1>${esc(c.titulo)}</h1><p>${esc(c.sub)}</p></div><nav class="dv2-trilho" data-dv2-trilho aria-label="Onde estou" hidden></nav><span class="lf2-restaurada" data-dv2-restaurada hidden></span></div>
    <div class="ak-barra lf2-barra dv2-barra dv2c-barra" role="toolbar" aria-label="Ações">
      ${BTN('novo', plus, 'Novo', 'F5', so('docs'), 'ak-btn--acao')}
      ${BTN('abrir-sel', openIc, 'Abrir encomenda', 'Enter', `${so('agenda clientes')} title="Abrir a encomenda da linha escolhida (Enter)"`, 'ak-btn--acao')}
      ${BTN('editar', pencil, 'Editar', 'F6', so('docs'))}
      ${BTN('anular', ban, 'Anular', 'F8', so('docs'))}
      <i class="ak-sep" aria-hidden="true"${so('docs')}></i>
      ${BTN('atualizar', refresh, 'Atualizar', 'F9')}
      <span class="dv2c-edi"${so('docs')}>${c.barra}</span>
      <span class="ak2-esp"></span>
      <span class="ak-menu-c">${BTN('mais', ellipsis, 'Mais ações', '', ' aria-haspopup="menu" aria-expanded="false"')}
        <div class="ak-menu ak-menu--dir lf2-menu-mais" role="menu" data-dv2-menu="mais" data-por-cima hidden></div></span>
    </div>
  </header>

  <div class="dv2-lista-vista" data-dv2-lista>
  <!-- 27 out. (ela: «deve ficar acima e fora do card»): as três vistas por cima dos filtros, na página -->
  <nav class="dv2c-vistas-zona" aria-label="Vistas"><div class="dv2-vistas dv2c-vistas" role="tablist" aria-label="Ver">${c.vistas!.map((v, i) => `<button type="button" role="tab" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-dv2-vista="${v.k}" aria-keyshortcuts="${v.tecla}" title="${esc(v.t)} (${v.tecla.replace('+', ' ')})">${L(v.ic)}<span>${esc(v.t)}</span><small data-dv2-vista-n="${v.k}"></small></button>`).join('')}<i class="dv2c-vistas-ind" data-dv2-vistas-ind aria-hidden="true"></i></div></nav>
  <section class="lf2-filtros dv2-filtros dv2c-filtros" aria-label="Pesquisa e filtros">
    <div class="dv2c-linha">
      <label class="ak-campo dv2c-forn" for="${id('forn')}"><span class="sr">Fornecedor</span><select id="${id('forn')}" data-dv2-f="forn" data-dv2-campo>${op('', 'Todos os fornecedores')}${fornecedoresDaLista().map(([v, t]) => op(v, t)).join('')}</select></label>
      <div class="dv2c-pq" role="group" aria-label="Pesquisar">
        <label class="dv2c-pq-modo"${so('docs')}><span class="sr">Pesquisar por</span><select data-dv2-modo-sel aria-label="Pesquisar por (F1 F2 F10 F12)">${MODO_SEL.map(([k, t]) => op(k, t)).join('')}</select></label>
        <span class="lf2-comp"${so('docs')} role="radiogroup" aria-label="Como compara"><button type="button" role="radio" aria-checked="true" data-dv2-comp="inicio" title="Pesquisa iniciada por (Shift+F1)">Iniciado por</button><button type="button" role="radio" aria-checked="false" data-dv2-comp="contem" title="Pesquisa contendo (Shift+F2)">Contendo</button></span>
        <label class="lf2-pq-in">${L(search)}<input type="search" id="${id('q')}" data-dv2-q data-dv2-campo data-ak-primeiro autocomplete="off" placeholder="Número, ex.: 2026/04" aria-label="Pesquisar por número, iniciado por"></label>
      </div>
      <button type="button" class="lf2-mais-f" data-dv2-acao="mais-filtros" aria-expanded="false" aria-controls="${id('av')}">${L(sliders)}<span>Mais filtros</span><small data-dv2-n-av></small>${L(chevronDown, 'lf2-seta')}</button>
    </div>
    <div class="lf2-avancados dv2-avancados dv2c-av" id="${id('av')}" data-dv2-av hidden>
      ${campo('serie', 'Série <kbd>F4</kbd>', `<select id="${id('serie')}" data-dv2-f="serie" data-dv2-campo>${op('', 'Todas')}${c.series().map((s) => op(s, s)).join('')}</select>`).replace('<label class="ak-campo"', `<label class="ak-campo"${so('docs')}`)}
      ${campo('estado', 'Estado', `<select id="${id('estado')}" data-dv2-f="estado" data-dv2-campo>${c.estados.map(([v, t]) => op(v, t)).join('')}</select>`).replace('<label class="ak-campo"', `<label class="ak-campo"${so('docs')}`)}
      <div class="ak-campo dv2-periodo" role="group" aria-labelledby="${id('per')}"><span id="${id('per')}">Período <small data-so="docs">da encomenda</small><small data-so="agenda">da entrega</small></span><span class="ak2-per"><input type="date" id="${id('de')}" data-dv2-f="de" data-dv2-campo aria-label="Período — de"><i>a</i><input type="date" id="${id('ate')}" data-dv2-f="ate" data-dv2-campo aria-label="Período — até"></span></div>
      ${campo('moeda', 'Moeda', `<select id="${id('moeda')}" data-dv2-f="moeda" data-dv2-campo>${op('', 'Todas')}${op('EUR', 'EUR · euro')}</select>`).replace('<label class="ak-campo"', `<label class="ak-campo"${so('docs')}`)}
      <p class="lf2-av-dica">Só os filtros que servem a vista escolhida. Enter passa ao campo seguinte.</p>
    </div>
    <div class="lf2-ativos" data-dv2-ativos aria-live="polite"></div>
  </section>

  <section class="lf2-lista dv2-lista dv2c-lista" aria-labelledby="${id('lista-t')}">
    <div class="lf2-lista-cab"><h2 id="${id('lista-t')}" data-dv2-lista-t>${esc(c.titulo)}</h2><p class="lf2-resumo" data-dv2-resumo></p>
      <span class="dv2c-agmodo" data-so="agenda" role="radiogroup" aria-label="Mostrar como"><button type="button" role="radio" aria-checked="true" data-dv2-acao="ag-modo" data-m="lista">${L(listIc)}<span>Lista</span></button><button type="button" role="radio" aria-checked="false" data-dv2-acao="ag-modo" data-m="cal">${L(calendarDays)}<span>Calendário</span></button></span></div>
    <div class="lf2-grelha" data-dv2-grelha></div>
    <div class="lf2-grelha dv2-vista-g" data-dv2-vista-g hidden></div>
  </section>
  <div class="lf2-janelas" data-dv2-janelas data-por-cima></div>
  </div>

  <section class="dv2-ficha" data-dv2-ficha aria-label="Ficha" hidden></section>
  <footer class="ak-estado lf2-estado" data-dv2-estado role="status" aria-live="polite"></footer>
  <div class="lf2-dlg-fundo" data-dv2-dlg data-por-cima hidden></div>
  <input type="file" data-dv2-ficheiro multiple hidden>
  <p class="hm-aviso" data-hm-aviso role="status" aria-live="polite"></p>
</div>`;
}

/* ---------- registar ---------- */
const ORDEM = ['numero', 'data', 'fornNome', 'desc', 'estado', 'valor'];
const CFG5 = registar({
  ...CFG, k: 'enc5',
  sub: 'Gestão de encomendas, entregas e necessidades de clientes.',
  cols: [...ORDEM.map((k) => CFG.cols.find((x) => x.k === k)!), ...CFG.cols.filter((x) => !ORDEM.includes(x.k))],
  verIniciais: ORDEM,
  teclasExtra: `${CFG.teclasExtra ? `${CFG.teclasExtra} ` : ''}Alt+1 Alt+2 Alt+3`,
  janelas: { titulo: 'Encomenda', icone: fileText, estados: ['selecionado', 'fechada', 'parcial', 'recebida', 'anulada', 'gravado', 'rececoes-carregar', 'edi-a-enviar', 'edi-confirmado', 'edi-falhou', 'edi-desconhecido'] },
  vistas: [
    { k: 'docs', t: 'Encomendas', ic: fileText, tecla: 'Alt+1', titulo: 'Encomendas' },
    { k: 'agenda', t: 'Agendamento', ic: calendarClock, tecla: 'Alt+2', titulo: 'Agendamento das entregas', tabela: tabelaAgenda, resumo: resumoAgenda },
    { k: 'clientes', t: 'Pedidos de clientes', ic: userStar, tecla: 'Alt+3', titulo: 'Pedidos de clientes', tabela: tabelaPedidos, resumo: resumoPedidos },
  ],
  relacao: { icone: route, titulo: tituloRel, corpo: corpoRel },
  maisTopo: `<p class="ak-menu-t">Documento</p>
    <button type="button" role="menuitem" data-dv2-acao="imprimir"><span>${L(printer)} Imprimir</span><kbd>F11</kbd></button>
    <button type="button" role="menuitem" data-dv2-acao="anexos" data-so="docs"><span>${L(paperclip)} Anexos da encomenda</span></button>`,
  acao(r, x, k, b) {
    if (k === '_barra') { CFG.acao(r, x, k, b); barraContexto(r, x); return true; }
    if (k === 'abrir-sel') { const cad = cadeia(String(x.extra.rel ?? '')); if (cad?.enc) abrirEnc(r, x, cad.enc, cad.ref); return true; }
    if (k === 'rel-enc') { abrirEnc(r, x, b.dataset.enc!, b.dataset.ref!, b.dataset.tab || 'linhas'); return true; }
    if (k === 'rel-vista') { const cad = cadeia(String(x.extra.rel ?? '')); if (cad?.enc) x.extra.liga = cad.enc; x.extra.rel = b.dataset.k; mudarVista(r, x, b.dataset.v!); escolherRel(r, x, b.dataset.k!); r.querySelector<HTMLElement>('[data-dv2-vista-g] .is-ativo')?.scrollIntoView({ block: 'nearest' }); return true; }
    if (k === 'rel-fora') { if (!emSeparador()) toast(r, 'A ficha abre numa janela quando o ecrã está na área de trabalho.'); return true; }
    if (k === 'ag-modo') { x.extra.agCal = b.dataset.m === 'cal'; r.querySelectorAll<HTMLElement>('[data-dv2-acao="ag-modo"]').forEach((y) => y.setAttribute('aria-checked', String(y.dataset.m === b.dataset.m))); const g = r.querySelector<HTMLElement>('[data-dv2-vista-g]'); if (g) g.innerHTML = tabelaAgenda(r, x); return true; }
    if (k === 'cal-mes') { const [a, m] = String(x.extra.calMes ?? HOJE.slice(0, 7)).split('-').map(Number), d = new Date(Date.UTC(a, m - 1 + Number(b.dataset.d), 1)); x.extra.calMes = d.toISOString().slice(0, 7); const g = r.querySelector<HTMLElement>('[data-dv2-vista-g]'); if (g) g.innerHTML = tabelaAgenda(r, x); r.querySelector<HTMLElement>(`[data-dv2-acao="cal-mes"][data-d="${b.dataset.d}"]`)?.focus(); return true; }
    return CFG.acao(r, x, k, b);
  },
  cenario(r, x, cen) {
    CFG.cenario(r, x, cen);
    const es = encomendas(), por = (s: string) => es.find((y) => y.estado === s)?.ref ?? '';
    if (cen === 'selecionado') x.ativo = por('Emitida') || por('Parcialmente recebida');
    if (cen === 'agenda-cal') { x.extra.vista = 'agenda'; x.extra.agCal = true; requestAnimationFrame(() => r.querySelectorAll<HTMLElement>('[data-dv2-acao="ag-modo"]').forEach((y) => y.setAttribute('aria-checked', String(y.dataset.m === 'cal')))); }
    if (cen === 'agenda-vazia') { x.extra.vista = 'agenda'; x.extra.semAgenda = true; }
    if (cen === 'clientes-vazia') { x.extra.vista = 'clientes'; x.extra.semPedidos = true; }
    if (cen === 'geral') { x.extra.geral = true; x.q = 'gates'; }
    if (cen === 'filtros') { x.f.estado = 'curso'; x.f.forn = es.find((y) => y.estado === 'Emitida')?.forn ?? ''; requestAnimationFrame(() => r.querySelector<HTMLElement>('[data-dv2-acao="mais-filtros"]')?.click()); }
    /* a janela das ligações com uma linha real (o pedido com encomenda; a entrega atrasada) */
    const rel = (v: string, chave: string | undefined) => { if (!chave) return; x.extra.vista = v; requestAnimationFrame(() => { escolherRel(r, x, chave, false); r.querySelectorAll<HTMLElement>('.lf2-jan').forEach((j) => j.getAnimations().forEach((a) => a.finish())); }); };
    if (cen === 'relacao') { const p = pedidos().find((y) => y.enc); rel('clientes', p && chaveC(p)); }
    if (cen === 'relacao-agenda') { const a = entregas().find((y) => y.entrega < HOJE); rel('agenda', a && chaveA(a)); }
    if (cen === 'relacao-sem') { const p = pedidos().find((y) => !y.enc && y.stock < y.qtd); rel('clientes', p && chaveC(p)); }
    if (cen === 'relacao-indisponivel') { x.extra.vista = 'agenda'; requestAnimationFrame(() => { x.extra.rel = 'a:EF 2026/0399|9999|2026-10-01'; abrirJanelaDoc(r, x, 'rel', undefined, false); refrescarJanelas(r, x); }); }
    if (cen === 'ligada') { const a = entregas().find((y) => y.entrega < HOJE); if (a) { x.ativo = a.enc; x.extra.liga = a.enc; x.extra.vista = 'agenda'; } }
    if (cen === 'anular-recusado') { x.ativo = por('Parcialmente recebida'); requestAnimationFrame(() => { const d = ativoDe(r, x); dialogo(r, `<h2 id="dv2-dlg-t" class="is-perigo">${L(ban)}Não é possível anular</h2><p>${esc(CFG.porque.anular(x, d) || 'Esta encomenda já tem receções: só se fecha, com motivo.')}</p><div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar data-dv2-primeiro>${L(xIc)}<span>Fechar</span><kbd>Esc</kbd></button></div>`); }); }
  },
});

/* ---------- os ecrãs ---------- */
const NOTA5 = 'Encomendas v5 (27 out., briefing «ROMAFE ERP V3 — Intelligent Purchasing Workspace»): a cadeia pedido do cliente → encomenda → entrega → receção num só ecrã. Menos barras (título e ações na mesma zona; filtros numa linha com o modo de pesquisa num seletor e a Pesquisa geral; Série, Estado, Período e Moeda em Mais filtros); a barra muda com a vista; as vistas com indicador; Agendamento em Lista ou Calendário; a janela das ligações mostra a cadeia real da linha escolhida e abre a encomenda na linha do artigo; a encomenda escolhida continua acesa nas outras vistas.';
const versao5 = (cen = 'normal') => ({ id: 'v5', nota: NOTA5, html: pagina(CFG5, cen) });
const ESTADOS5: [string, string, string][] = [
  ['carregar', '10.62 · A carregar', 'O cabeçalho, a barra e os filtros já servem; a lista em esqueleto.'],
  ['vazia', '10.63 · Sem encomendas', 'Ainda não há encomendas: Novo (F5).'],
  ['agenda-vazia', '10.64 · Sem entregas por receber', 'O Agendamento vazio: nenhuma encomenda em curso tem linhas por receber.'],
  ['clientes-vazia', '10.65 · Sem pedidos de clientes', 'Nenhum artigo em falta foi pedido por um cliente.'],
  ['sem-resultados', '10.66 · Pesquisa sem resultados', 'Diz em que modo se procurou e como se compara.'],
  ['geral', '10.67 · Pesquisa geral', 'O seletor do modo em «Pesquisa geral»: procura em todas as colunas à vista (os modos do antigo continuam em F1 F2 F10 F12).'],
  ['filtros', '10.68 · Mais filtros', 'Série, Estado, Período e Moeda abertos, com as etiquetas removíveis por baixo.'],
  ['selecionado', '10.69 · Encomenda escolhida', 'A janela da encomenda (Detalhes, Linhas, Receções, EDI, Anexos) ao lado da lista.'],
  ['ligada', '10.70 · A encomenda ligada no Agendamento', 'Escolhida nas Encomendas e vista no Agendamento: as linhas dela acendem-se.'],
  ['agenda-cal', '10.71 · Agendamento em calendário', 'As datas de entrega reais num mês: atrasadas, hoje e no prazo; tocar abre as ligações.'],
  ['relacao', '10.72 · Ligações de um pedido', 'Um pedido de cliente com a cadeia real: cliente, encomenda, entrega e receção; Abrir a encomenda (Enter).'],
  ['relacao-agenda', '10.73 · Ligações de uma entrega atrasada', 'A entrega atrasada com a encomenda, o pedido do cliente (se houver) e a receção.'],
  ['relacao-sem', '10.74 · Pedido por cobrir', 'Sem encomenda: diz-se, com a sugestão da Lista de Faltas e o caminho para lá.'],
  ['relacao-indisponivel', '10.75 · Ligação indisponível', 'A linha já não existe (a encomenda mudou ou foi recebida): diz-se, sem inventar.'],
  ['criar', '10.76 · Nova encomenda', 'A ficha nasce do botão Novo, na página.'],
  ['editar', '10.77 · Editar o rascunho', 'A ficha na janela da encomenda (a que estava aberta passa a «A editar»).'],
  ['por-gravar', '10.78 · Alterações por gravar', 'Fechar com alterações: continuar a editar ou descartar.'],
  ['a-gravar', '10.79 · A gravar', 'O botão espera; nada se diz antes de o domínio aceitar.'],
  ['gravar-falhou', '10.80 · Gravar falhou', 'O servidor não respondeu: as alterações ficam na ficha.'],
  ['anular', '10.81 · Anular (F8)', 'A confirmação e o motivo.'],
  ['anular-recusado', '10.82 · Anular recusado', 'Com receções, a encomenda não se anula: diz-se porquê.'],
  ['parcial', '10.83 · Parcialmente recebida', 'A janela nas Receções: as barras por linha e as receções ligadas.'],
  ['edi-a-enviar', '10.84 · EDI a enviar', 'Como fica com a TecCom ligada: a enviar, à espera da confirmação.'],
  ['edi-confirmado', '10.85 · EDI confirmado', 'Só depois da confirmação do fornecedor se diz «enviado».'],
  ['edi-desconhecido', '10.86 · EDI sem resposta', 'Sem confirmação no tempo: o resultado é desconhecido e nada se reenvia sozinho.'],
  ['edi-falhou', '10.87 · EDI falhou', 'O erro do fornecedor e o que fazer.'],
  ['anexo-enviar', '10.88 · A carregar um anexo', 'O progresso real da leitura do ficheiro.'],
  ['anexo-falhou', '10.89 · O anexo falhou', 'Ficheiro grande demais: diz o limite.'],
  ['permissao', '10.90 · Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['offline', '10.91 · Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['sessao', '10.92 · Sessão terminada', 'Voltar a entrar pelo login comum; o que estava escrito fica.'],
  ['servidor', '10.93 · Servidor indisponível', 'O servidor das compras não respondeu: Tentar outra vez.'],
  ['restaurada', '10.94 · Área de trabalho reposta', 'Ao voltar: a pesquisa, os filtros e a encomenda escolhida como estavam.'],
];
export function comEncomendasV5(ecras: Ecra<IdErp>[]): Ecra<IdErp>[] {
  return [...ecras.map((e) => e.id === 'compras' ? { ...e, versoes: [...e.versoes, versao5()] as Ecra<IdErp>['versoes'] } : e),
    ...ESTADOS5.map(([cen, nome, objetivo]) => ({ id: `enc5-${cen}` as IdErp, nome, fluxo: 'Compras', estadoDe: 'compras' as IdErp, objetivo, versoes: [versao5(cen)] as Ecra<IdErp>['versoes'] }))];
}
export type IdEnc5 = `enc5-${string}`;
