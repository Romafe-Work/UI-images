/* =========================================================
   ROMAFE — o mapa de navegação, o mesmo nas três apps

   Põe os ecrãs todos numa tela, uma linha por fluxo (data-fluxo), e
   desenha uma seta de cada peça com data-ir para o ecrã a que leva.
   Não há um segundo desenho: mudar um data-ir no HTML muda a seta.

   Duas maneiras de o abrir:
     index.html#doc=fluxo   o botão «Fluxo» do editor. Clicar num ecrã
                            abre-o para editar
     index.html#so=fluxo    só o mapa, sem editor: é o que o
                            importar/gerar.sh fotografa

   A peça que leva a algum lado fica contornada a azul, e a seta sai dela.
   Para o ecrã ao lado vai direita; para mais longe, para trás ou para
   outra linha segue pelos corredores entre os ecrãs, para não os tapar.

   As peças que se repetem em todos os ecrãs (a empresa na barra, o
   separador Início) levam data-sem-seta: navegam no protótipo e ficam
   fora do mapa, senão as setas repetidas tapavam as que dizem alguma coisa.
   É o mesmo mecanismo do mapa do PDA, reescrito para ecrãs de 1440×900.
   ========================================================= */
(function () {
  'use strict';

  var LIGACAO = '[data-ir]:not([data-sem-seta])';
  var NS = 'http://www.w3.org/2000/svg';
  var RAIZ = document.documentElement;
  var CHAVE_ZOOM = 'romafe:' + (RAIZ.dataset.app || 'app') + ':fluxo:zoom';
  var ESCALA = 0.25;               // 1440×900 → 360×225 no mapa
  /* o tamanho da tela vem da app: data-tela="1440x900" no ERP, outro no Mobile */
  var TELA = (RAIZ.dataset.tela || '1440x900').split('x');
  var L = +TELA[0] || 1440, A = +TELA[1] || 900;
  RAIZ.style.setProperty('--tela-l', L + 'px');
  RAIZ.style.setProperty('--tela-a', A + 'px');
  var ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2];

  var tela = null, mapa = null, svg = null, zoom = 1, opcoes = {};
  var lugares = [];                // [{ ecra, marcador, hidden }] para devolver cada ecrã ao sítio

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function descricaoDe(fluxo) {
    var t = document.getElementById('fluxos');
    if (!t) return '';
    var ps = t.content.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) if (ps[i].dataset.fluxo === fluxo) return ps[i].textContent;
    return '';
  }

  function ligar(o) {
    if (mapa) return;
    opcoes = o || {};
    try { zoom = parseFloat(localStorage.getItem(CHAVE_ZOOM)) || 0; } catch (e) { zoom = 0; }

    tela = el('div', 'fluxo-tela');
    var cabeca = el('header', 'fluxo__cabeca');
    cabeca.appendChild(el('h1', 'fluxo__titulo', 'Mapa de navegação — ' + (RAIZ.dataset.marca || 'ROMAFE')));
    var leg = el('p', 'fluxo__legenda');
    leg.appendChild(el('span', 'fluxo__amostra'));
    leg.appendChild(document.createTextNode(
      'Contornado a azul: o que leva a outro ecrã. A seta diz a qual. ' +
      'O que se repete em todos os ecrãs não se desenha.' +
      (opcoes.aoEscolher ? ' Clica num ecrã para o abrir.' : '')));
    cabeca.appendChild(leg);
    if (opcoes.aoEscolher) cabeca.appendChild(controlosZoom());
    tela.appendChild(cabeca);

    mapa = el('div', 'fluxo');
    tela.appendChild(mapa);

    /* uma linha por fluxo, pela ordem em que aparecem no index.html */
    var ecras = [].slice.call(document.querySelectorAll('.ecra'));
    var linhas = {};
    lugares = [];
    ecras.forEach(function (ecra) {
      var marcador = document.createComment('ecra:' + ecra.dataset.ecra);
      ecra.parentNode.insertBefore(marcador, ecra);
      lugares.push({ ecra: ecra, marcador: marcador, hidden: ecra.hidden });
      ecra.hidden = false;

      var nomeLinha = ecra.dataset.fluxo || 'Sem fluxo';
      var linha = linhas[nomeLinha];
      if (!linha) {
        linha = el('section', 'fluxo__linha');
        var cab = el('div', 'fluxo__cabeca-linha');
        cab.appendChild(el('h2', 'fluxo__rotulo', nomeLinha));
        var d = descricaoDe(nomeLinha);
        if (d) cab.appendChild(el('p', 'fluxo__descricao', d));
        linha.appendChild(cab);
        linha.appendChild(el('div', 'fluxo__fila'));
        mapa.appendChild(linha);
        linhas[nomeLinha] = linha;
      }

      var cartao = el('figure', 'fluxo__cartao');
      cartao.dataset.ecra = ecra.dataset.ecra;
      var quadro = el('div', 'fluxo__quadro');
      quadro.appendChild(ecra);
      cartao.appendChild(quadro);
      var leg2 = el('figcaption', 'fluxo__legenda-ecra');
      leg2.appendChild(el('p', 'fluxo__nome', ecra.dataset.nome || ecra.dataset.ecra));
      if (ecra.dataset.objetivo) leg2.appendChild(el('p', 'fluxo__objetivo', ecra.dataset.objetivo));
      cartao.appendChild(leg2);
      if (opcoes.aoEscolher) {
        cartao.title = 'Abrir «' + (ecra.dataset.nome || '') + '»';
        cartao.addEventListener('click', function () { opcoes.aoEscolher(ecra.dataset.ecra); });
      }
      linha.querySelector('.fluxo__fila').appendChild(cartao);
    });

    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fluxo__setas');
    svg.setAttribute('aria-hidden', 'true');
    mapa.appendChild(svg);

    document.body.appendChild(tela);
    document.body.classList.add('com-fluxo');

    if (!zoom) zoom = ajuste();
    aplicarZoom(zoom, true);
    desenhar();
    /* as fontes e a fotografia mudam as medidas depois do primeiro desenho */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenhar);
    window.setTimeout(desenhar, 400);
    window.addEventListener('resize', desenhar);
    tela.addEventListener('wheel', rodaComCtrl, { passive: false });
  }

  function desligar() {
    if (!mapa) return;
    lugares.forEach(function (l) {
      l.marcador.parentNode.insertBefore(l.ecra, l.marcador);
      l.marcador.remove();
      l.ecra.hidden = l.hidden;
    });
    lugares = [];
    window.removeEventListener('resize', desenhar);
    tela.remove();
    tela = mapa = svg = null;
    document.body.classList.remove('com-fluxo');
  }

  /* ---------------- zoom ---------------- */
  function controlosZoom() {
    var z = el('div', 'fluxo__zoom');
    z.innerHTML =
      '<button type="button" data-z="-" title="Afastar (Ctrl + roda)">−</button>' +
      '<button type="button" data-z="1" class="fluxo__zoom-valor" title="Voltar a 100 %"></button>' +
      '<button type="button" data-z="+" title="Aproximar (Ctrl + roda)">+</button>' +
      '<button type="button" data-z="ajustar" title="Caber na largura">Ajustar</button>';
    z.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      var q = b.dataset.z;
      if (q === '1') aplicarZoom(1);
      else if (q === 'ajustar') aplicarZoom(ajuste());
      else passo(q === '+' ? 1 : -1);
    });
    return z;
  }

  function passo(sentido) {
    var lista = sentido > 0 ? ZOOMS : ZOOMS.slice().reverse();
    for (var i = 0; i < lista.length; i++) {
      if (sentido > 0 ? lista[i] > zoom + 0.001 : lista[i] < zoom - 0.001) return aplicarZoom(lista[i]);
    }
  }

  function ajuste() {
    if (!mapa) return 1;
    var antes = mapa.style.zoom;
    mapa.style.zoom = 1;
    var natural = mapa.scrollWidth || 1;
    mapa.style.zoom = antes;
    var livre = (tela.clientWidth || window.innerWidth) - 8;
    return Math.max(0.2, Math.min(1, Math.floor(livre / natural * 100) / 100));
  }

  function aplicarZoom(z, semGuardar) {
    zoom = Math.max(0.2, Math.min(2, Math.round(z * 100) / 100));
    if (mapa) mapa.style.zoom = zoom;
    var v = tela && tela.querySelector('.fluxo__zoom-valor');
    if (v) v.textContent = Math.round(zoom * 100) + '%';
    if (!semGuardar && opcoes.aoEscolher) { try { localStorage.setItem(CHAVE_ZOOM, String(zoom)); } catch (e) {} }
  }

  function rodaComCtrl(ev) {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    aplicarZoom(zoom * Math.exp(-ev.deltaY * 0.002));
  }

  /* ---------------- as setas ---------------- */
  /* Medidas em unidades do mapa: o retângulo no ecrã, dividido pelo zoom. */
  function caixa(n, base) {
    var r = n.getBoundingClientRect();
    return {
      x: (r.left - base.left) / zoom, y: (r.top - base.top) / zoom,
      l: r.width / zoom, a: r.height / zoom,
      get d() { return this.x + this.l; }, get b() { return this.y + this.a; },
      get cy() { return this.y + this.a / 2; }
    };
  }

  function no(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function desenhar() {
    if (!mapa || !svg) return;
    var base = mapa.getBoundingClientRect();
    svg.textContent = '';
    svg.setAttribute('width', mapa.scrollWidth);
    svg.setAttribute('height', mapa.scrollHeight);
    svg.style.width = mapa.scrollWidth + 'px';
    svg.style.height = mapa.scrollHeight + 'px';

    var defs = no('defs', {});
    var m = no('marker', { id: 'fluxo-ponta', viewBox: '0 0 10 10', refX: '9', refY: '5',
                           markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
    m.appendChild(no('path', { d: 'M0 0 10 5 0 10z', fill: 'currentColor' }));
    defs.appendChild(m);
    svg.appendChild(defs);

    var cartoes = [].slice.call(mapa.querySelectorAll('.fluxo__cartao'));
    var porNome = {}, info = {};
    var linhasEl = [].slice.call(mapa.querySelectorAll('.fluxo__linha'));
    cartoes.forEach(function (c) {
      var linha = c.closest('.fluxo__linha');
      var fila = linha.querySelector('.fluxo__fila');
      porNome[c.dataset.ecra] = c;
      info[c.dataset.ecra] = {
        quadro: caixa(c.querySelector('.fluxo__quadro'), base),
        linha: linhasEl.indexOf(linha),
        ordem: [].indexOf.call(fila.children, c),
        topoLinha: caixa(linha, base).y,
        /* o primeiro ecrã, e não a fila: a fila começa com o corredor */
        inicioFila: caixa(fila.firstElementChild, base).x
      };
    });

    var G = 120;                         // o vão entre ecrãs, ver .fluxo__fila
    var faixas = {};                     // linha -> quantas faixas já usadas
    var saidas = {};                     // ecrã -> quantas setas já saíram pelo vão da direita
    var entradas = {};                   // ecrã -> quantas setas já entraram pelo vão da esquerda

    function faixa(linha) {
      var k = faixas[linha] = (faixas[linha] || 0) + 1;
      return info[Object.keys(info).filter(function (n) { return info[n].linha === linha; })[0]].topoLinha + 18 + ((k - 1) % 8) * 11;
    }

    cartoes.forEach(function (c) {
      var orig = info[c.dataset.ecra];
      [].slice.call(c.querySelectorAll(LIGACAO)).forEach(function (peca) {
        var destino = porNome[peca.dataset.ir];
        if (!destino || destino === c) return;
        var dest = info[peca.dataset.ir];
        var p = caixa(peca, base);
        if (!p.l || !p.a) return;      // escondida: não há de onde sair

        svg.appendChild(no('rect', { 'class': 'fluxo__alvo', x: p.x - 2, y: p.y - 2, width: p.l + 4, height: p.a + 4, rx: 3 }));

        var q = dest.quadro, o = orig.quadro;
        var ty = Math.max(q.y + 14, Math.min(q.b - 14, p.cy));
        var ks = saidas[c.dataset.ecra] = (saidas[c.dataset.ecra] || 0) + 1;
        var ke = entradas[peca.dataset.ir] = (entradas[peca.dataset.ir] || 0) + 1;
        var xs = o.d + G / 2 - 18 + ((ks - 1) % 6) * 7;
        var xe = q.x - G / 2 + 18 - ((ke - 1) % 6) * 7;
        var d;

        if (dest.linha === orig.linha && dest.ordem === orig.ordem + 1) {
          /* o vizinho da direita: direita a ele */
          d = 'M' + p.d + ' ' + p.cy + ' H' + xs + ' V' + ty + ' H' + q.x;
        } else if (dest.linha === orig.linha) {
          var y1 = faixa(orig.linha);
          d = 'M' + p.d + ' ' + p.cy + ' H' + xs + ' V' + y1 + ' H' + xe + ' V' + ty + ' H' + q.x;
        } else {
          /* outra linha: sobe à faixa da linha, vai ao corredor da esquerda,
             desce à faixa da linha de destino e entra pelo vão */
          var ya = faixa(orig.linha), yb = faixa(dest.linha);
          var xc = Math.min(orig.inicioFila, dest.inicioFila) - 30 - (((faixas[orig.linha] || 1) - 1) % 5) * 9;
          d = 'M' + p.d + ' ' + p.cy + ' H' + xs + ' V' + ya + ' H' + xc + ' V' + yb + ' H' + xe + ' V' + ty + ' H' + q.x;
        }
        svg.appendChild(no('path', { d: d, 'marker-end': 'url(#fluxo-ponta)' }));
      });
    });
  }

  window.RomafeFluxo = {
    ligar: ligar,
    desligar: desligar,
    activo: function () { return !!mapa; },
    desenhar: desenhar
  };
})();
