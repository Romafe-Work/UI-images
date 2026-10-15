/* =========================================================
   GOPARTS — 14 · Faturas v2 (15 out. 2026)
   Do briefing dela («ROMAFE Financial Document Center») e da nota que juntou («manteria a ordem cronológica, tal
   como nos Pedidos e Guias de Remessa […] mas nas Faturas daria maior destaque ao desdobramento dos impostos»):
   - a cronologia por ano e mês, como nas Guias e nos Pedidos, com o estado do pagamento por baixo da data;
   - clicar numa fatura abre-a no painel lateral (ela: «os diálogos que te pedi quando clico num pedido ou guias»),
     não no sítio — o briefing pedia abrir no cartão; ganha o que ela pediu para os outros dois ecrãs;
   - no painel, o destaque é a discriminação: os valores comerciais, depois o IVA por grupo de taxa (os três pares
     base/IVA do GO REPAIR, só os que a fatura tem), depois o total; o percurso Pedido → Guia → Fatura e o
     pagamento (vencimento, paga em) — o que os dados dizem, nada mais;
   - a Tabela como alternativa, com todas as colunas do GO REPAIR (os três pares base/IVA).
   Os valores vêm de faturas-dados.ts / guias-dados.ts (o «servidor» do protótipo); o ecrã não faz contas fiscais.
   Molde dos Pedidos v5 e das Guias v3 (classes ped4__*, gui3__* do percurso e dos valores); o que é só das faturas
   tem fat2__*. Comportamento: comportamento/faturas-v2.ts. CSS: css/faturas-v2.css. Sem React.
   ========================================================= */
import { FATURAS, type Fatura, type Pagamento } from './faturas-dados';
import { base, iva, total, euros } from './guias-dados';
import { PEDIDOS } from './pedidos-dados';
import { pilulasEstado } from './pedidos-v4';
import calendar from 'lucide-static/icons/calendar.svg?raw';
import hash from 'lucide-static/icons/hash.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';
import eraser from 'lucide-static/icons/eraser.svg?raw';
import chevronRight from 'lucide-static/icons/chevron-right.svg?raw';
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw';
import fileText from 'lucide-static/icons/file-text.svg?raw';
import receipt from 'lucide-static/icons/receipt.svg?raw';
import undo from 'lucide-static/icons/undo-2.svg?raw';
import layers from 'lucide-static/icons/layers.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import eye from 'lucide-static/icons/eye.svg?raw';
import download from 'lucide-static/icons/download.svg?raw';
import slidersHorizontal from 'lucide-static/icons/sliders-horizontal.svg?raw';
import info from 'lucide-static/icons/info.svg?raw';
import arrowUpDown from 'lucide-static/icons/arrow-up-down.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import table from 'lucide-static/icons/table.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import alert from 'lucide-static/icons/triangle-alert.svg?raw';
import percent from 'lucide-static/icons/percent.svg?raw';

export const L = (raw: string, cls = '') => raw.replace(/<!--[\s\S]*?-->/, '').replace(/\s+class="lucide lucide-([^"]*)"/, ' data-i="$1"').replace(/\s+class="[^"]*"/, '').replace('<svg', `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"`).replace(/\n\s*/g, '');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const id = (num: string) => num.replace(/\D/g, '');
const aaaammdd = (d: string) => d.split('/').reverse().join('');
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const ICONES_F = { fileText: L(fileText), check: L(check, 'btn__icone') };

export const faturaDe = (num: string) => FATURAS.find((f) => f.num === num)!;
export const ehCredito = (f: Fatura) => f.guia.tipo === 'credito';
export const nomeDoc = (f: Fatura) => ehCredito(f) ? 'Nota de crédito' : 'Fatura';
const temPedido = (num: string) => PEDIDOS.some((p) => p.num === num);

/* ---------- o pagamento: o que os dados dizem (nunca só a cor) ---------- */
export const PAGAMENTO: Record<Pagamento, { nome: string; icone: string }> = {
  paga: { nome: 'Paga', icone: L(check) }, aberto: { nome: 'Em aberto', icone: L(clock) },
  vencida: { nome: 'Vencida', icone: L(alert) }, creditada: { nome: 'Creditada', icone: L(undo) },
};
export const pagamentoSelo = (f: Fatura) => `<span class="ped4__selo fat2__pag fat2__pag--${f.pagamento}">${PAGAMENTO[f.pagamento].icone}${PAGAMENTO[f.pagamento].nome}</span>`;
export const tipoSelo = (f: Fatura) => ehCredito(f)
  ? `<span class="ped4__selo gui3__tipo gui3__tipo--credito">${L(undo)}Nota de crédito</span>`
  : `<span class="ped4__selo gui3__tipo gui3__tipo--fatura">${L(receipt)}Fatura</span>`;

