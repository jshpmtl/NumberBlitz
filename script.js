"use strict";

// ========================================
// NUMBER BLITZ - STORAGE
// ========================================

const STORAGE_KEYS = {
    music: "numberBlitzMusicEnabled",
    sfx: "numberBlitzSfxEnabled",
    easy: "numberBlitzRecordEasy",
    normal: "numberBlitzRecordNormal",
    hard: "numberBlitzRecordHard",
    extreme: "numberBlitzRecordExtreme"
};

function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, String(value));
    } catch {}
}

// Migrate the old record to Normal mode.
if (readStorage(STORAGE_KEYS.normal) === null) {
    const oldRecord = readStorage("numberBlitzBestRecord");

    if (oldRecord !== null) {
        writeStorage(STORAGE_KEYS.normal, oldRecord);
    }
}

const difficulties = {
    easy: { name: "EASY", max: 50, recordKey: STORAGE_KEYS.easy },
    normal: { name: "NORMAL", max: 100, recordKey: STORAGE_KEYS.normal },
    hard: { name: "HARD", max: 500, recordKey: STORAGE_KEYS.hard },
    extreme: { name: "EXTREME", max: 1000, recordKey: STORAGE_KEYS.extreme }
};

let selectedDifficulty = "normal";
let maxNumber = 100;
let secretNumber = 0;
let attempts = 0;
let gameOver = false;

let musicEnabled = readStorage(STORAGE_KEYS.music, "true") !== "false";
let sfxEnabled = readStorage(STORAGE_KEYS.sfx, "true") !== "false";

let audioContext = null;
let musicTimer = null;
let musicStep = 0;
let previousScreen = "homeScreen";

// ========================================
// DOM ELEMENTS
// ========================================

const screens = document.querySelectorAll(".screen");

const introScreen = document.getElementById("introScreen");
const homeScreen = document.getElementById("homeScreen");
const difficultyScreen = document.getElementById("difficultyScreen");
const gameScreen = document.getElementById("gameScreen");
const pauseScreen = document.getElementById("pauseScreen");
const recordsScreen = document.getElementById("recordsScreen");
const settingsScreen = document.getElementById("settingsScreen");
const quitScreen = document.getElementById("quitScreen");

const homeBestRecord = document.getElementById("homeBestRecord");
const homeBestMode = document.getElementById("homeBestMode");

const easyRecord = document.getElementById("easyRecord");
const normalRecord = document.getElementById("normalRecord");
const hardRecord = document.getElementById("hardRecord");
const extremeRecord = document.getElementById("extremeRecord");

const difficultyLabel = document.getElementById("difficultyLabel");
const maxNumberDisplay = document.getElementById("maxNumberDisplay");
const clueNumber = document.getElementById("clueNumber");
const clueText = document.getElementById("clueText");
const attemptsDisplay = document.getElementById("attemptsDisplay");

const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const message = document.getElementById("message");
const resultActions = document.getElementById("resultActions");

const funFactCard = document.getElementById("funFactCard");
const funFactCategory = document.getElementById("funFactCategory");
const funFactTitle = document.getElementById("funFactTitle");
const funFactText = document.getElementById("funFactText");
const funFactNumber = document.getElementById("funFactNumber");

const musicToggle = document.getElementById("musicToggle");
const sfxToggle = document.getElementById("sfxToggle");

// ========================================
// FUN FACTS 1-1000
// ========================================

function isPrime(number) {
    if (number < 2) return false;

    for (let i = 2; i <= Math.sqrt(number); i++) {
        if (number % i === 0) return false;
    }

    return true;
}

// Curated facts for selected numbers.
// All other numbers receive a generated
// mathematical fact.

