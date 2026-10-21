/* =========================================================
   PICK — 01 · Entrar v5: a entrada industrial (21 out. 2026)
   Do briefing «Ultimate industrial PDA entry screen» que ela colou, com o que está decidido: o nome é Pick (não
   «StockFlow»), entra-se com palavra-passe (17 set.), a Pick não trabalha sem rede (16 set.: sem entrada offline),
   o terminal é o EDA61K (320 × 533 dp). Uma versão nova (as v1–v4 ficam como estavam).
   - Em cima, a linha de estado: a rede e o servidor separados (ter Wi-Fi não quer dizer que o servidor responde) e
     o número do PDA (o de série, que se lê no próprio aparelho).
   - A marca: o ROMAFE em Motor, azul, e «Pick · Operações de armazém».
   - O desenho: as barras de um código lidas por uma linha, que se arrumam numa estante; uma caixa laranja numa
     prateleira é o sinal da Pick. Abre uma vez por sessão (≈ 1,3 s); o formulário funciona desde o início.
   - Utilizador e palavra-passe no mesmo ecrã (há pouca altura e o aparelho é de todos); mostrar a palavra-passe;
     «Entrar» laranja; «Recuperar acesso», «Ajuda» e «Este PDA».
   Sem ler um cartão para entrar: só quando houver uma política aprovada (o código de um cartão não é palavra-passe).
   ========================================================= */
import { I, IC, GIRADOR } from './estados';

export type EstadoEntrarPk = '' | 'a-entrar' | 'sucesso' | 'credenciais' | 'sem-rede' | 'servidor' | 'tempo' | 'sessao' | 'bloqueada' | 'pda' | 'auth' | 'restaurar' | 'preenchido';
const IC2 = {
  olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  chave: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  pda: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 5h4M11 18h2"/>',
  servidor: IC.servidor, cadeado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
};

/** O desenho: as barras (lidas pela linha), a estante e a caixa — o sinal da Pick. */
const DESENHO = `<svg class="pki-sinal" viewBox="0 0 160 96" fill="none" aria-hidden="true" focusable="false">
  <g class="pki-barras">${[[18, 3], [25, 2], [30, 5], [39, 2], [44, 3], [51, 6], [61, 2], [66, 4], [74, 2], [80, 5], [89, 3], [96, 2], [101, 6], [111, 2], [117, 4], [125, 3], [132, 2], [137, 5]].map(([x, w], i) => `<rect x="${x}" y="14" width="${w}" height="54" style="--i:${i}"/>`).join('')}</g>
  <line class="pki-linha" x1="10" y1="10" x2="10" y2="72"/>
  <g class="pki-estante" stroke-linecap="round" stroke-width="3"><path d="M26 86V14M134 86V14"/><path d="M26 32h108M26 56h108M26 80h108"/></g>
  <g class="pki-caixa"><rect x="86" y="38" width="26" height="18" rx="2"/><path d="M86 44h26M99 38v6"/></g>
</svg>`;

