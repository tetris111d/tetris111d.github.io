const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const colors = [ null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF' ];
const arena = createMatrix(12, 20);
let dropInterval = 1000;
let lastTime = 0;
let dropCounter = 0;
let score = 0;
let level = 1;

const player = {
  pos: { x: 0, y: 0 },
  matrix: null
};

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function drawGrid() {
  context.strokeStyle = "#222";
  for (let y = 0; y < 20; ++y) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(12, y);
    context.stroke();
  }
  for (let x = 0; x < 12; ++x) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 20);
    context.stroke();
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
    });
  });
}

function rotateMatrix(matrix) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  matrix.forEach(row => row.reverse());
}

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
  player.pos.y = 0;
  player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    updateScore();
  }
}

function createPiece(type) {
  switch (type) {
    case 'T': return [[0,1,0],[1,1,1],[0,0,0]];
    case 'O': return [[2,2],[2,2]];
    case 'L': return [[0,0,3],[3,3,3],[0,0,0]];
    case 'J': return [[4,0,0],[4,4,4],[0,0,0]];
    case 'I': return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
    case 'S': return [[0,6,6],[6,6,0],[0,0,0]];
    case 'Z': return [[7,7,0],[0,7,7],[0,0,0]];
  }
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) continue outer;
    }
    arena.splice(y, 1);
    arena.unshift(new Array(arena[0].length).fill(0));
    score += rowCount * 10;
    rowCount *= 2;
    if (score % 100 === 0) {
      level++;
    }
  }
}

function updateScore() {
  document.getElementById("score").innerText = score;
  document.getElementById("level").innerText = level;
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function move(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function rotate() {
  const pos = player.pos.x;
  let offset = 1;
  rotateMatrix(player.matrix);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotateMatrix(player.matrix);
      player.pos.x = pos;
      return;
    }
  }
}

function drop() {
  playerDrop();
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

function startGame() {
  dropInterval = parseInt(document.getElementById('levelSelect').value);
  document.getElementById('startMenu').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  playerReset();
  updateScore();
  update();
}
