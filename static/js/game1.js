"use strict";

/* Good Examples:
http://stemkoski.github.io/Three.js/index.html
*/

/* FIX THIS! Global scope is out of control
*/
//GLOBAL General variables
var mouse = new THREE.Vector2();
var clock = new THREE.Clock();
var container; //DOM location
var mouseIntersects;
var ground;
var PlayerCube;
var SELECTED;
var HIGHLIGHT;
var SpaceBarDown;
var keysDown =[];
var ForceThreshold = 1;//used in collision consequence functions
var rigidBodyPtrIndex ={}; //used to assocaite a ammo.js assigned ptr property with an object in our world
var gui_buttons =[];
var GUIarea;//used to hold the x,y,w,h of our GUI
var thisIsATouchDevice = CheckIfTouchDevice();
var  GAMEPADbits = null;
var INITIAL_HEADING; //used to get the rotation of the view camera at game start.  sometimes it shifts off of 0,0,0 due to looking at PlayerCubeube

//GLOBAL Graphics variables
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 ); 
var scene = new THREE.Scene(); 
var renderer = new THREE.WebGLRenderer();
var raycaster = new THREE.Raycaster();
var controls;
var gui_canvas,gui_ctx;
var camX =0;var camY = 5; var camZ = -20;//Set the initial perspective for the user

//GLOBAL Physics variables
var physicsWorld;
var gravityConstant = -9.8;
var rigidBodies = [];
var OnScreenBodies =[];
var rigidBodies_uuid_lookup ={};
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver,softBodySolver;
var transformAux1 = new Ammo.btTransform();
var PHYSICS_ON = true;
var MovementForce = 1;//sets the movement force from dpad


var GAMEPAD = new ABUDLR({left:{callback:GAMEPADhook}});


//check if user is on a touch device	
function CheckIfTouchDevice() {
	if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) { 
    return true;
	}else { 
		alert('Press 1 for thrust, 2 to shoot, use arrows to move')
	return false;}
}		

//check if javascript promises are supported
if(typeof Promise === "undefined" && Promise.toString().indexOf("[native code]") === -1){

	alert('Your browser does not support technology that this site uses.  Strange things may happen... be aware!  Change to the latest version of Firefox, Chrome, Safari or Edge on Windows 10 to avoid the strange behavior.')
}

//MAIN
init();// start world building


function init() {
	
		
		container = document.getElementById( 'container' );
		
		initGraphics();
		initPhysics();
		createObjects();
		initInput();
		populate();
		
		/*HTML for instructions and display force of inpacts*/
		var info = document.createElement( 'div' );
				info.style.position = 'absolute';
				info.style.visibility = 'hidden';
				info.style.top = '40px';
				info.style.width = '100%';
				info.setAttribute('id','info');
				info.style.textAlign = 'center';
				info.innerHTML = 'You control the Gray cube.<br><b>Press + Hold</b> a cube to drag and move it around<br>Use <b>A button</b> for THRUST<br>Use <b>B button</b> to make more cubes<br>Use dpad on right to \'drive\' your cube around <br>Impacts over 50 newtons will break YOUR cube!<br>Over 20 newtons breaks OTHER cubes';
		
		var instructions = document.createElement('div');
				instructions.style.position = 'absolute';
				instructions.style.width = '100%';
				instructions.style.top = '10px';
				instructions.style.textAlign = 'center';
				instructions.setAttribute('id','toggleInfoinfo');
				instructions.innerHTML = '<b>PRESS</b> to toggle instructions';
				
				/*assign click event*/
				instructions.onclick = function toggleInfo(){
					var info = document.getElementById('info');
					if(info.style.visibility ==='hidden'){
						info.style.visibility = 'visible';
					}else{
						info.style.visibility = 'hidden';
					}
				}; 
				
		var force =  document.createElement( 'div' );
				force.style.position = 'absolute';
				
				force.setAttribute('id','force');
				force.style.width = '100%';
				force.style.textAlign = 'center';
		
				
		//add our new info to the page
		instructions.appendChild( force );
		instructions.appendChild( info );	
		container.appendChild( instructions );	
		
		
		var bd1 = dispatcher.getManifoldByIndexInternal(0).getBody0();
		var bd2 = dispatcher.getManifoldByIndexInternal(0).getBody1();

		var example = dispatcher.getManifoldByIndexInternal(0).getBody0().getWorldTransform()

		
		//For touchscreen, prevent the whole window from moving when manipulating onscreen objects.  
		//doing this will make it feel more like a native 'app'
		window.addEventListener('touchmove',function(e){e.preventDefault();},false);
		
		//add event listeners to our document.  the same method is used regardless of touch or not.  However 
		//cannot just rely on mouse events to convert to touch events.  the click functions correct for this.
		//see them for details
		if(thisIsATouchDevice){	
		/*do nothing for now*/
		}else {
		document.addEventListener( 'keyup', onDocumentMouseMove, false ); 
		document.addEventListener( 'keydown', onDocumentMouseDown, false );
		};
	
	animate(); //start rendering loop
	INITIAL_HEADING = camera.rotation._y;
}



//****** THRUST 
 function thrustON(){	


					//console.log(ground.userData.physics.getCollisionFlags());
					PlayerCube.userData.physics.applyCentralImpulse(new Ammo.btVector3( 0,PlayerCube.userData.upwardThrust,0 ));	
					PlayerCube.userData.flame.visible = true;
					PlayerCube.userData.physics.setActivationState(4);//ALWAYS ACTIVE
				
			
		};
function thrustOFF(){
	PlayerCube.userData.flame.visible = false;
	PlayerCube.userData.physics.setActivationState(1);//NORMAL ACTIVE STATE
				}	

