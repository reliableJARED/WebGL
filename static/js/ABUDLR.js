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
		
		//check for specifc button down
		if(bits >> 0 === 1){console.log('A');}
		if(bits >> 1 === 1){console.log('B');}
		if(bits >> 2 === 1){console.log('up');}
		if(bits >> 3 === 1){console.log('down');}
		if(bits >> 4 === 1){console.log('left');}
		if(bits >> 5 === 1){console.log('right');}
	}


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
			case 'upRight':bitString |= 64;    //1000000 
			break;
			case 'downRight':bitString |= 128; //10000000 
			break;
			case 'upLeft':bitString |= 256;	   //100000000 
			break;
			case 'downLeft':bitString |= 512;  //1000000000  
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
		
		//create canvas in top left screen corner
		this.gui_canvas.setAttribute( 'style','position: absolute; left: 0; top: 0; z-index: 999;');
		
		//dimensions of the viewport (screen)
		this.viewportWidth =  window.innerWidth;
		this.viewportHeight = window.innerHeight ;
		
		
		//have GUI canvas cover whole screen
		this.gui_canvas.width = this.viewportWidth;
		this.gui_canvas.height = this.viewportHeight;
		
		
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
		
		this.GUIframe = {x:gui_x,y:gui_y,w:this.gui_width,h:this.gui_height,p:this.guiFramePadding};
		
		//creat a boolean for the main game loop to check if a button is being clicked
		this.GUIframe.isActive = false;  
		
		//now that we have coordinates, draw the background box for the GUI
		this.gui_ctx.beginPath();
		this.gui_ctx.rect(gui_x,gui_y, this.gui_width, this.gui_height);
		this.gui_ctx.fillStyle = "gray";
		this.gui_ctx.fill();
		
		
		
		/*******************CREATE CUSTOM EVENT FOR THE GAMEPAD ***************************************/
		//https://www.w3.org/TR/touch-events/#idl-def-TouchEvent
		
		/*******************/
	
		var ABUDLRstateData = {'A' : false,
		'B' : false,
		'up' : false,
		'down' : false,
		'left' : false,
		'right' : false,
		'bit' : '0000000000000000'}//16bit code for dpad state
		//last ten bits are nothing right now
		// may use for additional buttons support
		
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
		
		//example 16bit string when user is holding B and moving Up+Right
		// 0110010000000000
		//this bit string will be dispatched via the event 'ABUDLRstate', setup a listener for this event.
		//then access the bitString on the event by doing: event.detail.bit 
		// you can also poll the game pad by doing ABUDLR.getBits; TODO: add .getBits
		
		//	var getBits = '0000000000000000';
		
		/*********** CREATE THE CUSTOM EVENT ***************/
		//Catchall state of dpad if you don't want custom events for each
		//https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
		var ABUDLRstate = new CustomEvent("ABUDLRstate", {'detail':ABUDLRstateData});


		/******************GUI BUTTON CLICK ACTION FUNCTIONS***********/
		//touch events on buttons trigger the custom events from above

		var gui_buttons = []; //array of our buttons
	
		/***CREATE BUTTONS FOR OUR GUI    */
		var nameA = 'A'//text display on button
		//create the button and pass the two event listeners for this button
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,nameA));
		gui_buttons[gui_buttons.length - 1].buttonApperance();//causes the button to draw itself on canvas in 'inactive' state
		//functions triggered by buttons on the GUI are closures
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
		
		var nameB = 'B' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,nameB));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
			
		//bool arg passed to let makeGUIButton constructor know this is a dpad button
		var dpad_direction = 'up' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,'up'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'down' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,'down'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'left' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,'left'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'right' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,'right'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		/****** INVISIBLE BUTONS for diagnols */
		dpad_direction = 'upRight' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,true,'upRight'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'downRight' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,true,'downRight'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'upLeft' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,true,'upLeft'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'downLeft' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,true,'downLeft'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		
		
		

		//note that gui_canvas is technically the size of our screen NOT the size of the GUI  display
		//correct the x,y notation so that it is relevent to the GUI  not the whole screen
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

				//check all of our buttons to see if a touch is over a button
				for(var i=0;i<gui_buttons.length;i++){
					//use AABB method to check if we are over any GUI buttons
					if ((mousePos.x >=gui_buttons[i].ButtonCoords.x) && 
						(mousePos.x <=gui_buttons[i].ButtonCoords.x+gui_buttons[i].ButtonCoords.w)&&
						(mousePos.y >=gui_buttons[i].ButtonCoords.y)&&
						(mousePos.y <=gui_buttons[i].ButtonCoords.y+gui_buttons[i].ButtonCoords.h) ){
						
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
						}	
						else {
							
							//if the touch is not over a button, but this touch is associated with activting a button
							//that means the button it had activated should now be set to inactive
							if(gui_buttons[i].touchID === event.touches[touch].identifier){
								//update the state of the specific button in the event details
								ABUDLRstate.detail[gui_buttons[i].name] = false;
							
								//clean out the buttons touchevent associations, just incase :)
								gui_buttons[i].touchPosition = null;
								gui_buttons[i].touchID = null;
						   
								//render the buttons 'active' look	
								gui_buttons[i].buttonApperance();
							
								//flag this button as an active button
								gui_buttons[i].isActive = false;
							}
						}					
				 }
			}
			
			
			//update the 16bit string representing active buttons
			ABUDLRstate.detail.bit = generateBitstring(gui_buttons);
			
			//dispatch that the controller state changed event
			document.dispatchEvent(ABUDLRstate);
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
			   
			   //create the 16bit string representing active buttons
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
			
				//generate the 16bit string representing active buttons for the whole gamepad
				ABUDLRstate.detail.bit = generateBitstring(gui_buttons);		
				
				//dispatch that the gamepad state changed
				document.dispatchEvent(ABUDLRstate);
		}
	  
	  // TODO:
	  //add a check and set of key up/down listeners for non touch device
	 	this.gui_canvas.addEventListener('touchmove',this.guiButtonMove,false); 
	    this.gui_canvas.addEventListener('touchstart',this.guiButtonDown,false);
        this.gui_canvas.addEventListener('touchend',this.guiButtonUp,false);
      

      //ADD FINISHED GUI TO OUR DOCUMENT
	  document.body.appendChild( this.gui_canvas );
		
	return this;
};


