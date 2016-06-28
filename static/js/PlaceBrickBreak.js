

			// Detects webgl
            if ( ! Detector.webgl ) {
                Detector.addGetWebGLMessage();
                document.getElementById( 'container' ).innerHTML = "";
            }

            // - Global variables -

			//mouse			
			var mouse = new THREE.Vector2();
			var raycaster = new THREE.Raycaster();
			
			var objects = [];//voxel holder


			// Graphics variables
            var container, stats;
            var camera, controls, scene, renderer;
            var textureLoader;
            var clock = new THREE.Clock();
            var rollOverMesh, rollOverMaterial;
            var cubeGeo, cubeMaterial,cubeMaterialColorKey;

            // Physics variables
            var gravityConstant = -19.8;//-9.8; //normal
			var collisionConfiguration;
			var dispatcher;
			var broadphase;
			var solver;
			var physicsWorld;
			var rigidBodies = [];
			var margin = 0.05;
			var hinge;
			var rope;
			var transformAux1 = new Ammo.btTransform();

			var time = 0;
			var armMovement = 0;

			// - Main code -

            init();
            animate();


            // - Functions -

            function init() {

				initGraphics();

				initPhysics();

				createObjects();

				initInput();

            }

            function initGraphics() {

				container = document.getElementById( 'container' );

                camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );

                scene = new THREE.Scene();
                
				// mouse roll-over helper
				rollOverGeo = new THREE.BoxGeometry( 1, 1, 1 );
				rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
				rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
				scene.add( rollOverMesh );


				camera.position.x = -7;
				camera.position.y = 5;
                camera.position.z =  8;

                controls = new THREE.OrbitControls( camera );
                controls.target.y = 2;

                renderer = new THREE.WebGLRenderer();
				renderer.setClearColor( 0xf0f0f0 );
                renderer.setPixelRatio( window.devicePixelRatio );
                renderer.setSize( window.innerWidth, window.innerHeight );
              

                textureLoader = new THREE.TextureLoader();

				var ambientLight = new THREE.AmbientLight( 0x404040 );
				scene.add( ambientLight );

				var light = new THREE.DirectionalLight( 0xffffff, 1 );
                light.position.set( -10, 10, 5 );
                
                scene.add( light );

                container.innerHTML = "";

                container.appendChild( renderer.domElement );
				
				//frame rate data on screen
                stats = new Stats();
                stats.domElement.style.position = 'absolute';
                stats.domElement.style.top = '0px';
                container.appendChild( stats.domElement );
                

                //EVENT LISTENERS

             document.addEventListener( 'mousemove', onDocumentMouseMove, false );
				document.addEventListener( 'mousedown', onDocumentMouseDown, false );
				//document.addEventListener( 'keydown', onDocumentKeyDown, false );
				//document.addEventListener( 'keyup', onDocumentKeyUp, false );
				
				//
				window.addEventListener( 'resize', onWindowResize, false );

            }

			function initPhysics() {

				// Physics configuration

				collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
				//http://www.continuousphysics.com/Bullet/BulletFull/classbtCollisionDispatcher.html#details
				dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
				
				//http://www.continuousphysics.com/Bullet/BulletFull/structbtDbvtBroadphase.html#details
				broadphase = new Ammo.btDbvtBroadphase();
				
				//http://www.continuousphysics.com/Bullet/BulletFull/classbtSequentialImpulseConstraintSolver.html#details
				solver = new Ammo.btSequentialImpulseConstraintSolver();
				
				
				softBodySolver = new Ammo.btDefaultSoftBodySolver();
				physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
				
				physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );
				physicsWorld.getWorldInfo().set_m_gravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

            }

            function createObjects() {
				
				//global: raycaster = new THREE.Raycaster();
				
				//global: mouse = new THREE.Vector2();

				var pos = new THREE.Vector3();//http://threejs.org/docs/api/math/Vector3.htmlaa
				
				var quat = new THREE.Quaternion();//http://threejs.org/docs/api/math/Quaternion.html

				// Ground
				pos.set( 0, - 0.5, 0 );
				quat.set( 0, 0, 0, 1 );
				
				//merge physics and graphics
				var ground = createParalellepiped( 40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
				
				//ground.castShadow = true;
				//ground.receiveShadow = true;
				textureLoader.load( "static/ammo.js/examples/textures/grid.png", function( texture ) {
					texture.wrapS = THREE.RepeatWrapping;
					texture.wrapT = THREE.RepeatWrapping;
					texture.repeat.set( 40, 40 );
					ground.material.map = texture;
					ground.material.needsUpdate = true;
				} );
				
				// grid on ground

				var size = 10, step = 1;

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


				// Ground
				
				var geometry = new THREE.PlaneBufferGeometry( 20, 20 );
				console.log(geometry.attributes.position);
				geometry.rotateX( - Math.PI / 2 );
				plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
				scene.add( plane );
				objects.push( plane );


				// Ball
				var ballMass = 10.2;
				var ballRadius = 0.6;

				var ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 20, 20 ), new THREE.MeshPhongMaterial( { color: 0x202020 } ) );
				ball.castShadow = true;
				ball.receiveShadow = true;
				var ballShape = new Ammo.btSphereShape( ballRadius );
				ballShape.setMargin( margin );
				pos.set( -3, 2, 0 );
				quat.set( 0, 0, 0, 1 );
				createRigidBody( ball, ballShape, ballMass, pos, quat );
				ball.userData.physicsBody.setFriction( 0.5 );

				// Wall
				/*
				var brickMass = 0.5;
				var brickLength = 1.2;
				var brickDepth = 0.6;
				var brickHeight = brickLength * 0.5;
				var numBricksLength = 6;
				var numBricksHeight = 8;
				var z0 = - numBricksLength * brickLength * 0.5;
				pos.set( 0, brickHeight * 0.5, z0 );//pos.set( 0, brickHeight * 0.5, z0 );
				quat.set( 0, 0, 0, 1 );
				for ( var j = 0; j < numBricksHeight; j ++ ) {

					var oddRow = ( j % 2 ) == 1;

					pos.z = z0;

					if ( oddRow ) {
						pos.z -= 0.25 * brickLength;
					}

					var nRow = oddRow? numBricksLength + 1 : numBricksLength;
					for ( var i = 0; i < nRow; i ++ ) {

						var brickLengthCurrent = brickLength;
						var brickMassCurrent = brickMass;
						if ( oddRow && ( i == 0 || i == nRow - 1 ) ) {
							brickLengthCurrent *= 0.5;
							brickMassCurrent *= 0.5;
						}

						var brick = createParalellepiped( brickDepth, brickHeight, brickLengthCurrent, brickMassCurrent, pos, quat, createMaterial() );
						brick.castShadow = false;
						brick.receiveShadow = true;

						if ( oddRow && ( i == 0 || i == nRow - 2 ) ) {
							pos.z += 0.75 * brickLength;
						}
						else {
							pos.z += brickLength;
						}

					}
					pos.y += brickHeight;
				}
*/
				// The rope
				// Rope graphic object
				var ropeNumSegments = 10;
				var ropeLength = 4;
				var ropeMass = 3;
				var ropePos = ball.position.clone();
				ropePos.y += ballRadius;

				var segmentLength = ropeLength / ropeNumSegments;
				var ropeGeometry = new THREE.BufferGeometry();
				var ropeMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
				var ropePositions = [];
				var ropeIndices = [];

				for ( var i = 0; i < ropeNumSegments + 1; i++ ) {
					ropePositions.push( ropePos.x, ropePos.y + i * segmentLength, ropePos.z );
				}

				for ( var i = 0; i < ropeNumSegments; i++ ) {
					ropeIndices.push( i, i + 1 );
				}

				ropeGeometry.setIndex( new THREE.BufferAttribute( new Uint16Array( ropeIndices ), 1 ) );
				ropeGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ropePositions ), 3 ) );
				ropeGeometry.computeBoundingSphere();
				rope = new THREE.LineSegments( ropeGeometry, ropeMaterial );
				rope.castShadow = true;
				rope.receiveShadow = true;
				scene.add( rope );

				// Rope physic object
				var softBodyHelpers = new Ammo.btSoftBodyHelpers();
				var ropeStart = new Ammo.btVector3( ropePos.x, ropePos.y, ropePos.z );
				var ropeEnd = new Ammo.btVector3( ropePos.x, ropePos.y + ropeLength, ropePos.z );
				
				var ropeSoftBody = softBodyHelpers.CreateRope( physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0 );
				
				var sbConfig = ropeSoftBody.get_m_cfg();
				
				sbConfig.set_viterations( 10 );
				sbConfig.set_piterations( 10 );
				ropeSoftBody.setTotalMass( ropeMass, false )
				Ammo.castObject( ropeSoftBody, Ammo.btCollisionObject ).getCollisionShape().setMargin( margin * 3 );
				physicsWorld.addSoftBody( ropeSoftBody, 1, -1 );
				rope.userData.physicsBody = ropeSoftBody;
				// Disable deactivation
				ropeSoftBody.setActivationState( 4 );

				// The base
				var armMass = 2;
				var armLength = 3;
				var pylonHeight = ropePos.y + ropeLength;
				var baseMaterial = new THREE.MeshPhongMaterial( { color: 0x606060 } );
				pos.set( ropePos.x, 0.1, ropePos.z - armLength );
				quat.set( 0, 0, 0, 1 );
				
				var base = createParalellepiped( 1, 0.2, 1, 0, pos, quat, baseMaterial );
				base.castShadow = true;
				base.receiveShadow = true;
				pos.set( ropePos.x, 0.5 * pylonHeight, ropePos.z - armLength );
				
				var pylon = createParalellepiped( 0.4, pylonHeight, 0.4, 0, pos, quat, baseMaterial );
				pylon.castShadow = true;
				pylon.receiveShadow = true;
				pos.set( ropePos.x, pylonHeight + 0.2, ropePos.z - 0.5 * armLength );
				
				var arm = createParalellepiped( 0.4, 0.4, armLength + 0.4, armMass, pos, quat, baseMaterial );
				arm.castShadow = true;
				arm.receiveShadow = true;

				// Glue the rope extremes to the ball and the arm
				var influence = 1;
				ropeSoftBody.appendAnchor( 0, ball.userData.physicsBody, true, influence );
				ropeSoftBody.appendAnchor( ropeNumSegments, arm.userData.physicsBody, true, influence );

				// Hinge constraint to move the arm
				var pivotA = new Ammo.btVector3( 0, pylonHeight * 0.5, 0 );
				var pivotB = new Ammo.btVector3( 0, -0.2, - armLength * 0.5 );
				var axis = new Ammo.btVector3( 0, 1, 0 );
				
				hinge = new Ammo.btHingeConstraint( pylon.userData.physicsBody, arm.
				userData.physicsBody, pivotA, pivotB, axis, axis, true );
				
				physicsWorld.addConstraint( hinge, true );


            }

            function createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {

				var threeObject = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
				var shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
				shape.setMargin( margin );

				createRigidBody( threeObject, shape, mass, pos, quat );

				return threeObject;

            }

            function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

            	threeObject.position.copy( pos );
            	threeObject.quaternion.copy( quat );

				var transform = new Ammo.btTransform();
    			transform.setIdentity();
    			transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    			transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
				var motionState = new Ammo.btDefaultMotionState( transform );

				var localInertia = new Ammo.btVector3( 0, 0, 0 );
		    	physicsShape.calculateLocalInertia( mass, localInertia );

		    	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
		    	var body = new Ammo.btRigidBody( rbInfo );

				threeObject.userData.physicsBody = body;

				scene.add( threeObject );

				if ( mass > 0 ) {
					rigidBodies.push( threeObject );
					console.log(rigidBodies.length);
					document.getElementById('info').innerHTML = "Ammo.js soft body rope demo<br>Press Q or A to move the arm.<br>Block Count: " +(rigidBodies.length -2);//pylon and ball removed

					// Disable deactivation
					body.setActivationState( 4 );
				}

				physicsWorld.addRigidBody( body );

            }

			function createRandomColor() {
				return Math.floor( Math.random() * ( 1 << 24 ) );
			}

            function createMaterial() {
            	return new THREE.MeshPhongMaterial( { color: createRandomColor() } );
            }

            function initInput() {

            	window.addEventListener( 'keydown', function( event ) {

					switch ( event.keyCode ) {
						// Q
						case 81:
							armMovement = 1;
						break;

						// A
						case 65:
							armMovement = - 1;
						break;
					}

            	}, false );

				window.addEventListener( 'keyup', function( event ) {

					armMovement = 0;

            	}, false );

            }

            function onWindowResize() {

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();

                renderer.setSize( window.innerWidth, window.innerHeight );

            }

            function animate() {

                requestAnimationFrame( animate );

                render();
                stats.update();

            }

            function render() {

            	var deltaTime = clock.getDelta();

            	updatePhysics( deltaTime );

                controls.update( deltaTime );

                renderer.render( scene, camera );

                time += deltaTime;

            }

            function updatePhysics( deltaTime ) {

            	// Hinge control
            	hinge.enableAngularMotor( true, 1.5 * armMovement, 50 );

				// Step world
				physicsWorld.stepSimulation( deltaTime, 10 );

				// Update rope
				var softBody = rope.userData.physicsBody;
				var ropePositions = rope.geometry.attributes.position.array;
				var numVerts = ropePositions.length / 3;
				var nodes = softBody.get_m_nodes();
				var indexFloat = 0;
				for ( var i = 0; i < numVerts; i ++ ) {

					var node = nodes.at( i );
					var nodePos = node.get_m_x();
					ropePositions[ indexFloat++ ] = nodePos.x();
					ropePositions[ indexFloat++ ] = nodePos.y();
					ropePositions[ indexFloat++ ] = nodePos.z();

				}
				rope.geometry.attributes.position.needsUpdate = true;

			    // Update rigid bodies
			    for ( var i = 0, il = rigidBodies.length; i < il; i++ ) {
			    	var objThree = rigidBodies[ i ];
			    	var objPhys = objThree.userData.physicsBody;
					var ms = objPhys.getMotionState();
					if ( ms ) {

			        	ms.getWorldTransform( transformAux1 );
						var p = transformAux1.getOrigin();
						var q = transformAux1.getRotation();
						objThree.position.set( p.x(), p.y(), p.z() );
						objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

			      	}
			    }

			}