//****** MOVE AWAY 
function moveAway (){	
//Check that we are not over top speed.
if(PlayerCube.userData.TopSpeed < PlayerCube.userData.physics.getLinearVelocity().length())return;

			//http://stackoverflow.com/questions/1677059/bullet-physics-apply-torque-impulse-in-bodys-local-space
			
			//http://bulletphysics.org/Bullet/phpBB3/viewtopic.php?f=9&t=2366
			//console.log(PlayerCube.userData.physics.getWorldTransform().getBasis())
			//var rotation = new THREE.Euler().setFromQuaternion( PlayerCube.quaternion, 'ZYX' );
			//PlayerCube.userData.physics.getWorldTransform().getBasis().setEulerZYX(rotation);
				   
				   /*TODO:
				   http://zonalandeducation.com/mstm/physics/mechanics/forces/forceComponents/forceComponents.html
				   make this work.
				   close but the conversion isn't right.  treate MovementForce as radius for a circle
				   then to get the Z and X component to our thrust direction do something like: cos(theta) sin(theta) for x and z times MovementForce*/
				   
				   /*to get the direction that playercube is facing we need to compare evaluate y quaternion for the player.  Quads 3 and 4 are neg quaternion, 1 and 2 are positive*/
	
				   var thrustZ = PlayerCube.userData.MovementForce * Math.cos(PlayerCube.rotation._y);
				   var thrustX = PlayerCube.userData.MovementForce * Math.sin(PlayerCube.rotation._y);
				   
				   //used to determine if thrust in the x or z should be pos or neg
				  
				   var Zquad ;

				   var QUAT = PlayerCube.quaternion._y;
				
				/*Blocks to determine what direction our player is facing and the correction neg/pos for applied movementForce*/			  
			     if( (QUAT > 0.75 && QUAT < 1.0) || (QUAT > -1  && QUAT < -0.75 )  ){Zquad=-1}
				 else {Zquad=1}
				 
				 
				   PlayerCube.userData.physics.applyCentralImpulse(new Ammo.btVector3( thrustX,0,thrustZ*Zquad ));
				  
				   
				/*  
					var x =camera.rotation._x; //units in radians
					var z =camera.rotation._z; //units in radians
					var zrot = z/-Math.PI;//rotation radians are PI or -PI not 2PI
					var xrot;
					 if(zrot >> 31){xrot=1+zrot}//zrot is negative
					 else{xrot=1-zrot}//zrot is positive
					console.log(xrot)
					console.log(zrot)
	
					PlayerCube.userData.physics.applyCentralImpulse(new Ammo.btVector3( MovementForce*xrot,0,MovementForce*zrot ));
				*/
				//	var rt = PlayerCube.userData.physics.getWorldTransform().getRotation();
				//	var fr = new Ammo.btVector3(0,0,MovementForce);
					//applyImpulse takes a sec optional arg relative position which is a quaternion
				//	PlayerCube.userData.physics.applyImpulse(fr,rt);
				
					
	/*
	var relativeForce = new Ammo.btVector3(0,10,0);
var  boxTrans = new Ammo.btTransform();
PlayerCube.userData.physics.getWroldTransform(boxTrans);
var correctedForce = (boxTrans * relativeForce) - boxTrans.getOrigin();
bPlayerCube.userData.physics.applyCentralForce(correctedForce);
*/
					PlayerCube.userData.physics.setActivationState(4);//ALWAYS ACTIVE
					//	console.log(camera.position.x,camera.position.y,camera.position.z )
				//	console.log(PlayerCube.quaternion.y);
		//			
		//			console.log(PlayerCube.rotation);
	//			var relativeThrustOffset = new THREE.Vector3(0,0,MovementForce);
		//		var o = relativeThrustOffset.applyMatrix4( PlayerCube.matrixWorld );
		//PlayerCube.userData.physics.applyCentralImpulse(new Ammo.btVector3( o.x,o.y,o.z ));	
		};
	
//****** MOVE Close 
function moveClose(){	
//Check we are not over top speed.
if(PlayerCube.userData.TopSpeed < PlayerCube.userData.physics.getLinearVelocity().length())return;
					var thrustZ = PlayerCube.userData.MovementForce * Math.cos(PlayerCube.rotation._y);
				   var thrustX = PlayerCube.userData.MovementForce * Math.sin(PlayerCube.rotation._y);
				   
				   //used to determine if thrust in the x or z should be pos or neg
				   var Zquad ;

				   var QUAT = PlayerCube.quaternion._y;
				
				/*Blocks to determine what direction our player is facing and the correction neg/pos for applied movementForce*/
				/*if(QUAT > 0 && QUAT <= 0.5 ){Xquad =1; Zquad=-1;console.log('Q1')}
				else if(QUAT > 0.5 && QUAT < 1 ){Xquad =1; Zquad=1;console.log('Q2')}
				else if(QUAT > -1  && QUAT < -0.5 ){Xquad =1; Zquad=1;console.log('Q3')}
				else {Xquad =1; Zquad=-1;console.log('Q4')}*/
				
				/*Blocks to determine what direction our player is facing and the correction neg/pos for applied movementForce*/			  
			     if( (QUAT < 0.75 && QUAT > 1.0) || (QUAT < -1  && QUAT > -0.75 )  ){Zquad=1}
				 else {Zquad=-1}
				 
				 
				   PlayerCube.userData.physics.applyCentralImpulse(new Ammo.btVector3( -thrustX,0,thrustZ*Zquad ))	
					PlayerCube.userData.physics.setActivationState(4);//ALWAYS ACTIVE
				
		};	
	

	

//****** MOVE LEFT 
 function moveLeft(){	
				//PlayerCube.userData.physics.applyCentralImpulse(new Ammo.btVector3( MovementForce,0,2 ));	
				//PlayerCube.userData.physics.setAngularVelocity(new Ammo.btVector3( 0,MovementForce,0 )) ;	
				PlayerCube.userData.physics.applyTorque(new Ammo.btVector3(0,PlayerCube.userData.RotationForce,0 ));
					PlayerCube.userData.physics.setActivationState(4);//ALWAYS ACTIVE
		};		
	
