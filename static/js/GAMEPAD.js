	/** GAMEPAD STYLE GUI
		
		*@author Jared / http://reliableJARED.com ,https://github.com/reliableJARED
	
	*/

	//HOW TO USE THIS GAMEPAD:
	/*
FIRST:
	    //include the file in your HTML
		<script src="the/file/location/ABUDLR.js"></script>

THAT'S IT
*/


/*	var gp = GAMEPAD({
		'buttons': 2,
	});*/
	//	var gp = GAMEPAD({'buttons':2,'screenSide':'left'});
	//	var gp = GAMEPAD({'buttons':2,'screenSide':'left','button1':{'color':'red','text':'A'}});
	//	var gp = GAMEPAD({'buttons':2,'screenSide':'left','button1':{'color':'red','text':'A'},'button2':{'color':'#FFFF00','text':'B'}});
	//	var gp = GAMEPAD();
	//	var gp = GAMEPAD({'buttons':2,'options':{'GUIsize':25,'side':'left','button1Color':'red','button2Color':'green'}});

var gp = new GAMEPAD({left:{
						buttons:3,
						button3:{
							color:'yellow',
							text:'C',
							textColor:'white'						
						}}});

	console.log(gp);
	console.log(gp.left);
	
	var ex = new something();
	function something() {
		this.b = 1;
		this.c = abc();
		function abc() {
			this.b = 'xyz';
		return b}	
		
	//	return this;
	}
	
	console.log(ex)
