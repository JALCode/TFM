import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { OculusHandModel } from 'three/examples/jsm/webxr/OculusHandModel.js';
import { createText } from 'three/examples/jsm/webxr/Text2D.js';
import { World, System, Component, TagComponent, Types } from 'three/examples/jsm/libs/ecsy.module.js';
import {Text} from 'troika-three-text/src/Text.js'


class Object3D extends Component { }

Object3D.schema = {
	object: { type: Types.Ref }
};

class Button extends Component { }

Button.schema = {
	// button states: [resting, pressed, fully_pressed, recovering]
	currState: { type: Types.String, default: 'resting' },
	prevState: { type: Types.String, default: 'resting' },
	pressSound: { type: Types.Ref, default: null },
	releaseSound: { type: Types.Ref, default: null },
	restingY: { type: Types.Number, default: null },
	surfaceY: { type: Types.Number, default: null },
	recoverySpeed: { type: Types.Number, default: 0.4 },
	fullPressDistance: { type: Types.Number, default: null },
	action: { type: Types.Ref, default: () => { } }
};

class ButtonSystem extends System {

	init( attributes ) {

		this.renderer = attributes.renderer;
		this.soundAdded = false;

	}

	execute( /*delta, time*/ ) {

		let buttonPressSound, buttonReleaseSound;
		if ( this.renderer.xr.getSession() && ! this.soundAdded ) {

			const xrCamera = this.renderer.xr.getCamera();

			const listener = new THREE.AudioListener();
			xrCamera.add( listener );

			// create a global audio source
			buttonPressSound = new THREE.Audio( listener );
			buttonReleaseSound = new THREE.Audio( listener );

			// load a sound and set it as the Audio object's buffer
			const audioLoader = new THREE.AudioLoader();
			audioLoader.load( '../sounds/button-press.ogg', function ( buffer ) {

				buttonPressSound.setBuffer( buffer );

			} );
			audioLoader.load( '../sounds/button-release.ogg', function ( buffer ) {

				buttonReleaseSound.setBuffer( buffer );

			} );
			this.soundAdded = true;

		}

		this.queries.buttons.results.forEach( entity => {

			const button = entity.getMutableComponent( Button );
			const buttonMesh = entity.getComponent( Object3D ).object;
			// populate restingY
			if ( button.restingY == null ) {

				button.restingY = buttonMesh.position.y;

			}

			if ( buttonPressSound ) {

				button.pressSound = buttonPressSound;

			}

			if ( buttonReleaseSound ) {

				button.releaseSound = buttonReleaseSound;

			}

			if ( button.currState == 'fully_pressed' && button.prevState != 'fully_pressed' ) {

				if ( button.pressSound ) button.pressSound.play();
				button.action();

			}

			if ( button.currState == 'recovering' && button.prevState != 'recovering' ) {

				if ( button.releaseSound ) button.releaseSound.play();

			}

			// preserve prevState, clear currState
			// FingerInputSystem will update currState
			button.prevState = button.currState;
			button.currState = 'resting';

		} );

	}

}

ButtonSystem.queries = {
	buttons: {
		components: [ Button ]
	}
};

class Pressable extends TagComponent { }

class FingerInputSystem extends System {

	init( attributes ) {

		this.hands = attributes.hands;

	}

	execute( delta/*, time*/ ) {

		this.queries.pressable.results.forEach( entity => {

			const button = entity.getMutableComponent( Button );
			const object = entity.getComponent( Object3D ).object;
			const pressingDistances = [];
			this.hands.forEach( hand => {

				if ( hand && hand.intersectBoxObject( object ) ) {

					const pressingPosition = hand.getPointerPosition();
					pressingDistances.push( button.surfaceY - object.worldToLocal( pressingPosition ).y );

				}

			} );
			if ( pressingDistances.length == 0 ) { // not pressed this frame

				if ( object.position.y < button.restingY ) {

					object.position.y += button.recoverySpeed * delta;
					button.currState = 'recovering';

				} else {

					object.position.y = button.restingY;
					button.currState = 'resting';

				}

			} else {

				button.currState = 'pressed';
				const pressingDistance = Math.max( pressingDistances );
				if ( pressingDistance > 0 ) {

					object.position.y -= pressingDistance;

				}

				if ( object.position.y <= button.restingY - button.fullPressDistance ) {

					button.currState = 'fully_pressed';
					object.position.y = button.restingY - button.fullPressDistance;

				}

			}

		} );

	}

}

