/* =========================================================
   GOPARTS — 18 · Pesquisar peças V6: o que mexe (20 out. 2026)
   Do briefing «Complete UX Refinement, Search Cards…». O resto da pesquisa (os modos, as sugestões, identificar,
   a garagem) continua em inicio-v3.ts e inicio-espaco.ts; aqui ficam:
   - Por veículo, passo a passo: a marca escolhida passa ao resumo por cima e o Modelo acende (os modelos «a
     carregar» primeiro; uma marca sem modelos no catálogo di-lo); o modelo acende a Motorização; esta acende o Ano
     e «Selecionar veículo». Nenhum campo abre antes do anterior. Mudar um passo limpa os de baixo.
   - Por referência: os resultados aparecem por baixo, no próprio ecrã — o formulário fica compacto, a lista entra
     com um escalonamento curto, a contagem atualiza-se e o foco vai para o título dos resultados. Filtros, ordem,
     vista (Lista por omissão), limpar, pesquisa parcial, copiar a referência, adicionar ao carrinho (só diz «No
     carrinho» depois de o carrinho aceitar) e a ficha no catálogo.
   Com «reduzir movimento», muda logo.
   ========================================================= */
import { irComFoto } from './navegar';
import { prepararJa } from './catalogo-v6';
import * as carrinho from './carrinho';
import { MODELOS, veiculosDe } from '../portal/catalogo-dados';
import { MARCAS_CAT } from '../portal/inicio-v3';
import { resultadosHtml, procurar, FILTROS, type Filtros, type Ordem, type Vista } from '../portal/pesquisa-resultados';
import { rolamentoSvg } from '../../../comum/rolamento-svg';
import { L, IC } from '../portal/inicio-espaco';

const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const editando = () => document.body.classList.contains('editando');
const CURVA = 'cubic-bezier(.22, 1, .36, 1)';
const espera = (ms: number) => new Promise((r) => window.setTimeout(r, quieto() ? Math.min(ms, 120) : ms));
const entrar = (el: Element | null, dur = 240, de = 'translateY(6px)') => { if (el && !quieto()) el.animate([{ opacity: 0, transform: de }, { opacity: 1, transform: 'none' }], { duration: dur, easing: CURVA }); };
const avisar = (ini: Element, t: string) => { const a = ini.closest('.portal--pq')?.querySelector('.ini3__aviso'); if (a) a.textContent = t; };

/* =========================================================
   Por veículo: marca → modelo → motorização → ano
   ========================================================= */
