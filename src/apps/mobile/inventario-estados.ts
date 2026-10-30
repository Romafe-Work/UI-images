/* =========================================================
   PICK — as funções na demonstração e todos os estados do Inventário (27 out. 2026)
   Ela perguntou quem vê o Inventário e pediu: «mostra essa diferença, permite na demonstração mudar a role e quero
   todos os estados possíveis para os screens». As funções são as do armazém (27 ago.): três e o gestor —
     - Gestor: cria, atribui, acompanha, valida e fecha; é o único que vê o stock do sistema;
     - Arrumação: conta (às cegas), corrige posição e consulta stock — «contar é de quem já anda nos corredores»;
     - Separação e Expedição: 30 out. (ela: «o inventário é de todos») também contam as posições que o gestor lhes
       atribui, às cegas; na separação, a falta numa posição continua a corrigir-se na guia (18 set.).
   Na demonstração, tocar nas iniciais da conta (em qualquer ecrã da Pick) abre «Ver como» com as quatro funções, o
   que cada uma vê e não vê; escolher leva à página dessa função (comportamento/funcoes.ts). No produto, a função vem
   das permissões da conta (ROMAFE Identity) e não se escolhe.
   Os estados acrescentam a cada ecrã o que lhe faltava: a carregar, vazio, servidor, sem rede, sessão, sem
   permissão, e os de cada um (a submeter, falhou, limite de correções, conflito, já fechado…). Só com rede: sem
   rede, a Pick para e diz porquê — nunca «guardado no dispositivo».
   ========================================================= */
import type { Ecra } from '../../comum/tipos';
import { ecra, acao, sec, esperar, aviso, nota, prog, posicao, quantidade, h2, L, type Opcoes } from './inventario-v2';
import { INV, POS, ART } from './inventario';
import scanBarcode from 'lucide-static/icons/scan-barcode.svg?raw';
import mapPin from 'lucide-static/icons/map-pin.svg?raw';
import pkgX from 'lucide-static/icons/package-x.svg?raw';
import check from 'lucide-static/icons/check.svg?raw';
import circleCheck from 'lucide-static/icons/circle-check.svg?raw';
import triangle from 'lucide-static/icons/triangle-alert.svg?raw';
import wifiOff from 'lucide-static/icons/wifi-off.svg?raw';
import serverOff from 'lucide-static/icons/server-off.svg?raw';
import refresh from 'lucide-static/icons/refresh-cw.svg?raw';
import arrowLeft from 'lucide-static/icons/arrow-left.svg?raw';
import folder from 'lucide-static/icons/folder.svg?raw';
import pkg from 'lucide-static/icons/package.svg?raw';
import lock from 'lucide-static/icons/lock.svg?raw';
import clock from 'lucide-static/icons/clock.svg?raw';
import logIn from 'lucide-static/icons/log-in.svg?raw';
import userRound from 'lucide-static/icons/user-round.svg?raw';
import userPlus from 'lucide-static/icons/user-plus.svg?raw';
import send from 'lucide-static/icons/send.svg?raw';
import list from 'lucide-static/icons/list.svg?raw';
import inbox from 'lucide-static/icons/inbox.svg?raw';
import keyboard from 'lucide-static/icons/keyboard.svg?raw';
import rotate from 'lucide-static/icons/rotate-ccw.svg?raw';
import history from 'lucide-static/icons/history.svg?raw';
import shieldCheck from 'lucide-static/icons/shield-check.svg?raw';
import truck from 'lucide-static/icons/truck.svg?raw';
import shoppingCart from 'lucide-static/icons/shopping-cart.svg?raw';
import search from 'lucide-static/icons/search.svg?raw';

