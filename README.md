# PIXI.js 範例

1. **添加音效**：在收集物品和遊戲結束時播放音效。
2. **加入敵人或障礙物**：添加移動的敵人（藍色三角形），碰撞後扣除生命值。
3. **添加遊戲結束條件**：玩家有3條生命，生命耗盡時遊戲結束並顯示結束畫面。
4. **使用圖片資源**：使用簡單的圖片資源替代玩家、物品和敵人的圖形。

---

## 專案結構

```plaintext
simple-pixi-game/
├── index.html
├── main.js
├── assets/
│   ├── player.png
│   ├── item.png
│   ├── enemy.png
│   ├── collect.mp3
│   ├── gameover.mp3
└── package.json
```

### 圖片資源

你需要準備以下圖片（或使用簡單的占位圖片）：

- `player.png`：玩家圖片（建議 50x50 像素，例如紅色飛船）。
- `item.png`：物品圖片（建議 30x30 像素，例如黃色星星）。
- `enemy.png`：敵人圖片（建議 40x40 像素，例如藍色三角形）。

音效資源：

- `collect.mp3`：收集物品時的音效。
- `gameover.mp3`：遊戲結束時的音效。

你可以在免費資源網站（如 OpenGameArt 或 Freesound）找到合適的圖片和音效，或用簡單的圖片編輯器創建占位圖片。

---

## 1. index.html

更新 HTML 文件以確保資源正確載入。

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>增強版 Pixi.js 遊戲</title>
    <style>
        body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f0f0;
        }
        canvas {
            border: 1px solid black;
        }
        #gameOver {
            position: absolute;
            display: none;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            text-align: center;
            font-family: Arial, sans-serif;
        }
    </style>
</head>
<body>
    <div id="gameOver">
        <h1>遊戲結束</h1>
        <p>最終分數: <span id="finalScore"></span></p>
        <button onclick="location.reload()">重新開始</button>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.js"></script>
    <script src="main.js"></script>
</body>
</html>
```

---

## 2. main.js

更新遊戲邏輯，包含音效、敵人、遊戲結束條件和圖片資源。

```javascript
// 初始化 Pixi.js 應用
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1,
});
document.body.appendChild(app.view);

// 預加載資源
const loader = PIXI.Loader.shared;
loader
    .add('player', 'assets/player.png')
    .add('item', 'assets/item.png')
    .add('enemy', 'assets/enemy.png')
    .add('collectSound', 'assets/collect.mp3')
    .add('gameOverSound', 'assets/gameover.mp3')
    .load(setup);

let player, scoreText, livesText, gameOverScreen, finalScoreText;
let score = 0;
let lives = 3;
let items = [];
let enemies = [];
let keys = {};
let gameActive = true;

// 設置遊戲
function setup() {
    // 創建分數和生命文字
    scoreText = new PIXI.Text(`分數: ${score}`, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
    });
    scoreText.position.set(10, 10);
    app.stage.addChild(scoreText);

    livesText = new PIXI.Text(`生命: ${lives}`, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
    });
    livesText.position.set(10, 40);
    app.stage.addChild(livesText);

    // 創建玩家
    player = new PIXI.Sprite(loader.resources['player'].texture);
    player.anchor.set(0.5);
    player.width = 50;
    player.height = 50;
    player.x = 400;
    player.y = 300;
    app.stage.addChild(player);

    // 遊戲結束畫面
    gameOverScreen = document.getElementById('gameOver');
    finalScoreText = document.getElementById('finalScore');

    // 鍵盤事件
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // 開始遊戲迴圈
    app.ticker.add(gameLoop);
}

// 創建物品
function createItem() {
    const item = new PIXI.Sprite(loader.resources['item'].texture);
    item.anchor.set(0.5);
    item.width = 30;
    item.height = 30;
    item.x = Math.random() * (app.screen.width - 30) + 15;
    item.y = Math.random() * (app.screen.height - 30) + 15;
    app.stage.addChild(item);
    items.push(item);
}

// 創建敵人
function createEnemy() {
    const enemy = new PIXI.Sprite(loader.resources['enemy'].texture);
    enemy.anchor.set(0.5);
    enemy.width = 40;
    enemy.height = 40;
    enemy.x = Math.random() * (app.screen.width - 40) + 20;
    enemy.y = -20;
    enemy.speed = 2 + Math.random() * 2;
    app.stage.addChild(enemy);
    enemies.push(enemy);
}

// 碰撞檢測
function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (a.width / 2 + b.width / 2);
}

// 結束遊戲
function endGame() {
    gameActive = false;
    app.ticker.stop();
    finalScoreText.textContent = score;
    gameOverScreen.style.display = 'block';
    const gameOverSound = new Audio(loader.resources['gameOverSound'].url);
    gameOverSound.play();
}

