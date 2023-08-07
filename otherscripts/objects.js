import * as THREE from 'three';
import {Text} from 'troika-three-text'

export class detector{
    name = null;
    time = new THREE.Clock();
    title = new Text();
    innerText = new Text();
    scale = {x:0.2,y:0.2,z:0.2}
    type = 0;

    box = new THREE.Mesh(
		new THREE.BoxGeometry(this.scale.x,this.scale.y,this.scale.z),
		new THREE.MeshBasicMaterial({color: 0xff0000,opacity: 0.1,transparent:true})
	);

    constructor(name, type = 0, position={x:0,y:0,z:0}){
        this.name = name;
        this.title.text = this.name;
        this.setPosition(position);
        this.type = type;
        this.innerText.anchorX="center";
    }

    setPosition(position){
        this.box.position.set(position.x,position.y,position.z);
        this.title.position.set(position.x-this.scale.x/2,position.y+this.scale.y/2,position.z+this.scale.x/2+0.0001);
        this.innerText.position.set(position.x,position.y,position.z+this.scale.x/2+0.0001);
    }

    addToScene(scene){
        scene.add(this.box);
        scene.add(this.title);
        scene.add(this.innerText);
    }
    
    detect(hand){
        if(hand.children[0].intersectBoxObject(this.box)){
            if(this.time.running && this.time.getElapsedTime() >3){
                this.box.material.color.setColorName("green");
                addClass(getTensorFromHand(hand), this.type)
                this.innerText.text = "REC "+this.type;
                
            }else if(this.time.getElapsedTime() < 3){
                if(!this.time.running){
                    console.log("Starting");
                    this.time.start()
                }
        
                this.box.material.color.setColorName("blue");
                this.innerText.text = this.time.getElapsedTime().toFixed(2);
                
            }
            
        }else{
            if(this.time.running){ 
                this.time.stop()
                this.time.elapsedTime = 0
                console.log("no");
            }
            this.box.material.color.setColorName("red");
            this.innerText.text = "";
            
        }
    }

    syncTexts(){
        this.innerText.sync();
        this.title.sync();
    }
}


