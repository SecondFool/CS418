/**
 * @file A simple WebGL example for viewing meshes read from OBJ files
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global An object holding the geometry for a 3D mesh */
var myMesh;


// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.0,10.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [1,1,1];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0.2,0.2,0.2];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [0.5,0.5,0.5];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0.9,0.9,0.9];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0.0,0.0,0.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];


 /**this is the texture for cube */
var texture_c;    
var skyvBuffer;
var skyiBuffer;

var Keys = {};                  // for the pressed keys
var vBuffer = [];               //four buffers for the vertex
var fBuffer = [];
var cBuffer = [];  
var nBuffer = [];
var teapot_vertexBuffer;        //four buffer for teapot
var teapot_normalBuffer;
var teapot_indexBuffer;
var teapot_colorBuffer;
var eye = quat.create(0, 0, 0, 1);     // rotate the eye
var tea = quat.create(0, 0, 0, 1);      // ortate the teapot
var a = 0;
var d = 0;
//---------------------------------------------------------------------------------
/**
 * Gets a file from the server for processing on the client side.
 *
 * @param  file A string that is the name of the file to get
 * @param  callbackFunction The name of function (NOT a string) that will receive a string holding the file
 *         contents.
 *
 */
function readTextFile(file, callbackFunction)
{
    console.log("reading "+ file);
    var rawFile = new XMLHttpRequest();
    var allText = [];
    rawFile.open("GET", file, true);
    
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                 callbackFunction(rawFile.responseText);
                 console.log("Got text file!");
                 
            }
        }
    }
    rawFile.send(null);
}

/**
 * Setup the teapot buffer
 *  @param  file_text A string that is the name of the file to get
 */
function teapot(file_text){
    
    vNumber = 0;
    fNumber =0;

    var lines = file_text.split("\n");
    for (var i in lines){
      var line = lines[i].split(' ');
      if (line[0] == 'f'){
        fBuffer.push(parseInt(line[2] - 1));
        fBuffer.push(parseInt(line[3] - 1));
        fBuffer.push(parseInt(line[4] - 1));
        fNumber += 1;
      }
      if (line[0] == 'v'){
        vBuffer.push(parseFloat(line[1]));
        vBuffer.push(parseFloat(line[2]));
        vBuffer.push(parseFloat(line[3]));
        vNumber += 1;
      }
    }
    for (i = 0; i < vNumber; i++){
        nBuffer.push(0);
        nBuffer.push(0);
        nBuffer.push(0);
        cBuffer[3 * i] = 0.0;
        cBuffer[3 * i + 1]= 1.0;
        cBuffer[3* i + 2] = 0.0;
    
      }
    
      setVertexNormals(vNumber, fNumber);

    
    teapot_vertexBuffer = gl.createBuffer();
    teapot_normalBuffer = gl.createBuffer();
    teapot_indexBuffer = gl.createBuffer();
    teapot_colorBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, teapot_vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vBuffer), gl.STATIC_DRAW);
    teapot_vertexBuffer.numItems = vNumber;

    gl.bindBuffer(gl.ARRAY_BUFFER, teapot_colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cBuffer), gl.STATIC_DRAW);
    teapot_colorBuffer.numItems = vNumber;

    gl.bindBuffer(gl.ARRAY_BUFFER, teapot_normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nBuffer), gl.STATIC_DRAW);
    teapot_normalBuffer.numItems = vNumber; 

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapot_indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fBuffer), gl.STATIC_DRAW);
    teapot_indexBuffer.numItems = fNumber;

}


/**
 * bind the teapot buffer
 */
function drawTeapot(){
        gl.uniform1f(shaderProgram.uniformTeapotLoc, 0.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, teapot_normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
      
        gl.bindBuffer(gl.ARRAY_BUFFER, teapot_vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
      
        gl.bindBuffer(gl.ARRAY_BUFFER, teapot_colorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);
      
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapot_indexBuffer);
        gl.drawElements(gl.TRIANGLES, 6768, gl.UNSIGNED_SHORT, 0);
	
}


/**
 * Setup the skybox buffer
 */
function skybox(){
  var v = [
    100, 100, 100,
    100, 100, -100,
    100, -100, 100,
    100, -100, -100,
    -100, 100, 100,
    -100, 100, -100,
    -100, -100, 100,
    -100, -100, -100
  ];

  var skybox_vertexIndex = [
    6, 2, 0,
    6, 0, 4,
    7, 5, 1,
    7, 1, 3,
    5, 4, 0,
    5, 0, 1,
    7, 3, 2,
    7, 2, 6,
    3 ,1 ,0,
    3, 0, 2,
    7, 6, 4,
    7, 4, 5
   ];

  skyvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);

  skyiBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyiBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(skybox_vertexIndex), gl.STATIC_DRAW);
}

