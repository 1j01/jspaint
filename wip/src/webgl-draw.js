/* exported initWebGL, draw, initArrayBuffer */

var gl;
var polyProgram;
var positionLoc;
var colorLoc;
var polygonArrayBuffer;
var triangleCount = 0;

function initWebGL(canvas) {
  gl = canvas.getContext('webgl', { antialias: false });
  // TODO: experimental-webgl for Edge? (ugh)

  gl.viewport(0, 0, canvas.width, canvas.height);

  polyProgram = createShaderProgram();
  positionLoc = gl.getAttribLocation(polyProgram, 'position');
  gl.enableVertexAttribArray(positionLoc);
  colorLoc = gl.getUniformLocation(polyProgram, 'color');
}

// TODO: to be consistent, maybe this should be setColor and then draw but whatever
function draw(fillPolygon, color) {
  gl.uniform4fv(colorLoc, color);
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
    'uniform vec4 color;',
    'void main() {',
    '  gl_FragColor = color;',
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
