

var connection = false;
var newPlayer = true;
var rigidBodies =[];
var rigidBodiesLookUp = {};
//GLOBAL General variables

var mouse = new THREE.Vector2();
var clock = new THREE.Clock();


//MAIN
init();// start world building
animate(); //start rendering loop

/************SERVER HOOKUPS*******************/
// exposes a global for our socket connection
var socket = io();
		
		socket.on('connect',function(msg){
			connection = true;
			
		})
		
		//accept incoming msgs with header 'p'
		socket.on('p', function(msg){
			//console.log(msg);
		});
		socket.on('setup', function(msg){
			console.log(msg)
			if(newPlayer){
				//msg is the array of objects
				for(var i =0; i<msg.length;i++){
					console.log(msg[i]);
					createBoxObject(msg[i]);
					}
					
				newPlayer = false;
				console.log(msg);
			};
		});
		socket.on('update', function(msg){
			//msg should be JSON with each root key the ID of an object
			updateObjectLocations(msg);
		});
/*******************************/


//GLOBAL Graphics variables
var camera, scene, renderer;//primary components of displaying in three.js
var controls;
//RAYCASTER  is a project that renders a 3D world based on a 2D map
var raycaster = new THREE.Raycaster();//http://threejs.org/docs/api/core/Raycaster.html


function init() {

		initGraphics();

		initInput();

}

function initGraphics() {
 
//http://threejs.org/docs/api/cameras/PerspectiveCamera.html 
   camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );	
   //mess around with these parameters to adjust camera perspective view point
    camera.position.x = 10;
	camera.position.y = 20;
    camera.position.z =  0;
				
	scene = new THREE.Scene();//http://threejs.org/docs/#Reference/Scenes/Scene
    
	//http://threejs.org/docs/#Reference/Renderers/WebGLRenderer
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xf0f0f0 ); //sets the clear color and opacity of background.
    renderer.setPixelRatio( window.devicePixelRatio );//Sets device pixel ratio.
    renderer.setSize( window.innerWidth, window.innerHeight );//Resizes output to canvas device with pixel ratio taken into account

    
    //LIGHT
	//http://threejs.org/docs/api/lights/AmbientLight.html
	var ambientLight = new THREE.AmbientLight( 0x404040 );
	//ambientLight is for whole scene, use directionalLight for point source/spotlight effect
    scene.add( ambientLight );
    				
    				
    //attach and display the renderer to our html element
    var container = document.getElementById( 'container' );
        container.appendChild( renderer.domElement );
}

function createBoxObject(object,material) {
		
		//http://threejs.org/docs/api/math/Vector3.html
//		var pos = new THREE.Vector3(object.x,object.y,object.z);//location in 3D space
		
		//http://threejs.org/docs/api/math/Quaternion.html
	//	var quat = new THREE.Quaternion(object.Rx,object.Ry,object.Rz,1);//rotation/orientation in 3D space.  default is none, (0,0,0,1);
		
		//http://threejs.org/docs/api/extras/geometries/BoxGeometry.html
		var geometry = new THREE.BoxGeometry(object.w, object.d, object.h );
	
		material = material || new THREE.MeshBasicMaterial( { color: "rgb(30%, 30%, 40%)"} );
	
		//http://threejs.org/docs/#Reference/Objects/Mesh
		var Cube = new THREE.Mesh(geometry, material);
		
		//Set the objects location and orientation
	//	Cube.position = pos;
	//	Cube.quaternion = quat;
		
	   //attach the physic properties to the graphic object
	    Cube.userData = 'put stuff here if needed';
	
		//add to our physics object holder with assigned lookup ID
		rigidBodies.push(Cube) ;
		//used to quickly find our object in our object array
		rigidBodiesLookUp[object.id] = rigidBodies.length - 1;
		console.log(rigidBodiesLookUp)
		
		//add cube to graphics world
		scene.add( Cube );

}


function initInput() {
    controls = new THREE.OrbitControls( camera );
	controls.target.y = 2;
};

function updateObjectLocations(updateJson){
		
		//IDs is an array of stings which are the ptr IDs of objects in physics sim
		var IDs = Object.keys(updateJson);
		
		//cycle through objects that need an update
		for(var i=0;i<IDs.length;i++){
		
				var LookupID = IDs[i];
			    var index = rigidBodiesLookUp[LookupID] ;
				var update = updateJson[LookupID];
			 
				/* FIX THIS!!! create a reusable aux vector and quaternion, DONT make new every time */
			//	var pos = new THREE.Vector3( update.x,update.y,update.z)
			
			//	var quat = new THREE.Quaternion( update.Rx,update.Ry, update.Rz)
			
				rigidBodies[index].position.set = ( update.x,update.y,update.z);
				rigidBodies[index].quaternion.set = ( update.Rx,update.Ry, update.Rz)
			
				console.log(rigidBodies[index])
			
		}
}


function animate() {
        render();
		//call animate() in a loop
		requestAnimationFrame( animate );//https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    };
    
function render() {
	   var deltaTime = clock.getDelta();
       renderer.render( scene, camera );//graphics
	   controls.update( deltaTime );//view control
    };