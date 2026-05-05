/* ============================================
   RoastMyResume - JavaScript
   ============================================ */

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const submitBtn = document.getElementById('submitBtn');
const loadingText = document.getElementById('loadingText');
const resumeText = document.getElementById('resumeText');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const resultsSection = document.getElementById('resultsSection');
const emptyState = document.getElementById('emptyState');
const resetBtn = document.getElementById('resetBtn');
const copyBtn = document.getElementById('copyBtn');



// State
let currentResumeContent = '';
let currentResults = null;

/* ============================================
   Tab Navigation
   ============================================ */

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;

        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

/* ============================================
   File Upload Handling
   ============================================ */

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

async function handleFileUpload(file) {
    const validTypes = ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid file (PDF, DOC, DOCX, or TXT)');
        return;
    }

    try {
        const text = await file.text();
        currentResumeContent = text;
        triggerRoasting();
    } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
    }
}

/* ============================================
   Submit Handler
   ============================================ */

submitBtn.addEventListener('click', async () => {
    const pasteContent = resumeText.value.trim();

    if (!pasteContent && !currentResumeContent) {
        alert('Please paste your resume or upload a file');
        return;
    }

    currentResumeContent = pasteContent || currentResumeContent;
    triggerRoasting();
});

async function triggerRoasting() {
    if (!currentResumeContent) {
        alert('Please provide a resume first');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    loadingText.style.display = 'flex';
    emptyState.classList.add('hidden');

    try {
        // Call real Claude API
        await callClaudeAPI(currentResumeContent);

        // Display results
        displayResults(currentResults);
        resultsSection.style.display = 'block';

        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    } catch (error) {
        console.error('Error roasting resume:', error);
        alert('Error processing resume. Please try again.');
    } finally {
        submitBtn.disabled = false;
        loadingText.style.display = 'none';
    }
}

/* ============================================
   Real Claude API Integration
   ============================================ */

async function callClaudeAPI(resume) {
    const response = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume })
    });

    if (!response.ok) {
        throw new Error('API request failed');
    }

    currentResults = await response.json();
}

/* ============================================
   Display Results
   ============================================ */

function displayResults(results) {
    const scoreValue = document.getElementById('scoreValue');
    const scoreFill = document.getElementById('scoreFill');
    const scoreText = document.getElementById('scoreText');

    scoreValue.textContent = results.score;
    scoreFill.style.setProperty('--score-percent', `${results.score}%`);
    scoreText.textContent = getScoreMessage(results.score);

    document.getElementById('roastContent').textContent = results.roast;

    const fixesList = document.getElementById('fixesList');
    fixesList.innerHTML = '';
    results.fixes.forEach((fix, index) => {
        const li = document.createElement('li');
        li.textContent = fix;
        li.style.setProperty('--delay', `${index * 0.1}s`);
        fixesList.appendChild(li);
    });

    const tipsList = document.getElementById('tipsList');
    tipsList.innerHTML = '';
    results.tips.forEach((tip, index) => {
        const li = document.createElement('li');
        li.textContent = tip;
        li.style.setProperty('--delay', `${index * 0.1}s`);
        tipsList.appendChild(li);
    });
}

function getScoreMessage(score) {
    if (score >= 80) return '🚀 Absolutely crushing it!';
    if (score >= 70) return '💪 Solid resume - keep improving!';
    if (score >= 60) return '📈 Room for improvement, but you\'re on track';
    if (score >= 50) return '⚠️ Significant improvements needed';
    return '🔥 Time for a major overhaul!';
}

/* ============================================
   Reset Functionality
   ============================================ */

resetBtn.addEventListener('click', () => {
    resumeText.value = '';
    currentResumeContent = '';
    fileInput.value = '';
    resultsSection.style.display = 'none';
    emptyState.classList.remove('hidden');
    submitBtn.disabled = false;

    window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================
   Copy to Clipboard
   ============================================ */

copyBtn.addEventListener('click', async () => {
    if (!currentResults) return;

    const textToCopy = `
RoastMyResume Results
====================

SCORE: ${currentResults.score}/100
${getScoreMessage(currentResults.score)}

THE ROAST:
${currentResults.roast}

FIX THESE:
${currentResults.fixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

PRO TIPS:
${currentResults.tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}
    `.trim();

    try {
        await navigator.clipboard.writeText(textToCopy);

        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        alert('Failed to copy results. Please try again.');
    }
});

/* ============================================
   Keyboard Shortcuts
   ============================================ */

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!submitBtn.disabled) {
            submitBtn.click();
        }
    }
});

/* ============================================
   Initialization
   ============================================ */

console.log('RoastMyResume is loaded and ready! 🔥');