/* =========================================================
   ERP — Stocks: 71 · Transferências entre armazéns (18 nov. 2026). Ela mostrou a janela do ERP antigo «Documentos de
   Stock - Transferências de Armazém» (Número, Data de Emissão, Observações, #Armaz. Ori., Des. Armaz. Ori.; Novo F5,
   Editar F6, Apagar F8, Filtrar F3, Refrescar F9, Linhas F10, Actualizar (F11), Opções F12) e pediu «melhora e faz o
   screen». O mesmo motor e o mesmo desenho do 70 · Inventário inicial (compras/docs-v2.ts), e o que o antigo não diz:
     - na lista, a origem E o destino (o antigo só mostrava a origem), os artigos, a quantidade, o valor e o estado;
     - Lançar no stock (Ctrl+F2, o «Actualizar» do antigo) só com stock que chegue na origem — diz qual falta;
     - a ficha mostra, por linha, o stock na origem e avisa logo se não chega; «Trocar» inverte origem e destino;
     - a janela tem o separador Stock: origem e destino, antes e depois;
     - Apagar passa a Anular (F8), com o motivo: nada se apaga; uma lançada anulada volta à origem.
   Regras em stocks/dominio.ts; o stock é o das compras, num sítio só.
   ========================================================= */
import type { Ecra } from '../../../comum/tipos';
import type { IdErp } from '../ids';
import { registar, paginaDoc, BTN, L, esc, type CfgDoc, type Doc, type EstDoc, type Ficha } from '../compras/docs-v2';
import { toast, dialogo, fecharDialogo, tudo, ativoDe, quieto, nf } from '../compras/docs-v2-comportamento';
import { transferencias, transferencia, valorTr, quantidadeTr, custoDe, porqueLancarTr, podeInv, criarTr, guardarTr, lancarTr, anularTr, ARMAZENS, armazemDe, artigo, ARTIGOS, stockEm, HOJE, Recusa } from './dominio';
import { euros, dia } from '../compras/dominio';
import { PERFIS } from '../inicio-dados';
import arrowLeftRight from 'lucide-static/icons/arrow-left-right.svg?raw';
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import boxes from 'lucide-static/icons/boxes.svg?raw';
import paperclip from 'lucide-static/icons/paperclip.svg?raw';
import xIc from 'lucide-static/icons/x.svg?raw';
import loader from 'lucide-static/icons/loader.svg?raw';
import circleAlert from 'lucide-static/icons/circle-alert.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import ban from 'lucide-static/icons/ban.svg?raw';
import plus from 'lucide-static/icons/plus.svg?raw';
import trash from 'lucide-static/icons/trash-2.svg?raw';
import save from 'lucide-static/icons/save.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import arrowDownToLine from 'lucide-static/icons/arrow-down-to-line.svg?raw';
import triangleAlert from 'lucide-static/icons/triangle-alert.svg?raw';

/* ---------- as linhas: uma transferência por linha ---------- */
const pessoa = (p: string) => PERFIS[p as keyof typeof PERFIS]?.pessoa ?? p;
export const curto = (cod: string) => armazemDe(cod).split(' · ')[1] ?? cod;
export function linhas(e: EstDoc): Doc[] {
  return transferencias().map((d): Doc => {
    const anulado = d.estado === 'Anulado' || e.extra.anuladoSim === d.ref;
    const lancado = !anulado && (d.estado === 'Lançado' || e.extra.lancadoSim === d.ref);
    return { id: d.ref, ref: d.ref, numero: d.ref, n: d.ref.split(' ')[1] ?? d.ref, serie: d.ref.split('/')[0], data: d.data, origem: d.origem, origemNome: curto(d.origem), destino: d.destino, destinoNome: curto(d.destino),
      notas: d.notas, artigos: d.linhas.length, qtd: quantidadeTr(d), valor: valorTr(d), estado: anulado ? 'Anulado' : lancado ? 'Lançado' : d.estado, anulado, lancado,
      uIns: pessoa(d.criador), uAlt: pessoa(d.alterado), moeda: 'EUR' };
  });
}
export const doc = (d: Doc) => transferencia(String(d.ref))!;