//****** MOVE RIGHT 
function moveRight (){	
		//			PlayerCube.userData.physics.applyCentralImpulse(new Ammo.btVector3( -1*MovementForce,0,2 ));	
				//PlayerCube.userData.physics.setAngularVelocity(new Ammo.btVector3( 0,-1*MovementForce,0 )) ;	
				//http://www.bulletphysics.org/Bullet/phpBB3/viewtopic.php?f=9&t=3296
				
		//		transformAux1.setOrigin(new Ammo.btVector3(PlayerCube.userData.physics.getWorldTransform().getOrigin().x(),PlayerCube.userData.physics.getWorldTransform().getOrigin().y(),PlayerCube.userData.physics.getWorldTransform().getOrigin().z()))
				
			//	transformAux1.setRotation(new Ammo.btVector3(PlayerCube.userData.physics.getWorldTransform().getRotation().x(),PlayerCube.userData.physics.getWorldTransform().getRotation().y() +1,PlayerCube.userData.physics.getWorldTransform().getRotation().z(),PlayerCube.userData.physics.getWorldTransform().getRotation().w()))
				
			//	PlayerCube.userData.physics.setWorldTransform(transformAux1);
		
				//set the selected object back to default orientation
				//makes it easier if you're building things, otherwise when an object is rotated after a collision
				//there is no way to line it back up again.
		//		transformAux1.setRotation(0,0,0,1);
				
				PlayerCube.userData.physics.applyTorque(new Ammo.btVector3(0, -1*PlayerCube.userData.RotationForce,0 ));
				PlayerCube.userData.physics.setActivationState(4);//ALWAYS ACTIVE
		};

function clearMovementForces() {
	//http://stackoverflow.com/questions/3015017/bullet-physics-engine-how-to-freeze-an-object
	//ATTENTION! this might prevent all movement forever.  have to test, but that's what it seems like.  Also check if you can use decimal to restrict movement on an axis to a range.  example 0 -> 0.5
	PlayerCube.userData.physics.setLinearFactor(0,0,0);
	PlayerCube.userData.physics.setAngularFactor(0,0,0)
}			
	
//****** CREATE CUBE		
function CreateCube (pos){

		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg
		
		//our random coordinates need to be range negative to positive
		//first create random 0-200 number, then subtract 100. this will 
		//create random -100 to 100

		var randX =  Math.floor(Math.random() * 200);
		var randZ =  Math.floor(Math.random() * 200) - 100;
		
		var pos = pos || new THREE.Vector3(randX -1100,10,randZ);	
		var quat = new THREE.Quaternion();
		
		//assign random color when creating the new mesh
		var material = new THREE.MeshPhongMaterial( { color: Math.random() * 0xffffff } );

		var cube = REALbox(x,y,z,mass,pos,quat,material);
		
		/*DO NOT ENABLE cast shadow for these blocks system performance will be terrible!
		It's ok if they receive though.*/
	//	cube.castShadow = true;
		cube.receiveShadow = true;
		
		//weaker then our main object
		cube.userData.breakApart = new breakApart(20);
				
		//add our cube to our array, scene and physics world.
		rigidBodies.push(cube);
		scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physics );	
}

//****** SHOOT A LITTLE CUBE		
function clickShootCube (){

		var x=.5;//meters
		var y=.5;//meters
		var z=.5;//meters
		var mass = 10;//kg
		
	
		var pos =  PlayerCube.position;
		pos.addVectors(pos,new THREE.Vector3(0,2,0));
		
		var quat = new THREE.Quaternion();
		
		//assign random color when creating the new mesh
		var material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff } );

		var cube = REALbox(x,y,z,mass,pos,quat,material);
		
		/*DO NOT ENABLE cast shadow for these blocks system performance will be terrible!
		It's ok if they receive though.*/
	//	cube.castShadow = true;
		cube.receiveShadow = true;
		
		//weaker then our main object
		cube.userData.breakApart = new breakApart(20);
				
		//add our cube to our array, scene and physics world.
		rigidBodies.push(cube);
		scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physics );	
		/*
		TODO:
		add the current speed/direction of PlayerCube to the shot
		correct for orientation
		*/
		
				   var thrustZ = PlayerCube.userData.shotFireForce * Math.cos(PlayerCube.rotation._y);
				   var thrustX = PlayerCube.userData.shotFireForce * Math.sin(PlayerCube.rotation._y);
				   
				   //used to determine if thrust in the z should be pos or neg
				   var Zquad ;

				   var QUAT = PlayerCube.quaternion._y;
				//   console.log(QUAT);
				
				/*determine what direction our player is facing and the correction neg/pos for applied fire force*/
				 if( (QUAT > 0.75 && QUAT < 1.0) || (QUAT > -1  && QUAT < -0.75 )  ){Zquad=-1}
				 else {Zquad=1}
				 
				  cube.userData.physics.applyCentralImpulse(new Ammo.btVector3( thrustX,0,thrustZ*Zquad ));
		
		
		//destroy the shot in 5000 miliseconds (5 seconds)
		destructionTimer(cube,5000);	
		
}


function initGraphics() {

	//Set the initial perspective for the user
    camera.position.x = camX;
	 camera.position.y = camY;
    camera.position.z =  camZ;

	 renderer.setClearColor( 0xf0f0f0 ); 
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight ); 
	
	
	//fog to make far objects appear smoothly, not just pop up when they are within render distance
	scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025 );
	//ENABLE shadows in our world now renderer.
	/***************WARNING!!!
	
	shadows use a lot of resources. One quick way to improve performace is turning them off!*/
     renderer.shadowMap.enabled = true;
	 
	 
	var ambientLight = new THREE.AmbientLight( 0x404040 );
    
	scene.add( ambientLight );
	
	//NEW LIGHT - directional.  Used for spotlight effect
       var light = new THREE.DirectionalLight( 0xffffff, 2 );
           light.position.set( 0, 100, -50);
		   //enable our shadows
			light.castShadow = true;
				
	//SETUP how our light source casts shadows:	
		 var d = 50;
		 
				//For proper resolution, is important that your shadow camera is positioned tight around your scene. You do that by setting the following:
			    light.shadowCameraLeft = -d;
			    light.shadowCameraRight = d;
			    light.shadowCameraTop = d;
			    light.shadowCameraBottom = -d; 
				/* You don't NEED to use the ShadowCameraLeft,Rigth,Top, Bottom settings if you're also using the fustum approach with 	shadowCameraNear and shadowCameraFar below.*/
	
				//think of the light source as a camera.  Like the camera we have two planes, or Frustum's which bisect the pyramid of light coming from our source.  shadowCameraNear is the fustum closest to the light, shadowCameraFar is the fustum furthest from the light source.  Anything outside of this will not receive shadow from our light source.
				
			    light.shadowCameraNear = 2;
			    light.shadowCameraFar = 500;
				
				//adjust shadowMapWidth and shadowMapHeight to change resolution of the shadow.  use powers of 2 (if you don't it will still work, but just use ^2)
			    light.shadowMapWidth = 1024;
			    light.shadowMapHeight = 1024;
				
				//shadowDarkness should tune the opacity 0 - 1, but doesn't see to have an affect
			    light.shadowDarkness = .5;
				
				
    scene.add( light );
    //add an 'id' attribute to our 3D canvas
	renderer.domElement.setAttribute('id','primary');

    container.appendChild( renderer.domElement );
	
}


