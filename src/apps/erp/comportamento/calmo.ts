/* =========================================================
   ERP — movimento calmo (26 out. 2026). Ver css/calmo.css.
   As animações feitas em código (Element.animate) passam todas por aqui: sem atrasos (acabam as cascatas, tudo
   aparece de uma vez) e mais curtas (RITMO da duração, até MAXIMO). As que se repetem (a carregar) ficam como estão,
   e as aberturas também (a entrada no ERP, uma vez por sessão, tem o seu próprio tempo).
   ========================================================= */
const RITMO = .7, MAXIMO = 180, ABERTURAS = '.ab, .ab2, .ab3, .ab4, .ab5, .ab6';
export const PAGINAS_ANIMADAS = false;

export function iniciar(): void {
  const animar = Element.prototype.animate;
  if ((animar as { calmo?: boolean }).calmo) return;
  const calmo = function (this: Element, quadros: Keyframe[] | PropertyIndexedKeyframes | null, op?: number | KeyframeAnimationOptions) {
    const o: KeyframeAnimationOptions = typeof op === 'number' ? { duration: op } : { ...op };
    if (o.iterations !== Infinity && !this.closest(ABERTURAS)) {
      o.delay = 0;
      if (typeof o.duration === 'number') o.duration = Math.min(MAXIMO, Math.round(o.duration * RITMO));
    }
    return animar.call(this, quadros, o);
  };
  (calmo as { calmo?: boolean }).calmo = true;
  Element.prototype.animate = calmo as typeof animar;
}
