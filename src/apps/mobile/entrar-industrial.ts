/* =========================================================
   PICK — 00 · Abertura, 01 · Entrar e 02 · Ajuda (21 out. 2026)
   Do briefing «Ultimate industrial PDA entry screen» e do pedido dela («só quero uma versão: a v5, mas mais bonita e
   mais profissional», «falta uma abertura»). Uma versão por ecrã; as v1–v4, a palavra-passe à parte e o cliente
   federado saíram (o utilizador e a palavra-passe estão no mesmo ecrã). Com o que está decidido: o nome é Pick,
   entra-se com palavra-passe (17 set.), sem entrada offline (16 set.), o terminal é o EDA61K (320 × 533 dp).
   - 00 · Abertura: o desenho em ecrã inteiro — as barras de um código, lidas por uma linha, arrumam-se numa estante
     e a caixa laranja assenta; por baixo, as verificações do aparelho (o leitor, a rede, o servidor), uma a uma, só
     com o que o PDA consegue saber. «Entrar» leva à entrada.
   - 01 · Entrar: a marca da família (ROMAFE em Motor · risco laranja · Pick), a linha de estado (a rede e o servidor
     em separado), a estante desenhada com as posições escritas (armazém 60 · zona · coluna · prateleira) e a folha
     do formulário: utilizador e palavra-passe com o ícone, mostrar a palavra-passe, «Entrar» laranja.
   - 02 · Ajuda: recuperar o acesso e o que fazer quando o PDA ou o leitor falham.
   Sem ler um cartão para entrar: só com uma política aprovada (o código de um cartão não é uma palavra-passe).
   ========================================================= */
import { I, IC, GIRADOR } from './estados';

export type EstadoEntrarPk = '' | 'a-entrar' | 'sucesso' | 'credenciais' | 'sem-rede' | 'servidor' | 'tempo' | 'sessao' | 'bloqueada' | 'pda' | 'auth' | 'restaurar' | 'preenchido';
export type EstadoAberturaPk = '' | 'sem-rede' | 'leitor';
const IC2 = {
  olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  chave: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  pda: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4M11 18h2"/>',
  servidor: IC.servidor, cadeado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', seta: '<path d="M5 12h14M13 6l6 6-6 6"/>', leitor: IC.ler,
};

/** A estante: os montantes, três prateleiras com a posição escrita, a caixa laranja com a etiqueta (o sinal da Pick);
    e as barras do código com a linha que as lê (só se veem na abertura). */
export const ESTANTE = (barras = false) => `<svg class="pki-estante-svg" viewBox="0 0 200 128" fill="none" aria-hidden="true" focusable="false">
  ${barras ? `<g class="pki-barras">${[[38, 3], [45, 2], [50, 5], [59, 2], [64, 3], [71, 6], [81, 2], [86, 4], [94, 2], [100, 5], [109, 3], [116, 2], [121, 6], [131, 2], [137, 4], [145, 3], [152, 2], [157, 5]].map(([x, w], i) => `<rect x="${x}" y="22" width="${w}" height="74" style="--i:${i}"/>`).join('')}</g>
  <line class="pki-linha" x1="30" y1="16" x2="30" y2="102"/>` : ''}
  <g class="pki-estrutura" stroke-linecap="round">
    <path class="pki-montante" d="M34 118V10M166 118V10"/>
    <path class="pki-prateleira" d="M34 40h132M34 76h132M34 112h132"/>
    <path class="pki-pe" d="M28 118h12M160 118h12" />
  </g>
  <g class="pki-etiquetas">
    <rect x="40" y="42" width="34" height="9" rx="1.5"/><text x="57" y="49" text-anchor="middle">60300101</text>
    <rect x="40" y="78" width="34" height="9" rx="1.5"/><text x="57" y="85" text-anchor="middle">60300102</text>
  </g>
  <g class="pki-caixa"><rect class="pki-caixa-corpo" x="110" y="50" width="38" height="26" rx="2.5"/><path class="pki-caixa-fita" d="M110 58h38M129 50v8"/><rect class="pki-caixa-etq" x="114" y="62" width="16" height="9" rx="1"/><path class="pki-caixa-cod" d="M116 64.5v4M118 64.5v4M120.5 64.5v4M122.5 64.5v4M125 64.5v4M127 64.5v4"/></g>
  <g class="pki-caixa pki-caixa--2"><rect class="pki-caixa-corpo pki-caixa-corpo--2" x="122" y="92" width="30" height="20" rx="2.5"/><path class="pki-caixa-fita" d="M122 98h30M137 92v6"/></g>
</svg>`;
/** A marca da família: ROMAFE (Motor, azul) · o risco laranja · Pick, com «Operações de armazém» por baixo. */
const MARCA = `<div class="pki-marca"><span class="romafe pki-romafe">ROMAFE</span><span class="pki-risco" aria-hidden="true"></span><p class="pki-produto"><b>Pick</b><span>Operações de armazém</span></p></div>`;
const estadoLinha = (rede: 'ok' | 'mal', servidor: 'ok' | 'mal' | '—') => `<header class="pki-estado" aria-label="Estado do PDA">
    <span class="pki-pilula${rede === 'mal' ? ' is-mal' : ''}"><i aria-hidden="true"></i>${rede === 'mal' ? 'Sem rede' : 'Rede'}</span>
    <span class="pki-pilula${servidor !== 'ok' ? ' is-mal' : ''}"><i aria-hidden="true"></i>${servidor === 'ok' ? 'Servidor' : servidor === '—' ? 'Servidor —' : 'Servidor sem resposta'}</span>
    <span class="pki-estado__pda">EDA61K · 24174B6440</span>
  </header>`;
