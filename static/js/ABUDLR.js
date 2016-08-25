	/** GAMEPAD STYLE GUI
		
		*@author Jared / http://reliableJARED.com ,https://github.com/reliableJARED
	
	*/
	//create the GUI object
		var abudlr = new ABUDLR();
		
		console.log(abudlr );
	
	//listener for the gamepad
		document.addEventListener("ABUDLRstate",DoStuff,false);

	function DoStuff(event){
		var bits = event.detail.bit;
		
		//display the bits as a string on screen
		UpdateBitDisplay(bits);
		
		//check for specific button down
		if(bits & abudlr.a){console.log('A');}
		if(bits & abudlr.b ){console.log('B');}
		if(bits & abudlr.up ){console.log('up');}
		if(bits & abudlr.down){console.log('down');}
		if(bits & abudlr.left){console.log('left');}
		if(bits & abudlr.right){console.log('right');}
	}

//TODO:
/*
FIX THE DIAGONALS they overlap and size wrong.  Also they shouldn't really be their own button
rather they should just set the perpendicular coordinate buttons to both be true
*/

function UpdateBitDisplay(bitString){
	
		
		var gui_ctx = abudlr.gui_canvas.getContext("2d");
		
		//location of our text
		var textX = window.innerWidth/6;
		var textY = window.innerHeight/2;
		
		
		//setup clean drawing instance
		gui_ctx.beginPath();
		
		//text color
		gui_ctx.fillStyle = "blue";
		
		//make the font size relative to the screen
		var fontSize = window.innerHeight/20;
		//must be a string to be passed as arg, not int
		fontSize = fontSize.toString();
		
		//set font size and style
		gui_ctx.font= fontSize+"px Georgia";
			
		//first clear previous text
		gui_ctx.clearRect(textX-fontSize, textY-fontSize, window.innerWidth, fontSize);
			
		//then write our bits as a bitString on the screen
		gui_ctx.fillText(bitString.toString(2),textX,textY)
}