const campo = (id: string, rotulo: string, input: string, o: { erro?: string; dentro?: string } = {}) => `<div class="pki-campo${o.erro ? ' is-erro' : ''}"><label for="${id}">${rotulo}</label><div class="pki-caixa">${input}${o.dentro ?? ''}</div>${o.erro ? `<p class="pki-erro-campo" id="${id}-erro">${o.erro}</p>` : ''}</div>`;
const aviso = (k: 'erro' | 'aviso' | 'ok' | 'info', icone: string, titulo: string, texto: string) => `<section class="pki-aviso pki-aviso--${k}" role="${k === 'erro' ? 'alert' : 'status'}"><span>${I(icone)}</span><div><b>${titulo}</b><p>${texto}</p></div></section>`;

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
    : `<button type="submit" class="pki-entrar"${semRede || semServidor ? ' disabled' : ''}>${I(IC.entrar)}<span>Entrar</span></button>`;
  return `<div class="pki${e ? ` pki--${e}` : ''}" data-pki>
  <header class="pki-estado" aria-label="Estado do PDA">
    <span class="pki-estado__item${semRede ? ' is-mal' : ''}">${I(semRede ? IC.semrede : IC.rede)}${semRede ? 'Sem rede' : 'Wi-Fi'}</span>
    <span class="pki-estado__item${semRede || semServidor ? ' is-mal' : ''}">${I(IC2.servidor)}${semRede ? 'Servidor —' : semServidor ? 'Servidor sem resposta' : 'Servidor disponível'}</span>
    <span class="pki-estado__pda">PDA 24174B6440</span>
  </header>
  <div class="pki-marca">
    <span class="romafe pki-romafe">ROMAFE</span>
    <p class="pki-produto"><b>Pick</b><span>Operações de armazém</span></p>
  </div>
  <div class="pki-desenho">${DESENHO}</div>
  <form class="pki-form" data-pki-form novalidate>
    <div class="pki-ola"><h1>Bem-vindo ao armazém</h1><p>Identifique-se para começar.</p></div>
    ${AVISO[e] ?? ''}
    ${campo('pki-u', 'Utilizador ou email', `<input id="pki-u" name="u" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Introduza o utilizador" value="${preenchido || e === 'pda' ? 'joana.silva' : ''}"${e === 'credenciais' ? ' aria-invalid="true"' : ''}>`)}
    ${campo('pki-p', 'Palavra-passe', `<input id="pki-p" name="p" type="password" autocomplete="current-password" placeholder="A sua palavra-passe" value="${preenchido ? '••••••••' : ''}"${e === 'credenciais' ? ' aria-invalid="true"' : ''}>`, { dentro: `<button type="button" class="pki-ver" data-pki-ver aria-label="Mostrar a palavra-passe" aria-pressed="false">${I(IC2.olho)}</button>` })}
    ${botao}
    <nav class="pki-ligacoes" aria-label="Ajuda"><button type="button" data-ir="ajuda">${I(IC2.chave)}Recuperar acesso</button><button type="button" data-ir="ajuda">${I(IC2.ajuda)}Ajuda</button><button type="button" data-pki-pda>${I(IC2.pda)}Este PDA</button></nav>
  </form>
</div>`;
}
/** Os estados do 01 (v5), escolhidos no próprio ecrã. */
export const ESTADOS_ENTRAR_PK: [EstadoEntrarPk, string, string, string][] = [
  ['preenchido', 'entrar-pk-preenchido', '01.1 · Preenchido', 'O utilizador e a palavra-passe escritos: «Entrar» pronto; Enter entra.'],
  ['a-entrar', 'entrar-pk-a-entrar', '01.2 · A entrar', 'O botão em «A entrar…» e desligado (não se entra duas vezes); o resto fica parado.'],
  ['sucesso', 'entrar-pk-sucesso', '01.3 · Sessão iniciada', 'Depois de o servidor confirmar: quem entrou, a função e o armazém; abre o Inventário (≈ 300 ms).'],
  ['credenciais', 'entrar-pk-credenciais', '01.4 · Não entrou', '«Não foi possível iniciar sessão.» — sem dizer se o utilizador existe; nada abana.'],
  ['sem-rede', 'entrar-pk-sem-rede', '01.5 · Sem rede', 'A Pick não entra sem rede (não há entrada offline): diz o que fazer.'],
  ['servidor', 'entrar-pk-servidor', '01.6 · Servidor indisponível', 'Há Wi-Fi mas o servidor não responde: a linha de estado e o aviso dizem-no em separado.'],
  ['tempo', 'entrar-pk-tempo', '01.7 · Demorou demasiado', 'O pedido passou do tempo; nada ficou feito.'],
  ['auth', 'entrar-pk-auth', '01.8 · Serviço de entrada em baixo', 'O servidor responde, a verificação da palavra-passe não.'],
  ['bloqueada', 'entrar-pk-bloqueada', '01.9 · Conta bloqueada', 'Depois de várias tentativas: o gestor desbloqueia.'],
  ['pda', 'entrar-pk-pda', '01.10 · PDA não autorizado', 'O PDA não está registado para a Pick: o número de série e quem o regista.'],
  ['sessao', 'entrar-pk-sessao', '01.11 · Sessão terminada', 'Depois de 15 minutos parada: entrar outra vez e voltar onde estava.'],
  ['restaurar', 'entrar-pk-restaurar', '01.12 · Retomar a contagem', 'Havia uma contagem a meio neste PDA: diz qual e onde; continua depois de entrar.'],
];
