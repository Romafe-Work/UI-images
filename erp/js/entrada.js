/* =========================================================
   ROLGEST — comportamento do ecrã de entrada
   Em dois passos: o endereço no 01, a palavra-passe no 01b.
   Regras de 19 no 01b: mostrar/ocultar, uma mensagem só de erro,
   a palavra-passe limpa-se.
   ========================================================= */
(function () {
  'use strict';

  var form    = document.getElementById('formulario-passe');
  var passe   = document.getElementById('palavra-passe');
  var olho    = document.getElementById('ver-palavra-passe');
  var alerta  = document.getElementById('alerta');
  var entrar  = document.getElementById('entrar');
  var rotulo  = entrar.querySelector('.btn__rotulo');

  /* --- mostrar/ocultar (19 §2.1) --- */
  olho.addEventListener('click', function () {
    var visivel = passe.type === 'text';
    passe.type = visivel ? 'password' : 'text';
    olho.setAttribute('aria-pressed', String(!visivel));
    olho.setAttribute('aria-label', visivel ? 'Mostrar palavra-passe' : 'Ocultar palavra-passe');
    passe.focus();
  });

  /* --- erro de credenciais (19 §3) ---
     A mensagem é sempre a mesma, esteja a conta errada, desativada ou
     inexistente. Dizer qual falhou confirma a quem tenta que o endereço existe. */
  function falhar() {
    alerta.hidden = false;
    passe.value = '';        // a palavra-passe limpa-se
    passe.focus();           // o foco vai para onde se vai escrever
  }

  passe.addEventListener('input', function () { alerta.hidden = true; });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    if (!passe.value) { falhar(); return; }

    entrar.disabled = true;
    rotulo.textContent = 'A entrar…';

    // Demonstração: aqui entraria o pedido ao Keycloak.
    window.setTimeout(function () {
      entrar.disabled = false;
      rotulo.textContent = 'Entrar';
      falhar();
    }, 700);
  });
})();
