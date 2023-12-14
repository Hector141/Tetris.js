"use strict";
const mainCanvas = document.querySelector("#main");
const nextCanvas = document.querySelector("#next");
const infoScore = document.querySelector(".score");
const infoTime = document.querySelector(".time");
const mainCTX = mainCanvas.getContext("2d");
const nextCtx = nextCanvas.getContext("2d");

mainCTX.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    "#323232",
    "#F80001",
    "#0303EA",
    "#F2D203",
    "#F28703",
    "#78BA24",
    "#1ED2D3",
    "#CF00F0",
    "white"
];
let LEVELS = {
    0: 800,
    1: 600,
    2: 400,
    3: 350,
    4: 300,
    5: 250,
    6: 200,
    7: 150,
    8: 100
};
const time = { start: performance.now(), elapsed: 0, level: LEVELS[0], currentLevel: 0 };
let animationFrame;

class Piece {
    constructor(x) {
        this.x = x;
        this.y = 0;
        this.shape = getShape();
    }
    draw(ctx) {
        this.shape.forEach((row, y) => {
            row.forEach((num, x) => {
                if (num < 1)
                    return;
                ctx.fillStyle = COLORS[num];
                ctx.fillRect((this.x + x) * BLOCK_SIZE, (this.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeRect((this.x + x) * BLOCK_SIZE, (this.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            });
        });
    }
}

class Board {
    constructor(ctx, nextCTX) {
        this.ctx = ctx;
        this.nextCTX = nextCTX;
        this.color = COLORS[0];
        this.init();
        this.gameOver = false;
        this.score = 0;
        this.updateScoreDisplay();
        this.startTime = 0;
        this.isGameRunning = false; 
    }
    init() {
        this.grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0));
        this.ctx.canvas.width = COLS * BLOCK_SIZE;
        this.ctx.canvas.height = ROWS * BLOCK_SIZE;
        this.piece = new Piece(3);
        this.next = getShape();
        this.draw();
        this.startTime = performance.now();
    }
    draw() {
        const p = moves["ArrowDown"](this.piece);
        const isValid = this.isValid(p);

        const currentTime = performance.now();
        const elapsedTime = currentTime - this.startTime;
        this.updateTimeDisplay(elapsedTime);

        this.updateLevel(elapsedTime);

        if (!isValid) {
            this.freeze(this.piece);
            // nueva pieza
            this.piece.shape = this.next;
            this.piece.y = 0;
            this.piece.x = 3;
            this.next = getShape();
            //elimina las lineas
        }
        else {
            this.piece.y = p.y; 
        }
        this.removeLines();
        if (this.grid[0].some((num) => num !== 0)) {
            // game over
            this.gameOver = true;
            this.stopTimeCounter();
            return;
        }
        this.drawNext(this.next);
        this.drawBoard();
        this.piece.draw(this.ctx);
        this.updateScoreDisplay();
    }
    removeLines() {
        let lines = 0;
        let remove = false;
        this.grid.forEach((row, y) => {
            if (row.every((num, x) => num > 0)) {
                lines++;
                this.grid[y].forEach((num, x) => {
                    if (this.grid[y][x] === 8) {
                        remove = true;
                    }
                    this.grid[y][x] = 8;
                });
                if (remove) {
                    this.grid.splice(y, 1);
                    this.grid.unshift(Array(COLS).fill(0));
                    this.score += 100;
                }
            }
        });
    }
    freeze(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((num, x) => {
                if (num > 0) {
                    this.grid[piece.y + y][piece.x + x] = num;
                }
            });
        });
    }
    isValid(p) {
        return p.shape.every((row, dy) => row.every((num, dx) => {
            const x = p.x + dx;
            const y = p.y + dy;
            return (num === 0 || (this.isUnderAvailable(x, y) && this.isInside(x, y)));
        }));
    }
    repeat(shape, cb) {
        shape.forEach((row, y) => {
            row.forEach((num, x) => {
                cb(x, y, num, row);
            });
        });
    }
    isUnderAvailable(x, y) {
        return this.grid[y] && this.grid[y][x] === 0;
    }
    isInside(x, y) {
        return x >= 0 && x < COLS && y <= ROWS;
    }
    drawNext(next) {
        this.nextCTX.clearRect(0, 0, BLOCK_SIZE * 5, BLOCK_SIZE * 5);
        next.forEach((row, y) => {
            row.forEach((num, x) => {
                if (num < 1)
                    return;
                this.nextCTX.fillStyle = COLORS[num];
                this.nextCTX.fillRect((x + 1) * BLOCK_SIZE, y * BLOCK_SIZE, 1 * BLOCK_SIZE, 1 * BLOCK_SIZE);
            });
        });
    }
    drawBoard() {
        this.grid.forEach((row, y) => {
            row.forEach((num, x) => {
                this.ctx.fillStyle = COLORS[num];
                this.ctx.lineWidth = 4;
                this.ctx.strokeStyle = "#222";
                this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            });
        });
    }
    updateScoreDisplay() {
        infoScore.innerText = `Score: ${this.score} pts`;
    }