/* ---------- os grupos de IVA ----------
   O GO REPAIR guarda até três pares base/IVA (um por taxa). Nas faturas de exemplo há um só grupo, a 23 %; os
   outros dois pares estão vazios e não se mostram como linhas a zero — diz-se que não há outras taxas. */
export interface GrupoIva { taxa: number; base: number; iva: number }
export const gruposIva = (f: Fatura): GrupoIva[] => [{ taxa: 23, base: base(f.guia), iva: iva(f.guia) }];
const taxa = (t: number) => `${t.toLocaleString('pt-PT')} %`;

/* ---------- a discriminação (o destaque do painel) ---------- */
export function discriminacao(f: Fatura, abertaIva = true, prefixo = 'fat2'): string {
  const g = f.guia, grupos = gruposIva(f);
  const l = (t: string, v: number | null, cls = '') => `<div class="gui3__v${cls}"><dt>${t}</dt><dd>${v === null ? '<span class="ped4__nada" title="Valor não enviado pelo servidor">sem dados</span>' : v ? euros(v) : '<span class="ped4__nada">—</span>'}</dd></div>`;
  const ivaTotal = grupos.reduce((s, x) => s + x.iva, 0), rid = `${prefixo}-iva-${id(f.num)}`;
  return `<div class="fat2__disc">
      <p class="fat2__disc-t">Valores comerciais</p>
      <dl class="gui3__valores fat2__com">${l('Valor bruto', g.bruto)}${l('Desconto', -g.desconto)}${l('Embalagens', g.embalagens)}${l('Portes', g.portes)}</dl>
      <div class="fat2__iva">
        <button type="button" class="fat2__iva-abrir" aria-expanded="${abertaIva}" aria-controls="${rid}">${L(percent)}<span>Discriminação do IVA</span><small>${grupos.length === 1 ? `1 taxa · ${taxa(grupos[0].taxa)}` : `${grupos.length} taxas`}</small><b>${euros(ivaTotal)}</b>${L(chevronDown, 'fat2__iva-seta')}</button>
        <div class="fat2__iva-corpo" id="${rid}"${abertaIva ? '' : ' hidden'}>
          <table class="fat2__iva-t"><thead><tr><th>Taxa</th><th class="ped4__num">Base tributável</th><th class="ped4__num">IVA</th></tr></thead>
          <tbody>${grupos.map((x, i) => `<tr style="--i:${i}"><td><span class="fat2__taxa">${taxa(x.taxa)}</span></td><td class="ped4__num">${euros(x.base)}</td><td class="ped4__num">${euros(x.iva)}</td></tr>`).join('')}</tbody>
          ${grupos.length > 1 ? `<tfoot><tr><td>Total</td><td class="ped4__num">${euros(grupos.reduce((s, x) => s + x.base, 0))}</td><td class="ped4__num">${euros(ivaTotal)}</td></tr></tfoot>` : ''}</table>
          <p class="fat2__iva-nota">${L(info)}<span>${grupos.length === 1 ? 'Sem outras taxas nesta fatura (os outros dois grupos do documento estão vazios).' : 'Uma linha por taxa, como no documento.'}</span></p>
        </div>
      </div>
      <dl class="gui3__valores fat2__fim"><div class="gui3__v gui3__v--total"><dt>Total ${ehCredito(f) ? 'da nota de crédito' : 'da fatura'}</dt><dd>${euros(total(g))}</dd></div></dl>
    </div>`;
}

