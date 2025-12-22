document.addEventListener('DOMContentLoaded', () => {

    // --- MIGRATION LOGIC (VEO3 -> LUCKY PROMPTER) ---
    function migrateLegacyData() {
        // 1. Options Data
        const oldOptions = localStorage.getItem('veo3_options_data');
        if (oldOptions && !localStorage.getItem('lucky_prompter_options_data')) {
            console.log("Migrating Options Data...");
            localStorage.setItem('lucky_prompter_options_data', oldOptions);
            localStorage.removeItem('veo3_options_data');
        }

        // 2. History Data
        const oldHistory = localStorage.getItem('veo3_prompt_history');
        if (oldHistory && !localStorage.getItem('lucky_prompter_history')) {
            console.log("Migrating History Data...");
            localStorage.setItem('lucky_prompter_history', oldHistory);
            localStorage.removeItem('veo3_prompt_history');
        }

        // 3. Session Data
        const oldSession = localStorage.getItem('veo3_session_data');
        if (oldSession && !localStorage.getItem('lucky_prompter_session_data')) {
            console.log("Migrating Session Data...");
            localStorage.setItem('lucky_prompter_session_data', oldSession);
            localStorage.removeItem('veo3_session_data');
        }
    }
    migrateLegacyData();
    
    // --- 1. STATE MANAGEMENT ---
    
    // Initial Default Data
    const defaultData = {
        // --- VIDEO/IMAGE COMMON ---
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
        colorPalettes: ["Monochromatic", "Analogous", "Complementary", "Split-Complementary", "Triadic", "Tetradic", "Warm Tones", "Cool Tones", "Pastel", "Neon/Cyberpunk", "Earth Tones", "Black & White", "Sepia", "Vintage/Retro", "High Contrast", "Muted/Desaturated"],

        // --- WRITING MODE DATA ---
        // 1. ROLE & PERSONA
        writing_role_professional: ["Marketing Guru", "Senior Developer", "Legal Consultant", "Data Analyst", "SEO Expert", "Investigative Journalist", "Product Manager", "Customer Support"],
        writing_role_creative: ["Stand-up Comedian", "Grumpy Old Man", "Gen-Z Influencer", "Victorian Poet", "Sci-Fi Novelist", "Motivational Speaker", "Devil's Advocate", "Philosopher"],
        
        // 2. FORMAT & GENRE
        writing_format_business: ["Email Subject Line", "Cold Email", "Facebook Ad", "Landing Page Header", "Press Release", "Case Study", "Whitepaper", "Job Description"],
        writing_format_social: ["Twitter/X Thread", "LinkedIn Post", "Instagram Caption", "TikTok Script", "YouTube Description", "Video Title"],
        writing_format_creative: ["Short Story", "Flash Fiction", "Screenplay Scene", "Haiku", "Sonnet", "Song Lyrics", "Stand-up Bit", "Roast"],
        writing_format_academic: ["Blog Post", "Essay", "Technical Tutorial", "News Article", "Executive Summary", "Meeting Minutes"],

        // 3. TONE & VOICE
        writing_tone_professional: ["Formal", "Corporate", "Academic", "Authoritative", "Diplomatic", "Objective", "Instructional"],
        writing_tone_emotional: ["Empathetic", "Enthusiastic", "Urgent", "Melancholic", "Optimistic", "Angry", "Nostalgic"],
        writing_tone_stylistic: ["Witty", "Sarcastic", "Dry/Deadpan", "Whimsical", "Minimalist", "Flowery", "Edgy", "Controversial"],

        // 4. TARGET AUDIENCE
        writing_audience_expertise: ["Complete Beginner", "Intermediate", "Subject Matter Expert", "Insiders"],
        writing_audience_demographics: ["Children (5-10)", "Teenagers", "Gen-Z", "Millennials", "Seniors", "Parents", "Students"],
        writing_audience_professional: ["C-Suite Executives", "Investors", "Developers", "Designers", "Small Business Owners", "Hiring Managers"],

        // 5. STRUCTURAL FRAMEWORK
        writing_framework_marketing: ["AIDA (Attn-Int-Des-Act)", "PAS (Prob-Agit-Sol)", "FAB (Feat-Adv-Ben)", "The 4 Ps", "Before-After-Bridge"],
        writing_framework_story: ["Hero's Journey", "Three-Act Structure", "In Media Res", "Save the Cat", "Cliffhanger Ending", "Non-Linear"],
        writing_framework_logic: ["Pros vs. Cons", "Chronological", "Step-by-Step", "Listicle", "Problem & Solution", "ELI5 (Explain Like I'm 5)"],

        // 6. KEY CONSTRAINTS
        writing_constraint_length: ["Short (<100 words)", "Medium (300-500 words)", "Long Form (1000+)", "Micro-copy (Tweet size)"],
        writing_constraint_format: ["Bullet Points Only", "Numbered List", "Table Format", "Dialogue Only", "No Emojis", "Markdown", "HTML Code"],
        writing_constraint_linguistic: ["No Adverbs", "No Jargon", "Use Metaphors", "Rhyming (AABB)", "Rhyming (ABAB)", "First Person ('I')", "Third Person"],

        // 7. STYLISTIC REFERENCES
        writing_reference_authors: ["Hemingway (Punchy)", "Shakespeare (Old English)", "Stephen King (Thriller)", "Oscar Wilde (Witty)", "Jane Austen (Classic)"],
        writing_reference_media: ["TechCrunch Article", "BuzzFeed Listicle", "NY Times Op-Ed", "Reddit Thread", "TED Talk", "Apple Keynote", "Wes Anderson Narration", "Film Noir Voiceover"],

        // 8. GOAL/OBJECTIVE
        writing_goal_conversion: ["Drive Clicks", "Sell a Product", "Collect Emails", "Get Retweets", "Book a Call"],
        writing_goal_emotional: ["Make them Laugh", "Make them Cry", "Shock Value", "Inspire Hope", "Create Suspense", "Build Trust"],
        writing_goal_info: ["Educate", "Summarize", "Simplify", "Debunk a Myth", "Spark Debate", "Rank on SEO"],

        // 9. LANGUAGE
        writing_language: ["English (US)", "English (UK)", "English (Aussie)", "Bengali (Bangladesh)", "Bengali (West Bengal)"],

        // 10. HUMANIZE
        writing_humanize_tone: ["No Hedging", "Strong Opinions", "Use Contractions", "Active Voice Only", "No 'In Conclusion'", "Zero Nuance", "Start with 'And/But'", "First Person ('I')", "Biased Perspective"],
        writing_humanize_syntax: ["No Adverbs (-ly)", "No Jargon", "Max 3 Syllables", "Short Sentences", "Fragments OK", "Eighth Grade Level", "Street Slang", "Min 2 Fragments/Para", "Stream of Consciousness"],
        writing_humanize_imagery: ["Sensory Details", "Household Metaphors", "Concrete Imagery", "Show Don't Tell", "Smell/Touch/Taste", "Avoid Abstract Nouns", "Visceral Descriptions", "No 'Success/Freedom' concepts"]
    };

    // Current State (loaded from LS or Defaults)
    let appData = {};
    
    // Split State for Video vs Image vs Writing
    let currentMode = 'video';
    
    // Structure: { video: { category: [vals] }, image: { category: [vals] }, writing: { category: [vals] } }
    let activeSelections = {
        video: {},
        image: {},
        writing: {}
    };
    
    // Structure: { video: { sectionKey: "text" }, image: { sectionKey: "text" }, writing: { sectionKey: "text" } }
    let textInputsData = {
        video: {},
        image: {},
        writing: {}
    };

    function loadState() {
        const storedOptions = localStorage.getItem('lucky_prompter_options_data');
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
        localStorage.setItem('lucky_prompter_options_data', JSON.stringify(appData));
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
        saveSessionState();
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
        saveSessionState(); 
        
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
        // 1. Toggle Element Visibility based on data-mode-specific
        const allElements = document.querySelectorAll('[data-mode-specific]');
        allElements.forEach(el => {
            const allowedModes = el.dataset.modeSpecific.split(' ');
            if (allowedModes.includes(currentMode)) {
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

        // 3. Dynamic Header Renaming (Cinematography -> Camera Control for Image)
        const cineHeader = document.querySelector('#cinematography h2');
        if (cineHeader) {
            // We use a regex to preserve the numbering if it exists (e.g. "1. Cinematography")
            let text = cineHeader.textContent;
            if (currentMode === 'image') {
                if (text.includes('Cinematography')) {
                    cineHeader.textContent = text.replace('Cinematography', 'Camera Control');
                }
            } else {
                if (text.includes('Camera Control')) {
                    cineHeader.textContent = text.replace('Camera Control', 'Cinematography');
                }
            }
        }

        // 4. Update Section Numbering
        updateSectionNumbering();
    }

    function updateSectionNumbering() {
        const sections = document.querySelectorAll('.prompt-section');
        let counter = 1;
        
        sections.forEach(section => {
            if (section.classList.contains('hidden-mode') || section.style.display === 'none') {
                return; 
            }
            
            const h2 = section.querySelector('h2');
            if (h2) {
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
        saveSessionState();
    }

    function restoreTextInputs() {
         // Clear all first to be safe
         document.querySelectorAll('.extra-details').forEach(el => el.value = '');
         
         document.querySelectorAll('.prompt-section').forEach(section => {
            const sectionKey = section.dataset.key;
            const textEl = section.querySelector(':scope > .extra-details');
            if(textEl) {
                const val = textInputsData[currentMode] && textInputsData[currentMode][sectionKey] 
                            ? textInputsData[currentMode][sectionKey] 
                            : "";
                textEl.value = val;
            }
        });
    }

    // --- 4. MODAL LOGIC (ADD/DELETE) & RESET LOGIC ---

    // RESET BUTTON LOGIC
    document.querySelectorAll('.reset-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
             // 1. Clear Selections for current mode
             activeSelections[currentMode] = {};
             
             // 2. Clear Text Inputs for current mode
             textInputsData[currentMode] = {};
             
             // 3. Clear UI Inputs
             document.querySelectorAll('.extra-details').forEach(el => el.value = '');
             
             // 4. Save & Refresh
             saveSessionState();
             renderAllSections();
             generatePrompt();
        });
    });

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
                
                // Remove from active selections (in ALL modes to be safe)
                ['video', 'image', 'writing'].forEach(m => {
                    if(activeSelections[m][category]) {
                        activeSelections[m][category] = activeSelections[m][category].filter(o => o !== option);
                    }
                });

                saveState();
                renderSection(category); 
                populateDeleteList(category);
                generatePrompt(); 
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
            
            // Gather selected buttons via DOM state for convenience
            const inputs = [];
            const activeBtns = section.querySelectorAll('.option-btn.active');
            activeBtns.forEach(btn => {
                const card = btn.closest('.card');
                if (card && (card.classList.contains('hidden-mode') || card.style.display === 'none')) return;

                let val = btn.textContent;
                const category = card?.dataset.category;
                
                // Transitons suffix (Video Only)
                if (currentMode === 'video' && category === 'transitions' && !val.toLowerCase().endsWith(' transition')) {
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
        const stored = localStorage.getItem('lucky_prompter_history');
        if (stored) {
            historyData = JSON.parse(stored);
            renderHistory();
        }
    }

    function saveHistory() {
        localStorage.setItem('lucky_prompter_history', JSON.stringify(historyData));
    }

    function addToHistory(fullText) {
        let title = "Untitled Prompt";
        
        // Custom Title Logic based on Mode
        if (currentMode === 'writing') {
             // For writing, grab "Topic & Details"
             const topicMatch = fullText.match(/\[Topic & Details\]: (.*)/);
             if (topicMatch) {
                 const words = topicMatch[1].split(' ');
                 title = words.slice(0, 5).join(' ') + (words.length > 5 ? "..." : "");
             } else {
                 title = "Untitled Writing";
             }
        } else {
            // Video/Image (Subject)
            const subjectMatch = fullText.match(/\[Subject\]: (.*)/);
            if (subjectMatch) {
                const words = subjectMatch[1].split(' ');
                title = words.slice(0, 3).join(' ') + (words.length > 3 ? "..." : "");
            }
        }
        
        // Fallback for preview
        let preview = fullText.substring(0, 100).replace(/\n/g, ' ') + "...";

        const newItem = {
            id: Date.now(),
            mode: currentMode, 
            title: title || "Untitled",
            preview: preview,
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
            let badgeText = "VID";
            let badgeColor = "var(--accent-color)";
            if (item.mode === 'image') { badgeText = "IMG"; badgeColor = "var(--accent-secondary)"; }
            if (item.mode === 'writing') { badgeText = "WRT"; badgeColor = "#ffcc00"; }
            
            badge.textContent = badgeText;
            badge.style.fontSize = "0.7rem";
            badge.style.padding = "2px 6px";
            badge.style.borderRadius = "4px";
            badge.style.marginRight = "8px";
            badge.style.backgroundColor = badgeColor;
            badge.style.color = "#000";
            badge.style.fontWeight = "bold";

            const tooltip = document.createElement('div');
            tooltip.className = 'history-tooltip';
            tooltip.textContent = item.preview;
            
            const titleEl = document.createElement('div');
            titleEl.className = 'history-item-title';
            titleEl.style.display = 'flex'; // Ensure flex layout for positioning
            titleEl.style.alignItems = 'center';
            titleEl.style.width = '100%';
            
            titleEl.appendChild(badge); // Prepend badge
            
            const textSpan = document.createElement('span');
            textSpan.textContent = item.title;
            // Prevent title from overlapping delete button
            textSpan.style.whiteSpace = 'nowrap';
            textSpan.style.overflow = 'hidden';
            textSpan.style.textOverflow = 'ellipsis';
            textSpan.style.marginRight = '8px';
            textSpan.style.flexGrow = '1';
            
            titleEl.appendChild(textSpan);
            
            // Delete Button
            const delBtn = document.createElement('button');
            delBtn.className = 'history-delete-btn';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.title = "Delete this prompt";
            
            delBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Confirm deletion? Maybe not needed for history items, checking user request. 
                // User didn't ask for confirm on history delete, but it's safe. 
                // For now, instant delete feels smoother for history management.
                
                historyData = historyData.filter(h => h.id !== item.id);
                saveHistory();
                renderHistory();
            });
            
            titleEl.appendChild(delBtn);
            
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
    
    if(toggleBtn) toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent document click from immediately closing it
        historySidebar.classList.add('open');
        renderHistory(); 
    });
    
    if(closeBtn) closeBtn.addEventListener('click', () => historySidebar.classList.remove('open'));

    // Close History when clicking outside
    document.addEventListener('click', (e) => {
        if (historySidebar.classList.contains('open') && 
            !historySidebar.contains(e.target) && 
            e.target !== toggleBtn) {
            historySidebar.classList.remove('open');
        }
    });

    function saveSessionState() {
        const session = {
            activeSelections,
            textInputsData,
            currentMode
        };
        localStorage.setItem('lucky_prompter_session_data', JSON.stringify(session));
    }

    function loadSessionState() {
        const stored = localStorage.getItem('lucky_prompter_session_data');
        if (stored) {
            try {
                const session = JSON.parse(stored);
                if (session.activeSelections) activeSelections = session.activeSelections;
                if (session.textInputsData) textInputsData = session.textInputsData;
                if (session.currentMode) currentMode = session.currentMode;
                
                // DATA INTEGRITY CHECK: Ensure all modes exist (fix for stale sessions)
                ['video', 'image', 'writing'].forEach(mode => {
                    if (!activeSelections[mode]) activeSelections[mode] = {};
                    if (!textInputsData[mode]) textInputsData[mode] = {};
                });

            } catch (e) {
                console.error("Failed to load session", e);
                // Fallback to init if corrupt
                activeSelections = { video: {}, image: {}, writing: {} };
                textInputsData = { video: {}, image: {}, writing: {} };
            }
        }
    }

    // --- INIT ---
    loadState();
    loadSessionState(); 
    loadHistory(); 
    
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