/* ---------- a configuração ---------- */
export const COLS: CfgDoc['cols'] = [
  { k: 'numero', t: 'Número', tipo: 'mono', w: 130, presa: true, antiga: true },
  { k: 'data', t: 'Data de emissão', tipo: 'data', w: 120, antiga: true },
  { k: 'notas', t: 'Observações', tipo: 'txt', w: 240, antiga: true },
  { k: 'origem', t: 'Origem', tipo: 'txt', w: 190, antiga: true },
  { k: 'destino', t: 'Destino', tipo: 'txt', w: 190 },
  { k: 'qtd', t: 'Quantidade', tipo: 'n', w: 100 },
  { k: 'valor', t: 'Valor', tipo: 'eur', w: 120 },
  { k: 'estado', t: 'Estado', tipo: 'estado', w: 130 },
  { k: 'artigos', t: 'Artigos', tipo: 'n', w: 80 },
  { k: 'uIns', t: 'Utilizador de inserção', tipo: 'txt', w: 160 },
  { k: 'uAlt', t: 'Utilizador de alteração', tipo: 'txt', w: 160 },
];
export const badge = (cls: string, ic: string, t: string, title = '') => `<span class="lf2-b ${cls}"${title ? ` title="${esc(title)}"` : ''}>${L(ic)}${t}</span>`;
const arm = (cod: string, nome: string) => `<span class="is-mono">${esc(cod)}</span> ${esc(nome)}`;
export function celula(d: Doc, k: string): string {
  switch (k) {
    case 'numero': return `<span class="lf2-art"><b>${esc(String(d.numero))}</b></span>`;
    case 'data': return dia(String(d.data));
    case 'origem': return arm(String(d.origem), String(d.origemNome));
    case 'destino': return `${L(arrowRight)} ${arm(String(d.destino), String(d.destinoNome))}`;
    case 'artigos': case 'qtd': return nf(d[k] as number);
    case 'valor': return euros(d.valor as number);
    case 'estado': return `<span class="lf2-badges">${d.anulado ? badge('lf2-b--rutura', ban, 'Anulada') : d.lancado ? badge('lf2-b--pend', circleCheck, 'Lançada') : badge('lf2-b--enc', clock, 'Rascunho', 'Ainda não mexeu no stock')}</span>`;
    default: return esc(String(d[k] ?? '')) || '<span class="is-nada">—</span>';
  }
}
function valor(d: Doc, k: string): string | number {
  if (k === 'origem') return `${d.origem} ${d.origemNome}`;
  if (k === 'destino') return `${d.destino} ${d.destinoNome}`;
  return (d[k] as string | number) ?? '';
}
export const editavel = (e: EstDoc, d: Doc | undefined) => !!d && !d.anulado && !d.lancado && podeInv(e.perfil, 'editar');
export const porqueLancar_ = (e: EstDoc, d: Doc | undefined) => d?.anulado ? 'A transferência está anulada.' : d?.lancado ? `Já foi lançada no stock${doc(d).lancado ? ` a ${doc(d).lancado}` : ''}.` : porqueLancarTr(e.perfil, d ? doc(d) : undefined);

/* ---------- o painel ---------- */
const dd = (t: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${t}</dt><dd>${v}</dd></div>`;
export function painel(e: EstDoc, d: Doc | undefined, tab: string): string {
  if (!d) return '';
  const x = doc(d);
  if (tab === '_alvo') return `<b>${esc(x.ref)}</b><span>${esc(x.origem)} ${esc(curto(x.origem))} → ${esc(x.destino)} ${esc(curto(x.destino))} · ${nf(quantidadeTr(x))} un. · ${euros(valorTr(x))}</span>`;
  if (tab === 'detalhes') {
    const t = porqueLancar_(e, d);
    return `${e.recusa ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(e.recusa)}</p>` : ''}
      <div class="dv2-estado-faixa ${d.anulado ? 'is-anulado' : d.lancado ? 'is-ok' : t ? 'is-espera' : 'is-pronto'}">${d.anulado ? `${L(ban)}<span><b>Anulada${x.anulado ? ` a ${esc(x.anulado.quando)}` : ''}.</b> ${esc(x.anulado?.motivo ?? '')} Fica no histórico; não mexe no stock.</span>` : d.lancado ? `${L(circleCheck)}<span><b>Lançada a ${esc(x.lancado ?? 'hoje')}.</b> Saiu do ${esc(armazemDe(x.origem))} e entrou no ${esc(armazemDe(x.destino))}. Para corrigir, anula-se (F8).</span>` : t ? `${L(clock)}<span><b>Rascunho.</b> ${esc(t)}</span>` : `${L(arrowDownToLine)}<span><b>Pronta a lançar.</b> Ctrl+F2 passa ${nf(quantidadeTr(x))} unidades do ${esc(armazemDe(x.origem))} para o ${esc(armazemDe(x.destino))}.</span>`}</div>
      <dl class="lf2-dl dv2-dl">${dd('Número', `<b class="is-mono">${esc(x.ref)}</b>`)}${dd('Data de emissão', dia(x.data))}${dd('Origem', `${esc(armazemDe(x.origem))}<small>Código ${esc(x.origem)}</small>`)}${dd('Destino', `${esc(armazemDe(x.destino))}<small>Código ${esc(x.destino)}</small>`)}
        ${dd('Observações', esc(x.notas) || '<span class="is-nada">—</span>', 'is-largo')}
        ${dd('Artigos', nf(x.linhas.length))}${dd('Quantidade', nf(quantidadeTr(x)))}${dd('Valor', `<b>${euros(valorTr(x))}</b><small>Ao último preço do fornecedor</small>`)}${dd('Estado', esc(String(d.estado)))}
        ${dd('Inserido por', esc(String(d.uIns)))}${dd('Alterado por', `${esc(String(d.uAlt))}<small>${esc(x.historico[x.historico.length - 1]?.quando ?? '')}</small>`)}</dl>
      <details class="dv2-hist"><summary>Histórico da transferência (${x.historico.length})</summary><ol>${x.historico.slice().reverse().map((h) => `<li><time>${esc(h.quando)}</time><b>${esc(h.acao)}</b>${h.detalhe ? ` · ${esc(h.detalhe)}` : ''}<small>${esc(h.quem)}</small></li>`).join('')}</ol></details>`;
  }
  if (tab === 'linhas') return `<table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Quantidade</th><th>Un.</th><th class="is-num">Custo unitário</th><th class="is-num">Valor</th></tr></thead><tbody>${x.linhas.map((l) => { const a = artigo(l.ref);
      return `<tr><td class="is-mono">${esc(l.ref)}</td><td>${esc(a?.desc ?? '')}</td><td class="is-num">${nf(l.qtd)}</td><td>${esc(a?.un ?? '')}</td><td class="is-num">${euros(custoDe(l.ref))}</td><td class="is-num"><b>${euros(l.qtd * custoDe(l.ref))}</b></td></tr>`; }).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="2">Total</td><td class="is-num">${nf(quantidadeTr(x))}</td><td></td><td></td><td class="is-num"><b>${euros(valorTr(x))}</b></td></tr></tfoot></table>`;
  if (tab === 'stock') {
    const o = armazemDe(x.origem), de = armazemDe(x.destino), antes = !d.lancado && !d.anulado;
    return `<p class="lf2-nota">${d.anulado ? 'Anulada: o stock está como se não tivesse existido.' : d.lancado ? 'Já lançada: o stock de hoje já a conta.' : 'Ainda não mexeu no stock. Ao lançar (Ctrl+F2), cada artigo fica com os valores «depois».'}</p>
      <table class="lf2-mini dv2-linhas-t"><thead><tr><th>Artigo</th><th class="is-num">Leva</th><th class="is-num">Origem ${esc(x.origem)} · hoje</th>${antes ? '<th class="is-num">Origem · depois</th>' : ''}<th class="is-num">Destino ${esc(x.destino)} · hoje</th>${antes ? '<th class="is-num">Destino · depois</th>' : ''}</tr></thead><tbody>${x.linhas.map((l) => { const so = stockEm(l.ref, o), sd = stockEm(l.ref, de), falta = antes && l.qtd > so;
        return `<tr><td class="is-mono">${esc(l.ref)}</td><td class="is-num">${nf(l.qtd)}</td><td class="is-num">${nf(so)}</td>${antes ? `<td class="is-num">${falta ? `<span class="lf2-b lf2-b--rutura" title="Não há stock que chegue na origem">${L(triangleAlert)}${nf(so - l.qtd)}</span>` : `<b>${nf(so - l.qtd)}</b>`}</td>` : ''}<td class="is-num">${nf(sd)}</td>${antes ? `<td class="is-num"><b>${nf(sd + l.qtd)}</b></td>` : ''}</tr>`; }).join('')}</tbody></table>`;
  }
  return '';
}

