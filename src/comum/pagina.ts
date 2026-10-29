/* =========================================================
   ROMAFE — montar a página de uma app

   Põe os ecrãs no <body>, já montados a partir da base, e liga por esta
   ordem: o comportamento de cada ecrã, o protótipo, o mapa e o editor.
   ========================================================= */
import type { App } from './tipos';
import { iniciar as iniciarTema } from './tema';
import { iniciar as iniciarEcras, adiar } from './ecras';
import { iniciar as iniciarDemo } from './demo';
import { configurar as configurarFluxo } from './fluxo';
import { iniciar as iniciarEditor } from './editor';
import { juntarExtras } from './extras';

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

  /* o que se criou no editor (versões, cópias de ecrãs) entra antes de desenhar */
  const locais = juntarExtras(app);

  /* num separador da área de trabalho só se vê o ecrã pedido: os outros constroem-se só se forem mostrados (ecras.ts) */
  const pedido = new URLSearchParams(location.search).has('separador') ? new URLSearchParams(location.hash.slice(1)).get('ecra') : null;
  const soUm = !!pedido && app.ecras.some((e) => e.id === pedido);
  const frag = document.createDocumentFragment();
  app.ecras.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'ecra';
    div.dataset.ecra = e.id;
    div.dataset.nome = e.nome;
    div.dataset.fluxo = e.fluxo;
    div.dataset.objetivo = e.objetivo;
    if (e.estadoDe) div.dataset.estadoDe = e.estadoDe;
    if (e.noFluxo) div.dataset.noFluxo = e.noFluxo;
    if (e.foraDaLista) div.dataset.foraDaLista = '1';
    div.hidden = i > 0;
    if (locais.has(e.id)) div.dataset.local = '1';
    /* uma <div class="versao"> por versão; o ecras.ts diz qual se vê */
    e.versoes.forEach((v, j) => {
      const dv = document.createElement('div');
      dv.className = 'versao';
      dv.dataset.versao = v.id;
      dv.dataset.nota = v.nota;
      dv.hidden = j < e.versoes.length - 1;
      if (locais.has(e.id + '|' + v.id)) dv.dataset.local = '1';
      if (soUm && e.id !== pedido) adiar(dv, v.html); else dv.innerHTML = v.html;
      div.appendChild(dv);
    });
    frag.appendChild(div);
  });
  document.body.appendChild(frag);

  comportamentos.forEach((f) => f());
  configurarFluxo(app);
  iniciarEcras();
  iniciarDemo();
  iniciarEditor();
}