function initInput() {
    controls = new THREE.OrbitControls( camera );
	//https://github.com/mrdoob/three.js/blob/302c693b27663d4d280b156b5ebe4ed38cd062e4/examples/js/controls/OrbitControls.js
	//controls.target sets what the camera rotates/moves around
	controls.target.y = 2;

};

function initPhysics() {
		// Physics World configurations
		broadphase = new Ammo.btDbvtBroadphase();

		collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();

		dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );

		solver = new Ammo.btSequentialImpulseConstraintSolver();	
		softBodySolver = new Ammo.btDefaultSoftBodySolver();

		physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
	
		physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
};
/* makes and returns a red cone graphic*/
function redCone() {
		var geometry = new THREE.ConeGeometry( 1,3, 32 );
		var material = new THREE.MeshBasicMaterial( {color: "rgb(90%, 5%, 5%)"} );
		var cone = new THREE.Mesh( geometry, material );
		
		/*add our flame to the scene.  note that just adding parent object won't work. also don't add it to the physics world.  it's for decoration only!*/
		
		scene.add( cone );
		return cone;
}

/*describes how an object will break, and at what level of force (newtons)*/
function breakApart(force){
	this.force = force;
};

breakApart.prototype.now = function(obj,impactForce){
	
	//get some object properties from our broken object
	var depth = obj.geometry.parameters.depth;//x length 
	var height = obj.geometry.parameters.height;//y length 
	var width = obj.geometry.parameters.width;//z length 
	var mass = obj.userData.mass;
	var rubbleMass = mass/(depth+height+width);
	var force = impactForce/(depth+height+width);
	var material = obj.material;

	//we want our rubble in the same position as our object that is breaking
	var pos = obj.position;// used to hold our position THREE.Vector3()
	var quat = obj.quaternion;//original objects orientation THREE.Quaternion()
	
	//destroy all parts of the object and remove from world
	destroyObj(obj);
	
	//now make rubble in the objects place
	//The rubble will be propotionally sized cubes based on the original objects size
	//such that the original object breaks into 8 smaller pieces if it's a cube.
	var frac = 2;
	//three nested loops will create the rubble
	//inner loop lays blocks in a row
	//mid loop starts a new column
	//outer loop starts new layer
	for (var h=0;h<frac;h++) {
				
		for (var w=0;w<frac;w++) {
		
			for(var d =0; d<frac;d++){
			
				//create a rubble object,
				var rubble = REALbox(depth/frac,height/frac,width/frac,rubbleMass,pos,quat,material);
				
				//apply force to our piece of rubble		
				// in random directions
				var rd_X = Math.random() < 0.5 ? -1 : 1 ;
				var rd_Y = Math.random() < 0.5 ? -1 : 1 ;
				var rd_Z = Math.random() < 0.5 ? -1 : 1 ;
				
				//apply impact force to our rubble
				rubble.userData.physics.applyCentralImpulse(new Ammo.btVector3( force*rd_X,force*rd_Y,force*rd_Z ));	
				
				//set to ACTIVE so the pieces bounce around
				//rubble.userData.physics.setActivationState(1);
				
				//add rubble to world
				physicsWorld.addRigidBody(rubble.userData.physics);
				rigidBodies.push(rubble);
				scene.add(rubble);

				//Add a random 1-5 sec delay b4 new rubble object is removed from world
				var delay =  Math.random() * 4000 + 1000;
		
				//add self destruct to the rubble so it will be removed from world after delay time
				destructionTimer(rubble,delay);	
				//add to pos, used in the placement for our next rubble block being created	
				pos.addVectors(pos,new THREE.Vector3(depth/frac,0,0));//+X dimention
			}
			//reset our X axis
			pos.subVectors(pos,new THREE.Vector3(frac,0,0));
			//Start our new row, create each new block Z over
			pos.addVectors(pos,new THREE.Vector3(0,0,width/frac));//+Z dimention
		}
		//reset our Z axis
		pos.subVectors(pos,new THREE.Vector3(0,0,frac));
		//start the new grid up one level
		pos.addVectors(pos,new THREE.Vector3(0,height/frac,0));//+Y	dimention
	}
	
	
	
}

