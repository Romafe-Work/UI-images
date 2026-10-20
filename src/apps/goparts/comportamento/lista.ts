/* =========================================================
   GOPARTS — 15 · Minha lista: o que mexe (16 out. 2026, o espaço de orçamento)
   - Editar na linha: Qtd. (− +, ou escrita), PVP, Desc. %; na mão-de-obra a descrição e «Por hora / Preço fixo».
     Validação à vista: quantidade de peça inteira ≥ 1; horas > 0; preço ≥ 0 com cêntimos; desconto de 0 a 100 %.
     O valor escrito fica (nunca trocado em silêncio); a linha sai das contas e o total dela fica «— €» até se
     corrigir; «Guardar lista» e «Enviar» esperam. Enter e ↑ ↓ passam ao mesmo campo da linha vizinha.
   - As contas são as de portal/lista.ts (contas()), lidas do que está no ecrã: o total da linha e o resumo passam
     do valor antigo ao novo (420 ms). Uma peça sem preço nunca conta como 0,00 €: o total diz «parcial».
   - «Adicionar peças» (ou Alt+A): a gaveta com a procura (referência, marca, descrição), as mais usadas, a
     disponibilidade, a quantidade; ↑ ↓ Enter Esc. Ao adicionar: a gaveta fecha, a linha entra no sítio (as outras
     descem por FLIP), fica acesa um instante, o resumo muda e o aviso traz «Desfazer». A mesma referência soma-se
     à linha que já existe.
   - Remover: a linha sai e as outras sobem; o aviso traz «Desfazer». A última peça deixa o vazio compacto.
   - «Adicionar serviço»: o editor na secção (sugestões só preenchem a descrição). «Adicionar custo»: uma linha.
   - Guardar (ou Ctrl+S): o rolamento no botão e no indicador enquanto o servidor não responde (aqui, simulado);
     só depois «Guardada». Enviar: o endereço, o rolamento, e a lista passa a Enviada (só de leitura).
   - «Mais ações»: Nova lista, Duplicar, Pôr no carrinho, Limpar (com Desfazer), Eliminar (confirmação).
   - «Minhas listas → Editar lista»: abrir repõe o que foi guardado (LISTAS, em memória neste protótipo).
   - Sair com alterações por guardar pergunta antes: Ficar · Sair sem guardar · Guardar e sair.
   - O Catálogo («Adicionar à minha lista») deixa as referências em sessionStorage; ao abrir a lista, entram.
   Os estados do ecrã (15.x, .portal--estado) são parados: esta camada não lhes mexe.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { REFERENCIAS } from '../portal/catalogo-dados';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { portal } from '../portal/base';
import * as carrinho from './carrinho';
import {
  euros, dinheiro, num, plural, contas, totalPeca, totalMao, doCatalogo, linhaPeca, linhaMao, linhaCusto, colunas,
  listaHtml, gavetaHtml, previaHtml, gravacao, botaoLista, ESTADO_NOME, LISTAS, NOVA, IC, L,
  type Lista, type Peca, type Mao, type Custo,
} from '../portal/lista';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando');
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .portal--lista:not(.portal--estado) .lst');
const raizDe = (lst: HTMLElement) => lst.closest<HTMLElement>('.portal--lista')!;
const CURVA = 'cubic-bezier(.22, 1, .36, 1)';
/** Um número escrito à portuguesa (112,40 ou 112.40); outra coisa qualquer → NaN. */
const ler = (s: string) => { const t = s.trim().replace(/\s/g, '').replace(',', '.'); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN; };
const decimais = (s: string) => (s.trim().replace(',', '.').split('.')[1] ?? '').length;
let n = 0;
const SECCAO = { peca: 'pecas', mao: 'mao', custo: 'custos' } as const;
type Tipo = keyof typeof SECCAO;

/* ---------- ler a lista que está no ecrã ---------- */
function lerLinha(li: HTMLElement): { tipo: Tipo; peca?: Peca; mao?: Mao; custo?: Custo; valida: boolean } {
  const tipo = li.dataset.tipo as Tipo, v = (sel: string) => li.querySelector<HTMLInputElement>(sel)?.value ?? '';
  const valida = !li.querySelector('[aria-invalid="true"]');
  if (tipo === 'peca') {
    const r = REFERENCIAS.find((x) => x[2] === li.dataset.ref);
    const base: Peca = r ? doCatalogo(r) : { marca: li.querySelector('.lst__marca')?.textContent ?? '', ref: li.dataset.ref ?? '', desc: li.querySelector('.lst__desc')?.textContent ?? '', qtd: 1, liquido: null, pvp: null, d: 0 };
    const semPreco = !li.querySelector('.lst__pvp');
    return { tipo, valida, peca: { ...base, liquido: li.dataset.liquido ? Number(li.dataset.liquido) : null, qtd: ler(v('.lst__q')), pvp: semPreco ? null : ler(v('.lst__pvp')), d: ler(v('.lst__d')) } };
  }
  if (tipo === 'mao') {
    const modo = (li.dataset.modo as Mao['modo']) ?? 'hora';
    return { tipo, valida, mao: { desc: v('.lst__texto'), modo, horas: modo === 'fixo' ? 1 : ler(v('.lst__q')), preco: ler(v('.lst__pvp')), d: ler(v('.lst__d')) } };
  }
  return { tipo, valida, custo: { desc: v('.lst__texto'), valor: ler(v('.lst__pvp')) } };
}
/** A lista no ecrã. Com `soValidas`, as linhas com um campo por corrigir ficam de fora (as contas). */
function lerLista(lst: HTMLElement, soValidas = false): Lista {
  const linhas = Array.from(lst.querySelectorAll<HTMLElement>('.lst__linha:not([data-a-sair])')).map(lerLinha).filter((x) => !soValidas || x.valida);
  const estado = (Object.keys(ESTADO_NOME) as Lista['estado'][]).find((k) => lst.querySelector(`.lst__estado--${k}[data-estado-lista]`)) ?? 'nova';
  const guardada = LISTAS.find((l) => l.id === lst.dataset.lista);
  return {
    id: lst.dataset.lista ?? '', nome: lst.querySelector<HTMLInputElement>('[data-nome]')?.value.trim() || 'Lista sem nome', estado,
    criada: guardada?.criada ?? 'hoje', atualizada: guardada?.atualizada ?? 'ainda não guardada', carro: guardada?.carro,
    pecas: linhas.flatMap((x) => (x.peca ? [x.peca] : [])), mao: linhas.flatMap((x) => (x.mao ? [x.mao] : [])), custos: linhas.flatMap((x) => (x.custo ? [x.custo] : [])),
    notas: lst.querySelector<HTMLTextAreaElement>('[data-notas]')?.value ?? '',
  };
}

