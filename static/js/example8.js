"use strict";

/* TODO:
Clean up all these globals before things get really out of hand!
*/
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
var GUIarea;//used to hold the x,y,w,h of our GUI
var thisIsATouchDevice = CheckIfTouchDevice();


//GLOBAL Graphics variables
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 ); 
var scene = new THREE.Scene(); 
var renderer = new THREE.WebGLRenderer();
var raycaster = new THREE.Raycaster();
var controls;
var gui_canvas,gui_ctx;

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

//check if user is on a touch device	
function CheckIfTouchDevice() {
	if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) { 
    return true;
	}else { return false;}
}		



//MAIN
init();// start world building
animate(); //start rendering loop

function init() {
	
		container = document.getElementById( 'container' );
		
		initGraphics();
		initPhysics();
		createObjects();
		initInput();
		
		//build the GUI
		GUIarea = GUI();
		
		var info = document.createElement( 'div' );
				info.style.position = 'absolute';
				info.style.visibility = 'hidden';
				info.style.top = '40px';
				info.style.width = '100%';
				info.setAttribute('id','info');
				info.style.textAlign = 'center';
				info.innerHTML = '<b>Click + Hold</b> to Drag and move cubes<br>Use <b>RED buttons</b> for inputs<br><br>Impacts over 50 newtons will break BLACK cube!<br>Over 20 newtons breaks colored cubes';
		
		var instructions = document.createElement('div');
				instructions.style.position = 'absolute';
				instructions.style.width = '100%';
				instructions.style.top = '10px';
				instructions.style.textAlign = 'center';
				instructions.setAttribute('id','toggleInfoinfo');
				instructions.innerHTML = '<b>PRESS</b> to toggle instructions';
				
				/*assign click event*/
				instructions.onclick = function toggleInfo(){
					var info = document.getElementById('info');
					if(info.style.visibility ==='hidden'){
						info.style.visibility = 'visible';
					}else{
						info.style.visibility = 'hidden';
					}
				}; 
				
		var force =  document.createElement( 'div' );
				force.style.position = 'absolute';
				
				force.setAttribute('id','force');
				force.style.width = '100%';
				force.style.textAlign = 'center';
		
				
		//add out new info to the page
		instructions.appendChild( force );
		instructions.appendChild( info );	
		container.appendChild( instructions );	
		
			

		
		//Use the dispatcher to find objects in state of collision
		/*EXAMPLES*/
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
		
		//For touchscreen, prevent the whole window from moving when manipulating onscreen objects.  
		//doing this will make it feel more like a native 'app'
		window.addEventListener('touchmove',function(e){e.preventDefault();},false);
		
		//add event listeners to our document.  the same method is used regardless of touch or not.  However 
		//cannot just rely on mouse events to convert to touch events.  the click functions correct for this.
		//see them for details
		if(thisIsATouchDevice){	
		document.addEventListener( 'touchmove', onDocumentMouseMove, false ); 
		document.addEventListener( 'touchstart', onDocumentMouseDown, false );
		document.addEventListener( 'touchend', onDocumentMouseUp, false );
		}else {
		document.addEventListener( 'mousemove', onDocumentMouseMove, false ); 
		document.addEventListener( 'mousedown', onDocumentMouseDown, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		};


}


//ADD BUTTONS and D-PAD TO GUI		
	
function makeGUIdpad (GUIframe,name,clickAction,refresh,clickEndAction) {
			
			this.name = name;
			var rShift = 2;
			//correction for device orientation
			var buttonWidthCorrection;
			if(window.innerWidth <window.innerHeight ){
				buttonWidthCorrection = .3;
			}else{buttonWidthCorrection = .1;}
			
			//note for button_w: x is already shifted 'guiFramePadding' so need to shift back that 'guiFramePadding' plus'gui_width' on width to make equal border in gui frame between the buttons.
			this.w = GUIframe.w*buttonWidthCorrection;
			this.h = GUIframe.h-GUIframe.p*2;
			this.x = GUIframe.x+GUIframe.p+(rShift*(this.w+GUIframe.p))
			this.y = GUIframe.y+GUIframe.p;
			this.p = GUIframe.p;
			
			//setup clean drawing instance
			gui_ctx.beginPath();
			
			//draw the dpad rectangle
			gui_ctx.rect( this.x, this.y,this.w,this.h);
			
			gui_ctx.fillStyle = "blue";
			gui_ctx.fill();
			
			//button text color
			gui_ctx.fillStyle = "white";
			
			//make the font size relative to the button box size
			var fontSize = this.h.toString();
			gui_ctx.font= fontSize+"px Georgia";
			
			//write name on the button
			gui_ctx.fillText(this.name,this.x,this.y+this.h,this.w);
					
			//note that when the gui references it's own buttons its coordinate system is based on itself.
			//so the top left corner of the GUI is always 0,0 no matter where it is on the screen.  we now assign this.coords based the GUI's coords NOT the whole screen
			this.ButtonCoords = ({x:(rShift*this.w)+GUIframe.p,
								  y:(rShift*this.h)+GUIframe.p,
								  w:this.w,
								  h:this.h});
			
			//assign the function to be called when this button is clicked
			this.action = clickAction;
			
}		
function makeGUIButton(GUIframe,name,clickAction,refresh,clickEndAction,dpad) {
	this.dpad = dpad || false;//flag for making dpad buttons args passed are 'up','down','left','right'
	/*
	TODO:
	add a check based on the GUI width and button witdh to make sure there is enough space to add the button
	*/
	//as buttons are added right to left with X max (to be determined)
	var buttonCount = Object.keys(gui_buttons);
	var rShift = buttonCount.length;
	this.name = name;
	
	//used in button trigger controls from the render game loop and gui canvas event listeners
	this.isActive = false;
	this.refresh = refresh || 0;//default is that buttons can be held down
	this.clickEndAction = clickEndAction || null;//function that is called after button press is over
			
			
			//correction for when device is in portrait mode
			var buttonWidthCorrection;
			if(window.innerWidth <window.innerHeight ){
				buttonWidthCorrection = .3;
			}else{buttonWidthCorrection = .1;}

		//note for button_w: x is already shifted 'guiFramePadding' so need to shift back that 'guiFramePadding' plus 'gui_width' on width to make equal border in gui frame between the buttons.
		if(!this.dpad){
			this.w = GUIframe.w*buttonWidthCorrection;
			this.h = GUIframe.h-GUIframe.p*2;
			this.x = GUIframe.x+GUIframe.p+(rShift*(this.w+GUIframe.p))
			this.y = GUIframe.y+GUIframe.p;
			this.p = GUIframe.p;
		}else{
		
			switch (this.dpad){
					case 'up': 
						this.w = (GUIframe.w*buttonWidthCorrection)/3;
						this.h = (GUIframe.h-GUIframe.p*2)/3;
						this.x = GUIframe.x+GUIframe.w-(this.w*2); 
						this.y = GUIframe.y+GUIframe.p;
						this.p = GUIframe.p;
					break
					case 'down': 
						this.w = (GUIframe.w*buttonWidthCorrection)/3;
						this.h = (GUIframe.h-GUIframe.p*2)/3;
						this.x = GUIframe.x+GUIframe.w-(this.w*2); 
						this.y = GUIframe.y+GUIframe.p+(this.w*2);
						this.p = GUIframe.p;
					break
					case 'left': gui_ctx.rect( this.x, this.y,this.w,this.h);
					break
					case 'right': gui_ctx.rect( this.x, this.y,this.w,this.h);
					break
					default: console.log('error making dpad, button direction unknown');
				}
			
			
		}
			
			
			//note that when the gui references it's own buttons its coordinate system is based on itself.
			//so the top left corner of the GUI is always 0,0 no matter where it is on the screen.  we now assign this.coords based the GUI's coords NOT the whole screen
			this.ButtonCoords = ({x:(rShift*this.w)+GUIframe.p,y:(rShift*this.h)+GUIframe.p,w:this.w,h:this.h});
			
			//assign the function to be called when this button is clicked
			this.action = clickAction;
			
			//TODO:
			//change color on click or other effects
			this.buttonClickedApperance = function () {
					gui_ctx.beginPath();//setup clean drawing instance
					//draw the button circle using arc method of canvas 2d context
					//.arc(x, y, radius, startAngle, endAngle, anticlockwise[optional]);
					//we want a full circle,angle units are radians, so startAngle is 0 and endAngle is 2pi
					gui_ctx.arc( this.x+(this.w/2), this.y+(this.h/2),this.w/2,0,2*Math.PI);
			
        			//color the button background
					gui_ctx.fillStyle = "blue";
					gui_ctx.fill();
			
				    //button text color
					gui_ctx.fillStyle = "white";
			
					//make the font size relative to the button box size
					var fontSize = this.h.toString();
					gui_ctx.font= fontSize+"px Georgia";
			
					//write name on the button
					gui_ctx.fillText(this.name,this.x+(this.w/4),(this.y+this.h)-this.p*2,this.w/2);}
					
			this.buttonApperance = function () {
				gui_ctx.beginPath();//setup clean drawing instance
				
				//draw the button circle using arc method of canvas 2d context
					//.arc(x, y, radius, startAngle, endAngle, anticlockwise[optional]);
					//we want a full circle,angle units are radians, so startAngle is 0 and endAngle is 2pi
					if(!this.dpad){
						gui_ctx.arc( this.x+(this.w/2), this.y+(this.h/2),this.w/2,0,2*Math.PI);}
					else{//draw the dpad rectangle
						gui_ctx.rect( this.x, this.y,this.w,this.h);}
						
					//color the button background
					if(!this.dpad){
					gui_ctx.fillStyle = "red";
					}else
					{gui_ctx.fillStyle = "black";}
					gui_ctx.fill();
			
					//button text color
					gui_ctx.fillStyle = "white";
			
					//make the font size relative to the button box size
					var fontSize = this.h.toString();
					gui_ctx.font= fontSize+"px Georgia";
			
					//write name on the button
					gui_ctx.fillText(this.name,this.x+(this.w/4),(this.y+this.h)-this.p*2,this.w/2);}
			
	}

	
		
//CREATE an onscreen display GUI
function GUI() {
		
	//	var container = document.getElementById( 'container' );
		
		// create the canvas element for our GUI
		gui_canvas = document.createElement("canvas");
		gui_ctx = gui_canvas.getContext("2d");
		gui_canvas.setAttribute('id','GUI');
		
		//start canvas top left screen
		gui_canvas.setAttribute( 'style','position: absolute; left: 0; top: 0;');
		
		//have GUI canvas cover whole screen
		gui_canvas.width = window.innerWidth;
		gui_canvas.height = window.innerHeight ;
		
		//dimensions of the viewport
		var viewportWidth =  gui_canvas.width;
		var viewportHeight = gui_canvas.height ;
		
		//don't use pixels as reference because scaling will be bad, use % of screen size.
		var width1 = viewportWidth *.01//1% of screen width
		var height1 = viewportHeight *.01//1% of screen height
		
		
		//GUI FRAME
		//x,y for top left corner then height width
		//.rect(x,y,width,height)
		var gui_x = viewportWidth-(width1*100); //starts 0% in from left screen edge
		var gui_y = viewportHeight-(height1*20);//starts 20% up from bottom screen edge
		var gui_width = width1*100;//100% of screen width
		var gui_height = height1*20;//20% of screen height
		var guiFramePadding =width1*1;//border padding 1% of screen width
		
		var GUIframe = {x:gui_x,y:gui_y,w:gui_width,h:gui_height,p:guiFramePadding};
		
		//creat a boolean for the main game loop to check if a button is being clicked
		GUIframe.isActive = false;  
		
		//now that we have coordinates, draw the background box for the GUI
		gui_ctx.beginPath();
		gui_ctx.rect(gui_x,gui_y, gui_width,gui_height);
		gui_ctx.fillStyle = "gray";
		gui_ctx.fill();
		
		
		/******************GUI BUTTON CLICK ACTION FUNCTIONS***********/
//functions triggered by buttons on the GUI are closures
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures



//****** THRUST 
var thrust =(function (){	
			var privateVar = 99;//just an example.  this is a private value to the instance of our button
			
			return {
				ButtonDown:function(){
					//instance of the button, remember JS closures are very similar to objects
					/*
					var buttonInstance = this;
					console.log(buttonInstance);
					*/
					PlayerCube.userData.physics.applyCentralImpulse(new Ammo.btVector3( 0,2,0 ));	
					PlayerCube.userData.flame.visible = true;
					PlayerCube.userData.physics.setActivationState(4);//ALWAYS ACTIVE
				},
				ButtonUp:function(){
					PlayerCube.userData.flame.visible = false;
					PlayerCube.userData.physics.setActivationState(1);//NORMAL ACTIVE STATE
				}
			}
		})();
		
//****** CREATE CUBE		
var clickCreateCube = (function (){
	
	return{
		ButtonDown:function(){
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
		
		//assign random color when creating the new mesh
		var material = new THREE.MeshPhongMaterial( { color: Math.random() * 0xffffff } );

		var cube = REALbox(x,y,z,mass,pos,quat,material);
		cube.castShadow = true;
		cube.receiveShadow = true;
		
		//weaker then our main object
		cube.userData.breakApart = new breakApart(20);
				
		//add our cube to our array, scene and physics world.
		rigidBodies.push(cube);
		scene.add( cube );
		physicsWorld.addRigidBody( cube.userData.physics );
		},
		ButtonUp:function(){null}
	}
})();	
		
		
		
		
		/***CREATE BUTTONS FOR OUR GUI    */
		var name1 = 'A'//display on button
		//the last 2 args passed to makeGUIButton is the fuction that is called when the button is clicked and how long in MILISECONDS it takes for the button to be active again.  if it is always active a.k.a can hold down forever don't pass the refresh arg.
		var refresh = 500;// 0.5 seconds
		gui_buttons.push(new makeGUIButton(GUIframe,name1,clickCreateCube,refresh));
		gui_buttons[gui_buttons.length - 1].buttonApperance();//causes the button to draw it's inactive state look
		//functions triggered by buttons on the GUI are closures
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
		
		var name2 = 'B' 
		gui_buttons.push(new makeGUIButton(GUIframe,name2,thrust));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
			
		
		var dpad_direction = 'up' 
		gui_buttons.push(new makeGUIButton(GUIframe,dpad_direction,thrust,null,null,dpad_direction));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'down' 
		gui_buttons.push(new makeGUIButton(GUIframe,dpad_direction,thrust,null,null,dpad_direction));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		/***************************
		TODO:
		multi-pane GUI
		create a frame to hold x number of buttons inside the GUI
		Also make a 'tab' on the top to cycle through.
		then create syntax tab:position to know what button was clicked
		****************************/

		//note that gui_canvas is technically the size of our screen NOT the size of the GUI menu display
		//correct the x,y notation so that it is relevent to the GUI menu not the whole screen
		function getMousePos(canvas, evt) {
			//depricated, left here commented incase future use.
			//gui_canvas.getBoundingClientRect();//returns the size of gui_canvas and its position relative to the viewport. see: https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
			
			return {
        	//correct points to be in relation to our GUI menu and return
			x: evt.clientX - gui_x,
			y: evt.clientY - gui_y
			};
      }
		
		//************************************
      	//ADD CLICK EVENT LISTENERS 
     if(thisIsATouchDevice){	 gui_canvas.addEventListener('touchstart',guiButtonDown,false);}
  	  else{gui_canvas.addEventListener('mousedown',guiButtonDown,false);}
	
	 
		function guiButtonDown(event) {
			//deal with touch vs. mouse.  right now just uses the first finger touch
			event = (thisIsATouchDevice ? event.touches[0] : event);
	
			//note that mousePos.x and mousePos.y are relative to the GUI frame  NOT THE VIEWPORT gui_canvas!
			var mousePos = getMousePos(gui_canvas, event);
			
	   	//check that the mouse is over our GUI	
      	 if ((mousePos.x >0) && 
      	 	(mousePos.x <gui_width) &&
       		(mousePos.y > 0 ) && 
       		(mousePos.y< gui_height) ){	
					
				//User is over the GUI, now check what button is being clicked
				//buttons share the same y,w,h, only the x changes
				// but the D-pad doesn't, must check the entire direction box
				for(var i=0;i<gui_buttons.length;i++){
					
					if ((mousePos.x >=gui_buttons[i].ButtonCoords.x) && 
						(mousePos.x <=gui_buttons[i].ButtonCoords.x+gui_buttons[i].w) ){
							
							//shut off the THREE js view controller
							controls.enabled = false;
							
							// call the buttons 'active' look	
							gui_buttons[i].buttonClickedApperance();
				
							//mark button as active, this will get picked up by game render loop
							//we dont trigger the buttons action function here because some functions are 
							//supposed to be called each frame loop.  the render loop will keep calling the function while //button.isActive. see render() function for buttons whose ButtonDown function isn't constantly called
							gui_buttons[i].isActive = true;
							
							//mark GUI as active, this will also get picked up by game render loop
							//the game render loop only looks for active buttons if GUIframe.isActive
							GUIframe.isActive = true;  
							}
							//right now only one button at a time can be active.  
							else{
								gui_buttons[i].isActive = false;
							}
						}
				  			
       			};
      };
      
	  //ADD CLICK EVENT LISTENERS 
     if(thisIsATouchDevice){gui_canvas.addEventListener('touchend',guiButtonUp,false);}
  	  else{gui_canvas.addEventListener('mouseup',guiButtonUp,false);}
	 
	  function guiButtonUp(event) {
	  	//deal with touch vs. mouse.  right now just uses the first finger touch
		event = (thisIsATouchDevice ? event.touches[0] : event);
		  //turn the THREE js view controler back on
		 controls.enabled = true;
							
		 GUIframe.isActive = false; 
		  for(var i=0;i<gui_buttons.length;i++){
			  
			  // call the buttons 'active' look	
			 gui_buttons[i].buttonApperance();
				
			  if(gui_buttons[i].isActive){
				//set the button to not active
				gui_buttons[i].isActive = false;
				//call the buttons 'button up' action, if any
				gui_buttons[i].action.ButtonUp();
				}
		  }
	  };
	  
	  
      //ADD FINISHED GUI TO OUR DOCUMENT
		container.appendChild( gui_canvas );
		
	return GUIframe;
};


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
    //add an 'id' attribute to our 3D canvas
	renderer.domElement.setAttribute('id','primary');

    container.appendChild( renderer.domElement );
}


