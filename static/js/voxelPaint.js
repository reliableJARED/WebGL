//http://threejs.org/examples/#webgl_interactive_voxelpainter
//https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_voxelpainter.html
//http://threejs.org/examples/#misc_controls_trackball

//Global socket connection instance
WebSocket = io.connect();//create new websocket, 

//generating a random uniqueID
function randomString(length, chars) {
	//length of result, chars used
    var result = '';
    for (var i = length; i > 0; --i){result += chars[Math.floor(Math.random() * chars.length)];}
    return result;
}
var UNIQUE_ID =  randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var container;// = document.getElementById( 'container' );
			var camera, scene, renderer;
			var plane, cube;
			var mouse, raycaster; 
			var isShiftDown = false;
			var XisDown = false;
			var SpaceIsDown = false;

			var rollOverMesh, rollOverMaterial;
			var cubeGeo, cubeMaterial,cubeMaterialColorKey;
			var sphereGeo, sphereMaterial;
			
			var mouseIntersects;//mouse location intersect coords use for placement

			var objects = [];//voxel holder

			init();
			render();
			animate();//Used in view rotation and controls

			function init() {
		
				container = document.createElement( 'div' );
				document.body.appendChild( container );
				
				var info = document.createElement( 'div' );
				info.style.position = 'absolute';
				info.style.top = '10px';
				info.style.width = '100%';
				info.style.textAlign = 'center';
				info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js</a> - voxel painter - webgl<br><strong>click</strong>: add voxel, <strong>shift + click</strong>: remove voxel <br>MOVE mouse &amp; press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan<br>block Color changes: press, r:red g:green b:blue';
				container.appendChild( info );		
		
				camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
				camera.position.set( 500, 800, 1300 );
				camera.lookAt( new THREE.Vector3() );

				scene = new THREE.Scene();
				
				//Rotation and View controls 

				controls = new THREE.TrackballControls( camera );
				controls.rotateSpeed = 2.0;
				controls.zoomSpeed = 1.2;
				controls.panSpeed = 0.8;
				controls.noZoom = false;
				controls.noPan = false;
				controls.staticMoving = true;
				controls.dynamicDampingFactor = 0.3;
				controls.keys = [ 65, 83, 68 ];
				controls.addEventListener( 'change', render );
				
				// roll-over helpers

				rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
				rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
				rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
				scene.add( rollOverMesh );

				// cubes

				cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
				// COLOR GUIDE: http://threejs.org/docs/api/math/Color.html
				cubeMaterial = new THREE.MeshLambertMaterial( { color: "rgb(33%, 33%, 34%)", map: new THREE.TextureLoader().load( "static/three.js/examples/textures/square-outline-textured.png" ) } );
				
				//sphere
				sphereGeo = new THREE.SphereGeometry( 50, 50, 50 );
				sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
				//scene.add( rollOverMesh );


				// grid

				var size = 500, step = 50;

				var geometry = new THREE.Geometry();

				for ( var i = - size; i <= size; i += step ) {

					geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
					geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );

					geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
					geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );

				}

				var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2, transparent: true } );

				var line = new THREE.LineSegments( geometry, material );
				scene.add( line );

				

				raycaster = new THREE.Raycaster();
				mouse = new THREE.Vector2();

				// Ground
				
				var geometry = new THREE.PlaneBufferGeometry( 1000, 1000 );
				geometry.rotateX( - Math.PI / 2 );
				plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
				scene.add( plane );
				objects.push( plane );

				// Lights

				var ambientLight = new THREE.AmbientLight( 0x606060 );
				scene.add( ambientLight );

				var directionalLight = new THREE.DirectionalLight( 0xffffff );
				directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
				scene.add( directionalLight );

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setClearColor( 0xf0f0f0 );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				
				container.appendChild( renderer.domElement );

				document.addEventListener( 'mousemove', onDocumentMouseMove, false );
				document.addEventListener( 'mousedown', onDocumentMouseDown, false );
				document.addEventListener( 'keydown', onDocumentKeyDown, false );
				document.addEventListener( 'keyup', onDocumentKeyUp, false );

				//

				window.addEventListener( 'resize', onWindowResize, false );

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			function onDocumentMouseMove( event ) {

				event.preventDefault();

				mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

				raycaster.setFromCamera( mouse, camera );

				var intersects = raycaster.intersectObjects( objects );

				if ( intersects.length > 0 ) {

					var intersect = intersects[ 0 ];
					mouseIntersects = intersects[ 0 ];

					rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
					rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

				}
				//Drag and draw
				/*
				if (SpaceIsDown){
					createCube(intersect.point,intersect.face.normal,true);//true because local player, not remote
				}*/

				render();

			}

			function onDocumentMouseDown( event ) {

				event.preventDefault();

				mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

				raycaster.setFromCamera( mouse, camera );

				var intersects = raycaster.intersectObjects( objects );

				if ( intersects.length > 0 ) {

					var intersect = intersects[ 0 ];

					// delete cube

					if ( isShiftDown ) {

						if ( intersect.object != plane ) {

							scene.remove( intersect.object );

							objects.splice( objects.indexOf( intersect.object ), 1 );

						}

					// sphere create

					} if(XisDown){
						createSphere(intersect.point,intersect.face.normal);
						}
						
					// cube create
					else {
						//createCube(intersect.point,intersect.face.normal,true);//true because local player, not remote
					}

					render();

				}

			}

			function onDocumentKeyDown( event ) {
				var setNewColor = false;

				switch( event.keyCode ) {

					case 16: isShiftDown = true; break;
					case 88: XisDown = true; break;
					case 80: console.log(objects, objects[1].position);
					case 32: SpaceIsDown = true; break;
					case 82: setNewColor=true;break;
					case 71: setNewColor=true;break;
					case 66: setNewColor=true;break;
				}
				if(setNewColor){
					//set material color
					cubeMaterialColorKey = event.keyCode;
					cubeMaterial = new THREE.MeshLambertMaterial( { color: colorPic(event.keyCode), map: new THREE.TextureLoader().load( "static/three.js/examples/textures/square-outline-textured.png" ) } );
				
				}

			}

			function onDocumentKeyUp( event ) {
				
				switch ( event.keyCode ) {

					case 16: isShiftDown = false; break;
					case 88: XisDown = false; break;
					case 32: createCube(mouseIntersects.point,mouseIntersects.face.normal,true);//true because local player, not remote
							render();
							SpaceIsDown = false; break;

				}

			}

			function render() {
				if(objects.length>1){objects[1].position.x++};
				

				renderer.render( scene, camera );
			}
			
			function animate() {
				requestAnimationFrame( animate );
				controls.update();
				
			}