const specialFacts = {
    1: ["Mathematics", "One is unique", "1 is neither prime nor composite."],
    2: ["Mathematics", "The only even prime", "2 is the only even prime number."],
    3: ["Geometry", "Three sides", "A triangle has three sides."],
    4: ["Nature", "Four-leaf clovers", "Four-leaf clovers are rare variations of the common three-leaf clover."],
    5: ["Nature", "Five senses", "The traditional five senses are sight, hearing, smell, taste, and touch."],
    6: ["Mathematics", "A perfect number", "6 is the smallest perfect number. Its proper divisors, 1, 2, and 3, add up to 6."],
    7: ["Everyday Life", "Seven days", "A standard week has seven days."],
    8: ["Space", "Eight planets", "Our Solar System has eight recognized planets."],
    9: ["Mathematics", "Three squared", "9 equals 3 multiplied by 3."],
    10: ["Everyday Life", "Ten fingers", "Humans typically have ten fingers."],
    11: ["Mathematics", "A palindrome", "11 reads the same forwards and backwards."],
    12: ["Time", "Twelve months", "A calendar year has twelve months."],
    13: ["Everyday Life", "A baker's dozen", "A baker's dozen means thirteen items."],
    14: ["Mathematics", "Two times seven", "14 equals 2 multiplied by 7."],
    15: ["Science", "Phosphorus", "Phosphorus has atomic number 15."],
    16: ["Mathematics", "Four squared", "16 equals 4 multiplied by 4."],
    17: ["Mathematics", "A prime number", "17 is a prime number."],
    18: ["Mathematics", "Three times six", "18 equals 3 multiplied by 6."],
    19: ["Science", "Potassium", "Potassium has atomic number 19."],
    20: ["Everyday Life", "Twenty digits", "A typical human has ten fingers and ten toes."],
    21: ["Mathematics", "Three times seven", "21 equals 3 multiplied by 7."],
    22: ["Mathematics", "A palindrome", "22 reads the same forwards and backwards."],
    23: ["Biology", "Human chromosomes", "Most human body cells contain 23 pairs of chromosomes."],
    24: ["Time", "Hours in a day", "A standard day has 24 hours."],
    25: ["Mathematics", "Five squared", "25 equals 5 multiplied by 5."],
    26: ["Everyday Life", "The English alphabet", "The modern English alphabet has 26 letters."],
    27: ["Mathematics", "Three cubed", "27 equals 3 multiplied by 3 multiplied by 3."],
    28: ["Science", "Nickel", "Nickel has atomic number 28."],
    29: ["Time", "Leap-year February", "February has 29 days during a leap year."],
    30: ["Time", "Thirty days", "Several calendar months have 30 days."],
    31: ["Time", "Days in a month", "Some calendar months have 31 days."],
    32: ["Computing", "A power of two", "32 equals 2 multiplied by itself five times."],
    33: ["Mathematics", "Three elevens", "33 equals 3 multiplied by 11."],
    34: ["Mathematics", "Fibonacci sequence", "34 is a number in the Fibonacci sequence."],
    35: ["Mathematics", "Five times seven", "35 equals 5 multiplied by 7."],
    36: ["Mathematics", "Six squared", "36 equals 6 multiplied by 6."],
    37: ["Mathematics", "A prime number", "37 is a prime number."],
    38: ["Mathematics", "Two times nineteen", "38 equals 2 multiplied by 19."],
    39: ["Mathematics", "Three times thirteen", "39 equals 3 multiplied by 13."],
    40: ["Everyday Life", "Forty days", "Forty is a number often used in traditional stories and expressions."],
    41: ["Mathematics", "A prime number", "41 is a prime number."],
    42: ["Science", "Molybdenum", "Molybdenum has atomic number 42."],
    43: ["Mathematics", "A prime number", "43 is a prime number."],
    44: ["Mathematics", "Four elevens", "44 equals 4 multiplied by 11."],
    45: ["Geometry", "Half of a right angle", "45 degrees is half of a 90-degree right angle."],
    46: ["Biology", "Human chromosomes", "Most human body cells contain 46 chromosomes."],
    47: ["Mathematics", "A prime number", "47 is a prime number."],
    48: ["Time", "Two days", "There are 48 hours in two standard days."],
    49: ["Mathematics", "Seven squared", "49 equals 7 multiplied by 7."],
    50: ["Science", "Tin", "Tin has atomic number 50."],
    51: ["Science", "Antimony", "Antimony has atomic number 51."],
    52: ["Everyday Life", "Playing cards", "A standard deck has 52 playing cards, not counting jokers."],
    53: ["Mathematics", "A prime number", "53 is a prime number."],
    54: ["Mathematics", "Six times nine", "54 equals 6 multiplied by 9."],
    55: ["Mathematics", "Fibonacci sequence", "55 is a number in the Fibonacci sequence."],
    56: ["Mathematics", "Seven times eight", "56 equals 7 multiplied by 8."],
    57: ["Mathematics", "Three times nineteen", "57 equals 3 multiplied by 19."],
    58: ["Science", "Cerium", "Cerium has atomic number 58."],
    59: ["Mathematics", "A prime number", "59 is a prime number."],
    60: ["Time", "Sixty seconds", "A standard minute contains 60 seconds."],
    61: ["Mathematics", "A prime number", "61 is a prime number."],
    62: ["Mathematics", "Two times thirty-one", "62 equals 2 multiplied by 31."],
    63: ["Mathematics", "Seven times nine", "63 equals 7 multiplied by 9."],
    64: ["Mathematics", "A perfect cube", "64 equals 4 multiplied by 4 multiplied by 4."],
    65: ["Everyday Life", "Retirement age", "65 is a commonly referenced retirement age in some countries."],
    66: ["Mathematics", "Six elevens", "66 equals 6 multiplied by 11."],
    67: ["Mathematics", "A prime number", "67 is a prime number."],
    68: ["Science", "Erbium", "Erbium has atomic number 68."],
    69: ["Mathematics", "A rotating number", "69 can resemble 96 after a 180-degree rotation in some digital typefaces."],
    70: ["Mathematics", "Seven tens", "70 equals 7 multiplied by 10."],
    71: ["Mathematics", "A prime number", "71 is a prime number."],
    72: ["Mathematics", "Six dozen", "72 equals six times twelve."],
    73: ["Mathematics", "A prime number", "73 is a prime number."],
    74: ["Science", "Tungsten", "Tungsten has atomic number 74."],
    75: ["Mathematics", "Three quarters of 100", "75 is three quarters of 100."],
    76: ["Mathematics", "Four times nineteen", "76 equals 4 multiplied by 19."],
    77: ["Mathematics", "Seven elevens", "77 equals 7 multiplied by 11."],
    78: ["Mathematics", "Six times thirteen", "78 equals 6 multiplied by 13."],
    79: ["Science", "Gold", "Gold has atomic number 79."],
    80: ["Mathematics", "Eight tens", "80 equals 8 multiplied by 10."],
    81: ["Mathematics", "Nine squared", "81 equals 9 multiplied by 9."],
    82: ["Science", "Lead", "Lead has atomic number 82."],
    83: ["Mathematics", "A prime number", "83 is a prime number."],
    84: ["Mathematics", "Seven times twelve", "84 equals 7 multiplied by 12."],
    85: ["Mathematics", "Five times seventeen", "85 equals 5 multiplied by 17."],
    86: ["Science", "Radon", "Radon has atomic number 86."],
    87: ["Science", "Francium", "Francium has atomic number 87."],
    88: ["Science", "Radium", "Radium has atomic number 88."],
    89: ["Mathematics", "A prime number", "89 is a prime number."],
    90: ["Geometry", "A right angle", "A right angle measures exactly 90 degrees."],
    91: ["Mathematics", "Seven times thirteen", "91 equals 7 multiplied by 13."],
    92: ["Science", "Uranium", "Uranium has atomic number 92."],
    93: ["Mathematics", "Three times thirty-one", "93 equals 3 multiplied by 31."],
    94: ["Mathematics", "Two times forty-seven", "94 equals 2 multiplied by 47."],
    95: ["Mathematics", "Five times nineteen", "95 equals 5 multiplied by 19."],
    96: ["Mathematics", "Eight dozen", "96 equals 8 multiplied by 12."],
    97: ["Mathematics", "Largest prime below 100", "97 is the largest prime number below 100."],
    98: ["Mathematics", "Seven times fourteen", "98 equals 7 multiplied by 14."],
    99: ["Mathematics", "Eleven times nine", "99 equals 11 multiplied by 9."],
    100: ["Mathematics", "Ten squared", "100 equals 10 multiplied by 10."],

    101: ["Mathematics", "A prime after 100", "101 is the first prime number greater than 100."],
    108: ["Culture", "A meaningful number", "108 is considered significant in several cultural and spiritual traditions."],
    111: ["Mathematics", "A repeating number", "111 is made up of three identical digits."],
    120: ["Mathematics", "Five factorial", "120 is the number of ways to arrange five different objects."],
    121: ["Mathematics", "Eleven squared", "121 equals 11 multiplied by 11."],
    123: ["Mathematics", "A counting pattern", "123 contains three consecutive counting digits."],
    125: ["Mathematics", "Five cubed", "125 equals 5 multiplied by 5 multiplied by 5."],
    127: ["Mathematics", "A prime number", "127 is a prime number."],
    128: ["Computing", "A power of two", "128 equals 2 multiplied by itself seven times."],
    132: ["Mathematics", "A dozen elevens", "132 equals 12 multiplied by 11."],
    144: ["Mathematics", "A dozen dozens", "144 equals 12 multiplied by 12."],
    149: ["Mathematics", "A prime number", "149 is a prime number."],
    150: ["Mathematics", "Half of 300", "150 is exactly half of 300."],
    151: ["Mathematics", "A prime number", "151 is a prime number."],
    160: ["Mathematics", "Sixteen tens", "160 equals 16 multiplied by 10."],
    168: ["Time", "Hours in a week", "A standard seven-day week contains 168 hours."],
    169: ["Mathematics", "Thirteen squared", "169 equals 13 multiplied by 13."],
    180: ["Geometry", "Straight angle", "A straight angle measures 180 degrees."],
    196: ["Mathematics", "Fourteen squared", "196 equals 14 multiplied by 14."],
    200: ["Mathematics", "Two hundred", "200 equals 2 multiplied by 100."],
    202: ["Mathematics", "A palindrome", "202 reads the same forwards and backwards."],
    206: ["Biology", "Adult human bones", "A typical adult human skeleton has 206 bones."],
    210: ["Mathematics", "Triangular number", "210 is the sum of all whole numbers from 1 to 20."],
    216: ["Mathematics", "Six cubed", "216 equals 6 multiplied by 6 multiplied by 6."],
    225: ["Mathematics", "Fifteen squared", "225 equals 15 multiplied by 15."],
    250: ["Mathematics", "A quarter of one thousand", "250 is one quarter of 1,000."],
    252: ["Mathematics", "A dozen twenty-ones", "252 equals 12 multiplied by 21."],
    256: ["Computing", "Eight bits", "256 is the number of possible values represented by eight bits."],
    270: ["Mathematics", "Three quarters of a turn", "270 degrees is three quarters of a full 360-degree turn."],
    288: ["Mathematics", "A dozen times twenty-four", "288 equals 12 multiplied by 24."],
    300: ["Mathematics", "Three hundred", "300 equals 3 multiplied by 100."],
    314: ["Mathematics", "Pi connection", "314 resembles the first three digits of pi when pi is written as 3.14."],
    315: ["Mathematics", "A product of factors", "315 equals 3 multiplied by 3 multiplied by 5 multiplied by 7."],
    324: ["Mathematics", "Eighteen squared", "324 equals 18 multiplied by 18."],
    333: ["Mathematics", "Repeating digits", "333 has three identical digits."],
    343: ["Mathematics", "Seven cubed", "343 equals 7 multiplied by 7 multiplied by 7."],
    350: ["Mathematics", "Seven times fifty", "350 equals 7 multiplied by 50."],
    360: ["Geometry", "A full circle", "A full turn around a circle measures 360 degrees."],
    365: ["Time", "Days in a common year", "A common calendar year has 365 days."],
    366: ["Time", "Leap year", "A leap year has 366 days."],
    375: ["Mathematics", "Three eighths of 1,000", "375 is three eighths of 1,000."],
    384: ["Mathematics", "A power of two times three", "384 equals 128 multiplied by 3."],
    400: ["Mathematics", "Twenty squared", "400 equals 20 multiplied by 20."],
    404: ["Computing", "Page not found", "HTTP 404 is the familiar web error code for a resource that cannot be found."],
    420: ["Mathematics", "A product of factors", "420 equals 42 multiplied by 10."],
    432: ["Mathematics", "A dozen thirty-six times", "432 equals 12 multiplied by 36."],
    444: ["Mathematics", "Repeating digits", "444 has three identical digits."],
    450: ["Mathematics", "Half of 900", "450 is half of 900."],
    480: ["Time", "Eight hours in minutes", "480 minutes equals eight hours."],
    490: ["Mathematics", "Seven times seventy", "490 equals 7 multiplied by 70."],
    500: ["Mathematics", "Half of one thousand", "500 is exactly half of 1,000."],
    504: ["Mathematics", "A dozen forty-twos", "504 equals 12 multiplied by 42."],
    512: ["Computing", "A power of two", "512 equals 2 multiplied by itself nine times."],
    525: ["Mathematics", "A product of factors", "525 equals 21 multiplied by 25."],
    540: ["Geometry", "One and a half turns", "540 degrees equals one full turn plus another half turn."],
    555: ["Mathematics", "Repeating digits", "555 has three identical digits."],
    576: ["Mathematics", "Twenty-four squared", "576 equals 24 multiplied by 24."],
    600: ["Mathematics", "Six hundreds", "600 equals 6 multiplied by 100."],
    625: ["Mathematics", "A perfect square", "625 equals 25 multiplied by 25."],
    630: ["Mathematics", "A product of factors", "630 equals 63 multiplied by 10."],
    666: ["Mathematics", "Repeating pattern", "666 has three identical digits."],
    675: ["Mathematics", "Three quarters of 900", "675 is three quarters of 900."],
    700: ["Mathematics", "Seven hundreds", "700 equals 7 multiplied by 100."],
    720: ["Mathematics", "Six factorial", "720 is the number of ways to arrange six different objects."],
    729: ["Mathematics", "Three to the sixth power", "729 equals 3 multiplied by itself six times."],
    750: ["Mathematics", "Three quarters of 1,000", "750 is three quarters of 1,000."],
    777: ["Mathematics", "Repeating digits", "777 has three identical digits."],
    784: ["Mathematics", "Twenty-eight squared", "784 equals 28 multiplied by 28."],
    800: ["Mathematics", "Eight hundreds", "800 equals 8 multiplied by 100."],
    808: ["Mathematics", "A palindrome", "808 reads the same forwards and backwards."],
    810: ["Mathematics", "A product of factors", "810 equals 81 multiplied by 10."],
    840: ["Mathematics", "A highly divisible number", "840 can be divided evenly by many whole numbers."],
    864: ["Mathematics", "A product of factors", "864 equals 8 multiplied by 108."],
    888: ["Mathematics", "Repeating digits", "888 has three identical digits."],
    900: ["Mathematics", "Thirty squared", "900 equals 30 multiplied by 30."],
    909: ["Mathematics", "A palindrome", "909 reads the same forwards and backwards."],
    936: ["Mathematics", "A product of factors", "936 equals 9 multiplied by 104."],
    960: ["Time", "Sixteen hours in minutes", "960 minutes equals 16 hours."],
    972: ["Mathematics", "A product of factors", "972 equals 9 multiplied by 108."],
    999: ["Mathematics", "One less than a thousand", "999 is exactly one less than 1,000."],
    1000: ["Mathematics", "One thousand", "1,000 equals 10 multiplied by 10 multiplied by 10."]
};

