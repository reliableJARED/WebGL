"use strict";
//GLOBAL General variables
var mouse = new THREE.Vector2();
var clock = new THREE.Clock();
var container; //DOM location
var mouseIntersects;
var ground;
var SELECTED;
var HIGHLIGHT;

//GLOBAL Graphics variables
var GLOBAL ={
camera:new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 )	, 
scene:new THREE.Scene(), 
renderer:new THREE.WebGLRenderer(),
raycaster: new THREE.Raycaster()
}
var controls;

//GLOBAL Physics variables
var physicsWorld;
var gravityConstant = -9.8;
var rigidBodies = [];
var rigidBodies_uuid_lookup ={};
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver,softBodySolver;
var transformAux1 = new Ammo.btTransform();
var Physics_on = true;

//MAIN
init();// start world building
animate(); //start rendering loop

function init() {
		container = document.getElementById( 'container' );
		var info = document.createElement( 'div' );
				info.style.position = 'absolute';
				info.style.top = '10px';
				info.style.width = '100%';
				info.style.textAlign = 'center';
				info.innerHTML = '<b>HOLD:</b> spacebar for thrust<br>Click and Drag to move';
				container.appendChild( info );	
		initGraphics();
		initPhysics();
		createObjects();
		initInput();
		
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		document.addEventListener( 'keydown', onDocumentKeyDown, false );
		document.addEventListener( 'keyup', onDocumentKeyUp, false );


}

function initGraphics() {

 //  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );	
    GLOBAL.camera.position.x = -20;
	GLOBAL.camera.position.y = 0;
    GLOBAL.camera.position.z =  -20;
				
	//scene = new THREE.Scene();
	
	//renderer = new THREE.WebGLRenderer();
	GLOBAL.renderer.setClearColor( 0xf0f0f0 ); 
    GLOBAL.renderer.setPixelRatio( window.devicePixelRatio );
    GLOBAL.renderer.setSize( window.innerWidth, window.innerHeight ); 
	var ambientLight = new THREE.AmbientLight( 0x404040 );
    GLOBAL.scene.add( ambientLight );
    				
    container.appendChild( GLOBAL.renderer.domElement );
	
}
function redCone() {
		var geometry = new THREE.ConeGeometry( 1,2, 32 );
		var material = new THREE.MeshBasicMaterial( {color: "rgb(90%, 5%, 5%)"} );
		var cone = new THREE.Mesh( geometry, material );
		return cone;
}
function createObjects() {
		
		var pos = new THREE.Vector3(0,20,0);	
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our cube
		var cube = createGrapicPhysicBox(2,2,2,5,pos,quat);
		/* FIVE Activation States:
				http://bulletphysics.org/Bullet/BulletFull/btCollisionObject_8h.html
		*/
		cube.userData.physicsBody.setActivationState(4);//ALWAYS ACTIVE

		pos.set( 0, - 0.5, 0 );
		//create object for our ground, but define the materialmeshs and color
		ground = createGrapicPhysicBox(20,1,20,0,pos,quat,new THREE.MeshBasicMaterial( { color: "rgb(0%, 50%, 50%)"}) );
		
		console.log(cube);
		cube.flame = redCone();
		cube.flame.visible =false;
		cube.flame.on = false
		
		rigidBodies.push(cube);
		GLOBAL.scene.add( cube );
		GLOBAL.scene.add( cube.flame );
		
		physicsWorld.addRigidBody( cube.userData.physicsBody );
		
		rigidBodies.push(ground);
		GLOBAL.scene.add( ground );
		physicsWorld.addRigidBody( ground.userData.physicsBody );
		
		
		//create our helper image of where user is moving the cube
		var HIGHLIGHTGeo = new THREE.BoxGeometry( 2, 2, 2 );
		var HIGHLIGHTMaterial = new THREE.MeshBasicMaterial( { color: "rgb(0%,100%,0%)", opacity: 0.5, transparent: true } );

		HIGHLIGHT = new THREE.Mesh( HIGHLIGHTGeo, HIGHLIGHTMaterial );
		HIGHLIGHT.visible = false;
		GLOBAL.scene.add( HIGHLIGHT );

}