function createPlayerCube(){
	//properties used to make objects
		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg
		var pos = new THREE.Vector3(-1000,10,0);	
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our PlayerCube
		//NOTE! pass vertexColors because each cube face will be random color
		var material = new THREE.MeshPhongMaterial( { color: "rgb(34%, 34%, 33%)", vertexColors: THREE.FaceColors} );
		PlayerCube = REALbox(x,y,z,mass,pos,quat,material,true);//bool at the end means random color for each cube face
		PlayerCube.castShadow = true;
		PlayerCube.receiveShadow = true;
		console.log(PlayerCube);//inspect to see whats availible
		console.log(PlayerCube.userData.physics.getUserPointer());
		console.log(PlayerCube.userData.physics.getUserIndex());
		
		/*create a new graphic object inside our PlayerCube.  we will
		make the 'flame' graphic for our rocket PlayerCube!*/
		PlayerCube.userData.flame = redCone();
		
		//set some props for our 'flame' we don't wan't it always on. Only when the PlayerCube is 'blasting off'
		PlayerCube.userData.flame.visible = false;//three.js visibility prop for an object
		
		//set force (newtons) that breaks our object
		PlayerCube.userData.breakApart = new breakApart(50);
		
		//set upward thrust for player
		PlayerCube.userData.upwardThrust = 5;
		
		//torque force for turning
		PlayerCube.userData.RotationForce = 2;
		
		//forward reverse movement force
		PlayerCube.userData.MovementForce = 2;
		
		//used to limit constant accelleration
		PlayerCube.userData.TopSpeed = 25;
		
		//force that bullets are shot at
		PlayerCube.userData.shotFireForce = 500;
		
		//IMPORTANT!
		//hardcode prevention of Z and X rotation. Can only rotate around Y
	//	PlayerCube.userData.physics.setAngularFactor(new Ammo.btVector3(0,1,0));
	//	PlayerCube.userData.physics.setLinearFactor(new Ammo.btVector3(1,1,1));
				
		//add our PlayerCube to our array, scene and physics world.
		rigidBodies.push(PlayerCube);
		scene.add( PlayerCube );
		physicsWorld.addRigidBody( PlayerCube.userData.physics );
		
		
		
		
		/*
		Future:
		to add other geometry to our cube:
		// Create a Point2Point constraint to keep two objects bound together
		// position_a is the point of constraint relative to object_a's position
		// position_b is the point of constraint relative to object_b's position
		var constraint = new Ammo.btPoint2PointConstraint(
			object_a,
			object_b,
			new Ammo.btVector3( position_a.x, position_a.y, position_a.z ),
			new Ammo.btVector3( position_b.x, position_b.y, position_b.z )
			);
		physicsWorld.addConstraint( constraint );
		*/
}
/*
WORK IN PROGRESS createCubeTower()
*/
/*
function createCubeTower(height,width,depth){
	//defaults if no args passed
	var height = height || 5;
	var width = width || 4;
	var depth = depth || 4;
	
	//create random location for our tower, near other blocks
	var randX =  Math.floor(Math.random() * 200);
	var randZ =  Math.floor(Math.random() * 200) - 100;
	var pos = new THREE.Vector3(randX -1100,10,randZ);
		
	
	//three nested loops will create the tower
	//inner loop lays blocks in a row
	//mid loop starts a new column
	//outer loop starts next new layer up 
	for (var h=0;h<height;h++) {
				
		for (var w=0;w<width;w++) {
		
			for(var d =0; d<depth;d++){
			
				//create a tower cube object,
				var brick = CreateCube(pos);

				//add brick to world
				physicsWorld.addRigidBody(brick.userData.physics);
				rigidBodies.push(brick);
				scene.add(brick);
				
				var d = brick.geometry.parameters.depth;//x length 
				var h = brick.geometry.parameters.height;//y length 
				var w = brick.geometry.parameters.width;//z length 


				//add to pos, used in the placement for our next block being created	
				pos.addVectors(pos,new THREE.Vector3(depth,0,0));//+X dimention
			}
			//reset our X axis
			pos.subVectors(pos,new THREE.Vector3(height,0,0));
			//Start our new row, create each new block Z over
			pos.addVectors(pos,new THREE.Vector3(0,0,width));//+Z dimention
		}
		//reset our Z axis
		pos.subVectors(pos,new THREE.Vector3(0,0,height));
		//start the new grid up one level
		pos.addVectors(pos,new THREE.Vector3(0,height,0));//+Y	dimention
	}
	
	
}*/


function createObjects() {
		
		//properties used to make objects
		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg  - currently not used here
		var pos = new THREE.Vector3(0,-0.5,0);	
		var quat = new THREE.Quaternion();
		
		//create our player
		createPlayerCube()

		//GROUND
		//create object for our ground, but define the materialmeshs and color.  Don't use the default inside of createGraphicPhysicsBox()
		//IMPORTANT! we are passing a mass = 0 for the ground.  This makes it so the ground is not able to move in our physics simulator but other objects can interact with it.
		ground = new REALbox(5000,1,5000,0,pos,quat,new THREE.MeshPhongMaterial( { color: "rgb(33%, 33%, 34%)"}) );
		ground.receiveShadow = true;
		//add the ground to our array, scene and physics world.
		rigidBodies.push(ground);
		scene.add( ground );
		physicsWorld.addRigidBody( ground.userData.physics );
		
		/*********WALLS****/
		//RIGHT wall
		pos = new THREE.Vector3(-2500,25,0);	
		var RightWall = new REALbox(1,50,5000,0,pos,quat,new THREE.MeshBasicMaterial( { color: 0xF3F5C4}) );//( { color: 0xF3F5C4}) );//light yellow color
		RightWall.receiveShadow = true;
		rigidBodies.push(RightWall);
		scene.add( RightWall );
		physicsWorld.addRigidBody( RightWall.userData.physics );
		
		//LEFT wall
		pos = new THREE.Vector3(2500,25,0);	
		var LeftWall = new REALbox(1,50,5000,0,pos,quat,new THREE.MeshBasicMaterial({ color: 0xC4F5EA}) );// ({ color: 0xC4F5EA}) );//light teal color
		rigidBodies.push(LeftWall);
		scene.add( LeftWall );
		physicsWorld.addRigidBody( LeftWall.userData.physics );
		
		//REAR wall
		pos = new THREE.Vector3(0,25,2500);	
		var RearWall = new REALbox(5000,50,1,0,pos,quat,new THREE.MeshBasicMaterial( { color: 0xC4F5CD}) );//( { color: 0xC4F5CD}) );//light green color
		rigidBodies.push(RearWall);
		scene.add( RearWall );
		physicsWorld.addRigidBody( RearWall.userData.physics );
		
		//FRONT wall
		pos = new THREE.Vector3(0,25,-2500);	
		var FrontWall = new REALbox(5000,50,1,0,pos,quat,new THREE.MeshBasicMaterial( { color: 0xF5C4EE}) );//light purple color
		rigidBodies.push(FrontWall);
		scene.add( FrontWall );
		physicsWorld.addRigidBody( FrontWall.userData.physics );
		
		
		//create our helper image of where user is moving the cube
		var HIGHLIGHTGeo = new THREE.BoxGeometry( 2, 2, 2 );
		var HIGHLIGHTMaterial = new THREE.MeshBasicMaterial( { color: "rgb(0%,100%,0%)", opacity: 0.5, transparent: true } );

		HIGHLIGHT = new THREE.Mesh( HIGHLIGHTGeo, HIGHLIGHTMaterial );
		HIGHLIGHT.visible = false;
		
		//note we don't want physics for this obj, it's just a helper so don't need to have it in physics world or rigidbodies.
		scene.add( HIGHLIGHT );
		
	
}



