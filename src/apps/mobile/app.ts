import type { App } from '../../comum/tipos';
import type { IdMobile } from './ids';
import { ecrasCarregarPick, ecrasErroPick, DESCRICAO_CARREGAR_PICK, DESCRICAO_ERROS_PICK } from './estados';
import { ecrasInventario, DESCRICAO_INVENTARIO } from './inventario';
import { comInventarioV2 } from './inventario-v2';
import { ecrasInventarioCompleto, comGestorV2 } from './inventario-completo';
import { ecrasEstadosPick } from './inventario-estados';
import { comGestorV2b, ecrasGestorV2 } from './gestor-v2';
import { ecrasArrumacao } from './arrumacao';
import { ecrasArrumador, comArrumador } from './arrumador';
import { ecrasArrumadorV2, comArrumadorV2 } from './arrumador-v2';
import { comBarra, ecrasNavegacao, soUltima } from './navegacao';
import { aberturaGestor, gestorInicio, gestorInventario } from './gestor';
import { comGestorV3, ecrasGestorV3 } from './gestor-v3';
import { comGestorV4, ecrasGestorV4 } from './gestor-v4';
import { comGestorV5, ecrasGestorV5 } from './gestor-v5';
import { ecrasLoginPick } from './login-pick';
import type { Ecra } from '../../comum/tipos';

const DESCRICAO_ENTRAR_PK = 'Como o ERP e o Peça A Peça: o início de sessão comum (ROMAFE Identity, no PDA) → a abertura → a página do papel (o Gestor, ou o Inventário do operador).';
const DESCRICAO_GESTOR = 'O Gestor de Armazém: o Inventário como ação dominante, o que pede atenção, os inventários em curso, a equipa, o acesso rápido e os módulos.';

