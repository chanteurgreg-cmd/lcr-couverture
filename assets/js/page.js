// Page avant formulaire de LCR Couverture, version 2 : apparitions au défilement, chiffres qui comptent,
// comparateur pendant/après, vidéo qui se lance quand on la voit, bouton qui suit la lecture, partage,
// et formulaire en 5 questions qui trie avant d'envoyer.
(() => {
  // ── Réglages (à confirmer avec LCR avant la mise en ligne) ──────────────
  const ZONE = ["91", "94", "92", "78"];   // zone visée par la pub (08/10) : 91, sud du 94 et du 92, secteur de Versailles
  const ENDPOINT = "https://xrtpqsddxwyipqftqrgk.supabase.co/functions/v1/lead-page";   // fonction du bureau : enregistre et prévient Telegram
  // Clé PUBLIQUE du projet (faite pour vivre dans le navigateur, la même que celle du bureau) : ce n'est pas un secret.
  const CLE_PUBLIQUE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydHBxc2RkeHd5aXBxZnRxcmdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1ODY4NDgsImV4cCI6MjEwMjE2Mjg0OH0.rLZUEvWJDRaeDLY494R4e6tKB_VPt3R89gOuUyeDwvw";
  const PAGE = "lcr-toiture";               // identifiant de la page, reconnu par la fonction
  const ETAPES = 6;
  // Rendez-vous réservés par la personne : jours et créneaux proposés (à caler sur l'agenda réel de Mathieu)
  const JOURS_VISITE = [1, 2, 3, 4, 5];     // lundi à vendredi (0 = dimanche, 6 = samedi)
  const NB_JOURS = 10;                      // jours proposés, à partir de demain
  const CRENEAUX = ["8 h – 10 h", "10 h – 12 h", "14 h – 16 h", "16 h – 18 h"];

  const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const voir = (cible, rappel, options) => {
    if (!("IntersectionObserver" in window)) { rappel(true); return; }
    new IntersectionObserver((entrees, obs) => entrees.forEach((e) => rappel(e.isIntersecting, e, obs)), options).observe(cible);
  };

  // ── Apparitions douces au défilement ─────────────────────────────────────
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    voir(el, (dedans, e, obs) => { if (dedans) { el.classList.add("vu"); obs?.unobserve(el); } }, { rootMargin: "0px 0px -8% 0px" });
  });

  // ── Chiffres qui comptent quand ils arrivent à l'écran ───────────────────
  document.querySelectorAll("[data-compte]").forEach((el) => {
    const fin = parseFloat(el.dataset.compte), debut = parseFloat(el.dataset.depuis || "0");
    const dec = parseInt(el.dataset.decimales || "0", 10), suffixe = el.dataset.suffixe || "";
    const ecrire = (v) => { el.textContent = v.toFixed(dec).replace(".", ",") + suffixe; };
    if (calme) return;
    ecrire(debut);
    voir(el, (dedans, e, obs) => {
      if (!dedans) return;
      obs?.unobserve(el);
      const t0 = performance.now(), duree = 1100;
      const pas = (t) => {
        const p = Math.min(1, (t - t0) / duree), q = 1 - Math.pow(1 - p, 3);
        ecrire(debut + (fin - debut) * q);
        if (p < 1) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    }, { threshold: 0.6 });
  });

  // ── Comparateur pendant / après, qui se montre une fois tout seul ────────
  document.querySelectorAll(".comparer-cadre").forEach((cadre) => {
    const curseur = cadre.querySelector("input[type=range]");
    const poser = (v) => { curseur.value = v; cadre.style.setProperty("--pos", `${v}%`); };
    let touche = false;
    curseur.addEventListener("input", () => { touche = true; poser(curseur.value); });
    if (calme) return;
    voir(cadre, (dedans, e, obs) => {
      if (!dedans || touche) return;
      obs?.unobserve(cadre);
      const cles = [[0, 50], [500, 74], [1150, 28], [1700, 50]], t0 = performance.now();
      const pas = (t) => {
        if (touche) return;
        const dt = t - t0;
        let k = cles.findIndex((c) => c[0] > dt);
        if (k === -1) { poser(50); return; }
        const [ta, va] = cles[k - 1], [tb, vb] = cles[k], p = (dt - ta) / (tb - ta), q = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        poser(Math.round(va + (vb - va) * q));
        requestAnimationFrame(pas);
      };
      setTimeout(() => requestAnimationFrame(pas), 350);
    }, { threshold: 0.7 });
  });

  // ── La vidéo de la méthode se lance quand on la voit ─────────────────────
  document.querySelectorAll(".video-carte video").forEach((v) => {
    voir(v, (dedans) => { if (dedans && !calme) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.4 });
  });

  // ── Bouton qui suit la lecture : après l'ouverture, caché sur le formulaire ──
  const cta = document.querySelector(".cta-collant");
  const ouverture = document.querySelector(".ouverture");
  const formulaire = document.getElementById("formulaire");
  if (cta && ouverture && formulaire) {
    let passe = false, surForm = false;
    const maj = () => {
      const montrer = passe && !surForm;
      cta.classList.toggle("visible", montrer);
      cta.setAttribute("aria-hidden", String(!montrer));
      cta.tabIndex = montrer ? 0 : -1;
    };
    voir(ouverture, (dedans, e) => { passe = !dedans && e && e.boundingClientRect.top < 0; maj(); });
    voir(formulaire, (dedans) => { surForm = dedans; maj(); }, { rootMargin: "0px 0px -25% 0px" });
  }

  // ── Partager la page (locataire → propriétaire) ──────────────────────────
  document.querySelectorAll("[data-partager]").forEach((bouton) => {
    bouton.addEventListener("click", async () => {
      const lien = location.href.split("#")[0];
      const ok = bouton.parentElement.querySelector(".partager-ok");
      try {
        if (navigator.share) { await navigator.share({ title: document.title, text: "La page de LCR Couverture pour la toiture :", url: lien }); return; }
        await navigator.clipboard.writeText(lien);
        if (ok) ok.textContent = "Lien copié.";
      } catch (e) {
        if (ok && e?.name !== "AbortError") ok.textContent = lien;
      }
    });
  });

  // ── Formulaire en 5 questions ────────────────────────────────────────────
  const form = document.getElementById("demande");
  if (!form) return;
  const ouvertA = Date.now();
  const etapes = [...form.querySelectorAll(".etape")];
  const barre = document.querySelector(".progression span");
  const compteur = document.querySelector(".etape-compteur");
  const retour = form.querySelector(".retour");
  const erreur = form.querySelector(".erreur");
  const infoZone = form.querySelector('[data-info="hors-zone"]');
  const infoBudget = form.querySelector('[data-info="budget-non"]');
  const bouton = form.querySelector(".envoyer");
  const merci = document.querySelector(".merci");
  const agenda = form.querySelector(".agenda");
  const agendaOk = form.querySelector(".agenda-ok");
  const rappelRdv = form.querySelector(".rappel-rdv");
  let creneauChoisi = "";
  const OU_DEPT = { "75": "à Paris", "77": "en Seine-et-Marne", "78": "dans les Yvelines", "91": "en Essonne", "92": "dans les Hauts-de-Seine", "93": "en Seine-Saint-Denis", "94": "dans le Val-de-Marne", "95": "dans le Val-d'Oise" };
  let courante = 1;

  const valeur = (nom) => form.querySelector(`[name="${nom}"]:checked`)?.value ?? "";
  const champ = (id) => (form.querySelector(`#${id}`)?.value ?? "").trim();
  const montrer = (el, oui) => { if (el) el.hidden = !oui; };
  const signaler = (message, el) => {
    erreur.textContent = message;
    montrer(erreur, true);
    if (el) { el.classList?.add("invalide"); el.focus?.(); }
  };

  function aller(n) {
    courante = n;
    etapes.forEach((e) => { const ici = Number(e.dataset.etape) === n; e.hidden = !ici; e.classList.toggle("entre", ici && !calme); });
    barre.style.width = `${(n / ETAPES) * 100}%`;
    compteur.textContent = `Question ${n} sur ${ETAPES}`;
    montrer(retour, n > 1);
    montrer(erreur, false);
    const actuelle = etapes[n - 1];
    const legend = actuelle.querySelector("legend");
    if (legend) { legend.setAttribute("tabindex", "-1"); legend.focus({ preventScroll: true }); }
    if (n === ETAPES) {
      const soi = valeur("rdv") === "creneau" && creneauChoisi;
      rappelRdv.innerHTML = soi
        ? `Votre rendez-vous&nbsp;: <b>${creneauChoisi}</b>, chez vous. On vous appelle pour le confirmer.`
        : "On vous appelle dans l'heure (en journée) pour fixer ensemble le jour de la visite.";
      montrer(rappelRdv, true);
      setTimeout(() => form.querySelector("#prenom")?.focus({ preventScroll: true }), calme ? 0 : 330);
    }
  }

  // Un choix fait passer à la question suivante (sauf hors zone, où l'on s'arrête poliment)
  form.addEventListener("change", (e) => {
    const nom = e.target.name;
    montrer(erreur, false);
    if (nom === "departement") {
      const dep = valeur("departement");
      if (!ZONE.includes(dep)) {
        infoZone.innerHTML = `Désolé, nous n'intervenons pas ${OU_DEPT[dep] || "dans ce département"}. Pour trouver un couvreur certifié RGE près de chez vous&nbsp;: <a href="https://france-renov.gouv.fr" target="_blank" rel="noopener">france-renov.gouv.fr</a>.`;
        montrer(infoZone, true);
        return;
      }
      montrer(infoZone, false);
    }
    if (nom === "rdv") {
      const soi = valeur("rdv") === "creneau";
      montrer(agenda, soi);
      if (soi) { remplirAgenda(); agenda.scrollIntoView({ block: "nearest", behavior: calme ? "auto" : "smooth" }); return; }
      creneauChoisi = "";
    }
    if (nom === "jour" || nom === "creneau") { agendaOk.disabled = !(valeur("jour") && valeur("creneau")); return; }
    if (["travaux", "departement", "delai", "budget", "rdv"].includes(nom)) setTimeout(() => aller(courante + 1), calme ? 0 : 260);
  });

  // L'agenda : les prochains jours ouvrés et les créneaux, pour réserver soi-même
  const JOURS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  const MOIS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  function remplirAgenda() {
    const jours = agenda.querySelector(".jours"), creneaux = agenda.querySelector(".creneaux");
    if (jours.children.length) return;
    const d = new Date(); d.setHours(12, 0, 0, 0);
    let n = 0;
    while (n < NB_JOURS) {
      d.setDate(d.getDate() + 1);
      if (!JOURS_VISITE.includes(d.getDay())) continue;
      const long = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      jours.insertAdjacentHTML("beforeend", `<label><input type="radio" name="jour" value="${long}"><span><small>${JOURS_FR[d.getDay()]}</small><b>${d.getDate()}</b><i>${MOIS_FR[d.getMonth()]}</i></span></label>`);
      n++;
    }
    CRENEAUX.forEach((c) => creneaux.insertAdjacentHTML("beforeend", `<label><input type="radio" name="creneau" value="${c}"><span>${c}</span></label>`));
  }
  agendaOk.addEventListener("click", () => {
    if (!valeur("jour") || !valeur("creneau")) return;
    creneauChoisi = `${valeur("jour")}, ${valeur("creneau").replace(/ /g, " ")}`;
    aller(6);
  });


  retour.addEventListener("click", () => aller(Math.max(1, courante - 1)));

  // 06 12 34 56 78, 0612345678 ou +33 6 12 34 56 78 → 0612345678
  const telNormal = (t) => {
    let n = t.replace(/[^\d+]/g, "");
    if (n.startsWith("+33")) n = "0" + n.slice(3);
    else if (n.startsWith("0033")) n = "0" + n.slice(4);
    return /^0[1-9]\d{8}$/.test(n) ? n : null;
  };
  const telAffiche = (n) => n.replace(/(\d{2})(?=\d)/g, "$1 ");

  // Ce que la publicité a mis dans le lien (ex. ?utm_content={{ad.name}}) : le client voit de quelle pub vient la demande
  const params = new URLSearchParams(location.search);
  const publicite = params.get("utm_content") || params.get("utm_campaign") || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    montrer(erreur, false);
    form.querySelectorAll(".invalide").forEach((el) => el.classList.remove("invalide"));
    if (courante !== ETAPES) return;

    // Robots : champ caché rempli, ou formulaire rempli en moins de 4 secondes → on fait comme si
    if (form.site_web.value || Date.now() - ouvertA < 4000) { fin(champ("prenom"), champ("tel")); return; }

    if (!champ("prenom")) return signaler("Indiquez votre prénom.", form.querySelector("#prenom"));
    const tel = telNormal(champ("tel"));
    if (!tel) return signaler("Ce numéro ne semble pas complet : 10 chiffres, par exemple 06 12 34 56 78.", form.querySelector("#tel"));
    const email = champ("email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return signaler("Cette adresse e-mail ne semble pas valide.", form.querySelector("#email"));
    if (!form.present.checked) return signaler("Cochez l'engagement : décrocher à l'appel et être présent le jour de la visite.");
    if (!form.accord.checked) return signaler("Cochez la case pour qu'on puisse vous rappeler.");

    const demande = {
      page: PAGE,
      name: [champ("prenom"), champ("nom")].filter(Boolean).join(" "),
      phone: tel,
      email: email || null,
      consent: true,
      answers: {
        "Département": valeur("departement"),
        "Travaux": valeur("travaux"),
        "Délai": valeur("delai"),
        "Budget": valeur("budget"),
        "Rendez-vous": valeur("rdv") === "creneau" && creneauChoisi ? `Créneau choisi : ${creneauChoisi}` : "Rappel dans l'heure pour fixer la visite",
        "Présence": "S'engage à décrocher et à être présent le jour de la visite",
        "Précisions": champ("precisions"),
        "Provenance": "Page avant formulaire",
        "Publicité": publicite,
      },
    };

    if (!ENDPOINT) { console.info("Aperçu, demande non envoyée :", demande); fin(champ("prenom"), tel); return; }

    bouton.disabled = true;
    bouton.textContent = "Envoi…";
    try {
      const r = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${CLE_PUBLIQUE}`, apikey: CLE_PUBLIQUE }, body: JSON.stringify(demande) });
      const rep = await r.json().catch(() => ({}));
      if (!r.ok || !rep.ok) throw new Error(rep.reason || `statut ${r.status}`);
      fin(champ("prenom"), tel);
    } catch {
      bouton.disabled = false;
      bouton.textContent = "Valider ma demande";
      signaler("L'envoi n'a pas marché. Réessayez dans un instant, ou écrivez-nous à contact@lecompagnonrobin.fr.");
    }
  });

  function fin(prenom, tel) {
    merci.querySelector("[data-merci-prenom]").textContent = prenom || "merci";
    merci.querySelector("[data-merci-tel]").textContent = tel ? telAffiche(telNormal(tel) || tel) : "numéro indiqué";
    const soi = valeur("rdv") === "creneau" && creneauChoisi;
    merci.querySelector("[data-merci-creneau]").textContent = creneauChoisi;
    montrer(merci.querySelector(".merci-rdv"), !!soi);
    montrer(merci.querySelector(".merci-rappel"), !soi);
    form.hidden = true;
    ["formulaire-intro", "progression", "etape-compteur"].forEach((c) => montrer(document.querySelector(`.${c}`), false));
    merci.hidden = false;
    if (window.mesurerDemande) window.mesurerDemande(); // pixel Meta : événement Lead, seulement si le visiteur a accepté
    merci.focus();
    merci.scrollIntoView({ block: "center", behavior: calme ? "auto" : "smooth" });
  }

  aller(1);
  // Pas de saut de page au chargement : on enlève le focus mis sur la première question
  document.activeElement?.blur?.();
})();
