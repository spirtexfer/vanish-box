import '@testing-library/jest-dom'

// jsdom does not implement HTMLCanvasElement; provide a minimal mock so
// canvas-based components (SketchEditor) can be tested without the canvas package.
HTMLCanvasElement.prototype.getContext = function () {
  return {
    fillStyle: '',
    lineWidth: 1,
    lineCap: '',
    lineJoin: '',
    strokeStyle: '',
    fillRect: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    drawImage: () => {},
  } as unknown as CanvasRenderingContext2D
}

HTMLCanvasElement.prototype.toDataURL = function () {
  return 'data:image/png;base64,mock'
}