/* ---------- a ficha ---------- */
const campo = (k: string, t: string, input: string, cls = '') => `<label class="ak-campo${cls ? ` ${cls}` : ''}" for="dv2-ff-${k}"><span>${t}</span>${input}</label>`;
const datalist = `<datalist id="tr-artigos">${ARTIGOS.map((a) => `<option value="${esc(a.ref)}">${esc(a.desc)} · ${esc(a.marca)}</option>`).join('')}</datalist>`;
const opArm = (sel: string, vazio: string) => `${sel ? '' : `<option value="">${vazio}</option>`}${ARMAZENS.map((a) => `<option value="${a.cod}"${a.cod === sel ? ' selected' : ''}>${esc(a.cod)} · ${esc(a.nome.split(' · ')[1] ?? a.nome)}</option>`).join('')}`;
function linhaFicha(i: number, ref = '', qtd = '', dis = false): string {
  const a = artigo(ref);
  return `<tr data-dv2-linha="${i}"><td><input type="text" list="tr-artigos" value="${esc(ref)}" data-dv2-ff="art-${i}" data-dv2-l="ref" aria-label="Artigo da linha ${i + 1}" placeholder="Referência"${dis ? ' disabled' : ''}></td><td data-dv2-l-desc>${esc(a?.desc ?? '')}</td><td class="is-num" data-dv2-l-ha>—</td><td><input type="text" inputmode="numeric" class="is-num" value="${esc(qtd)}" data-dv2-ff="qtd-${i}" data-dv2-l="qtd" aria-label="Quantidade da linha ${i + 1}"${dis ? ' disabled' : ''}></td><td data-dv2-l-un>${esc(a?.un ?? '')}</td><td class="is-num" data-dv2-l-valor>—</td><td>${dis ? '' : `<button type="button" class="dv2-x" data-dv2-acao="del-linha" aria-label="Tirar a linha ${i + 1}">${L(trash)}</button>`}</td></tr>`;
}
function ficha(e: EstDoc, f: Ficha, d: Doc | undefined): string {
  const x = d ? doc(d) : undefined, ver = f.modo === 'editar' && !editavel(e, d), dis = ver ? ' disabled' : '';
  const titulo = f.modo === 'criar' ? 'Nova transferência entre armazéns' : `${x!.ref} · ${x!.origem} → ${x!.destino}`;
  const cab = `<header class="dv2-ficha-cab"><span class="dv2-ficha-ic">${L(arrowLeftRight)}</span><div><small>${f.modo === 'criar' ? 'Criação' : ver ? 'Visualização' : 'Edição'}</small><h2>${esc(titulo)}</h2></div>
    <div class="dv2-ficha-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="fechar-ficha">${L(arrowLeft)}<span>${ver ? 'Voltar à lista' : 'Cancelar'}</span><kbd>Esc</kbd></button>${ver ? '' : `<button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="gravar">${L(save)}<span>Gravar</span><kbd>Ctrl Enter</kbd></button>`}</div></header>
    <p class="lf2-recusa" data-dv2-ficha-erro role="alert" hidden></p>`;
  const pe = ver ? (d!.anulado ? 'A transferência está anulada: só se vê.' : `Lançada a ${esc(x!.lancado ?? '')}: já não se altera. Para corrigir, anula-se (F8) e faz-se outra.`)
    : f.modo === 'criar' ? 'Nasce em rascunho e não mexe no stock até ser lançada (Ctrl+F2). A coluna «Na origem» diz o stock que há para levar.' : 'Rascunho: a origem, o destino, os artigos e as quantidades alteram-se; o stock só muda ao lançar.';
  const ls = x?.linhas ?? [];
  return `<div class="dv2-ficha-c">${cab}<p class="dv2-ficha-modo">${pe}</p>
    <input type="hidden" data-dv2-ff-versao value="${x?.versao ?? 0}">
    <div class="dv2-ficha-g">
      ${campo('serie', 'Série', '<select id="dv2-ff-serie" disabled><option>TA 2026</option></select>')}
      ${campo('numero', 'Número', `<input type="text" id="dv2-ff-numero" value="${esc(x?.ref ?? 'Atribuído ao gravar')}" readonly>`)}
      ${campo('data', 'Data de emissão', `<input type="date" id="dv2-ff-data" value="${x?.data ?? HOJE}" max="${HOJE}" data-dv2-ff="data"${dis}>`)}
      ${campo('origem', 'Armazém de origem', `<select id="dv2-ff-origem" data-dv2-ff="origem"${dis}>${opArm(x?.origem ?? (f.modo === 'criar' ? '60' : ''), 'Escolhe a origem…')}</select>`)}
      ${campo('destino', 'Armazém de destino', `<select id="dv2-ff-destino" data-dv2-ff="destino"${dis}>${opArm(x?.destino ?? '', 'Escolhe o destino…')}</select>`)}
      ${ver ? '' : `<div class="ak-campo"><span>&nbsp;</span><button type="button" class="ak-btn ak-btn--linha" data-dv2-acao="trocar" title="Inverter origem e destino">${L(arrowLeftRight)}<span>Trocar</span></button></div>`}
      ${campo('notas', 'Observações', `<textarea id="dv2-ff-notas" rows="2" data-dv2-ff="notas"${dis}>${esc(x?.notas ?? '')}</textarea>`, 'is-largo')}
    </div>
    <h3 class="dv2-h3">Artigos</h3>${datalist}
    <div class="dv2-linhas-rolo"><table class="lf2-mini dv2-linhas-ed"><thead><tr><th>Artigo</th><th>Descrição</th><th class="is-num">Na origem</th><th class="is-num">Quantidade</th><th>Un.</th><th class="is-num">Valor</th><th><span class="sr">Tirar</span></th></tr></thead>
      <tbody data-dv2-linhas>${(ls.length ? ls : [{ id: 'a', ref: '', qtd: 0 }]).map((l, i) => linhaFicha(i, l.ref, l.qtd ? String(l.qtd) : '', ver)).join('')}</tbody>
      <tfoot><tr class="is-total"><td colspan="3">Total</td><td class="is-num" data-dv2-r-qtd>—</td><td></td><td class="is-num" data-dv2-r-total>—</td><td></td></tr></tfoot></table></div>
    <p class="lf2-recusa" data-tr-aviso hidden></p>
    ${ver ? '' : `<button type="button" class="ak-btn ak-btn--linha dv2-mais-linha" data-dv2-acao="add-linha">${L(plus)}<span>Juntar artigo</span></button>`}
    <p class="dv2-ficha-dica">Enter passa ao campo seguinte; no último, vai a Gravar. O valor é ao último preço do fornecedor. Ctrl+Enter grava; Esc fecha (com alterações, pergunta).</p></div>`;
}
function lerFicha(r: HTMLElement): { data: string; origem: string; destino: string; notas: string; versao: number; linhas: { ref: string; qtd: number }[] } {
  const v = (k: string) => r.querySelector<HTMLInputElement>(`[data-dv2-ficha] [data-dv2-ff="${k}"]`)?.value.trim() ?? '';
  const linhas = [...r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr')].map((tr) => {
    const g = (k: string) => tr.querySelector<HTMLInputElement>(`[data-dv2-l="${k}"]`)!.value.trim(), q = g('qtd').replace(/\s/g, '');
    return { ref: g('ref'), qtd: q ? Number(q) : NaN };
  }).filter((l) => l.ref || !Number.isNaN(l.qtd));
  return { data: v('data'), origem: v('origem'), destino: v('destino'), notas: r.querySelector<HTMLTextAreaElement>('[data-dv2-ficha] [data-dv2-ff="notas"]')?.value ?? '', versao: Number(r.querySelector<HTMLInputElement>('[data-dv2-ficha] [data-dv2-ff-versao]')?.value ?? 0), linhas };
}
function gravar(r: HTMLElement, e: EstDoc, f: Ficha): { ref: string; msg: string } {
  const x = lerFicha(r), pedido = { data: x.data, origem: x.origem, destino: x.destino, notas: x.notas, linhas: x.linhas };
  if (f.modo === 'criar') { const d = criarTr(e.perfil, pedido); return { ref: d.ref, msg: `${d.ref} criada em rascunho (${d.origem} → ${d.destino}): ainda não mexe no stock.` }; }
  const d = ativoDe(r, e); if (!d) throw new Recusa('A transferência já não está na lista.');
  const g = guardarTr(e.perfil, String(d.ref), pedido, x.versao);
  return { ref: g.ref, msg: `${g.ref} gravada: ${nf(quantidadeTr(g))} unidades, ${g.origem} → ${g.destino}.` };
}
/** Na ficha: o stock na origem de cada artigo, o valor, os totais e o aviso quando a origem não chega. */
function recalcular(r: HTMLElement): void {
  const origem = r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="origem"]')?.value ?? '';
  let q = 0, t = 0; const faltam: string[] = [];
  r.querySelectorAll<HTMLElement>('[data-dv2-ficha] [data-dv2-linhas] tr').forEach((tr) => {
    const ref = tr.querySelector<HTMLInputElement>('[data-dv2-l="ref"]')!.value.trim(), a = artigo(ref), qtd = Number(tr.querySelector<HTMLInputElement>('[data-dv2-l="qtd"]')!.value.trim() || 'NaN');
    const ha = a && origem ? stockEm(ref, armazemDe(origem)) : null, ok = Number.isInteger(qtd) && qtd > 0;
    const cel = tr.querySelector<HTMLElement>('[data-dv2-l-ha]')!; cel.textContent = ha === null ? '—' : nf(ha); cel.classList.toggle('is-zero', ha !== null && ok && qtd > ha);
    tr.querySelector<HTMLElement>('[data-dv2-l-valor]')!.textContent = a && ok ? euros(qtd * custoDe(ref)) : '—';
    if (ok) { q += qtd; if (a) t += qtd * custoDe(ref); if (ha !== null && qtd > ha) faltam.push(`${ref} (pedes ${nf(qtd)}, há ${nf(ha)})`); }
  });
  const rq = r.querySelector<HTMLElement>('[data-dv2-r-qtd]'), rt = r.querySelector<HTMLElement>('[data-dv2-r-total]'); if (rq) rq.textContent = nf(q); if (rt) rt.textContent = euros(t);
  const av = r.querySelector<HTMLElement>('[data-tr-aviso]'); if (av) { av.hidden = !faltam.length; av.innerHTML = faltam.length ? `${L(triangleAlert)}<span>Não há stock que chegue no ${esc(armazemDe(origem))}: ${esc(faltam.join('; '))}. Grava-se em rascunho, mas só se lança com stock.</span>` : ''; }
}

