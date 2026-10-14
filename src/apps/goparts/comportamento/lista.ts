/* =========================================================
   GOPARTS — 15 · Minha lista: o que mexe (14 out. 2026)
   - Editar na própria linha: Qtd. (− +), PVP, Desc. % e, na mão de obra, a descrição. Os números aceitam
     vírgula; um valor que não é número (ou negativo, ou desconto acima de 100) fica marcado com a mensagem
     por baixo, e a linha não entra nas contas até ser corrigido. Enter e as setas ↑ ↓ passam ao mesmo campo
     da linha de cima ou de baixo.
   - As contas ao vivo: o total da linha e o resumo passam do valor antigo para o novo (420 ms), nunca do zero.
   - «Adicionar peça»: abre a procura da referência (sugestões do catálogo, ↑ ↓ Enter Esc); escolhida, um
     ícone de peça voa do botão para a tabela, a linha nova entra (altura, desvanecer e 8 px) e a quantidade
     recebe o foco. «Adicionar mão de obra»: uma chave voa para a secção e entra uma linha, com o foco na
     descrição. Uma secção vazia passa a ter tabela.
   - Remover: a linha pede confirmação no próprio sítio («Remover? Sim / Não»); só depois se fecha (220 ms)
     e as contas mudam. Duplicar copia a linha por baixo.
   - O estado: qualquer alteração põe «Alterações por guardar» e o ponto no «Guardar». «Guardar»: o rolamento
     no botão até o servidor confirmar (aqui, 0,9 s), depois «Guardada agora». «Enviar»: pergunta o endereço,
     o rolamento no botão, e só depois «Enviada». «Eliminar»: um diálogo que diz o nome e o que acontece.
   - Sair com alterações por guardar (uma aba, outro ecrã): pergunta antes — Ficar, Sair sem guardar, Guardar e sair.
   Os estados do ecrã (15.x) são parados (.portal--estado): esta camada não lhes mexe.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { REFERENCIAS } from '../portal/catalogo-dados';
import { euros, linhaPeca, linhaMao, IC, L } from '../portal/lista';
import { rolamentoSvg } from '../../../comum/rolamento-svg';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando');
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--lista:not(.portal--estado) .lst');
const ler = (s: string) => { const t = s.trim().replace(/\s/g, '').replace(',', '.'); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; };
let n = 0;

/* ---------- as contas ---------- */
const anterior = new WeakMap<Element, number>();
/** Passa o número mostrado do valor que lá estava para o novo (420 ms). */
function rolarNumero(el: Element, para: number, negativo = false): void {
  const de = anterior.get(el) ?? para;
  anterior.set(el, para);
  const escrever = (v: number) => { el.textContent = euros(negativo ? -v : v); };
  if (quieto() || de === para) { escrever(para); return; }
  const t0 = performance.now();
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / 420), e = 1 - Math.pow(1 - k, 3); escrever(de + (para - de) * e); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
  el.closest('div, td')?.classList.remove('is-mudou'); void (el as HTMLElement).offsetWidth; el.closest('div, td')?.classList.add('is-mudou');
}
function valoresLinha(tr: HTMLElement): { bruto: number; total: number; custo: number } | null {
  const q = ler(tr.querySelector<HTMLInputElement>('.lst__q')!.value), p = ler(tr.querySelector<HTMLInputElement>('.lst__pvp')?.value ?? ''), d = ler(tr.querySelector<HTMLInputElement>('.lst__d')!.value);
  if ([q, p, d].some(Number.isNaN) || d > 100) return null;
  const liq = Number(tr.querySelector<HTMLElement>('[data-liquido]')?.dataset.liquido || 0);
  return { bruto: q * p, total: q * p * (1 - d / 100), custo: q * liq };
}
function recalcular(lst: HTMLElement): void {
  const s = { pecas: 0, mao: 0, subtotal: 0, total: 0, custo: 0 };
  lst.querySelectorAll<HTMLElement>('.lst__linha:not(.is-a-sair)').forEach((tr) => {
    const v = valoresLinha(tr);
    const cel = tr.querySelector('[data-total]')!;
    if (!v) return;
    rolarNumero(cel, v.total);
    s.subtotal += v.bruto; s.total += v.total; s.custo += v.custo;
    if (tr.dataset.tipo === 'peca') s.pecas += v.total; else s.mao += v.total;
  });
  const dd = (k: string) => lst.querySelector(`[data-soma="${k}"]`)!;
  rolarNumero(dd('pecas'), s.pecas); rolarNumero(dd('mao'), s.mao); rolarNumero(dd('subtotal'), s.subtotal);
  rolarNumero(dd('descontos'), s.subtotal - s.total, true); rolarNumero(dd('total'), s.total); rolarNumero(dd('custo'), s.custo);
  (['pecas', 'mao'] as const).forEach((k) => { const c = lst.querySelectorAll(`.lst__linha[data-tipo="${k === 'pecas' ? 'peca' : 'mao'}"]:not(.is-a-sair)`).length; lst.querySelectorAll(`[data-n="${k}"]`).forEach((x) => { x.textContent = String(c); }); });
}

