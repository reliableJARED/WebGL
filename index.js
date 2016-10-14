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
var gravityConstant = -1; //-9.8
var rigidBodies =  new Array();
var rigidBodiesIndex = new Array();//holds info about world objects.  Sent to newly connected clients so that they can build the world
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

};


function createObjects() {
		
		//create a graphic and physic component for our cube
		var w = 2;
		var h =2;
		var d =2;
		var mass = 5;
		var x =1;
		var y =1;
		var z=1;
		var Rx =0;
		var Ry=0;
		var Rz=0;
		
		var pos = new Ammo.btVector3(x,y,z);		
		var quat = new Ammo.btQuaternion(Rx,Ry,Rz,1);

		var cube = createPhysicalCube(w,h,d,mass,pos,quat);
		
		//add to our physics object holder
		rigidBodies.push( cube );
		
		//add cube to physics world
		physicsWorld.addRigidBody( cube );
		
		//create a parallel array that holds info about our object
		var lookupID = 'id'+cube.ptr.toString();

		rigidBodiesIndex[lookupID] = {
				id:lookupID,
				x:x, 
				y:y, 
				z:z, 
				Rx:Rx, 
				Ry:Ry, 
				Rz:Rz, 
				w:w, 
				h:h, 
				d:d, 
				mass:mass, 
			   shape:'box'
			};

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

	return Cube;
}

function updatePhysics( deltaTime ) {
	
	//this will hold a tree of objects that need to be updated due to Physics simulation
	//the structure is that ObjectUpdateJSON has a bunch of properties which are the ID's of the objects.  Each object branch contains the new XYZ, rotation X,Y,Z for the objects. 
	var ObjectUpdateJSON = {};

	/* http://www.bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World */
	physicsWorld.stepSimulation( deltaTime,10);//Bullet maintains an internal clock, in order to keep the actual length of ticks constant

	// Update rigid bodies
	for ( var i = 0; i < rigidBodies.length; i++ ) {
		var obj = rigidBodies[ i ];
		var ms =  obj.getMotionState();

		if ( ms ) {
				
				//Bullet calls getWorldTransform with a reference to the variable it wants you to fill with transform information
				ms.getWorldTransform( transformAux1 );//note: transformAux1 =  Ammo.btTransform();
				
				 var lookupID = 'id'+obj.ptr.toString();
		
				//get the physical location of our object
				var p = transformAux1.getOrigin();
				var x = p.x();	
				var y = p.y();			
				var z = p.z();						
				
				//get the physical orientation of our object
				var q = transformAux1.getRotation();
				var Rx = q.x();	
				var Ry = q.y();	
				var Rz = q.z();	
				
				//add this object to our update JSON to be sent to all clients
				ObjectUpdateJSON[lookupID] = {x:x, y:y, z:z, Rx:Rx, Ry:Ry, Rz:Rz};
				
				/*IMPORTANT!
				rigidBodiesIndex[] is used for new connections only.  But it should stay up to date with where objects are now.  It is inefficient to constantly update this since we already know on the server
				where things are because of the simulation.  Instead need a function that on new connection BUILDs this array based on current state.
				*/
			  
			
			
		};
	};
	
	EndTimeLastPhysicsStep = Date.now();//miliseconds!
	
	//LOOP the physics
	//use setTimeout()To schedule execution of a one-time callback after delay milliseconds.
	setTimeout( render, 50 );
	
	//when I used process.nextTick() was preventing clients from being able to connect, recursive loop of the physics world was created and no other process would run
	//process.nextTick(render);
	
	//Send the list of objects to be updated
	/* CONSIDERATION! should this JSON have some time stamp associated? */
	io.emit('update', ObjectUpdateJSON );
};

function render() {
	   var deltaTime = (Date.now()/1000) - (EndTimeLastPhysicsStep/1000);
	   updatePhysics( deltaTime );
    };
	
	
function BuildWorldStateForNewConnection(){

	//http://stackoverflow.com/questions/35769707/socket-io-loses-data-on-server-side
	var world = new Array();
	
	for(var i = 0; i < rigidBodies.length; i++){
		
		var obj = rigidBodies[i]
		
		var lookupID = 'id'+obj.ptr.toString();
		
		obj.getMotionState().getWorldTransform( transformAux1 )
		
		//get the physical orientation and location of our object
		var p = transformAux1.getOrigin();
		rigidBodiesIndex[lookupID].x =  p.x();	
		rigidBodiesIndex[lookupID].y = p.y()
		rigidBodiesIndex[lookupID].z = p.z()		
				
		var q = transformAux1.getRotation();
		rigidBodiesIndex[lookupID].Rx = q.x();
		rigidBodiesIndex[lookupID].Ry = q.y();
		rigidBodiesIndex[lookupID].Rz = q.z();
		
		world.push(rigidBodiesIndex[lookupID]);
	}

	/*IMPORTANT: See SO link above.  Can't send rigidBodiesIndex directly, had to copy to new array.  */
	io.emit('setup', world);

}


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
	io.emit('connect','welcome');
	BuildWorldStateForNewConnection();
	
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