/* REALbox()
input: dimentions of a box, mass, position in world, orientation in world and material type.
output: box object which has a graphic component found and a physics component found in obj.userData.physicsBody
*/
function REALbox (sx, sy, sz, mass, pos, quat, material,rndFaceColors){
	var rndFaceColors = rndFaceColors || false;
	//GRAPHIC COMPONENT
	/***************************************************************/
	var geometry = new THREE.BoxGeometry(sx, sy, sz );
	
	//color each cube face different
	if(rndFaceColors){
		for ( var i = 0; i < geometry.faces.length; i ++ ) {
		geometry.faces[ i ].color.setHex( Math.random() * 0xffffff );
}
	}
	material = material || new THREE.MeshBasicMaterial( { color: "rgb(34%, 34%, 33%)"} );
	
	var box = new THREE.Mesh(geometry, material);
	
	//PHYSICS COMPONENT	/******************************************************************/
	var physicsShape = new Ammo.btBoxShape(new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	
	//set the collision margin, don't use zero, default is typically 0.04
	physicsShape.setMargin(0.04);
	
	var transform = new Ammo.btTransform();
	
	//"SetIdentity" really just sets a safe default value for each of the data members, usually (0,0,0) on a Vector3, and (0,0,0,1) on a quaternion.
	transform.setIdentity();
	
	//we want a custom location and orientation so we set with setOrigin and setRotation
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	
	var motionState = new Ammo.btDefaultMotionState( transform );
	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	
	physicsShape.calculateLocalInertia( mass, localInertia );
	
	//create our final physics body info
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	
	var ammoCube = new Ammo.btRigidBody( rbInfo );
	/* About prop 'userData'
	this is from three.js  It expects any added props or functions to be here.  so just follow the format it will make life easy.  You can add things where ever you want... this is JS after all.  but things will break down.  for example when you mouse over an object using raycaster.intersectObjects(rigidBodies) an array of Three js objects is returned.  if you want to access properties of the object your mouse is intersecting it's much easier if they are located in 'userData'. That is the whole reason this prop was setup*/
	box.userData.physics = ammoCube;
	box.userData.mass = mass;
	
	//used in determine if object should break from an impact force
	box.userData.HitHardEnoughToBreak = false;
	
	//used to record magnitude of impact force that broke the object
	box.userData.CollisionImpactForce = 0;
	
	//used as a lookup for objects using the ammo.js assigned ptr
	var uniquePtrID = box.userData.physics.ptr;
	rigidBodyPtrIndex[uniquePtrID.toString()]=box;
	
	return box;
}


function breakCube(obj,impactForce){
	obj.userData.breakApart.now(obj,ground,impactForce);
}

	/*
	AS OF 8/12/16
	NO SUPPORT FOR Promise on IE
	*/

//Promise used in the delayed destruction of objects
function destructionTimer(obj,delay) {
	//create promise
    var p1 = new Promise(
    // promise constructor takes one argument, a callback with two parameters, resolve and reject.
        function(resolve, reject) {
        	//create a timer with time = delay
            window.setTimeout( function() {
				//when time is up resolve with the return obj            	
            	resolve(obj);}, delay);
           /*I'm not using a reject condition. but typically a promise would be built with:
           function (resolve,reject) {
           	if (*all good*) {resolve()} else {reject(reason)}*/
        }
    );
    /*
    "then" takes two arguments, a callback for a success case, and another for the failure case. Both are optional.
    Setup as promise.then(*do something*).catch(*do something*) where then() is success, catch() is fail*/
    p1.then(  
        function(obj) {	
        //when promise resolves obj to be destroyed is passed	
			destroyObj(obj);
        });/*
    .catch(
       //reason would have been passed from reject()
        function(reason) {
            console.log(reason);
        });*/
}

function destroyObj(obj){
	//check for any attached mesh and remove.  For example the 'red cone' graphic
	//for the rocket flame.
	var keys = Object.keys(obj.userData);
	for(var i=0; i<keys.length;i++){
		//all THREE (graphic) components to an object will be .type == 'Mesh'
		// other random properties don't matter and don't need to be
		//removed
		if (obj.userData[keys[i]].type  === 'Mesh'){
			scene.remove( obj.userData[keys[i]] );
		}
	}
	//remove object from the visual world
	scene.remove( obj );
	//remove object from the physical world
	physicsWorld.removeRigidBody( obj.userData.physics );
	//remove from our rigidbodies holder
	for(var i=0;i < rigidBodies.length;i++){
		if(obj.uuid === rigidBodies[i].uuid ){
			rigidBodies.splice(i,1);
		}
		
	}
	
}


function onDocumentMouseDown(event){

	//deal with touch vs. mouse input event.  right now just uses the first finger touch
	event = (thisIsATouchDevice ? event.touches[0] : event);
	
				
				
			var plane = new THREE.Plane();
			var intersection = new THREE.Vector3();
		
		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
		
			raycaster.setFromCamera( mouse, camera );
			var intersects = raycaster.intersectObjects( rigidBodies );
		
			//check that we are intersecting with an object and that it's not a STATIC object like the ground which can't move
			
			if (intersects.length >0 && intersects[0].object.userData.physics.getCollisionFlags() != 1) {

				//pause our physics sim
				PHYSICS_ON = false;
				
				controls.enabled = false;

				SELECTED = intersects[0];
				/* FIVE Activation States:
				http://bulletphysics.org/Bullet/BulletFull/btCollisionObject_8h.html
				/* IF rigidBody doesn't move it's activation state changed so that it CAN"T move unless hit by object that is active.*/
				//http://bulletphysics.org/Bullet/phpBB3/viewtopic.php?t=9024
				//http://www.bulletphysics.org/Bullet/phpBB3/viewtopic.php?f=9&t=4991&view=previous
				
				SELECTED.object.userData.physics.setActivationState(4);//ALWAYS ACTIVE
				
			}
				
};

function onDocumentMouseMove(event){

	//deal with touch vs. mouse input event.  right now just uses the first finger touch
	event = (thisIsATouchDevice ? event.touches[0] : event);

	
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
	
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects( rigidBodies );

	if (intersects.length >0) {
		
		mouseIntersects = intersects[ 0 ];
		
		//make sure the object isn't static, like the ground or walls
		if (mouseIntersects.object.userData.physics.getCollisionFlags() != 1){
			container.style.cursor = 'pointer';}
		else{
			container.style.cursor = 'auto';
			}
		
		//if we have selected our cube to move
		if(SELECTED != null){
		
			//docs on mesh object position vectors
			//http://threejs.org/docs/index.html?q=mesh#Reference/Math/Vector3
			
			HIGHLIGHT.visible = true;
			/*
			TODO:
			the HIGHLIGHT helper is not lining up right with the world.  Where the actual block is
			placed is right but not HIGHLIGH
			*/
			//set the position of the highlight object.  use .add() to add the face of the ground or other objects to the position.
			//this way our highlight will be ontop of what the mouse is pointing at, not inside it.
			HIGHLIGHT.position.copy( mouseIntersects.point ).add( mouseIntersects.face.normal );
			SELECTED.object.userData.physics.setActivationState(4);//ALWAYS ACTIVE
		}else{controls.enabled = true;}
	}
}
function onDocumentMouseUp(event){
	//resume our physics sim
	PHYSICS_ON = true;

	//turn off our helper icon
	HIGHLIGHT.visible = false;
	
	//reset to normal cursor
	container.style.cursor = 'auto';
	
	//turn the view controls back on now that mouse isn't needed for placement
	controls.enabled = true;
	
	//if the mouseUp is from placement of our block and now from controlling the view
	if (SELECTED != null) {
		//Return to default activation state.  Which means obj will stay active for about 2 seconds then fall asleep unless acted upon by another moving object or force.
		SELECTED.object.userData.physics.setActivationState(1);// NORMAL ACTIVE
		
		//recycle our btTransform() object "transformAux1"
		//we need a btTransform object to creat new points for our blocks position in the world
		transformAux1.setOrigin(new Ammo.btVector3( mouseIntersects.point.x, mouseIntersects.point.y, mouseIntersects.point.z));
		
		//set the selected object back to default orientation
		//makes it easier if you're building things, otherwise when an object is rotated after a collision
		//there is no way to line it back up again.
		transformAux1.setRotation(0,0,0,1);
		
		/*you can access the blocks location in the world with getWorldTransform, but we want to update it's location so we use setWorldTransform. pass a btTransform() "transformAux1" object to our objects setWorldTransform method to change where it is in the world.  Note we just set our btTransform() above*/
		SELECTED.object.userData.physics.setWorldTransform(transformAux1);
				
		}
		
	SELECTED = null;
		
	return;	
};

/*************************** MAIN LOOP **************************************************/
function animate() {
	 update();//inside of update render() is called.  inside of render requestanimationframe(animate) is called
		 
    };

/************************************************************************************/

//callback function for the A and B button on gamepad
function GAMEPADhook(bits){
		
		if(!thisIsATouchDevice){
			//shut off three.js view controls
			//they will be enabled again on key up
			//only need this for NON touch devices
			controls.enabled = false;
			}

		//check for specific buttons down on gamepad
		/*
		Different types of buttons.  THRUST for example stays one while a button is down.
		to do that the MAIN game loop in render() checks the GAMEPADbits. if the button bound to the thrust
	   is down, then it will keep calling that function every loop of the game.  A 'mirror' function thrustOFF
	   is called in the GAMEPADhook() which listens to gamepad state.
	   other buttons like Making a new cube are just called once, so they are activated in the button listener
	   ONLY, not the game loop.  using these concepts will allow desired behavior for button-function linking. 
	
		*/
		if(GAMEPAD.leftGUI.bits ^ GAMEPAD.leftGUI.button1.bit){thrustOFF()}//Shut off the thrust, thrust is turned on in gameloop
		if(GAMEPAD.leftGUI.bits & GAMEPAD.leftGUI.button2.bit ){clickShootCube()}//create a cube
	  }

function render() {
       renderer.render( scene, camera );
       requestAnimationFrame( animate );
      };
      
       
function update() {
	   var deltaTime = clock.getDelta();
	
	   controls.update( deltaTime );
	   
	  //pause the physics sim if we are moving things around
	  if(PHYSICS_ON){
			updatePhysics( deltaTime );
	  }
	   raycaster.setFromCamera( mouse, camera);
	   

	 	if(GAMEPAD.leftGUI.bits & GAMEPAD.leftGUI.button1.bit){thrustON(),console.log('thrust')};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.up.bit ){moveAway()};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.down.bit){moveClose()};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.left.bit){moveLeft()};
		if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.right.bit){moveRight()};  
	//	if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.center.bit){clearMovementForces()};  
		
		/*CHASE CAMERA EFFECT*/
		var relativeCameraOffset = new THREE.Vector3(camX,camY,camZ);//camera chase distance
		var cameraOffset = relativeCameraOffset.applyMatrix4( PlayerCube.matrixWorld );
		camera.position.x = cameraOffset.x;
		camera.position.y = cameraOffset.y;
		camera.position.z = cameraOffset.z;
		
		camera.lookAt( PlayerCube.position );
		
		/* USE THIS ONLY to move with cube, but not rotate with cube
		camera.position.x = PlayerCube.position.x+camX;
		camera.position.y = PlayerCube.position.y+camY;
		camera.position.z = PlayerCube.position.z+camZ;
		camera.lookAt( PlayerCube.position );*/
		
		 render();
 };
   
