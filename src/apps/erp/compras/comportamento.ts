/* =========================================================
   ERP · Compras — o comportamento das páginas da fase 1 (19 out. 2026)
   Usa a casca do Início (comportamento/inicio.ts: avisos, camadas, navegação, perfil) e as regras de
   dominio.ts. Cada ação que no produto é um pedido ao servidor espera um pouco (ws.espera) e só depois
   muda o ecrã: o estado nunca se mostra mudado antes da resposta.
   - Lista: filtros, procura, fornecedor, ordenar por coluna, exportar CSV, nova encomenda.
   - Editor: o rascunho edita-se numa cópia (Edicao); os totais refazem-se a cada tecla; «Guardar rascunho»
     manda a versão que se abriu (outra janela que tenha guardado entretanto dá o aviso de conflito);
     sair com alterações por guardar pergunta; as ações seguem acoesDe(); rejeitar, cancelar e fechar com
     pendentes pedem o motivo. Alt+A junta artigo.
   - Receção: cada formulário tem uma chave; o botão desliga-se durante o pedido e, mesmo que o pedido se
     repita, a mesma chave dá a mesma receção. O leitor de códigos é um teclado: EAN ou referência e Enter.
   - Outra janela muda os dados (evento storage): a página relê; se havia alterações por guardar, avisa.
   ========================================================= */
import { ws, registarPaginas, travarSaida } from '../comportamento/inicio';
import {
  paginaCompras, edicaoDe, cenario, vistaPadrao, filtrar, tabelaEncomendas, linhasEnc, resumoEnc, gavetaArtigos, dialogoMotivo, dialogoSair, dialogoNova,
  linhasRececao, tabelaFornecedores, type Contexto, type Edicao, type FormRec, type VistaLista,
} from './ecras';
import {
  encomenda, artigo, fornecedor, totais, linhaLiquida, euros, pendente, lerEuros, lerPercentagem, problemas, criar, guardar, transitar, duplicar, receber,
  recarregar, csv, Recusa, NOME_ACAO, type Acao, type Encomenda,
} from './dominio';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pag = () => ws.raiz()?.dataset.wsPagina ?? '';
const ehCompras = () => pag().startsWith('compras');
const lerSessao = (k: string) => { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const gravarSessao = (k: string, v: unknown) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };

/* ---------- o contexto de cada página ---------- */
let vista: VistaLista = lerSessao('erp:cp:vista') ?? vistaPadrao();
let edicao: Edicao | null = null;
let rec: (FormRec & { ref: string }) | null = null;
let qForn = '';
let feita: string | undefined;

function refDe(id: string): string {
  const r = ws.raiz();
  return r?.dataset.wsRef || lerSessao(`erp:ref:${id}`) || (id === 'compras-encomenda' ? 'EF 2026/0413' : id === 'compras-rececao' ? 'EF 2026/0408' : id === 'compras-fornecedor' ? 'skf' : '');
}
function contexto(id: string): Contexto {
  const ref = refDe(id), c: Contexto = { ref };
  if (id === 'compras') { const vc = ws.raiz()?.dataset.cpCenario; c.vista = vc === 'atrasadas' ? { ...vistaPadrao(), filtro: 'atrasadas' } : vista; }
  if (id === 'compras-encomenda') {
    if (!edicao || edicao.enc.ref !== ref || (!edicao.sujo && encomenda(ref)?.versao !== edicao.versao)) edicao = cenario(edicaoDe(ref), ws.raiz()?.dataset.cpCenario);
    c.edicao = edicao;
  }
  if (id === 'compras-rececao') {
    if (!rec || rec.ref !== ref) rec = { ref, chave: crypto.randomUUID?.() ?? String(Date.now() + Math.random()), guia: '', notas: '', linhas: {}, erros: [], feita };
    feita = undefined;
    c.rec = rec;
  }
  if (id === 'compras-fornecedores') c.q = ws.raiz()?.querySelector<HTMLInputElement>('[data-cp-forn-q]')?.value ?? (ws.raiz()?.dataset.wsRef ? '' : qForn) ?? '';
  return c;
}
registarPaginas((id, e) => paginaCompras(id, e, contexto(id)));