// Generate a fact for every number from 1 to 1,000.
function getFunFact(number) {
    if (!Number.isInteger(number) || number < 1 || number > 1000) {
        return null;
    }

    if (specialFacts[number]) {
        const fact = specialFacts[number];

        return {
            category: fact[0],
            title: fact[1],
            text: fact[2]
        };
    }

    if (isPrime(number)) {
        return {
            category: "Mathematics",
            title: "A prime number",
            text: `${number} is prime. Its only positive divisors are 1 and ${number}.`
        };
    }

    const root = Math.sqrt(number);

    if (Number.isInteger(root)) {
        return {
            category: "Mathematics",
            title: "A perfect square",
            text: `${number} is a perfect square because ${root} multiplied by ${root} equals ${number}.`
        };
    }

    const divisors = [];

    for (let i = 1; i <= Math.sqrt(number); i++) {
        if (number % i === 0) {
            divisors.push(i);

            if (i !== number / i) {
                divisors.push(number / i);
            }
        }
    }

    divisors.sort((a, b) => a - b);

    return {
        category: "Mathematics",
        title: "A composite number",
        text: `${number} is composite. Its positive divisors include ${divisors.slice(0, 5).join(", ")}.`
    };
}

// ========================================
// SCREEN NAVIGATION
// ========================================

