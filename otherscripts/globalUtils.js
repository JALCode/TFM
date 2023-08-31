const joint_names = [
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

function getTensorFromHand(hand){
    points = [];
    quaternions = [];
    basePos = hand.joints["wrist"].position.toArray();
    baseRot = hand.joints["wrist"].quaternion.toArray();
    for(const j in hand.joints){
        if(j!=='wrist'){
            points = points.concat(subtractArrays(hand.joints[j].position.toArray(),basePos));
            quaternions = quaternions.concat(subtractArrays(hand.joints[j].quaternion.toArray(),baseRot));
        }
    }
    return points.concat(quaternions)
}

function mirrorQuaterion(q){
    let x = q[0];
    let y = q[1];
    let z = q[2];
    let w = q[3];
    return [x,-y,-z,w];
}

function mirrorVector(v){
    return [-v[0],v[1],v[2]];
}

 function subtractArrays(arr1,arr2){
    if(arr1.length===arr2.length){
        r = [];
        for(var i=0; i<arr1.length; i++){
            r.push(arr1[i]-arr2[i]);
        }
        return r;
    }
    throw new Error("Arrays not equal to substract!")
}

function getJSON(hand){
    let handJson = {};
    let ipos = 0;
    let irot = 24*3;
    for(j in joints){
        if(joints[j]!=='wrist'){
            
            joint={}
            joint["position"]={}
            joint["rotation"]={}
            joint["position"]["x"] = hand[ipos];
            joint["position"]["y"] = hand[ipos+1];
            joint["position"]["z"] = hand[ipos+2];
            joint["rotation"]["x"] = hand[irot];
            joint["rotation"]["y"] = hand[irot+1];
            joint["rotation"]["z"] = hand[irot+2];
            joint["rotation"]["w"] = hand[irot+3];
            handJson[joints[j]] = joint
            ipos = ipos+3;
            irot = irot+4;
        }
    }

    return handJson;
}

function saveAsImage() {
    var imgData, imgNode;

    try {
        var strMime = "image/jpeg";
        var strDownloadMime = "image/octet-stream";

        imgData = renderer.domElement.toDataURL(strMime);

        saveFile(imgData.replace(strMime, strDownloadMime), "test.jpg");

    } catch (e) {
        console.log(e);
        return;
    }

}

var saveFile = function (strData, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}

function toFixedNumber(num, digits=4){
    const pow = Math.pow(10, digits);
    return Math.round(num*pow) / pow;
  }

function  reduceFloatArray(array,val = 4){
    arr = []
    for (var i = 0; i < array.length; i++) {
        arr.push(toFixedNumber(array[i],val));
    }
    return arr
}

function getMirrorString(camera, h1, h2){
    mirrorJSON ={};
    mirrorJSON["camera"]=cameraToPosition(camera);
    if(h1.visible){
        mirrorJSON[h1.name]=handToPosition(h1);
    }else{
        mirrorJSON[h1.name]={}
    }
    if(h2.visible){
        mirrorJSON[h2.name]=handToPosition(h2);
    }else{
        mirrorJSON[h2.name]={}
    }

    return JSON.stringify(mirrorJSON)
}

function cameraToPosition(camera){
    cameraPositionJSON = {};
    cameraPositionJSON["p"] =  reduceFloatArray(camera.position.toArray());
    cameraPositionJSON["q"] =  reduceFloatArray(camera.quaternion.toArray());
    return cameraPositionJSON;
}


function handToPosition(hand){
    handPositionJSON = {};
    for(const j in hand.joints){
        handPositionJSON[j] = {}
        handPositionJSON[j]["p"] = reduceFloatArray(hand.joints[j].position.toArray());
        handPositionJSON[j]["q"] = reduceFloatArray(hand.joints[j].quaternion.toArray());
    }
    return handPositionJSON;
}

function setFromString(string,camera, h1, h2){
    mirrorJSON = JSON.parse(string);
    camera.position.fromArray(mirrorJSON["camera"]["p"])
    camera.quaternion.fromArray(mirrorJSON["camera"]["q"])
    if(Object.keys(mirrorJSON["right"]).length>0){
        h1.setBonesFromJoints(mirrorJSON["right"])
        h1.visible = true;
    }else{
        h1.visible = false;
    }
    if(Object.keys(mirrorJSON["left"]).length>0){
        h2.setBonesFromJoints(mirrorJSON["left"])
        h2.visible = true;
    }else{
        h2.visible = false;
    }

}

function copyHand(h1, h1copy){
    for(let i = 0; i < h1.bones.length; i ++ ){
        h1copy.bones[i].position.copy(h1.bones[i].position);
        h1copy.bones[i].quaternion.copy(h1.bones[i].quaternion);
    }
}


// function getCenterOfHand(hand){
//     return hand.bones[0].position.toArray().map((value, index) => (value + hand.bones[14].position.toArray()[index])/2)
// }

function cloneCanvas(oldCanvas) {

    //create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    newCanvas.setAttribute("style",oldCanvas.getAttribute("style"))

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);
    newCanvas.addEventListener('click', (event) => { 
        let row = event.target.parentNode.parentNode;
        let index = Array.prototype.indexOf.call(row.children,event.target.parentNode);
        event.target.parentNode.remove();
        tensorList[row.parentNode.getAttribute("id")].splice(index,1);
        // console.log("Removed "+index);
    }, false)
    //return the new canvas
    return newCanvas;
}

function getTensorFromJoints(joints,mirror=false){
    let points = [];
    // let quaternions = [];
    // let basePos = joints[joint_names[0]]["p"];
    // let baseRot = joints[joint_names[0]]["q"];

    // for ( let i = 1; i < joint_names.length; i ++ ) {
    //         const jn = joint_names[ i ];

    //         if ( joints[jn] ) {
    //             // let p = subtractArrays(joints[jn]["p"],basePos);
    //             let q = subtractArrays(joints[jn]["q"],baseRot);
    //             if(mirror){
    //                 // p = mirrorVector(p);
    //                 q = mirrorQuaterion(q);
    //             }
    //             //  points = points.concat(p);
    //             // quaternions = quaternions.concat(q);
    //             points = points.concat(q);
                
    //         }

    // }
    ///BASE COMPLETE
    for ( let i = 0; i < joint_names.length; i ++ ) {
        const jn = joint_names[ i ];

            if ( joints[jn] ) {
                let q = joints[jn]["q"];
                if(mirror){
                    q = mirrorQuaterion(q);
                }
                points = points.concat(q);
            }
    }

    return points
    // return points.concat(quaternions);

}