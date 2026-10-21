/* =========================================================
   ROMAFE — Fluxos ecrã a ecrã (21 out. 2026): o visualizador
   Os diagramas (dados.ts) passam a Mermaid e o Mermaid dispõe os nós (sem posições escritas à mão). Por cima:
   - arrastar para mover, a roda (ou + e −) para o zoom, «Ajustar» para caber;
   - clicar num nó: o caminho até ele e as saídas acendem-se, o resto esbate-se, e o painel diz tudo do ecrã
     (objetivo, estados, de onde se vem, para onde se vai, as notas do PDA) e abre o ecrã verdadeiro;
   - procurar um ecrã em todos os diagramas; recolher e abrir os grupos; os estados de cada ecrã como subnós;
   - exportar SVG, PNG, PDF (imprimir) e o Mermaid; copiar a ligação; ecrã inteiro.
   A verificação (verificar.ts) diz por cima do diagrama se alguma regra falha.
   ========================================================= */
import '../comum/css/tokens.css';
import '../comum/css/base.css';
import './fluxos.css';
import mermaid from 'mermaid';
import type { App, IdApp } from '../comum/tipos';
import { iniciar as iniciarTema } from '../comum/tema';
import { erp } from '../apps/erp/app';
import { goshop } from '../apps/goshop/app';
import { goparts } from '../apps/goparts/app';
import { mobile } from '../apps/mobile/app';
import { identidade } from '../apps/identidade/app';
import { DIAGRAMAS, TIPOS, PDA, type Diagrama, type No, type Tipo } from './dados';
import { verificar } from './verificar';

const APPS = { erp, goshop, goparts, mobile, identidade } as unknown as Record<IdApp, App>;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escuro = () => document.documentElement.dataset.theme === 'dark' || (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);

/* ---------- o estado ---------- */
let atual: Diagrama = DIAGRAMAS[0];
let recolhidos = new Set<number>();
let comEstados = false;
let escolhido: string | null = null;
let z = 1, x = 0, y = 0;

