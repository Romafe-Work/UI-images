/* =========================================================
   ROMAFE — montar a página de uma app

   Põe os ecrãs no <body>, já montados a partir da base, e liga por esta
   ordem: o comportamento de cada ecrã, o protótipo, o mapa e o editor.
   ========================================================= */
import type { App } from './tipos';
import { iniciar as iniciarTema } from './tema';
import { iniciar as iniciarEcras } from './ecras';
import { configurar as configurarFluxo } from './fluxo';
import { iniciar as iniciarEditor } from './editor';

export function montar(app: App, comportamentos: Array<() => void> = []): void {
  const raiz = document.documentElement;
  raiz.dataset.app = app.id;
  raiz.dataset.marca = app.marca;
  raiz.dataset.tela = app.tela.l + 'x' + app.tela.a;
  /* tela estreita: cada ecrã fica numa moldura de telemóvel (telemovel.css) */
  raiz.classList.toggle('tela-telemovel', app.tela.l <= 600);
  document.title = app.marca + ' — ecrãs';

  iniciarTema();

  if (!app.ecras.length) {
    document.body.innerHTML =
      '<main class="vazia"><h1>' + app.nome + '</h1>' +
      '<p>Ainda não há ecrãs nesta app.</p><p><a href="../">Voltar aos Ecrãs Romafe</a></p></main>';
    return;
  }

  const frag = document.createDocumentFragment();
  app.ecras.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'ecra';
    div.dataset.ecra = e.id;
    div.dataset.nome = e.nome;
    div.dataset.fluxo = e.fluxo;
    div.dataset.objetivo = e.objetivo;
    div.hidden = i > 0;
    div.innerHTML = e.html;
    frag.appendChild(div);
  });
  document.body.appendChild(frag);

  comportamentos.forEach((f) => f());
  configurarFluxo(app);
  iniciarEcras();
  iniciarEditor();
}
