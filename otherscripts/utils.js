import { Group } from "three";


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

 function toJson(hand){
    if(hand instanceof Array){

    }else if(hand instanceof Group){

    }
}