/* ---------- ajudas ---------- */
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => ws.raiz()?.querySelector<T>(sel) ?? null;
function trocar(sel: string, html: string): HTMLElement | null {
  const v = $(sel); if (!v) return null;
  const t = document.createElement('div'); t.innerHTML = html; const n = t.firstElementChild as HTMLElement; v.replaceWith(n); return n;
}
const semRede = () => !navigator.onLine;
async function pedido<T>(b: HTMLButtonElement | null, texto: string, f: () => T): Promise<T | null> {
  if (b?.getAttribute('aria-busy') === 'true') return null;
  if (b) ws.ocupar(b, texto);
  await ws.espera();
  if (b?.isConnected) ws.ocupar(b, null);
  if (semRede()) { ws.aviso('Sem ligação ao servidor: nada foi guardado. Tenta outra vez quando a ligação voltar.'); return null; }
  try { return f(); } catch (err) {
    if (err instanceof Recusa) { if (err.tipo === 'conflito' && edicao) { edicao.conflito = true; ws.redesenhar(); } else ws.aviso(err.message); return null; }
    ws.aviso('Não foi possível guardar. Tenta outra vez.'); console.error(err); return null;
  }
}
/** Os números do resumo mudam com um pequeno rolar, só quando mudam. */
function pintarTotais(x: Encomenda): void {
  const t = totais(x);
  const foco = document.activeElement?.closest?.('[data-cp-resumo]');
  if (!foco) { trocar('[data-cp-resumo]', resumoEnc(x, ws.estado().perfil, t)); return; }
  const val: Record<string, number> = { bruto: t.bruto, descontos: t.descontos, base: t.base, total: t.total };
  t.iva.forEach((v) => { val['iva-' + v.taxa] = v.valor; });
  ws.raiz()!.querySelectorAll<HTMLElement>('[data-cp-total]').forEach((d) => {
    const k = d.dataset.cpTotal!, novo = (k === 'descontos' && val[k] ? '−' : '') + euros(val[k] ?? 0);
    if (d.textContent !== novo) { d.textContent = novo; animarNumero(d); }
  });
}
function animarNumero(d: HTMLElement): void { if (quieto()) return; d.classList.remove('is-muda'); void d.offsetWidth; d.classList.add('is-muda'); }
function marcarSujo(): void {
  if (!edicao) return;
  edicao.sujo = true;
  const g = $<HTMLButtonElement>('[data-cp-guardar]'); if (g) g.disabled = false;
  if (!$('[data-cp-sujo]')) $('.cp-doc__linha')?.insertAdjacentHTML('beforeend', '<span class="cp-sujo" data-cp-sujo>Alterações por guardar</span>');
}
function baixar(nome: string, texto: string): void {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' })); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- a lista ---------- */
function redesenharTabela(): void { gravarSessao('erp:cp:vista', vista); trocar('[data-cp-tabela]', tabelaEncomendas(ws.estado(), vista)); }

/* ---------- o editor ---------- */
async function guardarRascunho(b: HTMLButtonElement | null): Promise<boolean> {
  if (!edicao) return false;
  const x = edicao.enc;
  const ok = await pedido(b, 'A guardar…', () => guardar(ws.estado().perfil, x, edicao!.versao));
  if (!ok) return false;
  edicao = edicaoDe(x.ref); ws.redesenhar();
  ws.aviso(`${x.ref} guardada (versão ${ok.versao}).`);
  return true;
}
async function fazer(acao: Acao, b: HTMLButtonElement | null, motivo = ''): Promise<void> {
  if (!edicao) return;
  const ref = edicao.enc.ref, p = ws.estado().perfil;
  if (acao === 'receber') { ws.irPara('compras-rececao', ref); return; }
  if (acao === 'submeter') {
    const pr = problemas(edicao.enc);
    if (pr.length) { edicao.erros = pr; ws.redesenhar(); $('[data-cp-erros]')?.focus(); return; }
    edicao.erros = [];
    if (edicao.sujo && !(await guardarRascunho(b))) return;
  }
  if (acao === 'duplicar') {
    const n = await pedido(b, 'A duplicar…', () => duplicar(p, ref)); if (!n) return;
    edicao = null; ws.irPara('compras-encomenda', n.ref); ws.aviso(`Criada a ${n.ref}, cópia da ${ref} com os preços de hoje.`); return;
  }
  if ((acao === 'rejeitar' || acao === 'cancelar' || (acao === 'fechar' && edicao.enc.estado === 'Parcialmente recebida')) && !motivo) {
    ws.abrir('personalizar', dialogoMotivo(acao, ref), b); return;
  }
  const antes = encomenda(ref)!.estado;
  const n = await pedido(b, `${NOME_ACAO[acao]}…`, () => transitar(p, ref, acao, motivo)); if (!n) return;
  if (ws.camada()) ws.fechar(false);
  edicao = edicaoDe(ref); ws.redesenhar();
  /* o percurso avança: só depois da resposta, e só até ao passo que aconteceu */
  if (antes !== n.estado) $('.cp-percurso')?.classList.add('is-avanca');
  ws.aviso(acao === 'lembrar' ? `Lembrete registado no histórico da ${ref}. O envio por correio ainda não existe: liga ou escreve ao fornecedor.` : `${ref}: ${antes} → ${n.estado}.`);
}
function juntarArtigo(refArt: string): void {
  if (!edicao) return;
  const x = edicao.enc, a = artigo(refArt); if (!a) return;
  const ja = x.linhas.find((l) => l.ref === refArt);
  let id: string;
  if (ja) { ja.qtd += 1; id = ja.id; }
  else {
    id = 'n' + Date.now().toString(36);
    x.linhas.push({ id, ref: a.ref, qtd: 1, preco: a.preco, desc: 0, iva: a.iva, entrega: x.entrega, recebida: 0, rejeitada: 0 });
  }
  marcarSujo();
  const temCampos = !!$('[data-cp-linhas] table');
  if (temCampos) { trocar('[data-cp-linhas]', linhasEnc(edicao, ws.estado().perfil)); pintarTotais(x); const n = $('[data-cp-n-linhas]'); if (n) n.textContent = String(x.linhas.length); }
  else { const g = ws.camada(); ws.redesenhar(); if (g) ws.abrir('painel', gavetaArtigos(x, ''), null); }
  const tr = $(`[data-cp-l="${id}"]`); tr?.classList.add(ja ? 'is-soma' : 'is-nova');
  /* a gaveta fica aberta para juntar mais; diz o que entrou */
  const item = ws.raiz()?.querySelector<HTMLElement>(`[data-cp-art="${CSS.escape(refArt)}"]`);
  if (item && !item.querySelector('.cp-art__ja')) { item.querySelector('.cp-art__mais')?.remove(); item.insertAdjacentHTML('beforeend', '<span class="cp-art__ja">já na encomenda</span>'); }
  ws.aviso(ja ? `${refArt}: quantidade ${ja.qtd}.` : `${refArt} junto à encomenda.`);
}
function campoEditor(inp: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void {
  if (!edicao) return;
  const x = edicao.enc, k = inp.dataset.cpCampo!, id = inp.dataset.cpLinha;
  const v = inp.value;
  let ok = true;
  if (id) {
    const l = x.linhas.find((y) => y.id === id)!;
    if (k === 'qtd') { const n = /^\d+$/.test(v.trim()) ? Number(v.trim()) : NaN; ok = Number.isInteger(n) && n > 0; if (ok) l.qtd = n; }
    if (k === 'preco') { if (!v.trim()) { l.preco = null; } else { const c = lerEuros(v); ok = c !== null; if (ok) l.preco = c; } }
    if (k === 'desc') { const c = v.trim() ? lerPercentagem(v) : 0; ok = c !== null; if (ok) l.desc = c!; }
    if (k === 'entrega') l.entrega = v;
    const liq = linhaLiquida(l), cel = $(`[data-cp-liq="${id}"]`);
    if (cel) { const t = liq === null ? '—' : euros(liq); if (cel.textContent !== t) { cel.textContent = t; animarNumero(cel); } }
  } else {
    if (k === 'portes') { const c = v.trim() ? lerEuros(v) : 0; ok = c !== null; if (ok) x.portes = c!; }
    if (k === 'refForn') x.refForn = v;
    if (k === 'entrega') x.entrega = v;
    if (k === 'notas') x.notas = v;
    if (k === 'forn') { x.forn = v; x.pagamento = fornecedor(v)?.pagamento ?? x.pagamento; }
  }
  inp.classList.toggle('is-erro', !ok);
  inp.setAttribute('aria-invalid', String(!ok));
  marcarSujo();
  pintarTotais(x);
}

/* ---------- a receção ---------- */
function atualizarLinhaRec(id: string): void {
  if (!rec) return;
  const x = encomenda(rec.ref); if (!x) return;
  const l = x.linhas.find((y) => y.id === id)!, v = rec.linhas[id] ?? { aceite: 0, rejeitada: 0, motivo: '' };
  const t = document.createElement('div'); t.innerHTML = linhasRececao(x, rec);
  const novo = t.querySelector(`[data-cp-dif="${id}"]`), velho = $(`[data-cp-dif="${id}"]`);
  if (novo && velho) velho.innerHTML = novo.innerHTML;
  const sel = $<HTMLSelectElement>(`[data-cp-rec="motivo"][data-cp-linha="${id}"]`); if (sel) sel.disabled = !v.rejeitada;
  const mais = v.aceite + v.rejeitada > pendente(l);
  ws.raiz()!.querySelectorAll<HTMLInputElement>(`input[data-cp-rec][data-cp-linha="${id}"]`).forEach((i) => i.classList.toggle('is-erro', mais));
}
function ler(cod: string): void {
  if (!rec) return;
  const x = encomenda(rec.ref)!, c = cod.trim().toLowerCase().replace(/\s+/g, '');
  const l = x.linhas.find((y) => { const a = artigo(y.ref); return a && (a.ean === c || a.ref.toLowerCase().replace(/\s+/g, '') === c || a.refForn.toLowerCase() === c); });
  const diz = $('[data-cp-ler-diz]');
  if (!l) { if (diz) diz.textContent = `«${cod}» não está nesta encomenda.`; ws.aviso(`«${cod}» não está na ${x.ref}.`); return; }
  const v = rec.linhas[l.id] ?? (rec.linhas[l.id] = { aceite: 0, rejeitada: 0, motivo: '' });
  if (v.aceite + v.rejeitada >= pendente(l)) { if (diz) diz.textContent = `${l.ref}: já chegou tudo o que faltava (${pendente(l)}).`; ws.aviso(`${l.ref}: a mais — só faltavam ${pendente(l)}.`); return; }
  v.aceite++;
  const inp = $<HTMLInputElement>(`input[data-cp-rec="aceite"][data-cp-linha="${l.id}"]`); if (inp) inp.value = String(v.aceite);
  atualizarLinhaRec(l.id);
  if (diz) diz.textContent = `${l.ref}: ${v.aceite} de ${pendente(l)}`;
  const tr = $(`[data-cp-l="${l.id}"]`); if (tr && !quieto()) { tr.classList.remove('is-soma'); void tr.offsetWidth; tr.classList.add('is-soma'); }
}
async function registar(b: HTMLButtonElement): Promise<void> {
  if (!rec) return;
  const x = encomenda(rec.ref); if (!x) return;
  rec.guia = $<HTMLInputElement>('[data-cp-guia]')?.value ?? rec.guia;
  rec.notas = $<HTMLTextAreaElement>('[data-cp-rec-notas]')?.value ?? rec.notas;
  const o = { chave: rec.chave, enc: rec.ref, guia: rec.guia, notas: rec.notas, linhas: x.linhas.map((l) => ({ linha: l.id, ...(rec!.linhas[l.id] ?? { aceite: 0, rejeitada: 0, motivo: '' }) })) };
  if (b.getAttribute('aria-busy') === 'true') return;
  ws.ocupar(b, 'A registar…');
  await ws.espera(700);
  if (b.isConnected) ws.ocupar(b, null);
  if (semRede()) { ws.aviso('Sem ligação: a receção não foi registada. O que escreveste fica aqui.'); return; }
  try {
    const r = receber(ws.estado().perfil, o);
    feita = r.rec.ref; rec = null;
    ws.irPara('compras-rececao', r.rec.ref);
    ws.aviso(r.repetida ? `Esta receção já estava registada: ${r.rec.ref}.` : `${r.rec.ref} registada.`);
    /* o aceite entra na coluna, a contar */
    if (!quieto()) ws.raiz()?.querySelectorAll<HTMLElement>('[data-cp-rola]').forEach((s) => { const fim = Number(s.textContent); const t0 = performance.now(); const passo = (t: number) => { const k = Math.min(1, (t - t0) / 420); s.textContent = String(Math.round(fim * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(passo); }; requestAnimationFrame(passo); });
  } catch (err) {
    if (rec) rec.erros = [err instanceof Recusa ? err.message : 'Não foi possível registar. Tenta outra vez.'];
    ws.redesenhar(); $('[data-cp-erros]')?.focus();
  }
}

/* ---------- os cliques e as teclas ---------- */
function aoClicar(ev: MouseEvent): void {
  if (!ehCompras() || document.body.classList.contains('editando')) return;
  const alvo = ev.target as Element, raiz = ws.raiz(); if (!raiz?.contains(alvo)) return;
  const q = <T extends HTMLElement = HTMLElement>(s: string) => alvo.closest?.<T>(s) ?? null;
  let b: HTMLElement | null;
  if ((b = q('[data-cp-filtro]'))) { vista = { ...vista, filtro: b.dataset.cpFiltro as VistaLista['filtro'] }; gravarSessao('erp:cp:vista', vista); ws.redesenhar(); $<HTMLElement>(`.cp-filtro[data-cp-filtro="${vista.filtro}"]`)?.focus(); return; }
  if ((b = q('[data-cp-ordem]'))) { const o = b.dataset.cpOrdem as VistaLista['ordem']; vista = { ...vista, ordem: o, desc: vista.ordem === o ? !vista.desc : o !== 'entrega' }; redesenharTabela(); $<HTMLElement>(`[data-cp-ordem="${o}"]`)?.focus(); return; }
  if (q('[data-cp-limpar]')) { vista = vistaPadrao(); gravarSessao('erp:cp:vista', vista); ws.redesenhar(); return; }
  if (q('[data-cp-exportar]')) { const l = filtrar(vista); baixar('encomendas-a-fornecedor.csv', csv(l)); ws.aviso(`Exportadas ${l.length} encomendas (CSV, separado por ponto e vírgula).`); return; }
  if (q('[data-cp-exportar-uma]') && edicao) { baixar(`${edicao.enc.ref.replace(/\W+/g, '-')}.csv`, csv([encomenda(edicao.enc.ref)!])); return; }
  if ((b = q('[data-cp-nova]'))) { ws.abrir('painel', dialogoNova(b.dataset.cpNova || ''), b); return; }
  if ((b = q('[data-cp-nova-ok]'))) {
    const f = $<HTMLFormElement>('[data-cp-nova-form]')!, forn = (f.elements.namedItem('forn') as HTMLSelectElement).value;
    const erro = f.querySelector<HTMLElement>('.ws-campo__erro')!;
    if (!forn) { erro.hidden = false; (f.elements.namedItem('forn') as HTMLSelectElement).focus(); return; }
    pedido(b as HTMLButtonElement, 'A criar…', () => criar(ws.estado().perfil, forn)).then((n) => {
      if (!n) return; ws.fechar(false); edicao = { ...edicaoDe(n.ref)!, nova: n.ref };
      ws.irPara('compras-encomenda', n.ref); ws.aviso(`Rascunho ${n.ref} criado. Junta os artigos.`);
    });
    return;
  }
  if ((b = q('tr[data-cp-abrir]')) && !q('button, a, input, select')) { ws.irPara('compras-encomenda', b.dataset.cpAbrir); return; }
  /* o editor */
  if ((b = q('[data-cp-mais]'))) { const m = b.nextElementSibling as HTMLElement; m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden)); if (!m.hidden) m.querySelector<HTMLElement>('button')?.focus(); return; }
  if (!q('.cp-mais')) raiz.querySelectorAll<HTMLElement>('.cp-mais__menu:not([hidden])').forEach((m) => { m.hidden = true; m.previousElementSibling?.setAttribute('aria-expanded', 'false'); });
  if ((b = q('[data-cp-acao]'))) { fazer(b.dataset.cpAcao as Acao, b as HTMLButtonElement); return; }
  if ((b = q('[data-cp-confirmar]'))) {
    const t = $<HTMLTextAreaElement>('[data-cp-motivo]')!; const e = t.closest('.ws-dialogo__corpo')!.querySelector<HTMLElement>('.cp-campo__erro')!;
    if (!t.value.trim()) { e.hidden = false; t.focus(); return; }
    fazer(b.dataset.cpConfirmar as Acao, b as HTMLButtonElement, t.value); return;
  }
  if (q('[data-cp-guardar]')) { guardarRascunho(q<HTMLButtonElement>('[data-cp-guardar]')); return; }
  if ((b = q('[data-cp-juntar]'))) { if (edicao) ws.abrir('painel', gavetaArtigos(edicao.enc), b); return; }
  if ((b = q('[data-cp-art]'))) { juntarArtigo(b.dataset.cpArt!); return; }
  if ((b = q('[data-cp-tirar]'))) {
    if (!edicao) return; const id = b.dataset.cpTirar!, l = edicao.enc.linhas.find((y) => y.id === id)!;
    const tr = b.closest('tr') as HTMLElement;
    const fim = () => { edicao!.enc.linhas = edicao!.enc.linhas.filter((y) => y.id !== id); marcarSujo(); ws.redesenhar(); ws.aviso(`${l.ref} tirado. Ainda não está guardado.`); };
    if (quieto() || !tr) fim(); else tr.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(16px)' }], { duration: 180, easing: 'ease-in' }).onfinish = fim;
    return;
  }
  if (q('[data-cp-recarregar]')) { recarregar(); edicao = edicaoDe(edicao!.enc.ref); ws.redesenhar(); ws.aviso('Recarregada: estás a ver a última versão.'); return; }
  if (q('[data-cp-sair-sem]')) { const s = seguirDepois; edicao = null; seguirDepois = null; ws.fechar(false); s?.(); return; }
  if ((b = q('[data-cp-sair-guardar]'))) { const s = seguirDepois; guardarRascunho(b as HTMLButtonElement).then((ok) => { if (ok) { seguirDepois = null; ws.fechar(false); s?.(); } }); return; }
  /* a receção */
  if (q('[data-cp-tudo]') && rec) {
    const x = encomenda(rec.ref)!; x.linhas.forEach((l) => { const v = rec!.linhas[l.id] ?? { aceite: 0, rejeitada: 0, motivo: '' }; rec!.linhas[l.id] = { ...v, aceite: Math.max(0, pendente(l) - v.rejeitada) }; });
    rec.guia = $<HTMLInputElement>('[data-cp-guia]')?.value ?? rec.guia;
    trocar('[data-cp-rec-linhas]', linhasRececao(x, rec)); ws.aviso('Tudo o que faltava, como chegado bom. Confere e muda o que vier diferente.'); return;
  }
  if ((b = q('[data-cp-registar]'))) { registar(b as HTMLButtonElement); return; }
}
let seguirDepois: (() => void) | null = null;
travarSaida((seguir) => {
  if (pag() !== 'compras-encomenda' || !edicao?.sujo) return true;
  seguirDepois = seguir;
  ws.abrir('personalizar', dialogoSair(edicao.enc.ref), document.activeElement as HTMLElement);
  return false;
});

function aoEscrever(ev: Event): void {
  if (!ehCompras()) return;
  const t = ev.target as HTMLInputElement;
  if (!ws.raiz()?.contains(t)) return;
  if (t.matches('[data-cp-q]')) { vista = { ...vista, q: t.value }; redesenharTabela(); return; }
  if (t.matches('[data-cp-forn-q]')) { qForn = t.value; trocar('[data-cp-forn-tabela]', `<div class="cp-tabela-rolo" data-cp-forn-tabela>${tabelaFornecedores(t.value)}</div>`); return; }
  if (t.matches('[data-cp-gaveta-q]') && edicao) { const t2 = document.createElement('div'); t2.innerHTML = gavetaArtigos(edicao.enc, t.value); $('[data-cp-gaveta-lista]')!.innerHTML = t2.querySelector('[data-cp-gaveta-lista]')!.innerHTML; return; }
  if (t.matches('[data-cp-campo]') && t.tagName !== 'SELECT' && t.type !== 'date') { campoEditor(t); return; }
  if (t.matches('input[data-cp-rec]') && rec) {
    const id = t.dataset.cpLinha!, k = t.dataset.cpRec as 'aceite' | 'rejeitada';
    const v = rec.linhas[id] ?? (rec.linhas[id] = { aceite: 0, rejeitada: 0, motivo: '' });
    const n = t.value.trim() === '' ? 0 : /^\d+$/.test(t.value.trim()) ? Number(t.value.trim()) : NaN;
    t.classList.toggle('is-erro', Number.isNaN(n)); if (!Number.isNaN(n)) v[k] = n;
    atualizarLinhaRec(id); return;
  }
  if (t.matches('[data-cp-guia]') && rec) { rec.guia = t.value; t.classList.remove('is-erro'); }
  if (t.matches('[data-cp-rec-notas]') && rec) rec.notas = t.value;
}
function aoMudar(ev: Event): void {
  if (!ehCompras()) return;
  const t = ev.target as HTMLSelectElement | HTMLInputElement;
  if (!ws.raiz()?.contains(t)) return;
  if (t.matches('[data-cp-forn]')) { vista = { ...vista, forn: t.value }; redesenharTabela(); return; }
  if (t.matches('[data-cp-campo]') && (t.tagName === 'SELECT' || (t as HTMLInputElement).type === 'date')) { campoEditor(t); if (t.dataset.cpCampo === 'forn') ws.redesenhar(); return; }
  if (t.matches('[data-cp-campo="preco"], [data-cp-campo="portes"]')) { const c = lerEuros(t.value); if (c !== null) t.value = (c / 100).toFixed(2).replace('.', ','); }
  if (t.matches('select[data-cp-rec="motivo"]') && rec) { const id = t.dataset.cpLinha!; (rec.linhas[id] ??= { aceite: 0, rejeitada: 0, motivo: '' }).motivo = t.value; t.classList.remove('is-erro'); }
  if (t.matches('[name="forn"]')) ws.raiz()?.querySelector<HTMLElement>('[data-cp-nova-form] .ws-campo__erro')?.setAttribute('hidden', '');
}
function aoTeclar(ev: KeyboardEvent): void {
  if (!ehCompras()) return;
  const t = ev.target as HTMLInputElement;
  if (ev.key === 'Enter' && t.matches?.('[data-cp-ler]')) { ev.preventDefault(); if (t.value.trim()) ler(t.value); t.value = ''; return; }
  if (ev.altKey && ev.key.toLowerCase() === 'a' && pag() === 'compras-encomenda' && $('[data-cp-juntar]')) { ev.preventDefault(); $<HTMLElement>('[data-cp-juntar]')!.click(); return; }
  /* Enter numa célula passa à de baixo, como numa folha de cálculo */
  if (ev.key === 'Enter' && t.matches?.('.cp-celula')) {
    ev.preventDefault();
    const col = t.dataset.cpCampo ?? t.dataset.cpRec, cel = [...ws.raiz()!.querySelectorAll<HTMLInputElement>(`.cp-celula[data-cp-${t.dataset.cpCampo ? 'campo' : 'rec'}="${col}"]`)];
    cel[cel.indexOf(t) + (ev.shiftKey ? -1 : 1)]?.focus();
  }
}

export function iniciar(): void {
  document.addEventListener('click', aoClicar);
  document.addEventListener('input', aoEscrever);
  document.addEventListener('change', aoMudar);
  document.addEventListener('keydown', aoTeclar);
  /* outra janela mudou os dados */
  window.addEventListener('storage', (ev) => {
    if (ev.key !== 'erp:compras:v1' || !ehCompras()) return;
    recarregar();
    if (pag() === 'compras-encomenda' && edicao) {
      const x = encomenda(edicao.enc.ref);
      if (x && x.versao !== edicao.versao) { if (edicao.sujo) edicao.conflito = true; else edicao = edicaoDe(x.ref); ws.redesenhar(); ws.aviso(edicao?.conflito ? `A ${x.ref} foi guardada noutra janela.` : `A ${x.ref} foi atualizada noutra janela.`); }
      return;
    }
    if (!document.activeElement?.matches?.('input, select, textarea')) ws.redesenhar();
  });
  window.addEventListener('beforeunload', (ev) => { if (pag() === 'compras-encomenda' && edicao?.sujo) { ev.preventDefault(); ev.returnValue = ''; } });
  /* ao chegar a uma página: a lista ou a receção começam do zero; o foco vai para o sítio certo */
  document.addEventListener('erp:desenhou', (ev) => {
    const id = (ev as CustomEvent<string>).detail;
    if (id === 'compras-rececao' && $('[data-cp-guia]') && !document.activeElement?.closest?.('.ws-principal')) $<HTMLInputElement>('[data-cp-guia]')?.focus({ preventScroll: true });
  });
}
