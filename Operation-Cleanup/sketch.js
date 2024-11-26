let currentState, startButton, backButton, winButton;
let islands = [],
  rocks = [],
  player,
  pressedKeys = {},
  trash = [];
let velocity;
let bullets = [],
  enemyBullets = [];
let collectedTrashCount = 0;
let lastTrashSpawn = 0;
let startGeneratingTrash = false;
let rotationSpeed = 0.05,
  acceleration = 1,
  maxSpeed = 5,
  frictionCoefficient = 0.5;
let lastBulletTime = 0,
  fireDelay = 1500;
let lastEnemySpawnTime = 0,
  enemySpawnDelay = 5000;
let playerHealth = 10; // Set player health back to 10
let enemies = [];
let borderPadding = 1; // Padding around the edges of the canvas

function setup() {
  createCanvas(windowWidth, windowHeight);
  currentState = "mainMenu";
  createMainMenuButtons();
  lastTrashSpawn = millis(); // Initialize lastTrashSpawn to current time
  player = new Player(width / 2, height / 2);
  velocity = createVector(0, 0);
}

function draw() {
  background(currentState === 'game' ? color(128, 180, 255) : color(220));
  handleInput();
  updateBullets();
  updateEnemyBullets();
  drawPlayer();
  
  if (currentState === 'game') {
    if (startGeneratingTrash && millis() - lastTrashSpawn > 2000 && trash.length < 20) {
      lastTrashSpawn = millis();
      generateNewTrash();
    }
    
    rocks.concat(islands).forEach(obj => obj.display());
    trash.forEach(obj => obj.display());
    player.update();
    player.draw();
    
    // Check for trash pickup
    for (let i = trash.length - 1; i >= 0; i--) {
      if (trash[i].isCollected(player.x, player.y, player.size)) {
        trash.splice(i, 1); // Remove collected trash
        collectedTrashCount++;
      }
    }
    
    // Check for collisions with rocks
    for (let i = 0; i < rocks.length; i++) {
      if (rocks[i].collidesWith(player.x, player.y, player.size)) {
        player.handleCollision();
      }
    }

    // Check for collisions with islands
    for (let i = 0; i < islands.length; i++) {
      if (islands[i].collidesWith(player.x, player.y, player.size)) {
        player.handleCollision();
      }
    }

    // Update and display enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      enemies[i].update(player.x, player.y);
      enemies[i].display();
      enemies[i].shoot(); // Call the shoot method for each enemy
      if (player.collide(enemies[i])) {
        playerHealth--;
        enemies.splice(i, 1);
      }
      // Check for collisions with player bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        if (enemies[i] && enemies[i].collideWithBullet(bullets[j])) {
          enemies.splice(i, 1);
          bullets.splice(j, 1);
        }
      }
    }

    // Check for player health
    if (playerHealth <= 0) {
      gameOver();
    }

    // Spawn enemies every 5 seconds
    if (millis() - lastEnemySpawnTime > enemySpawnDelay) {
      spawnEnemy();
      lastEnemySpawnTime = millis();
    }

    // Check for win condition
    if (collectedTrashCount >= 50) {
      winGame();
    }
  }

  if (currentState === 'mainMenu') {
    displayMainMenuText();
    startButton.size(200, 60);
    startButton.show();
    backButton.hide(); 
    winButton.hide();
  } else if (currentState === 'game') {
    startButton.hide();
    backButton.hide(); 
  } else if (currentState === 'win') {
    winButton.show();
    backButton.show();
    startButton.hide();
  }
  
  // Draw health text on top of everything
  drawHealth();
  
  // Draw trash collected text on top of everything
  fill(0);
  textSize(20);
  textAlign(LEFT, TOP);
  text(`Trash Collected: ${collectedTrashCount}`, 10, 10);
}


function displayMainMenuText() {
  textSize(24);
  textAlign(CENTER, TOP);
  fill(0);
  text(
    "Help clear the ocean.\nUse the arrow keys or WASD to move around.\nClick SPACE to shoot!",
    width / 2,
    50
  );

  textSize(18);
  textAlign(CENTER, BOTTOM);
  text("Game created by:\nAviad, David, Noah, Luca", width / 2, height - 50);
}

