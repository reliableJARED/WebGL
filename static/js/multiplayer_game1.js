//GLOBAL General variables
var connection = false;
var newPlayer = true;
var rigidBodiesLookUp = {};
var OtherPlayers = new Object;
var mouse = new THREE.Vector2();
var clock;
var UNIQUE_ID; //assigned by the server
var camX =0;var camY = 5; var camZ = -20;//Set the initial perspective for the user
var PlayerCube;


/**** Player specific vars that shouldn't be global **********/
var movementSpeed = 2;
var shotFireForce = 500;
var TopSpeed = 25;
var RotationForce = 3;
//add rate of fire, health
/**********************************************************/


var textureLoader = new THREE.TextureLoader();
var synchronizer;

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


//Input Controller
var GAMEPAD = new ABUDLR({left:{callback:GAMEPAD_left_callback}});

/************SERVER HOOKUPS*******************/
// exposes a global for our socket connection
var socket = io();

		
		socket.on('connect',function(msg){
			connection = true;
		//	console.log(msg);
			
		});
		
		socket.on('newPlayer',function(msg){
			//console.log(msg);
		   //don't build player if server is talking about you!
		   var NewID = Object.keys(msg)[0];
		   
		   //TODO: STORE NewID somewhere because it represents a players socketID
		   
			if( NewID === UNIQUE_ID){
				//do nothing because this is global alert to others about us
			}else{
				createBoxObject(msg[NewID]);
				};
			//	OtherPlayers[NewID] = createBoxObject(msg[NewID],true)}
		   });
		
		socket.on('playerID',function(msg){
			console.log(msg);
			//server assigned uniqueID
			UNIQUE_ID = msg;
			socket.emit('getMyObj','get');
		});

		socket.on('yourObj',function(msg){
		  	//console.log(msg);
			PlayerCube = rigidBodiesLookUp[msg];
			//console.log(PlayerCube)
			PlayerCube.userData.physics.setActivationState(4);//ALLWAYS ACTIVEATE
			
			//assign your player to the physics synchronizer
			synchronizer.assignPlayer(rigidBodiesLookUp[msg]);
			
			 //now that you exist, start rendering loop
			animate();	
		});		
		
		socket.on('setup', function(msg){
			console.log(msg);

			//msg is an object with an array of JSON with each root key the ID of an object
			if(newPlayer){
				var timeStamp = Object.keys(msg)[0];
			  //  console.log(Date.now()- timeStamp )
				//sync clocks
				clock = new GameClock(timeStamp);
				synchronizer.linkGameClock(clock);
			
				var worldObjects = msg[timeStamp];
				
				//msg is the array of objects
				for(var i =0; i<worldObjects.length;i++){
					
					if(worldObjects[i].shape === 'box'){
						createBoxObject(worldObjects[i]);
						}					
					};
					
				newPlayer = false;//prevent rebuild to 'setup' msg intended for new players
			};
			
		});
		

		socket.on('DefineDataStructure',function(instructions){
			//sets order of data array used to update object positions.
			//for example.  position '0' in an the array will always be an objects ID;
			//inscrutions would be an object = {id:0}.
			//this will be our key to understanding the data array in from the server during
			//the game
			synchronizer.DefineDataStructure(instructions);
		})
		

		socket.on('U', function(msg){
			//msg.data is an ArrayBuffer, you can't read/write to it without using a typedarray or dataview
			//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
			//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
		   //console.log(msg.data.byteLength)
			var dataArray = new Float32Array(msg.data);
			
			//after msg.data is loaded int to a typed array, pass to synchronizer
			synchronizer.queUpdates({time:msg.time,data:dataArray})

		});
		

		socket.on('removePlayer', function(msg){
			/*TODO: currently this is exactly like 'rmvObj', however
			at future point there may be special things about players to remove
			so it is setup to handle rmvObj and removePlayer*/
		//	console.log(msg);
		//  msg is an ID for an object
		//	delete OtherPlayers[msg];
		//	scene.remove( rigidBodiesLookUp[msg] )
		//	physicsWorld.removeRigidBody( rigidBodiesLookUp[msg].userData.physics );
			//delete rigidBodiesLookUp[msg];
		});
		
		socket.on('rmvObj', function(msg){
			//console.log(msg);
			//msg is an ID for an object
			//remove it
			scene.remove( rigidBodiesLookUp[msg] )
			physicsWorld.removeRigidBody( rigidBodiesLookUp[msg].userData.physics );
			delete rigidBodiesLookUp[msg];
		});
		
		socket.on('S',function(msg){
		//	console.log(msg)
			//check if this is local players 'T'
			var ID = Object.keys(msg)[0];
			
			if(PlayerCube.userData.id != ID){
				//msg is an ID with props 
				EnemyStopping(ID,msg);};
		});
		
	   socket.on('shot',function(msg){
	  	   //console.log(msg);
		   //NewID is the ID of the player who fired the shot
		   var NewID = Object.keys(msg)[0];
		   createBullet(msg[NewID])
		});
		
		socket.on('ACI',function(msg){
	  	   //console.log(msg);
		   var ID = Object.keys(msg)[0];
		   
		   if(PlayerCube.userData.id !== ID){
				EnemyMove('ACI',ID,msg[ID])
		  };
		});
		
		socket.on('AT',function(msg){
	  	   //console.log(msg);
		   var ID = Object.keys(msg)[0];
		   //check if this is local players move, which if it is has already been applied
		   if(PlayerCube.userData.id !== ID){
				EnemyMove('AT',ID,msg[ID])
		  };
		});
		
		socket.on('binary',function(msg){
			//msg is an ArrayBuffer
			console.log(msg)
			console.log(msg.byteLength)

			//to read/write to a buffer, create an typedarray for it
			var inboudBinary = new Float32Array(msg);
			console.log(inboudBinary)
			//use .toString(16) for the THREE numbers that will code for color
			//need to get as hex, the add an 0x to the front and pass to THREEjs
			console.log("0x",inboudBinary[0].toString(16),inboudBinary[1].toString(16),inboudBinary[2].toString(16))
			//can also try to build and arg for "rgb(r,g,b)" format
		
			
			
			//Outbound
			//now prepare a new arraybuffer to send back
			var bin = new ArrayBuffer(8);//8 byte
			var outboudBinary = new Float32Array(bin);
			outboudBinary[0] = 1.1;//first 4 bytes
			outboudBinary[1] = 2.1;//second 4 bytes
			
			//bin and outboudBinary.buffer are EXACTLY the same.  //Changing the array, will change the underlying buffer
			socket.emit('binary',outboudBinary.buffer);
			socket.emit('binary',bin);
		});
		

