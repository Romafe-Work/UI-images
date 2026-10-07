/* =========================================================
   ERP — comportamento do início de sessão
   Regras de 19 no 02: mostrar/ocultar, uma mensagem só de erro,
   a palavra-passe limpa-se.
   ========================================================= */
export function iniciar(): void {
  const form = document.getElementById('formulario-passe') as HTMLFormElement | null;
  const passe = document.getElementById('palavra-passe') as HTMLInputElement | null;
  const olho = document.getElementById('ver-palavra-passe');
  const alerta = document.getElementById('alerta');
  const entrar = document.getElementById('entrar') as HTMLButtonElement | null;
  if (!form || !passe || !olho || !alerta || !entrar) return;
  const rotulo = entrar.querySelector('.btn__rotulo') as HTMLElement;

  /* --- mostrar/ocultar (19 §2.1) --- */
  olho.addEventListener('click', () => {
    const visivel = passe.type === 'text';
    passe.type = visivel ? 'password' : 'text';
    olho.setAttribute('aria-pressed', String(!visivel));
    olho.setAttribute('aria-label', visivel ? 'Mostrar palavra-passe' : 'Ocultar palavra-passe');
    passe.focus();
  });

  /* --- erro de credenciais (19 §3) ---
     A mensagem é sempre a mesma, esteja a conta errada, desativada ou
     inexistente. Dizer qual falhou confirma a quem tenta que o endereço existe. */
  function falhar(): void {
    alerta!.hidden = false;
    passe!.value = '';       // a palavra-passe limpa-se
    passe!.focus();          // o foco vai para onde se vai escrever
  }

  passe.addEventListener('input', () => { alerta.hidden = true; });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!passe.value) { falhar(); return; }

    entrar.disabled = true;
    rotulo.textContent = 'A entrar…';

    // Demonstração: aqui entraria o pedido ao Keycloak.
    window.setTimeout(() => {
      entrar.disabled = false;
      rotulo.textContent = 'Entrar';
      falhar();
    }, 700);
  });
}
