/* =========================================================
   PEÇA A PEÇA — 09 · A minha garagem (21 out. 2026)
   Ela: «a minha garagem deve ser a primeira opção de menu». O bloco que vivia na Pesquisar peças passa a ecrã
   próprio, o primeiro do menu: os veículos guardados (o favorito primeiro), marcar, mudar o nome, tirar, adicionar
   pela matrícula, «Peças compatíveis» (abre o Catálogo com o veículo) e «Usar na pesquisa» (vai à Pesquisar
   peças e identifica-o lá). O comportamento é o do bloco (comportamento/inicio-espaco.ts): a página usa as mesmas
   classes (ini4) e os mesmos dados (a garagem guardada no navegador, por conta).
   ========================================================= */
import { dadosIniciais, garagemHtml, L, IC } from './inicio-espaco';

export function garagemPagina(): string {
  return `<div class="portal portal--v3 portal--v22 portal--noite portal--ini3 portal--ini4 portal--gar">
  <main class="ini3 ini4 gar" data-garagem-pagina>
    <header class="gar__cabeca">
      <h1 class="gar__titulo">A minha garagem</h1>
      <p class="gar__sub">Os veículos com que trabalhas. Daqui vais às peças compatíveis ou à pesquisa, já com o veículo escolhido.</p>
    </header>
    <div class="gar__corpo" data-blocos>${garagemHtml(dadosIniciais())}</div>
    <p class="gar__nota">${L(IC.info)}<span>A garagem fica guardada neste navegador, para a tua conta.</span></p>
  </main>
  <p class="ini3__aviso" role="status" aria-live="polite"></p>
  <div class="ini4__brinde" data-por-cima role="status" aria-live="polite" hidden></div>
</div>`;
}
