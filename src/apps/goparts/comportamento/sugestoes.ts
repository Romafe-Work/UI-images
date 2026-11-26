/* =========================================================
   PEÇA A PEÇA — comportamento das quatro sugestões e do assistente (26 nov. 2026)
   Ver portal/sugestoes.ts. O assistente (o «bot opcional», ela: «o bot canto inferior direito») é um botão
   redondo no canto inferior direito de todos os ecrãs do portal (acima da barra do protótipo). Responde só
   com os dados do portal — pedidos, faturas, stock, equivalências, garagem, devoluções — e diz quando não sabe.
   É opcional: «Desligar» no painel esconde-o; volta pela Ajuda (?) da barra de cima.
   ========================================================= */
import * as carrinho from './carrinho';
import { mostrar } from '../../../comum/ecras';
import { comparacao, lerLote, CHAVE_ALERTAS, esc, liquido, type LinhaLote } from '../portal/sugestoes';
import { REFERENCIAS, saida, equivalentes, euros } from '../portal/catalogo-dados';
import { GARAGEM, nomeCarro } from '../portal/inicio-espaco';
import { PEDIDOS } from '../portal/pedidos-dados';
import { FATURAS } from '../portal/faturas-dados';
import { total } from '../portal/guias-dados';
import { DEVOLUCOES, estadoDev, NOME_ESTADO } from '../portal/devolucoes-dados';
import { estadoEncomenda } from '../portal/pedidos-v6';

