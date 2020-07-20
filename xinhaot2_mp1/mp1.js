/*edited by xinhaot2 at 2019/9/20 */


var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The angle of rotation around the x axis */
var defAngle = 0;

/** @global Number of vertices around the circle boundary */
var numCircleVerts = 100;

/** @global Two times pi to save some multiplications...*/
var twicePi=2.0*3.14159;

var clk = 0;
var back = 0;
var clk2 = 0;
var scaleVec = vec3.create();
vec3.set(scaleVec, 1, 1, 1);
var playmine = 0;
var up = 0;
var clk3 = 0;
var clk4 = 0;
var clk5 = 0;
//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

function deformSin (x, y, angle){
  var circPt = vec2.fromValues(x, y);
  var dist = 0.2*Math.sin((angle) + degToRad(defAngle));
  vec2.normalize(circPt, circPt);
  vec2.scale(circPt, circPt, dist);
  return circPt;
}














/**
 *  load the vertices to present the animations
 * my animation is let the symbol jump and jump
 * and the first animations are moving and rotating
 */
function loadVertices() {
    console.log("Frame",defAngle);
//Generate the vertex positions    
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    var movement = clk * 0.005;
  // Start with vertex at the origin    
  var triangleVertices = [
        

            -0.40 + movement, 0.75 , 0.1,
            -0.40 + movement, -0.75, 0.1,
            0.40 + movement, 0.75, 0.1,

            -0.40 + movement, -0.75, 0.1,
            0.40  + movement, 0.75, 0.1,
            0.40  + movement, -0.75, 0.1,       //the middle rect

            -0.93  + movement, 1.21, 0.1,
            0.93 + movement, 1.21, 0.1,
            -0.93 + movement, 0.63, 0.1,

            0.93 + movement, 1.21, 0.1,
            -0.93 + movement, 0.63, 0.1,
            0.93 + movement, 0.63, 0.1,        // the top rect

            -0.93 + movement, -1.21, 0.1,
            0.93 + movement, -1.21, 0.1,
            -0.93 + movement, -0.63, 0.1,

            0.93 + movement, -1.21, 0.1,
            -0.93 + movement, -0.63, 0.1,
            0.93 + movement, -0.63, 0.1,       // the bottom rect

            -0.33 + movement, 0.69, 0.0,
            -0.33 + movement, -0.69, 0.0,
            0.33 + movement, 0.69, 0.0,

            -0.33 + movement, -0.69, 0.0,
            0.33 + movement, 0.69, 0.0,
            0.33 + movement, -0.69, 0.0,       //the middle rect

            -0.84 + movement, 1.15, 0.0,
            0.84 + movement, 1.15, 0.0,
            -0.84 + movement, 0.69, 0.0,

            0.84 + movement, 1.15, 0.0,
            -0.84 + movement, 0.69, 0.0,
            0.84 + movement, 0.69, 0.0,        // the top rect

            -0.84 + movement, -1.15, 0.0,
            0.84 + movement, -1.15, 0.0,
            -0.84 + movement, -0.69, 0.0,

            0.84 + movement, -1.15, 0.0,
            -0.84 + movement, -0.69, 0.0,
            0.84 + movement, -0.69, 0.0        // the bottom rect
        
];       

var sca_down;
sca_down = (100 - clk3)*(100 - clk3) / 10000 ;
if (sca_down < 0.20){
    clk3 = 50;
    up = 1;
}
var moveup = (50 - clk3) * 0.03 
var movex = clk5 * 0.002;
if (playmine == 1){
    triangleVertices = [
        

                -0.40 + movex, (0.75+1.21)*sca_down - 1.21 + moveup, 0.1,
                -0.40 + movex, (-0.75+1.21)*sca_down - 1.21+ moveup, 0.1,
                0.40 + movex, (0.75+1.21)*sca_down - 1.21+ moveup, 0.1,
        
                -0.40 + movex,( -0.75+1.21)*sca_down - 1.21+ moveup, 0.1,
                0.40  + movex, (0.75+1.21)*sca_down - 1.21+ moveup, 0.1,
                0.40  + movex,( -0.75+1.21)*sca_down - 1.21+ moveup, 0.1,       //the middle rect
        
                -0.93 + movex,( 1.21+1.21)*sca_down - 1.21+ moveup, 0.1,
                0.93 + movex, (1.21+1.21)*sca_down - 1.21+ moveup, 0.1,
                -0.93 + movex, (0.63+1.21)*sca_down - 1.21+ moveup, 0.1,
        
                0.93 + movex, (1.21+1.21)*sca_down - 1.21+ moveup, 0.1,
                -0.93 + movex, (0.63+1.21)*sca_down - 1.21+ moveup, 0.1,
                0.93 + movex,( 0.63+1.21)*sca_down - 1.21+ moveup, 0.1,        // the top rect
        
                -0.93 + movex, (-1.21+1.21)*sca_down - 1.21+ moveup, 0.1,
                0.93 + movex, (-1.21+1.21)*sca_down - 1.21+ moveup, 0.1,
                -0.93 + movex, (-0.63+1.21)*sca_down - 1.21+ moveup, 0.1,
        
                0.93 + movex, (-1.21+1.21)*sca_down - 1.21+ moveup, 0.1,
                -0.93 + movex, (-0.63+1.21)*sca_down - 1.21+ moveup, 0.1,
                0.93 + movex, (-0.63+1.21)*sca_down - 1.21+ moveup, 0.1,       // the bottom rect
        
                -0.33 + movex,( 0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
                -0.33 + movex,( -0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
                0.33 + movex,( 0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
        
                -0.33 + movex, (-0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
                0.33 + movex,( 0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
                0.33 + movex, (-0.69+1.21)*sca_down - 1.21+ moveup, 0.0,       //the middle rect
        
                -0.84 + movex, (1.15+1.21)*sca_down - 1.21+ moveup, 0.0,
                0.84 + movex,( 1.15+1.21)*sca_down - 1.21+ moveup, 0.0,
                -0.84 + movex,( 0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
        
                0.84 + movex, (1.15+1.21)*sca_down - 1.21+ moveup, 0.0,
                -0.84 + movex,( 0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
                0.84 + movex, (0.69+1.21)*sca_down - 1.21+ moveup, 0.0,        // the top rect
        
                -0.84 + movex, (-1.15+1.21)*sca_down - 1.21+ moveup, 0.0,
                0.84+ movex, (-1.15+1.21)*sca_down - 1.21+ moveup, 0.0,
                -0.84 + movex, (-0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
        
                0.84 + movex, (-1.15+1.21)*sca_down - 1.21+ moveup, 0.0,
                -0.84 + movex, (-0.69+1.21)*sca_down - 1.21+ moveup, 0.0,
                0.84 + movex, (-0.69+1.21)*sca_down - 1.21+ moveup, 0.0        // the bottom rect
            
];       
}
    
for (i = 0; i < 108; i++){
    triangleVertices[i] /= 2;
}

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 36;
}

/**
 * give the two 'I's different colors
 */
function loadColors() {
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    
  // Set the heart of the circle to be black    
  var colors = [];

  for (i = 0; i < 18; i++){
    colors.push(19 / 255);
    colors.push(41 / 255);
    colors.push(75 / 255);
    colors.push(1.0);
  }

  for (j = 0; j < 18; j++){
    colors.push(233 / 255);
    colors.push(74 / 255);
    colors.push(39 / 255);
    colors.push(1.0);
  }

    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 36;  
}
/**
 * Populate buffers with data
   @param {number} number of vertices to use around the circle boundary
 */
function setupBuffers() {
    
  //Generate the vertex positions    
  loadVertices();

  //Generate the vertex colors
  loadColors();
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);
    

  var sca = clk2 * 0.005;
  vec3.set(scaleVec, sca * 0.5 +0.5, sca * 0.5 +0.5, 1);
   if ((clk2 < 600)&(clk2 > 200)){ 
    mat4.scale(mvMatrix, mvMatrix, scaleVec);
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(100*sca - 100));
   }


  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() { 
    if (back == 0){
        clk+=2;
    }
    if (clk > 100){
        back = 1;
    }
    if (back == 1){
        clk-=2;
    }
    if (clk < 1){
        back = 0;
    }
    if(clk2 < 200){
        loadVertices();
    }
    clk2 ++;
}
/*
* my animation is letting the symbol to jump 
* and jump. back to head and to back~
*/
function animate_mine() { 
    clk2 = 800;
    clk = 200;
    if (clk3 > 98){
        up = 1;
    }
    if (clk3 < 2){
        up = 0;
    }
    if (up == 0){
        clk3 ++;
    }
    if (up == 1){
        clk3 --;
    }
    if (clk5 > 498){
        ri = 1;
    }
    if (clk5 < 2){
        ri = 0;
    }
    if (ri == 0){
        clk5 ++;
    }
    if (ri == 1){
        clk5 --;
    }
    if(clk4 < 2000){
        loadVertices();
    }
    clk4 ++;
}
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    if (playmine == 0){
        animate();
    }
    if (playmine == 1){
        animate_mine();
    }
}

/*switch the animations */
function switch_sce(num){
  playmine = num;
}