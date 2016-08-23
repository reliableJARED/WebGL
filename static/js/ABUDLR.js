	/*TEST CUSTOM EVENT*/
	//create
		var customEventTest = new Event("abudlr_A", {"bubbles":true, "cancelable":false});
		//listen
		document.addEventListener("abudlr_A",function(){console.log('abudlr_A')},false);
		//trigger
		document.dispatchEvent(customEventTest);
		//create the gui
		var abudlr = new ABUDLR();
		console.log(abudlr );
		
		
		
		
		
		
function ABUDLR() {
		this.xyz =function (event) {console.log(event)};
		// create the canvas element for our GUI
		this.gui_canvas = document.createElement("canvas");
		this.gui_ctx = this.gui_canvas.getContext("2d");
		this.id = 'gameGUI'
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
		
		
		
		/*******************CREATE CUSTOM EVENT LISTENERS FOR THE BUTTONS***************************************/
		//https://www.w3.org/TR/touch-events/#idl-def-TouchEvent
		
		 this.A_down = new Event("A_down", {"bubbles":true, "cancelable":false});
		 this.A_up = new Event("A_up", {"bubbles":true, "cancelable":false});
		
		 var B_down = new Event("B_down", {"bubbles":true, "cancelable":false});
		 var B_up = new Event("B_up", {"bubbles":true, "cancelable":false});
		
		 this.U_down = new Event("U_down", {"bubbles":true, "cancelable":false});
		 this.U_up = new Event("U_up", {"bubbles":true, "cancelable":false});
		
		 this.D_down = new Event("D_down", {"bubbles":true, "cancelable":false});
		 this.D_up = new Event("D_up", {"bubbles":true, "cancelable":false});
		
		 this.L_down = new Event("L_down", {"bubbles":true, "cancelable":false});
		 this.L_up = new Event("L_up", {"bubbles":true, "cancelable":false});
		
		 this.R_down = new Event("R_down", {"bubbles":true, "cancelable":false});
		 this.R_up = new Event("R_up", {"bubbles":true, "cancelable":false});
		/*******************/
		
		
		//Catchall state of dpad if you don't want custom events for each
		var dpadState = new Event("dpadState", {"bubbles":true, "cancelable":false});
		
		
		dpadState.A = false;
		dpadState.B = false;
		dpadState.U = false;
		dpadState.D = false;
		dpadState.L = false;
		dpadState.R = false;
		dpadState.bit = '00000000';//8bit code for dpad state
		//first two bits are nothing right now
		// may use for additional buttons support
		
		//second two bits are A and B
		/*
		10 - A is down
		01 - B is down
		11 - A and B are down
		00 - Neither A nor B is down
		*/
		//last 4 bits encode 8-way direction
		/*
		0001 - up
		0010 - down
		0100 - left
		1000 - right
		1001 - up + right
		0101 - up + left
		1010 - down + right
		0110 - down + left
		*/
		
		//example bit code when user is holding B and moving Up+Right
		//dpadState.bit = 00011001
		
		//TODO:
		/*create custom states
		halt: 0000
		up: 0001
		down: 0100
		left: 0011
		right: 0010
		anytime there is a state change dispatchEvent 'dpadState' and set gui prop, 'directionState' to
		one of the values above depending on what dpad buttons are being pressed
		*/



		/******************GUI BUTTON CLICK ACTION FUNCTIONS***********/
		//touch events on buttons trigger the custom events from above

		var gui_buttons = []; //array of our buttons
	
		/***CREATE BUTTONS FOR OUR GUI    */
		var nameA = 'A'//text display on button
		//create the button and pass the two event listeners for this button
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,nameA,this.A_down,this.A_up));
		gui_buttons[gui_buttons.length - 1].buttonApperance();//causes the button to draw itself on canvas in 'inactive' state
		//functions triggered by buttons on the GUI are closures
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
		
		var nameB = 'B' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,nameB,B_down,B_up));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
			
		//bool arg passed to let makeGUIButton constructor know this is a dpad button
		var dpad_direction = 'up' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,this.U_down,this.U_up,'up'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'down' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,this.D_down,this.D_up,'down'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'left' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,this.L_down,this.L_up,'left'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();
		
		dpad_direction = 'right' 
		gui_buttons.push(new makeGUIButton(this.gui_ctx,gui_buttons,this.GUIframe,dpad_direction,this.R_down,this.R_up,'right'));
		gui_buttons[gui_buttons.length - 1].buttonApperance();

		//note that gui_canvas is technically the size of our screen NOT the size of the GUI menu display
		//correct the x,y notation so that it is relevent to the GUI menu not the whole screen
		function getMousePos  (event) {
			
			return {
        	//correct points to be in relation to our GUI menu and return
			x: event.clientX - gui_x,
			y: event.clientY - gui_y
			};
      }
		
		//********************************************************
		//FUNCTIONS FOR EVENT LISTENERS 
		
		//********************************************************		
      this.guiButtonMove = function(event) {							
			// CHECK !
			//should the mousePos be checked here once? why is it inside the lower for loop?
		 
			for(var touch = 0; touch <event.touches.length; touch++){
			
			//note that mousePos.x and mousePos.y are relative to the GUI frame  NOT THE VIEWPORT gui_canvas!
			var mousePos = getMousePos(event.touches[touch]);

			console.log(mousePos)
				//check all of our buttons to see if a touch is over a button
				for(var i=0;i<gui_buttons.length;i++){
					//check if we are over any GUI buttons
					if ((mousePos.x >=gui_buttons[i].ButtonCoords.x) && 
						(mousePos.x <=gui_buttons[i].ButtonCoords.x+gui_buttons[i].ButtonCoords.w)&&
						(mousePos.y >=gui_buttons[i].ButtonCoords.y)&&
						(mousePos.y <=gui_buttons[i].ButtonCoords.y+gui_buttons[i].ButtonCoords.h) ){
							
							//update the specific button that has a touch hover over it
							switch(gui_buttons[i].name){
								case 'A':dpadState.A = true;
										dpadState.bit[2] = '1'; //update the dpad state bit code
								break;
								case 'B':dpadState.B = true;
										dpadState.bit[3] = '1'; //update the dpad state bit code
								break;
								case 'up':dpadState.U = true;
										dpadState.bit[7] = '1'; //update the dpad state bit code
								break;
								case 'down':dpadState.D = true;
											dpadState.bit[6] = '1'; //update the dpad state bit code
								break;
								case 'left':dpadState.L = true;
											dpadState.bit[5] = '1'; //update the dpad state bit code
								break;
								case 'right':dpadState.R = true;
											dpadState.bit[4] = '1'; //update the dpad state bit code
								break;
								default: console.log('error in GUI touchmove event');
							}
						
							//dispatch the buttons event to be picked up by listeners
							document.dispatchEvent(gui_buttons[i].evt_down);
							
							//dispatch that the controller state changed event
							document.dispatchEvent(dpadState);
							
							//note which touch event in the list of touch events triggered this.
							gui_buttons[i].touchPosition = {x:mousePos.x,y:mousePos.y};
						   
						   //render the buttons 'active' look	
							gui_buttons[i].buttonClickedApperance();
							
							//flag this button as an active button
							gui_buttons[i].isActive = true;
						}	
						else {
						   //dispatch the buttons event to be picked up by listeners
							document.dispatchEvent(gui_buttons[i].evt_up);
							
							//dispatch that the controller state changed event
							document.dispatchEvent(dpadState);
							
							//note which touch event in the list of touch events triggered this.
							gui_buttons[i].touchPosition = {x:mousePos.x,y:mousePos.y};
						   
						   //render the buttons 'active' look	
							gui_buttons[i].buttonApperance();
							
							//flag this button as an active button
							gui_buttons[i].isActive = false;
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
							
							console.log(gui_buttons[i])
							//trigger the buttons event to be picked up by listeners
							document.dispatchEvent(gui_buttons[i].evt_down);
						  
						    // call the buttons 'active' look	
							gui_buttons[i].buttonClickedApperance();
							
							//flag as an active button
							gui_buttons[i].isActive = true;
							}
					}  			
			   }
        };
      

	   this.guiButtonUp = function(event) {
	  	
		  	console.log(event);
		  
			  //determine what button(s) triggered
			   for(var i=0;i< gui_buttons.length;i++){
			  // call the buttons 'active' look	
			  gui_buttons[i].buttonApperance();
				
				//up to three touch events are tracked, which touch triggered this?
				console.log(gui_buttons[i].touchPosition);
					/*
			  if(gui_buttons[i].isActive){
				//set the button to not active
				gui_buttons[i].isActive = false;
				//call the buttons 'button up' action, if any
				gui_buttons[i].action.ButtonUp();}*/
				}
		  }
	  
	  
	 	this.gui_canvas.addEventListener('touchmove',this.guiButtonMove,false); 
	   this.gui_canvas.addEventListener('touchstart',this.guiButtonDown,false);
      this.gui_canvas.addEventListener('touchend',this.guiButtonUp,false);
      
      
      //ADD FINISHED GUI TO OUR DOCUMENT
	  document.body.appendChild( this.gui_canvas );
		
	return this;
};


