/* =========================================================
   ROMAFE — os fluxos ecrã a ecrã (21 out. 2026): os diagramas, como dados
   Do briefing «Complete screen flow diagrams & user journeys». Ela escolheu: os diagramas saem dos ecrãs reais
   (cada nó de ecrã aponta para um ecrã que existe numa app — verificar.ts confirma), o que não tem ecrã fica
   «Por definir», e sem rede a Pick para (nada se guarda no PDA; decisão de 17 set.). Sem os menus vindos da base
   de dados (ela: «nada»). A app do PDA é a Pick (não StockFlow); só há o armazém 60, por isso não há escolha de
   armazém; as tarefas vêm do motor (não se escolhe o inventário numa lista aberta).
   As posições não se escrevem aqui: o Mermaid dispõe os nós. Para um módulo novo, junta-se um diagrama.
   ========================================================= */
import type { IdApp } from '../comum/tipos';

/** O que é cada nó (a cor e a forma dizem-no; a forma chega sem a cor). */
export type Tipo = 'ecra' | 'acao' | 'decisao' | 'sucesso' | 'aviso' | 'erro' | 'externo' | 'inicio' | 'fim' | 'definir';
export const TIPOS: Record<Tipo, [string, string]> = {
  ecra: ['Ecrã', 'Retângulo azul'], acao: ['Ação de quem usa', 'Paralelogramo laranja'], decisao: ['Decisão', 'Losango roxo'],
  sucesso: ['Correu bem', 'Cápsula verde com ✓'], aviso: ['Aviso, espera ou sem rede', 'Hexágono âmbar com ⚠'], erro: ['Erro', 'Bandeira vermelha com ✕'],
  externo: ['Sistema ou serviço', 'Cilindro cinzento'], inicio: ['Início', 'Cápsula com ▶'], fim: ['Fim', 'Cápsula com ■, traço grosso'], definir: ['Por definir', 'Retângulo tracejado'],
};
export type No = {
  id: string; tipo: Tipo; texto: string;
  /** o ecrã real: [app, id do ecrã] — o painel lê dele o nome, o objetivo e os estados */
  ecra?: [IdApp, string];
  nota?: string;
};
export type Aresta = { de: string; para: string; rotulo?: string; anim?: string; tracejada?: boolean };
export type Grupo = { titulo: string; nos: string[] };
export type Diagrama = { id: string; grupo: string; titulo: string; descricao: string; direcao: 'LR' | 'TD'; nos: No[]; arestas: Aresta[]; grupos?: Grupo[] };

/* atalhos para escrever os nós */
const e = (id: string, texto: string, app: IdApp, ecra: string, nota?: string): No => ({ id, tipo: 'ecra', texto, ecra: [app, ecra], nota });
const n = (tipo: Tipo, id: string, texto: string, nota?: string): No => ({ id, tipo, texto, nota });
const a = (de: string, para: string, rotulo?: string, anim?: string): Aresta => ({ de, para, rotulo, anim });
const t = (de: string, para: string, rotulo?: string): Aresta => ({ de, para, rotulo, tracejada: true });

/** As notas do PDA (Honeywell EDA61K) que valem para todos os ecrãs da Pick. */
export const PDA = [
  'Leitor: o gatilho lê; a leitura chega pela Intent API da Honeywell e vai para o campo que espera um código.',
  'Teclado físico: Enter confirma; as setas mudam de campo; o número da quantidade escreve-se direto.',
  'Foco: ao chegar a um ecrã de leitura, fica pronto a ler, sem tocar no ecrã.',
  'Sem rede: a Pick para e diz «Sem ligação»; nada se guarda no PDA — a última contagem confirmada fica no servidor.',
  'As animações nunca bloqueiam o leitor: uma leitura durante uma transição conta.',
];