const opcoes = (sel: HTMLSelectElement, primeira: string, l: [string, string][], ligar: boolean) => {
  sel.innerHTML = `<option value="">${primeira}</option>${l.map(([v, t]) => `<option value="${v.replace(/"/g, '&quot;')}">${t}</option>`).join('')}`;
  sel.disabled = !ligar;
};
function passos(card: HTMLElement): void {
  const ol = card.querySelector<HTMLElement>('[data-passos]'); if (!ol) return;
  const marca = card.dataset.marcaCat ? (card.querySelector<HTMLInputElement>('#i3-marca')?.value ?? '') : '';
  const mod = card.querySelector<HTMLSelectElement>('#i3-modelo'), vari = card.querySelector<HTMLSelectElement>('#i3-variante');
  const vals = [marca, mod?.value ? mod.value.replace(/\s*\([^)]*\)\s*$/, '') : '', vari?.value ? (vari.selectedOptions[0]?.textContent ?? '').split(' · ').slice(0, 2).join(' · ') : ''];
  ol.querySelectorAll<HTMLElement>('li').forEach((li, i) => {
    const b = li.querySelector('b')!, antes = b.textContent, novo = vals[i] || '—';
    li.classList.toggle('is-feito', !!vals[i]); b.textContent = novo;
    if (antes !== novo && vals[i] && !quieto()) b.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: CURVA });
  });
  const ok = !!mod?.value && !!vari?.value;
  const b = card.querySelector<HTMLButtonElement>('[data-pesquisar]'); if (b) { b.disabled = !ok; if (ok) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true'); }
}
/** O campo seguinte acende (uma vez, sem mexer o resto). */
const acender = (sel: HTMLElement) => { if (!quieto()) sel.closest('.ini3__campo')?.animate([{ boxShadow: '0 0 0 0 transparent' }, { boxShadow: '0 0 0 3px var(--c-acao-suave, rgba(245,130,20,.25))' }, { boxShadow: '0 0 0 0 transparent' }], { duration: 600, easing: 'ease-out' }); };
let pedidoMarca = 0;
export function escolherMarca(card: HTMLElement, nome: string): void {
  const mod = card.querySelector<HTMLSelectElement>('#i3-modelo')!, vari = card.querySelector<HTMLSelectElement>('#i3-variante')!, ano = card.querySelector<HTMLSelectElement>('#i3-ano')!;
  const campoMod = mod.closest<HTMLElement>('.ini3__campo')!, marcaCampo = card.querySelector<HTMLElement>('#i3-marca')!.closest<HTMLElement>('.ini3__campo')!;
  marcaCampo.querySelector('.pq__ajuda--aviso')?.remove(); campoMod.querySelector('.pq__ajuda')?.remove();
  const cat = MARCAS_CAT[nome];
  card.dataset.marcaCat = cat ?? '';
  opcoes(vari, 'Escolhe primeiro o modelo', [], false); opcoes(ano, 'Escolhe primeiro a motorização', [], false);
  /* a carregar: o pedido ao servidor (aqui, um instante) */
  opcoes(mod, 'A carregar modelos…', [], false); mod.setAttribute('aria-busy', 'true'); campoMod.classList.add('is-a-carregar');
  const p = document.createElement('p'); p.className = 'pq__ajuda'; p.setAttribute('role', 'status'); p.innerHTML = `${rolamentoSvg('pq-m-' + Date.now(), 'pesquisar', 'pq__rs')}A carregar os modelos da ${nome}…`; campoMod.appendChild(p);
  passos(card);
  const n = ++pedidoMarca;
  void espera(450).then(() => {
    if (n !== pedidoMarca) return;
    mod.removeAttribute('aria-busy'); campoMod.classList.remove('is-a-carregar'); p.remove();
    const ms = cat ? MODELOS[cat] ?? [] : [];
    if (!ms.length) {
      opcoes(mod, 'Sem modelos no catálogo', [], false);
      const a = document.createElement('p'); a.className = 'pq__ajuda pq__ajuda--aviso'; a.setAttribute('role', 'status');
      a.innerHTML = `${L(IC.triangleAlert)}O catálogo ainda não tem modelos da ${nome}. Pesquisa pela referência ou pela matrícula.`;
      marcaCampo.appendChild(a); entrar(a, 200, 'translateY(-4px)'); card.dataset.marcaCat = ''; passos(card); return;
    }
    opcoes(mod, 'Escolhe o modelo', ms.map(([m, de, ate]) => [m, `${m} · ${de.slice(-4)}–${ate ? ate.slice(-4) : 'hoje'}`]), true);
    passos(card); acender(mod); mod.focus();
  });
}
function escolherModelo(card: HTMLElement): void {
  const marca = card.dataset.marcaCat ?? '', mod = card.querySelector<HTMLSelectElement>('#i3-modelo')!, vari = card.querySelector<HTMLSelectElement>('#i3-variante')!, ano = card.querySelector<HTMLSelectElement>('#i3-ano')!;
  const vs = mod.value ? veiculosDe(marca, mod.value) : [];
  opcoes(vari, vs.length ? 'Escolhe a motorização' : 'Escolhe primeiro o modelo', vs.map((v, i) => [String(i), `${v.versao} · ${v.kw} kW / ${v.cv} cv · ${v.motor.split(',')[0]}`]), vs.length > 0);
  opcoes(ano, 'Escolhe primeiro a motorização', [], false);
  passos(card); if (vs.length) { acender(vari); vari.focus(); }
}
function escolherMotorizacao(card: HTMLElement): void {
  const marca = card.dataset.marcaCat ?? '', mod = card.querySelector<HTMLSelectElement>('#i3-modelo')!, vari = card.querySelector<HTMLSelectElement>('#i3-variante')!, ano = card.querySelector<HTMLSelectElement>('#i3-ano')!;
  const v = vari.value === '' ? undefined : veiculosDe(marca, mod.value)[Number(vari.value)];
  const anos = v ? Array.from({ length: Math.max(1, (v.ate || new Date().getFullYear()) - v.desde + 1) }, (_, k) => String(v.desde + k)) : [];
  opcoes(ano, v ? 'Qualquer ano' : 'Escolhe primeiro a motorização', anos.map((a) => [a, a]), !!v);
  passos(card);
  if (v) card.querySelector<HTMLElement>('[data-pesquisar]')?.focus();
}
function limparVeiculo(card: HTMLElement): void {
  card.dataset.marcaCat = '';
  card.querySelectorAll('.pq__ajuda--aviso').forEach((x) => x.remove());
  opcoes(card.querySelector<HTMLSelectElement>('#i3-modelo')!, 'Escolhe primeiro a marca', [], false);
  opcoes(card.querySelector<HTMLSelectElement>('#i3-variante')!, 'Escolhe primeiro o modelo', [], false);
  opcoes(card.querySelector<HTMLSelectElement>('#i3-ano')!, 'Escolhe primeiro a motorização', [], false);
  passos(card);
}

