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
    descricao: 'Do ligar ao trabalho, como o ERP e o Peça A Peça: o início de sessão comum no PDA → a abertura → a página do papel. Só há o armazém 60. O Gestor supervisiona e atribui; o operador recebe as tarefas do motor.',
    nos: [
      n('inicio', 'liga', 'Liga o PDA e abre a Pick'),
      e('id', 'ROMAFE Identity · no PDA', 'identidade', 'pda'),
      e('abertura', '00 · Abertura', 'mobile', 'abertura'), e('semrede', 'Sem rede', 'mobile', 'abertura-pk-sem-rede'), e('semacesso', 'Sem acesso à Pick', 'mobile', 'abertura-pk-sem-acesso'),
      n('decisao', 'papel', 'Que papel?'),
      e('gestor', '60 · Início do Gestor', 'mobile', 'gestor-inicio'), e('ginv', '61 · Inventário (Gestor)', 'mobile', 'gestor-inventario'), e('atribuir', '61.2 · Atribuir contagem', 'mobile', 'gestor-atribuir'), e('div', '53 · Divergências', 'mobile', 'inv-divergencias'),
      n('externo', 'motor', 'Motor · atribui o trabalho'),
      e('inv', '40 · Inventário', 'mobile', 'inv-inicio'), e('guia', '21 · A receber a guia', 'mobile', 'carga-tarefa'),
      n('definir', 'arrumacao', 'Arrumação · ecrãs da guia'), n('definir', 'separacao', 'Separação'), n('definir', 'expedicao', 'Expedição'),
      e('lista', '41 · Contagens atribuídas', 'mobile', 'inv-lista'), e('posicao', '42 · Ler a posição', 'mobile', 'inv-posicao'),
      e('consultar', '56 · Consultar stock', 'mobile', 'inv-consultar'), e('contados', '49 · O que já contei', 'mobile', 'inv-contados'),
      n('acao', 'qualquer', 'Em qualquer ecrã'), e('erede', '30 · Sem rede', 'mobile', 'erro-rede'), e('esessao', '34 · Sessão terminada', 'mobile', 'erro-sessao'), e('eserv', '35 · Erro do servidor', 'mobile', 'erro-servidor'),
    ],
    arestas: [
      a('liga', 'id'), a('id', 'abertura', 'entrou'), a('abertura', 'semrede', 'sem rede'), a('semrede', 'abertura', 'volta a rede'), a('abertura', 'semacesso', 'sem a Pick'), a('semacesso', 'id', 'outra conta'),
      a('abertura', 'papel', 'a caixa voa para o Inventário'), a('papel', 'gestor', 'gestor'), a('papel', 'motor', 'operador'),
      a('gestor', 'ginv', 'Gerir inventários'), a('ginv', 'atribuir'), a('atribuir', 'motor', 'a contagem segue'), a('gestor', 'div', 'por validar'),
      a('motor', 'inv', 'contagens'), a('motor', 'guia', 'guia de arrumação'), a('guia', 'arrumacao'), a('motor', 'separacao'), a('motor', 'expedicao'),
      a('inv', 'lista', '', 'deslize horizontal, 200 ms'), a('lista', 'posicao', 'escolhe'), a('inv', 'consultar'), a('inv', 'contados'),
      a('qualquer', 'erede'), a('erede', 'qualquer', 'volta a rede'), a('qualquer', 'esessao'), a('esessao', 'id'), a('qualquer', 'eserv'), a('eserv', 'qualquer', 'tentar de novo'),
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
      n('aviso', 'demora', 'O servidor demora'), n('aviso', 'tempo', 'Demorou demasiado'), e('servidor', '35 · Erro do servidor', 'mobile', 'erro-servidor'),
      n('aviso', 'expira', 'A sessão termina'), e('sessao', '40.4 · Sessão terminada', 'mobile', 'inv-sessao'), e('entrar', 'ROMAFE Identity · no PDA', 'identidade', 'pda'), n('acao', 'retomar', 'Retoma a contagem onde ficou'),
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
    descricao: 'Os ecrãs que o ERP tem no protótipo: o login comum (ROMAFE Identity), a abertura, o Início (a área de trabalho) e o menu Compras: a Lista de Faltas, os Orçamentos, as Encomendas, as Guias, as Faturas e os mapas. O menu Stocks tem o seu diagrama; o resto dos módulos está por definir.',
    nos: [
      e('entrada', 'ROMAFE Identity · Entrar', 'identidade', 'entrada'), e('passe', 'ROMAFE Identity · Palavra-passe', 'identidade', 'palavra-passe'),
      e('app', 'ROMAFE Identity · Onde queres trabalhar?', 'identidade', 'aplicacoes'), e('abertura', '00 · Abertura', 'erp', 'abertura'),
      e('inicio', '05 · Início', 'erp', 'inicio'),
      e('faltas', '20 · Lista de Faltas', 'erp', 'compras-faltas'), e('cots', '18 · Orçamentos', 'erp', 'compras-cotacoes'), e('enc', '10 · Encomendas', 'erp', 'compras'),
      e('guias', '42 · Guias', 'erp', 'cm-compras-guias-entrada'), e('faturas', '45 · Faturas', 'erp', 'cm-compras-faturas'),
      e('mapas', '49 · Documentos de encomenda', 'erp', 'cm-mapas-tot-enc'), e('recap', '53 · Mapa recapitulativo de fornecedores', 'erp', 'cm-mapas-recap'),
      e('analise', '54 · Análise de compras', 'erp', 'cm-analise-artigo'), e('comp', '59 · Comparativos de compras', 'erp', 'cm-comp-geral-var'),
      e('automatico', '67 · Artigos / compras automático', 'erp', 'cm-mapas-automatico'),
      e('stocks', '70 · Stocks', 'erp', 'stocks-inventario-inicial'), n('definir', 'outros', 'Vendas e restantes módulos'),
    ],
    arestas: [
      a('entrada', 'passe'), a('passe', 'app'), a('app', 'abertura', 'ERP'), a('abertura', 'inicio', 'Saltar ou fim'),
      a('inicio', 'faltas', 'artigos em rutura'), a('faltas', 'enc', 'Para encomenda'), a('inicio', 'cots'), a('cots', 'enc', 'Transferir para encomenda'),
      a('inicio', 'enc'), a('enc', 'guias', 'chega a mercadoria'), a('guias', 'faturas', 'chega a fatura'),
      a('inicio', 'mapas'), a('mapas', 'recap'), a('mapas', 'analise'), a('analise', 'comp'), a('inicio', 'automatico'), a('automatico', 'enc', 'o que encomendar'),
      a('inicio', 'stocks', 'menu Stocks'), a('inicio', 'outros'),
    ],
  },
  /* 18 nov.: o menu Stocks — os documentos que mexem no stock e os mapas que o mostram */
  {
    id: 'erp-stocks', grupo: 'Web', titulo: 'ERP · Stocks', direcao: 'TD',
    descricao: 'O menu Stocks: os documentos de stock (inventário inicial, transferências, ajustamento em valor, acréscimos e perdas) começam em rascunho e só mexem no stock ao lançar (Ctrl+F2). A passagem de um artigo para outro faz-se no painel Stock da área de trabalho. Os mapas mostram o resultado: quem comprou cada artigo, o stock, os movimentos com o extrato e o saldo, e o inventário de um dia.',
    nos: [
      e('inicio', '05 · Início', 'erp', 'inicio'),
      e('inv', '70 · Inventário inicial', 'erp', 'stocks-inventario-inicial'), e('invNovo', '70.14 · Novo inventário', 'erp', 'inv-criar'), e('invLancar', 'Lançar no stock (Ctrl+F2)', 'erp', 'inv-lancar'),
      e('tr', '71 · Transferências entre armazéns', 'erp', 'stocks-transf-armazens'), e('trLancar', 'Lançar a transferência', 'erp', 'tra-lancar'), e('trSem', 'Sem stock na origem', 'erp', 'tra-sem-stock'),
      e('aj', '72 · Ajustamento em valor', 'erp', 'stocks-ajuste-valor'), e('ajLancar', 'Lançar o ajuste', 'erp', 'ajv-lancar'),
      e('ac', '73 · Acréscimos', 'erp', 'stocks-acrescimos'), e('qb', '74 · Perdas', 'erp', 'stocks-perdas'),
      n('acao', 'passar', 'Passar para outro artigo (painel Stock)'),
      n('sucesso', 'stock', 'O stock muda'), n('sucesso', 'custo', 'O custo muda'),
      e('mac', '75 · Artigos/clientes', 'erp', 'stocks-mapa-artigos-clientes'), e('macCli', 'O que comprou um cliente', 'erp', 'mac-trocado'),
      e('mst', '76 · Mapa de stocks', 'erp', 'stocks-mapa-stocks'), e('mstArm', 'Detalhe do artigo', 'erp', 'mst-detalhe'), e('mstHie', 'Hierarquia', 'erp', 'mst-hierarquia'), e('mstRel', 'Relações do artigo', 'erp', 'mst-relacoes'),
      e('mva', '77 · Movimentos de artigos', 'erp', 'stocks-mapa-movimentos'), e('mvaExt', 'Extrato por artigo', 'erp', 'mva-ext-dados'), e('mvaSal', 'Saldo', 'erp', 'mva-sal-dados'),
      e('minv', '78 · Mapa de inventário', 'erp', 'stocks-mapa-inventario'), e('minvD', 'Inventário num dia', 'erp', 'minv-dados'), e('minvC', 'Inventário em cartões', 'erp', 'minv-cartoes'), e('minvJ', 'Detalhe do artigo', 'erp', 'minv-detalhe'),
    ],
    arestas: [
      a('inicio', 'inv'), a('inv', 'invNovo', 'Novo (F5)'), a('invNovo', 'invLancar', 'gravar'), a('invLancar', 'stock'),
      a('inicio', 'tr'), a('tr', 'trLancar', 'Ctrl+F2'), a('trLancar', 'stock', 'há na origem'), t('trLancar', 'trSem', 'falta na origem'), a('trSem', 'tr', 'corrigir'),
      a('inicio', 'aj'), a('aj', 'ajLancar', 'Ctrl+F2'), a('ajLancar', 'custo'),
      a('inicio', 'ac'), a('ac', 'stock', 'lançar: entra'), a('inicio', 'qb'), a('qb', 'stock', 'lançar: sai'), a('inicio', 'passar'), a('passar', 'stock'),
      a('stock', 'mst', 'vê-se em'), a('mst', 'mstArm', 'tocar num artigo'), a('mst', 'mstHie', 'Hierarquia'), a('mstHie', 'mstArm', 'abrir um artigo'), a('mstArm', 'mstRel', 'Ver relações'), a('stock', 'mva'), a('custo', 'mva'),
      a('mva', 'mvaExt', 'tocar num movimento'), a('mva', 'mvaSal', 'separador Saldo'), a('mst', 'minv', 'noutro dia'), a('minv', 'minvD', 'F10'), a('minvD', 'minvC', 'Cartões'), a('minvD', 'minvJ', 'tocar num artigo'), a('minvC', 'minvJ', 'Ver detalhes'),
      a('inicio', 'mac'), a('mac', 'macCli', 'Ver o que comprou'), a('macCli', 'mac', 'Voltar'),
    ],
    grupos: [{ titulo: 'Documentos de stock', nos: ['inv', 'invNovo', 'invLancar', 'tr', 'trLancar', 'trSem', 'aj', 'ajLancar', 'ac', 'qb', 'passar'] }, { titulo: 'Mapas', nos: ['mac', 'macCli', 'mst', 'mstArm', 'mstHie', 'mstRel', 'mva', 'mvaExt', 'mvaSal', 'minv', 'minvD', 'minvC', 'minvJ'] }],
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
  /* =========================================================
     Inventário (a app Kotlin, 2.1.5 de 27 nov. 2026)
     ========================================================= */
  {
    id: 'inv-app', grupo: 'Inventário (PDA)', titulo: 'Inventário · do entrar à prateleira liberta', direcao: 'TD',
    descricao: 'Quem conta pica a prateleira (começa por 60) e os artigos e tranca-a; a API diz o estado em cada resposta. Trancada para o acerto, mesmo sem diferenças, só o gestor a acerta e a liberta para a separação e a expedição.',
    nos: [
      n('inicio', 's', 'Liga o PDA'), e('entrar', '01 · Entrar', 'inventario', 'entrar'),
      n('decisao', 'inv', 'Há inventário a decorrer?'), e('semInv', '02.1 · Nenhum inventário', 'inventario', 'inicio-sem-inventario'), e('iniciar', '02.2 · Iniciar o inventário', 'inventario', 'inicio-iniciar'),
      e('inicio', '02 · Início', 'inventario', 'inicio'), n('decisao', 'sec', 'A secção está a decorrer?'), e('nenhuma', '02.4 · Nenhuma secção a decorrer', 'inventario', 'inicio-nenhuma-seccao'),
      n('acao', 'cont', 'Continuar Óleos'), e('prat', '03 · Contar uma prateleira', 'inventario', 'prateleira'), n('acao', 'lepos', 'Pica a etiqueta'),
      n('decisao', 'e60', 'Começa por 60?'), e('artigo', '03.8 · Picou um artigo', 'inventario', 'prateleira-artigo'),
      n('externo', 'api', 'API · abre a contagem e diz o estado'), n('decisao', 'estado', 'Estado da prateleira?'),
      e('ocupada', '03.4 · A ser contada', 'inventario', 'prateleira-ocupada'), e('jaContada', '03.3 · Já contada', 'inventario', 'prateleira-ja-contada'),
      e('outra', '03.9 · Prateleira de outra secção', 'inventario', 'prateleira-outra-seccao'),
      e('contar', '04 · Contar', 'inventario', 'contar', 'Trancada · a contar'), n('acao', 'picar', 'Pica os artigos'), e('lido', '04.1 · A contar', 'inventario', 'contar-lido'),
      e('resumo', '06 · Trancar a prateleira', 'inventario', 'resumo', 'Aqui vê-se o que se picou'), e('aTrancar', '06.2 · A trancar no servidor', 'inventario', 'resumo-a-fechar'),
      n('decisao', 'difs', 'Há diferenças?'), e('semDif', '03.6 · Trancada sem diferenças', 'inventario', 'prateleira-fechada'), e('comDif', '03.7 · Trancada com diferenças', 'inventario', 'prateleira-fechada-acertos'),
      n('aviso', 'espera', 'Trancada para o acerto: nem separação nem expedição'),
      e('gestor', '02.9 · O gestor', 'inventario', 'inicio-gestor'), e('acPicar', '07 · Acertar Óleos', 'inventario', 'acertar-picar'), e('acertar', '08 · Acertar a prateleira', 'inventario', 'acertar'),
      e('mudar', '08.2 · Mudar à mão', 'inventario', 'acertar-mudar'), e('deNovo', '08.3 · Picar tudo de novo', 'inventario', 'acertar-de-novo'),
      e('confirmar', '08.5 · Confirmar o acerto', 'inventario', 'acertar-confirmar'), e('feito', '07.1 · Prateleira acertada', 'inventario', 'acertar-picar-feito'),
      n('sucesso', 'liberta', 'Liberta: separação e expedição'),
      e('terminarSec', '02.5 · Terminar uma secção', 'inventario', 'inicio-terminar-seccao'), e('terminar', '02.6 · Terminar o inventário', 'inventario', 'inicio-terminar'),
      n('fim', 'fim', 'Inventário terminado'),
    ],
    arestas: [
      a('s', 'entrar'), a('entrar', 'inv', 'toca no nome'), a('inv', 'semInv', 'não'), a('semInv', 'iniciar', 'Iniciar inventário'), a('iniciar', 'inicio', 'confirma'), a('inv', 'inicio', 'sim'),
      a('inicio', 'sec'), a('sec', 'nenhuma', 'não'), a('nenhuma', 'inicio', 'Iniciar Óleos'), a('sec', 'cont', 'sim'), a('cont', 'prat'), a('prat', 'lepos'),
      a('lepos', 'e60'), a('e60', 'artigo', 'não'), a('artigo', 'lepos', 'pica a etiqueta'), a('e60', 'api', 'sim'), a('api', 'estado'),
      a('estado', 'ocupada', 'trancada a contar por outra pessoa'), a('ocupada', 'lepos', 'outra prateleira'),
      a('estado', 'jaContada', 'trancada para o acerto ou liberta'), a('jaContada', 'lepos', 'outra prateleira'),
      a('estado', 'outra', 'de outra secção'), a('outra', 'contar', 'muda de secção no PDA'), a('outra', 'lepos', 'vai à zona dela'),
      a('estado', 'contar', 'livre → trancada a contar'), a('contar', 'picar'), a('picar', 'lido'), a('lido', 'resumo', 'Trancar prateleira'), a('resumo', 'lido', 'Continuar'),
      a('resumo', 'aTrancar', 'Trancar'), a('aTrancar', 'difs'), a('difs', 'semDif', 'não'), a('difs', 'comDif', 'sim'), a('semDif', 'espera'), a('comDif', 'espera'),
      a('espera', 'gestor', 'só o gestor'), a('gestor', 'acPicar', 'Acertar Óleos'), a('acPicar', 'acertar', 'pica ou toca na trancada'),
      a('acertar', 'mudar', 'toca numa linha'), a('mudar', 'acertar'), a('acertar', 'deNovo'), a('deNovo', 'acertar', 'pica tudo'),
      a('acertar', 'confirmar', 'Acertar prateleira'), a('confirmar', 'feito', 'stock = contado'), a('feito', 'liberta'), t('feito', 'acPicar', 'próxima'),
      a('inicio', 'terminarSec', 'Terminar Óleos'), a('terminarSec', 'inicio'), a('inicio', 'terminar', 'Terminar inventário'), a('terminar', 'fim'),
    ],
    grupos: [{ titulo: 'Só o gestor', nos: ['gestor', 'acPicar', 'acertar', 'mudar', 'deNovo', 'confirmar', 'feito', 'liberta'] }],
  },
  {
    id: 'inv-ciclo', grupo: 'Inventário (PDA)', titulo: 'Inventário · o ciclo da prateleira', direcao: 'LR',
    descricao: 'Os quatro estados vêm da base de dados, em cada resposta da API, com a mensagem a dizer o que se passa. Enquanto está trancada, a API recusa entradas, saídas e outra contagem.',
    nos: [
      n('inicio', 's', 'Inventário iniciado'),
      e('livre', 'Livre · ainda não contada', 'inventario', 'prateleira'),
      e('aContar', 'Trancada · a contar', 'inventario', 'contar'), e('descartar', '04.7 · Descartar', 'inventario', 'contar-descartar'),
      e('porTrancar', '03.12 · Trancada sem rede', 'inventario', 'prateleira-por-fechar'),
      e('paraAcerto', 'Trancada para o acerto', 'inventario', 'prateleira-fechada-acertos'),
      n('erro', 'recusa', 'Entradas e saídas recusadas (409 prateleira.trancada)'),
      e('liberta', 'Liberta · acertada', 'inventario', 'acertar-picar-feito'),
      n('fim', 'f', 'Separação e expedição'),
    ],
    arestas: [
      a('s', 'livre'), a('livre', 'aContar', 'pica a etiqueta · POST /contagens'), a('aContar', 'descartar'), a('descartar', 'livre', 'DELETE /contagens/{id}'),
      a('aContar', 'paraAcerto', 'Trancar · POST /contagens/{id}/fechar'), a('aContar', 'porTrancar', 'sem rede'), a('porTrancar', 'paraAcerto', 'a rede volta: tranca-se sozinha'),
      t('aContar', 'recusa'), t('paraAcerto', 'recusa'), a('recusa', 'paraAcerto', 'espera pelo acerto'),
      a('paraAcerto', 'liberta', 'o gestor acerta · POST /prateleiras/{p}/acertar'), a('liberta', 'f'),
    ],
  },
  {
    id: 'inv-rede', grupo: 'Inventário (PDA)', titulo: 'Inventário · sem rede', direcao: 'LR',
    descricao: 'Sem o servidor não se tranca nem se acerta: a faixa «Sem rede» aparece em cima em todos os ecrãs e a app tenta de 5 em 5 s. O que se picou a meio fica no PDA e tranca-se sozinho quando a rede volta.',
    nos: [
      n('inicio', 's', 'A rede cai'), e('faixa', '02.8 · Sem rede', 'inventario', 'inicio-sem-servidor'), n('decisao', 'onde', 'Onde estava?'),
      e('pratSR', '03.11 · A prateleira não abre', 'inventario', 'prateleira-sem-rede'), e('contarSR', '04.9 · Sem rede a contar', 'inventario', 'contar-sem-rede'),
      e('porTrancar', '03.12 · Trancada sem rede', 'inventario', 'prateleira-por-fechar'), e('inicioPor', '02.7 · Por trancar no servidor', 'inventario', 'inicio-por-fechar'),
      e('acSR', '07.4 · Acertar sem rede', 'inventario', 'acertar-picar-sem-rede'), e('acertarSR', '08.7 · Sem rede ao acertar', 'inventario', 'acertar-sem-rede'),
      e('histSR', '09.5 · Histórico sem rede', 'inventario', 'historico-sem-rede'),
      n('aviso', 'tenta', 'Tenta sozinho de 5 em 5 s'), n('sucesso', 'volta', 'A rede volta: continua onde estava'),
    ],
    arestas: [
      a('s', 'faixa'), a('faixa', 'onde'), a('onde', 'pratSR', 'a picar a prateleira'), a('onde', 'contarSR', 'a contar'), a('onde', 'acSR', 'no Acertar'), a('onde', 'acertarSR', 'a acertar'), a('onde', 'histSR', 'no histórico'),
      a('contarSR', 'porTrancar', 'Trancar'), a('porTrancar', 'inicioPor'), a('inicioPor', 'tenta'), a('pratSR', 'tenta'), a('acSR', 'tenta'), a('acertarSR', 'tenta', 'o mudado fica no ecrã'), a('histSR', 'tenta'),
      a('tenta', 'volta'),
    ],
  },
];

