const KEY_CODE_LEFT= 37;
const KEY_CODE_RIGHT= 39;
const KEY_CODE_SPACE= 32;


const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const PLAYER_WIDTH = 20;
const PLAYER_MAX_SPEED = 600;
const LASER_MAX_SPEED = 300;
const LASER_COOLDOWN = 0.5;

const ENEMIES_PER_ROW = 10;
const ENEMY_HORIZONTAL_PADDING = 80;
const ENEMY_VERTICAL_PADDING = 70;
const ENEMY_VERTICAL_SPACING = 80;
let ENEMY_COOLDOWN = 180.0;

const GAME_STATE = {
  lastTime: Date.now(),
  leftPressed: false,
  rightPressed: false,
  spacePressed: false,
  playerX: 0,
  playerY: 0,
  playerCooldown: 0,
  lasers: [],
  enemies: [],
  enemyLasers: [],
  gameOver: false,
  ready:false

};

function rectsIntersect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function clamp(v, min, max) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

function setPosition($el, x, y) {
  $el.style.transform = `translate(${x}px, ${y}px)`;
}

function rand(min, max){
  if (min === undefined) min = 0;
  if (max === undefined) max = 1;
  return min + Math.random() * (max - min)
}
function playerHasWon() {
  return GAME_STATE.enemies.length === 0;
}
function createPlayer($container) {
  GAME_STATE.playerX = GAME_WIDTH / 2;
  GAME_STATE.playerY = GAME_HEIGHT - 50;
  const $player = document.createElement("img");
  $player.src = "img/spaceAstronauts_018.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function init() {
  const $container = document.querySelector(".game");
  createPlayer($container);

  const enemySpacing = (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) /
    (ENEMIES_PER_ROW - 1);
  for (let i = 0; i < 3; i++) {
    const y = ENEMY_VERTICAL_PADDING + i * ENEMY_VERTICAL_SPACING;
    for (let j = 0; j < ENEMIES_PER_ROW; j++) {
      const x = j * enemySpacing + ENEMY_HORIZONTAL_PADDING;
      createEnemy($container, x, y);
    }
  }
}

function updatePlayer(dt, $container) {
  if (GAME_STATE.leftPressed) {
    GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
  }
  if (GAME_STATE.rightPressed) {
    GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
  }
  GAME_STATE.playerX = clamp(GAME_STATE.playerX, PLAYER_WIDTH, GAME_WIDTH - PLAYER_WIDTH);

  if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) {
     createLaser($container, GAME_STATE.playerX, GAME_STATE.playerY);
     GAME_STATE.playerCooldown = LASER_COOLDOWN;
   }

   if(GAME_STATE.playerCooldown > 0) {
     GAME_STATE.playerCooldown -= dt;
   }

  const $player = document.querySelector(".player");
  setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function createLaser($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "img/laser-blue-1.png";
  $element.className = "laser";
  $container.appendChild($element);
  const laser = { x, y, $element };
  GAME_STATE.lasers.push(laser);
  const audio = new Audio("sound/sfx-laser1.ogg");
  audio.play();
  setPosition($element, x, y);
}

function createEnemy($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "img/shipYellow_manned.png";
  $element.className = "enemy";
  $container.appendChild($element);

  const enemy = {
    x,
    y,
    cooldown: rand(0.5, ENEMY_COOLDOWN),
    $element
  };

  console.log(enemy.cooldown)

  GAME_STATE.enemies.push(enemy);
  setPosition($element, x, y);
}

function updateLasers(dt, $container) {
  const lasers = GAME_STATE.lasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i]
    laser.y -= dt * LASER_MAX_SPEED
    if (laser.y < 0) {
      destroyLaser($container, laser);
    }
    setPosition(laser.$element, laser.x, laser.y);
    const r1 = laser.$element.getBoundingClientRect();
    const enemies = GAME_STATE.enemies;
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      if (enemy.isDead) continue;
      const r2 = enemy.$element.getBoundingClientRect();
      if (rectsIntersect(r1, r2)){
        destroyEnemy($container, enemy);
        destroyLaser($container, laser);
        break;
      }
    }
  }
  GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
}