function showScreen(screen) {
    screens.forEach(item => item.classList.remove("active"));
    screen.classList.add("active");
}

function getRecord(difficulty) {
    return Number(readStorage(difficulties[difficulty].recordKey, "0")) || 0;
}

function updateRecords() {
    const records = Object.keys(difficulties).map(key => ({
        key,
        name: difficulties[key].name,
        score: getRecord(key)
    }));

    easyRecord.textContent = getRecord("easy") || "—";
    normalRecord.textContent = getRecord("normal") || "—";
    hardRecord.textContent = getRecord("hard") || "—";
    extremeRecord.textContent = getRecord("extreme") || "—";

    const achieved = records.filter(record => record.score > 0);

    if (achieved.length === 0) {
        homeBestRecord.textContent = "—";
        homeBestMode.textContent = "NO RECORD YET";
        return;
    }

    achieved.sort((a, b) => a.score - b.score);

    homeBestRecord.textContent = achieved[0].score;
    homeBestMode.textContent = achieved[0].name + " MODE";
}

function openHome() {
    updateRecords();
    showScreen(homeScreen);
    startMusic();
}

function openQuitScreen() {
    previousScreen = document.querySelector(".screen.active").id;
    showScreen(quitScreen);
    playSound("click");
}

function cancelQuit() {
    const previous = document.getElementById(previousScreen);
    showScreen(previous || homeScreen);
    playSound("click");
}

