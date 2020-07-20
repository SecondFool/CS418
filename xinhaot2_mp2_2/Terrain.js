/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");

        this.randomHeight();
        console.log("Terrain: Create the height");

        //this.generateNormals();
        //console.log("Terrain: Generated normal vectors");
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
     /**
    * update the normal vectors' values, and set them as normalized vector.
    */
    generateNormals(){
        for(var i = 0; i < this.div; i++){
            for(var j = 0; j < this.div; j++){
                var n = vec3.create();
                var v1 = vec3.create();
                var v2 = vec3.create();
                var v3 = vec3.create();                         //use v1, v2, v3 to save the traigle's three verts
                this.getVertex(v1, i, j);
                this.getVertex(v2, i + 1, j);
                this.getVertex(v3, i, j + 1);     
                var change = this.compute_normal(v1, v2, v3);   // compute the normal verctor
                //console.log(change);
                this.getNormal(n, i, j);
                vec3.add(n, change, n);                         //update the total normal vector
                this.setNormal(n, i, j);

                this.getNormal(n, i + 1, j);
                vec3.add(n, change, n);                          //update the total normal vector
                this.setNormal(n, i + 1, j);

                this.getNormal(n, i, j + 1);
                vec3.add(n, change, n);                             //update the total normal vector
                this.setNormal(n, i, j + 1);

                this.getVertex(v1, i + 1, j);
                this.getVertex(v2, i + 1, j + 1);                //update the total normal vector   
                this.getVertex(v3, i, j + 1);       
                var change = this.compute_normal(v1, v2, v3);
                
                this.getNormal(n, i + 1, j);
                vec3.add(n, change, n);                             //update the total normal vector
                this.setNormal(n, i + 1, j);

                this.getNormal(n, i + 1, j + 1);
                vec3.add(n, change, n);                         //update the total normal vector
                this.setNormal(n, i + 1, j + 1);

                this.getNormal(n, i + 1, j + 1);
                vec3.add(n, change, n);                         //update the total normal vector
                this.setNormal(n, i + 1, j + 1);
            }
        }

        for(var i = 0; i <= this.div; i++){
            for(var j = 0; j <= this.div; j++){
                var n = vec3.create();
                this.getNormal(n, i ,j);
                vec3.normalize(n, n);                           // normalize it
                var zero = vec3.create();
                zero[0] = 0;
                zero[1] = 0;
                zero[2] = 0;
                vec3.subtract(n, zero, n);                      // get -n
                //console.log(n);
                this.setNormal(n, i, j);
            }
        }
    }

     /**
    * Return the normal vector of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getNormal(n,i,j)
    {
        var index = 3 * (i * (this.div + 1) + j);
        n[0] = this.nBuffer[index];
        n[1] = this.nBuffer[index + 1];
        n[2] = this.nBuffer[index + 2];     
    }

     /**
    * Set the normal vector of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setNormal(n,i,j)
    {
        var index = 3 * (i * (this.div + 1) + j);
        this.nBuffer[index] = n[0];
        this.nBuffer[index + 1] = n[1];
        this.nBuffer[index + 2] = n[2];
    }

    /**
    *compute a triangle's normal vector.
    *and return it as vec3
    */
    compute_normal(v1, v2, v3){
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
    /**
    *give every vertex a random value of z-axis
    */
    randomHeight(){
        for(var counter = 0; counter < 100; counter++){
            var normalVector = vec3.create();
            normalVector[0] = Math.random() - 0.5;
            normalVector[1] = Math.random() - 0.5;                  //generate a random normal vector
            normalVector[2] = 0;
            var stdi = Math.floor(Math.random()* this.div);
            var stdj = Math.floor(Math.random()* this.div);
            var stdv = vec3.create();                               //generate a random vertex
            this.getVertex(stdv, stdi ,stdj);
            for(var i = 0; i <= this.div; i++){
                for(var j = 0; j <= this.div; j++){
                    var vertex = vec3.create();
                    this.getVertex(vertex, i, j);                   // get the vertex
                    var sub = vec3.create();
                    vec3.subtract(sub, vertex, stdv);
                    var value = vec3.dot(sub, normalVector);        // compute the dot product
                    if(value > 0){
                        vertex[2] += 0.006;         
                    }
                    else{
                        vertex[2] -= 0.006;                         // add and sub the contant
                    }
                    this.setVertex(vertex, i, j);
                }
            }
        }
        this.generateNormals();                                      //call generateNormals
        //console.log(this.vBuffer);
    }

    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        var index = 3 * (i * (this.div + 1) + j);
        this.vBuffer[index] = v[0];
        this.vBuffer[index + 1] = v[1];
        this.vBuffer[index + 2] = v[2];
        //Your code here
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        var index = 3 * (i * (this.div + 1) + j);
        v[0] = this.vBuffer[index];
        v[1] = this.vBuffer[index + 1];
        v[2] = this.vBuffer[index + 2];       
        //Your code here
    }
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }
/**
 * Fill the vertex and buffer arrays 
 */    
generateTriangles()
{
    //Your code here
    for(var i = 0; i <= this.div; i++){
        for(var j = 0; j <= this.div; j++){
            this.vBuffer.push(this.minX + ((this.maxX - this.minX) / this.div) * j);
            this.vBuffer.push(this.minY + ((this.maxY - this.minY) / this.div) * i);
            this.vBuffer.push(0);

            this.nBuffer.push(0);
            this.nBuffer.push(0);
            this.nBuffer.push(0);
        }
    }
    for(var i = 0; i < this.div; i++){
        for(var j = 0; j < this.div; j++){
            var index = i * (this.div + 1) + j;
            this.fBuffer.push(index);
            this.fBuffer.push(index + 1);
            this.fBuffer.push(index + this.div + 1);

            this.fBuffer.push(index + 1);
            this.fBuffer.push(index + 1 + this.div + 1);
            this.fBuffer.push(index + this.div + 1);
        }
    }
    
    //
    this.numVertices = this.vBuffer.length/3;
    this.numFaces = this.fBuffer.length/3;
}

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);
        
        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);
        
        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }
    
}
    
}
