/* exported initWebGL, draw, initArrayBuffer */

var gl;
var polyProgram;
var positionLoc;
var polygonArrayBuffer;
var triangleCount = 0;

function initWebGL(canvas) {
  gl = canvas.getContext('experimental-webgl');

  var width = canvas.offsetWidth;
  var height = canvas.offsetHeight;

  // won't be fragment shader bound, so accomodate high-dpi displays
  // TODO(bckenny): may cause problem on non-integer pixel ratios
  var resolutionScale = window.devicePixelRatio || 1;

  canvas.width = width * resolutionScale;
  canvas.height = height * resolutionScale;

  gl.viewport(0, 0, width * resolutionScale, height * resolutionScale);

  polyProgram = createShaderProgram();
  positionLoc = gl.getAttribLocation(polyProgram, 'position');
  gl.enableVertexAttribArray(positionLoc);
}

function draw(fillPolygon) {
  var renderType = fillPolygon ? gl.TRIANGLES : gl.LINE_LOOP;
  gl.drawArrays(renderType, 0, triangleCount);
}

function initArrayBuffer(triangleVerts) {
  // triangleVerts = contours[0];
  triangleCount = triangleVerts.length / 2;

  // put triangle coordinates into a WebGL ArrayBuffer and bind to
  // shader's 'position' attribute variable
  var rawData = new Float32Array(triangleVerts);
  polygonArrayBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, polygonArrayBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, rawData, gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
}

function createShaderProgram() {
  // create vertex shader
  var vertexSrc = [
    'attribute vec4 position;',
    'void main() {',
    '  /* already in normalized coordinates, so just pass through */',
    '  gl_Position = position;',
    '}'
  ].join('');
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSrc);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.log('Vertex shader failed to compile. Log: ' +
        gl.getShaderInfoLog(vertexShader));
  }

  // create fragment shader
  var fragmentSrc = [
    'precision mediump float;',
    'void main() {',
    '  /* set all pixels to green */',
    '  gl_FragColor = vec4(.1, .8, 0.08, 1.);',
    '}'
  ].join('');
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSrc);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.log('Fragment shader failed to compile. Log: ' +
        gl.getShaderInfoLog(fragmentShader));
  }

  // link shaders to create our program
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.useProgram(program);

  return program;
}
