/* =========================================================
   PICK — o Gestor de Armazém (22 out. 2026), do briefing dela «StockFlow V3 — Warehouse manager experience»:
   «login universal ROMAFE → abertura cinematográfica → página inicial do armazém», como o ERP e o Peça A Peça.
   (O nome fica Pick, decidido a 8 out.; o briefing chama-lhe StockFlow. Só há o armazém 60, por isso não há
   escolha de armazém. Sem rede a Pick não trabalha — decisão de 17 set. —, por isso não há dados em cache nem
   «por sincronizar»: sem rede, diz-se e espera.)
     - 00 · Abertura: desenha-se por cima da própria página do Gestor. Num armazém em 2,5D, o porta-paletes traz a
       palete, o feixe laranja marca a posição, pousa-a e confirma; aparece ROMAFE | Pick e, na passagem, a caixa
       voa para o ícone do Inventário e a marca para o cabeçalho, enquanto a página aparece por baixo.
     - 60 · Início do Gestor: o armazém e a rede em cima; «Bom dia, Ana»; o Inventário como ação dominante (o que
       está em curso, por validar e por recontar, e o progresso em posições); «Requer a tua atenção»; os
       inventários em curso; a equipa (só o que está atribuído, sem presença inventada); o acesso rápido; os
       módulos como pastas (só os ativos e autorizados).
     - 61 · Inventário (Gestor): em curso, por iniciar, por validar e concluídos; divergências e recontagens;
       criar inventário e atribuir contagens.
   Os números saem das contagens que a Pick já tem (inventario.ts): INV-2026-014 em curso na zona 30 (18 de 46
   posições), INV-2026-015 planeada na zona 10 e INV-2026-011 submetida (por validar).
   ========================================================= */
import { I, IC } from './estados';
import { CAIXA, PORTA_PALETES, ARMAZEM, POSICAO } from './cena';

const IC2 = {
  caixa: '<path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>', voltar: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  aviso: IC.aviso, pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', pessoas: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6.3"/>',
  mais: '<path d="M12 5v14M5 12h14"/>', lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/>',
  historico: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>', divergencia: '<path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5"/>', recontar: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  validar: '<path d="M20 6 9 17l-5-5"/>', atribuir: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  rede: IC.rede, semrede: IC.semrede, pasta: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
};
export const ARMAZEM_GP = 'Armazém 60 · Coimbra';
const GESTORA = { nome: 'Ana Ferreira', primeiro: 'Ana', iniciais: 'AF' };

/* ---------- o menu (como viria de /api/v1/navigation?app=pick) e as rotas registadas ---------- */
export interface LinhaPick { id: string; rotulo: string; rota: string; papeis: ('gestor' | 'operador')[]; ativo: boolean; ordem: number }
export const MENU_PICK: LinhaPick[] = [
  { id: 'inventario', rotulo: 'Inventário', rota: 'pick.inventario', papeis: ['gestor', 'operador'], ativo: true, ordem: 10 },
  { id: 'arrumacao', rotulo: 'Arrumação', rota: 'pick.arrumacao', papeis: ['gestor', 'operador'], ativo: false, ordem: 20 },
  { id: 'separacao', rotulo: 'Separação', rota: 'pick.separacao', papeis: ['gestor', 'operador'], ativo: false, ordem: 30 },
  { id: 'expedicao', rotulo: 'Expedição', rota: 'pick.expedicao', papeis: ['gestor', 'operador'], ativo: false, ordem: 40 },
];
/** A rota → o ecrã de cada papel (o gestor e o operador entram no mesmo módulo por portas diferentes). */
export const ROTAS_PICK: Record<string, { gestor: string; operador: string }> = { 'pick.inventario': { gestor: 'gestor-inventario', operador: 'inv-inicio' } };