/* =========================================================
   Por referência: os resultados no ecrã
   ========================================================= */
const F = new WeakMap<HTMLElement, Filtros>();
function filtros(pr: HTMLElement): Filtros { return F.get(pr) ?? { ...FILTROS }; }
function desenhar(pr: HTMLElement, f: Filtros, o: { entrar?: boolean; foco?: boolean } = {}): void {
  F.set(pr, f);
  const antes = Number(pr.querySelector('[data-pr-n]')?.textContent ?? 0);
  pr.innerHTML = resultadosHtml(f);
  pr.hidden = false;
  const n = pr.querySelector<HTMLElement>('[data-pr-n]');
  if (n && !quieto()) { const para = Number(n.textContent), t0 = performance.now(); const passo = (t: number) => { const k = Math.min(1, (t - t0) / 300); n.textContent = String(Math.round(antes + (para - antes) * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(passo); }; requestAnimationFrame(passo); }
  if (o.entrar && !quieto()) pr.querySelectorAll<HTMLElement>('.pr__item').forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: Math.min(i, 8) * 40, easing: CURVA, fill: 'backwards' }));
  else if (!quieto()) pr.querySelectorAll<HTMLElement>('.pr__item').forEach((li) => li.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 180 }));
  if (o.foco) pr.querySelector<HTMLElement>('#pr-t')?.focus({ preventScroll: true });
}
const opcoesRef = (card: HTMLElement) => ({
  parcial: !!card.querySelector<HTMLInputElement>('[data-pq-parcial]')?.checked,
  equivalencias: card.querySelector<HTMLInputElement>('[data-pq-equivalencias]')?.checked ?? true,
});
/** «Pesquisar referência»: o botão em «A pesquisar…», os resultados em esqueleto, depois a lista. */
export function pesquisarReferencia(card: HTMLElement): void {
  const ini = card.closest<HTMLElement>('.pq')!, pr = ini.querySelector<HTMLElement>('[data-pr]')!, inp = card.querySelector<HTMLInputElement>('#i3-referencia')!;
  const q = inp.value.trim();
  if (!q) { inp.focus(); inp.closest('.ini3__campo')?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: quieto() ? 0 : 220 }); avisar(ini, 'Escreve a referência, a marca ou a descrição da peça.'); return; }
  const b = card.querySelector<HTMLButtonElement>('[data-pesquisar]'); if (!b || b.getAttribute('aria-busy')) return;
  const f: Filtros = { ...FILTROS, ...opcoesRef(card), q, vista: filtros(pr).vista };
  const antes = b.innerHTML; b.disabled = true; b.setAttribute('aria-busy', 'true');
  b.innerHTML = `${rolamentoSvg('pq-b-' + Date.now(), 'pesquisar', 'btn__icone')}<span class="btn__rotulo">A pesquisar…</span>`;
  /* o formulário fica compacto e os resultados chegam no mesmo sítio */
  ini.classList.add('is-com-resultados');
  pr.innerHTML = resultadosHtml(f, { estado: 'carga' }); pr.hidden = false; entrar(pr, 200);
  void espera(550).then(() => {
    b.innerHTML = antes; b.disabled = false; b.removeAttribute('aria-busy');
    if (!navigator.onLine) { pr.innerHTML = resultadosHtml(f, { estado: 'servico' }); return; }
    desenhar(pr, f, { entrar: true, foco: true });
    const n = procurar(f).length;
    avisar(ini, n ? `${n} ${n === 1 ? 'resultado' : 'resultados'} para ${q}.` : `Nenhum resultado para ${q}.`);
    const r = pr.getBoundingClientRect(); if (r.top > window.innerHeight * .7) pr.scrollIntoView({ block: 'start', behavior: quieto() ? 'auto' : 'smooth' });
  });
}
function limpar(ini: HTMLElement): void {
  const pr = ini.querySelector<HTMLElement>('[data-pr]')!, inp = ini.querySelector<HTMLInputElement>('#i3-referencia');
  const fim = () => { pr.hidden = true; pr.innerHTML = ''; ini.classList.remove('is-com-resultados'); F.delete(pr); if (inp) { inp.value = ''; inp.focus(); } avisar(ini, 'A pesquisa foi limpa.'); };
  if (quieto()) { fim(); return; }
  pr.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).onfinish = fim;
}
async function pedir(b: HTMLElement): Promise<void> {
  if (b.getAttribute('aria-busy')) return;
  const antes = b.innerHTML; b.setAttribute('aria-busy', 'true'); (b as HTMLButtonElement).disabled = true;
  b.innerHTML = `${rolamentoSvg('pq-p-' + Date.now(), 'pesquisar', 'btn__icone')}<span class="btn__rotulo">A adicionar…</span>`;
  const ok = await carrinho.adicionar(b.dataset.prPedir!, 1);
  b.removeAttribute('aria-busy');
  if (!ok) { b.innerHTML = `${L(IC.triangleAlert, 'btn__icone')}<span class="btn__rotulo">Não adicionado</span>`; window.setTimeout(() => { b.innerHTML = antes; (b as HTMLButtonElement).disabled = false; }, 2200); return; }
  b.classList.add('is-feito'); b.innerHTML = `${L(IC.check, 'btn__icone')}<span class="btn__rotulo">No carrinho</span>`;
  const sel = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) [data-barra="carrinho"] .portal__selo');
  if (sel && !quieto()) sel.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.3, 1.6, .5, 1)' });
  window.setTimeout(() => { b.classList.remove('is-feito'); b.innerHTML = antes; (b as HTMLButtonElement).disabled = false; }, 1600);
}