// 遊戲主迴圈
function gameLoop() {
    if (!gameActive) return;

    // 移動玩家
    const speed = 5;
    if (keys['ArrowUp']) player.y -= speed;
    if (keys['ArrowDown']) player.y += speed;
    if (keys['ArrowLeft']) player.x -= speed;
    if (keys['ArrowRight']) player.x += speed;

    // 限制玩家在畫面內
    player.x = Math.max(25, Math.min(app.screen.width - 25, player.x));
    player.y = Math.max(25, Math.min(app.screen.height - 25, player.y));

    // 生成物品和敵人
    if (Math.random() < 0.02) createItem();
    if (Math.random() < 0.01) createEnemy();

    // 處理物品碰撞
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (checkCollision(player, item)) {
            app.stage.removeChild(item);
            items.splice(i, 1);
            score += 10;
            scoreText.text = `分數: ${score}`;
            const collectSound = new Audio(loader.resources['collectSound'].url);
            collectSound.play();
        }
    }

    // 處理敵人
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        if (enemy.y > app.screen.height + 20) {
            app.stage.removeChild(enemy);
            enemies.splice(i, 1);
            continue;
        }
        if (checkCollision(player, enemy)) {
            app.stage.removeChild(enemy);
            enemies.splice(i, 1);
            lives -= 1;
            livesText.text = `生命: ${lives}`;
            if (lives <= 0) {
                endGame();
            }
        }
    }
}
```

---

## 3. package.json

與之前相同，確保可以用本地伺服器運行。

```json
{
  "name": "simple-pixi-game",
  "version": "1.0.0",
  "description": "A simple Pixi.js game",
  "scripts": {
    "start": "http-server -c-1"
  },
  "dependencies": {
    "http-server": "^14.1.1"
  }
}
```

---

## 安裝與運行

1. **準備資源**：
   - 在 `assets/` 資料夾中放入 `player.png`、`item.png`、`enemy.png`、`collect.mp3` 和 `gameover.mp3`。
   - 如果沒有資源，可以用簡單的圖片（例如用畫圖工具繪製）或從免費資源網站下載。

2. **運行專案**：
   - 安裝 Node.js。
   - 在專案資料夾中運行：

     ```bash
     npm install
     npm start
     ```

   - 打開瀏覽器，訪問 `http://localhost:8080`。

3. **直接運行**：
   - 如果不使用伺服器，確保 `assets/` 資料夾與 `index.html` 在同一目錄下，然後直接打開 `index.html`（需要連網以載入 Pixi.js）。

---

## 遊戲說明

- **目標**：控制玩家（圖片，例如紅色飛船）移動，收集物品（例如黃色星星）以獲得分數，同時避開敵人（例如藍色三角形）。
- **操作**：
  - 使用方向鍵（上、下、左、右）控制玩家移動。
  - 玩家不能移出畫面邊界。
- **遊戲邏輯**：
  - **物品**：隨機生成，收集時加 10 分並播放音效。
  - **敵人**：從畫面上方生成，向下移動，碰撞後扣除 1 條生命。
  - **生命**：初始有 3 條生命，生命為 0 時遊戲結束，顯示最終分數並播放遊戲結束音效。
  - **結束畫面**：顯示最終分數和“重新開始”按鈕。
- **音效**：
  - 收集物品時播放 `collect.mp3`。
  - 遊戲結束時播放 `gameover.mp3`。

---

## 注意事項

1. **資源載入**：
   - 確保圖片和音效文件路徑正確，否則遊戲可能無法正常運行。
   - 如果資源載入失敗，可以檢查瀏覽器控制台的錯誤訊息。
2. **音效問題**：
   - 瀏覽器可能因安全策略（如自動播放限制）導致音效無法播放，建議在用戶交互後（如按鍵）觸發音效。
3. **圖片尺寸**：
   - 圖片尺寸應與程式中設定的寬高匹配（玩家 50x50，物品 30x30，敵人 40x40），否則可能需要調整 `width` 和 `height` 屬性。
4. **性能**：
   - 如果物品或敵人生成過多，可能影響性能，可以調整生成機率（`Math.random() < 0.02` 和 `0.01`）。

---

## 總結

該範例專案**完全符合**你列出的七個要求：

1. 建立了玩家、物品、敵人和 UI 物件。
2. 實現了鍵盤操控玩家的移動。
3. 添加了收集和遊戲結束的音效。
4. 使用圖片資源（`player.png`、`item.png`、`enemy.png`）替代簡單圖形。
5. 實現了玩家與物品及敵人的碰撞互動。
6. 創建並動態更新了分數、生命和遊戲結束 UI。
7. 提供了完整的遊戲開始（初始化和迴圈）與結束（停止和重啟）流程。

如果有任何需要進一步優化或擴展的部分（例如添加新功能或改進某個方面），請告訴我！