function updatePhysics( deltaTime ) {

// Step world
physicsWorld.stepSimulation( deltaTime,10);

//count of object pairs in collision
var collisionPairs = dispatcher.getNumManifolds();

for(var i=0;i<collisionPairs;i++){
	//for each collision pair, check if the impact force of the two objects exceeds our ForceThreshold (global var)
	//this will eliminate small impacts from being evaluated, light resting on the group and gravity is acting on object
	//round the force, don't need float
	var impactForce = Math.floor(dispatcher.getManifoldByIndexInternal(i).getContactPoint().getAppliedImpulse());

	//check if force is over our threshhold
	if( impactForce> ForceThreshold){
		//display impacts over 15 newtons
		if(impactForce > 15){
			document.getElementById('force').innerHTML = '<b>Impact Force: </b>'+impactForce+' newtons';
			}
		
		//Check if the collision force exceeds our objects breakApart force
		//need to use .toString() because we are usin ptr, which is type int, as a property to look up in the object rigidBodyPtrIndex
		
		//Object 1
		var Obj1_ptrID = dispatcher.getManifoldByIndexInternal(i).getBody0().ptr.toString();
		try{
			if(impactForce > rigidBodyPtrIndex[Obj1_ptrID].userData.breakApart.force){
				//flag the object to be broken if the force was hard enough
				rigidBodyPtrIndex[Obj1_ptrID].userData.HitHardEnoughToBreak = true;
				rigidBodyPtrIndex[Obj1_ptrID].userData.CollisionImpactForce = impactForce;
				rigidBodyPtrIndex[Obj1_ptrID].userData.physics.setActivationState(1);//set to active
			}
		}catch(err){continue}
		
		//Object 2
		var Obj2_ptrID = dispatcher.getManifoldByIndexInternal(i).getBody1().ptr.toString();
		try{
			if(impactForce > rigidBodyPtrIndex[Obj2_ptrID].userData.breakApart.force){
				//flag the object to be broken if the force was hard enough
				rigidBodyPtrIndex[Obj2_ptrID].userData.HitHardEnoughToBreak = true;
				rigidBodyPtrIndex[Obj2_ptrID].userData.CollisionImpactForce = impactForce;
				rigidBodyPtrIndex[Obj2_ptrID].userData.physics.setActivationState(1);//set to active
			}
		}catch(err){continue}
	}
}


// Update graphics based on what happened with the last physics step
for ( var i = 0, objThree,objPhys; i < rigidBodies.length; i++ ) {
	
	objThree = rigidBodies[ i ];
	objPhys = rigidBodies[ i ].userData.physics;
	
	var ms = objPhys.getMotionState();
	var active = objPhys.isActive();
	
	
	//dispatcher.getNumManifolds() will return a 0 indexed count of rigid body collision pairs. you can then use dispatcher.getManifoldByIndexInternal(indexNumber) to get that specific pair, then use dispatcher.getManifoldByIndexInternal(0).getBody0() or .getBody1() to get the two objects in collision.  Every rigidbody has a ptr property that can be used as unique ID.  Note that touching the ground puts you in a state of collision for dispatcher. use in combination with isActive() to remove bodies not currently acive (like a cube just sitting on ground).  you can then get the applied force on an object with dispatcher.getManifoldByIndexInternal(x).getContactPoint().getAppliedImpulse() where 'x' is the objects index number.
	
//	http://bulletphysics.org/Bullet/phpBB3/viewtopic.php?t=10528
//https://github.com/bulletphysics/bullet3/blob/master/examples/FractureDemo/btFractureDynamicsWorld.cpp#L466
	
		if ( ms ) {
			
			//get the location and orientation of our object
			ms.getWorldTransform( transformAux1 );
			var p = transformAux1.getOrigin();
			var q = transformAux1.getRotation();
		
			//update our graphic component using data from our physics component
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
			
			//now evalute if object can break
			if (objThree.userData.hasOwnProperty('breakApart')){
				
				if (objThree.userData.hasOwnProperty('flame')){
					//use -1 on the pos.y() because we want flame below our cube
					objThree.userData.flame.position.set( p.x(), p.y()-1, p.z() );
					}

				//check if the object was in a collision large enough to break it
				if(objThree.userData.HitHardEnoughToBreak){
					
					document.getElementById('force').innerHTML = '<b>Impact Force: </b>'+objThree.userData.CollisionImpactForce+' newtons';
					
					//if we are destoying the player make them again.  unlimited lives at this point
					if(PlayerCube.uuid === objThree.uuid){createPlayerCube();}
					/****
					FIX This
					breakApart shouldn't need the object to pass itself to its own function
					It should only pass the force
					or
					breakApart should be a regular function not an object method
					*****/
					objThree.userData.breakApart.now(objThree,impactForce);
					
					
					
				}
			
			}

		
		};
	};
		
};





	/*
	AS OF 8/12/16
	NO SUPPORT FOR Promise on IE
	*/