/* ---------- os dados (os da Pick, inventario.ts) ---------- */
export interface Inv { ref: string; tipo: string; area: string; estado: 'curso' | 'planeada' | 'submetida' | 'concluida'; feitas: number; total: number; quem: string; data: string }
export const INVENTARIOS: Inv[] = [
  { ref: 'INV-2026-014', tipo: 'Por posição', area: 'Zona 30 · colunas 01–12', estado: 'curso', feitas: 18, total: 46, quem: 'Joana Silva', data: '21/10' },
  { ref: 'INV-2026-015', tipo: 'Cíclica', area: 'Zona 10 · rolamentos', estado: 'planeada', feitas: 0, total: 30, quem: '', data: '22/10' },
  { ref: 'INV-2026-011', tipo: 'Por posição', area: 'Zona 21 · colunas 01–04', estado: 'submetida', feitas: 16, total: 16, quem: 'Joana Silva', data: '18/10' },
  { ref: 'INV-2026-009', tipo: 'Cíclica', area: 'Zona 12 · retentores', estado: 'concluida', feitas: 24, total: 24, quem: 'Inês Rocha', data: '14/10' },
];
const ATENCAO: [string, string, string, string, string, 'erro' | 'aviso' | 'info'][] = [
  // ícone, título, referência, estado, ação → ecrã
  [IC2.validar, 'Inventário por validar', 'INV-2026-011 · zona 21 · 16 posições', 'Submetido', 'inv-divergencias', 'aviso'],
  [IC2.divergencia, 'Divergência por rever', '60300105 · INV-2026-011 · 3 un. a menos', 'Por rever', 'inv-divergencias', 'erro'],
  [IC2.recontar, 'Recontagem pedida', '60300107 · INV-2026-011', 'Por atribuir', 'inv-recontar', 'aviso'],
  [IC2.atribuir, 'Contagem sem operador', 'INV-2026-015 · zona 10 · 30 posições', 'Por atribuir', 'gestor-atribuir', 'info'],
];
const EQUIPA: [string, string, string, string][] = [
  ['Joana Silva', 'JS', 'Contagem · INV-2026-014', '28 posições por contar'],
  ['Tiago Lopes', 'TL', 'Separação', 'tarefas do motor'],
  ['Inês Rocha', 'IR', 'Sem contagem atribuída', ''],
];

const prog = (f: number, t: number) => `<span class="gp-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${t}" aria-valuenow="${f}" aria-label="${f} de ${t} posições"><i style="--p:${t ? f / t : 0}"></i></span>`;
const btn = (t: string, ic: string, extra = '', cls = '') => `<button type="button" class="gp-btn${cls ? ` ${cls}` : ''}"${extra}>${I(ic)}<span>${t}</span></button>`;

/* ---------- o cabeçalho ---------- */
function topo(o: { voltar?: string; titulo?: string; rede?: boolean } = {}): string {
  const rede = o.rede !== false;
  return `<header class="gp-topo">
    ${o.voltar ? `<button type="button" class="gp-voltar" data-ir="${o.voltar}" aria-label="Voltar">${I(IC2.voltar)}</button>` : ''}
    <div class="gp-marca" data-gp-marca><span class="romafe gp-romafe">ROMAFE</span><i aria-hidden="true"></i><b>Pick</b></div>
    <span class="gp-rede${rede ? '' : ' is-mal'}" title="${rede ? 'Ligado ao servidor' : 'Sem rede'}">${I(rede ? IC2.rede : IC2.semrede)}<span class="sr-only">${rede ? 'Ligado' : 'Sem rede'}</span></span>
    <button type="button" class="gp-conta" aria-label="Conta de ${GESTORA.nome}">${GESTORA.iniciais}</button>
    <p class="gp-onde">${o.titulo ? `<b>${o.titulo}</b> · ` : ''}${ARMAZEM_GP}</p>
  </header>`;
}