function updateEnemyLasers(dt, $container) {
  const lasers = GAME_STATE.enemyLasers;
  for (let i = 0; i < lasers.length; i++) {
    const laser = lasers[i];
    laser.y += dt * LASER_MAX_SPEED;
    if (laser.y > GAME_HEIGHT) {
      destroyLaser($container, laser);
    }
    setPosition(laser.$element, laser.x, laser.y);
    const r1 = laser.$element.getBoundingClientRect();
    const player = document.querySelector(".player");
    const r2 = player.getBoundingClientRect();
    if (rectsIntersect(r1, r2)) {
      destroyPlayer($container, player);
      break;
    }
  }
  GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead);
}

function destroyPlayer($container, player) {
  $container.removeChild(player);
  GAME_STATE.gameOver = true;

}

function updateEnemies(dt, $container){
  const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * 50;
  const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * 10;

  const enemies = GAME_STATE.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const x = enemy.x + dx;
    const y = enemy.y + dy;
    setPosition(enemy.$element, x, y)
    enemy.cooldown -= dt;
    if (enemy.cooldown <= 0) {
      createEnemyLaser($container, x, y);
      enemy.cooldown = rand(0.5, ENEMY_COOLDOWN);
    }
  }
  GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
}

function createEnemyLaser($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "img/laser-red-5.png";
  $element.className = "enemy-laser";
  $container.appendChild($element);
  const laser = { x, y, $element };
  GAME_STATE.enemyLasers.push(laser);
  setPosition($element, x, y);
}

function destroyLaser($container, laser) {
  $container.removeChild(laser.$element);
  laser.isDead = true;
}
function destroyEnemy($container, enemy) {
  $container.removeChild(enemy.$element);
  enemy.isDead = true;
}

function update(){
  const currentTime = Date.now();
  const dt = (currentTime - GAME_STATE.lastTime) / 1000
  if (!GAME_STATE.ready){

    let startBlock = document.querySelector(".start");
    startBlock.style.display = "block"
    let startButton = document.querySelector("#strbtn")
    startButton.addEventListener("click", ()=> {
      startBlock.style.display = "none";
      GAME_STATE.ready = true;
      ENEMY_COOLDOWN -= 174
      start()
      setTimeout(()=> update(),300)


    })
  }else {  if (GAME_STATE.gameOver) {
    GAME_STATE.ready = false;
    document.querySelector(".game-over").style.display = "block";
    return;
  }

  if (playerHasWon() && GAME_STATE.ready === true) {
    document.querySelector(".congratulations").style.display = "block";
    return;
  }

  if (GAME_STATE.ready){

    const $container = document.querySelector(".game");
    updatePlayer(dt, $container);
    updateLasers(dt, $container);
    updateEnemies(dt, $container);
    updateEnemyLasers(dt, $container);
    GAME_STATE.lastTime = currentTime;
    window.requestAnimationFrame(update)
  }}

}

function onKeyDown(e){
  if (e.keyCode === KEY_CODE_LEFT){
    GAME_STATE.leftPressed = true;
  }
  else if (e.keyCode === KEY_CODE_RIGHT){
    GAME_STATE.rightPressed = true;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = true;
  }
}
function onKeyUp(e){
  if (e.keyCode === KEY_CODE_LEFT){
    GAME_STATE.leftPressed = false;
  }else if (e.keyCode === KEY_CODE_RIGHT){
    GAME_STATE.rightPressed = false;
  } else if (e.keyCode === KEY_CODE_SPACE) {
    GAME_STATE.spacePressed = false;
  }
}
function start(){
  setTimeout(() => init(), 0)

}

window.addEventListener("keydown", onKeyDown)
window.addEventListener("keyup", onKeyUp)
window.requestAnimationFrame(update);