//GAMEPAD BUTTON FACTORY	
function makeGUIButton(gui_ctx,gui_buttons,GUIframe,name,dpad,diagonals) {
	this.gui_ctx = gui_ctx;
	this.GUIframe = GUIframe;
	this.name = name;
	this.dpad = dpad || false;//flag for making dpad buttons args passed are 'up','down','left','right'
	this.touchPosition = null;//used to track which of the three tracked touch events triggered this button
	this.touchID = null;//used to associate a specifc touch event with this button
	this.diagonals = diagonals || false;//used for invisible 'diagonals' between dpad buttons
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
			this.w = this.GUIframe.w*buttonWidthCorrection;
			this.h = this.GUIframe.h-this.GUIframe.p*2;
			this.x = this.GUIframe.x+this.GUIframe.p+(rShift*(this.w+this.GUIframe.p))
			this.y = this.GUIframe.y+this.GUIframe.p;
			this.p = this.GUIframe.p;
		}
		else{
			//FOR Visible D-pad buttons
			if(!this.diagonals){
				switch (this.dpad){
					case 'up': 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*2); 
						this.y = this.GUIframe.y+this.GUIframe.p;
						this.p = this.GUIframe.p;
					break
					case 'down': 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*2); 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w*2);
						this.p = this.GUIframe.p;
					break
					case 'right': 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w); 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w);
					break
					case 'left': 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*3); 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w);
					break
					default: console.log('error making dpad, button direction unknown');
					}
				}
				else{
					switch (this.diagonals){
					case 'upRight': 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w); 
						this.y = this.GUIframe.y+this.GUIframe.p;
						this.p = this.GUIframe.p;
					break
					case 'downRight': 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w); 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w*2);
						this.p = this.GUIframe.p;
					break
					case 'downLeft': 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*3); 
						this.y = this.GUIframe.y+this.GUIframe.p+(this.w*2);
					break
					case 'upLeft': 
						this.w = (this.GUIframe.w*buttonWidthCorrection)/3;
						this.h = (this.GUIframe.h-this.GUIframe.p*2)/3;
						this.x = this.GUIframe.x+this.GUIframe.w-(this.w*3); 
						this.y = this.GUIframe.y+this.GUIframe.p;
					break
					default: console.log('error making dpad, diagnol button direction unknown');
				}
				}
		}
			
			
			//note that when the gui references it's own buttons its coordinate system is based on itself.
			//so the top left corner of the GUI is always 0,0 no matter where it is on the screen.  
			//we now convert this.coords to be based on the GUI's coords NOT the whole screen
			/*
			TODO:
			DON"T DO THIS coordinate system, lol.  It's seem really excessive and redic. granted it does make some* things easier down stream but overall might make things more confusing
			*/
			if(!this.dpad){
				this.ButtonCoords = ({x:(rShift*this.w)+this.GUIframe.p,y:this.GUIframe.p,w:this.w,h:this.h});
				}
			else {
				var xShift=0;
				var yShift=0;
				
				if(!this.diagonals){
				switch(this.dpad) {
					case 'up':xShift =((this.GUIframe.w*buttonWidthCorrection)/3);
					break;
					case 'down':xShift =((this.GUIframe.w*buttonWidthCorrection)/3);
								yShift =((this.GUIframe.w*buttonWidthCorrection)/3)*2;
					break
					case 'right':xShift =((this.GUIframe.w*buttonWidthCorrection)/3)*2;
								yShift =((this.GUIframe.w*buttonWidthCorrection)/3);
					break;
					case 'left':yShift =((this.GUIframe.w*buttonWidthCorrection)/3);
					break;					
					}
					this.ButtonCoords = ({x:((this.GUIframe.p*100)-(this.w*3))+xShift,y:this.GUIframe.p+yShift,w:this.w,h:this.h});	
				}else{
					switch(this.diagonals) {
					case 'upRight':xShift =((this.GUIframe.w*buttonWidthCorrection)/3)*2;
					break;
					case 'downRight':xShift =((this.GUIframe.w*buttonWidthCorrection)/3)*2;
									yShift =((this.GUIframe.w*buttonWidthCorrection)/3)*2;
					break
					case 'downLeft':yShift =((this.GUIframe.w*buttonWidthCorrection)/3)*2;
									 
					break;
					case 'upLeft': xShift,yShift;
								  
					break;					
					}
					this.ButtonCoords = ({x:((this.GUIframe.p*100)-(this.w*3))+xShift,y:this.GUIframe.p+yShift,w:this.w,h:this.h});	
				}
				
			}
			
			//CHANGE button look when clicked
			this.buttonClickedApperance = function () {
					gui_ctx.beginPath();//setup clean drawing instance
					
					//draw the button circle using arc method of canvas 2d context
					//.arc(x, y, radius, startAngle, endAngle, anticlockwise[optional]);
					//we want a full circle,angle units are radians, so startAngle is 0 and endAngle is 2pi
					if(!this.dpad){
						//the screen dimention ratio determines how big to make our button radius
						var aspectRatio = (window.innerWidth / window.innerHeight)<2?2:4;
						//draw the button
						gui_ctx.arc( this.x+(this.w/2), this.y+(this.h/2),this.w/aspectRatio,0,2*Math.PI);
						}
						
					else{
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
						gui_ctx.fillText(this.name,this.x+(this.w/4),this.y+(this.h/1.5),this.w/2);}
					
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
					 var fontSize = this.h/2;
					 fontSize = fontSize.toString();
					 
					 //set text font and font size
					gui_ctx.font= fontSize+"px Georgia";
			
					//write name on the button
					gui_ctx.fillText(this.name,this.x+(this.w/4),this.y+(this.h/1.5),this.w/2);
					}
			
	}