function generateBitstring(buttons){
	//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
	
	var bitString = 0;
	
	for(var i=0; i<buttons.length;i++){
		//check for activity
		if(buttons[i].isActive){
			//mark bit in bitstring
			// x|= y is shorthand for x = y | x
		switch(buttons[i].name){
			case 'A':bitString |= 1;           //1
			break;
			case 'B':bitString |= 2;           //10
			break;
			case 'up':bitString |= 4;          //100 
			break;
			case 'down':bitString |= 8;        //1000 
			break;
			case 'left':bitString |= 16;       //10000
			break;
			case 'right':bitString |= 32;       //100000 
			break;
			case 'upRight':bitString |= 36;    //100100 
			break;
			case 'downRight':bitString |= 40; //101000 
			break;
			case 'upLeft':bitString |= 20;	   //10100
			break;
			case 'downLeft':bitString |= 24;  //11000
			break;
			default: console.log('error in bitString creator');
							}
		}
	}
	
	return bitString;
}
	
	
function ABUDLR() {
		
		// create the canvas element for our GUI
		this.gui_canvas = document.createElement("canvas");
		this.gui_ctx = this.gui_canvas.getContext("2d");
		this.id = 'ABUDLR'
		this.gui_canvas.setAttribute('id',this.id);
		
		//dimensions of the viewport (screen)
		this.viewportWidth =  window.innerWidth;
		this.viewportHeight = window.innerHeight ;
		
		//have GUI canvas cover whole screen
		this.gui_canvas.width = this.viewportWidth;
		this.gui_canvas.height = this.viewportHeight;
		
		//set position of our GUI canvas on the screen
		this.gui_canvas.setAttribute( 'style','position: absolute; left: 0; top: 0; z-index: 999;');
		
		
		//don't use pixels as size reference, use % of screen size.
		this.width1percent = this.viewportWidth *.01//1% of screen width
		this.height1percent = this.viewportHeight *.01//1% of screen height
		
		
		//GUI FRAME
		//x,y for top left corner then height width
		//.rect(x,y,width,height)
		//right now gui_x and gui_y need to be constant to the scope of the ABUDLR object
		var gui_x = this.viewportWidth-(this.width1percent*100); //starts from left screen edge
		var gui_y = this.viewportHeight-(this.height1percent*20);//starts 20% up from bottom screen edge
		
		this.gui_width = this.width1percent*100;//100% of screen width
		this.gui_height = this.height1percent*20;//20% of screen height
		this.guiFramePadding = this.width1percent*1;//border padding 1% of screen width
		
		//set ABUDLR object prop
		this.GUIframe = {x:gui_x,y:gui_y,w:this.gui_width,h:this.gui_height,p:this.guiFramePadding};
		var GUICollisionframe = this.GUIframe;
		//now that we have coordinates, draw the background box for the GUI
		
		/*UNCOMMENT TO MAKE HAVE BACKGROUND ON THE GUI
		//this.gui_ctx.beginPath();
		//this.gui_ctx.rect(gui_x,gui_y, this.gui_width, this.gui_height);
		//this.gui_ctx.fillStyle = "gray";
		//this.gui_ctx.fill();
		
			
		/*******************CREATE CUSTOM EVENT FOR THE GAMEPAD ***************************************/
		//https://www.w3.org/TR/touch-events/#idl-def-TouchEvent
		
		/*******************/
	
		var ABUDLRstateData = {
		'A' : false,
		'B' : false,
		'up' : false,
		'down' : false,
		'left' : false,
		'right' : false,
		'bit' : '0'}
		//32bit code for dpad state
		//first two bits are A and B
		/*
		10 - A is down
		01 - B is down
		11 - A and B are down
		00 - Neither A nor B is down
		*/
		//next 4 bits encode dpad direction
		/*
		0001 - up
		0010 - down
		0100 - left
		1000 - right
		- diagonals are just combos of u,d,l,r
		1001 - up + right
		0101 - up + left
		1010 - down + right
		0110 - down + left
		*/

		//this bit string will be dispatched via the event 'ABUDLRstate', setup a listener for this event.
		//then access the bitString on the event by doing: event.detail.bit 
		
		
		/***********check if user browser supports CustomEvent()
		*/if(typeof CustomEvent === "undefined" && CustomEvent.toString().indexOf("[native code]") === -1){
				alert('Your browser does not support CustomEvent() technology that this gamepad uses.')}
		/***************** SET THE ABUDLR OBJECT BUTTON MAPS FOR BIT
		these are used in the eventlisteners for our ABUDLR to know which button is and isn't pressed
		*/this.a = 0;
		this.b =1;
		this.up = 2;
		this.down =3;
		this.left = 4;
		this.right =5;
		
		/***************************************************/
		/*********** CREATE THE CUSTOM EVENT ***************/
		//https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
		var ABUDLRstate = new CustomEvent("ABUDLRstate", {'detail':ABUDLRstateData});

		var gui_buttons = []; //array of our buttons
	
		/***CREATE BUTTONS FOR OUR GUI    */
		//makeGUIButton(canvas,buttonArray,GUIframe coordinates,ButtonText,[dpad,dpadGridPosition,diagnol])
		/*
		canvas- all buttons get this, it's just the reference to the canvas the buttons are drawn on
		buttonArray - all buttons get this, it's the array we are pushing the new button into
		GUIframe - all buttons get this, it lets the button maker know the coordinates of the GUI frame it's putting the button in
		ButtonText - Text shown on the button
		dpad - boolean to indicate it's a directional putton not a circle button
		dpadGridPosition - the dpad is a 3x3 grid 1,2,3 top row, 4,5,6 mid row, 7,8,9 bottom row. what spot is this new button going
		diagnol - boolean to indicate that it's an invisible diagnol direction button. this way a single touch on the diagnol will work
		*/
		var ButtonText = 'A'//text display on button
		//create the button and pass the two event listeners for this button
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText));
		gui_buttons[gui_buttons.length - 1].buttonApperance();//causes the button to draw itself on canvas in 'inactive' state
		//functions triggered by buttons on the GUI are closures
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
		
		ButtonText = 'B' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
			
		//bool arg passed to let makeGUIButton constructor know this is a dpad button
		var ButtonText = 'up' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText,true,2));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		ButtonText = 'down' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText,true,8));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		ButtonText = 'left' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText,true,4));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		ButtonText = 'right' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText,true,6));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		/****** INVISIBLE BUTTONS for diagnols */
		ButtonText = 'upRight' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText,true,3,true));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		ButtonText = 'downRight' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText,true,9,true));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		ButtonText = 'upLeft' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText,true,1,true));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		ButtonText = 'downLeft' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,ButtonText,true,7,true));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		

		//note that gui_canvas is technically the size of our screen NOT the size of the GUI  display
		//correct the x,y notation so that it is relevant to the GUI  not the whole screen
		function getMousePos  (event) {
			return {
        	//correct points to be in relation to our GUI, not the viewport, and return
			x: event.clientX - gui_x,
			y: event.clientY - gui_y
			};
      }
		
		//********************************************************
		//FUNCTIONS FOR TOUCH EVENT LISTENERS 
		//********************************************************		
      this.guiButtonMove = function(event) {		
	 
			for(var touch = 0; touch <event.touches.length; touch++){
				
			//note that mousePos.x and mousePos.y are relative to the GUI frame  NOT THE VIEWPORT gui_canvas!
			var mousePos = getMousePos(event.touches[touch]);

				//check all of our buttons to see if the touch is over a button
				for(var i=0;i<gui_buttons.length;i++){
					
					//use AABB method to check if we are over any GUI buttons
					if ((mousePos.x >=gui_buttons[i].ButtonCoords.x) && 
						(mousePos.x <=gui_buttons[i].ButtonCoords.x+gui_buttons[i].ButtonCoords.w)&&
						(mousePos.y >=gui_buttons[i].ButtonCoords.y)&&
						(mousePos.y <=gui_buttons[i].ButtonCoords.y+gui_buttons[i].ButtonCoords.h) ){
							
							//if the user is over our GUI button, don't let the event bubble through
							event.stopPropagation();
							
							//if the button isn't active, activate it, else do nothing
							if(gui_buttons[i].isActive != true){
							
								//update the state of the specific button in the event details
								ABUDLRstate.detail[gui_buttons[i].name] = true; // STILL NEED THIS? should just use bitString now?
						
								//note the x,y of the touch event and associate with our button
								gui_buttons[i].touchPosition = {x:mousePos.x,y:mousePos.y};
							
								//note which touch event in the list of touch events triggered this.
								gui_buttons[i].touchID = event.touches[touch].identifier;
						   
								//render the buttons 'active' look	
								gui_buttons[i].buttonClickedApperance();
							
								//flag this button as an active button
								gui_buttons[i].isActive = true;
								
								//update the bit string representing active buttons
								ABUDLRstate.detail.bit = generateBitstring(gui_buttons);
			
								//dispatch that the controller state changed event
								document.dispatchEvent(ABUDLRstate);
							}
						}	
						else {
							//if the touch is not over a button, but this touch is associated with activting a button
							//that means the button it had activated should now be set to inactive
							if(gui_buttons[i].touchID === event.touches[touch].identifier){
								
								//update the state of the specific button in the event details
								ABUDLRstate.detail[gui_buttons[i].name] = false;
							
								//clean out the buttons touchevent associations, just in case :)
								gui_buttons[i].touchPosition = null;
								gui_buttons[i].touchID = null;
						   
								//render the buttons 'active' look	
								gui_buttons[i].buttonApperance();
							
								//flag this button as an active button
								gui_buttons[i].isActive = false;
								
								//update the bit string representing active buttons
								ABUDLRstate.detail.bit = generateBitstring(gui_buttons);
			
								//dispatch that the controller state changed event
								document.dispatchEvent(ABUDLRstate);
							}
						}					
				 }
			  
			}
			
	 };
      	
      	
	 
		this.guiButtonDown = function(event) {
			
			for(var touch = 0; touch <event.touches.length; touch++){
	
				//note that mousePos.x and mousePos.y are relative to the GUI frame  NOT THE VIEWPORT gui_canvas!
				var mousePos = getMousePos(event.touches[touch]);
					
					//User is over the GUI, now check what button is being clicked
					//buttons share the same y,w,h, only the x changes
					// but the D-pad doesn't, must check the entire direction box
					for(var i=0;i<gui_buttons.length;i++){

						if ((mousePos.x >=gui_buttons[i].ButtonCoords.x) && 
							(mousePos.x <=gui_buttons[i].ButtonCoords.x+gui_buttons[i].ButtonCoords.w)&&
							(mousePos.y >=gui_buttons[i].ButtonCoords.y)&&
							(mousePos.y <=gui_buttons[i].ButtonCoords.y+gui_buttons[i].ButtonCoords.h) ){
								
							//if the user is over our GUI, don't let the event bubble through
							event.stopPropagation();
							
							//update the state of the specific button in the event details
							ABUDLRstate.detail[gui_buttons[i].name] = true; // STILL NEED THIS? should just use bitString now?

						    // call the buttons 'active' look	
							gui_buttons[i].buttonClickedApperance();
							
							//note the x,y of the touch event and associate with our button
							gui_buttons[i].touchPosition = {x:mousePos.x,y:mousePos.y};
							
							//note which touch event in the list of touch events triggered this.
							gui_buttons[i].touchID = event.touches[touch].identifier;
							
							//flag as an active button
							gui_buttons[i].isActive = true;
							}
					}  		

								
			   }
			   
			   //create the bit string representing active buttons
				ABUDLRstate.detail.bit = generateBitstring(gui_buttons);		
				
				//dispatch event that the gamepad state changed
				document.dispatchEvent(ABUDLRstate);
        };
      

	   this.guiButtonUp = function(event) {
			
			  //determine what button(s) triggered
			   for(var i=0;i< gui_buttons.length;i++){
				 
				 //for all ACTIVE buttons see if any of the touchend events that were dispatched are the touchevent
				 //that initially set this button to active
				 if(gui_buttons[i].isActive === true){
					
					//check all touchend events
					for (var t=0; t < event.changedTouches.length; t++) { 
						
						//compare the buttons associated touchevent with the currently dispatched touchend event
						if(gui_buttons[i].touchID === event.changedTouches[t].identifier){
					
								// call the buttons 'inactive' look	
								gui_buttons[i].buttonApperance();
					
								//set the button to not active
								gui_buttons[i].isActive = false;
						
								//update the state of the specific button in the event details
								//that will be sent when the gamepad's event is dispatched
								ABUDLRstate.detail[gui_buttons[i].name] = false;
					
						}
					}
				} 
			}
			
				//generate the bit string representing active buttons for the whole gamepad
				ABUDLRstate.detail.bit = generateBitstring(gui_buttons);		
				
				//dispatch that the gamepad state changed
				document.dispatchEvent(ABUDLRstate);
		}
	  
	  // NON-TOUCH DEVICE Function
	  function guiKeyEvent (event) {	
	  		var buttonIndex;			
	  		for (var b = 0; b<gui_buttons.length;b++) {
				switch(event.keyCode) {
					case 65:if (gui_buttons[b].name === 'A') { buttonIndex=b};
					break;
					case 68:if (gui_buttons[b].name === 'B') { buttonIndex=b};
					break
					case 38:if (gui_buttons[b].name === 'up') { buttonIndex=b};
					break
					case 40:if (gui_buttons[b].name === 'down') { buttonIndex=b};
					break
					case 37:if (gui_buttons[b].name === 'left') { buttonIndex=b};
					break
					case 39:if (gui_buttons[b].name === 'right') { buttonIndex=b};
					break
				} }return buttonIndex};
				
	  //check if user is on a touch device, if not use key listeners	
	if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) { 
    		 //add a check and set of key up/down listeners for non touch device
	 		this.gui_canvas.addEventListener('touchmove',this.guiButtonMove,false); 
	    	this.gui_canvas.addEventListener('touchstart',this.guiButtonDown,false);
         this.gui_canvas.addEventListener('touchend',this.guiButtonUp,false);
	}else { 
	//if it's not a touch device use key codes
			alert('Designed for a Touch Device, but you can still use A and D for buttons, arrows for dpad');
			addEventListener("keydown", function (e) {
				//first determine the GUI button that should be pressed for the given keydown
				var buttonIndex = guiKeyEvent(e);
				//update the GUI button to look pressed
				gui_buttons[buttonIndex].buttonClickedApperance();
				//activate the GUI button
				gui_buttons[buttonIndex].isActive = true;
				//update our ABUDLR object's dispatched event to show that button is active
				ABUDLRstate.detail[gui_buttons[buttonIndex].name] = true;
				//update the  ABUDLR object's dispatched event bit string
				ABUDLRstate.detail.bit = generateBitstring(gui_buttons);		
				//dispatch that our GUI state has changed
				document.dispatchEvent(ABUDLRstate);
			}, false);
			
			addEventListener("keyup", function (e) {
				var buttonIndex = guiKeyEvent(e);//determine the GUI button that should be deactivated for the given keydown
				gui_buttons[buttonIndex].buttonApperance();//update the GUI button to look inactive
				gui_buttons[buttonIndex].isActive = false;
				ABUDLRstate.detail[gui_buttons[buttonIndex].name] = false;
				ABUDLRstate.detail.bit = generateBitstring(gui_buttons);		
				document.dispatchEvent(ABUDLRstate);//dispatch that GUI state changed
		}, false)
	}

	 
      //ADD FINISHED GUI TO OUR DOCUMENT
	  document.body.appendChild( this.gui_canvas );
		
	return this;
};


