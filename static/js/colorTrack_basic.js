/*
 @author: reliableJared
*/

// video source and the canvas that will display it
var VIDEO_ELEMENT,VIDEO_CANVAS, VIDEO_CANVAS_CTX;

//used to place on object being tracked
var WhiteMarker = new ImageData(10, 10);//creat a new 10x10 imageData matrix
		
//used to define the color hue to track
var RED = 0;
var GREEN =0;
var BLUE = 0; 
//set a default sensitivity for the color match, +/- 10 on any or all of R, G or B
var  sensitivity = 10;

var Instructions = document.createElement("div");
Instructions.style.position = "relative";
Instructions.style.top = '40px';
Instructions.style.textAlign = 'center';
Instructions.innerHTML = 'You\'ll see a ball come on screen. <b>Click The Ball</b> to track it';
document.getElementById('container').appendChild(Instructions);


//Click listener to select color to track:
document.addEventListener('mousedown', pick,false);
	
					
//VIDEO_CANVAS to display the feed from the camera/video file
function createVideoCanvas(){
	//create DOM elements
	VIDEO_CANVAS = document.createElement("canvas");
	VIDEO_ELEMENT = document.createElement("video");
	
	//size and position the canvas
	VIDEO_CANVAS.width = window.innerWidth;
	VIDEO_CANVAS.height = window.innerHeight;
	VIDEO_CANVAS.style.position = 'fixed';
	
	//define canvas context and styles
	VIDEO_CANVAS_CTX = VIDEO_CANVAS.getContext("2d");//set drawing context as a global
	VIDEO_CANVAS_CTX.font="20px Impact";//set style of text written to canvas
	
	//keep our video canvas at lowest layer
	VIDEO_CANVAS.setAttribute('style','z-index:0');
	
	//set our video source
	VIDEO_ELEMENT.src = "../static/images/tennisBallRolling.mp4";
	VIDEO_ELEMENT.autoplay = true;//so the stock fotage will stat playing
	VIDEO_ELEMENT.loop = true;//so the stock fotage will keep playing
	
	//add our video canvas to our container div
	document.getElementById('container').appendChild(VIDEO_CANVAS);

}


//GET THE COLOR OF THE PIXEL UNDER THE MOUSE
function pick(event) {
  if(event.target.nodeName != 'CANVAS'){return};//Check that we are over canvas
	
  var x = event.layerX;
  var y = event.layerY;
 
  var pixel = VIDEO_CANVAS_CTX.getImageData(x, y, 1, 1);//select the single pixel under mouse
  var data = pixel.data;//get the RGBA data
  
  //assign the selected pixel RGB to our hue values for tracking.
  RED = data[0];
  GREEN = data[1];
  BLUE = data[2];
}


//I had a bad memory leak with chrome. the reason is it's not the latest version.  To reduce the
//leak the local vars in render were scoped globally.  this helped reduce the bloat each frame.  the
//real issue however is the way requestedanaimationframe is nested in the function that is it's call back
/*
https://bugs.chromium.org/p/chromium/issues/detail?id=120186
https://github.com/Prinzhorn/skrollr/issues/599
*/
var pixels,pixelData,x,y,xx,yy,i;
function render() {
	
		//update canvas with a new video feed frame.
		VIDEO_CANVAS_CTX.drawImage(VIDEO_ELEMENT,0,0); //UNcomment to stop stretching video feed to canvas
		//	VIDEO_CANVAS_CTX.drawImage(VIDEO_ELEMENT,0,0,VIDEO_ELEMENT.videoWidth ,VIDEO_ELEMENT.videoHeight,0,0,VIDEO_CANVAS.width,VIDEO_CANVAS.height);
			   
		//the API
	   //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData
		pixels = VIDEO_CANVAS_CTX.getImageData(0,0,VIDEO_CANVAS.width, VIDEO_CANVAS.height); //get pixel data of frame on canvas, see API link above for format
		pixelData = pixels.data;

		//vars used for tracking
		 x = pixels.width;
		 y = pixels.height;
		

		//the pixel data is in one long array.  each pixel is encoded in 4 elements of the array
		//[red,green,blue,alpha,red,green,blue,aplpha,red,green,...] to traverse the pixels we will increment by 4 in our loop
		for ( i = 0; i < pixelData.length; i += 4) {
			/*In this loop we check each pixels RGB color profile, if it matches the selected color profile of user input it keeps its color.  Else, turn the whole pixel black*/
			//Check red, then green then blue, if it fails at any stage mark black
			if(pixelData[i] < RED+sensitivity && pixelData[i] > RED-sensitivity &&
			   pixelData[i+1] < GREEN+sensitivity && pixelData[i+1] > GREEN-sensitivity &&
			   pixelData[i+2] < BLUE+sensitivity && pixelData[i+2] > BLUE-sensitivity){
				  
				  /*FOR PIXELS IN COLOR HUE RANGE:
				  below will locate TOP LEFT corner of our color blob
				   ---------------------------*/
				  //get the Y for our pixel, if it is LESS than our current Y, reassign y else keep y = y
				  yy = ~~(i/(pixels.width*4));
				   if( yy < y )
						y = yy;
						
					 //get the X for our pixel, if it is LESS than our current X, reassign X else keep x = x
				 	xx =  ~~((i/4)% pixels.width);
				   if( xx < x )
						x = xx;					  
				  
			}
			
		}
		
		//write 'tracking' on our object
		VIDEO_CANVAS_CTX.fillText("Tracking", x, y);
		
		requestAnimationFrame( render );//https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
};

//Create canvas for the video element to be displayed so we can get raw pix data
//using <video> element we would not be able to get pixel data, so we need to stream to a canvas
createVideoCanvas();

//begin main rendering loop
render();	