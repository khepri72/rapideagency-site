document.addEventListener('DOMContentLoaded', () => {
    const WEBHOOK_URL = 'https://automate.rapideagency.com/webhook/ra-afrique-lead';
    const form = document.getElementById('afriqueForm');
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successContainer = document.getElementById('successContainer');
    const successDetails = document.getElementById('successDetails');

    // Lire les paramètres URL
    const urlParams = new URLSearchParams(window.location.search);
    const agentId = urlParams.get('agent') || 'DEFAULT';
    const source = urlParams.get('source') || 'terrain';

    // Pré-remplir les champs cachés
    document.getElementById('agentId').value = agentId;
    document.getElementById('source').value = source;

    // Gestion de la soumission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Désactiver le bouton
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi...';
        errorMessage.classList.remove('show');
        successContainer.style.display = 'none';

        // Collecter les données du formulaire
        const formData = {
            agentId: document.getElementById('agentId').value,
            source: document.getElementById('source').value,
            societe: document.getElementById('societe').value.trim(),
            contact: document.getElementById('contact').value.trim(),
            whatsapp: document.getElementById('whatsapp').value.trim(),
            email: document.getElementById('email').value.trim() || '',
            ville: document.getElementById('ville').value,
            pays: 'Cameroun',
            secteur: document.getElementById('secteur').value,
            besoin: Array.from(document.querySelectorAll('input[name="besoin"]:checked')).map(cb => cb.value),
            budget: document.getElementById('budget').value,
            urgence: document.getElementById('urgence').value
        };

        try {
            // Envoi vers le webhook
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Succès
                const responseData = await response.json().catch(() => ({}));
                showSuccess(responseData, formData);
                form.reset();
            } else {
                // Erreur HTTP
                const errorText = await response.text().catch(() => 'Erreur inconnue');
                showError(`Erreur serveur (${response.status}): ${errorText}`);
            }
        } catch (error) {
            // Erreur réseau/CORS
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showError('Erreur réseau ou CORS. Vérifiez votre connexion et que le webhook est accessible.');
            } else {
                showError(`Erreur: ${error.message}`);
            }
            console.error('Erreur lors de l\'envoi:', error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer ma demande →';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        successContainer.style.display = 'none';
    }

    function showSuccess(responseData, formData) {
        let html = '';

        // Afficher score si présent (y compris score=0)
        if (responseData.score !== undefined) {
            html += `<div class="score-display"><strong>Score:</strong> ${responseData.score}%</div>`;
        }

        // Afficher offre si présente
        if (responseData.offre) {
            html += `<div class="offre-display"><strong>Offre:</strong> ${responseData.offre}</div>`;
        }

        // Si pas de score/offre, afficher message par défaut
        if (responseData.score === undefined && !responseData.offre) {
            html += '<p>Prospect envoyé avec succès !</p>';
        }

        // Afficher la réponse JSON brute (formatée)
        html += '<h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Réponse du serveur:</h4>';
        html += `<pre>${JSON.stringify(responseData, null, 2)}</pre>`;

        successDetails.innerHTML = html;
        successContainer.style.display = 'block';

        // Scroll vers le résultat
        successContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