/* ---------- o percurso documental: Pedido → Guia de remessa → Fatura (ou Nota de crédito) ---------- */
export function percursoFat(f: Fatura): string {
  const g = f.guia, irmas = FATURAS.filter((x) => x.guia.pedido === g.pedido && x.num !== f.num);
  const no = (cls: string, icone: string, rot: string, ref: string, extra: string, tag = 'button') => `<${tag}${tag === 'button' ? ' type="button"' : ''} class="gui3__no ${cls}"${extra}><span class="gui3__no-i">${icone}</span><span><small>${rot}</small><b>${ref}</b></span></${tag}>`;
  const pedido = temPedido(g.pedido)
    ? no('gui3__no--pedido', L(shoppingCart), 'Pedido', g.pedido, ` data-ir="pedidos" data-abrir-pedido-pagina="${g.pedido}"`)
    : no('gui3__no--pedido gui3__no--indisponivel', L(shoppingCart), 'Pedido', g.pedido, ` data-pedido-indisponivel="${g.pedido}"`);
  return `<div class="gui3__percurso" aria-label="Percurso documental">
      <ol class="gui3__nos">
        <li>${pedido}</li><li class="gui3__seta" aria-hidden="true"><i class="gui3__fio"></i></li>
        <li>${no('', L(fileText), 'Guia de remessa', g.num, ` data-ir="guias" data-abrir-guia-pagina="${g.num}"`)}</li><li class="gui3__seta" aria-hidden="true"><i class="gui3__fio"></i></li>
        <li>${no(`gui3__no--atual gui3__no--${g.tipo}`, ehCredito(f) ? L(undo) : L(receipt), nomeDoc(f), f.num, ' aria-current="true"', 'span')}</li>
      </ol>
      <p class="gui3__ind" hidden>${L(info)}<span>O pedido ${g.pedido} já não está no histórico desta conta (os pedidos têm 12 meses). A guia e a ${nomeDoc(f).toLowerCase()} continuam disponíveis.</span></p>
      ${irmas.length ? `<p class="gui3__irmas"><span>Do mesmo pedido:</span>${irmas.map((x) => `<button type="button" class="gui3__irma" data-ir-fatura="${x.num}">${ehCredito(x) ? L(undo) : L(receipt)}<b>${x.num}</b> · ${nomeDoc(x)} · ${x.guia.data}</button>`).join('')}</p>` : ''}
    </div>`;
}

/* ---------- o pagamento ---------- */
export function pagamento(f: Fatura): string {
  const t = {
    paga: `Paga a ${f.pagaEm}. O vencimento era a ${f.vencimento}.`,
    aberto: `Vence a ${f.vencimento}.`,
    vencida: `Venceu a ${f.vencimento} e ainda não está paga. Se já pagou, o pagamento pode demorar a aparecer.`,
    creditada: 'Nota de crédito emitida. O acerto aparece na conta-corrente; este documento não diz se o valor já foi devolvido ou descontado.',
  }[f.pagamento];
  return `<div class="fat2__pagamento fat2__pagamento--${f.pagamento}">${pagamentoSelo(f)}<p>${t}</p></div>`;
}

