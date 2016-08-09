"use strict";
//GLOBAL General variables
var mouse = new THREE.Vector2();
var clock = new THREE.Clock();
var container; //DOM location
var mouseIntersects;
var ground;
var PlayerCube;
var SELECTED;
var HIGHLIGHT;
var SpaceBarDown;
var keysDown =[];
var ForceThreshold = 1;//used in collision consequence functions
var rigidBodyPtrIndex ={}; //used to assocaite a ammo.js assigned ptr property with an object in our world
var gui_buttons =[];

//GLOBAL Graphics variables
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 ); 
var scene = new THREE.Scene(); 
var renderer = new THREE.WebGLRenderer();
var raycaster = new THREE.Raycaster();
var controls;
var gui_canvas,gui_ctx,GUI_helper_icon;

//GLOBAL Physics variables
var physicsWorld;
var gravityConstant = -9.8;
var rigidBodies = [];
var OnScreenBodies =[];
var rigidBodies_uuid_lookup ={};
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver,softBodySolver;
var transformAux1 = new Ammo.btTransform();
var PHYSICS_ON = true;


//MAIN
init();// start world building
animate(); //start rendering loop

function init() {
	
		container = document.getElementById( 'container' );
		
		initGraphics();
		initPhysics();
		createObjects();
		initInput();
		
		// create the canvas element for our GUI
		gui_canvas = document.createElement("canvas");
		gui_ctx = gui_canvas.getContext("2d");
		gui_canvas.setAttribute('id','GUI');
		gui_canvas.setAttribute( 'style','position: absolute; left: 0; top: 0; z-index: 0;');
		gui_canvas.width = window.innerWidth;
		gui_canvas.height = window.innerHeight ;
		
		//build the GUI
		GUI;
		
		var info = document.createElement( 'div' );
				info.style.position = 'absolute';
				info.style.top = '10px';
				info.style.width = '100%';
				info.style.textAlign = 'center';
				info.innerHTML = '<b>Click + Hold</b> to Drag and move cubes<br>Press <b>Spacebar</b> for thrust<br><br>If your impact is larger than 50 newtons your cube will break!<br>Over 20 newtons breaks red cubes<br>Hold <b>F</b> to follow cube with camera  ';
		
		var force =  document.createElement( 'div' );
				force.setAttribute('id','force');
				force.style.width = '100%';
				force.style.textAlign = 'center';
		
				
		info.appendChild( force );	
		container.appendChild( info );	
		
		
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );
		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		
		document.addEventListener( 'keydown', onDocumentKeyDown, false );
		document.addEventListener( 'keyup', onDocumentKeyUp, false );
		
		//document.getElementById('makeCube').onclick = clickCreateCube;
		
		//Use the dispatcher to find objects in state of collision
		console.log(ground);
		console.log(dispatcher.getManifoldByIndexInternal(0))
		console.log(dispatcher.getManifoldByIndexInternal(0).getBody0())
		
		console.log(ground.userData.physics.ptr);//Use as a UNIQUE ID
		
		var bd1 = dispatcher.getManifoldByIndexInternal(0).getBody0();
		var bd2 = dispatcher.getManifoldByIndexInternal(0).getBody1();
		if (bd1 == ground.userData.physics){
			console.log("true");
		}
		if (bd2 == ground.userData.physics){
			console.log("true");
		}
		console.log(dispatcher.getManifoldByIndexInternal(0).getBody1())
		var example = dispatcher.getManifoldByIndexInternal(0).getBody0().getWorldTransform()
		console.log(example)
		console.log(example.getOrigin())
		console.log(dispatcher.getManifoldByIndexInternal(0).getContactPoint())
		console.log(dispatcher.getManifoldByIndexInternal(0).getContactPoint().getAppliedImpulse())
		console.log(dispatcher.getNumManifolds())
		
		
}


//ADD BUTTON TO GUI		
		/* TODO:
		make this proper function that accepts Display name and what should happen when clicked.  For now just default all buttons to same size
		*/
