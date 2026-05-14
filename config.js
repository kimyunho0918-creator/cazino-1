const symbols = ['🍒', '🍋', '🍉', '🔔', '💎', '7️⃣'];

// 심볼별 배당률
const config = {
    '🍒': 2,
    '🍋': 3,
    '🍉': 5,
    '🔔': 10,
    '💎': 20,
    '7️⃣': 50
};
// 기호 배열 생성
const symbols = Object.keys(config);

// 릴 한 칸의 크기 (CSS의 --reel-size와 동일해야 함)
const reelSize = 120;