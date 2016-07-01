
//GLOBAL General variables
var mouse = new THREE.Vector2();
var clock = new THREE.Clock();

//GLOBAL Graphics variables
var camera, scene, renderer;
var controls;
var raycaster = new THREE.Raycaster();


//GLOBAL Physics variables
var physicsWorld;
var gravityConstant = -9.8;
var rigidBodies = [];
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var transformAux1 = new Ammo.btTransform();

//MAIN
init();// start world building
animate(); //start rendering loop

function init() {

		initGraphics();
		initPhysics();
		createObjects();
		initInput();
}

function initGraphics() {

   camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );	
    camera.position.x = 10;
	camera.position.y = 20;
    camera.position.z =  0;
				
	scene = new THREE.Scene();
	
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xf0f0f0 ); 
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight ); 
	var ambientLight = new THREE.AmbientLight( 0x404040 );
    scene.add( ambientLight );
    				
    var container = document.getElementById( 'container' );
        container.appendChild( renderer.domElement );
}

function createObjects() {
		
		var pos = new THREE.Vector3();	
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our cube
		var cube = createGrapicPhysicBox(2,2,2,5,pos,quat);
		pos.set( 0, - 0.5, 0 );
		var ground = createGrapicPhysicBox(20,1,20,0,pos,quat);
		
		//console.log(cube);
		rigidBodies.push( cube );
		scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physicsBody );
		
		rigidBodies.push( ground );
		scene.add( ground );
		physicsWorld.addRigidBody( ground.userData.physicsBody );
		
		//physicsWorld.removeRigidBody( cube.userData.physicsBody );
		
		console.log(physicsWorld);
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

function updatePhysics( deltaTime ) {
// Step world
physicsWorld.stepSimulation( deltaTime,10);

// Update rigid bodies
for ( var i = 0; i < rigidBodies.length; i++ ) {
	var objThree = rigidBodies[ i ];
	if (i ===0){objThree.userData.physicsBody.applyCentralImpulse(new Ammo.btVector3( 0, .9, 0 ))}
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

function animate() {
        render();
		requestAnimationFrame( animate );
    };
    
function render() {
	   var deltaTime = clock.getDelta();
       renderer.render( scene, camera );
	   controls.update( deltaTime );
	   updatePhysics( deltaTime );
       };