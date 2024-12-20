let units = [];

let Base = {
  x: 1327,
  y: 284,
  w: 150,
  h: 250,
  spawnpoint: [1277, 432],
  health: 1000,
  max_health: 1000,
  evil: false,
  pivotOffsetX: 0, // Default pivot adjustment (for targeting)
};

let EnemyBase = {
  x: 27,
  y: 284,
  w: 150,
  h: 250,
  spawnpoint: [177, 432],
  health: 1000,
  max_health: 1000,
  evil: true,
  pivotOffsetX: 100, // Shift pivot to the right edge for targeting
};

class SquareUnit {
  constructor(evil = true) {
    this.evil = evil;
    this.speed = 55;
    this.damage = 20;
    this.atk_delay = 1.5;
    this.size = 50;
    this.range = 70;
    this.health = 100;

    // Animation and attack properties
    this.isAttacking = false;
    this.rotation = 0;
    this.attackProgress = 0;
    this.attackCooldown = 0;
    this.attackOriginX = null;
    this.attackOriginY = null;
    this.currentTarget = null;
    this.damageDealt = false;

    // Set initial position based on evil or good
    if (this.evil) {
      this.x = EnemyBase.spawnpoint[0];
      this.y = EnemyBase.spawnpoint[1];
    } else {
      this.x = Base.spawnpoint[0];
      this.y = Base.spawnpoint[1];
    }
  }

  getTargetPosition() {
    // Get the target point based on type of target
    if (this.currentTarget === EnemyBase) {
      // Top-right corner for EnemyBase
      return { x: EnemyBase.x + EnemyBase.w, y: EnemyBase.y };
    } else if (this.currentTarget === Base) {
      // Use the top-left corner for the blue Base
      return { x: Base.x, y: Base.y };
    } else {
      // Default to the target's own position (units)
      return { x: this.currentTarget.x, y: this.currentTarget.y };
    }
  }

  atk_animation() {
    if (!this.currentTarget || this.currentTarget.health <= 0 || abs(this.getTargetPosition().x - this.attackOriginX) > this.range) {
      this.isAttacking = false;
      this.attackProgress = 0;
      this.rotation = 0;
      this.currentTarget = null;
      this.x = this.attackOriginX;
      this.y = this.attackOriginY;
      this.damageDealt = false;
      return;
    }

    let distance = this.size * 0.5;
    let progressRatio = this.attackProgress / 60;
    let moveOffset = progressRatio <= 0.5 
      ? distance * progressRatio * 2 
      : distance * (1 - (progressRatio - 0.5) * 2);

    this.rotation += 0.2;

    let targetPos = this.getTargetPosition();

    if (progressRatio <= 0.5) {
      this.x = this.attackOriginX + (targetPos.x - this.attackOriginX) * progressRatio * 2;
      this.y = this.attackOriginY + (targetPos.y - this.attackOriginY) * progressRatio * 2;
    } else {
      this.x = this.attackOriginX + (targetPos.x - this.attackOriginX) * (1 - (progressRatio - 0.5) * 2);
      this.y = this.attackOriginY + (targetPos.y - this.attackOriginY) * (1 - (progressRatio - 0.5) * 2);
    }

    if (progressRatio >= 0.5 && !this.damageDealt) {
      this.currentTarget.health -= this.damage;
      this.damageDealt = true;
    }

    this.attackProgress++;

    if (this.attackProgress >= 60) {
      this.isAttacking = false;
      this.attackProgress = 0;
      this.rotation = 0;
      this.x = this.attackOriginX;
      this.y = this.attackOriginY;
      this.damageDealt = false;
    }
  }

  attack(target) {
    if (this.attackCooldown <= 0) {
      if (!this.isAttacking) {
        this.attackOriginX = this.x;
        this.attackOriginY = this.y;
        this.isAttacking = true;
        this.attackProgress = 0;
        this.damageDealt = false;
      }
      this.attackCooldown = 90;
    }
  }

  update() {
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    let inRange = false;
    for (let enemy of units) {
      if (enemy !== this && abs(enemy.x - this.x) <= this.range && enemy.evil !== this.evil) {
        this.currentTarget = enemy;
        inRange = true;
        break;
      }
    }

    if (!inRange) {
      let baseTarget = this.evil ? Base : EnemyBase;
      let baseTargetPosition = baseTarget === EnemyBase ? { x: EnemyBase.x + EnemyBase.w, y: EnemyBase.y } : { x: Base.x, y: Base.y };

      if (abs(baseTargetPosition.x - this.x) <= this.range) {
        this.currentTarget = baseTarget;
      } else {
        this.currentTarget = null;
      }
    }

    if (this.isAttacking) {
      this.atk_animation();
    } else if (this.currentTarget && this.currentTarget.health > 0) {
      this.attack(this.currentTarget);
    } else {
      this.x += this.evil ? this.speed * 0.02 : -this.speed * 0.02;
    }

    push();
    translate(this.x + this.size / 2, this.y + this.size / 2);
    rotate(this.rotation);
    fill(this.evil ? color(255, 0, 0) : color(0, 0, 255));
    rectMode(CENTER);
    rect(0, 0, this.size, this.size);
    pop();
  }
}


// Function to spawn units with specified alignment
function spawn_unit(unit, moral) {
  let newUnit = new unit(moral);
  units.push(newUnit);
}

// Setup
function setup() {
  createCanvas(1500, 600);
  textSize(32);
  spawn_unit(SquareUnit, true);
  spawn_unit(SquareUnit, false);
}

function draw() {
  background(135, 206, 235);
  fill(0, 200, 10);
  rect(0, 400, width, 250);
  fill(155, 103, 60);
  rect(Base.x, Base.y, Base.w, Base.h);
  fill(255, 50, 30);
  rect(EnemyBase.x, EnemyBase.y, EnemyBase.w, EnemyBase.h);

  // Display base health
  fill(35);
  textAlign(LEFT);
  text(Base.health + "/" + Base.max_health, Base.x - 2, Base.y - 10);
  text(EnemyBase.health + "/" + EnemyBase.max_health, EnemyBase.x - 2, EnemyBase.y - 10);

  // Display the number of alive units
  fill(0);
  textAlign(CENTER);
  text(`Alive Units: ${units.length}`, width / 2, 30);

  // Update all units and remove any with zero health
  for (let i = units.length - 1; i >= 0; i--) {
    let unit = units[i];
    if (unit.health <= 0) {
      units.splice(i, 1);
    } else {
      unit.update();
    }
  }

  // Check victory condition
  if (EnemyBase.health <= 0) {
    victory();
  } else if (Base.health <= 0) {
    gameover();
  }
}

function victory() {
  // Victory logic
}

function gameover() {
  location.reload();
}

function keyPressed() {
  if (key === 'g') {
    spawn_unit(SquareUnit, true);
  } else if (keyCode === SHIFT) {
    spawn_unit(SquareUnit, false);
  }
}


/*

*/