function makeGUIButton(gui_x,gui_height,gui_y,gui_width,guiFramePadding,name) {
	//check how many buttons we have, this determines where our new buttons position is
	//as buttons are added right to left with 10 max
	var buttonCount = Object.keys(gui_buttons);
	var rShift = buttonCount.length;
	
			gui_ctx.beginPath();
			//note for button_w: x is already shifted 'guiFramePadding' so need to shift back that 'guiFramePadding' plus 'gui_width' on width to make equal border in gui frame
			var button_w = gui_width*.1;
			var button_h = gui_height-guiFramePadding*2;
			var button_x =gui_x+guiFramePadding+(rShift*(button_w+guiFramePadding))
			var button_y =gui_y+guiFramePadding;
			
			//draw the button rect
			gui_ctx.rect( button_x, button_y,button_w,button_h);
			//add the button to our global container
			gui_buttons[name] = ({x:button_x ,y:button_y,w:button_w,h:button_h});
			//color the button
			gui_ctx.fillStyle = "red";
			gui_ctx.fill();
			//add text
			gui_ctx.fillStyle = "white";
			gui_ctx.font="20px Georgia";
			gui_ctx.fillText(name,button_x,button_y+button_h,button_w);
			
		}


//CREATE an onscreen display GUI
var GUI = (function () {
		
		var container = document.getElementById( 'container' );
		
		// create the canvas element, covers the whole screen
		gui_canvas = document.createElement("canvas");
		gui_ctx = gui_canvas.getContext("2d");
		gui_canvas.setAttribute('id','GUI');
		gui_canvas.setAttribute( 'style','position: absolute; left: 0; top: 0; z-index: 0;');
		gui_canvas.width = window.innerWidth;
		gui_canvas.height = window.innerHeight ;
		
		//don't use pixels as reference because scaling will be bad, use % of screen size.
		var width1 = window.innerWidth *.01//1% of screen width
		var height1 = window.innerHeight *.01//1% of screen height
		
		//GUI FRAME
		//x,y for top left corner then height width
		//.rect(x,y,width,height)
		var gui_x = gui_canvas.width-(width1*75); //starts 25% in from left screen edge
		var gui_y = gui_canvas.height-(height1*15);//starts 15% up from bottom screen edge
		var gui_width = width1*50;//50% of screen width
		var gui_height = height1*15;//15% of screen height
		var guiFramePadding =width1*1;//border padding 1% of screen width
		
		//now that we have coordinates, draw the background box for the GUI
		gui_ctx.beginPath();
		gui_ctx.rect(gui_x,gui_y, gui_width,gui_height);
		gui_ctx.fillStyle = "gray";
		gui_ctx.fill();
		
		var name = 'Make Cube'
		makeGUIButton(gui_x,gui_height,gui_y,gui_width,guiFramePadding,name);
		name = 'THRUST'
		makeGUIButton(gui_x,gui_height,gui_y,gui_width,guiFramePadding,name);
		/***************************
		TODO:
		create a frame to hold x number of buttons inside the GUI
		Also make a 'tab' on the top to cycle through.
		then create syntax tab:position to know what button was clicked
		****************************/
		//HELPER ICON
		var rollOverGeo = new THREE.BoxGeometry( 2, 2, 2 );
		var rollOverMaterial = new THREE.MeshBasicMaterial( { color: "rgb(0%,0%,100%)", opacity: 0.5, transparent: true } );
		GUI_helper_icon = new THREE.Mesh( rollOverGeo, rollOverMaterial );
		GUI_helper_icon.visible = false;
		GUI_helper_icon.userData.make = false;
		scene.add( GUI_helper_icon ); 
		    
		
		
		//note that gui_canvas is technically the size of our screen NOT the size of the GUI menu display
		//correct the x,y notation so that it is relevent to the GUI menu not the whole screen
		function getMousePos(canvas, evt) {
			gui_canvas.getBoundingClientRect();//returns the current location of the mouse cursor in the canvas.
			return {
        	//correct points to be in relation to our GUI menu and return
			x: evt.clientX - gui_x,
			y: evt.clientY - gui_y
			};
      }
		
		
      		//ADD CLICK HANDLER FOR BUTTON
		/*TODO:
			should be able to pass the fuction you want triggered to the makeGUIButton()
			and have it assigned*/
		gui_canvas.addEventListener('mousedown', function(event) {
			
		event.preventDefault();//only our GUI should get click, not lower canvas
			
		var mousePos = getMousePos(gui_canvas, event);
			
		//	console.log( mousePos.x + ',' + mousePos.y);
			console.log(gui_buttons);
		//check that the mouse is over our GUI	
      	 if ((mousePos.x >guiFramePadding) && 
      	 		(mousePos.x <gui_width-guiFramePadding) &&
       			(mousePos.y > guiFramePadding ) && 
       			(mousePos.y< (gui_buttons[name].h+guiFramePadding)) ){			
       				clickCreateCube(event);
					
		//			console.log('make cube clicked')
					//GUI_helper_icon.visible = true;
       				
       				};
      }, false);

      //ADD FINISHED GUI
		container.appendChild( gui_canvas );	
})();


