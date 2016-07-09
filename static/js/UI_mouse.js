var MOUSE = function (){

return{
	onDocumentMouseDown: function ( event ) {
		event.preventDefault();
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
		
		GLOBAL.raycaster.setFromCamera( mouse, GLOBAL.camera);
	   var intersects = GLOBAL.raycaster.intersectObjects( GLOBAL.scene.children );			   
	   
		if (intersects.length >0) {
			if (intersects[0] !== HIGHLIGHT) {
				HIGHLIGHT.position.copy(intersects[0].object.position);
				HIGHLIGHT.material.opacity = 0.5;
	  			var sx = intersects[0].object.geometry.parameters.depth;
	  			var sy = intersects[0].object.geometry.parameters.height;
	  			var sz = intersects[0].object.geometry.parameters.width;
	  			HIGHLIGHT.scale.set(sx * 1.05, sy * 1.05, sz * 1.05);
	  		//	HIGHLIGHT.scale.x = sx * 1.05;
	  		//	HIGHLIGHT.scale.y = sy * 1.05;
	  		//	HIGHLIGHT.scale.z = sz * 1.05;
	  		//	HIGHLIGHT.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
	  			  		//	intersects[0].object.material.color.b = 1;
  			}	
  			if (intersects[0].object.uuid === HIGHLIGHT.uuid ){
  				HIGHLIGHT.position.copy(intersects[1].object.position);
				HIGHLIGHT.material.opacity = 0.5;
	  			var sx = intersects[1].object.geometry.parameters.depth;
	  			var sy = intersects[1].object.geometry.parameters.height;
	  			var sz = intersects[1].object.geometry.parameters.width;
	  			HIGHLIGHT.scale.set(sx * 1.05, sy * 1.05, sz * 1.05);
  			}	
	   }
	   if (intersects.length ===0) {
  				HIGHLIGHT.scale.x = 1;
  				HIGHLIGHT.scale.y = 1;
  				HIGHLIGHT.scale.z = 1;
  			}
		};

	function onDocumentMouseMove( event ) {
	
		};
	}
	
})();