/* ---------- as contas no ecrã ---------- */
const anterior = new WeakMap<Element, number>();
/** Passa o número mostrado do valor que lá estava para o novo (420 ms); null → «— €». */
function rolarNumero(el: Element, para: number | null, negativo = false): void {
  if (para === null) { anterior.delete(el); el.innerHTML = '<span class="lst__sem">— €</span>'; return; }
  const de = anterior.get(el) ?? para;
  anterior.set(el, para);
  const escrever = (v: number) => { el.textContent = euros(negativo ? -v : v); };
  if (quieto() || Math.abs(de - para) < 0.005) { escrever(para); return; }
  const t0 = performance.now();
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / 420), e = 1 - Math.pow(1 - k, 3); escrever(de + (para - de) * e); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
  el.classList.remove('is-mudou'); void (el as HTMLElement).offsetWidth; el.classList.add('is-mudou');
}
function recalcular(lst: HTMLElement): void {
  lst.querySelectorAll<HTMLElement>('.lst__linha:not([data-a-sair])').forEach((li) => {
    const x = lerLinha(li), cel = li.querySelector('[data-total]'); if (!cel) return;
    const t = !x.valida ? null : x.peca ? totalPeca(x.peca) : x.mao ? totalMao(x.mao) : x.custo!.valor;
    rolarNumero(cel, t);
  });
  const todas = lerLista(lst), l = lerLista(lst, true), c = contas(l), ct = contas(todas);
  const r = raizDe(lst);
  const soma = (k: string, v: number | null, neg = false) => r.querySelectorAll(`[data-soma="${k}"]`).forEach((el) => rolarNumero(el, v, neg));
  soma('pecas', c.pecas); soma('mao', c.mao); soma('outros', c.outros); soma('descontos', c.descontos, true);
  soma('base', c.base); soma('iva', c.iva); soma('custo', c.custo);
  const nada = !ct.nPecas && !ct.nMao && !ct.nCustos, semNenhumPreco = ct.nPecas > 0 && ct.semPreco.length === ct.nPecas && !ct.nMao && !ct.nCustos;
  soma('total', nada || semNenhumPreco ? null : c.total);
  /* as contagens (as linhas no ecrã, válidas ou não) */
  const conta = { pecas: ct.nPecas, mao: ct.nMao, custos: ct.nCustos };
  (Object.keys(conta) as (keyof typeof conta)[]).forEach((k) => lst.querySelectorAll(`.lst__cont[data-n="${k}"]`).forEach((el) => { el.textContent = String(conta[k]); }));
  const rn = lst.querySelector('.lst__resumo-n');
  if (rn) rn.innerHTML = `<span><b data-n="pecas">${ct.nPecas}</b> ${ct.nPecas === 1 ? 'peça' : 'peças'}</span><span><b data-n="mao">${ct.nMao}</b> ${ct.nMao === 1 ? 'serviço' : 'serviços'}</span><span><b data-n="custos">${ct.nCustos}</b> ${ct.nCustos === 1 ? 'outro custo' : 'outros custos'}</span>`;
  const carr = lst.querySelector<HTMLButtonElement>('.lst__carrinho');
  if (carr) { carr.disabled = !c.noCarrinho; const b = carr.querySelector('[data-n="carrinho"]'); if (b) b.textContent = plural(c.noCarrinho, 'peça', 'peças'); }
  const falta = lst.querySelector<HTMLElement>('[data-falta]');
  if (falta) {
    falta.hidden = !ct.semPreco.length;
    if (ct.semPreco.length) falta.innerHTML = `${L(IC.alert)}<span><b>Total parcial.</b> Falta o preço de ${plural(ct.semPreco.length, 'peça', 'peças')} (${ct.semPreco.map((p) => p.ref).join(', ')}); entra quando o GoParts o devolver.</span>`;
  }
  const invalidos = lst.querySelectorAll('.lst__linha [aria-invalid="true"]').length;
  const prev = lst.querySelector<HTMLButtonElement>('[data-previa]'); if (prev) prev.disabled = nada;
  const env = lst.querySelector<HTMLButtonElement>('[data-enviar]'); if (env && !env.hasAttribute('aria-busy')) env.disabled = nada || invalidos > 0 || lst.classList.contains('is-leitura');
  const gua = lst.querySelector<HTMLButtonElement>('[data-guardar]'); if (gua && !gua.hasAttribute('aria-busy')) gua.disabled = invalidos > 0 || lst.classList.contains('is-leitura');
  /* «há N campos por corrigir», por baixo do cabeçalho */
  let porque = lst.querySelector<HTMLElement>('.lst__porque');
  if (invalidos && !porque) { lst.querySelector('.lst__topo')!.insertAdjacentHTML('beforeend', '<p class="lst__porque" id="lst-porque"></p>'); porque = lst.querySelector<HTMLElement>('.lst__porque'); }
  if (porque) { if (invalidos) porque.innerHTML = `${L(IC.alert)}${invalidos === 1 ? 'Há 1 campo por corrigir' : `Há ${invalidos} campos por corrigir`}; a lista guarda-se depois de o${invalidos === 1 ? '' : 's'} corrigires.`; else porque.remove(); }
}

/* ---------- o estado da gravação ---------- */
function gravar(lst: HTMLElement, k: Parameters<typeof gravacao>[0]): void {
  const g = lst.querySelector('[data-grav]'); if (g) g.outerHTML = gravacao(k);
}
function sujar(lst: HTMLElement): void {
  if (lst.classList.contains('is-leitura')) return;
  lst.dataset.sujo = '1'; lst.dataset.mexida = '1'; gravar(lst, 'sujo');
  lst.querySelector('.lst__guardar')?.classList.add('is-sujo');
}