function confirmQuit() {
    stopMusic();
    showScreen(homeScreen);
    updateRecords();
}

// ========================================
// DIFFICULTY SELECTION
// ========================================

function openDifficultySelection() {
    showScreen(difficultyScreen);
    playSound("click");
}

function chooseDifficulty(difficulty) {
    if (!difficulties[difficulty]) return;

    selectedDifficulty = difficulty;
    maxNumber = difficulties[difficulty].max;

    startGame();
}

// ========================================
// SOUND EFFECTS
// ========================================

function initializeAudio() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (AudioContextClass) {
            audioContext = new AudioContextClass();
        }
    }

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playTone(frequency, duration = 0.12, type = "sine", volume = 0.08) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function playSound(sound) {
    if (!sfxEnabled) return;

    initializeAudio();

    switch (sound) {
        case "click":
            playTone(500, 0.08, "square", 0.04);
            break;

        case "higher":
            playTone(650, 0.12, "triangle");
            break;

        case "lower":
            playTone(330, 0.12, "triangle");
            break;

        case "win":
            playTone(523, 0.18, "square", 0.05);
            setTimeout(() => playTone(659, 0.18, "square", 0.05), 140);
            setTimeout(() => playTone(784, 0.3, "square", 0.05), 280);
            break;

        case "error":
            playTone(180, 0.2, "sawtooth", 0.05);
            break;

        case "pause":
            playTone(400, 0.12);
            break;

        case "resume":
            playTone(600, 0.12);
            break;
    }
}