function initInput() {
    controls = new THREE.OrbitControls( camera );
	//https://github.com/mrdoob/three.js/blob/302c693b27663d4d280b156b5ebe4ed38cd062e4/examples/js/controls/OrbitControls.js
	//controls.target sets what the camera rotates/moves around
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

function createPlayerCube(){
	//properties used to make objects
		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg
		var pos = new THREE.Vector3(0,10,0);	
		var quat = new THREE.Quaternion();
		
		//create a graphic and physic component for our PlayerCube
		PlayerCube = REALbox(x,y,z,mass,pos,quat);
		
		console.log(PlayerCube);//inspect to see whats availible
		console.log(PlayerCube.userData.physics.getUserPointer());
		console.log(PlayerCube.userData.physics.getUserIndex());
		
		/*create a new graphic object inside our PlayerCube.  we will
		make the 'flame' graphic for our rocket PlayerCube!*/
		PlayerCube.userData.flame = redCone();
		
		//set some props for our 'flame' we don't wan't it always on. Only when the PlayerCube is 'blasting off'
		PlayerCube.userData.flame.visible = false;//three.js visibility prop for an object
		
		//set force (newtons) that breaks our object
		PlayerCube.userData.breakApart = new breakApart(50);
				
		//add our PlayerCube to our array, scene and physics world.
		rigidBodies.push(PlayerCube);
		scene.add( PlayerCube );
		physicsWorld.addRigidBody( PlayerCube.userData.physics );
		console.log(PlayerCube.userData.physics.getUserPointer());
}


function createObjects() {
		/****
		RIGHT NOW ONLY GROUND and HIGHTLIGHT cube IS BEING CREATED HERE... not much of a createObjects functions 
		*/
		//properties used to make objects
		var x=2;//meters
		var y=2;//meters
		var z=2;//meters
		var mass = 5;//kg  - currently not used here
		var pos = new THREE.Vector3(0,-0.5,0);	
		var quat = new THREE.Quaternion();
		
		//create our player
		createPlayerCube()

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

	/*
	AS OF 8/12/16
	NO SUPPORT FOR Promise on IE
	*/

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

	//deal with touch vs. mouse input event.  right now just uses the first finger touch
	event = (thisIsATouchDevice ? event.touches[0] : event);
	
			//check if mouse is over our GUI, if it is shut of THREE js view control and return
			if ((event.clientX > GUIarea.x) &&
				(event.clientY > GUIarea.y) &&
				(event.clientX < (GUIarea.x+GUIarea.w)) &&
				(event.clientY < (GUIarea.y+GUIarea.h))
				){controls.enabled = false;
					return };
				
				
			var plane = new THREE.Plane();
			var intersection = new THREE.Vector3();
		
		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
		
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

	//deal with touch vs. mouse input event.  right now just uses the first finger touch
	event = (thisIsATouchDevice ? event.touches[0] : event);

	
	//check if mouse is over our GUI
	//right now poiter icon is shown for anywhere on GUI, change to show over buttons only
	if ((event.clientX > GUIarea.x) &&
				(event.clientY > GUIarea.y) &&
				(event.clientX < (GUIarea.x+GUIarea.w)) &&
				(event.clientY < (GUIarea.y+GUIarea.h))
				){//TODO:
					//Add condition check for over an actual gui_button location, then change cursor to pointer
					container.style.cursor = 'pointer';return false};
	
	
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
	
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects( rigidBodies );

	if (intersects.length >0) {
		
		mouseIntersects = intersects[ 0 ];
		
		if (mouseIntersects.object != ground){
			
			
			container.style.cursor = 'pointer';}
		else{
			container.style.cursor = 'auto';
			}
		
		//if we have selected our cube to move
		if(SELECTED != null){
		
			//docs on mesh object position vectors
			//http://threejs.org/docs/index.html?q=mesh#Reference/Math/Vector3
			
			HIGHLIGHT.visible = true;
			/*
			TODO:
			the HIGHLIGHT helper is not lining up right with the world.  Where the actual block is
			placed is right but not HIGHLIGH
			*/
			//set the position of the highlight object.  use .add() to add the face of the ground or other objects to the position.
			//this way our highlight will be ontop of what the mouse is pointing at, not inside it.
			HIGHLIGHT.position.copy( mouseIntersects.point ).add( mouseIntersects.face.normal );
			SELECTED.object.userData.physics.setActivationState(4);//ALWAYS ACTIVE
		}else{controls.enabled = true;}
	}
}
function onDocumentMouseUp(event){

	//check if mouse is over our GUI  -- NEED THIS CHECK?
	if ((event.clientX > GUIarea.x) &&
				(event.clientY > GUIarea.y) &&
				(event.clientX < (GUIarea.x+GUIarea.w)) &&
				(event.clientY < (GUIarea.y+GUIarea.h))
				){return false};
	
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
		//we need a btTransform object to creat new points for our blocks position in the world
		transformAux1.setOrigin(new Ammo.btVector3( mouseIntersects.point.x, mouseIntersects.point.y, mouseIntersects.point.z));
		
		//set the selected object back to default orientation
		//makes it easier if you're building things, otherwise when an object is rotated after a collision
		//there is no way to line it back up again.
		transformAux1.setRotation(0,0,0,1);
		
		/*you can access the blocks location in the world with getWorldTransform, but we want to update it's location so we use setWorldTransform. pass a btTransform() "transformAux1" object to our objects setWorldTransform method to change where it is in the world.  Note we just set our btTransform() above*/
		SELECTED.object.userData.physics.setWorldTransform(transformAux1);
				
		}
		
	SELECTED = null;
		
	return;	
};