FingerInputSystem.queries = {
	pressable: {
		components: [ Pressable ]
	}
};

class Rotating extends TagComponent { }

class RotatingSystem extends System {

	execute( delta/*, time*/ ) {

		this.queries.rotatingObjects.results.forEach( entity => {

			const object = entity.getComponent( Object3D ).object;
			object.rotation.x += 0.4 * delta;
			object.rotation.y += 0.4 * delta;

		} );

	}

}

RotatingSystem.queries = {
	rotatingObjects: {
		components: [ Rotating ]
	}
};

class HandsInstructionText extends TagComponent { }

class InstructionSystem extends System {

	init( attributes ) {

		this.controllers = attributes.controllers;

	}

	execute( /*delta, time*/ ) {

		let visible = false;
		this.controllers.forEach( controller => {

			if ( controller.visible ) {

				visible = true;

			}

		} );

		this.queries.instructionTexts.results.forEach( entity => {

			const object = entity.getComponent( Object3D ).object;
			object.visible = visible;

		} );

	}

}

InstructionSystem.queries = {
	instructionTexts: {
		components: [ HandsInstructionText ]
	}
};

class OffsetFromCamera extends Component { }

OffsetFromCamera.schema = {
	x: { type: Types.Number, default: 0 },
	y: { type: Types.Number, default: 0 },
	z: { type: Types.Number, default: 0 },
};

class NeedCalibration extends TagComponent { }

class CalibrationSystem extends System {

	init( attributes ) {

		this.camera = attributes.camera;
		this.renderer = attributes.renderer;

	}

	execute( /*delta, time*/ ) {

		this.queries.needCalibration.results.forEach( entity => {

			if ( this.renderer.xr.getSession() ) {

				const offset = entity.getComponent( OffsetFromCamera );
				const object = entity.getComponent( Object3D ).object;
				const xrCamera = this.renderer.xr.getCamera();
				object.position.x = xrCamera.position.x + offset.x;
				object.position.y = xrCamera.position.y + offset.y;
				object.position.z = xrCamera.position.z + offset.z;
				entity.removeComponent( NeedCalibration );

			}

		} );

	}

}

CalibrationSystem.queries = {
	needCalibration: {
		components: [ NeedCalibration ]
	}
};

const world = new World();
const clock = new THREE.Clock();
let camera, scene, renderer, rendererCanvas, myText,mixer;
const mixers = [];

let hand1, hand2;

let streamBool = false;
let canvasRender = document.querySelector("#canvasid");


init();
animate();

function makeButtonMesh( x, y, z, color ) {

	const geometry = new THREE.BoxGeometry( x, y, z );
	const material = new THREE.MeshPhongMaterial( { color: color } );
	const buttonMesh = new THREE.Mesh( geometry, material );
	buttonMesh.castShadow = true;
	buttonMesh.receiveShadow = true;
	return buttonMesh;

}