// ========================================
// BACKGROUND MUSIC
// ========================================

const melody = [
    261.63, 329.63, 392.00, 329.63,
    293.66, 349.23, 440.00, 349.23,
    261.63, 329.63, 392.00, 523.25,
    440.00, 392.00, 329.63, 293.66
];

function playMusicNote(frequency) {
    if (!audioContext || !musicEnabled) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.012, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.35
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.35);
}

function startMusic() {
    if (!musicEnabled || musicTimer) return;

    initializeAudio();

    if (!audioContext) return;

    musicTimer = setInterval(() => {
        if (!musicEnabled) return;

        playMusicNote(melody[musicStep % melody.length]);
        musicStep++;
    }, 400);
}

function stopMusic() {
    if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
    }
}

function updateMusic() {
    if (musicEnabled) {
        startMusic();
    } else {
        stopMusic();
    }
}

// ========================================
// SETTINGS
// ========================================

function updateSettingsButtons() {
    musicToggle.textContent = musicEnabled ? "ON" : "OFF";
    sfxToggle.textContent = sfxEnabled ? "ON" : "OFF";

    musicToggle.classList.toggle("off", !musicEnabled);
    sfxToggle.classList.toggle("off", !sfxEnabled);
}

function toggleMusic() {
    musicEnabled = !musicEnabled;

    writeStorage(STORAGE_KEYS.music, musicEnabled);
    updateSettingsButtons();
    updateMusic();

    playSound("click");
}