/* ---------- a fatura no painel ---------- */
export function detalheFatura(f: Fatura, prefixo = 'fat2', abertaIva = true): string {
  const g = f.guia;
  const artigos = g.linhas.map(([q, d, v], i) => `<tr style="--i:${i}"><td class="ped4__num">${q}</td><td>${esc(d)}</td><td class="ped4__num">${euros(v)}</td></tr>`).join('');
  return `<div class="gui3__det fat2__det">
    <section class="fat2__det-valores" aria-label="Valores"><h3 class="ped4__h">Valores</h3>${discriminacao(f, abertaIva, prefixo)}</section>
    <section class="fat2__det-pag" aria-label="Pagamento"><h3 class="ped4__h">Pagamento</h3>${pagamento(f)}</section>
    <section class="gui3__det-percurso" aria-label="Documentos relacionados"><h3 class="ped4__h">Documentos relacionados</h3>${percursoFat(f)}</section>
    <section class="gui3__det-doc" aria-label="Entrega">
      <h3 class="ped4__h">Entrega</h3>
      <p class="ped4__ent">${L(mapPin)}<span><b>${esc(g.morada[0])}</b>${esc(g.morada[1])} · Armazém ${esc(g.armazem)}</span></p>
      ${g.obs && g.obs !== '—' ? `<p class="gui3__obs"><b>Observações</b>${esc(g.obs)}</p>` : ''}
    </section>
    <section class="gui3__det-artigos" aria-label="Artigos"><h3 class="ped4__h">Artigos <span>${g.linhas.length}</span></h3>
      <div class="ped4__art-rolo"><table class="ped4__art"><thead><tr><th class="ped4__num">Qtd.</th><th>Artigo</th><th class="ped4__num">Valor</th></tr></thead><tbody>${artigos}</tbody></table></div>
      <div class="ped4__det-accoes gui3__accoes">
        <button type="button" class="btn btn--acao btn--sm" data-ver-doc="${f.num}">${L(eye, 'btn__icone')}<span class="btn__rotulo">Ver ${ehCredito(f) ? 'nota de crédito' : 'fatura'}</span></button>
        <button type="button" class="btn btn--ghost btn--sm" data-descarregar="${f.num}">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar PDF</span></button>
        <button type="button" class="btn btn--ghost btn--sm" data-ir="guias" data-abrir-guia-pagina="${g.num}">${L(fileText, 'btn__icone')}<span class="btn__rotulo">Ver guia de remessa</span></button>
      </div>
      <p class="gui3__descarga" role="status" hidden></p>
    </section>
  </div>`;
}
const fechar = '<button type="button" class="ped4__g-fechar" aria-label="Fechar (Esc)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>';
export function cabecaFatura(f: Fatura, idNum = 'fat2-g-num'): string {
  return `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">${nomeDoc(f)} · Guia ${f.guia.num} · <span class="fat2__pag-t fat2__pag-t--${f.pagamento}">${PAGAMENTO[f.pagamento].nome}</span></p><h2 class="ped4__g-num" id="${idNum}" tabindex="-1">${f.num}</h2><p class="ped4__g-meta">${f.guia.data} · ${euros(total(f.guia))} com IVA</p></div>${fechar}</header>`;
}
/** A página do documento (o protótipo não tem o PDF do servidor: monta-se com os campos da própria fatura). */
export function paginaFatura(f: Fatura): string {
  const g = f.guia, grupos = gruposIva(f);
  return `<div class="gui3__folha" aria-label="Pré-visualização da ${nomeDoc(f).toLowerCase()} ${f.num}">
      <div class="gui3__folha-topo"><span class="romafe">ROMAFE</span><span><b>${nomeDoc(f)}</b>${f.num}<br>${g.data}</span></div>
      <div class="gui3__folha-dados"><p><small>Entregar em</small>${esc(g.morada[0])}<br>${esc(g.morada[1])}</p><p><small>Guia de remessa</small>${g.num}<br><small>Pedido</small>${g.pedido}${ehCredito(f) ? '' : `<br><small>Vencimento</small>${f.vencimento}`}</p></div>
      <table class="gui3__folha-art"><thead><tr><th>Qtd.</th><th>Artigo</th><th>Valor</th></tr></thead><tbody>${g.linhas.map(([q, d, v]) => `<tr><td>${q}</td><td>${esc(d)}</td><td>${euros(v)}</td></tr>`).join('')}</tbody></table>
      <dl class="gui3__valores">
        <div class="gui3__v"><dt>Valor bruto</dt><dd>${euros(g.bruto)}</dd></div><div class="gui3__v"><dt>Desconto</dt><dd>${euros(-g.desconto)}</dd></div>
        ${g.embalagens ? `<div class="gui3__v"><dt>Embalagens</dt><dd>${euros(g.embalagens)}</dd></div>` : ''}${g.portes ? `<div class="gui3__v"><dt>Portes</dt><dd>${euros(g.portes)}</dd></div>` : ''}
        ${grupos.map((x) => `<div class="gui3__v gui3__v--sub"><dt>Base tributável · ${taxa(x.taxa)}</dt><dd>${euros(x.base)}</dd></div><div class="gui3__v"><dt>IVA · ${taxa(x.taxa)}</dt><dd>${euros(x.iva)}</dd></div>`).join('')}
        <div class="gui3__v gui3__v--total"><dt>Total</dt><dd>${euros(total(g))}</dd></div>
      </dl>
    </div>`;
}
export function cabecaDocFatura(f: Fatura, idNum = 'fat2-g-num'): string {
  return `<header class="ped4__g-cabeca"><div><p class="ped4__g-rotulo">${nomeDoc(f)} · pré-visualização</p><h2 class="ped4__g-num" id="${idNum}" tabindex="-1">${f.num}</h2><p class="ped4__g-meta">${f.guia.data} · Guia ${f.guia.num} · ${euros(total(f.guia))}</p></div>${fechar}</header>`;
}
export const rodapeDocFatura = (f: Fatura) => `<footer class="gui3__g-pe"><button type="button" class="btn btn--acao" data-descarregar="${f.num}">${L(download, 'btn__icone')}<span class="btn__rotulo">Descarregar PDF</span></button><p class="gui3__descarga" role="status" hidden></p></footer>`;

