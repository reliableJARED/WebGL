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

//var ip = '192.168.1.101'
var ip = '192.168.1.102'
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
app.use(serveStatic(__dirname + '/static/images/'))

//GLOBAL Physics variables
var physicsWorld;
var gravityConstant = -9.8
var rigidBodies =  new Array();
var rigidBodiesIndex = new Object();//holds info about world objects.  Sent to newly connected clients so that they can build the world.  Similar to ridgidBodies but includes height, width, depth, color, object type.
var clock;									//info that is only needed when a newly connected player first builds the world
	

					
GameClock = function () {
	this.startTime = Date.now();
	this.oldTime = Date.now();
	this.timeToSendUpdate = false;
};


GameClock.prototype.getDelta = function () {
	var delta = 0;
	var newTime = Date.now();
	//convert from mili seconds to secons 
	delta = 0.001 * ( newTime - this.oldTime );
	this.oldTime = newTime;
	this.timeToSendUpdate += delta;
	return delta;
};

GameClock.prototype.start = function () {
	this.startTime = Date.now();
	this.oldTime = Date.now();
};
GameClock.prototype.UpdateTime = function () {
	var update = Boolean(this.timeToSendUpdate > 1);	
	if(update)this.timeToSendUpdate = 0;
	return update;
}
									
var PlayerIndex = new Object();//matches a player's ID to their rigidBodiesIndex object
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var transformAux1 = new Ammo.btTransform();//reusable transform object
var PhysicsSimStarted = false;
var vector3Aux1 = new Ammo.btVector3(); //reusable vector object
var quaternionAux1 = new Ammo.btQuaternion(); //reusable quaternion object

function initPhysics() {
	
		clock = new GameClock(); 

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
			w : 2000,
			h : 1,
			d : 2000,
			shape:'box',
			color: "rgb(30%, 40%, 30%)",
			texture:'moon.png',
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
				Rw:rot.w(),
				w:obj.w, 
				h:obj.h, 
				d:obj.d, 
				mass:obj.mass, 
			    shape:obj.shape,
			    color:obj.color,
			    texture:obj.texture
			};
}


