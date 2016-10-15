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
var ip = '192.168.1.102'


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
var gravityConstant = -9.8
var rigidBodies =  new Array();
var rigidBodiesIndex = new Object();//holds info about world objects.  Sent to newly connected clients so that they can build the world.  Similar to ridgidBodies but includes height, width, depth, color, object type.
									//info that is only needed when a newly connected player first builds the world
									
/*
var RigidBodyAccess = (function() {
  var rigidBodies =  new Array();
 
 function addObj(obj) {
    rigidBodies.push(obj);
  }
  function deleteObj(index){
	  rigidBodies.slice(index,1);
  }
  return {
    remove: function(idx) {
      deleteObj(idx);
    },
    add: function(obj) {
      addObj(obj);
    },
    getAll: function() {
      return rigidBodies;
    },
	count:function(){
	  return rigidBodies.length;
	}
  };   
})();
*/

									
var PlayerIndex = new Object();//matches a player's ID to their rigidBodiesIndex object


var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var transformAux1 = new Ammo.btTransform();//reusable transform object
var EndTimeLastPhysicsStep = Date.now(); 
var PhysicsSimStarted = false;
var vector3Aux1 = new Ammo.btVector3(); //reusable vector object
var quaternionAux1 = new Ammo.btQuaternion(); //reusable quaternion object

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
		
		/*************CREATE GROUND  *********/ 
		var groundObjBlueprint = {
			mass : 0, //zero mass makes objects static.  Objects can hit them but they dont move or fall 
			width : 200,
			height : 1,
			depth : 200,
			shape:'box',
			color: "rgb(30%, 30%, 40%)",
			x: 0,
			y: 0,
			z: 0,
			Rx: 0,
			Ry: 0,
			Rz: 0
		}
		

		//build the object
		var ground = createPhysicalCube(groundObjBlueprint);

		//add ground our physics object holder
		rigidBodies.push( ground.physics );
		
		//add ground to physics world
		physicsWorld.addRigidBody( ground.physics );
		
		//add ground to our index used to update clients about objects that have moved
		/*IMPORTANT: AddToRigidBodiesIndex expects that obj.physics is an Ammo object.  NOT the values sent used in the blueprint to build the object*/
		AddToRigidBodiesIndex(ground);
}

function AddToRigidBodiesIndex(obj){
	
	//rigidBodiesIndex holds construction info about our object
	//it is used for new players to construct the current world state
	//Ammo assigns a uniqueID number to every object which can be found in the 'ptr' property
	
	//assign our objects loc/rot to our reusable transform object
	obj.physics.getMotionState().getWorldTransform( transformAux1 );
	var loc = transformAux1.getOrigin();//position
	var rot = transformAux1.getRotation();//orientation
	
	rigidBodiesIndex[obj.id] = {
				id:obj.id,
				x:loc.x(), 
				y:loc.y(), 
				z:loc.z(), 
				Rx:rot.x(), 
				Ry:rot.y(), 
				Rz:rot.z(), 
				w:obj.width, 
				h:obj.height, 
				d:obj.depth, 
				mass:obj.mass, 
			   shape:obj.shape,
			   color:obj.color
			};
}


