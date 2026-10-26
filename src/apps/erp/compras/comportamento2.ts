/* =========================================================
   ERP · Compras — o comportamento da fase 2 (19 out. 2026): requisições e pedidos de cotação
   Como na fase 1: cada ação espera a «resposta» (ws.espera) e só depois muda o ecrã; editar é numa cópia
   (guardar manda a versão que se abriu); sair com alterações por guardar pergunta.
   Na comparação: escolher uma proposta só destaca a coluna e refaz o resumo — nada se grava até
   «Criar encomenda» e a confirmação.
   ========================================================= */
import { ws, registarPaginas, travarSaida } from '../comportamento/inicio';
import { comEstadoDaRaiz } from './estados-cp';
import { dialogoSair } from './ecras';
import {
  IDS_FASE2, paginaFase2, edReqDe, edPcDe, cenarioPc, tabelaReq, linhasReq, resumoReq, comparacao, escolhaResumo, gavetaTodos, dialogoMotivo2, dialogoResposta, dialogoEscolha,
  type Contexto2, type EdReq, type EdPc, type FiltroReq, type FiltroPc,
} from './ecras2';
import {
  requisicao, cotacao, criarReq, guardarReq, transitarReq, duplicarReq, encomendarReq, cotarReq, problemasReq, criarPc, guardarPc, enviarPc, responderPc, cancelarPc, duplicarPc,
  escolher, problemasPc, recarregar2, CHAVE_FASE2, type AcaoReq, type AcaoPc, type Oferta,
} from './dominio2';
import { artigo, euros, lerEuros, lerPercentagem, Recusa } from './dominio';

const pag = () => ws.raiz()?.dataset.wsPagina ?? '';
const nosso = () => IDS_FASE2.includes(pag());
const $ = <T extends HTMLElement = HTMLElement>(s: string) => ws.raiz()?.querySelector<T>(s) ?? null;
const lerS = <T,>(k: string): T | null => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) as T : null; } catch { return null; } };

let freq: FiltroReq | undefined; let qreq = ''; let fpc: FiltroPc = 'todos';
let edReq: EdReq | null = null; let edPc: EdPc | null = null;

function refDe(id: string): string { return ws.raiz()?.dataset.wsRef || lerS<string>(`erp:ref:${id}`) || (id === 'compras-requisicao' ? 'RQ 2026/0052' : 'PC 2026/0017'); }
function contexto(id: string): Contexto2 {
  const ref = refDe(id), c: Contexto2 = { ref, freq, qreq, fpc };
  if (id === 'compras-requisicao') { const r = requisicao(ref); if (!edReq || edReq.r.ref !== ref || (!edReq.sujo && r && r.versao !== edReq.versao)) edReq = edReqDe(ref); c.edReq = edReq; }
  if (id === 'compras-cotacao') { const k = cotacao(ref); if (!edPc || edPc.c.ref !== ref || (!edPc.sujo && k && k.versao !== edPc.versao)) edPc = cenarioPc(edPcDe(ref), ws.raiz()?.dataset.cpCenario); c.edPc = edPc; }
  return c;
}
/* os estados de 26 out. (compras/estados-cp.ts) ficam por cima de cada desenho */
registarPaginas(IDS_FASE2, (id, e) => comEstadoDaRaiz(paginaFase2(id, e, contexto(id)), ws.raiz()));

