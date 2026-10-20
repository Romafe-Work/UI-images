/* =========================================================
   GOPARTS — 10 · Início: o que mexe no espaço de trabalho (16 out. 2026)
   O desenho está em portal/inicio-espaco.ts; a pesquisa dos três cartões continua em inicio-v3.ts.
   - Os dados da pessoa (preferências, garagem, o que fez, peças favoritas) ficam no navegador por conta
     (localStorage); num servidor, vêm do perfil. O carrinho é o do portal (carrinho.ts).
   - Ao abrir, o Início desenha os blocos com esses dados, pela ordem e com a densidade escolhidas.
   - Entrada (uma vez por sessão): saudação, pesquisa e blocos aparecem em sequência (opacidade e 8 px, 300 ms);
     os que estão abaixo da dobra aparecem quando entram no ecrã (IntersectionObserver), uma só vez. O conteúdo
     está lá desde o início: a animação não atrasa nada. Com «reduzir movimento», nada se mexe.
   - Tudo o que muda de sítio desliza (FLIP: só transform); nada anima a largura ou a altura no fluxo.
   - Identificar (matrícula ou VIN): o rolamento no botão; o veículo aparece por baixo, com os dados um a um.
   - Encomendas: os contadores filtram (a marca desliza); cada uma abre o percurso; «Repetir encomenda» procura
     cada artigo no catálogo de hoje e só põe no carrinho o que lá está, com o preço atual.
   - Garagem: favorito (as favoritas passam para a frente), mudar o nome, tirar (com «Desfazer»), adicionar.
   - Personalizar: mostrar e esconder blocos, arrastar a ordem (a peça levanta, as outras afastam-se, o lugar
     fica marcado e assenta com mola; o Início atrás reorganiza-se ao mesmo tempo), ↑ ↓ na pega, densidade,
     pesquisa ao abrir, atalhos (até 6), repor.
   ========================================================= */
import { mostrar } from '../../../comum/ecras';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import * as carrinho from './carrinho';
import { REFERENCIAS } from '../portal/catalogo-dados';
import {
  PREFS, CHAVE_PREFS, GARAGEM, CHAVE_GARAGEM, CHAVE_ATIVIDADE, CHAVE_FAVORITAS, FAVORITAS, IDENTIFICADOS, VINS, BLOCOS,
  atividadeInicial, normalizarMatricula, nomeCarro, olaHtml, veiculoHtml, naoEncontradoHtml, encomendasHtml, continuarHtml, garagemHtml,
  atalhosHtml, frequentesHtml, personalizarHtml, atencaoHtml, resumoHtml, repetirHtml, repetirDe, dispCorpo, saudacao, L, IC,
  type Prefs, type Carro, type Atividade, type IdBloco, type IdAtalho, type Dados,
} from '../portal/inicio-espaco';

const editando = () => document.body.classList.contains('editando');
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOLA = 'cubic-bezier(.2, .9, .25, 1.05)', CURVA = 'cubic-bezier(.22, 1, .36, 1)';
const vivo = () => document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ini4');
const ler = <T,>(k: string, v: T): T => { try { const x = localStorage.getItem(k); return x === null ? v : JSON.parse(x) as T; } catch { return v; } };
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento: fica só nesta página */ } };
/** Num estado do protótipo (10.x), mexe-se no ecrã mas não se grava nada. */
const real = (ini: HTMLElement | null) => !!ini && !ini.dataset.estado;

function prefs(): Prefs {
  const p = ler<Partial<Prefs>>(CHAVE_PREFS, {});
  const ordem = (p.ordem ?? []).filter((b) => b in BLOCOS);
  PREFS.ordem.forEach((b) => { if (!ordem.includes(b)) ordem.push(b); });
  return { ...structuredClone(PREFS), ...p, ordem };
}
const garagem = () => ler<Carro[]>(CHAVE_GARAGEM, structuredClone(GARAGEM));
const atividade = () => ler<Atividade[]>(CHAVE_ATIVIDADE, atividadeInicial());
const favoritas = () => ler<string[]>(CHAVE_FAVORITAS, [...FAVORITAS]);
const dados = (): Dados => ({ prefs: prefs(), garagem: garagem(), atividade: atividade(), favoritas: favoritas(), carrinho: carrinho.unidades(), agora: Date.now() });
/** A pesquisa com que o Início abre: a escolhida em Personalizar, ou null (a última usada). */
export const modoPreferido = (): number | null => { const m = prefs().modo; return m >= 0 ? m : null; };

/* =========================================================
   Ajudas: deslizar (FLIP), aviso, botão a carregar
   ========================================================= */
function flip(els: Iterable<HTMLElement>, mudar: () => void, dur = 320, curva = MOLA): void {
  const lista = Array.from(els);
  if (quieto()) { mudar(); return; }
  const antes = new Map(lista.map((el) => [el, el.getBoundingClientRect()]));
  mudar();
  lista.forEach((el) => {
    const a = antes.get(el)!; if (!el.isConnected || el.hidden || !a.height) return;
    const b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: dur, easing: curva });
  });
}
const entrar = (el: Element, dur = 260, de = 'translateY(8px)') => { if (!quieto()) el.animate([{ opacity: 0, transform: de }, { opacity: 1, transform: 'none' }], { duration: dur, easing: CURVA }); };
const blocos = (ini: HTMLElement) => ini.querySelectorAll<HTMLElement>('.ini4__bloco');

let brindeT = 0;
function brinde(ini: HTMLElement, html: string, desfazer?: () => void, erro = false): void {
  const b = ini.closest('.portal--ini4')?.querySelector<HTMLElement>('.ini4__brinde'); if (!b) return;
  b.classList.toggle('is-erro', erro);
  b.innerHTML = `${L(erro ? IC.triangleAlert : IC.check, 'ini4__brinde-icone')}<span class="ini4__brinde-texto">${html}</span>${desfazer ? `<button type="button" class="btn ini4__btn" data-desfazer>${L(IC.rotateCcw, 'btn__icone')}<span class="btn__rotulo">Desfazer</span></button>` : ''}`;
  b.hidden = false; entrar(b, 220, 'translateY(12px)');
  b.querySelector('[data-desfazer]')?.addEventListener('click', () => { desfazer?.(); b.hidden = true; }, { once: true });
  window.clearTimeout(brindeT); brindeT = window.setTimeout(() => { b.hidden = true; }, desfazer ? 6000 : 4200);
}
/** Um botão em carregamento: o rolamento no lugar do ícone; devolve a função que o repõe. */
function aCarregar(b: HTMLElement, texto: string): () => void {
  const antes = b.innerHTML;
  b.setAttribute('aria-busy', 'true'); (b as HTMLButtonElement).disabled = true;
  b.innerHTML = `${rolamentoSvg('i4-c-' + Date.now(), 'pesquisar', 'btn__icone')}<span class="btn__rotulo">${texto}</span>`;
  return () => { b.innerHTML = antes; b.removeAttribute('aria-busy'); (b as HTMLButtonElement).disabled = false; };
}
const espera = (ms: number) => new Promise((r) => window.setTimeout(r, quieto() ? Math.min(ms, 150) : ms));
import { irFiltrado } from './filtro-chegada';
function ir(id: string, chave?: string, valor?: string): void { if (chave) try { sessionStorage.setItem(chave, valor ?? ''); } catch { /* abre só o ecrã */ } mostrar(id); }
const barra = (tipo: string) => document.querySelector<HTMLElement>(`.ecra:not([hidden]) > .versao:not([hidden]) [data-barra="${tipo}"]:not([hidden])`)?.click();