const COMPLETO = ecrasInventarioCompleto() as Ecra<IdMobile>[];
/* 27 out. (ela: «permite na demonstração mudar a role e quero todos os estados possíveis»): inventario-estados.ts */
const ESTADOS_PICK = ecrasEstadosPick() as Ecra<IdMobile>[];
/* 27 out. (briefing «Manager Inventory & Putaway», no Figma e só com rede): gestor-v2.ts e arrumacao.ts */
const GESTOR_V2 = ecrasGestorV2() as Ecra<IdMobile>[], ARRUMACAO = comBarra(ecrasArrumacao()) as Ecra<IdMobile>[];
/* 27 out. (briefing «Role-Based Bottom Navigation»): a barra por função — navegacao.ts */
const NAV = ecrasNavegacao() as Ecra<IdMobile>[];
/* 28 out. (ela: «vamos começar pelo gestor que pode fazer tudo», e o briefing «Gestor V1»): gestor-v3.ts */
const GV3 = ecrasGestorV3() as Ecra<IdMobile>[];
/* 28 out. (briefing «Ultimate Manager» e «monta todos os possíveis estados do ecrã»): gestor-v4.ts */
const GV4 = ecrasGestorV4() as Ecra<IdMobile>[];
const GV5 = ecrasGestorV5() as Ecra<IdMobile>[];
/* 30 out. (briefing «Trabalhador de Arrumação V1», ela: «fazer, sem a fila»): arrumador.ts */
const ARRUMADOR = ecrasArrumador() as Ecra<IdMobile>[];
/* 30 out. (briefing «Figma interativo V2 · Trabalhador de Arrumação»): arrumador-v2.ts */
const ARRUMADOR_V2 = ecrasArrumadorV2() as Ecra<IdMobile>[];
const DESCRICAO_SEPARACAO = 'A Separação: uma guia é uma tarefa; as linhas pelo percurso (posição → artigo → quantidade); a falta corrige-se na posição; a guia acaba na prateleira de preparados.';
const DESCRICAO_EXPEDICAO = 'A Expedição: recolhe as guias prontas na prateleira de preparados (prateleira → guia → verificar), confirma a recolha e a saída; nada se dá como expedido sem o servidor.';
const DESCRICAO_ARRUMACAO = 'A Arrumação: das chegadas registadas pela arrumação às posições — as guias, os destinos propostos (fora das zonas em contagem), quem arruma (o motor, ou o gestor com motivo) e o PDA de quem arruma.';
export const mobile: App<IdMobile> = {
  id: 'mobile',
  nome: 'Pick',
  sub: 'A app do armazém, no PDA',
  grupo: 'Pick',
  marca: 'PICK',
  /* o ecrã do Honeywell EDA61K: 4", 480 × 800 píxeis físicos a densidade
     1,5 (hdpi), o que dá 320 × 533 píxeis CSS (dp) */
  tela: { l: 320, a: 533 },
  fluxos: { 'Entrar': DESCRICAO_ENTRAR_PK, 'Gestor': DESCRICAO_GESTOR, 'Inventário': DESCRICAO_INVENTARIO, 'Arrumação': DESCRICAO_ARRUMACAO, 'Separação': DESCRICAO_SEPARACAO, 'Expedição': DESCRICAO_EXPEDICAO, 'Carregamento': DESCRICAO_CARREGAR_PICK, 'Erros': DESCRICAO_ERROS_PICK },
  /* 21 out. 2026: ela, «só quero uma versão: a v5, mas mais bonita e mais profissional» e «falta uma abertura» —
     a abertura, a entrada industrial e a ajuda, uma versão cada; saíram as v1–v4, a palavra-passe à parte e o
     cliente federado (o código fica em entrar.ts e no comum) */
  /* 27 out. (o briefing da app Kotlin, «apenas com rede», «no figma»): o Gestor ganha o 62–64 e a v2 do 61.1 e do 61.2;
     o operador o 57 (a sua página) e o 43 (ler e contar num só ecrã) — inventario-completo.ts */
  /* 27 out. (ela: «só quero a última versão, não todos»): cada ecrã só com a última versão (navegacao.ts, soUltima) */
  ecras: soUltima(comArrumadorV2(comArrumador(comGestorV5(comGestorV4(comGestorV3([...ecrasLoginPick<IdMobile>(), ...ecrasEntrarPick(), ...comBarra(comGestorV2b(comGestorV2(ecrasGestor()))), ...GESTOR_V2, ...NAV.filter((e) => e.fluxo === 'Gestor'), ...GV3.filter((e) => e.fluxo === 'Gestor'), ...GV4, ...GV5, ...COMPLETO.filter((e) => e.fluxo === 'Gestor'), ...GV3.filter((e) => e.fluxo === 'Inventário'), ...ARRUMACAO, ...ARRUMADOR, ...ARRUMADOR_V2, ...GV3.filter((e) => e.fluxo === 'Arrumação'), ...GV3.filter((e) => e.fluxo === 'Separação' || e.fluxo === 'Expedição'), ...comBarra(COMPLETO.filter((e) => e.id.startsWith('op-'))), ...NAV.filter((e) => e.fluxo !== 'Gestor'), ...comGestorV2b(comInventarioV2(ecrasInventario())), ...COMPLETO.filter((e) => e.id.startsWith('inv-ler')), ...comBarra(ESTADOS_PICK), ...ecrasCarregarPick(), ...ecrasErroPick()])))))),
};

/* 22 out. 2026: ela, «a app do armazém segue a mesma arquitetura do ERP e do Peça A Peça: login universal → abertura →
   página inicial» — saem o 01 · Entrar e o 02 · Ajuda da Pick (o código fica em entrar-industrial.ts); entra-se pela
   ROMAFE Identity no PDA; a abertura nova acaba na página do Gestor de Armazém (o primeiro perfil). */