/*******************************/


//GLOBAL Graphics variables
var camera, scene, renderer;//primary components of displaying in three.js
var controls;
//RAYCASTER  is a project that renders a 3D world based on a 2D map
var raycaster = new THREE.Raycaster();//http://threejs.org/docs/api/core/Raycaster.html




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
//		console.log('building',object)
		var material;//consider passing mat types to flag basic, phong, etc...
	
		var texture = null;
		
		var color = 0xffffff;//default is white
		
		if (object.hasOwnProperty('color')) {color = object.color};
		
		if (object.hasOwnProperty('texture') ){ 
				var textureFile = object.texture;
			//	console.log(textureFile)
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
		
		Cube.userData.physics.setActivationState(1);// ACTIVEATEATE
		
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

	//set to always active.		
	bullet.userData.physics.setActivationState(4);
		
}


function EnemyMove(type,ID,data){
	
	var EnemyObject = rigidBodiesLookUp[ID].userData.physics;
	
	//set the object to active so that updates take effect
	EnemyObject.setActivationState(1);

	switch (type){
		case 'ACI': vector3Aux1.setValue(data.x,data.y,data.z);
				    EnemyObject.applyCentralImpulse(vector3Aux1);
		break;

		
		case 'ATI':vector3Aux1.setValue(data.x,data.y,data.z);
				   EnemyObject.applyTorqueImpulse(vector3Aux1);
		break;
		
		case 'ACF':vector3Aux1.setValue(data.x,data.y,data.z);
				  EnemyObject.applyCentralForce(vector3Aux1);
				  
		break;
		
		case 'AT':vector3Aux1.setValue(data.x,data.y,data.z);
				  EnemyObject.applyTorque(vector3Aux1);
				  
		break;
		default: console.log('error: ',type,ID,data)
	}
}


