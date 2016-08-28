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
var ex = {
a:{one:12}};

var copy = Object.assign({},ex);
console.log(copy)

/*	var gp = GAMEPAD({
		'two': {
			'GUIsize': 25,
			'side': 'left',
			'button1Color': 'red',
			'button2Color': 'green'
		}
	});*/

/*	var gp = GAMEPAD({
		'buttons': 2,
	});*/
	//	var gp = GAMEPAD({'buttons':2,'screenSide':'left'});
	//	var gp = GAMEPAD({'buttons':2,'screenSide':'left','button1':{'color':'red','text':'A'}});
	//	var gp = GAMEPAD({'buttons':2,'screenSide':'left','button1':{'color':'red','text':'A'},'button2':{'color':'#FFFF00','text':'B'}});
	//	var gp = GAMEPAD();
	//	var gp = GAMEPAD({'buttons':2,'options':{'GUIsize':25,'side':'left','button1Color':'red','button2Color':'green'}});
var gp = GAMEPAD({left:{
						buttons:3,
						button3:{
							color:'yellow',
							text:'C',
							textColor:'white'						
						}}});
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
						buttons:2,
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
					}
		}
		

		//If any custom parameters were sent in replace them in our buildOptions
		if (customOptions.hasOwnProperty('left')) {
			this.BuildOptions.left = Object.assign(this.BuildOptions.left,customOptions.left);
		}
		if (customOptions.hasOwnProperty('right')) {
			this.BuildOptions.right = Object.assign(this.BuildOptions.right,customOptions.right);
		}
		
		console.log(this.BuildOptions);

		var GUIs_2_make = Object.keys(this.BuildOptions);
		
		for(var g =0; g<GUIs_2_make.length;g++){
			if (GUIs_2_make[g] === 'left') {
				CreateRoundButtons_LEFT(GUIs_2_make[g],this.BuildOptions.left);
			}
			if (GUIs_2_make[g] === 'right') {
				/*
				FIX!!!
				Ccreate a right hand version or puth corrections in createRoundbuttons for left right				
				*/
				CreateRoundButtons_LEFT(GUIs_2_make[g],this.BuildOptions.right);
			}
		}

		function CreateRoundButtons_LEFT(side,BuildOptions) {
	
			console.log(side,BuildOptions)
			//create the canvas to hold the buttons
			this.canvas = CreateACanvas(side,BuildOptions);
			
			//count of buttons that need to be drawn			
			var totalButtons = BuildOptions.buttons;
			
			//build each button
			for (var b=1;b<totalButtons+1;b++) {
				var ButtonID = 'button'+b.toString();
				
				//FIX!
				/*
				CORRECT THE X,Y to adjust right based on number of buttons				
				*/
				console.log(this.orientationCorrection)
				console.log(this.w)
				console.log(this.h)
				var ButtonDimensions = {
					//x: ((this.canvas.w /(BuildOptions.buttons*this.orientationCorrection))*b)+this.padding,
					x: ((this.canvas.w /(totalButtons*3))*b*2)-(this.width1percent*this.orientationCorrection),
					y: ((this.canvas.h /(totalButtons*3))*b*2)+this.height1percent,
					radius: (this.w / (totalButtons*3)),
					canvas_ctx: this.canvas.gui_ctx
				}
				
				//copy over display characteristics in ButtonID to our dimension object Button 
				var ButtonBluePrint = Object.assign(ButtonDimensions,BuildOptions[ButtonID]);
				
				//draw the button
				DrawCircle(ButtonBluePrint);
			}

		}

		

		//function for generating a random uniqueID
		function randomString(length, chars) {
			//length of result, chars used
			var result = '';
			for (var i = length; i > 0; --i) {
				result += chars[Math.floor(Math.random() * chars.length)];
			}
			return result;
		}

		function CreateACanvas(screenSide,params) {
			//default params if non sent
			var buildParams = {
					GUIsize : 25 //used in sizing the GUI showing the controls.  default is 25%
			}

			//if any custom parameters were sent replace them in our
			//buildParams
			buildParams = Object.assign(buildParams,params);
			
			//screenSide indicates left or right side of screen
			// create the canvas element for our GUI
			this.gui_canvas = document.createElement("canvas");
			
			//this.gui_canvas.style.position = 'fixed';
			this.gui_ctx = this.gui_canvas.getContext("2d");
			
			//uniqueID for identification
			this.identifier = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
			
			//id in HTML
			this.id = 'GAMEPAD_' + this.identifier;
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



			//All gui canvas will be size% of screen height size% of screen width
			//have GUI canvas cover whole screen

			//create easy access properties for our canvas
			this.w = this.gui_canvas.width;
			this.h = this.gui_canvas.height;
			this.x;
			this.y;
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

			//send caller the ready made canvas
			return this
		}

		function DrawCircle(circleObj) {
			console.log(circleObj);
			//setup clean drawing instance
			circleObj.canvas_ctx.beginPath();

			//.arc(x, y, radius, startAngle, endAngle, anticlockwise[optional]);
			circleObj.canvas_ctx.arc(circleObj.x, circleObj.y, circleObj.radius, 0, 2 * Math.PI);

			//fill color
			circleObj.canvas_ctx.fillStyle = circleObj.color;

			//color the button
			circleObj.canvas_ctx.fill();
		}
	}
