"use strict";
//GLOBAL General variables
var mouse = new THREE.Vector2();
var clock = new THREE.Clock();

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
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver,softBodySolver;
var transformAux1 = new Ammo.btTransform();

//MAIN
init();// start world building
animate(); //start rendering loop

function init() {

		initGraphics();
		initPhysics();
		createObjects();
		initInput();
		
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
}

function initGraphics() {

 //  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );	
    GLOBAL.camera.position.x = 10;
	GLOBAL.camera.position.y = 20;
    GLOBAL.camera.position.z =  0;
				
	//scene = new THREE.Scene();
	
	//renderer = new THREE.WebGLRenderer();
	GLOBAL.renderer.setClearColor( 0xf0f0f0 ); 
    GLOBAL.renderer.setPixelRatio( window.devicePixelRatio );
    GLOBAL.renderer.setSize( window.innerWidth, window.innerHeight ); 
	var ambientLight = new THREE.AmbientLight( 0x404040 );
    GLOBAL.scene.add( ambientLight );
    				
    var container = document.getElementById( 'container' );
        container.appendChild( GLOBAL.renderer.domElement );
       /* 
    		rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
				rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
				rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
				scene.add( rollOverMesh );
				*/
}

function createObjects() {
		
		var pos = new THREE.Vector3();	
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our cube
		var cube = createGrapicPhysicBox(2,2,2,5,pos,quat);
		console.log(cube);
		pos.set( 0, - 0.5, 0 );
		var ground = createGrapicPhysicBox(20,1,20,0,pos,quat);
		
		console.log(cube);
		rigidBodies.push( cube );
		GLOBAL.scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physicsBody );
		
		rigidBodies.push( ground );
		GLOBAL.scene.add( ground );
		physicsWorld.addRigidBody( ground.userData.physicsBody );
		
		//physicsWorld.removeRigidBody( cube.userData.physicsBody );
		
		//console.log(physicsWorld);
}

function createGrapicPhysicBox (sx, sy, sz, mass, pos, quat, material){
	//GRAPHIC COMPONENT
	/***************************************************************/
	var geometry = new THREE.BoxGeometry(sx, sy, sz );
	
	material = material || new THREE.MeshBasicMaterial( { color: "rgb(100%, 0%, 0%)"} );
	
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
	if (i ===0){objThree.userData.physicsBody.applyCentralImpulse(new Ammo.btVector3( 0, 0, 0 ))}
	var objPhys = objThree.userData.physicsBody;
	var ms = objPhys.getMotionState();
		if ( ms ) {

		ms.getWorldTransform( transformAux1 );
		var p = transformAux1.getOrigin();
		var q = transformAux1.getRotation();
		objThree.position.set( p.x(), p.y(), p.z() );
		objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
				};
	};
		
};


var rollOverGeo = new THREE.BoxGeometry( 1, 1, 1 );
var rollOverMaterial = new THREE.MeshBasicMaterial( { color: "rgb(0%,100%,0%)", opacity: 0.0, transparent: true } );
var HIGHLIGHT = new THREE.Mesh( rollOverGeo, rollOverMaterial );
console.log(HIGHLIGHT);	
GLOBAL.scene.add( HIGHLIGHT );
var MOUSE_IS_DOWN = false;
var PHYSICS_ON = true;		
function onDocumentMouseDown( event ) {
MOUSE_IS_DOWN = true;
	
		event.preventDefault();
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		
		GLOBAL.raycaster.setFromCamera( mouse, GLOBAL.camera);
	   var intersects = GLOBAL.raycaster.intersectObjects( GLOBAL.scene.children );			   
	   
		if (intersects.length >0) {
			controls.enabled = false;
			if (intersects[0] !== HIGHLIGHT) {
				PHYSICS_ON = false;	
										
				HIGHLIGHT.selected = intersects[0].object;
				physicsWorld.removeRigidBody( HIGHLIGHT.selected.userData.physicsBody );
				
				console.log(intersects[0]);
		//		physicsWorld.addRigidBody( ground.userData.physicsBody );
		//physicsWorld.removeRigidBody( cube.userData.physicsBody );
				HIGHLIGHT.position.copy(intersects[0].object.position);
				HIGHLIGHT.material.opacity = 0.5;
	  			var sx = intersects[0].object.geometry.parameters.depth;
	  			var sy = intersects[0].object.geometry.parameters.height;
	  			var sz = intersects[0].object.geometry.parameters.width;
	  			HIGHLIGHT.scale.set(sx * 1.05, sy * 1.05, sz * 1.05);
	  		//	HIGHLIGHT.scale.x = sx * 1.05;
	  		//	HIGHLIGHT.scale.y = sy * 1.05;
	  		//	HIGHLIGHT.scale.z = sz * 1.05;
	  		//	HIGHLIGHT.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
	  			  		//	intersects[0].object.material.color.b = 1;
  			}	
  			if (intersects[0].object.uuid === HIGHLIGHT.uuid ){
  				PHYSICS_ON = false;	
  				HIGHLIGHT.selected = intersects[1].object;
  				HIGHLIGHT.position.copy(intersects[1].object.position);
				HIGHLIGHT.material.opacity = 0.5;
	  			var sx = intersects[1].object.geometry.parameters.depth;
	  			var sy = intersects[1].object.geometry.parameters.height;
	  			var sz = intersects[1].object.geometry.parameters.width;
	  			HIGHLIGHT.scale.set(sx * 1.05, sy * 1.05, sz * 1.05);
  			}	
	   }
	   if (intersects.length ===0) {
  				HIGHLIGHT.scale.set(1,1,1)
  			}
};
var plane = new THREE.Plane();
var intersection = new THREE.Vector3();
var offset = new THREE.Vector3();
var INTERSECTED;
//https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_draggablecubes.html

