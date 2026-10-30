/* =========================================================
   PICK — as demonstrações com o rato (27–28 out. 2026)
   Ela: «quero que na demonstração apareça um rato a clicar nos botões para o meu chefe ver e perceber o flow», e (28 out.)
   «sim» a cinco demonstrações curtas do Gestor, cada uma com a explicação ao lado: Inventário, Arrumação, Separar e
   expedir, Supervisionar, Quando algo corre mal. Escolhe-se na barra da demonstração; cada passo clica no botão verdadeiro.
   Link para mandar: …/mobile/#so=ecra&demo=1&anim=dissolver&ecra=gestor-inicio&rato=<id> (inventario, arrumacao,
   gestor, supervisionar, erros; rato=1 é o primeiro)
   ========================================================= */
import { registarRoteiro, percurso } from '../../comum/demo-rato';

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
]);

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
]);

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
]);

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
]);

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
]);

/* 30 out. (ela: «só podem fazer aquilo que deixei nos docs»): a Arrumação dos documentos (07 · O menu da app), em quatro casos */
const IN = { ecra: 'ta-inicio', legenda: 'A Inês, da arrumação: «Bom dia», o turno e uma opção de Trabalho — a guia que o motor lhe deu. Começa.', clicar: '.ta-trabalho' };
const ARTIGO = { legenda: 'Palete 2 de 2: lê o artigo (tocar no leitor faz de gatilho).', clicar: '.gi-leitor' };
registarRoteiro('arr-normal', 'Arrumação A · Arrumar uma palete', [
  IN, ARTIGO,
  { legenda: 'Vai à proposta 1 de 3, com o porquê e o caminho. Pousa a palete e lê a posição.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Lê a etiqueta da prateleira: o sistema confirma de novo que a posição serve.', clicar: '.gi-leitor' },
  { legenda: 'Palete arrumada, com o seu nome. Era a última: a guia fecha e o motor dá a seguinte.' },
]);
registarRoteiro('arr-ocupada', 'Arrumação B · A posição está ocupada', [
  IN, ARTIGO,
  { legenda: 'Na proposta 1 já há caixas de outro artigo. «Está ocupada».', clicar: '.gi-pe [data-ir="arr-op-ocupada"]' },
  { legenda: 'A posição fica registada como ocupada e o gestor vai ver porquê. Vai à proposta 2.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Lê a posição.', clicar: '.gi-leitor' },
  { legenda: 'Arrumada na proposta 2. Ninguém teve de decidir nada por ela.' },
]);
registarRoteiro('arr-chamar', 'Arrumação C · Chamar o gestor', [
  IN, ARTIGO,
  { legenda: 'Na proposta, há uma dúvida. «Chamar», que está em todos os ecrãs.', clicar: '.ta-chamar' },
  { legenda: 'A gestora vai saber onde está e o que tem em mãos. O motivo, com um toque.', clicar: '.ta-escolha', pausa: 400 },
  { legenda: 'O gestor foi chamado: a tarefa fica com a Inês e o motor não lhe dá outra.' },
  { ecra: 'arr-excecoes', legenda: 'No PDA da Ana, a chamada aparece primeiro. Responde.', clicar: '[data-ir="arr-problema-chamada"]' },
  { legenda: 'Responde daí, sem ir lá.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'A resposta segue para o PDA da Inês.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'A Inês lê a resposta e continua a tarefa.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Como a Ana disse: «Está ocupada».', clicar: '.gi-pe [data-ir="arr-op-ocupada"]' },
  { legenda: 'Proposta 2: lê a posição.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Lê.', clicar: '.gi-leitor' },
  { legenda: 'Arrumada.' },
]);
registarRoteiro('arr-danificado', 'Arrumação D · Artigo danificado', [
  IN, ARTIGO,
  { legenda: 'Uma caixa da palete está molhada. «Outro problema».', clicar: '.gi-pe [data-ir="arr-op-problema"]' },
  { legenda: 'O que se passa, com um toque: artigo danificado.', clicar: '.ta-escolha[data-ir="arr-op-foto"]' },
  { legenda: 'A fotografia é opcional. Regista.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Registado: o gestor foi avisado, a palete fica no cais, e a tarefa deixa de ser da Inês — o motor dá-lhe a seguinte.' },
  { ecra: 'arr-excecoes', legenda: 'No PDA da Ana, o problema registado. Decide.', clicar: '[data-ir="arr-problema"]' },
  { legenda: 'Tira a caixa molhada para quarentena e devolve a palete ao motor — não a dá a ninguém.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'A palete volta ao motor, que a dá a quem estiver livre na arrumação.' },
]);

/* 30 out. (ela: «agora faz a app da expedição e separação no figma»): as duas funções, como nos documentos */
registarRoteiro('sep-recolher', 'Separação · Recolher uma guia', [
  { ecra: 'ts-inicio', legenda: 'O Tiago, da separação: «Bom dia», o turno e uma opção de Trabalho — a guia que o motor lhe deu. Começa.', clicar: '.ta-trabalho' },
  { legenda: 'O cartão com o porquê: o camião DPD fecha às 11h30. Ninguém escolhe, ninguém apanha a guia de outro.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'As paragens pela ordem mais curta, e a prateleira de preparados já reservada.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Paragem 1: vai à posição e lê-a.', clicar: '.gi-leitor' },
  { legenda: 'Posição certa. Agora o artigo.', clicar: '.gi-leitor' },
  { legenda: 'As paragens do meio fazem-se igual. Última paragem: a posição…', clicar: '.gi-leitor' },
  { legenda: '…e o artigo.', clicar: '.gi-leitor' },
  { legenda: 'Leva a guia à prateleira de preparados e lê onde a pousa.', clicar: '.gi-leitor' },
  { legenda: 'Guia fechada: a expedição leva-a quando o camião chegar.' },
]);
registarRoteiro('sep-falta', 'Separação · Falta quantidade', [
  { ecra: 'ts-paragem', legenda: 'Na posição há menos do que a guia pede. «Falta quantidade».', clicar: '.gi-pe [data-ir="ts-falta"]' },
  { legenda: 'Regista o que tirou: 2 das 4. A diferença fica na posição e o gestor decide o stock.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Segue para a paragem seguinte; a guia vai fechar incompleta.' },
  { ecra: 'ts-fechada-incompleta', legenda: 'Fechada incompleta: fica na prateleira, fora da fila da expedição, até o stock entrar.' },
]);
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
]);

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
  ['todos-arrumacao', 'Todos os ecrãs · Arrumação', entre([70, 74], [79, 81], [85, 89], [100, 101])],
  ['todos-sep-exp', 'Todos os ecrãs · Separação e expedição', entre([90, 99], [110, 140])],
] as [string, string, (e: HTMLElement) => boolean][]).forEach(([id, t, f]) => registarRoteiro(id, t, () => percurso(f)));
