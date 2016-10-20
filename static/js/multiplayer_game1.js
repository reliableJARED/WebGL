//GLOBAL General variables
var connection = false;
var newPlayer = true;
var rigidBodiesLookUp = {};
var OtherPlayers = new Object;
var mouse = new THREE.Vector2();
var clock = new THREE.Clock();
var UNIQUE_ID; //assigned by the server
var camX =0;var camY = 5; var camZ = -20;//Set the initial perspective for the user
var PlayerCube;
var movementSpeed = 2;
var shotFireForce = 500;
var UPDATES_FROM_SERVER = {};
var TopSpeed = 25;
var RotationForce = 1;
var textureLoader = new THREE.TextureLoader();


//GLOBAL Physics variables
var physicsWorld;
var gravityConstant = -9.8; //should this be sent from server?
var OnScreenBodies =[];
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var softBodySolver;
var transformAux1 = new Ammo.btTransform();
var vector3Aux1 = new Ammo.btVector3();
var quaternionAux1 = new Ammo.btQuaternion();
var PHYSICS_ON = true;
var MovementForce = 1;//sets the movement force from dpad


//MAIN
init();// start world building


var GAMEPAD = new ABUDLR({left:{callback:GAMEPAD_left_callback}});

/************SERVER HOOKUPS*******************/
// exposes a global for our socket connection
var socket = io();
		
		socket.on('connect',function(msg){
			connection = true;
		//	console.log(msg);
			
		});
		
		socket.on('newPlayer',function(msg){
		//	console.log(msg);
		   //don't build player if server is talking about you!
		   var NewID = Object.keys(msg)[0];
		   
		   //TODO: STORE NewID some where because it represents a players socketID
		   
			if( NewID === UNIQUE_ID){
			}else{
			createBoxObject(msg[NewID])};
			//	OtherPlayers[NewID] = createBoxObject(msg[NewID],true)}
		   });
		
		socket.on('playerID',function(msg){
		//	console.log(msg);
			//server assigned uniqueID
			UNIQUE_ID = msg;
			socket.emit('getMyObj','get');
		});

		socket.on('yourObj',function(msg){
		//	console.log(msg);
			PlayerCube = rigidBodiesLookUp[msg];
			 PlayerCube.userData.physics.setActivationState(4);//ALLWAYS ACTIVEATE
			 //now that you exist, start rendering loop
			animate();
		})		
		
		socket.on('setup', function(msg){
		//	console.log(msg);
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
			
		});
		
		socket.on('update', function(msg){
		//	console.log(msg)
			/*TODO: consider ONLY tracking xyz no rotation? this will cut data in half and have little
			effect on sync of game between players*/
			UPDATES_FROM_SERVER = msg;
			//msg is a JSON with each root key the ID of an object and props x,y,z,Rx,Ry,Rz used to update the objects position/orientation in world
			
		});
		

		socket.on('removePlayer', function(msg){
		//	console.log(msg);
		//	delete OtherPlayers[msg];
			
		});
		
		socket.on('rmvObj', function(msg){
			//console.log(msg);
			//msg is an ID for an object
			//remove it
			scene.remove( rigidBodiesLookUp[msg] )
			physicsWorld.removeRigidBody( rigidBodiesLookUp[msg].userData.physics );
			delete rigidBodiesLookUp[msg];
		});
		
		socket.on('F',function(msg){
			//check if this is local players 'F'
			var ID = Object.keys(msg)[0];
			
			if(PlayerCube.userData.id != ID){
				//msg is an ID with xyz props for a central impulse
				EnemyMovement(ID,msg);};
		});
		
		socket.on('B',function(msg){
			//check if this is local players 'B'
			var ID = Object.keys(msg)[0];
			
			if(PlayerCube.userData.id != ID){
				//msg is an ID with xyz props for a central impulse
				EnemyMovement(ID,msg);};
		});
		
		socket.on('T',function(msg){
			//check if this is local players 'T'
			var ID = Object.keys(msg)[0];
			
			if(PlayerCube.userData.id != ID){
				//msg is an ID with xyz props for a central impulse
				EnemyMovement(ID,msg);};
		});
		
		socket.on('S',function(msg){
			//check if this is local players 'T'
			var ID = Object.keys(msg)[0];
			
			if(PlayerCube.userData.id != ID){
				//msg is an ID with xyz props for a central impulse
				EnemyMovement(ID,msg);};
		});
		
	   socket.on('shot',function(msg){
	  	//   console.log(msg);
		   //NewID is the ID of the player who fired the shot
		   var NewID = Object.keys(msg)[0];
		   createBullet(msg[NewID])
		});
/*******************************/


