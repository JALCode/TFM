import * as THREE from 'three';
import { XRHandCustom } from '../../otherscripts/XRHandCustom.js';
import { World, Component, Types } from 'three/examples/jsm/libs/ecsy.module.js';
import {Text} from 'troika-three-text/src/Text.js'
// import { detector } from './otherscripts/objects';

class Object3D extends Component { }

Object3D.schema = {
	object: { type: Types.Ref }
};


const world = new World();
const clock = new THREE.Clock();
let camera, scene, renderer, handRenderer;
let mirrorScene;
let handCamera;


let hand1, hand2;
let mirrorHand1, mirrorHand2;


const canvasRender = document.querySelector("#display");
const controlContainer = document.querySelector("#controlContainer");
const predictCheck = document.querySelector(".form-check-input#predict");
const selectedHand = document.querySelector("#selectedHand");

init();
animate();


function init() {

	const container = document.querySelector("#mainContainer");
	// document.createElement( 'div' );
	// document.body.appendChild( container );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x000000 );
	mirrorScene = new THREE.Scene();
	mirrorScene.background = new THREE.Color( 0x000000 );
	// viewerSize = Math.min(window.innerWidth, window.innerHeight, Math.max(window.innerWidth/2, window.innerHeight/2));
	camera = new THREE.PerspectiveCamera( 90, controlContainer.clientWidth / controlContainer.clientHeight, 0.1, 100 );
	camera.position.set( 0, 1.2, 0.3 );
	handCamera = new THREE.PerspectiveCamera( 30, 1, 0.1, 100 );
	handCamera.position.set( 0, 1.2, 0.3 );
	handCamera.lookAt( 0, 0, 0 );


	scene.add( new THREE.HemisphereLight( 0x808080, 0x606060 ) );
	mirrorScene.add( new THREE.HemisphereLight( 0x808080, 0x606060 ) );

	const light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 6, 0 );
	light.castShadow = true;
	light.shadow.camera.top = 2;
	light.shadow.camera.bottom = - 2;
	light.shadow.camera.right = 2;
	light.shadow.camera.left = - 2;
	light.shadow.mapSize.set( 4096, 4096 );
	scene.add( light );
	const light2 = new THREE.DirectionalLight( 0xffffff );
	light2.position.set( 0, 0.5, 0 );
	light2.castShadow = false;
	light2.shadow.camera.top = 2;
	light2.shadow.camera.bottom = - 2;
	light2.shadow.camera.right = 2;
	light2.shadow.camera.left = - 2;
	light2.shadow.mapSize.set( 4096, 4096 );
	mirrorScene.add( light2 );

	renderer = new THREE.WebGLRenderer( { antialias: true , preserveDrawingBuffer:true} );
	handRenderer = new THREE.WebGLRenderer( { canvas: canvasRender , preserveDrawingBuffer:true} );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( controlContainer.clientWidth, controlContainer.clientHeight );
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.shadowMap.enabled = true;
	renderer.xr.enabled = true;
	renderer.xr.cameraAutoUpdate = true;
	
	handRenderer.outputColorSpace = THREE.SRGBColorSpace;
	handRenderer.shadowMap.enabled = true;
	handRenderer.xr.cameraAutoUpdate = true;
	


	window.renderer = renderer;
	window.handRenderer = handRenderer;
	window.scene = scene;
	window.camera = camera;
	window.handCamera = handCamera;
	renderer.domElement.setAttribute("id","webXRCanvas")


	

	container.appendChild( renderer.domElement );

	// Hand 1
	hand1 = new XRHandCustom( "right" );
	hand1.name = "hand1"
	scene.add( hand1 );

	// Hand 2

	hand2 = new XRHandCustom( "left" );
	hand2.name = "hand2"
	scene.add( hand2 );

	// Hand 1
	mirrorHand1 = new XRHandCustom( "right" );
	mirrorHand1.name = "mirrorHand1"
	mirrorScene.add( mirrorHand1 );

	// Hand 2

	mirrorHand2 = new XRHandCustom( "left" );
	mirrorHand2.name = "mirrorHand1"
	mirrorScene.add( mirrorHand2 );
	window.mirrorHand1 = mirrorHand1;
	window.mirrorHand2 = mirrorHand2;



	 window.h1 = hand1;
	 window.h2 = hand2;

	// const tkGeometry = new THREE.TorusKnotGeometry( 0.5, 0.2, 200, 32 );
	// const tkMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );
	// tkMaterial.metalness = 0.8;
	// const torusKnot = new THREE.Mesh( tkGeometry, tkMaterial );
	// torusKnot.position.set( 0, 1, - 1 );
	// scene.add( torusKnot );

	// const t1 = new Text();
	// t1.Text = "Press to start";
	// t1.fontSize = 0.2;
	// t1.position.set( 0, 0.1, -0.5 );
	// scene.add(t1)
	// window.t = t1;

	world.registerComponent( Object3D );



	window.addEventListener( 'resize', onWindowResize );
	screen.orientation.addEventListener("change", onWindowResize);
}

function onWindowResize() {

	camera.aspect = controlContainer.clientWidth / controlContainer.clientHeight;
	camera.updateProjectionMatrix();

	// viewerSize = Math.min(window.innerWidth, window.innerHeight, Math.max(window.innerWidth/2, window.innerHeight/2));
	renderer.setSize( controlContainer.clientWidth, controlContainer.clientHeight );
	
}

function animate() {

	renderer.setAnimationLoop( render );

}

function render() {

	const delta = clock.getDelta();
	const elapsedTime = clock.elapsedTime;

	renderer.xr.updateCamera( camera );

	world.execute( delta, elapsedTime );
	
	renderer.render( scene, camera );

	copyHand(hand1, mirrorHand1, 0);
	copyHand(hand2, mirrorHand2, 0);

	if (predictCheck.checked){
		predict(Number(selectedHand.value));
	}
}



function snap(val=0, mirror=false){
	let v = [0,0,0];
	let tensor = null;
	if (val==1){
		copyHand(hand2, mirrorHand2);
		v = mirrorHand2.getCenter();
		mirrorHand2.visible = true;
		mirrorHand1.visible = false;
		tensor = mirrorHand2.getJoints(val);
	}else{
		copyHand(hand1, mirrorHand1);
		v = mirrorHand1.getCenter();
		mirrorHand2.visible = false;
		mirrorHand1.visible = true;
		tensor = mirrorHand1.getJoints(val);
	}
	handCamera.position.fromArray(v);
	handCamera.position.z = handCamera.position.z + 0.4;
	handCamera.lookAt(v[0],v[1],v[2])
	handRenderer.xr.updateCamera( handCamera );
	handRenderer.render( mirrorScene, handCamera );

	return tensor;
}

function load(joints, val=0){
	let v = [0,0,0];
	let tensor = null;
	if (val==1){
		mirrorHand2.setBonesFromJoints(joints);
		v = mirrorHand2.getCenter();
		mirrorHand2.visible = true;
		mirrorHand1.visible = false;
		tensor = mirrorHand2.getTensor();
	}else{
		mirrorHand1.setBonesFromJoints(joints);
		v = mirrorHand1.getCenter();
		mirrorHand2.visible = false;
		mirrorHand1.visible = true;
		tensor = mirrorHand1.getTensor();
	}
	handCamera.position.fromArray(v);
	handCamera.position.z = handCamera.position.z + 0.4;
	handCamera.lookAt(v[0],v[1],v[2])
	handRenderer.xr.updateCamera( handCamera );
	handRenderer.render( mirrorScene, handCamera );

	return tensor;
}

handRenderer.snap = snap;
handRenderer.load = load;