/** As jornadas do briefing (A–I), cada uma com início e fim; a E e a F seguem «sem rede, a Pick para». */
function jornadas(): Diagrama[] {
  const J = (id: string, titulo: string, descricao: string, nos: No[], arestas: Aresta[]): Diagrama => ({ id: `j-${id}`, grupo: 'Jornadas (Pick)', titulo, descricao, direcao: 'LR', nos, arestas });
  const fio = (ids: string[], rot: (string | undefined)[] = []) => ids.slice(1).map((p, i) => a(ids[i], p, rot[i]));
  return [
    J('a', 'A · Primeiro acesso', 'Do ligar ao Inventário. Sem escolha de armazém: só há o 60.',
      [n('inicio', 's', 'Liga o PDA'), e('en', 'ROMAFE Identity · no PDA', 'identidade', 'pda'), e('ab', '00 · Abertura', 'mobile', 'abertura'), e('inv', '40 · Inventário', 'mobile', 'inv-inicio'), n('fim', 'f', 'Pronto a trabalhar')],
      fio(['s', 'en', 'ab', 'inv', 'f'], [undefined, 'e-mail e palavra-passe', 'operador: a caixa voa para o Inventário'])),
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
      [n('inicio', 's', 'Reinicia o PDA'), e('en', 'ROMAFE Identity · no PDA', 'identidade', 'pda'), e('inv', '40 · Inventário', 'mobile', 'inv-inicio'), e('po', '42 · Ler a posição', 'mobile', 'inv-posicao'), n('fim', 'f', 'Continua')],
      fio(['s', 'en', 'inv', 'po', 'f'], [undefined, 'a sessão do navegador ainda vale', 'Continuar inventário'])),
    J('g', 'G · Acabar a contagem', 'Rever o que se contou, submeter e confirmar.',
      [n('inicio', 's', 'Última posição'), e('fp', '48 · Posição contada', 'mobile', 'inv-fim-posicao'), e('co', '49 · O que já contei', 'mobile', 'inv-contados'), e('su', '52 · Submeter', 'mobile', 'inv-submeter'), e('ok', 'Submetida', 'mobile', 'inv-submetida'), n('fim', 'f', 'Contagem entregue')],
      fio(['s', 'fp', 'co', 'su', 'ok', 'f'])),
    J('gs', 'G2 · O Gestor começa o dia', 'Do login ao inventário por validar.',
      [n('inicio', 's', 'Liga o PDA'), e('en', 'ROMAFE Identity · no PDA', 'identidade', 'pda'), e('ab', '00 · Abertura', 'mobile', 'abertura'), e('gi', '60 · Início do Gestor', 'mobile', 'gestor-inicio'), e('di', '53 · Divergências', 'mobile', 'inv-divergencias'), n('fim', 'f', 'Inventário validado')],
      fio(['s', 'en', 'ab', 'gi', 'di', 'f'], [undefined, 'e-mail e palavra-passe', 'a caixa voa para o Inventário', 'Inventário por validar', 'valida ou pede recontagem'])),
    J('h', 'H · Recontagem', 'O gestor vê uma divergência e pede para recontar.',
      [n('inicio', 's', 'Divergência'), e('di', '53 · Divergências', 'mobile', 'inv-divergencias'), e('rc', '54 · Recontagem pedida', 'mobile', 'inv-recontar'), e('po', '42 · Ler a posição', 'mobile', 'inv-posicao'), e('su', '52 · Submeter', 'mobile', 'inv-submeter'), n('fim', 'f', 'Revista')],
      fio(['s', 'di', 'rc', 'po', 'su', 'f'], [undefined, 'pede recontagem', 'no PDA', 'conta outra vez'])),
    J('i', 'I · A sessão termina', 'Entra-se outra vez e volta-se ao trabalho autorizado.',
      [n('inicio', 's', 'A contar'), e('se', 'Sessão terminada', 'mobile', 'inv-sessao'), e('en', 'ROMAFE Identity · no PDA', 'identidade', 'pda'), e('inv', '40 · Inventário', 'mobile', 'inv-inicio'), n('fim', 'f', 'Continua onde ficou')],
      fio(['s', 'se', 'en', 'inv', 'f'], [undefined, 'Entrar outra vez', 'volta ao Inventário'])),
  ];
}