/* ---------- o estado da lista ---------- */
function estado(lst: HTMLElement, k: 'sujo' | 'a-guardar' | 'guardada' | 'erro', texto: string): void {
  const e = lst.querySelector<HTMLElement>('.lst__estado')!;
  e.className = `lst__estado lst__estado--${k}`;
  e.innerHTML = `<i aria-hidden="true"></i>${texto}`;
  lst.dataset.sujo = k === 'sujo' || k === 'erro' ? '1' : '';
  lst.querySelector('.lst__guardar')?.classList.toggle('is-sujo', k === 'sujo' || k === 'erro');
  const env = lst.querySelector<HTMLButtonElement>('[data-enviar]'); if (env) env.disabled = !!lst.querySelector('[aria-invalid="true"]');
  const gua = lst.querySelector<HTMLButtonElement>('[data-guardar]'); if (gua && k !== 'a-guardar') gua.disabled = !!lst.querySelector('[aria-invalid="true"]');
}
const sujar = (lst: HTMLElement) => estado(lst, 'sujo', 'Alterações por guardar');
const anunciar = (lst: HTMLElement, t: string) => { const a = lst.querySelector('[data-anuncio]'); if (a) a.textContent = t; };

/* ---------- validar um campo ---------- */
function validar(inp: HTMLInputElement): boolean {
  if (!inp.classList.contains('lst__num')) return true;
  const v = ler(inp.value), d = inp.classList.contains('lst__d');
  const td = inp.closest('td')!;
  td.querySelector('.lst__erro')?.remove();
  const msg = Number.isNaN(v) ? 'Escreva um número, ex.: 112,40' : d && v > 100 ? 'O desconto vai de 0 a 100 %' : inp.classList.contains('lst__q') && v === 0 ? 'A quantidade tem de ser maior do que 0' : '';
  td.classList.toggle('is-erro', !!msg);
  if (msg) { inp.setAttribute('aria-invalid', 'true'); const id = `lst-e-${++n}`; inp.setAttribute('aria-describedby', id); td.insertAdjacentHTML('beforeend', `<p class="lst__erro" id="${id}">${L(IC.alert)}${msg}</p>`); }
  else { inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); }
  return !msg;
}