//the object returned from createPhysicalCube has places the Ammo object under the property 'physics'
//the x,y,z,Rx,Ry,Rz props are deleted and a new prop 'physics' is created.
function createPhysicalCube (blueprint){
	
	//need error handling and default values
	var sx = blueprint.width
	var sy =  blueprint.height
	var sz =  blueprint.depth
	var mass =  blueprint.mass
	
	/*set the position of our physics object using our reusable vector object*/
	vector3Aux1.setX(blueprint.x);
	vector3Aux1.setY(blueprint.y);
	vector3Aux1.setZ(blueprint.z);
	
	/*set the orientation of our physics object using our reusable quaternion object*/
	quaternionAux1.setEulerZYX(blueprint.Rz,blueprint.Ry,blueprint.Rx);
		
	var physicsShape = new Ammo.btBoxShape(new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	
	//set the collision margin, don't use zero, default is typically 0.04
	physicsShape.setMargin(0.04);
	
	/* use a transform to apply the loc/orient of our new physics object in world space using our reusable transform object*/
	//btTransform() supports rigid transforms with only translation and rotation and no scaling/shear.
	transformAux1.setIdentity();
	
	//setOrigin() is for location
	transformAux1.setOrigin( vector3Aux1 );
    
	//setRotation() is for Orientation
	transformAux1.setRotation( quaternionAux1 );
	
	//set the motion state and inertia of our object
	var motionState = new Ammo.btDefaultMotionState( transformAux1 );
	
	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	
	physicsShape.calculateLocalInertia( mass, localInertia );
	
	//create our final physics rigid body info
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	
	//build our ridgidBody
	var Cube = new Ammo.btRigidBody( rbInfo );
	
	//clean up our blueprint to be returned as the final object
	delete blueprint.x;
	delete blueprint.y;
	delete blueprint.z;
	delete blueprint.Rx;
	delete blueprint.Ry;
	delete blueprint.Rz;
	
	//add new prop holding our object
	blueprint.physics = Cube;
	
	//assign the objects uniqueID
	blueprint.id = 'id'+Cube.ptr.toString();

	//return our object which is now ready to be added to the world
	return blueprint;
}

function updatePhysics( deltaTime ) {
	
	//similar to the rigidBodiesIndex but only used to hold updates per frame, not the WHOLE world
	var ObjectUpdateJSON = new Object();

	//this function will create a tree of objects that need to be updated due to Physics simulation
	//the structure is that ObjectUpdateJSON has a bunch of properties which are the ID's of the objects.  
	//Each object branch will be an object that changed and it's new XYZ, rotation X,Y,Z for the objects. 
	//clients hold a matching representation of the physics object using the ID's in their presented graphics.
	

	/* http://www.bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World */
	physicsWorld.stepSimulation( deltaTime,10);//Bullet maintains an internal clock, in order to keep the actual length of ticks constant

	// check for rigidbodies that are in motion (changed) since last stepSimulation
	for ( var i = 0; i < rigidBodies.length; i++ ) {
		var obj = rigidBodies[ i ];
		var ms =  obj.getMotionState();

		if ( ms ) {
				
				//Bullet calls getWorldTransform with a reference to the variable it wants you to fill with transform information
				ms.getWorldTransform( transformAux1 );//note: transformAux1 =  Ammo.btTransform();
		
				//get the physical location of our object
				var p = transformAux1.getOrigin();

				//get the physical orientation of our object
				var q = transformAux1.getRotation();
				
				var ObjectID = 'id'+obj.ptr.toString();
				
				//add this object to our update JSON to be sent to all clients
				ObjectUpdateJSON[ObjectID] = {x:p.x(), y:p.y(), z:p.z(), Rx:q.x(), Ry:q.y(), Rz:q.z(), Rw:q.w()};
				
				/*IMPORTANT!
				rigidBodiesIndex[] is used for new connections only.  But it should stay up to date with where objects are now.  It is inefficient to constantly update this since we already know on the server
				where things are because of the simulation.  Instead need a function that on new connection BUILDs this array based on current state.
				*/
			  
			
			
		};
	};
	
	EndTimeLastPhysicsStep = Date.now();//miliseconds!
	
	//LOOP the physics
	//use setTimeout()To schedule execution of a one-time callback after delay milliseconds.
	setTimeout( render, 20 );
	
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
		//Try/Catch is here because ridgidBodies length can be affected by other functions.  synchronized locking not setup yet
		var lookUp = 'id'+rigidBodies[i].ptr.toString();
		
		try{
			var obj =  rigidBodies[i]
			
			obj.getMotionState().getWorldTransform( transformAux1 )
			
			//get the physical orientation and location of our object
			var p = transformAux1.getOrigin();
			rigidBodiesIndex[lookUp].x = p.x();	
			rigidBodiesIndex[lookUp].y = p.y();
			rigidBodiesIndex[lookUp].z = p.z();
				
			var q = transformAux1.getRotation();
			rigidBodiesIndex[lookUp].Rx = q.x();
			rigidBodiesIndex[lookUp].Ry = q.y();
			rigidBodiesIndex[lookUp].Rz = q.z();
		
			world.push(rigidBodiesIndex[lookUp]);
		}
		catch(err){
			console.log(err)
			console.log(lookUp)
			delete rigidBodiesIndex[lookUp]}
	}

	/*IMPORTANT: See SO link above.  Can't send rigidBodiesIndex directly, had to copy to new array.  */
	io.emit('setup', world);

}