/* ---------- de dados para Mermaid ---------- */
const FORMA: Record<Tipo, (t: string) => string> = {
  ecra: (t) => `["${t}"]`, definir: (t) => `["${t}<br/>Por definir"]`, acao: (t) => `[/"${t}"/]`, decisao: (t) => `{"${t}"}`,
  /* a forma e um símbolo dizem o tipo sem a cor (✓ correu bem, ⚠ aviso, ✕ erro, ▶ início, ■ fim) */
  sucesso: (t) => `(["✓ ${t}"])`, aviso: (t) => `{{"⚠ ${t}"}}`, erro: (t) => `>"✕ ${t}"]`, externo: (t) => `[("${t}")]`, inicio: (t) => `(["▶ ${t}"])`, fim: (t) => `(["■ ${t}"])`,
};
const txt = (s: string) => s.replace(/"/g, '#quot;');
const appDe = (no: No) => (no.ecra ? APPS[no.ecra[0]] : undefined);
const ecraDe = (no: No) => appDe(no)?.ecras.find((e) => e.id === no.ecra![1]);
const estadosDe = (no: No) => (no.ecra ? appDe(no)!.ecras.filter((e) => e.estadoDe === no.ecra![1]) : []);

function cores(): string {
  const c = escuro()
    ? { ecra: ['#13263a', '#4c95dd', '#e6f0fa'], acao: ['#3a2410', '#f58a1f', '#ffe6cc'], decisao: ['#2a1f3d', '#a78bdb', '#efe6ff'], sucesso: ['#0f2e22', '#2fbf87', '#dcfbee'], aviso: ['#33270d', '#e9a23b', '#fff1d6'], erro: ['#3a1416', '#e65358', '#ffe1e2'], externo: ['#22262d', '#8a93a0', '#e4e7eb'], inicio: ['#1d2128', '#a8b0bc', '#f5f7fa'], fim: ['#1d2128', '#a8b0bc', '#f5f7fa'], definir: ['#171a20', '#5d6573', '#a8b0bc'], estado: ['#171a20', '#3b4350', '#a8b0bc'] }
    : { ecra: ['#e8f1fa', '#0063aa', '#0b2a47'], acao: ['#fff1e3', '#e8740c', '#5a2b00'], decisao: ['#f1ebfb', '#7b55c7', '#2e1a57'], sucesso: ['#e3f5ee', '#12875c', '#0b3b28'], aviso: ['#fdf1dc', '#b7791f', '#4a3006'], erro: ['#fbe7e8', '#d23f45', '#5a1216'], externo: ['#eef1f4', '#66788c', '#26323f'], inicio: ['#ffffff', '#46576a', '#172534'], fim: ['#ffffff', '#46576a', '#172534'], definir: ['#ffffff', '#9aa8b6', '#46576a'], estado: ['#f7f9fb', '#c4d0db', '#46576a'] };
  return Object.entries(c).map(([k, [f, s, t]]) => `classDef ${k} fill:${f},stroke:${s},color:${t},stroke-width:${k === 'estado' ? 1 : k === 'fim' ? 3 : 1.6}px${k === 'definir' ? ',stroke-dasharray:5 4' : ''}`).join('\n');
}
/** O texto Mermaid do diagrama (com os grupos recolhidos e, se pedido, os estados). */
export function fonte(d: Diagrama, rec = recolhidos, estados = comEstados): string {
  const grupoDe = new Map<string, number>(); (d.grupos ?? []).forEach((g, i) => { if (rec.has(i)) g.nos.forEach((id) => grupoDe.set(id, i)); });
  const alvo = (id: string) => (grupoDe.has(id) ? `grupo_${grupoDe.get(id)}` : id);
  const linhas: string[] = [`flowchart ${d.direcao}`];
  (d.grupos ?? []).forEach((g, i) => { if (rec.has(i)) linhas.push(`  grupo_${i}[["${txt(g.titulo)} · ${g.nos.length}"]]:::ecra`); });
  const desenhar = (no: No) => `  ${no.id}${FORMA[no.tipo](txt(no.texto))}:::${no.tipo}`;
  const soltos = d.nos.filter((no) => !grupoDe.has(no.id));
  const emGrupo = new Set((d.grupos ?? []).flatMap((g, i) => (rec.has(i) ? [] : g.nos)));
  (d.grupos ?? []).forEach((g, i) => { if (rec.has(i)) return; linhas.push(`  subgraph sg_${i}["${txt(g.titulo)}"]`); g.nos.forEach((id) => { const no = d.nos.find((n) => n.id === id); if (no) linhas.push('  ' + desenhar(no)); }); linhas.push('  end'); });
  soltos.filter((no) => !emGrupo.has(no.id)).forEach((no) => linhas.push(desenhar(no)));
  const vistas = new Set<string>();
  d.arestas.forEach((a) => {
    const de = alvo(a.de), para = alvo(a.para); if (de === para) return;
    const k = `${de}>${para}`; if (grupoDe.has(a.de) || grupoDe.has(a.para)) { if (vistas.has(k)) return; vistas.add(k); }
    const r = [a.rotulo, a.anim ? `⟳ ${a.anim}` : ''].filter(Boolean).map((s) => txt(s!)).join('<br/>');
    linhas.push(`  ${de} ${a.tracejada ? '-.->' : '-->'}${r ? `|"${r}"|` : ''} ${para}`);
  });
  if (estados) d.nos.forEach((no) => { if (grupoDe.has(no.id)) return; estadosDe(no).slice(0, 8).forEach((e, i) => { linhas.push(`  ${no.id}__e${i}["${txt(e.nome)}"]:::estado`); linhas.push(`  ${no.id} -.- ${no.id}__e${i}`); }); });
  linhas.push(cores());
  return linhas.join('\n');
}

/* ---------- desenhar ---------- */
let n = 0;
async function desenhar(): Promise<void> {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', fontFamily: 'Lato, ui-sans-serif, system-ui, sans-serif',
    flowchart: { htmlLabels: false, curve: 'basis', nodeSpacing: 36, rankSpacing: 52, padding: 12 },
    themeVariables: { fontSize: '14px', textColor: escuro() ? '#c9d0da' : '#2b3a4a', lineColor: escuro() ? '#6b7584' : '#8a99a8', primaryTextColor: escuro() ? '#f5f7fa' : '#172534', edgeLabelBackground: escuro() ? '#0f1115' : '#ffffff', clusterBkg: escuro() ? '#13161b' : '#f7f9fb', clusterBorder: escuro() ? '#2a303a' : '#d7e1e9', titleColor: escuro() ? '#a8b0bc' : '#46576a' } });
  const palco = $('#fx-palco');
  try {
    const { svg } = await mermaid.render(`fx-d${++n}`, fonte(atual));
    palco.innerHTML = svg;
  } catch (e) { palco.innerHTML = `<p class="fx-falha">Não foi possível desenhar este diagrama: ${esc(String(e))}</p>`; return; }
  const s = palco.querySelector('svg')!; s.removeAttribute('style'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', atual.titulo);
  ligarNos(s);
  ajustar();
  if (escolhido) escolher(escolhido, false);
}
/** O id do nó a partir do id que o Mermaid lhe dá («fx-d3-flowchart-posicao-12»). */
const idDoNo = (g: Element) => /flowchart-(.+)-\d+$/.exec(g.id)?.[1] ?? null;
function ligarNos(s: SVGSVGElement): void {
  s.querySelectorAll<SVGGElement>('g.node').forEach((g) => {
    const id = idDoNo(g); if (!id) return;
    g.dataset.no = id; g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    const no = atual.nos.find((q) => q.id === id); g.setAttribute('aria-label', no ? `${TIPOS[no.tipo][0]}: ${no.texto}` : id);
  });
}

