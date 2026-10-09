/* Pixel Meta de LCR Couverture (ensemble de données « LCR Couverture », créé le 09/10/2026).
   Rien ne se charge sans accord : le bandeau propose Refuser et Accepter à égalité,
   le choix est gardé 6 mois, et le lien « Cookies » du bas de page permet d'en changer.
   Une demande envoyée déclenche l'événement Lead (seulement si le visiteur a accepté). */
(function () {
  var PIXEL_ID = '1663556545480853';
  var CLE = 'lcr-cookies';
  var SIX_MOIS = 182 * 24 * 3600 * 1000;

  function lireChoix() {
    try {
      var c = JSON.parse(localStorage.getItem(CLE) || 'null');
      if (!c || !c.v || (Date.now() - c.t) > SIX_MOIS) return null;
      return c.v;
    } catch (e) { return null; }
  }
  function noterChoix(v) { try { localStorage.setItem(CLE, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {} }

  function chargerPixel() {
    if (window.fbq) return;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID); fbq('track', 'PageView');
  }

  window.mesurerDemande = function () { if (window.fbq && lireChoix() === 'oui') fbq('track', 'Lead'); };

  function demarrer() {
    var bandeau = document.getElementById('cookies');
    var lien = document.getElementById('cookies-lien');
    if (!bandeau) return;
    bandeau.querySelectorAll('[data-choix]').forEach(function (b) {
      b.addEventListener('click', function () {
        noterChoix(b.dataset.choix); bandeau.hidden = true;
        if (b.dataset.choix === 'oui') chargerPixel();
      });
    });
    if (lien) lien.addEventListener('click', function (ev) { ev.preventDefault(); bandeau.hidden = false; });
    var choix = lireChoix();
    if (choix === 'oui') chargerPixel(); else if (choix !== 'non') bandeau.hidden = false;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