//GLOBAL Graphics variables
var camera, scene, renderer;//primary components of displaying in three.js
var controls;
//RAYCASTER  is a project that renders a 3D world based on a 2D map
var raycaster = new THREE.Raycaster();//http://threejs.org/docs/api/core/Raycaster.html


function init() {

		initGraphics();
		initPhysics();
		initInput();
}

function initGraphics() {
 
   //http://threejs.org/docs/api/cameras/PerspectiveCamera.html 
   camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );	
  
    //mess around with these parameters to adjust camera perspective view point
    camera.position.x = camX;
	camera.position.y = camY;
    camera.position.z =  camZ;
				
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
	
	return true;
}

/*********CLIENT SIDE PHYSICS ************/
function initPhysics() {
		// Physics World configurations
		broadphase = new Ammo.btDbvtBroadphase();

		collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();

		dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );

		solver = new Ammo.btSequentialImpulseConstraintSolver();	
		softBodySolver = new Ammo.btDefaultSoftBodySolver();

		physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
	
		physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
		
		return true;
};

function initInput() {
    controls = new THREE.OrbitControls( camera );
	 controls.target.y = 2;
};


function createBoxObject(object,returnObj) {
		
		var material;//consider passing mat types to flag basic, phong, etc...
	
		var texture = null;
		
		var color = 0xffffff;//default is white
		
		if (object.hasOwnProperty('color')) {color = object.color};
		
		if (object.hasOwnProperty('texture') ){ 
				var textureFile = object.texture;
				console.log(textureFile)
			    texture = textureLoader.load(textureFile);
			 
  /*todo: PASS FLAGS FOR WRAPPING */
			   //set texture to tile the gound (don't do this if you want it to stretch to fit)			   
			//	texture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
			//	texture.repeat.set( 50, 50 );// 20x20 tiles of image
				material = new THREE.MeshBasicMaterial( { color: color, map:texture} );
			}else{
				material = new THREE.MeshBasicMaterial( { color: color} );
			}
		
		//http://threejs.org/docs/api/extras/geometries/BoxGeometry.html
		var geometry = new THREE.BoxGeometry(object.w, object.h, object.d );
	
		//http://threejs.org/docs/#Reference/Objects/Mesh
		var Cube = new THREE.Mesh(geometry, material);
		
	    Cube.position.set(object.x, object.y, object.z );
	    Cube.quaternion.set(object.Rx, object.Ry, object.Rz,object.Rw );
	
		//used to quickly find our object in our object array
	    rigidBodiesLookUp[object.id] = Cube;
		
		//add cube to graphics world
		scene.add( Cube );
			   
	    //attach any properties to the graphic object on 'userData' node of Cube object
		Cube.userData.physics = createBoxPhysicsObject(object);
		
		//object knows it's id in rigidBodiesLookUp
		Cube.userData.id = object.id;
		
		//add cube to our physics world
		physicsWorld.addRigidBody( Cube.userData.physics );
		
		
		if (returnObj) {return Cube};
}


function createBoxPhysicsObject (object){
	//console.log(object)
	//PHYSICS COMPONENT	/******************************************************************/
	var physicsShape = new Ammo.btBoxShape(new Ammo.btVector3( object.w * 0.5, object.h * 0.5, object.d * 0.5 ) );
	
	//set the collision margin, don't use zero, default is typically 0.04
	physicsShape.setMargin(0.04);
	
	var transform = new Ammo.btTransform();
	
	//"SetIdentity" really just sets a safe default value for each of the data members, usually (0,0,0) on a Vector3, and (0,0,0,1) on a quaternion.
	transform.setIdentity();
	
	//we want a custom location and orientation so we set with setOrigin and setRotation
	transform.setOrigin( new Ammo.btVector3( object.x, object.y, object.z ) );
	transform.setRotation( new Ammo.btQuaternion( object.Rx, object.Ry, object.Rz, object.Rw ) );
	
	var motionState = new Ammo.btDefaultMotionState( transform );
	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	
	physicsShape.calculateLocalInertia( object.mass, localInertia );
	
	//create our final physics body info
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( object.mass, motionState, physicsShape, localInertia );
	var physicsCube = new Ammo.btRigidBody( rbInfo );
	//console.log(physicsCube)
	
	return physicsCube;
}

function createBullet(object){
	
	var bullet = createBoxObject(object,true);
	
	//create a vector to apply shot force to our bullet
	vector3Aux1.setValue(object.Fx,object.Fy,object.Fz);

	//apply the movement force of the shot
	bullet.userData.physics.applyCentralImpulse(vector3Aux1)

	//keep the cube always active		
	bullet.userData.physics.setActivationState(1);
		
}


