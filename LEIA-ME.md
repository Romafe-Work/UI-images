# Ecrãs Romafe

Todos os ecrãs da Romafe num só sítio, divididos em quatro apps (a Web são duas):

| Pasta | App | Tela de desenho (os ecrãs ajustam-se à janela) |
| --- | --- | --- |
| `src/apps/erp/` | ERP — Romafe, a plataforma de gestão | 1440×900 |
| `src/apps/goshop/` | WebShop — GoShop | 1440×900 |
| `src/apps/goparts/` | MarketPlace — GoParts | 1440×900 |
| `src/apps/mobile/` | Mobile — Pick, a app do armazém no PDA | 320×533 (o EDA61K) |

`index.html` é a porta de entrada: as três apps e uma caixa para procurar
qualquer ecrã pelo nome, pelo fluxo ou pelo que ele faz. Cada resultado tem
**Ver** (o ecrã sozinho, a funcionar como protótipo) e **Editar** (o editor).

## Correr

```sh
npm install
npm run ver         # http://localhost:5173 — a versão compilada, como no site; recompila sozinha
npm run dev         # o servidor de desenvolvimento (para mexer no código)
npm run verificar   # só o TypeScript
npm run medir       # todos os ecrãs cabem e ajustam-se à janela (ver «Ecrãs ajustáveis»)
npm run build       # verifica e gera dist/, que é o que vai para o site
```

Cada push para `main` compila e publica no GitHub Pages
(`.github/workflows/publicar.yml`). Se o TypeScript falhar, não publica.

## Ecrãs ajustáveis (12 out. 2026)

**Todas as versões de todos os ecrãs têm de caber na janela e ajustar-se a ela.**
A tela da tabela de cima (1440×900, 320×533) é o tamanho em que o ecrã se desenha;
não é um tamanho fixo. Na prática:

- **Largura:** nada sai da janela nem fica cortado, de 1024 px para cima (Web e ERP)
  e de 320 px para cima (Pick). Quando não cabe, dobra-se: as abas descem para
  outra linha, os painéis passam a dois por linha, a fotografia sai.
- **Altura:** o ecrã ocupa pelo menos a janela (`min-height: 100vh`) e, se o
  conteúdo for mais alto, **a página rola**. Nunca `height: 100vh` com
  `overflow: hidden`, que espreme o ecrã e põe os botões por cima dos campos.
- **Temas:** cada versão funciona em Claro e em Escuro, com as cores dos tokens.
  Uma versão desenhada escura redefine os tokens dentro de `[data-theme="dark"]`
  e não à força em todos os temas.
- **No CSS:** cada ficheiro de ecrã diz no cabeçalho onde se dobra
  (ver `src/apps/goparts/css/inicio-v2.css`).

Para medir, com o `npm run ver` a correr:

```sh
PLAYWRIGHT=/caminho/para/playwright/index.mjs npm run medir
```

Mede as quatro apps × ecrãs × versões em 1024×700, 1280×720, 1448×787, 1440×900 e
1920×1080 (a Pick em 320×533, 360×640 e 412×780) e lista o que sai da janela, o que
um contentor corta e o que fica por cima de outra coisa. Só se entrega com zero.

**Estado a 12 out. 2026:** o 10 · Início do GoParts (só a v2.2, desde 12 out.), o 11 · Catálogo e o 12 · Pedidos (só a v2, desde 12 out.) passam
a zero em todos os tamanhos. O ERP, os logins e a Pick também. O ERP faz-se por módulo e começa por Compras: **10 · Compras** é o primeiro ecrã (encomendas a fornecedor). Os estados de carregamento e de erro do ERP (20–26, 30–39, no módulo de Compras) e da Pick
(20–23, 30–36) nasceram ajustáveis e passam a zero. Ainda falham, quase
sempre por causa de `.portal { height: 100vh; overflow: hidden }` em `melhorias.css`:
Catálogo, Pedidos e Guias do GoParts, e os ecrãs de carregamento e de erro do GoParts e
do GoShop.

## Estados de um ecrã (12 out. 2026)

Os estados de um ecrã — a carregar, a pesquisar, sem resultados, erros, sem ligação, vazio —
não são ecrãs soltos: escolhem-se no próprio ecrã. No editor, no painel da esquerda, por baixo
das versões, há a secção **Estados**: «Normal» (o ecrã como está) e os estados dele (10.1,
10.2…). No modo «Ver» aparecem numa segunda barra, por baixo da das versões. Não entram no
seletor de ecrãs nem no mapa.

Um estado é um ecrã com `estadoDe: '<id do ecrã>'` (ver `src/apps/goparts/portal/estados.ts`,
que monta os estados do Início, do Catálogo e dos Pedidos a partir do HTML de cada um).

## Demonstração das animações (12 out. 2026)

Como o modo de apresentação do Figma. No editor, em baixo no painel da esquerda, escolhe-se a
**animação** e carrega-se em **Ver demonstração**: abre-se um separador novo com o ecrã que se
está a ver. Lá, cada ligação do ecrã leva ao seguinte com essa animação, e a barra de baixo:

- troca de animação sem sair;
- anda pelo fluxo para a frente e para trás (também com ← e →);
- **Reproduzir o fluxo** passa pelos ecrãs do fluxo sozinha, de 2,6 em 2,6 segundos;
- **Copiar o link** dá o endereço para mandar a quem quiser ver.

As 18 animações, por grupos (como no Figma):

- **Simples:** Instantâneo, Dissolver, Desfocar.
- **Deslizar:** Deslizar, Empurrar, Elástico, Deslizar para fora, Mover por cima, Pilha de cartas.
- **Escala:** Aproximar, Afastar.
- **3D:** Virar 3D (o card 14 do shadcnspace), Virar na vertical, Rodar em cubo, Abrir a porta.
- **Revelar:** Revelar em círculo (a partir do sítio onde se clicou), Limpar.
- **Inteligente:** Animação inteligente, como o «Smart Animate» do Figma — a barra de cima, as
  abas, o menu lateral e o separador ativo ficam ou deslizam para o sítio novo; só o conteúdo muda.

As que têm lado viram ao andar para trás. O endereço é
`<app>/#so=ecra&demo=1&anim=<animação>&ecra=<ecrã>&v=<versão>`. Usa a View Transitions do
navegador (`src/comum/demo.ts`, `src/comum/css/demo.css`); sem ela, ou com «reduzir movimento»,
a troca é instantânea.

## Componentes DevExpress (12 out. 2026)

Os componentes vão ser da **DevExpress**, com o mínimo possível (reunião de 6 out.). Ainda não
está decidido se o ERP é de secretária (WPF) ou web (Vue), por isso cada peça leva as duas
referências: **DevExtreme** (a biblioteca web da DevExpress, com componentes para Vue) e
**DevExpress WPF**. A Pick fica de fora: é Kotlin nativo e a DevExpress não tem componentes
para Android nativo.

No editor, ao escolher uma peça, o painel de propriedades mostra em cima o seu componente;
uma peça sem regra mostra o do contentor («faz parte de»). As regras estão em
`src/comum/devexpress.ts` — uma peça nova que seja um componente entra lá. «—» quer dizer que
não há componente e fica em CSS nosso. «A confirmar» é nome que ainda falta ver na documentação.

| Peça | Web · DevExtreme (Vue) | Secretária · WPF | Nota |
| --- | --- | --- | --- |
| Tabela | `DxDataGrid` | `GridControl` | Ordenar, filtrar, paginar e «carregar mais» vêm do próprio componente. |
| Carregar mais | `DxDataGrid (scrolling: infinite)` | `GridControl (InfiniteSource)` |  |
| Paginação | `DxDataGrid (pager)` | `DataPager` |  |
| Palavra-passe | `DxTextBox (mode: password)` | `PasswordBoxEdit` |  |
| Procura | `DxAutocomplete` | `SearchControl` | Com sugestões enquanto se escreve. |
| Caixa de escolha | `DxCheckBox` | `CheckEdit` |  |
| Escolha única | `DxRadioGroup` | `ListBoxEdit (RadioListBoxEditStyleSettings)` |  |
| Lista de escolha | `DxSelectBox` | `ComboBoxEdit` |  |
| Número | `DxNumberBox` | `SpinEdit` |  |
| Data | `DxDateBox` | `DateEdit` |  |
| Campo de texto | `DxTextBox` | `TextEdit` |  |
| Mensagem do campo | `DxValidator` | `Validação do editor (ValidationErrorTemplate)` |  |
| Resumo dos erros | `DxValidationSummary` | `— (lista nossa ligada aos erros dos editores)` |  |
| Formulário | `DxForm` | `DataLayoutControl` |  |
| Menu da conta | `DxDropDownButton` | `DropDownButton` |  |
| Botão | `DxButton` | `SimpleButton` | Sempre com ícone e texto. |
| Botão de ícone | `DxButton (só ícone, com hint)` | `SimpleButton (só ícone, com ToolTip)` |  |
| Abas | `DxTabs` | `DXTabControl` |  |
| Menu lateral | `DxDrawer com DxTreeView` | `AccordionControl` |  |
| Carrossel | `DxGallery` | `FlipView (a confirmar)` | O 3D é CSS nosso, por cima do componente. |
| Barra de progresso | `DxProgressBar` | `ProgressBarEdit` |  |
| Girador | `DxLoadIndicator` | `WaitIndicator` |  |
| Esqueleto | `— (CSS nosso)` | `— (CSS nosso)` | Nenhuma das duas tem esqueletos. |
| Diálogo | `DxPopup` | `ThemedWindow (DXDialogWindow)` |  |
| Aviso pequeno | `DxToast (notify)` | `NotificationService` |  |
| Faixa de aviso | `— (CSS nosso)` | `— (CSS nosso)` |  |
| Contador | `— (badge do DxButton não existe: CSS nosso)` | `— (CSS nosso)` |  |

## Entrar no ERP, v10: a rede da empresa (19 out. 2026)

Do briefing dela («ROMAFE ERP — Ultimate cinematic login»). É uma versão nova dos quatro ecrãs de entrar
do ERP (v10; na ajuda, v8). As outras versões ficam como estavam.

- **Ao fundo:** uma rede 3D (Three.js, `src/apps/erp/comportamento/rede-cena.ts`) com peças da Romafe
  desenhadas a traço (`rede-pecas.ts`), ligadas por linhas finas: rolamento de esferas, de rolos cónicos,
  axial, chumaceira, correia com polias, carreto, retentor e corrente; ao centro, um rolamento maior. As
  esferas, os rolos e as polias rodam. Era com sólidos geométricos, até ela dizer «não quero cubos, quero
  mais rolamentos… coisa da Romafe» (19 out.). É um só canvas para os quatro ecrãs, como no GoParts.
  Fases: neutro, foco, valido (a única ligação laranja), pedido, passe e alinhar. Paralaxe só com o rato.