function trocar(sel: string, html: string): void { const v = $(sel); if (!v) return; const t = document.createElement('div'); t.innerHTML = html; v.replaceWith(t.firstElementChild!); }
async function pedido<T>(b: HTMLButtonElement | null, texto: string, f: () => T): Promise<T | null> {
  if (b?.getAttribute('aria-busy') === 'true') return null;
  if (b) ws.ocupar(b, texto);
  await ws.espera();
  if (b?.isConnected) ws.ocupar(b, null);
  if (!navigator.onLine) { ws.aviso('Sem ligação ao servidor: nada foi guardado.'); return null; }
  try { return f(); } catch (err) {
    if (err instanceof Recusa) {
      if (err.tipo === 'conflito') { if (pag() === 'compras-requisicao' && edReq) edReq.conflito = true; if (pag() === 'compras-cotacao' && edPc) edPc.conflito = true; ws.redesenhar(); }
      else ws.aviso(err.message);
      return null;
    }
    console.error(err); ws.aviso('Não foi possível guardar. Tenta outra vez.'); return null;
  }
}
const animar = (el: Element | null) => { if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; el.classList.remove('is-muda'); void (el as HTMLElement).offsetWidth; el.classList.add('is-muda'); };
function sujo(): void {
  if (pag() === 'compras-requisicao' && edReq) edReq.sujo = true;
  if (pag() === 'compras-cotacao' && edPc) edPc.sujo = true;
  const g = $<HTMLButtonElement>('[data-cp-guardar-req], [data-cp-guardar-pc]'); if (g) g.disabled = false;
  if (!$('[data-cp-sujo]')) $('.cp-doc__linha')?.insertAdjacentHTML('beforeend', '<span class="cp-sujo" data-cp-sujo>Alterações por guardar</span>');
}
function baixar(nome: string, texto: string): void {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' })); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- requisição ---------- */
async function guardarR(b: HTMLButtonElement | null): Promise<boolean> {
  if (!edReq) return false;
  const r = await pedido(b, 'A guardar…', () => guardarReq(ws.estado().perfil, edReq!.r, edReq!.versao)); if (!r) return false;
  edReq = edReqDe(r.ref); ws.redesenhar(); ws.aviso(`${r.ref} guardada (versão ${r.versao}).`); return true;
}
async function acaoReq(a: AcaoReq, b: HTMLButtonElement | null, motivo = ''): Promise<void> {
  if (!edReq) return;
  const ref = edReq.r.ref, p = ws.estado().perfil;
  if ((a === 'rejeitar' || a === 'encerrar') && !motivo) {
    ws.abrir('personalizar', dialogoMotivo2(a === 'rejeitar' ? `Rejeitar a ${ref}` : `Encerrar a ${ref}`, a === 'rejeitar' ? 'A decisão e o motivo ficam no histórico, para quem pediu.' : 'Fica encerrada sem se converter. Fica no histórico porquê.', a === 'rejeitar' ? 'Rejeitar' : 'Encerrar', `req:${a}`), b);
    return;
  }
  if (a === 'submeter') {
    const pr = problemasReq(edReq.r); if (pr.length) { edReq.erros = pr; ws.redesenhar(); $('[data-cp-erros]')?.focus(); return; }
    edReq.erros = [];
    if (edReq.sujo && !(await guardarR(b))) return;
  }
  if (a === 'duplicar') { const n = await pedido(b, 'A duplicar…', () => duplicarReq(p, ref)); if (n) { edReq = null; ws.irPara('compras-requisicao', n.ref); ws.aviso(`Criada a ${n.ref}, cópia da ${ref}.`); } return; }
  if (a === 'cotar') { const c = await pedido(b, 'A criar o pedido…', () => cotarReq(p, ref)); if (c) { edReq = null; ws.irPara('compras-cotacao', c.ref); ws.aviso(`${c.ref} criado a partir da ${ref}. Escolhe os fornecedores.`); } return; }
  if (a === 'encomendar') {
    const refs = await pedido(b, 'A criar…', () => encomendarReq(p, ref)); if (!refs) return;
    edReq = null; ws.irPara('compras-encomenda', refs[0]);
    ws.aviso(refs.length > 1 ? `Criadas ${refs.join(' e ')} (uma por fornecedor), em rascunho.` : `${refs[0]} criada em rascunho a partir da ${ref}.`); return;
  }
  const antes = requisicao(ref)?.estado;
  const r = await pedido(b, `${a === 'aprovar' ? 'A aprovar' : a === 'submeter' ? 'A submeter' : 'A guardar'}…`, () => transitarReq(p, ref, a, motivo)); if (!r) return;
  if (ws.camada()) ws.fechar(false);
  edReq = edReqDe(ref); ws.redesenhar(); $('.cp-percurso')?.classList.add('is-avanca');
  ws.aviso(`${ref}: ${antes} → ${r.estado}${a === 'submeter' && r.aprovador ? ` (aprova ${r.aprovador === 'admin' ? 'a Administração' : 'Compras'})` : ''}.`);
}
function campoReq(t: HTMLInputElement | HTMLTextAreaElement): void {
  if (!edReq) return;
  const k = t.dataset.cpRq!, id = t.dataset.cpLinha, r = edReq.r;
  let ok = true;
  if (id) {
    const l = r.linhas.find((x) => x.id === id)!;
    if (k === 'qtd') { ok = /^\d+$/.test(t.value.trim()) && Number(t.value) > 0; if (ok) l.qtd = Number(t.value); }
    if (k === 'custo') { if (!t.value.trim()) l.custo = null; else { const c = lerEuros(t.value); ok = c !== null; if (ok) l.custo = c; } }
    const cel = $(`[data-cp-liq="${id}"]`); if (cel) { const v = l.custo === null ? '—' : euros(l.qtd * l.custo); if (cel.textContent !== v) { cel.textContent = v; animar(cel); } }
  } else if (k === 'necessaria' || k === 'centro' || k === 'justificacao') (r as unknown as Record<string, string>)[k] = t.value;
  t.classList.toggle('is-erro', !ok); t.setAttribute('aria-invalid', String(!ok));
  sujo();
  const antes = $('[data-cp-total="base"]')?.textContent;
  trocar('[data-cp-resumo]', resumoReq(r));
  if ($('[data-cp-total="base"]')?.textContent !== antes) animar($('[data-cp-total="base"]'));
}

/* ---------- cotação ---------- */
async function guardarP(b: HTMLButtonElement | null): Promise<boolean> {
  if (!edPc) return false;
  const c = await pedido(b, 'A guardar…', () => guardarPc(ws.estado().perfil, edPc!.c, edPc!.versao)); if (!c) return false;
  edPc = edPcDe(c.ref); ws.redesenhar(); ws.aviso(`${c.ref} guardado (versão ${c.versao}).`); return true;
}
async function acaoPc(a: AcaoPc, b: HTMLButtonElement | null, motivo = ''): Promise<void> {
  if (!edPc) return;
  const ref = edPc.c.ref, p = ws.estado().perfil;
  if (a === 'cancelar' && !motivo) { ws.abrir('personalizar', dialogoMotivo2(`Cancelar o ${ref}`, 'Não se processa mais; fica no histórico porquê.', 'Cancelar o pedido', 'pc:cancelar'), b); return; }
  if (a === 'duplicar') { const n = await pedido(b, 'A duplicar…', () => duplicarPc(p, ref)); if (n) { edPc = null; ws.irPara('compras-cotacao', n.ref); ws.aviso(`Criado o ${n.ref}, cópia do ${ref}.`); } return; }
  if (a === 'enviar') {
    const pr = problemasPc(edPc.c); if (pr.length) { edPc.erros = pr; ws.redesenhar(); $('[data-cp-erros]')?.focus(); return; }
    edPc.erros = [];
    if (edPc.sujo && !(await guardarP(b))) return;
    const c = await pedido(b, 'A marcar…', () => enviarPc(p, ref)); if (!c) return;
    edPc = edPcDe(ref); ws.redesenhar(); $('.cp-percurso')?.classList.add('is-avanca'); ws.aviso(`${ref} marcado como enviado. Regista as respostas quando chegarem.`); return;
  }
  if (a === 'cancelar') { const c = await pedido(b, 'A cancelar…', () => cancelarPc(p, ref, motivo)); if (c) { ws.fechar(false); edPc = edPcDe(ref); ws.redesenhar(); ws.aviso(`${ref} cancelado.`); } }
}
function lerOferta(f: HTMLFormElement, forn: string): Oferta | string {
  const val = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? '';
  const c = edPc!.c;
  const linhas = [];
  for (const l of c.linhas) {
    const pr = val(`preco-${l.id}`), de = val(`desc-${l.id}`), mi = val(`min-${l.id}`);
    const preco = pr ? lerEuros(pr) : null; if (pr && preco === null) return `${l.ref}: o preço não é um valor válido.`;
    const desc = de ? lerPercentagem(de) : 0; if (desc === null) return `${l.ref}: o desconto não é uma percentagem válida.`;
    if (mi && !/^\d+$/.test(mi)) return `${l.ref}: o mínimo é um número inteiro.`;
    linhas.push({ id: l.id, preco, desc, minimo: mi ? Number(mi) : 0, refForn: val(`ref-${l.id}`) });
  }
  const prazo = val('prazo'); if (!/^\d+$/.test(prazo)) return 'O prazo de entrega é um número de dias.';
  const portes = lerEuros(val('portes') || '0'); if (portes === null) return 'Os portes não são um valor válido.';
  return { forn, respondida: val('respondida') || '2026-10-19', prazo: Number(prazo), portes, pagamento: val('pagamento'), validade: val('validade'), moeda: val('moeda') as 'EUR', disponibilidade: val('disponibilidade'), notas: val('notas'), linhas };
}
function escolherColuna(forn: string): void {
  if (!edPc) return;
  edPc.escolha = forn;
  ws.raiz()!.querySelectorAll<HTMLElement>('.cp-tabela--cmp [data-col]').forEach((c) => c.classList.toggle('is-sel', c.dataset.col === forn));
  const antes = $('[data-cp-escolha]');
  const eraVisivel = antes && !antes.hidden;
  trocar('[data-cp-escolha]', escolhaResumo(edPc));
  const novo = $('[data-cp-escolha]'); if (!novo) return;
  if (!eraVisivel) novo.classList.add('is-entra');
  else novo.querySelectorAll('[data-cp-total]').forEach(animar);
}

/* ---------- a gaveta de artigos (comum aos dois) ---------- */
function juntar(ref: string): void {
  const a = artigo(ref); if (!a) return;
  if (pag() === 'compras-requisicao' && edReq) {
    const ja = edReq.r.linhas.find((l) => l.ref === ref);
    if (ja) ja.qtd++; else edReq.r.linhas.push({ id: 'n' + Date.now().toString(36), ref, qtd: 1, custo: a.preco });
    sujo(); trocar('[data-cp-linhas]', linhasReq(edReq, ws.estado().perfil)); trocar('[data-cp-resumo]', resumoReq(edReq.r));
    if (!$('[data-cp-juntar-req]') || !$('[data-cp-linhas] table')) { const g = ws.camada(); ws.redesenhar(); if (g) ws.abrir('painel', gavetaTodos('', edReq.r.linhas.map((l) => l.ref)), null); }
  } else if (pag() === 'compras-cotacao' && edPc) {
    const ja = edPc.c.linhas.find((l) => l.ref === ref);
    if (ja) ja.qtd++; else edPc.c.linhas.push({ id: 'n' + Date.now().toString(36), ref, qtd: 1 });
    sujo(); const g = ws.camada(); ws.redesenhar(); if (g) ws.abrir('painel', gavetaTodos('', edPc.c.linhas.map((l) => l.ref)), null);
  } else return;
  ws.aviso(`${ref} junto.`);
}

/* ---------- os cliques ---------- */
function aoClicar(ev: MouseEvent): void {
  if (!nosso() || (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir'))) return;
  const alvo = ev.target as Element, raiz = ws.raiz(); if (!raiz?.contains(alvo)) return;
  const q = <T extends HTMLElement = HTMLElement>(s: string) => alvo.closest?.<T>(s) ?? null;
  let b: HTMLElement | null;
  if ((b = q('[data-cp-freq]'))) { freq = b.dataset.cpFreq as FiltroReq; ws.redesenhar(); $<HTMLElement>(`.cp-filtro[data-cp-freq="${freq}"]`)?.focus(); return; }
  if ((b = q('[data-cp-fpc]'))) { fpc = b.dataset.cpFpc as FiltroPc; ws.redesenhar(); $<HTMLElement>(`[data-cp-fpc="${fpc}"]`)?.focus(); return; }
  if ((b = q('tr[data-cp-abrir-ir]')) && !q('button, a, input, select')) { ws.irPara(b.dataset.cpAbrirIr!, b.dataset.cpAbrirRef); return; }
  if ((b = q('[data-cp-nova-req]'))) { pedido(b as HTMLButtonElement, 'A criar…', () => criarReq(ws.estado().perfil)).then((r) => { if (r) { edReq = null; ws.irPara('compras-requisicao', r.ref); ws.aviso(`${r.ref} criada. Junta os artigos e diz porque precisas.`); } }); return; }
  if ((b = q('[data-cp-novo-pc]'))) { pedido(b as HTMLButtonElement, 'A criar…', () => criarPc(ws.estado().perfil)).then((c) => { if (c) { edPc = null; ws.irPara('compras-cotacao', c.ref); ws.aviso(`${c.ref} criado. Junta os artigos e escolhe os fornecedores.`); } }); return; }
  /* requisição */
  if ((b = q('[data-cp-req]'))) { acaoReq(b.dataset.cpReq as AcaoReq, b as HTMLButtonElement); return; }
  if (q('[data-cp-guardar-req]')) { guardarR(q<HTMLButtonElement>('[data-cp-guardar-req]')); return; }
  if ((b = q('[data-cp-juntar-req], [data-cp-juntar-pc]'))) { ws.abrir('painel', gavetaTodos('', (pag() === 'compras-requisicao' ? edReq?.r.linhas : edPc?.c.linhas)?.map((l) => l.ref) ?? []), b); return; }
  if ((b = q('[data-cp-art2]'))) { juntar(b.dataset.cpArt2!); return; }
  if ((b = q('[data-cp-tirar-req]')) && edReq) { const id = b.dataset.cpTirarReq; edReq.r.linhas = edReq.r.linhas.filter((l) => l.id !== id); sujo(); ws.redesenhar(); return; }
  if ((b = q('[data-cp-tirar-anexo]')) && edReq) { edReq.r.anexos.splice(Number(b.dataset.cpTirarAnexo), 1); sujo(); ws.redesenhar(); return; }
  if (q('[data-cp-recarregar-req]')) { recarregar2(); edReq = edReqDe(refDe('compras-requisicao')); ws.redesenhar(); return; }
  /* motivo (rejeitar, encerrar, cancelar) */
  if ((b = q('[data-cp-motivo-ok]'))) {
    const t = $<HTMLTextAreaElement>('[data-cp-motivo]')!, er = t.closest('.ws-dialogo__corpo')!.querySelector<HTMLElement>('.cp-campo__erro')!;
    if (!t.value.trim()) { er.hidden = false; t.focus(); return; }
    const [tipo, a] = b.dataset.cpMotivoOk!.split(':');
    if (tipo === 'req') acaoReq(a as AcaoReq, b as HTMLButtonElement, t.value); else acaoPc(a as AcaoPc, b as HTMLButtonElement, t.value);
    return;
  }
  /* cotação */
  if ((b = q('[data-cp-pc]'))) { acaoPc(b.dataset.cpPc as AcaoPc, b as HTMLButtonElement); return; }
  if (q('[data-cp-guardar-pc]')) { guardarP(q<HTMLButtonElement>('[data-cp-guardar-pc]')); return; }
  if ((b = q('[data-cp-tirar-pc]')) && edPc) { const id = b.dataset.cpTirarPc; edPc.c.linhas = edPc.c.linhas.filter((l) => l.id !== id); sujo(); ws.redesenhar(); return; }
  if (q('[data-cp-recarregar-pc]')) { recarregar2(); edPc = edPcDe(refDe('compras-cotacao')); ws.redesenhar(); return; }
  if (q('[data-cp-exportar-pc]') && edPc) {
    const c = edPc.c, l = [['Pedido', 'Artigo', 'Descrição', 'Quantidade', 'Unidade', 'Responder até', 'Entrega desejada', 'Entregar em', 'Notas']];
    c.linhas.forEach((x) => l.push([c.ref, x.ref, artigo(x.ref)?.desc ?? '', String(x.qtd), artigo(x.ref)?.un ?? '', c.prazoResposta.split('-').reverse().join('/'), c.entrega.split('-').reverse().join('/'), `Romafe, SA · ${c.local}`, c.notas]));
    baixar(`${c.ref.replace(/\W+/g, '-')}.csv`, '﻿' + l.map((r) => r.map((x) => /[;"\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x).join(';')).join('\r\n'));
    ws.aviso('Pedido exportado (CSV). Manda-o aos fornecedores e depois marca como enviado.'); return;
  }
  if ((b = q('[data-cp-responder]')) && edPc) { ws.abrir('personalizar', dialogoResposta(edPc.c, b.dataset.cpResponder!), b); return; }
  if ((b = q('[data-cp-resposta-ok]')) && edPc) {
    const forn = b.dataset.cpRespostaOk!, f = $<HTMLFormElement>(`[data-cp-resposta="${forn}"]`)!;
    const o = lerOferta(f, forn);
    /* o erro aparece no diálogo aberto: o que se escreveu fica */
    const reabrir = (m: string) => {
      ws.ocupar(b as HTMLButtonElement, null);
      let er = f.querySelector<HTMLElement>(':scope > .cp-campo__erro');
      if (!er) { f.insertAdjacentHTML('afterbegin', '<p class="cp-campo__erro" role="alert"></p>'); er = f.querySelector<HTMLElement>(':scope > .cp-campo__erro')!; }
      er.textContent = m; er.scrollIntoView({ block: 'nearest' });
    };
    if (typeof o === 'string') { reabrir(o); return; }
    const ref = edPc.c.ref;
    if ((b as HTMLButtonElement).getAttribute('aria-busy') === 'true') return;
    ws.ocupar(b as HTMLButtonElement, 'A guardar…');
    ws.espera().then(() => {
      try { responderPc(ws.estado().perfil, ref, o); } catch (err) { reabrir(err instanceof Recusa ? err.message : 'Não foi possível guardar.'); return; }
      ws.fechar(false); edPc = edPcDe(ref); ws.redesenhar(); ws.aviso('Resposta registada: está na comparação.');
    });
    return;
  }
  if ((b = q('[data-cp-ordem-pc]')) && edPc) { edPc.ordem = b.dataset.cpOrdemPc as EdPc['ordem']; trocar('[data-cp-comparar]', comparacao(edPc, ws.estado().perfil)); $<HTMLElement>(`[data-cp-ordem-pc="${edPc.ordem}"]`)?.focus(); return; }
  if (q('[data-cp-confirmar-escolha]') && edPc?.escolha) { ws.abrir('personalizar', dialogoEscolha(edPc.c, edPc.escolha), q('[data-cp-confirmar-escolha]')); return; }
  if ((b = q('[data-cp-escolha-ok]')) && edPc) {
    const forn = b.dataset.cpEscolhaOk!, ref = edPc.c.ref;
    pedido(b as HTMLButtonElement, 'A criar…', () => escolher(ws.estado().perfil, ref, forn)).then((ef) => {
      if (!ef) return; ws.fechar(false); edPc = null; ws.irPara('compras-encomenda', ef); ws.aviso(`${ef} criada em rascunho com a proposta escolhida. O ${ref} ficou decidido.`);
    });
    return;
  }
  if (q('[data-cp-sair-sem]') && seguirDepois) { const s = seguirDepois; seguirDepois = null; edReq = null; edPc = null; ws.fechar(false); s(); return; }
  if ((b = q('[data-cp-sair-guardar]')) && seguirDepois) { const s = seguirDepois; (pag() === 'compras-requisicao' ? guardarR : guardarP)(b as HTMLButtonElement).then((ok) => { if (ok) { seguirDepois = null; ws.fechar(false); s(); } }); return; }
}
let seguirDepois: (() => void) | null = null;
travarSaida((seguir) => {
  const ed = pag() === 'compras-requisicao' ? edReq : pag() === 'compras-cotacao' ? edPc : null;
  if (!ed?.sujo) return true;
  seguirDepois = seguir;
  ws.abrir('personalizar', dialogoSair('r' in ed ? ed.r.ref : ed.c.ref), document.activeElement as HTMLElement);
  return false;
});

function aoEscrever(ev: Event): void {
  if (!nosso()) return;
  const t = ev.target as HTMLInputElement; if (!ws.raiz()?.contains(t)) return;
  if (t.matches('[data-cp-qreq]')) { qreq = t.value; trocar('[data-cp-tabela]', tabelaReq(ws.estado().perfil, freq ?? 'todas', qreq)); return; }
  if (t.matches('[data-cp-gaveta2-q]')) { const d = document.createElement('div'); d.innerHTML = gavetaTodos(t.value, (pag() === 'compras-requisicao' ? edReq?.r.linhas : edPc?.c.linhas)?.map((l) => l.ref) ?? []); $('[data-cp-gaveta2-lista]')!.innerHTML = d.querySelector('[data-cp-gaveta2-lista]')!.innerHTML; return; }
  if (t.matches('[data-cp-rq]') && t.type !== 'date') { campoReq(t); return; }
  if (t.matches('[data-cp-pcc]') && t.type !== 'date' && edPc) { (edPc.c as unknown as Record<string, string>)[t.dataset.cpPcc!] = t.value; sujo(); return; }
  if (t.matches('[data-cp-pcq]') && edPc) { const l = edPc.c.linhas.find((x) => x.id === t.dataset.cpLinha)!; const ok = /^\d+$/.test(t.value.trim()) && Number(t.value) > 0; if (ok) l.qtd = Number(t.value); t.classList.toggle('is-erro', !ok); sujo(); }
}
function aoMudar(ev: Event): void {
  if (!nosso()) return;
  const t = ev.target as HTMLInputElement; if (!ws.raiz()?.contains(t)) return;
  if (t.matches('[data-cp-rq]') && t.type === 'date') { campoReq(t); return; }
  if (t.matches('[data-cp-pcc]') && t.type === 'date' && edPc) { (edPc.c as unknown as Record<string, string>)[t.dataset.cpPcc!] = t.value; sujo(); return; }
  if (t.matches('[data-cp-pcf]') && edPc) { const f = t.value; edPc.c.fornecedores = t.checked ? [...edPc.c.fornecedores, f] : edPc.c.fornecedores.filter((x) => x !== f); sujo(); return; }
  if (t.matches('[data-cp-anexar]') && edReq && t.files) { [...t.files].forEach((f) => edReq!.r.anexos.push({ nome: f.name, tamanho: f.size })); sujo(); ws.redesenhar(); ws.aviso('Anexo junto (no protótipo, só o nome e o tamanho).'); return; }
  if (t.matches('[data-cp-escolher]')) { escolherColuna(t.value); return; }
}
function aoTeclar(ev: KeyboardEvent): void {
  if (!nosso()) return;
  if (ev.altKey && ev.key.toLowerCase() === 'a') { const j = $<HTMLElement>('[data-cp-juntar-req], [data-cp-juntar-pc]'); if (j) { ev.preventDefault(); j.click(); } }
}

export function iniciar(): void {
  document.addEventListener('click', aoClicar);
  document.addEventListener('input', aoEscrever);
  document.addEventListener('change', aoMudar);
  document.addEventListener('keydown', aoTeclar);
  window.addEventListener('storage', (ev) => {
    if (ev.key !== CHAVE_FASE2) return;
    recarregar2();
    if (!nosso()) return;
    const ed = pag() === 'compras-requisicao' ? edReq : pag() === 'compras-cotacao' ? edPc : null;
    if (ed?.sujo) { ed.conflito = true; ws.redesenhar(); ws.aviso('Este documento foi guardado noutra janela.'); return; }
    if (!document.activeElement?.matches?.('input, select, textarea')) ws.redesenhar();
  });
  window.addEventListener('beforeunload', (ev) => { const ed = pag() === 'compras-requisicao' ? edReq : pag() === 'compras-cotacao' ? edPc : null; if (ed?.sujo) { ev.preventDefault(); ev.returnValue = ''; } });
}