function ecrasEntrarPick(): Ecra<IdMobile>[] {
  const FLUXO = 'Entrar';
  const um = (html: string, nota: string): Ecra['versoes'] => [{ id: 'v1', nota, html }];
  const NOTA = 'A abertura (22 out., briefing do Gestor de Armazém): o porta-paletes traz a palete, o feixe marca a posição, pousa-a; ROMAFE | Pick; a caixa voa para o Inventário e a marca para o cabeçalho';
  return [
    { id: 'abertura', nome: '00 · Abertura', fluxo: FLUXO, objetivo: 'Depois do início de sessão comum: num armazém em 2,5D, o porta-paletes traz a palete, o feixe laranja marca a posição, pousa-a e confirma; ROMAFE | Pick; na passagem a caixa voa para o ícone do Inventário e a marca para o cabeçalho, e abre a página do papel (≈1,6 s).', versoes: um(aberturaGestor(), NOTA) },
    { id: 'abertura-pk-sem-rede' as IdMobile, nome: '00.1 · Sem rede', fluxo: FLUXO, estadoDe: 'abertura' as IdMobile, objetivo: 'A Pick precisa de rede: a marca fica, diz-se porquê e continua sozinha quando houver sinal.', versoes: um(aberturaGestor('sem-rede'), NOTA) },
    { id: 'abertura-pk-sem-acesso' as IdMobile, nome: '00.2 · Sem acesso à Pick', fluxo: FLUXO, estadoDe: 'abertura' as IdMobile, objetivo: 'A conta entrou, mas não tem a Pick: diz-se, e a quem pedir.', versoes: um(aberturaGestor('sem-acesso'), NOTA) },
  ];
}
function ecrasGestor(): Ecra<IdMobile>[] {
  const FLUXO = 'Gestor';
  const NOTA = 'O Gestor de Armazém (22 out., briefing «Warehouse manager experience»)';
  const v = (html: string): Ecra['versoes'] => [{ id: 'v1', nota: NOTA, html }];
  const e = (id: string, de: string, nome: string, objetivo: string, html: string): Ecra<IdMobile> => ({ id: id as IdMobile, nome, fluxo: FLUXO, estadoDe: de as IdMobile, objetivo, versoes: v(html) });
  return [
    { id: 'gestor-inicio' as IdMobile, nome: '60 · Início do Gestor', fluxo: FLUXO, objetivo: 'O centro de operações do armazém 60: o Inventário como ação dominante (em curso, por validar, recontagens e o progresso em posições), o que pede atenção com a ação direta, os inventários em curso, a equipa (só o atribuído), o acesso rápido e os módulos (só os ativos).', versoes: v(gestorInicio()) },
    e('gestor-carregar', 'gestor-inicio', '60.1 · A carregar', 'O cabeçalho e o Inventário já estão; as listas em esqueleto.', gestorInicio('carregar')),
    e('gestor-sem-inventarios', 'gestor-inicio', '60.2 · Sem inventários', 'Nada em curso: diz-se e oferece «Criar inventário».', gestorInicio('sem-inventarios')),
    e('gestor-sem-tarefas', 'gestor-inicio', '60.3 · Nada pede atenção', '«Requer a tua atenção» vazio, com o motivo.', gestorInicio('sem-tarefas')),
    e('gestor-erro', 'gestor-inicio', '60.4 · Os inventários não carregaram', 'O servidor não respondeu: «Tentar outra vez» no painel do Inventário.', gestorInicio('erro')),
    e('gestor-sem-rede', 'gestor-inicio', '60.5 · Sem rede', 'A Pick não trabalha sem rede (nada em cache): a faixa diz porquê e as ações esperam.', gestorInicio('sem-rede')),
    e('gestor-menus', 'gestor-inicio', '60.6 · Os módulos não carregaram', 'O serviço dos módulos não respondeu: «Tentar outra vez».', gestorInicio('menus')),
    e('gestor-permissao', 'gestor-inicio', '60.7 · Permissões mudaram', 'O papel mudou a meio: diz-se e pede-se para entrar outra vez.', gestorInicio('permissao')),
    e('gestor-sessao', 'gestor-inicio', '60.8 · Sessão terminada', 'A sessão terminou: «Entrar outra vez» leva ao início de sessão comum.', gestorInicio('sessao')),
    e('gestor-sem-acesso', 'gestor-inicio', '60.9 · Sem acesso', 'A conta não tem a Pick.', gestorInicio('sem-acesso')),
    e('gestor-sem-armazem', 'gestor-inicio', '60.10 · Sem armazém atribuído', 'A conta não tem armazém: o administrador atribui o 60.', gestorInicio('sem-armazem')),
    { id: 'gestor-inventario' as IdMobile, nome: '61 · Inventário (Gestor)', fluxo: FLUXO, objetivo: 'Os inventários por estado (em curso, por iniciar, por validar, concluídos), com a ação de cada um (validar, atribuir, ver); divergências e recontagens; «Criar».', versoes: v(gestorInventario()) },
    e('gestor-inv-novo', 'gestor-inventario', '61.1 · Criar inventário', 'Tipo, zona, colunas, às cegas e operador (ou deixar o motor sugerir).', gestorInventario('novo')),
    e('gestor-atribuir', 'gestor-inventario', '61.2 · Atribuir contagem', 'A INV-2026-015 a um operador; o motor sugere quem está sem contagem.', gestorInventario('atribuir')),
  ];
}
