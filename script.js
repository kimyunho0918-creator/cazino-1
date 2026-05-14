// 🎰 슬롯머신 구동 및 서버 연동 (순차 정지 애니메이션 적용)
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
    
    // 버튼 잠금 및 레버 애니메이션 트리거
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
    
    // 🌟 [수정됨] 각 릴이 멈췄는지 기억하는 체크리스트 (처음엔 모두 false)
    let isStopped = [false, false, false];

    // 시각적 회전 애니메이션 시작
    reels.forEach(reel => reel.classList.add('spinning'));
    
    const spinInterval = setInterval(() => {
        reels.forEach((reel, index) => {
            // 🌟 [수정됨] 아직 멈추지 않은 릴만 무작위로 계속 그림을 바꿉니다!
            if (!isStopped[index] && reel) {
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.innerHTML = `<li class="symbol">${randomSymbol}</li>`;
            }
        });
    }, 80); 

    try {
        // 서버에 결과 요청
        const response = await fetch(`${SERVER_URL}/api/spin/${machineId}`);
        const data = await response.json();
        const finalResults = data.results; 
        const appliedMode = data.mode;

        // 스텔스 조명 피드백
        if (appliedMode === 'jackpot') setStealthLight('var(--gold)', 'transparent');
        else if (appliedMode === 'lose') setStealthLight('#ff6b6b', 'transparent');
        else setStealthLight('transparent', 'transparent');

        // 🌟 [수정됨] 순서대로 하나씩 멈추는 쪼는 맛(Tension) 추가!
        
        // 1번 릴 정지 (2초 뒤)
        setTimeout(() => {
            isStopped[0] = true; // 1번 릴 멈춤 표시
            reels[0].classList.remove('spinning'); // 진동 애니메이션 끄기
            reels[0].innerHTML = `<li class="symbol">${symbols[finalResults[0]]}</li>`; // 진짜 결과 박기
        }, 2000);

        // 2번 릴 정지 (2.5초 뒤)
        setTimeout(() => {
            isStopped[1] = true;
            reels[1].classList.remove('spinning');
            reels[1].innerHTML = `<li class="symbol">${symbols[finalResults[1]]}</li>`;
        }, 2500);

        // 3번 릴 정지 (3초 뒤) - 마지막 결과 확인!
        setTimeout(() => {
            isStopped[2] = true;
            reels[2].classList.remove('spinning');
            reels[2].innerHTML = `<li class="symbol">${symbols[finalResults[2]]}</li>`;
            
            // 모든 릴이 멈췄으니, 애니메이션 돌리는 인터벌을 완전히 삭제
            clearInterval(spinInterval);
            
            // 승패 판정
            checkResult(finalResults, currentBet);
        }, 3000);

    } catch (error) {
        // 에러 났을 때는 모든 애니메이션 강제 종료
        clearInterval(spinInterval);
        reels.forEach(reel => reel.classList.remove('spinning'));
        showMessage('서버 통신 오류. 진행요원에게 문의하세요.', '#ff6b6b');
        isSpinning = false;
        if(spinBtn) spinBtn.disabled = false;
        if(quitBtn) quitBtn.disabled = false;
    }
}