//Promise used when a button on the GUI has a delay between each press

function buttonHoldLoopDelay(guiButton,i){
	//create promise
    var p1 = new Promise(
        function(resolve, reject) {
        	//create a timer with time = guiButton.refresh 
			//https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout
            window.setTimeout( function() {
				//when time is up return out button object to our p1.then function     	
            	resolve(guiButton);}, guiButton.refresh );
        }
    );
    
    p1.then(  
        function(guiButton) {	
			//when promise resolves check if user is still clicking this button,
			//if they are set it to active again. gui_buttons is GLOBAL
			var anyButtonsActive;
			for(var x=0;x<gui_buttons.length;x++){
				if(gui_buttons[x].isActive){
					//check if any button is active.
					anyButtonsActive = true;
				}
			}
			//if no buttons are active, but the GUI is still active that means the user is holding down our button
			if(!anyButtonsActive && GUIarea.isActive){
				guiButton.isActive = true;
			}else{
				guiButton.isActive = false;
			}
        });
}

function populate() {
//create a bunch of random cubes
	for (var g=0; g<100;g++) {
		CreateCube ();
	}
}
//Random stuff
console.log( PlayerCube.userData.physics.getWorldTransform().getRotation().y());	
console.log( PlayerCube.userData.physics.getWorldTransform().getOrigin());	
console.log( PlayerCube.matrixWorld);		
console.log(physicsWorld);
console.log(physicsWorld.getWorldInfo());