/* ---------- acrescentar e remover ---------- */
function voar(de: Element, para: Element, icone: string): void {
  if (quieto()) return;
  const a = de.getBoundingClientRect(), b = para.getBoundingClientRect();
  const el = document.createElement('span'); el.className = 'lst__voo'; el.innerHTML = L(icone);
  el.style.left = `${a.left + a.width / 2 - 14}px`; el.style.top = `${a.top + a.height / 2 - 14}px`;
  document.body.appendChild(el);
  const dx = b.left + 40 - (a.left + a.width / 2), dy = b.top + 20 - (a.top + a.height / 2);
  el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.6)`, opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.4, 0, .2, 1)' }).onfinish = () => el.remove();
}
function garantirTabela(lst: HTMLElement, tipo: 'peca' | 'mao'): HTMLElement {
  const sec = lst.querySelector<HTMLElement>(`[data-seccao="${tipo === 'peca' ? 'pecas' : 'mao'}"]`)!;
  let tb = sec.querySelector<HTMLElement>('tbody');
  if (tb) return tb;
  /* a secção vazia passa a ter tabela: o cabeçalho das colunas entra, e o botão sobe para a cabeça da secção */
  const cab = tipo === 'peca'
    ? '<thead><tr><th scope="col">Marca</th><th scope="col">Referência</th><th scope="col">Descrição</th><th scope="col" class="lst__n">Qtd.</th><th scope="col" class="lst__n">Preço líquido</th><th scope="col" class="lst__n">PVP</th><th scope="col" class="lst__n">Desc. %</th><th scope="col" class="lst__n">Total</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>'
    : '<thead><tr><th scope="col">Descrição</th><th scope="col" class="lst__n">Horas</th><th scope="col" class="lst__n">Preço/hora</th><th scope="col" class="lst__n">Desc. %</th><th scope="col" class="lst__n">Total</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead>';
  sec.querySelector('.lst__vazio')?.remove();
  sec.insertAdjacentHTML('beforeend', `<div class="lst__rolo is-a-entrar"><table class="lst__tabela lst__tabela--${tipo === 'peca' ? 'pecas' : 'mao'}">${cab}<tbody></tbody></table></div>`);
  const cabeca = sec.querySelector('.lst__seccao-cabeca')!;
  if (!cabeca.querySelector('[data-adicionar]')) cabeca.insertAdjacentHTML('beforeend', `<button type="button" class="btn lst__adicionar" data-adicionar="${tipo}">${L(IC.plus, 'btn__icone')}<span class="btn__rotulo">${tipo === 'peca' ? 'Adicionar peça' : 'Adicionar mão de obra'}</span></button>`);
  return sec.querySelector<HTMLElement>('tbody')!;
}
function entrar(tr: HTMLElement): void {
  if (quieto()) return;
  tr.querySelectorAll<HTMLElement>('td').forEach((td) => td.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22, 1, .36, 1)' }));
  tr.classList.add('is-nova'); window.setTimeout(() => tr.classList.remove('is-nova'), 1400);
}
function adicionarPeca(lst: HTMLElement, ref: string, de: Element): void {
  const r = REFERENCIAS.find((x) => `${x[1]} ${x[2]}` === ref || x[2] === ref);
  if (!r) return;
  const tb = garantirTabela(lst, 'peca');
  voar(de, tb, IC.pkg);
  tb.insertAdjacentHTML('beforeend', linhaPeca({ marca: r[1], ref: r[2], desc: r[3], qtd: 1, liquido: r[4] * (1 - r[5] / 100), pvp: r[4], d: 0 }, tb.children.length));
  const tr = tb.lastElementChild as HTMLElement;
  entrar(tr);
  tr.querySelector<HTMLInputElement>('.lst__q')?.focus();
  tr.querySelector<HTMLInputElement>('.lst__q')?.select();
  recalcular(lst); sujar(lst); anunciar(lst, `${r[1]} ${r[2]} adicionada à lista.`);
}
function adicionarMao(lst: HTMLElement, de: Element): void {
  const tb = garantirTabela(lst, 'mao');
  voar(de, tb, IC.wrench);
  tb.insertAdjacentHTML('beforeend', linhaMao({ desc: '', horas: 1, preco: 38, d: 0 }, tb.children.length));
  const tr = tb.lastElementChild as HTMLElement;
  entrar(tr);
  tr.querySelector<HTMLInputElement>('.lst__texto')?.focus();
  recalcular(lst); sujar(lst); anunciar(lst, 'Linha de mão de obra adicionada.');
}
function pedirRemover(b: HTMLElement): void {
  const sitio = b.closest('.lst__linha-accoes')!;
  sitio.classList.add('is-confirmar');
  sitio.insertAdjacentHTML('beforeend', `<span class="lst__confirmar" role="group" aria-label="Confirmar remoção"><span>Remover?</span><button type="button" class="lst__sim" data-remover-sim>Sim</button><button type="button" class="lst__nao" data-remover-nao>Não</button></span>`);
  sitio.querySelector<HTMLButtonElement>('[data-remover-nao]')!.focus();
}
function remover(lst: HTMLElement, tr: HTMLElement): void {
  tr.classList.add('is-a-sair');
  const fim = () => {
    const tb = tr.parentElement!; tr.remove();
    recalcular(lst); sujar(lst); anunciar(lst, 'Linha removida.');
    if (!tb.children.length) { const sec = tb.closest('.lst__seccao')!; tb.closest('.lst__rolo')!.remove(); sec.querySelector('.lst__seccao-cabeca [data-adicionar]')?.remove(); const peca = sec.getAttribute('data-seccao') === 'pecas';
      sec.insertAdjacentHTML('beforeend', `<div class="lst__vazio"><p>${peca ? 'Ainda não há peças nesta lista.' : 'Ainda não adicionaste mão de obra.'}</p><button type="button" class="btn lst__adicionar" data-adicionar="${peca ? 'peca' : 'mao'}">${L(IC.plus, 'btn__icone')}<span class="btn__rotulo">${peca ? 'Adicionar peça' : 'Adicionar mão de obra'}</span></button></div>`); }
  };
  if (quieto()) { fim(); return; }
  const h = tr.getBoundingClientRect().height;
  tr.animate([{ opacity: 1, height: `${h}px` }, { opacity: 0, height: '0px' }], { duration: 220, easing: 'cubic-bezier(.4, 0, 1, 1)' }).onfinish = fim;
}

/* ---------- a procura da referência ---------- */
function sugerir(inp: HTMLInputElement): void {
  const ul = inp.closest('.lst__procura')!.querySelector<HTMLElement>('.lst__sugestoes')!;
  const q = inp.value.trim().toLowerCase();
  if (q.length < 2) { ul.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
  const m = REFERENCIAS.filter((r) => `${r[1]} ${r[2]}`.toLowerCase().includes(q)).slice(0, 6);
  ul.innerHTML = m.length ? m.map((r, i) => `<li role="option" class="lst__sug" data-ref="${r[1]} ${r[2]}"${i === 0 ? ' aria-selected="true"' : ''}><b>${r[1]} ${r[2]}</b><span>${r[3]}</span><em>${euros(r[4] * (1 - r[5] / 100))}</em></li>`).join('')
    : `<li class="lst__sug-vazio" role="presentation">Nenhuma referência com «${inp.value.trim()}». Confirme o número ou procure no Catálogo.</li>`;
  ul.hidden = false; inp.setAttribute('aria-expanded', 'true');
}

/* ---------- guardar, enviar, eliminar ---------- */
function ocupado(b: HTMLButtonElement, texto: string): () => void {
  const antes = b.innerHTML; b.disabled = true; b.setAttribute('aria-busy', 'true');
  b.innerHTML = `${rolamentoSvg('lst-' + ++n, 'pesquisar', 'lst__rs')}<span class="btn__rotulo">${texto}</span>`;
  return () => { b.innerHTML = antes; b.disabled = false; b.removeAttribute('aria-busy'); };
}
function guardar(lst: HTMLElement, depois?: () => void): void {
  const b = lst.querySelector<HTMLButtonElement>('[data-guardar]'); if (!b || b.disabled) return;
  estado(lst, 'a-guardar', 'A guardar…');
  const repor = ocupado(b, 'A guardar…');
  /* sem servidor neste protótipo: a confirmação chega ao fim de 0,9 s */
  window.setTimeout(() => {
    repor(); estado(lst, 'guardada', 'Guardada agora');
    b.classList.add('is-ok'); window.setTimeout(() => b.classList.remove('is-ok'), 1200);
    anunciar(lst, 'Lista guardada.'); depois?.();
  }, quieto() ? 200 : 900);
}
function abrirDialogo(raiz: HTMLElement, tipo: string, de?: HTMLElement): void {
  const d = raiz.querySelector<HTMLElement>(`[data-dialogo="${tipo}"]`); if (!d) return;
  d.hidden = false; (d as HTMLElement & { _de?: HTMLElement })._de = de;
  raiz.querySelector<HTMLElement>('.lst')!.inert = true;
  d.querySelector<HTMLElement>('input, [data-confirmar-eliminar], [data-guardar-sair], button')?.focus();
}
function fecharDialogo(d: HTMLElement): void { d.hidden = true; const l = d.parentElement?.querySelector<HTMLElement>('.lst'); if (l) l.inert = false; (d as HTMLElement & { _de?: HTMLElement })._de?.focus(); }

let sairPara: string | null = null;
export function iniciar(): void {
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const lst = vivo();
    /* sair com alterações por guardar: pergunta antes (fase de captura, antes da navegação do protótipo) */
    const ir = t.closest?.<HTMLElement>('[data-ir]');
    if (ir && lst?.dataset.sujo && ir.closest('.portal--lista') && !ir.closest('.lst__dialogo')) {
      ev.preventDefault(); ev.stopPropagation(); sairPara = ir.dataset.ir!; abrirDialogo(lst.parentElement!, 'sair', ir); return;
    }
    if (!lst) return;
    const raiz = lst.parentElement!;
    const dlg = t.closest?.<HTMLElement>('.lst__dialogo');
    if (dlg) {
      if (t === dlg || t.closest('[data-fechar]')) { fecharDialogo(dlg); return; }
      if (t.closest('[data-sair]')) { lst.dataset.sujo = ''; lst.inert = false; dlg.hidden = true; if (sairPara) mostrar(sairPara); return; }
      if (t.closest('[data-guardar-sair]')) { lst.inert = false; dlg.hidden = true; guardar(lst, () => { if (sairPara) mostrar(sairPara); }); return; }
      if (t.closest('[data-confirmar-eliminar]')) {
        const b = t.closest<HTMLButtonElement>('[data-confirmar-eliminar]')!, repor = ocupado(b, 'A eliminar…');
        window.setTimeout(() => { repor(); dlg.hidden = true; lst.inert = false; lst.dataset.sujo = ''; mostrar('inicio'); }, quieto() ? 200 : 800);
        return;
      }
      if (t.closest('[data-confirmar-enviar]')) {
        const dest = dlg.querySelector<HTMLInputElement>('[data-destino]')!;
        if (!/^\S+@\S+\.\S+$/.test(dest.value)) { dest.setAttribute('aria-invalid', 'true'); dest.focus(); return; }
        fecharDialogo(dlg);
        const b = lst.querySelector<HTMLButtonElement>('[data-enviar]')!, repor = ocupado(b, 'A enviar…');
        window.setTimeout(() => { repor(); anunciar(lst, `Lista enviada para ${dest.value}.`); lst.querySelector('.lst__estado')!.insertAdjacentHTML('afterend', `<span class="lst__enviada">${L(IC.check)}Enviada para ${dest.value}</span>`); }, quieto() ? 200 : 1100);
        return;
      }
      return;
    }
    if (t.closest('[data-guardar]')) { guardar(lst); return; }
    const env = t.closest<HTMLElement>('[data-enviar]'); if (env) { abrirDialogo(raiz, 'enviar', env); return; }
    const el = t.closest<HTMLElement>('[data-eliminar]'); if (el) { abrirDialogo(raiz, 'eliminar', el); return; }
    const ab = t.closest<HTMLElement>('[data-abrir]'); if (ab) { abrirDialogo(raiz, 'abrir', ab); return; }
    const add = t.closest<HTMLElement>('[data-adicionar]');
    if (add) {
      if (add.dataset.adicionar === 'mao') { adicionarMao(lst, add); return; }
      const p = lst.querySelector<HTMLElement>('.lst__procura')!; p.hidden = false;
      p.querySelector<HTMLInputElement>('input')!.focus(); return;
    }
    if (t.closest('[data-fechar-procura]')) { lst.querySelector<HTMLElement>('.lst__procura')!.hidden = true; return; }
    const sug = t.closest<HTMLElement>('.lst__sug');
    if (sug) { const inp = lst.querySelector<HTMLInputElement>('[data-procura-ref]')!; adicionarPeca(lst, sug.dataset.ref!, inp); inp.value = ''; sug.parentElement!.hidden = true; return; }
    const q = t.closest<HTMLElement>('.lst__qtd-b');
    if (q) { const inp = q.parentElement!.querySelector<HTMLInputElement>('input')!; const v = ler(inp.value); const passo = inp.closest('[data-tipo="mao"]') ? 0.5 : 1; inp.value = String(Math.max(passo, (Number.isNaN(v) ? 0 : v) + Number(q.dataset.passo) * passo)).replace('.', ','); validar(inp); recalcular(lst); sujar(lst); return; }
    const rem = t.closest<HTMLElement>('[data-remover]'); if (rem) { pedirRemover(rem); return; }
    if (t.closest('[data-remover-nao]')) { const s = t.closest('.lst__linha-accoes')!; s.classList.remove('is-confirmar'); s.querySelector('.lst__confirmar')?.remove(); s.querySelector<HTMLElement>('[data-remover]')?.focus(); return; }
    if (t.closest('[data-remover-sim]')) { remover(lst, t.closest<HTMLElement>('.lst__linha')!); return; }
    const dup = t.closest<HTMLElement>('[data-duplicar]');
    if (dup) { const tr = dup.closest<HTMLElement>('.lst__linha')!; const c = tr.cloneNode(true) as HTMLElement; tr.after(c); entrar(c); recalcular(lst); sujar(lst); anunciar(lst, 'Linha duplicada.'); return; }
  }, true);

  document.addEventListener('input', (ev) => {
    /* (os diálogos ficam fora do .lst: procura-se pelo portal) */
    const inp = ev.target as HTMLInputElement, lst = inp.closest?.<HTMLElement>('.portal--lista')?.querySelector<HTMLElement>('.lst');
    if (!lst || lst !== vivo()) return;
    if (inp.matches('[data-procura-ref]')) { sugerir(inp); return; }
    if (inp.matches('[data-destino]')) { inp.removeAttribute('aria-invalid'); return; }
    if (inp.matches('[data-procura-listas]')) { const q = inp.value.toLowerCase(); inp.closest('.lst__dialogo-caixa')!.querySelectorAll<HTMLElement>('.lst__listas li').forEach((li) => { li.hidden = !!q && !li.textContent!.toLowerCase().includes(q); }); return; }
    if (inp.matches('.lst__num')) { if (validar(inp)) recalcular(lst); }
    /* ao sair do campo, o preço fica com dois decimais */
    sujar(lst);
  });
  document.addEventListener('focusout', (ev) => { const i = ev.target as HTMLInputElement; if (i.matches?.('.lst .lst__pvp') && !i.hasAttribute('aria-invalid')) { const v = ler(i.value); if (!Number.isNaN(v)) i.value = v.toFixed(2).replace('.', ','); } });
  document.addEventListener('keydown', (ev) => {
    const inp = ev.target as HTMLInputElement, lst = inp.closest?.<HTMLElement>('.portal--lista:not(.portal--estado)')?.querySelector<HTMLElement>('.lst');
    if (!lst) return;
    if (ev.key === 'Escape') { const d = lst.parentElement!.querySelector<HTMLElement>('.lst__dialogo:not([hidden])'); if (d) { fecharDialogo(d); return; } }
    if (inp.matches?.('[data-procura-ref]')) {
      const ul = lst.querySelector<HTMLElement>('.lst__sugestoes')!, ops = Array.from(ul.querySelectorAll<HTMLElement>('.lst__sug'));
      if (ev.key === 'Escape') { ul.hidden = true; lst.querySelector<HTMLElement>('.lst__procura')!.hidden = true; lst.querySelector<HTMLElement>('[data-adicionar="peca"]')?.focus(); return; }
      if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && ops.length) { ev.preventDefault(); const i = ops.findIndex((o) => o.getAttribute('aria-selected') === 'true'), j = (i + (ev.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length; ops.forEach((o, k) => o.setAttribute('aria-selected', String(k === j))); return; }
      if (ev.key === 'Enter') { const s = ops.find((o) => o.getAttribute('aria-selected') === 'true'); if (s) { ev.preventDefault(); adicionarPeca(lst, s.dataset.ref!, inp); inp.value = ''; ul.hidden = true; } return; }
    }
    /* Enter e ↑ ↓ nos números: o mesmo campo na linha de baixo ou de cima */
    if (inp.matches?.('.lst__num, .lst__texto') && (ev.key === 'Enter' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      const tr = inp.closest('tr')!, cls = Array.from(inp.classList).find((c) => c !== 'lst__num')!;
      const outra = (ev.key === 'ArrowUp' ? tr.previousElementSibling : tr.nextElementSibling)?.querySelector<HTMLInputElement>(`.${cls}`);
      if (outra) { ev.preventDefault(); outra.focus(); outra.select(); }
    }
  });
  /* fechar a janela com alterações por guardar */
  window.addEventListener('beforeunload', (ev) => { if (vivo()?.dataset.sujo) ev.preventDefault(); });
}
