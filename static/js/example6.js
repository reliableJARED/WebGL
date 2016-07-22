"use strict";
//GLOBAL General variables
var mouse = new THREE.Vector2();
var clock = new THREE.Clock();
var container; //DOM location
var mouseIntersects;
var ground;
var SELECTED;
var HIGHLIGHT;
var SpaceBarDown;

//GLOBAL Graphics variables
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 ); 
var scene = new THREE.Scene(); 
var renderer = new THREE.WebGLRenderer();
var raycaster = new THREE.Raycaster();
var controls;

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


//MAIN
init();// start world building
animate(); //start rendering loop

function init() {
	
		container = document.getElementById( 'container' );
		
		initGraphics();
		initPhysics();
		createObjects();
		initInput();
		
		
		var info = document.createElement( 'div' );
				info.style.position = 'absolute';
				info.style.top = '10px';
				info.style.width = '100%';
				info.style.textAlign = 'center';
				info.innerHTML = '<b>Click + Hold</b> to Drag and move cube<br>Press <b>Spacebar</b> for thrust<br><br>If your impact is larger than 5000 newtons your cube will break!'  ;
		var force =  document.createElement( 'div' );
				force.setAttribute('id','force');
				force.style.position = 'absolute';
				force.style.top = '80px';
				force.style.width = '100%';
				force.style.textAlign = 'center';
		var makeCubeButton = document.createElement('button');
				makeCubeButton.setAttribute('id','makeCube');
			//	makeCubeButton.style.position = 'absolute';
				makeCubeButton.innerHTML = 'Make Cube';
				/*assign click event*/
				makeCubeButton.onclick = clickCreateCube; 
		info.appendChild( makeCubeButton );	
		container.appendChild( info );	
		container.appendChild( force );	
	//	container.appendChild( makeCubeButton );	
		
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		
		document.addEventListener( 'keydown', onDocumentKeyDown, false );
		document.addEventListener( 'keyup', onDocumentKeyUp, false );
		
		//document.getElementById('makeCube').onclick = clickCreateCube;
		
}

function initGraphics() {

    camera.position.x = -20;
	camera.position.y = 0;
    camera.position.z =  -20;
					
	renderer.setClearColor( 0xf0f0f0 ); 
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight ); 
	
	var ambientLight = new THREE.AmbientLight( 0x404040 );
    
	scene.add( ambientLight );
    				
    container.appendChild( renderer.domElement );
	
}