/* ---------- 60 · Início do Gestor ---------- */
export type CenarioGestor = 'normal' | 'carregar' | 'sem-inventarios' | 'sem-tarefas' | 'erro' | 'sem-rede' | 'sessao' | 'sem-acesso' | 'sem-armazem' | 'permissao' | 'menus';
export function gestorInicio(cen: CenarioGestor = 'normal', extra = ''): string {
  const vazio = cen === 'sem-inventarios', carga = cen === 'carregar', semRede = cen === 'sem-rede';
  const emCurso = vazio ? [] : INVENTARIOS.filter((i) => i.estado === 'curso' || i.estado === 'planeada');
  const atencao = vazio || cen === 'sem-tarefas' ? [] : ATENCAO;
  const c = INVENTARIOS.find((i) => i.estado === 'curso');
  if (cen === 'sem-acesso' || cen === 'sem-armazem' || cen === 'sessao') {
    const [t, x, b] = cen === 'sem-acesso' ? ['A tua conta não tem acesso à Pick.', 'Pede o acesso ao administrador da tua empresa.', ''] : cen === 'sem-armazem' ? ['Ainda não tens um armazém atribuído.', 'O administrador atribui-te o armazém 60 na tua conta ROMAFE.', ''] : ['A sessão terminou.', 'Por segurança, entra outra vez. Voltas ao sítio onde estavas.', btn('Entrar outra vez', IC.entrar, ' data-login', 'gp-btn--acao')];
    return `<div class="gp" data-gp data-gp-cenario="${cen}">${topo()}<main class="gp-corpo gp-corpo--centro"><section class="gp-estado">${I(IC2.aviso)}<b>${t}</b><p>${x}</p>${b}</section></main>${extra}</div>`;
  }
  return `<div class="gp" data-gp data-gp-cenario="${cen}">
  ${topo({ rede: !semRede })}
  ${semRede ? `<p class="gp-faixa" role="status">${I(IC2.semrede)}<span><b>Sem rede.</b> A Pick precisa de rede para mostrar o armazém. Continua quando houver sinal.</span></p>` : ''}
  ${cen === 'permissao' ? `<p class="gp-faixa gp-faixa--info" role="status">${I(IC2.pessoa)}<span>As tuas permissões mudaram: agora vês só o que é do <b>operador</b>. Volta a entrar para as atualizar.</span></p>` : ''}
  <main class="gp-corpo${semRede ? ' is-off' : ''}">
    <div class="gp-ola gp-r" style="--r:0"><h1><span data-gp-saudacao>Bom dia</span>, ${GESTORA.primeiro}</h1><p>Estas são as operações do teu armazém.</p></div>

    <section class="gp-inv gp-r" style="--r:1" aria-labelledby="gp-inv-t">
      <div class="gp-inv-cab"><span class="gp-inv-ic" data-gp-alvo>${I(IC2.caixa)}</span><h2 id="gp-inv-t">Inventário</h2></div>
      ${carga ? '<div class="gp-esq"><i></i><i></i></div>' : cen === 'erro' ? `<p class="gp-inv-erro">${I(IC2.aviso)}Não foi possível carregar os inventários. ${btn('Tentar outra vez', IC2.recontar, ' data-gp-repetir', 'gp-btn--sec')}</p>` : `
      <dl class="gp-inv-num"><div><dt>Em curso</dt><dd>${vazio ? 0 : 1}</dd></div><div><dt>Por validar</dt><dd>${vazio ? 0 : 1}</dd></div><div><dt>Recontagens</dt><dd>${vazio ? 0 : 1}</dd></div></dl>
      ${c && !vazio ? `<div class="gp-inv-cur"><p><b>${c.ref}</b><span>${c.area}</span></p>${prog(c.feitas, c.total)}<small>${c.feitas} de ${c.total} posições · ${c.quem}</small></div>` : '<p class="gp-inv-vazio">Não há inventários em curso.</p>'}`}
      <button type="button" class="gp-btn gp-btn--acao gp-btn--grande" data-ir="gestor-inventario"${semRede ? ' disabled' : ''}>${I(IC2.caixa)}<span>Gerir inventários</span>${I(IC2.seta)}</button>
    </section>

    <section class="gp-sec gp-r" style="--r:2" aria-labelledby="gp-at-t"><h2 class="gp-h" id="gp-at-t">Requer a tua atenção${atencao.length ? ` <span class="gp-conta-n">${atencao.length}</span>` : ''}</h2>
      ${carga ? '<div class="gp-esq"><i></i><i></i><i></i></div>' : atencao.length ? `<ul class="gp-lista">${atencao.map(([ic, t, ref, est, ir, tom], i) => `<li style="--i:${i}"><button type="button" class="gp-item gp-item--${tom}" data-ir="${ir}"${semRede ? ' disabled' : ''}><span class="gp-item-ic">${I(ic)}</span><span class="gp-item-t"><b>${t}</b><small>${ref}</small></span><span class="gp-item-e">${est}</span></button></li>`).join('')}</ul>`
      : `<p class="gp-vazio">${I(IC2.validar)}Nada pede a tua atenção agora.</p>`}
    </section>

    <section class="gp-sec gp-r" style="--r:3" aria-labelledby="gp-ec-t"><h2 class="gp-h" id="gp-ec-t">Inventários em curso</h2>
      ${carga ? '<div class="gp-esq"><i></i><i></i></div>' : emCurso.length ? `<ul class="gp-lista">${emCurso.map((v, i) => `<li style="--i:${i}"><button type="button" class="gp-inv-linha" data-ir="gestor-inventario"${semRede ? ' disabled' : ''}><span class="gp-inv-linha-t"><b>${v.ref}</b><small>${v.area}</small></span>${v.estado === 'curso' ? prog(v.feitas, v.total) : ''}<span class="gp-inv-linha-q">${v.estado === 'curso' ? `${v.feitas}/${v.total} · ${v.quem}` : 'Planeado · sem operador'}</span></button></li>`).join('')}</ul>`
      : `<p class="gp-vazio">${I(IC2.caixa)}Sem inventários em curso. ${btn('Criar inventário', IC2.mais, ' data-ir="gestor-inv-novo"', 'gp-btn--sec')}</p>`}
    </section>

    <section class="gp-sec gp-r" style="--r:4" aria-labelledby="gp-eq-t"><h2 class="gp-h" id="gp-eq-t">Equipa</h2>
      <ul class="gp-equipa">${EQUIPA.map(([n, ini, t, s]) => `<li><span class="gp-av">${ini}</span><span><b>${n}</b><small>${t}${s ? ` · ${s}` : ''}</small></span></li>`).join('')}</ul>
      <button type="button" class="gp-ligacao" data-ir="gestor-atribuir"${semRede ? ' disabled' : ''}>${I(IC2.atribuir)}1 contagem por atribuir</button>
    </section>

    <section class="gp-sec gp-r" style="--r:5" aria-labelledby="gp-ac-t"><h2 class="gp-h" id="gp-ac-t">Acesso rápido</h2>
      <div class="gp-rapido">${([[IC2.mais, 'Criar inventário', 'gestor-inv-novo'], [IC2.atribuir, 'Atribuir contagens', 'gestor-atribuir'], [IC2.divergencia, 'Ver divergências', 'inv-divergencias'], [IC2.lupa, 'Consultar stock', 'inv-consultar']] as const).map(([ic, t, ir]) => `<button type="button" class="gp-rap" data-ir="${ir}"${semRede ? ' disabled' : ''}>${I(ic)}<span>${t}</span></button>`).join('')}</div>
    </section>

    <section class="gp-sec gp-r" style="--r:6" aria-labelledby="gp-md-t"><h2 class="gp-h" id="gp-md-t">Módulos</h2>
      ${cen === 'menus' ? `<p class="gp-vazio">${I(IC2.aviso)}Os módulos não carregaram. ${btn('Tentar outra vez', IC2.recontar, ' data-gp-repetir', 'gp-btn--sec')}</p>`
      : `<div class="gp-modulos">${MENU_PICK.filter((m) => m.ativo && m.papeis.includes('gestor')).map((m) => `<button type="button" class="gp-pasta" data-ir="${ROTAS_PICK[m.rota].gestor}"${semRede ? ' disabled' : ''}><span class="gp-pasta-g">${I(IC2.pasta)}${I(IC2.caixa)}</span><b>${m.rotulo}</b></button>`).join('')}</div>`}
    </section>
  </main>
  ${extra}
</div>`;
}

