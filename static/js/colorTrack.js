
var VIDEO_ELEMENT = document.createElement("video");//create an HTML5 video element
VIDEO_ELEMENT.width = window.innerWidth;
VIDEO_ELEMENT.height = window.innerHeight;

var VIDEO_CANVAS, VIDEO_CANVAS_CTX;// canvas that has video feed
//document.getElementById('container').appendChild(VIDEO_ELEMENT);

//used to place on object being tracked
var WhiteMarker = new ImageData(10, 10);//creat a new 10x10 imageData matrix
WhiteMarker.data = [0];//set color to white
		
//SLIDERS
var RedSlider = document.createElement("input");
RedSlider.style.position = "relative";
RedSlider.type = 'range';
RedSlider.id = 'red';
RedSlider.style.backgroundColor = 'red';
RedSlider.value = '125';
RedSlider.max = '255';
document.getElementById('container').appendChild(RedSlider);

var GreenSlider = document.createElement("input");
GreenSlider.style.position = "relative";
GreenSlider.type = 'range';
GreenSlider.id = 'green';
GreenSlider.style.backgroundColor = 'green';
GreenSlider.value = '125';
GreenSlider.max = '255';
document.getElementById('container').appendChild(GreenSlider);

var BlueSlider = document.createElement("input");
BlueSlider.style.position = "relative";
BlueSlider.type = 'range';
BlueSlider.id = 'blue';
BlueSlider.style.backgroundColor = 'blue';
BlueSlider.value = '125';
BlueSlider.max = '255';
document.getElementById('container').appendChild(BlueSlider);

var SensitivitySlider = document.createElement("input");
SensitivitySlider.style.position = "relative";
SensitivitySlider.type = 'range';
SensitivitySlider.id = 'sensitivity';
SensitivitySlider.value = '256';
SensitivitySlider.max = '256';
document.getElementById('container').appendChild(SensitivitySlider);


//Click listener to select color to track:
document.addEventListener('mousedown', pick,false);