/**
* bind the buffers in skybox
*/
function drawSkybox(){
  gl.uniform1f(shaderProgram.uniformTeapotLoc, 1.0);    //uniformTeapotLoc == 1 means that's skybox

  gl.bindBuffer(gl.ARRAY_BUFFER, skyvBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyvBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyiBuffer);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

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
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
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

//-------------------------------------------------------------------------------------
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
  
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
  
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
    shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
    shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
    shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");

    shaderProgram.uniformTeapotLoc = gl.getUniformLocation(shaderProgram, "uTeapot");

    shaderProgram.uniformReflectLoc = gl.getUniformLocation(shaderProgram, "uReflect");
    shaderProgram.uniformRefractLoc = gl.getUniformLocation(shaderProgram, "uRefract");

  }

//---------------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
	gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
	gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
	gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
	gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}


/**
 * set the six pictures for the sky box
 */
function setupCube(){
   texture_c = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture_c);
   gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

   loadc(gl.TEXTURE_CUBE_MAP_POSITIVE_X, texture_c,  'London/pos-x.png');
   loadc(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, texture_c,  'London/neg-x.png');
   loadc(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, texture_c,  'London/pos-y.png');
   loadc(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, texture_c,  'London/neg-y.png');
   loadc(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, texture_c,  'London/pos-z.png');
   loadc(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, texture_c,  'London/neg-z.png');

}

/**
 * load the correspond pictures
 */
 function loadc(face, texture, sour){
   var image = new Image();
   image.onload = function(){
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }    
    image.src = sour;
 }

  

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupMesh(filename) {
    //Your code here
     myMesh=new TriMesh();
     myPromise= asyncGetFile(filename);
     myPromise.then((retrievedText)=>{
         myMesh.loadFromOBJ(retrievedText);
         console.log('got the file!');
     })
         .catch(
             (reason) => {
                 console.log('handle rejected promise ('+reason+') here.');
                 
             }
         );
 
 }
//---------------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    if (a == 1){
      tea = quat.create(0, 0, 0, 1);
      quat.rotateY(tea, tea, -0.03);
      rotatetea();
      a = 0; 
    }
    if (d == 1){
      tea = quat.create(0, 0, 0, 1);
      quat.rotateY(tea, tea, 0.03);
      rotatetea();
      d = 0;
    }


    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var rotation = mat4.create(0, 0, 0, 0);
    mat4.fromQuat(rotation, eye); 
    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(90), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 200.0);
    animate();
    vec3.add(viewPt, eyePt, viewDir);
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);

    mvPushMatrix();
    mat4.multiply(mvMatrix, mvMatrix, rotation);

    gl.uniform1i(shaderProgram.uCubeSampler, 1.0);
    
    
    setMatrixUniforms();
    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);

    //setMaterialUniforms(shininess,kAmbient,kTerrainDiffuse,kSpecular);

    drawSkybox();
    drawTeapot();
    
    mvPopMatrix();
}


function handleKeyDown(event) {
        //console.log("Key down ", event.key, " code ", event.code);
        Keys[event.key] = true;
}

function handleKeyUp(event) {
        //console.log("Key up ", event.key, " code ", event.code);
        Keys[event.key] = false;
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupCube();
  skybox();
	readTextFile("teapot_0.obj", teapot);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  tick();
}


//----------------------------------------------------------------------------------
/**
  * Update any model transformations
  */
function animate() {
    if(Keys["ArrowDown"]){          //press ArrowDown to turn the teapot
      quat.rotateX(eye, eye, -0.005);
    }
    if(Keys["ArrowUp"]){
      quat.rotateX(eye, eye, 0.005);
    }
    if(Keys["ArrowRight"]){         //press Arrowright to turn the teapot
      quat.rotateY(eye, eye, 0.003);
    }
    if(Keys["ArrowLeft"]){         //press Arrowleft to turn the teapot
      quat.rotateY(eye, eye, -0.003);
    }
    if(Keys["a"]){
      a = 1;
    }
    if(Keys["d"]){
      d = 1;
    }
}

/**
 * rotate the teapot by a certain degree
 */