function AddAPlayer(uniqueID){
	
		//random start position for new player
		//create random location for our tower, near other blocks
	   var randX =  Math.floor(Math.random() * 20) - 10;
	   var randZ =  Math.floor(Math.random() * 20) - 10;
	
		var cubeObjBlueprint = {
			width : 2,
			height : 2,
			depth : 2,
			mass : 10,
			shape:'box',
			color: Math.random() * 0xffffff,
			x: randX,
			y: 10,
			z: randZ,
			Rx: 0,
			Ry: 0,
			Rz: 0
		}
		
		//build the object
		var cube = createPhysicalCube(cubeObjBlueprint);
		//keep the cube always active		
		cube.physics.setActivationState(4);

		//add to our physics object holder
		rigidBodies.push( cube.physics );
		
		//add to physics world
		physicsWorld.addRigidBody( cube.physics );
		
		//add to our index used to update clients about objects that have moved
		/*IMPORTANT: AddToRigidBodiesIndex expects that obj.physics is an Ammo object.  NOT the values sent used in the blueprint to build the object*/
		AddToRigidBodiesIndex(cube);
		
		//associate the player's socketID with it's object in rigidBodies
		PlayerIndex[uniqueID] =  cube;
		
		//add player to worlds of other players and self
		io.emit('newPlayer', {[uniqueID]:rigidBodiesIndex[cube.id]});
		
}


function RemoveAPlayer(uniqueID){
	
	var RB_id = PlayerIndex[uniqueID].id;
	
	//remove from our rigidbodies holder
	for(var i=0;i < rigidBodies.length;i++){
		//the construction of 'ids' in this whole server setup is WACKED! can lead to major headachs.  fix at some point
		if(RB_id === 'id'+rigidBodies[i].ptr.toString() ){
			console.log("REMOVING:", RB_id)
			//remove player from the physical world
			physicsWorld.removeRigidBody( rigidBodies[i] );
			//remove player from rigidbodies
			rigidBodies.splice(i,1);
			//remove from our rigidbodies index
			delete rigidBodiesIndex[RB_id]
			//remove from player inded
			delete PlayerIndex[uniqueID]
	
		}
	}
	

	//tell everyone to delete players cube
	io.emit('removePlayer', RB_id);

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
	
	
	socket.on('disconnect', function(){
		console.log('playerleft: ', this.id)
		RemoveAPlayer(this.id);
	});
	
	//log
	console.log('new user');
	console.log('session ID: ',socket.id);
	
	//send the new connection their uniqueID, which happens to be their socketID
	io.to(socket.id).emit('playerID', socket.id);
	
	//create a player instance
	AddAPlayer(socket.id);
	
	//get current state of everything, build specs and send out		
	BuildWorldStateForNewConnection();
	
	//on first connection begin physics sim
	if(!PhysicsSimStarted){
		render();
	}
	
	PhysicsSimStarted = true;
	
	socket.on('getMyObj',function () {	
		socket.emit('yourObj',PlayerIndex[this.id].id)
	});
	
   socket.on('moveClose',function (thrust) {	
				  vector3Aux1.setX(thrust.x);
				  vector3Aux1.setY(thrust.y);
				  vector3Aux1.setZ(thrust.z);
				  PlayerIndex[this.id].physics.applyCentralImpulse(vector3Aux1);	 
	});
	socket.on('moveLeft',function () {	
		PlayerIndex[this.id].physics.applyTorque(new Ammo.btVector3(0, 3,0 ));
	});
	socket.on('moveRight',function () {	
		PlayerIndex[this.id].physics.applyTorque(new Ammo.btVector3(0,-3,0 ));
	});
	socket.on('moveAway',function (thrust) {	
	
				  vector3Aux1.setX(thrust.x);
				  vector3Aux1.setY(thrust.y);
				  vector3Aux1.setZ(thrust.z);
				  PlayerIndex[this.id].physics.applyCentralImpulse(vector3Aux1);
	});
	
	socket.on('moveBrake',function (msg) {	
		console.log(msg)

	});
	
});


http.listen(port,ip, function(){
	console.log('listening on port: '+port);
	console.log('serving files from root: '+__dirname);
	});		