function initGraphics() {

    camera.position.x = 0;
	camera.position.y = 10;
    camera.position.z =  -20;
					
	renderer.setClearColor( 0xf0f0f0 ); 
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight ); 
	
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
	
				//think of the light source as a camera.  Like the camera we have two planes, or Frustum's which bisect the pyramid of light coming from our source.  shadowCameraNear is the fustum closest to the light, shadowCameraFar is the fustum furthest from the light source.  Anything outside of this will not receive shadow from our light source.
				
			    light.shadowCameraNear = 2;
			    light.shadowCameraFar = 50;
				
				//adjust shadowMapWidth and shadowMapHeight to change resolution of the shadow.  use powers of 2 (if you don't it will still work, but just use ^2)
			    light.shadowMapWidth = 1024;
			    light.shadowMapHeight = 1024;
				
				//shadowDarkness should tune the opacity 0 - 1, but doesn't see to have an affect
			    light.shadowDarkness = .5;
				
				
    scene.add( light );
    				
    container.appendChild( renderer.domElement );
	
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


/* makes and returns a red cone graphic*/
function redCone() {
		var geometry = new THREE.ConeGeometry( 1,3, 32 );
		var material = new THREE.MeshBasicMaterial( {color: "rgb(90%, 5%, 5%)"} );
		var cone = new THREE.Mesh( geometry, material );
		
		/*add our flame to the scene.  note that just adding parent object won't work. also don't add it to the physics world.  it's for decoration only!*/
		
		scene.add( cone );
		return cone;
}

/*describes how an object will break, and at what level of force (newtons)*/
function breakApart(force){
	this.force = force;
};


