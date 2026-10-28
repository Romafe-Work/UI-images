/* =========================================================
   PICK — o roteiro da demonstração com o rato (27 out. 2026)
   Ela: «quero que na demonstração apareça um rato a clicar nos botões para o meu chefe ver e perceber o flow».
   O Inventário de ponta a ponta: o gestor cria um inventário; a Joana (Arrumação) recebe a tarefa, lê, conta e
   confirma; o gestor aceita a divergência e fecha — o ajuste segue para o ERP. Cada passo clica no botão verdadeiro.
   Link para mandar: …/mobile/#so=ecra&demo=1&anim=dissolver&ecra=gestor-inicio&rato=1
   ========================================================= */
import { registarRoteiro } from '../../comum/demo-rato';

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
  { legenda: 'Lê a etiqueta da prateleira de preparados.', clicar: '.gi-faixa-ler' },
  { legenda: 'Pronta: o servidor confirmou onde ficou. Agora a Expedição.', clicar: '.gi-pe [data-ir="g-exp-acomp"]' },
  { legenda: 'As guias prontas na prateleira de preparados. Passa a «Executar».', clicar: '.gx-modo [data-ir="g-exp"]' },
  { legenda: 'Recolhe a GS-2026-1184, pronta há mais tempo.', clicar: '.gx-exec .gp-btn--acao' },
  { legenda: 'Lê a prateleira de preparados…', clicar: '.gi-faixa-ler' },
  { legenda: '…e a etiqueta da guia.', clicar: '.gi-faixa-ler' },
  { legenda: 'A guia está pronta e sem faltas. Confirma a recolha.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Recolhida. Confirma a saída: só fica expedida quando o servidor confirmar.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Expedida. A mesma pessoa acompanhou e executou duas operações, sem mudar de função; o stock nunca mudou pelo PDA.' },
]);

registarRoteiro('inventario', 'Inventário de ponta a ponta', [
  { ecra: 'gestor-inicio', legenda: 'A Ana, gestora, entra na Pick e vê logo o que precisa da atenção dela. Vai ao Inventário.', clicar: '.gx-mod--inv' },
  { legenda: 'No Inventário vê o que está em curso, por validar e as divergências. Cria um inventário novo.', clicar: '.gp-btn--acao[data-ir="gestor-inv-novo"]' },
  { legenda: '1 · O âmbito: o que se conta. Escolhe a zona 12, retentores.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: '2 · As regras: às cegas (quem conta não vê o stock) e recontar as divergências.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: '3 · Quem conta: a Inês, que está livre. Quem já está a contar não se pode escolher.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: '4 · Revê e cria. Nada se cria antes de o servidor confirmar.', clicar: '.gi-pe .gp-btn--acao' },
  { legenda: 'Criado. A tarefa vai para o PDA de quem conta. Vamos ver a Pick do lado da Arrumação.', clicar: '.gp-conta' },
  { legenda: '(Na demonstração muda-se de função; na Pick a sério a função vem da conta.)', clicar: '[data-funcao="op-inicio"]' },
  { ecra: 'op-inicio', legenda: 'A Joana, da Arrumação, entra e a Pick entrega-lhe a próxima tarefa: a contagem que tem a meio.', clicar: '[data-ir="inv-ler"]' },
  { legenda: 'Está na posição. Prime a tecla de leitura do PDA no artigo.', clicar: '.gi-faixa-ler' },
  { legenda: 'O artigo aparece. Conta às cegas e escreve a quantidade: 4.', clicar: '[data-tecla="4"]' },
  { legenda: 'Confirma. Só fica registado quando o servidor responde.', clicar: '[data-confirmar]', pausa: 400 },
  { legenda: 'Registado. A Pick fica logo pronta para o artigo seguinte, na mesma posição. Voltamos ao gestor.', clicar: '.gp-conta' },
  { legenda: '(De novo como a Ana, gestora.)', clicar: '[data-funcao="gestor-inicio"]' },
  { ecra: 'gestor-inicio', legenda: 'Um inventário foi submetido e está por validar. A Ana abre-o.', clicar: '.gp-item' },
  { legenda: 'Só o gestor vê o stock do sistema: contado 2, sistema 5. Aceita a contagem.', clicar: '[data-ir="gestor-validar-decidido"]' },
  { legenda: 'Tudo decidido. Fecha o inventário.', clicar: '[data-ir="gestor-validar-fechado"]' },
  { legenda: 'Fechado. O ajuste de stock segue para o ERP numa transação do servidor, com auditoria. A Pick nunca ajusta stock sozinha.' },
]);