//GAMEPAD BUTTON FACTORY	
function makeGUIButton(gui_ctx,gui_buttons,GUIframe,name,dpad,dpadGridPosition,diagonals) {
	this.gui_ctx = gui_ctx;
	this.GUIframe = GUIframe;
	this.name = name;
	this.dpad = dpad || false;//flag for making dpad buttons 
	this.touchPosition = null;//used to track which of the three tracked touch events triggered this button
	this.touchID = null;//used to associate a specifc touch event with this button
	this.diagonals = diagonals || false;//flag for invisible 'diagonals' between dpad buttons
	this.dpadGridPosition = dpadGridPosition || false;//used to place dpad buttons in specifc location on the 3x3 grid of the dpad
	/*
	TODO:
	add a check based on the GUI width and button witdh to make sure there is enough space to add the button
	*/
	//as buttons are added right to left with X max (to be determined)
	var buttonCount = Object.keys(gui_buttons);
	var rShift = buttonCount.length;
	

	//used in button trigger controls from the render game loop and gui canvas event listeners
	this.isActive = false;
			
	var buttonWidthCorrection;
			
	//correction for  device orientation
	if(window.innerWidth <window.innerHeight ){
				// 'portrait';	
				buttonWidthCorrection = .2;
	}else{
				// 'landscape';	
				buttonWidthCorrection = .1;}

		//note for button_w: x is already shifted 'guiFramePadding' so need to shift back that 'guiFramePadding' plus 'gui_width' on width to make equal border in gui frame between the buttons.
	if(!this.dpad){
		//circle buttons
			this.w = this.GUIframe.w*buttonWidthCorrection; //screen size correction factor on button radius 
			this.h = this.GUIframe.h-this.GUIframe.p*2;
			this.x = this.GUIframe.x+this.GUIframe.p+(rShift*(this.w+this.GUIframe.p))
			this.y = this.GUIframe.y+this.GUIframe.p;
			this.p = this.GUIframe.p;
		}
		else{
			//FOR Visible D-pad buttons
			/*   Below gets crazy... I know.  Here are some things to help
				The dpad area is essentially being broken into a 3 x 3 grid.
				the middle and corners are not shown, and the corners are actually invisible buttons
				which trigger diagnol movements
				Each buttons w,h,x,y, p (padding) needs to be scalled for any given screen size
				so that it's in the right spot of our 3 x 3 grid.  The coordinates of the full grid are:
				 X : this.GUIframe.x+this.GUIframe.w-(this.w*3); 
				 Y : this.GUIframe.y+this.GUIframe.p;
				 W : this.GUIframe.w*buttonWidthCorrection
				 H : this.GUIframe.h-this.GUIframe.p*2
				 P : this.GUIframe.p
				Each button is only 1/3 of the height, 1/3 of the width of the full grid.  The x and y for a button 
				are incremented left, right, up, down based on which of the 9 possible locations in our 3x3 grid the button should be.
				for example the 'up' button needs its x to shift over one button width so that it's in the 2nd postion of our 3x3 grids top row, but its y doesnt need a shift because it's on the top row of our 3x3 grid.
				
				The crazy part comes in when you realize the Visual part of the button and the Detectable part of the button
				are created from different coordinate sets!!! now you may ask youself why the f*k would someone do that?  For now just
				accept that it's done this way.  I'll fix it.... eventually.
			*/
			
				switch (this.dpadGridPosition){
					case 1: 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*3)-this.GUIframe.p; 
						this.y = this.GUIframe.y+this.GUIframe.p;
					break
					case 2: 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*2)-this.GUIframe.p; 
						this.y = this.GUIframe.y+this.GUIframe.p;
						this.p = this.GUIframe.p;
					break
					case 3: 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w); 
						this.y = this.GUIframe.y+this.GUIframe.p;
						this.p = this.GUIframe.p;
					break
					case 4: 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*3)-this.GUIframe.p; 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w);
					break
					case 6: 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w)-this.GUIframe.p; 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w);
					break
					case 7: 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*3); 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w*2);
					break
					case 8: 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*2)-this.GUIframe.p; 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w*2);
						this.p = this.GUIframe.p;
					break
					case 9: 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w)-this.GUIframe.p; 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w*2);
						this.p = this.GUIframe.p;
					break
					default: console.log('error making dpad Visual button direction unknown');
				}
		}
			
			
			//IMPORTANT!  when the gui references it's own buttons when checking if a user is clicking them its OWN coordinate system is used, NOT the coordinates based on the viewport.
			//so the top left corner of the GUI is always 0,0 no matter where it is on the screen.  
			//we now convert this.coords to be based on the GUI's coords NOT the whole screen
			/*
			TODO:
			Change the GUI so that it's not the whole view port, but a small canvas that is the same size of the gui itself
			for now just use this crazy conversion from viewport to gui x,y
			*/
			if(!this.dpad){
				this.ButtonCoords = ({x:(rShift*this.w)+this.GUIframe.p,y:this.GUIframe.p,w:this.w,h:this.h});
				}
			else {
				/*Basically the exact same concept as in creating the Visual part of the button above, we are converting
				to our 3x3 grid's reference.  see above for how to interperate the xShift and yShift.
				*/
				var xShift=0;
				var yShift=0;
				
				switch(this.dpadGridPosition) {
					case 1:  yShift = -this.GUIframe.p*(buttonWidthCorrection/.1);
							xShift = -this.GUIframe.p*(buttonWidthCorrection/.1);		  
					break;	
					
					case 2:xShift =((this.GUIframe.w*buttonWidthCorrection)/3)-this.GUIframe.p;
					break;
					
					case 3:xShift =(((this.GUIframe.w*buttonWidthCorrection)/3)*2)-this.GUIframe.p;
							 yShift = -this.GUIframe.p*(buttonWidthCorrection/.1);
					break;
					
					case 4:yShift =((this.GUIframe.w*buttonWidthCorrection)/3);
					break;	
					
					case 6:xShift =(((this.GUIframe.w*buttonWidthCorrection)/3)*2)-this.GUIframe.p;
							yShift =((this.GUIframe.w*buttonWidthCorrection)/3);
					break;
					
					case 7:yShift =(((this.GUIframe.w*buttonWidthCorrection)/3)*2)+this.GUIframe.p*(buttonWidthCorrection/.1);
							xShift = -this.GUIframe.p;
					break;
					case 8:xShift =((this.GUIframe.w*buttonWidthCorrection)/3)-this.GUIframe.p;
							yShift =((this.GUIframe.w*buttonWidthCorrection)/3)*2;
					break;			

					case 9:xShift =(((this.GUIframe.w*buttonWidthCorrection)/3)*2)-this.GUIframe.p;
							yShift =(((this.GUIframe.w*buttonWidthCorrection)/3)*2)+this.GUIframe.p*(buttonWidthCorrection/.1);
					break;
					

					default: console.log('error making dpad Collision button direction unknown');					
					}
					
					this.ButtonCoords = ({x:((this.GUIframe.p*100)-(this.w*3))+xShift,y:this.GUIframe.p+yShift,w:this.w,h:this.h});	
				}
		
			
			//CHANGE button look when clicked
			this.buttonClickedApperance = function () {
					gui_ctx.beginPath();//setup clean drawing instance
					
					//draw the button circle using arc method of canvas 2d context
					//we want a full circle,angle units are radians, so startAngle is 0 and endAngle is 2pi
					if(!this.dpad){
						//the screen dimention ratio determines how big to make our button radius
						var aspectRatio = (window.innerWidth / window.innerHeight)<2?2:4;
						//draw the button
						//.arc(x, y, radius, startAngle, endAngle, anticlockwise[optional]);
						gui_ctx.arc( this.x+(this.w/2), this.y+(this.h/2),this.w/aspectRatio,0,2*Math.PI);
						}
					//TROUBLE SHOOT NOTE
						//remove make this 'if' and else to draw the diagnols
					if(this.dpad && !this.diagonals){
						//draw the dpad rectangle
						gui_ctx.rect( this.x, this.y,this.w,this.h);}
			
						//color the button background
						gui_ctx.fillStyle = "blue";
						gui_ctx.fill();
			
						//button text color
						gui_ctx.fillStyle = "white";
			
						//make the font size relative to the button box size
						var fontSize = this.h/2;
						fontSize = fontSize.toString();
					
						//set text font and font size
						gui_ctx.font= fontSize+"px Georgia";
			
						//write name on the button
						if(!this.diagonals){
						gui_ctx.fillText(this.name,this.x+(this.w/4),this.y+(this.h/1.5),this.w/2);}
					}
					
			this.buttonApperance = function () {
				this.gui_ctx.beginPath();//setup clean drawing instance
				
				//draw the button circle using arc method of canvas 2d context
					//.arc(x, y, radius, startAngle, endAngle, anticlockwise[optional]);
					//we want a full circle,angle units are radians, so startAngle is 0 and endAngle is 2pi
					if(!this.dpad){
						//the screen dimention ratio determines how big to make our button radius
						var aspectRatio = (window.innerWidth / window.innerHeight)<2?2:4;
						//draw the button
						gui_ctx.arc( this.x+(this.w/2), this.y+(this.h/2),this.w/aspectRatio,0,2*Math.PI);
						}
						//TROUBLE SHOOT NOTE
						//remove make this 'if' and else to draw the diagnols
					if(this.dpad && !this.diagonals){//draw the dpad rectangle
						gui_ctx.rect( this.x, this.y,this.w,this.h);}
						
					//color the button background
					if(!this.dpad){
					gui_ctx.fillStyle = "red";
					}if(this.dpad && !this.diagonals)
					{gui_ctx.fillStyle = "black";}
					gui_ctx.fill();
			
					//button text color
					gui_ctx.fillStyle = "white";
			
					//make the font size relative to the button box size
					 var fontSize = this.h/2;
					 fontSize = fontSize.toString();
					 
					 //set text font and font size
					gui_ctx.font= fontSize+"px Georgia";
			
					//write name on the button
					if(!this.diagonals){
					gui_ctx.fillText(this.name,this.x+(this.w/4),this.y+(this.h/1.5),this.w/2)};
					}
			
	}