function EnemyStopping(enemy,object) {
	    //find the object for this enemy
		var EnemyObject = rigidBodiesLookUp[enemy].userData.physics;
		
		//set the object to active so that updates take effect
		EnemyObject.setActivationState(1);
	   
	   //updates to be applied
	    var forces = object[enemy]

		//slow velocity
		vector3Aux1.setValue(forces.LVx,forces.LVy,forces.LVz);
		EnemyObject.setLinearVelocity(vector3Aux1);
	
		//slow rotation
		vector3Aux1.setValue(forces.AVx,forces.AVy,forces.AVz);
		EnemyObject.setAngularVelocity(vector3Aux1)
		
};

function moveClose() {
	//check MAX Speed 
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
	
	//SEND TO SERVER you want to apply a central impulse
	socket.emit('ACI',{x:-thrustX, y:0 ,z:thrustZ});
	
}

function moveLeft() {
		
	var P = PlayerCube.userData.physics;
	var Pv = P.getAngularVelocity().y();
	var RF = RotationForce;
	
	//check MAX rotation 
	if(Pv > 1){return}
	else{
		//boost is used to add an exponentially powerful reverse rotation so that if player can change direction more quickly
		var boost;
		
		if(Pv<0){
				boost = Math.abs(RF*Pv );
			}else{boost = 1};
		
		//Rotate
		var rot = RF + (boost*boost);
		
		vector3Aux1.setValue(0,rot,0);
		P.applyTorque(vector3Aux1);
		
		//SEND TO SERVER you want to apply a torque
		socket.emit('AT',{x:0, y:rot ,z:0});
	};	
};

function moveRight() {
	
	var P = PlayerCube.userData.physics;
	var Pv = P.getAngularVelocity().y();
	var RF = RotationForce;
	
	//check MAX rotation 
	if(Pv < -1){return}
	else{
		//boost is used to add an exponentially powerful reverse rotation so that if player can change direction more quickly
		var boost;
		if(Pv>0){
					boost = Math.abs(RF*Pv );
			}else{boost = 1};
		//Rotate
		var rot = (RF + (boost*boost)) * -1;
		
		vector3Aux1.setValue(0,rot,0);
		P.applyTorque(vector3Aux1);
		
		//SEND TO SERVER you want to apply a torque
		socket.emit('AT',{x:0, y:rot ,z:0});
	};	
}

function moveAway(bit) {
	
	//This function is called from the dpad on the RIGHT gui for the gamepad
	
	//check MAX Speed 
	if(TopSpeed < PlayerCube.userData.physics.getLinearVelocity().length())return;
	
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
	
	//SEND TO SERVER you want to apply a central impulse
	socket.emit('ACI',{x:thrustX,y:0 ,z:thrustZ});
	
	//need 2 bytes to encode u,d,l,r, etc.
	//need 12 bytes for the 3 float32 (4bytes each) x,y,z data
	//total is 16 because of offset, have dead space from byte 3 to 4, could
	//encode for Right or Left controler there
	var buffer = new ArrayBuffer(16);
	
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
	//create a dataview so we can manipulate our arraybuffer
	//ONLY for the xyz, that's why there is an offset
	var vectorBinary   = new Float32Array(buffer,4);
	vectorBinary[0] = thrustX;
	vectorBinary[1] = 0;
	vectorBinary[2] = thrustZ;
	
	//only coding FIRST TWO bytes
	var buttonBit   = new Uint8Array(buffer,0,4);
	buttonBit[0] = bit;
	buttonBit[1] = 1;//represents RIGHT GAMEPAD controller
	//binary mode
	socket.emit('move',buffer);
	
}