/* ---------- a cronologia ---------- */
export function itemFatura(f: Fatura, i: number): string {
  const g = f.guia, [d, m] = g.data.split('/'), p = PAGAMENTO[f.pagamento];
  return `<li class="ped4__c-item gui3__item fat2__item" data-num="${f.num}" data-tipo="${g.tipo}" data-pag="${f.pagamento}" data-total="${total(g)}" style="--i:${i}">
      <span class="ped4__c-data" aria-hidden="true"><b>${d}</b>${MESES[+m - 1].slice(0, 3)}<em class="ped4__c-etapa fat2__pag-t fat2__pag-t--${f.pagamento}">${p.nome}</em></span>
      <span class="ped4__c-marca gui3__marca gui3__marca--${g.tipo}" aria-hidden="true">${ehCredito(f) ? L(undo) : L(receipt)}</span>
      <article class="ped4__c-cartao">
        <button type="button" class="ped4__c-cabeca gui3__cabeca" aria-haspopup="dialog">
          <span class="ped4__c-id"><span class="ped4__ref">${f.num}</span><span class="sr-only">${nomeDoc(f)}, ${p.nome}. </span><span class="ped4__c-meta">${g.data} · Guia <span class="gui3__ref-pedido">${g.num}</span>${ehCredito(f) ? '' : ` · vence ${f.vencimento}`}</span></span>
          <span class="gui3__destino">${L(mapPin)}<span>${esc(g.morada[1])}<small>${esc(g.morada[0])}</small></span></span>
          <span class="ped4__c-selos">${tipoSelo(f)}</span>
          <span class="ped4__c-valor">${euros(total(g))}</span>
          <span class="ped4__c-seta" aria-hidden="true">${L(chevronRight)}</span>
        </button>
      </article>
    </li>`;
}
export function cronologiaFaturas(): string {
  const meses = new Map<string, Fatura[]>();
  [...FATURAS].sort((a, b) => aaaammdd(b.guia.data).localeCompare(aaaammdd(a.guia.data))).forEach((f) => { const [, m, a] = f.guia.data.split('/'); const k = `${a}-${m}`; meses.set(k, [...(meses.get(k) || []), f]); });
  let i = 0, ano = '';
  return `<div class="ped4__crono gui3__crono">
      <span class="ped4__c-linha" aria-hidden="true"><span class="ped4__c-linha-cheia"></span></span>
      ${Array.from(meses).map(([k, fs]) => {
        const [a, m] = k.split('-'), nm = MESES[+m - 1];
        const cabAno = a !== ano ? `<h2 class="gui3__ano">${a}</h2>` : ''; ano = a;
        return `${cabAno}<section class="ped4__mes" data-mes="${k}" aria-label="${nm} de ${a}"><h3 class="ped4__mes-t"><span>${nm[0].toUpperCase()}${nm.slice(1)} de ${a}</span><small><b>${fs.length}</b> ${fs.length === 1 ? 'documento' : 'documentos'}</small></h3><ol class="ped4__c-lista">${fs.map((f) => itemFatura(f, i++)).join('')}</ol></section>`;
      }).join('')}
      <p class="ped4__c-fim"><span class="ped4__c-marca" aria-hidden="true"></span>Não há documentos mais antigos neste período.</p>
    </div>`;
}