function createMainMenuButtons() {
  startButton = createButton("Start Game");

  startButton.position(width / 2 - 100, height / 2 - 30);
  startButton.size(200, 60);
  startButton.style("font-size", "24px");
  startButton.mousePressed(startGame);

  backButton = createButton("Back to Main Menu");
  backButton.position(width / 2 - 80, height / 1.9 + 70);
  backButton.mousePressed(goToMainMenu);
  backButton.hide();
  
  winButton = createButton("You Win!");
  winButton.position(width / 2 - 80, height / 2 - 30);
  winButton.size(200, 60);
  winButton.style("font-size", "24px");
  winButton.mousePressed(goToMainMenu);
  winButton.hide();
}

function cleanGame () {
  collectedTrashCount = 0;
  islands = [];
  rocks = [];
  trash = [];
  enemies = [];
}

function startGame() {
  currentState = "game";
  cleanGame();
  player = new Player(width / 2, height / 2);
  collectedTrashCount = 0;
  playerHealth = 10; // Reset player health to maximum value
  generateIslands();
  generateRocks();
  startGeneratingTrash = true;
}

function goToMainMenu() {
  currentState = "mainMenu";
}

function winGame() {
  currentState = "win";
}

function generateRocks() {
  let numRocks = 10;
  let playerSize = player.size;
  for (let i = 0; i < numRocks; i++) {
    let x, y, size;
    let overlapping = true;
    while (overlapping) {
      x = random(width);
      y = random(height);
      size = random(20, 30);
      if (dist(x, y, player.x, player.y) > (playerSize + size) / 2)
        overlapping = false;
    }
    rocks.push(new Rock(x, y, size));
  }
}

function generateIslands() {
  let numIslands = 5;
  let playerSize = player.size;
  for (let i = 0; i < numIslands; i++) {
    let x, y, size;
    let overlapping = true;
    while (overlapping) {
      x = random(width);
      y = random(height);
      size = random(50, 100);
      if (dist(x, y, player.x, player.y) > (playerSize + size) / 2)
        overlapping = false;
    }
    islands.push(new Island(x, y, size));
  }
}

function generateNewTrash() {
  let newTrash;
  while (!newTrash) {
    let x = random(width);
    let y = random(height);
    let size = random(5, 15);
    let tooCloseToObstacle = rocks
      .concat(islands)
      .some((obj) => dist(x, y, obj.x, obj.y) < 50);
    if (!tooCloseToObstacle) newTrash = new Trash(x, y, size);
  }
  trash.push(newTrash);
}

function keyPressed() {
  pressedKeys[keyCode] = true;
}
function keyReleased() {
  pressedKeys[keyCode] = false;
}

function handleInput() {
  let previousX = player.x;
  let previousY = player.y;

  if (pressedKeys[UP_ARROW] || pressedKeys[87]) {
    // W key
    let movement = p5.Vector.fromAngle(player.rotation - HALF_PI);
    movement.mult(acceleration);
    velocity.add(movement).limit(maxSpeed);
  }

  if (pressedKeys[LEFT_ARROW] || pressedKeys[65]) player.rotation -= rotationSpeed; // A key
  if (pressedKeys[RIGHT_ARROW] || pressedKeys[68]) player.rotation += rotationSpeed; // D key

  if (pressedKeys[32] && millis() - lastBulletTime > fireDelay) {
    // SPACE key
    bullets.push({
      x: player.x,
      y: player.y,
      velocity: p5.Vector.fromAngle(player.rotation - HALF_PI).mult(8),
    });
    lastBulletTime = millis();
  }

  player.x += velocity.x;
  player.y += velocity.y;

  // Keep the player within the boundaries of the canvas, considering the borderPadding
  player.x = constrain(player.x, borderPadding, width - borderPadding - player.size / 2);
  player.y = constrain(player.y, borderPadding, height - borderPadding - player.size / 2);

  let speed = velocity.mag();
  if (speed > 0) velocity.add(velocity.copy().mult(-1).mult(frictionCoefficient));

  // Check for collisions with rocks
  for (let i = 0; i < rocks.length; i++) {
    if (rocks[i].collidesWith(player.x, player.y, player.size)) {
      player.x = previousX; // Revert player's x position
      player.y = previousY; // Revert player's y position
      velocity.mult(-0.5); // Reverse velocity to simulate collision response
    }
  }

  // Check for collisions with islands
  for (let i = 0; i < islands.length; i++) {
    if (islands[i].collidesWith(player.x, player.y, player.size)) {
      player.x = previousX; // Revert player's x position
      player.y = previousY; // Revert player's y position
      velocity.mult(-0.5); // Reverse velocity to simulate collision response
    }
  }
}



