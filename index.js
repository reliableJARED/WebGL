/*
https://github.com/rauchg/chat-example
*/
var app = require('express')();

//https://www.npmjs.com/package/nodejs-physijs
/*
VERY IMPORTANT NOTE!!!!
ammo.js that came with the npm install of NodePhysijs was REPLACED with ammo.js from the original Emscripten port here:
https://github.com/kripken/ammo.js/tree/master/builds
It was litterally a cut, paste replacement of the file ammo.js.  Keep directories the same.

The reason is they are NOT the same and some functions were missing. for example: btSoftBodyRigidBodyCollisionConfiguration()
 I only used 'nodejs-physijs' in npm because I couldn't find a stand alone node package for ammo. 
*/
const NodePhysijs = require('nodejs-physijs');
const Ammo = NodePhysijs.Ammo;

//Express initializes app to be a function handler that you can supply to an HTTP server
var http = require('http').Server(app);

//A server that integrates with (or mounts on) the Node.JS HTTP Server: socket.io
var io = require('socket.io')(http);

var port = 8000; 
//var ip = '10.10.10.100'


//required for serving locally when testing
var serveStatic = require('serve-static')
app.use(serveStatic(__dirname + '/static/css'))
app.use(serveStatic(__dirname + '/static/lib'))
app.use(serveStatic(__dirname + '/static/js'))
app.use(serveStatic(__dirname + '/node_static'))
app.use(serveStatic(__dirname + '/static/three.js/examples/js/controls'))
app.use(serveStatic(__dirname + '/static/three.js/build'))
app.use(serveStatic(__dirname + '/static/ammo.js/builds/'))

//GLOBAL Physics variables
var physicsWorld;
var gravityConstant = -9.8;
var rigidBodies = [];
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var transformAux1 = new Ammo.btTransform();
var EndTimeLastPhysicsStep = Date.now(); 
var PhysicsSimStarted = false;

function initPhysics() {
	
		ClockStart = Date.now();//miliseconds!

		//BROAD
		broadphase = new Ammo.btDbvtBroadphase();
		
		
		/* NOTE! btSoftBodyRigidBodyCollisionConfiguration() not in ammo that came with nodejs-physijs npm */;
		//NARROW
		collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration() ;
		
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
		
		io.emit('p','initPhysics');
		console.log('initPhysics')
};


function createObjects() {
		
		var pos = new Ammo.btVector3(1,1,1);
		
		var quat = new Ammo.btQuaternion(0,0,0,1);

		//create a graphic and physic component for our cube
		var width =2;
		var height =2;
		var depth =2;
		var mass = 5;
		var cube = createPhysicalCube(width,height,depth,mass,pos,quat);
		
		//add to our physics object holder
		rigidBodies.push( cube );
		
		//add cube to physics world
		physicsWorld.addRigidBody( cube );
		
		io.emit('p','createObjects');
		console.log('createObjects')
}

function createPhysicalCube (sx, sy, sz, mass, pos, quat){

	var physicsShape = new Ammo.btBoxShape(new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	
	//set the collision margin, don't use zero, default is typically 0.04
	physicsShape.setMargin(0.04);
	
	/*set the location of our physics object based on where the graphics object is*/
	//btTransform() supports rigid transforms with only translation and rotation and no scaling/shear.
	var transform = new Ammo.btTransform();
	transform.setIdentity();
	
	//setOrigin() is for location
	transform.setOrigin( pos );
    
	//setRotation() is for Orientation
	transform.setRotation( quat );
	
	//set the motion state and inertia of our object
	var motionState = new Ammo.btDefaultMotionState( transform );
	
	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	
	physicsShape.calculateLocalInertia( mass, localInertia );
	
	//create our final physics rigid body info
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	
	//build our ridgidBody
	var Cube = new Ammo.btRigidBody( rbInfo );
	
	io.emit('p','createPhysicalCube');
	console.log('createPhysicalCube')
	
	return Cube;
}

function updatePhysics( deltaTime ) {

	/* http://www.bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World */
	physicsWorld.stepSimulation( deltaTime,10);//Bullet maintains an internal clock, in order to keep the actual length of ticks constant

	// Update rigid bodies
	for ( var i = 0; i < rigidBodies.length; i++ ) {

		var ms =  rigidBodies[ i ].getMotionState();

		if ( ms ) {
			
				//Bullet calls getWorldTransform with a reference to the variable it wants you to fill with transform information
				ms.getWorldTransform( transformAux1 );//note: transformAux1 =  Ammo.btTransform();
		
				//get the physical location of our object
				var p = transformAux1.getOrigin();
				
			//	console.log(p.y());
			//	io.emit('p',p.y());
				//get the physical orientation of our object
			
				var q = transformAux1.getRotation();

		};
	};
	
	EndTimeLastPhysicsStep = Date.now();//miliseconds!
	
	//LOOP the physics
	//use setTimeout()To schedule execution of a one-time callback after delay milliseconds.
	setTimeout( render, 50 );
	
	//when I used process.nextTick() was preventing clients from being able to connect, recursive loop of the physics world was created and no other process would run
	//process.nextTick(render);
};

function render() {
	   var deltaTime = (Date.now()/1000) - (EndTimeLastPhysicsStep/1000);
	   updatePhysics( deltaTime );
    };
	
//setup physics world	
initPhysics();
createObjects();


//serve HTML to initial get request
app.get('/', function(request, response){
	response.sendFile(__dirname+'/node_static/mulitplayer_game1.html');
});

//socketio listener for 'connection'
io.on('connection', function(socket){

	console.log('new user');
	
	//
	for(var obj =0; obj <rigidBodies.length;obj++){
		var x = rigidBodies[obj].getWorldTransform().getOrigin().x(); 
		var y = rigidBodies[obj].getWorldTransform().getOrigin().y(); 
		var z = rigidBodies[obj].getWorldTransform().getOrigin().z();
		var Rx = rigidBodies[obj].getWorldTransform().getRotation().x() 
		var Ry = rigidBodies[obj].getWorldTransform().getRotation().y() 
		var Rz = rigidBodies[obj].getWorldTransform().getRotation().z() 
		var w = rigidBodies[obj].getCollisionShape(); // FIND OUT SPECS HERE
		var h = rigidBodies[obj].getCollisionShape();
		var d = rigidBodies[obj].getCollisionShape();
		var mass = rigidBodies[obj].getCollisionShape();
		io.emit('init',{x:x,y:y,z:z,Rx:Rx,Ry:Ry,Rz:Rz,w:w,h:h,d:d,mass:mass});
	}

	//begin physics sim
	if(!PhysicsSimStarted){
		render();
	}

	PhysicsSimStarted = true;
});

http.listen(port, function(){
	console.log('listening on port: '+port);
	console.log('serving files from: '+__dirname);
	});		