const campo = (id: string, rotulo: string, icone: string, input: string, depois = '') => `<div class="pki-campo"><label for="${id}">${rotulo}</label><div class="pki-caixa"><span class="pki-caixa__icone" aria-hidden="true">${I(icone)}</span>${input}${depois}</div></div>`;
const aviso = (k: 'erro' | 'aviso' | 'ok' | 'info', icone: string, titulo: string, texto: string) => `<section class="pki-aviso pki-aviso--${k}" role="${k === 'erro' ? 'alert' : 'status'}"><span>${I(icone)}</span><div><b>${titulo}</b><p>${texto}</p></div></section>`;

/* =========================================================
   00 · Abertura
   ========================================================= */
export function aberturaPick(e: EstadoAberturaPk = ''): string {
  const passos: [string, string, string][] = [
    ['leitor', 'Leitor de códigos', e === 'leitor' ? 'mal' : 'ok'],
    ['rede', 'Rede do armazém', e === 'sem-rede' ? 'mal' : e === 'leitor' ? 'ok' : 'ok'],
    ['servidor', 'Servidor da Romafe', e === 'sem-rede' ? 'espera' : e === 'leitor' ? 'ok' : 'ok'],
  ];
  return `<div class="pka${e ? ` pka--${e}` : ''}" data-pka>
  <div class="pka-grelha" aria-hidden="true"></div>
  <div class="pka-centro">${ESTANTE(true)}${MARCA}</div>
  <section class="pka-verificar" aria-label="A preparar o PDA">
    <ul class="pka-passos" role="list">${passos.map(([k, t, s], i) => `<li class="pka-passo is-${s}" style="--i:${i}" data-passo="${k}"><span class="pka-passo__marca" aria-hidden="true">${s === 'ok' ? I(IC.fechar) : s === 'mal' ? I(IC.aviso) : GIRADOR('girador--pequeno')}</span><span>${t}</span><b>${s === 'ok' ? 'Pronto' : s === 'mal' ? (k === 'leitor' ? 'Não responde' : 'Sem sinal') : 'À espera'}</b></li>`).join('')}</ul>
    ${e === 'sem-rede' ? aviso('aviso', IC.semrede, 'Sem rede', 'A Pick precisa de rede para trabalhar. Aproxime-se de uma zona com sinal; continua sozinha quando houver.')
    : e === 'leitor' ? aviso('erro', IC2.leitor, 'O leitor não responde', 'Reinicie o leitor. Se continuar, avise o gestor do turno: pode entrar na mesma, mas os códigos terão de ser escritos.')
    : ''}
    <button type="button" class="pka-entrar" data-ir="entrada"${e === 'sem-rede' ? ' disabled' : ''}>${I(IC.entrar)}<span>${e === 'leitor' ? 'Entrar na mesma' : 'Entrar'}</span></button>
  </section>
  <p class="pka-versao">Pick 1.0 · Romafe</p>
</div>`;
}

/* =========================================================
   01 · Entrar
   ========================================================= */
