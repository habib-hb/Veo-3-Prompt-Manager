document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. STATE MANAGEMENT ---
    
    // Initial Default Data
    const defaultData = {
        shotSize: ["Extreme Close-Up (ECU)", "Close-Up (CU)", "Medium Close-Up (MCU)", "Medium Shot (MS)", "Medium Full Shot (MFS)", "Full Shot (FS)", "Wide Shot (WS)", "Extreme Wide Shot (EWS)"],
        cameraAngle: ["Eye-Level", "High Angle", "Low Angle", "Dutch Angle", "Over-the-Shoulder (OTS)", "Point-of-View (POV)"],
        movement: ["Static Shot", "Pan", "Tilt", "Dolly-In", "Dolly-Out", "Tracking Shot", "Crane Shot", "Handheld"],
        lens: ["Shallow Depth of Field", "Deep Focus", "100mm+ Telephoto Lens", "15-24mm Wide Angle Lens", "Rack Focus"],
        subjectDetails: ["Young Adult (20s)", "Elderly", "Child", "Stoic Expression", "Terrified Expression", "Ecstatic Expression"],
        actionDetails: ["Striding", "Limping", "Sneaking", "Slowly", "Hesitantly", "Aggressively"],
        environment: ["1980s New York", "Victorian London", "Mars Colony", "Heavy Rain", "Thick Fog", "Blizzard"],
        setDressing: ["Crowded", "Empty", "Neon Signs", "Debris/Ruins"],
        artStyle: ["Hyper-realistic", "Photorealistic", "Cinematic 35mm", "Synthwave", "Ghibli Style", "Cyberpunk Anime", "Claymation", "Film Noir", "Wes Anderson Style", "Analog Film Grain"],
        lighting: ["Golden Hour", "Blue Hour", "Hard Light", "Soft Diffused Light", "Rim Lighting", "Chiaroscuro"],
        audioConstraints: ["(No text overlay, no subtitles)", "(No music, only SFX)", "(Aspect Ratio 9:16)", "Cinematic Score", "Ambient SFX"]
    };

    // Current State (loaded from LS or Defaults)
    let appData = {};
    let activeSelections = {}; // To track what is currently selected

    function loadState() {
        const storedData = localStorage.getItem('veo3_options_data');
        if (storedData) {
            appData = JSON.parse(storedData);
            // Merge defaults if new categories exist (simple safety check)
            for (let key in defaultData) {
                if (!appData[key]) appData[key] = defaultData[key];
            }
        } else {
            appData = JSON.parse(JSON.stringify(defaultData)); // Deep copy
        }
    }

    function saveState() {
        localStorage.setItem('veo3_options_data', JSON.stringify(appData));
    }

    // --- 2. RENDER LOGIC ---

    function renderAllSections() {
        for (const [categoryKey, options] of Object.entries(appData)) {
            renderSection(categoryKey);
        }
    }

    function renderSection(categoryKey) {
        const container = document.querySelector(`.card[data-category="${categoryKey}"] .options-grid`);
        if (!container) return;

        container.innerHTML = '';
        
        appData[categoryKey].forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.dataset.value = option;
            
            // Restore selection state if active
            if (activeSelections[categoryKey] && activeSelections[categoryKey].includes(option)) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                updateSelectionState(categoryKey, option, btn.classList.contains('active'));
                generatePrompt();
            });

            container.appendChild(btn);
        });
    }

    function updateSelectionState(category, value, isSelected) {
        if (!activeSelections[category]) activeSelections[category] = [];
        
        if (isSelected) {
            if (!activeSelections[category].includes(value)) activeSelections[category].push(value);
        } else {
            activeSelections[category] = activeSelections[category].filter(item => item !== value);
        }
    }

    // --- 3. MODAL LOGIC (ADD/DELETE) ---

    const modalOverlay = document.getElementById('modal-overlay');
    const addModal = document.getElementById('add-modal');
    const deleteModal = document.getElementById('delete-modal');
    const newOptionInput = document.getElementById('new-option-input');
    
    let currentCategoryContext = null;

    // Open Add Modal
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentCategoryContext = btn.closest('.card').dataset.category;
            openModal(addModal);
            newOptionInput.value = '';
            newOptionInput.focus();
        });
    });

    // Handle Add Confirm
    document.getElementById('confirm-add').addEventListener('click', () => {
        const newVal = newOptionInput.value.trim();
        if (newVal && currentCategoryContext) {
            appData[currentCategoryContext].push(newVal);
            saveState();
            renderSection(currentCategoryContext);
            closeModal();
        }
    });

    // Open Delete Modal
    document.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentCategoryContext = btn.closest('.card').dataset.category;
            populateDeleteList(currentCategoryContext);
            openModal(deleteModal);
        });
    });

    function populateDeleteList(category) {
        const listContainer = document.getElementById('delete-list');
        listContainer.innerHTML = '';
        
        appData[category].forEach(option => {
            const item = document.createElement('div');
            item.className = 'delete-item';
            
            const text = document.createElement('span');
            text.textContent = option;
            
            const delBtn = document.createElement('button');
            delBtn.className = 'remove-option-btn';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.addEventListener('click', () => {
                // Remove from data
                appData[category] = appData[category].filter(o => o !== option);
                // Remove from active selections if present
                if(activeSelections[category]) {
                    activeSelections[category] = activeSelections[category].filter(o => o !== option);
                }
                saveState();
                renderSection(category); // Re-render main grid
                populateDeleteList(category); // Re-render modal list
                generatePrompt(); // Update prompt output
            });

            item.appendChild(text);
            item.appendChild(delBtn);
            listContainer.appendChild(item);
        });
    }

    // Common Modal Functions
    function openModal(modalEl) {
        modalOverlay.classList.remove('hidden');
        document.querySelectorAll('.modal-content').forEach(el => el.classList.add('hidden'));
        modalEl.classList.remove('hidden');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        currentCategoryContext = null;
    }

    document.getElementById('cancel-add').addEventListener('click', closeModal);
    document.getElementById('close-delete').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // --- 4. GENERATION LOGIC ---

    function generatePrompt() {
        const sections = document.querySelectorAll('.prompt-section');
        let fullPrompt = "";

        sections.forEach(section => {
            const sectionKey = section.getAttribute('data-key');
            
            // Gather text inputs
            const textVal = section.querySelector('.extra-details').value.trim();
            
            // Gather selected buttons via DOM (simpler than syncing state for this purpose)
            const inputs = [];
            const activeBtns = section.querySelectorAll('.option-btn.active');
            activeBtns.forEach(btn => inputs.push(btn.textContent)); // Use textContent for exact match

            if (textVal) inputs.push(textVal);

            if (inputs.length > 0) {
                const sectionContent = inputs.join(', ');
                fullPrompt += `[${sectionKey}]: ${sectionContent}\n\n`;
            }
        });

        const promptOutput = document.getElementById('generated-prompt');
        if (fullPrompt.trim() === "") {
            promptOutput.textContent = "Your Generated Prompt will be shown here.";
            promptOutput.style.color = "#555";
        } else {
            promptOutput.textContent = fullPrompt.trim();
            promptOutput.style.color = "#00ff88";
            // Auto-scroll to bottom
            promptOutput.scrollTop = promptOutput.scrollHeight;
        }
    }

    // Text Input Listener
    document.querySelectorAll('.extra-details').forEach(input => {
        input.addEventListener('input', generatePrompt);
    });

    // Copy to Clipboard
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.addEventListener('click', () => {
        const text = document.getElementById('generated-prompt').textContent;
        if (!text.startsWith("Your Generated Prompt")) {
            navigator.clipboard.writeText(text);
            const original = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = original, 2000);
            
            addToHistory(text);
        }
    });

    // --- 5. HISTORY MANAGEMENT ---
    let historyData = [];
    const historySidebar = document.getElementById('history-sidebar');
    const historyList = document.getElementById('history-list');

    function loadHistory() {
        const stored = localStorage.getItem('veo3_prompt_history');
        if (stored) {
            historyData = JSON.parse(stored);
            renderHistory();
        }
    }

    function saveHistory() {
        localStorage.setItem('veo3_prompt_history', JSON.stringify(historyData));
    }

    function addToHistory(fullText) {
        // Extract Subject Title
        let title = "Untitled Prompt";
        const subjectMatch = fullText.match(/\[Subject\]: (.*)/);
        if (subjectMatch) {
            // Get first 3 words
            const words = subjectMatch[1].split(' ');
            title = words.slice(0, 3).join(' ') + (words.length > 3 ? "..." : "");
        } else {
            // Fallback: First 3 words of the whole text
            const words = fullText.split(' ');
            title = words.slice(0, 3).join(' ') + "...";
        }
        
        // Extract Hover Preview (First 50 words of Subject)
        let preview = "";
        if (subjectMatch) {
             const words = subjectMatch[1].split(' ');
             preview = words.slice(0, 50).join(' ') + (words.length > 50 ? "..." : "");
        }

        const newItem = {
            id: Date.now(),
            title: title,
            preview: preview || "No subject details.",
            fullText: fullText,
            timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
        };

        historyData.unshift(newItem); // Add to top
        if (historyData.length > 50) historyData.pop(); // Limit size
        saveHistory();
        renderHistory();
        
        // Optional: Open sidebar to show it was saved? 
        // User didn't ask, but it's good feedback. Let's not prompt intrusive behavior though.
        // Maybe just a small notification? The Copy button "Copied!" is enough.
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (historyData.length === 0) {
            historyList.innerHTML = '<p style="color: grey; text-align: center; margin-top: 2rem;">No history yet.</p>';
            return;
        }

        historyData.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            
            // Tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'history-tooltip';
            tooltip.textContent = item.preview;
            
            const titleEl = document.createElement('div');
            titleEl.className = 'history-item-title';
            titleEl.textContent = item.title;
            
            const dateEl = document.createElement('div');
            dateEl.className = 'history-item-date';
            dateEl.textContent = item.timestamp;
            
            el.appendChild(titleEl);
            el.appendChild(dateEl);
            el.appendChild(tooltip);
            
            el.addEventListener('click', () => {
                restorePrompt(item.fullText);
                historySidebar.classList.remove('open'); // Auto close on select
            });
            
            historyList.appendChild(el);
        });
    }

    function restorePrompt(fullText) {
        // 1. Reset State
        activeSelections = {}; 
        document.querySelectorAll('.extra-details').forEach(el => el.value = '');
        
        // 2. Parse Blocks
        const blocks = fullText.split('\n\n');
        
        blocks.forEach(block => {
            const match = block.match(/^\[(.*?)\]: ([\s\S]*)$/);
            if(!match) return;
            
            const sectionKey = match[1];
            const content = match[2];
            
            const sectionEl = document.querySelector(`.prompt-section[data-key="${sectionKey}"]`);
            if(!sectionEl) return;
            
            // 3. Smart Matching Loop
            const parts = content.split(', ');
            let remainingText = [];
            let findingOptions = true;
            
            // Get all categories in this section
            const catKeys = [];
            sectionEl.querySelectorAll('.card').forEach(card => {
                if(card.dataset.category) catKeys.push(card.dataset.category);
            });
            
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i].trim();

                if (findingOptions) {
                    let foundMatch = false;

                    // A. Try exact match
                    for (const catKey of catKeys) {
                        const opts = appData[catKey];
                        if (opts && opts.includes(part)) {
                            updateSelectionState(catKey, part, true);
                            foundMatch = true;
                            break; 
                        }
                    }
                    
                    // B. Try matching with next part (for options containing a comma)
                    if (!foundMatch && i + 1 < parts.length) {
                         const merged = part + ", " + parts[i+1].trim();
                         for (const catKey of catKeys) {
                            const opts = appData[catKey];
                            if (opts && opts.includes(merged)) {
                                updateSelectionState(catKey, merged, true);
                                foundMatch = true;
                                i++; // Skip the next part as it's used here
                                break; 
                            }
                        }
                    }
                    
                    if (!foundMatch) {
                        findingOptions = false; // Switch to text mode
                        remainingText.push(part);
                    }
                } else {
                    remainingText.push(part);
                }
            }
            
            // Fill Textarea
            if (remainingText.length > 0) {
                 const ta = sectionEl.querySelector('.extra-details');
                 if(ta) ta.value = remainingText.join(', ');
            }
        });
        
        // 3. Update UI
        renderAllSections();
        generatePrompt();
    }

    // Toggle Listeners
    const toggleBtn = document.getElementById('history-toggle-btn');
    const closeBtn = document.getElementById('history-close-btn');
    
    if(toggleBtn) toggleBtn.addEventListener('click', () => {
        historySidebar.classList.add('open');
        renderHistory(); // Ensure fresh render
    });
    
    if(closeBtn) closeBtn.addEventListener('click', () => historySidebar.classList.remove('open'));

    // Load initial
    loadHistory();

    // --- INIT ---
    loadState();
    renderAllSections();
    
    // GSAP
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-content', { y: 20, opacity: 0, duration: 1 });
});