export const DIAGRAMAS: Diagrama[] = [
  /* =========================================================
     Visão geral
     ========================================================= */
  {
    id: 'ecossistema', grupo: 'Visão geral', titulo: 'Ecossistema ROMAFE', direcao: 'TD',
    descricao: 'Uma conta ROMAFE para todas as aplicações. Na web, a ROMAFE Identity devolve à aplicação pedida ou mostra a escolha; no PDA, a Pick abre a mesma página no navegador seguro do Android e volta à app pelo endereço registado.',
    nos: [
      n('inicio', 'web', 'Abre uma aplicação na web'), n('inicio', 'pda', 'Liga o PDA'),
      n('decisao', 'sessao', 'Já tem sessão ROMAFE?'),
      e('ident', 'ROMAFE Identity · Entrar', 'identidade', 'entrada'),
      n('externo', 'srv', 'Servidor ROMAFE · aplicações autorizadas'),
      n('decisao', 'pediu', 'Veio de uma aplicação?'),
      n('decisao', 'quantas', 'Quantas aplicações?'),
      e('escolha', 'Onde queres trabalhar?', 'identidade', 'aplicacoes'),
      e('nenhuma', 'Ainda sem aplicações', 'identidade', 'apps-nenhuma'),
      e('erp', 'ERP · Abertura', 'erp', 'abertura'), e('pap', 'Peça A Peça · Abertura', 'goparts', 'abertura'),
      n('definir', 'goshop', 'GoShop · depois de entrar', 'Só a entrada tem ecrãs no protótipo.'),
      e('pick', 'Pick · Abertura', 'mobile', 'abertura'), e('pdaid', 'Identity no PDA', 'identidade', 'pda'),
      e('inv', 'Pick · Inventário', 'mobile', 'inv-inicio'),
      n('aviso', 'expira', 'A sessão termina'), e('reentra', 'Entrar outra vez', 'identidade', 'entrada-sessao'),
      n('acao', 'sair', 'Sair'), e('saiu', 'Saíste da ROMAFE', 'identidade', 'entrada-saida'),
    ],
    arestas: [
      a('web', 'sessao'), a('sessao', 'ident', 'não'), a('sessao', 'srv', 'sim'), a('ident', 'srv', 'entrou', 'transição da marca, 250 ms'),
      a('srv', 'pediu'), a('pediu', 'erp', 'sim, ERP e tem acesso'), a('pediu', 'pap', 'sim, Peça A Peça e tem acesso'), a('pediu', 'quantas', 'não'),
      a('quantas', 'escolha', 'várias'), a('quantas', 'erp', 'só o ERP'), a('quantas', 'nenhuma', 'nenhuma'),
      a('escolha', 'erp'), a('escolha', 'pap'), a('escolha', 'goshop'),
      a('pda', 'pick'), a('pick', 'pdaid', 'navegador seguro do Android'), a('pdaid', 'inv', 'regresso pelo endereço registado'),
      t('erp', 'expira'), t('pap', 'expira'), a('expira', 'reentra'), a('reentra', 'srv', 'volta ao mesmo sítio'),
      t('erp', 'sair'), t('pap', 'sair'), a('sair', 'saiu'), a('saiu', 'ident', 'entrar de novo'),
    ],
    grupos: [{ titulo: 'Web', nos: ['web', 'sessao', 'ident', 'pediu', 'quantas', 'escolha', 'nenhuma'] }, { titulo: 'PDA (Android)', nos: ['pda', 'pick', 'pdaid', 'inv'] }],
  },
  {
    id: 'identity', grupo: 'Visão geral', titulo: 'ROMAFE Identity · entrar e encaminhar', direcao: 'TD',
    descricao: 'E-mail primeiro, palavra-passe, e o encaminhamento: a aplicação pedida, a única, a escolha ou o acesso negado. Os erros não dizem se um e-mail tem conta.',
    nos: [
      n('inicio', 'ini', 'Pede para entrar'),
      n('decisao', 'restaurar', 'Sessão do navegador aberta?'), e('rest', 'Continuar como…', 'identidade', 'entrada-restaurada'),
      n('decisao', 'regresso', 'Endereço de regresso registado?'), e('invalido', 'Regresso inválido', 'identidade', 'entrada-redirecionamento'),
      e('correio', '01 · Entrar (e-mail)', 'identidade', 'entrada'), n('acao', 'continuar', 'Escreve o e-mail e «Continuar»'),
      n('decisao', 'forma', 'E-mail completo?'), e('errocorreio', 'E-mail incompleto', 'identidade', 'entrada-erro-email'),
      n('externo', 'idp', 'Fornecedor de identidade'), n('decisao', 'responde', 'Responde?'), e('servico', 'Serviço indisponível', 'identidade', 'entrada-servico'),
      e('passe', '02 · Palavra-passe', 'identidade', 'palavra-passe'), n('acao', 'entrar', 'Escreve e «Entrar»'),
      n('decisao', 'certo', 'Credenciais certas?'), e('cred', 'Credenciais erradas', 'identidade', 'passe-credenciais'),
      n('decisao', 'tentativas', 'Demasiadas tentativas?'), e('bloq', 'Conta bloqueada', 'identidade', 'passe-bloqueada'),
      e('recuperar', '04 · Mudar a palavra-passe', 'identidade', 'recuperar'), e('enviado', 'Ligação enviada', 'identidade', 'recuperar-enviado'),
      n('externo', 'registo', 'Registo de aplicações · autorizadas'),
      n('decisao', 'pediu', 'Veio de uma aplicação?'), n('decisao', 'acesso', 'Tem acesso a ela?'),
      e('volta', 'Volta à aplicação', 'identidade', 'passe-sucesso'), e('revogado', 'Sem acesso a esta aplicação', 'identidade', 'apps-revogado'),
      n('decisao', 'quantas', 'Quantas aplicações?'), e('uma', 'Abre a única', 'identidade', 'apps-uma'),
      e('escolha', '03 · Onde queres trabalhar?', 'identidade', 'aplicacoes'), e('nenhuma', 'Sem aplicações', 'identidade', 'apps-nenhuma'),
      e('abrir', 'A abrir…', 'identidade', 'apps-a-abrir'), e('indisp', 'Aplicação indisponível', 'identidade', 'apps-indisponivel'),
      n('fim', 'app', 'Na aplicação'),
    ],
    arestas: [
      a('ini', 'regresso'), a('regresso', 'invalido', 'não'), a('invalido', 'correio', 'entrar e escolher'), a('regresso', 'restaurar', 'sim'),
      a('restaurar', 'rest', 'sim'), a('rest', 'registo', 'continuar'), a('rest', 'correio', 'outra conta'), a('restaurar', 'correio', 'não'),
      a('correio', 'continuar'), a('continuar', 'forma'), a('forma', 'errocorreio', 'não'), a('errocorreio', 'continuar', 'corrige'),
      a('forma', 'idp', 'sim'), a('idp', 'responde'), a('responde', 'servico', 'não'), a('servico', 'continuar', 'tentar de novo'), a('responde', 'passe', 'sim', 'deslize 200 ms'),
      a('passe', 'entrar'), a('entrar', 'certo'), a('certo', 'tentativas', 'não'), a('tentativas', 'cred', 'não'), a('cred', 'entrar', 'corrige'), a('tentativas', 'bloq', 'sim'),
      a('bloq', 'recuperar'), a('passe', 'recuperar', 'esqueci-me'), a('recuperar', 'enviado'), a('enviado', 'correio', 'voltar a entrar'),
      a('certo', 'registo', 'sim'), a('registo', 'pediu'), a('pediu', 'acesso', 'sim'), a('acesso', 'volta', 'sim'), a('acesso', 'revogado', 'não'), a('revogado', 'escolha', 'as minhas aplicações'),
      a('pediu', 'quantas', 'não'), a('quantas', 'uma', 'uma'), a('quantas', 'escolha', 'várias'), a('quantas', 'nenhuma', 'nenhuma'), a('nenhuma', 'correio', 'sair'),
      a('escolha', 'abrir', 'escolhe'), a('escolha', 'indisp', 'em manutenção'), a('indisp', 'escolha', 'outra'), a('abrir', 'app', '', 'a página muda, 250 ms'), a('uma', 'app'), a('volta', 'app'),
    ],
  },

  /* =========================================================
     Pick (PDA)
     ========================================================= */
  {
    id: 'pick', grupo: 'Pick (PDA)', titulo: 'Pick · mapa principal', direcao: 'TD',
    descricao: 'Do ligar ao trabalho. Só há o armazém 60 (sem escolha de armazém). As tarefas vêm do motor: o Inventário mostra as contagens atribuídas; a arrumação recebe uma guia de cada vez. Separação e expedição ainda sem ecrãs.',
    nos: [
      n('inicio', 'liga', 'Liga o PDA e abre a Pick'),
      e('abertura', '00 · Abertura', 'mobile', 'abertura'), n('decisao', 'prontos', 'Leitor, rede e servidor?'),
      e('semrede', 'Sem rede', 'mobile', 'abertura-pk-sem-rede'), e('leitor', 'O leitor não responde', 'mobile', 'abertura-pk-leitor'),
      e('entrar', '01 · Entrar', 'mobile', 'entrada'), n('acao', 'credenciais', 'Utilizador e palavra-passe'),
      n('decisao', 'entrou', 'Entrou?'), e('naoentrou', 'Não entrou', 'mobile', 'entrar-pk-credenciais'), e('bloq', 'Conta bloqueada', 'mobile', 'entrar-pk-bloqueada'),
      e('pdaaut', 'PDA não autorizado', 'mobile', 'entrar-pk-pda'), e('ajuda', '02 · Ajuda', 'mobile', 'ajuda'),
      n('decisao', 'ameio', 'Contagem a meio?'), e('retomar', 'Retomar a contagem', 'mobile', 'entrar-pk-restaurar'),
      n('externo', 'motor', 'Motor · atribui o trabalho'),
      e('inv', '40 · Inventário', 'mobile', 'inv-inicio'), e('guia', '21 · A receber a guia', 'mobile', 'carga-tarefa'),
      n('definir', 'arrumacao', 'Arrumação · ecrãs da guia'), n('definir', 'separacao', 'Separação'), n('definir', 'expedicao', 'Expedição'),
      e('lista', '41 · Contagens atribuídas', 'mobile', 'inv-lista'), e('posicao', '42 · Ler a posição', 'mobile', 'inv-posicao'),
      e('consultar', '56 · Consultar stock', 'mobile', 'inv-consultar'), e('contados', '49 · O que já contei', 'mobile', 'inv-contados'),
      n('acao', 'qualquer', 'Em qualquer ecrã'), e('erede', '30 · Sem rede', 'mobile', 'erro-rede'), e('esessao', '34 · Sessão terminada', 'mobile', 'erro-sessao'), e('eserv', '35 · Erro do servidor', 'mobile', 'erro-servidor'),
    ],
    arestas: [
      a('liga', 'abertura'), a('abertura', 'prontos'), a('prontos', 'semrede', 'sem rede'), a('semrede', 'abertura', 'liga à rede'), a('prontos', 'leitor', 'leitor parado'), a('leitor', 'abertura', 'reiniciar o leitor'),
      a('prontos', 'entrar', 'tudo certo', 'a caixa passa à entrada, 250 ms'), a('entrar', 'credenciais'), a('credenciais', 'entrou'),
      a('entrou', 'naoentrou', 'credenciais erradas'), a('naoentrou', 'credenciais', 'corrige'), a('entrou', 'bloq', 'bloqueada'), a('bloq', 'ajuda'),
      a('entrou', 'pdaaut', 'PDA fora da lista'), a('pdaaut', 'ajuda'), a('entrou', 'ameio', 'sim'),
      a('ameio', 'retomar', 'sim'), a('retomar', 'posicao', 'continuar'), a('ameio', 'motor', 'não'),
      a('motor', 'inv', 'contagens'), a('motor', 'guia', 'guia de arrumação'), a('guia', 'arrumacao'), a('motor', 'separacao'), a('motor', 'expedicao'),
      a('inv', 'lista', '', 'deslize horizontal, 200 ms'), a('lista', 'posicao', 'escolhe'), a('inv', 'consultar'), a('inv', 'contados'),
      a('qualquer', 'erede'), a('erede', 'qualquer', 'volta a rede'), a('qualquer', 'esessao'), a('esessao', 'entrar'), a('qualquer', 'eserv'), a('eserv', 'qualquer', 'tentar de novo'),
    ],
    grupos: [{ titulo: 'Erros em qualquer ecrã', nos: ['qualquer', 'erede', 'esessao', 'eserv'] }],
  },
  {
    id: 'inventario', grupo: 'Pick (PDA)', titulo: 'Pick · Inventário, passo a passo', direcao: 'TD',
    descricao: 'Contagem às cegas por posição: ler a posição, ler o artigo, a quantidade, registar no servidor e seguir. Cada erro volta a um passo válido; sem rede, espera-se pela rede (nada fica no PDA).',
    nos: [
      e('inicio', '40 · Inventário', 'mobile', 'inv-inicio'), n('decisao', 'ha', 'Há contagens atribuídas?'), e('sem', 'Sem contagens', 'mobile', 'inv-sem-contagens'),
      e('lista', '41 · Contagens atribuídas', 'mobile', 'inv-lista'), n('acao', 'escolhe', 'Escolhe a contagem'),
      e('posicao', '42 · Ler a posição', 'mobile', 'inv-posicao'), n('acao', 'lepos', 'Gatilho: lê a posição'),
      n('decisao', 'posok', 'Posição desta contagem?'), e('fora', 'Posição fora da contagem', 'mobile', 'inv-posicao-fora'), e('posok2', 'Posição certa', 'mobile', 'inv-posicao-ok'),
      e('parado', 'O leitor não responde', 'mobile', 'inv-leitor-parado'),
      e('artigo', '44 · Ler o artigo', 'mobile', 'inv-artigo'), n('acao', 'leart', 'Gatilho: lê o artigo'),
      n('decisao', 'conhecido', 'Artigo conhecido?'), e('desconhecido', 'Artigo não encontrado', 'mobile', 'inv-desconhecido'),
      n('decisao', 'repetida', 'Já contado aqui?'), e('repetido', 'Leitura repetida', 'mobile', 'inv-repetido'),
      e('outraPos', '55 · Corrigir posição', 'mobile', 'inv-corrigir-posicao'),
      e('qtd', '45 · Quantidade', 'mobile', 'inv-quantidade'), e('unidades', '47 · À unidade', 'mobile', 'inv-unidades'),
      n('decisao', 'qtdok', 'Quantidade válida?'), e('qtdinv', 'Quantidade inválida', 'mobile', 'inv-qtd-invalida'),
      e('aguardar', 'A registar', 'mobile', 'inv-a-guardar'), n('externo', 'srv', 'Servidor · registar a contagem'),
      n('decisao', 'registou', 'Registou?'), e('naoreg', 'Não registou', 'mobile', 'inv-nao-guardou'), e('semrede', 'Sem rede', 'mobile', 'inv-sem-rede'),
      e('guardada', '46 · Contagem registada', 'mobile', 'inv-guardada'),
      n('decisao', 'maisart', 'Mais artigos na posição?'), e('fimpos', '48 · Posição contada', 'mobile', 'inv-fim-posicao'),
      n('decisao', 'maispos', 'Mais posições?'), e('contados', '49 · O que já contei', 'mobile', 'inv-contados'), e('corrigir', '50 · Corrigir uma contagem', 'mobile', 'inv-corrigir'),
      e('submeter', '52 · Submeter', 'mobile', 'inv-submeter'), e('submetida', 'Submetida', 'mobile', 'inv-submetida'),
      n('decisao', 'diverg', 'Há divergências? (gestor)'), e('divergencias', '53 · Divergências', 'mobile', 'inv-divergencias'), e('recontar', '54 · Recontagem pedida', 'mobile', 'inv-recontar'),
      n('fim', 'fechada', 'Contagem fechada'),
      e('pausa', '51 · Pausar', 'mobile', 'inv-pausa'), e('retomada', 'Retomada', 'mobile', 'inv-retomada'),
    ],
    arestas: [
      a('inicio', 'ha'), a('ha', 'sem', 'não'), a('sem', 'inicio', 'atualizar'), a('ha', 'lista', 'sim'), a('lista', 'escolhe'), a('escolhe', 'posicao', '', 'deslize, 200 ms'),
      a('posicao', 'lepos'), a('lepos', 'posok'), a('posok', 'fora', 'não'), a('fora', 'lepos', 'lê a certa'), a('posicao', 'parado', 'sem leitura'), a('parado', 'lepos', 'reiniciar o leitor'),
      a('posok', 'posok2', 'sim', 'confirmação da leitura, 150 ms'), a('posok2', 'artigo'),
      a('artigo', 'leart'), a('leart', 'conhecido'), a('conhecido', 'desconhecido', 'não'), a('desconhecido', 'leart', 'lê outra vez ou escreve a referência'),
      a('conhecido', 'repetida', 'sim'), a('repetida', 'repetido', 'sim'), a('repetido', 'qtd', 'somar'), a('repetido', 'artigo', 'ignorar'),
      a('artigo', 'outraPos', 'está noutra posição'), a('outraPos', 'artigo'),
      a('repetida', 'qtd', 'não', 'revela a quantidade, 160 ms'), a('qtd', 'unidades', 'contar à unidade'), a('unidades', 'qtdok'),
      a('qtd', 'qtdok'), a('qtdok', 'qtdinv', 'não'), a('qtdinv', 'qtd', 'corrige'), a('qtdok', 'aguardar', 'sim'),
      a('aguardar', 'srv'), a('srv', 'registou'), a('registou', 'naoreg', 'erro do servidor'), a('naoreg', 'aguardar', 'tentar de novo'),
      a('registou', 'semrede', 'sem rede'), a('semrede', 'aguardar', 'volta a rede'),
      a('registou', 'guardada', 'sim', 'sucesso rápido, 200 ms'), a('guardada', 'maisart'), a('maisart', 'artigo', 'sim', 'pronto a ler outra vez'),
      a('maisart', 'fimpos', 'não'), a('fimpos', 'maispos'), a('maispos', 'posicao', 'sim'), a('maispos', 'contados', 'não'),
      a('contados', 'corrigir', 'corrigir'), a('corrigir', 'aguardar'), a('contados', 'submeter'), a('submeter', 'submetida'),
      a('submetida', 'diverg'), a('diverg', 'divergencias', 'sim'), a('divergencias', 'recontar', 'pede recontagem'), a('recontar', 'posicao', 'recontar a posição'),
      a('diverg', 'fechada', 'não'),
      t('posicao', 'pausa', 'pausar'), a('pausa', 'retomada', 'retomar'), a('retomada', 'posicao'),
    ],
    grupos: [{ titulo: 'Posição', nos: ['posicao', 'lepos', 'posok', 'fora', 'posok2', 'parado'] }, { titulo: 'Artigo e quantidade', nos: ['artigo', 'leart', 'conhecido', 'desconhecido', 'repetida', 'repetido', 'outraPos', 'qtd', 'unidades', 'qtdok', 'qtdinv'] }, { titulo: 'Registar', nos: ['aguardar', 'srv', 'registou', 'naoreg', 'semrede', 'guardada'] }],
  },
  {
    id: 'pick-rede', grupo: 'Pick (PDA)', titulo: 'Pick · erros, rede e sessão', direcao: 'LR',
    descricao: 'O que acontece quando algo falha a meio do trabalho. Sem rede, a Pick para: diz até onde ficou registado e continua quando a rede volta. Nada se guarda no PDA, por isso não há sincronização nem conflitos.',
    nos: [
      n('acao', 'trabalho', 'A contar'), n('aviso', 'perde', 'Perde a rede'), e('semrede', '30 · Sem rede', 'mobile', 'erro-rede'),
      n('decisao', 'ultima', 'A última contagem ficou registada?'), n('sucesso', 'sim', 'Diz «registada às hh:mm»'), n('aviso', 'nao', 'Diz para a ler outra vez'),
      n('acao', 'volta', 'A rede volta'), e('continua', '42 · Ler a posição', 'mobile', 'inv-posicao'),
      n('aviso', 'demora', 'O servidor demora'), e('tempo', 'Demorou demasiado', 'mobile', 'entrar-pk-tempo'), e('servidor', '35 · Erro do servidor', 'mobile', 'erro-servidor'),
      n('aviso', 'expira', 'A sessão termina'), e('sessao', '40.4 · Sessão terminada', 'mobile', 'inv-sessao'), e('entrar', '01 · Entrar', 'mobile', 'entrada'), e('retomar', 'Retomar a contagem', 'mobile', 'entrar-pk-restaurar'),
      n('aviso', 'perfil', 'Leitor sem perfil'), e('semperfil', 'Leitor sem permissão', 'mobile', 'inv-leitor-sem-perfil'), n('fim', 'gestor', 'Chama o gestor'),
    ],
    arestas: [
      a('trabalho', 'perde'), a('perde', 'semrede'), a('semrede', 'ultima'), a('ultima', 'sim', 'sim'), a('ultima', 'nao', 'não'), a('sim', 'volta'), a('nao', 'volta'), a('volta', 'continua'),
      a('trabalho', 'demora'), a('demora', 'tempo'), a('tempo', 'servidor', 'continua a falhar'), a('servidor', 'trabalho', 'tentar de novo'), a('tempo', 'trabalho', 'tentar de novo'),
      a('trabalho', 'expira'), a('expira', 'sessao'), a('sessao', 'entrar'), a('entrar', 'retomar'), a('retomar', 'continua', 'continuar onde ficou'),
      a('trabalho', 'perfil'), a('perfil', 'semperfil'), a('semperfil', 'gestor'),
    ],
  },

  /* =========================================================
     Jornadas (A–I), adaptadas às decisões da Pick
     ========================================================= */
  ...jornadas(),

  /* =========================================================
     Web
     ========================================================= */
  {
    id: 'erp', grupo: 'Web', titulo: 'ERP · do entrar às Compras', direcao: 'TD',
    descricao: 'Os ecrãs que o ERP tem no protótipo: o login comum (ROMAFE Identity), a abertura, o Início e o módulo Compras (fases 1 e 2). O resto dos módulos está por definir.',
    nos: [
      e('entrada', 'ROMAFE Identity · Entrar', 'identidade', 'entrada'), e('passe', 'ROMAFE Identity · Palavra-passe', 'identidade', 'palavra-passe'),
      e('app', 'ROMAFE Identity · Onde queres trabalhar?', 'identidade', 'aplicacoes'), e('abertura', '00 · Abertura', 'erp', 'abertura'),
      e('inicio', '05 · Início', 'erp', 'inicio'), e('compras', '10 · Compras', 'erp', 'compras'),
      e('enc', '11 · Encomenda a fornecedor', 'erp', 'compras-encomenda'), e('aprovar', 'Aprovar', 'erp', 'cp-enc-aprovar'), e('encerros', 'Submeter com erros', 'erp', 'cp-enc-erros'),
      e('rececoes', '12 · Receções', 'erp', 'compras-rececoes'), e('rececao', '13 · Receção', 'erp', 'compras-rececao'),
      e('fornecedores', '14 · Fornecedores', 'erp', 'compras-fornecedores'), e('fornecedor', '15 · Fornecedor', 'erp', 'compras-fornecedor'),
      e('reqs', '16 · Requisições', 'erp', 'compras-requisicoes'), e('req', '17 · Requisição', 'erp', 'compras-requisicao'),
      e('cots', '18 · Cotações', 'erp', 'compras-cotacoes'), e('cot', '19 · Cotação', 'erp', 'compras-cotacao'),
      n('definir', 'outros', 'Stocks, vendas e restantes módulos'),
      e('e403', '32 · Sem permissão', 'erp', 'erro-403'), e('esessao', '34 · Sessão expirada', 'erp', 'erro-sessao'), e('econflito', '38 · Alterado por outra pessoa', 'erp', 'erro-conflito'),
    ],
    arestas: [
      a('entrada', 'passe'), a('passe', 'app'), a('app', 'abertura', 'ERP'), a('abertura', 'inicio', 'Saltar ou fim'),
      a('inicio', 'compras'), a('inicio', 'outros'),
      a('compras', 'enc'), a('enc', 'aprovar', 'Administração'), a('enc', 'encerros', 'submeter'), a('encerros', 'enc', 'corrigir'),
      a('compras', 'rececoes'), a('rececoes', 'rececao'), a('compras', 'fornecedores'), a('fornecedores', 'fornecedor'),
      a('compras', 'reqs'), a('reqs', 'req'), a('req', 'cots', 'pedir cotação'), a('compras', 'cots'), a('cots', 'cot'), a('cot', 'enc', 'escolhida → encomenda'),
      t('compras', 'e403', 'sem acesso'), a('e403', 'inicio'), t('enc', 'esessao'), a('esessao', 'entrada'), t('enc', 'econflito', 'gravar'), a('econflito', 'enc', 'ver a versão nova'),
    ],
  },
  {
    id: 'pecaapeca', grupo: 'Web', titulo: 'Peça A Peça · o portal', direcao: 'TD',
    descricao: 'Os ecrãs do portal: o Início, a pesquisa (com os resultados e os filtros no próprio ecrã), o catálogo, os documentos e as ferramentas. O carrinho é um painel da barra do topo; a encomenda ainda não tem ecrã.',
    nos: [
      e('entrada', 'ROMAFE Identity · Entrar', 'identidade', 'entrada'), e('passe', 'ROMAFE Identity · Palavra-passe', 'identidade', 'palavra-passe'), e('abertura', '00 · Abertura', 'goparts', 'abertura'),
      e('inicio', '10 · Início', 'goparts', 'inicio'), e('pesquisa', '18 · Pesquisar peças', 'goparts', 'pesquisa'),
      n('acao', 'modo', 'Matrícula, veículo ou referência'), n('decisao', 'encontrou', 'Há resultados?'),
      e('resultados', 'Resultados e «Filtros (n)»', 'goparts', 'inicio-resultados'), e('semres', 'Sem resultados', 'goparts', 'inicio-sem-resultados'),
      e('catalogo', '11 · Catálogo', 'goparts', 'catalogo'), n('acao', 'adicionar', 'Adicionar ao carrinho'), n('definir', 'encomendar', 'Encomendar (carrinho completo)'),
      e('pedidos', '12 · Pedidos', 'goparts', 'pedidos'), e('guias', '13 · Guias de remessa', 'goparts', 'guias'), e('faturas', '14 · Faturas', 'goparts', 'faturas'), e('devolucoes', '16 · Devoluções', 'goparts', 'devolucoes'),
      e('lista', '15 · Minha lista', 'goparts', 'lista'), e('tecnica', '17 · Informações técnicas', 'goparts', 'tecnica'),
    ],
    arestas: [
      a('entrada', 'passe'), a('passe', 'abertura', 'escolhe o Peça A Peça'), a('abertura', 'inicio', 'Saltar ou fim'),
      a('inicio', 'pesquisa', 'cartões da pesquisa', 'deslize, 250 ms'), a('pesquisa', 'modo'), a('modo', 'encontrou'), a('encontrou', 'resultados', 'sim'), a('encontrou', 'semres', 'não'), a('semres', 'modo', 'pesquisa parcial ou outra forma'),
      a('resultados', 'catalogo', 'ver ficha', 'a imagem passa para a ficha'), a('resultados', 'adicionar'), a('catalogo', 'adicionar'), a('adicionar', 'encomendar'),
      a('inicio', 'catalogo'), a('inicio', 'pedidos', 'atalho'), a('pedidos', 'guias', 'ver guia'), a('guias', 'faturas', 'ver fatura'), a('faturas', 'devolucoes', 'criar devolução'),
      a('inicio', 'devolucoes'), a('inicio', 'lista'), a('lista', 'catalogo', 'adicionar peças'), a('inicio', 'tecnica'),
    ],
  },
];

