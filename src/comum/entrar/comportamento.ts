/* =========================================================
   ROMAFE — comportamento do início de sessão (as três apps)
   Regras de 19 no 02: mostrar/ocultar, uma mensagem só de erro,
   a palavra-passe limpa-se.
   ========================================================= */
/* Um formulário de palavra-passe por produto: a Web tem dois (GoShop e
   GoParts), e cada um liga-se sozinho, pelo que tem dentro. */
export function iniciar(): void {
  document.querySelectorAll<HTMLFormElement>('form[data-palavra-passe]').forEach(ligar);
}

function ligar(form: HTMLFormElement): void {
  const passe = form.querySelector<HTMLInputElement>('input[type="password"]');
  const olho = form.querySelector<HTMLButtonElement>('.campo__acao');
  const alerta = form.closest('.cartao')?.querySelector<HTMLElement>('[data-credenciais]');
  const entrar = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!passe || !olho || !alerta || !entrar) return;
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