/* ---------- lançar (Ctrl+F2) ---------- */
export function dlgLancar(r: HTMLElement, e: EstDoc, erro = ''): void {
  const d = ativoDe(r, e); if (!d) return;
  const porque = porqueLancar_(e, d); if (porque && !erro) { toast(r, porque); return; }
  const x = doc(d), o = armazemDe(x.origem), de = armazemDe(x.destino);
  dialogo(r, `<h2 id="dv2-dlg-t">${L(arrowDownToLine)}Lançar a transferência</h2><p class="lf2-dlg-sub"><b class="is-mono">${esc(x.ref)}</b> · ${esc(o)} → ${esc(de)} · emitida a ${dia(x.data)}</p>
    <table class="lf2-mini"><thead><tr><th>Artigo</th><th class="is-num">Leva</th><th class="is-num">Origem fica</th><th class="is-num">Destino fica</th></tr></thead><tbody>${x.linhas.map((l) => `<tr><td class="is-mono">${esc(l.ref)}</td><td class="is-num">${nf(l.qtd)}</td><td class="is-num">${nf(stockEm(l.ref, o) - l.qtd)}</td><td class="is-num"><b>${nf(stockEm(l.ref, de) + l.qtd)}</b></td></tr>`).join('')}</tbody><tfoot><tr class="is-total"><td>Total</td><td class="is-num">${nf(quantidadeTr(x))}</td><td></td><td class="is-num"><b>${euros(valorTr(x))}</b></td></tr></tfoot></table>
    <ul class="dv2-regras"><li>Sai do ${esc(o)} e entra no ${esc(de)}, <b>tudo ou nada</b>; a origem nunca fica negativa.</li><li>A transferência passa a <b>Lançada</b> e já não se altera; para corrigir, anula-se (F8).</li></ul>
    ${erro ? `<p class="lf2-recusa" role="alert">${L(circleAlert)}${esc(erro)}</p>` : ''}
    <div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Cancelar</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--acao" data-dv2-acao="lancar-sim" data-dv2-primeiro>${L(arrowDownToLine)}<span>Lançar</span><kbd>Ctrl Enter</kbd></button></div>`);
}
async function lancar(r: HTMLElement, e: EstDoc, b: HTMLElement): Promise<void> {
  const d = ativoDe(r, e); if (!d || e.ocupado) return;
  e.ocupado = 'lancar'; e.extra.ocupadoTexto = 'A lançar…';
  b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.querySelector('span')!.textContent = 'A lançar…';
  r.querySelector<HTMLElement>('[data-dv2-dlg-fechar]')?.setAttribute('disabled', '');
  await new Promise((ok) => requestAnimationFrame(() => ok(null)));
  try {
    const x = lancarTr(e.perfil, String(d.ref));
    e.ocupado = ''; fecharDialogo(r); e.tab = 'detalhes'; tudo(r, e, true);
    const cel = r.querySelector<HTMLElement>(`tr[data-dv2-id="${CSS.escape(d.id)}"] td[data-col="estado"]`);
    if (cel && !quieto()) cel.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    toast(r, `${x.ref} lançada: ${nf(quantidadeTr(x))} unidades passaram do ${x.origem} para o ${x.destino}.`);
  } catch (x) {
    e.ocupado = ''; dlgLancar(r, e, x instanceof Recusa ? x.message : 'O servidor não confirmou o lançamento. Nada se repete sozinho: atualiza a lista (F9) antes de tentar outra vez.');
  }
}