/* ---------- a tabela (a alternativa): todas as colunas do GO REPAIR, com os três pares base/IVA ---------- */
const ord = (k: string, t: string, cls = '') => `<th${cls ? ` class="${cls}"` : ''} aria-sort="none"><button type="button" class="ped4__ordenar" data-ordenar="${k}">${t}${L(arrowUpDown)}</button></th>`;
const vn = (n: number) => (n ? euros(n) : '<span class="ped4__nada">—</span>');
export function linhaFatura(f: Fatura, i: number): string {
  const g = f.guia, [g1] = gruposIva(f), nada = '<span class="ped4__nada">—</span>';
  return `<tr class="ped4__linha gui3__linha" data-num="${f.num}" data-tipo="${g.tipo}" data-pag="${f.pagamento}" data-data="${aaaammdd(g.data)}" data-total="${total(g)}" style="--i:${i}">
      <td class="ped4__c-abrir"><button type="button" class="ped4__abrir" aria-haspopup="dialog" aria-label="Abrir ${nomeDoc(f).toLowerCase()} ${f.num}">${L(chevronRight)}</button></td>
      <td data-r="Documento"><span class="ped4__ref">${f.num}</span></td><td class="ped4__data">${g.data}</td><td>${tipoSelo(f)}</td><td><span class="gui3__ref-pedido">${g.num}</span></td>
      <td class="ped4__c-ent"><span class="ped4__m1">${esc(g.morada[0])}</span><span class="ped4__m2">${esc(g.morada[1])}</span></td>
      <td class="ped4__num">${euros(g.bruto)}</td><td class="ped4__num">${vn(-g.desconto)}</td><td class="ped4__num">${vn(g.embalagens)}</td><td class="ped4__num">${vn(g.portes)}</td>
      <td class="ped4__num">${euros(g1.base)}</td><td class="ped4__num">${euros(g1.iva)}</td><td class="ped4__num">${nada}</td><td class="ped4__num">${nada}</td><td class="ped4__num">${nada}</td><td class="ped4__num">${nada}</td>
      <td class="ped4__num ped4__valor">${euros(total(g))}</td><td>${pagamentoSelo(f)}</td>
    </tr>`;
}
export const tabelaFaturas = () => `<div class="ped4__tabela gui3__tabela fat2__tabela"><table>
        <thead><tr><th class="ped4__c-abrir"><span class="sr-only">Abrir</span></th>${ord('num', 'Documento')}${ord('data', 'Data')}<th>Tipo</th><th>Guia</th><th class="ped4__c-ent">Morada de entrega</th><th class="ped4__num">Bruto</th><th class="ped4__num">Desconto</th><th class="ped4__num">Embalagens</th><th class="ped4__num">Portes</th><th class="ped4__num">Base trib.</th><th class="ped4__num">IVA</th><th class="ped4__num">Base trib. 2</th><th class="ped4__num">IVA 2</th><th class="ped4__num">Base trib. 3</th><th class="ped4__num">IVA 3</th>${ord('total', 'Total', 'ped4__num')}<th>Pagamento</th></tr></thead>
        <tbody>${FATURAS.map(linhaFatura).join('')}</tbody>
      </table></div>`;

/* ---------- os números do cabeçalho: com IVA; as notas de crédito à parte, a negativo ---------- */
export const somaFaturado = (fs = FATURAS) => fs.filter((f) => !ehCredito(f)).reduce((s, f) => s + total(f.guia), 0);
export const somaCreditos = (fs = FATURAS) => fs.filter(ehCredito).reduce((s, f) => s + total(f.guia), 0);
export const somaAberto = (fs = FATURAS) => fs.filter((f) => f.pagamento === 'aberto' || f.pagamento === 'vencida').reduce((s, f) => s + total(f.guia), 0);

const campo = (cid: string, rotulo: string, icone: string, extra: string) => `<div class="ped4__campo"><label for="${cid}">${rotulo}</label><span class="ped4__caixa">${L(icone)}<input class="ped4__input" id="${cid}" ${extra}></span><small class="ped4__erro" id="${cid}-erro" hidden></small></div>`;