/* ---------- 61 · Inventário (Gestor) ---------- */
export type CenarioGInv = 'normal' | 'novo' | 'atribuir';
const ESTADO_INV: Record<Inv['estado'], [string, string]> = { curso: ['Em curso', 'curso'], planeada: ['Por iniciar', 'planeada'], submetida: ['Por validar', 'validar'], concluida: ['Concluído', 'ok'] };
export function gestorInventario(cen: CenarioGInv = 'normal'): string {
  if (cen === 'novo') return `<div class="gp" data-gp data-gp-cenario="novo">${topo({ voltar: 'gestor-inventario', titulo: 'Novo inventário' })}
    <main class="gp-corpo"><h1 class="gp-titulo">Criar inventário</h1>
      <form class="gp-form" data-gp-form onsubmit="return false">
        <label class="gp-campo"><span>Tipo</span><select><option>Por posição</option><option>Cíclica</option><option>Por artigo</option></select></label>
        <label class="gp-campo"><span>Zona</span><select><option>Zona 10</option><option>Zona 12</option><option>Zona 21</option><option selected>Zona 30</option></select></label>
        <label class="gp-campo"><span>Colunas</span><input value="13–20" inputmode="numeric"></label>
        <label class="gp-campo"><span>Às cegas</span><select><option>Sim — o operador não vê as quantidades</option><option>Não</option></select></label>
        <label class="gp-campo"><span>Operador</span><select><option>Por atribuir (o motor sugere)</option><option>Joana Silva</option><option>Inês Rocha</option></select></label>
        ${btn('Criar inventário', IC2.mais, ' data-ir="gestor-inventario"', 'gp-btn--acao gp-btn--grande')}
      </form></main></div>`;
  if (cen === 'atribuir') {
    const v = INVENTARIOS[1];
    return `<div class="gp" data-gp data-gp-cenario="atribuir">${topo({ voltar: 'gestor-inventario', titulo: 'Atribuir' })}
    <main class="gp-corpo"><h1 class="gp-titulo">Atribuir contagem</h1>
      <div class="gp-cartao"><b>${v.ref}</b><small>${v.tipo} · ${v.area} · ${v.total} posições</small></div>
      <h2 class="gp-h">Operador</h2>
      <ul class="gp-escolha" role="radiogroup" aria-label="Operador">${EQUIPA.map(([n, ini, t], i) => `<li><label class="gp-op"><input type="radio" name="gp-op"${i === 2 ? ' checked' : ''}><span class="gp-av">${ini}</span><span><b>${n}</b><small>${t}</small></span>${i === 2 ? '<em>Sugerido</em>' : ''}</label></li>`).join('')}</ul>
      <p class="gp-nota">O motor sugere quem está sem contagem; a tarefa chega ao PDA do operador quando entrar ou acabar a que tem.</p>
      ${btn('Atribuir', IC2.atribuir, ' data-ir="gestor-inventario"', 'gp-btn--acao gp-btn--grande')}
    </main></div>`;
  }
  const grupos: Inv['estado'][] = ['curso', 'planeada', 'submetida', 'concluida'];
  return `<div class="gp" data-gp data-gp-cenario="inventario">
  ${topo({ voltar: 'gestor-inicio', titulo: 'Inventário' })}
  <main class="gp-corpo">
    <div class="gp-inv-topo"><h1 class="gp-titulo">Inventário</h1>${btn('Criar', IC2.mais, ' data-ir="gestor-inv-novo"', 'gp-btn--acao')}</div>
    <div class="gp-filtros" role="tablist" aria-label="Estado">${grupos.map((g, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-gp-filtro="${g}">${ESTADO_INV[g][0]} <span>${INVENTARIOS.filter((v) => v.estado === g).length}</span></button>`).join('')}</div>
    <ul class="gp-lista" data-gp-lista>${INVENTARIOS.map((v) => `<li data-gp-estado="${v.estado}"${v.estado === 'curso' ? '' : ' hidden'}><div class="gp-inv-card"><p><b>${v.ref}</b><span class="gp-tag gp-tag--${ESTADO_INV[v.estado][1]}">${ESTADO_INV[v.estado][0]}</span></p><small>${v.tipo} · ${v.area} · ${v.data}</small>${v.total ? prog(v.feitas, v.total) : ''}<small>${v.feitas} de ${v.total} posições${v.quem ? ` · ${v.quem}` : ' · sem operador'}</small>
      <div class="gp-inv-acoes">${v.estado === 'submetida' ? btn('Validar', IC2.validar, ' data-ir="inv-divergencias"', 'gp-btn--acao') : v.estado === 'planeada' ? btn('Atribuir', IC2.atribuir, ' data-ir="gestor-atribuir"', 'gp-btn--acao') : v.estado === 'curso' ? btn('Ver contagem', IC2.lista, ' data-ir="inv-contados"', 'gp-btn--sec') : btn('Histórico', IC2.historico, ' data-ir="inv-contados"', 'gp-btn--sec')}</div></div></li>`).join('')}</ul>
    <div class="gp-dois">
      <button type="button" class="gp-rap" data-ir="inv-divergencias">${I(IC2.divergencia)}<span>Divergências <b>2</b></span></button>
      <button type="button" class="gp-rap" data-ir="inv-recontar">${I(IC2.recontar)}<span>Recontagens <b>1</b></span></button>
    </div>
  </main>