function moveBrake() {	
		
		var player = PlayerCube.userData.physics;
		
		var Lv = player.getLinearVelocity();
	    var LVx = (Lv.x()*.65);
	    var LVy = (Lv.z()*.65);
	    var LVz = (Lv.y());//breaking doesn't work for UP/DOWN
		
		vector3Aux1.setValue(LVx,LVy,LVz);	//r
		
		//slow linear Velocity
		player.setLinearVelocity(vector3Aux1);
	
		//slow rotation
	    var Av = player.getAngularVelocity();
	 	var AVx = (Av.x());//breaking doesn't work for Z or X
		var AVy = (Av.z());//breaking doesn't work for Z or X
		var AVz = (Av.y()*.5);
		vector3Aux1.setValue(AVx,AVy,AVz);
		
		player.setAngularVelocity(vector3Aux1)
		
		socket.emit('S',{LVx:LVx, LVy:LVy, LVz:LVz, AVx:AVx, AVy:AVy,AVz:AVz})
};


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
	
	//ONLY server approves instance of a shot right now.  see handler for 'shot' inbound msg from server.
	socket.emit('fire',{uid:UNIQUE_ID, x:pos.x,y:pos.y,z:pos.z,Fx:thrustX, Fy:0 ,Fz:thrustZ});
}

function thrustON(){
	
	/*FIX THIS!!! pwr should be a prop of player*/
	var pwr = 5;
	
	vector3Aux1.setValue(0,pwr,0);
	PlayerCube.userData.physics.applyCentralImpulse(vector3Aux1);	
	
	//SEND TO SERVER you want to apply a central impulse
	socket.emit('ACI',{x:0,y:pwr ,z:0});
};

function GAMEPADpolling() {
	
	    if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.up.bit ){moveAway(GAMEPAD.rightGUI.up.bit)};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.down.bit){moveClose()};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.left.bit){moveLeft()};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.right.bit){moveRight()};  
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.center.bit){moveBrake()};  
		if(GAMEPAD.leftGUI.bits & GAMEPAD.leftGUI.button1.bit ){thrustON()}//thrust on
}

function GAMEPAD_left_callback(){
	//shoot a cube	
		if(GAMEPAD.leftGUI.bits & GAMEPAD.leftGUI.button2.bit ){clickShootCube()}
}


