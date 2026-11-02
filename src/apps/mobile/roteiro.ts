/* =========================================================
   PICK — as demonstrações com o rato (27–28 out. 2026)
   Ela: «quero que na demonstração apareça um rato a clicar nos botões para o meu chefe ver e perceber o flow», e (28 out.)
   «sim» a cinco demonstrações curtas do Gestor, cada uma com a explicação ao lado: Inventário, Arrumação, Separar e
   expedir, Supervisionar, Quando algo corre mal. Escolhe-se na barra da demonstração; cada passo clica no botão verdadeiro.
   Link para mandar: …/mobile/#so=ecra&demo=1&anim=dissolver&ecra=gestor-inicio&rato=<id> (inventario, arrumacao,
   gestor, supervisionar, erros; rato=1 é o primeiro)
   ========================================================= */
import { type Passo, registarRoteiro, percurso, juntarEcras } from '../../comum/demo-rato';
import { ECRAS_DOS_ROTEIROS } from './roteiro-ecras';

registarRoteiro('inventario', 'Inventário: criar, contar e fechar', [
  { ecra: 'gestor-inicio', legenda: 'A Ana, gestora, abre o Inventário a partir do Centro de operações.', clicar: '.gx-mod--inv' },
  { legenda: 'Em «Acompanhar» vê os inventários por estado. Cria um novo.', clicar: '.gp-btn--acao[data-ir="gestor-inv-novo"]' },
  { legenda: '1 · O âmbito: a zona 12, retentores.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: '2 · As regras: às cegas e recontar as divergências.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: '3 · Quem conta: quem está livre, ou o motor.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: '4 · Revê e cria. Só existe quando o servidor confirmar.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Criado. Agora a Ana vai contar ela própria outro inventário, sem mudar de função.', clicar: '.gi-pe [data-ir="gestor-inventario"]' },
  { legenda: 'Passa de «Acompanhar» a «Executar».', clicar: '.gx-modo [data-ir="g-inv-exec"]' },
  { legenda: 'O INV-2026-015 não tem quem conte. Fica com ele.', clicar: '.gx-exec .gp-btn--acao' },
  { legenda: 'O servidor atribuiu-lho: 30 posições da zona 10, às cegas. Começa.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Na prateleira, prime a tecla de leitura na etiqueta da posição.', clicar: '.gi-leitor' },
  { legenda: 'É o mesmo ecrã de contar que a equipa usa. Lê o artigo.', clicar: '.gi-faixa-ler' },
  { legenda: 'Conta às cegas: não vê o stock do sistema. Escreve 4.', clicar: '[data-tecla="4"]' },
  { legenda: 'Confirma. Só fica registado quando o servidor responde.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Registado, e o leitor já está pronto para o artigo seguinte. Acaba a posição.', clicar: '.gi-pe .gi-btn-sec' },
  { legenda: 'Posição contada. (As outras 29 fazem-se igual.) Submete a contagem.', clicar: '.gi-pe .gi-btn-sec' },
  { legenda: 'O resumo antes de submeter: depois já não se corrige.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Submetido. Como foi a Ana a contar, quem valida é outro gestor.', clicar: '.gi-pe .gi-btn-sec' },
  { legenda: 'Ela vê o resumo, mas não decide as próprias divergências nem fecha.' },
  { ecra: 'gestor-validar', legenda: 'Noutro inventário, contado pela Joana, a Ana valida: só o gestor vê o stock do sistema. Aceita a divergência.', clicar: '[data-ir="gestor-validar-decidido"]' },
  { legenda: 'Tudo decidido. Fecha o inventário.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Fechado. O ajuste segue para o ERP numa transação do servidor, com auditoria. A Pick nunca ajusta stock sozinha.' },
], { papel: 'Gestor' });

registarRoteiro('arrumacao', 'Arrumação: acompanhar, desbloquear e arrumar', [
  { ecra: 'gestor-inicio', legenda: 'A Ana abre a Arrumação.', clicar: '.gx-mod--arr' },
  { legenda: 'Uma guia à espera: ninguém da arrumação está livre. Abre-a.', clicar: '.gi-sep:not([hidden]) .gp-btn--acao[data-ir="arr-guia"]' },
  { legenda: 'Os artigos e o destino proposto. Ninguém a atribui: o motor dá-a a quem ficar livre. Volta.', clicar: '.gi-pe [data-ir="arr-inicio"]' },
  { legenda: 'Vê as exceções.', clicar: '[data-gi-sep="excecao"]' },
  { legenda: 'Um destino ficou numa zona que está a ser contada às cegas: não se arruma lá.', clicar: '.gi-sep:not([hidden]) .gp-btn--acao[data-ir="arr-guia-bloqueada"]' },
  { legenda: 'Escolhe outro destino, fora das zonas em contagem.', clicar: '.gi-pe .gp-btn--acao' },
  { ecra: 'g-arr-exec', legenda: 'Agora arruma ela própria: «Executar» na Arrumação. Uma guia de um artigo.', clicar: '.gx-exec .gp-btn--acao' },
  { legenda: 'No cais 1, lê a palete.', clicar: '.gi-faixa-ler' },
  { legenda: 'Lê o artigo na palete.', clicar: '.gi-faixa-ler' },
  { legenda: 'Na prateleira, lê a posição de destino: só a da guia aceita o movimento.', clicar: '.gi-faixa-ler' },
  { legenda: 'Destino certo. Confirma as 30 unidades.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Movimento confirmado pelo servidor; a guia fecha. O stock mudou pelo movimento, não pelo PDA.' },
], { papel: 'Gestor' });

/* 28 out. (briefing «Gestor V1»): o primeiro roteiro é o do Gestor que faz tudo — separa uma guia, regista a falta na
   posição, pousa-a nos preparados e expede outra. É o que «Ver o fluxo com o rato» toca. */
registarRoteiro('gestor', 'O Gestor separa e expede', [
  { ecra: 'gestor-inicio', legenda: 'A Ana, gestora, vê o que pede a atenção dela e as quatro operações. Abre a Separação.', clicar: '.gx-mod--sep' },
  { legenda: 'Em «Acompanhar» vê as guias por estado. Passa a «Executar»: vai separar ela própria, sem mudar de função.', clicar: '.gx-modo [data-ir="g-sep"]' },
  { legenda: 'Uma guia por separar. Uma tarefa é uma guia inteira, pela ordem do percurso.', clicar: '.gx-exec .gp-btn--acao' },
  { legenda: 'Linha 1: vai à posição 60100305 e prime a tecla de leitura na etiqueta.', clicar: '.gi-faixa-ler' },
  { legenda: 'Posição certa. Lê o artigo na prateleira.', clicar: '.gi-faixa-ler' },
  { legenda: 'Artigo certo. Tirou as 6 que a guia pede: confirma.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'O servidor confirmou a linha. Segue para a linha 2.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'A guia pede 2 correias, mas só há 1 na posição.', clicar: '.gp-ligacao[data-ir="g-sep-falta"]' },
  { legenda: 'Diz quantas há DE FACTO na posição: a falta fica registada ali, e o servidor corrige o stock da posição.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Falta registada. As outras linhas fazem-se como a primeira.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'A guia separada, com a falta à vista. Leva-a à prateleira de preparados.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Lê a posição dos preparados, 60400101.', clicar: '.gi-faixa-ler' },
  { legenda: 'Pronta: o servidor confirmou onde ficou. Agora a Expedição.', clicar: '.gi-pe [data-ir="g-exp-acomp"]' },
  { legenda: 'As guias prontas na prateleira de preparados. Passa a «Executar».', clicar: '.gx-modo [data-ir="g-exp"]' },
  { legenda: 'Recolhe a GS13454209, pronta há mais tempo.', clicar: '.gx-exec .gp-btn--acao' },
  { legenda: 'Lê a posição dos preparados…', clicar: '.gi-faixa-ler' },
  { legenda: '…e a etiqueta da guia.', clicar: '.gi-faixa-ler' },
  { legenda: 'A guia está pronta e sem faltas. Confirma a recolha.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Recolhida. Confirma a saída: só fica expedida quando o servidor confirmar.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Expedida. A mesma pessoa acompanhou e executou duas operações, sem mudar de função; o stock nunca mudou pelo PDA.' },
], { papel: 'Gestor' });

registarRoteiro('supervisionar', 'Supervisionar: tarefas, equipa e insights', [
  { ecra: 'gestor-inicio', legenda: 'O estado do armazém, hoje: em curso, por fazer, exceções e concluídas. A Ana toca nas exceções.', clicar: '.gx-num.is-erro' },
  { legenda: 'Todas as tarefas com exceção, das quatro operações. Filtra pela Separação.', escolher: ['[data-gi-tipo-sel]', 'separacao'] },
  { legenda: 'Fica só a guia com falta. Agora a equipa: vai ao Mais.', clicar: '.gi-barra__b[data-ir="g-mais"]' },
  { legenda: 'Abre a Equipa.', clicar: '.gi-mais[data-ir="g-equipa"]' },
  { legenda: 'Cada pessoa: o que tem em mãos e o que fez hoje. Sem presença, sem localização, sem ranking. Abre o Tiago.', clicar: '.gx-pessoa[data-ir="g-equipa-tiago"]' },
  { legenda: 'A guia em mãos e o que o servidor confirmou hoje. O Tiago foi para o cais: a Ana reatribui a guia.', clicar: '[data-ir="g-equipa-reatribuir"]' },
  { legenda: 'Fica com ela, com motivo. O que o Tiago separou fica com o nome dele.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Reatribuída. Agora os Insights.', clicar: '.gi-barra__b[data-ir="g-insights"]' },
  { legenda: 'Hoje: criadas, concluídas, exceções, duração média, e onde está a parar. Vê a Expedição.', escolher: ['[data-gi-sel]', 'exp'] },
  { legenda: 'Uma guia pronta há 1 h 33 sem recolha. O insight diz porquê, a regra, e leva à ação.', clicar: '.gi-sep:not([hidden]) .gx-ins .gp-btn--acao' },
  { legenda: 'Da análise à tarefa num toque: a Ana pode recolher a guia já.' },
], { papel: 'Gestor' });

registarRoteiro('erros', 'Quando algo corre mal', [
  { ecra: 'g-sep-pos-errada', legenda: 'Na separação, leu a posição ao lado. Não se tira daqui: a Pick diz qual é a certa.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Volta a ler, agora a posição certa, e segue.', clicar: '.gi-faixa-ler' },
  { ecra: 'g-exp-nao-pronta', legenda: 'Na expedição, leu uma guia que ainda está a ser separada. Não se recolhe.', clicar: '.gi-pe .gp-btn--acao' },
  { ecra: 'g-exp-ja', legenda: 'Outra guia já tinha sido recolhida pelo Paulo. Não se recolhe duas vezes.', clicar: '.gi-pe .gp-btn--acao' },
  { ecra: 'g-equipa-conflito', legenda: 'Ao reatribuir, o Tiago acabou a guia um segundo antes. O servidor decide e a Pick diz o que aconteceu.', clicar: '.gi-pe .gp-btn--acao' },
  { ecra: 'g-ler-desconhecido', legenda: 'Um código que não é nada do armazém 60: diz-se e lê-se outra vez.', clicar: '.gi-pe .gp-btn--acao' },
  { ecra: 'g-ler-sem-leitor', legenda: 'O leitor não envia códigos: reiniciar, ou escrever à mão (fica marcado como escrito).' },
  { ecra: 'g-sep-sem-rede-op', legenda: 'Sem rede, a Pick para: nada se confirma e nada fica à espera no PDA. Continua quando houver sinal.' },
  { ecra: 'g-insights-indisponivel', legenda: 'Os insights não carregam, mas as operações continuam. Vai às tarefas.', clicar: '.gi-pe [data-ir="g-tarefas"]' },
  { ecra: 'gestor-sessao', legenda: 'A sessão terminou: entra outra vez pelo login comum e volta ao mesmo sítio.' },
], { papel: 'Todas as funções' });

/* 30 out. (ela: «só podem fazer aquilo que deixei nos docs»): a Arrumação dos documentos (07 · O menu da app), em quatro casos */
const IN = { ecra: 'ta-inicio', legenda: 'A Inês, da arrumação: «Bom dia», o turno e uma opção de Trabalho — a guia que o motor lhe deu. Começa.', clicar: '.ta-trabalho' };
const ARTIGO = { legenda: 'Palete 2 de 2: lê o artigo (tocar no leitor faz de gatilho).', clicar: '.gi-leitor' };
registarRoteiro('arr-normal', 'Arrumação A · Arrumar uma palete', [
  IN, ARTIGO,
  { legenda: 'Vai à proposta 1 de 3, com o porquê e o caminho. Pousa a palete e lê a posição.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Lê a etiqueta da prateleira: o sistema confirma de novo que a posição serve.', clicar: '.gi-leitor' },
  { legenda: 'Palete arrumada, com o seu nome. Era a última: a guia fecha e o motor dá a seguinte.' },
], { papel: 'Arrumação' });
registarRoteiro('arr-ocupada', 'Arrumação B · A proposta não serve', [
  IN, ARTIGO,
  { legenda: 'Na proposta 1 já há caixas de outro artigo. «Não serve».', clicar: '.gi-pe [data-ir="arr-op-picar"]' },
  { legenda: 'Antes de passar à seguinte, pica a posição: lê a etiqueta da prateleira.', clicar: '.gi-leitor' },
  { legenda: 'A 1 fica picada e registada como ocupada. Vai à proposta 2.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Lê a posição.', clicar: '.gi-leitor' },
  { legenda: 'Arrumada na proposta 2. Ninguém teve de decidir nada por ela.' },
], { papel: 'Arrumação' });
registarRoteiro('arr-chamar', 'Arrumação F · Chamar o gestor', [
  IN, ARTIGO,
  { legenda: 'Na proposta, há uma dúvida. «Chamar», que está em todos os ecrãs.', clicar: '.ta-topo [data-ir$="-chamar"]' },
  { legenda: 'A gestora vai saber onde está e o que tem em mãos. O motivo, com um toque.', clicar: '.ta-escolha', pausa: 400 },
  { legenda: 'O gestor foi chamado: a tarefa fica com a Inês e o motor não lhe dá outra.' },
  { ecra: 'arr-excecoes', legenda: 'No PDA da Ana, a chamada aparece primeiro. Responde.', clicar: '[data-ir="arr-problema-chamada"]' },
  { legenda: 'Responde daí, sem ir lá.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'A resposta segue para o PDA da Inês.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'A Inês lê a resposta e continua a tarefa.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Como a Ana disse: «Não serve».', clicar: '.gi-pe [data-ir="arr-op-picar"]' },
  { legenda: 'Pica a posição.', clicar: '.gi-leitor' },
  { legenda: 'Proposta 2: lê a posição.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Lê.', clicar: '.gi-leitor' },
  { legenda: 'Arrumada.' },
], { papel: 'Arrumação' });
registarRoteiro('arr-danificado', 'Arrumação D · Outro problema: artigo danificado', [
  IN, ARTIGO,
  { legenda: 'Uma caixa da palete está molhada. «Outro problema».', clicar: '.gi-pe [data-ir="arr-op-problema"]' },
  { legenda: 'O que se passa, com um toque: artigo danificado.', clicar: '.ta-escolha[data-ir="arr-op-foto"]' },
  { legenda: 'A fotografia é opcional. Regista.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Registado: o gestor foi avisado, a palete fica no cais, e a tarefa deixa de ser da Inês — o motor dá-lhe a seguinte.' },
  { ecra: 'arr-excecoes', legenda: 'No PDA da Ana, o problema registado. Decide.', clicar: '[data-ir="arr-problema"]' },
  { legenda: 'Tira a caixa molhada para quarentena e devolve a palete ao motor — não a dá a ninguém.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'A palete volta ao motor, que a dá a quem estiver livre na arrumação.' },
], { papel: 'Arrumação' });

/* 2 nov. (ela: «tem de picar as três posições propostas pelo motor»): nenhuma das três serve — picam-se as três e arruma-se onde se entender */
registarRoteiro('arr-tres', 'Arrumação C · Nenhuma das três propostas serve', [
  IN, ARTIGO,
  { legenda: 'A proposta 1 não serve. «Não serve».', clicar: '.gi-pe [data-ir="arr-op-picar"]' },
  { legenda: 'Para passar à seguinte, pica a posição no sítio.', clicar: '.gi-leitor' },
  { legenda: 'A 1 fica picada. A proposta 2 também não serve.', clicar: '.gi-pe [data-ir="arr-op-picar-2"]' },
  { legenda: 'Pica a 2.', clicar: '.gi-leitor' },
  { legenda: 'Duas picadas. A proposta 3, a última do motor, também não serve.', clicar: '.gi-pe [data-ir="arr-op-picar-3"]' },
  { legenda: 'Pica a 3.', clicar: '.gi-leitor' },
  { legenda: 'As três picadas: agora arruma onde entender. Pousa a palete e lê essa posição.', clicar: '.gi-leitor' },
  { legenda: 'Arrumada, com o seu nome e a posição registada como escolhida por quem arruma, fora das propostas.' },
], { papel: 'Arrumação' });

/* 30 out. (ela: «sim faz isso»): a arrumação parcial — 30 un. em três posições, a 3.ª bloqueada, a Inês e a Ana */
const LER = { legenda: 'Lê a etiqueta da prateleira.', clicar: '.gi-leitor' };
registarRoteiro('arr-parcial', 'Arrumação E · Parcial: 30 unidades em três posições', [
  { ecra: 'arr-par', legenda: 'Uma palete de 30 × SKF 6205-2Z. A Inês lê o artigo.', clicar: '.gi-leitor' },
  { legenda: 'Proposta 1 de 3. Vai lá e lê a posição.', clicar: '.gi-pe .gp-btn--acao' }, LER,
  { legenda: 'Só cabem 12: confirma as que ficaram.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: '12 arrumadas. As 18 que faltam vão à proposta 2.', clicar: '.gi-pe .gp-btn--acao' }, LER,
  { legenda: 'Cabem 10. Confirma.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: '22 arrumadas em duas posições; as 8 vão à proposta 3.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Ao ler, o sistema confirma se a posição ainda serve.', clicar: '.gi-leitor' },
  { legenda: 'Está bloqueada. As três propostas estão picadas: arruma as 8 onde entender, sem esperar pelo gestor.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Pousa-as na 60100402 e lê a posição: fica registada como escolhida por quem arruma.', clicar: '.gi-leitor' },
  { legenda: 'As últimas 8.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: '30 de 30 em três posições: duas propostas pelo motor e uma escolhida por quem arruma. A guia fecha.' },
], { papel: 'Arrumação' });

/* 30 out. (ela: «agora faz a app da expedição e separação no figma»): as duas funções, como nos documentos */
/* 2 nov. (Separação v2, o briefing dela): um caso por critério de aceitação, pelas letras do guião */
const S2 = { papel: 'Separação' };
registarRoteiro('sep-recolher', 'Separação A · Recolher, consultar e retomar', [
  { ecra: 'ts-inicio', legenda: 'O Tiago, da separação. Um cartão só: a guia, as linhas, a zona; o prazo dos preparados em destaque e o camião por baixo. Começa.', clicar: '.ta-trabalho' },
  { legenda: 'O cartão com o porquê.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'As linhas com a quantidade e a caixa. Começa a recolher.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Primeiro o carrinho: fica ligado à guia (C-07).', clicar: '.gi-leitor' },
  { legenda: 'Linha 1: «Leia a posição». Recolher 12 un.; 1 caixa = 10 un.', clicar: '.gi-leitor' },
  { legenda: 'Posição certa. Agora a caixa ou a unidade.', clicar: '.gi-leitor' },
  { legenda: 'Caixa lida · +10 un. Ficam 10 de 12. Lê outra caixa por engano…', clicar: '.gi-leitor' },
  { legenda: '…e é recusada: «Faltam 2 un. Esta caixa contém 10.» Continua em 10. Lê uma unidade.', clicar: '.gi-leitor' },
  { legenda: '+1: 11 de 12. Mais uma.', clicar: '.gi-leitor' },
  { legenda: 'Linha 1 completa, com o histórico. Segue para a linha 2.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Linha 2: a posição e o artigo.', clicar: '.gi-leitor' },
  { legenda: '2 de 4 linhas. Volta ao Início.', clicar: '.gp-voltar' },
  { legenda: '«Continuar recolha · 2 de 4 linhas recolhidas» e a próxima posição. Vai consultar um artigo.', clicar: '.ta-op[data-ir="ts-consultar-artigo"]' },
  { legenda: 'Só de ver; a recolha continua guardada. Volta.', clicar: '.gi-pe .gi-btn-sec' },
  { legenda: 'O cartão continua igual. «Continuar recolha».', clicar: '.ta-trabalho' },
  { legenda: 'Retoma na linha 3, na posição seguinte: nada se lê outra vez.' },
], S2);
registarRoteiro('sep-corrigir', 'Separação B · Corrigir a última leitura', [
  { ecra: 'ts-paragem-4', legenda: 'Linha 4: 30 velas, em caixas de 10. Lê a posição.', clicar: '.gi-leitor' },
  { legenda: 'Duas caixas lidas: 20 de 30. A segunda foi engano: «Corrigir última leitura».', clicar: '.gi-pe [data-ir="ts-corrigir"]' },
  { legenda: '«Retirar a última caixa de 10 un.?» Tira-a do carrinho e confirma.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'De 20 para 10, e a correção fica no histórico com a hora e o nome. Lê as caixas que faltam.', clicar: '.gi-leitor' },
  { legenda: 'Linha 4 completa.' },
], S2);
registarRoteiro('sep-falta', 'Separação C · Falta quantidade: o resto noutra posição', [
  { ecra: 'ts-paragem-3', legenda: 'Linha 3: pedidas 8. Na posição só há 5. «Falta quantidade».', clicar: '.gi-pe [data-ir="ts-falta"]' },
  { legenda: 'Pedidas 8 · recolhidas 5 · faltam 3. Não chama ninguém: vai buscar o resto.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'O PDA dá outra posição com o artigo. Lê a posição…', clicar: '.gi-leitor' },
  { legenda: '…e o artigo: 5 + 3, a linha fica completa.', clicar: '.gi-leitor' },
  { legenda: 'Segue para a linha 4, sem o gestor.' },
], S2);
registarRoteiro('sep-sem-stock', 'Separação C · Falta quantidade: não há mais stock', [
  { ecra: 'ts-paragem-3', legenda: 'Linha 3: só há 5 das 8. «Falta quantidade».', clicar: '.gi-pe [data-ir="ts-falta"]' },
  { legenda: 'Regista as 5 e vai buscar o resto.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Na outra posição também não há: «Aqui também falta».', clicar: '.gi-pe [data-ir="ts-falta-sem-stock"]' },
  { legenda: 'Não há mais em lado nenhum. O pedido já leva a guia, a linha, o artigo e as posições: «Chamar o gestor».', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Pedido por enviar → recebido → resposta. A linha 3 fica pendente; continua nas outras.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Linha 4, com a 3 pendente à vista. Mais tarde, no Início…', ir: 'ts-inicio-resposta' },
  { legenda: '«Ver resposta do gestor · linha 3».', clicar: '.ts2-pedido-gestor' },
  { legenda: 'A resposta presa à linha 3. Continua nas restantes.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'De volta à linha 4.' },
], S2);
registarRoteiro('sep-entregar', 'Separação D · Entregar nos preparados', [
  { ecra: 'ts-linha4-completa', legenda: 'A última linha completa. «Ver o resumo».', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: '3 linhas completas · 1 com falta. A regra desta operação deixa entregar o que há.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Leva à prateleira de preparados e lê-a. Lê a prateleira ao lado, por engano…', clicar: '.gi-leitor' },
  { legenda: '…lida 60400102, esperada 60400101. A guia continua aberta: repete só este passo.', clicar: '.gi-leitor' },
  { legenda: 'Entrega confirmada no sistema. «Próxima tarefa».', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'O Início fica pronto para a próxima guia.' },
], S2);
registarRoteiro('sep-rede', 'Separação E · Sem ligação a meio', [
  { ecra: 'ts-inicio-sem-rede', legenda: 'A rede caiu logo a seguir a uma leitura: o PDA diz o que o sistema confirmou e o que não chegou. Nada fica guardado no PDA.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Ligação reposta: o sistema tem 20. Lê outra vez só a caixa que não chegou.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'De volta à linha 4, onde estava.' },
], S2);
registarRoteiro('sep-sair', 'Separação F · Pausar e terminar sessão', [
  { ecra: 'ts-paragem-3', legenda: '«Pausar» está na faixa da guia.', clicar: '.ta-topo [data-ir="ts-sair"]' },
  { legenda: 'O que fica guardado e onde se retoma. «Pausar recolha».', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'O Início com «Continuar recolha». Terminar a sessão é na conta: as iniciais.', clicar: '.gp-conta' },
  { legenda: 'A conta: quem, o turno e o que tem em mãos. «Terminar sessão».', clicar: '.gi-pe .gi-btn-sec' },
  { legenda: 'Com a guia a meio, diz o que fica feito e onde se retoma.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Sessão terminada.' },
], S2);
registarRoteiro('exp-carregar', 'Expedição · Carregar e fechar a saída', [
  { ecra: 'tx-inicio', legenda: 'O Paulo, da expedição: a guia que o motor lhe deu, na prateleira de preparados. Começa.', clicar: '.ta-trabalho' },
  { legenda: 'O cartão com o porquê: o camião DPD já está no cais.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Na prateleira, lê cada volume.', clicar: '.gi-leitor' },
  { legenda: 'Mais um.', clicar: '.gi-leitor' },
  { legenda: 'Os três conferidos. Leva ao cais de saída 2 e lê a etiqueta do cais.', clicar: '.gi-leitor' },
  { legenda: 'Lê cada volume quando sobe. Faltam 2 da GS13454208 e o transportador não pode esperar: «Fechar a saída».', clicar: '.gi-pe [data-ir="tx-perguntar"]' },
  { legenda: 'O PDA pergunta antes de fechar incompleta, que é o que não tem volta.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Diz porquê; fica com o seu nome e a hora.', clicar: '.ta-escolha', pausa: 400 },
  { legenda: 'Saída fechada incompleta: os 2 volumes vão no camião seguinte.' },
], { papel: 'Expedição' });

/* 28 out. (ela: «o fluxo com o rato em mobile também deve representar todos os cenários de todos os ecrãs»): sete percursos
   que passam por TODOS os ecrãs e estados da Pick, pela ordem do número; o rato toca na ligação verdadeira quando o ecrã a
   tem, e ao lado diz-se o que é cada um. Os cinco de cima são os casos contados; estes são o inventário completo. */
const n0 = (e: HTMLElement) => Number(/^\d+/.exec(e.dataset.nome ?? '')?.[0] ?? -1);
const entre = (...faixas: [number, number][]) => (e: HTMLElement) => faixas.some(([a, b]) => n0(e) >= a && n0(e) <= b);
([
  ['todos-entrar', 'Todos os ecrãs · Entrar, carregar e erros', entre([0, 3], [20, 39])],
  ['todos-centro', 'Todos os ecrãs · Centro de operações, tarefas e Mais', entre([60, 60], [65, 66], [69, 69])],
  ['todos-inv-gestor', 'Todos os ecrãs · Inventário do Gestor', entre([61, 64])],
  ['todos-contar', 'Todos os ecrãs · Contar (inventário)', entre([40, 59], [67, 68], [76, 76])],
  ['todos-ler', 'Todos os ecrãs · Ler, posição, artigo, atividade, equipa e insights', entre([75, 75], [77, 78], [82, 84])],
  ['todos-arrumacao', 'Todos os ecrãs · Arrumação', entre([70, 74], [79, 81], [85, 89], [100, 102])],
  ['todos-sep-exp', 'Todos os ecrãs · Separação e expedição', entre([90, 99], [110, 140])],
] as [string, string, (e: HTMLElement) => boolean][]).forEach(([id, t, f]) => registarRoteiro(id, t, () => { const ps = percurso(f); return comFim(ps, `Fim do percurso: ${ps.length} ecrãs e estados.`); }, { papel: id === 'todos-entrar' || id === 'todos-contar' ? 'Todas as funções' : 'Gestor' }));
/* 2 nov.: todos os ecrãs de quem arruma, separa e expede (a função, pela data-papel), para ver cada uma com o rato */
([['todos-f-arrumacao', 'Todos os ecrãs · Arrumação (quem arruma)', 'Arrumação'], ['todos-f-separacao', 'Todos os ecrãs · Separação (quem separa)', 'Separação'], ['todos-f-expedicao', 'Todos os ecrãs · Expedição (quem expede)', 'Expedição']] as const)
  .forEach(([id, t, papel]) => registarRoteiro(id, t, () => daFuncao(papel), { papel }));
/* 2 nov. (ela: «prepara o fluxo de rato para mostrar todos os ecrãs das 4 roles»): o Gestor sozinho, e as quatro funções
   seguidas (Arrumação, Separação, Expedição, Gestor), cada uma a partir do seu Início, com o nome da função ao entrar nela */
const FUNCOES = ['Arrumação', 'Separação', 'Expedição', 'Gestor'];
const daFuncao = (papel: string, seguinte?: string) => { const ps = aPartirDoInicio(percurso((e) => e.dataset.papel === papel));
  return comFim(ps, `Fim ${DA[papel] ?? 'da função'}: ${ps.length} ecrãs e estados. ${seguinte ? `De volta ao Início; a seguir, ${DA_SEG[seguinte]}.` : 'De volta ao Início.'}`); };
const DA: Record<string, string> = { 'Arrumação': 'da Arrumação', 'Separação': 'da Separação', 'Expedição': 'da Expedição', 'Gestor': 'do Gestor' };
const DA_SEG: Record<string, string> = { 'Separação': 'a Separação', 'Expedição': 'a Expedição', 'Gestor': 'o Gestor' };
function comEntrada(papel: string, passos: Passo[]): Passo[] {
  const p = passos[0]; if (!p?.ir) return passos;
  const e = document.querySelector<HTMLElement>(`.ecra[data-ecra="${p.ir}"]`);
  return [{ ...p, legenda: `${papel.toUpperCase()} · ${e?.dataset.nome ?? p.ir}. ${e?.dataset.objetivo ?? ''}` }, ...passos.slice(1)];
}
registarRoteiro('todos-f-gestor', 'Todos os ecrãs · Gestor (quem gere)', () => daFuncao('Gestor'), { papel: 'Gestor' });
registarRoteiro('todos-funcoes', 'Todos os ecrãs · As 4 funções (quem arruma, separa, expede e gere)', () => FUNCOES.flatMap((f, i) => comEntrada(f, daFuncao(f, FUNCOES[i + 1]))), { papel: 'Todas as funções' });
/* 2 nov. (ela: «quero o fluxo a partir daqui» e «quero o fluxo para todos os estados»): o percurso de todos os estados de
   uma função começa no início dela (o ecrã -inicio e os seus estados), como o Seguinte da barra */
function aPartirDoInicio(passos: Passo[]): Passo[] {
  const de = (id?: string) => document.querySelector<HTMLElement>(`.ecra[data-ecra="${id}"]`);
  const inicio = passos.find((p) => p.ir?.endsWith('-inicio') && !de(p.ir)?.dataset.estadoDe)?.ir;
  const primeiro = (p: Passo) => Number(!(p.ir === inicio || de(p.ir)?.dataset.estadoDe === inicio));
  return passos.map((p, i) => [p, i] as const).sort((a, b) => primeiro(a[0]) - primeiro(b[0]) || a[1] - b[1]).map(([p]) => p);
}
/* 2 nov. (ela: «bloqueou aqui», no último estado do Gestor): o percurso acabava no estado de número mais alto, que podia
   ser um erro, e parecia preso. Agora volta ao Início da função e diz que acabou (e, nas 4 funções, qual vem a seguir). */
function comFim(passos: Passo[], texto: string): Passo[] {
  const de = (id?: string) => document.querySelector<HTMLElement>(`.ecra[data-ecra="${id}"]`);
  const inicio = passos.find((p) => p.ir?.endsWith('-inicio') && !de(p.ir)?.dataset.estadoDe)?.ir ?? passos[0]?.ir;
  return inicio ? [...passos, { ir: inicio, legenda: texto }] : passos;
}

juntarEcras(ECRAS_DOS_ROTEIROS);