function onDocumentMouseMove( event ) {

				event.preventDefault();

				mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

				raycaster.setFromCamera( mouse, camera );

				var intersects = raycaster.intersectObjects( objects );
	//			console.log(intersects);

				if ( intersects.length > 0 ) {

					var intersect = intersects[ 0 ];
					mouseIntersects = intersects[ 0 ];

					rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );

				}
				//Drag and draw
				/*
				if (SpaceIsDown){
					createCube(intersect.point,intersect.face.normal,true);//true because local player, not remote
				}*/

				render();

			}
			
function onDocumentMouseDown( event ) {
				// physics
				var brickMass = 0.2;
				var brickLength = 1;
				var brickDepth = 1;
				var brickHeight = 1;
	
				var pos = new THREE.Vector3();//http://threejs.org/docs/api/math/Vector3.html
				var quat = new THREE.Quaternion();//http://threejs.org/docs/api/math/Quaternion.html
		

				event.preventDefault();

				mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 +1 );

				raycaster.setFromCamera( mouse, camera );

				var intersects = raycaster.intersectObjects( objects );

				if ( intersects.length > 0 ) {

					var intersect = intersects[ 0 ];
						
					// cube create
					//cubeGeo = new THREE.BoxGeometry( 1, 1, 1 );
					// COLOR GUIDE: http://threejs.org/docs/api/math/Color.html
				//	cubeMaterial = new THREE.MeshLambertMaterial( { color: "rgb(33%, 33%, 34%)", map: new THREE.TextureLoader().load( "static/three.js/examples/textures/square-outline-textured.png" ) } );

					//	var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
						//voxel.position.copy( intersect.point ).add( intersect.face.normal );
						
						//console.log(intersect.point);
						
						pos.set( intersect.point.x, intersect.point.y, intersect.point.z );//pos.set( 0, brickHeight * 0.5, z0 );
						quat.set( 0, 0, 0, 1 );
						var brick = createParalellepiped( brickDepth, brickHeight, brickLength, brickMass, pos, quat, createMaterial() );

						scene.add( brick );

						objects.push( brick );
						

					render();

				}

			}

