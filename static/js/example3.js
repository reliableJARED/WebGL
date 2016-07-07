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
var rigidBodies_uuid_lookup ={};
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver,softBodySolver;
var transformAux1 = new Ammo.btTransform();

function rigidBodies_h(data){
	console.log('called:');
	console.log(data);
	function lookUp(id){
		//uses UUID prop and returns the index of an obj in the rigidBodies array or false if it's not there
		if(rigidBodies_uuid_lookup.hasOwnProperty(id)){
			return rigidBodies_uuid_lookup[id]}
		else{
			return false;
		}
	}
	if(typeof data === 'string'){
		//return obj with given UUID
		return rigidBodies[lookUp(data)];
	}
	if(typeof data === 'object'){
		/*hasOwnProperty does not check down the prototype chain, while in does:'Prop' in Object -> true if it's anywhere*/
		
		//lookup the object
		if(data.hasOwnProperty('uuid')){
					console.log('has uuid');
			var index = lookUp(data.uuid);
				
				if(!index){
					console.log('new ridgidBody');
					/*DO THIS ORDER - length is a count, index starts at 0*/
					
					//add to index lookup helper
					rigidBodies_uuid_lookup[data.uuid] = rigidBodies.length;
					//push to main array of objects
					rigidBodies.push(data);
				}
				else{
					console.log('update ridgidBody');
					//update existing
					rigidBodies[index] = data;}
		}else { console.log('error: '+data+' has no prop UUID');};
	}
}

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
		
		var pos = new THREE.Vector3(0,20,0);	
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our cube
		var cube = createGrapicPhysicBox(2,2,2,5,pos,quat);
		
		pos.set( 0, - 0.5, 0 );
		//create object for our ground, but define the materialmeshs and color
		var ground = createGrapicPhysicBox(20,1,20,0,pos,quat,new THREE.MeshBasicMaterial( { color: "rgb(0%, 100%, 0%)"}) );
		
		console.log(cube);
		rigidBodies.push(cube);
		GLOBAL.scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physicsBody );
		
		rigidBodies.push(ground);
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

GLOBAL.scene.add( HIGHLIGHT );


//https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_draggablecubes.html
//http://stackoverflow.com/questions/13499472/change-btrigidbodys-position-orientation-on-the-fly-in-bullet-physics

var SELECTED;
var Physics_on = true;
function onDocumentMouseDown(event){
			event.preventDefault();
			var plane = new THREE.Plane();
			var intersection = new THREE.Vector3();
			
			console.log(rigidBodies);
			GLOBAL.raycaster.setFromCamera( mouse, GLOBAL.camera );
			var intersects = GLOBAL.raycaster.intersectObjects( rigidBodies );
			console.log(intersects)
			if (intersects.length >0) {
				Physics_on = false;
				controls.enabled = false;
				//mouse xyz = GLOBAL.raycaster.ray.intersectPlane( plane, intersection ) ;
				SELECTED = intersects[0];
				//physicsWorld.removeRigidBody( intersects[0].object.userData.physicsBody );			
				 
			}
				
};
function onDocumentMouseMove(event){
// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
}
function onDocumentMouseUp(){
	console.log(rigidBodies);
	controls.enabled = true;
	
	var plane = new THREE.Plane();
	var intersection = new THREE.Vector3();
	if (SELECTED != null) {
	if ( GLOBAL.raycaster.ray.intersectPlane( plane, intersection ) ) {
		var pos = GLOBAL.raycaster.ray.intersectPlane( plane, intersection );
			//	SELECTED.object.position.copy( GLOBAL.raycaster.ray.intersectPlane( plane, intersection ) );
				console.log(SELECTED);
			//	var transform_new= new Ammo.btTransform();
				transformAux1.setOrigin(new Ammo.btVector3( pos.x, pos.y, pos.z ));
				SELECTED.object.userData.physicsBody.setWorldTransform(transformAux1);
				//physicsWorld.addRigidBody( SELECTED.object.userData.physicsBody );				
				//rigidBodies_h(SELECTED.object);
				Physics_on = true;
		}}
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
	   updatePhysics( deltaTime );
	   }
	   GLOBAL.raycaster.setFromCamera( mouse, GLOBAL.camera);
	   var intersects = GLOBAL.raycaster.intersectObjects( GLOBAL.scene.children );			   
	   
       };