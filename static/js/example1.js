/*
RESOUCES:
****PHYSICS
Ammo.js is a port of Bullet, use the bullet manual
http://www.cs.uu.nl/docs/vakken/mgp/2014-2015/Bullet%20-%20User%20Manual.pdf

https://www.raywenderlich.com/53077/bullet-physics-tutorial-getting-started

****GRAPHICS
http://threejs.org/docs/
http://threejs.org/examples/

EXAMPLE INTRO:
Graphics and physics objects are not the same.  we need to create graphics, with corresponding physics objects and then associate them so it's easy to update a graphics change. For example when a box rotates after being in a collision.  The graphics (orientation) of the box moves based on what the position of physics object is.

I'll be using three.js for graphics and ammo.js for physics
*/

//GLOBAL General variables

var mouse = new THREE.Vector2();
var clock = new THREE.Clock();



//GLOBAL Graphics variables
var camera, scene, renderer;//primary components of displaying in three.js
var controls;
//RAYCASTER  is a project that renders a 3D world based on a 2D map
var raycaster = new THREE.Raycaster();//http://threejs.org/docs/api/core/Raycaster.html


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
/*To actually be able to display anything with Three.js, we need three things: 
A SCENE and a CAMERA, 
plus a RENDERER so we can render the scene with the camera*/

/*
PerspectiveCamera( fov, aspect, near, far )
		fov — Camera frustum vertical field of view.
		aspect — Camera frustum aspect ratio.
		near — Camera frustum near plane.
		far — Camera frustum far plane.
		
In a sense you're creating a pyramid that represents what the user can see
*/  
//http://threejs.org/docs/api/cameras/PerspectiveCamera.html 
   camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );	
   //mess around with these parameters to adjust staring view point
    camera.position.x = 10;
	camera.position.y = 20;
    camera.position.z =  0;
				
	scene = new THREE.Scene();//http://threejs.org/docs/#Reference/Scenes/Scene
    
	//http://threejs.org/docs/#Reference/Renderers/WebGLRenderer
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xf0f0f0 ); //sets the clear color and opacity of background.
    renderer.setPixelRatio( window.devicePixelRatio );//Sets device pixel ratio.
    renderer.setSize( window.innerWidth, window.innerHeight );//Resizes output to canvas device pixel ratio taken into account

    
    //LIGHT
	//http://threejs.org/docs/api/lights/AmbientLight.html
	var ambientLight = new THREE.AmbientLight( 0x404040 );
    scene.add( ambientLight );
    				
    				
    //attach and display the renderer to our html
    var container = document.getElementById( 'container' );
        container.appendChild( renderer.domElement );
}

function createObjects() {
		
		//http://threejs.org/docs/api/math/Vector3.html
		var pos = new THREE.Vector3();
		
		//http://threejs.org/docs/api/math/Quaternion.html
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our cube
		var cube = createGrapicPhysicBox(2,2,2,5,pos,quat);
		//cube[0] is graphic
		//cube[1] is physics
				
		
		rigidBodies.push( cube );
		
		//add cube to graphics world
		scene.add( cube );
		
		//add physics portion of cube to physics world
		physicsWorld.addRigidBody( cube.userData.physicsBody );
}

function createGrapicPhysicBox (sx, sy, sz, mass, pos, quat, material){
	//GRAPHIC COMPONENT
	/***************************************************************/
	//http://threejs.org/docs/api/extras/geometries/BoxGeometry.html
	var geometry = new THREE.BoxGeometry(sx, sy, sz );
	
	//create detault material if none passed
	//http://threejs.org/docs/api/materials/MeshBasicMaterial.html
	material = material || new THREE.MeshBasicMaterial( { color: "rgb(100%, 0%, 0%)"} );
	
	//http://threejs.org/docs/#Reference/Objects/Mesh
	var Cube = new THREE.Mesh(geometry, material);
	
	
	//PHYSICS COMPONENT	/******************************************************************/
	//btBoxShape : Box defined by the half extents (half length) of its sides (that is why the 0.5 is there)
	var physicsShape = new Ammo.btBoxShape(new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	
	//set the collision margin, don't use zero, default is typically 0.04
	physicsShape.setMargin(0.04);
	
	//set the location of our physics object based on where the graphics object is
	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	
	//set the motion state and inertia of our object
	var motionState = new Ammo.btDefaultMotionState( transform );
	//creating with 0,0,0 means the box will be aligned, no rotation
	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	
	physicsShape.calculateLocalInertia( mass, localInertia );
	
	//create our final physics body info
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	
	//build our ridgidBody
	var ammoCube = new Ammo.btRigidBody( rbInfo );
	
	//attach the physic prop to the graphic object
	Cube.userData.physicsBody = ammoCube;
	
	return Cube;
}

function initInput() {
	//VIEW CONTROL
	/*contorl our camera and move around our world.*/
    controls = new THREE.OrbitControls( camera );
	controls.target.y = 2;
};

function initPhysics() {
		// Physics World configurations
		/*see Bullet documentation link above for help/info on each*/
		/*
		To run physics simulations we need to create a few things for our world. ammo.js (bullet) has different classes/versions for each category.
		
		1. COLLISION DETECTION: this is done in two phases: broad and 	narrow.  broad is used to eliminate objects that can't collide because they are not near.  narrow is used for objects that can collide (slower calc) and where on the two objects the collision happens.
		
		2.DISPATCHER: This is used to dispatch objects that have been determined to be in collision to the solver
		
		3. SOLVER: This is what causes the objects to interact properly, taking into account gravity, game logic supplied forces, collisions, and hinge constraints.
		*/
		
		//BROAD
		broadphase = new Ammo.btDbvtBroadphase();
		
		//NARROW
		collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
		
		//DISPATCHER
		dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
		
		//SOLVER(s)
		solver = new Ammo.btSequentialImpulseConstraintSolver();	
		softBodySolver = new Ammo.btDefaultSoftBodySolver();
		
		/*apply our selected components to the world*/
		//WORLD
		physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
				
		//note setGravity accepts (x,y,z), you could set gravitationl force in x or z too if you wanted.		
		physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
};

function updatePhysics( deltaTime ) {
// Step world
/*By default, Bullet physics simulation runs at an internal fixed framerate of 60 Hertz (0.01666). The
game or application might have a different or even variable framerate. To decouple the application
framerate from the simulation framerate, an automatic interpolation method is built into
stepSimulation: when the application deltatime, is smaller then the internal fixed timestep, Bullet will
interpolate the world transform, and send the interpolated worldtransform to the btMotionState,
without performing physics simulation. If the application timestep is larger then 60 hertz, more then 1
simulation step can be performed during each ‘stepSimulation’ call. The user can limit the maximum
number of simulation steps by passing a maximum value as second argument*/

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