function createGrapicPhysicBox (sx, sy, sz, mass, pos, quat, material){
	//GRAPHIC COMPONENT
	/***************************************************************/
	var geometry = new THREE.BoxGeometry(sx, sy, sz );
	
	material = material || new THREE.MeshBasicMaterial( { color: "rgb(34%, 34%, 33%)"} );
	
	var Cube = new THREE.Mesh(geometry, material);
	
	//PHYSICS COMPONENT	/******************************************************************/
	var physicsShape = new Ammo.btBoxShape(new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	
	//set the collision margin, don't use zero, default is typically 0.04
	physicsShape.setMargin(0.04);
	
	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
   transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	
	var motionState = new Ammo.btDefaultMotionState( transform );
	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	
	physicsShape.calculateLocalInertia( mass, localInertia );
	
	//create our final physics body info
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	
	var ammoCube = new Ammo.btRigidBody( rbInfo );
	Cube.userData.physicsBody = ammoCube;
	
	return Cube;
}


function initInput() {
    controls = new THREE.OrbitControls( GLOBAL.camera );
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

function updatePhysics( deltaTime ) {
	
// Step world
physicsWorld.stepSimulation( deltaTime,10);

// Update rigid bodies
for ( var i = 0; i < rigidBodies.length; i++ ) {
	var objThree = rigidBodies[ i ];
	//apply a force
	//if (i ===0){objThree.userData.physicsBody.applyCentralImpulse(new Ammo.btVector3( 0, 0, 0 ))}
	var objPhys = objThree.userData.physicsBody;
	var ms = objPhys.getMotionState();
		if ( ms ) {
		//console.log(objPhys.getLinearVelocity().y());
		ms.getWorldTransform( transformAux1 );
		var p = transformAux1.getOrigin();
		var q = transformAux1.getRotation();
		objThree.position.set( p.x(), p.y(), p.z() );
		objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
		if (objThree.hasOwnProperty('flame')) {
			objThree.flame.position.set(p.x(), p.y()-1, p.z());
			}
		};
	};
		
};




//https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_draggablecubes.html
//http://stackoverflow.com/questions/13499472/change-btrigidbodys-position-orientation-on-the-fly-in-bullet-physics
function onDocumentKeyDown(event){
	
	if (event.keyCode === 32){
		
		rigidBodies[0].userData.physicsBody.applyCentralImpulse(new Ammo.btVector3( 0, 5, 0 ));
		rigidBodies[0].flame.visible= true;
	//	var pos = rigidBodies[0].position
		//rigidBodies[0].flame.position.copy({'x':pos.x,'y':pos.y-1,'z':pos.z});
		//console.log(rigidBodies[0].flame);
		};
}

function onDocumentKeyUp(event){
rigidBodies[0].flame.visible= false;
rigidBodies[0].userData.physicsBody.applyCentralImpulse(new Ammo.btVector3( 0, 0, 0 ));
}

function onDocumentMouseDown(event){

			event.preventDefault();
			var plane = new THREE.Plane();
			var intersection = new THREE.Vector3();
			
	//		console.log(rigidBodies);
			GLOBAL.raycaster.setFromCamera( mouse, GLOBAL.camera );
			var intersects = GLOBAL.raycaster.intersectObjects( rigidBodies );
	//		console.log(intersects)
			if (intersects.length >0) {
				Physics_on = false;
				controls.enabled = false;
				
				SELECTED = intersects[0];
				SELECTED.object.userData.physicsBody.setActivationState(4);//ALWAYS ACTIVE
				
			}
				
};
function onDocumentMouseMove(event){
// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
	
	var intersects = GLOBAL.raycaster.intersectObjects( rigidBodies );
	
	if (intersects.length >0) {
		
		mouseIntersects = intersects[ 0 ];
		
		if (mouseIntersects.object != ground){
			container.style.cursor = 'pointer';}
		else{
			container.style.cursor = 'auto';
			}
		
		if(SELECTED != null){
			
			HIGHLIGHT.visible = true;

			HIGHLIGHT.position.copy( intersects[0].point ).add( intersects[0].face.normal );
		}
	}
}
function onDocumentMouseUp(){
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
		SELECTED.object.userData.physicsBody.setWorldTransform(transformAux1);
		
		SELECTED.object.userData.physicsBody.setActivationState(1);//Return to normal activation state
				
		//turn our physics engin back on with new placement		
		Physics_on = true;}
		
	SELECTED = null;
		
	return;	
};

function animate() {
        render();
		requestAnimationFrame( animate );
    };


function render() {
	   var deltaTime = clock.getDelta();

       GLOBAL.renderer.render( GLOBAL.scene, GLOBAL.camera );
	   controls.update( deltaTime );
	   if (Physics_on) {
		 /* IF rigidBody doesn't move it's activation state changed so that it CAN"T move unless hit by object that is active.*/
		 //http://bulletphysics.org/Bullet/phpBB3/viewtopic.php?t=9024
		 //http://www.bulletphysics.org/Bullet/phpBB3/viewtopic.php?f=9&t=4991&view=previous
	   updatePhysics( deltaTime );
	   }
	   GLOBAL.raycaster.setFromCamera( mouse, GLOBAL.camera);
	   var intersects = GLOBAL.raycaster.intersectObjects( GLOBAL.scene.children );			   
	   
       };