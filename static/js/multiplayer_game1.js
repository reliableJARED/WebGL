//GLOBAL General variables

var connection = false;
var newPlayer = true;
var rigidBodiesLookUp = {};
var mouse = new THREE.Vector2();
var clock = new THREE.Clock();
var UNIQUE_ID; //assigned by the server

//MAIN
init();// start world building
animate(); //start rendering loop

/************SERVER HOOKUPS*******************/
// exposes a global for our socket connection
var socket = io();
		
		socket.on('connect',function(msg){
			connection = true;
			socket.emit('move','test');
		});
		
		socket.on('newPlayer',function(msg){

			//don't build player if server is talking about you!
			var NewID = Object.keys(msg)[0];
			
			if( NewID === UNIQUE_ID){
			}else{createBoxObject(msg[NewID])}
		});
		
		
		socket.on('playerID',function(msg){
			//server assigned uniqueID
			UNIQUE_ID = msg;
		});
		
		socket.on('setup', function(msg){
			console.log(msg)
			//msg is an array of JSON with each root key the ID of an object
			if(newPlayer){
				//msg is the array of objects
				for(var i =0; i<msg.length;i++){
					
					if(msg[i].shape === 'box'){
						createBoxObject(msg[i]);
						}					
					};
					
				newPlayer = false;//prevent response to 'setup' msg intended for other players
			};
			animate();
			
		});
		
		socket.on('update', function(msg){
			//msg is a JSON with each root key the ID of an object and props x,y,z,Rx,Ry,Rz used to update the objects position/orientation in world
			updateObjectLocations(msg);
		});
		

		socket.on('removePlayer', function(msg){
			//msg is an ID for an object
			//remove it
			console.log('remove: ',msg)
			scene.remove( rigidBodiesLookUp[msg] )
			delete rigidBodiesLookUp[msg];
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
		
	//	createBoxObject({id:'test',w:2,d:2,h:2,x:0,y:2,z:2,Rx:0,Ry:.5,Rz:.5},new THREE.MeshBasicMaterial( { color: "rgb(100%, 0%, 0%)"} ))

}

function initGraphics() {
 
   //http://threejs.org/docs/api/cameras/PerspectiveCamera.html 
   camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );	
  
  //mess around with these parameters to adjust camera perspective view point
   camera.position.x = 10;
	camera.position.y = 20;
   camera.position.z =  0;
				
	//http://threejs.org/docs/#Reference/Scenes/Scene			
	scene = new THREE.Scene();
    
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

function createBoxObject(object) {
		
		var material;//consider passing mat types to flag basic, phong, etc...
		
		//http://threejs.org/docs/api/extras/geometries/BoxGeometry.html
		var geometry = new THREE.BoxGeometry(object.w, object.h, object.d );
	
		try{
			material = new THREE.MeshBasicMaterial( { color: object.color} );}
	   catch (err) {
			console.log('no color property passed')
			material = new THREE.MeshBasicMaterial( { color: "rgb(30%, 30%, 40%)"} );}
	   	
		//http://threejs.org/docs/#Reference/Objects/Mesh
		var Cube = new THREE.Mesh(geometry, material);

	   //attach any properties to the graphic object on this node of Cube object
	    Cube.userData = 'put stuff here if needed';
	    
	    Cube.position.set(object.x, object.y, object.z );
	    Cube.quaternion.set(object.Rx, object.Ry, object.Rz,1 );
	
		//used to quickly find our object in our object array
	    rigidBodiesLookUp[object.id] = Cube;
		
		//add cube to graphics world
		scene.add( Cube );

}


function initInput() {
    controls = new THREE.OrbitControls( camera );
	controls.target.y = 2;
};

function updateObjectLocations(updateJson){
		
		//IDs is an array of stings which are the IDs of objects in physics sim
		//that can be matched up with their representation in our graphic objects tree rigidBodiesLookUp
		var IDs = Object.keys(updateJson);
		console.log(IDs);
		//cycle through objects that need an update
		for(var i=0;i<IDs.length;i++){
			//get the objects ID
			var id = IDs[i]
			
			try{
				//find the object
				var object = rigidBodiesLookUp[id];
		
				//get the new position/orientation for the object
				var update = updateJson[id];
		
				//apply update
				object.position.set( update.x,update.y,update.z);
				object.quaternion.set( update.Rx,update.Ry, update.Rz,1);	
			}
			catch(err){console.log(rigidBodiesLookUp)
				delete rigidBodiesLookUp[id];
			}
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
    
    