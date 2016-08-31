	/** ABUDLR - A GAMEPAD STYLE GUI
		
		*@author Jared / http://reliableJARED.com ,https://github.com/reliableJARED
	
	*/

	//HOW TO USE ABUDLR:
	/*
FIRST:
	    //include the file in your HTML
		<script src="the/file/location/ABUDLR.js"></script>
SECOND:
		Use as is or pass in custom options.  The default will give TWO red buttons on the left and a Black dpad on the right.
		to pass custom options to the ABUDLR constructor they must be in the form off an object.  By default the ABUDLR object
		should be polled to get the state of the controller which is in bits.  You can pass a callback function to the left
		or the right controller which is called each time the controller state changes and the argument passed to your callback
		function is the bits of the controller.
		When evaluating the bit state of the controller use bit operators.  Use the & to check for a pressed button and ^
		unpressed button
		
		EXAMPLE - Use DEFAULT setting of ABUDLR with a callback used to react to button UP events:
			
			var gamepad = new ABUDLR({left:{callback:buttonUp},right:{callback:buttonUp}});
		
		//	Now inside of your game loop poll the state of the gamepad.			
			var function main(){
			
				if(GAMEPAD.leftGUI.bits & GAMEPAD.leftGUI.button1.bit){/*DO STUFF - Button was pressed}
				if(GAMEPAD.leftGUI.bits & GAMEPAD.leftGUI.button2.bit){/*DO STUFF - Button was pressed}
				if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.up.bit){/*DO STUFF - Button was pressed}
				if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.down.bit){/*DO STUFF - Button was pressed}
				if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.left.bit){/*DO STUFF - Button was pressed}
				if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.right.bit){/*DO STUFF - Button was pressed}
				if(GAMEPAD.rightGUI.bits & GAMEPAD.rightGUI.center.bit){/*DO STUFF - Button was pressed}

		
				render()//Your drawing function	
				
				requestAnimationFrame(main)//main loop		
		}
		
		function buttonUp(bits){
							
				if(bits ^ GAMEPAD.leftGUI.button1.bit){/*DO STUFF - A pressed button was released}
				if(bits ^ GAMEPAD.leftGUI.button2.bit){/*DO STUFF - A pressed button was released}
				if(bits ^ GAMEPAD.rightGUI.up.bit){/*DO STUFF -A pressed button was released}
				if(bits ^ GAMEPAD.rightGUI.down.bit){/*DO STUFF - A pressed button was released}
				if(bits ^ GAMEPAD.rightGUI.left.bit){/*DO STUFF - A pressed button was released}
				if(bits ^ GAMEPAD.rightGUI.right.bit){/*DO STUFF - A pressed button was released}
				if(bits ^ GAMEPAD.rightGUI.center.bit){/*DO STUFF - A pressed button was released}		
		}
		

THAT'S IT FOR USAGE

The game pad can also be customized. You can put buttons or dpads on left, right or both.
You cant have buttons and a dpad on the same side.  You can change the color and number of buttons.  
You can change the color of the dpad buttons. Since the Left and Right have different defaults
they way you change them is different.  the ABUDLR constructor is Asymmetrical in the sense that Left
and Right take different parameters.

Customize RIGHT:
 ABUDLR({right{buttons:2}}) //two buttons, default color is red
 ABUDLR({right{buttons:2,button1:{color:'blue'}}}) //two buttons, both blue.
 ABUDLR({right{buttons:2,button1:{color:'blue'},button2:{color:'yellow'}}}) //two buttons, one blue one red.
 ABUDLR({right{buttons:2,button1:{color:'blue'},button2:{color:'yellow'},callback:function()}}) //two buttons, one blue one red and a callback. 
 ABUDLR({right{up:{color:'red'}}}) //will make the whole dpad red
 	
 	 
 Customize LEFT:
 ABUDLR({left:'dpad'}) //short hand to create left side dpad
 ABUDLR({left:{dpad:true,up:{color:'red'}}})//create dpad and color it red
 ABUDLR({left:{dpad:true,up:{color:'red'},callback:function()}})//create dpad color it red assign callback function
 ABUDLR(left:{buttons:4})// make 4 red buttons
 
 
*/


	
function ABUDLR(customOptions) {
	
		//if no custom options then set as empty object and constructor will use default this.BuildOptions
		//IMPORTANT! if no customOptions you can ONLY poll the ABUDLR object to get it's bit state
		var customOptions = customOptions || {left:{dpad:false},right:{}};
		
		//used to set default options of dpad
		var dpadDefault = {
							up:{color:'black'},
							down:{color:'black'},
							left:{color:'black'},
							right:{color:'black'},
							upRight:{color:'transparent'},
							downRight:{color:'transparent'},
							upLeft:{color:'transparent'},
							downLeft:{color:'transparent'},
							center:{color:'black'}
							};
		
		//used as place holder if no callback was assigned
		var callbackDefault = function(x){null};
		
		//used to set default options for button colors
		var buttonDefault = {
			color:'red'
		}
		//build options is an object that contains display attributes, controller layouts and the orientation, etc
		this.BuildOptions = {
					left:{
					buttons:2,
					GUIsize: 25,//setting for the GUI's size
					button1:{
						color:'red',
						text:'A',
						textColor:'white'						
						},
					button2:{
						color:'red',
						text:'B',
						textColor:'white'						
						},
					dpad:false
					},
					right:{
						GUIsize: 25,//setting for the GUI's size
						dpad:dpadDefault
					},
					
		}
		
		
		//If any custom parameters were sent in replace them in our buildOptions
		/**********************************************************************/
		//*********LEFT GUI
		//clear out default if LEFT is set to false DON"T BUILD
		if (customOptions.left === false) {this.BuildOptions.left={}}
		
		//Set default dpad options for LEFT if dpad without options is sent
		 if (customOptions.left === 'dpad' || customOptions.left.dpad){

			//copy over any customOptions, cleared out defaults (default LEFT builds buttons)
			this.BuildOptions.left = Object.assign({},customOptions.left);
			
				//then check if they passed a callback for the dpad
				if(typeof customOptions.left.callback === 'undefined'){
					//assign default null callback if none passed
					this.BuildOptions.left.callback = callbackDefault;
				}
			this.BuildOptions.left.dpad = dpadDefault;}
			
		//replace defaults with  custom options on LEFT
		else {this.BuildOptions.left = Object.assign(this.BuildOptions.left,customOptions.left);}
		
		//*********RIGHT GUI
		//clear out default if RIGHT is set to false DON"T BUILD
		if (customOptions.right === false) {this.BuildOptions.right={}}
		//replace defaults with  custom options on RIGHT
		else{this.BuildOptions.right = Object.assign(this.BuildOptions.right,customOptions.right);}
		
		/***********************************************************************/
		
		//ID's for the left and right GUI objs will be:
		//this.leftGUI;
		//this.rightGUI;
			
		//used to tie GAMEPAD object scope to eventlisteners and functions
		var GAMEPADscope = this;
	

/******************** TOUCH HANDLERS *********************************************************/	
		//used to check ROUND BUTTON for touch events
		this.CheckTouchRound = function (event) {
			//correct X,Y of GUI which are in relation to itself, to match X,Y of Touches which are in relation to View Port
			var widthCorrection = 0; //only assigned value for touches on right GUI
			var heightCorrection = window.innerHeight - event.target.height;
			
			//used to switch between left and right GUI
			var GUI;
			//determine which GUI dispatched the event
			if(this.id ==='GAMEPAD_left'){GUI = 'leftGUI'}
			else {GUI = 'rightGUI';widthCorrection = window.innerWidth - event.target.width;};
			
			var StateChange = false;//used to indicate that the touch event caused the GAMEPAD state to change.
			
			//touchend is handled differently
			if(event.type === 'touchmove' || event.type === 'touchstart'){
			  //loop all of the touches, if more than one
				for (var touch = 0; touch <event.touches.length; touch++) {
						//assign to make code more readable
						var touchX = event.touches[touch].clientX;
						var touchY = event.touches[touch].clientY;
						
						//loop through our buttons to check if they are being touched
						for (var b = 0; b < GAMEPADscope[GUI].buttonList.length; b++) {
							
							//assign to make code more readable
							var buttonX = GAMEPADscope[GUI].buttonList[b].x+widthCorrection;
							var buttonY = GAMEPADscope[GUI].buttonList[b].y+heightCorrection;
							var buttonRadius = GAMEPADscope[GUI].buttonList[b].radius;
							
							
							/***********************IMPROVE*************************************/
							// This IF the only difference between CheckTouchDpad and CheckTouchRound
							//consider making a single CheckTouch which then uses a round or square algo based on a flag or indicator
							/************************************************************/
						
							//dx+xy > radius = pressed (fast,first)
							//dx^2 + dy^2 = radius^2 = pressed (slower, second)
							if ( Math.abs(touchX - buttonX)+ Math.abs(touchY - buttonY) <= buttonRadius 
												||
						     Math.pow(Math.abs(touchX - buttonX),2) + Math.pow(Math.abs(touchY- buttonY),2) <= Math.pow(buttonRadius,2)){
							 	
								//stop the event from bubbling through as user is on a button
								event.stopPropagation();
								
								
								if(!GAMEPADscope[GUI].buttonList[b].active){
									//mark the button as active if it's not
									GAMEPADscope[GUI].buttonList[b].active = true;
									//flag that our state changed
									StateChange = true;
									}
								/*
								TODO:
								create an 'active' look for a button'
								like convert from solid to ring when pressed
								*/
								//associate this touch with the button
								GAMEPADscope[GUI].buttonList[b].touchID = event.touches[touch].identifier;
								
								
								
							}
							//if the touch is NOT over this button, but this touch IS associated with activting this button
							//that means this button should now be set to inactive
							else if(GAMEPADscope[GUI].buttonList[b].touchID === event.touches[touch].identifier){
								//mark the button as inactive
								GAMEPADscope[GUI].buttonList[b].active = false;
								
								//flag that our state changed
								StateChange = true;
							}
						}
						
					}
				}else{
					
					for (var touch = 0; touch < event.changedTouches.length; touch++) {
						for (var b = 0; b < GAMEPADscope[GUI].buttonList.length; b++) {	
							//mark the button as inactive if its associated touch caused this event
							if(GAMEPADscope[GUI].buttonList[b].touchID === event.changedTouches[touch].identifier){
								GAMEPADscope[GUI].buttonList[b].touchID = null;//clear
								GAMEPADscope[GUI].buttonList[b].active = false;//deactivate
								
								//flag that our state changed
								StateChange = true;
							}
						}
					}
				}
			
			//clear
			GAMEPADscope[GUI].bits=0;
			//update our GAMEPAD's bit state
			for(var btn =0;btn<GAMEPADscope[GUI].buttonList.length;btn++){
				//rebuild
				if(GAMEPADscope[GUI].buttonList[btn].active){
					GAMEPADscope[GUI].bits |= GAMEPADscope[GUI].buttonList[btn].bit;
				}
			}
			
				//IF the gamepad bit state has changed, we will call the callback for this GUI
			//with it's current bit state as arg.
			//not that the callback function does nothing by default.  user must pass callback when building the gamepad.
			//to get the bitstate of the controller user can also poll the gamepad object by doing:
			//gamepadObj.leftGUI.bits  OR gamepadObj.rightGUI.bits
			if(StateChange){GAMEPADscope[GUI].callback(GAMEPADscope[GUI].bits);}
		}	
		
		//used to check SQUARE BUTTON(dpad) for touch events
		this.CheckTouchDpad = function (event){
			
			//correct X,Y of GUI which are in relation to itself, to match X,Y of Touches which are in relation to View Port
			var widthCorrection = 0; //only assigned value for touches on right GUI
			var heightCorrection = window.innerHeight - event.target.height;
			
			//used to switch between left and right GUI
			var GUI;
			//determine which GUI dispatched the event
			if(this.id ==='GAMEPAD_left'){GUI = 'leftGUI'}
			else {GUI = 'rightGUI';widthCorrection = window.innerWidth - event.target.width;};
			
			var StateChange = false;//used to indicate that the touch event caused the GAMEPAD state to change.
			
			//touchend is handled differently
			if(event.type === 'touchmove' || event.type === 'touchstart'){
				//loop all of the touches, if more than one
				for (var touch = 0; touch <event.touches.length; touch++) {
						//assign to make code more readable
						var touchX = event.touches[touch].clientX;
						var touchY = event.touches[touch].clientY ;
						
						//loop through our buttons to check if they are being touched
						for (var b = 0; b < GAMEPADscope[GUI].buttonList.length; b++) {
							
							//assign to make code more readable
							var buttonX = GAMEPADscope[GUI].buttonList[b].x+widthCorrection;
							var buttonY = GAMEPADscope[GUI].buttonList[b].y+heightCorrection;
							var buttonH = GAMEPADscope[GUI].buttonList[b].h;
							var buttonW = GAMEPADscope[GUI].buttonList[b].w;
							
							/***********************IMPROVE*************************************/
							// This IF the only difference between CheckTouchDpad and CheckTouchRound
							//consider making a single CheckTouch which then uses a round or square algo based on a flag or indicator
							/************************************************************/
							
								//use AABB method to check if we are over any GUI buttons
							if ((touchX >= buttonX) && 
								(touchX <= buttonX+buttonW)&&
								(touchY >= buttonY)&&
								(touchY <= buttonY+buttonH) ){
									
								//stop the event from bubbling through as user is on a button
								event.stopPropagation();
								
								if(!GAMEPADscope[GUI].buttonList[b].active){
									//mark the button as active if it's not
									GAMEPADscope[GUI].buttonList[b].active = true;
									//flag that our state changed
									StateChange = true;
									}
									
								/*
								TODO:
								create an 'active' look for a button'
								like convert from solid to ring when pressed
								*/
								//associate this touch with the button
								GAMEPADscope[GUI].buttonList[b].touchID = event.touches[touch].identifier;
							}
							//if the touch is NOT over this button, but this touch IS associated with activting this button
							//that means this button should now be set to inactive
							else if(GAMEPADscope[GUI].buttonList[b].touchID === event.touches[touch].identifier){
								//mark the button as inactive
								GAMEPADscope[GUI].buttonList[b].active = false;
								
								//flag that our state changed
								StateChange = true;
							}
								
						}
				}
				
			}else{
				//touchend event
				for (var touch = 0; touch < event.changedTouches.length; touch++) {
						for (var b = 0; b < GAMEPADscope[GUI].buttonList.length; b++) {	
							//mark the button as inactive if its associated touch caused this event
							if(GAMEPADscope[GUI].buttonList[b].touchID === event.changedTouches[touch].identifier){
								GAMEPADscope[GUI].buttonList[b].touchID = null;//clear
								GAMEPADscope[GUI].buttonList[b].active = false;//deactivate
								//flag that our state changed
								StateChange = true;
							}
						}
				}
				
			}
			//clear
			GAMEPADscope[GUI].bits=0;
			//update our GAMEPAD's bit state
			for(var btn =0;btn<GAMEPADscope[GUI].buttonList.length;btn++){
				//rebuild
				if(GAMEPADscope[GUI].buttonList[btn].active){
					GAMEPADscope[GUI].bits |= GAMEPADscope[GUI].buttonList[btn].bit;
				}
			}
			
			//IF the gamepad bit state has changed, we will call the callback for this GUI
			//with it's current bit state as arg.
			//not that the callback function does nothing by default.  user must pass callback when building the gamepad.
			//to get the bitstate of the controller user can also poll the gamepad object by doing:
			//gamepadObj.leftGUI.bits  OR gamepadObj.rightGUI.bits
			if(StateChange){GAMEPADscope[GUI].callback(GAMEPADscope[GUI].bits);}
		}
		
	/**********************************************************************************************/
		//BUILD GUI
			if (this.BuildOptions.left) {
				//if no callback function was passed ABUDLR create a stand in
				if(typeof this.BuildOptions.left.callback === 'undefined'){this.BuildOptions.left.callback = callbackDefault}
				
				//determine if BUTTONS or DPAD type GUI
				if(this.BuildOptions.left.buttons > 0 || typeof this.BuildOptions.left.buttons != 'undefined'){
					this.leftGUI = new CreateRoundButtons('left',this.BuildOptions.left);
					//ASSIGN the function used to check touches on ROUND buttons
					this.leftGUI.CheckTouch = this.CheckTouchRound;
				}else if(typeof this.BuildOptions.left.dpad != 'undefined'){
					this.leftGUI = new CreateDpad('left',this.BuildOptions.left);
					//ASSIGN the function used to check touches on dpad buttons
					this.leftGUI.CheckTouch = this.CheckTouchDpad;
				}
				
				//used to encode what buttons are pressed
				this.leftGUI.bits =0;
				
				//ASSIGN touch listeners to our LEFT gui
				this.leftGUI.canvas.gui_canvas.addEventListener('touchstart',GAMEPADscope.leftGUI.CheckTouch,false);
				this.leftGUI.canvas.gui_canvas.addEventListener('touchend',GAMEPADscope.leftGUI.CheckTouch,false);
				this.leftGUI.canvas.gui_canvas.addEventListener('touchmove',GAMEPADscope.leftGUI.CheckTouch,false);
			}
			if (this.BuildOptions.right) {
				//if no callback function was passed ABUDLR create a stand in
				if(typeof this.BuildOptions.right.callback === 'undefined'){this.BuildOptions.right.callback = callbackDefault}
				
				//Determine BUTTONS or DPAD type GUI
				if(this.BuildOptions.right.buttons > 0 || typeof this.BuildOptions.right.buttons != 'undefined'){
					//if button style wasn't sent use default
					if(typeof this.BuildOptions.right.button1 === 'undefined'){this.BuildOptions.right.button1 = buttonDefault}
					
					this.rightGUI = new CreateRoundButtons('right',this.BuildOptions.right);
					//ASSIGN the function used to check touches on ROUND buttons
					this.rightGUI.CheckTouch = this.CheckTouchRound;
				}else if(typeof this.BuildOptions.right.dpad != 'undefined'){
					this.rightGUI = new CreateDpad('right',this.BuildOptions.right);
					//ASSIGN the function used to check touches on dpad buttons
					this.rightGUI.CheckTouch = this.CheckTouchDpad;
				}
				
				//used to encode what buttons are pressed
				this.rightGUI.bits =0;
				
				//ASSIGN touch listeners to our RIGHT gui
				this.rightGUI.canvas.gui_canvas.addEventListener('touchstart',GAMEPADscope.rightGUI.CheckTouch,false);
				this.rightGUI.canvas.gui_canvas.addEventListener('touchend',GAMEPADscope.rightGUI.CheckTouch,false);
				this.rightGUI.canvas.gui_canvas.addEventListener('touchmove',GAMEPADscope.rightGUI.CheckTouch,false);
			}

			
		
		function CreateDpad(side,BuildOptions){
			//create the canvas for the GUI
			this.canvas = new CreateACanvas(side,BuildOptions);
			
			//assign callback function for this GUI
			this.callback = BuildOptions.callback;
			
			//container for button coordinates used in checking if they are pressed
			this.buttonList = new Array();
			
			//change scope to local because we are returning 'this' and things wont work right
			var w = this.canvas.w;
			var h = this.canvas.h;
			var width1percent = this.canvas.width1percent;
			var height1percent = this.canvas.height1percent;
			var orientationCorrection = this.canvas.orientationCorrection;
			var padding = (w/20);// creates a 5% padding
			
			//count of buttons that need to be drawn			
			var totalButtons = 9;//BuildOptions.buttons;
			
			//array used for button names
			var UDLR = ['upLeft','up','upRight','left','center','right','downLeft','down','downRight'];
			
			//use context.fillStyle = 'rgba(255, 0, 0, 0)'; make invisible
			
			//only our up,down,left,right are visible.  the corners will be assigned the bit value of their perpendicular buttons
			//the center will be given a bit value of 0.		
				for(var row = 0; row <3; row++){
					
					for(var column = 0; column < 3; column++){
						var UDLRid;
						//keep our name iteration the same as our drawing loop
						if(row ===0){UDLRid = 0};
						if(row ===1){UDLRid = 3};
						if(row ===2){UDLRid = 6};
					
						//used to determine what button being drawn
						var ButtonID = UDLR[column+UDLRid];
					
						var ButtonDimensions = {
						//we iterate from left to right, top to bottom in our 3x3 grid
						//the padding just creates a buffer around buttons and frame.  this way touch move off button will still
						//be on our canvas and can register
						x: ((w /3)*(column))+(padding/2),
						y: ((h /3)*(row))+(padding/2),
						h:(h /3)- padding,
						w:(h /3)- padding,
						canvas_ctx: this.canvas.gui_ctx
						}
						
						//put this button in out GAMEPAD tree
						this[ButtonID] = ButtonDimensions;
						
						//assign this buttons representation bit
						switch(ButtonID){
							case 'up':this[ButtonID].bit |= 1;         
							break;
							case 'down':this[ButtonID].bit |= 2;       
							break;
							case 'left':this[ButtonID].bit |= 4;       
							break;
							case 'right':this[ButtonID].bit |= 8;      
							break;
							case 'upRight':this[ButtonID].bit |= 9;    
							break;
							case 'downRight':this[ButtonID].bit |= 10; 
							break;
							case 'upLeft':this[ButtonID].bit |= 5;	   
							break;
							case 'downLeft':this[ButtonID].bit |= 6;  
							break;
							case 'center':this[ButtonID].bit |=16;//assign center as non 0 in the event user wants it as a button
							break;
						}
						
						//add this buttons coordinates,bit assignment,active state and touch association to our list of buttons
						this.buttonList.push({x:ButtonDimensions.x,y:ButtonDimensions.y,h:ButtonDimensions.h,w:ButtonDimensions.w,bit:this[ButtonID].bit,active:false,touchID:null});
						
						//copy over display characteristics in ButtonID to our dimension object Button 
						var ButtonBluePrint = Object.assign(ButtonDimensions,BuildOptions.dpad[ButtonID]);
						
						//draw the button
						DrawSquare(ButtonBluePrint);
						
					}
				}
			
			return this;
		}
		function CreateRoundButtons(side,BuildOptions) {
			
			//create the canvas for the GUI
			this.canvas = new CreateACanvas(side,BuildOptions);
			
			//assign callback function for this GUI
			this.callback = BuildOptions.callback;
			
			//container for button coordinates used in checking if they are pressed
			this.buttonList = new Array();
			
			//change scope to local because we are returning 'this' and things wont work right
			var w = this.canvas.w;
			var h = this.canvas.h;
			var width1percent = this.canvas.width1percent;
			var height1percent = this.canvas.height1percent;
			var orientationCorrection = this.canvas.orientationCorrection;//width of viewport/height of viewport
			
			//count of buttons that need to be drawn			
			var totalButtons = BuildOptions.buttons;
			
			//build each button
			for (var b=1;b<totalButtons+1;b++) {
				
				//used to determine what button being drawn
				var ButtonID = 'button'+b.toString();
				
				//used to create diagonal descending effect
				var YoffSet = b;
				var XoffSet = 1;
				
				//invert the YoffSet if building buttons on RIGHT side to make diagonal ascending
				if(side === 'right'){YoffSet = (totalButtons+1)-b; XoffSet = -1 };				
				
				var ButtonDimensions = {
					//create buttons so that they are diagonal
					//(totalbuttons * 3) is a scaling factor to create space between buttons. smaller the number bigger the space, 
					//(b*2) increments our x for each new button to the left
					//(width*orientationCorrection) fixes portrait vs. landscape to prevent squed look, 
					//XoffSet causes buttons to start being drawn in relation to their near wall (left v right)
					x: ((w /(totalButtons*3))*b*2)-(width1percent*orientationCorrection*XoffSet),
					y: ((h /(totalButtons*3))*YoffSet*2)+height1percent,
					radius: (w / (totalButtons*3)),
					canvas_ctx: this.canvas.gui_ctx
				}
				
					
				//put this button in out GAMEPAD tree
				this[ButtonID] = ButtonDimensions;
				
				//assign this buttons representation bit
				this[ButtonID].bit = Math.pow(2,b-1);
				
				//add this buttons coordinates,bit assignment,active state and touch association to our list of buttons
				this.buttonList.push({x:ButtonDimensions.x,y:ButtonDimensions.y,radius:ButtonDimensions.radius,bit:this[ButtonID].bit,active:false,touchID:null});
			
				//copy over display characteristics in ButtonID to our dimension object Button 
				var ButtonBluePrint = Object.assign(ButtonDimensions,BuildOptions[ButtonID]);

				//draw the button
				DrawCircle(ButtonBluePrint);
			}
			return  this;
		}

		function CreateACanvas(screenSide,params) {
			
			//default params if non sent
			var buildParams = {
					GUIsize : 25 //used in sizing the GUI showing the controls.  
			}

			//if any custom parameters were sent replace them in our
			//buildParams
			buildParams = Object.assign(buildParams,params);
			
			// create the canvas element for our GUI
			this.gui_canvas = document.createElement("canvas");
			
			this.gui_ctx = this.gui_canvas.getContext("2d");
			
			//id in HTML
			this.id = 'GAMEPAD_' + screenSide;
			this.gui_canvas.setAttribute('id', this.id);

			//check dimensions of the viewport (screen)
			this.viewportWidth = window.innerWidth;
			this.viewportHeight = window.innerHeight;
			
			//adjust for screen size.
			//note that small High resolution screens might look bad.
			//going to use total pixels as correction.
			//Update our buildParams.GUIsize with the correction
			var pixelCount = this.viewportWidth * this.viewportHeight;
			//no correction for small 320x480 screen, just use GUIsize as is
			var pixelCountCorrection = 1;
			if(pixelCount <= 500000 || pixelCount >  160000){pixelCountCorrection = 0.75;}//600x800
			if(pixelCount >  900000){pixelCountCorrection = 0.5}//800x1200 +
			
			buildParams.GUIsize *= pixelCountCorrection;
			
			//don't use pixels as size reference, use % of screen size.
			this.width1percent = this.viewportWidth / 100 //1% of screen width
			this.height1percent = this.viewportHeight / 100 //1% of screen height
			this.padding;

			this.orientationCorrection = this.viewportWidth/this.viewportHeight  ;
			//correction for  device orientation
			if (this.viewportWidth < this.viewportHeight) {
				// 'portrait';	
				this.padding = this.width1percent * 5*(pixelCountCorrection);
				this.gui_canvas.width = this.width1percent * buildParams.GUIsize;
				this.gui_canvas.height = (this.height1percent * buildParams.GUIsize) * this.orientationCorrection;
			} else {
				// 'landscape';	
				this.padding = this.height1percent * 5*(pixelCountCorrection);
				this.gui_canvas.width = this.width1percent * buildParams.GUIsize;
				this.gui_canvas.height = (this.height1percent * buildParams.GUIsize);
			}

			//create easy access properties for our canvas
			this.w = this.gui_canvas.width;
			this.h = this.gui_canvas.height;
			this.x;
			this.y;
			
			//screenSide indicates left or right side of screen
			if (screenSide === 'left') {
				this.x = 0;
				this.y = this.viewportHeight - this.gui_canvas.height;
			}
			if (screenSide === 'right') {
				this.x = this.viewportWidth - (this.width1percent * buildParams.GUIsize);
				this.y = this.viewportHeight - this.gui_canvas.height;
			}

			//set position of our GUI canvas on the screen
			this.gui_canvas.setAttribute('style', 'position: fixed; left:' + this.x + 'px; top:' + this.y + 'px; z-index: 999;');
			//note on z-index: Boxes with the same stack level in a stacking context are stacked back-to-front according to document tree order.

			//ADD FINISHED CANVAS TO OUR DOCUMENT
			document.body.appendChild(this.gui_canvas);

		}

		 function DrawCircle (circleObj) {
			//setup clean drawing instance
			circleObj.canvas_ctx.beginPath();

			//.arc(x, y, radius, startAngle, endAngle, anticlockwise[optional]);
			circleObj.canvas_ctx.arc(circleObj.x, circleObj.y, circleObj.radius, 0, 2 * Math.PI);

			//fill color
			if (circleObj.color != null) {
			circleObj.canvas_ctx.fillStyle = circleObj.color;}

			//color the button
			circleObj.canvas_ctx.fill();
		}
		
		function DrawSquare(squareObj){
			//setup clean drawing instance
			squareObj.canvas_ctx.beginPath();
			
			//draw the dpad rectangle
			squareObj.canvas_ctx.rect( squareObj.x, squareObj.y,squareObj.w,squareObj.h);
		
			//color the button background UNLESS it's supposed to be transparent
			if (squareObj.color === 'transparent') {
				squareObj.canvas_ctx.fillStyle = 'rgba(255, 0, 0, 0)';
			}else{squareObj.canvas_ctx.fillStyle = squareObj.color;}
			
			squareObj.canvas_ctx.fill();
		}
		
	}