/* ---------- as funções (as pessoas de exemplo são as da equipa do Gestor, gestor.ts) ---------- */
export interface Funcao { k: 'gestor' | 'arrumacao' | 'separacao' | 'expedicao'; t: string; nome: string; iniciais: string; ecra: string; ve: string[]; nao: string[] }
export const FUNCOES: Funcao[] = [
  { k: 'gestor', t: 'Gestor', nome: 'Ana Ferreira', iniciais: 'AF', ecra: 'gestor-inicio', ve: ['Cria, atribui e acompanha os inventários', 'Vê o stock do sistema e decide as divergências', 'Valida e fecha (o ajuste é do servidor)'], nao: [] },
  /* 30 out. (ela: «com a role de arrumação»): a Arrumação abre o 85 · A minha arrumação, com a Inês (arrumador.ts) */
  { k: 'arrumacao', t: 'Arrumação', nome: 'Inês Rocha', iniciais: 'IR', ecra: 'ta-inicio', ve: ['Arruma a guia que o motor lhe dá, palete a palete', 'Regista a chegada de um camião e corrige posições', 'Consulta artigos e posições, e chama o gestor'], nao: ['Ninguém lhe atribui nada: o trabalho vem do motor', 'Não vê a fila, números nem insights'] },
  { k: 'separacao', t: 'Separação', nome: 'Tiago Lopes', iniciais: 'TL', ecra: 'op-separacao', ve: ['Conta as posições que lhe atribuem, às cegas', 'Corrige a posição na guia, quando falta quantidade'], nao: ['Não vê o stock do sistema enquanto conta', 'Não valida nem fecha'] },
  { k: 'expedicao', t: 'Expedição', nome: 'Paulo Reis', iniciais: 'PR', ecra: 'op-expedicao', ve: ['Conta as posições que lhe atribuem, às cegas', 'Trabalha no cais: carrega e fecha'], nao: ['Não vê o stock do sistema enquanto conta', 'Não valida nem fecha'] },
];
const quem = (k: Funcao['k']) => { const f = FUNCOES.find((x) => x.k === k)!; return { nome: f.nome, iniciais: f.iniciais }; };

/* ---------- os estados comuns ---------- */
export const carregar = (o: Opcoes, linhas = 3) => ecra(`<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A carregar…</p><div class="gp-esq">${'<i></i>'.repeat(linhas)}</div>`, o);
export const semRede = (o: Opcoes) => ecra(aviso('erro', wifiOff, 'Sem rede', 'A Pick precisa de rede: não mostra dados velhos como se fossem de agora, e nada fica à espera no PDA. Continua quando houver sinal.') + '<p class="gi-estado" role="status"><span class="girador girador--pequeno" aria-hidden="true"></span>A procurar rede…</p>', { ...o, rede: false, pe: acao('Tentar outra vez', refresh) });
export const servidor = (o: Opcoes, ref: string) => ecra(aviso('erro', serverOff, 'O servidor não respondeu', 'Não foi possível ler os dados. Nada mudou.') + `<p class="gi-ref">Referência <code>${ref}</code></p>${nota('Se repetir, avise o gestor do turno com a referência.')}`, { ...o, pe: acao('Tentar outra vez', refresh) });
export const sessao = (o: Opcoes) => ecra(aviso('aviso', clock, 'A sessão terminou', 'Por segurança, entre outra vez pelo início de sessão comum (ROMAFE Identity). Volta a este ecrã.'), { ...o, pe: acao('Entrar outra vez', logIn, ' data-login') });
export const semPermissao = (o: Opcoes, texto: string, volta: string) => ecra(aviso('erro', userRound, 'Sem permissão', texto), { ...o, pe: acao('Voltar ao início', arrowLeft, ` data-ir="${volta}"`) });
export const vazio = (o: Opcoes, ic: string, t: string, x: string, pe = '') => ecra(`<section class="gi-vazio">${L(ic)}<p><b>${t}</b> ${x}</p></section>`, { ...o, pe });

/* ---------- o Inventário de cada um (30 out., ela: «o inventário é de todos»): as contagens que o gestor lhe atribui ---------- */
export const asMinhasContagens = (n: [number, number, number]) => `<section class="gp-sec">${h2('As minhas contagens')}
      <div class="gi-tres">${(['Atribuídas', 'Em curso', 'Concluídas'] as const).map((t, i) => `<button type="button" class="gi-num" data-ir="inv-lista"><b>${n[i]}</b><span>${t}</span></button>`).join('')}</div>
      ${n[0] + n[1] ? '' : '<p class="gi-vazio-l">Quando o gestor lhe atribuir uma contagem, o sistema entrega-a como uma tarefa.</p>'}
    </section>`;
