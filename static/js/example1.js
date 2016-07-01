
/*
First create our RAYCASTER which is a project that renders a 3D world based on a 2D map
*/
var raycaster = new THREE.Raycaster();//http://threejs.org/docs/api/core/Raycaster.html

/*
Then we'll create our MOUSE which only as we know only has an x and y
*/
var mouse = new THREE.Vector2();


//GLOBAL Graphics variables
var camera, scene, renderer;
var mouse;

//GLOBAL Physics variables

//MAIN
init();// start world building
animate(); //start rendering loop

function init() {

				initGraphics();

				initPhysics();

				createObjects();

				initInput();

}

function initGraphics() {
/*To actually be able to display anything with Three.js, we need three things: A scene, a camera, and a renderer so we can render the scene with the camera*/
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );	//http://threejs.org/docs/api/cameras/PerspectiveCamera.html
    scene = new THREE.Scene();//http://threejs.org/docs/#Reference/Scenes/Scene
    renderer = new THREE.WebGLRenderer();//http://threejs.org/docs/#Reference/Renderers/WebGLRenderer
    
    //add light to the sceen
    var ambientLight = new THREE.AmbientLight( 0x404040 );//http://threejs.org/docs/api/lights/AmbientLight.html
    scene.add( ambientLight );
    				
    				
    //attach and display the renderer to our html
    var container = document.getElementById( 'container' );
        container.appendChild( renderer.domElement );
}

function createObjects() {
		
		var geometry = new THREE.BoxGeometry( 200, 200, 200 );
		var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
		var cube = new THREE.Mesh( geometry, material );
		scene.add( cube );
}

function initInput() {
	
};

function initPhysics() {
	
};

function animate() {

        requestAnimationFrame( animate );
        render();
    };
    
function render() {

       renderer.render( scene, camera );

       };