function initInput() {
    controls = new THREE.OrbitControls( camera );
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
/*
input: two objects and a force.  the first is the object that is breaking, the second is the object which caused object 1 to break due to collision impact.  impactForce is in Newtons, so it's a large number
action: will remove object 1 from world and replace with many new smaller objects.  the smaller objects will automatically be removed from the world after a random amount of time.  purpose is to create a rubble effect then clean up.
output: none
*/
breakApart.prototype.now = function(obj,obj2,impactForce){
	
	
	//take our broken object out of physics sim
	physicsWorld.removeRigidBody( obj.userData.physics );
	
	//get some object properties from our broketn object
	var depth = obj.geometry.parameters.depth;//x length
	var height = obj.geometry.parameters.height;//y length
	var width = obj.geometry.parameters.width;//z length
	var mass = obj.userData.mass;
	
	//convert impact force from newtons to a delta velocity
	//f = m*a , we know f and m so we rearrange
//	var accelleration = impactForce/mass;
	//we need a velocity tho, not accelleration
	//a = dV/dt, we know dt is always 0.0166t (60hz is default for bullet simulation speed, aka 60fps so 1/60 = dt), since we know a and dt, rearrange
//	var dV = accelleration * 0.01667;
	
	//rewrite the whole thing:
	var dV = (impactForce/mass) *0.01667;
	var forcePool = Math.floor(dV/3);//don't need to carry floating point
	//we'll now create three 'pools' of force fore each direction
	var dV_x = forcePool;
	var dV_y = forcePool;
	var dV_z = forcePool;
	
	
	//we want our rubble in the same position as our object that is breaking
	var pos = obj.position.add( obj2.position );//THREE.Vector3()
	console.log(pos);
	var quat = obj.quaternion;//THREE.Quaternion()
	
	var moveOver = new THREE.Vector3(0,0,0);//used for positioning rubble pieces	
	
	//used to apply proportional movement to the rubble
	var fx = obj.userData.physics.getLinearVelocity().x();
	var fy = obj.userData.physics.getLinearVelocity().y();
	var fz = obj.userData.physics.getLinearVelocity().z();


	for (var g=0;g<height;g++) {
				
	for (var t=0;t<width;t++) {
		
	for(var q =0; q<depth;q++){
		
		//create a rubble object, use the same material as our object that is breaking
		var rubble = REALbox(1,1,1,1,pos,quat,obj.material);
	
	//	pos = rubble.position//.copy( rubble ).add( obj2.position ).add(moveOver);
		pos.add(moveOver);
		
		//distribute the impact force to all of the rubble.  then remove the force applied to the piece of rubble from the total force 'pool' by subtracting from dV_'axis' pool.
		var fxfraction =  Math.random() * dV_x;
		dV_x =- fxfraction;
		var fyfraction =  Math.random() * dV_y;
		dV_y =- fyfraction;
		var fzfraction =  Math.random() * dV_z;
		dV_z =-fzfraction;
		rubble.userData.physics.applyCentralImpulse(new Ammo.btVector3( fxfraction,fyfraction,fzfraction ));	

		physicsWorld.addRigidBody(rubble.userData.physics);
		rigidBodies.push(rubble);
		scene.add(rubble);

		var delay =  Math.random() * 4000 + 1000;//random 1-5 sec delay b4 new rubble object is removed from world
		
		//add self destruct
		destructionTimer(rubble,delay);
		
			moveOver.add(new THREE.Vector3(1,0,0));	
			
			
	}
		moveOver.add(new THREE.Vector3(0,0,1));
		moveOver.sub(new THREE.Vector3(1,0,0));
		
	}
	moveOver =  new THREE.Vector3(0,1,0);
//	moveOver.add(new THREE.Vector3(0,1,0));	
//	moveOver.sub(new THREE.Vector3(1,0,1));
	console.log(pos);
	}
	
	scene.remove( obj );
	/*REMOVE THE CONE!!
	or any other added objects.  need robust way to do this could do Object.userData.keys(obj).  could check if prop is mesh, then remove from scene.
	*/
	
	var keys = Object.keys(obj.userData);
	
	for(var i=0; i<keys.length;i++){
		if (obj.userData[keys[i]].type  === 'Mesh'){
			scene.remove( obj.userData[keys[i]] );
		}
	}
	
	for(var i=0;i < rigidBodies.length;i++){
			
		if(obj.uuid === rigidBodies[i].uuid ){
			rigidBodies.splice(i,1);
		}
		
	}
	
	
	
}

function createObjects() {
		
		
		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg
		var pos = new THREE.Vector3(0,10,0);	
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our cube
		var cube = REALbox(x,y,z,mass,pos,quat);
		
		console.log(cube);//inspect to see whats availible
		
		/*create a new graphic object inside our cube.  we will
		make the 'flame' graphic for our rocket cube!*/
		cube.userData.flame = redCone();
		
		//set some props for our 'flame' we don't wan't it always on. Only when the cube is 'blasting off'
		cube.userData.flame.visible = false;//three.js visibility prop for an object
		//used in to determine force
		cube.userData.prevLinearVelocity = 0;
		//set force (newtons) that breaks our object
		cube.userData.breakApart = new breakApart(5000);
				
		//add our cube to our array, scene and physics world.
		rigidBodies.push(cube);
		scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physics );
		
		//recycle pos and use for the ground's location
		pos.set( 0, - 0.5, 0 );
		//create object for our ground, but define the materialmeshs and color.  Don't use the default inside of createGraphicPhysicsBox()
		//IMPORTANT! we are passing a mass = 0 for the ground.  This makes it so the ground is not able to move in our physics simulator but other objects can interact with it.
		ground = new REALbox(20,1,20,0,pos,quat,new THREE.MeshBasicMaterial( { color: "rgb(0%, 50%, 50%)"}) );
		
		//add the ground to our array, scene and physics world.
		rigidBodies.push(ground);
		scene.add( ground );
		physicsWorld.addRigidBody( ground.userData.physics );
		
		
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
function REALbox (sx, sy, sz, mass, pos, quat, material){
	//GRAPHIC COMPONENT
	/***************************************************************/
	var geometry = new THREE.BoxGeometry(sx, sy, sz );
	
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
	return box;
}


function breakCube(obj,impactForce){
	
	obj.userData.breakApart.now(obj,ground,impactForce);
	
}

function destructionTimer(obj,delay) {
    var p1 = new Promise(
        function(resolve, reject) {
            window.setTimeout( function() {resolve(obj);}, delay);
        }
    );
    p1.then(  
        function(obj) {		
			destroyObj(obj);
            console.log('destroyed'+obj);
        })
    .catch(
       
        function(reason) {
            console.log(reason);
        });
}

function destroyObj(obj){
	scene.remove( obj );
	physicsWorld.removeRigidBody( obj.userData.physics );
	
	for(var i=0;i < rigidBodies.length;i++){
			
		if(obj.uuid === rigidBodies[i].uuid ){
			rigidBodies.splice(i,1);
		}
		
	}
	
}




function onDocumentMouseDown(event){

			event.preventDefault();
			var plane = new THREE.Plane();
			var intersection = new THREE.Vector3();
			

			raycaster.setFromCamera( mouse, camera );
			var intersects = raycaster.intersectObjects( rigidBodies );

			if (intersects.length >0) {
				
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
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
	
	var intersects = raycaster.intersectObjects( rigidBodies );

	if (intersects.length >0) {
		
		mouseIntersects = intersects[ 0 ];
		
		if (mouseIntersects.object != ground){
			container.style.cursor = 'pointer';}
		else{
			container.style.cursor = 'auto';
			}
		
		//we have selected our cube to move
		if(SELECTED != null){
			
			HIGHLIGHT.visible = true;
			//set the position of the highlight object.  use .add() to add the face of the ground or other objects to the position.
			//this way our highlight will be ontop of what the mouse is pointing at, not inside it.
			HIGHLIGHT.position.copy( intersects[0].point ).add( intersects[0].face.normal );
		}
	}
}
function onDocumentMouseUp(){
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

		//recycle our btTransform() object "transformAux1"
		//we need a btTransform object to creat new points for our block
		transformAux1.setOrigin(new Ammo.btVector3( mouseIntersects.point.x, mouseIntersects.point.y, mouseIntersects.point.z));
		
		/*you can access the blocks location in the world with getWorldTransform, but we want to update it's location so we use setWorldTransform. pass a btTransform() object to our objects setWorldTransform method to change where it is in the world*/
		SELECTED.object.userData.physics.setWorldTransform(transformAux1);
		
		//Return to default activation state.  Which means obj will stay active for about 2 seconds then fall asleep unless acted upon by another moving object or force.
		SELECTED.object.userData.physics.setActivationState(1);
				
		}
		
	SELECTED = null;
		
	return;	
};


function onDocumentKeyDown(event){
	
	//spacebar is down
	if (event.keyCode === 32){
		SpaceBarDown = true;
		//NOTE: this is a bad way to do things.  I have hard coded the fact that our cube is in position 0 our rigidbodies array. but I'm doing it just for an example.  You would probably want to stick with the concept of 'selecting' an object.  then if spacebar is down and selected.hasOwnProperty('flame') is true apply a forece.  You'd have to change the code used here for 'selected' though because it releases on mouseup.  instead release on mousedown if something if selected != null.
		rigidBodies[0].userData.physics.applyCentralImpulse(new Ammo.btVector3( 0,5,0 ));	
		
		rigidBodies[0].userData.flame.visible = true;
		
		rigidBodies[0].userData.physics.setActivationState(4);//ALWAYS ACTIVE
	}
}

function onDocumentKeyUp(event){
	
	if (event.keyCode === 32){
	SpaceBarDown = false;
	
	//turn off the jets!
	rigidBodies[0].userData.physics.applyCentralImpulse(new Ammo.btVector3( 0, 0, 0 ));	
	
	//Hide our flame
	rigidBodies[0].userData.flame.visible = false;
	
	//RETURN TO NORMAL STATE
	rigidBodies[0].userData.physics.setActivationState(1);
	}
}

function animate() {
        render();
		requestAnimationFrame( animate );
    };


function render() {
	   var deltaTime = clock.getDelta();

       renderer.render( scene, camera );
	   controls.update( deltaTime );
	   
	  //pause the physics sim if we are moving things around
	  if(PHYSICS_ON){
			updatePhysics( deltaTime );
	  }
	   raycaster.setFromCamera( mouse, camera);
	 //  var intersects = raycaster.intersectObjects( scene.children );			   
	   
       };
	   

function updatePhysics( deltaTime ) {

//get the current state B4 step	
var prevY = rigidBodies[ 0 ].userData.physics.getLinearVelocity().y();

// Step world
physicsWorld.stepSimulation( deltaTime,10);

// Update graphics after step
for ( var i = 0, objThree,objPhys; i < rigidBodies.length; i++ ) {
	
	objThree = rigidBodies[ i ];
	objPhys = rigidBodies[ i ].userData.physics;

	var ms = objPhys.getMotionState();
		if ( ms ) {
			//get the location and orientation of our object
			ms.getWorldTransform( transformAux1 );
			var p = transformAux1.getOrigin();
			var q = transformAux1.getRotation();
			
			//get the current linear velocity Y direction 
			var prevY = objThree.userData.physics.getLinearVelocity().y();
			
			//update our graphic component using data from our physics component
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
			
			if (objThree.userData.hasOwnProperty('breakApart')){
			if (objThree.userData.hasOwnProperty('flame')){
				//use -1 on the pos.y() because we want flame below our cube
				objThree.userData.flame.position.set( p.x(), p.y()-1, p.z() );
			}
				/*determine our change in linearVelocity in Y direction. Force = mass *(delta Velocity/ delta time).  We can then use Force for things like damage to our object. 
				for delta time bullet runs at 60 steps per sec (regardless of frame rate, they are not connected).  So we know that delta time is always 0.01667
				*/
				//for now we are just working with Y direction (up/down)
				var deltaV_y = Math.abs(prevY- objThree.userData.prevLinearVelocity);
				
				//round the force with Math.floor or you could use the slower Math.round()
				var force_y = Math.floor(objThree.userData.mass * (deltaV_y/.01667));
				
				//large velocity change
				if( deltaV_y > 20){
					console.log("ouch");
				}
				
				//large force
				if(force_y > 500){
					console.log('force ='+force_y);
					document.getElementById('force').innerHTML = '<b>Impact Force: </b>'+force_y+' newtons';
					
					if(force_y > objThree.userData.breakApart.force){
						breakCube(objThree,force_y);
					}
				}
			
			}
			
		//set previous linear velocity prop used on next compare
		objThree.userData.prevLinearVelocity = prevY ;
		};
	};
		
};



function clickCreateCube(event){
		event.preventDefault();
		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg
		var pos = new THREE.Vector3(0,1,0);	
		var quat = new THREE.Quaternion();
		var material = new THREE.MeshBasicMaterial( {color: "rgb(50%, 25%, 25%)"} );

		var cube = REALbox(x,y,z,mass,pos,quat,material);
		
		//weaker then our main object
		cube.userData.breakApart = new breakApart(2000);
		
		//holder of previous motion state used when determining if object has changed speeds
		cube.userData.prevLinearVelocity = 0;
				
		//add our cube to our array, scene and physics world.
		rigidBodies.push(cube);
		scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physics );
	
	};
	