    updateTimeDisplay(elapsedTime) {
        let displayTime;
    
        // Si han pasado más de 0.2 segundos, muestra el tiempo real
        if (elapsedTime > 200) {
          const minutes = Math.floor(elapsedTime / 60000); // Obtén los minutos
          const seconds = Math.round((elapsedTime % 60000) / 1000); // Obtén los segundos
    
          displayTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min`;
        } else {
          // Durante los primeros 0.2 segundos, muestra "0:00"
          displayTime = '0:00';
        }
    
        infoTime.innerText = `Time: ${displayTime}`;
      }
    
    
    stopTimeCounter() {
        this.isGameRunning = false;
        this.startTime = null;
    }
    updateLevel(elapsedTime) {
        // Cambiar el nivel cada 3 minutos
        const levelChangeInterval = 300000;
        const currentLevel = Math.floor(elapsedTime / levelChangeInterval);
        const maxLevel = 8;
        time.currentLevel = Math.min(currentLevel, maxLevel);
    
        // Verificar si el nuevo nivel es mayor que el máximo
        if (time.currentLevel < Object.keys(LEVELS).length) {
            time.level = LEVELS[time.currentLevel];
        }
        const displayLevel = isNaN(time.currentLevel) ? 0 : time.currentLevel;

        document.getElementById('levelDisplay').innerText = `Level Speed: ${displayLevel}`;
    }
    
    
}

const moves = {
    ArrowLeft: (p) => (Object.assign(Object.assign({}, p), { x: p.x - 1 })),
    ArrowRight: (p) => (Object.assign(Object.assign({}, p), { x: p.x + 1 })),
    ArrowDown: (p) => (Object.assign(Object.assign({}, p), { y: p.y + 1 })),
    ArrowUp: (p) => {
        const piece = JSON.parse(JSON.stringify(p));
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < y; x++) {
                [piece.shape[x][y], piece.shape[y][x]] = [
                    piece.shape[y][x],
                    piece.shape[x][y]
                ];
            }
        }
        piece.shape.forEach((row) => row.reverse());
        return piece;
    }
};
function getShape() {
    const shapes = [
        [
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [2, 2, 0, 0],
            [0, 2, 2, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]

        ],
        [
            [0, 3, 3, 0],
            [3, 3, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]

        ],
        [
            [4, 4],
            [4, 4],

        ],
        [
            [0, 0, 5, 0],
            [5, 5, 5, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            [6, 0, 0, 0],
            [6, 6, 6, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]

        ],
        [
            [7, 7, 7, 0],
            [0, 7, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]

        ]
    ];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

const board = new Board(mainCTX, nextCtx);

const animate = (now = 0) => {
    time.elapsed = now - time.start;

    if (time.elapsed > time.level) {
        time.start = now;
        board.draw();
        
        // GAMEOVER
        if (board.gameOver) {
            handleGameOver();
            return cancelAnimationFrame(animationFrame);
           
        }
    }
    animationFrame = requestAnimationFrame(animate);
};

// listeners
addEventListener("keydown", (event) => {
    // Verificar si el juego está en curso antes de procesar las teclas
    if (board.isGameRunning) {
        const getNextState = moves[event.key];
        if (!getNextState)
            return;
        const p = getNextState(board.piece);
        // if valid commit
        if (board.isValid(p)) {
            board.piece.shape = p.shape;
            board.piece.x = p.x;
            board.piece.y = p.y;
            board.drawBoard();
            board.piece.draw(board.ctx);
        }
    }
});

nextCanvas.style.display = "none";

function startGame() {
    // Restablecer todo y comenzar el juego
    board.init();
    time.start = performance.now();
    time.elapsed = 0;
    time.level = LEVELS[0];
    time.currentLevel = 0;
    board.gameOver = false;
    board.isGameRunning = true;

    const tetrisMusic = document.getElementById('tetrisMusic');
    tetrisMusic.play();
    // Mostrar los canvas de juego y pieza siguiente
    mainCanvas.style.display = "block";
    nextCanvas.style.display = "block";

    // Ocultar el botón
    startButton.style.display = "none";


    setTimeout(() => {
        // Iniciar la animación después de medio segundo
        animate();
    }, 500);
}



// COSAS DEL GAME OVER  XDD

const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

function handleGameOver() {
  gameOverOverlay.style.display = 'block';

  // Actualiza la puntuación final
  finalScoreDisplay.textContent = board.score;

  // Detén la música
  const tetrisMusic = document.getElementById('tetrisMusic');
  tetrisMusic.pause();
}

// Restaura el juego al hacer clic en el botón de reinicio
restartButton.addEventListener('click', () => {
  gameOverOverlay.style.display = 'none';
  startGame();
});


const startButton = document.getElementById("startButton");
startButton.addEventListener("click", startGame);


