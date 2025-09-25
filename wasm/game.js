const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const fpsDisplay = document.getElementById('fps-counter');
let wasmExports = null;
let lastTime = null;
let fpsFrameCount = 0;
let fpsLastTimestamp = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  if (wasmExports) {
    wasmExports.set_canvas_size(canvas.width, canvas.height);
  }
}

function drawFrame() {
  if (!wasmExports) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#0d47a1';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const radius = wasmExports.get_ball_radius();
  const x = wasmExports.get_ball_x();
  const y = wasmExports.get_ball_y();

  context.fillStyle = '#ffca28';
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function updateAndRender(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
    fpsLastTimestamp = timestamp;
  }

  const deltaSeconds = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  wasmExports.update(deltaSeconds);
  drawFrame();

  fpsFrameCount += 1;
  const fpsElapsed = timestamp - fpsLastTimestamp;
  if (fpsElapsed >= 250) {
    const fps = Math.round((fpsFrameCount * 1000) / fpsElapsed);
    if (fpsDisplay) {
      fpsDisplay.textContent = `${fps} FPS`;
    }
    fpsFrameCount = 0;
    fpsLastTimestamp = timestamp;
  }

  requestAnimationFrame(updateAndRender);
}

async function start() {
  const response = await fetch('hello.wasm');
  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});
  wasmExports = instance.exports;

  resizeCanvas();
  wasmExports.reset_ball();
  drawFrame();
  requestAnimationFrame(updateAndRender);
}

window.addEventListener('resize', resizeCanvas);
start();