breakApart.prototype.now = function(obj,impactForce){
	
	//get some object properties from our broken object
	var depth = obj.geometry.parameters.depth;//x length 
	var height = obj.geometry.parameters.height;//y length 
	var width = obj.geometry.parameters.width;//z length 
	var mass = obj.userData.mass;
	var rubbleMass = mass/(depth+height+width);
	var force = impactForce/(depth+height+width);
	var material = obj.material;

	//we want our rubble in the same position as our object that is breaking
	var pos = obj.position;// used to hold our position THREE.Vector3()
	var quat = obj.quaternion;//original objects orientation THREE.Quaternion()
	
	//destroy all parts of the object and remove from world
	destroyObj(obj);
	
	//now make rubble in the objects place
	//The rubble will be propotionally sized cubes based on the original objects size
	//such that the original object breaks into 8 smaller pieces if it's a cube.
	var frac = 2;
	//three nested loops will create the rubble
	//inner loop lays blocks in a row
	//mid loop starts a new column
	//outer loop starts new layer
	for (var h=0;h<frac;h++) {
				
		for (var w=0;w<frac;w++) {
		
			for(var d =0; d<frac;d++){
			
				//create a rubble object,
				var rubble = REALbox(depth/frac,height/frac,width/frac,rubbleMass,pos,quat,material);
				
				//apply force to our piece of rubble		
				// in random directions
				var rd_X = Math.random() < 0.5 ? -1 : 1 ;
				var rd_Y = Math.random() < 0.5 ? -1 : 1 ;
				var rd_Z = Math.random() < 0.5 ? -1 : 1 ;
				
				//apply impact force to our rubble
				rubble.userData.physics.applyCentralImpulse(new Ammo.btVector3( force*rd_X,force*rd_Y,force*rd_Z ));	
				
				//set to ACTIVE so the pieces bounce around
				//rubble.userData.physics.setActivationState(1);
				
				//add rubble to world
				physicsWorld.addRigidBody(rubble.userData.physics);
				rigidBodies.push(rubble);
				scene.add(rubble);

				//Add a random 1-5 sec delay b4 new rubble object is removed from world
				var delay =  Math.random() * 4000 + 1000;
		
				//add self destruct to the rubble so it will be removed from world after delay time
				destructionTimer(rubble,delay);	
				//add to pos, used in the placement for our next rubble block being created	
				pos.addVectors(pos,new THREE.Vector3(depth/frac,0,0));//+X dimention
			}
			//reset our X axis
			pos.subVectors(pos,new THREE.Vector3(frac,0,0));
			//Start our new row, create each new block Z over
			pos.addVectors(pos,new THREE.Vector3(0,0,width/frac));//+Z dimention
		}
		//reset our Z axis
		pos.subVectors(pos,new THREE.Vector3(0,0,frac));
		//start the new grid up one level
		pos.addVectors(pos,new THREE.Vector3(0,height/frac,0));//+Y	dimention
	}
	
	
	
}


function createObjects() {
		
		//properties used to make objects
		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg
		var pos = new THREE.Vector3(0,10,0);	
		var quat = new THREE.Quaternion();
		
		
		//create a graphic and physic component for our cube
		PlayerCube = REALbox(x,y,z,mass,pos,quat);
		
		console.log(PlayerCube);//inspect to see whats availible
		console.log(PlayerCube.userData.physics.getUserPointer());
		console.log(PlayerCube.userData.physics.getUserIndex());
		/*create a new graphic object inside our cube.  we will
		make the 'flame' graphic for our rocket cube!*/
		PlayerCube.userData.flame = redCone();
		
		//set some props for our 'flame' we don't wan't it always on. Only when the cube is 'blasting off'
		PlayerCube.userData.flame.visible = false;//three.js visibility prop for an object
		
		//set force (newtons) that breaks our object
		PlayerCube.userData.breakApart = new breakApart(50);
				
		//add our cube to our array, scene and physics world.
		rigidBodies.push(PlayerCube);
		scene.add( PlayerCube );
		physicsWorld.addRigidBody( PlayerCube.userData.physics );
		console.log(PlayerCube.userData.physics.getUserPointer());
		//recycle pos and use for the ground's location
		pos.set( 0, - 0.5, 0 );
		//create object for our ground, but define the materialmeshs and color.  Don't use the default inside of createGraphicPhysicsBox()
		//IMPORTANT! we are passing a mass = 0 for the ground.  This makes it so the ground is not able to move in our physics simulator but other objects can interact with it.
		ground = new REALbox(20,1,20,0,pos,quat,new THREE.MeshBasicMaterial( { color: "rgb(0%, 50%, 50%)"}) );
		
		//add the ground to our array, scene and physics world.
		rigidBodies.push(ground);
		scene.add( ground );
		physicsWorld.addRigidBody( ground.userData.physics );
		
		
		//create our helper image of where user is moving the cube
		var HIGHLIGHTGeo = new THREE.BoxGeometry( 2, 2, 2 );
		var HIGHLIGHTMaterial = new THREE.MeshBasicMaterial( { color: "rgb(0%,100%,0%)", opacity: 0.5, transparent: true } );

		HIGHLIGHT = new THREE.Mesh( HIGHLIGHTGeo, HIGHLIGHTMaterial );
		HIGHLIGHT.visible = false;
		
		//note we don't want physics for this obj, it's just a helper so don't need to have it in physics world or rigidbodies.
		scene.add( HIGHLIGHT );
		
	
}



