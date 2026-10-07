# Ecrãs Romafe

Todos os ecrãs da Romafe num só sítio, divididos em três apps:

| Pasta | App | Tela |
| --- | --- | --- |
| `erp/` | ERP — Rolgest | 1440×900 |
| `web/` | Web | 1440×900 |
| `mobile/` | Mobile — telemóvel e PDA | 480×800 |

`index.html` é a porta de entrada: as três apps e uma caixa para procurar
qualquer ecrã pelo nome, pelo fluxo ou pelo que ele faz. Cada resultado tem
**Ver** (o ecrã sozinho, a funcionar como protótipo) e **Editar** (o editor).

## A base

O que se repete nos ecrãs de uma app está escrito **uma vez só**, num
`<template data-base="…">`. Cada ecrã diz de que base nasce e traz só o que
muda, em partes com `data-slot`:

```html
<template data-base="entrada">
  <header class="topo">…</header>
  <main class="palco"> <slot name="discurso"></slot> <slot name="cartao"></slot> </main>
  <footer class="rodape">…</footer>
</template>

<div class="ecra" data-ecra="palavra-passe" data-base="entrada" data-nome="02 · …" data-fluxo="Entrar" data-objetivo="…">
  <section class="discurso" data-slot="discurso">…</section>
  <section class="cartao" data-slot="cartao">…</section>
</div>
```

Mudar a base muda todos os ecrãs que nasceram dela. Quem a monta é
`comum/js/base.js`, antes do editor e do mapa.

## O que é comum às três apps: `comum/`

- `css/tokens.css` — os valores do manual de UI da Romafe; `css/base.css` — os componentes.
- `js/editor.js`, `js/fluxo.js`, `js/ecras.js` — o editor, o mapa de navegação e o protótipo.
  Cada app diz quem é no `<html>`: `data-app`, `data-marca` e `data-tela`.
- As imagens vão normalizadas: WebP, 1440 px de largura no máximo.
  A fotografia do armazém passou de 2,3 MB em PNG para 40 KB.

## Acrescentar um ecrã

1. Acrescentar o `<div class="ecra" …>` em `<app>/index.html`, a partir da base.
2. Correr `python3 catalogo.py`, para a procura da porta de entrada o conhecer.
3. Commit e push. O site atualiza-se sozinho.

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