export function faturasV2(vista: 'cronologia' | 'tabela' = 'cronologia'): string {
  const nF = FATURAS.filter((f) => !ehCredito(f)).length, nC = FATURAS.length - nF;
  const est: [Pagamento, string][] = [['paga', L(check)], ['aberto', L(clock)], ['vencida', L(alert)], ['creditada', L(undo)]];
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--fat2">
  <main class="ped4 gui3 fat2" data-faturas2>
    <header class="ped4__cabeca">
      <div><h1 class="ped4__titulo">Faturas</h1><p class="ped4__sub">Consulte os documentos de faturação da sua conta.</p></div>
      <div class="fat2__kpis">
        <dl class="ped4__kpi">
          <div><dt>Documentos</dt><dd data-kpi="n" data-valor="${FATURAS.length}">${FATURAS.length}</dd></div>
          <div><dt>Faturado</dt><dd data-kpi="faturado" data-valor="${somaFaturado()}">${euros(somaFaturado())}</dd></div>
          <div><dt>Notas de crédito</dt><dd data-kpi="creditos" data-valor="${somaCreditos()}">${euros(somaCreditos())}</dd></div>
          <div><dt>Por pagar</dt><dd data-kpi="aberto" data-valor="${somaAberto()}">${euros(somaAberto())}</dd></div>
        </dl>
        <p class="fat2__kpi-nota">Valores com IVA. As notas de crédito ficam à parte, a negativo, e não descontam no faturado; «Por pagar» são as faturas em aberto e vencidas.</p>
      </div>
    </header>

    <section class="ped4__filtros" aria-label="Filtrar faturas">
      <button type="button" class="btn btn--ghost btn--sm ped4__filtros-abrir" aria-expanded="false" aria-controls="fat2-campos">${L(slidersHorizontal, 'btn__icone')}<span class="btn__rotulo">Filtros</span><span class="ped4__filtros-n" hidden></span></button>
      <form class="ped4__campos fat2__campos" id="fat2-campos" novalidate>
        ${campo('fat2-de', 'Data a partir de', calendar, 'type="text" value="01/03/2024" inputmode="numeric" placeholder="dd/mm/aaaa" autocomplete="off"')}
        ${campo('fat2-ate', 'Data até', calendar, 'type="text" inputmode="numeric" placeholder="dd/mm/aaaa" autocomplete="off"')}
        ${campo('fat2-num', 'N.º da fatura', hash, 'type="text" placeholder="FT2024/… ou NC2024/…" autocomplete="off"')}
        <div class="ped4__botoes">
          <button type="button" class="btn btn--ghost ped4__limpar">${L(eraser, 'btn__icone')}<span class="btn__rotulo">Limpar</span></button>
          <button type="submit" class="btn btn--acao ped4__pesquisar">${L(search, 'btn__icone')}<span class="btn__rotulo">Pesquisar</span></button>
        </div>
      </form>
      <div class="ped4__baixo">
        <div class="ped4__estados" role="group" aria-label="Tipo de documento">
          <button type="button" class="ped4__est" data-filtro="todos" aria-pressed="true">${L(layers)}Todas <span class="ped4__est-n">${FATURAS.length}</span></button>
          <button type="button" class="ped4__est" data-filtro="fatura" aria-pressed="false">${L(receipt)}Fatura <span class="ped4__est-n">${nF}</span></button>
          <button type="button" class="ped4__est" data-filtro="credito" aria-pressed="false">${L(undo)}Nota de crédito <span class="ped4__est-n">${nC}</span></button>
          <i class="ped4__est-risca" aria-hidden="true"></i>
        </div>
        ${pilulasEstado(est.map(([k, icone]) => ({ k, nome: PAGAMENTO[k].nome, icone, n: FATURAS.filter((f) => f.pagamento === k).length })), FATURAS.length, 'Pagamento')}
        <ul class="ped4__chips" aria-label="Filtros aplicados"></ul>
      </div>
    </section>

    <section class="ped4__lista" aria-label="Faturas" data-vista="${vista}">
      <div class="ped4__lista-cabeca"><p class="ped4__conta" aria-live="polite">A mostrar <b>${FATURAS.length}</b> de ${FATURAS.length} documentos</p><p class="ped4__a-atualizar" role="status" hidden></p><p class="gui3__mes-atual" aria-hidden="true"></p>
        <div class="ped4__vistas" role="group" aria-label="Ver como"><button type="button" class="ped4__vista" data-vista="cronologia" aria-pressed="${vista === 'cronologia'}">${L(history)}Cronologia</button><button type="button" class="ped4__vista" data-vista="tabela" aria-pressed="${vista === 'tabela'}">${L(table)}Tabela</button></div></div>
      ${cronologiaFaturas()}
      ${tabelaFaturas()}
      <div class="ped4__vazio" hidden></div>
      <p class="ped4__pe">Desde 01/03/2024 até hoje · os valores são os dos documentos emitidos, com IVA</p>
    </section>

    <div class="ped4__veu" hidden></div>
    <aside class="ped4__gaveta gui3__gaveta fat2__gaveta" role="dialog" aria-modal="true" aria-labelledby="fat2-g-num" hidden></aside>
  </main>
</div>`;
}