</div>`;
}

/* ---------- 00 · Abertura: por cima do Início do Gestor ---------- */
export type CenarioAbertura = 'normal' | 'sem-rede' | 'sem-acesso';
/** A camada da abertura (o armazém, o porta-paletes, a marca), para pôr por cima da página do papel. */
export function camadaAbertura(cen: CenarioAbertura = 'normal'): string {
  return `<div class="gpa${cen === 'normal' ? '' : ' is-a is-b is-c is-d is-fim'}" data-gpa data-gpa-cenario="${cen}" data-por-cima role="status" aria-label="A abrir a Pick">
    <div class="gpa-palco" aria-hidden="true">
      ${ARMAZEM}
      <div class="gpa-posicao">${POSICAO}<i class="gpa-feixe"></i><span class="gpa-ok">${I(IC2.validar)}</span></div>
      <div class="gpa-veiculo"><div class="gpa-porta">${PORTA_PALETES}</div></div><div class="gpa-caixa" data-gpa-caixa>${CAIXA()}</div>
    </div>
    <div class="gpa-centro">
      <p class="gpa-marca" data-gpa-marca><span class="romafe gpa-romafe">ROMAFE</span><i aria-hidden="true"></i><b>Pick</b></p>
      <p class="gpa-sub">Operações de armazém</p>
      ${cen === 'sem-rede' ? `<p class="gpa-msg">${I(IC2.semrede)}Sem rede. A Pick precisa de rede para abrir; continua sozinha quando houver sinal.</p>` : cen === 'sem-acesso' ? `<p class="gpa-msg">${I(IC2.aviso)}A tua conta não tem acesso à Pick. Fala com o gestor de turno.</p>` : ''}
    </div>
    <button type="button" class="gpa-saltar" data-gpa-saltar>Saltar</button>
  </div>`;
}
export function aberturaGestor(cen: CenarioAbertura = 'normal'): string {
  const camada = camadaAbertura(cen);
  return gestorInicio('normal', camada).replace('<div class="gp" data-gp data-gp-cenario="normal">', '<div class="gp is-abertura" data-gp data-gp-cenario="normal" data-gp-abertura>').replace('<main class="gp-corpo">', '<main class="gp-corpo" aria-hidden="true" inert>');
}