function render() {
       renderer.render( scene, camera );//update graphics
	   
	  // run game loop again
	    requestAnimationFrame( animate );//https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
};


	
function animate() {
		 //first sync physics with server updates if needed
		  synchronizer.sync();
		  	
        checkPlayerOrientation();// this will check if player needs to be reset because of being flipped - it's hacky tho
	
		  var deltaTime = clock.getDelta();
		
			// Step world
			physicsWorld.stepSimulation( deltaTime,10);

		  updateGraphics( deltaTime );

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
    

	
function updateGraphics( deltaTime ) {
	
	var IDs = Object.keys(rigidBodiesLookUp);	

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



function checkPlayerOrientation(){
	
	/******************** orientation check hack - could be better**********/
	
	//if player starts to rotate in z or x stop them.
	var PxRotV = PlayerCube.userData.physics.getAngularVelocity().x()//PlayerCube.userData.physics.getWorldTransform().getRotation().x();
	var PzRotV = PlayerCube.userData.physics.getAngularVelocity().z()//PlayerCube.userData.physics.getWorldTransform().getRotation().z();
	var maxRot = 0.01;

	if(PxRotV> maxRot){		
		//console.log("X: ",PxRotV)
		var PxRot = PlayerCube.userData.physics.getWorldTransform().getRotation().x();
		//get the angular velocity of the player keep y and z compoent, set x to half current
		vector3Aux1.setX( PxRotV/2 );
		vector3Aux1.setY( PlayerCube.userData.physics.getAngularVelocity().y() );
		vector3Aux1.setZ( PlayerCube.userData.physics.getAngularVelocity().z() );
		PlayerCube.userData.physics.setAngularVelocity(vector3Aux1);
	
	//check that we haven't actually rotated too far on this axis, if we have RESET
	if(PxRot>.5 || PxRot<-.5){
		playerResetFromCrash();
		}
	}

	if(PzRotV > maxRot){
		//console.log("Z: ",PzRotV)
		var PzRot = PlayerCube.userData.physics.getWorldTransform().getRotation().z();
		//get the angular velocity of the player keep y and x compoent, set z to half current
		vector3Aux1.setX( PlayerCube.userData.physics.getAngularVelocity().x() );
		vector3Aux1.setY( PlayerCube.userData.physics.getAngularVelocity().y() );
		vector3Aux1.setZ( PzRotV/2 );
		PlayerCube.userData.physics.setAngularVelocity(vector3Aux1);
	
	//check that we haven't actually rotated too far on this axis, if we have RESET
	if(PzRot>.5 || PxRot<-.5){
		playerResetFromCrash();
		}

	}

}

function playerResetFromCrash(){
	//clear forces
		PlayerCube.userData.physics.setLinearVelocity(new Ammo.btVector3(0,0,0));
		PlayerCube.userData.physics.setAngularVelocity(new Ammo.btVector3(0,0,0));
		
	    socket.emit('resetMe');
	
};

GameClock = function ( ServerTime ) {

	this.startTime = ServerTime;
	this.oldTime = ServerTime;

};


GameClock.prototype.getDelta = function () {

	var delta = 0;

	var newTime = Date.now();
	//convert from mili seconds to secons 
	delta = 0.001 * ( newTime - this.oldTime );
	this.oldTime = newTime;

	return delta;
};

GameClock.prototype.sync = function (timeStamp) {

	var delta = 0;

	var newTime = Date.now();
	//convert from mili seconds to secons 
	delta = 0.001 * ( newTime - timeStamp );
	
	return delta;
};


ServerPhysicsSync = function (physicsWorld,rigidBodiesLookUp) {

	this.pendingUpdates = false;
	this.TimeStamp = 0;
	this.deltaTime = 0;
	this.ServerUpdates = new Object();
	this.localPhysicsWorld = physicsWorld;
	this.rigidBodiesLookUp = rigidBodiesLookUp;
	this.transformAux1 = new Ammo.btTransform();
	this.vector3Aux1 = new Ammo.btVector3();
	this.quaternionAux1 = new Ammo.btQuaternion();
	this.divergenceThreshold = 1;
	this.gameClock;
	this.PlayerCube;
	this.data = new Object();
	
	//structure key of inbound data array from server so we know what index goes to what property
	this.objID = 0;//prop 1
	this.x = 1;//prop 2
	this.y = 2;//prop 3
	this.z = 3;//prop 4
	this.Rx = 4;//prop 5
	this.Ry = 5;//prop 6
	this.Rz = 6;//prop 7
	this.Rw = 7;//prop 8
	this.propsPerObject = 8; // 8 props
	this.byteBase = 4; //32bit float from Float32Array()
	this.bytesPerObject = this.byteBase * this.propsPerObject; // 8 props, 4 bytes per prop: 8x4 = 32
};

ServerPhysicsSync.prototype.DefineDataStructure = function (define){
	/************* THIS IS A CONCEPT, NOT ACTUALLY USED 10/24/16***************************/
	//build the structure key of inbound data array from server so we know what index goes to what property
	//instead of hardcoding on client, this function builds our data index to object property link
	//'define' is a JSON with properties that correspond with array position
	this.data.x = define.x;
	this.data.y = define.y;
	this.data.z = define.z;
};

ServerPhysicsSync.prototype.assignPlayer = function (PlayerCube) {
	this.PlayerCube = PlayerCube;
}
ServerPhysicsSync.prototype.linkGameClock = function (clock) {
	this.gameClock = clock;
}
ServerPhysicsSync.prototype.queUpdates = function (updates) {

	if(!this.pendingUpdates){
		this.pendingUpdates = true;
		this.ServerUpdates = updates.data;
		//console.log(this.ServerUpdates)
		this.TimeStamp  = updates.time;
	};
};

ServerPhysicsSync.prototype.sync = function () {
	
	if(this.pendingUpdates){
		//convert from mili seconds to seconds 
		this.deltaTime  = 0.001 * ( Date.now() - this.TimeStamp  );
		this.ApplyUpdates();
		return true;
	};
};

/*ServerPhysicsSync.prototype.ApplyUpdates = function (){
		 
		//What happens here is that the server updates, which are behind our current physics in game time, need to //be compared with our current state.  If the objects position falls outside of our THRESHOLD, //location,velocity,orientation are updated.  After updates we then proceed as normal in the local physics loop
		 
		//IDs is an array of stings which are the IDs of objects in physics sim
		//that can be matched up with their representation in our graphic objects tree rigidBodiesLookUp
		var IDs = Object.keys(this.ServerUpdates);
		
		if(IDs.length < 1) return;
		
		//cycle through objects that need an update
		for(var i=0;i<IDs.length;i++){
			try{
				//get the objects ID dd
				var id = IDs[i]
			
				//find the object
				var objectPhysics = this.rigidBodiesLookUp[id].userData.physics;
				
				//set the object to active so that updates take effect
				objectPhysics.setActivationState(1);
				
				//get the new position/orientation for the object
				var update = this.ServerUpdates[id];

		  	   //get the current state of our objects position/orientation
			   var objState = objectPhysics.getWorldTransform();
		  	   
			   // 	RUN A DIVERGENCE CHECK 
			   var pos = objState.getOrigin();
			   
			   if(  Math.abs(update.x - pos.x()) > this.divergenceThreshold ||
					Math.abs(update.y - pos.y()) > this.divergenceThreshold ||
					Math.abs(update.z - pos.z()) > this.divergenceThreshold ){
			   
					//console.log(Math.abs(update.x - pos.x()))
					//console.log(Math.abs(update.y - pos.y()))
					//console.log(Math.abs(update.z - pos.z()) )
					  
					//update position
					this.vector3Aux1.setValue(update.x,update.y,update.z);
					this.transformAux1.setOrigin(this.vector3Aux1);
				
					//update orientation
					var quat = objState.getRotation();
				 
					//currently ONLY APPLY ROTATION CORRECTION FOR NON PLAYER
					if(this.PlayerCube.userData.id === id){
						//sets the quaternion based on players LOCAL physics
				 		this.quaternionAux1.setValue(quat.x(),quat.y(),quat.z(),quat.w());
					}else{
						//sets the quaternion based on objects SEVER physics
						this.quaternionAux1.setValue(update.Rx,update.Ry,update.Rz,update.Rw);
					};
	
					//build update
					this.transformAux1.setRotation(this.quaternionAux1);
					//apply update
					objectPhysics.setWorldTransform(this.transformAux1);
			
				//NOT UPDATING VELOCITIES NOW
				
				// >>  update linear velocity
				//this.vector3Aux1.setValue(update.LVx,update.LVy,update.LVz);
				//object.userData.physics.setLinearVelocity(this.vector3Aux1);
				
				// >> update angular velocity
				//vector3Aux1.setValue(update.AVx,update.AVy,update.AVz);
				//object.userData.physics.setAngularVelocity(this.vector3Aux1);
							
				}
			}
			catch(err){'failed to find object, maybe it was deleted'}
			
		};
		
		//reset flag
		this.pendingUpdates = false;	
};*/


ServerPhysicsSync.prototype.ApplyUpdates = function (){
		 
		// console.log(this.ServerUpdates);
		// console.log(this.ServerUpdates.length)

		//this.ServerUpdates is a single array of float32 that contains position/orientation data of moving objects in the world

		//first determine how many objects are in the array.  do this by choping the long array
		//into segments of this.bytesPerObject lengths
		var totalObjs = Object.keys(this.ServerUpdates).length / this.propsPerObject;;
		//console.log(totalObjs)
		//cycle through objects that need an update
		for(var i=0;i<totalObjs; i+= this.propsPerObject){
			try{
				//move to the start of our object in the data array
				//var ObjIndexStart = i;
				
				//get the objects ID
				/* WARNING */
			//	console.log(this.ServerUpdates[i])
				var id = 'id' + this.ServerUpdates[i].toString();
			//	console.log(id)
				//this number to string conversion thing will bite me in the ass at some point...
				//props on an object can start with a number, but nodejs was freaking out when i did this.
				
			
				//find the object in our local physics sim
				var objectPhysics = this.rigidBodiesLookUp[id].userData.physics;
				
				//set the object to active so that updates take effect
				objectPhysics.setActivationState(1);
				

		  	   //get the current state of our objects position/orientation
			   var objState = objectPhysics.getWorldTransform();
		  	   
			   /* 	** 	RUN A DIVERGENCE CHECK ** */
			   var pos = objState.getOrigin();
				//console.log(this.ServerUpdates[i+this.x])
			   if(  Math.abs(this.ServerUpdates[i+this.x] - pos.x()) > this.divergenceThreshold ||
					Math.abs(this.ServerUpdates[i+this.y] - pos.y()) > this.divergenceThreshold ||
					Math.abs(this.ServerUpdates[i+this.z] - pos.z()) > this.divergenceThreshold ){
			   
					//console.log(Math.abs(this.ServerUpdates[i+this.x] - pos.x()))
				//	console.log(Math.abs(this.ServerUpdates[i+this.y] - pos.y()))
					//console.log(Math.abs(this.ServerUpdates[i+this.z] - pos.z()) )
					  
					//update position
					this.vector3Aux1.setValue(this.ServerUpdates[i+this.x],this.ServerUpdates[i+this.y],this.ServerUpdates[i+this.z]);
					
					this.transformAux1.setOrigin(this.vector3Aux1);
				
					//current orientation
					var quat = objState.getRotation();
				 
					/*currently ONLY APPLY ROTATION CORRECTION FOR NON PLAYER*/
					if(this.PlayerCube.userData.id === id){
						//sets the quaternion based on players LOCAL physics
				 		this.quaternionAux1.setValue(quat.x(),quat.y(),quat.z(),quat.w());
					}else{
						//sets the quaternion based on objects SEVER physics
						this.quaternionAux1.setValue(this.ServerUpdates[i+this.Rx],this.ServerUpdates[i+this.Ry],this.ServerUpdates[i+this.Rz],this.ServerUpdates[i+this.Rw]);
					};
	
					//build update
					this.transformAux1.setRotation(this.quaternionAux1);
					//apply update
					objectPhysics.setWorldTransform(this.transformAux1);
		
				}
			}
			catch(err){'failed to find object, maybe it was deleted'}
			
		};
		
		//reset flag
		this.pendingUpdates = false;	
};

//MAIN
init();// start world building

function init() {

		initGraphics();
		initPhysics();
		initInput();
		//create the synchronizer to merge local and server side physics
		synchronizer = new ServerPhysicsSync(physicsWorld,rigidBodiesLookUp);
		//the DefineDataStructure method isn't actually used as of 10/24/16.  Arg passed
		//is supposed to come from the server
		synchronizer.DefineDataStructure({x:0,y:1,z:2});
		
		console.log(synchronizer);
}