/* =========================================================
   O que se fez
   ========================================================= */
function registar(a: Omit<Atividade, 'quando'>): void {
  const ini = vivo(); if (ini && !real(ini)) return;
  const l = atividade().filter((x) => !(x.tipo === a.tipo && x.titulo === a.titulo));
  l.unshift({ ...a, quando: Date.now() }); gravar(CHAVE_ATIVIDADE, l.slice(0, 20));
}
function abrirVeiculoNoCatalogo(c: Pick<Carro, 'marca' | 'modelo' | 'matricula'> & Partial<Carro>, grupo = ''): void {
  registar({ tipo: 'veiculo', titulo: nomeCarro({ id: '', ano: 0, v: 0, ...c } as Carro), sub: `${grupo || 'Peças compatíveis'} · ${c.matricula}`, dados: { matricula: c.matricula } });
  ir('catalogo', 'goparts:catalogo-abrir', JSON.stringify({ tipo: 'modelo', marca: c.marca, modelo: c.modelo }));
}

/* =========================================================
   Desenhar os blocos com os dados da pessoa
   ========================================================= */
function trocar(ini: HTMLElement, id: IdBloco, html: string): HTMLElement | null {
  const velho = ini.querySelector<HTMLElement>(`[data-bloco="${id}"]`); if (!velho) return null;
  const t = document.createElement('template'); t.innerHTML = html.trim();
  const novo = t.content.firstElementChild as HTMLElement; velho.replaceWith(novo); return novo;
}
function desenhar(ini: HTMLElement): void {
  const d = dados();
  ini.dataset.densidade = d.prefs.densidade;
  ini.querySelector('[data-blocos]')?.setAttribute('data-densidade', d.prefs.densidade);
  const ola = ini.querySelector('.ini4__ola'); if (ola) { const t = document.createElement('template'); t.innerHTML = olaHtml(d).trim(); ola.replaceWith(t.content.firstElementChild!); }
  const escolhida = ini.querySelector<HTMLElement>('.ini4__veiculo-caixa[data-matricula]')?.dataset.matricula ?? '';
  trocar(ini, 'atencao', atencaoHtml(d)); trocar(ini, 'resumo', resumoHtml(d)); trocar(ini, 'atalhos', atalhosHtml(d)); trocar(ini, 'continuar', continuarHtml(d)); trocar(ini, 'garagem', garagemHtml(d, '', escolhida)); trocar(ini, 'frequentes', frequentesHtml(d));
  aplicarPrefs(ini, d.prefs);
}
function aplicarPrefs(ini: HTMLElement, p: Prefs): void {
  ini.dataset.densidade = p.densidade;
  ini.querySelector('[data-blocos]')?.setAttribute('data-densidade', p.densidade);
  blocos(ini).forEach((b) => { const id = b.dataset.bloco as IdBloco; b.style.order = String(p.ordem.indexOf(id)); b.hidden = p.escondidos.includes(id); });
}

/* ---------- a entrada: uma vez por sessão; os de baixo quando aparecem ---------- */
let observador: IntersectionObserver | null = null;
function entrada(ini: HTMLElement): void {
  if (quieto() || ini.dataset.estado || editando()) return;
  try { if (sessionStorage.getItem('goparts:inicio-entrou')) return; sessionStorage.setItem('goparts:inicio-entrou', '1'); } catch { return; }
  const alto = window.innerHeight;
  const partes = [ini.querySelector('.ini4__ola'), ini.querySelector('.ini3__pesquisa'), ...Array.from(blocos(ini)).filter((b) => !b.hidden).sort((a, b) => Number(a.style.order) - Number(b.style.order))].filter(Boolean) as HTMLElement[];
  observador?.disconnect();
  observador = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { entrar(e.target, 320); observador!.unobserve(e.target); } }), { threshold: .12 });
  let k = 0;
  partes.forEach((el) => {
    if (el.getBoundingClientRect().top < alto) el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 60 * k++, easing: CURVA, fill: 'backwards' });
    else observador!.observe(el);
  });
}

/* =========================================================
   Identificar o veículo (o cartão «Identificar veículo» da pesquisa)
   ========================================================= */
function erroCampo(card: HTMLElement, id: string, texto: string): void {
  const inp = card.querySelector<HTMLInputElement>(`#${id}`)!, campo = inp.closest<HTMLElement>('.ini3__campo')!;
  campo.classList.add('is-erro'); inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', `${id}-erro`);
  let p = campo.querySelector<HTMLElement>('.ini3__erro');
  if (!p) { p = document.createElement('p'); p.className = 'ini3__erro'; p.id = `${id}-erro`; campo.appendChild(p); }
  p.innerHTML = `<span class="ini3__erro-icone">${L(IC.triangleAlert)}</span><span>${texto}</span>`;
  inp.focus();
}
function limparErros(card: HTMLElement): void {
  card.querySelectorAll('.ini3__campo.is-erro').forEach((c) => { c.classList.remove('is-erro'); c.querySelector('.ini3__erro')?.remove(); const i = c.querySelector('input'); i?.removeAttribute('aria-invalid'); i?.removeAttribute('aria-describedby'); });
  card.querySelector('.ini3__resumo')?.remove();
}
/** Pesquisar no cartão Identificar: com matrícula ou VIN, identifica aqui; só com descrição ou motor, segue para o Catálogo. */
export function identificar(card: HTMLElement): boolean {
  const ini = card.closest<HTMLElement>('.ini4'); if (!ini) return false;
  const mat = card.querySelector<HTMLInputElement>('#i3-matricula')?.value.trim() ?? '', vin = (card.querySelector<HTMLInputElement>('#i3-chassis')?.value ?? '').trim().toUpperCase().replace(/\s/g, '');
  if (!mat && !vin) return false;
  limparErros(card);
  if (mat && !normalizarMatricula(mat)) { erroCampo(card, 'i3-matricula', '<b>A matrícula não está completa.</b> O formato é AA-00-AA (6 letras ou números).'); return true; }
  if (!mat && vin.length !== 17) { erroCampo(card, 'i3-chassis', `<b>${vin.length < 17 ? `Faltam ${17 - vin.length} caracteres` : `Tem ${vin.length - 17} caracteres a mais`}.</b> O VIN tem 17 letras e números.`); return true; }
  const m = mat ? normalizarMatricula(mat) : VINS[vin] ?? '';
  const b = card.querySelector<HTMLElement>('[data-pesquisar]'); if (!b || b.getAttribute('aria-busy')) return true;
  const repor = aCarregar(b, 'A identificar…');
  void espera(700).then(() => { repor(); const id = IDENTIFICADOS[m]; mostrarVeiculo(ini, id ? { id: '', matricula: m, ...id } : null, mat ? m : vin, mat ? 'matrícula' : 'n.º de chassis'); });
  return true;
}
function mostrarVeiculo(ini: HTMLElement, c: Carro | null, procurado: string, origem: string): void {
  const sitio = ini.querySelector<HTMLElement>('[data-veiculo]'); if (!sitio) return;
  const naGaragem = !!c && garagem().some((g) => g.matricula === c.matricula);
  flip(blocos(ini), () => { sitio.innerHTML = c ? veiculoHtml(c, naGaragem, origem) : naoEncontradoHtml(procurado); sitio.hidden = false; });
  entrar(sitio.firstElementChild!, 320, 'translateY(10px) scale(.99)');
  ini.querySelectorAll('.ini4__carro').forEach((x) => x.classList.toggle('is-escolhido', !!c && (x as HTMLElement).dataset.matricula === c.matricula));
  const aviso = ini.closest('.portal--ini4')?.querySelector('.ini3__aviso'); if (aviso) aviso.textContent = c ? `Veículo identificado: ${nomeCarro(c)}, ${c.ano}.` : `Nenhum veículo com ${procurado}.`;
  if (c) {
    registar({ tipo: 'veiculo', titulo: nomeCarro(c), sub: `Identificado · ${c.matricula}`, dados: { matricula: c.matricula } });
    const g = garagem(), x = g.find((q) => q.matricula === c.matricula);
    if (x && real(ini)) { x.quando = 'hoje'; gravar(CHAVE_GARAGEM, g); }
  }
  sitio.querySelector<HTMLElement>(c ? '[data-pecas-matricula]' : '[data-ir-modo]')?.focus({ preventScroll: true });
  const r = sitio.getBoundingClientRect(); if (r.bottom > window.innerHeight) sitio.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' });
}
function fecharVeiculo(ini: HTMLElement): void {
  const sitio = ini.querySelector<HTMLElement>('[data-veiculo]'); if (!sitio || sitio.hidden) return;
  flip(blocos(ini), () => { sitio.hidden = true; sitio.innerHTML = ''; });
  ini.querySelectorAll('.ini4__carro.is-escolhido').forEach((x) => x.classList.remove('is-escolhido'));
  ini.querySelector<HTMLInputElement>('#i3-matricula')?.focus({ preventScroll: true });
}
/** Usar um veículo da garagem na pesquisa: vai ao modo Identificar, escreve a matrícula e identifica. */
function usarNaPesquisa(ini: HTMLElement, matricula: string): void {
  ini.querySelector<HTMLElement>('.ini3__separador[data-modo="0"]')?.click();
  const card = ini.querySelector<HTMLElement>('#i3-cartao-identificar'); if (!card) return;
  card.querySelectorAll<HTMLInputElement>('input').forEach((i) => { i.value = ''; });
  card.querySelector<HTMLInputElement>('#i3-matricula')!.value = matricula;
  ini.querySelector('.ini3__pesquisa')?.scrollIntoView({ block: 'start', behavior: quieto() ? 'auto' : 'smooth' });
  identificar(card);
}
/** Antes de seguir para o Catálogo (Selecionar e Referência): diz-lhe o que abrir e regista o que se fez. */
export function prepararCatalogo(card: HTMLElement): void {
  if (card.id === 'i3-cartao-referencia') {
    const q = (card.querySelector<HTMLInputElement>('#i3-referencia')?.value ?? '').trim().toUpperCase();
    const r = REFERENCIAS.find((x) => q && (`${x[1]} ${x[2]}`.toUpperCase() === q || x[2].toUpperCase() === q || x[2].replace(/\s/g, '') === q.replace(/\s/g, '')));
    if (r) { registar({ tipo: 'ref', titulo: `${r[1]} ${r[2]}`, sub: r[3], dados: { fab: r[1], ref: r[2] } }); try { sessionStorage.setItem('goparts:catalogo-abrir', JSON.stringify({ tipo: 'ref', fab: r[1], ref: r[2] })); } catch { /* nada */ } }
  }
}