export function iniciar(): void {
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLElement, card = t.closest?.<HTMLElement>('.pq #i3-cartao-selecionar');
    if (card) { if (t.id === 'i3-modelo') escolherModelo(card); else if (t.id === 'i3-variante') escolherMotorizacao(card); return; }
    const pr = t.closest?.<HTMLElement>('.pq [data-pr]'); if (!pr) return;
    const f = filtros(pr);
    if (t.matches('[data-pr-ordem]')) desenhar(pr, { ...f, ordem: (t as HTMLSelectElement).value as Ordem });
    else if (t.matches('[data-pr-grupo]')) desenhar(pr, { ...f, grupo: (t as HTMLSelectElement).value });
    else if (t.matches('[data-pr-stock]')) desenhar(pr, { ...f, stock: (t as HTMLInputElement).checked });
  });
  /* escrever outra marca à mão desfaz o que vinha dela */
  document.addEventListener('input', (ev) => { const t = ev.target as HTMLElement; if (t.id === 'i3-marca') { const c = t.closest<HTMLElement>('.pq #i3-cartao-selecionar'); if (c && c.dataset.marcaCat) limparVeiculo(c); } });
  document.addEventListener('click', (ev) => {
    if (editando()) return;
    const t = ev.target as Element, ini = t.closest?.<HTMLElement>('.pq'); if (!ini) return;
    let b: HTMLElement | null;
    if ((b = t.closest('#i3-cartao-selecionar [data-limpar]'))) { limparVeiculo(b.closest<HTMLElement>('.ini3__cartao')!); return; }
    const pr = t.closest<HTMLElement>('[data-pr]'); if (!pr) return;
    const f = filtros(pr);
    if ((b = t.closest('[data-pr-vista]'))) { desenhar(pr, { ...f, vista: b.dataset.prVista as Vista }); pr.querySelector<HTMLElement>(`[data-pr-vista="${b.dataset.prVista}"]`)?.focus(); return; }
    if ((b = t.closest('[data-pr-marca]'))) { const m = b.dataset.prMarca!; desenhar(pr, { ...f, marcas: f.marcas.includes(m) ? f.marcas.filter((x) => x !== m) : [...f.marcas, m] }); pr.querySelector<HTMLElement>(`[data-pr-marca="${m}"]`)?.focus(); return; }
    if ((b = t.closest('[data-pr-tirar-marca]'))) { desenhar(pr, { ...f, marcas: f.marcas.filter((x) => x !== b!.dataset.prTirarMarca) }); return; }
    if (t.closest('[data-pr-tirar-grupo]')) { desenhar(pr, { ...f, grupo: '' }); return; }
    if (t.closest('[data-pr-tirar-stock]')) { desenhar(pr, { ...f, stock: false }); return; }
    if (t.closest('[data-pr-sem-filtros]')) { desenhar(pr, { ...f, marcas: [], grupo: '', stock: false }); return; }
    if (t.closest('[data-pr-limpar]')) { limpar(ini); return; }
    if (t.closest('[data-pr-parcial]')) { const c = ini.querySelector<HTMLElement>('#i3-cartao-referencia')!; const x = c.querySelector<HTMLInputElement>('[data-pq-parcial]'); if (x) x.checked = true; pesquisarReferencia(c); return; }
    if (t.closest('[data-pr-tentar]')) { pesquisarReferencia(ini.querySelector<HTMLElement>('#i3-cartao-referencia')!); return; }
    if ((b = t.closest('[data-pr-pedir]'))) { void pedir(b); return; }
    /* a ficha: a imagem da peça passa do resultado para a ficha (navegar.ts) */
    if ((b = t.closest('[data-pr-ficha]'))) { try { sessionStorage.setItem('goparts:catalogo-abrir', JSON.stringify({ tipo: 'ref', fab: b.dataset.prFab, ref: b.dataset.prFicha })); } catch { /* abre o catálogo */ } irComFoto('catalogo', b.closest('.pr__peca')?.querySelector<HTMLElement>('.pr__img') ?? null, prepararJa); return; }
    if ((b = t.closest('[data-copiar]'))) {
      const v = b.dataset.copiar!, fim = (ok: boolean) => { b!.classList.add(ok ? 'is-copiado' : 'is-erro'); b!.setAttribute('aria-label', ok ? `Copiada: ${v}` : 'Não foi possível copiar'); avisar(ini, ok ? `Referência ${v} copiada.` : 'Não foi possível copiar.'); window.setTimeout(() => { b!.classList.remove('is-copiado', 'is-erro'); }, 1400); };
      navigator.clipboard?.writeText(v).then(() => fim(true), () => fim(false)) ?? fim(false);
    }
  });
}
