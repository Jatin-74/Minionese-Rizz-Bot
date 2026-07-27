// --- INITIALIZATION ---
window.onload = () => {
    // 1. Load Local Storage Memory
    loadTransmissions();

    // 2. Play Messaging Intro
    const messages = [
        document.getElementById('msg-1'), 
        document.getElementById('msg-2'), 
        document.getElementById('msg-3'), 
        document.getElementById('msg-4'), 
        document.getElementById('msg-5')  
    ];

    messages.forEach((msg, index) => {
        setTimeout(() => {
            if (msg) msg.classList.remove('hidden-msg');
        }, (index + 1) * 1200); 
    });

    setTimeout(() => {
        closeIntro();
    }, (messages.length * 1200) + 2000); 
};

// --- INTRO & DISCLAIMER MODALS ---
function closeIntro() {
    const overlay = document.getElementById('intro-overlay');
    if(overlay) {
        overlay.classList.add('hidden-overlay');
        setTimeout(() => { overlay.style.display = 'none'; }, 1000);
    }
}

function openDisclaimer() {
    document.getElementById('disclaimer-modal').classList.remove('hidden-modal');
}

function closeDisclaimer() {
    document.getElementById('disclaimer-modal').classList.add('hidden-modal');
}

// --- HARDWARE STATE & LOGIC ---
let currentMinion = null;
let currentInputQuery = ""; 

const minionLogic = {
    Kevin: {
        minionese: "Bello! Tu hero... pado tatata bala tu. Me want banana, luk at tu!",
        english: "Hello! You must be the hero. Stand tall, act confident! If they don't like it, I hate them. Now give me a banana."
    },
    Stuart: {
        minionese: "Ayoo! Gelato muak muak muak... tulaliloo ti amo. Pwede na?",
        english: "Hey! Just be smooth like ice cream. Give them a wink, play a song, tell them you love them. Ready to go?"
    },
    Bob: {
        minionese: "Bello! Para tu... baboi? Underwear! Kiss kiss!",
        english: "Hi! Give them a toy for you! Or maybe your teddy bear? I swear it works! Hugs and kisses!"
    }
};

// Add this right above your selectMinion function
const minionPrompts = {
    Kevin: "You are Kevin the Minion. You are a protective, slightly arrogant, try-hard leader. The user will ask for relationship or life advice. You must respond in a JSON format with two keys: 'minionese' (your advice in Minion language) and 'english' (the translation of that advice). Keep it under 2 sentences.",
    Stuart: "You are Stuart the Minion. You are a relaxed, smooth, guitar-playing rebel who loves to flirt. The user will ask for relationship or life advice. You must respond in a JSON format with two keys: 'minionese' (your advice in Minion language) and 'english' (the translation of that advice). Keep it under 2 sentences.",
    Bob: "You are Bob the Minion. You are innocent, childlike, sweet, and carry a teddy bear. The user will ask for relationship or life advice. You must respond in a JSON format with two keys: 'minionese' (your advice in Minion language) and 'english' (the translation of that advice). Keep it under 2 sentences."
};

function selectMinion(name) {
    document.querySelectorAll('.minion-figure').forEach(el => el.classList.remove('active'));
    document.getElementById(name.toLowerCase()).classList.add('active');
    currentMinion = name;

    const lcdMinionese = document.getElementById('minionese-output');
    const lcdEnglish = document.getElementById('english-translation');
    
    lcdMinionese.innerHTML = `[${name.toUpperCase()} SYSTEM ENGAGED]`;
    lcdEnglish.innerHTML = "Ready for input query.";
}

async function transmit() {
    const inputField = document.getElementById('user-input');
    currentInputQuery = inputField.value;
    const lcdMinionese = document.getElementById('minionese-output');
    const lcdEnglish = document.getElementById('english-translation');

    if (!currentMinion) {
        lcdMinionese.innerHTML = "ERR: NO HARDWARE SELECTED";
        lcdEnglish.innerHTML = "Please initialize a Minion figure.";
        return;
    }

    if (!currentInputQuery.trim()) {
        lcdMinionese.innerHTML = "ERR: NULL QUERY";
        lcdEnglish.innerHTML = "Please enter data into the console.";
        return;
    }

    lcdMinionese.innerHTML = "TRANSMITTING TO SECURE SERVER...<span class='cursor'></span>";
    lcdEnglish.innerHTML = "";

    try {
        // Send the query to YOUR secure backend instead of Groq
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: currentInputQuery,
                prompt: minionPrompts[currentMinion]
            })
        });

        if (!response.ok) throw new Error("Server connection failed.");

        const data = await response.json();
        
        // Parse the JSON string returned by Groq through your backend
        const aiResponse = JSON.parse(data.choices[0].message.content);

        typeWriterEffect(aiResponse.minionese, aiResponse.english, currentInputQuery, currentMinion);
        inputField.value = ""; 

    } catch (error) {
        console.error("Transmission Error:", error);
        lcdMinionese.innerHTML = "ERR: COMM-LINK FAILED";
        lcdEnglish.innerHTML = "Check server status.";
    }
}

function typeWriterEffect(minioneseText, englishText, originalQuery, minionName) {
    const lcdMinionese = document.getElementById('minionese-output');
    const lcdEnglish = document.getElementById('english-translation');
    
    lcdMinionese.innerHTML = "";
    lcdEnglish.innerHTML = "";

    let i = 0;
    function typeMinionese() {
        if (i < minioneseText.length) {
            lcdMinionese.innerHTML += minioneseText.charAt(i);
            i++;
            setTimeout(typeMinionese, 35); 
        } else {
            let j = 0;
            function typeEnglish() {
                if (j < englishText.length) {
                    lcdEnglish.innerHTML += englishText.charAt(j);
                    j++;
                    setTimeout(typeEnglish, 35);
                } else {
                    // Save to local storage memory log AFTER typing is fully complete
                    saveTransmission(originalQuery, minionName, minioneseText, englishText);
                }
            }
            typeEnglish();
        }
    }
    typeMinionese();
}

// --- LOCAL STORAGE MEMORY LOGIC ---
function loadTransmissions() {
    const memoryLog = document.getElementById('memory-log');
    const saved = JSON.parse(localStorage.getItem('minionRizzMemory')) || [];
    
    memoryLog.innerHTML = '';
    
    if (saved.length === 0) {
        memoryLog.innerHTML = '<div style="color: #666; font-style: italic;">Memory bank empty.</div>';
        return;
    }

    // Display newest first
    [...saved].reverse().forEach(entry => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.innerHTML = `
            <div class="log-query">USER> ${entry.query}</div>
            <div class="log-minionese">[${entry.minion.toUpperCase()}]: ${entry.minionese}</div>
            <div class="log-english">TRANS: ${entry.english}</div>
        `;
        memoryLog.appendChild(div);
    });
}

function saveTransmission(query, minion, minionese, english) {
    const saved = JSON.parse(localStorage.getItem('minionRizzMemory')) || [];
    saved.push({ query, minion, minionese, english });
    
    // Keep only the last 15 entries to prevent overflow
    if (saved.length > 15) saved.shift();
    
    localStorage.setItem('minionRizzMemory', JSON.stringify(saved));
    loadTransmissions();
}

function clearMemory() {
    if(confirm("WARNING: Are you sure you want to purge the local transmission memory?")) {
        localStorage.removeItem('minionRizzMemory');
        loadTransmissions();
    }
}