/* ---------- validar um campo ---------- */
function validar(inp: HTMLInputElement): boolean {
  if (!inp.classList.contains('lst__num') || !inp.closest('.lst__linha')) return true;
  const c = inp.closest<HTMLElement>('.lst__c')!, v = ler(inp.value), peca = !!inp.closest('[data-tipo="peca"]');
  let msg = '';
  if (!inp.value.trim()) msg = 'Obrigatório';
  else if (inp.classList.contains('lst__q')) msg = peca ? (!Number.isInteger(v) || v < 1 ? 'Inteiro, 1 ou mais' : '') : (Number.isNaN(v) || v <= 0 || decimais(inp.value) > 2 ? 'Acima de 0' : '');
  else if (inp.classList.contains('lst__d')) msg = Number.isNaN(v) || v > 100 ? 'De 0 a 100 %' : '';
  else if (inp.classList.contains('lst__pvp')) msg = Number.isNaN(v) ? 'Ex.: 112,40' : decimais(inp.value) > 2 ? 'Só cêntimos' : '';
  c.querySelector('.lst__erro')?.remove();
  c.classList.toggle('is-erro', !!msg);
  if (msg) { const id = `lst-e-${++n}`; inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', id); c.insertAdjacentHTML('beforeend', `<p class="lst__erro" id="${id}">${L(IC.alert)}${msg}</p>`); }
  else { inp.removeAttribute('aria-invalid'); inp.removeAttribute('aria-describedby'); }
  return !msg;
}

/* ---------- mexer nas linhas, sem saltos (FLIP) ---------- */
/** Regista onde está cada [data-flip], muda, e anima a diferença (relativa ao [data-flip] de fora, para não somar). */
function flip(lst: HTMLElement, mudar: () => void): void {
  const pos = (el: Element) => { const a = el.parentElement?.closest('[data-flip]'); return el.getBoundingClientRect().top - (a ? a.getBoundingClientRect().top : 0); };
  const antes = new Map<Element, number>();
  lst.querySelectorAll('[data-flip]').forEach((el) => antes.set(el, pos(el)));
  mudar();
  if (quieto()) return;
  lst.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
    const a = antes.get(el); if (a === undefined) return;
    const d = a - pos(el);
    if (Math.abs(d) > 0.5) el.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 260, easing: CURVA });
  });
}
function acender(li: HTMLElement): void {
  if (!quieto()) li.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: CURVA });
  li.classList.add('is-nova'); window.setTimeout(() => li.classList.remove('is-nova'), 1400);
}
const botaoAdd = (tipo: Tipo, cheio = false) => botaoLista(`lst__adicionar${cheio ? ' lst__adicionar--cheio' : ''}`, IC.plus, tipo === 'peca' ? 'Adicionar peças' : tipo === 'mao' ? 'Adicionar serviço' : 'Adicionar custo', ` data-adicionar="${tipo}"${tipo === 'peca' ? ' aria-haspopup="dialog" aria-keyshortcuts="Alt+A"' : ''}`);
const VAZIO: Record<Tipo, string> = {
  peca: 'Ainda não há peças. Procura pela referência, marca ou descrição — ou, no Catálogo, usa «Adicionar à minha lista».',
  mao: 'Sem serviços nesta lista.', custo: 'Sem outros custos.',
};
const seccao = (lst: HTMLElement, tipo: Tipo) => lst.querySelector<HTMLElement>(`[data-seccao="${SECCAO[tipo]}"]`)!;
/** A secção passa de vazia a ter linhas: as colunas e a lista no lugar do vazio; o botão sobe à cabeça. */
function garantirLinhas(lst: HTMLElement, tipo: Tipo): HTMLElement {
  const sec = seccao(lst, tipo);
  const ul = sec.querySelector<HTMLElement>('.lst__linhas'); if (ul) return ul;
  const vazio = sec.querySelector('[data-vazio]');
  const html = `${colunas(tipo)}<ul class="lst__linhas" role="list"></ul>`;
  if (vazio) vazio.outerHTML = html; else sec.querySelector('.lst__seccao-cabeca')!.insertAdjacentHTML('afterend', html);
  const cab = sec.querySelector('.lst__seccao-cabeca')!;
  if (!cab.querySelector('[data-adicionar]')) cab.insertAdjacentHTML('beforeend', botaoAdd(tipo));
  return sec.querySelector<HTMLElement>('.lst__linhas')!;
}
/** A secção ficou sem linhas: volta o vazio compacto (com o botão). */
function talvezVazia(lst: HTMLElement, tipo: Tipo): void {
  const sec = seccao(lst, tipo), ul = sec.querySelector('.lst__linhas');
  if (!ul || ul.children.length) return;
  sec.querySelector('.lst__colunas')?.remove(); ul.remove();
  if (tipo !== 'peca') sec.querySelector('.lst__seccao-cabeca [data-adicionar]')?.remove();
  sec.querySelector('.lst__seccao-cabeca')!.insertAdjacentHTML('afterend', `<div class="lst__vazio" data-vazio><p>${VAZIO[tipo]}</p>${botaoAdd(tipo, tipo === 'peca')}</div>`);
}
function inserir(lst: HTMLElement, tipo: Tipo, html: string, indice?: number): HTMLElement {
  let li!: HTMLElement;
  flip(lst, () => {
    const ul = garantirLinhas(lst, tipo);
    const antes = indice !== undefined ? ul.children[indice] : null;
    if (antes) antes.insertAdjacentHTML('beforebegin', html); else ul.insertAdjacentHTML('beforeend', html);
    li = (antes ? antes.previousElementSibling : ul.lastElementChild) as HTMLElement;
  });
  acender(li);
  recalcular(lst); sujar(lst);
  return li;
}
function remover(lst: HTMLElement, li: HTMLElement): void {
  const tipo = li.dataset.tipo as Tipo, ul = li.parentElement!, indice = Array.from(ul.children).indexOf(li), html = li.outerHTML;
  const nome = tipo === 'peca' ? `${li.querySelector('.lst__marca')?.textContent} ${li.dataset.ref}` : (li.querySelector<HTMLInputElement>('.lst__texto')?.value || (tipo === 'mao' ? 'o serviço' : 'o custo'));
  const foco = (li.nextElementSibling ?? li.previousElementSibling)?.querySelector<HTMLElement>('[data-remover]') ?? seccao(lst, tipo).querySelector<HTMLElement>('[data-adicionar]');
  li.dataset.aSair = '';
  const fim = () => {
    flip(lst, () => { li.remove(); talvezVazia(lst, tipo); });
    recalcular(lst); sujar(lst);
    (foco?.isConnected ? foco : seccao(lst, tipo).querySelector<HTMLElement>('[data-adicionar]'))?.focus();
    const ultima = tipo === 'peca' && !seccao(lst, 'peca').querySelector('.lst__linha');
    avisar(lst, `${L(IC.trash)}<span>${ultima ? 'Retiraste a última peça' : 'Retiraste'} <b>${nome}</b>${ultima ? '. Os serviços e as notas ficam.' : ' da lista.'}</span>`, () => { const novo = inserir(lst, tipo, html.replace(' data-a-sair=""', ''), indice); novo.querySelector<HTMLElement>('[data-remover]')?.focus(); });
  };
  if (quieto()) { fim(); return; }
  li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-12px)' }], { duration: 200, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }).onfinish = fim;
}

/* ---------- os avisos em baixo (com «Desfazer») ---------- */
function avisar(lst: HTMLElement, html: string, desfazer?: () => void, ok = false): void {
  const zona = lst.querySelector<HTMLElement>('[data-avisos]'); if (!zona) return;
  while (zona.children.length > 1) zona.firstElementChild!.remove();
  zona.insertAdjacentHTML('beforeend', `<div class="lst__aviso${ok ? ' lst__aviso--ok' : ''}" role="status">${html}${desfazer ? `<button type="button" class="lst__aviso-b">${L(IC.undo)}Desfazer</button>` : ''}</div>`);
  const a = zona.lastElementChild as HTMLElement;
  const tirar = () => { if (!a.isConnected) return; a.classList.add('is-a-sair'); window.setTimeout(() => a.remove(), quieto() ? 0 : 200); };
  a.querySelector('.lst__aviso-b')?.addEventListener('click', () => { a.remove(); desfazer!(); });
  window.setTimeout(tirar, desfazer ? 7000 : 4000);
}

/* ---------- mudar de lista (o ecrã inteiro) ---------- */
function mostrarLista(lst: HTMLElement, html: string, foco = '[data-nome]'): HTMLElement {
  const r = raizDe(lst);
  r.outerHTML = portal('lista', html, undefined, { menu: true, rodape: false });
  const novo = vivo()!;
  window.scrollTo({ top: 0 });
  novo.querySelector<HTMLElement>(foco)?.focus({ preventScroll: true });
  recalcular(novo);
  return novo;
}
const abrirLista = (lst: HTMLElement, l: Lista) => mostrarLista(lst, listaHtml('', structuredClone(l)), '.lst__migalhas [aria-current]');
function verListas(lst: HTMLElement): HTMLElement { const novo = mostrarLista(lst, listaHtml('listas'), '[data-procura-listas]'); return novo; }
/** Antes de sair desta lista, se há alterações por guardar, pergunta. */
let pendente: (() => void) | null = null;
function seGuardado(lst: HTMLElement, de: HTMLElement, fazer: () => void): void {
  if (!lst.dataset.sujo || lst.dataset.vista !== 'editar') { fazer(); return; }
  pendente = fazer; abrirDialogo(raizDe(lst), 'sair', de);
}