/* ---------- mover e zoom ---------- */
function aplicar(): void { $('#fx-palco').style.transform = `translate(${x}px, ${y}px) scale(${z})`; $('#fx-zoom').textContent = `${Math.round(z * 100)} %`; }
function ajustar(): void {
  const s = $('#fx-palco').querySelector('svg'); if (!s) return;
  const tela = $('#fx-tela').getBoundingClientRect(), vb = s.viewBox.baseVal;
  const w = vb.width || s.getBBox().width, h = vb.height || s.getBBox().height;
  s.setAttribute('width', String(w)); s.setAttribute('height', String(h));
  z = Math.min(1.4, Math.max(.2, Math.min((tela.width - 48) / w, (tela.height - 48) / h)));
  x = (tela.width - w * z) / 2; y = (tela.height - h * z) / 2; aplicar();
}
function zoomEm(f: number, cx?: number, cy?: number): void {
  const r = $('#fx-tela').getBoundingClientRect(), px = cx ?? r.width / 2, py = cy ?? r.height / 2;
  const nz = Math.min(3, Math.max(.15, z * f)); x = px - (px - x) * (nz / z); y = py - (py - y) * (nz / z); z = nz; aplicar();
}
function centrarNo(id: string): void {
  const g = $('#fx-palco').querySelector<SVGGElement>(`g.node[data-no="${CSS.escape(id)}"]`); if (!g) return;
  const r = $('#fx-tela').getBoundingClientRect(), b = g.getBoundingClientRect();
  x += r.left + r.width / 2 - (b.left + b.width / 2); y += r.top + r.height / 2 - (b.top + b.height / 2); aplicar();
}

/* ---------- escolher um nó: o caminho e o painel ---------- */
function antecessores(id: string): Set<string> { const v = new Set([id]); const fila = [id]; while (fila.length) { const c = fila.shift()!; atual.arestas.filter((a) => a.para === c).forEach((a) => { if (!v.has(a.de)) { v.add(a.de); fila.push(a.de); } }); } return v; }
function escolher(id: string | null, centrar = true): void {
  escolhido = id;
  const s = $('#fx-palco').querySelector('svg'); if (!s) return;
  s.classList.toggle('is-caminho', !!id);
  s.querySelectorAll('.is-aceso').forEach((e) => e.classList.remove('is-aceso'));
  if (!id) { fecharPainel(); return; }
  const caminho = antecessores(id); atual.arestas.filter((a) => a.de === id).forEach((a) => caminho.add(a.para));
  s.querySelectorAll<SVGGElement>('g.node').forEach((g) => { if (caminho.has(g.dataset.no ?? '')) g.classList.add('is-aceso'); });
  s.querySelectorAll<SVGPathElement>('path.flowchart-link, .edgePaths path').forEach((p) => {
    const m = /^L[_-](.+?)[_-](.+?)[_-]\d+$/.exec(p.id.replace(/^fx-d\d+-/, '')) ;
    const de = m?.[1], para = m?.[2];
    if (de && para && caminho.has(de) && caminho.has(para) && (antecessores(id).has(para) || de === id)) p.classList.add('is-aceso');
  });
  /* (para se ler) escolher um nó num diagrama grande aproxima até 90 % */
  if (centrar || z < .6) { if (z < .6) { z = .9; aplicar(); } centrarNo(id); }
  painel(id);
  try { history.replaceState(null, '', `#d=${atual.id}&no=${id}`); } catch { /* ficheiro local */ }
}