/* ---------- as páginas da Separação e da Expedição (os módulos delas ainda não estão na Pick; o Inventário sim) ---------- */
export const paginaSemInventario = (k: 'separacao' | 'expedicao', barra?: string) => {
  const f = FUNCOES.find((x) => x.k === k)!, sep = k === 'separacao';
  return ecra(`<div class="gp-ola"><h1>Bom dia, ${f.nome.split(' ')[0]}</h1><p>${f.t} · armazém 60</p></div>
    <section class="gi-aviso gi-aviso--info" role="status"><span class="gi-aviso__ic">${L(sep ? shoppingCart : truck)}</span><h1>O módulo ${f.t} ainda não está na Pick</h1><p>Aparece aqui quando estiver feito e autorizado. Até lá, ${sep ? 'as guias de separação' : 'as cargas'} fazem-se como hoje.</p></section>
    ${asMinhasContagens([0, 0, 0])}
    <section class="gp-sec">${h2('Módulos')}<div class="gp-modulos"><button type="button" class="gp-pasta" data-ir="inv-inicio"><span class="gp-pasta-g">${L(folder)}${L(pkg)}</span><b>Inventário</b></button></div></section>`,
  { titulo: 'Início', quem: quem(k), funcao: f.t, barra });
};

/* =========================================================
   Os estados, ecrã a ecrã
   ========================================================= */