//ADD BUTTONS and D-PAD TO GUI		
		
function makeGUIButton(gui_ctx,gui_buttons,GUIframe,name,evt_down,evt_up,dpad) {
	this.gui_ctx = gui_ctx;
	this.GUIframe = GUIframe;
	gui_buttons = gui_buttons;
	this.name = name;
	this.evt_down = evt_down;
	this.evt_up = evt_up;
	this.dpad = dpad || false;//flag for making dpad buttons args passed are 'up','down','left','right'
	this.touchPosition = null;//used to track which of the three tracked touch events triggered this button
	/*
	TODO:
	add a check based on the GUI width and button witdh to make sure there is enough space to add the button
	*/
	//as buttons are added right to left with X max (to be determined)
	var buttonCount = Object.keys(gui_buttons);
	var rShift = buttonCount.length;
	

	//used in button trigger controls from the render game loop and gui canvas event listeners
	this.isActive = false;
	
	this.action = evt_down || null; //assign the function to be called when this button is clicked
	this.clickEndAction = evt_up || null;//function that is called after button press is over
		
			
			//correction for  device orientation
			var buttonWidthCorrection;
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
		}else{
		
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
			
			
			//note that when the gui references it's own buttons its coordinate system is based on itself.
			//so the top left corner of the GUI is always 0,0 no matter where it is on the screen.  
			//we now convert this.coords to be based the GUI's coords NOT the whole screen
			/*
			TODO:
			DON"T DO THIS, lol.  it's seem really excessive and redic. granted it does make things easier down stream
			*/
			if(!this.dpad){
				this.ButtonCoords = ({x:(rShift*this.w)+this.GUIframe.p,y:this.GUIframe.p,w:this.w,h:this.h});
				}
			else {
				var xShift=0;
				var yShift=0;
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
				}
			
			
			
			//TODO:
			//change color on click or other effects
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
						
					else{//draw the dpad rectangle
						gui_ctx.rect( this.x, this.y,this.w,this.h);}
			
        			//color the button background
					gui_ctx.fillStyle = "blue";
					gui_ctx.fill();
			
				    //button text color
					gui_ctx.fillStyle = "white";
			
					//make the font size relative to the button box size
					var fontSize = this.h/2;
					fontSize = fontSize.toString();
			
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
					 
					gui_ctx.font= fontSize+"px Georgia";
			
					//write name on the button
					gui_ctx.fillText(this.name,this.x+(this.w/4),this.y+(this.h/1.5),this.w/2);
					}
			
	}
