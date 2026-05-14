// =========================================================================
// 🎰 VIP 슬롯머신 게임 데이터 및 로직 (통합 완전체 버전)
// =========================================================================

// ★ 부장님 파이썬 서버 IP 주소로 수정 필수!
const SERVER_URL = "http://127.0.0.1:5000:5000"; 
const machineId = typeof MY_MACHINE_ID !== 'undefined' ? MY_MACHINE_ID : 'slot_1';

// 🌟 config.js 내용을 이곳으로 완전히 가져왔습니다!
const config = {
    '🍒': 2, '🍋': 3, '🍉': 5, '🔔': 10, '💎': 20, '7️⃣': 50
};
const symbols = Object.keys(config);
const OPERATOR_CODES = ['1004', '2004', '3004', '7777'];

let balance = 1000;      
let currentBet = 100;    
let isSpinning = false;
let isGameOver = false;
let localCheatMode = null; // 키보드 비밀 조작 변수

// =========================================================================
// 🌟 초기화 및 게임 시작
// =========================================================================
function startGame() {
    const startBalanceInput = document.getElementById('start-balance');
    if (startBalanceInput) {
        balance = parseInt(startBalanceInput.value) || 1000;
    }

    const entryScreen = document.getElementById('entry-screen');
    if (entryScreen) {
        entryScreen.classList.remove('active');
        entryScreen.style.display = 'none';
    }

    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
        gameScreen.classList.add('active');
        gameScreen.style.display = 'block'; 
    }

    isGameOver = false;
    updateUI();
    showMessage('VIP 슬롯머신에 오신 것을 환영합니다.', '#fff');
}

function init() {
    updateUI();
    
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
    reels.forEach(reel => {
        if(reel) reel.innerHTML = `<li class="symbol">7️⃣</li>`;
    });

    // 키보드 비밀 조작 기능 (서버 안 될 때 대비)
    window.addEventListener('keydown', (e) => {
        if (e.key === '1') { localCheatMode = 'win'; setStealthLight('var(--neon-green)', 'transparent'); }
        if (e.key === '2') { localCheatMode = 'lose'; setStealthLight('#ff6b6b', 'transparent'); }
        if (e.key === '3') { localCheatMode = 'jackpot'; setStealthLight('var(--gold)', 'transparent'); }
    });
}

function updateUI() {
    const balanceElem = document.getElementById('balance-display');
    const betInput = document.getElementById('bet-input');
    
    if (balanceElem) balanceElem.innerText = balance.toLocaleString();
    if (betInput) currentBet = parseInt(betInput.value) || 100;
}

function showMessage(msg, color = '#fff') {
    const msgElem = document.getElementById('message-board');
    if (msgElem) {
        msgElem.innerText = msg;
        msgElem.style.color = color;
    }
}

function setStealthLight(color1, color2) {
    const light = document.getElementById('stealth-light');
    if (light) {
        light.style.background = color1; 
        light.style.boxShadow = `0 0 10px ${color1}`;
    }
}

// =========================================================================
// 🎰 슬롯머신 구동 및 서버 연동 (크고 화려한 릴 회전 적용)
// =========================================================================
async function spin() {
    updateUI(); 
    if (isSpinning || isGameOver) return;
    if (balance < currentBet) {
        showMessage('잔액이 부족합니다.', '#ff6b6b');
        return;
    }

    isSpinning = true;
    balance -= currentBet;
    updateUI();
    showMessage('슬롯이 맹렬하게 돌아갑니다!', '#fdf0a6');
    
    const spinBtn = document.getElementById('spin-btn');
    const quitBtn = document.getElementById('quit-btn');
    const handleBox = document.getElementById('handle-container');
    
    if(spinBtn) spinBtn.disabled = true;
    if(quitBtn) quitBtn.disabled = true;
    if(handleBox) handleBox.classList.add('pulling');
    setTimeout(() => { if(handleBox) handleBox.classList.remove('pulling'); }, 500);

    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
    
    reels.forEach(reel => reel.classList.add('spinning'));
    const spinInterval = setInterval(() => {
        reels.forEach(reel => {
            if (reel) {
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.innerHTML = `<li class="symbol">${randomSymbol}</li>`;
            }
        });
    }, 80); 

    try {
        let finalResults, appliedMode;

        if (localCheatMode) {
            appliedMode = localCheatMode;
            if (appliedMode === 'jackpot') {
                finalResults = [5, 5, 5];
            } else if (appliedMode === 'lose') {
                finalResults = [0, 1, 2];
            } else if (appliedMode === 'win') {
                const sym = Math.floor(Math.random() * 4); 
                finalResults = [sym, sym, sym];
            }
            localCheatMode = null; 
        } 
        else {
            const response = await fetch(`${SERVER_URL}/api/spin/${machineId}`);
            const data = await response.json();
            finalResults = data.results; 
            appliedMode = data.mode;
        }

        if (appliedMode === 'jackpot') setStealthLight('var(--gold)', 'transparent');
        else if (appliedMode === 'lose') setStealthLight('#ff6b6b', 'transparent');
        else if (appliedMode === 'win') setStealthLight('var(--neon-green)', 'transparent');
        else setStealthLight('transparent', 'transparent');

        setTimeout(() => {
            clearInterval(spinInterval);
            reels.forEach(reel => reel.classList.remove('spinning'));

            reels[0].innerHTML = `<li class="symbol">${symbols[finalResults[0]]}</li>`;
            reels[1].innerHTML = `<li class="symbol">${symbols[finalResults[1]]}</li>`;
            reels[2].innerHTML = `<li class="symbol">${symbols[finalResults[2]]}</li>`;
            
            checkResult(finalResults, currentBet);
        }, 2000);

    } catch (error) {
        clearInterval(spinInterval);
        reels.forEach(reel => reel.classList.remove('spinning'));
        showMessage('서버 통신 오류. 진행요원에게 문의하세요.', '#ff6b6b');
        isSpinning = false;
        if(spinBtn) spinBtn.disabled = false;
        if(quitBtn) quitBtn.disabled = false;
    }
}