function ServerUpdates(){
		updateJson =  UPDATES_FROM_SERVER; 
		//if speed issues using global trie making new ones here
		//var transformAux1 = new Ammo.btTransform();
		//var vector3Aux1 = new Ammo.btVector3();
		//var quaternionAux1 = new Ammo.btQuaternion();
		
		//IDs is an array of stings which are the IDs of objects in physics sim
		//that can be matched up with their representation in our graphic objects tree rigidBodiesLookUp
		var IDs = Object.keys(updateJson);
		
		if(IDs.length < 1) return;
		
		//cycle through objects that need an update
		for(var i=0;i<IDs.length;i++){
			try{
				//get the objects ID
				var id = IDs[i]
			
				//find the object
				var object = rigidBodiesLookUp[id];
		
				//get the new position/orientation for the object
				var update = updateJson[id];
			
		  	   object.userData.physics.setActivationState(1);// ACTIVEATE
		  	   
		  	   var current = object.userData.physics.getWorldTransform();
		  	   
		  	  //update position
		  	   var pos = current.getOrigin(); 		
				vector3Aux1.setValue(update.x,update.y,update.z);
				transformAux1.setOrigin(vector3Aux1);
				
				//update orientation
				 var quat = current.getRotation();
				quaternionAux1.setValue(update.Rx,update.Ry,update.Rz,update.Rw);
				transformAux1.setRotation(quaternionAux1);
				object.userData.physics.setWorldTransform(transformAux1);
			
				//update velocity
				vector3Aux1.setValue(update.LVx,update.LVy,update.LVz);
				object.userData.physics.setLinearVelocity(vector3Aux1);
			
				vector3Aux1.setValue(update.AVx,update.AVy,update.AVz);
				object.userData.physics.setAngularVelocity(vector3Aux1);
			}
			catch(err){'failed to find object, maybe it was deleted'}
			
		};
	
};

function EnemyMovement(enemy,object){
	
	var forces = object[enemy];
	
	//create a vector to apply force
	vector3Aux1.setValue(forces.Fx,forces.Fy,forces.Fz);
	
	//apply force
	rigidBodiesLookUp[enemy].userData.physics.applyCentralImpulse(vector3Aux1);
}


function moveClose() {

	if(TopSpeed < PlayerCube.userData.physics.getLinearVelocity().length())return;
	
	 var yRot = PlayerCube.rotation._y
	 var thrustZ = movementSpeed* Math.cos(yRot);
	 var thrustX = movementSpeed* Math.sin(yRot);
				   
	 //used to determine if thrust in the x or z should be pos or neg
	 var Zquad ;
	 var QUAT = PlayerCube.quaternion._y;

	/*Blocks to determine what direction our player is facing and the correction neg/pos for applied movementForce*/			  
	if( QUAT < 0.75  || QUAT < -0.75 ){Zquad=-1}
	else {Zquad=1}
	
	thrustZ = thrustZ*Zquad
	
	vector3Aux1.setValue(-thrustX,0,thrustZ);
	PlayerCube.userData.physics.applyCentralImpulse(vector3Aux1);
	
	//SEND TO OTHER PLAYERS
	socket.emit('F',{x:-thrustX, y:0 ,z:thrustZ});
	
}

function moveLeft() {
	
	if(TopSpeed < PlayerCube.userData.physics.getLinearVelocity().length())return;
		
	var P = PlayerCube.userData.physics;
	var Pv = P.getAngularVelocity().y();
	var RF = RotationForce;
	
	if(Pv > 1){return}else{
		//boost is used to add an exponentially powerful reverse rotation so that if player can change direction more quickly
		var boost;
		if(Pv<0){
					boost = Math.abs(RF*Pv );
			}else{boost = 1};
		//Rotate
		var rot = RF + (boost*boost);
		P.applyTorque(new Ammo.btVector3(0,rot,0 ));
		socket.emit('L',rot);
		};	
};

function moveRight() {
	var P = PlayerCube.userData.physics;
	var Pv = P.getAngularVelocity().y();
	var RF = RotationForce;
	
	if(Pv < -1){return}else{
		//boost is used to add an exponentially powerful reverse rotation so that if player can change direction more quickly
		var boost;
		if(Pv>0){
					boost = Math.abs(RF*Pv );
			}else{boost = 1};
		//Rotate
		var rot = (RF + (boost*boost)) * -1;
		P.applyTorque(new Ammo.btVector3(0,rot,0 ));
		socket.emit('R',rot);
		};	
}