function onDocumentMouseMove( event ) {		
				//http://stackoverflow.com/questions/13499472/change-btrigidbodys-position-orientation-on-the-fly-in-bullet-physics
				event.preventDefault();
				mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
				mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
				GLOBAL.raycaster.setFromCamera( mouse, GLOBAL.camera );
				
				if ( HIGHLIGHT.selected ) {
					if ( GLOBAL.raycaster.ray.intersectPlane( plane, intersection ) ) {
					//	console.log(rigidBodies[0].uuid);
					//	console.log(HIGHLIGHT.selected);
						HIGHLIGHT.selected.position.copy( intersection.sub( offset ) );
					//	console.log(HIGHLIGHT.selected.userData.physicsBody.getMotionState());
HIGHLIGHT.selected.userData.physicsBody.getWorldTransform().setOrigin(intersection.sub( offset ));
				//		HIGHLIGHT.selected.userData.physicsBody.getMotionState().setWorldTransform( new Ammo.btTransform(intersection.sub( offset )) )
			//	HIGHLIGHT.selected.userData.physicsBody.getWorldTransform(new Ammo.btTransform(intersection.sub( offset )));
						console.log(intersection.sub( offset ));
						//HIGHLIGHT.selected.userData.physicsBody.setWorldTransform(intersection.sub( offset ));
					}
					return;
				}
				var intersects = GLOBAL.raycaster.intersectObjects( GLOBAL.scene.children );
				if ( intersects.length > 0 ) {
					if ( INTERSECTED != intersects[ 0 ].object ) {
						if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
						INTERSECTED = intersects[ 0 ].object;
						INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
						plane.setFromNormalAndCoplanarPoint(
							GLOBAL.camera.getWorldDirection( plane.normal ),
							INTERSECTED.position );
					}
					container.style.cursor = 'pointer';
				} else {
					if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
					INTERSECTED = null;
					container.style.cursor = 'auto';
				}
}


function onDocumentMouseUp( event ) {
	MOUSE_IS_DOWN = false;
	PHYSICS_ON = true;		
	event.preventDefault();
				controls.enabled = true;
				if ( INTERSECTED ) {
					HIGHLIGHT.selected = null;
				}
				container.style.cursor = 'auto';						

};

function animate() {
        render();
		requestAnimationFrame( animate );
    };


function render() {
	   var deltaTime = clock.getDelta();
       GLOBAL.renderer.render( GLOBAL.scene, GLOBAL.camera );
	   controls.update( deltaTime );
	   if (PHYSICS_ON) {
	   	updatePhysics( deltaTime );
	   }
	   GLOBAL.raycaster.setFromCamera( mouse, GLOBAL.camera);
	   var intersects = GLOBAL.raycaster.intersectObjects( GLOBAL.scene.children );			   
	   
       };