//the object returned from createPhysicalCube has places the Ammo object under the property 'physics'
//the x,y,z,Rx,Ry,Rz props are deleted and a new prop 'physics' is created.
function createPhysicalCube (blueprint){
	
	//need error handling and default values
	var sx = blueprint.w
	var sy =  blueprint.h
	var sz =  blueprint.d
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

function updatePhysics( deltaTime, timeForUpdate ) {
	/* http://www.bulletphysics.org/mediawiki-1.5.8/index.php/Stepping_The_World */
	physicsWorld.stepSimulation( deltaTime,10);//Bullet maintains an internal clock, in order to keep the actual length of ticks constant

	if (timeForUpdate)emitWorldUpdate(); 
	
	//use setTimeout()To schedule execution of a one-time callback after delay milliseconds.
	setTimeout( TickPhysics, 15 );//milisecond callback timer
};


function emitWorldUpdate() {
		
		var propsPerObj = 8;
		var objectCount = 0;
		var dataToSend = new Array();
		
		//this function will create a tree of objects that need to be updated due to Physics simulation
		//the structure is that ObjectUpdateJSON has a bunch of properties which are the ID's of the objects.  
		//Each object branch will be an object that changed and it's new XYZ, rotation X,Y,Z for the objects. 
		//clients hold a matching representation of the physics object using the ID's in their presented graphics.

		// check for rigidbodies that are in motion (changed) since last stepSimulation
		for ( var i = 0; i < rigidBodies.length; i++ ) {
		
			var obj = rigidBodies[ i ];
			var ms =  obj.getMotionState();
	  

			if ( ms ) {
				//assign obj's ID to it's starting index position
				dataToSend[objectCount*propsPerObj] = obj.ptr;
				
				
				//Bullet calls getWorldTransform with a reference to the variable it wants you to fill with transform information
				ms.getWorldTransform( transformAux1 );//note: transformAux1 =  Ammo.btTransform();
				
				//get the physical location of our object
				var p = transformAux1.getOrigin();
				//assign position info to it's proper index location relative to objs data start point
				dataToSend[(objectCount*propsPerObj)+1] = p.x();
				dataToSend[(objectCount*propsPerObj)+2] = p.y();
				dataToSend[(objectCount*propsPerObj)+3] = p.z();
				

				//get the physical orientation of our object
				var q = transformAux1.getRotation();
				//assign orientation info to it's proper index location relative to objs data start point
				dataToSend[(objectCount*propsPerObj)+4] = q.x();
				dataToSend[(objectCount*propsPerObj)+5] = q.y();
				dataToSend[(objectCount*propsPerObj)+6] = q.z();
				dataToSend[(objectCount*propsPerObj)+7] = q.w();

				/**********************************************************************/
				/* NOT SENDING Angular or Linear velocity right now */
				//get the angularvelocity of the object
				//var Av = obj.getAngularVelocity();
				//Av.x()
				//Av.y()
				//Av.z()

				//get the linearvelocity of the object
				//var Lv = obj.getLinearVelocity();
				//Lv.x()
				//Lv.y()
				//Lv.z()	
				/**********************************************************************/				
			objectCount++;
		};
	};
	
	//we need: 8 Float32(4 bytes) PER Object.  dataToSend.length x 4 gives total bytes needed
	//var byteCount = dataToSend.length *4;
	
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
	//var buffer = new ArrayBuffer(byteCount);

	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#Syntax
	//var binaryData   = new Float32Array(buffer);
	var binaryData = new Float32Array(dataToSend);
	
	//pack up the data as Float32
	//check if this is even needed.... can we just send dataToSend directly?
	//for(var ii=0; ii < dataToSend.length; ii++){
	//	binaryData[ii] = dataToSend[ii];
	//};
	var buff = Buffer.from(binaryData.buffer)
	//console.log("binaryData type",typeof binaryData)
	//console.log("binaryData byteLength",binaryData.byteLength)
	
	//console.log("dataToSend type",typeof dataToSend)
	//console.log("dataToSend length",dataToSend.length)
	
	//send out he data with a time stamp in UTC time
	io.emit('U', {time:clock.oldTime,data:buff} );
}

function TickPhysics() {
	   var deltaTime = clock.getDelta();
	   var sendUpdate = clock.UpdateTime();//bool that is true every second
	   updatePhysics( deltaTime,sendUpdate );
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
			rigidBodiesIndex[lookUp].Rw = q.w();
		
			world.push(rigidBodiesIndex[lookUp]);
		}
		catch(err){
			console.log(err)
			delete rigidBodiesIndex[lookUp]}
	}
	
	//create a time stamp
	var time = Date.now();
	
	/*IMPORTANT: See SO link above.  Can't send rigidBodiesIndex directly, had to copy to new array.  */	
	io.emit('setup',{[time]:world});
	
	
	/**** BUILDING SYSTEM FOR BINARY PARALLEL TO JSON  ****/
	
	var Count = rigidBodies.length * 8;//we need: 8 float 32(4bytes) PER Object
	
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#Syntax
	var binaryData   = new Float32Array(Count);
	
	
	for(var i = 0; i < rigidBodies.length; i++){
		
		//server is using regular javascript Object to track objects.  The rigidBodiesIndex is an object map
		//of the world with an objects ptr ID converted to string as the way to find it.
		var ptrID = rigidBodies[i].ptr;
		var lookUp = 'id'+ptrID.toString();
		
		//First float in our array will be the ID
		binaryData[8*i] = ptrID;
		
		try{
			var obj =  rigidBodies[i]
			
			obj.getMotionState().getWorldTransform( transformAux1 )
			
			//get the physical orientation and location of our object
			var p = transformAux1.getOrigin();
			binaryData[(8*i)+1] = p.x();	
			binaryData[(8*i)+2] = p.y();
			binaryData[(8*i)+3] = p.z();
				
			var q = transformAux1.getRotation();
			binaryData[(8*i)+4] = q.x();
			binaryData[(8*i)+5] = q.y();
			binaryData[(8*i)+6] = q.z();
			binaryData[(8*i)+7] = q.w();
		
		}
		catch(err){
			console.log(err)
			delete rigidBodiesIndex[lookUp]}
	}
	//https://nodejs.org/api/buffer.html#buffer_class_method_buffer_from_buffer
	//http://stackoverflow.com/questions/15040126/receiving-websocket-arraybuffer-data-in-the-browser-receiving-string-instead
	
	var buff = Buffer.from(binaryData.buffer);
	
	console.log(buff)
	console.log(buff.length)
	console.log(Buffer.isBuffer(buff))

	io.emit('binary',buff);
	
	//test of sending hex color info as float32 not int.  The reason is
	//to make transmision of objs data all single format
	var binaryDataHex   = new Float32Array(3);
	//sending code for white [255,255,255]
	binaryDataHex[0] =255
	binaryDataHex[1] =255
	binaryDataHex[2] =255
	var buffHex = Buffer.from(binaryDataHex.buffer);
	io.emit('binary',buffHex);
	
}