/*************************** MAIN LOOP **************************************************/
function animate() {
        render();
		requestAnimationFrame( animate );
    };

/************************************************************************************/

function render() {
	   var deltaTime = clock.getDelta();
	   
	   /*
		if more than one button at a time can be pressed then the GUI itself, not the
		buttons should have a boolean.
		
		FIX NEEDED
		for make cube it returns true automatically after 1 second.
		if you are also holding down thrust it will cause a blcok to be made
		even tho you didn't press because the GUI is active so all buttons are
		looped to see if they are active.
	   */
	   if(GUIarea.isActive){
			for(var i=0;i<gui_buttons.length;i++){
				if(gui_buttons[i].isActive === true){
						gui_buttons[i].action.ButtonDown();
						//if the button has a refresh delay before it can be pressed again call buttonHoldLoopDelay  
						//It uses the buttons refresh attribute to delay button.isActive from being set to true
						if(gui_buttons[i].refresh >0){
							gui_buttons[i].isActive = false;
							buttonHoldLoopDelay(gui_buttons[i],i);
						}
				};
			};
	   };

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


// Update graphics based on what happened with the last physics step
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
					
					//if we are destoying the player make them again.  unlimited lives at this point
					if(PlayerCube.uuid === objThree.uuid){createPlayerCube();}
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





	/*
	AS OF 8/12/16
	NO SUPPORT FOR Promise on IE
	*/
//Promise used when a button on the GUI has a delay between each press

function buttonHoldLoopDelay(guiButton,i){
	//create promise
    var p1 = new Promise(
        function(resolve, reject) {
        	//create a timer with time = guiButton.refresh 
			//https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout
            window.setTimeout( function() {
				//when time is up return out button object to our p1.then function     	
            	resolve(guiButton);}, guiButton.refresh );
        }
    );
    
    p1.then(  
        function(guiButton) {	
			//when promise resolves check if user is still clicking this button,
			//if they are set it to active again. gui_buttons is GLOBAL
			var anyButtonsActive;
			for(var x=0;x<gui_buttons.length;x++){
				if(gui_buttons[x].isActive){
					//check if any button is active.
					anyButtonsActive = true;
				}
			}
			//if no buttons are active, but the GUI is still active that means the user is holding down our button
			if(!anyButtonsActive && GUIarea.isActive){
				guiButton.isActive = true;
			}else{
				guiButton.isActive = false;
			}
        });
}

//Random stuff
console.log(physicsWorld);
console.log(physicsWorld.getWorldInfo());