const $ = <T extends HTMLElement = HTMLElement>(r: ParentNode, s: string) => r.querySelector<T>(s);
const vivo = (k: string) => document.querySelector<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) main[data-sg="${k}"]`);
const aviso = (m: HTMLElement, t: string) => { const a = m.closest('.portal')?.querySelector('[data-sg-aviso]'); if (a) a.textContent = t; };
const abrirFicha = (fab: string, ref: string) => { try { sessionStorage.setItem('goparts:catalogo-abrir', JSON.stringify({ tipo: 'ref', fab, ref })); } catch { /* abre o catálogo */ } mostrar('catalogo'); };
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

/* ---------- comparador ---------- */
function comparar(m: HTMLElement): void {
  $(m, '[data-sg-comparacao]')!.innerHTML = comparacao($<HTMLSelectElement>(m, '[data-sg-ref]')!.value, $<HTMLSelectElement>(m, '[data-sg-carro]')!.value, $<HTMLSelectElement>(m, '[data-sg-ordem]')!.value);
}

/* ---------- lote ---------- */
const lotes = new WeakMap<HTMLElement, LinhaLote[]>();
function desenharLote(m: HTMLElement): void {
  const ls = lotes.get(m) ?? [], ok = ls.filter((l) => l.estado === 'ok'), conf = ls.filter((l) => l.estado === 'confirmar'), nao = ls.filter((l) => l.estado === 'nao');
  const ESTADO = { ok: ['ok', 'Encontrado'], confirmar: ['atencao', 'Confirmar'], nao: ['erro', 'Não encontrado'] } as const;
  $(m, '[data-sg-lote]')!.innerHTML = !ls.length ? '' : `<p class="hx__conta"><b>${ls.length}</b> linhas · ${ok.length} encontradas · ${conf.length} a confirmar · ${nao.length} não encontradas</p>
    <div class="hx__tabela-caixa"><table class="hx__tabela"><thead><tr><th scope="col">Pedido na lista</th><th scope="col" class="hx__num">Qtd.</th><th scope="col">Estado</th><th scope="col">Artigo do catálogo</th><th scope="col" class="hx__num">Preço</th></tr></thead>
    <tbody>${ls.map((l, i) => `<tr><td><span class="hx__ref sg__ref">${esc(l.pedido)}</span></td><td class="hx__num"><input type="number" class="sg__qtd" min="1" step="1" value="${l.qtd}" data-sg-lote-qtd="${i}" aria-label="Quantidade de ${esc(l.pedido)}"></td>
      <td><span class="hx__estado hx__estado--${ESTADO[l.estado][0]}"><span>${ESTADO[l.estado][1]}</span></span><small>${esc(l.motivo)}</small></td>
      <td>${l.estado === 'nao' ? '<small>—</small>' : l.candidatas.length > 1 || (l.estado === 'confirmar' && !l.r) ? `<select class="sg__escolha" data-sg-lote-escolha="${i}" aria-label="Escolher o artigo para ${esc(l.pedido)}"><option value="">Escolher…</option>${l.candidatas.map((r) => `<option value="${esc(r[2])}">${esc(r[1])} ${esc(r[2])} · ${esc(r[3])}</option>`).join('')}</select>`
        : `${esc(l.r![1])} ${esc(l.r![2])}<small>${esc(l.r![3])}</small>${l.estado === 'confirmar' ? `<label class="sg__conf"><input type="checkbox" data-sg-lote-conf="${i}"> Confirmo</label>` : ''}`}</td>
      <td class="hx__num">${l.r ? euros(liquido(l.r) * l.qtd) : '—'}</td></tr>`).join('')}</tbody></table></div>
    <div class="hx__acoes"><button type="button" class="btn btn--acao" data-sg-lote-carrinho${ok.length ? '' : ' disabled'}>${'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="btn__icone" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 6H6"/></svg>'}<span class="btn__rotulo">Pôr ${ok.length} ${ok.length === 1 ? 'artigo' : 'artigos'} no carrinho</span></button>
      ${conf.length ? `<span class="hx__semdados">${conf.length} ${conf.length === 1 ? 'linha precisa' : 'linhas precisam'} de confirmação antes de entrar.</span>` : ''}</div>`;
}
function lerTexto(m: HTMLElement, texto: string): void {
  const ls = lerLote(texto);
  if (!ls.length) { aviso(m, 'A lista está vazia.'); $(m, '[data-sg-lote]')!.innerHTML = '<p class="dvn__erro">A lista está vazia: uma linha por artigo, com a referência e a quantidade.</p>'; return; }
  lotes.set(m, ls); desenharLote(m); aviso(m, `${ls.length} linhas lidas.`);
}

/* ---------- foto ---------- */
type TD = { detect(i: ImageBitmapSource): Promise<{ rawValue: string }[]> };
async function lerFoto(m: HTMLElement, f: File): Promise<void> {
  const img = $<HTMLImageElement>(m, '[data-sg-img]')!, cap = $(m, '[data-sg-leitura]')!;
  img.src = URL.createObjectURL(f); $(m, '[data-sg-previa]')!.hidden = false; $(m, '[data-sg-codigo-form]')!.hidden = false;
  const campo = $<HTMLInputElement>(m, '[data-sg-codigo]')!; campo.value = '';
  const Det = (window as unknown as { TextDetector?: new () => TD }).TextDetector;
  if (!Det) { cap.textContent = 'Este navegador não lê texto em fotografias: escreva o código que vê na etiqueta.'; campo.focus(); return; }
  cap.textContent = 'A ler a fotografia…';
  try {
    await img.decode(); const t = await new Det().detect(img);
    const linhas = t.map((x) => x.rawValue), cand = linhas.find((l) => REFERENCIAS.some((r) => norm(l).includes(norm(r[2])))) ?? linhas[0] ?? '';
    campo.value = cand; cap.textContent = cand ? `Lido na fotografia: «${cand}». Confirme ou corrija antes de procurar.` : 'Não se leu texto na fotografia: escreva o código.';
  } catch { cap.textContent = 'Não foi possível ler a fotografia: escreva o código.'; }
  campo.focus();
}
function procurarCodigo(m: HTMLElement): void {
  const n = norm($<HTMLInputElement>(m, '[data-sg-codigo]')!.value), sitio = $(m, '[data-sg-foto-res]')!;
  if (n.length < 3) { sitio.innerHTML = '<p class="dvn__erro">Escreva pelo menos 3 letras ou algarismos do código.</p>'; return; }
  const rs = REFERENCIAS.filter((r) => norm(r[2]).includes(n) || n.includes(norm(r[2])));
  sitio.innerHTML = rs.length ? `<p class="hx__conta">Confirme a peça certa (${rs.length} ${rs.length === 1 ? 'resultado' : 'resultados'} para «${esc(n)}»):</p><div class="hx__docs">${rs.map((r) => `<button type="button" class="hx__doc" data-sg-ficha="${esc(r[2])}" data-sg-fab="${esc(r[1])}"><span>✓</span><span><b>${esc(r[1])} ${esc(r[2])}</b><small>${esc(r[3])} · ${euros(liquido(r))} · ${saida(r[6], r[7])}</small></span><span>›</span></button>`).join('')}</div>`
    : `<div class="hx__vazio"><div><b>Nenhuma referência do catálogo tem «${esc(n)}».</b><p>Confira o código na peça (O e 0, I e 1 confundem-se) ou procure pela matrícula na Pesquisar peças.</p></div></div>`;
}

/* ---------- alertas ---------- */
type Alerta = { ref: string; carro: string; criado: string };
const lerAlertas = (): Alerta[] => { try { return JSON.parse(localStorage.getItem(CHAVE_ALERTAS) || '[]'); } catch { return []; } };
const gravarAlertas = (a: Alerta[]) => { try { localStorage.setItem(CHAVE_ALERTAS, JSON.stringify(a)); } catch { /* sem armazenamento */ } };
function desenharAlertas(m: HTMLElement): void {
  const as = lerAlertas();
  $(m, '[data-sg-alertas]')!.innerHTML = !as.length ? '<div class="hx__vazio"><div><b>Ainda não tem alertas.</b><p>Escolha uma peça (de preferência uma sem stock) e «Avisar-me».</p></div></div>'
    : `<div class="hx__tabela-caixa"><table class="hx__tabela"><thead><tr><th scope="col">Peça</th><th scope="col">Veículo</th><th scope="col">Estado</th><th scope="col">Criado</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead><tbody>${as.map((a, i) => {
      const r = REFERENCIAS.find((x) => x[2] === a.ref)!, c = GARAGEM.find((g) => g.matricula === a.carro), ha = r[6] + r[7] > 0;
      return `<tr><td><b class="sg__fab">${esc(r[1])}</b> <span class="hx__ref sg__ref">${esc(r[2])}</span><small>${esc(r[3])}</small></td><td>${c ? `${esc(nomeCarro(c))}<small>${c.matricula}</small>` : '<small>—</small>'}</td>
        <td>${ha ? `<span class="hx__estado hx__estado--ok"><span>Já há stock · ${saida(r[6], r[7])}</span></span>` : '<span class="hx__estado hx__estado--atencao"><span>À espera de stock</span></span><small>Prazo atual: por encomenda, 3 a 5 dias</small>'}</td>
        <td>${esc(a.criado)}</td><td class="hx__num"><div class="hx__acoes sg__alerta-acoes">${ha ? `<button type="button" class="btn btn--acao" data-sg-pedir="${esc(r[2])}"><span class="btn__rotulo">Adicionar ao carrinho</span></button>` : `<button type="button" class="btn hx__btn" data-sg-ficha="${esc(r[2])}" data-sg-fab="${esc(r[1])}"><span class="btn__rotulo">Ver alternativas</span></button>`}<button type="button" class="btn hx__btn" data-sg-alerta-tirar="${i}" aria-label="Apagar o alerta de ${esc(r[2])}"><span class="btn__rotulo">Apagar</span></button></div></td></tr>`;
    }).join('')}</tbody></table></div>`;
}

/* ---------- «Tenho interesse»: o alerta nasce onde a peça está sem stock (portal/interesse.ts) ---------- */
function veiculoDoContexto(): string {
  /* o veículo em uso na garagem, se a pessoa veio de lá; senão, nenhum */
  try { return localStorage.getItem('goparts:garagem-em-uso:v1') || ''; } catch { return ''; }
}
function marcarInteresse(): void {
  const refs = new Set(lerAlertas().map((a) => a.ref));
  document.querySelectorAll<HTMLButtonElement>('[data-sg-interesse]').forEach((b) => {
    const tem = refs.has(b.dataset.sgInteresse!); b.classList.toggle('is-registado', tem); b.setAttribute('aria-pressed', String(tem));
    const r = b.querySelector('.btn__rotulo'); if (r) r.textContent = tem ? 'Interesse registado' : 'Tenho interesse';
  });
}
function interesse(b: HTMLElement): void {
  const ref = b.dataset.sgInteresse!, as = lerAlertas();
  if (!as.some((a) => a.ref === ref)) { as.unshift({ ref, carro: veiculoDoContexto(), criado: new Date().toLocaleDateString('pt-PT') }); gravarAlertas(as); }
  marcarInteresse();
  const r = REFERENCIAS.find((x) => x[2] === ref);
  document.querySelector('.sg__brinde')?.remove();
  const t = document.createElement('div'); t.className = 'sg__brinde'; t.setAttribute('role', 'status'); t.dataset.porCima = '';
  t.innerHTML = `<span><b>${esc(r ? `${r[1]} ${r[2]}` : ref)}</b> ficou nos alertas: avisamos quando houver stock ou o prazo mudar.</span><button type="button" data-sg-brinde-alertas>Ver alertas</button>`;
  document.body.append(t); window.setTimeout(() => t.remove(), 6000);
  const a = vivo('alertas'); if (a) desenharAlertas(a);
}

/* ---------- o assistente ---------- */
const CHAVE_BOT = 'goparts:assistente:desligado';
/* (26 nov.) ela: «no bot não quero o botão de desligar» e «ativa-o novamente»: está sempre ligado (a escolha antiga apaga-se) */
const botDesligado = () => { try { localStorage.removeItem(CHAVE_BOT); } catch { /* nada */ } return false; };
const ir = (ecra: string, txt: string, chave?: string, valor?: string) => `<button type="button" class="bot__ir" data-bot-ir="${ecra}"${chave ? ` data-bot-chave="${chave}" data-bot-valor="${esc(valor!)}"` : ''}>${txt} ›</button>`;
function responder(p: string): string {
  const q = p.toLowerCase(), n = norm(p);
  const ped = PEDIDOS.find((x) => n.includes(norm(x.num)) || (n.length >= 4 && norm(x.num).endsWith(n.replace(/\D/g, '')) && n.replace(/\D/g, '').length >= 4));
  if (ped) { const e = estadoEncomenda(ped); return `O pedido <b>${ped.num}</b> está <b>${e.nome.toLowerCase()}</b>.${ped.guia ? ` Saiu na guia ${ped.guia}.` : ''} ${ir('pedidos', 'Abrir o pedido', 'goparts:abrir-pedido', ped.num)}`; }
  const ref = REFERENCIAS.find((r) => n.includes(norm(r[2])));
  if (ref && /equival|alternativ|mais barat|outra marca/.test(q)) { const eq = equivalentes(ref); return eq.length ? `Equivalentes de ${ref[1]} ${ref[2]}: ${eq.map((e) => `<b>${e[1]} ${e[2]}</b> (${euros(liquido(e))}, ${saida(e[6], e[7]).toLowerCase()})`).join('; ')}. ${ir('comparador', 'Comparar')}` : `O catálogo não tem equivalentes de ${ref[1]} ${ref[2]}.`; }
  if (ref) return `<b>${ref[1]} ${ref[2]}</b> — ${ref[3]}: ${euros(liquido(ref))} para a sua conta; ${ref[6] + ref[7] ? `${ref[6]} no Porto e ${ref[7]} em Sacavém (${saida(ref[6], ref[7]).toLowerCase()})` : 'sem stock (por encomenda, 3 a 5 dias)'}. ${ref[6] + ref[7] ? '' : ir('alertas', 'Criar um alerta')}`;
  if (/fatura|pagar|vencid|dívida|divida|em aberto/.test(q)) { const ab = FATURAS.filter((f) => f.pagamento === 'aberto' || f.pagamento === 'vencida'), v = ab.filter((f) => f.pagamento === 'vencida'); return `Tem <b>${ab.length}</b> ${ab.length === 1 ? 'fatura' : 'faturas'} por pagar (${euros(ab.reduce((s, f) => s + total(f.guia), 0))}), ${v.length ? `das quais ${v.map((f) => `<b>${f.num}</b>`).join(', ')} vencida${v.length > 1 ? 's' : ''}` : 'nenhuma vencida'}. ${ir('faturas', 'Ver as faturas')}`; }
  if (/pedido|encomenda|entrega|onde est/.test(q)) { const c = PEDIDOS.filter((x) => estadoEncomenda(x).k !== 'concluido'); return `Tem <b>${c.length}</b> pedidos em curso: ${c.map((x) => `${x.num} (${estadoEncomenda(x).nome.toLowerCase()})`).join(', ')}. ${ir('pedidos', 'Ver os pedidos')}`; }
  if (/devolu/.test(q)) return `Devoluções: ${DEVOLUCOES.map((d) => `${d.num} — ${NOME_ESTADO[estadoDev(d)].toLowerCase()}`).join('; ')}. ${ir('devolucoes', 'Ver as devoluções')}`;
  if (/garagem|carro|veícul|veicul|matr/.test(q)) return `Na garagem: ${GARAGEM.map((c) => `${nomeCarro(c)} (${c.matricula})`).join(', ')}. ${ir('garagem', 'Abrir a garagem')}`;
  return 'Ainda não sei responder a isso. Pergunte-me por um <b>pedido</b> (ex.: «P2024/001233»), o <b>stock</b> ou os <b>equivalentes</b> de uma referência (ex.: «equivalentes VKBA 6556»), as <b>faturas</b> por pagar, as <b>devoluções</b> ou a <b>garagem</b>.';
}
function montarBot(): void {
  const portal = document.querySelector('.ecra:not([hidden]) > .versao:not([hidden]) .portal--lateral');
  let bot = document.querySelector<HTMLElement>('.bot');
  if (!portal || botDesligado()) { bot?.remove(); return; }
  if (bot) return;
  bot = document.createElement('div'); bot.className = 'bot'; bot.dataset.porCima = '';
  bot.innerHTML = `<button type="button" class="bot__abrir" data-bot-abrir aria-expanded="false" aria-controls="bot-painel" title="Assistente">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg><span class="sr-only">Assistente</span></button>
    <section class="bot__painel" id="bot-painel" role="dialog" aria-labelledby="bot-t" hidden>
      <header class="bot__topo"><h2 id="bot-t">Assistente <small>sugestão</small></h2><button type="button" class="bot__acao" data-bot-fechar aria-label="Fechar">×</button></header>
      <ol class="bot__conversa" data-bot-conversa aria-live="polite"><li class="bot__msg">Olá! Respondo com os dados da sua conta: pedidos, faturas, stock, equivalentes, devoluções e garagem. Não invento — o que não sei, digo.</li></ol>
      <div class="bot__sugestoes">${['Onde está o P2024/001233?', 'Faturas por pagar', 'Equivalentes VKBA 6556', 'Stock 538 0001 10'].map((s) => `<button type="button" data-bot-perg="${s}">${s}</button>`).join('')}</div>
      <form class="bot__form" data-bot-form><label class="sr-only" for="bot-q">Pergunta</label><input id="bot-q" autocomplete="off" placeholder="Escreva a sua pergunta"><button type="submit" class="btn btn--acao">Enviar</button></form>
    </section>`;
  document.body.append(bot);
}
function perguntar(t: string): void {
  const c = document.querySelector('[data-bot-conversa]')!; if (!t.trim()) return;
  c.insertAdjacentHTML('beforeend', `<li class="bot__msg bot__msg--eu">${esc(t)}</li><li class="bot__msg">${responder(t)}</li>`);
  c.scrollTop = c.scrollHeight;
}

export function iniciar(): void {
  const armar = () => {
    const c = vivo('comparador'); if (c && !c.dataset.sgPronto) { c.dataset.sgPronto = '1'; comparar(c); }
    const a = vivo('alertas'); if (a && !a.dataset.sgPronto) { a.dataset.sgPronto = '1'; desenharAlertas(a); }
    if (a) { let r: string | null = null; try { r = sessionStorage.getItem('goparts:alerta-ref'); sessionStorage.removeItem('goparts:alerta-ref'); } catch { /* nada */ } if (r) { $<HTMLSelectElement>(a, '[data-sg-alerta-ref]')!.value = r; $<HTMLElement>(a, '[data-sg-alerta-criar]')!.focus(); } }
    montarBot(); marcarInteresse();
  };
  let pedido = 0; new MutationObserver(() => { if (!pedido) pedido = requestAnimationFrame(() => { pedido = 0; armar(); }); }).observe(document.body, { childList: true, subtree: true });
  requestAnimationFrame(armar);

  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, m = t.closest<HTMLElement>('main[data-sg]');
    if (m?.dataset.sg === 'comparador' && t.matches('select')) { comparar(m); return; }
    if (t.matches('[data-sg-ficheiro]')) { const f = (t as HTMLInputElement).files?.[0]; if (f && m) void f.text().then((x) => { $<HTMLTextAreaElement>(m, '[data-sg-colar]')!.value = x; lerTexto(m, x); }); return; }
    if (t.matches('[data-sg-imagem]')) { const f = (t as HTMLInputElement).files?.[0]; if (f && m) void lerFoto(m, f); return; }
    if (m && t.matches('[data-sg-lote-escolha]')) { const ls = lotes.get(m)!, l = ls[Number((t as HTMLSelectElement).dataset.sgLoteEscolha)], r = REFERENCIAS.find((x) => x[2] === (t as HTMLSelectElement).value); if (r) { l.r = r; l.candidatas = [r]; l.estado = r[6] + r[7] >= l.qtd ? 'ok' : 'confirmar'; l.motivo = l.estado === 'ok' ? `Escolhida: ${saida(r[6], r[7])}` : `Só há ${r[6] + r[7]} em stock.`; desenharLote(m); } return; }
    if (m && t.matches('[data-sg-lote-conf]')) { const l = lotes.get(m)![Number((t as HTMLInputElement).dataset.sgLoteConf)]; if ((t as HTMLInputElement).checked && l.r) { l.estado = 'ok'; l.motivo = 'Confirmado por si.'; desenharLote(m); } return; }
    if (m && t.matches('[data-sg-lote-qtd]')) { const l = lotes.get(m)![Number((t as HTMLInputElement).dataset.sgLoteQtd)], q = Number((t as HTMLInputElement).value); if (Number.isInteger(q) && q > 0) { l.qtd = q; const r = l.r; if (r) { l.estado = r[6] + r[7] >= q ? 'ok' : 'confirmar'; l.motivo = l.estado === 'ok' ? saida(r[6], r[7]) : `Só há ${r[6] + r[7]} em stock para ${q} pedidas.`; } desenharLote(m); } return; }
  });
  document.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement, m = t.closest<HTMLElement>('main[data-sg]');
    let b: HTMLElement | null;
    if ((b = t.closest('[data-sg-ficha]'))) { abrirFicha(b.dataset.sgFab!, b.dataset.sgFicha!); return; }
    if ((b = t.closest('[data-sg-pedir]'))) { void carrinho.adicionar(b.dataset.sgPedir!, 1); return; }
    if ((b = t.closest('[data-sg-interesse]'))) { interesse(b); return; }
    if (t.closest('[data-sg-brinde-alertas]')) { document.querySelector('.sg__brinde')?.remove(); mostrar('alertas'); return; }
    if ((b = t.closest('[data-sg-ir-alertas]'))) { try { sessionStorage.setItem('goparts:alerta-ref', b.dataset.sgRefAlerta!); } catch { /* nada */ } mostrar('alertas'); return; }
    if (m && t.closest('[data-sg-ler]')) { lerTexto(m, $<HTMLTextAreaElement>(m, '[data-sg-colar]')!.value); return; }
    if (m && t.closest('[data-sg-exemplo]')) { const u = URL.createObjectURL(new Blob(['referencia;quantidade\nVKBA 6556;2\nVKMV 6PK1873;1\n6PK1873;2\n538 0001 10;1\nVKBA;1\nGDB1550;4\n'], { type: 'text/csv' })); const a = document.createElement('a'); a.href = u; a.download = 'encomenda-exemplo.csv'; a.click(); URL.revokeObjectURL(u); return; }
    if (m && t.closest('[data-sg-lote-carrinho]')) { const ok = lotes.get(m)!.filter((l) => l.estado === 'ok' && l.r); void Promise.all(ok.map((l) => carrinho.adicionar(l.r![2], l.qtd))).then(() => aviso(m, `${ok.length} artigos no carrinho.`)); return; }
    if (m && t.closest('[data-sg-procurar]')) { procurarCodigo(m); return; }
    if (m && t.closest('[data-sg-alerta-criar]')) { const as = lerAlertas(), ref = $<HTMLSelectElement>(m, '[data-sg-alerta-ref]')!.value, carro = $<HTMLSelectElement>(m, '[data-sg-alerta-carro]')!.value; if (as.some((a) => a.ref === ref && a.carro === carro)) { aviso(m, 'Esse alerta já existe.'); return; } as.unshift({ ref, carro, criado: new Date().toLocaleDateString('pt-PT') }); gravarAlertas(as); desenharAlertas(m); aviso(m, `Alerta criado para ${ref}.`); return; }
    if (m && (b = t.closest('[data-sg-alerta-tirar]'))) { const i = Number(b.dataset.sgAlertaTirar); void import('./confirmar').then(({ confirmar }) => confirmar({ titulo: 'Apagar este alerta?', texto: 'Deixa de ser avisado quando esta peça voltar a ter stock.', sim: 'Apagar o alerta' })).then((sim) => { if (!sim) return; const as = lerAlertas(); as.splice(i, 1); gravarAlertas(as); desenharAlertas(m); marcarInteresse(); }); return; }
    /* o assistente */
    const bot = t.closest('.bot');
    if (!bot) return;
    const painel = bot.querySelector<HTMLElement>('.bot__painel')!, abrir = bot.querySelector<HTMLElement>('[data-bot-abrir]')!;
    if (t.closest('[data-bot-abrir]')) { painel.hidden = !painel.hidden; abrir.setAttribute('aria-expanded', String(!painel.hidden)); if (!painel.hidden) bot.querySelector<HTMLInputElement>('#bot-q')!.focus(); return; }
    if (t.closest('[data-bot-fechar]')) { painel.hidden = true; abrir.setAttribute('aria-expanded', 'false'); abrir.focus(); return; }
    if ((b = t.closest('[data-bot-perg]'))) { perguntar(b.dataset.botPerg!); return; }
    if ((b = t.closest('[data-bot-ir]'))) { if (b.dataset.botChave) try { sessionStorage.setItem(b.dataset.botChave, b.dataset.botValor!); } catch { /* nada */ } painel.hidden = true; mostrar(b.dataset.botIr!); }
  });
  document.addEventListener('submit', (ev) => { const f = (ev.target as HTMLElement).closest('[data-bot-form]'); if (!f) return; ev.preventDefault(); const i = f.querySelector<HTMLInputElement>('input')!; perguntar(i.value); i.value = ''; });
  document.addEventListener('keydown', (ev) => { if (ev.key !== 'Escape') return; const p = document.querySelector<HTMLElement>('.bot__painel:not([hidden])'); if (p) { p.hidden = true; document.querySelector<HTMLElement>('[data-bot-abrir]')?.focus(); } });
  /* arrastar um CSV para a zona do lote */
  document.addEventListener('dragover', (ev) => { if ((ev.target as HTMLElement).closest?.('[data-sg-soltar]')) ev.preventDefault(); });
  document.addEventListener('drop', (ev) => { const z = (ev.target as HTMLElement).closest?.('[data-sg-soltar]'); if (!z) return; ev.preventDefault(); const f = ev.dataTransfer?.files[0], m = z.closest<HTMLElement>('main[data-sg]')!; if (!f) return; if (m.dataset.sg === 'foto') void lerFoto(m, f); else void f.text().then((x) => { $<HTMLTextAreaElement>(m, '[data-sg-colar]')!.value = x; lerTexto(m, x); }); });
}
