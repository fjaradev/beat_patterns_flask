const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let cowbellBuffer;

async function loadAudio() {
    const response = await fetch('/static/cowbell.wav');
    const arrayBuffer = await response.arrayBuffer();
    
    cowbellBuffer = await audioCtx.decodeAudioData(arrayBuffer);
}

function playSound(time) {
    if (!cowbellBuffer) return; // Don't play if it hasn't loaded yet!
    
    // You have to create a new source node every single time you play a sound
    const source = audioCtx.createBufferSource(); 
    source.buffer = cowbellBuffer;
    source.connect(audioCtx.destination); // Connect to the speakers
    
    // Start playing at the specific hardware time provided
    source.start(time); 
}

let isPlaying = false;
let currentStep = 0; // Which of the 16 beats we are on
let nextNoteTime = 0.0; // When the next note should play

function scheduler() {
    // Look ahead 0.1 seconds. If the next note falls in this window, schedule it!
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        scheduleNote(currentStep, nextNoteTime);
        advanceNote(); // Move to the next step and calculate its time
    }
    
    // Call the scheduler again in a few milliseconds
    if (isPlaying) {
        setTimeout(scheduler, 25.0); 
    }
}

let tempo = 120; // Default BPM

function advanceNote() {
    const secondsPerBeat = 60.0 / tempo;
    nextNoteTime += secondsPerBeat;
    
    currentStep++; // Move forward one step
    
    // If we hit the end of the grid, loop back to the start of the grid (skipping the count-in)
    if (currentStep >= 16) {
        if (isRepeating) {
            // If repeat is ON, loop back to the start of the grid
            currentStep = 0; 
        } else {
            // If repeat is OFF, stop the engine!
            isPlaying = false;
            document.getElementById('start-btn').innerText = "Start";
            currentStep = 0; // Reset back to 0 for the next time they hit play
        }
    }
}

function scheduleNote(stepNumber, time) {
    if (stepNumber < 0) {
        playSound(time); 
        return; 
    }

    const cell = document.getElementById(`cell-${stepNumber}`);
    if (!cell) return; 

    const subdivisionCount = parseInt(cell.dataset.subdivision);
    const secondsPerBeat = 60.0 / tempo;
    const intervalGap = secondsPerBeat / subdivisionCount;

    for (let i = 0; i < subdivisionCount; i++) {
        const microNoteTime = time + (i * intervalGap);
        playSound(microNoteTime);

        const delayBeforeVisual = (microNoteTime - audioCtx.currentTime) * 1000;
        
        setTimeout(() => {
            cell.classList.add('active-beat'); // Updated class name here!
            setTimeout(() => cell.classList.remove('active-beat'), 50); 
        }, delayBeforeVisual);
    }
}

document.getElementById('bpm-slider').addEventListener('input', (e) => {
    tempo = parseInt(e.target.value);
    document.getElementById('tempo-value').innerText = `${tempo} BPM`;
});

const startBtn = document.getElementById('start-btn');

startBtn.addEventListener('click', async () => {
    if (!cowbellBuffer) {
        await loadAudio();
    }
    
    // 2. Wake up the audio context
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }
    
    // 3. Toggle play state and start the engine
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        startBtn.innerText = "Stop";
        currentStep = -4;
        nextNoteTime = audioCtx.currentTime + 0.05; // Start playing almost immediately
        scheduler(); 
    } else {
        startBtn.innerText = "Start";
    }
});

let isRepeating = true;
const repeatBtn = document.getElementById('repeat-btn')

repeatBtn.addEventListener('click', () => {
    isRepeating = !isRepeating;

    if (isRepeating) {
        repeatBtn.classList.remove('off-state');
    }else {
        repeatBtn.classList.add('off-state')
    }
});

document.body.addEventListener('htmx:afterSwap', function(evt) {
    // If the grid was just swapped, reset the sequence to the beginning
    if (evt.detail.target.id === 'grid' || evt.detail.target.classList.contains('grid-container')) {
        currentStep = 0;
        console.log("New pattern generated, sequencer reset to beat 1.");
    }
});