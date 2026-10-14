/* =========================================================
   GOPARTS — os ecrãs iniciais no estilo do getlayers.ai: o que mexe (14 out. 2026)
   - o gradiente granulado dos painéis (.ly-shader): um shader de ruído que corre devagar e
     se inclina para o rato, com as três cores dos tokens (--ly-s1, --ly-s2, --ly-s3, que mudam
     com o tema). Só desenha os painéis à vista, da versão à vista; com «reduzir movimento»
     desenha uma imagem parada. Sem WebGL, fica o gradiente do CSS por baixo;
   - as secções ganham .is-visivel ao entrar no ecrã (as entradas são CSS) e os números contam;
   - o vídeo do cartão toca ao passar o rato (ou ao entrar no ecrã, num ecrã tátil);
   - o rolamento dos passos de entrar (v3): ao mudar de passo, o novo começa no --ly-g em que o outro
     estava e continua a montar-se até ao seu (a transição é do CSS); «Entrar» completa-o (--ly-g 1)
     e só passa ao Início quando acaba; «Como funciona» desce até aos passos.
   ========================================================= */
const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lim = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
/* ruído de valor com fbm, dobrado sobre si próprio (domain warp) para correr como fumo; o rato
   puxa a luz para o seu lado; o grão é ruído por píxel, mudado a cada frame */
