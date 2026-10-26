/* =========================================================
   ERP — 20 · Lista de faltas: o que mexe (22 out. 2026)
   - Filtros: os rápidos (indústria/auto, classes, armazém, stock, fornecedor) aplicam-se logo; os avançados com
     «Aplicar». Enter num campo passa ao seguinte; no último (o código), aplica. As etiquetas dizem o que está
     ativo e tiram-se uma a uma; «Limpar filtros» repõe tudo. Ao aplicar, as linhas que entram acendem um instante.
   - A procura rápida (código, referência do fornecedor ou EAN) filtra ao carregar Enter.
   - Tabela: clicar no cabeçalho ordena (e outra vez, ao contrário); clicar numa linha escolhe o artigo e os
     painéis de baixo passam a ser dele; as caixas marcam vários para as ações; mostrar e esconder colunas.
   - Ações: dizem o que fizeram (protótipo: não grava); «Adicionar escolhidos» e «Criar encomenda» confirmam no
     próprio botão.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { faltas, celula, paineis, COLUNAS, type Falta } from './faltas';

/* no editor, com «Interagir» ligado (26 out.), o ecrã responde como no protótipo */
const editando = () => (document.body.classList.contains('editando') && !document.body.classList.contains('ed-interagir')) || document.body.classList.contains('com-fluxo');
type Filtros = { ind: string; classes: Set<string>; stock: string; fornecedor: string; encforn: string; tipo: string; inicio: string; codigo: string; procura: string };
const novos = (): Filtros => ({ ind: 'Todos', classes: new Set(['A', 'B', 'C']), stock: 'Rutura e abaixo do mínimo', fornecedor: 'Todos', encforn: 'Todas', tipo: 'Todos', inicio: '', codigo: '', procura: '' });
let raiz: HTMLElement | null = null;
let f = novos();
let ordem: { k: string; dir: 1 | -1 } | null = null;
let escolhida = '';
const marcadas = new Set<string>();
let aviso = 0;