function rotatetea(){
  var i = 0;
  var v = vec3.create();
  var n = vec3.create();
  for( i = 0; i < vBuffer.length/3; i++){
    v[0] = vBuffer[3*i];
    v[1] = vBuffer[3*i + 1];
    v[2] = vBuffer[3*i + 2];
    n[0] = nBuffer[3*i];
    n[1] = nBuffer[3*i + 1];
    n[2] = nBuffer[3*i + 2];
    vec3.transformQuat(v, v, tea);
    vec3.transformQuat(n, n, tea);          //rotate the every normal and vertex by a degree
    vBuffer[3*i] = v[0];
    vBuffer[3*i + 1] = v[1];
    vBuffer[3*i + 2] = v[2];
    nBuffer[3*i] = n[0];
    nBuffer[3*i + 1] = n[1];
    nBuffer[3*i + 2] = n[2];
  }
  teapot_vertexBuffer = gl.createBuffer();
  teapot_normalBuffer = gl.createBuffer();

    var vNumber = vBuffer.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, teapot_vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vBuffer), gl.STATIC_DRAW);
    teapot_vertexBuffer.numItems = vNumber;

    gl.bindBuffer(gl.ARRAY_BUFFER, teapot_normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nBuffer), gl.STATIC_DRAW);
    teapot_normalBuffer.numItems = vNumber; 
}
//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    animate();
    draw();
}

/**
 * open the reflect mode for the teapot
 */
function reflect(){
  gl.uniform1f(shaderProgram.uniformReflectLoc, 1.0);
  gl.uniform1f(shaderProgram.uniformRefractLoc, 0.0);
}


/**
 * open the refract mode for the teapot
 */
function refract(){
  gl.uniform1f(shaderProgram.uniformReflectLoc, 0.0);
  gl.uniform1f(shaderProgram.uniformRefractLoc, 1.0);
}



/**
 * open the origin mode for the teapot
 */
function origin(){
  gl.uniform1f(shaderProgram.uniformReflectLoc, 0.0);
  gl.uniform1f(shaderProgram.uniformRefractLoc, 0.0);
}



/**
 * Setup the normal buffer for teapot
 */
function setVertexNormals(vNumber, fNumber){
  for (var i = 0; i < fNumber; i++){
    var i1 = fBuffer[i * 3];
    var i2 = fBuffer[i * 3 + 1];
    var i3 = fBuffer[i * 3 + 2];

    var v1 = vec3.create();
    var v2 = vec3.create();
    var v3 = vec3.create();

    v1[0] = vBuffer[i1 * 3];
    v1[1] = vBuffer[i1 * 3 + 1];
    v1[2] = vBuffer[i1 * 3 + 2];

    v2[0] = vBuffer[i2 * 3];
    v2[1] = vBuffer[i2 * 3 + 1];
    v2[2] = vBuffer[i2 * 3 + 2];

    v3[0] = vBuffer[i3 * 3];
    v3[1] = vBuffer[i3 * 3 + 1];
    v3[2] = vBuffer[i3 * 3 + 2];


    var nor = vec3.create();
    nor = compute_normal(v1, v2, v3);

    nBuffer[i1 * 3] += nor[0];
    nBuffer[i1 * 3 + 1] += nor[1];
    nBuffer[i1 * 3 + 2] += nor[2]; 
    nBuffer[i2 * 3] += nor[0];
    nBuffer[i2 * 3 + 1] += nor[1];
    nBuffer[i2 * 3 + 2] += nor[2]; 
    nBuffer[i3 * 3] += nor[0];
    nBuffer[i3 * 3 + 1] += nor[1];
    nBuffer[i3 * 3 + 2] += nor[2]; 
  }

  for (var j = 0; j < vNumber; j++){
    var n = vec3.create();
    n[0] = nBuffer[j * 3];
    n[1] = nBuffer[j * 3 + 1];
    n[2] = nBuffer[j * 3 + 2];
    vec3.normalize(n, n);
    nBuffer[j * 3] = n[0];
    nBuffer[j * 3 + 1] = n[1];
    nBuffer[j * 3 + 2] = n[2];
  }
}

/**
    *compute a triangle's normal vector.
    *and return it as vec3
    */
function compute_normal(v1, v2, v3){
    var sub1 = vec3.create();
    vec3.subtract(sub1, v2, v1);
    var sub2 = vec3.create();
    vec3.subtract(sub2, v3, v1);
    var value = vec3.create();
    vec3.cross(value, sub1, sub2);                  //use cross to compute the normal vector
    vec3.normalize(value, value);
    //console.log(value);
    return value;
}



