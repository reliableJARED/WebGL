
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
	renderer.setClearColor( 0xf0f0f0 ); //change # to 0x for example #f0f0f0 -> 0xf0f0f0
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight ); 
    
    //ENABLE shadows in our world now renderer.
	/*NOTE! shadows use a lot of resources. One quick way to improve performace is turning them off.*/
     renderer.shadowMap.enabled = true;
	
	var ambientLight = new THREE.AmbientLight( 0x404040 );
    scene.add( ambientLight );
    
    //NEW LIGHT - directional.  Used for spotlight effect
       var light = new THREE.DirectionalLight( 0xffffff, 2 );
           light.position.set( -20, 15, -20);
		   
		   //enable our shadows
				light.castShadow = true;
				
	//SETUP how our light source casts shadows:	
		 var d = 10;
		 
				//For proper resolution, is important that your shadow camera is positioned tight around your scene. You do that by setting the following:
			    light.shadowCameraLeft = -d;
			    light.shadowCameraRight = d;
			    light.shadowCameraTop = d;
			    light.shadowCameraBottom = -d; 
				/* You don't NEED to use the ShadowCameraLeft,Rigth,Top, Bottom settings if you're also using the fustum approach with 	shadowCameraNear and shadowCameraFar below.*/
	
				//think of the light source as a camera.  Like the camera we have two planes, or Frustum's which bisect the pyramid of light coming from our source.  shadowCameraNear is the fustum closest to the light, shadowCameraFar is the fustum furthist from the light source.  Anything outside of this will not receive shadow from our light source.
				
			    light.shadowCameraNear = 2;
			    light.shadowCameraFar = 50;
				
				//adjust shadowMapWidth and shadowMapHeight to change resolution of the shadow.  use powers of 2 (if you don't it will still work, but just use ^2)
			    light.shadowMapWidth = 1024;
			    light.shadowMapHeight = 1024;
				
				//shadowDarkness should tune the opacity 0 - 1, but doesn't see to have an affect
			    light.shadowDarkness = .5;
				
				
    scene.add( light );
                				
    var container = document.getElementById( 'container' );
        container.appendChild( renderer.domElement );
}

function createObjects() {
		
		var pos = new THREE.Vector3(0,10,0);
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our cube
		//change the material used compared to example1
		/*Example of PhongMaterial:
		http://threejs.org/examples/?q=phon#webgl_materials_variations_phong		
		*/
		var cube = createGrapicPhysicBox(2,2,2,5,pos,quat,new THREE.MeshPhongMaterial( { color: "rgb(90%, 10%, 0%)"}));
		cube.castShadow = true;
		cube.receiveShadow = true;
				
		//change and reuse pos for the ground		
		pos.set( 0, - 0.5, 0 );
		
		//Important! mass is being passed as 0.  this will create a non-movable object in bullet.  objects can interact with this
		//object but it will note move.  perfect for grounds, buildings or other static objects.  also rather than using the 
		//default mesh we are passing a mesh to createGraphicPhysicBox().  this mesh will allow shadow if enabled
		
		var ground = createGrapicPhysicBox(20,1,20,0,pos,quat,new THREE.MeshPhongMaterial( { color: "rgb(0%, 50%, 50%)"}));
		ground.receiveShadow = true;
		ground.castShadow = true;		
		
		rigidBodies.push( cube );
		scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physicsBody );
		
		rigidBodies.push( ground );
		scene.add( ground );
		physicsWorld.addRigidBody( ground.userData.physicsBody );
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