type Est = [id: string, de: string, nome: string, objetivo: string, html: () => string, versao?: string];
const OP: Opcoes = { titulo: 'Início' }, G = (titulo: string, voltar = 'gestor-inventario'): Opcoes => ({ titulo, voltar, gestor: true });
const ESTADOS: Est[] = [
  /* 57 · Início do Operador (e as páginas das outras funções) */
  ['op-separacao', 'op-inicio', '57.3 · Separação', 'A mesma Pick vista pela Separação: as contagens que lhe atribuem (o Inventário é de todos) e o módulo da Separação, que ainda não está na Pick.', () => paginaSemInventario('separacao')],
  ['op-expedicao', 'op-inicio', '57.4 · Expedição', 'Vista pela Expedição: as contagens que lhe atribuem e o módulo da Expedição, que ainda não está feito, e diz-se.', () => paginaSemInventario('expedicao')],
  ['op-carregar', 'op-inicio', '57.5 · A carregar', 'O cabeçalho já está; a tarefa e as contagens em esqueleto.', () => carregar(OP)],
  ['op-sem-rede', 'op-inicio', '57.6 · Sem rede', 'Sem rede não se mostra a tarefa: diz-se e espera.', () => semRede(OP)],
  ['op-erro', 'op-inicio', '57.7 · Não carregou', 'O servidor não respondeu: tentar outra vez, com a referência.', () => servidor(OP, 'PK-2710-4F1A')],
  ['op-sessao', 'op-inicio', '57.8 · Sessão terminada', 'Entrar outra vez pelo início de sessão comum.', () => sessao(OP)],
  ['op-permissao', 'op-inicio', '57.9 · A função mudou', 'O gestor mudou-lhe a função para a Separação: o Inventário sai, e diz-se.', () => ecra(aviso('info', userRound, 'A sua função mudou', 'Agora está na <b>Separação</b>: o Inventário deixa de aparecer. A contagem que tinha a meio volta ao gestor.'), { ...OP, pe: acao('Continuar', check, ' data-ir="op-separacao"') })],

  /* 43 · Ler e contar */
  ['inv-ler-a-registar', 'inv-ler', '43.10 · A registar', 'Depois de Confirmar: só o botão espera pela resposta do servidor; nada se diz antes.', () => ecra(`<p class="gi-ler-inv"><b>${INV}</b><span>Zona 30 · às cegas</span></p>${aviso('info', send, 'A registar…', `${ART.ref} · 4 un. na posição ${POS}.`)}`, { titulo: 'Ler e contar', pe: esperar('A registar…') })],
  ['inv-ler-nao-registou', 'inv-ler', '43.11 · Não registou', 'O servidor não respondeu: o número continua escrito; confirmar outra vez não duplica.', () => ecra(`${aviso('erro', serverOff, 'A contagem não ficou registada', 'O servidor não respondeu. Os 4 continuam escritos: confirme outra vez — o pedido leva a mesma chave e não duplica.')}${quantidade('4', { teclado: false })}`, { titulo: 'Ler e contar', pe: acao('Confirmar outra vez', refresh) })],
  ['inv-ler-invalida', 'inv-ler', '43.12 · Quantidade inválida', '«1,5» num artigo à unidade: diz porquê e Confirmar espera.', () => ecra(quantidade('1,5', { erro: 'Este artigo conta-se à unidade: escreva um número inteiro.' }), { titulo: 'Ler e contar', pe: acao('Confirmar contagem', check, ' data-confirmar disabled') })],
  ['inv-ler-escrito', 'inv-ler', '43.13 · Código escrito à mão', 'Sem leitura, o código escreve-se e fica marcado como escrito (o gestor vê-o nas exceções).', () => ecra(`<label class="gp-campo"><span>Código do artigo</span><input value="7316201250277" inputmode="numeric"></label><p class="gi-modo">${L(keyboard)}<span><b>Fica marcado como escrito à mão.</b> O gestor vê-o nas exceções.</span></p>`, { titulo: 'Ler e contar', pe: acao('Usar este código', check, ' data-ir="inv-ler-lido"') })],
  ['inv-ler-sessao', 'inv-ler', '43.14 · Sessão terminada', 'A meio da contagem: entrar outra vez e voltar à mesma posição.', () => sessao({ titulo: 'Ler e contar' })],

  /* 41 · Contagens atribuídas */
  ['inv-lista-carregar', 'inv-lista', '41.1 · A carregar', 'As contagens a chegar do servidor.', () => carregar({ voltar: 'inv-inicio', titulo: 'Contagens' })],
  ['inv-lista-vazia', 'inv-lista', '41.2 · Sem contagens', 'Nada atribuído: o gestor planeia; aparece aqui.', () => vazio({ voltar: 'inv-inicio', titulo: 'Contagens' }, inbox, 'Não tem contagens atribuídas.', 'Quando o gestor planear uma contagem para si, aparece aqui.')],
  ['inv-lista-erro', 'inv-lista', '41.3 · Não carregou', 'O servidor não respondeu.', () => servidor({ voltar: 'inv-inicio', titulo: 'Contagens' }, 'PK-2710-7C02')],
  ['inv-lista-sem-rede', 'inv-lista', '41.4 · Sem rede', 'A Pick para e espera.', () => semRede({ voltar: 'inv-inicio', titulo: 'Contagens' })],

  /* 48 · Posição contada */
  ['inv-fim-ultima', 'inv-fim-posicao', '48.1 · Última posição', 'Era a última: todas contadas, e a seguir é submeter.', () => ecra(`<section class="gi-feito"><span class="gi-feito__ok">${L(check)}</span><h1>Todas as posições contadas</h1><p>46 de 46 · zona 30</p></section>${prog(46, 46)}`, { pe: `${acao('Rever e submeter', send, ' data-ir="inv-submeter"')}${sec('Ver o que já contei', list, ' data-ir="inv-contados"')}` })],

  /* 49 · O que já contei */
  ['inv-contados-vazio', 'inv-contados', '49.1 · Ainda nada contado', 'A contagem acabou de começar.', () => vazio({ voltar: 'inv-artigo', titulo: 'Contados' }, inbox, 'Ainda não contou nada nesta contagem.', 'Cada artigo confirmado aparece aqui, por posição.', acao('Ler a primeira posição', scanBarcode, ' data-ir="inv-posicao"'))],
  ['inv-contados-carregar', 'inv-contados', '49.2 · A carregar', 'Os registos a chegar do servidor.', () => carregar({ voltar: 'inv-artigo', titulo: 'Contados' })],

  /* 50 · Corrigir */
  ['inv-corrigir-sem-motivo', 'inv-corrigir', '50.1 · Falta o motivo', 'Sem motivo não se regista a correção: o campo marcado.', () => ecra(`${quantidade('14', { teclado: false, rotulo: 'A quantidade certa' })}${aviso('erro', triangle, 'Escolha o motivo', 'A correção fica na auditoria com o motivo: sem ele não se regista.')}`, { voltar: 'inv-artigo', titulo: 'Corrigir', pe: acao('Registar a correção', check, ' disabled') })],
  ['inv-corrigir-submetida', 'inv-corrigir', '50.2 · Já submetida', 'Depois de submeter não se corrige: só o gestor pede recontagem.', () => ecra(aviso('aviso', lock, 'Esta contagem já foi submetida', 'Já não se corrige. Se o gestor pedir recontagem, a tarefa aparece-lhe no início.'), { voltar: 'inv-contados', titulo: 'Corrigir', pe: acao('Voltar', arrowLeft, ' data-ir="inv-contados"') })],

  /* 51 · Pausar */
  ['inv-pausa-outro-pda', 'inv-pausa', '51.2 · Retomada noutro PDA', 'Entrou noutro PDA: volta à mesma posição; o outro deixa de ter a contagem aberta.', () => ecra(`${aviso('ok', circleCheck, 'Contagem retomada neste PDA', `O ${INV} estava aberto no PDA 24174B6440. Agora está neste; o outro deixa de a ter.`)}`, { pe: acao('Continuar a contar', scanBarcode, ' data-ir="inv-ler"') })],

  /* 52 · Submeter */
  ['inv-submeter-a-enviar', 'inv-submeter', '52.2 · A submeter', 'Só o botão espera; nada se diz antes da resposta.', () => ecra(`<h1 class="gp-titulo">Submeter a contagem</h1>${prog(46, 46)}`, { titulo: 'Submeter', pe: esperar('A submeter…') })],
  ['inv-submeter-falhou', 'inv-submeter', '52.3 · Não submeteu', 'O servidor não respondeu: nada mudou; submeter outra vez não duplica.', () => ecra(`${aviso('erro', serverOff, 'A contagem não foi submetida', 'O servidor não respondeu. Tudo o que contou continua registado; submeter outra vez é seguro.')}`, { titulo: 'Submeter', pe: acao('Submeter outra vez', send) })],
  ['inv-submeter-incompleta', 'inv-submeter', '52.4 · Faltam posições', 'Com posições por contar não se submete: diz quantas e leva lá.', () => ecra(`<h1 class="gp-titulo">Ainda não dá para submeter</h1>${prog(44, 46)}${aviso('aviso', mapPin, 'Faltam 2 posições', 'Estão por contar a <b>60301204</b> e a <b>60301205</b>.')}`, { titulo: 'Submeter', voltar: 'inv-contados', pe: acao('Ir à primeira que falta', scanBarcode, ' data-ir="inv-posicao"') })],

  /* 53 · Divergências (gestor) */
  ['inv-divergencias-sem', 'inv-divergencias', '53.1 · Sem divergências', 'Tudo bate certo com o stock: valida-se e fecha-se sem ajustes.', () => vazio(G('Divergências', 'gestor-inventario'), circleCheck, 'Nenhuma divergência.', 'Todas as posições batem certo com o stock do sistema.', acao('Validar e fechar', shieldCheck, ' data-ir="gestor-validar-decidido"'))],
  ['inv-divergencias-operador', 'inv-divergencias', '53.2 · Aberto pela Arrumação', 'Quem conta não vê o stock: as divergências são só do gestor.', () => semPermissao({ titulo: 'Divergências' }, 'As divergências mostram o stock do sistema, e quem conta não o vê. São do gestor.', 'op-inicio')],

  /* 54 · Recontagem */
  ['inv-recontar-feita', 'inv-recontar', '54.1 · Recontagem registada', 'A recontagem foi para o gestor; a primeira contagem fica guardada.', () => ecra(aviso('ok', rotate, 'Recontagem registada', `${ART.ref} na posição ${POS}: o gestor compara as duas contagens. Nenhuma se apaga.`), { pe: acao('Voltar ao início', arrowLeft, ' data-ir="op-inicio"') })],

  /* 55 · Corrigir posição */
  ['inv-cp-ler', 'inv-corrigir-posicao', '55.1 · Ler a posição', 'O primeiro passo: ler a posição a corrigir.', () => ecra(`<h1 class="gp-titulo">Corrigir posição</h1>${aviso('info', scanBarcode, 'Leia a etiqueta da posição', 'Depois lê o artigo e diz quantos lá estão.')}`, { voltar: 'inv-inicio', titulo: 'Corrigir posição', pe: sec('Escrever à mão', keyboard) })],
  ['inv-cp-a-corrigir', 'inv-corrigir-posicao', '55.2 · A corrigir', 'O motor de correções responde; só o botão espera.', () => ecra(`<h1 class="gp-titulo">Corrigir posição</h1>${quantidade('7', { teclado: false, rotulo: 'Na posição estão' })}`, { voltar: 'inv-inicio', titulo: 'Corrigir posição', pe: esperar('A corrigir…') })],
  ['inv-cp-feita', 'inv-corrigir-posicao', '55.3 · Corrigida', 'A correção ficou aberta no motor de correções, com quem e quando.', () => ecra(aviso('ok', circleCheck, 'Posição corrigida', 'A correção ficou registada no motor de correções da posição 60300105, com o seu nome e a hora.'), { voltar: 'inv-inicio', titulo: 'Corrigir posição', pe: acao('Voltar ao Inventário', arrowLeft, ' data-ir="inv-inicio"') })],
  ['inv-cp-limite', 'inv-corrigir-posicao', '55.4 · Limite de correções', 'A posição já tem o máximo de correções abertas: não se corrige outra vez; avisa-se o gestor.', () => ecra(aviso('aviso', lock, 'Esta posição já tem 3 correções abertas', 'É o limite. Até o gestor as rever, não se corrige outra vez.'), { voltar: 'inv-inicio', titulo: 'Corrigir posição', pe: acao('Avisar o gestor', userRound) })],
  ['inv-cp-em-contagem', 'inv-corrigir-posicao', '55.5 · Posição em contagem', 'A posição está numa contagem às cegas: corrige-se pela contagem, não por fora.', () => ecra(aviso('aviso', lock, 'Esta posição está em contagem', `A 60300102 faz parte do ${INV}. Até fechar, corrige-se pela contagem.`), { voltar: 'inv-inicio', titulo: 'Corrigir posição', pe: acao('Voltar ao Inventário', arrowLeft, ' data-ir="inv-inicio"') })],

  /* 56 · Consultar stock */
  ['inv-consultar-posicao', 'inv-consultar', '56.2 · Uma posição lida', 'Ler uma posição mostra os artigos que lá estão, segundo o sistema.', () => ecra(`<section class="gi-cartao">${posicao('60101203', 'gi-pos--grande')}<p>Zona 10 · rolamentos</p></section><ul class="gi-linhas" role="list"><li class="gi-linha"><div><b>SKF VKBA 6556</b><span>Kit de rolamento de roda</span></div><div class="gi-linha__q"><b>12 un.</b></div></li><li class="gi-linha"><div><b>SKF 6205-2RSH</b><span>Rolamento rígido de esferas</span></div><div class="gi-linha__q"><b>40 un.</b></div></li></ul>`, { voltar: 'inv-inicio', titulo: 'Consultar stock', pe: acao('Ler outro', search, ' data-ir="inv-consultar"') })],
  ['inv-consultar-desconhecido', 'inv-consultar', '56.3 · Código desconhecido', 'Nem artigo nem posição: diz o que se leu.', () => ecra(aviso('erro', pkgX, 'Não é um artigo nem uma posição', 'Leu <b>5601234000017</b>. Leia a etiqueta do artigo ou a da posição.'), { voltar: 'inv-inicio', titulo: 'Consultar stock', pe: acao('Ler outra vez', scanBarcode, ' data-ir="inv-consultar"') })],
  ['inv-consultar-sem-rede', 'inv-consultar', '56.4 · Sem rede', 'Sem rede não se consulta: não se mostra stock velho.', () => semRede({ voltar: 'inv-inicio', titulo: 'Consultar stock' })],

  /* 61 · Inventário (Gestor) */
  ['gestor-inventario-carregar', 'gestor-inventario', '61.3 · A carregar', 'Os inventários a chegar.', () => carregar(G('Inventário', 'gestor-inicio')), 'v1'],
  ['gestor-inventario-vazio', 'gestor-inventario', '61.4 · Sem inventários', 'Ainda nenhum: Criar.', () => vazio(G('Inventário', 'gestor-inicio'), inbox, 'Ainda não há inventários.', 'Crie o primeiro: escolhe o âmbito e quem conta.', acao('Criar inventário', userPlus, ' data-ir="gestor-inv-novo"')), 'v1'],
  ['gestor-inventario-erro', 'gestor-inventario', '61.5 · Não carregou', 'O servidor não respondeu.', () => servidor(G('Inventário', 'gestor-inicio'), 'PK-2710-1B9D'), 'v1'],
  ['gestor-inventario-sem-rede', 'gestor-inventario', '61.6 · Sem rede', 'A Pick para e espera.', () => semRede(G('Inventário', 'gestor-inicio')), 'v1'],
  ['gestor-inventario-operador', 'gestor-inventario', '61.7 · Aberto pela Arrumação', 'O Inventário do gestor não é da Arrumação: vai para o seu.', () => semPermissao({ titulo: 'Inventário' }, 'Criar, atribuir e validar inventários é do gestor. O seu Inventário é o de contar.', 'inv-inicio'), 'v1'],

  /* 61.1 · Criar inventário (v2) */
  ['gestor-inv-novo-sem-ambito', 'gestor-inv-novo', '61.1.1 · Sem zona', 'Sem nenhuma zona escolhida não se cria: diz-se.', () => ecra(aviso('erro', mapPin, 'Escolha pelo menos uma zona', 'O inventário precisa de um âmbito: zonas, posições ou artigos.'), { ...G('Novo inventário'), pe: acao('Criar e atribuir', userPlus, ' disabled') }), 'v2'],
  ['gestor-inv-novo-a-criar', 'gestor-inv-novo', '61.1.2 · A criar', 'O servidor cria o inventário; nada aparece antes da confirmação.', () => ecra(`<h1 class="gp-titulo">Criar inventário</h1><div class="gi-resumo-l"><span>Zona 12 · retentores</span><b>24 posições</b></div>`, { ...G('Novo inventário'), pe: esperar('A criar…') }), 'v2'],
  ['gestor-inv-novo-criado', 'gestor-inv-novo', '61.1.3 · Criado', 'O servidor confirmou: o INV-2026-016 existe e segue para a atribuição.', () => ecra(aviso('ok', circleCheck, 'INV-2026-016 criado', 'Zona 12 · retentores · 24 posições · às cegas. Falta atribuir quem conta.'), { ...G('Novo inventário'), pe: acao('Atribuir', userPlus, ' data-ir="gestor-atribuir"') }), 'v2'],
  ['gestor-inv-novo-falhou', 'gestor-inv-novo', '61.1.4 · Não criou', 'O servidor recusou (a zona entrou noutra contagem entretanto): nada se criou.', () => ecra(aviso('erro', serverOff, 'O inventário não foi criado', 'A zona 12 entrou noutra contagem entretanto. Nada se criou; escolha outra zona.'), { ...G('Novo inventário'), pe: acao('Voltar ao âmbito', arrowLeft, ' data-ir="gestor-inv-novo"') }), 'v2'],

  /* 61.2 · Atribuir (v2) */
  ['gestor-atribuir-a-atribuir', 'gestor-atribuir', '61.2.1 · A atribuir', 'O servidor atribui; a tarefa só chega ao PDA depois de confirmada.', () => ecra(`<h1 class="gp-titulo">Atribuir contagem</h1><div class="gp-cartao"><b>INV-2026-015</b><small>Colunas 07–12 → Inês Rocha</small></div>`, { ...G('Atribuir'), pe: esperar('A atribuir…') }), 'v2'],
  ['gestor-atribuir-feita', 'gestor-atribuir', '61.2.2 · Atribuída', 'Confirmado: as colunas 07–12 chegam ao PDA da Inês quando acabar as 01–06.', () => ecra(aviso('ok', circleCheck, 'Colunas 07–12 atribuídas à Inês', 'Chegam ao PDA dela quando acabar as colunas 01–06.'), { ...G('Atribuir'), pe: acao('Acompanhar o inventário', list, ' data-ir="gestor-acompanhar"') }), 'v2'],
  ['gestor-atribuir-conflito', 'gestor-atribuir', '61.2.3 · Já atribuída', 'Outro gestor atribuiu as mesmas colunas entretanto: a posição não fica com duas pessoas.', () => ecra(aviso('aviso', triangle, 'As colunas 07–12 já foram atribuídas', 'O Luís Costa (gestor do turno) deu-as à Joana Silva há instantes. Uma posição só tem uma pessoa.'), { ...G('Atribuir'), pe: acao('Ver a atribuição', list, ' data-ir="gestor-acompanhar"') }), 'v2'],
  ['gestor-atribuir-sem-livres', 'gestor-atribuir', '61.2.4 · Ninguém livre', 'Toda a equipa tem contagem: fica por atribuir, e o motor entrega quando alguém acabar.', () => vazio(G('Atribuir'), userRound, 'Ninguém da arrumação está livre.', 'A secção fica por atribuir; o motor entrega-a a quem acabar primeiro.', acao('Deixar por atribuir', clock, ' data-ir="gestor-inventario"')), 'v2'],

  /* 62 · Acompanhar */
  ['gestor-acompanhar-carregar', 'gestor-acompanhar', '62.2 · A carregar', 'O progresso a chegar.', () => carregar(G('Acompanhar'))],
  ['gestor-acompanhar-erro', 'gestor-acompanhar', '62.3 · Não carregou', 'O servidor não respondeu.', () => servidor(G('Acompanhar'), 'PK-2710-5E31')],
  ['gestor-acompanhar-bloqueado', 'gestor-acompanhar', '62.4 · Bloqueado para validar', 'Bloqueou a contagem: o operador vê «Inventário bloqueado» e não lê mais.', () => ecra(aviso('aviso', lock, `${INV} bloqueado`, 'A Joana já não regista mais nesta contagem. O que contou fica como está; desbloquear deixa-a continuar.'), { ...G('Acompanhar'), pe: `${acao('Validar agora', shieldCheck, ' data-ir="gestor-validar"')}${sec('Desbloquear', rotate, ' data-ir="gestor-acompanhar"')}` })],
  ['gestor-acompanhar-operador', 'gestor-acompanhar', '62.5 · Aberto pela Arrumação', 'Acompanhar é do gestor.', () => semPermissao({ titulo: 'Acompanhar' }, 'Acompanhar os inventários é do gestor.', 'op-inicio')],
  ['gestor-acompanhar-sessao', 'gestor-acompanhar', '62.6 · Sessão terminada', 'Entrar outra vez.', () => sessao(G('Acompanhar'))],

  /* 63 · Validar e fechar */
  ['gestor-validar-carregar', 'gestor-validar', '63.5 · A carregar', 'As divergências a chegar (com o stock do sistema).', () => carregar(G('Validar'))],
  ['gestor-validar-sem-rede', 'gestor-validar', '63.6 · Sem rede', 'Sem rede não se valida: nada se decide nem se fecha.', () => semRede(G('Validar'))],
  ['gestor-validar-ja-fechado', 'gestor-validar', '63.7 · Já fechado', 'Outro gestor fechou-o entretanto: diz quem e quando; nada se repete.', () => ecra(aviso('info', history, 'O INV-2026-011 já está fechado', 'Fechou-o o Luís Costa às 11:52. O ajuste já seguiu para o ERP; nada se repete.'), { ...G('Validar'), pe: acao('Ver no histórico', history, ' data-ir="gestor-historico"') })],
  ['gestor-validar-operador', 'gestor-validar', '63.8 · Aberto pela Arrumação', 'Validar é só do gestor.', () => semPermissao({ titulo: 'Validar' }, 'Validar e fechar inventários é do gestor: a Arrumação conta, não decide.', 'op-inicio')],

  /* 64 · Histórico */
  ['gestor-historico-carregar', 'gestor-historico', '64.1 · A carregar', 'O histórico a chegar.', () => carregar(G('Histórico'))],
  ['gestor-historico-vazio', 'gestor-historico', '64.2 · Sem histórico', 'Ainda nenhum inventário fechado.', () => vazio(G('Histórico'), history, 'Ainda nenhum inventário fechado.', 'Os fechados aparecem aqui, com os ajustes enviados ao ERP.')],
  ['gestor-historico-erro', 'gestor-historico', '64.3 · Não carregou', 'O servidor não respondeu.', () => servidor(G('Histórico'), 'PK-2710-9A44')],
  ['gestor-historico-sem-rede', 'gestor-historico', '64.4 · Sem rede', 'A Pick para e espera.', () => semRede(G('Histórico'))],
];

const NOTA = 'Estados (27 out., ela: «quero todos os estados possíveis para os screens»), só com rede, no desenho da v2.';
/** Os estados novos, cada um com a versão do ecrã a que pertence (a v2 no Inventário do operador e no 61.1/61.2). */
export function ecrasEstadosPick(): Ecra<string>[] {
  return ESTADOS.map(([id, de, nome, objetivo, html, v]) => ({ id, nome, fluxo: de.startsWith('gestor') || id.startsWith('inv-divergencias') ? 'Gestor' : 'Inventário', objetivo, estadoDe: de, versoes: [{ id: v ?? (de.startsWith('inv-') && !de.startsWith('inv-ler') ? 'v2' : 'v1'), nota: NOTA, html: html() }] }));
}