- **Ao centro:** um cartão liso de 420 px. O correio e a palavra-passe ocupam a mesma célula, por isso a
  altura do cartão não muda: a troca é feita com opacidade e uma deslocação pequena.
- **Entrar:** a rede alinha-se, o cartão sai, a moldura do ERP desenha-se no sítio e abre o 10 · Compras.
  No protótipo qualquer palavra-passe entra, exceto «errada». Um endereço `@grupo-exemplo.pt` vai para o 03.
- **Estados:** 01.1–01.4 e 02.1–02.7 (`src/apps/erp/entrar-rede.ts`). Só existem na v10.
- **Cores:** os tokens `--rede-*` do briefing, em claro e escuro. A ação é azul (#0873BC), como o briefing
  pede para o ERP. O ROMAFE fica em RGB(0, 99, 170).
- Com «reduzir movimento» ou sem WebGL, a rede é um desenho parado em SVG.

## 00 · Abertura do GoParts em 3D (14 out. 2026)

Uma versão por ecrã (ela, 14 out.: «só quero uma versão por screen» e «vamos a um screen de cada vez»).
A abertura é uma cena 3D em **Three.js** (sem React: o projeto não o usa), carregada à parte só quando
a abertura aparece (`src/apps/goparts/comportamento/abertura-cena.ts`; o resto em `abertura.ts`,
`comportamento/abertura.ts` e `css/abertura.css`). Em ~7 s: uma esfera sozinha → o rolamento (um
SKF 6206 à escala) monta-se → vista explodida com as cotas a laranja → monta-se outra vez e desfaz-se
em partículas → as partículas formam o ROMAFE (tirado da letra Motor) e dão lugar ao logótipo
verdadeiro, com o GoParts e a linha laranja → passa ao 01 · Entrar, com a marca a voar para o lado do formulário
(a página pública foi apagada a 14 out., a pedido dela).

- Arrasta-se o rolamento e a cena segue o rato; «Saltar» ou Esc vão já.
- Passa inteira uma vez por sessão; depois mostra o logótipo, com «Ver outra vez».
- Com «reduzir movimento», sem WebGL ou num aparelho fraco: só o logótipo.
- Para rever um instante: `#so=ecra&ecra=abertura&pausa=3.4` congela a sequência aos 3,4 s.
- Sem percentagem de carregamento (não havia o que medir de verdade).

## Os quatro ecrãs de entrar do GoParts em 3D (14 out. 2026)

Do briefing dela («Engineering your access»): 01 Entrar, 02 A palavra-passe, 03 O início de sessão da
empresa e 04 Precisa de ajuda? são uma só viagem à volta do mesmo rolamento 3D, que **nunca recomeça**:
há um só canvas e uma só cena (`comportamento/entrar-cena.ts`), e o controlador
(`comportamento/entrar-3d.ts`) muda o canvas para o palco do ecrã à vista (mudar um canvas de sítio
não perde o contexto WebGL) e dá à cena a fase nova; os valores seguem os alvos com uma mola.

- 01 o anel exterior entra e roda, as esferas giram à volta; com o campo em foco abranda; «Continuar»
  trava o anel e a câmara avança.
- 02 o anel interior entra pelo eixo e roda até alinhar; as esferas assentam. «Entrar» completa o
  rolamento, acende a marca laranja e a câmara atravessa o centro até ao Início. 02.1 é a palavra-passe
  errada: o aviso no campo e o anel interior a resistir (sem abanar o ecrã).
- 03 vista explodida com as cotas e a câmara rodada ~20°; ao continuar, as peças juntam-se.
- 04 as peças suspensas; a opção em foco (ou debaixo do rato) traz a sua peça à frente.
- **15 out. 2026, do género de uma imagem dela:** a página toda, partida ao meio por uma linha fina, sem
  cartão. À esquerda o título grande em maiúsculas («A peça certa. À primeira. Sem voltas.»), a frase, um
  traço e as três vantagens com ícones laranja; por trás, ondas finas e pontos laranja; o rolamento em baixo,
  à direita do texto (a caixa dele é a do canvas, e as cotas do 03 ficam nela). À direita o ROMAFE com o
  risco laranja e o GoParts, o «Bem-vindo», os campos sublinhados com o asterisco laranja, a ligação laranja
  à direita e o botão laranja. Fica o fluxo de sempre (primeiro o correio). Escuro em grafite (`--g-*`).
  Medido com `npm run medir`: zero problemas nos quatro ecrãs.
- Sem servidor neste protótipo: «Entrar» leva ao Início como no resto; não se finge outra coisa.

## 10 · Início do GoParts: o espaço de trabalho com blocos (16 out. 2026)

Do briefing dela («Ultimate Home Dashboard Redesign»), na mesma versão do Início (uma só por ecrã). A pesquisa dos
três cartões fica como ela a acertou; as zonas de baixo passam a blocos. Desenho em `portal/inicio-espaco.ts`,
comportamento em `comportamento/inicio-espaco.ts`, CSS em `css/inicio-espaco.css`. O briefing pede React/Framer; o
projeto é TS + CSS + WAAPI. Testes: `npm run testar:inicio` (11 casos).

- **Saudação**: «Bom dia / Boa tarde / Boa noite, Fernando», a data, a conta, o armazém de saída e o que está pendente
  (tirado dos documentos: encomendas em preparação e em transporte, fatura vencida, lista por acabar), cada um leva
  ao seu sítio. «Personalizar Início» à direita.
- **Veículo identificado**: no cartão Identificar, a matrícula (ou o VIN) identifica-se ali mesmo; o veículo aparece
  por baixo, a silhueta desenha-se e os dados entram um a um; «Ver peças compatíveis» abre o Catálogo no modelo. A
  nota diz que a compatibilidade é a do catálogo. Matrícula desconhecida: diz-se e propõe-se o VIN ou Selecionar.
  Só com descrição ou motor, segue para o Catálogo como antes. Uma referência exata abre a ficha no Catálogo.
- **Blocos** (ligam-se, desligam-se e reordenam-se): Atalhos (até 6, escolhidos), As minhas encomendas (contadores
  que filtram, com a marca que desliza; cada encomenda abre o percurso só com os passos dela; «Ver detalhes» e
  «Repetir encomenda»), Continuar onde fiquei (a marca segue o rato e o foco), A minha garagem (favorito, mudar o
  nome, tirar com «Desfazer», adicionar pela matrícula; no telemóvel em carrossel), Categorias (os ícones animados
  de sempre e a seta que aparece), Peças que compras frequentemente (contadas nos pedidos e nas listas; favoritas;
  «Adicionar» vai ao carrinho do portal), Disponibilidade por armazém (Porto e Sacavém, a contar e a deslizar).
- **Repetir encomenda**: cada artigo procura-se no catálogo de hoje; entram os que lá estão, com o preço e a saída
  atuais; os outros ficam de fora e diz-se porquê. Nada vai para o carrinho sem confirmação.
- **Personalizar Início** (gaveta): blocos com interruptor e pega (arrastar: a peça levanta, o lugar fica marcado, as
  outras afastam-se, o Início atrás reorganiza-se, assenta com mola; ou ↑ ↓ na pega), densidade, pesquisa ao abrir,
  atalhos e repor. Guardado por pessoa e conta (`goparts:inicio:ff-porto:v1`).
- **Movimento**: a entrada em sequência uma vez por sessão; os blocos de baixo quando entram no ecrã
  (IntersectionObserver), uma vez. Tudo o que muda de sítio desliza com FLIP (só transform). «Reduzir movimento»
  desliga tudo.
- **Estados novos** 10.18–10.29: veículo identificado, matrícula não encontrada, percurso aberto, repetir, artigos
  no carrinho, personalizar, a arrastar, compacta, a atualizar em segundo plano, falha parcial, sem acesso aos
  preços, referência sem stock. O 10.7 passou a ser das encomendas; o 10.8 mostra os blocos vazios.
- **O grafite** passou aos valores do briefing (`noite.css`): superfície #191B1E, elevada #23262A, borda #34383D,
  texto #F5F5F5 e #A7ACB4 — para o portal todo.

O que falta do servidor (nada disto é inventado no ecrã; aqui vem dos dados de exemplo ou do navegador):
- identificação do veículo por matrícula e por VIN (aqui só 4 matrículas e 1 VIN respondem);
- garagem, atividade recente, peças favoritas e preferências do Início por utilizador e conta (aqui em localStorage);
- estado das encomendas e o percurso (aqui do `pedidos-dados.ts`), e a pesquisa de artigos ao repetir;
- stock por armazém em tempo real e a **hora limite** para sair hoje (o ecrã diz que ainda não vem);
- permissão «Ver preços» por utilizador; fotografias dos modelos (aqui a silhueta, dita como ilustrativa).

## 10 · Início do GoParts, v3: o espaço de trabalho de todos os dias (14 out. 2026)

Do briefing dela: o Início é uma ferramenta usada muitas vezes por dia — impressiona pela rapidez, não por
efeitos. Uma versão só (`portal/inicio-v3.ts`, `css/inicio-v3-trabalho.css`, `comportamento/inicio-v3.ts`).

- Os três modos em separadores (Identificar, Selecionar, Referência) com a risca laranja que desliza; as
  setas aos lados do cartão; o Início ocupa a largura toda; os cartões têm as cores da v2.2 (azul, azul, laranja), ocupam a largura toda e mostram
  todos os campos (ela: «tudo o que der para escrever deve aparecer no card»); como na v2.2 (ela, com uma
  imagem: «assim»): faixa colorida com o ícone, o título e o desenho de linhas; os campos um por linha com o
  seu ícone; «Limpar» / «Pesquisa avançada» e a ação a laranja; os outros dois inclinados dos lados; as setas
  são pílulas com o nome do modo vizinho; 280 ms;
  setas, ← → Home End nos separadores, arrastar no tátil; só o ativo recebe o foco (`inert`); o que se
  escreveu fica; abre no último modo usado (localStorage).
- Sugestões ao escrever (referências e marcas) com a carregar, sem resultados e recentes; ↑ ↓ Enter Esc.
- Ctrl+K / ⌘K (ou a caixa de procura do topo): a pesquisa global, modal (o resto fica inerte).
- Por baixo: categorias (sobem 2 px), pesquisas recentes com «Repetir», últimos pedidos (a seta anda 3 px)
  e veículos guardados. Os dados são os de exemplo do protótipo.
- **Os 17 estados** (10.1–10.17, do briefing dela, 14 out.) numa só linguagem mecânica: o rolamento desenhado
  (`src/comum/rolamento-svg.ts` + `css/rolamento-svg.css`) muda de comportamento conforme o estado — monta-se a
  carregar (10.1, 10.10), roda por dentro a pesquisar (10.3, 10.12), abranda até parar sem ligação (10.6),
  encrava a meio no erro do servidor (10.14), falta-lhe uma esfera no 404 (10.13), desmonta-se devagar na
  manutenção (10.17). E ainda: sugestões agrupadas com a risca laranja (10.2), o disco inspecionado uma vez
  (10.4), erros com o ícone que se desenha (10.5) e o resumo que leva a cada campo (10.16), os pedidos que não
  carregaram só na sua zona (10.7), a visita guiada da primeira vez (10.8), a pesquisa global que cresce de
  0,98 (10.9), o esqueleto com pulsar lento (10.11) e a sessão expirada num diálogo calmo (10.15). Os 10.11–10.17
  do GoParts passam a usar o desenho do Início v3 (`NOVOS` em `app.ts`); o GoShop mantém a moldura comum.
  Tokens de movimento em `.portal--ini3` (`--m-hover` 150 ms … `--m-revelar` 700 ms).
- Os cartões ajustam-se ao ecrã (ela: «tenho de reduzir o zoom para ver o resultado»): a largura segue a janela, a
  altura dos campos e da faixa segue a altura (vh); até 900 px de altura os campos ficam 2 × 2; até 760 px a faixa
  perde o subtítulo e o desenho.

## 11 · Catálogo do GoParts, v3: o ciclo completo (14 out. 2026)

Do briefing dela («todo o ciclo do catálogo»). Uma só versão: o percurso da antiga v5 (Marcas → Modelos →
Veículos → **Grupo montagem** → Referências → Detalhes, e o Universal) com o desenho do Início v3 por cima
(`css/catalogo-v6.css`, `comportamento/catalogo-v6.ts`; a v2–v5 saíram da lista, o código fica porque a v5 é
montada por cima dele).

**Auditoria (o que havia, verificado no protótipo):** as Marcas com identificação, favoritas e procura; os
Modelos e os Veículos com filtros e ordenação; as Referências com fabricantes, agrupar, comparar e pedir;
os Detalhes com separadores; o Universal em árvore, lista e colunas. Faltavam: o passo Grupo montagem (estava
desligado), o contexto do veículo entre passos (cada passo tinha o seu cabeçalho), transições partilhadas,
o carrinho (o «Pedir» só mudava o texto), validação a sério da identificação, e os estados de sucesso,
pendente e falha parcial. Havia gradientes e brilho nos cartões azuis e cabeçalhos de tabela azuis.

**O que mudou:** liso (sem gradientes nem brilho); uma barra de **contexto do veículo** (logótipo › marca ›
modelo › veículo › referência), cada parte leva ao seu passo; **transições partilhadas** (View Transitions):
o logótipo da marca voa do cartão para a barra, a referência voa da linha para o título dos Detalhes, só o
conteúdo desliza (para a frente ou para trás); a **risca laranja** desliza nas abas e nos passos; o **Grupo
montagem** do veículo (a árvore do Universal, que leva às Referências do veículo); **identificar** valida a
matrícula e o chassis (resumo dos erros, foco no primeiro) e o veículo encaixa na barra; o **carrinho** fica
pendente (rolamento no botão) e só depois da confirmação a peça voa para o carrinho e o número sobe; a
estrela salta ao acender; a árvore com a seta que roda e a linha da hierarquia que se desenha.

**As Marcas, vivas** (o briefing da galeria, 14 out.; o mesmo desenho, só o movimento): o cartão sobe 3 px, a
borda fica azul, a linha laranja desenha-se no fundo e o logótipo cresce a 1,08; inclina até 3° para o lado do
rato (o logótipo com um fator maior; só com rato fino); ao escolher, o cartão fica laranja e os outros vão a 40 %
e afastam-se, e o logótipo voa para o cabeçalho dos Modelos; a grelha entra em cascata (só a primeira vez); a
estrela acende (1,25 e 12°) ou apaga (encolhe); Favoritas / Todas com o fundo a deslizar; a contagem passa do
número antigo ao novo; a procura vazia com «Limpar pesquisa» e Esc para limpar.

**Os Modelos em cartões** (o briefing da montra, 14 out.): cada modelo num cartão — o nome e o código, o período,
a imagem do carro (60 %, proporção fixa) e o tipo com a seta; 4 por linha (3 / 2 / 1 conforme a largura). Hover:
o carro cresce a 1,06 e anda 8 px, borda azul, linha laranja, sobe 3 px; ao escolher, os outros recuam e o carro e o
nome voam para a barra do contexto dos Veículos (e voltam). Ao rolar, os carros mexem-se até 6 px. **As imagens são
silhuetas por categoria** (`portal/carros.ts`): o briefing pede fotografias licenciadas da geração exata e, sem
elas, silhuetas; quando houver fotografias, põem-se em `FOTOS` (com carregamento preguiçoso e a silhueta se falhar).

**O Grupo de montagem — um só explorador** (o briefing dela, 14 out.: «uma só forma de navegar»): saíram «Árvore /
Lista / Colunas». À esquerda a árvore (o ramo aberto com a risca laranja, a seta que roda, a linha que desce, os grupos
em cascata, a contagem de grupos por categoria); a procura mantém os pais, abre os caminhos, aceita o nome da
categoria e destaca o que corresponde; ↑ ↓ → ← no teclado. À direita, o nome do grupo voa da linha para o cabeçalho,
os fabricantes como escolha (com a contagem), as primeiras referências e «Ver referências». No telemóvel, um painel
de cada vez, com «Grupos» para voltar. Serve ao Grupo montagem do veículo e ao Universal. Estado 11.24 (a carregar).

**Matriz de estados** (barra «Estados» do ecrã; os de carregamento usam o rolamento):

| Estado | Gatilho | O que se vê | Recuperação |
| --- | --- | --- | --- |
| 11.1 A carregar | abrir | esqueleto da identificação e das marcas | — |
| 11.2 A identificar | Pesquisar | rolamento no botão, linha laranja | — |
| 11.3 Matrícula não encontrada | resposta vazia | porquê pode ser | chassis, ou marca e modelo |
| 11.4 Erros no formulário | formato errado | cada campo diz como deve ser | o que se escreveu fica |
| 11.5 A carregar modelos | escolher a marca | esqueleto da lista | — |
| 11.6 Marca não encontrada | procura sem resultado | sugestão de escrita | outro caminho |
| 11.7 Sem favoritas | primeira vez | explica a estrela | «Todas» |
| 11.8 Marcas não carregaram | falha | o que continua a funcionar | tentar de novo, apoio |
| 11.9–11.13 | navegação | Modelos, Veículos, Referências, Universal, Detalhes | — |
| 11.14 Nenhum veículo | filtros | diz que filtro tirar | limpar filtros |
| 11.15 Grupo sem referências | grupo vazio | a Romafe procura ao fabricante | outro grupo |
| 11.16 Veículo identificado | sucesso | o veículo na barra, Veículos filtrados | — |
| 11.17 A adicionar | Pedir | rolamento no botão | — |
| 11.18 Carrinho não aceitou | falha | «Não adicionado» e faixa | tentar de novo (a quantidade fica) |
| 11.19 Preços indisponíveis | serviço de preços | «—» nos preços, «Pedir» desligado | tentar de novo |
| 11.20 Sem ligação | offline | rolamento a parar, resultados de há pouco esbatidos | tentar de novo |
| 11.21–11.23 | pesquisa, sem resultados, encomenda | (da moldura comum) | — |

Sem servidor: as confirmações (identificar, carrinho) chegam ao fim de 0,7–0,9 s neste protótipo. O
carregamento em todos os estados do GoParts passou a ser o rolamento (`GIRADOR` em `portal/estados.ts`).

## 15 · Minha lista: o espaço de orçamento (16 out. 2026)

Substitui a versão de 14 out. (uma só versão por ecrã), a partir do briefing dela («Premium My List & Quotation
Builder») e do esquema que ela escolheu. `portal/lista.ts` (o desenho e as contas), `css/lista.css`,
`comportamento/lista.ts`. Em TS, CSS e WAAPI, sem React nem Framer Motion (como o resto do projeto).

- Cabeçalho compacto: MINHA LISTA, o nome editável, o estado (Nova · Rascunho · Guardada · Enviada, sempre com o
  nome e não só a cor), a gravação ao lado (Por guardar · A guardar… · Guardada agora · Não foi guardada), a data e
  o n.º. À direita «Guardar lista» (laranja, com um ponto quando há alterações; Ctrl+S) e «Mais ações»: Nova lista,
  Duplicar, Pôr no carrinho, Limpar (com Desfazer) e Eliminar (diálogo que diz o que sai e que não se desfaz).
- «Minhas listas → Editar lista» no mesmo ecrã, no lugar de Criar / Pesquisar: procurar (nome, n.º, referência),
  filtrar pelo estado, datas, artigos e total; abrir repõe o que foi guardado; duplicar abre a cópia.
- Duas colunas (~70/30): Peças, Mão-de-obra, Outros custos e Notas; o Resumo preso à direita. Entre 901 e 1180 px
  o resumo sobe para cima das secções; até 900 px as linhas são cartões e fica a barra em baixo com o total e
  «Ver resumo» (o resumo abre por cima).
- Peças: imagem (desenho do tipo, pecas-img.ts), marca, referência, descrição, disponibilidade (só quando o catálogo
  a dá), líquido Romafe, Qtd. (− +), PVP, Desc. %, total. Sem preço: «Preço indisponível» e o total «— €»,
  nunca 0,00 €; o resumo diz «Total parcial» e qual a peça.
- «Adicionar peças» (Alt+A): a gaveta com a procura (referência, marca, descrição), as mais usadas nas listas
  guardadas, a disponibilidade e a quantidade; ↑ ↓ Enter Esc. A linha entra no sítio (as outras descem por FLIP),
  fica acesa um instante e o aviso traz «Desfazer»; a mesma referência soma-se à linha. O Catálogo («Adicionar à
  minha lista») deixa a referência em sessionStorage e ela entra quando a lista se abre.
- Mão-de-obra: por hora ou a preço fixo; o editor na secção (sugestões só preenchem a descrição). Vazio compacto.
- Validação à vista: quantidade de peça inteira ≥ 1, horas > 0, preço ≥ 0 com cêntimos, desconto 0–100 %. O valor
  escrito fica; a linha sai das contas até se corrigir; «Guardar lista» e «Enviar» esperam.
- Contas (contas()): linha = Qtd. × PVP × (1 − Desc.), ao cêntimo; base = peças + mão-de-obra + outros − descontos;
  IVA 23 % (a única taxa nos dados) sobre a base; total com IVA. As regras verdadeiras são as do GoParts.
- Pré-visualizar: o orçamento como sai, por cima da edição (rascunho, «não é um orçamento emitido»); Imprimir.
- Guardar e enviar com o rolamento até o servidor (aqui simulado) confirmar; enviada fica só de leitura.
- Estados 15.1–15.30 na barra «Estados» (os 24 do briefing e os de leitura, sem permissão, pré-visualização,
  Minhas listas e o editor do serviço). Com um diálogo ou a gaveta abertos, a barra, as abas e a lista ficam inertes.
- O verificador (`npm run medir`) não conta como sobreposição o que está dentro de `[data-por-cima]` (os avisos
  flutuantes com «Desfazer»), tal como já não contava as listas de sugestões.

Precisa do servidor (o protótipo simula): guardar, enviar, eliminar e abrir listas; pôr no carrinho; o preço e o
stock de cada referência; o histórico das «mais usadas».

## A barra de topo do GoParts a funcionar (16 out. 2026)

Do briefing dela («Implementação completa da Navbar»). O desenho da barra é o mesmo (`portal/base.ts`); cada controlo
tem agora um papel em `comportamento/barra.ts` (CSS em `css/barra.css`). Uma camada de cada vez, por cima do ecrã;
Esc fecha, clicar fora fecha, o foco volta ao botão; nas camadas modais (menu, pesquisa, carrinho) o Tab fica dentro
e a página não rola. Em TS, CSS e WAAPI (sem React nem Framer Motion), com «reduzir movimento» respeitado.

- **☰ Menu**: a gaveta das secções (250 ms; véu 180 ms; entradas em escada), a atual marcada, submenus Catálogo,
  Documentos e Minha lista; ☰ passa a ✕. No telemóvel é a navegação principal e traz Pesquisar, Mensagens,
  Definições e Ajuda (que saem da barra abaixo de 640 px).
- **ROMAFE** abre romafe.com noutra janela; **GoParts** vai ao Início.
- **Pesquisa (clique, Ctrl+K, ⌘K)**: a paleta global, em todos os ecrãs (substitui a do Início). Procura nas
  referências, categorias, marcas e modelos de veículos, pedidos, guias, faturas e listas guardadas; agrupa, marca o
  que coincide, ↑ ↓ Enter Esc, pesquisas recentes (no navegador), referência normalizada (VKBA6556 = VKBA 6556),
  tolerância a uma letra (duas em palavras longas) marcada «aproximado», resultados guardados por consulta. Abre o
  resultado no sítio certo (a referência nos Detalhes do Catálogo, o pedido no seu painel, a lista na Minha lista).
- **Mensagens**: os avisos tirados dos documentos (fatura vencida ou por pagar, guia expedida, pedido à espera de
  stock, nota de crédito), lidos/por ler, «Marcar como lida», «Marcar todas», «Ver todas». O ponto só aparece com
  avisos por ler. As mensagens da Romafe não têm serviço — o painel diz isso.
- **Carrinho**: um só estado (`comportamento/carrinho.ts`, no localStorage, sincronizado entre abas); o número
  conta unidades. Mini-carrinho com imagem, marca, referência, disponibilidade, quantidade, preço líquido e PVP,
  tirar com «Desfazer», total sem/com IVA. O «Pedir» do Catálogo e o «Pôr no carrinho» da Minha lista escrevem
  aqui. Mudanças otimistas; sem rede desfazem-se e o aviso diz porquê.
- **Definições** (o ícone redondo, que já se chamava assim): tema Claro · Escuro · Sistema e os atalhos.
- **Ajuda**: as perguntas do ecrã atual primeiro, a resposta no sítio e o apoio (+351 226 158 300).
- **Conta** (avatar, nome ou seta): o utilizador, a conta de cliente (só há uma: não há troca), Definições, Minhas
  listas, Ajuda e «Terminar sessão» (limpa o carrinho, os avisos lidos, as pesquisas e o que estava aberto, e
  volta ao Entrar).
- Testes: `npm run testar:barra` (16 casos, com o site em `npm run ver`).

**Falta o servidor** (o protótipo usa os dados de exemplo do portal):
pesquisa no catálogo verdadeiro (referências, equivalências, TecDoc) e nos documentos da conta, com permissões;
mensagens da Romafe (lista, lida/por ler, contagem); carrinho (ler, acrescentar, mudar quantidade, tirar,
encomendar) com preço e stock de cada referência; utilizador da sessão (nome, e-mail, contas de cliente a que tem
acesso, trocar de conta com limpeza do que é da conta); terminar sessão no servidor de identidade; páginas de ajuda.

## Os ícones do GoParts com movimento e cor (14 out. 2026)

Ela: «em todos os ícones, animações ou cores como pedi» (depois das categorias animadas). Os ajudantes `L()` guardam
o nome do ícone do Lucide em `data-i` (os `.html` já tinham `data-lucide`; as abas e o topo do portal têm o nome à
mão em `portal/base.ts`), e `css/icones.css` dá a cada ícone o seu gesto quando o rato passa (ou o foco entra) no
botão, ligação, aba, campo ou título: as setas andam, as engrenagens rodam, o telefone toca, o lixo e o cadeado
abanam, os documentos folheiam, a lupa procura, o olho pisca, o «Guardar» é premido, o «Enviar» voa… E as cores: a
estrela laranja, a luz e o raio amarelos, a bateria e as confirmações verdes, o óleo âmbar, o frio azul, o lixo
vermelho. Um ícone novo ganha animação pondo o nome dele num dos grupos do ficheiro. As categorias do Início têm
ícones próprios com peças (`portal/categorias-svg.ts`, `css/categorias.css`), e o «P» das matrículas a faixa
europeia (`css/placa.css`). Os filtros dos Modelos passaram a uma barra compacta com as carroçarias em silhueta.

## Como está feito

```
src/
  comum/          o que as três apps partilham
    tipos.ts      App, Ecra, e ligacoes(): o data-ir tipado
    pagina.ts     monta a página de uma app: ecrãs → protótipo → mapa → editor
    editor.ts     o editor (camadas, propriedades, tokens)
    fluxo.ts      o mapa de navegação
    ecras.ts      qual ecrã se vê, e o protótipo
    tema.ts       claro, escuro, auto
    css/          tokens.css (manual de UI da Romafe), base.css, editor.css
  apps/
    erp/
      ids.ts      a lista fechada dos ecrãs do ERP
      app.ts      nome, tela, fluxos e a ordem dos ecrãs
      bases/      as bases de onde nascem os ecrãs
      ecras/      um ficheiro por ecrã
      comportamento/  o que os ecrãs fazem (mostrar a palavra-passe…)
    web/  mobile/   ainda sem ecrãs
  hub/            a porta de entrada e a procura
```

## A base

O que se repete nos ecrãs de uma app está escrito **uma vez só**, numa função
em `bases/`. Cada ecrã chama-a e traz só o que muda:

```ts
export const palavraPasse: EcraErp = {
  id: 'palavra-passe',
  nome: '02 · A palavra-passe',
  fluxo: 'Entrar',
  objetivo: '…',
  html: entrada({
    discurso: `<section class="discurso">…</section>`,
    cartao: `<section class="cartao">… <a ${ir('entrada')}>mudar</a> …</section>`,
  }),
};
```

Mudar a base muda todos os ecrãs que nasceram dela. As ligações escrevem-se
com `ir('…')`, que só aceita ecrãs que existem em `ids.ts`: uma seta para um
ecrã que não existe não compila.

## Versões

Cada ecrã tem uma ou mais versões (v1, v2…), e os separadores escolhem qual
se vê: na barra de topo do ecrã, ao lado de Claro · Escuro · Auto, ou a
flutuar por cima quando o ecrã não tem barra de topo (Mobile). A mais antiga fica, para se comparar. O endereço guarda
a versão (`#ecra=entrada&v=v1`); sem ela, abre na mais nova.

No código, um ecrã tem `versoes: [{ id: 'v1', nota: '…', html }, …]`. No login,
`versoesCompletas()` dá as três do ERP, do GoShop e do GoParts:

- **v1** — o cartão à direita, com a apresentação da app à esquerda
- **v2** — o cartão ao centro, sozinho sobre a fotografia (sugestão da chefia)
- **v3** — o cartão ao centro, com o título por cima e as vantagens por baixo
- **v4** — a v3 sem nada da Romafe (`semRomafe`): sem o nome, sem o desenho do
  logótipo (letra Motor e risco laranja) e sem a fotografia do armazém. O produto
  pode ser vendido a outra empresa
- **v5** — a v4 com marca e fundo (`desenhado`): o monograma do produto (a inicial
  num quadrado) e um desenho abstrato, uma grelha fina e duas luzes, no lugar da fotografia

No Mobile, a **v2** e a **v3** fazem o mesmo que a v4 e a v5 das outras apps, com o nome «Mobile»
provisório (`src/apps/mobile/entrar.ts`).

Para uma v6, acrescenta-se uma entrada à lista com as opções que mudam.

## Acrescentar um ecrã

1. Acrescentar o id em `src/apps/<app>/ids.ts`.
2. Criar `src/apps/<app>/ecras/NN-nome.ts` a partir de uma base.
3. Pô-lo na lista de `app.ts`. Aparece no editor, no mapa e na procura.
4. Commit e push. O site atualiza-se sozinho.

As imagens vão normalizadas: WebP, 1440 px de largura no máximo.

As alterações feitas no editor ficam no navegador de quem as fez. Para
chegarem aos outros, copia-se o CSS (**Ver o CSS**) para o ficheiro e faz-se commit.

## O início de sessão é comum

Os três passos são os mesmos nas três apps, porque a identidade é uma só
(Keycloak). Estão em `src/comum/entrar/`, e cada app só diz a marca e a variante:

| Ecrã | Leva a |
| --- | --- |
| 01 · Entrar — o endereço; o domínio decide o caminho | 02 (conta nossa) ou 03 (cliente federado) |
| 02 · A palavra-passe — valida no Keycloak | — |
| 03 · O início de sessão da empresa — palavra-passe e segundo fator do cliente | — |

| | ERP, GoShop e GoParts (`completa`) | Mobile (`compacta`) |
| --- | --- | --- |
| Fotografia do armazém | sim | sim, com o véu por igual |
| Apresentação (título e três vantagens) | sim, própria de cada app | não |
| Barra de topo com tema e idioma | sim | não — a marca está no cartão |
| Alertas de licença e de lugar | sim | não |
| «Manter sessão iniciada» | sim | não — o aparelho é de todos |
| Apoio, versão e rodapé | sim | não |
| Campo, botão, «mudar», recuperar, página da empresa | sim | sim, maiores para o dedo |

Mudar `src/comum/entrar/entrar.ts` (o cartão) ou `discurso.ts` (o texto de
apresentação) muda o login em todo o lado. O que cada app tem de próprio — a
marca, a versão — está em `src/apps/<app>/entrar.ts`.

A Web são duas apps, **GoShop** e **GoParts**, cada uma com a sua página, editor e
mapa. Na porta de entrada aparecem lado a lado, com «Web» por cima.

## A família Romafe (v6 do login, 8 out. 2026)

A Romafe deu a letra do nome ROMAFE (`motorn.TTF`, passada a
`src/comum/fontes/motor.woff2`) e a cor, RGB(0, 99, 170) (`--c-logotipo`).
Pediu três logins diferentes que se vejam da mesma família, um por tipo de
aplicação (`familia` em `OpcoesEntrar`):

| Tipo | Apps | Palco | Cor do tipo |
| --- | --- | --- | --- |
| `interna` | ERP (v6), Pick (v4) | fotografia do armazém numa metade, cartão na outra | azul ROMAFE |
| `webshop` | GoShop | claro, de loja, com as famílias de peças e «Pedir conta» | laranja |
| `marketplace` | GoParts | escuro, de rede, com «Abrir loja» | azul ROMAFE |

Igual nos três: o ROMAFE em Motor na barra de topo, o cartão, o botão e o rodapé.

## O portal do GoParts (8 out. 2026)

Os quatro ecrãs depois de entrar — Início, Catálogo, Histórico de pedidos e Guias de remessa —
vieram do `Figma-WebShop-GoParts`. Cada um é um `.html` em `src/apps/goparts/portal/`; o topo, as
abas e o rodapé estão uma vez só em `portal/base.ts`. O CSS antigo está em `src/apps/goparts/css/`
e o que mudou em `melhorias.css`: ROMAFE em Motor no topo, botões com ícone e texto, sem scroll.

A letra do nome ROMAFE descarrega-se na porta de entrada (`public/fontes/motorn.ttf`).

### A ficha da peça (Detalhes do 11 · Catálogo v3, 14 out. 2026)
- Três regiões: a imagem à esquerda, a informação e os separadores ao centro, a compra à direita (presa ao rolar). Abaixo de 1280 px a compra desce; abaixo de 800 px fica tudo numa coluna. A imagem e a referência voam da linha da tabela para a ficha (View Transitions).
- **Escolher o armazém:** clica-se na linha (ou Enter/Espaço) ou no segmento da barra da distribuição do stock; os dois andam juntos e o painel de compra diz «Sai de Porto · Hoje, se pedir até às 16h». O «Pedir» de cada linha saiu da ficha (continua nas tabelas das referências).
- **Copiar:** o ícone passa a visto e diz «Copiado» durante 1,6 s; os números OE também têm o botão.
- **Quantidade:** o − fica desligado no 1.
- **Carrinho:** a imagem encolhe um instante e aparece a confirmação por baixo da compra. «Ver carrinho» está desligado porque o carrinho ainda não está desenhado.
- **Minha lista:** «A guardar…» com o rolamento, depois «Na minha lista» com a estrela cheia e a ligação «Abrir a lista» (vai ao 15 · Minha lista).
- A risca laranja desliza entre os separadores. Um MutationObserver volta a pôr tudo isto quando a ficha se refaz (por exemplo, ao abrir uma equivalência).
- **Limites:** não há fotografias reais das peças (fica «Fotografia indisponível»), por isso não há zoom nem 360°; não há modelos 3D verificados para uma vista explodida; as confirmações são simuladas, porque não há servidor.
- Código: `comportamento/catalogo-v6.ts` (`fichaV6`, `decorarFicha`) e `css/catalogo-v6.css`.

### O escuro grafite (15 out. 2026)
- A paleta «ROMAFE — Dark Industrial» que ela mandou substitui o azul-noite em todo o portal do GoParts (Início, Catálogo, Pedidos, Guias, Faturas e Minha lista), só no tema escuro. Os valores estão uma só vez em `css/noite.css` (`--g-*`); os tokens do portal (`--c-*`) e do Início (`--i3-*`) apontam para eles.
- O azul #0873BC fica para fundos, riscas e indicadores (`--azul-fundo`). Em texto sobre o grafite não chega ao contraste de 4,5:1, por isso as ligações usam o mesmo azul aclarado (#5AA9E6). O ROMAFE do logótipo não muda.
- No escuro, os painéis dos filtros deixam de ser azuis: passam a superfície grafite com uma risca azul fina em cima. Saíram os gradientes das cabeças dos cartões (Início, filtros, estados e a faixa do Entrar).

### Cartões ou Tabela, e as imagens dos Veículos (15 out. 2026)
- Marcas e Modelos têm «Cartões | Tabela». Na tabela, as colunas com ↑↓ ordenam-se (Marca e Modelos; Modelo, Fabricado desde e Fabricado até); outro clique inverte. São os mesmos elementos, por isso a procura, a estrela e os filtros valem nas duas formas. A escolha fica guardada no browser.
- Os Veículos têm uma coluna com a silhueta da carroçaria (não há fotografias licenciadas).
- Código: `comportamento/catalogo-vistas.ts`.

### A ficha da peça v4 e os seis separadores (15 out. 2026)
- Sem fotografia, a imagem é um lugar discreto (4:3, «Sem fotografia») em vez do cubo grande.
- **Separadores:** compactos, com a contagem pequena e a risca laranja a deslizar. O conteúdo anterior desvanece em 120 ms e o novo entra com 8 px em 220 ms. Navega-se com ← → Início Fim. A altura não se anima (regra dela).
- **OE:** diretório por fabricante, uma linha por número, com «Copiar» (passa a «Copiado»). A linha escolhida leva a risca azul. Não há «Pesquisar», porque o protótipo não tem a procura por número de origem.
- **Veículos aplicáveis:** agrupados por modelo, com a silhueta. O (i) abre os dados técnicos; Veículo, Ano, kW e cv ordenam-se. O do cliente tem fundo mais claro, a risca azul e «O seu veículo». «Ver peças deste veículo» leva ao Grupo montagem desse veículo.
- **Características:** grupos (Medidas, Construção e montagem, Informação), com a propriedade à esquerda e o valor à direita, e a unidade à parte. Só aparecem os dados que existem.
- **Documentos:** linhas compactas com o tipo e o tamanho. Não há ficheiros, por isso «Descarregar» diz «Ficheiro por ligar» em vez de fingir.
- **Telemóvel:** uma barra presa em baixo com o preço líquido e «Adicionar».
- **Estados 11.25–11.43:** a ficha a carregar; referência indisponível; sem stock; o stock a carregar; erro no stock; quantidade inválida; a adicionar, adicionada e não adicionada; sem equivalências, OE, veículos, características ou documentos; documento a preparar; erro no documento; sessão terminada; sem permissão; sem ligação.
- Código: `comportamento/ficha-peca.ts`, os estados em `portal/estados.ts` e o CSS no fim de `css/catalogo-v6.css`.

### 12 · Pedidos v4 (15 out. 2026)
- Do briefing dela («Histórico de Pedidos»). Ocupa a largura toda da janela (ela, 15 out.). Fica uma só versão: as v2 e v3 saíram da lista (o código continua no repositório). Ficheiros: `portal/pedidos-v4.ts` (o desenho, a partir dos dados de `pedidos-dados.ts`), `comportamento/pedidos-v4.ts` e `css/pedidos-v4.css`.
- **Filtros:** painel liso e baixo com as quatro caixas e «Limpar» e «Pesquisar» na mesma linha. O estado (Todos, Processado, Sem processamento) tem a risca laranja a deslizar. Os filtros aplicados aparecem em etiquetas com ×. No telemóvel recolhem-se atrás do botão «Filtros».
- **Pesquisar:** valida as datas no próprio campo (dd/mm/aaaa; a final não pode ser antes da inicial). As linhas de antes ficam esbatidas com «A atualizar…»; depois as que saem desvanecem e as que ficam deslizam. A contagem e o valor no período sobem ou descem até ao número novo.
- **Tabela:** Pedido, Data e Valor ordenam-se. Ao passar o rato aparece uma risca azul à esquerda e a seta anda 2 px. Os estados levam texto e ícone. No telemóvel, cada pedido é um cartão.
- **Abrir na linha:** resumo, percurso, artigos (pedida, servida, pendente), entrega ou recolha, documentos (guia e fatura, se existirem) e ações. As linhas de baixo deslizam; a altura não se anima. O percurso mostra só os passos que o pedido tem; o ícone (camião, embalagem ou visto) anda até ao passo onde o pedido está, uma vez.
- **Painel à direita:** «Abrir no painel» (ecrã inteiro no telemóvel). O número voa da linha para o título; o resto da página fica inerte; Esc fecha.
- **Estados 12.1–12.16:** a carregar; a atualizar; nenhum pedido com os filtros; erro nos filtros; sem ligação; erro do servidor; concluído; primeira vez; o pedido a abrir; em processamento; por recolher; expedido em parte; no painel; sessão terminada; sem permissão; documento indisponível.
- Os euros agrupam sempre os milhares com espaço (2 892,15 €); o pt-PT do browser não agrupa os números de 4 algarismos.

### Tema claro neutro, Tabela por omissão e a Lista dos Veículos (15 out. 2026)
- O fundo do portal claro passa de azul-claro a neutro (#f3f4f6). Os painéis de filtros deixam de ser azuis nos dois temas: superfície lisa com uma risca azul fina em cima (`css/noite.css`, só com tokens).
- Marcas e Modelos abrem em **Tabela** por omissão (ela: «default não é tabela, é cards!!!»).
- Veículos em «Lista» (ela: «não gosto desta lista»): um cartão por veículo, com a silhueta, a versão e os dados em colunas com o rótulo por cima. O escolhido leva a risca azul fina, sem fundo azul. Corrigido também «1 veículos encontrados».

### 12 · Pedidos v5 — a cronologia (15 out. 2026, tarde)
- Do segundo briefing dela («Order journey»). A cronologia passa a ser o ecrã de Pedidos (v5; a v4 sai da lista, como manda «uma versão por ecrã»). A tabela da v4 fica como alternativa no botão «Cronologia | Tabela», que se lembra da escolha.
- Os pedidos aparecem do mais recente para o mais antigo, agrupados por mês. O nome do mês fica preso em cima enquanto os seus pedidos passam.
- **Com o scroll:** a linha vertical desenha-se até à altura de leitura (55% da janela) e recua ao subir. Os marcadores acima dessa altura deixam de estar esbatidos e o pedido mais perto dela fica ativo, a laranja. Cada cartão entra uma vez, com 12 px na horizontal (IntersectionObserver), e não volta a animar.
- **Abrir um cartão:** o detalhe aparece no sítio e os cartões e meses de baixo deslizam (FLIP; a altura não se anima). O percurso mostra só os passos confirmados; os outros ficam «Ainda não» ou «—», nunca como feitos.
- **Filtros e pesquisa:** valem para as duas vistas. Os cartões que não passam saem, os meses vazios escondem-se e as contagens são as reais. O número do pedido procurado aparece marcado e, na pesquisa por referência, o cartão diz «Contém …» com a parte encontrada marcada.
- Não há paginação, porque só há 6 pedidos de exemplo; o fim diz «Não há pedidos mais antigos neste período».
- Estados: os 12.x passaram à cronologia (a carregar com o esqueleto em forma de linha, pedidos abertos no cartão); o 12.17 mostra a vista em tabela.

- **Estados novos (15 out., ela: «faz os vários estados dos ecrãs de pedidos e guias»):** 12.18 Primeira carga (com o rolamento), 12.19 Pedido selecionado, 12.20 Encontrado pela referência, 12.21 A repetir o pedido, 12.22 Artigos no carrinho, 12.23 Repetido em parte (um artigo sem stock). Os estados comuns que colidiam com os 12.9–12.11 passaram a 12.24–12.26.
- «Ver guia» abre as Guias com essa guia já aberta; nas Guias, «Abrir o pedido» abre os Pedidos com o pedido aberto (`sessionStorage`: `goparts:abrir-guia`, `goparts:abrir-pedido`).

- (15 out., ela: «quando clico numa guia de remessa do pedido abre um diálogo lateral») «Ver guia» abre a guia num painel à direita, sem sair dos Pedidos. O painel mostra o percurso Pedido → Guia → Fatura, os valores, a entrega e os artigos, com «Descarregar PDF» e «Abrir nas Guias de remessa». «Do mesmo pedido» troca a guia no painel. Esc fecha e o foco volta ao botão. O estado é o 12.24, e os estados comuns passaram a 12.25–12.27.
- (15 out., ela: «aqui também permite filtro», com a imagem dos estados por baixo das datas) A fila «Estado» tem pílulas com a cor e o ícone do marcador: Todos, Concluído, Expedido e Em preparação. Só aparecem os estados que os pedidos têm. Uma pílula escolhida junta-se aos outros filtros, com etiqueta e contagens. O componente é `pilulasEstado()`, comum às Guias.

- **(15 out., ela: «os diálogos que te pedi quando clico num pedido ou guias de remessa?»)** Clicar num pedido, no cartão ou na linha da tabela, abre-o no **painel lateral**; já não se abre na lista. O escolhido fica marcado a laranja (só ele) e a seta continua a apontar para o lado do painel. Esc fecha e o foco volta ao cartão. Os estados que mostravam o pedido aberto (12.7, 12.9–12.12, 12.16, 12.17, 12.21–12.23) passaram ao painel; com o painel aberto, o resto da página fica inerte.

### 13 · Guias de remessa v3 — como o Histórico de pedidos (15 out. 2026)
- Do briefing dela («ROMAFE Logistics Document Center»), da nota que juntou («a timeline cronológica com o percurso documental») e de «a guias faz tipo histórico também». Fica só a v3 (`portal/guias-v3.ts`, `comportamento/guias-v3.ts`, `css/guias-v3.css`), no molde dos Pedidos v5: as classes `ped4__*` dos filtros, da cronologia, da tabela e do painel; o que é só das guias tem `gui3__*`. Em TypeScript e CSS, sem React (o briefing pedia React, Tailwind e Motion).
- Os campos do GO REPAIR ficam todos: as datas (dd/mm/aaaa, validadas no próprio campo), o n.º da guia, a referência e o tipo **Todos / Fatura / Nota de crédito**, com o mesmo significado, num seletor com a risca laranja. No cabeçalho: documentos, faturas · notas de crédito e o total do período; os números contam só quando mudam.
- **Cronologia:** por ano e por mês, da mais recente para a mais antiga. O ícone do marcador diz o tipo (recibo ou devolução) e a cor é a do estado; por baixo da data, como nos Pedidos, o estado da entrega tirado do percurso do pedido: Entregue, Em entrega ou Devolução (sem pedido na conta, não diz nada). A fila «Estado» filtra por esses três (ela: «permite filtrar por»); as guias sem estado só aparecem em «Todos» e a linha desenha-se com o scroll. O mês da guia ativa aparece ao lado da contagem, e cada guia entra uma só vez.
- **Abrir uma guia (desde 15 out., no painel lateral, como os Pedidos):** clicar no cartão ou na linha abre a guia no painel à direita; o marcador e a borda do escolhido ficam laranja. No painel aparecem quatro blocos.
  - O **percurso documental** Pedido → Guia → Fatura ou Nota de crédito. Só aparecem as ligações que os dados têm; o fio desenha-se em 450 ms. «Do mesmo pedido» abre a outra guia, por exemplo a fatura e a devolução do P2024/001175. Os pedidos que já não estão no histórico (P2024/001087, P2024/001061) aparecem a tracejado, com a explicação.
  - O documento e a entrega.
  - Os **valores**: alinhados à direita, com a base tributável como subtotal e o total à parte. Os valores são os de `guias-dados.ts` (o «servidor»).
  - Os artigos e as ações: Ver documento, Descarregar PDF e Abrir o pedido.
- **Documento:** «Ver documento» passa ao documento no mesmo painel, com «Voltar à guia» (300 ms) com a página da guia, montada com os campos da própria guia, porque o protótipo não tem o PDF do servidor. A descarga espera e confirma.
- **Tabela** como alternativa (como nos Pedidos): as 13 colunas do GO REPAIR, ordenável, com a guia a abrir-se na linha. A tabela rola de lado e o detalhe fica preso à largura visível.
- A guia aberta fica guardada durante a visita. Os euros passaram a ter espaço também nos milhares de 4 algarismos (3 449,60 €), também nas Faturas.
- Estados 13.1–13.21: primeira carga, esqueleto, a pesquisar, sem documentos, nenhuma com estes filtros, datas inválidas, selecionada, aberta, nota de crédito, guia relacionada a abrir, pedido indisponível, documento a abrir, pré-visualização, documento indisponível (só no painel), a descarregar, descarga falhou, sem ligação, erro do servidor, sessão terminada, sem permissão, vista em tabela. O «Acesso negado» comum passou a 13.22.

### 14 · Faturas v2 — como os Pedidos e as Guias, com a discriminação do IVA (15 out. 2026)
- Do briefing dela («ROMAFE Financial Document Center») e da nota («manteria a ordem cronológica, tal como nos Pedidos e Guias […] daria maior destaque ao desdobramento dos impostos»). Fica só a v2 (`portal/faturas-v2.ts`, `comportamento/faturas-v2.ts`, `css/faturas-v2.css`), no molde dos Pedidos e das Guias. Sem React.
- **Cabeçalho:** documentos, faturado, notas de crédito e por pagar, com uma nota a dizer o que contam: valores com IVA; as notas de crédito ficam à parte, a negativo, e não descontam no faturado; «por pagar» são as faturas em aberto e vencidas.
- **Filtros:** as datas (dd/mm/aaaa, validadas), o n.º e o tipo Todas / Fatura / Nota de crédito, com a risca laranja; a fila «Pagamento» (Paga, Em aberto, Vencida, Creditada). Os filtros ficam guardados durante a visita.
- **Cronologia:** por ano e mês, com o estado do pagamento por baixo da data; o ícone diz o tipo (recibo ou devolução).
- **Clicar numa fatura abre o painel lateral**, como nos outros dois ecrãs. O briefing pedia abrir no cartão, mas ela tinha pedido o painel nos Pedidos e nas Guias. O painel mostra, por ordem:
  - **Valores:** os comerciais (bruto, desconto, embalagens, portes), a **Discriminação do IVA** por taxa e o total à parte. A discriminação abre e fecha em 250 ms; o que está por baixo desliza com FLIP e as linhas aparecem sem contar.
  - **Pagamento:** quando vence ou quando foi paga. A nota de crédito diz «Creditada» sem dizer se já foi devolvida.
  - **Documentos relacionados:** Pedido → Guia → Fatura, e «Do mesmo pedido».
  - **Entrega e artigos**, com Ver fatura (o documento no mesmo painel, com «Voltar à fatura»), Descarregar PDF e Ver guia de remessa.
- **IVA:** os dados têm uma só taxa (23 %). Mostra-se um grupo e diz-se que os outros dois grupos do documento estão vazios; não se inventam taxas.
- **Tabela** como alternativa, com todas as colunas do GO REPAIR (os três pares base/IVA) e o pagamento.
- **Entre ecrãs:** «Ver fatura» nas Guias e nos Pedidos abre a fatura no painel das Faturas; daqui, a guia e o pedido abrem no painel deles.
- **Estados 14.1–14.23:** primeira carga, esqueleto, a pesquisar, sem faturas, nenhuma com filtros, datas inválidas, selecionada, aberta, IVA recolhido, nota de crédito, vencida, documento a abrir, pré-visualização, PDF indisponível, a descarregar, descarga falhou, dados parciais, documento relacionado em falta, erro do servidor, sem ligação, sessão terminada, sem permissão e vista em tabela. «A gerar o PDF» (comum) passou a 14.24.

### 16 · Devoluções — o ecrã novo, como os Pedidos, as Guias e as Faturas (15 out. 2026)
- Do briefing dela («ROMAFE Returns Management Center») e da nota: «daria prioridade à criação de devoluções num fluxo guiado e à visualização cronológica […] os artigos a passarem da encomenda original para a lista de devolução». Até aqui, a aba «Devoluções» não levava a nada. Ficheiros: `portal/devolucoes.ts`, `portal/devolucoes-dados.ts`, `comportamento/devolucoes.ts`, `css/devolucoes.css`; estados 16.1–16.24 em `portal/estados.ts`.
- **Dados:** os campos são os da tabela do GO REPAIR: n.º, data de criação, data de envio, total de referências, total de unidades, observações e utilizador. Há quatro devoluções e cada uma sai de uma guia com fatura. As duas creditadas ligam às notas de crédito que já existiam (NC2024/00412 e NC2024/00377). Para bater com a fatura, a linha da NC2024/00377 passou a «Pastilhas TRW GDB1550» (antes dizia GDB1330).
- **Estado, só pelo que os dados dizem:** sem data de envio é «Por enviar»; com data de envio é «Enviada»; com nota de crédito ligada é «Creditada». Não há «em análise», «autorizada», «recebida» nem «cancelada», porque esses campos não existem. Também não há valores a creditar estimados: o único valor que aparece é o da nota de crédito, quando ela existe.
- **Ecrã:** cabeçalho com Devoluções, Por enviar, Enviadas e Creditadas, e «Criar devolução» a laranja. Filtros iguais aos da tabela antiga (datas, n.º, referência), com as pílulas «Estado». Cronologia por ano e mês: o estado aparece por baixo da data e o marcador tem a cor dele. A Tabela é a alternativa, com as colunas do GO REPAIR e o estado.
- **Painel da devolução:**
  - Os artigos devolvidos, como a lista de compras ao contrário: a quantidade é o que conta e o total de unidades fica separado do de referências.
  - O percurso, só com os passos confirmados (criada, enviada, nota de crédito emitida). O que ainda não aconteceu fica a tracejado e «Sem data». A linha enche até ao último passo confirmado e uma caixa laranja desce por ela uma vez.
  - Os documentos: Pedido → Guia → Devolução → Nota de crédito, só os que existem, e cada um abre no seu ecrã.
  - Os dados e as ações: «Enviar a devolução» nas que estão por enviar e «Ver a nota de crédito» nas creditadas.
- **Criar devolução**, num painel largo com três passos (a risca laranja desliza):
  - **Fatura:** só as que ainda têm artigos por devolver.
  - **Artigos:** «Devolver» faz a imagem do artigo voar da fatura para a lista da devolução, e as referências e unidades contam. A quantidade vai até ao que ainda se pode devolver; o que já foi devolvido aparece indisponível.
  - **Rever e enviar:** com as observações, que fazem de motivo (não há campo de motivo por artigo). Há «Guardar por enviar» e «Enviar a devolução».
  - Só depois da confirmação a devolução nova entra no topo da cronologia. Fechar o painel não perde nada.
- O subtítulo trata o cliente por «você», como o resto do portal (o briefing dizia «tu»). No Fluxo aparecem dois diálogos abertos: a devolução e criar devolução.
- **Medição (`scripts/medir-ecras.mjs`):** a verificação de sobreposições passa a contar só a parte visível de cada elemento, recortada pelas caixas que rolam ou cortam. O que rolou para baixo do pé fixo do painel estava escondido e era dado como sobreposto.

### 17 · Informações técnicas v2 — o espaço de engenharia (15 out. 2026)
- Do segundo briefing dela («Automotive Engineering Workspace») e da nota: «os três efeitos visuais que eu priorizaria: explorar o automóvel em 3D; vista explodida dos componentes (requer modelos adequados); diagramas técnicos interativos» e «não colocaria um automóvel 3D permanentemente no meio de todas as páginas […] quando o mecânico precisa de consultar um manual […] a interface deve dar o máximo de espaço à documentação». A v2 fica por cima da v1 (uma só versão por ecrã). Ficheiro novo: `comportamento/tecnica-3d.ts`; estados novos 17.26–17.28.
- **Três áreas:** a navegação (recolhe-se a ícones com «Recolher a navegação»), o conteúdo e o **contexto** à direita (fecha-se com «Recolher» e abre-se com «Contexto» na barra do veículo). O contexto muda com o que se faz: o veículo e o que há em cada grupo; o sistema escolhido, contado por secção, com as peças no Catálogo; os relacionados do documento aberto; a peça da vista explodida. **Ao abrir um documento**, a navegação recolhe-se e o contexto fecha-se, para o documento ficar com o espaço; a pessoa pode voltar a abri-los. A barra do veículo diz também a secção aberta.
- **O carro em 3D** (só na Visão geral, como porta de entrada): o Three.js carrega quando a Visão geral abre e desfaz-se ao sair dela; desenha só enquanto alguma coisa se mexe. O carro é **ilustrativo** e o ecrã diz isso: a silhueta da carroçaria do Catálogo extrudida, com os sistemas em blocos no sítio geral de cada um (a transmissão segue a tração). Não há bateria nem peças com posição própria. Arrastar roda, a roda do rato aproxima, «Repor» volta ao início, «Exterior / Técnica» mostra ou não o interior. Escolher um sistema (no carro ou na lista) leva a câmara até lá em 800 ms, pinta-o de azul ROMAFE, mostra o nome e lista os documentos; o sistema elétrico é o carro todo (as arestas acendem). Sem WebGL fica o desenho 2D da v1 (17.27).
- **Vista explodida:** o rolamento rígido de esferas 6206, a única geometria verificada no protótipo (a mesma da abertura: D 62, d 30, B 16 mm, 9 esferas de 9,525 mm). «Separar / Montar», e escolher uma peça (anel exterior, gaiola, esferas, anel interior) foca-a e mostra as medidas no contexto. O ecrã diz que não é uma peça escolhida deste veículo. Nos estados (sem 3D) é um desenho de frente, à escala (17.26).
- **Secções de imagens em galeria:** Esquemas elétricos, Fusíveis e relés, Diagramas de conforto e Posição de peças abrem com as folhas à vista (17.28). O visor tem por baixo as miniaturas das figuras do documento.
- **A escolha do veículo fica na tabela por modelo** (15 out.: experimentou-se em cronologia, e ela: «aqui não quero ordem cronológica»).
- **Documentos em cronologia** (ela: «referia-me à ordem cronológica aqui», nos Manuais de reparação): as listas de documentos de cada secção também ficam por ano e mês, do mais recente para o mais antigo, com o tipo no marcador; a Tabela é a alternativa (`goparts-tecnica-vista-docs`). Para isso, cada documento ganhou a data em que o fornecedor o atualizou (`atualizado`, mm/aaaa), **de exemplo**, como as datas dos pedidos e das faturas: é uma data de revisão, não um valor técnico; nunca antes de o veículo começar a ser fabricado, nem depois de abril de 2024. O leitor mostra-a nos dados do documento.
- **O que não foi feito, por falta de dados verdadeiros:** a linha do tempo da manutenção, as tabelas de lubrificantes e de dados de ajuste, os tempos de reparação, os códigos de avaria e os pontos clicáveis nos esquemas precisam dos valores do WorkshopData, e o protótipo não os inventa. As secções continuam com a lista dos documentos do fornecedor.

### Etiquetas dos cartões neutras em todos os históricos (15 out. 2026)
- Ela, outra vez: «a parte do histórico dos pedidos ainda está com cores diferentes». Os marcadores já eram iguais; o que destoava eram as etiquetas dentro dos cartões dos Pedidos (Processado a verde, Sem processamento a âmbar, Por recolher a azul). Agora, na cronologia dos Pedidos, das Guias, das Faturas e das Devoluções, a cor fica só no marcador e no estado por baixo da data. As etiquetas dos cartões ficam neutras, com o ícone e o texto (`css/pedidos-v4.css`, `.ped4__c-item .ped4__selo`). Na Tabela e nos painéis mantêm a cor, porque lá são a única marca do estado.

### 17 · Informações técnicas — o espaço de trabalho do veículo (15 out. 2026)
- Do briefing dela («Automotive Technical Intelligence Center») e da nota: «começaria por três mudanças: seleção do veículo mais clara, navegação técnica agrupada e visualização de documentação com zoom. Depois, acrescentaria o explorador visual do automóvel». Até aqui, a aba «Inf. técnica» não levava a nada. Ficheiros: `portal/tecnica.ts`, `portal/tecnica-dados.ts`, `portal/tecnica-estados.ts` (estados 17.1–17.25), `comportamento/tecnica.ts`, `css/tecnica.css`. A captura do ecrã antigo não veio com o briefing: a escolha segue as colunas que ele descreve.
- **Dados:** os veículos são os do Catálogo (`catalogo-dados.ts`): marca, modelo, motorização, código do motor, combustível, kW/cv, cm³, tração, carroçaria e fabricado desde/até. Não há nenhum dado de veículo a mais. As secções são as 15 abas do ecrã antigo, com o mesmo sentido; só «Conforto diagramas» passou a «Diagramas de conforto». Os documentos são de EXEMPLO e têm só o que o fornecedor diz de cada um (título, sistema, tipo, número de figuras). **Nenhum valor, binário, intervalo, passo de reparação, código de avaria ou esquema é escrito pela Romafe:** o leitor diz onde entra o conteúdo do WorkshopData, e a figura no visor é uma folha vazia com o quadro de legenda. Os Boletins e as Notas ficam vazios, porque um título de boletim já afirmaria uma avaria. Os veículos de 2024 em diante não têm dados (para o estado 17.17).
- **Escolher:** a pesquisa por marca, modelo ou código do motor (em todas as marcas) e as pílulas das marcas. A tabela tem as motorizações por modelo, só com as quatro colunas do ecrã antigo: Modelo, Código do motor, Fabricado desde, Fabricado até (ela, com a imagem do cabeçalho antigo: «tem isto tudo, faz»). O combustível e a potência ficam na barra do veículo e em «Veículo». Ao lado, em vez do branco do ecrã antigo, fica o que se vai poder consultar.
- **A barra do veículo, sempre à vista:** BMW → 1 (E81) → 118d → N47 D20 C (o código do motor a azul), com o combustível, a potência, a cilindrada e os anos; a pesquisa técnica (secções, sistemas e documentos, com as setas e Enter) e «Mudar de veículo». Ao escolher, a silhueta e o nome voam da linha para a barra (300 ms), as secções entram uma a uma e o explorador aparece.
- **Navegação agrupada:** Visão geral; Veículo; Manutenção (Manutenções, Lubrificantes, Dados de ajuste, Tempos de reparação); Reparação (Manuais de reparação, Boletins, Notas, Direção e pneus); Diagnóstico (Diagnósticos, Esquemas elétricos, Fusíveis e relés, Diagramas de conforto, Posição de peças); Recursos (WorkshopData). Cada secção mostra quantos documentos tem e a risca laranja desliza para a que está aberta (220 ms). Os grupos abrem e fecham sem animar a altura. No telemóvel, a navegação fica atrás de um botão «Secção · …».
- **Explorador do veículo:** a silhueta da carroçaria com zonas gerais (motor e arrefecimento à frente, transmissão conforme a tração, travões e suspensão nas rodas, direção na roda da frente, climatização no habitáculo; o sistema elétrico é o carro todo). Passar num sistema acende a zona; escolher deixa-a acesa e lista os documentos dele, com «Ver as peças no Catálogo». As zonas não dizem onde fica cada peça; a legenda manda para a «Posição de peças».
- **Documentos:** a lista da secção tem o filtro por sistema. O leitor mostra os documentos da secção (só em ecrãs largos; abaixo disso passam a «Anterior / Seguinte»), o documento com o sistema, o tipo, «Aplica-se a» e o fornecedor, e os relacionados do mesmo sistema noutras secções. Abrir mostra o esqueleto enquanto o fornecedor responde. A miniatura de uma figura cresce até ao visor (400 ms), que tem zoom (+/−, roda do rato e teclado), arrastar, «Ajustar», ecrã inteiro e figura anterior/seguinte; Esc fecha e a figura volta à miniatura. Nos Diagnósticos há o campo «Código de avaria», que valida o formato e abre o documento do fornecedor; o significado de cada código é do fornecedor. O WorkshopData abre numa janela nova, já com o veículo.
- Trata o cliente por «você» (o briefing dizia «tu»). No Fluxo aparece um diálogo aberto: a figura no visor (17.14).
- **Medição:** uma lista de sugestões aberta (`role="listbox"`) deixa de contar como sobreposta ao conteúdo que tapa, porque está por cima de propósito.

### O Fluxo com exemplos de diálogos abertos (15 out. 2026)
- Ela: «no fluxo quero que mostres exemplos de diálogos abertos». Os estados continuam fora do mapa, menos os que têm `noFluxo` (`src/comum/tipos.ts`). Esses entram logo a seguir ao seu ecrã, com uma etiqueta laranja («Diálogo aberto · …») e o cartão contornado a laranja. As setas que saem dos diálogos também se desenham.
- No GoParts (`app.ts`, `DIALOGOS`): o pedido no painel (12.7) e a guia do pedido (12.24); a guia (13.8) e o seu documento (13.13); o talão (14.8) e o documento da fatura (14.13); eliminar a lista (15.18); a devolução (16.8) e criar devolução (16.13); a figura no visor das Informações técnicas (17.14).
- No mapa, cada ecrã contém os seus elementos presos à janela (`contain: layout paint` em `editor.css`), para os painéis ficarem dentro do cartão.

### Imagens das peças e a lista de compras nos painéis (15 out. 2026)
- Ela primeiro pediu «preciso de mais imagens em todos os screens». Depois esclareceu: «as imagens refiro-me a imagens dos produtos aqui [nas linhas de artigos] e não [a fotografia no cabeçalho]». As fotografias dos cabeçalhos saíram (`capas.ts` apagado).
- **Imagem da peça** em cada linha de artigos: nos painéis dos Pedidos, das Guias e das Faturas (talão), e na Minha lista (`portal/pecas-img.ts`).
  - Não há fotografias dos produtos e o repositório é público, por isso não se usam as dos fabricantes nem se inventa a fotografia de um produto concreto. Cada linha leva a **imagem do tipo de peça**, desenhada como uma fotografia de loja: a cor, dois ou três tons lisos e um fundo claro (o mesmo nos dois temas).
  - Tipos: disco, pastilhas, filtro de óleo, de ar e de habitáculo, amortecedor, rolamento, correia, kit de distribuição, tensor, bomba de água, termóstato, lâmpada, escova, óleo, líquido de travões e de refrigeração, embraiagem, cilindro, vela, cabo, sensor, fusíveis, parafusos, abraçadeira e junta. O que não se reconhece fica com uma caixa de cartão.
  - Com o rato na linha, a peça aproxima-se 8 %. Quando houver fotografias por referência, entram em `FOTOS` e ganham ao desenho.
- **A lista de compras nos painéis** (ela: «coloca isto [os artigos] por cima disto [os valores] para fazer uma espécie de lista de compras» e, depois, «nas guias quero mais assim», com a imagem do talão): nas Guias, os artigos como no talão das Faturas (`listaCompras()` em `pecas-img.ts`, comum aos dois) e logo por baixo o «Resumo financeiro» como no talão (`reciboGuia()`: os valores revelam-se, o total destaca-se; nada conta), depois as ações, o percurso e a entrega. Nos Pedidos, os artigos (com o total) vêm primeiro. Nas Faturas já era assim (o talão).
- Fica a silhueta do carro ao lado do nome da lista (Minha lista).

### 14 · Faturas: o Resumo da Minha lista e o talão (15 out. 2026, tarde)
- **Resumo:** ela, com a imagem dos números, disse «aqui seria engraçado aparecer como aparece na lista de compras». Os números saíram do cabeçalho para um cartão **Resumo** à direita da lista, como o da Minha lista: Faturas e Notas de crédito, Pagas, Em aberto e Vencidas, cada uma com a quantidade ao lado; «Por pagar» grande em baixo; a nota num quadro. Os valores contam e acendem como na lista. Abaixo de 1180 px o cartão sobe para cima da lista.
- **O talão** (o briefing dela «Interactive Purchase Receipt»): clicar numa fatura abre-a no painel como um talão de compras.
  - O cabeçalho fica preso: tipo e data, número, total e pagamento. O número voa do cartão para o cabeçalho.
  - Os **artigos da compra** vêm primeiro e entram um a um (35 ms, no máximo 12). Cada um tem um ícone neutro (não há fotografias), a quantidade e o valor.
  - Segue-se o **resumo financeiro**: bruto, desconto, embalagens e portes; o IVA numa linha que abre a discriminação por taxa; um traço; o total em destaque. Revela-se ao chegar à vista e nunca conta a partir do zero.
  - Depois o pagamento, os documentos relacionados, a entrega (recolhida) e as ações: Ver PDF, Descarregar, Copiar referência e Abrir pedido.
  - O **total fica preso em baixo** enquanto o do talão não está à vista.
- Só leitura: nada da fatura se edita. O preço unitário não vem nos dados, por isso mostra-se a quantidade e o valor da linha.
- Estados novos: 14.9 passou a «IVA discriminado» (o talão abre com o IVA recolhido); 14.24 O talão a abrir, 14.25 Sem linhas de artigos, 14.26 Muitos artigos, 14.27 Fatura paga. «A gerar o PDF» (comum) passou a 14.28.

### Os números do cabeçalho a mexer — Pedidos, Guias e Faturas (15 out. 2026)
- Ela, com a imagem dos quatro números das Faturas: «quero mais animação aqui e noutros screens». Está em `comportamento/kpi.ts`, e o CSS no fim de `css/pedidos-v4.css`.
- **Contar como na Minha lista** (ela: «aqui seria engraçado aparecer como aparece na lista de compras»): o número conta do valor antigo até ao novo (420 ms) e acende a laranja; à entrada da página conta a partir do 0. A caixa nunca encolhe (fica com a largura do maior valor já mostrado), para o cabeçalho não saltar. A fita de algarismos da primeira versão saiu.
- **Diferença:** com um filtro, a diferença («+2», «−1 234,56 €») aparece por momentos no lugar do nome do número e o nome volta.
- **Risca fina** no fundo de cada número, com a parte do total do período (laranja; âmbar nas notas de crédito).
- **Ícone** com o gesto ao passar o rato e entrada em cascata.
- Nada à volta se mexe: a diferença e a risca só usam transform e opacity. Com «reduzir movimento», o número troca de uma vez.

### 01–04 Entrar: o cartão partido ao meio (15 out. 2026)
- Ela: «a animação ficou muito porreira; puxar o card do login mais para a direita e a animação também, parece muito vazio o lado direito; um card centrado com uma divisória a meio, de um lado a animação, do outro o login».
- Um só cartão ao centro, partido por uma linha fina: à esquerda o palco com o rolamento (o mesmo canvas, agora centrado na sua metade: `entrar-cena.ts` deixou de deslocar a câmara), à direita o login. As cotas da vista explodida ficam dentro do palco. No telemóvel, o palco fica por cima do login, no mesmo cartão.
- O escuro do login passa ao grafite do resto do portal; o palco tem um tom próprio (`--ent3-cena`), que é também o fundo da cena 3D.
- (15 out., ela: «aqui quero estados de done, em prep…») Cada marcador da cronologia mostra o estado do pedido, tirado só dos passos confirmados: Concluído (visto, verde), Expedido ou Expedido em parte (camião, azul), Pronto a levantar (embalagem), Preparado e Em preparação (relógio, âmbar). O nome do estado aparece por baixo da data. O pedido ativo leva um anel laranja à volta (`etapa()` em `portal/pedidos-v4.ts`).
- (15 out., ela: «a parte do histórico dos pedidos ainda está com cores diferentes») O marcador passou a ser igual nos Pedidos, Guias e Faturas: anel com ícone, sem enchimento, na cor do estado escrito por baixo da data. Verde para feito (Concluído, Entregue, Paga), azul para em curso (Expedido, Em entrega, Em aberto), âmbar para à espera ou devolução (Em preparação, Devolução, Creditada) e vermelho para Vencida. Cheio a laranja fica só o que está aberto no painel. A regra é comum, em `css/pedidos-v4.css` (`--cor-est`). Os Pedidos ganharam também o ano por cima dos meses, como as Guias e as Faturas.
- (15 out., ela: «quero o conteúdo do login do lado direito e o objeto do lado esquerdo e coloca texto para não ficar muito vazio») O cartão ocupa quase o ecrã todo (até 1480 px). Na metade esquerda fica um texto com factos verdadeiros de romafe.com (desde 1945, SKF desde 1975, o nome que vem de Rolamentos, Maquinas e Ferramentas, 75 000+ referências auto, 14 000+ clientes, Porto e Sacavém, «Rolling your way»), com o rolamento à direita dele. Para isso a câmara volta a desenhar uma janela deslocada (centro a 68 % do palco), mas só quando o palco tem 500 px ou mais; num palco estreito o rolamento afasta-se e as cotas ficam fora do texto. Na metade direita fica o login, ao centro. No telemóvel ficam o título, o rolamento e o login, por esta ordem.