function GAMEPAD(customOptions) {
		
		//build options is an object that contains display attributes, controller layouts and the orientation, etc
		this.BuildOptions = {
					left:{
					buttons:2,
					GUIsize: 25,//optional
					button1:{
						color:'red',
						text:'A',
						textColor:'white'						
						},
					button2:{
						color:'green',
						text:'B',
						textColor:'white'						
						}
					},
					right:{
						buttons:3,
						button1:{
							color:'red',
							text:'A',
							textColor:'white'						
							},
						
					}
		}

		//If any custom parameters were sent in replace them in our buildOptions
		/**********************************************************************/
			//clear out default if LEFT is set to false
		if (customOptions.left === false) {this.BuildOptions.left={}}
			//replace custom options for defaults
		else {this.BuildOptions.left = Object.assign(this.BuildOptions.left,customOptions.left);}
		
		//clear out default if RIGHT is set to false
		if (customOptions.right === false) {this.BuildOptions.right={}}
		//replace custom options for defaults
		else{this.BuildOptions.right = Object.assign(this.BuildOptions.right,customOptions.right);}
		/***********************************************************************/
		
		//create the left and right GUI objs
		this.lefGUI;
		this.rightGUI;
			
		//used to tie GAMEPAD object scope to eventlisteners and functions
		var GAMEPADscope = this;
		
		this.CheckTouch = function (event) {
			console.log(event);
			//used to set state of the controller
			var bitString = 0;
			//used to switch between left and right GUI
			var GUI;
			//determine which GUI dispatched the event
			if(this.id ==='GAMEPAD_left'){GUI = 'leftGUI'}
			else {GUI = 'rightGUI'};
			console.log(GAMEPADscope[GUI].buttonList);
			  //loop all of the touches, if more than one
				for (var touch = 0; touch <event.touches.length; touch++) {
					for (var b = 0; b < GAMEPADscope[GUI].buttonList.length; b++) {
						if ((Math.abs(event.touches[touch].clientX - GAMEPADscope[GUI].buttonList[b].x) < GAMEPADscope[GUI].buttonList[b].radius)  ||
						    (Math.abs(event.touches[touch].clientY - GAMEPADscope[GUI].buttonList[b].y) < GAMEPADscope[GUI].buttonList[b].radius)
							 ){
							 	/*
							 	CHECK WHY ONLY LEFT IS FIRING
							 	*/
								console.log('bingo');							
							}
					}
				}
	//		console.log(GAMEPADscope.leftGUI.buttonList[x])
			
		}	
		//BUILD GUI
			if (this.BuildOptions.left) {
				this.leftGUI = new CreateRoundButtons('left',this.BuildOptions.left);
				this.leftGUI.bits =0;//used to encode what buttons are pressed
				//ASSIGN touch listeners to our LEFT gui
				this.leftGUI.canvas.gui_canvas.addEventListener('touchstart',GAMEPADscope.CheckTouch,false);
				this.leftGUI.canvas.gui_canvas.addEventListener('touchend',GAMEPADscope.CheckTouch,false);
				this.leftGUI.canvas.gui_canvas.addEventListener('touchmove',GAMEPADscope.CheckTouch,false);
			}
			if (this.BuildOptions.right) {
				this.rightGUI = new CreateRoundButtons('right',this.BuildOptions.right);
				this.rightGUI.bits =0;//used to encode what buttons are pressed
				//ASSIGN touch listeners to our RIGHT gui
				this.rightGUI.canvas.gui_canvas.addEventListener('touchstart',GAMEPADscope.CheckTouch,false);
				this.rightGUI.canvas.gui_canvas.addEventListener('touchend',GAMEPADscope.CheckTouch,false);
				this.rightGUI.canvas.gui_canvas.addEventListener('touchmove',GAMEPADscope.CheckTouch,false);
			}

			
		
	
		function CreateRoundButtons(side,BuildOptions) {
			
			//create the canvas for the GUI
			this.canvas = new CreateACanvas(side,BuildOptions);
			
			//container for button coordinates used in checking if they are pressed
			this.buttonList = new Array();
			
			//change scope to local because we are returning 'this' and things wont work right
			var w = this.canvas.w;
			var h = this.canvas.h;
			var width1percent = this.canvas.width1percent;
			var height1percent = this.canvas.height1percent;
			var orientationCorrection = this.canvas.orientationCorrection;
			
			//count of buttons that need to be drawn			
			var totalButtons = BuildOptions.buttons;
			
			//build each button
			for (var b=1;b<totalButtons+1;b++) {
				
				//used to determine what button being drawn
				var ButtonID = 'button'+b.toString();
				
				//used to create diagonal descending effect
				var YoffSet = b;
				
				//invert the YoffSet if building buttons on RIGHT side to make diagonal ascending
				if(side === 'right'){YoffSet = (totalButtons+1)-b };				
				
				var ButtonDimensions = {
					//create buttons so that they are diagonal
					x: ((w /(totalButtons*3))*b*2)-(width1percent*orientationCorrection),
					y: ((h /(totalButtons*3))*YoffSet*2)+height1percent,
					radius: (w / (totalButtons*3)),
					canvas_ctx: this.canvas.gui_ctx
				}
				//add this buttons coordinates to our list
				this.buttonList.push({x:w-ButtonDimensions.x,y:h-ButtonDimensions.y,radius:ButtonDimensions.radius});
					
				//put this button in out GAMEPAD tree
				this[ButtonID] = ButtonDimensions;
				
				//assign this buttons representation bit
				this[ButtonID].bit |= Math.pow(2,b-1);
			
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
					GUIsize : 25 //used in sizing the GUI showing the controls.  default is 25%
					//All gui canvas will be GUIsize% of screen height GUIsize% of screen width
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

			//don't use pixels as size reference, use % of screen size.
			this.width1percent = this.viewportWidth / 100 //1% of screen width
			this.height1percent = this.viewportHeight / 100 //1% of screen height
			this.padding;

			this.orientationCorrection = this.viewportWidth/this.viewportHeight  ;
			//correction for  device orientation
			if (this.viewportWidth < this.viewportHeight) {
				// 'portrait';	
				this.padding = this.width1percent * 5;
				this.gui_canvas.width = this.width1percent * buildParams.GUIsize;
				this.gui_canvas.height = (this.height1percent * buildParams.GUIsize) * this.orientationCorrection;
			} else {
				// 'landscape';	
				this.padding = this.height1percent * 5;
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

		function DrawCircle(circleObj) {
			
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
		
		//return this;
	}
