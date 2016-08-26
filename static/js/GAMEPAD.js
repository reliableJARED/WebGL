	/** GAMEPAD STYLE GUI
		
		*@author Jared / http://reliableJARED.com ,https://github.com/reliableJARED
	
	*/

//HOW TO USE THIS GAMEPAD:
/*
FIRST:
	    //include the file in your HTML
		<script src="the/file/location/ABUDLR.js"></script>
SECOND: 
		//create the GAMEPAD GUI object
		var GAMEPAD = new ABUDLR();
		
THIRD:
	   //create a listener to listen for events coming from the gamepad
		document.addEventListener("ABUDLRstate",DoStuff,false);
		
FOURTH:
		//the gamepad sends a string of bits that represent on/off for it's buttons
		//use the AND bit operator to check which of the buttons are down.
		//access the bits in the event by doing: event.detail.bit
		
		function DoStuff(event){
			var bits = event.detail.bit;

			//check for specific button down
			if(bits & GAMEPAD.a){console.log('A');}
			if(bits & GAMEPAD.b ){console.log('B');}
			if(bits & GAMEPAD.up ){console.log('up');}
			if(bits & GAMEPAD.down){console.log('down');}
			if(bits & GAMEPAD.left){console.log('left');}
			if(bits & GAMEPAD.right){console.log('right');}
	  }
	  
THAT'S IT
*/
	var gp = GAMEPAD({'two':{'GUIsize':25,'side':'left','button1Color':'red','button2Color':'green'}});
	
function GAMEPAD(BuildOptions) {
	
	//build options is an object that references controller layouts and the orientation
	var BuildOptions = BuildOptions || false;
	if(BuildOptions){
		if(BuildOptions.hasOwnProperty('two')){
			//BuildOptions['two'] will equal left or right
			CreateTwoButtons(BuildOptions['two']);
		}
		if(BuildOptions.hasOwnProperty('three')){
			CreateThreeButtons(BuildOptions['three']);
		}
		if(BuildOptions.hasOwnProperty('dpad')){
			CreateDpad(BuildOptions['dpad']);
		}
	}else{
		//default if no build options
		//build two button left, and dpad right
		CreateDpad('right');
		CreateTwoButtons('left');
	}
	
	function CreateTwoButtons(params){
		this.canvas = CreateACanvas(params);
		
		this.buttons = [];
		//BUTTON 1
		var color = 'red';
		if(params.hasOwnProperty('button1Color')){
			color = params.button1Color}
		var Button1 = {
			x: this.canvas.w/4,
			y:  this.canvas.padding + this.canvas.h/4,
			radius: this.canvas.width1percent * 4,
			color: color,
			canvas_ctx: this.canvas.gui_ctx
		}
		DrawCircle(Button1);
		
		//BUTTON 2
		if(params.hasOwnProperty('button2Color')){
			color = params.button2Color}
		var Button2 = {
			x: this.canvas.padding + this.canvas.w/2,
			y:  this.canvas.padding + this.canvas.h/4,
			radius: this.canvas.width1percent * 4,
			color: color,
			canvas_ctx: this.canvas.gui_ctx
		}
		DrawCircle(Button2);
	}
	
	function CreateThreeButtons(params){
		var canvas = CreateACanvas(params);
	}
	
	function CreateDpad(params){
		var canvas = CreateACanvas(params);
	}
	
	
	//function for generating a random uniqueID
	function randomString(length, chars) {
		//length of result, chars used
		var result = '';
		for (var i = length; i > 0; --i){result += chars[Math.floor(Math.random() * chars.length)];}
		return result;
	}
	
	function CreateACanvas(params){
		
		//default left side of screen
		var screenSide = 'left';
		
		if(params.hasOwnProperty('side')){
			screenSide = params.side;//left or right
		}
		//used in sizing the GUI showing the controls.  default is 25%
		var size = 25;
		if(params.hasOwnProperty('GUIsize')){
			size = params.GUIsize;
		}
		//screenSide indicates left or right side of screen
		// create the canvas element for our GUI
		this.gui_canvas = document.createElement("canvas");
		//this.gui_canvas.style.position = 'fixed';
		this.gui_ctx = this.gui_canvas.getContext("2d");
		//uniqueID for identification
		this.identifier =  randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
		//id in HTML
		this.id = 'GAMEPAD_'+this.identifier;
		this.gui_canvas.setAttribute('id',this.id);

		//check dimensions of the viewport (screen)
		this.viewportWidth =  window.innerWidth;
		this.viewportHeight = window.innerHeight ;
		
		//don't use pixels as size reference, use % of screen size.
		this.width1percent = this.viewportWidth /100//1% of screen width
		this.height1percent =this.viewportHeight /100//1% of screen height
		this.padding;
		
		this.orientationCorrection;
		//correction for  device orientation
		if(viewportWidth<viewportHeight){
				// 'portrait';	
				this.orientationCorrection = 2;
				this.padding = this.width1percent * 5;;
		}else{
				// 'landscape';	
				this.orientationCorrection = 1;
				this.padding = this.height1percent *5; }
		
		
		
		//All gui canvas will be size% of screen height size% of screen width
		//have GUI canvas cover whole screen
		this.gui_canvas.width = this.width1percent*size*this.orientationCorrection;
		this.gui_canvas.height = (this.height1percent*size)/this.orientationCorrection;
		
		//create easy access properties for our canvas
		this.w = this.gui_canvas.width;
		this.h =this.gui_canvas.height;
		this.x;
		this.y;
		if(screenSide === 'left'){
			this.x = 0;
			this.y = this.viewportHeight - this.gui_canvas.height;
			}
		if(screenSide === 'right'){
			this.x = this.viewportWidth - (this.height1percent*(100-size));
			this.y = this.viewportHeight - this.gui_canvas.height;
		}
		
		//set position of our GUI canvas on the screen
		this.gui_canvas.setAttribute( 'style','position: fixed; left:'+this.x+'px; top:'+this.y+'px; z-index: 999;');
		//note on z-index: Boxes with the same stack level in a stacking context are stacked back-to-front according to document tree order.
		
		//ADD FINISHED CANVAS TO OUR DOCUMENT
		document.body.appendChild( this.gui_canvas );
		
		//send caller the ready made canvas
		return this
	}

	function DrawCircle(circleObj){
		
		//setup clean drawing instance
		circleObj.canvas_ctx.beginPath();
		
		//.arc(x, y, radius, startAngle, endAngle, anticlockwise[optional]);
		circleObj.canvas_ctx.arc( circleObj.x,circleObj.y,circleObj.radius,0,2*Math.PI);
		
		//fill color
		circleObj.canvas_ctx.fillStyle = circleObj.color;
		
		//color the button
		circleObj.canvas_ctx.fill();
	}
}