function dizer(t: string): void {
  const el = raiz?.querySelector<HTMLElement>('[data-hm-aviso]'); if (!el) return;
  el.textContent = t; el.classList.add('is-visivel'); window.clearTimeout(aviso); aviso = window.setTimeout(() => el.classList.remove('is-visivel'), 2400);
}
function lista(): Falta[] {
  const q = (s: string) => s.toLowerCase().replace(/\s+/g, '');
  let l = faltas().filter((x) => (f.ind === 'Todos' || x.ind === f.ind) && f.classes.has(x.classe)
    && (f.stock !== 'Só em rutura' || x.estado === 'rutura') && (f.stock !== 'Só abaixo do mínimo' || x.estado === 'baixo')
    && (f.fornecedor === 'Todos' || x.fornNome === f.fornecedor) && (f.tipo === 'Todos' || x.tipo === f.tipo)
    && (f.encforn === 'Todas' || (f.encforn === 'Com encomenda' ? x.encomendada > 0 : x.encomendada === 0))
    && (!f.inicio || q(x.ref).startsWith(q(f.inicio)))
    && (!f.codigo || q(x.ref + x.refForn).includes(q(f.codigo)))
    && (!f.procura || q(x.ref + x.refForn + x.desc).includes(q(f.procura))));
  if (ordem) { const { k, dir } = ordem; l = l.slice().sort((a, b) => { const va = (a as unknown as Record<string, string | number | null>)[k] ?? '', vb = (b as unknown as Record<string, string | number | null>)[k] ?? ''; return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt')) * dir; }); }
  return l;
}
function visiveis(): Set<string> {
  const v = new Set<string>(COLUNAS.filter((c) => c.presa).map((c) => c.k));
  raiz?.querySelectorAll<HTMLInputElement>('[data-lf-ver]').forEach((i) => { if (i.checked) v.add(i.dataset.lfVer!); });
  return v;
}
function desenhar(realcar = false): void {
  if (!raiz) return;
  const corpo = raiz.querySelector<HTMLElement>('.lf-tabela tbody'); if (!corpo) return;
  const l = lista(), ver = visiveis();
  if (!l.some((x) => x.ref === escolhida)) escolhida = l[0]?.ref ?? '';
  corpo.innerHTML = l.length ? l.map((x, i) => `<tr data-lf-ref="${x.ref}" class="${x.ref === escolhida ? 'is-escolhida' : ''}${marcadas.has(x.ref) ? ' is-marcada' : ''}${realcar ? ' is-novo' : ''}" style="--i:${i}"><td class="lf-sel is-presa"><input type="checkbox" aria-label="Escolher ${x.ref}" data-lf-marcar${marcadas.has(x.ref) ? ' checked' : ''}></td>${COLUNAS.map((c) => `<td class="${c.presa ? 'is-presa is-presa2' : ''}${c.num ? ' is-num' : ''}" data-col="${c.k}"${ver.has(c.k) ? '' : ' hidden'}>${celula(x, c.k)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${COLUNAS.length + 1}"><div class="lf-vazio"><b>Nenhum artigo com estes filtros.</b><p>Tire um filtro, ou limpe-os.</p><button type="button" class="lf-btn" data-lf-limpar><span>Limpar filtros</span></button></div></td></tr>`;
  raiz.querySelectorAll<HTMLElement>('th[data-col]').forEach((th) => { th.hidden = !ver.has(th.dataset.col!); if (ordem?.k === th.dataset.col) th.setAttribute('aria-sort', ordem!.dir === 1 ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort'); });
  const c = raiz.querySelector<HTMLElement>('[data-lf-contagem]'); if (c) c.innerHTML = `<b>${l.length}</b> ${l.length === 1 ? 'artigo' : 'artigos'}<span data-lf-escolhidos>${marcadas.size ? `${marcadas.size} ${marcadas.size === 1 ? 'escolhido' : 'escolhidos'}` : ''}</span>`;
  raiz.querySelector<HTMLElement>('[data-lf-paineis]')!.innerHTML = paineis(l.find((x) => x.ref === escolhida));
  etiquetas();
}
function etiquetas(): void {
  const caixa = raiz?.querySelector<HTMLElement>('.lf-ativos'); if (!caixa) return;
  const x = (k: string, t: string) => `<span class="lf-chip">${t}<button type="button" aria-label="Tirar o filtro ${t}" data-lf-tirar="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></span>`;
  const ch = [x('armazem', 'Armazém 60')];
  if (f.stock !== 'Rutura e abaixo do mínimo') ch.push(x('stock', f.stock));
  if (f.ind !== 'Todos') ch.push(x('ind', f.ind));
  if (f.classes.size < 3) ch.push(x('classes', 'Classe ' + [...f.classes].sort().join(', ')));
  if (f.fornecedor !== 'Todos') ch.push(x('fornecedor', f.fornecedor));
  if (f.tipo !== 'Todos') ch.push(x('tipo', f.tipo));
  if (f.encforn !== 'Todas') ch.push(x('encforn', f.encforn));
  if (f.inicio) ch.push(x('inicio', `Começa por «${f.inicio}»`));
  if (f.codigo) ch.push(x('codigo', `Código «${f.codigo}»`));
  if (f.procura) ch.push(x('procura', `Pesquisa «${f.procura}»`));
  caixa.innerHTML = `<span class="lf-ativos-t">Ativos:</span>${ch.join('')}<button type="button" class="lf-ligacao" data-lf-limpar>Limpar filtros</button><button type="button" class="lf-btn lf-btn--aplicar" data-lf-aplicar><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>Aplicar</span></button>`;
}
function lerCampos(): void {
  if (!raiz) return;
  const v = (k: string) => raiz!.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-lf-filtro="${k}"]`)?.value;
  f.stock = v('stock') ?? f.stock; f.fornecedor = v('fornecedor') ?? f.fornecedor; f.encforn = v('encforn') ?? f.encforn; f.tipo = v('tipo') ?? f.tipo;
  f.inicio = raiz.querySelector<HTMLInputElement>('[id^="lf-inicio-"]')?.value.trim() ?? '';
  f.codigo = raiz.querySelector<HTMLInputElement>('[id^="lf-codigo-"]')?.value.trim() ?? '';
}
function porNosCampos(): void {
  if (!raiz) return;
  const set = (k: string, val: string) => { const el = raiz!.querySelector<HTMLSelectElement>(`[data-lf-filtro="${k}"]`); if (el) el.value = val; };
  set('stock', f.stock); set('fornecedor', f.fornecedor); set('encforn', f.encforn); set('tipo', f.tipo);
  const i = raiz.querySelector<HTMLInputElement>('[id^="lf-inicio-"]'); if (i) i.value = f.inicio;
  const c = raiz.querySelector<HTMLInputElement>('[id^="lf-codigo-"]'); if (c) c.value = f.codigo;
  const p = raiz.querySelector<HTMLInputElement>('[data-lf-procura]'); if (p) p.value = f.procura;
  raiz.querySelectorAll<HTMLElement>('[data-lf-ind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lfInd === f.ind)));
  raiz.querySelectorAll<HTMLElement>('[data-lf-cl]').forEach((b) => b.setAttribute('aria-pressed', String(f.classes.has(b.dataset.lfCl!))));
}
function aplicar(): void { lerCampos(); desenhar(true); }
function confirmar(b: HTMLElement, t: string): void {
  const rot = b.querySelector('span'); if (!rot) return;
  const antes = rot.textContent; rot.textContent = t; b.classList.add('is-ok');
  window.setTimeout(() => { rot.textContent = antes; b.classList.remove('is-ok'); }, 1300);
}
function acao(b: HTMLElement): void {
  const n = marcadas.size, k = b.dataset.lfAcao!, art = escolhida;
  const msg: Record<string, string> = {
    nova: 'Nova encomenda: escolha o fornecedor (protótipo).', proposta: n ? `Proposta com ${n} ${n === 1 ? 'artigo' : 'artigos'} preparada (protótipo).` : 'Marque os artigos para a proposta.',
    exportar: 'A lista foi exportada para Excel (protótipo).', imprimir: 'A abrir a impressão…', atualizar: `Atualizado às ${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}.`,
    ruturas: 'As ruturas foram recalculadas com o stock de agora.', ajudar: 'Sugestões de compra recalculadas pela rotação dos últimos 90 dias.',
    criar: n ? `Encomenda criada com ${n} ${n === 1 ? 'artigo' : 'artigos'} (protótipo).` : 'Marque os artigos para a encomenda.', historico: `Histórico de compras de ${art}.`, artigo: `A abrir a ficha de ${art}.`,
    fornecedor: 'A abrir o fornecedor do artigo escolhido.', analise: 'A análise foi exportada (protótipo).', adicionar: n ? `${n} ${n === 1 ? 'artigo adicionado' : 'artigos adicionados'} à encomenda ativa.` : 'Marque os artigos a adicionar.', 'abrir-enc': 'A abrir a encomenda ativa…',
  };
  dizer(msg[k] ?? 'Feito.');
  if ((k === 'adicionar' || k === 'criar') && n) confirmar(b, k === 'criar' ? 'Criada' : 'Adicionados');
  if (k === 'atualizar' || k === 'ruturas' || k === 'ajudar') desenhar(true);
  if (k === 'fornecedor') mostrar('compras-fornecedores');
  if (k === 'abrir-enc') mostrar('compras-encomenda');
}

function armar(): void {
  const r = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-lf]');
  if (r === raiz) return;
  raiz = r;
  if (r && r.dataset.lfCenario === 'normal') { f = novos(); ordem = null; marcadas.clear(); escolhida = ''; porNosCampos(); desenhar(); }
}
export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((x) => document.addEventListener(x, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  document.addEventListener('click', (ev) => {
    if (!raiz || editando()) return;
    const t = ev.target as Element; if (!raiz.contains(t)) return;
    const menu = raiz.querySelector<HTMLElement>('.lf-colunas-menu');
    if (menu && !menu.hidden && !t.closest('.lf-colunas')) { menu.hidden = true; raiz.querySelector('[data-lf-colunas]')?.setAttribute('aria-expanded', 'false'); }
    let b: HTMLElement | null;
    if ((b = t.closest('[data-lf-ind]'))) { f.ind = b.dataset.lfInd!; porNosCampos(); desenhar(true); return; }
    if ((b = t.closest('[data-lf-cl]'))) { const c = b.dataset.lfCl!; if (f.classes.has(c) && f.classes.size > 1) f.classes.delete(c); else f.classes.add(c); porNosCampos(); desenhar(true); return; }
    if ((b = t.closest('[data-lf-avancados]'))) { const av = raiz.querySelector<HTMLElement>('.lf-avancados')!; av.hidden = !av.hidden; b.setAttribute('aria-expanded', String(!av.hidden)); if (!av.hidden) av.querySelector<HTMLElement>('[data-lf-campo]')?.focus(); return; }
    if (t.closest('[data-lf-aplicar]')) { aplicar(); dizer('Filtros aplicados.'); return; }
    if (t.closest('[data-lf-limpar]')) { if (raiz.dataset.lfCenario !== 'normal') { mostrar('compras-faltas'); return; } f = novos(); porNosCampos(); desenhar(true); return; }
    if ((b = t.closest('[data-lf-tirar]'))) { const k = b.dataset.lfTirar!; const n = novos() as unknown as Record<string, unknown>; (f as unknown as Record<string, unknown>)[k] = n[k] ?? (f as unknown as Record<string, unknown>)[k]; porNosCampos(); desenhar(true); return; }
    if ((b = t.closest('[data-lf-ordem]'))) { const k = b.dataset.lfOrdem!; ordem = ordem?.k === k ? { k, dir: ordem.dir === 1 ? -1 : 1 } : { k, dir: 1 }; desenhar(); return; }
    if ((b = t.closest('[data-lf-colunas]'))) { const m = raiz.querySelector<HTMLElement>('.lf-colunas-menu')!; m.hidden = !m.hidden; b.setAttribute('aria-expanded', String(!m.hidden)); return; }
    if (t.closest('[data-lf-ver]')) { requestAnimationFrame(() => desenhar()); return; }
    if ((b = t.closest('[data-lf-todos]'))) { const on = (b as HTMLInputElement).checked; lista().forEach((x) => on ? marcadas.add(x.ref) : marcadas.delete(x.ref)); desenhar(); return; }
    if ((b = t.closest('[data-lf-marcar]'))) { const ref = b.closest<HTMLElement>('tr')!.dataset.lfRef!; if ((b as HTMLInputElement).checked) marcadas.add(ref); else marcadas.delete(ref); desenhar(); return; }
    if ((b = t.closest('[data-lf-acao]'))) { acao(b); return; }
    if (t.closest('[data-lf-repetir], [data-lf-primeira]')) { mostrar('compras-faltas'); return; }
    if ((b = t.closest('tr[data-lf-ref]'))) { escolhida = b.dataset.lfRef!; raiz.querySelectorAll('tr.is-escolhida').forEach((x) => x.classList.remove('is-escolhida')); b.classList.add('is-escolhida'); const x = faltas().find((y) => y.ref === escolhida); raiz.querySelector<HTMLElement>('[data-lf-paineis]')!.innerHTML = paineis(x); }
  });
  document.addEventListener('change', (ev) => {
    if (!raiz) return;
    const t = ev.target as HTMLElement;
    if (raiz.contains(t) && t.matches('.lf-rapidos select')) { lerCampos(); desenhar(true); }
  });
  /* Enter passa ao campo seguinte; no último, aplica. Na procura rápida, procura. */
  document.addEventListener('keydown', (ev) => {
    if (!raiz || ev.key !== 'Enter') return;
    const t = ev.target as HTMLElement; if (!raiz.contains(t)) return;
    if (t.matches('[data-lf-procura]')) { ev.preventDefault(); f.procura = (t as HTMLInputElement).value.trim(); desenhar(true); return; }
    if (!t.matches('[data-lf-campo]')) return;
    ev.preventDefault();
    const campos = [...raiz.querySelectorAll<HTMLElement>('[data-lf-campo]')].filter((c) => !c.closest('[hidden]'));
    const i = campos.indexOf(t);
    if (i >= 0 && i < campos.length - 1 && !t.hasAttribute('data-lf-ultimo')) campos[i + 1].focus();
    else { aplicar(); dizer('Filtros aplicados.'); }
  });
}