function AddPlayer(uniqueID){
	
	//uniqueID is SocketID
	
		//random start position for new player
		//create random location for our tower, near other blocks
	   var randX =  Math.floor(Math.random() * 20) - 10;
	   var randZ =  Math.floor(Math.random() * 20) - 10;
	
		var cubeObjBlueprint = {
			w : 2,
			h : 2,
			d : 2,
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

function FireShot(player){
	
		//random start position for new player
		//create random location for our tower, near other blocks
	   var randX =  Math.floor(Math.random() * 20) - 10;
	   var randZ =  Math.floor(Math.random() * 20) - 10;
	
		var cubeObjBlueprint = {
			w : .5,
			h : .5,
			d : .5,
			mass : 10,
			shape:'box',
			color:"rgb(100%, 0%, 0%)",
			x: player.x,
			y: player.y+2,
			z: player.z,
			Rx: 0,
			Ry: 0,
			Rz: 0
		}
		
		//build the object
		var cube = createPhysicalCube(cubeObjBlueprint);
		
		//create a vector to apply shot force to our bullet
		vector3Aux1.setX(player.Fx);
		vector3Aux1.setY(player.Fy);
		vector3Aux1.setZ(player.Fz);
		
		//apply the movement force of the shot
		cube.physics.applyCentralImpulse(vector3Aux1)

		//keep the cube always active		
		cube.physics.setActivationState(4);

		//add to our physics object holder
		rigidBodies.push( cube.physics );
		
		//add to physics world
		physicsWorld.addRigidBody( cube.physics );
		
		//add to our index used to update clients about objects that have moved
		/*IMPORTANT: AddToRigidBodiesIndex expects that obj.physics is an Ammo object.  NOT the values sent used in the blueprint to build the object*/
		AddToRigidBodiesIndex(cube);

		/*pass the vector that created the force of the shot to clients so they can start simulating movement of the cube.*/
		var shot = rigidBodiesIndex[cube.id];
		shot.Fx = player.Fx;
		shot.Fy = player.Fy;
		shot.Fz = player.Fz;
		//console.log(shot)
		
		//add shot to worlds of other players and let them know who shot it
		io.emit('shot', {[player.uid]:shot});
		
		//remove shot from world in 5000 mili seconds
		setTimeout(function () { RemoveObj(cube.id)},5000);
		
}

var move ={
	   applyCentralImpulse: 1,         
		applyTorqueImpulse: 2,       
		applyTorque: 4,       
		applyCentralForce: 8,      
			}				
							
function PlayerMove(ID,data){
	
	//data is a buffer of 16 bytes, 
	//bytes 0-4 code for type of movement	
	//bytes 4-16 code, x, y,z
	if(move.applyCentralImpulse & data.readUInt8(0) ){
				
				vector3Aux1.setValue(data.readFloatLE(4),data.readFloatLE(8),data.readFloatLE(12));
				PlayerIndex[ID].physics.applyCentralImpulse(vector3Aux1);
		}
	else if (move.applyTorqueImpulse & data.readUInt8(0)) {
		
				vector3Aux1.setValue(data.readFloatLE(4),data.readFloatLE(8),data.readFloatLE(12));
				PlayerIndex[ID].physics.applyTorqueImpulse(vector3Aux1);
	
	}else if (move.applyTorque & data.readUInt8(0)) {
		
				vector3Aux1.setValue(data.readFloatLE(4),data.readFloatLE(8),data.readFloatLE(12));
				PlayerIndex[ID].physics.applyTorque(vector3Aux1);
		
	}else if (move.applyCentralForce & data.readUInt8(0)) {
		
				vector3Aux1.setValue(data.readFloatLE(4),data.readFloatLE(8),data.readFloatLE(12));
				PlayerIndex[ID].physics.applyCentralForce(vector3Aux1);
	}
	
	 io.emit('I',{[PlayerIndex[ID].id]:data});
}


function RemoveObj(RB_id) {
	/* DUPLICATE WARNING RemoveAPlayer does 99% the same, merge them, D.N.R.Y.S. */
	
	//remove from our rigidbodies holder
	for(var i=0;i < rigidBodies.length;i++){
		
		/*the construction of 'ids' in this whole server setup is WACKED! can lead to major headachs.  FIX.  the term ID is being used to describe both the ptr id assigned from physics engin and the id assigned to a socket. not to mention the concatination of 'id' to the front of a ptr id since ptr's are integers*/
		
		if(RB_id === 'id'+rigidBodies[i].ptr.toString() ){
		//	console.log("REMOVING:", RB_id)
			//remove player from the physical world
			physicsWorld.removeRigidBody( rigidBodies[i] );
			//remove player from rigidbodies
			rigidBodies.splice(i,1);
			//remove from our rigidbodies index
			delete rigidBodiesIndex[RB_id]
			
		}
	}
	
	//tell everyone to delete object
	io.emit('rmvObj', RB_id);
}

function RemoveAPlayer(uniqueID){
	
	var RB_id = PlayerIndex[uniqueID].id;
	
	RemoveObj(RB_id)
	
	//remove from player inded
	delete PlayerIndex[uniqueID]

	//tell everyone to delete players cube
	io.emit('removePlayer', RB_id);

}

function playerResetFromCrash(uniqueID){
	
	    var player = PlayerIndex[uniqueID];
		
	    //clear forces
		player.physics.setLinearVelocity(new Ammo.btVector3(0,0,0));
		player.physics.setAngularVelocity(new Ammo.btVector3(0,0,0));
		
		//reset location and orientation
		//create random location for our tower, near other blocks
	    var randX =  Math.floor(Math.random() * 20) - 10;
	    var randZ =  Math.floor(Math.random() * 20) - 10;
		 var Y = 0;
		vector3Aux1.setValue(randX,Y,randZ);
		quaternionAux1.setValue(0,0,0,1);
		
		player.physics.setWorldTransform(new Ammo.btTransform(quaternionAux1,vector3Aux1));
}

//setup physics world	
initPhysics();
createObjects();


//serve HTML to initial get request
app.get('/', function(request, response){
	response.sendFile(__dirname+'/node_static/mulitplayer_game1.html');
});

/*
Good resource:
http://buildnewgames.com/optimizing-websockets-bandwidth/
*/

//socketio listener for 'connection'
io.on('connection', function(socket){
	
	
	socket.on('disconnect', function(){
		console.log('playerleft: ', this.id)
		RemoveAPlayer(this.id);
	});
	
	//log
	console.log('*****'+Date.now()+'*****');
	console.log('new user');
	console.log('Socket ID: ',socket.id);
	console.log('IP: '+socket.request.connection.remoteAddress);
	console.log('**********');
	
	//send the new connection their uniqueID, which happens to be their socketID
	io.to(socket.id).emit('playerID', socket.id);
	
	//create a player instance
	AddPlayer(socket.id);
	
	//get current state of everything, build specs and send out		
	BuildWorldStateForNewConnection();
	
	//on first connection begin physics sim
	if(!PhysicsSimStarted){
		clock.start();
		TickPhysics();
	}
	
	PhysicsSimStarted = true;
	
	socket.on('getMyObj',function () {	
		socket.emit('yourObj',PlayerIndex[this.id].id)
	});
	
	
	socket.on('ACI',function (msg) {	
			/*SWITCH TO USING USE PROPS FOR VALUES not HARDCODED or PLAYER provided*/
			PlayerMove('ACI',this.id,msg);	  
		});
		
	socket.on('ATI',function (msg) {	
			/*SWITCH TO USING USE PROPS FOR VALUES not HARDCODED or PLAYER provided*/
			PlayerMove('ATI',this.id,msg);	  
		});
	socket.on('ACF',function (msg) {	
			/*SWITCH TO USING USE PROPS FOR VALUES not HARDCODED or PLAYER provided*/
			PlayerMove('ACF',this.id,msg);	  
		});
	socket.on('AT',function (msg) {	
			/*SWITCH TO USING USE PROPS FOR VALUES not HARDCODED or PLAYER provided*/
			PlayerMove('AT',this.id,msg);	  
		});

	socket.on('S',function (msg) {	
		
		var player = PlayerIndex[this.id];

		//slow velocity
		vector3Aux1.setValue(msg.LVx,msg.LVy,msg.LVz);
		player.physics.setLinearVelocity(vector3Aux1);
	
		//slow rotation
		vector3Aux1.setValue(msg.AVx,msg.AVy,msg.AVz);
		player.physics.setAngularVelocity(vector3Aux1)
		
		//tell everyone of the change
		 io.emit('S',{[player.id]:msg});
	});
	
	socket.on('fire',function (msg) {	
	    //console.log(msg)
		FireShot(msg);
	});
	
	socket.on('resetMe',function(){
		playerResetFromCrash(this.id);
	});
	
	
	socket.on('binary',function(data){
		//console.log(":",data)
		//console.log("::",data.byteLength) 
		//console.log(":::",data.buffer) 
		//console.log("::::",Buffer.isBuffer(data))	//confirm it's binary data
		//var view = new Float32Array(data.readFloatLE())
		//console.log(view)
		//console.log(view[0])
		//console.log(data.readFloatLE(0))
		//console.log(data.readFloatLE(4))
		
	});
	
	//player input handler
	socket.on('I',function(data){
		//controler button
		//console.log("button ",data.readUInt8(0))
		//controller side
		//console.log("controller ",data.readUInt8(1))
		//x
		//console.log("x ",data.readFloatLE(4))
		//y
		//console.log("y ",data.readFloatLE(8))
		//z
		//console.log("z ",data.readFloatLE(12))
		
		PlayerMove(this.id,data);	  
		
	});
	
});


http.listen(port,ip, function(){
	console.log('listening on port: '+port);
	console.log('serving files from root: '+__dirname);
	});		