/* ---------- registar ---------- */
export const CFG = registar({
  k: 'tra', titulo: 'Transferências entre Armazéns', sub: 'Documentos de stock que passam artigos de um armazém para outro.', icone: arrowLeftRight, um: 'transferência', o: 'a',
  caminho: [['ERP', 'inicio'], ['Stocks', 'stocks'], ['Transferências entre armazéns', '']],
  cols: COLS, verIniciais: ['numero', 'data', 'notas', 'origem', 'destino', 'qtd', 'valor', 'estado'], ajustar: true,
  campos: { numero: 'n', data: 'data', codigo: 'origem', descricao: 'notas' },
  rotuloForn: 'Armazém de origem', phCodigo: 'Código do armazém de origem, ex.: 60',
  linhas, series: () => [...new Set(transferencias().map((d) => d.ref.split('/')[0]))], serieDe: (d) => String(d.serie), fornDe: (d) => String(d.origem), dataDe: (d) => String(d.data), moedaDe: (d) => String(d.moeda),
  estados: [['', 'Todos'], ['rasc', 'Rascunhos'], ['lanc', 'Lançadas'], ['anul', 'Anuladas']],
  estadoPassa: (d, v) => v === 'rasc' ? !d.lancado && !d.anulado : v === 'lanc' ? !!d.lancado : v === 'anul' ? !!d.anulado : true,
  celula, valor,
  resumo: (ls) => { const l = ls.filter((d) => d.lancado).length, a = ls.filter((d) => d.anulado).length, q = ls.filter((d) => d.lancado).reduce((s, d) => s + (d.qtd as number), 0); const pl = (n: number, um: string, vv: string) => `<span><b>${nf(n)}</b> ${n === 1 ? um : vv}</span>`; return ls.length ? `${pl(ls.length - l - a, 'rascunho', 'rascunhos')}${pl(l, 'lançada', 'lançadas')}${pl(a, 'anulada', 'anuladas')}<span><b>${nf(q)}</b> unidades transferidas</span>` : ''; },
  barra: BTN('lancar', arrowDownToLine, 'Lançar no stock', 'Ctrl+F2', '', 'ak-btn--acao'), teclasExtra: '',
  janelas: { titulo: 'Transferência', icone: arrowLeftRight, estados: ['ja-lancado', 'anulado', 'gravado', 'lancado', 'sem-stock'] },
  tabs: [{ k: 'detalhes', t: 'Detalhes', ic: info }, { k: 'linhas', t: 'Linhas', ic: list }, { k: 'stock', t: 'Stock', ic: boxes }, { k: 'anexos', t: 'Anexos', ic: paperclip }],
  painel, ficha, gravar,
  porque: {
    novo: (e) => podeInv(e.perfil, 'criar') ? '' : 'O teu perfil só consulta os documentos de stock.',
    editar: (e, d) => !d ? 'Escolhe uma transferência na lista.' : !podeInv(e.perfil, 'editar') ? 'O teu perfil só consulta os documentos de stock.' : editavel(e, d) ? '' : d.anulado ? 'A transferência está anulada: só se vê (Enter).' : 'Já foi lançada: não se altera; anula-se (F8) e faz-se outra. Enter abre-a para ver.',
    anular: (e, d) => !d ? 'Escolhe uma transferência na lista.' : !podeInv(e.perfil, 'anular') ? 'O teu perfil não anula documentos de stock.' : d.anulado ? 'Já está anulada.' : '',
  },
  anular: {
    texto: (d) => { const x = doc(d); return [`Anular a ${x.ref}?`, x.estado === 'Lançado' ? `Já está lançada: <b>${nf(quantidadeTr(x))} unidades voltam do ${esc(armazemDe(x.destino))} para o ${esc(armazemDe(x.origem))}</b>. Nada se apaga: fica no histórico, anulada.` : 'É um rascunho: nunca mexeu no stock. Nada se apaga: fica no histórico, anulada.']; },
    fazer: (e, d, motivo) => { const x = anularTr(e.perfil, String(d.ref), motivo); return `${x.ref} anulada${x.lancado ? ': tudo voltou à origem' : ''}. Fica no histórico.`; },
  },
  docAnexo: (d) => d.id,
  teclas: [{ tecla: 'Ctrl+F2', acao: 'lancar' }],
  acao(r, e, k, b) {
    if (k === '_barra') { const t = porqueLancar_(e, ativoDe(r, e)), x = r.querySelector<HTMLElement>('.dv2-barra [data-dv2-acao="lancar"]'); if (x && !e.ocupado) { x.setAttribute('aria-disabled', String(!!t)); x.title = t || 'Lançar no stock (Ctrl+F2)'; } return true; }
    if (k === '_ficha-aberta') { recalcular(r); return true; }
    if (k === '_ficha-input') {
      const i = b as HTMLInputElement;
      if (i.dataset.dv2L === 'ref') { const tr = i.closest('tr')!, a = artigo(i.value.trim()); tr.querySelector('[data-dv2-l-desc]')!.textContent = a?.desc ?? ''; tr.querySelector('[data-dv2-l-un]')!.textContent = a?.un ?? ''; }
      recalcular(r); return true;
    }
    if (k === 'trocar') { const o = r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="origem"]')!, de = r.querySelector<HTMLSelectElement>('[data-dv2-ficha] [data-dv2-ff="destino"]')!; if (!o.value || !de.value) { toast(r, 'Escolhe a origem e o destino primeiro.'); return true; } [o.value, de.value] = [de.value, o.value]; if (e.ficha) e.ficha.sujo = true; recalcular(r); return true; }
    if (k === 'lancar') { dlgLancar(r, e); return true; }
    if (k === 'lancar-sim') { void lancar(r, e, b); return true; }
    if (k === 'add-linha') { const tb = r.querySelector<HTMLElement>('[data-dv2-linhas]')!, i = tb.children.length; tb.insertAdjacentHTML('beforeend', linhaFicha(i)); const tr = tb.lastElementChild as HTMLElement; if (!quieto()) tr.animate([{ opacity: 0, transform: 'scaleY(.4)', transformOrigin: 'top' }, { opacity: 1, transform: 'none', transformOrigin: 'top' }], { duration: 180, easing: 'ease-out' }); tr.querySelector<HTMLElement>('input')?.focus(); if (e.ficha) e.ficha.sujo = true; return true; }
    if (k === 'del-linha') { const tr = b.closest('tr'), tb = tr?.parentElement; if (tr && tb && tb.children.length > 1) { tr.remove(); recalcular(r); if (e.ficha) e.ficha.sujo = true; (tb.querySelector('input') as HTMLElement | null)?.focus(); } else toast(r, 'A transferência precisa de pelo menos um artigo.'); return true; }
    return false;
  },
  cenario(r, e, cen) {
    const ls = linhas(e), rasc = ls.find((d) => !d.lancado && !d.anulado), lanc = ls.find((d) => d.lancado);
    if (['lancar', 'a-lancar', 'lancar-falhou', 'editar'].includes(cen) && rasc) e.ativo = rasc.id;
    if (cen === 'lancado' && rasc) { e.ativo = rasc.id; e.extra.lancadoSim = rasc.id; }
    if (cen === 'ja-lancado' && lanc) { e.ativo = lanc.id; e.recusa = porqueLancar_(e, lanc); }
    if (cen === 'sem-stock' && rasc) { e.ativo = rasc.id; e.tab = 'detalhes'; e.recusa = `Não há stock que chegue no ${armazemDe(String(rasc.origem))}: 6205-2Z pede 1 500 e há ${nf(stockEm('6205-2Z', armazemDe(String(rasc.origem))))}.`; }
    if (cen === 'anular-lancado' && lanc) e.ativo = lanc.id;
    if (cen === 'anulado' && rasc) { e.extra.anuladoSim = rasc.id; e.ativo = rasc.id; e.aviso = `${rasc.ref} anulada: «A Portucel adiou a obra». Fica no histórico.`; }
    if (cen === 'gravado' && ls[0]) e.ativo = ls[0].id;
    requestAnimationFrame(() => {
      if (cen === 'lancar' || cen === 'a-lancar' || cen === 'lancar-falhou') dlgLancar(r, e, cen === 'lancar-falhou' ? 'O servidor não confirmou o lançamento (ERP-STK-504). Nada se repete sozinho: atualiza a lista (F9) antes de tentar outra vez.' : '');
      if (cen === 'a-lancar') { const b = r.querySelector<HTMLElement>('[data-dv2-acao="lancar-sim"]'); if (b) { b.classList.add('is-carregar'); b.setAttribute('aria-disabled', 'true'); b.innerHTML = `${L(loader)}<span>A lançar…</span>`; } }
      if (cen === 'lancado' && rasc) { e.aviso = `${rasc.ref} lançada: ${nf(rasc.qtd as number)} unidades passaram do ${rasc.origem} para o ${rasc.destino}.`; tudo(r, e); }
      if (cen === 'anular-lancado') { const t = CFG.anular.texto(ativoDe(r, e)!); dialogo(r, `<h2 id="dv2-dlg-t" class="is-perigo">${L(ban)}${esc(t[0])}</h2><p>${t[1]}</p><label class="ak-campo dv2-motivo" for="dv2-motivo"><span>Motivo (obrigatório)</span><textarea id="dv2-motivo" rows="3" maxlength="300" data-dv2-motivo data-dv2-primeiro placeholder="Porque se anula — fica no histórico"></textarea></label><p class="ak-erro-campo" data-dv2-dlg-erro role="alert" hidden></p><div class="lf2-dlg-acoes"><button type="button" class="ak-btn ak-btn--linha" data-dv2-dlg-fechar>${L(xIc)}<span>Manter</span><kbd>Esc</kbd></button><button type="button" class="ak-btn ak-btn--perigo" data-dv2-acao="anular-sim">${L(ban)}<span>Anular</span></button></div>`); }
    });
  },
  dica: 'Período e moeda juntam-se à pesquisa. Enter passa ao campo seguinte.',
});