function toggleSfx() {
    sfxEnabled = !sfxEnabled;

    writeStorage(STORAGE_KEYS.sfx, sfxEnabled);
    updateSettingsButtons();

    if (sfxEnabled) {
        playSound("click");
    }
}

// ========================================
// FUN FACT DISPLAY
// ========================================

function hideFunFact() {
    funFactCard.classList.add("hidden");

    funFactCategory.textContent = "";
    funFactTitle.textContent = "";
    funFactText.textContent = "";
    funFactNumber.textContent = "";
}

function showFunFact(number) {
    const fact = getFunFact(number);

    if (!fact) {
        hideFunFact();
        return;
    }

    funFactCategory.textContent = fact.category;
    funFactTitle.textContent = fact.title;
    funFactText.textContent = fact.text;
    funFactNumber.textContent = number;

    funFactCard.classList.remove("hidden");
}

// ========================================
// GAME FUNCTIONS
// ========================================

function startGame() {
    initializeAudio();

    maxNumber = difficulties[selectedDifficulty].max;
    secretNumber = Math.floor(Math.random() * maxNumber) + 1;

    attempts = 0;
    gameOver = false;

    difficultyLabel.textContent = difficulties[selectedDifficulty].name + " MODE";
    maxNumberDisplay.textContent = maxNumber.toLocaleString();

    guessInput.min = 1;
    guessInput.max = maxNumber;
    guessInput.placeholder = `1 - ${maxNumber.toLocaleString()}`;

    clueNumber.textContent = "?";
    clueText.textContent = "Enter a number to begin!";
    attemptsDisplay.textContent = "0";

    guessInput.value = "";
    guessInput.disabled = false;

    message.textContent = "";
    message.className = "message";

    resultActions.classList.add("hidden");
    guessForm.classList.remove("hidden");

    hideFunFact();

    showScreen(gameScreen);
    startMusic();

    playSound("click");
    guessInput.focus();
}

function submitGuess(event) {
    event.preventDefault();

    if (gameOver) return;

    initializeAudio();

    const guess = Number(guessInput.value);

    if (!Number.isInteger(guess) || guess < 1 || guess > maxNumber) {
        message.textContent =
            `Enter a whole number from 1 to ${maxNumber.toLocaleString()}.`;

        message.className = "message error";

        playSound("error");
        guessInput.focus();

        return;
    }

    attempts++;
    attemptsDisplay.textContent = attempts;

    if (guess === secretNumber) {
        finishGame();
        return;
    }

    if (guess < secretNumber) {
        clueNumber.textContent = "↑";
        clueText.textContent = "The secret number is HIGHER!";
        message.textContent = "Too low! Try a higher number.";

        playSound("higher");
    } else {
        clueNumber.textContent = "↓";
        clueText.textContent = "The secret number is LOWER!";
        message.textContent = "Too high! Try a lower number.";

        playSound("lower");
    }

    message.className = "message";

    guessInput.value = "";
    guessInput.focus();
}

