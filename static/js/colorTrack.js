
var VIDEO_ELEMENT = document.createElement("video");//create an HTML5 video element
var VIDEO_CANVAS, VIDEO_CANVAS_CTX;// canvas that has video feed

//SLIDERS
var RedSlider = document.createElement("input");
RedSlider.style.position = "relative";
RedSlider.type = 'range';
RedSlider.id = 'red';
RedSlider.value = '100'
document.getElementById('container').appendChild(RedSlider);

var GreenSlider = document.createElement("input");
GreenSlider.style.position = "relative";
GreenSlider.type = 'range';
GreenSlider.id = 'green';
GreenSlider.value = '80'
document.getElementById('container').appendChild(GreenSlider);

var BlueSlider = document.createElement("input");
BlueSlider.style.position = "relative";
BlueSlider.type = 'range';
BlueSlider.id = 'blue';
BlueSlider.value = '100'
document.getElementById('container').appendChild(BlueSlider);


//https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
VIDEO_ELEMENT.width = window.innerWidth;
VIDEO_ELEMENT.height = window.innerHeight;
	
//TENNIS BALL ROLLING VIDEO
/*Source:
https://videohive.net/item/tennis-ball-on-the-court-and-in-the-background/13079687?s_rank=3
*/
window.stream = '../static/images/tennisBallRolling.mp4';
VIDEO_ELEMENT.src = '../static/images/tennisBallRolling.mp4';
VIDEO_ELEMENT.autoplay = true;//so the stock fotage will stat playing
VIDEO_ELEMENT.loop = true;//so the stock fotage will keep playing

//Create canvas for the camera feed, not using video element to display
createVideoCanvas();

//begin main rendering loop
animate();		

//VIDEO_CANVAS to display the feed from the camera
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


function animate() {
        render();
		//call animate() in a loop
		requestAnimationFrame( animate );//https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    };

var range = 5;
function render() {
		
	
	   VIDEO_CANVAS_CTX.drawImage(VIDEO_ELEMENT,0,0);//update canvas with a new video feed frame.
		
		//the API
	   	//https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData
		
		//Pixel Manipulation
		//https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
		
		//IMPORTANT!
		/*You won't be able to draw images directly from another server into a canvas and then use getImageData. 
		//It's a security issue and the canvas will be considered "tainted".*/
		var pixels = VIDEO_CANVAS_CTX.getImageData(0,0,VIDEO_CANVAS.width, VIDEO_CANVAS.height); //get pixel data, see API link above for format
		var pixelData = pixels.data
		
		//see the pixel manipulation link above regarding the format and how to work with the return from getImageData() which is pixelData here
		//attempt to do some thresholding to isolate only the green color of the ball, the redraw onto the canvas
		//Get the values from slider for use in thresholding.  note they are 0 to 100, must convert to 0 to 255
		var thresholdRed = Math.floor((document.getElementById('red').value/100)*255);
		var thresholdGreen =  Math.floor((document.getElementById('green').value/100)*255);
		var thresholdBlue = Math.floor((document.getElementById('blue').value/100)*255);

		//the pixel data is on long array.  each pixel is encoded in 4 elements of the array
		//[red,green,blue,alpha,red,green,blue,aplpha,red,green,...]
		for (var i = 0; i < pixelData.length; i += 4) {
			//	pixelData[i]     = 255 - pixelData[i];     // red
			//	pixelData[i + 1] = 255 - pixelData[i + 1]; // green
			//	pixelData[i + 2] = 255 - pixelData[i + 2]; // blue
			
			//Multiple ternary evaluation to threshold the color.  First check color is over our range, if it is set as black
			//then check color is under our range set as black.  if the pixel is in range for the color leave it that color
			
			//RED
	//		pixelData[i] = (pixelData[i] > thresholdRed+range ? 0:(pixelData[i] < thresholdRed-range)? 0 : pixelData[i] ); 
			//GREEN
	//		pixelData[i+1] = (pixelData[i+1] > thresholdGreen+range ? 0:(pixelData[i+1] < thresholdGreen-range)? 0: pixelData[i+1]); 
			//BLUE
	//		pixelData[i+2] = (pixelData[i+2] > thresholdBlue+range ? 0:(pixelData[i+2] < thresholdBlue-range)? 0 : pixelData[i+2]); 
			
			pixelData[i] = (pixelData[i ] > thresholdRed? pixelData[i]:0); //red
			pixelData[i+1] = (pixelData[i + 1] > thresholdGreen? pixelData[i+1]:0); //green
			pixelData[i+2] = (pixelData[i + 2] > thresholdBlue? pixelData[i+2]:0); //blue
				}
		/* to read the blue component's value from the pixel at column 200, row 50 in the image, you would do the following:*/
	//	blueComponent = imageData.data[((50*(imageData.width*4)) + (200*4)) + 2];
//convert so we can get x,y of a pixel		
//		i/(imageData.width*4)
		VIDEO_CANVAS_CTX.putImageData(pixels, 0, 0);//NOTE! must write the full pixels data object, not just the data
    };