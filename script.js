document.addEventListener('DOMContentLoaded', function() {
    // DOM Elementy
    const createPollBtn = document.getElementById('createPollBtn');
    const createPollEmptyBtn = document.getElementById('createPollEmptyBtn');
    const createPollModal = document.getElementById('createPollModal');
    const closeModal = document.getElementById('closeModal');
    const pollForm = document.getElementById('pollForm');
    const addOptionBtn = document.getElementById('addOptionBtn');
    const pollOptionsContainer = document.getElementById('pollOptionsContainer');
    const activePollsContainer = document.getElementById('activePollsContainer');
    const completedPollsContainer = document.getElementById('completedPollsContainer');
    const activeEmptyState = document.getElementById('activeEmptyState');
    const completedEmptyState = document.getElementById('completedEmptyState');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const voterModal = document.getElementById('voterModal');
    const voterForm = document.getElementById('voterForm');
    const closeVoterModal = document.getElementById('closeVoterModal');
    const voterNameInput = document.getElementById('voterName');
    const selectedPollIdInput = document.getElementById('selectedPollId');
    const selectedOptionIndexInput = document.getElementById('selectedOptionIndex');

    // Data hlasování - s řádným zpracováním data
    let polls = JSON.parse(localStorage.getItem('polls')) || [];
    let voters = JSON.parse(localStorage.getItem('voters')) || {};

    // Převod řetězců dat zpět na objekty Date při načítání
    polls = polls.map(poll => {
        return {
            ...poll,
            createdAt: new Date(poll.createdAt)
        };
    });

    // Inicializace aplikace
    function init() {
        renderPolls();
        updateEmptyStates();
    }

    // Uložení dat do localStorage
    function saveData() {
        localStorage.setItem('polls', JSON.stringify(polls));
        localStorage.setItem('voters', JSON.stringify(voters));
    }

    // Vykreslení hlasování do UI - opravené zpracování data
    function renderPolls() {
        activePollsContainer.innerHTML = '';
        completedPollsContainer.innerHTML = '';

        const now = new Date();
        
        polls.forEach(poll => {
            // Ujistěte se, že createdAt je objekt Date
            const createdAt = new Date(poll.createdAt);
            
            // Aktualizace stavu hlasování na základě doby trvání
            if (poll.status === "active" && poll.duration > 0) {
                const endDate = new Date(createdAt.getTime() + poll.duration * 86400000);
                if (now > endDate) {
                    poll.status = "completed";
                    saveData();
                }
            }

            const pollElement = createPollElement(poll);
            
            if (poll.status === "active") {
                activePollsContainer.appendChild(pollElement);
            } else {
                completedPollsContainer.appendChild(pollElement);
            }
        });
    }

    // Vytvoření elementu hlasování - opravené zpracování data
    function createPollElement(poll) {
        const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
        const now = new Date();
        const createdAt = new Date(poll.createdAt);
        const endDate = new Date(createdAt.getTime() + poll.duration * 86400000);
        const timeRemaining = poll.duration > 0 ? Math.ceil((endDate - now) / 86400000) : "∞";
        
        const pollElement = document.createElement('div');
        pollElement.className = 'card poll-card';
        pollElement.dataset.id = poll.id;
        
        let optionsHTML = '';
        poll.options.forEach((option, index) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            optionsHTML += `
                <div class="option-item">
                    <input type="radio" name="pollOption_${poll.id}" id="option_${poll.id}_${index}" class="option-radio" ${poll.status === "completed" ? "disabled" : ""}>
                    <label for="option_${poll.id}_${index}" class="option-text">${option.text}</label>
                    <span class="option-percentage">${percentage}%</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        // Získání hlasujících pro toto hlasování
        const pollVoters = voters[poll.id] || [];
        const votersList = pollVoters.length > 0 ? 
            `<p><strong>Hlasující:</strong> ${pollVoters.join(', ')}</p>` : 
            '';
        
        pollElement.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${poll.title}</h3>
                <div class="badge ${poll.status === "active" ? "badge-primary" : "badge-success"}">
                    ${poll.status === "active" ? "Aktivní" : "Dokončeno"}
                </div>
            </div>
            ${poll.description ? `<p>${poll.description}</p>` : ''}
            ${votersList}
            
            <div class="poll-options">
                ${optionsHTML}
            </div>

            <div class="poll-results">
                <div class="result-item">
                    <div class="result-header">
                        <span class="result-label">Celkem hlasů:</span>
                        <span class="result-value">${totalVotes}</span>
                    </div>
                </div>
                <div class="result-item">
                    <div class="result-header">
                        <span class="result-label">${poll.status === "active" ? "Zbývající čas:" : "Ukončeno:"}</span>
                        <span class="result-value">${poll.status === "active" ? 
                            (poll.duration === 0 ? "Bez koncového data" : `${timeRemaining} ${timeRemaining !== 1 ? "dní" : "den"}`) : 
                            endDate.toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            ${poll.status === "active" ? `
                <button class="btn btn-primary submit-vote" style="width: 100%; margin-top: 1rem;" data-id="${poll.id}">
                    <i class="fas fa-vote-yea"></i> Odeslat hlas
                </button>
            ` : ''}
        `;
        
        return pollElement;
    }

    // Aktualizace prázdných stavů
    function updateEmptyStates() {
        const activePolls = polls.filter(poll => poll.status === "active").length;
        const completedPolls = polls.filter(poll => poll.status === "completed").length;
        
        activeEmptyState.style.display = activePolls === 0 ? "block" : "none";
        completedEmptyState.style.display = completedPolls === 0 ? "block" : "none";
    }

    // Zobrazení toast notifikace
    function showToast(message, type = "success") {
        toast.className = `toast ${type}`;
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Event Listenery
    createPollBtn.addEventListener('click', () => {
        createPollModal.classList.add('active');
    });

    createPollEmptyBtn.addEventListener('click', () => {
        createPollModal.classList.add('active');
    });

    closeModal.addEventListener('click', () => {
        createPollModal.classList.remove('active');
    });

    closeVoterModal.addEventListener('click', () => {
        voterModal.classList.remove('active');
    });

    // Zavření modálů při kliknutí mimo
    [createPollModal, voterModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Přidání vstupního pole pro možnost
    addOptionBtn.addEventListener('click', () => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'participant-item';
        optionDiv.style.marginBottom = '0.5rem';
        optionDiv.innerHTML = `
            <input type="text" class="form-control option-input" placeholder="Zadejte text možnosti" required>
            <button type="button" class="action-btn delete remove-option">
                <i class="fas fa-trash"></i>
            </button>
        `;
        pollOptionsContainer.appendChild(optionDiv);
        
        // Přidání event listeneru k novému tlačítku pro odstranění
        optionDiv.querySelector('.remove-option').addEventListener('click', () => {
            if (pollOptionsContainer.children.length > 2) {
                optionDiv.remove();
            } else {
                showToast("Hlasování musí mít alespoň 2 možnosti", "error");
            }
        });
    });

    // Odstranění vstupního pole pro možnost
    document.querySelectorAll('.remove-option').forEach(btn => {
        btn.addEventListener('click', function() {
            if (pollOptionsContainer.children.length > 2) {
                this.parentElement.remove();
            } else {
                showToast("Hlasování musí mít alespoň 2 možnosti", "error");
            }
        });
    });

    // Odeslání formuláře hlasování
    pollForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('pollTitle').value.trim();
        const description = document.getElementById('pollDescription').value.trim();
        const duration = parseInt(document.getElementById('pollDuration').value);
        
        // Získání možností
        const optionInputs = document.querySelectorAll('.option-input');
        const options = [];
        
        optionInputs.forEach(input => {
            if (input.value.trim()) {
                options.push({
                    text: input.value.trim(),
                    votes: 0
                });
            }
        });
        
        if (options.length < 2) {
            showToast("Přidejte prosím alespoň 2 možnosti", "error");
            return;
        }
        
        // Vytvoření nového hlasování
        const newPoll = {
            id: polls.length > 0 ? Math.max(...polls.map(p => p.id)) + 1 : 1,
            title,
            description,
            options,
            createdAt: new Date(),
            duration,
            status: "active"
        };
        
        polls.push(newPoll);
        if (!voters[newPoll.id]) {
            voters[newPoll.id] = [];
        }
        saveData();
        renderPolls();
        updateEmptyStates();
        
        // Reset formuláře
        pollForm.reset();
        pollOptionsContainer.innerHTML = `
            <div class="participant-item" style="margin-bottom: 0.5rem;">
                <input type="text" class="form-control option-input" placeholder="Zadejte text možnosti" required>
                <button type="button" class="action-btn delete remove-option">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="participant-item" style="margin-bottom: 0.5rem;">
                <input type="text" class="form-control option-input" placeholder="Zadejte text možnosti" required>
                <button type="button" class="action-btn delete remove-option">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Opětovné přidání event listenerů k tlačítkům pro odstranění
        document.querySelectorAll('.remove-option').forEach(btn => {
            btn.addEventListener('click', function() {
                if (pollOptionsContainer.children.length > 2) {
                    this.parentElement.remove();
                } else {
                    showToast("Hlasování musí mít alespoň 2 možnosti", "error");
                }
            });
        });
        
        createPollModal.classList.remove('active');
        showToast("Hlasování bylo úspěšně vytvořeno!");
    });

    // Přepínání záložek
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Příprava k odeslání hlasu
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('submit-vote') || e.target.closest('.submit-vote')) {
            const pollId = parseInt(e.target.dataset.id || e.target.closest('.submit-vote').dataset.id);
            const poll = polls.find(p => p.id === pollId);
            const selectedOption = document.querySelector(`input[name="pollOption_${pollId}"]:checked`);
            
            if (!selectedOption) {
                showToast("Vyberte prosím možnost pro hlasování", "error");
                return;
            }
            
            const optionIndex = parseInt(selectedOption.id.split('_')[2]);
            
            // Uložení vybraného hlasování a možnosti
            selectedPollIdInput.value = pollId;
            selectedOptionIndexInput.value = optionIndex;
            
            // Zobrazení modálu pro jméno hlasujícího
            voterModal.classList.add('active');
            voterNameInput.focus();
        }
    });

    // Odeslání hlasu se jménem hlasujícího
    voterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const pollId = parseInt(selectedPollIdInput.value);
        const optionIndex = parseInt(selectedOptionIndexInput.value);
        const voterName = voterNameInput.value.trim();
        
        if (!voterName) {
            showToast("Zadejte prosím své jméno", "error");
            return;
        }
        
        const poll = polls.find(p => p.id === pollId);
        
        // Kontrola, zda tento hlasující již hlasoval
        if (voters[pollId] && voters[pollId].includes(voterName)) {
            showToast("V tomto hlasování jste již hlasovali", "error");
            voterModal.classList.remove('active');
            return;
        }
        
        // Zaznamenání hlasu
        poll.options[optionIndex].votes++;
        
        // Zaznamenání hlasujícího
        if (!voters[pollId]) {
            voters[pollId] = [];
        }
        voters[pollId].push(voterName);
        
        saveData();
        renderPolls();
        voterModal.classList.remove('active');
        voterForm.reset();
        showToast("Hlas byl úspěšně odeslán!");
    });

    // Initialize the app
    init();
});