document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. STATE MANAGEMENT ---
    
    // Initial Default Data
    const defaultData = {
        shotSize: ["Extreme Close-Up (ECU)", "Close-Up (CU)", "Medium Close-Up (MCU)", "Medium Shot (MS)", "Medium Full Shot (MFS)", "Full Shot (FS)", "Wide Shot (WS)", "Extreme Wide Shot (EWS)"],
        cameraAngle: ["Eye-Level", "High Angle", "Low Angle", "Dutch Angle", "Over-the-Shoulder (OTS)", "Point-of-View (POV)"],
        movement: ["Static Shot", "Pan", "Tilt", "Dolly-In", "Dolly-Out", "Tracking Shot", "Crane Shot", "Handheld", "Push In", "Pull Out", "Zoom", "Camera Roll", "Trucking Shot", "Arc Shot", "Boom Shot"],
        lens: ["Shallow Depth of Field", "Deep Focus", "Rack Focus", "Soft Focus", "Split Diopter", "Tilt Shift"],
        subjectDetails: ["Young Adult (20s)", "Elderly", "Child", "Man", "Woman", "A Teapot", "A Cat"],
        actionDetails: ["Striding", "Limping", "Sneaking", "Slowly", "Hesitantly", "Aggressively"],
        environment: ["1980s New York", "Victorian London", "Mars Colony", "Heavy Rain", "Thick Fog", "Blizzard"],
        setDressing: ["Crowded", "Empty", "Neon Signs", "Debris/Ruins"],
        artStyle: ["Hyper-realistic", "Photorealistic", "Cinematic 35mm", "Synthwave", "Ghibli Style", "Cyberpunk Anime", "Claymation", "Film Noir", "Wes Anderson Style", "Analog Film Grain", "Attack On Titan Anime", "Pixar", "Unreal Engine", "Batman Cartoon", "Tokyo Ghul Anime", "Arcane"],
        lighting: ["Hard Light", "Soft Diffused Light", "Rim Lighting", "Chiaroscuro", "Tungsten", "Golden Hour", "High Key Lighting", "Low Key Lighting", "Blue Hour", "Smart Side", "Lens Flares", "Bokeh", "Natural Light", "Artificial Light", "Ambient Lighting", "Motivated Lighting"],
        audioConstraints: ["(No text overlay, no subtitles)", "(No music, only SFX)", "(No Vocals)", "Vocals", "Background Music", "Ambience (Environmental Sounds)", "Foley SFX", "Creative SFX", "Absence of Sound (Silence)", "Panning", "L Cut", "J Cut", "EQ (Equalization)"],
        transitions: ["The Cut", "The Fade", "Fade from Black", "Fade to Black", "Dip to Black", "Fade to White", "The Dissolve", "Superimposition", "Match Cut", "Match Dissolve", "The Iris", "The Wipe", "The Passing Transition", "Whip Pan", "Smash Cut", "J-Cut", "L-Cut"],
        motionBlur: ["Standard Motion Blur", "No Motion Blur", "High Motion Blur", "Long Exposure", "Shutter Angle 180°", "Shutter Angle 90° (Action)", "Shutter Angle 45° (Choppy)", "Shutter Angle 360° (Dreamy)"],
        aspectRatio: ["16:9 (Widescreen)", "9:16 (Vertical)", "1:1 (Square)", "4:3 (Classic TV)", "2.39:1 (Anamorphic)", "21:9 (Ultra Wide)"],
        colorPalettes: ["Monochromatic", "Analogous", "Complementary", "Split-Complementary", "Triadic", "Tetradic", "Warm Tones", "Cool Tones", "Pastel", "Neon/Cyberpunk", "Earth Tones", "Black & White", "Sepia", "Vintage/Retro", "High Contrast", "Muted/Desaturated"]
    };

    // Current State (loaded from LS or Defaults)
    let appData = {};
    
    // Split State for Video vs Image
    let currentMode = 'video';
    
    // Structure: { video: { category: [vals] }, image: { category: [vals] } }
    let activeSelections = {
        video: {},
        image: {}
    };
    
    // Structure: { video: { sectionKey: "text" }, image: { sectionKey: "text" } }
    let textInputsData = {
        video: {},
        image: {}
    };

    function loadState() {
        const storedOptions = localStorage.getItem('veo3_options_data');
        if (storedOptions) {
            appData = JSON.parse(storedOptions);
            // Merge defaults
            for (let key in defaultData) {
                if (!appData[key]) appData[key] = defaultData[key];
            }
        } else {
            appData = JSON.parse(JSON.stringify(defaultData));
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
            
            // Check active state based on CURRENT MODE
            const currentSelections = activeSelections[currentMode][categoryKey];
            if (currentSelections && currentSelections.includes(option)) {
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
        if (!activeSelections[currentMode][category]) activeSelections[currentMode][category] = [];
        
        if (isSelected) {
            if (!activeSelections[currentMode][category].includes(value)) {
                activeSelections[currentMode][category].push(value);
            }
        } else {
            activeSelections[currentMode][category] = activeSelections[currentMode][category].filter(item => item !== value);
        }
    }

    // --- 3. MODE SWITCHING LOGIC ---

    function initModeSwitcher() {
        const tabs = document.querySelectorAll('.mode-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const newMode = tab.dataset.mode;
                if(newMode !== currentMode) {
                    switchMode(newMode);
                }
            });
        });
        
        // Initial visibility check
        updateVisibilityForMode();
    }

    function switchMode(newMode) {
        // 1. Save current text inputs to state
        saveCurrentTextInputs();

        // 2. Update Mode
        currentMode = newMode;
        
        // 3. Update Tab UI
        document.querySelectorAll('.mode-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.mode === currentMode);
        });

        // 4. Update Visibility
        updateVisibilityForMode();

        // 5. Restore text inputs from new mode state
        restoreTextInputs();

        // 6. Re-render selections (visual active state)
        renderAllSections();

        // 7. Regenerate Prompt
        generatePrompt();
    }

    function updateVisibilityForMode() {
        // 1. Toggle Element Visibility
        const allElements = document.querySelectorAll('[data-mode-specific]');
        allElements.forEach(el => {
            const specificMode = el.dataset.modeSpecific;
            if (specificMode === currentMode) {
                el.classList.remove('hidden-mode');
                el.style.display = '';
            } else {
                el.classList.add('hidden-mode');
            }
        });

        // 2. Special Layout Adjustments (Lighting Full Width in Image Mode)
        const lightingCard = document.querySelector('.card[data-category="lighting"]');
        if (lightingCard) {
            if (currentMode === 'image') {
                lightingCard.classList.add('full-width-card');
            } else {
                lightingCard.classList.remove('full-width-card');
            }
        }

        // 3. Update Section Numbering
        updateSectionNumbering();
    }

    function updateSectionNumbering() {
        const sections = document.querySelectorAll('.prompt-section');
        let counter = 1;
        
        sections.forEach(section => {
            // Check visibility
            // We use getComputedStyle because classList/style might not be enough if parent hides it, 
            // but here we control via hidden-mode class.
            if (section.classList.contains('hidden-mode') || section.style.display === 'none') {
                return; 
            }
            
            // Pseudo-sections (Foreground/Middle/Background) don't have numbered H2s usually, 
            // but let's check the H2 content pattern "X. Title"
            const h2 = section.querySelector('h2');
            if (h2) {
                // Regex to find "d. Title"
                const text = h2.textContent;
                if (text.match(/^\d+\./)) {
                    h2.textContent = text.replace(/^\d+\./, `${counter}.`);
                    counter++;
                }
            }
        });
    }

    function saveCurrentTextInputs() {
        document.querySelectorAll('.prompt-section').forEach(section => {
            const sectionKey = section.dataset.key;
            const textEl = section.querySelector(':scope > .extra-details');
            if(textEl) {
                if(!textInputsData[currentMode][sectionKey]) textInputsData[currentMode][sectionKey] = "";
                textInputsData[currentMode][sectionKey] = textEl.value;
            }
        });
    }

    function restoreTextInputs() {
        document.querySelectorAll('.prompt-section').forEach(section => {
            const sectionKey = section.dataset.key;
            const textEl = section.querySelector(':scope > .extra-details');
            if(textEl) {
                const val = textInputsData[currentMode][sectionKey] || "";
                textEl.value = val;
            }
        });
    }

    // --- 4. MODAL LOGIC (ADD/DELETE) ---

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
            delBtn.style.marginLeft = "auto"; 
            delBtn.addEventListener('click', () => {
                // Remove from data
                appData[category] = appData[category].filter(o => o !== option);
                
                // Remove from active selections (in BOTH modes to be safe)
                ['video', 'image'].forEach(m => {
                    if(activeSelections[m][category]) {
                        activeSelections[m][category] = activeSelections[m][category].filter(o => o !== option);
                    }
                });

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

    // --- 5. GENERATION LOGIC ---

    function generatePrompt() {
        const sections = document.querySelectorAll('.prompt-section');
        let fullPrompt = "";

        sections.forEach(section => {
            // SKIP elements hidden by current mode
            if (section.classList.contains('hidden-mode') || section.style.display === 'none') return;

            const sectionKey = section.getAttribute('data-key');
            
            // Gather text inputs
            const textEl = section.querySelector(':scope > .extra-details');
            const textVal = textEl ? textEl.value.trim() : "";
            
            // Gather selected buttons via DOM checking for active state
            const inputs = [];
            const activeBtns = section.querySelectorAll('.option-btn.active');
            activeBtns.forEach(btn => {
                // Double check if this card is hidden
                const card = btn.closest('.card');
                if (card && (card.classList.contains('hidden-mode') || card.style.display === 'none')) return;

                let val = btn.textContent;
                const category = card?.dataset.category;
                
                // Transitons suffix logic
                if (category === 'transitions' && !val.toLowerCase().endsWith(' transition')) {
                    val += " transition";
                }
                inputs.push(val);
            });

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
            promptOutput.scrollTop = promptOutput.scrollHeight;
        }
    }

    // Text Input Listener
    document.querySelectorAll('.extra-details').forEach(input => {
        input.addEventListener('input', () => {
             // Save immediately so state is consistent before any switch
             saveCurrentTextInputs();
             generatePrompt();
        });
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

    // --- 6. HISTORY MANAGEMENT ---
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
        let title = "Untitled Prompt";
        const subjectMatch = fullText.match(/\[Subject\]: (.*)/);
        if (subjectMatch) {
            const words = subjectMatch[1].split(' ');
            title = words.slice(0, 3).join(' ') + (words.length > 3 ? "..." : "");
        } else {
            const words = fullText.split(' ');
            title = words.slice(0, 3).join(' ') + "...";
        }
        
        let preview = "";
        if (subjectMatch) {
             const words = subjectMatch[1].split(' ');
             preview = words.slice(0, 50).join(' ') + (words.length > 50 ? "..." : "");
        }

        const newItem = {
            id: Date.now(),
            mode: currentMode, // Save the mode!
            title: title || "Untitled",
            preview: preview || "No subject details.",
            fullText: fullText,
            timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
        };

        historyData.unshift(newItem); 
        if (historyData.length > 50) historyData.pop();
        saveHistory();
        renderHistory();
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
            
            // Badge for Mode
            const badge = document.createElement('span');
            badge.textContent = item.mode === 'image' ? "IMG" : "VID";
            badge.style.fontSize = "0.7rem";
            badge.style.padding = "2px 6px";
            badge.style.borderRadius = "4px";
            badge.style.marginRight = "8px";
            badge.style.backgroundColor = item.mode === 'image' ? "var(--accent-secondary)" : "var(--accent-color)";
            badge.style.color = "#000";
            badge.style.fontWeight = "bold";

            const tooltip = document.createElement('div');
            tooltip.className = 'history-tooltip';
            tooltip.textContent = item.preview;
            
            const titleEl = document.createElement('div');
            titleEl.className = 'history-item-title';
            titleEl.appendChild(badge); // Prepend badge
            titleEl.append(item.title);
            
            const dateEl = document.createElement('div');
            dateEl.className = 'history-item-date';
            dateEl.textContent = item.timestamp;
            
            el.appendChild(titleEl);
            el.appendChild(dateEl);
            el.appendChild(tooltip);
            
            el.addEventListener('click', () => {
                restorePrompt(item.fullText, item.mode);
                historySidebar.classList.remove('open');
            });
            
            historyList.appendChild(el);
        });
    }

    function restorePrompt(fullText, modeToRestore) {
        // 1. Switch Mode if needed
        const targetMode = modeToRestore || 'video';
        if (targetMode !== currentMode) {
             switchMode(targetMode);
        }
        
        // 2. Reset Current Mode State
        activeSelections[currentMode] = {}; 
        textInputsData[currentMode] = {}; // Clear memory
        document.querySelectorAll('.extra-details').forEach(el => el.value = ''); // Clear UI
        
        // 3. Parse Blocks
        const blocks = fullText.split('\n\n');
        
        blocks.forEach(block => {
            const match = block.match(/^\[(.*?)\]: ([\s\S]*)$/);
            if(!match) return;
            
            const sectionKey = match[1];
            const content = match[2];
            
            const sectionEl = document.querySelector(`.prompt-section[data-key="${sectionKey}"]`);
            if(!sectionEl) return;
            
            // Smart Matching
            const parts = content.split(', ');
            let remainingText = [];
            let findingOptions = true;
            
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
                        let lookup = part;
                        
                        // Transition handling
                        if (catKey === 'transitions' && part.toLowerCase().endsWith(' transition')) {
                             lookup = part.substring(0, part.length - 11); 
                        }

                        if (opts && opts.includes(lookup)) {
                            updateSelectionState(catKey, lookup, true);
                            foundMatch = true;
                            break; 
                        }
                    }
                    
                    // B. Try matching with next part
                    if (!foundMatch && i + 1 < parts.length) {
                         const merged = part + ", " + parts[i+1].trim();
                         for (const catKey of catKeys) {
                            const opts = appData[catKey];
                            if (opts && opts.includes(merged)) {
                                updateSelectionState(catKey, merged, true);
                                foundMatch = true;
                                i++; 
                                break; 
                            }
                        }
                    }
                    
                    if (!foundMatch) {
                        findingOptions = false; 
                        remainingText.push(part);
                    }
                } else {
                    remainingText.push(part);
                }
            }
            
            if (remainingText.length > 0) {
                 const ta = sectionEl.querySelector('.extra-details');
                 if(ta) {
                     ta.value = remainingText.join(', ');
                     // Sync with our memory state
                     if(!textInputsData[currentMode][sectionKey]) textInputsData[currentMode][sectionKey] = "";
                     textInputsData[currentMode][sectionKey] = ta.value;
                 }
            }
        });
        
        // 4. Update UI
        renderAllSections(); 
        generatePrompt();
    }

    // Toggle Listeners
    const toggleBtn = document.getElementById('history-toggle-btn');
    const closeBtn = document.getElementById('history-close-btn');
    
    if(toggleBtn) toggleBtn.addEventListener('click', () => {
        historySidebar.classList.add('open');
        renderHistory(); 
    });
    
    if(closeBtn) closeBtn.addEventListener('click', () => historySidebar.classList.remove('open'));

    function saveSessionState() {
        const session = {
            activeSelections,
            textInputsData,
            currentMode
        };
        localStorage.setItem('veo3_session_data', JSON.stringify(session));
    }

    function loadSessionState() {
        const stored = localStorage.getItem('veo3_session_data');
        if (stored) {
            try {
                const session = JSON.parse(stored);
                if (session.activeSelections) activeSelections = session.activeSelections;
                if (session.textInputsData) textInputsData = session.textInputsData;
                if (session.currentMode) currentMode = session.currentMode;
            } catch (e) {
                console.error("Failed to load session", e);
            }
        }
    }

    // Hook auto-save to actions
    // 1. Selection interaction
    // We need to inject saveSessionState() into updateSelectionState
    const originalUpdateSelection = updateSelectionState;
    updateSelectionState = function(category, value, isSelected) {
        if (!activeSelections[currentMode][category]) activeSelections[currentMode][category] = [];
        
        if (isSelected) {
            if (!activeSelections[currentMode][category].includes(value)) {
                activeSelections[currentMode][category].push(value);
            }
        } else {
            activeSelections[currentMode][category] = activeSelections[currentMode][category].filter(item => item !== value);
        }
        saveSessionState();
    };

    // 2. Text interaction (already have listeners, just hook save)
    // We already call saveCurrentTextInputs in the listener, let's add saveSessionState there
    const originalSaveText = saveCurrentTextInputs;
    saveCurrentTextInputs = function() {
        document.querySelectorAll('.prompt-section').forEach(section => {
            const sectionKey = section.dataset.key;
            const textEl = section.querySelector(':scope > .extra-details');
            if(textEl) {
                if(!textInputsData[currentMode][sectionKey]) textInputsData[currentMode][sectionKey] = "";
                textInputsData[currentMode][sectionKey] = textEl.value;
            }
        });
        saveSessionState();
    }
    
    // 3. Mode switch (already saves text inputs, which now saves session)
    // But switchMode also changes currentMode, so we should save after switch
    const originalSwitchMode = switchMode;
    switchMode = function(newMode) {
        // 1. Save current text inputs to state
        saveCurrentTextInputs();

        // 2. Update Mode
        currentMode = newMode;
        saveSessionState(); // Save the new mode immediately
        
        // 3. Update Tab UI
        document.querySelectorAll('.mode-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.mode === currentMode);
        });

        // 4. Update Visibility
        updateVisibilityForMode();

        // 5. Restore text inputs from new mode state
        restoreTextInputs();

        // 6. Re-render selections (visual active state)
        renderAllSections();

        // 7. Regenerate Prompt
        generatePrompt();
    }


    // --- INIT ---
    loadState();
    loadSessionState(); // Load draft
    loadHistory(); // REQUIRED: Load sidebar history
    
    initModeSwitcher(); 
    
    // Apply loaded state to UI
    // 1. Restore tabs
    document.querySelectorAll('.mode-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.mode === currentMode);
    });
    // 2. Restore inputs for current mode
    restoreTextInputs();
    
    renderAllSections();
    generatePrompt();
    
    // GSAP
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-content', { y: 20, opacity: 0, duration: 1 });
});