/* REALbox()
input: dimentions of a box, mass, position in world, orientation in world and material type.
output: box object which has a graphic component found and a physics component found in obj.userData.physicsBody
*/
function REALbox (sx, sy, sz, mass, pos, quat, material){
	//GRAPHIC COMPONENT
	/***************************************************************/
	var geometry = new THREE.BoxGeometry(sx, sy, sz );
	
	material = material || new THREE.MeshBasicMaterial( { color: "rgb(34%, 34%, 33%)"} );
	
	var box = new THREE.Mesh(geometry, material);
	
	//PHYSICS COMPONENT	/******************************************************************/
	var physicsShape = new Ammo.btBoxShape(new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	
	//set the collision margin, don't use zero, default is typically 0.04
	physicsShape.setMargin(0.04);
	
	var transform = new Ammo.btTransform();
	
	//"SetIdentity" really just sets a safe default value for each of the data members, usually (0,0,0) on a Vector3, and (0,0,0,1) on a quaternion.
	transform.setIdentity();
	
	//we want a custom location and orientation so we set with setOrigin and setRotation
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	
	var motionState = new Ammo.btDefaultMotionState( transform );
	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	
	physicsShape.calculateLocalInertia( mass, localInertia );
	
	//create our final physics body info
	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	
	var ammoCube = new Ammo.btRigidBody( rbInfo );
	/* About prop 'userData'
	this is from three.js  It expects any added props or functions to be here.  so just follow the format it will make life easy.  You can add things where ever you want... this is JS after all.  but things will break down.  for example when you mouse over an object using raycaster.intersectObjects(rigidBodies) an array of Three js objects is returned.  if you want to access properties of the object your mouse is intersecting it's much easier if they are located in 'userData'. That is the whole reason this prop was setup*/
	box.userData.physics = ammoCube;
	box.userData.mass = mass;
	//used in determine if object should break from an impact force
	box.userData.HitHardEnoughToBreak = false;
	//used to record magnitude of impact force that broke the object
	box.userData.CollisionImpactForce = 0;
	
	//used as a lookup for objects using the ammo.js assigned ptr
	var uniquePtrID = box.userData.physics.ptr;
	rigidBodyPtrIndex[uniquePtrID.toString()]=box;
	
	return box;
}


function breakCube(obj,impactForce){
	
	obj.userData.breakApart.now(obj,ground,impactForce);
	
}

//Promise used in the delayed destruction of objects
function destructionTimer(obj,delay) {
	//create promise
    var p1 = new Promise(
    // promise constructor takes one argument, a callback with two parameters, resolve and reject.
        function(resolve, reject) {
        	//create a timer with time = delay
            window.setTimeout( function() {
				//when time is up resolve with the return obj            	
            	resolve(obj);}, delay);
           /*I'm not using a reject condition. but typically a promise would be built with:
           function (resolve,reject) {
           	if (*all good*) {resolve()} else {reject(reason)}*/
        }
    );
    /*
    "then" takes two arguments, a callback for a success case, and another for the failure case. Both are optional.
    Setup as promise.then(*do something*).catch(*do something*) where then() is success, catch() is fail*/
    p1.then(  
        function(obj) {	
        //when promise resolves obj to be destroyed is passed	
			destroyObj(obj);
        });/*
    .catch(
       //reason would have been passed from reject()
        function(reason) {
            console.log(reason);
        });*/
}

function destroyObj(obj){
	//check for any attached mesh and remove.  For example the 'red cone' graphic
	//for the rocket flame.
	var keys = Object.keys(obj.userData);
	for(var i=0; i<keys.length;i++){
		//all THREE (graphic) components to an object will be .type == 'Mesh'
		// other random properties don't matter and don't need to be
		//removed
		if (obj.userData[keys[i]].type  === 'Mesh'){
			scene.remove( obj.userData[keys[i]] );
		}
	}
	//remove object from the visual world
	scene.remove( obj );
	//remove object from the physical world
	physicsWorld.removeRigidBody( obj.userData.physics );
	//remove from our rigidbodies holder
	for(var i=0;i < rigidBodies.length;i++){
		if(obj.uuid === rigidBodies[i].uuid ){
			rigidBodies.splice(i,1);
		}
		
	}
	
}




function onDocumentMouseDown(event){

			event.preventDefault();
			var plane = new THREE.Plane();
			var intersection = new THREE.Vector3();
			

			raycaster.setFromCamera( mouse, camera );
			var intersects = raycaster.intersectObjects( rigidBodies );

			if (intersects.length >0 && intersects[0].object != ground) {
				
				//pause our physics sim
				PHYSICS_ON = false;
				
				controls.enabled = false;
				
				SELECTED = intersects[0];
				/* FIVE Activation States:
				http://bulletphysics.org/Bullet/BulletFull/btCollisionObject_8h.html
				/* IF rigidBody doesn't move it's activation state changed so that it CAN"T move unless hit by object that is active.*/
				//http://bulletphysics.org/Bullet/phpBB3/viewtopic.php?t=9024
				//http://www.bulletphysics.org/Bullet/phpBB3/viewtopic.php?f=9&t=4991&view=previous
				
				SELECTED.object.userData.physics.setActivationState(4);//ALWAYS ACTIVE
				
			}
				
};
function onDocumentMouseMove(event){
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
	
	var intersects = raycaster.intersectObjects( rigidBodies );

	if (intersects.length >0) {
		
		mouseIntersects = intersects[ 0 ];
		
		if (mouseIntersects.object != ground){
			container.style.cursor = 'pointer';}
		else{
			container.style.cursor = 'auto';
			}
		
		//we have selected our cube to move
		if(SELECTED != null){
			
			HIGHLIGHT.visible = true;
			//set the position of the highlight object.  use .add() to add the face of the ground or other objects to the position.
			//this way our highlight will be ontop of what the mouse is pointing at, not inside it.
			HIGHLIGHT.position.copy( intersects[0].point ).add( intersects[0].face.normal );
			SELECTED.object.userData.physics.setActivationState(4);//ALWAYS ACTIVE
		}
	}
}
function onDocumentMouseUp(){
	//resume our physics sim
	PHYSICS_ON = true;

	//turn off our helper icon
	HIGHLIGHT.visible = false;
	
	//reset to normal cursor
	container.style.cursor = 'auto';
	
	//turn the view controls back on now that mouse isn't needed for placement
	controls.enabled = true;
	
	//if the mouseUp is from placement of our block and now from controlling the view
	if (SELECTED != null) {
		//Return to default activation state.  Which means obj will stay active for about 2 seconds then fall asleep unless acted upon by another moving object or force.
		SELECTED.object.userData.physics.setActivationState(1);// NORMAL ACTIVE
		
		//recycle our btTransform() object "transformAux1"
		//we need a btTransform object to creat new points for our block
		transformAux1.setOrigin(new Ammo.btVector3( mouseIntersects.point.x, mouseIntersects.point.y, mouseIntersects.point.z));
		
		/*you can access the blocks location in the world with getWorldTransform, but we want to update it's location so we use setWorldTransform. pass a btTransform() object to our objects setWorldTransform method to change where it is in the world*/
		SELECTED.object.userData.physics.setWorldTransform(transformAux1);
				
		}
		
	SELECTED = null;
		
	return;	
};


function onDocumentKeyDown(event){
	keysDown[event.keyCode] = true;
	//spacebar is down
	if (32 in keysDown){
		SpaceBarDown = true;
		//NOTE: this is a bad way to do things.  I have hard coded the fact that our cube is in position 0 our rigidbodies array. but I'm doing it just for an example.  You would probably want to stick with the concept of 'selecting' an object.  then if spacebar is down and selected.hasOwnProperty('flame') is true apply a forece.  You'd have to change the code used here for 'selected' though because it releases on mouseup.  instead release on mousedown if something if selected != null.
		rigidBodies[0].userData.physics.applyCentralImpulse(new Ammo.btVector3( 0,5,0 ));	
		rigidBodies[0].userData.flame.visible = true;
		rigidBodies[0].userData.physics.setActivationState(4);//ALWAYS ACTIVE
	}
	//if (event.keyCode === 70){
	if (70 in keysDown){
		//CHASE CAMERA
		//0,20,-20
	//	var relativeCameraOffset = new THREE.Vector3(0,PlayerCube.position.y,PlayerCube.position.z);
		var relativeCameraOffset = new THREE.Vector3(0,10,0);
		var cameraOffset = relativeCameraOffset.applyMatrix4( PlayerCube.matrixWorld );
		camera.position.x = cameraOffset.x;
		camera.position.y = cameraOffset.y;
		camera.position.z = cameraOffset.z;
		//camera.lookAt( PlayerCube.position );	    
	}
}

function onDocumentKeyUp(event){
	
	if (event.keyCode === 32){
		delete keysDown[event.keyCode]
	SpaceBarDown = false;
	
	//turn off the jets!
	rigidBodies[0].userData.physics.applyCentralImpulse(new Ammo.btVector3( 0, 0, 0 ));	
	
	//Hide our flame
	rigidBodies[0].userData.flame.visible = false;
	
	//RETURN TO NORMAL STATE
	rigidBodies[0].userData.physics.setActivationState(1);
	}
	if (event.keyCode === 70){
		delete keysDown[event.keyCode]
	}
}

function animate() {
        render();
		requestAnimationFrame( animate );
    };


function render() {
	   var deltaTime = clock.getDelta();

       renderer.render( scene, camera );
	   controls.update( deltaTime );
	   
	  //pause the physics sim if we are moving things around
	  if(PHYSICS_ON){
			updatePhysics( deltaTime );
	  }
	   raycaster.setFromCamera( mouse, camera);
	 //  var intersects = raycaster.intersectObjects( scene.children );			   
	   
 };
	   

function updatePhysics( deltaTime ) {


// Step world
physicsWorld.stepSimulation( deltaTime,10);

//count of object pairs in collision
var collisionPairs = dispatcher.getNumManifolds();

for(var i=0;i<collisionPairs;i++){
	//for each collision pair, check if the impact force of the two objects exceeds our ForceThreshold (global var)
	//this will eliminate small impacts from being evaluated, light resting on the group and gravity is acting on object
	//round the force, don't need float
	var impactForce = Math.floor(dispatcher.getManifoldByIndexInternal(i).getContactPoint().getAppliedImpulse());

	//check if force is over our threshhold
	if( impactForce> ForceThreshold){
		//display impacts over 15 newtons
		if(impactForce > 15){
			document.getElementById('force').innerHTML = '<b>Impact Force: </b>'+impactForce+' newtons';
			}
		
		//Check if the collision force exceeds our objects breakApart force
		//need to use .toString() because we are usin ptr, which is type int, as a property to look up in the object rigidBodyPtrIndex
		//Object 1
		var Obj1_ptrID = dispatcher.getManifoldByIndexInternal(i).getBody0().ptr.toString();
		try{
			if(impactForce > rigidBodyPtrIndex[Obj1_ptrID].userData.breakApart.force){
				//flag the object to be broken if the force was hard enough
				rigidBodyPtrIndex[Obj1_ptrID].userData.HitHardEnoughToBreak = true;
				rigidBodyPtrIndex[Obj1_ptrID].userData.CollisionImpactForce = impactForce;
				rigidBodyPtrIndex[Obj1_ptrID].userData.physics.setActivationState(1);//set to active
			}
		}catch(err){continue}
		//Object 2
		var Obj2_ptrID = dispatcher.getManifoldByIndexInternal(i).getBody1().ptr.toString();
		try{
			if(impactForce > rigidBodyPtrIndex[Obj2_ptrID].userData.breakApart.force){
				//flag the object to be broken if the force was hard enough
				rigidBodyPtrIndex[Obj2_ptrID].userData.HitHardEnoughToBreak = true;
				rigidBodyPtrIndex[Obj2_ptrID].userData.CollisionImpactForce = impactForce;
				rigidBodyPtrIndex[Obj2_ptrID].userData.physics.setActivationState(1);//set to active
			}
		}catch(err){continue}
	}
}


// Update graphics after step
for ( var i = 0, objThree,objPhys; i < rigidBodies.length; i++ ) {
	
	objThree = rigidBodies[ i ];
	objPhys = rigidBodies[ i ].userData.physics;
	
	var ms = objPhys.getMotionState();
	var active = objPhys.isActive();
	
	
	//dispatcher.getNumManifolds() will return a 0 indexed count of rigid body collision pairs. you can then use dispatcher.getManifoldByIndexInternal(indexNumber) to get that specific pair, then use dispatcher.getManifoldByIndexInternal(0).getBody0() or .getBody1() to get the two objects in collision.  Every rigidbody has a ptr property that can be used as unique ID.  Note that touching the ground puts you in a state of collision for dispatcher. use in combination with isActive() to remove bodies not currently acive (like a cube just sitting on ground).  you can then get the applied force on an object with dispatcher.getManifoldByIndexInternal(x).getContactPoint().getAppliedImpulse() where 'x' is the objects index number.
	
//	http://bulletphysics.org/Bullet/phpBB3/viewtopic.php?t=10528
//https://github.com/bulletphysics/bullet3/blob/master/examples/FractureDemo/btFractureDynamicsWorld.cpp#L466
	
		if ( ms ) {
			
			//get the location and orientation of our object
			ms.getWorldTransform( transformAux1 );
			var p = transformAux1.getOrigin();
			var q = transformAux1.getRotation();
		
			//update our graphic component using data from our physics component
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
			
			//now evalute if object can break
			if (objThree.userData.hasOwnProperty('breakApart')){
				
				if (objThree.userData.hasOwnProperty('flame')){
					//use -1 on the pos.y() because we want flame below our cube
					objThree.userData.flame.position.set( p.x(), p.y()-1, p.z() );
					}

				//check if the object was in a collision large enough to break it
				if(objThree.userData.HitHardEnoughToBreak){
					
					document.getElementById('force').innerHTML = '<b>Impact Force: </b>'+objThree.userData.CollisionImpactForce+' newtons';
					/****
					FIX This
					breakApart shouldn't need the object to pass itself to its own function
					It should only pass the force
					or
					breakApart should be a regular function not an object method
					*****/
					objThree.userData.breakApart.now(objThree,impactForce);
					
				}
			
			}

		
		};
	};
		
};



function clickCreateCube(){
	//	event.preventDefault();
		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg
		
		//our random coordinates need to be range negative to positive
		//first create random 0-20 number, then subtract 10. this will 
		//create random -10 to 10
		var randX =  Math.floor(Math.random() * 20) - 10;
		var randZ =  Math.floor(Math.random() * 20) - 10;
		
		var pos = new THREE.Vector3(randX,2,randZ);	
		var quat = new THREE.Quaternion();
		var material = new THREE.MeshPhongMaterial( {color: "rgb(50%, 25%, 25%)"} );

		var cube = REALbox(x,y,z,mass,pos,quat,material);
		cube.castShadow = true;
		cube.receiveShadow = true;
		
		//weaker then our main object
		cube.userData.breakApart = new breakApart(20);
				
		//add our cube to our array, scene and physics world.
		rigidBodies.push(cube);
		scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physics );
	
	};
	
console.log(physicsWorld);
console.log(physicsWorld.getWorldInfo());