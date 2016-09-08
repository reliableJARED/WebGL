
var VIDEO_ELEMENT = document.createElement("video");//create an HTML5 video element
var VIDEO_CANVAS, VIDEO_CANVAS_CTX;// canvas that has video feed

/*--------------DEBUG SOLUTION FOR PHONES
*/
var DEBUG = document.createElement('div');
DEBUG.setAttribute('id','debug');
DEBUG.style.position = 'absolute';
DEBUG.style.top = '10px';
DEBUG.style.color = 'red';
DEBUG.innerHTML = '<b>PRESS</b> to show console.log';
/*assign click event to hide/show the log*/
DEBUG.onclick = function toggleInfo(){
					var debugDIV = document.getElementById('debug_text');
					if(debugDIV.style.visibility ==='hidden'){
						debugDIV.style.visibility = 'visible';
					}else{
						debugDIV.style.visibility = 'hidden';
					}
				}; 

//used to display text from the console.log
var DEBUG_TEXT = document.createElement('div');
DEBUG_TEXT.setAttribute('id','debug_text');
DEBUG_TEXT.style.visibility = 'hidden';
DEBUG_TEXT.style.backgroundColor = 'white';

//add Debug DIVs to documet
DEBUG.appendChild(DEBUG_TEXT);
document.body.appendChild(DEBUG);

//USED TO PRINT console.log() to our debug text area
console.log = (function (std_log, div_log) { 
    return function (text) {
        std_log(text);//this way normal console.log still works
		var newLog = document.createElement('p')
		newLog.style.color = 'blue';
		newLog.innerHTML = text;
        div_log.appendChild(newLog);
    };
} (console.log.bind(console), document.getElementById("debug_text")));

/*---------------END DEBUG TOOL------------------------
*/


//GET THE CAMERA
initUserCamFeed();
//Create canvas for the camera feed, not using video element to display
createVideoCanvas();		
	
function initUserCamFeed(){
	//https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
	//https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

	navigator.getUserMedia = (navigator.getUserMedia ||navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

	//set what media permission is requested, video only here
	var constraints = {
		audio: false,
	//	video: {width:window.innerWidth,height:window.innerHeight,facingMode: { exact: "environment" }}// require the rear camera
		video: true
	};

	//MEDIA PROMISE SUCCESS
	function handleSuccess(stream) {
		console.log('SUCCESS:  navigator.getUserMedia ');
		VIDEO_ELEMENT.src = window.URL.createObjectURL(stream);//set our video element souce to the webcam feed
		//when the stream is loaded, start palaying
		VIDEO_ELEMENT.onloadedmetadata = function(e) {
           VIDEO_ELEMENT.play();
         };
	}
	//MEDIA PROMISE FAIL
	function handleError(error) {
		console.log('ERROR:  navigator.getUserMedia ', error);
		//SET A DEFAULT STREAM FOR TEST on error or no usermedia
		window.stream = "http://ak0.picdn.net/shutterstock/videos/5033150/preview/stock-footage-camera-move-through-pieces-of-software-source-code.mp4";
		VIDEO_ELEMENT.src = "http://ak0.picdn.net/shutterstock/videos/5033150/preview/stock-footage-camera-move-through-pieces-of-software-source-code.mp4";
		VIDEO_ELEMENT.autoplay = true;//so the stock fotage will stat playing
	}
	
	//see documentation here:
	//https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Using_the_Promise
	navigator.getUserMedia(constraints,handleSuccess,handleError);
}


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
    
function render() {
	   VIDEO_CANVAS_CTX.drawImage(VIDEO_ELEMENT,0,0);//update video feed and stretch to fit screen
       };