const FRAG = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;uniform float g;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*1.6;
  vec2 q=vec2(fbm(p+t*.05),fbm(p+vec2(5.2,1.3)-t*.04));
  float f=fbm(p+2.2*q+vec2(t*.03,0.));
  float luz=smoothstep(.8,0.,distance(uv,m));
  float k=clamp(f*1.2-.18*uv.y+.05,0.,1.);
  vec3 col=mix(c1,c2,smoothstep(.15,.85,k));
  /* o laranja: veios finos onde o fumo dobra (e mais fortes perto do rato), não manchas */
  float veio=smoothstep(.0,1.,1.-abs(f-.58)*10.)*(.45+.55*luz);
  col=mix(col,c3,clamp(veio,0.,1.)*.85);
  col+=c3*luz*.08;
  col+=(h(gl_FragCoord.xy+fract(t)*91.)-.5)*g;
  gl_FragColor=vec4(col,1.);
}`;

interface Painel { cv: HTMLCanvasElement; gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null>; m: [number, number]; alvo: [number, number]; visivel: boolean; cores: number[][]; grao: number; ler: number }
const paineis = new Map<HTMLCanvasElement, Painel>();

function cor(v: string): number[] {
  const s = v.trim().replace('#', '');
  const x = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
}
function lerCores(p: Painel): void {
  const cs = getComputedStyle(p.cv);
  p.cores = ['--ly-s1', '--ly-s2', '--ly-s3'].map((k) => cor(cs.getPropertyValue(k) || '#888'));
  p.grao = Number(cs.getPropertyValue('--ly-grao')) || 0.06;
}

let vis: IntersectionObserver | null = null;
function preparar(cv: HTMLCanvasElement): Painel | null {
  if (paineis.has(cv)) return paineis.get(cv)!;
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const sh = (tipo: number, src: string) => { const s = gl.createShader(tipo)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(['r', 't', 'm', 'c1', 'c2', 'c3', 'g'].map((k) => [k, gl.getUniformLocation(prog, k)]));
  const p: Painel = { cv, gl, u, m: [0.7, 0.8], alvo: [0.7, 0.8], visivel: false, cores: [], grao: 0.06, ler: 0 };
  lerCores(p);
  paineis.set(cv, p);
  cv.classList.add('is-pronto');
  const pai = cv.parentElement!;
  pai.addEventListener('pointermove', (e) => { const b = cv.getBoundingClientRect(); p.alvo = [lim((e.clientX - b.left) / b.width), lim(1 - (e.clientY - b.top) / b.height)]; });
  pai.addEventListener('pointerleave', () => { p.alvo = [0.7, 0.8]; });
  vis = vis || new IntersectionObserver((es) => es.forEach((e) => { const q = paineis.get(e.target as HTMLCanvasElement); if (q) q.visivel = e.isIntersecting; }));
  vis.observe(cv);
  return p;
}

function desenhar(p: Painel, t: number): void {
  const { cv, gl, u } = p;
  /* meia resolução chega para um gradiente; o grão fica do tamanho de 2 píxeis, como o do getlayers */
  const k = Math.min(1, devicePixelRatio) * 0.5, w = Math.max(1, Math.round(cv.clientWidth * k)), hh = Math.max(1, Math.round(cv.clientHeight * k));
  if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; gl.viewport(0, 0, w, hh); }
  if (++p.ler % 30 === 1) lerCores(p);
  p.m = [p.m[0] + (p.alvo[0] - p.m[0]) * 0.04, p.m[1] + (p.alvo[1] - p.m[1]) * 0.04];
  gl.uniform2f(u.r, w, hh); gl.uniform1f(u.t, t); gl.uniform2f(u.m, p.m[0], p.m[1]);
  gl.uniform3fv(u.c1, p.cores[0]); gl.uniform3fv(u.c2, p.cores[1]); gl.uniform3fv(u.c3, p.cores[2]); gl.uniform1f(u.g, p.grao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

let ciclo = 0;
function frame(ms: number): void {
  ciclo = requestAnimationFrame(frame);
  const t = quieto() ? 12 : ms / 1000;
  paineis.forEach((p) => {
    if (!p.cv.isConnected) { paineis.delete(p.cv); return; }
    if (p.visivel && !p.cv.closest('[hidden]')) desenhar(p, t);
  });
}

/* ---------- as entradas, os números e o vídeo do cartão ---------- */
function contar(el: HTMLElement): void {
  if (el.dataset.contado) return;
  el.dataset.contado = '1';
  const fim = Number(el.dataset.contar), mil = el.hasAttribute('data-mil'), mais = el.hasAttribute('data-mais');
  const fmt = (n: number) => (mil ? String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(Math.round(n))) + (mais ? '+' : '');
  if (quieto()) { el.textContent = fmt(fim); return; }
  const t0 = performance.now();
  const passo = (t: number) => { const k = lim((t - t0) / 1400); el.textContent = fmt(fim * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}
let entradas: IntersectionObserver | null = null;
function ligar(raiz: HTMLElement): void {
  if (raiz.dataset.lyLigada) return;
  raiz.dataset.lyLigada = '1';
  entradas = entradas || new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const s = e.target as HTMLElement;
    s.classList.add('is-visivel');
    s.querySelectorAll<HTMLElement>('[data-contar]').forEach(contar);
  }), { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  raiz.querySelectorAll<HTMLElement>('section').forEach((s) => entradas!.observe(s));
  const tatil = !window.matchMedia('(hover: hover)').matches;
  raiz.querySelectorAll<HTMLVideoElement>('.ly-cartao__video').forEach((v) => {
    const tocar = () => { if (!quieto()) v.play().catch(() => {}); }, parar = () => v.pause();
    const c = v.closest('.ly-cartao')!;
    c.addEventListener('pointerenter', tocar); c.addEventListener('pointerleave', parar);
    c.addEventListener('focusin', tocar); c.addEventListener('focusout', parar);
    if (tatil) new IntersectionObserver(([e]) => (e.isIntersecting ? tocar() : parar()), { threshold: 0.6 }).observe(v);
  });
}


/* ---------- o rolamento que se monta de passo em passo ---------- */
let ultimoG: number | null = null;
let rolAtual: HTMLElement | null = null;
function continuarRolamento(): void {
  const el = document.querySelector<HTMLElement>('.ecra:not([hidden]) > .versao:not([hidden]) .ly-rol');
  if (el === rolAtual) return;
  rolAtual = el;
  if (!el) { ultimoG = null; return; }
  const alvo = Number(el.dataset.g) || 0;
  el.classList.remove('is-pronto');
  if (!quieto()) {
    el.style.transition = 'none';
    el.style.setProperty('--ly-g', String(ultimoG ?? 0));
    void el.offsetWidth;
    el.style.transition = '';
  }
  requestAnimationFrame(() => el.style.setProperty('--ly-g', String(alvo)));
  ultimoG = alvo;
}
/* «Entrar» (data-ir="inicio" nos passos de entrar v3): primeiro o rolamento fica completo, depois segue */
function entrarComRolamento(ev: MouseEvent): void {
  if (document.body.classList.contains('editando') || document.body.classList.contains('com-fluxo')) return;
  const b = (ev.target as Element).closest?.<HTMLElement>('.ly-login [data-ir="inicio"]');
  if (!b || b.dataset.montado || quieto()) return;
  const rol = b.closest('.ly-login')?.querySelector<HTMLElement>('.ly-rol');
  if (!rol) return;
  ev.preventDefault(); ev.stopPropagation();
  rol.style.setProperty('--ly-g', '1');
  rol.classList.add('is-pronto');
  ultimoG = 1;
  window.setTimeout(() => { b.dataset.montado = '1'; b.click(); delete b.dataset.montado; }, 1300);
}

function armar(): void {
  document.querySelectorAll<HTMLCanvasElement>('.ly-shader').forEach((cv) => { preparar(cv); });
  document.querySelectorAll<HTMLElement>('.ly').forEach(ligar);
  continuarRolamento();
}

export function iniciar(): void {
  requestAnimationFrame(armar);
  ['romafe:versao', 'romafe:ecra'].forEach((e) => document.addEventListener(e, () => requestAnimationFrame(armar)));
  window.addEventListener('hashchange', () => requestAnimationFrame(armar));
  if (!ciclo) ciclo = requestAnimationFrame(frame);
  window.addEventListener('click', entrarComRolamento, true);
  document.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest?.<HTMLElement>('.ly [data-rolar]');
    if (!b || document.body.classList.contains('editando')) return;
    b.closest('.ly')?.querySelector(b.dataset.rolar!)?.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'center' });
  });
}
