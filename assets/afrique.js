document.addEventListener('DOMContentLoaded', () => {
    const WEBHOOK_URL = 'https://automate.rapideagency.com/webhook/ra-afrique-lead';
    const form = document.getElementById('afriqueForm');
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successContainer = document.getElementById('successContainer');
    const successDetails = document.getElementById('successDetails');

    // Lire les paramètres URL
    const urlParams = new URLSearchParams(window.location.search);
    const agentCode = urlParams.get('agent') || null;
    const agentName = urlParams.get('agentName') || null;
    const partnerCode = urlParams.get('partner') || null;
    const partnerName = urlParams.get('partnerName') || null;
    const source = urlParams.get('source') || 'terrain';

    // Gestion de la soumission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Désactiver le bouton
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi...';
        errorMessage.classList.remove('show');
        successContainer.style.display = 'none';

        // Collecter les données du formulaire
        const emailValue = document.getElementById('email').value.trim();
        
        const payload = {
            agentCode: agentCode,
            agentName: agentName,
            partnerCode: partnerCode,
            partnerName: partnerName,
            pays: 'Cameroun',
            ville: document.getElementById('ville').value,
            societe: document.getElementById('societe').value.trim(),
            contact: document.getElementById('contact').value.trim(),
            whatsapp: document.getElementById('whatsapp').value.trim(),
            email: emailValue || null,
            secteur: document.getElementById('secteur').value,
            besoin: Array.from(document.querySelectorAll('input[name="besoin"]:checked')).map(cb => cb.value),
            budget: document.getElementById('budget').value,
            urgence: document.getElementById('urgence').value,
            source: source
        };

        // Logger le payload avant l'envoi
        console.log('Payload à envoyer:', JSON.stringify(payload, null, 2));

        try {
            // Envoi vers le webhook
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Succès
                const responseData = await response.json().catch(() => ({}));
                showSuccess(responseData, payload);
                form.reset();
            } else {
                // Erreur HTTP
                const errorText = await response.text().catch(() => 'Erreur inconnue');
                const errorMsg = `Erreur serveur (${response.status}): ${errorText}`;
                showError(errorMsg);
                alert(`Erreur lors de l'envoi:\n\n${errorMsg}`);
            }
        } catch (error) {
            // Erreur réseau/CORS
            console.error('Erreur lors de l\'envoi:', error);
            let errorMsg = '';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMsg = 'Erreur réseau ou CORS. Vérifiez votre connexion et que le webhook est accessible.';
            } else {
                errorMsg = `Erreur: ${error.message}`;
            }
            showError(errorMsg);
            alert(`Erreur réseau:\n\n${errorMsg}\n\nVérifiez votre connexion internet et réessayez.`);
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