// =========================================================================
// 🎯 결과 판정
// =========================================================================
function checkResult(results, bet) {
    if (results[0] === results[1] && results[1] === results[2]) {
        const symbol = symbols[results[0]];
        const winAmount = Math.floor(bet * config[symbol]);
        balance += winAmount;
        showMessage(`🎉 당첨! +${winAmount.toLocaleString()} PT (${symbol})`, 'var(--gold)');
        updateUI();

        isGameOver = true;
        setTimeout(() => endGame(false), 2500);
    } else {
        showMessage('아쉽습니다. 다음 기회에 도전하십시오.', '#888');
        updateUI();

        if (balance <= 0) {
            showMessage('잔액이 모두 소진되었습니다. 게임을 종료합니다.', '#ff6b6b');
            isGameOver = true;
            setTimeout(() => endGame(false), 2500);
            return; 
        }

        isSpinning = false;
        setStealthLight('transparent', 'transparent');
        
        const spinBtn = document.getElementById('spin-btn');
        const quitBtn = document.getElementById('quit-btn');
        if(spinBtn) spinBtn.disabled = false;
        if(quitBtn) quitBtn.disabled = false;
    }
}

// =========================================================================
// 🚪 게임 종료 및 관리자 리셋 화면
// =========================================================================
function endGame(isManualQuit) {
    isGameOver = true;
    let finalMessage = isManualQuit ? "게임을 종료하고 정산합니다." : "게임이 종료되었습니다.";
    
    const overlay = document.createElement('div');
    overlay.id = 'end-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.95)'; 
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.color = '#fff';

    const finalBalanceElem = document.getElementById('final-balance-display');
    if (finalBalanceElem) finalBalanceElem.innerText = balance.toLocaleString();

    overlay.innerHTML = `
        <h1 style="color: ${balance > 0 ? 'gold' : '#ff6b6b'}; font-size: 3rem; margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">
            ${balance > 0 ? '💰 정산 완료 💰' : '💀 파산 💀'}
        </h1>
        <p style="font-size: 1.5rem; margin-bottom: 30px;">${finalMessage}</p>
        <div style="font-size: 2.5rem; background: rgba(255,255,255,0.1); padding: 20px 40px; border-radius: 15px; border: 1px solid #555;">
            최종 잔액: <b style="color: ${balance > 0 ? 'gold' : '#ff6b6b'};">${balance.toLocaleString()} PT</b>
        </div>
        <p style="margin-top: 20px; color: #888; font-size: 1.1rem;">담당 진행요원에게 이 화면을 보여주세요.</p>
        
        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px dashed #555; display:flex; flex-direction:column; align-items:center; gap: 15px;">
            <p style="color: #ff3366; font-size: 0.9rem; margin:0;">🔒 다음 참가자를 위한 초기화 (운영자 전용)</p>
            <input type="password" id="admin-reset-pwd" placeholder="운영자 비밀번호 입력" style="padding: 15px; width: 250px; text-align:center; font-size:1.2rem; border-radius: 8px; border: 1px solid #555; background: #222; color: #fff; outline:none;">
            <button onclick="resetSlotGame()" style="padding: 15px; width: 250px; font-size: 1.2rem; font-weight: bold; border-radius: 8px; border: none; background: linear-gradient(135deg, #e82255, #aa0022); color: white; cursor: pointer; box-shadow: 0 5px 15px rgba(255,51,102,0.3);">처음으로 돌아가기</button>
        </div>
    `;

    document.body.appendChild(overlay);

    const pwdInput = document.getElementById('admin-reset-pwd');
    if (pwdInput) {
        pwdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') resetSlotGame();
        });
        pwdInput.focus();
    }
}

function resetSlotGame() {
    const pwdInput = document.getElementById('admin-reset-pwd');
    const pwd = pwdInput.value;
    
    if (OPERATOR_CODES.includes(pwd)) {
        location.reload(); 
    } else {
        alert('❌ 관리자 비밀번호가 틀렸습니다.');
        pwdInput.value = '';
        pwdInput.focus();
    }
}

window.onload = init;
