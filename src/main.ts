import * as PIXI from "pixi.js";

(async () => {
  const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1,
  });
  document.body.appendChild(app.canvas);

  // https://github.com/pixijs/pixijs/discussions/9433#discussioncomment-5953492
  PIXI.Assets.add({ alias: "player", src: "assets/player.png" });
  PIXI.Assets.add({ alias: "item", src: "assets/item.png" });
  PIXI.Assets.add({ alias: "enemy", src: "assets/enemy.png" });
  PIXI.Assets.add({ alias: "collectSound", src: "assets/collect.mp3" });
  PIXI.Assets.add({ alias: "gameOverSound", src: "assets/gameover.mp3" });
  PIXI.Assets.load([
    "player",
    "item",
    "enemy",
    "collectSound",
    "gameOverSound",
  ]).then(setup);
  // 預加載資源
  // const loader = PIXI.Loader.shared;
  // loader
  //   .add("player", "assets/player.png")
  //   .add("item", "assets/item.png")
  //   .add("enemy", "assets/enemy.png")
  //   .add("collectSound", "assets/collect.mp3")
  //   .add("gameOverSound", "assets/gameover.mp3")
  //   .load(setup);

  let player: PIXI.Sprite,
    scoreText: PIXI.Text,
    livesText: PIXI.Text,
    gameOverScreen: HTMLElement,
    finalScoreText: HTMLElement;
  let score = 0;
  let lives = 3;
  const items: PIXI.Sprite[] = [];
  const enemies: PIXI.Sprite[] = [];
  const keys: { [key: string]: boolean } = {};
  let gameActive = true;

  // 設置遊戲
  function setup() {
    // 創建分數和生命文字
    scoreText = new PIXI.Text(`分數: ${score}`, {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
    });
    scoreText.position.set(10, 10);
    app.stage.addChild(scoreText);

    livesText = new PIXI.Text(`生命: ${lives}`, {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
    });
    livesText.position.set(10, 40);
    app.stage.addChild(livesText);
    // 創建玩家
    player = new PIXI.Sprite(PIXI.Assets.get<PIXI.Texture>("player"));
    player.anchor.set(0.5);
    player.width = 50;
    player.height = 50;
    player.x = 400;
    player.y = 300;
    app.stage.addChild(player);

    // 遊戲結束畫面
    gameOverScreen = document.getElementById("gameOver")!;
    finalScoreText = document.getElementById("finalScore")!;

    // 鍵盤事件
    window.addEventListener("keydown", (e) => {
      keys[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      keys[e.code] = false;
    });

    // 開始遊戲迴圈
    app.ticker.add(gameLoop);
  }

  // 創建物品
  function createItem() {
    const item = new PIXI.Sprite(PIXI.Assets.get<PIXI.Texture>("item"));
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
    const enemy = new PIXI.Sprite(PIXI.Assets.get<PIXI.Texture>("enemy"));
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
  function checkCollision(a: PIXI.Sprite, b: PIXI.Sprite) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < a.width / 2 + b.width / 2;
  }

  // 結束遊戲
  function endGame() {
    gameActive = false;
    app.ticker.stop();
    finalScoreText.textContent = String(score);
    gameOverScreen.style.display = "block";
    const gameOverSound = new Audio(PIXI.Assets.get("gameOverSound").url);
    gameOverSound.play();
  }

  // 遊戲主迴圈
  function gameLoop() {
    if (!gameActive) return;

    // 移動玩家
    const speed = 5;
    if (keys["ArrowUp"]) player.y -= speed;
    if (keys["ArrowDown"]) player.y += speed;
    if (keys["ArrowLeft"]) player.x -= speed;
    if (keys["ArrowRight"]) player.x += speed;

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
        const collectSound = new Audio(PIXI.Assets.get("collectSound").url);
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
})();