export function entrarIndustrial(e: EstadoEntrarPk = ''): string {
  const semRede = e === 'sem-rede', semServidor = e === 'servidor' || e === 'auth';
  const preenchido = e !== '' && e !== 'sem-rede' && e !== 'pda';
  const AVISO: Partial<Record<EstadoEntrarPk, string>> = {
    credenciais: aviso('erro', IC2.cadeado, 'Não foi possível iniciar sessão.', 'O utilizador ou a palavra-passe não estão certos. Confirme e tente outra vez.'),
    'sem-rede': aviso('aviso', IC.semrede, 'Sem rede', 'A Pick precisa de rede para entrar. Aproxime-se de uma zona com sinal.'),
    servidor: aviso('erro', IC2.servidor, 'O servidor não está disponível', 'O PDA tem rede, mas o servidor da Romafe não respondeu. Tente dentro de um minuto.'),
    tempo: aviso('aviso', IC.relogio, 'O servidor demorou a responder', 'O pedido passou do tempo. Nada ficou feito: tente outra vez.'),
    sessao: aviso('info', IC.relogio, 'A sessão terminou', 'Esteve 15 minutos sem usar a Pick. Entre outra vez: volta onde estava.'),
    bloqueada: aviso('erro', IC2.cadeado, 'Conta bloqueada', 'Depois de várias tentativas, a conta ficou bloqueada. Peça ao gestor do turno para a desbloquear.'),
    pda: aviso('erro', IC2.pda, 'Este PDA não está autorizado', 'O PDA 24174B6440 não está registado para a Pick. O gestor regista-o uma vez.'),
    auth: aviso('erro', IC2.chave, 'O serviço de entrada não responde', 'O servidor está ligado, mas a verificação da palavra-passe não está disponível. Tente dentro de momentos.'),
    restaurar: aviso('info', IC2.pda, 'Retomar onde estava', 'Joana Silva estava a contar o INV-2026-014 na posição 60300102. Entre para continuar.'),
    sucesso: aviso('ok', IC.fechar, 'Sessão iniciada', 'Joana Silva · Arrumação · armazém 60.'),
  };
  const botao = e === 'a-entrar' ? `<button type="submit" class="pki-entrar is-a-entrar" disabled aria-busy="true">${GIRADOR('girador--claro')}<span>A entrar…</span></button>`
    : e === 'sucesso' ? `<button type="button" class="pki-entrar is-feito" data-ir="inv-inicio">${I(IC.fechar)}<span>A abrir o Inventário…</span></button>`
    : `<button type="submit" class="pki-entrar"${semRede || semServidor ? ' disabled' : ''}><span>Entrar</span>${I(IC2.seta)}</button>`;
  return `<div class="pki${e ? ` pki--${e}` : ''}" data-pki>
  ${estadoLinha(semRede ? 'mal' : 'ok', semRede ? '—' : semServidor ? 'mal' : 'ok')}
  <div class="pki-topo"><div class="pka-grelha" aria-hidden="true"></div>${MARCA}<div class="pki-desenho">${ESTANTE()}</div></div>
  <form class="pki-form" data-pki-form novalidate>
    <div class="pki-ola"><h1>Bem-vindo ao armazém</h1><p>Identifique-se para começar o turno.</p></div>
    ${AVISO[e] ?? ''}
    ${campo('pki-u', 'Utilizador ou email', IC2.pessoa, `<input id="pki-u" name="u" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="nome.apelido" value="${preenchido || e === 'pda' ? 'joana.silva' : ''}"${e === 'credenciais' ? ' aria-invalid="true"' : ''}>`)}
    ${campo('pki-p', 'Palavra-passe', IC2.cadeado, `<input id="pki-p" name="p" type="password" autocomplete="current-password" placeholder="A sua palavra-passe" value="${preenchido ? '••••••••' : ''}"${e === 'credenciais' ? ' aria-invalid="true"' : ''}>`, `<button type="button" class="pki-ver" data-pki-ver aria-label="Mostrar a palavra-passe" aria-pressed="false">${I(IC2.olho)}</button>`)}
    ${botao}
    <nav class="pki-ligacoes" aria-label="Ajuda"><button type="button" data-ir="ajuda">Recuperar acesso</button><span aria-hidden="true">·</span><button type="button" data-ir="ajuda">Ajuda</button><span aria-hidden="true">·</span><button type="button" data-pki-pda>Este PDA</button></nav>
    <p class="pki-rodape">${I(IC2.cadeado)}Acesso reservado a colaboradores da Romafe</p>
  </form>
</div>`;
}

/* =========================================================
   02 · Ajuda
   ========================================================= */