/* ---------- o painel do ecrã ---------- */
function painel(id: string): void {
  const no = atual.nos.find((q) => q.id === id), p = $('#fx-painel');
  if (!no) { p.hidden = true; return; }
  const app = appDe(no), ec = ecraDe(no), estados = estadosDe(no);
  const de = atual.arestas.filter((a) => a.para === id), para = atual.arestas.filter((a) => a.de === id);
  const nome = (nid: string) => esc(atual.nos.find((q) => q.id === nid)?.texto ?? nid);
  const lig = (l: typeof de, lado: 'de' | 'para') => l.length ? `<ul class="fx-p-lista">${l.map((a) => `<li><button type="button" class="fx-p-no" data-ir-no="${lado === 'de' ? a.de : a.para}">${nome(lado === 'de' ? a.de : a.para)}</button>${a.rotulo ? `<small>${esc(a.rotulo)}</small>` : ''}${a.anim ? `<small class="fx-p-anim">⟳ ${esc(a.anim)}</small>` : ''}</li>`).join('')}</ul>` : '<p class="fx-p-vazio">—</p>';
  const pda = no.ecra?.[0] === 'mobile';
  p.innerHTML = `<header class="fx-p-cabeca"><span class="fx-tipo fx-tipo--${no.tipo}">${TIPOS[no.tipo][0]}</span><button type="button" class="fx-p-fechar" data-fechar-painel aria-label="Fechar o painel">×</button></header>
    <h2 class="fx-p-titulo">${esc(ec?.nome ?? no.texto)}</h2>
    ${app ? `<p class="fx-p-app">${esc(app.nome)}</p>` : ''}
    ${ec ? `<section><h3>Para que serve</h3><p>${esc(ec.objetivo)}</p></section>` : no.tipo === 'definir' ? '<section><h3>Por definir</h3><p>Ainda não há ecrã no protótipo.</p></section>' : ''}
    ${no.nota ? `<section><h3>Nota</h3><p>${esc(no.nota)}</p></section>` : ''}
    ${estados.length ? `<section><h3>Estados (${estados.length})</h3><ul class="fx-p-estados">${estados.map((e) => `<li><a href="../${app!.pasta ?? app!.id}/#so=ecra&ecra=${e.id}" target="_blank" rel="noopener">${esc(e.nome)}</a><small>${esc(e.objetivo)}</small></li>`).join('')}</ul></section>` : ''}
    <section><h3>Vem de</h3>${lig(de, 'de')}</section>
    <section><h3>Leva a</h3>${lig(para, 'para')}</section>
    ${pda ? `<section><h3>No PDA</h3><ul class="fx-p-pda">${PDA.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>` : ''}
    ${ec ? `<a class="fx-btn fx-btn--acao" href="../${app!.pasta ?? app!.id}/#so=ecra&ecra=${ec.id}" target="_blank" rel="noopener">Abrir o ecrã</a>` : ''}`;
  p.hidden = false;
}
function fecharPainel(): void { $('#fx-painel').hidden = true; }

/* ---------- a barra da esquerda: os diagramas, a procura, os grupos, a legenda ---------- */
function lista(): void {
  const grupos = [...new Set(DIAGRAMAS.map((d) => d.grupo))];
  $('#fx-lista').innerHTML = grupos.map((g) => `<section><h2>${esc(g)}</h2><ul>${DIAGRAMAS.filter((d) => d.grupo === g).map((d) => { const pr = verificar(d, APPS).length; return `<li><button type="button" class="fx-d" data-diagrama="${d.id}"${d.id === atual.id ? ' aria-current="true"' : ''}>${esc(d.titulo)}${pr ? `<span class="fx-d-pr" title="${pr} problemas">${pr}</span>` : ''}</button></li>`; }).join('')}</ul></section>`).join('');
}
function cabeca(): void {
  const pr = verificar(atual, APPS);
  $('#fx-titulo').textContent = atual.titulo; $('#fx-desc').textContent = atual.descricao;
  $('#fx-verificacao').innerHTML = pr.length ? `<details><summary>${pr.length} ${pr.length === 1 ? 'regra falha' : 'regras falham'}</summary><ul>${pr.map((q) => `<li>${q.no ? `<button type="button" data-ir-no="${q.no}">${esc(q.texto)}</button>` : esc(q.texto)}</li>`).join('')}</ul></details>` : '<span class="fx-ok">✓ Sem becos, órfãos nem ecrãs inexistentes</span>';
  $('#fx-grupos').innerHTML = (atual.grupos ?? []).map((g, i) => `<label class="fx-chk"><input type="checkbox" data-grupo="${i}"${recolhidos.has(i) ? '' : ' checked'}><span>${esc(g.titulo)}</span></label>`).join('') || '<p class="fx-p-vazio">Sem grupos neste diagrama.</p>';
}
function abrir(id: string, no: string | null = null): void {
  atual = DIAGRAMAS.find((d) => d.id === id) ?? DIAGRAMAS[0]; recolhidos = new Set(); escolhido = no;
  lista(); cabeca(); fecharPainel();
  void desenhar().then(() => { if (no) escolher(no); });
  try { history.replaceState(null, '', `#d=${atual.id}${no ? `&no=${no}` : ''}`); } catch { /* */ }
}
function procurar(q: string): void {
  const r = $('#fx-resultados'); const s = q.trim().toLowerCase();
  if (s.length < 2) { r.hidden = true; r.innerHTML = ''; return; }
  const achados = DIAGRAMAS.flatMap((d) => d.nos.filter((no) => `${no.texto} ${ecraDe(no)?.nome ?? ''}`.toLowerCase().includes(s)).map((no) => ({ d, no }))).slice(0, 30);
  r.innerHTML = achados.length ? achados.map(({ d, no }) => `<li><button type="button" data-procura="${d.id}|${no.id}"><b>${esc(no.texto)}</b><small>${esc(d.titulo)}</small></button></li>`).join('') : '<li class="fx-p-vazio">Nenhum ecrã com esse nome.</li>';
  r.hidden = false;
}

/* ---------- exportar ---------- */
function baixar(nome: string, blob: Blob): void { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
function svgTexto(): string { const s = $('#fx-palco').querySelector('svg')!.cloneNode(true) as SVGSVGElement; s.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); s.classList.remove('is-caminho'); s.style.background = escuro() ? '#0f1115' : '#ffffff'; return new XMLSerializer().serializeToString(s); }
async function exportar(tipo: string): Promise<void> {
  const nome = `romafe-fluxo-${atual.id}`;
  if (tipo === 'svg') baixar(`${nome}.svg`, new Blob([svgTexto()], { type: 'image/svg+xml' }));
  else if (tipo === 'mmd') baixar(`${nome}.mmd`, new Blob([fonte(atual)], { type: 'text/plain' }));
  else if (tipo === 'png') {
    const s = $('#fx-palco').querySelector('svg')!, w = Number(s.getAttribute('width')), h = Number(s.getAttribute('height')), k = 2;
    const img = new Image(); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgTexto())}`; await img.decode();
    const c = document.createElement('canvas'); c.width = w * k; c.height = h * k; const g = c.getContext('2d')!; g.fillStyle = escuro() ? '#0f1115' : '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob((b) => { if (b) baixar(`${nome}.png`, b); }, 'image/png');
  } else if (tipo === 'pdf') { ajustar(); window.print(); }
  else if (tipo === 'ligacao') { await navigator.clipboard?.writeText(location.href).catch(() => undefined); aviso('Ligação copiada.'); }
  else if (tipo === 'copiar-mmd') { await navigator.clipboard?.writeText(fonte(atual)).catch(() => undefined); aviso('Mermaid copiado.'); }
  else if (tipo === 'inteiro') { if (document.fullscreenElement) await document.exitFullscreen(); else await $('#fx-area').requestFullscreen?.(); setTimeout(ajustar, 200); }
}
function aviso(t: string): void { const a = $('#fx-aviso'); a.textContent = t; a.hidden = false; setTimeout(() => { a.hidden = true; }, 1800); }

/* ---------- ligar ---------- */
function iniciar(): void {
  iniciarTema();
  const legenda = (Object.keys(TIPOS) as Tipo[]).map((k) => `<li><span class="fx-tipo fx-tipo--${k}">${TIPOS[k][0]}</span><small>${TIPOS[k][1]}</small></li>`).join('');
  $('#fx-legenda').innerHTML = legenda;
  const h = new URLSearchParams(location.hash.slice(1));
  abrir(h.get('d') ?? DIAGRAMAS[0].id, h.get('no'));
  document.addEventListener('click', (ev) => {
    const t = ev.target as Element;
    const d = t.closest<HTMLElement>('[data-diagrama]'); if (d) { abrir(d.dataset.diagrama!); return; }
    const pr = t.closest<HTMLElement>('[data-procura]'); if (pr) { const [di, no] = pr.dataset.procura!.split('|'); ($('#fx-procura') as HTMLInputElement).value = ''; procurar(''); abrir(di, no); return; }
    const ir = t.closest<HTMLElement>('[data-ir-no]'); if (ir) { escolher(ir.dataset.irNo!); return; }
    if (t.closest('[data-fechar-painel]')) { escolher(null); return; }
    const ex = t.closest<HTMLElement>('[data-exportar]'); if (ex) { ex.closest('details')?.removeAttribute('open'); void exportar(ex.dataset.exportar!); return; }
    if (t.closest('#fx-mais')) { zoomEm(1.2); return; } if (t.closest('#fx-menos')) { zoomEm(1 / 1.2); return; } if (t.closest('#fx-ajustar')) { ajustar(); return; }
    const g = t.closest<SVGGElement>('#fx-palco g.node'); if (g && !arrastou) { const id = g.dataset.no ?? ''; if (id.startsWith('grupo_')) { recolhidos.delete(Number(id.slice(6))); cabeca(); void desenhar(); } else if (!id.includes('__e')) escolher(id === escolhido ? null : id, false); return; }
    if (t.closest('#fx-tela') && !arrastou && !t.closest('g.node')) escolher(null);
  });
  document.addEventListener('keydown', (ev) => {
    const g = (ev.target as Element).closest?.<SVGGElement>('#fx-palco g.node');
    if (g && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); escolher(g.dataset.no ?? null, false); }
    if (ev.key === 'Escape') escolher(null);
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target as HTMLInputElement;
    if (t.matches('[data-grupo]')) { const i = Number(t.dataset.grupo); if (t.checked) recolhidos.delete(i); else recolhidos.add(i); void desenhar(); }
    if (t.id === 'fx-estados') { comEstados = t.checked; void desenhar(); }
  });
  $('#fx-procura').addEventListener('input', (ev) => procurar((ev.target as HTMLInputElement).value));
  /* arrastar e a roda */
  const tela = $('#fx-tela'); let a0: { x: number; y: number; px: number; py: number } | null = null; let arrastou = false;
  tela.addEventListener('pointerdown', (ev) => { a0 = { x, y, px: ev.clientX, py: ev.clientY }; arrastou = false; });
  window.addEventListener('pointermove', (ev) => { if (!a0) return; const dx = ev.clientX - a0.px, dy = ev.clientY - a0.py; if (Math.abs(dx) + Math.abs(dy) > 4) { arrastou = true; tela.classList.add('is-a-arrastar'); } if (arrastou) { x = a0.x + dx; y = a0.y + dy; aplicar(); } });
  window.addEventListener('pointerup', () => { a0 = null; tela.classList.remove('is-a-arrastar'); setTimeout(() => { arrastou = false; }, 0); });
  tela.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = tela.getBoundingClientRect(); zoomEm(ev.deltaY < 0 ? 1.12 : 1 / 1.12, ev.clientX - r.left, ev.clientY - r.top); }, { passive: false });
  window.addEventListener('resize', () => ajustar());
  /* uma ligação copiada (#d=…&no=…) aberta nesta página */
  window.addEventListener('hashchange', () => { const q = new URLSearchParams(location.hash.slice(1)); const d = q.get('d'); if (d && d !== atual.id) abrir(d, q.get('no')); else if (q.get('no')) escolher(q.get('no')); });
  new MutationObserver(() => { void desenhar(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
iniciar();