function drawPlayer() {
  push();
  translate(player.x, player.y);
  rotate(player.rotation);
  fill(255);
  beginShape();
  vertex(0, -15);
  vertex(10, 15);
  vertex(-10, 15);
  endShape(CLOSE);
  pop();
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.velocity.x;
    bullet.y += bullet.velocity.y;
    fill(255, 0, 0);
    ellipse(bullet.x, bullet.y, 8, 8);
    
    // Check for collisions with rocks
    for (let j = 0; j < rocks.length; j++) {
      if (rocks[j].collidesWith(bullet.x, bullet.y, 0)) {
        bullets.splice(i, 1); // Remove bullet if it collides with a rock
        break; // Exit the loop once a collision is detected
      }
    }
    
    // Check for collisions with islands
    for (let j = 0; j < islands.length; j++) {
      if (islands[j].collidesWith(bullet.x, bullet.y, 0)) {
        bullets.splice(i, 1); // Remove bullet if it collides with an island
        break; // Exit the loop once a collision is detected
      }
    }
    
    if (
      bullet.x < 0 ||
      bullet.x > width ||
      bullet.y < 0 ||
      bullet.y > height
    )
      bullets.splice(i, 1);
  }
}

function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    bullet.x += bullet.velocity.x;
    bullet.y += bullet.velocity.y;
    fill(0, 0, 255);
    ellipse(bullet.x, bullet.y, 8, 8);

    // Check for collisions with rocks
    for (let j = 0; j < rocks.length; j++) {
      if (rocks[j].collidesWith(bullet.x, bullet.y, 0)) {
        enemyBullets.splice(i, 1); // Remove bullet if it collides with a rock
        break; // Exit the loop once a collision is detected
      }
    }

    // Check for collisions with islands
    for (let j = 0; j < islands.length; j++) {
      if (islands[j].collidesWith(bullet.x, bullet.y, 0)) {
        enemyBullets.splice(i, 1); // Remove bullet if it collides with an island
        break; // Exit the loop once a collision is detected
      }
    }

    // Check if bullet is out of bounds
    if (
      bullet.x < 0 ||
      bullet.x > width ||
      bullet.y < 0 ||
      bullet.y > height
    )
      enemyBullets.splice(i, 1);

    // Check for collision with player
    if (player.collideWithBullet(bullet)) {
      playerHealth--;
      enemyBullets.splice(i, 1);
    }
  }
}


class Rock {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
  }
  display() {
    fill(100);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }
  collidesWith(x, y, otherSize) {
    return dist(x, y, this.x, this.y) < (otherSize + this.size) / 2;
  }
}

class PalmTree {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  display() {
    fill(139, 69, 19);
    rect(this.x - 5, this.y, 10, 40);
    fill(34, 139, 34);
    triangle(
      this.x - 20,
      this.y + 20,
      this.x + 20,
      this.y + 20,
      this.x,
      this.y - 40
    );
  }
}

class Island {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.palmTree = new PalmTree(this.x, this.y - this.size / 2);
  }

  display() {
    fill(244, 164, 96);
    noStroke();
    ellipse(this.x, this.y, this.size);
    this.palmTree.display();
  }

  collidesWith(x, y, otherSize) {
    return dist(x, y, this.x, this.y) < (otherSize + this.size) / 2;
  }
}