function moveAway() {
	 var yRot =PlayerCube.rotation._y
	 var thrustZ = movementSpeed* Math.cos(yRot);
	 var thrustX = movementSpeed* Math.sin(yRot);
				   
				   //used to determine if thrust in the x or z should be pos or neg
	var Zquad ;

	var QUAT = PlayerCube.quaternion._y;

				/*Blocks to determine what direction our player is facing and the correction neg/pos for applied movementForce*/			  
	 if( (QUAT > 0.75 && QUAT < 1.0) || (QUAT > -1  && QUAT < -0.75 )  ){Zquad=-1}
				 else {Zquad=1}
	
	thrustZ = thrustZ*Zquad;
	
	vector3Aux1.setValue(thrustX,0,thrustZ);
	PlayerCube.userData.physics.applyCentralImpulse(vector3Aux1);
	
	//SEND TO OTHER PLAYERS
	socket.emit('B',{x:thrustX,y:0 ,z:thrustZ});
	
}

function moveBrake() {
	socket.emit('S');
}

function clickShootCube() {
//	console.log('shot')
	 var pos = PlayerCube.position;
	 var yRot = PlayerCube.rotation._y
	 var thrustZ = shotFireForce* Math.cos(yRot);
	 var thrustX = shotFireForce* Math.sin(yRot);
				   
	 //used to determine if thrust in the x or z should be pos or neg
	 var Zquad ;
	 var QUAT = PlayerCube.quaternion._y;

	/*Blocks to determine what direction our player is facing and the correction neg/pos for applied movementForce*/			  
	 if( (QUAT > 0.74 && QUAT < 1.0) || (QUAT > -1  && QUAT < -0.74 )  ){Zquad=-1}
	else {Zquad=1}
	
	thrustZ = thrustZ*Zquad
	
	socket.emit('fire',{uid:UNIQUE_ID, x:pos.x,y:pos.y,z:pos.z,Fx:thrustX, Fy:0 ,Fz:thrustZ});
	
	//ONLY server approves instance of a shot right now.  see handler for 'shot' inbound msg from server.
}

function thrustON(){
	/*FIX THIS!!! pwr should be a prop of player*/
	var pwr = 5;
	
	vector3Aux1.setValue(0,pwr,0);
	PlayerCube.userData.physics.applyCentralImpulse(vector3Aux1);	
	
	//SEND TO OTHER PLAYERS
	socket.emit('thrust',pwr);
	
};

function GAMEPADpolling() {
	   if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.up.bit ){moveAway()};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.down.bit){moveClose()};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.left.bit){moveLeft()};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.right.bit){moveRight()};  
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.center.bit){moveBrake()};  
		if(GAMEPAD.leftGUI.bits & GAMEPAD.leftGUI.button1.bit ){thrustON()}//thrust on
}

function GAMEPAD_left_callback(){
		if(GAMEPAD.leftGUI.bits & GAMEPAD.leftGUI.button2.bit ){clickShootCube()}//shoot a cube	
}


function render() {
       renderer.render( scene, camera );//update graphics
	   
	  // run game loop again
	    requestAnimationFrame( animate );//https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    };
	
function animate() {
		  var deltaTime = clock.getDelta();
	    ServerUpdates();
		  updatePhysics( deltaTime );
		  controls.update( deltaTime );//view control
		  //check what buttons are pressed
	      GAMEPADpolling();   
  
	/*CHASE CAMERA EFFECT*/
		var relativeCameraOffset = new THREE.Vector3(camX,camY,camZ);//camera chase distance
		var cameraOffset = relativeCameraOffset.applyMatrix4( PlayerCube.matrixWorld );
		camera.position.x = cameraOffset.x;
		camera.position.y = cameraOffset.y;
		camera.position.z = cameraOffset.z;
		
		camera.lookAt( PlayerCube.position );
    };
    


function updatePhysics( deltaTime ) {


		var IDs = Object.keys(rigidBodiesLookUp);	
	
	// Step world
	physicsWorld.stepSimulation( deltaTime,10);

	//Help control user from spinning out of control
	//if(PlayerCube.userData.physics.getAngularVelocity().length() > 1){set av};

// Update graphics based on what happened with the last physics step
for ( var i = 0, objThree,objPhys; i < IDs.length; i++ ) {
	
	//get the objects ID
	var id = IDs[i]
	objThree = rigidBodiesLookUp[id];
	objPhys = objThree.userData.physics;
	
	var ms = objPhys.getMotionState();

		if ( ms ) {
			
			//get the location and orientation of our object
			ms.getWorldTransform( transformAux1 );
			var p = transformAux1.getOrigin();
			var q = transformAux1.getRotation();
		
			//update our graphic component using data from our physics component
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
		};
	};
	
	//draw all the new updates
	render();
};