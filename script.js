// =========================================================================
// 🎰 3. 슬롯머신 구동 로직 (애니메이션 + 순차 정지 + 자체 확률 로직)
// =========================================================================
async function spin() {
    updateUI(); 
    if (isSpinning || isGameOver) return;
    if (balance < currentBet) {
        showMessage('잔액이 부족합니다.', '#ff6b6b'); return;
    }

    isSpinning = true;
    balance -= currentBet;
    updateUI(); // 잔액이 깎인 상태를 즉시 보고
    showMessage('슬롯이 맹렬하게 돌아갑니다!', '#fdf0a6');
    
    document.getElementById('spin-btn').disabled = true;
    document.getElementById('quit-btn').disabled = true;
    
    const handleBox = document.getElementById('handle-container');
    if(handleBox) handleBox.classList.add('pulling');
    setTimeout(() => { if(handleBox) handleBox.classList.remove('pulling'); }, 500);

    const reels = [
        document.getElementById('reel1'), 
        document.getElementById('reel2'), 
        document.getElementById('reel3')
    ];
    reels.forEach(reel => reel.classList.add('spinning'));
    
    let reelStopped = [false, false, false];

    // 빠른 속도로 기호 변경
    const spinInterval = setInterval(() => {
        reels.forEach((reel, index) => {
            if (reel && !reelStopped[index]) {
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.innerHTML = `<li class="symbol">${randomSymbol}</li>`;
            }
        });
    }, 80); 

    try {
        let finalResults, appliedMode;

        // 관제실보다 기기 앞의 키보드 조작이 우선 적용됨
        if (localCheatMode) {
            appliedMode = localCheatMode;
            if (appliedMode === 'jackpot') finalResults = [5, 5, 5];
            else if (appliedMode === 'lose') finalResults = [0, 1, 2];
            else if (appliedMode === 'win_cherry') finalResults = [0, 0, 0];
            localCheatMode = null; 
        } 
        // 🌟 자체 확률 로직 적용 (서버 요청 대신 여기서 결과 생성)
        else {
            const winRateRoll = Math.random() * 100;

            if (winRateRoll >= 5.0) {
                // ❌ [95% 확률] 꽝 처리 (세 칸이 절대 같지 않게 만듦)
                appliedMode = 'lose';
                const r1 = Math.floor(Math.random() * symbols.length);
                let r2 = Math.floor(Math.random() * symbols.length);
                let r3 = Math.floor(Math.random() * symbols.length);
                
                while (r1 === r2 && r2 === r3) {
                    r2 = Math.floor(Math.random() * symbols.length);
                    r3 = Math.floor(Math.random() * symbols.length);
                }
                finalResults = [r1, r2, r3];
            } else {
                // 🎉 [5% 확률] 당첨 처리 (배율에 따른 가중치 적용)
                const winWeights = [
                    { index: 0, weight: 50.0 }, // 🍒 체리 (2배) - 당첨 중 50%
                    { index: 1, weight: 25.0 }, // 🍋 레몬 (3배) - 당첨 중 25%
                    { index: 2, weight: 13.0 }, // 🍉 수박 (5배) - 당첨 중 13%
                    { index: 3, weight: 8.0  }, // 🔔 종 (10배)  - 당첨 중 8%
                    { index: 4, weight: 3.5  }, // 💎 다이아 (20배)- 당첨 중 3.5%
                    { index: 5, weight: 0.5  }  // 7️⃣ 7 (50배)   - 당첨 중 0.5%
                ];

                const symbolRoll = Math.random() * 100;
                let accumulatedWeight = 0;
                let selectedIndex = 0;

                for (const item of winWeights) {
                    accumulatedWeight += item.weight;
                    if (symbolRoll <= accumulatedWeight) {
                        selectedIndex = item.index;
                        break;
                    }
                }

                appliedMode = (selectedIndex === 5) ? 'jackpot' : 'win';
                finalResults = [selectedIndex, selectedIndex, selectedIndex];
            }
            
            // 결과를 서버에 통보만 할 거라면 관제실 보고 함수를 여기에 둘 수 있습니다.
            // (이미 정지할 때 reportStatus()를 호출하므로 별도 통신 생략)
        }

        if (appliedMode === 'jackpot') setStealthLight('var(--gold)', 'transparent');
        else if (appliedMode === 'lose') setStealthLight('#ff6b6b', 'transparent');
        else if (appliedMode === 'tease') setStealthLight('#ff9800', 'transparent');
        else setStealthLight('transparent', 'transparent');

        // 🌟 1초 뒤 첫 번째 칸 정지 + 관제실에 보고
        setTimeout(() => {
            reelStopped[0] = true; reels[0].classList.remove('spinning');
            reels[0].innerHTML = `<li class="symbol">${symbols[finalResults[0]]}</li>`; 
            reportStatus(); 
        }, 1000);

        // 🌟 1.5초 뒤 두 번째 칸 정지 + 관제실에 보고
        setTimeout(() => {
            reelStopped[1] = true; reels[1].classList.remove('spinning');
            reels[1].innerHTML = `<li class="symbol">${symbols[finalResults[1]]}</li>`; 
            reportStatus(); 
        }, 1500);

        // 🌟 2초 뒤 세 번째 칸 정지 + 관제실에 보고
        setTimeout(() => {
            reelStopped[2] = true; reels[2].classList.remove('spinning');
            reels[2].innerHTML = `<li class="symbol">${symbols[finalResults[2]]}</li>`; 
            reportStatus(); 
        }, 2000);

        // 🌟 2.5초 뒤 정산 시작
        setTimeout(() => {
            clearInterval(spinInterval);
            checkResult(finalResults, currentBet);
        }, 2500);

    } catch (error) {
        clearInterval(spinInterval);
        reels.forEach(reel => reel.classList.remove('spinning'));
        showMessage('오류가 발생했습니다. 진행요원에게 문의하세요.', '#ff6b6b');
        isSpinning = false;
        document.getElementById('spin-btn').disabled = false;
        document.getElementById('quit-btn').disabled = false;
        updateUI();
    }
}