function initUserCamFeed(){

	navigator.getUserMedia = (navigator.getUserMedia ||navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

	var constraints = {
		audio: false,
	//	video: {width:window.innerWidth,height:window.innerHeight,facingMode: "environment" }// request the rear camera
		video: true
	};

	//MEDIA PROMISE SUCCESS
	function handleSuccess(stream) {
		console.log('works')
		window.stream = stream;
		VIDEO_ELEMENT.src = window.URL.createObjectURL(stream);//set our video element source to the webcam feed
		VIDEO_ELEMENT.onloadedmetadata = function(e) {
    	  	VIDEO_ELEMENT.autoplay = true;
    	  	VIDEO_ELEMENT.play();
     		 //begin main rendering loop
			animate();	
         };
	}
	//MEDIA PROMISE FAIL
	function handleError(error) {
		/*Source:
		https://videohive.net/item/tennis-ball-on-the-court-and-in-the-background/13079687?s_rank=3
		*/
		window.stream = "../static/images/tennisBallRolling.mp4";
		VIDEO_ELEMENT.src = "../static/images/tennisBallRolling.mp4";
		VIDEO_ELEMENT.autoplay = true;//so the stock fotage will stat playing
		VIDEO_ELEMENT.loop = true;//so the stock fotage will keep playing
		//begin main rendering loop
		animate();	
	}
	
	navigator.getUserMedia(constraints,handleSuccess,handleError);
}	

//Create canvas for the camera feed, not using video element to display because we need to get raw pix data
createVideoCanvas();

//start the video
initUserCamFeed() //begin main rendering loop,from inside initUserCamFeed()
			
//VIDEO_CANVAS to display the feed from the camera/video file
function createVideoCanvas(){
	VIDEO_CANVAS = document.createElement("canvas");
	VIDEO_CANVAS_CTX = VIDEO_CANVAS.getContext("2d");//set drawing context as a global
	VIDEO_CANVAS.width = window.innerWidth;
	VIDEO_CANVAS.height = window.innerHeight;
	VIDEO_CANVAS.style.position = 'fixed';
	
	//keep our video canvas at lowest level
	VIDEO_CANVAS.setAttribute('style','z-index:0');
	
	//add our video canvas to our container div
	document.getElementById('container').appendChild(VIDEO_CANVAS);

}


//PICK COLOR UNDER THE MOUSE
function pick(event) {
  if(event.target.nodeName != 'CANVAS'){return};//Check that we are over canvas
	
  var x = event.layerX;
  var y = event.layerY;
 
  var pixel = VIDEO_CANVAS_CTX.getImageData(x, y, 1, 1);//select the single pixel under mouse
  var data = pixel.data;//get the RGBA data
  
  //assign pixel RGB to our sliders value.
  document.getElementById('red').value = data[0];
  document.getElementById('green').value = data[1];
  document.getElementById('blue').value = data[2];
  //set a default sensitivity, user can adjust after
  document.getElementById('sensitivity').value = 10;
}


function animate() {
      render();
		//call animate() in a loop
		requestAnimationFrame( animate );//https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
   };



function render() {
	
		//update canvas with a new video feed frame.
		VIDEO_CANVAS_CTX.drawImage(VIDEO_ELEMENT,0,0); 

		//the API
	   //https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData
		
		//IMPORTANT!
		/*You won't be able to draw images directly from another server into a canvas and then use getImageData. 
		//It's a security issue and the canvas will be considered "tainted".*/
		/*
		Good Post on performance improvements
		http://stackoverflow.com/questions/19499500/canvas-getimagedata-for-optimal-performance-to-pull-out-all-data-or-one-at-a
		*/
		var pixels = VIDEO_CANVAS_CTX.getImageData(0,0,VIDEO_CANVAS.width, VIDEO_CANVAS.height); //get pixel data of frame on canvas, see API link above for format
		var pixelData = pixels.data;
		
		
		//Pixel Manipulation
		//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
		//see the pixel manipulation link above regarding the format and how to work with the return from getImageData() which is 'var pixels' here
		//attempt to do some thresholding to isolate only the selected color range, then we can redraw onto the canvas only the selected color range and black everything else
		//or just draw a little dot the represents the upper left most corner of the 'blob' we have isolated.
		
		//Get the values from slider for use in thresholding. 
		//use Math.floor() to drop the float and help speed things up (remove Math.floor() and you'll see a BIG drop in performance'
		//http://arnorhs.com/2012/05/30/comparing-the-performance-of-math-floor-parseint-and-a-bitwise-shift/
		
		//Consider moving these so they are not Constantly checked but only checked onchange().
		//~~ is a double NOT bitwise operator. faster than Math.floor()
		var thresholdRed = ~~document.getElementById('red').value;
		var thresholdGreen = ~~document.getElementById('green').value;
		var thresholdBlue = ~~document.getElementById('blue').value;
		var sensitivity = ~~document.getElementById('sensitivity').value;

		
		//vars used for drawing our tracking box
	//	var w = pixels.width;
		var x = pixels.width;
		var y = pixels.height;
		var xx, yy;

		//the pixel data is in one long array.  each pixel is encoded in 4 elements of the array
		//[red,green,blue,alpha,red,green,blue,aplpha,red,green,...] to traverse the pixels we will increment by 4 in our loop
	for (var i = 0; i < pixelData.length; i += 4) {
			/*In this loop we check each pixels RGB color profile, if it matches the selected color profile of user input it keeps its color.  Else, turn the whole pixel black*/
			//Check red, then green then blue, if it fails at any stage mark black
			if(pixelData[i] < thresholdRed+sensitivity && pixelData[i] > thresholdRed-sensitivity &&
			   pixelData[i+1] < thresholdGreen+sensitivity && pixelData[i+1] > thresholdGreen-sensitivity &&
			   pixelData[i+2] < thresholdBlue+sensitivity && pixelData[i+2] > thresholdBlue-sensitivity){
				  
				  /*FOR PIXELS IN COLOR RANGE:
				   ---------------------------*/
				  //get the Y for our pixel, if it is LESS than our current Y, reasign y else keep y = y
				  yy = ~~(i/(pixels.width*4));
				   if( yy < y )
						y = yy;
				   
				 //get the X for our pixel, if it is LESS than our current X, reasign X else keep x = x
				 xx =  ~~((i/4)% pixels.width);
				   if( xx < x )
						x = xx;
				  
			}//uncomment the else to get the blacked effect
			//else{pixelData[i] =0,pixelData[i+1] =0,pixelData[i+2] =0}
			
		}
		
	//uncomment to show selected color 'blob' and all else black
	//	VIDEO_CANVAS_CTX.putImageData(pixels, 0, 0);
		
		//place the white marker on color blob being tracked
		/*
		FIX THIS!! don't need to use putImageData, now that we have x,y can just put a cached regular small image
		this way too using sprite concepts we could redraw the pic everyframe but only update the x and y as the update which
		as of writting this was every 2nd frame.  It will also prevent the dot from 'flickering'
		*/
		VIDEO_CANVAS_CTX.putImageData(WhiteMarker, x, y);//NOTE! must write the full pixels data object, not just the data
	
};