document.addEventListener('DOMContentLoaded', () => {
  // =========================
  // CONFIG N8N (à jour)
  // =========================
  const WEBHOOK_URL = "https://automate.rapideagency.com/webhook/bbded44c-b624-47b9-bfad-8403db6c20cf"; // URL PRODUCTION
  const SECRET = "RAPIDE_SECRET_2025"; // doit correspondre à l'IF dans n8n

  // =========================
  // UTIL: Smooth scroll
  // =========================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const el = document.querySelector(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // =========================
  // UTIL: Envoi vers n8n
  // =========================
  async function sendToN8n(kind, data) {
    try {
      const payload = {
        ...data,
        kind,                 // "diagnostic" ou "contact"
        secret_key: SECRET,   // vérifié par ton IF n8n
        source: "Website"     // pratique pour filtrer côté n8n/Airtable
      };
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (err) {
      console.error("Webhook error:", err);
      return false;
    }
  }

  // =========================
  // DIAGNOSTIC (via fetch)
  // =========================
  const diagnosticForm   = document.getElementById('diagnosticForm');
  const resultsContainer = document.getElementById('results');
  const spinnerContainer = document.querySelector('.spinner-container');
  const successMessage   = document.getElementById('successMessage');

  if (diagnosticForm) {
    diagnosticForm.addEventListener('submit', async (e) => {
      // IMPORTANT : on annule l’envoi HTML natif (action/iframe) pour tout gérer en fetch
      e.preventDefault();

      const formData = {
        company:   document.getElementById('company')?.value || "",
        email:     document.getElementById('email')?.value || "",
        sector:    document.getElementById('sector')?.value || "",
        employees: document.getElementById('employees')?.value || "",
        processes: document.getElementById('processes')?.value || "",
      };

      // --- Scoring identique à ta logique ---
      let score = 0;
      const highValueSectors = ['E-commerce','Services professionnels','Transport/Logistique','Industrie'];
      score += highValueSectors.includes(formData.sector) ? 35 : 20;

      const employeeScores = { '1-5': 10, '6-15': 20, '16-50': 30, '51-100': 25, '100+': 20 };
      score += employeeScores[formData.employees] || 0;

      const keywords = ['facturation','email','crm','rapport','inventaire','client','commande','stock','comptabilité','gestion','saisie','copier','coller'];
      const matched = keywords.filter(k => (formData.processes || "").toLowerCase().includes(k));
      score += Math.min(matched.length * 5, 35);

      const finalScore = Math.min(score, 95);

      // UI: spinner ON
      if (spinnerContainer) spinnerContainer.style.display = 'block';
      if (resultsContainer) resultsContainer.style.display = 'none';

      // Envoi vers n8n (avec secret) ✅
      const ok = await sendToN8n("diagnostic", { ...formData, score: finalScore });

      // UI: affichage résultat + animation du score
      setTimeout(() => {
        if (spinnerContainer) spinnerContainer.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'block';

        const scoreValueEl = document.getElementById('scoreValue');
        const scoreCircle  = document.querySelector('.score-circle');
        if (scoreCircle) scoreCircle.style.setProperty('--score', finalScore);
        let current = 0;
        const it = setInterval(() => {
          if (current >= finalScore) return clearInterval(it);
          current++;
          if (scoreValueEl) scoreValueEl.textContent = `${current}%`;
        }, 20);

        displayRecommendation(finalScore);

        // Pré-remplir le formulaire Contact
        const contactEmail = document.getElementById('contactEmail');
        const contactName  = document.getElementById('contactName');
        if (contactEmail) contactEmail.value = formData.email;
        if (contactName)  contactName.value  = "Dirigeant de " + formData.company;

        if (ok && successMessage) successMessage.style.display = 'block';
      }, 800);
    });
  }

  // =========================
  // Recommandations (inchangé)
  // =========================
  function displayRecommendation(score) {
    const recommendationEl = document.getElementById('recommendation');
    const packageEl = document.getElementById('package');
    let recTitle, recText, packTitle, packItems;

    if (score >= 70) {
      recTitle = '🚀 Potentiel Excellent !';
      recText  = "Votre entreprise a un potentiel d'automatisation très élevé. Nous pouvons transformer vos opérations.";
      packTitle = 'Actions Recommandées : Stratégie Complète';
      packItems = [
        "Audit approfondi de vos processus critiques (vente, facturation, support...).",
        "Déploiement d'une solution sur mesure pour maximiser votre ROI.",
        "Formation de vos équipes pour une adoption immédiate.",
      ];
    } else if (score >= 45) {
      recTitle = '📈 Bon Potentiel';
      recText  = "Plusieurs processus clés peuvent être optimisés rapidement pour un gain de temps et d'efficacité significatif.";
      packTitle = 'Actions Recommandées : Gains Rapides';
      packItems = [
        "Automatisation de 2 à 3 processus prioritaires (ex: gestion des emails entrants, suivi des devis).",
        "Intégration de vos outils existants pour éliminer la double saisie.",
        "Création de rapports automatisés pour un meilleur pilotage.",
      ];
    } else {
      recTitle = '✓ Potentiel Présent';
      recText  = "Commençons par automatiser vos tâches les plus simples et répétitives pour un premier gain immédiat.";
      packTitle = 'Actions Recommandées : Premier Pas';
      packItems = [
        "Identification et automatisation d'une tâche chronophage et répétitive.",
        "Mise en place d'un système de notification pour ne plus rater d'opportunités.",
        "Conseils pour structurer vos données en vue de futures automatisations.",
      ];
    }

    if (recommendationEl) recommendationEl.innerHTML = `<h4>${recTitle}</h4><p>${recText}</p>`;
    if (packageEl) {
      packageEl.innerHTML = `
        <h5>${packTitle}</h5>
        <ul>${packItems.map(item => `<li>${item}</li>`).join('')}</ul>
        <p style="margin-top:1rem;font-weight:bold;color:var(--blue);">
          Pour discuter de ces actions et obtenir une estimation personnalisée, réservez un appel stratégique gratuit.
        </p>
      `;
    }
  }

  // =========================
  // CONTACT (via fetch aussi)
  // =========================
  const contactForm = document.getElementById('contactForm');
  const contactSuccessMessage = document.getElementById('contactSuccessMessage');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const contactData = {
        name:    document.getElementById('contactName')?.value || "",
        email:   document.getElementById('contactEmail')?.value || "",
        message: document.getElementById('contactMessage')?.value || "",
      };
      const btn = contactForm.querySelector('button');
      if (btn) { btn.textContent = 'Envoi en cours...'; btn.disabled = true; }
      const ok = await sendToN8n("contact", contactData);
      if (ok && contactSuccessMessage) contactSuccessMessage.style.display = 'block';
      if (btn) btn.style.display = 'none';
    });
  }
});