/* =========================================================
   As encomendas
   ========================================================= */
function filtrarEnc(ini: HTMLElement, k: string | null): void {
  const b = ini.querySelector<HTMLElement>('[data-bloco="encomendas"]'); if (!b) return;
  const lis = Array.from(b.querySelectorAll<HTMLElement>('.ini4__enc-li'));
  b.querySelectorAll<HTMLElement>('[data-kpi]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.kpi === k)));
  flip(lis, () => {
    let n = 0;
    lis.forEach((li) => { li.hidden = k ? li.dataset.estadoEnc !== k : li.hasAttribute('data-extra'); if (!li.hidden) n++; });
    const nada = b.querySelector<HTMLElement>('.ini4__filtro-nada'); if (nada) nada.hidden = n > 0;
  });
  marcaKpi(b);
}
function marcaKpi(b: HTMLElement): void {
  const m = b.querySelector<HTMLElement>('.ini4__kpi-marca'), a = b.querySelector<HTMLElement>('[data-kpi][aria-pressed="true"]');
  if (!m) return;
  m.classList.toggle('is-ligada', !!a);
  if (a) { m.style.setProperty('--x', `${a.offsetLeft}px`); m.style.setProperty('--y', `${a.offsetTop}px`); m.style.setProperty('--w', `${a.offsetWidth}px`); m.style.setProperty('--h', `${a.offsetHeight}px`); }
}
function abrirEnc(botao: HTMLElement): void {
  const li = botao.closest<HTMLElement>('.ini4__enc-li')!, det = document.getElementById(botao.getAttribute('aria-controls')!)!;
  const abrir = botao.getAttribute('aria-expanded') !== 'true';
  const ini = botao.closest<HTMLElement>('.ini4')!;
  /* uma de cada vez: fecha a que estava aberta */
  const outras = Array.from(li.parentElement!.querySelectorAll<HTMLElement>('.ini4__enc[aria-expanded="true"]')).filter((x) => x !== botao);
  const mexem = [...Array.from(li.parentElement!.querySelectorAll<HTMLElement>('.ini4__enc-li')), ...Array.from(blocos(ini))];
  flip(mexem, () => {
    outras.forEach((o) => { o.setAttribute('aria-expanded', 'false'); document.getElementById(o.getAttribute('aria-controls')!)!.hidden = true; });
    botao.setAttribute('aria-expanded', String(abrir)); det.hidden = !abrir;
  }, 280, CURVA);
  if (abrir) { entrar(det, 260, 'translateY(-4px)'); det.querySelectorAll('.ini4__percurso li').forEach((x, i) => { if (!quieto()) x.animate([{ opacity: 0, transform: 'translateX(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 60 * i, easing: CURVA, fill: 'backwards' }); }); }
}
async function atualizarEnc(b: HTMLElement): Promise<void> {
  const bloco = b.closest<HTMLElement>('[data-bloco="encomendas"]')!, est = bloco.querySelector<HTMLElement>('.ini4__atualizado');
  const repor = aCarregar(b, 'A atualizar…');
  if (est) est.textContent = 'A atualizar…';
  await espera(900);
  repor();
  if (!navigator.onLine) { if (est) est.textContent = 'Sem ligação: mostra o que já tinha'; return; }
  if (est) est.textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
  bloco.querySelectorAll<HTMLElement>('[data-kpi] b').forEach((x) => { if (!quieto()) x.animate([{ opacity: .3, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: CURVA }); });
}
/* ---------- repetir ---------- */
let deOnde: HTMLElement | null = null;
function abrirDialogo(ini: HTMLElement, num: string, de: HTMLElement): void {
  const portal = ini.closest<HTMLElement>('.portal--ini4')!;
  const velho = portal.querySelector<HTMLElement>('.ini4__dialogo');
  const t = document.createElement('template'); t.innerHTML = repetirHtml(num, true).trim();
  const novo = t.content.firstElementChild as HTMLElement;
  if (velho) velho.replaceWith(novo); else portal.appendChild(novo);
  deOnde = de; fundo(portal, true);
  if (!quieto()) { novo.querySelector('.ini4__veu')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); novo.querySelector('.ini4__dialogo-caixa')?.animate([{ opacity: 0, transform: 'translateY(8px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: CURVA }); }
  novo.querySelector<HTMLElement>('[data-confirmar-repetir], [data-ver-pedido]')?.focus();
}
function fecharDialogo(el: HTMLElement): void {
  const portal = el.closest<HTMLElement>('.portal--ini4')!;
  const fim = () => { el.hidden = true; fundo(portal, false); deOnde?.focus({ preventScroll: true }); };
  if (quieto()) { fim(); return; }
  el.querySelector('.ini4__veu')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
  el.querySelector('.ini4__dialogo-caixa')!.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px) scale(.98)' }], { duration: 160, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }).onfinish = fim;
}
/** Com um diálogo ou a gaveta abertos, o resto da página fica inerte e escondido dos leitores de ecrã. */
function fundo(portal: HTMLElement, sim: boolean): void {
  portal.querySelectorAll<HTMLElement>(':scope > .portal__topo, :scope > .portal__abas, :scope > .portal__lado, :scope > .ini4').forEach((el) => { el.inert = sim; if (sim) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}
async function confirmarRepetir(b: HTMLElement): Promise<void> {
  const dlg = b.closest<HTMLElement>('.ini4__dialogo')!, ini = dlg.closest('.portal--ini4')!.querySelector<HTMLElement>('.ini4')!;
  const p = (await import('../portal/pedidos-dados')).PEDIDOS.find((q) => q.num === b.dataset.confirmarRepetir)!;
  const linhas = repetirDe(p), ok = linhas.filter((l) => l.r);
  const repor = aCarregar(b, 'A pôr no carrinho…');
  const res = await Promise.all(ok.map((l) => carrinho.adicionar(l.r![2], l.qtd)));
  repor();
  if (res.some((r) => !r)) { brinde(ini, '<b>Sem ligação:</b> o carrinho não mudou. Tente quando a ligação voltar.', undefined, true); return; }
  fecharDialogo(dlg);
  const u = ok.reduce((s, l) => s + l.qtd, 0), fora = linhas.length - ok.length;
  brinde(ini, `<b>${u} ${u === 1 ? 'unidade' : 'unidades'} no carrinho</b> da encomenda ${p.num}${fora ? ` · ${fora} ${fora === 1 ? 'artigo ficou' : 'artigos ficaram'} de fora (não ${fora === 1 ? 'está' : 'estão'} no catálogo atual)` : ''}`);
}

/* =========================================================
   Continuar onde fiquei: a marca segue o rato e o foco
   ========================================================= */
function marcaContinuar(item: HTMLElement | null, lista: HTMLElement): void {
  const m = lista.querySelector<HTMLElement>('.ini4__cont-marca'); if (!m) return;
  if (!item) { m.classList.remove('is-ligada'); return; }
  const li = item.parentElement as HTMLElement;
  m.style.setProperty('--y', `${li.offsetTop}px`); m.style.setProperty('--h', `${li.offsetHeight}px`); m.classList.add('is-ligada');
}
function continuar(ini: HTMLElement, el: HTMLElement): void {
  const t = el.dataset.continuar;
  if (t === 'veiculo') { const m = el.dataset.matricula ?? ''; if (IDENTIFICADOS[m]) usarNaPesquisa(ini, m); }
  else if (t === 'ref') { registar({ tipo: 'ref', titulo: `${el.dataset.fab} ${el.dataset.ref}`, sub: el.querySelector('.ini4__cont-texto span')?.textContent ?? '', dados: { fab: el.dataset.fab!, ref: el.dataset.ref! } }); ir('catalogo', 'goparts:catalogo-abrir', JSON.stringify({ tipo: 'ref', fab: el.dataset.fab, ref: el.dataset.ref })); }
  else if (t === 'categoria') abrirCategoria(el.dataset.categoria ?? '');
  else if (t === 'lista') ir('lista', 'goparts:lista-abrir', el.dataset.lista);
  else if (t === 'carrinho') barra('carrinho');
}
function abrirCategoria(nome: string): void {
  registar({ tipo: 'categoria', titulo: nome, sub: 'Categoria', dados: { categoria: nome } });
  ir('catalogo', 'goparts:catalogo-abrir', JSON.stringify({ tipo: 'vista', vista: 'universal' }));
}

/* =========================================================
   A garagem
   ========================================================= */
function redesenharGaragem(ini: HTMLElement, mudar: (g: Carro[]) => void, depois?: (bloco: HTMLElement) => void): void {
  const g = garagem(); mudar(g); if (real(ini)) gravar(CHAVE_GARAGEM, g);
  const bloco = ini.querySelector<HTMLElement>('[data-bloco="garagem"]')!;
  const escolhida = ini.querySelector<HTMLElement>('.ini4__carro.is-escolhido')?.dataset.matricula ?? '';
  const antes = new Map(Array.from(bloco.querySelectorAll<HTMLElement>('.ini4__carro[data-carro]')).map((c) => [c.dataset.carro!, c.getBoundingClientRect()]));
  const d = { ...dados(), garagem: real(ini) ? garagem() : g };
  const novo = trocar(ini, 'garagem', garagemHtml(d, '', escolhida))!;
  novo.style.order = bloco.style.order; novo.hidden = bloco.hidden;
  if (!quieto()) novo.querySelectorAll<HTMLElement>('.ini4__carro[data-carro]').forEach((c) => {
    const a = antes.get(c.dataset.carro!); if (!a) { entrar(c, 320, 'scale(.96)'); return; }
    const b = c.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 380, easing: MOLA });
  });
  depois?.(novo);
}
function favorito(ini: HTMLElement, li: HTMLElement): void {
  const id = li.dataset.carro!;
  let agora = false;
  redesenharGaragem(ini, (g) => { const c = g.find((x) => x.id === id); if (c) { c.favorito = !c.favorito; agora = c.favorito; } }, (b) => {
    const est = b.querySelector<HTMLElement>(`[data-carro="${id}"] [data-favorito]`);
    est?.focus({ preventScroll: true });
    if (est && agora && !quieto()) est.querySelector('svg')?.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.35) rotate(-18deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 420, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
  });
}
function renomear(li: HTMLElement): void {
  const nome = li.querySelector<HTMLElement>('[data-nome]')!, ini = li.closest<HTMLElement>('.ini4')!;
  const antes = nome.textContent ?? '';
  const inp = document.createElement('input'); inp.className = 'ini4__renomear'; inp.value = antes; inp.maxLength = 40; inp.setAttribute('aria-label', 'Nome do veículo');
  nome.replaceWith(inp); inp.focus(); inp.select();
  let feito = false;
  const fim = (guardar: boolean) => {
    if (feito) return; feito = true;
    const v = inp.value.trim();
    if (guardar && v && v !== antes) redesenharGaragem(ini, (g) => { const c = g.find((x) => x.id === li.dataset.carro); if (c) c.nome = v; }, (b) => { b.querySelector<HTMLElement>(`[data-carro="${li.dataset.carro}"] [data-menu-carro]`)?.focus(); brinde(ini, `O veículo passou a chamar-se <b>${v.replace(/</g, '&lt;')}</b>.`); });
    else { inp.replaceWith(nome); li.querySelector<HTMLElement>('[data-menu-carro]')?.focus(); }
  };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fim(true); } else if (e.key === 'Escape') { e.preventDefault(); fim(false); } });
  inp.addEventListener('blur', () => fim(true));
}
function remover(ini: HTMLElement, li: HTMLElement): void {
  const id = li.dataset.carro!; let tirado: Carro | undefined, onde = 0;
  const sair = () => redesenharGaragem(ini, (g) => { onde = g.findIndex((x) => x.id === id); tirado = g.splice(onde, 1)[0]; }, (b) => {
    b.querySelector<HTMLElement>('.ini4__carro[data-carro] [data-menu-carro], #i4-nova-mat')?.focus({ preventScroll: true });
    if (tirado) brinde(ini, `<b>${tirado.matricula}</b> saiu da garagem.`, () => redesenharGaragem(ini, (g) => { g.splice(Math.min(onde, g.length), 0, tirado!); }));
  });
  if (quieto()) sair(); else li.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).onfinish = sair;
}
async function adicionarCarro(ini: HTMLElement, form: HTMLFormElement, matricula?: string): Promise<void> {
  const inp = form?.querySelector<HTMLInputElement>('input'), erro = form?.querySelector<HTMLElement>('.ini4__novo-erro');
  const dizer = (t: string) => { if (erro && inp) { erro.textContent = t; inp.setAttribute('aria-invalid', String(!!t)); if (t) inp.focus(); } };
  const m = normalizarMatricula(matricula ?? inp?.value ?? '');
  if (!m) { dizer('A matrícula não está completa: o formato é AA-00-AA.'); return; }
  if (garagem().some((g) => g.matricula === m) && real(ini)) { dizer(`${m} já está na garagem.`); return; }
  const b = form?.querySelector<HTMLElement>('button[type="submit"]'), repor = b ? aCarregar(b, 'A identificar…') : () => {};
  await espera(600); repor();
  const id = IDENTIFICADOS[m];
  if (!id) { dizer(`Não encontrámos um veículo com a matrícula ${m}. Confirme-a, ou identifique-o pelo VIN na pesquisa.`); return; }
  dizer('');
  redesenharGaragem(ini, (g) => { g.push({ id: `c${Date.now().toString(36)}`, matricula: m, ...id }); }, (bl) => { bl.querySelector<HTMLElement>(`[data-matricula="${m}"] [data-pecas-matricula]`)?.focus({ preventScroll: true }); });
  brinde(ini, `<b>${nomeCarro({ id: '', matricula: m, ...id })}</b> (${m}) ficou na garagem.`);
}

/* =========================================================
   As peças e a disponibilidade
   ========================================================= */
function filtrarPecas(bloco: HTMLElement, f: string): void {
  bloco.querySelectorAll<HTMLElement>('[data-pecas-filtro]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.pecasFiltro === f)));
  const lis = Array.from(bloco.querySelectorAll<HTMLElement>('.ini4__peca'));
  flip(lis, () => {
    let n = 0; lis.forEach((li) => { li.hidden = f === 'favoritas' && li.dataset.favorita !== 'true'; if (!li.hidden) n++; });
    const nada = bloco.querySelector<HTMLElement>('.ini4__filtro-nada'); if (nada) nada.hidden = n > 0;
  });
  marcaSeg(bloco);
}
function marcaSeg(bloco: HTMLElement): void {
  const m = bloco.querySelector<HTMLElement>('.ini4__seg-marca'), a = bloco.querySelector<HTMLElement>('[data-pecas-filtro][aria-selected="true"]');
  if (m && a) { m.style.setProperty('--x', `${a.offsetLeft}px`); m.style.setProperty('--w', `${a.offsetWidth}px`); }
}
function favoritaPeca(ini: HTMLElement, b: HTMLElement): void {
  const li = b.closest<HTMLElement>('.ini4__peca')!, ref = li.dataset.ref!;
  const f = favoritas(), sim = !f.includes(ref);
  const nova = sim ? [...f, ref] : f.filter((r) => r !== ref);
  if (real(ini)) gravar(CHAVE_FAVORITAS, nova);
  li.dataset.favorita = String(sim); b.setAttribute('aria-pressed', String(sim)); b.querySelector('span')!.textContent = sim ? 'Favorita' : 'Marcar';
  const n = ini.querySelector('[data-n-favoritas]'); if (n) n.textContent = String(ini.querySelectorAll('.ini4__peca[data-favorita="true"]').length);
  if (sim && !quieto()) b.querySelector('svg')?.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.35) rotate(-18deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 420, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
  const bloco = li.closest<HTMLElement>('[data-bloco="frequentes"]')!;
  if (bloco.querySelector('[data-pecas-filtro="favoritas"][aria-selected="true"]')) filtrarPecas(bloco, 'favoritas');
}
async function pedir(ini: HTMLElement, b: HTMLElement): Promise<void> {
  const ref = b.dataset.pedir!, antes = b.innerHTML;
  b.setAttribute('aria-busy', 'true'); (b as HTMLButtonElement).disabled = true;
  b.innerHTML = `${rolamentoSvg('i4-p-' + Date.now(), 'pesquisar', 'btn__icone')}<span class="btn__rotulo">A adicionar…</span>`;
  const ok = await carrinho.adicionar(ref, 1);
  b.removeAttribute('aria-busy');
  if (!ok) { b.innerHTML = antes; (b as HTMLButtonElement).disabled = false; brinde(ini, '<b>Sem ligação:</b> a peça não entrou no carrinho. Tente quando a ligação voltar.', undefined, true); return; }
  b.classList.add('is-feito'); b.innerHTML = `${L(IC.check, 'btn__icone')}<span class="btn__rotulo">No carrinho</span>`;
  window.setTimeout(() => { b.classList.remove('is-feito'); b.innerHTML = antes; (b as HTMLButtonElement).disabled = false; }, 1600);
}
/** Os números contam até ao valor novo (≤ 400 ms) e as barras deslizam (só transform). */
function verStock(ini: HTMLElement, ref: string, rolar = false): void {
  const bloco = ini.querySelector<HTMLElement>('[data-bloco="disponibilidade"]'); if (!bloco) return;
  const sel = bloco.querySelector<HTMLSelectElement>('[data-disp-ref]'), corpo = bloco.querySelector<HTMLElement>('[data-disp]');
  const r = REFERENCIAS.find((x) => x[2] === ref); if (!r || !corpo) return;
  if (sel) sel.value = ref;
  const antes = Array.from(corpo.querySelectorAll<HTMLElement>('[data-qtd]')).map((x) => Number(x.dataset.qtd));
  const barras = Array.from(corpo.querySelectorAll<HTMLElement>('.ini4__armazem-barra i')).map((x) => x.style.getPropertyValue('--p'));
  corpo.innerHTML = dispCorpo(r, Date.now(), ini.dataset.estado === 'permissao');
  corpo.querySelectorAll<HTMLElement>('.ini4__armazem-barra i').forEach((x, i) => { const p = x.style.getPropertyValue('--p'); if (barras[i] !== undefined && !quieto()) { x.style.setProperty('--p', barras[i]); requestAnimationFrame(() => requestAnimationFrame(() => x.style.setProperty('--p', p))); } });
  corpo.querySelectorAll<HTMLElement>('[data-qtd]').forEach((x, i) => contar(x, antes[i] ?? 0, Number(x.dataset.qtd)));
  if (rolar) { const b = bloco.getBoundingClientRect(); if (b.top < 0 || b.bottom > window.innerHeight) bloco.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' }); entrar(corpo.querySelector('.ini4__disp-peca')!, 240, 'translateX(-6px)'); }
}
function contar(el: HTMLElement, de: number, para: number): void {
  if (quieto() || de === para) { el.textContent = String(para); return; }
  const t0 = performance.now(), dur = 400;
  const passo = (t: number) => { const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3; el.textContent = String(Math.round(de + (para - de) * e)); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

/* =========================================================
   Atalhos
   ========================================================= */
function atalho(ini: HTMLElement, a: IdAtalho): void {
  if (a === 'referencia' || a === 'identificar') {
    const m = a === 'referencia' ? 2 : 0;
    ini.querySelector<HTMLElement>(`.ini3__separador[data-modo="${m}"]`)?.click();
    ini.querySelector('.ini3__pesquisa')?.scrollIntoView({ block: 'start', behavior: quieto() ? 'auto' : 'smooth' });
    window.setTimeout(() => ini.querySelector<HTMLInputElement>(m === 2 ? '#i3-referencia' : '#i3-matricula')?.focus({ preventScroll: true }), quieto() ? 0 : 300);
  } else if (a === 'carrinho') barra('carrinho');
  else if (a === 'pedidos') mostrar('pedidos');
  else if (a === 'faturas') mostrar('faturas');
  else if (a === 'devolucoes') mostrar('devolucoes');
  else if (a === 'lista') ir('lista', 'goparts:lista-vista', 'nova');
  else if (a === 'suporte') barra('ajuda');
  else if (a === 'favoritos') {
    const b = ini.querySelector<HTMLElement>('[data-bloco="frequentes"]');
    if (!b || b.hidden) { brinde(ini, 'O bloco «Peças que compras frequentemente» está escondido. Ligue-o em «Personalizar Início».'); return; }
    filtrarPecas(b, 'favoritas'); b.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' });
    b.querySelector<HTMLElement>('[data-pecas-filtro="favoritas"]')?.focus({ preventScroll: true });
  }
}

/* =========================================================
   Personalizar Início
   ========================================================= */
function abrirGaveta(ini: HTMLElement, de: HTMLElement, secao = ''): void {
  const portal = ini.closest<HTMLElement>('.portal--ini4')!;
  const velha = portal.querySelector<HTMLElement>('.ini4__gaveta');
  const t = document.createElement('template'); t.innerHTML = personalizarHtml(real(ini) ? prefs() : lerDoEcra(ini), { aberta: true }).trim();
  const g = t.content.firstElementChild as HTMLElement;
  if (velha) velha.replaceWith(g); else portal.appendChild(g);
  deOnde = de; fundo(portal, true); document.documentElement.classList.add('barra-presa');
  if (!quieto()) { g.querySelector('.ini4__veu')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); g.querySelector('.ini4__gaveta-caixa')?.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: 260, easing: CURVA }); }
  const alvo = secao ? g.querySelector<HTMLElement>(`#i4-pers-${secao}`) : null;
  if (alvo) { alvo.scrollIntoView({ block: 'start' }); alvo.querySelector<HTMLElement>('input')?.focus(); } else g.querySelector<HTMLElement>('[data-pega]')?.focus();
}
function fecharGaveta(g: HTMLElement): void {
  const portal = g.closest<HTMLElement>('.portal--ini4')!;
  document.documentElement.classList.remove('barra-presa');
  const fim = () => { g.hidden = true; fundo(portal, false); deOnde?.focus({ preventScroll: true }); };
  if (quieto()) { fim(); return; }
  g.querySelector('.ini4__veu')?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
  g.querySelector('.ini4__gaveta-caixa')!.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 200, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }).onfinish = fim;
}
/** As preferências que o ecrã mostra (num estado 10.x, as de origem). */
function lerDoEcra(ini: HTMLElement): Prefs {
  const p = structuredClone(PREFS);
  p.densidade = ini.dataset.densidade === 'compacta' ? 'compacta' : 'confortavel';
  return p;
}
function prefsDaGaveta(g: HTMLElement, ini: HTMLElement): Prefs {
  const p = real(ini) ? prefs() : lerDoEcra(ini);
  p.ordem = Array.from(g.querySelectorAll<HTMLElement>('[data-bloco-ordem]')).map((x) => x.dataset.blocoOrdem as IdBloco);
  p.escondidos = Array.from(g.querySelectorAll<HTMLInputElement>('[data-mostrar-bloco]')).filter((x) => !x.checked).map((x) => x.dataset.mostrarBloco as IdBloco);
  p.densidade = (g.querySelector<HTMLInputElement>('input[data-escolha="densidade"]:checked')?.value as Prefs['densidade']) ?? 'confortavel';
  p.modo = Number(g.querySelector<HTMLInputElement>('input[data-escolha="modo"]:checked')?.value ?? -1) as Prefs['modo'];
  p.atalhos = Array.from(g.querySelectorAll<HTMLInputElement>('[data-atalho-escolha]:checked')).map((x) => x.dataset.atalhoEscolha as IdAtalho);
  return p;
}
/** Aplica as preferências ao Início que está atrás da gaveta: os blocos deslizam para o lugar novo. */
function aplicar(g: HTMLElement): void {
  const ini = g.closest('.portal--ini4')!.querySelector<HTMLElement>('.ini4')!, p = prefsDaGaveta(g, ini);
  if (real(ini)) gravar(CHAVE_PREFS, p);
  const antesAtalhos = Array.from(ini.querySelectorAll<HTMLElement>('[data-atalho]')).map((x) => x.dataset.atalho).join();
  const aparecem = Array.from(blocos(ini)).filter((b) => b.hidden && !p.escondidos.includes(b.dataset.bloco as IdBloco));
  flip(blocos(ini), () => aplicarPrefs(ini, p), 420);
  aparecem.forEach((b) => entrar(b, 300, 'scale(.98)'));
  if (p.atalhos.join() !== antesAtalhos) { const novo = trocar(ini, 'atalhos', atalhosHtml({ ...dados(), prefs: p })); if (novo) { novo.style.order = String(p.ordem.indexOf('atalhos')); novo.hidden = p.escondidos.includes('atalhos'); } }
}
/* ---------- arrastar a ordem ---------- */
type Arrasto = { li: HTMLElement; lugar: HTMLElement; lista: HTMLElement; dy: number; x: number; id: number };
let arrasto: Arrasto | null = null;
function comecarArrasto(ev: PointerEvent, pega: HTMLElement): void {
  const li = pega.closest<HTMLElement>('.ini4__ordem-li')!, lista = li.parentElement as HTMLElement, r = li.getBoundingClientRect();
  ev.preventDefault(); pega.setPointerCapture(ev.pointerId);
  const lugar = document.createElement('li'); lugar.className = 'ini4__ordem-lugar'; lugar.setAttribute('aria-hidden', 'true'); lugar.style.height = `${r.height}px`;
  li.after(lugar);
  li.classList.add('is-a-arrastar');
  Object.assign(li.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, zIndex: '5' });
  arrasto = { li, lugar, lista, dy: ev.clientY - r.top, x: r.left, id: ev.pointerId };
  if (!quieto()) li.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }], { duration: 140, easing: CURVA, fill: 'forwards' });
}
function moverArrasto(ev: PointerEvent): void {
  if (!arrasto || ev.pointerId !== arrasto.id) return;
  const { li, lugar, lista, dy } = arrasto;
  li.style.top = `${ev.clientY - dy}px`;
  const irmaos = Array.from(lista.querySelectorAll<HTMLElement>('.ini4__ordem-li:not(.is-a-arrastar)'));
  const depois = irmaos.find((x) => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
  const atual = lugar.nextElementSibling === li ? li.nextElementSibling : lugar.nextElementSibling;
  if ((depois ?? null) === atual) return;
  flip(irmaos, () => { if (depois) lista.insertBefore(lugar, depois); else lista.appendChild(lugar); }, 240, MOLA);
  lista.insertBefore(li, lugar);
  aplicar(lista.closest<HTMLElement>('.ini4__gaveta')!);
}
function largarArrasto(ev: PointerEvent): void {
  if (!arrasto || ev.pointerId !== arrasto.id) return;
  const { li, lugar, lista } = arrasto; arrasto = null;
  const de = li.getBoundingClientRect(), para = lugar.getBoundingClientRect();
  li.getAnimations().forEach((a) => a.cancel());
  li.classList.remove('is-a-arrastar'); li.removeAttribute('style');
  lugar.replaceWith(li);
  if (!quieto()) li.animate([{ transform: `translate(${de.left - para.left}px, ${de.top - para.top}px) scale(1.02)` }, { transform: 'none' }], { duration: 360, easing: MOLA });
  const g = lista.closest<HTMLElement>('.ini4__gaveta')!; aplicar(g); anunciar(g, li);
  li.querySelector<HTMLElement>('[data-pega]')?.focus({ preventScroll: true });
}
function anunciar(g: HTMLElement, li: HTMLElement): void {
  const todos = Array.from(g.querySelectorAll('[data-bloco-ordem]')), a = g.querySelector('[data-ordem-aviso]');
  if (a) a.textContent = `${BLOCOS[li.dataset.blocoOrdem as IdBloco][0]}: posição ${todos.indexOf(li) + 1} de ${todos.length}.`;
}
function moverComTeclas(pega: HTMLElement, passo: number): void {
  const li = pega.closest<HTMLElement>('.ini4__ordem-li')!, lista = li.parentElement!, irmaos = Array.from(lista.children) as HTMLElement[];
  const i = irmaos.indexOf(li), j = i + passo; if (j < 0 || j >= irmaos.length) return;
  flip(irmaos, () => { if (passo < 0) lista.insertBefore(li, irmaos[j]); else irmaos[j].after(li); }, 240);
  pega.focus(); const g = lista.closest<HTMLElement>('.ini4__gaveta')!; aplicar(g); anunciar(g, li);
}
function repor(g: HTMLElement): void {
  const ini = g.closest('.portal--ini4')!.querySelector<HTMLElement>('.ini4')!;
  const t = document.createElement('template'); t.innerHTML = personalizarHtml(structuredClone(PREFS), { aberta: true }).trim();
  const nova = t.content.firstElementChild as HTMLElement;
  g.querySelector('.ini4__gaveta-corpo')!.replaceWith(nova.querySelector('.ini4__gaveta-corpo')!);
  aplicar(g);
  g.querySelector<HTMLElement>('[data-repor-inicio]')?.focus();
  brinde(ini, 'O Início voltou à disposição de origem.');
}

/* =========================================================
   Ligar
   ========================================================= */
let atual: HTMLElement | null = null;
function armar(): void {
  const ini = vivo();
  if (!ini || ini === atual) { if (!ini) atual = null; return; }
  atual = ini;
  if (real(ini) && !editando()) desenhar(ini);
  else { const s = ini.querySelector('[data-saudacao]'); if (s) s.textContent = saudacao(new Date().getHours()); }
  requestAnimationFrame(() => { ini.querySelectorAll<HTMLElement>('[data-bloco="frequentes"]').forEach(marcaSeg); ini.querySelectorAll<HTMLElement>('[data-bloco="encomendas"]').forEach(marcaKpi); });
  entrada(ini);
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  window.addEventListener('resize', () => { const ini = vivo(); if (!ini) return; ini.querySelectorAll<HTMLElement>('[data-bloco="frequentes"]').forEach(marcaSeg); ini.querySelectorAll<HTMLElement>('[data-bloco="encomendas"]').forEach(marcaKpi); });
  /* o carrinho mudou (aqui, noutro ecrã ou noutra aba): o número do atalho e a «Encomenda por concluir» */
  carrinho.ouvir((m) => {
    if (m.tipo === 'confirmado') return;
    const ini = vivo(); if (!ini || !real(ini)) return;
    ini.querySelectorAll<HTMLElement>('[data-carrinho-num]').forEach((n) => { n.textContent = String(carrinho.unidades()); if (!quieto()) n.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'cubic-bezier(.3, 1.6, .5, 1)' }); });
    const c = ini.querySelector<HTMLElement>('[data-bloco="continuar"]'); if (c) { const novo = trocar(ini, 'continuar', continuarHtml(dados())); if (novo) { novo.style.order = c.style.order; novo.hidden = c.hidden; } }
  });

  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element, portal = t.closest?.<HTMLElement>('.portal--ini4'); if (!portal) return;
    const ini = portal.querySelector<HTMLElement>('.ini4')!;
    const q = <E extends HTMLElement = HTMLElement>(s: string) => t.closest<E>(s);
    let b: HTMLElement | null;

    /* a gaveta e o diálogo */
    const g = q('.ini4__gaveta');
    if (g) {
      if (q('[data-fechar-gaveta]')) { fecharGaveta(g); return; }
      if (q('[data-repor-inicio]')) { repor(g); return; }
      return;
    }
    const dlg = q('.ini4__dialogo');
    if (dlg) {
      if (q('[data-fechar-dialogo]')) { fecharDialogo(dlg); return; }
      if ((b = q('[data-confirmar-repetir]'))) { void confirmarRepetir(b); return; }
      if ((b = q('[data-ver-pedido]'))) { fecharDialogo(dlg); ir('pedidos', 'goparts:abrir-pedido', b.dataset.verPedido); return; }
      return;
    }
    if (!ini.contains(t)) return;
    /* menus da garagem: fecham com um clique fora */
    if (!q('.ini4__menu-sitio')) ini.querySelectorAll<HTMLElement>('.ini4__menu:not([hidden])').forEach((m) => { m.hidden = true; m.previousElementSibling?.setAttribute('aria-expanded', 'false'); });

    if ((b = q('[data-personalizar]'))) { abrirGaveta(ini, b, b.dataset.personalizar ?? ''); return; }
    if ((b = q('[data-filtrar-enc]'))) { const bl = ini.querySelector<HTMLElement>('[data-bloco="encomendas"]'); if (bl && !bl.hidden) { filtrarEnc(ini, b.dataset.filtrarEnc!); bl.scrollIntoView({ block: 'nearest', behavior: quieto() ? 'auto' : 'smooth' }); } else mostrar('pedidos'); return; }
    if (q('[data-ir-fatura-vencida]')) { void import('../portal/faturas-dados').then(({ FATURAS }) => { const f = FATURAS.find((x) => x.pagamento === 'vencida'); ir('faturas', 'goparts:abrir-fatura', f?.num); }); return; }
    if ((b = q('[data-abrir-lista]'))) { ir('lista', 'goparts:lista-abrir', b.dataset.abrirLista); return; }
    /* (20 out., V4) os alertas e os números do resumo: o documento aberto, ou a lista já filtrada (filtro-chegada.ts) */
    if ((b = q('[data-ir-doc]'))) { ir(b.dataset.irDoc!, b.dataset.chave, b.dataset.valor); return; }
    if ((b = q('[data-ir-filtro]'))) { irFiltrado(b.dataset.irFiltro!, b.dataset.etapaAlvo!); return; }
    /* o veículo */
    if ((b = q('[data-pecas-matricula]'))) { const m = b.dataset.pecasMatricula!, c = garagem().find((x) => x.matricula === m) ?? (IDENTIFICADOS[m] ? { id: '', matricula: m, ...IDENTIFICADOS[m] } : null); if (c) abrirVeiculoNoCatalogo(c, c.ultima); return; }
    if ((b = q('[data-guardar-matricula]'))) { const m = b.dataset.guardarMatricula!; void adicionarCarro(ini, ini.querySelector<HTMLFormElement>('[data-garagem-nova]')!, m).then(() => { const s = ini.querySelector('[data-guardar-matricula]'); if (s) s.outerHTML = `<span class="ini4__na-garagem">${L(IC.check)}Está na garagem</span>`; }); return; }
    if (q('[data-fechar-veiculo]')) { fecharVeiculo(ini); return; }
    if ((b = q('[data-ir-modo]'))) { fecharVeiculo(ini); ini.querySelector<HTMLElement>(`.ini3__separador[data-modo="${b.dataset.irModo}"]`)?.click(); return; }
    if ((b = q('[data-usar-matricula]'))) { usarNaPesquisa(ini, b.dataset.usarMatricula!); return; }
    /* encomendas */
    if ((b = q('[data-kpi]'))) { filtrarEnc(ini, b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.kpi!); return; }
    if ((b = q('.ini4__enc'))) { abrirEnc(b); return; }
    if ((b = q('[data-atualizar-enc]'))) { void atualizarEnc(b); return; }
    if ((b = q('[data-ver-pedido]'))) { ir('pedidos', 'goparts:abrir-pedido', b.dataset.verPedido); return; }
    if ((b = q('[data-repetir-enc]'))) { abrirDialogo(ini, b.dataset.repetirEnc!, b); return; }
    if ((b = q('[data-tentar]'))) {
      const bl = b.closest<HTMLElement>('[data-bloco]')!, id = bl.dataset.bloco as IdBloco, r = aCarregar(b, 'A carregar…');
      void espera(900).then(() => { r(); const d = dados(); const html = id === 'encomendas' ? encomendasHtml(d) : id === 'frequentes' ? frequentesHtml(d) : id === 'atencao' ? atencaoHtml(d) : id === 'resumo' ? resumoHtml(d) : null;
        if (html) { const n = trocar(ini, id, html); if (n) { n.style.order = bl.style.order; entrar(n.lastElementChild!, 260); requestAnimationFrame(() => { if (id === 'frequentes') marcaSeg(n); }); } }
        else if (id === 'disponibilidade') { void import('../portal/inicio-espaco').then(({ disponibilidadeHtml }) => { const n = trocar(ini, id, disponibilidadeHtml(d)); if (n) { n.style.order = bl.style.order; entrar(n.lastElementChild!, 260); } }); } });
      return;
    }
    /* continuar */
    if ((b = q('[data-continuar]'))) { continuar(ini, b); return; }
    /* garagem */
    if ((b = q('[data-favorito]'))) { favorito(ini, b.closest<HTMLElement>('.ini4__carro')!); return; }
    if ((b = q('[data-menu-carro]'))) { const m = b.nextElementSibling as HTMLElement, abrir = m.hidden; ini.querySelectorAll<HTMLElement>('.ini4__menu').forEach((x) => { x.hidden = true; x.previousElementSibling?.setAttribute('aria-expanded', 'false'); }); m.hidden = !abrir; b.setAttribute('aria-expanded', String(abrir)); if (abrir) { m.querySelector<HTMLElement>('[role="menuitem"]')?.focus(); entrar(m, 140, 'translateY(-4px)'); } return; }
    if ((b = q('[data-renomear]'))) { const li = b.closest<HTMLElement>('.ini4__carro')!; b.closest<HTMLElement>('.ini4__menu')!.hidden = true; renomear(li); return; }
    if ((b = q('[data-remover-carro]'))) { remover(ini, b.closest<HTMLElement>('.ini4__carro')!); return; }
    /* peças e stock */
    if ((b = q('[data-pecas-filtro]'))) { filtrarPecas(b.closest<HTMLElement>('[data-bloco]')!, b.dataset.pecasFiltro!); return; }
    if ((b = q('[data-favorita-peca]'))) { favoritaPeca(ini, b); return; }
    if ((b = q('[data-pedir]'))) { void pedir(ini, b); return; }
    if ((b = q('[data-ver-stock]'))) { verStock(ini, b.dataset.verStock!, true); return; }
    if ((b = q('[data-disp-atualizar]'))) { const sel = ini.querySelector<HTMLSelectElement>('[data-disp-ref]'); const r = aCarregar(b, 'A atualizar…'); void espera(800).then(() => { r(); if (sel) verStock(ini, sel.value); }); return; }
    /* atalhos e categorias */
    if ((b = q('[data-atalho]'))) { atalho(ini, b.dataset.atalho as IdAtalho); return; }
    if ((b = q('[data-categoria]'))) { abrirCategoria(b.dataset.categoria!); return; }
  });

  document.addEventListener('submit', (ev) => {
    const f = ev.target as HTMLFormElement; if (!f.matches?.('[data-garagem-nova]')) return;
    ev.preventDefault(); void adicionarCarro(f.closest<HTMLElement>('.ini4')!, f);
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement;
    if (t.matches?.('[data-disp-ref]')) { verStock(t.closest<HTMLElement>('.ini4')!, (t as HTMLSelectElement).value); return; }
    const g = t.closest?.<HTMLElement>('.ini4__gaveta'); if (!g) return;
    if (t.matches('[data-atalho-escolha]')) {
      const n = g.querySelectorAll('[data-atalho-escolha]:checked').length;
      if (n > 8) { (t as HTMLInputElement).checked = false; brinde(g.closest('.portal--ini4')!.querySelector('.ini4')!, 'Cabem até 8 atalhos. Desligue um para ligar este.', undefined, true); return; }
    }
    aplicar(g);
  });
  document.addEventListener('pointerdown', (ev) => { const p = (ev.target as Element).closest?.<HTMLElement>('.ini4__gaveta [data-pega]'); if (p && ev.button === 0) comecarArrasto(ev, p); });
  document.addEventListener('pointermove', moverArrasto);
  document.addEventListener('pointerup', largarArrasto);
  document.addEventListener('pointercancel', largarArrasto);
  /* a marca do «Continuar» segue o rato e o foco */
  document.addEventListener('pointerover', (ev) => { const it = (ev.target as Element).closest?.<HTMLElement>('.ini4__cont-item'); const l = (ev.target as Element).closest?.<HTMLElement>('.ini4__cont'); if (l) marcaContinuar(it ?? null, l); });
  document.addEventListener('pointerout', (ev) => { const l = (ev.target as Element).closest?.<HTMLElement>('.ini4__cont'); if (l && !l.contains(ev.relatedTarget as Node)) marcaContinuar(l.querySelector<HTMLElement>('.ini4__cont-item:focus-visible'), l); });
  document.addEventListener('focusin', (ev) => { const it = (ev.target as Element).closest?.<HTMLElement>('.ini4__cont-item'); if (it) marcaContinuar(it, it.closest<HTMLElement>('.ini4__cont')!); });

  document.addEventListener('keydown', (ev) => {
    if (editando()) return;
    const t = ev.target as HTMLElement;
    const camada = t.closest?.<HTMLElement>('.ini4__gaveta, .ini4__dialogo');
    if (camada) {
      if (ev.key === 'Escape') { ev.preventDefault(); if (camada.classList.contains('ini4__gaveta')) fecharGaveta(camada); else fecharDialogo(camada); return; }
      if (t.matches('[data-pega]') && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) { ev.preventDefault(); moverComTeclas(t, ev.key === 'ArrowUp' ? -1 : 1); return; }
      if (ev.key === 'Tab') {
        const f = Array.from(camada.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, [href]')).filter((x) => x.offsetParent);
        if (!f.length) return;
        if (ev.shiftKey && t === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); } else if (!ev.shiftKey && t === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
      return;
    }
    const m = t.closest?.<HTMLElement>('.ini4__menu');
    if (m && ev.key === 'Escape') { ev.preventDefault(); m.hidden = true; (m.previousElementSibling as HTMLElement)?.focus(); m.previousElementSibling?.setAttribute('aria-expanded', 'false'); return; }
    if (ev.key === 'Escape' && t.closest?.('.ini4__veiculo')) { ev.preventDefault(); fecharVeiculo(t.closest<HTMLElement>('.ini4')!); }
  });
}