/* ---------- guardar e enviar ---------- */
function ocupado(b: HTMLButtonElement, texto: string): () => void {
  const antes = b.innerHTML, desligado = b.disabled; b.disabled = true; b.setAttribute('aria-busy', 'true');
  b.innerHTML = `${rolamentoSvg('lst-' + ++n, 'pesquisar', 'lst__rs')}<span class="btn__rotulo">${texto}</span>`;
  return () => { b.innerHTML = antes; b.disabled = desligado; b.removeAttribute('aria-busy'); };
}
const agora = () => { const d = new Date(); return `hoje às ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
/** O que o servidor guardaria: a lista do ecrã passa a LISTAS (aqui, em memória). */
function persistir(lst: HTMLElement, estado: Lista['estado']): Lista {
  const l = lerLista(lst);
  if (!l.id) { const maior = Math.max(...LISTAS.map((x) => Number(x.id.split('/')[1]) || 0), 318); l.id = `L2024/${String(maior + 1).padStart(6, '0')}`; l.criada = new Date().toLocaleDateString('pt-PT'); }
  l.estado = estado; l.atualizada = agora();
  const i = LISTAS.findIndex((x) => x.id === l.id);
  if (i >= 0) LISTAS[i] = structuredClone(l); else LISTAS.unshift(structuredClone(l));
  return l;
}
function guardar(lst: HTMLElement, depois?: () => void): void {
  const b = lst.querySelector<HTMLButtonElement>('[data-guardar]');
  const mau = lst.querySelector<HTMLElement>('.lst__linha [aria-invalid="true"]');
  if (mau) { mau.focus(); return; }
  if (!b || b.hasAttribute('aria-busy') || lst.classList.contains('is-leitura')) return;
  gravar(lst, 'a-guardar');
  const repor = ocupado(b, 'A guardar…');
  /* sem servidor neste protótipo: a confirmação chega ao fim de 0,9 s; só então «Guardada» */
  window.setTimeout(() => {
    if (!b.isConnected) return;
    repor();
    const l = persistir(lst, lerLista(lst).estado === 'enviada' ? 'enviada' : 'guardada');
    lst.dataset.lista = l.id; lst.dataset.sujo = '';
    const est = lst.querySelector<HTMLElement>('[data-estado-lista]'); if (est) { est.className = 'lst__estado lst__estado--guardada'; est.textContent = ESTADO_NOME.guardada; }
    const quando = lst.querySelector('.lst__quando'); if (quando) quando.innerHTML = `${L(IC.clock)}Atualizada ${l.atualizada}`;
    if (!lst.querySelector('.lst__numero')) lst.querySelector('.lst__quando')?.insertAdjacentHTML('afterend', `<span class="lst__numero">${l.id}</span>`);
    const mig = lst.querySelector('.lst__migalhas [aria-current]'); if (mig) mig.textContent = 'Editar lista';
    raizDe(lst).querySelector<HTMLButtonElement>('[data-eliminar]')?.removeAttribute('disabled');
    raizDe(lst).querySelectorAll<HTMLElement>('[data-duplicar-lista]').forEach((x) => { x.dataset.duplicarLista = l.id; });
    gravar(lst, 'guardada');
    b.classList.remove('is-sujo'); b.classList.add('is-ok');
    window.setTimeout(() => b.classList.remove('is-ok'), 1200);
    avisar(lst, `${L(IC.check)}<span>O servidor confirmou: «${l.nome}» guardada.</span>`, undefined, true);
    depois?.();
  }, quieto() ? 200 : 900);
}
function enviar(lst: HTMLElement, destino: string): void {
  const b = lst.querySelector<HTMLButtonElement>('[data-enviar]'); if (!b) return;
  const repor = ocupado(b, 'A enviar…');
  window.setTimeout(() => {
    if (!b.isConnected) return;
    repor();
    const l = persistir(lst, 'enviada');
    const novo = mostrarLista(lst, listaHtml('enviada', structuredClone(l)), '.lst__faixa');
    const t = novo.querySelector('.lst__faixa--ok b'); if (t) t.textContent = `Lista enviada para ${destino}.`;
    avisar(novo, `${L(IC.send)}<span>Enviada para <b>${destino}</b>.</span>`, undefined, true);
  }, quieto() ? 200 : 1100);
}

/* ---------- diálogos, gaveta, pré-visualização ---------- */
type ComOrigem = HTMLElement & { _de?: HTMLElement | null };
/** Com uma gaveta, pré-visualização ou diálogo aberto, a página por baixo (barra, abas e lista) fica inerte. */
function inerte(r: HTMLElement, sim: boolean): void {
  r.querySelectorAll<HTMLElement>(':scope > .portal__topo, :scope > .portal__abas, :scope > .portal__lado, :scope > .lst').forEach((el) => { el.inert = sim; if (sim) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
function abrirDialogo(r: HTMLElement, tipo: string, de?: HTMLElement): void {
  const d = r.querySelector<ComOrigem>(`[data-dialogo="${tipo}"]`); if (!d) return;
  d.hidden = false; d._de = de; inerte(r, true);
  r.querySelectorAll<HTMLElement>('[data-gaveta], [data-previa-janela]').forEach((x) => { x.inert = true; });
  d.querySelector<HTMLElement>('input, [data-confirmar-eliminar], [data-confirmar-limpar], [data-guardar-sair], .btn')?.focus();
}
function fecharDialogo(d: ComOrigem): void {
  const r = d.closest<HTMLElement>('.portal--lista')!;
  d.hidden = true;
  r.querySelectorAll<HTMLElement>('[data-gaveta], [data-previa-janela]').forEach((x) => { x.inert = false; });
  if (!r.querySelector('[data-gaveta]:not([hidden]), [data-previa-janela]:not([hidden])')) inerte(r, false);
  d._de?.focus();
}
const naLista = (lst: HTMLElement) => Array.from(lst.querySelectorAll<HTMLElement>('.lst__linha--peca')).map((li) => li.dataset.ref ?? '');
function abrirGaveta(lst: HTMLElement, de: HTMLElement | null): void {
  const r = raizDe(lst), velha = r.querySelector('[data-gaveta]'); if (!velha) return;
  velha.outerHTML = gavetaHtml({ aberta: true, noLista: naLista(lst) });
  const g = r.querySelector<ComOrigem>('[data-gaveta]')!; g._de = de;
  inerte(r, true);
  g.querySelector<HTMLInputElement>('[data-procura]')!.focus();
}
function fecharGaveta(g: ComOrigem, devolver = true): void {
  const r = g.closest<HTMLElement>('.portal--lista')!;
  const caixa = g.querySelector<HTMLElement>('.lst__gaveta-caixa');
  const fim = () => { g.hidden = true; inerte(r, false); if (devolver) g._de?.focus(); };
  if (quieto() || !caixa) { fim(); return; }
  caixa.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(32px)', opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
  g.querySelector('.lst__veu')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished.then(fim);
}
/** Volta a pintar o que muda na gaveta (resultados, contagem, rodapé) sem a fechar nem perder o foco. */
function atualizarGaveta(g: HTMLElement, lst: HTMLElement, escolhida?: string): void {
  const inp = g.querySelector<HTMLInputElement>('[data-procura]')!, q = inp.value;
  const tmp = document.createElement('div');
  tmp.innerHTML = gavetaHtml({ aberta: true, q, escolhida, noLista: naLista(lst) });
  const novo = tmp.firstElementChild!;
  (['.lst__resultados', '.lst__g-conta'] as const).forEach((s) => { g.querySelector(s)!.innerHTML = novo.querySelector(s)!.innerHTML; });
  g.querySelector<HTMLElement>('.lst__usadas')!.hidden = !!q.trim();
  g.querySelector('.lst__g-vazio')?.remove();
  const vazio = novo.querySelector('.lst__g-vazio'); if (vazio) g.querySelector('.lst__resultados')!.after(vazio);
  g.querySelector('[data-g-pe]')!.outerHTML = novo.querySelector('[data-g-pe]')!.outerHTML;
  inp.setAttribute('aria-activedescendant', novo.querySelector('[data-procura]')!.getAttribute('aria-activedescendant') ?? '');
  g.querySelector('.lst__res[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
}
function adicionarEscolhida(g: ComOrigem, lst: HTMLElement): void {
  const sel = g.querySelector<HTMLElement>('.lst__res[aria-selected="true"]'); if (!sel) return;
  const qi = g.querySelector<HTMLInputElement>('.lst__g-q')!, q = ler(qi.value);
  if (!Number.isInteger(q) || q < 1) { qi.setAttribute('aria-invalid', 'true'); qi.focus(); qi.select(); return; }
  const r = REFERENCIAS.find((x) => x[2] === sel.dataset.ref)!;
  if (!quieto()) sel.animate([{ backgroundColor: 'var(--i3-azul-suave)' }, { backgroundColor: 'transparent' }], { duration: 300 });
  fecharGaveta(g, false);
  const ja = lst.querySelector<HTMLElement>(`.lst__linha--peca[data-ref="${CSS.escape(r[2])}"]`);
  if (ja) {
    /* a mesma referência: soma-se à linha que já existe */
    const inp = ja.querySelector<HTMLInputElement>('.lst__q')!, antes = inp.value, agoraQ = (ler(antes) || 0) + q;
    inp.value = num(agoraQ); validar(inp); acender(ja); recalcular(lst); sujar(lst);
    ja.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' }); inp.focus(); inp.select();
    avisar(lst, `${L(IC.check)}<span>Mais ${q} · <b>${r[1]} ${r[2]}</b> (agora ${num(agoraQ)}).</span>`, () => { inp.value = antes; validar(inp); recalcular(lst); }, true);
    return;
  }
  const ul = seccao(lst, 'peca').querySelector('.lst__linhas');
  const li = inserir(lst, 'peca', linhaPeca(doCatalogo(r, q), ul?.children.length ?? 0));
  li.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' });
  li.querySelector<HTMLInputElement>('.lst__q')?.focus(); li.querySelector<HTMLInputElement>('.lst__q')?.select();
  avisar(lst, `${L(IC.check)}<span><b>${r[1]} ${r[2]}</b> adicionada · ${plural(q, 'unidade', 'unidades')}.</span>`, () => remover(lst, li), true);
}
function abrirPrevia(lst: HTMLElement, de: HTMLElement): void {
  const r = raizDe(lst), velha = r.querySelector('[data-previa-janela]'); if (!velha) return;
  velha.outerHTML = previaHtml(lerLista(lst, true), true);
  const p = r.querySelector<ComOrigem>('[data-previa-janela]')!; p._de = de;
  inerte(r, true);
  p.querySelector<HTMLElement>('.lst__previa-barra [data-fechar-previa]')?.focus();
}
function fecharPrevia(p: ComOrigem): void {
  const r = p.closest<HTMLElement>('.portal--lista')!;
  const fim = () => { p.hidden = true; inerte(r, false); p._de?.focus(); };
  const caixa = p.querySelector<HTMLElement>('.lst__previa-caixa');
  if (quieto() || !caixa) { fim(); return; }
  caixa.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished.then(fim);
}

/* ---------- o editor do serviço ---------- */
function lerEditor(f: HTMLFormElement): { m?: Mao; erro?: [string, string] } {
  const v = (k: string) => (f.elements.namedItem(k) as HTMLInputElement).value;
  const modo = f.querySelector('[data-modo="fixo"]')?.getAttribute('aria-pressed') === 'true' ? 'fixo' : 'hora';
  const desc = v('desc').trim(), horas = modo === 'fixo' ? 1 : ler(v('horas')), preco = ler(v('preco')), d = v('d').trim() ? ler(v('d')) : 0;
  if (!desc) return { erro: ['desc', 'Escreve a descrição do serviço.'] };
  if (Number.isNaN(horas) || horas <= 0) return { erro: ['horas', 'As horas têm de ser acima de 0.'] };
  if (!v('preco').trim()) return { erro: ['preco', 'Falta o preço.'] };
  if (Number.isNaN(preco) || decimais(v('preco')) > 2) return { erro: ['preco', 'Preço em euros, 0 ou mais (ex.: 38,00).'] };
  if (Number.isNaN(d) || d > 100) return { erro: ['d', 'O desconto vai de 0 a 100 %.'] };
  return { m: { desc, modo, horas, preco, d } };
}
function totalEditor(f: HTMLFormElement): void {
  const r = lerEditor(f), b = f.querySelector('[data-editor-total]')!;
  b.textContent = r.m ? euros(totalMao(r.m)) : '— €';
}
function abrirEditor(lst: HTMLElement): void {
  const f = lst.querySelector<HTMLFormElement>('[data-editor-servico]'); if (!f) return;
  f.hidden = false;
  if (!quieto()) f.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: CURVA });
  (f.elements.namedItem('desc') as HTMLInputElement).focus();
}
function fecharEditor(f: HTMLFormElement): void {
  f.reset(); f.hidden = true;
  f.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
  (f.querySelector('[data-editor-erro]') as HTMLElement).hidden = true;
  modoEditor(f, 'hora'); totalEditor(f);
}
function modoEditor(f: HTMLFormElement, modo: 'hora' | 'fixo'): void {
  f.querySelectorAll('[data-modo]').forEach((b) => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.modo === modo)));
  (f.querySelector('[data-so-hora]') as HTMLElement).hidden = modo === 'fixo';
  f.querySelector('[data-rot-preco]')!.innerHTML = modo === 'fixo' ? 'Preço <small>sem IVA</small>' : 'Preço/hora <small>sem IVA</small>';
}

/* ---------- o menu «Mais ações» ---------- */
function menu(lst: HTMLElement, abrir?: boolean): void {
  const b = lst.querySelector<HTMLElement>('[data-mais]'), m = lst.querySelector<HTMLElement>('.lst__menu'); if (!b || !m) return;
  const sim = abrir ?? m.hidden;
  m.hidden = !sim; b.setAttribute('aria-expanded', String(sim));
  if (sim) m.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
}

/* ---------- vindas do Catálogo ---------- */
const CHAVE = 'goparts:lista:do-catalogo';
/** O Catálogo chama isto em «Adicionar à minha lista» / «Na minha lista». */
export function doCatalogoParaLista(ref: string, sim: boolean): void {
  try {
    const v: string[] = JSON.parse(sessionStorage.getItem(CHAVE) || '[]');
    const novo = sim ? [...v.filter((x) => x !== ref), ref] : v.filter((x) => x !== ref);
    sessionStorage.setItem(CHAVE, JSON.stringify(novo));
  } catch { /* sem sessionStorage: fica só o aviso no Catálogo */ }
}
function receberDoCatalogo(): void {
  const lst = vivo(); if (!lst || lst.dataset.vista !== 'editar' || lst.classList.contains('is-leitura')) return;
  let refs: string[] = [];
  try { refs = JSON.parse(sessionStorage.getItem(CHAVE) || '[]'); sessionStorage.removeItem(CHAVE); } catch { return; }
  const novas = refs.map((ref) => REFERENCIAS.find((x) => x[2] === ref)).filter((r): r is NonNullable<typeof r> => !!r && !lst.querySelector(`.lst__linha--peca[data-ref="${CSS.escape(r[2])}"]`));
  if (!novas.length) return;
  novas.forEach((r) => { const ul = seccao(lst, 'peca').querySelector('.lst__linhas'); inserir(lst, 'peca', linhaPeca(doCatalogo(r), ul?.children.length ?? 0)); });
  avisar(lst, `${L(IC.pkg)}<span>Do Catálogo: <b>${novas.map((r) => `${r[1]} ${r[2]}`).join(', ')}</b>.</span>`, undefined, true);
}

/* ---------- ligar ---------- */
let sairPara: string | null = null;
export function iniciar(): void {
  window.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element;
    const lst = vivo();
    /* sair com alterações por guardar (uma aba, «Ir ao Catálogo»…): pergunta antes (na captura, antes da navegação) */
    const ir = t.closest?.<HTMLElement>('[data-ir]');
    if (ir && lst?.dataset.sujo && ir.closest('.portal--lista') && !ir.closest('.lst__dialogo')) {
      ev.preventDefault(); ev.stopPropagation();
      const g = raizDe(lst).querySelector<ComOrigem>('[data-gaveta]:not([hidden])'); if (g) { g.hidden = true; inerte(raizDe(lst), false); }
      sairPara = ir.dataset.ir!; pendente = () => { if (sairPara) mostrar(sairPara); };
      abrirDialogo(raizDe(lst), 'sair', ir); return;
    }
    if (!lst || !t.closest?.('.portal--lista')) return;
    const r = raizDe(lst);
    if (!t.closest('.lst__mais')) menu(lst, false);

    /* os diálogos */
    const dlg = t.closest<ComOrigem>('.lst__dialogo');
    if (dlg) {
      if (t === dlg || t.closest('[data-fechar]')) { fecharDialogo(dlg); return; }
      if (t.closest('[data-sair]')) { dlg.hidden = true; inerte(r, false); lst.dataset.sujo = ''; const f = pendente; pendente = null; f?.(); return; }
      if (t.closest('[data-guardar-sair]')) { dlg.hidden = true; inerte(r, false); const f = pendente; pendente = null; guardar(lst, () => f?.()); return; }
      if (t.closest('[data-confirmar-limpar]')) {
        fecharDialogo(dlg);
        const antes = lerLista(lst), id = lst.dataset.lista;
        const novo = mostrarLista(lst, listaHtml('', { ...antes, id: id ?? '', pecas: [], mao: [], custos: [] }));
        sujar(novo);
        avisar(novo, `${L(IC.eraser)}<span>Limpaste «${antes.nome}». O nome e as notas ficaram.</span>`, () => { const v = mostrarLista(vivo()!, listaHtml('', antes)); sujar(v); });
        return;
      }
      if (t.closest('[data-confirmar-eliminar]')) {
        const b = t.closest<HTMLButtonElement>('[data-confirmar-eliminar]')!, repor = ocupado(b, 'A eliminar…');
        const nome = lerLista(lst).nome;
        window.setTimeout(() => {
          repor(); dlg.hidden = true; inerte(r, false);
          const i = LISTAS.findIndex((x) => x.id === lst.dataset.lista); if (i >= 0) LISTAS.splice(i, 1);
          lst.dataset.sujo = '';
          avisar(verListas(lst), `${L(IC.trash)}<span>«${nome}» foi eliminada.</span>`);
        }, quieto() ? 200 : 800);
        return;
      }
      if (t.closest('[data-confirmar-enviar]')) {
        const dest = dlg.querySelector<HTMLInputElement>('[data-destino]')!;
        if (!/^\S+@\S+\.\S+$/.test(dest.value)) { dest.setAttribute('aria-invalid', 'true'); dest.focus(); return; }
        fecharDialogo(dlg); enviar(lst, dest.value.trim()); return;
      }
      return;
    }
    /* a gaveta */
    const g = t.closest<ComOrigem>('[data-gaveta]');
    if (g) {
      if (t.closest('[data-fechar-gaveta]')) { fecharGaveta(g); return; }
      if (t.closest('[data-adicionar-escolhida]')) { adicionarEscolhida(g, lst); return; }
      if (t.closest('[data-limpar-procura]')) { const i = g.querySelector<HTMLInputElement>('[data-procura]')!; i.value = ''; atualizarGaveta(g, lst); i.focus(); return; }
      const ch = t.closest<HTMLElement>('[data-escolher]');
      if (ch) { const i = g.querySelector<HTMLInputElement>('[data-procura]')!; i.value = ch.dataset.escolher!; atualizarGaveta(g, lst, ch.dataset.escolher); g.querySelector<HTMLInputElement>('.lst__g-q')?.focus(); return; }
      const qb = t.closest<HTMLElement>('.lst__qtd-b');
      if (qb) { const i = qb.parentElement!.querySelector<HTMLInputElement>('input')!; i.value = String(Math.max(1, (ler(i.value) || 0) + Number(qb.dataset.passo))); i.removeAttribute('aria-invalid'); return; }
      const res = t.closest<HTMLElement>('.lst__res');
      if (res) { atualizarGaveta(g, lst, res.dataset.ref); if (ev.detail >= 2) adicionarEscolhida(g, lst); return; }
      return;
    }
    /* a pré-visualização */
    const p = t.closest<ComOrigem>('[data-previa-janela]');
    if (p) { if (t.closest('[data-fechar-previa]')) fecharPrevia(p); else if (t.closest('[data-imprimir]')) window.print(); return; }

    /* Minhas listas */
    const abrir = t.closest<HTMLElement>('[data-abrir-lista]');
    if (abrir) { const l = LISTAS.find((x) => x.id === abrir.dataset.abrirLista); if (l) seGuardado(lst, abrir, () => abrirLista(vivo()!, l)); return; }
    const dupL = t.closest<HTMLElement>('[data-duplicar-lista]');
    if (dupL) {
      menu(lst, false);
      const base = lst.dataset.vista === 'editar' ? lerLista(lst) : LISTAS.find((x) => x.id === dupL.dataset.duplicarLista);
      if (!base) return;
      seGuardado(lst, dupL, () => {
        const copia: Lista = { ...structuredClone(base), id: '', nome: `${base.nome} (cópia)`, estado: 'nova', criada: 'hoje', atualizada: 'ainda não guardada' };
        const novo = mostrarLista(vivo()!, listaHtml('', copia));
        avisar(novo, `${L(IC.copy)}<span>Cópia de «${base.nome}». A original não muda; guarda a cópia para ficar em «Minhas listas».</span>`, undefined, true);
      });
      return;
    }
    if (t.closest('[data-nova-lista]')) { menu(lst, false); seGuardado(lst, t.closest<HTMLElement>('[data-nova-lista]')!, () => mostrarLista(vivo()!, listaHtml('', NOVA()))); return; }
    if (t.closest('[data-ver-listas]')) { seGuardado(lst, t.closest<HTMLElement>('[data-ver-listas]')!, () => verListas(vivo()!)); return; }
    const fil = t.closest<HTMLElement>('[data-filtro-estado]');
    if (fil) { lst.querySelectorAll('[data-filtro-estado]').forEach((b) => b.setAttribute('aria-pressed', String(b === fil))); filtrarListas(lst); return; }

    /* o cabeçalho */
    if (t.closest('[data-mais]')) { menu(lst); return; }
    if (t.closest('[data-guardar]')) { guardar(lst); return; }
    if (t.closest('[data-limpar]')) { menu(lst, false); abrirDialogo(r, 'limpar', lst.querySelector<HTMLElement>('[data-mais]')!); return; }
    if (t.closest('[data-eliminar]')) { menu(lst, false); abrirDialogo(r, 'eliminar', lst.querySelector<HTMLElement>('[data-mais]')!); return; }
    if (t.closest('[data-carrinho]')) {
      menu(lst, false);
      const c = contas(lerLista(lst, true)), fora = lerLista(lst).pecas.length - c.noCarrinho;
      if (!c.noCarrinho) { avisar(lst, `${L(IC.alert)}<span>Nenhuma peça com preço e stock para pôr no carrinho.</span>`); return; }
      lerLista(lst, true).pecas.filter((p) => p.pvp !== null && (p.porto ?? 0) + (p.sacavem ?? 0) > 0).forEach((p) => { void carrinho.adicionar(p.ref, p.qtd); });
      avisar(lst, `${L(IC.cart)}<span>${plural(c.noCarrinho, 'peça', 'peças')} no carrinho${fora ? `; ${fora === 1 ? 'fica 1 peça' : `ficam ${fora} peças`} na lista (sem preço, sem stock ou por corrigir)` : ''}.</span>`, undefined, true);
      return;
    }
    /* o resumo */
    const env = t.closest<HTMLElement>('[data-enviar]'); if (env) { abrirDialogo(r, 'enviar', env); return; }
    const pv = t.closest<HTMLElement>('[data-previa]'); if (pv) { abrirPrevia(lst, pv); return; }
    const vr = t.closest<HTMLElement>('[data-ver-resumo]');
    if (vr) { lst.classList.add('is-resumo-aberto'); vr.setAttribute('aria-expanded', 'true'); lst.querySelector<HTMLElement>('[data-fechar-resumo]')?.focus(); return; }
    if (t.closest('[data-fechar-resumo]')) { lst.classList.remove('is-resumo-aberto'); const b = lst.querySelector<HTMLElement>('[data-ver-resumo]'); b?.setAttribute('aria-expanded', 'false'); b?.focus(); return; }

    /* as secções */
    const add = t.closest<HTMLElement>('[data-adicionar]');
    if (add) {
      const tipo = add.dataset.adicionar as Tipo;
      if (tipo === 'peca') abrirGaveta(lst, add);
      else if (tipo === 'mao') abrirEditor(lst);
      else { const li = inserir(lst, 'custo', linhaCusto({ desc: '', valor: 0 }, seccao(lst, 'custo').querySelectorAll('.lst__linha').length)); li.querySelector<HTMLInputElement>('.lst__texto')?.focus(); }
      return;
    }
    const f = t.closest<HTMLFormElement>('[data-editor-servico]');
    if (f) {
      if (t.closest('[data-cancelar-servico]')) { fecharEditor(f); seccao(lst, 'mao').querySelector<HTMLElement>('[data-adicionar]')?.focus(); return; }
      const sug = t.closest<HTMLElement>('[data-sugestao]'); if (sug) { const d = f.elements.namedItem('desc') as HTMLInputElement; d.value = sug.dataset.sugestao!; d.removeAttribute('aria-invalid'); (f.elements.namedItem('preco') as HTMLInputElement).focus(); totalEditor(f); return; }
      const m = t.closest<HTMLElement>('[data-modo]'); if (m) { modoEditor(f, m.dataset.modo as 'hora' | 'fixo'); totalEditor(f); return; }
      return;
    }
    const li = t.closest<HTMLElement>('.lst__linha');
    if (li && !lst.classList.contains('is-leitura')) {
      const q = t.closest<HTMLElement>('.lst__qtd-b');
      if (q) {
        const inp = q.parentElement!.querySelector<HTMLInputElement>('input')!, v = ler(inp.value), passo = li.dataset.tipo === 'mao' ? 0.5 : 1;
        inp.value = num(Math.max(passo, (Number.isNaN(v) ? 0 : v) + Number(q.dataset.passo) * passo));
        validar(inp); recalcular(lst); sujar(lst); return;
      }
      const mb = t.closest<HTMLElement>('.lst__modo [data-modo]');
      if (mb && li.dataset.tipo === 'mao' && li.dataset.modo !== mb.dataset.modo) {
        const x = lerLinha(li).mao!, i = Array.from(li.parentElement!.children).indexOf(li);
        li.outerHTML = linhaMao({ ...x, modo: mb.dataset.modo as Mao['modo'], horas: Number.isNaN(x.horas) ? 1 : x.horas, preco: Number.isNaN(x.preco) ? 0 : x.preco, d: Number.isNaN(x.d) ? 0 : x.d }, i);
        const novo = seccao(lst, 'mao').querySelectorAll<HTMLElement>('.lst__linha')[i];
        novo.querySelector<HTMLElement>(`.lst__modo [data-modo="${mb.dataset.modo}"]`)?.focus();
        recalcular(lst); sujar(lst); return;
      }
      if (t.closest('[data-remover]')) { remover(lst, li); return; }
      if (t.closest('[data-duplicar]')) { const tipo = li.dataset.tipo as Tipo, i = Array.from(li.parentElement!.children).indexOf(li); const novo = inserir(lst, tipo, li.outerHTML.replace(' is-nova', ''), i + 1); novo.querySelector<HTMLElement>('[data-duplicar]')?.focus(); return; }
    }
  }, true);

  document.addEventListener('submit', (ev) => {
    const f = ev.target as HTMLFormElement, lst = vivo();
    if (!lst || !f.matches?.('[data-editor-servico]') || !lst.contains(f)) return;
    ev.preventDefault();
    const r = lerEditor(f), err = f.querySelector<HTMLElement>('[data-editor-erro]')!;
    f.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    if (r.erro) { const c = f.elements.namedItem(r.erro[0]) as HTMLInputElement; c.setAttribute('aria-invalid', 'true'); err.innerHTML = `${L(IC.alert)}${r.erro[1]}`; err.hidden = false; c.focus(); return; }
    err.hidden = true;
    const li = inserir(lst, 'mao', linhaMao(r.m!, seccao(lst, 'mao').querySelectorAll('.lst__linha').length));
    fecharEditor(f);
    seccao(lst, 'mao').querySelector<HTMLElement>('.lst__seccao-cabeca [data-adicionar]')?.focus();
    avisar(lst, `${L(IC.check)}<span>Serviço adicionado: <b>${r.m!.desc}</b>.</span>`, () => remover(lst, li), true);
  });

  document.addEventListener('input', (ev) => {
    const inp = ev.target as HTMLInputElement, lst = vivo();
    if (!lst || !inp.closest?.('.portal--lista') || inp.closest('.portal--lista') !== raizDe(lst)) return;
    if (inp.matches('[data-procura]')) { atualizarGaveta(inp.closest<HTMLElement>('[data-gaveta]')!, lst); return; }
    if (inp.matches('.lst__g-q')) { inp.removeAttribute('aria-invalid'); return; }
    if (inp.matches('[data-destino]')) { inp.removeAttribute('aria-invalid'); return; }
    if (inp.matches('[data-procura-listas]')) { filtrarListas(lst); return; }
    const f = inp.closest<HTMLFormElement>('[data-editor-servico]'); if (f) { inp.removeAttribute('aria-invalid'); totalEditor(f); return; }
    if (inp.matches('.lst__linha .lst__num')) { validar(inp); recalcular(lst); }
    if (inp.matches('[data-nome], [data-notas], .lst__linha input')) sujar(lst);
  });
  /* ao sair do campo, o preço fica com dois decimais (só se for válido; um valor errado fica como foi escrito) */
  document.addEventListener('focusout', (ev) => {
    const i = ev.target as HTMLInputElement;
    if (i.matches?.('.lst .lst__linha .lst__pvp:not([readonly])') && !i.hasAttribute('aria-invalid')) { const v = ler(i.value); if (!Number.isNaN(v)) i.value = dinheiro(v); }
  });
  document.addEventListener('keydown', (ev) => {
    const lst = vivo(); if (!lst || editando()) return;
    const r = raizDe(lst), el = ev.target as HTMLElement;
    if (ev.key === 'Escape') {
      const d = r.querySelector<ComOrigem>('.lst__dialogo:not([hidden])'); if (d) { fecharDialogo(d); return; }
      const p = r.querySelector<ComOrigem>('[data-previa-janela]:not([hidden])'); if (p) { fecharPrevia(p); return; }
      const g = r.querySelector<ComOrigem>('[data-gaveta]:not([hidden])'); if (g) { fecharGaveta(g); return; }
      if (!lst.querySelector('.lst__menu')?.hasAttribute('hidden')) { menu(lst, false); lst.querySelector<HTMLElement>('[data-mais]')?.focus(); return; }
      if (lst.classList.contains('is-resumo-aberto')) { lst.classList.remove('is-resumo-aberto'); lst.querySelector<HTMLElement>('[data-ver-resumo]')?.focus(); return; }
      const f = el.closest?.<HTMLFormElement>('[data-editor-servico]'); if (f) { fecharEditor(f); return; }
    }
    if (lst.dataset.vista !== 'editar') return;
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); guardar(lst); return; }
    if (ev.altKey && ev.key.toLowerCase() === 'a' && !lst.classList.contains('is-leitura') && !r.querySelector('[data-gaveta]:not([hidden]), .lst__dialogo:not([hidden])')) { ev.preventDefault(); abrirGaveta(lst, lst.querySelector<HTMLElement>('[data-adicionar="peca"]')); return; }
    /* o menu: ↑ ↓ entre as opções */
    if (el.matches?.('.lst__menu [role="menuitem"]') && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      ev.preventDefault();
      const itens = Array.from(lst.querySelectorAll<HTMLElement>('.lst__menu [role="menuitem"]:not(:disabled)')), i = itens.indexOf(el);
      itens[(i + (ev.key === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length].focus(); return;
    }
    /* a gaveta: ↑ ↓ escolhem, Enter adiciona */
    if (el.matches?.('[data-procura], .lst__g-q')) {
      const g = el.closest<ComOrigem>('[data-gaveta]')!, ops = Array.from(g.querySelectorAll<HTMLElement>('.lst__res'));
      if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && ops.length && el.matches('[data-procura]')) {
        ev.preventDefault();
        const i = ops.findIndex((o) => o.getAttribute('aria-selected') === 'true'), j = (i + (ev.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length;
        atualizarGaveta(g, lst, ops[j].dataset.ref); return;
      }
      if (ev.key === 'Enter') { ev.preventDefault(); adicionarEscolhida(g, lst); return; }
    }
    /* Enter e ↑ ↓ nos campos das linhas: o mesmo campo na linha de baixo ou de cima */
    if (el.matches?.('.lst__linha .lst__num, .lst__linha .lst__texto') && (ev.key === 'Enter' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      const li = el.closest('.lst__linha')!, cls = Array.from(el.classList).find((c) => c !== 'lst__num')!;
      const outra = (ev.key === 'ArrowUp' ? li.previousElementSibling : li.nextElementSibling)?.querySelector<HTMLInputElement>(`.${cls}`);
      if (outra) { ev.preventDefault(); outra.focus(); outra.select(); }
    }
  });
  /* a gaveta e a pré-visualização prendem o foco (Tab dá a volta dentro) */
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Tab') return;
    const lst = vivo(); if (!lst) return;
    const caixa = raizDe(lst).querySelector<HTMLElement>('.lst__dialogo:not([hidden]) .lst__dialogo-caixa, [data-previa-janela]:not([hidden]) .lst__previa-caixa, [data-gaveta]:not([hidden]) .lst__gaveta-caixa');
    if (!caixa) return;
    const f = Array.from(caixa.querySelectorAll<HTMLElement>('button:not(:disabled), input:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const primeiro = f[0], ultimo = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
    else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
  });
  /* fechar a janela com alterações por guardar */
  window.addEventListener('beforeunload', (ev) => { if (vivo()?.dataset.sujo) ev.preventDefault(); });
  /* ao chegar à lista: as contas certas e o que veio do Catálogo */
  const armar = () => {
    let lst = vivo(); if (!lst) return;
    /* (16 out.) pedidos da barra de topo: abrir uma lista guardada, ou «Minhas listas» */
    let abrirId = '', vista = '';
    try { abrirId = sessionStorage.getItem('goparts:lista-abrir') || ''; vista = sessionStorage.getItem('goparts:lista-vista') || ''; sessionStorage.removeItem('goparts:lista-abrir'); sessionStorage.removeItem('goparts:lista-vista'); } catch { /* nada */ }
    const pedida = LISTAS.find((l) => l.id === abrirId);
    /* sem a pessoa ter mexido nela, troca logo; com alterações feitas aqui, pergunta antes */
    const atual = lst, guarda = (f: () => void) => (atual.dataset.mexida ? seGuardado(atual, atual, f) : f());
    if (pedida) guarda(() => abrirLista(vivo()!, pedida));
    else if (vista === 'listas' && lst.dataset.vista !== 'listas') guarda(() => verListas(vivo()!));
    /* (16 out.) o atalho «Criar lista» do Início */
    else if (vista === 'nova') guarda(() => mostrarLista(vivo()!, listaHtml('', NOVA())));
    lst = vivo()!;
    if (!lst.dataset.armada) { lst.dataset.armada = '1'; recalcular(lst); }
    receberDoCatalogo();
  };
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  requestAnimationFrame(armar);
}

function filtrarListas(lst: HTMLElement): void {
  const q = (lst.querySelector<HTMLInputElement>('[data-procura-listas]')?.value ?? '').trim().toLowerCase();
  const est = lst.querySelector<HTMLElement>('[data-filtro-estado][aria-pressed="true"]')?.dataset.filtroEstado ?? '';
  let vis = 0;
  lst.querySelectorAll<HTMLElement>('.lst__l').forEach((li) => {
    const l = LISTAS.find((x) => x.id === li.querySelector<HTMLElement>('[data-abrir-lista]')?.dataset.abrirLista);
    const texto = `${li.textContent} ${l?.pecas.map((p) => `${p.marca} ${p.ref}`).join(' ') ?? ''}`.toLowerCase();
    li.hidden = (!!q && !texto.includes(q)) || (!!est && li.dataset.estadoLista !== est);
    if (!li.hidden) vis++;
  });
  const v = lst.querySelector<HTMLElement>('[data-listas-vazio]'); if (v) v.hidden = vis > 0;
}