class Trash {
  constructor(x, y, size = 5) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color(random(200, 255), random(200, 255), random(200, 255));
  }

  display() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size);
  }

  isCollected(x, y, size) {
    if (dist(x, y, this.x, this.y) < size / 2) {
      collectedTrashCount += 0,5; // Increment by 2 when trash is collected
      return true;
    }
    return false;
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.size = 30; // Assuming a default size for the player
  }

  update() {
    // Update player logic goes here if needed
  }

  draw() {
    // Draw player logic goes here
    drawPlayer(this.x, this.y, this.rotation);
  }

  handleCollision() {
    // Define previous position variables here
    let previousX = this.x;
    let previousY = this.y;

    // Handle collision logic goes here
    // For example, reverting player's position and velocity
    this.x = previousX;
    this.y = previousY;
    velocity.mult(-0.5);
  }

  collide(enemy) {
    let distance = dist(this.x, this.y, enemy.x, enemy.y);
    if (distance < this.size / 2 + enemy.size / 2) {
      return true;
    } else {
      return false;
    }
  }

  collideWithBullet(bullet) {
    let distance = dist(this.x, this.y, bullet.x, bullet.y);
    if (distance < this.size / 2) {
      return true;
    } else {
      return false;
    }
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 1;
    this.size = 40; // Increase the size of the enemy
    this.lastShotTime = 0; // Initialize last shot time
  }

  update(playerX, playerY) {
    let angle = atan2(playerY - this.y, playerX - this.x);
    this.x += this.speed * cos(angle);
    this.y += this.speed * sin(angle);

    // Check for collision with rocks
    for (let i = 0; i < rocks.length; i++) {
      if (rocks[i].collidesWith(this.x, this.y, this.size)) {
        this.x -= this.speed * cos(angle); // Revert x position
        this.y -= this.speed * sin(angle); // Revert y position
        break; // Exit the loop once a collision is detected
      }
    }

    // Check for collision with islands
    for (let i = 0; i < islands.length; i++) {
      if (islands[i].collidesWith(this.x, this.y, this.size)) {
        this.x -= this.speed * cos(angle); // Revert x position
        this.y -= this.speed * sin(angle); // Revert y position
        break; // Exit the loop once a collision is detected
      }
    }
  }

  display() {
    let angle = atan2(player.y - this.y, player.x - this.x);
    push();
    translate(this.x, this.y);
    rotate(angle);
    stroke(0);
    fill(255, 0, 0);
    // Draw the larger enemy
    triangle(
      -this.size / 2,
      this.size / 3,
      -this.size / 2,
      -this.size / 3,
      this.size / 2,
      0
    );
    pop();
  }

  collideWithBullet(bullet) {
    let distance = dist(this.x, this.y, bullet.x, bullet.y);
    return distance < this.size / 2; // Return true if bullet collides with the enemy
  }
  
  shoot() {
    // Check if enough time has passed since the last shot
    if (millis() - this.lastShotTime > fireDelay) {
      // Shoot only if enough time has passed
      let angle = atan2(player.y - this.y, player.x - this.x);
      enemyBullets.push({ x: this.x, y: this.y, velocity: p5.Vector.fromAngle(angle).mult(3) });
      this.lastShotTime = millis(); // Update last shot time
    }
  }
}



function spawnEnemy() {
  let border = floor(random(4)); // Choose a random border (0: top, 1: right, 2: bottom, 3: left)
  let x, y;

  switch (border) {
    case 0: // Top border
      x = random(width);
      y = -20;
      break;
    case 1: // Right border
      x = width + 20;
      y = random(height);
      break;
    case 2: // Bottom border
      x = random(width);
      y = height + 20;
      break;
    case 3: // Left border
      x = -20;
      y = random(height);
      break;
  }

  enemies.push(new Enemy(x, y));
}

function drawHealth() {
  textSize(20);
  fill(255, 0, 0);
  textAlign(RIGHT, TOP);
  text(`Health: ${playerHealth}`, width - 10, 10);
}

function gameOver() {
  currentState = "mainMenu";
  resetGame();
}

function resetGame() {
  // Reset all game variables
  islands = [];
  rocks = [];
  trash = [];
  bullets = [];
  enemyBullets = [];
  enemies = [];
  collectedTrashCount = 0;
  playerHealth = 3;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