function init() {

	const container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x444444 );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
	camera.position.set( 0 ,1.5, 1 );
	

	scene.add( new THREE.HemisphereLight( 0x808080, 0x606060 ) );

	const light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 6, 0 );
	light.castShadow = true;
	light.shadow.camera.top = 2;
	light.shadow.camera.bottom = - 2;
	light.shadow.camera.right = 2;
	light.shadow.camera.left = - 2;
	light.shadow.mapSize.set( 4096, 4096 );
	scene.add( light );

	renderer = new THREE.WebGLRenderer( { antialias: true , preserveDrawingBuffer:true} );

	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.shadowMap.enabled = true;
	renderer.xr.enabled = true;
	renderer.xr.cameraAutoUpdate = true;

	renderer.useLegacyLights = false;

	window.renderer = renderer;
	window.rendererCanvas = rendererCanvas;
	window.scene = scene;
	window.camera = camera;
	renderer.domElement.setAttribute("id","webXRCanvas")
	container.appendChild( renderer.domElement );

	document.body.appendChild( VRButton.createButton( renderer ) );

	// controllers
	const controller1 = renderer.xr.getController( 0 );
	scene.add( controller1 );
	window.cont = controller1;
	const controller2 = renderer.xr.getController( 1 );
	scene.add( controller2 );

	const controllerModelFactory = new XRControllerModelFactory();

	// Hand 1
	const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
	controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
	scene.add( controllerGrip1 );
	hand1 = renderer.xr.getHand( 0 );
	const handModel1 = new OculusHandModel( hand1 );

	handModel1.name = "handModel1"
	hand1.add( handModel1 );
	//scene.add(textmesh);
	hand1.name = "hand1"
	scene.add( hand1 );

	// Hand 2
	const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
	controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
	scene.add( controllerGrip2 );
	hand2 = renderer.xr.getHand( 1 );
	const handModel2 = new OculusHandModel( hand2 );
	handModel2.name = "handModel2"
	hand2.add( handModel2 );
	hand2.name = "hand2"
	scene.add( hand2 );

	hand1.addEventListener( 'connected', ( event ) => {
		if(event.data.handedness==="right"){
			hand1.name = "right";
			hand2.name = "left";
		}else{
			hand1.name = "left";
			hand2.name = "right";
		}

		
   });

	
	window.canvasRender=canvasRender;

	 window.h1 = hand1;
	 window.h2 = hand2;


	 const instructionText = createText( 'This demo requires WebXR hands!', 0.04 );
	 instructionText.position.set( 0, 1.6, - 0.6 );
	 scene.add( instructionText );



	world
		.registerComponent( Object3D )
		.registerComponent( Button )
		.registerComponent( Pressable )
		.registerComponent( HandsInstructionText )
		.registerComponent( OffsetFromCamera )
		.registerComponent( NeedCalibration );

	world
		.registerSystem( InstructionSystem, { controllers: [ controllerGrip1, controllerGrip2 ] } )
		.registerSystem( CalibrationSystem, { renderer: renderer, camera: camera } )
		.registerSystem( ButtonSystem, { renderer: renderer, camera: camera } )
		.registerSystem( FingerInputSystem, { hands: [ handModel1, handModel2 ] } );


	const consoleGeometry = new THREE.BoxGeometry( 0.15, 0.12, 0.15 );
	const consoleMaterial = new THREE.MeshPhongMaterial( { color: 0x595959 } );
	const consoleMesh = new THREE.Mesh( consoleGeometry, consoleMaterial );
	consoleMesh.position.set( 0, 1, - 0.5 );
	consoleMesh.castShadow = true;
	consoleMesh.receiveShadow = true;
	scene.add( consoleMesh );

	const text1 = new Text();
	text1.text = "Start";
	text1.fontSize = 0.05;
	text1.position.set(-0.055,0.05,0.1);

	
	const sendButton = makeButtonMesh( 0.08, 0.1, 0.08, 0x05ff05 );
	sendButton.position.set( 0, 0.04, 0 );
	consoleMesh.add( sendButton );
	consoleMesh.add( text1 );
	text1.sync();
	const sendEntity = world.createEntity();
	sendEntity.addComponent( Pressable );
	sendEntity.addComponent( Object3D, { object: sendButton } );
	const sendAction = function () {

		streamBool = !streamBool;
		// consoleMesh.visible = !streamBool;
		if(sendButton.material.color.getHex()== 0xff0505){
			sendButton.material.color.setHex( 0x05ff05);
			text1.text = "Start";
		}else{
			sendButton.material.color.setHex( 0xff0505);
			text1.text = "Stop";
		}
	};
	sendEntity.addComponent( Button, { action: sendAction, surfaceY: 0.05, fullPressDistance: 0.02 } );

	window.cm = consoleMesh;
	window.text = text1;
	

	const itEntity = world.createEntity();
	itEntity.addComponent( HandsInstructionText );
	itEntity.addComponent( Object3D, { object: instructionText } );


	window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	renderer.setAnimationLoop( render );

}



function render() {
	
	const delta = clock.getDelta();

	for ( let i = 0; i < mixers.length; i ++ ) {

		mixers[ i ].update( delta );

	}
	let active = false;
	if(streamBool) active = send(getMirrorString(camera,h1,h2));

	// if(!active) {
	// 	console.visible = true;
	// 	streamBool = false;
	// }

	const elapsedTime = clock.elapsedTime;
	renderer.xr.updateCamera( camera );
	world.execute( delta, elapsedTime );
	renderer.render( scene, camera );

}
