# Ecrãs Romafe

Todos os ecrãs da Romafe num só sítio, divididos em três apps:

| Pasta | App | Tela |
| --- | --- | --- |
| `src/apps/erp/` | ERP — Rolgest | 1440×900 |
| `src/apps/web/` | Web | 1440×900 |
| `src/apps/mobile/` | Mobile — telemóvel e PDA | 480×800 |

`index.html` é a porta de entrada: as três apps e uma caixa para procurar
qualquer ecrã pelo nome, pelo fluxo ou pelo que ele faz. Cada resultado tem
**Ver** (o ecrã sozinho, a funcionar como protótipo) e **Editar** (o editor).

## Correr

```sh
npm install
npm run dev         # http://localhost:5173
npm run verificar   # só o TypeScript
npm run build       # verifica e gera dist/, que é o que vai para o site
```

Cada push para `main` compila e publica no GitHub Pages
(`.github/workflows/publicar.yml`). Se o TypeScript falhar, não publica.

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

## Acrescentar um ecrã

1. Acrescentar o id em `src/apps/<app>/ids.ts`.
2. Criar `src/apps/<app>/ecras/NN-nome.ts` a partir da base.
3. Pô-lo na lista de `app.ts`. Aparece no editor, no mapa e na procura.
4. Commit e push. O site atualiza-se sozinho.

As imagens vão normalizadas: WebP, 1440 px de largura no máximo.

As alterações feitas no editor ficam no navegador de quem as fez. Para
chegarem aos outros, copia-se o CSS (**Ver o CSS**) para o ficheiro e faz-se commit.

## O ERP

Começa pelo início de sessão em dois passos:

| Ecrã | Leva a |
| --- | --- |
| 01 · Entrar — o endereço; o domínio decide o caminho | 02 (conta nossa) ou 03 (cliente federado) |
| 02 · A palavra-passe — valida no Keycloak, realm rolgest | — |
| 03 · O início de sessão da empresa — palavra-passe e segundo fator do cliente | — |

Veio do `Figma-ERP-Rolgest` (01, 01b e 01d de lá).