function finishGame() {
    gameOver = true;

    clueNumber.textContent = secretNumber.toLocaleString();
    clueText.textContent = "You found the secret number!";

    message.textContent =
        `Amazing! You guessed it in ${attempts} attempt(s)!`;

    message.className = "message success";

    guessInput.disabled = true;

    guessForm.classList.add("hidden");
    resultActions.classList.remove("hidden");

    showFunFact(secretNumber);

    const oldRecord = getRecord(selectedDifficulty);

    if (oldRecord === 0 || attempts < oldRecord) {
        writeStorage(
            difficulties[selectedDifficulty].recordKey,
            attempts
        );

        updateRecords();

        message.textContent += " New personal record!";
    }

    playSound("win");
}

// ========================================
// PAUSE / RESUME / HOME
// ========================================

function pauseGame() {
    if (gameOver) return;

    showScreen(pauseScreen);

    stopMusic();
    playSound("pause");
}

function resumeGame() {
    showScreen(gameScreen);

    startMusic();
    playSound("resume");

    if (!gameOver) {
        guessInput.focus();
    }
}

function quitToHome() {
    gameOver = true;

    stopMusic();
    openHome();

    playSound("click");
}

// ========================================
// INTRO SCREEN
// ========================================

function startFromIntro() {
    initializeAudio();

    playSound("click");
    openHome();
}

// ========================================
// BUTTON EVENT LISTENERS
// ========================================

document.getElementById("introStartButton")
    .addEventListener("click", startFromIntro);

document.getElementById("playButton")
    .addEventListener("click", openDifficultySelection);

document.querySelectorAll(".difficulty-option").forEach(button => {
    button.addEventListener("click", () => {
        chooseDifficulty(button.dataset.difficulty);
    });
});

document.getElementById("difficultyBackButton")
    .addEventListener("click", openHome);

document.getElementById("recordsButton")
    .addEventListener("click", () => {
        updateRecords();
        showScreen(recordsScreen);
        playSound("click");
    });

document.getElementById("settingsButton")
    .addEventListener("click", () => {
        updateSettingsButtons();
        showScreen(settingsScreen);
        playSound("click");
    });

document.getElementById("homeQuitButton")
    .addEventListener("click", openQuitScreen);

document.getElementById("gameHomeButton")
    .addEventListener("click", openQuitScreen);

document.getElementById("pauseButton")
    .addEventListener("click", pauseGame);

document.getElementById("resumeButton")
    .addEventListener("click", resumeGame);

document.getElementById("pauseHomeButton")
    .addEventListener("click", quitToHome);

document.getElementById("pauseQuitButton")
    .addEventListener("click", openQuitScreen);

document.getElementById("againButton")
    .addEventListener("click", startGame);

document.getElementById("changeDifficultyButton")
    .addEventListener("click", openDifficultySelection);

document.getElementById("resultHomeButton")
    .addEventListener("click", openHome);

document.getElementById("recordsHomeButton")
    .addEventListener("click", openHome);

document.getElementById("settingsHomeButton")
    .addEventListener("click", openHome);

document.getElementById("cancelQuitButton")
    .addEventListener("click", cancelQuit);

document.getElementById("confirmQuitButton")
    .addEventListener("click", confirmQuit);

musicToggle.addEventListener("click", toggleMusic);
sfxToggle.addEventListener("click", toggleSfx);

guessForm.addEventListener("submit", submitGuess);

// ========================================
// INITIALIZE GAME
// ========================================

updateRecords();
updateSettingsButtons();
hideFunFact();

// Start on the new arcade introduction screen.
// Music begins only after the player presses START.
showScreen(introScreen); 