function colorPic (key){
	
	switch (key){
		//r
		case 82: return "rgb(100%, 0%, 0%)"; 
		
		//g
		case 71: return "rgb(0%, 100%, 0%)";
		
		//b
		case 66: return "rgb(0%, 0%, 100%)";		
		
		//gray
		default: return "rgb(33%, 33%, 34%)";			 
	}	
};

function createCube(intersectPoint,intersectFaceNormal,MyBlock, cm) {
	
			//another person's block needs to be built
			if(typeof cm !== 'undefined'){
				/*doing this:
				cubeMaterial.color = cm 
				was resulting in all cubes since a color change turning this color
				switch to it to see*/
				//set material color
				material = new THREE.MeshLambertMaterial( { color: colorPic(cm), map: new THREE.TextureLoader().load( "static/three.js/examples/textures/square-outline-textured.png" ) } );
				//create box
				var voxel = new THREE.Mesh( cubeGeo, material );
						voxel.position.copy( intersectPoint ).add( intersectFaceNormal );
						voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

				scene.add( voxel );

				objects.push( voxel );
				render();};
				
			if(!isShiftDown && typeof cm === 'undefined'){
						var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
						voxel.position.copy( intersectPoint ).add( intersectFaceNormal );
						voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

						scene.add( voxel );

						objects.push( voxel );};
						
						
			//tell server where you put cube and it's color
			if(MyBlock) {
						WebSocket.send(JSON.stringify({"nb":{"id":UNIQUE_ID,"ip":intersectPoint, "ifn":intersectFaceNormal, "c":cubeMaterialColorKey}}));
						}	
											
		};
function createSphere(intersectPoint,intersectFaceNormal,notMyBlock) {
						var voxel = new THREE.Mesh( sphereGeo, sphereMaterial );
						voxel.position.copy( intersectPoint ).add( intersectFaceNormal );
						voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

						scene.add( voxel );

						objects.push( voxel );
						if (notMyBlock) {
							render();
						}else {
						//tell server where you put cube
						WebSocket.send(JSON.stringify({"nb":{"id":UNIQUE_ID,"ip":intersectPoint, "ifn":intersectFaceNormal}}));
						}						
					};
WebSocket.on('message', function(msg) {
		/* NEED UNIQUE ID FILTER ELSE ENDLESS LOOP !!! */
			var JSONdata = JSON.parse(msg);
			if (JSONdata.nb.id !== UNIQUE_ID) {
				createCube(JSONdata.nb.ip,JSONdata.nb.ifn,false,JSONdata.nb.c)};
		});
				