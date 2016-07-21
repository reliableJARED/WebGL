'use strict';

 // This example to create asynchronism timer
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
function testPromise() {

    // We make a new promise... but what are we promising?
	//we promise to return what's inside of resolve(), in this case it's just the number 1
	//when will we return it?
	// resolve() is nested in  window.setTimeout() which is a timer:
		/* Syntax:
			window.setTimeout(function, delay)
			https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout
		*/
	//when the time is up resolve() will be called.  
		
	/*Syntax:
		new Promise( function(resolve, reject) { ... } );
	*/
    var p1 = new Promise(
        // The resolver function is called with the ability to resolve or reject the promise
        function(resolve, reject) {
            console.log('A timer was started');
            window.setTimeout( function() {resolve(1);}, 3000);
			
			/*just calling resolve(1) would also work.  but doesn't make sense if we're making a timer!
			resolve(1);
			*/
        }
    );

    // We define what to do when the promise is resolved/fulfilled with the then() call,
    // and the catch() method defines what to do if the promise is rejected.
    p1.then(
        // Log the fulfillment value
        function(val) {
			//you could also do function(){printmsg();}; and leave out the val
			printmsg();
            console.log('fulfillement value '+val);
        })
    .catch(
        // Log the rejection reason
        function(reason) {
            console.log(reason);
        });

}

function printmsg(){console.log('promis fulfilled')};

testPromise();
