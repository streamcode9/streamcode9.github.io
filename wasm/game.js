const canvas = document.getElementById('game-canvas');
const context =
  canvas.getContext('2d', { alpha: false, desynchronized: true }) ||
  canvas.getContext('2d');
const fpsDisplay = document.getElementById('fps-counter');
let wasmExports = null;
let lastTime = null;
let fpsFrameCount = 0;
let fpsLastTimestamp = 0;
let ballStatePtr = 0;
let ballStateView = null;
const MAX_PIXEL_RATIO = 1.5;

function getBallStateView() {
  if (!wasmExports || !wasmExports.memory) {
    return null;
  }

  const memoryBuffer = wasmExports.memory.buffer;
  if (!ballStatePtr && typeof wasmExports.get_ball_state_ptr === 'function') {
    ballStatePtr = wasmExports.get_ball_state_ptr();
  }

  if (!ballStatePtr) {
    return null;
  }

  if (
    !ballStateView ||
    ballStateView.byteOffset !== ballStatePtr ||
    ballStateView.buffer !== memoryBuffer
  ) {
    ballStateView = new Float32Array(memoryBuffer, ballStatePtr, 3);
  }

  return ballStateView;
}

function resizeCanvas() {
  const deviceRatio = window.devicePixelRatio || 1;
  const pixelRatio = Math.min(deviceRatio, MAX_PIXEL_RATIO);
  const displayWidth = Math.floor(window.innerWidth * pixelRatio);
  const displayHeight = Math.floor(window.innerHeight * pixelRatio);

  canvas.width = displayWidth;
  canvas.height = displayHeight;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  if (context && typeof context.resetTransform === 'function') {
    context.resetTransform();
  }

  ballStateView = null;

  if (wasmExports) {
    wasmExports.set_canvas_size(canvas.width, canvas.height);
  }
}

function drawFrame() {
  if (!wasmExports || !context) {
    return;
  }

  const state = getBallStateView();
  let x;
  let y;
  let radius;

  if (state) {
    x = state[0];
    y = state[1];
    radius = state[2];
  } else {
    if (typeof wasmExports.get_ball_radius !== 'function') {
      return;
    }

    radius = wasmExports.get_ball_radius();
    x = wasmExports.get_ball_x();
    y = wasmExports.get_ball_y();
  }

  context.fillStyle = '#0d47a1';
  context.fillRect(0, 0, canvas.width, canvas.height);

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

  const deltaSecondsRaw = (timestamp - lastTime) / 1000;
  const deltaSeconds = Math.min(deltaSecondsRaw, 0.25);
  lastTime = timestamp;

  if (wasmExports) {
    let ptr = 0;
    if (typeof wasmExports.update_and_get_state === 'function') {
      ptr = wasmExports.update_and_get_state(deltaSeconds);
    } else if (typeof wasmExports.update === 'function') {
      wasmExports.update(deltaSeconds);
    }

    if (ptr && ptr !== ballStatePtr) {
      ballStatePtr = ptr;
      ballStateView = null;
    }
  }

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

  if (typeof wasmExports.get_ball_state_ptr === 'function') {
    ballStatePtr = wasmExports.get_ball_state_ptr();
  }

  if (typeof wasmExports.reset_ball === 'function') {
    wasmExports.reset_ball();
  }

  drawFrame();
  requestAnimationFrame(updateAndRender);
}

window.addEventListener('resize', resizeCanvas, { passive: true });
start();