/* ---------- os ecrãs ---------- */
const NOTA = 'Transferências entre armazéns (18 nov., da janela «Documentos de Stock - Transferências de Armazém» do ERP antigo, melhorada): origem e destino lado a lado (o antigo só mostrava a origem), quantidade, valor e estado na lista; a ficha diz o stock na origem por linha e avisa quando não chega; Trocar inverte origem e destino; Lançar no stock (Ctrl+F2, o «Actualizar (F11)» do antigo) só com stock; Anular (F8) no lugar de Apagar, e a lançada volta à origem. Os armazéns são os reais: 1 Porto, 2 Porto Cliente, 60 Coimbra, 88 Material Reservado, 99 Encomendas Programadas.';
export const ESTADOS_TRA: [string, string, string][] = [
  ['carregar', '71.11 · A carregar', 'A lista em esqueleto; a pesquisa e os filtros já servem.'],
  ['vazia', '71.12 · Sem transferências', 'Ainda não há transferências: Novo (F5).'],
  ['sem-resultados', '71.13 · Pesquisa sem resultados', 'Diz em que modo se procurou e como se compara; oferece Contendo e Limpar.'],
  ['criar', '71.14 · Nova transferência', 'Novo (F5) abre a ficha numa janela: data, origem (60 por omissão), destino, observações e artigos, com o stock na origem por linha.'],
  ['editar', '71.15 · Editar o rascunho', 'Só o rascunho se altera; Trocar inverte origem e destino.'],
  ['por-gravar', '71.16 · Alterações por gravar', 'Fechar a ficha com alterações: continuar a editar ou descartar.'],
  ['a-gravar', '71.17 · A gravar', 'O botão espera; nada se diz antes de as regras aceitarem.'],
  ['gravado', '71.18 · Gravada', 'A ficha fecha, a linha acende e a barra de estado diz o que se gravou.'],
  ['gravar-falhou', '71.19 · Gravar falhou', 'O servidor não respondeu: as alterações ficam na ficha.'],
  ['lancar', '71.20 · Lançar no stock (Ctrl+F2)', 'Com quanto fica a origem e o destino em cada artigo; tudo ou nada.'],
  ['a-lancar', '71.21 · A lançar', 'O botão espera e o Cancelar desliga-se: não há lançamentos repetidos.'],
  ['lancado', '71.22 · Lançada', 'O estado acende «Lançada» e a transferência já não se altera.'],
  ['ja-lancado', '71.23 · Já lançada', 'Ctrl+F2 numa lançada diz quando foi e como se corrige.'],
  ['sem-stock', '71.24 · Sem stock na origem', 'Não se lança com a origem a ficar negativa: diz o artigo, o pedido e o que há.'],
  ['lancar-falhou', '71.25 · O lançamento falhou', 'Sem confirmação: nada se repete sozinho; atualizar antes de tentar outra vez.'],
  ['anular', '71.26 · Anular (F8)', 'No lugar do «Apagar» do antigo: nada se apaga, pede o motivo.'],
  ['anular-lancado', '71.27 · Anular uma lançada', 'Tudo volta do destino para a origem; diz-se antes quanto.'],
  ['anulado', '71.28 · Anulada', 'A transferência fica, com «Anulada»; não se lança nem se altera.'],
  ['anexos', '71.29 · Anexos', 'Guias e fotografias da transferência: ver, descarregar, carregar e remover.'],
  ['imprimir', '71.30 · Imprimir (F11)', 'Imprime-se só a lista, com as colunas à vista.'],
  ['permissao', '71.31 · Sem permissão', 'O perfil só consulta: as ações dizem porquê.'],
  ['sessao', '71.32 · Sessão terminada', 'Voltar a entrar pelo login comum; o que estava escrito fica.'],
  ['offline', '71.33 · Sem ligação', 'Sem rede: a pesquisa e os filtros ficam.'],
  ['servidor', '71.34 · Servidor indisponível', 'O servidor dos stocks não respondeu: Tentar outra vez.'],
  ['restaurada', '71.35 · Área de trabalho reposta', 'Ao voltar: a pesquisa, os filtros e a transferência escolhida como estavam.'],
  ['janela', '71.36 · Transferência numa janela', 'Tocar numa transferência abre-a numa janela: Detalhes, Linhas, Stock e Anexos; a lista fica à vista.'],
  ['janelas', '71.37 · Várias janelas', 'Várias transferências abertas em cascata; a da frente é a última tocada.'],
  ['maximizada', '71.38 · Janela maximizada', 'Duplo clique no cabeçalho (ou o botão) enche o ecrã; outra vez, volta ao tamanho que tinha.'],
  ['editar-sujo', '71.39 · A editar, com alterações', 'O ● no título diz que há alterações por gravar; fechar pergunta.'],
];
const armazensDaLista = (): [string, string][] => ARMAZENS.map((a) => [a.cod, `${a.cod} · ${a.nome.split(' · ')[1] ?? a.nome}`]);
export function versaoTransferencias(cen = 'normal') { return { id: 'v1', nota: NOTA, html: paginaDoc(CFG, cen, armazensDaLista()) }; }
export type IdTransf = 'stocks-transf-armazens' | `tra-${string}`;
export function ecrasTransferencias(): Ecra<IdErp>[] {
  return [
    { id: 'stocks-transf-armazens', nome: '71 · Transferências entre armazéns', fluxo: 'Stocks', objetivo: 'Passar artigos de um armazém para outro: o rascunho, Lançar no stock (Ctrl+F2) só com stock na origem, e Anular (F8), que devolve à origem.', versoes: [versaoTransferencias()] as Ecra<IdErp>['versoes'] },
    ...ESTADOS_TRA.map(([cen, nome, objetivo]) => ({ id: `tra-${cen}` as IdErp, nome, fluxo: 'Stocks', estadoDe: 'stocks-transf-armazens' as IdErp, objetivo, versoes: [versaoTransferencias(cen)] as Ecra<IdErp>['versoes'] })),
  ];
}