/** As jornadas do briefing (A–I), cada uma com início e fim; a E e a F seguem «sem rede, a Pick para». */
function jornadas(): Diagrama[] {
  const J = (id: string, titulo: string, descricao: string, nos: No[], arestas: Aresta[]): Diagrama => ({ id: `j-${id}`, grupo: 'Jornadas (Pick)', titulo, descricao, direcao: 'LR', nos, arestas });
  const fio = (ids: string[], rot: (string | undefined)[] = []) => ids.slice(1).map((p, i) => a(ids[i], p, rot[i]));
  return [
    J('a', 'A · Primeiro acesso', 'Do ligar ao Inventário. Sem escolha de armazém: só há o 60.',
      [n('inicio', 's', 'Liga o PDA'), e('ab', '00 · Abertura', 'mobile', 'abertura'), e('en', '01 · Entrar', 'mobile', 'entrada'), e('ok', 'Sessão iniciada', 'mobile', 'entrar-pk-sucesso'), e('inv', '40 · Inventário', 'mobile', 'inv-inicio'), n('fim', 'f', 'Pronto a trabalhar')],
      fio(['s', 'ab', 'en', 'ok', 'inv', 'f'], [undefined, 'leitor, rede e servidor certos', 'utilizador e palavra-passe', 'a caixa entra no Inventário'])),
    J('b', 'B · Começar uma contagem', 'Do Inventário à primeira posição.',
      [n('inicio', 's', 'No Inventário'), e('inv', '40 · Inventário', 'mobile', 'inv-inicio'), e('li', '41 · Contagens atribuídas', 'mobile', 'inv-lista'), e('po', '42 · Ler a posição', 'mobile', 'inv-posicao'), n('fim', 'f', 'Posição lida')],
      fio(['s', 'inv', 'li', 'po', 'f'], [undefined, 'ver as atribuídas', 'escolhe', 'gatilho'])),
    J('c', 'C · Contar um artigo', 'Ler, quantidade, registar e voltar a ler.',
      [n('inicio', 's', 'Posição certa'), e('ar', '44 · Ler o artigo', 'mobile', 'inv-artigo'), e('qt', '45 · Quantidade', 'mobile', 'inv-quantidade'), e('ag', 'A registar', 'mobile', 'inv-a-guardar'), e('gu', '46 · Contagem registada', 'mobile', 'inv-guardada'), n('fim', 'f', 'Pronto para o artigo seguinte')],
      fio(['s', 'ar', 'qt', 'ag', 'gu', 'f'], [undefined, 'gatilho', 'Enter', 'servidor confirmou', 'volta a ler'])),
    J('d', 'D · Código errado', 'O código não é de um artigo conhecido: lê-se outra vez ou escreve-se a referência.',
      [n('inicio', 's', 'Lê um código'), e('de', 'Artigo não encontrado', 'mobile', 'inv-desconhecido'), n('acao', 'c', 'Lê outra vez ou escreve'), e('qt', '45 · Quantidade', 'mobile', 'inv-quantidade'), n('fim', 'f', 'Artigo certo')],
      fio(['s', 'de', 'c', 'qt', 'f'])),
    J('e', 'E · Perde a rede a contar', 'Adaptada: nada se guarda no PDA. A Pick para, diz até onde ficou registado e continua quando a rede volta.',
      [n('inicio', 's', 'A registar'), e('ag', 'A registar', 'mobile', 'inv-a-guardar'), e('sr', 'Sem rede', 'mobile', 'inv-sem-rede'), n('acao', 'v', 'A rede volta'), e('gu', '46 · Contagem registada', 'mobile', 'inv-guardada'), n('fim', 'f', 'Continua a contagem')],
      [a('s', 'ag'), a('ag', 'sr', 'sem rede'), a('sr', 'v', 'espera'), a('v', 'ag', 'tenta outra vez'), a('ag', 'gu', 'registou'), a('gu', 'f')]),
    J('f', 'F · Retomar depois de reiniciar', 'A contagem continua do servidor: a Pick sabe onde se ficou.',
      [n('inicio', 's', 'Reinicia o PDA'), e('en', '01 · Entrar', 'mobile', 'entrada'), e('re', 'Retomar a contagem', 'mobile', 'entrar-pk-restaurar'), e('po', '42 · Ler a posição', 'mobile', 'inv-posicao'), n('fim', 'f', 'Continua')],
      fio(['s', 'en', 're', 'po', 'f'])),
    J('g', 'G · Acabar a contagem', 'Rever o que se contou, submeter e confirmar.',
      [n('inicio', 's', 'Última posição'), e('fp', '48 · Posição contada', 'mobile', 'inv-fim-posicao'), e('co', '49 · O que já contei', 'mobile', 'inv-contados'), e('su', '52 · Submeter', 'mobile', 'inv-submeter'), e('ok', 'Submetida', 'mobile', 'inv-submetida'), n('fim', 'f', 'Contagem entregue')],
      fio(['s', 'fp', 'co', 'su', 'ok', 'f'])),
    J('h', 'H · Recontagem', 'O gestor vê uma divergência e pede para recontar.',
      [n('inicio', 's', 'Divergência'), e('di', '53 · Divergências', 'mobile', 'inv-divergencias'), e('rc', '54 · Recontagem pedida', 'mobile', 'inv-recontar'), e('po', '42 · Ler a posição', 'mobile', 'inv-posicao'), e('su', '52 · Submeter', 'mobile', 'inv-submeter'), n('fim', 'f', 'Revista')],
      fio(['s', 'di', 'rc', 'po', 'su', 'f'], [undefined, 'pede recontagem', 'no PDA', 'conta outra vez'])),
    J('i', 'I · A sessão termina', 'Entra-se outra vez e volta-se ao trabalho autorizado.',
      [n('inicio', 's', 'A contar'), e('se', 'Sessão terminada', 'mobile', 'inv-sessao'), e('en', '01 · Entrar', 'mobile', 'entrada'), e('re', 'Retomar a contagem', 'mobile', 'entrar-pk-restaurar'), n('fim', 'f', 'Continua onde ficou')],
      fio(['s', 'se', 'en', 're', 'f'])),
  ];
}