export function ajudaPick(): string {
  const item = (icone: string, titulo: string, texto: string) => `<li class="pkj-item"><span>${I(icone)}</span><div><b>${titulo}</b><p>${texto}</p></div></li>`;
  return `<div class="pki pkj" data-pki>
  ${estadoLinha('ok', 'ok')}
  <div class="pki-topo pki-topo--curto"><div class="pka-grelha" aria-hidden="true"></div>${MARCA}</div>
  <div class="pki-form">
    <div class="pki-ola"><h1>Ajuda</h1><p>Para entrar e para quando o PDA não colabora.</p></div>
    <ul class="pkj-lista" role="list">
      ${item(IC2.chave, 'Esqueci-me da palavra-passe', 'O gestor do turno repõe-na no posto da receção. Depois, escolhe uma nova à primeira entrada.')}
      ${item(IC2.cadeado, 'A conta ficou bloqueada', 'Acontece depois de várias tentativas. O gestor desbloqueia-a.')}
      ${item(IC2.leitor, 'O leitor não lê', 'Prima a tecla de leitura de novo; se não ler, reinicie o PDA. Até lá, os códigos escrevem-se à mão.')}
      ${item(IC.semrede, 'Sem rede', 'A Pick não trabalha sem rede. Aproxime-se de uma zona com sinal: continua onde estava.')}
    </ul>
    <p class="pkj-apoio">${I(IC.telefone)}Apoio Romafe · <a href="tel:+351226158300">+351 226 158 300</a></p>
    <button type="button" class="pki-entrar" data-ir="entrada">${I(IC.voltar)}<span>Voltar a entrar</span></button>
  </div>
</div>`;
}

/** Os estados do 01, escolhidos no próprio ecrã. */
export const ESTADOS_ENTRAR_PK: [EstadoEntrarPk, string, string, string][] = [
  ['preenchido', 'entrar-pk-preenchido', '01.1 · Preenchido', 'O utilizador e a palavra-passe escritos: «Entrar» pronto; Enter entra.'],
  ['a-entrar', 'entrar-pk-a-entrar', '01.2 · A entrar', 'O botão em «A entrar…» e desligado (não se entra duas vezes); o resto fica parado.'],
  ['sucesso', 'entrar-pk-sucesso', '01.3 · Sessão iniciada', 'Depois de o servidor confirmar: quem entrou, a função e o armazém; abre o Inventário (≈ 300 ms).'],
  ['credenciais', 'entrar-pk-credenciais', '01.4 · Não entrou', '«Não foi possível iniciar sessão.» — sem dizer se o utilizador existe; nada abana.'],
  ['sem-rede', 'entrar-pk-sem-rede', '01.5 · Sem rede', 'A Pick não entra sem rede (não há entrada offline): diz o que fazer.'],
  ['servidor', 'entrar-pk-servidor', '01.6 · Servidor indisponível', 'Há rede mas o servidor não responde: a linha de estado e o aviso dizem-no em separado.'],
  ['tempo', 'entrar-pk-tempo', '01.7 · Demorou demasiado', 'O pedido passou do tempo; nada ficou feito.'],
  ['auth', 'entrar-pk-auth', '01.8 · Serviço de entrada em baixo', 'O servidor responde, a verificação da palavra-passe não.'],
  ['bloqueada', 'entrar-pk-bloqueada', '01.9 · Conta bloqueada', 'Depois de várias tentativas: o gestor desbloqueia.'],
  ['pda', 'entrar-pk-pda', '01.10 · PDA não autorizado', 'O PDA não está registado para a Pick: o número de série e quem o regista.'],
  ['sessao', 'entrar-pk-sessao', '01.11 · Sessão terminada', 'Depois de 15 minutos parada: entrar outra vez e voltar onde estava.'],
  ['restaurar', 'entrar-pk-restaurar', '01.12 · Retomar a contagem', 'Havia uma contagem a meio neste PDA: diz qual e onde; continua depois de entrar.'],
];
export const ESTADOS_ABERTURA_PK: [EstadoAberturaPk, string, string, string][] = [
  ['sem-rede', 'abertura-pk-sem-rede', '00.1 · Sem rede', 'O leitor está pronto, a rede não: espera pelo sinal e segue sozinha; «Entrar» desligado.'],
  ['leitor', 'abertura-pk-leitor', '00.2 · O leitor não responde', 'A rede e o servidor estão prontos, o leitor não: reiniciar, ou entrar na mesma e escrever os códigos.'],
];
