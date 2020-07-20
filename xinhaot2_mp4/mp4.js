
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

var days=0;


// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

var sphereP = []; //position
var sphereV = []; //velocity
var sphereR = []; //radius
var sphereC = []; //color
var sphereNum = 0; //number

var g = 0.0198;
var drag = 0.001;
var deltaT = 1.0;   //stand for the time for a tick loop
// View parameters
var eyePt = vec3.fromValues(0.0,0.0,150.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

//-----------------------------------------------------------------
//Color conversion  helper functions

//-------------------------------------------------------------------------
/**
 * Populates buffers with data for spheres
 */
function setupSphereBuffers() {
    
    var sphereSoup=[];
    var sphereNormals=[];
    var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
    console.log("Generated ", numT, " triangles"); 
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                  gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);     
}

/**
 * add two spheres by using the addsphere() twice
 */
function addtwospheres(){
  addsphere();
  addsphere();
}

/**
 * add a sphere
 */
function addsphere(){
  sphereNum = sphereNum + 1;
  sphereC.push(Math.random());
  sphereC.push(Math.random());
  sphereC.push(Math.random());

  sphereP.push(Math.random()*80 - 40);
  sphereP.push(Math.random()*50 - 15);
  sphereP.push(Math.random()*70 - 35);

  sphereR.push((Math.random() + 0.5) * 3);
  
  sphereV.push(Math.random()*2 - 1);
  sphereV.push(Math.random()*2 - 1);
  sphereV.push(Math.random()*2 - 1);
  //console.log(sphereC);
}

/**
 * reset: remove all the spheres
 */
function reset(){
  sphereP = []; 
  sphereV = []; 
  sphereR = []; 
  sphereC = []; 
  sphereNum = 0;
}
//-------------------------------------------------------------------------
/**
 * Draws a sphere from the sphere buffer
 */
function drawSphere(){
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders(vshader,fshader) {
  vertexShader = loadShaderFromDOM(vshader);
  fragmentShader = loadShaderFromDOM(fshader);
  
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

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformDiffuseMaterialColor = gl.getUniformLocation(shaderProgram, "uDiffuseMaterialColor");
  shaderProgram.uniformAmbientMaterialColor = gl.getUniformLocation(shaderProgram, "uAmbientMaterialColor");
  shaderProgram.uniformSpecularMaterialColor = gl.getUniformLocation(shaderProgram, "uSpecularMaterialColor");

  shaderProgram.uniformShininess = gl.getUniformLocation(shaderProgram, "uShininess");    
}


//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32Array} a diffuse material color
 * @param {Float32Array} a ambient material color
 * @param {Float32Array} a specular material color 
 * @param {Float32} the shininess exponent for Phong illumination
 */
function uploadMaterialToShader(dcolor, acolor, scolor,shiny) {
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColor, dcolor);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColor, acolor);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColor, scolor);
    
  gl.uniform1f(shaderProgram.uniformShininess, shiny);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s); 
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    setupSphereBuffers();     
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    // mvPushMatrix();
    // vec3.set(transformVec,20,20,20);
    // mat4.scale(mvMatrix, mvMatrix,transformVec);
    
    // // Get material color
    // // colorVal = document.getElementById("mat-color").value
    // // console.log(colorVal);
    // R = 255.0/255.0;
    // G = 0.0/255.0;
    // B = 0.0/255.0;
    
    // //Get shiny
    // shiny = 100.0;
    
    // uploadLightsToShader([20,20,20],[0.0,0.0,0.0],[1.0,1.0,1.0],[1.0,1.0,1.0]);
    // uploadMaterialToShader([R,G,B],[R,G,B],[1.0,1.0,1.0],shiny);
    // setMatrixUniforms();
    // drawSphere();
    // mvPopMatrix();
    for (var i = 0; i < sphereNum; i ++){
      
      mvPushMatrix();
      vec3.set(transformVec, sphereP[3*i], sphereP[3*i + 1], sphereP[3*i + 2]);
      mat4.translate(mvMatrix, mvMatrix,transformVec);
      vec3.set(transformVec,sphereR[i], sphereR[i], sphereR[i]);
      mat4.scale(mvMatrix, mvMatrix,transformVec);
      // vec3.set(transformVec,1,1,1);
      // mat4.scale(mvMatrix, mvMatrix,transformVec);

      var color = vec3.fromValues(sphereC[3*i],sphereC[3*i + 1],sphereC[3*i + 2]);
      uploadLightsToShader([20,20,20],[0.0,0.0,0.0],[1.0,1.0,1.0],[1.0,1.0,1.0]);
      uploadMaterialToShader(color, color, [1.0, 1.0, 1.0], 100.0);
      setMatrixUniforms();
      drawSphere();
      mvPopMatrix();
    }


}



//----------------------------------------------------------------------------------
/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function setGouraudShader() {
    console.log("Setting Gouraud Shader");
    setupShaders("shader-gouraud-phong-vs","shader-gouraud-phong-fs");
}


//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders("shader-phong-phong-vs","shader-phong-phong-fs");
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}


/**
 * the animations for every loop, including uodate the positions, velocities;
 * detecting the collisions as well.
 */
function animate(){
  for (var i = 0; i < sphereNum; i ++){
    sphereP[3*i] += sphereV[3*i] * deltaT;
    sphereP[3*i + 1] += sphereV[3*i + 1]* deltaT;
    sphereP[3*i + 2] += sphereV[3*i + 2]* deltaT;         //Using Euler integration for  position

    sphereV[3*i] = sphereV[3*i] - sphereV[3*i]*drag* deltaT;
    sphereV[3*i + 1] = sphereV[3*i + 1] - sphereV[3*i + 1]*drag* deltaT;
    sphereV[3*i + 2] = sphereV[3*i + 2] - sphereV[3*i + 2]*drag* deltaT;     //Using Euler integration for velocity, the acc caused by drag

    // if(sphereV[3*i + 1] == 0.0){
    //   return;
    // }

    if((sphereP[3*i] + sphereR[i] > 40.0) | (sphereP[3*i] - sphereR[i] < -40.0)){
      sphereV[3*i] = -sphereV[3*i];
    }
    if((sphereP[3*i + 1] + sphereR[i] > 35.0) | (sphereP[3*i + 1] - sphereR[i] < -15.0)){
      sphereV[3*i + 1] = -sphereV[3*i + 1];
    }
    if (sphereP[3*i + 1] + sphereR[i] > 35.0){
      sphereP[3*i + 1] -= 0.1;
    }
    if((sphereP[3*i + 2] + sphereR[i] > 35.0) | (sphereP[3*i + 2] - sphereR[i] < -35.0)){
      sphereV[3*i + 2] = -sphereV[3*i + 2];
    }

    sphereV[3*i + 1] -= g* deltaT;          ////Using Euler integration for velocity, for the accerleration is fixed

    if((sphereP[3*i + 1] - sphereR[i] < -15.0)){
       sphereP[3*i + 1] = -15.0 + sphereR[i];
     }
  }

}


