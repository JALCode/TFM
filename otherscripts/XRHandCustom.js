import { Object3D} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {Text} from 'troika-three-text/src/Text.js'

const DEFAULT_HAND_PROFILE_PATH = 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/generic-hand/';


class XRHandCustom extends Object3D{

	constructor( handedness, loader = null ) {

		super();

		this.bones = [];
		this.text = new Text();
		this.text.fontSize = 0.2;
		

		if ( loader === null ) {

			loader = new GLTFLoader();
			loader.setPath( DEFAULT_HAND_PROFILE_PATH );

		}

		loader.load( `${handedness}.glb`, gltf => {

			const object = gltf.scene.children[ 0 ];
			this.add(object)
			const mesh = object.getObjectByProperty( 'type', 'SkinnedMesh' );
			mesh.frustumCulled = false;
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			const joints = [
				'wrist',
				'thumb-metacarpal',
				'thumb-phalanx-proximal',
				'thumb-phalanx-distal',
				'thumb-tip',
				'index-finger-metacarpal',
				'index-finger-phalanx-proximal',
				'index-finger-phalanx-intermediate',
				'index-finger-phalanx-distal',
				'index-finger-tip',
				'middle-finger-metacarpal',
				'middle-finger-phalanx-proximal',
				'middle-finger-phalanx-intermediate',
				'middle-finger-phalanx-distal',
				'middle-finger-tip',
				'ring-finger-metacarpal',
				'ring-finger-phalanx-proximal',
				'ring-finger-phalanx-intermediate',
				'ring-finger-phalanx-distal',
				'ring-finger-tip',
				'pinky-finger-metacarpal',
				'pinky-finger-phalanx-proximal',
				'pinky-finger-phalanx-intermediate',
				'pinky-finger-phalanx-distal',
				'pinky-finger-tip',
			];

			joints.forEach( jointName => {

				const bone = object.getObjectByName( jointName );

				if ( bone !== undefined ) {

					bone.jointName = jointName;

				} else {

					console.warn( `Couldn't find ${jointName} in ${handedness} hand mesh` );

				}

				this.bones.push( bone );

			} );
			this.bones[0].add(this.text);
			// this.text.position.set(-0.05,0.25,0);
			this.text.sync();
		} );
			
	}

	setBonesFromJoints(joints){
		for ( let i = 0; i < this.bones.length; i ++ ) {

				const bone = this.bones[ i ];
	
				if ( bone ) {
	
					const XRJoint = joints[ bone.jointName ];
	
					bone.position.fromArray( XRJoint.p );
					bone.quaternion.fromArray( XRJoint.q );

				}
	
			}
	}

	getTensor(mirror = false){
		let points = [];
		// let quaternions = [];
		// let basePos = this.bones[0].position.toArray();
		// let baseRot = this.bones[0].quaternion.toArray();

		// for ( let i = 1; i < this.bones.length; i ++ ) {
		// 		const bone = this.bones[ i ];

		// 		if ( bone ) {
		// 			// let p = subtractArrays(bone.position.toArray(),basePos);
		// 			let q = subtractArrays(bone.quaternion.toArray(),baseRot);
		// 			if(mirror){
		// 				// p = mirrorVector(p);
		// 				q = mirrorQuaterion(q);
		// 			}
		// 			// points = points.concat(p);
		// 			quaternions = quaternions.concat(q);
					
		// 		}
	
		// 	}
		// return points.concat(quaternions)

		for ( let i = 0; i < this.bones.length; i ++ ) {
			const bone = this.bones[ i ];

			if ( bone ) {
				let q = bone.quaternion.toArray();

				if(mirror){
					q = mirrorQuaterion(q);
				}

				points = points.concat(q);
			}

		}
		return points
	}

	getJoints(val){
		let handPositionJSON = {};
			handPositionJSON["handness"] = val;
		for(const j of this.bones){
			handPositionJSON[j.jointName] = {}
			handPositionJSON[j.jointName]["p"] = reduceFloatArray(j.position.toArray());
			handPositionJSON[j.jointName]["q"] = reduceFloatArray(j.quaternion.toArray());
		}
		return handPositionJSON;
	}

	getCenter(){
		return this.bones[0].position.toArray().map((value, index) => (value + this.bones[14].position.toArray()[index])/2)
	}


	// updateMesh() {

	// 	// XR Joints
	// 	const XRJoints = this.controller.joints;

	// 	for ( let i = 0; i < this.bones.length; i ++ ) {

	// 		const bone = this.bones[ i ];

	// 		if ( bone ) {

	// 			const XRJoint = XRJoints[ bone.jointName ];

	// 			if ( XRJoint.visible ) {

	// 				const position = XRJoint.position;

	// 				bone.position.copy( position );
	// 				bone.quaternion.copy( XRJoint.quaternion );
	// 				// bone.scale.setScalar( XRJoint.jointRadius || defaultRadius );

	// 			}

	// 		}

	// 	}

	// }

}

export { XRHandCustom };
