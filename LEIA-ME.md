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

## 00 · Abertura do GoParts em 3D (14 out. 2026)

Uma versão por ecrã (ela, 14 out.: «só quero uma versão por screen» e «vamos a um screen de cada vez»).
A abertura é uma cena 3D em **Three.js** (sem React: o projeto não o usa), carregada à parte só quando
a abertura aparece (`src/apps/goparts/comportamento/abertura-cena.ts`; o resto em `abertura.ts`,
`comportamento/abertura.ts` e `css/abertura.css`). Em ~7 s: uma esfera sozinha → o rolamento (um
SKF 6206 à escala) monta-se → vista explodida com as cotas a laranja → monta-se outra vez e desfaz-se
em partículas → as partículas formam o ROMAFE (tirado da letra Motor) e dão lugar ao logótipo
verdadeiro, com o GoParts e a linha laranja → passa ao 01 · Entrar, com a marca a voar para a barra
(a página pública foi apagada a 14 out., a pedido dela).

- Arrasta-se o rolamento e a cena segue o rato; «Saltar» ou Esc vão já.
- Passa inteira uma vez por sessão; depois mostra o logótipo, com «Ver outra vez».
- Com «reduzir movimento», sem WebGL ou num aparelho fraco: só o logótipo.
- Para rever um instante: `#so=ecra&ecra=abertura&pausa=3.4` congela a sequência aos 3,4 s.
- Sem percentagem de carregamento (não havia o que medir de verdade).

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
