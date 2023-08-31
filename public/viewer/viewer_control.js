const classListContainer = document.querySelector("#controlContainer");
const newClassBtn = document.querySelector("#newClassBtn");
const trainBtn = document.querySelector("#trainBtn");
const predictBtn = document.querySelector("#predictBtn");
const classExample = document.querySelector("#classExample");
const canvasRender = document.querySelector("#display");
const dualHand = document.querySelector(".form-check-input#dualHand");
const predictCheck = document.querySelector(".form-check-input#predict");
var displayContainer;
window.onload = function(){
    displayContainer = document.querySelector("#displayContainer");
}
const predictedClass = document.querySelector("#predictedClass");
const predictedText = document.querySelector("#predictedText");
var kSelected = "sqr";
var tensorList = {}
const domList = []
var result = {}
var resultProbs = {}

function createClass(){
	let div = classExample.cloneNode(true);

    let id = domList.length;
    if(!tensorList[id]) tensorList[id] = [];
    div.setAttribute("id",id);
    div.setAttribute("class","class-container m-1");
    let b = div.querySelector("button#snap");
    div.querySelector("#className").innerHTML="Class "+id;
    b.onclick = function() { 
        tensorList[id].push(handRenderer.snap(0)); 
        displayCopy = displayContainer.cloneNode(true) ;
        canvasCopy = cloneCanvas(document.querySelector("#display"));
        canvasCopy.setAttribute("class","display-background");
        displayCopy.appendChild(canvasCopy);
        displayCopy.setAttribute("class","display col");
        div.querySelector("div#exampleRow").appendChild(displayCopy);
    };
    
    let bl = div.querySelector("button#snapLeft");
    bl.onclick = function() { 
        tensorList[id].push(handRenderer.snap(1,dualHand.checked));
        // div.querySelector("div#exampleRow").appendChild(cloneCanvas(document.querySelector("#display")))
        displayCopy = displayContainer.cloneNode(true) ;
        canvasCopy = cloneCanvas(document.querySelector("#display"));
        canvasCopy.setAttribute("class","display-background");
        displayCopy.appendChild(canvasCopy);
        displayCopy.setAttribute("class","display col");
        div.querySelector("div#exampleRow").appendChild(displayCopy);
    };

    let rb = div.querySelector("button#remove");
    rb.onclick = function() { 
        // delete tensorList[id];
        // classListContainer.removeChild(div)
        // let index = domList.indexOf(div)
        // if(index>-1){
        //     domList.splice(index,1);
        // }
        tensorList[id] = []
        div.querySelector("div#exampleRow").innerHTML="";
    };

    let hb = div.querySelector("button#hide");
    hb.onclick = function() { 
        let row = div.querySelector("div#exampleRow");
        if(row.classList.contains("invisible")){
            row.classList.remove("invisible");
            hb.innerHTML = "hide";
        }else{
            row.classList.add("invisible");
            hb.innerHTML = "show";
        }
    };
    domList.push(div);

    classListContainer.appendChild(div);
}

newClassBtn.onclick = function(){createClass();}
trainBtn.onclick = function(){train()};
predictBtn.onclick = function(){predict(Number(selectedHand.value));}

function predict(hand=0){
    if(hand==1){
        classifier.predictClass(tf.tensor(h2.getTensor(dualHand.checked))).then(
            (res)=>{
                console.log(res.label);
                h2.text.text = res.label;
                h1.text.text = "";
                h2.text.lookAt(camera.position)
                predictedClass.innerHTML=res.label
            }
        )
    }else{
        classifier.predictClass(tf.tensor(h1.getTensor())).then(
            (res)=>{
               console.log(res.label);
               h1.text.text = res.label;
               h2.text.text = "";
               h1.text.lookAt(camera.position)
               predictedClass.innerHTML=res.label
            }
        ) 
    }
}

async function predictFile(){
    result = {}
    resultProbs = {}
    var file = document.getElementById("fileTest").files[0];

    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        let k= kSelected;
        if (typeof(k)=="string") k = Math.max(Math.round(Math.sqrt(classifier.getNumExamples())),3);
        reader.onload = async (evt) => {
            let jsonObj = JSON.parse(evt.target.result);
            
            for(var i of Object.keys(jsonObj)){
                result[i]=[]
                resultProbs[i]=[]
                for(var t of jsonObj[i]){
                    await classifier.predictClass(tf.tensor(getTensorFromJoints(t)),k=k).then(
                        (res)=>{
                            result[i].push(res.label);
                            resultProbs[i].push(res.confidences);
                        }
                    );
                }
                
               
            }

        }
    }
    console.log("Tested");
}


function saveState(){

    let jsonStr = JSON.stringify(tensorList)
  
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([jsonStr], {type: "text/plain"}));
    a.download = "dataset.json";
    a.click();
    
    train()
    a.href = window.URL.createObjectURL(new Blob([jsonStr], {type: "text/plain"}));
    a.download = "model.json";
    a.click();

  
}

function saveVar(v){

    let jsonStr = JSON.stringify(v)
  
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([jsonStr], {type: "text/plain"}));
    a.download = "r11"+classifier.classExampleCount[0]+"-OR"+kSelected+".json";
    a.click();

}

function loadState(){

    var file = document.getElementById("fileModel").files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            let jsonObj = JSON.parse(evt.target.result);
            tensorList = jsonObj;
            let max = Object.keys(tensorList)[Object.keys(tensorList).length-1]
            for(var i = 0; i <= max; i++){
                if(!domList[i]){
                    createClass();
                }else{
                    domList[i].querySelector("div#exampleRow").innerHTML="";
                }
                if(tensorList[i]){
                    for(var t of tensorList[i]){
                        handRenderer.load(t, t["handness"]);
                        displayCopy = displayContainer.cloneNode(true) ;
                        canvasCopy = cloneCanvas(document.querySelector("#display"));
                        canvasCopy.setAttribute("class","display-background");
                        displayCopy.appendChild(canvasCopy);
                        displayCopy.setAttribute("class","display col");
                        domList[i].querySelector("div#exampleRow").appendChild(displayCopy);
                        // domList[i].querySelector("div#exampleRow").appendChild(cloneCanvas(document.querySelector("#display")));
                    }
                }
            }

            classifier = knnClassifier.create();
            train();
        
            console.log("Loaded knn");

        }
        reader.onerror = function (evt) {
            console.log("error reading file");
        }
    }
}

function train(){
    tensors = {}

    for(const c_index in tensorList){
        tensors[c_index]=[]
        for(const j of tensorList[c_index]){
            let mirror = false;
            if(j["handness"] == 1){
                mirror = dualHand.checked
            }
            tensors[c_index].push(getTensorFromJoints(j,mirror));
        }
    }

    addExamples(tensors);
    if(classifier.getNumExamples()>0){
        predictedText.removeAttribute("class");
        predictBtn.removeAttribute("disabled");
        predictCheck.removeAttribute("disabled");
        selectedHand.removeAttribute("disabled");
        let classes = document.querySelectorAll("div#exampleRow");
        for(const c of classes){
            c.classList.add("invisible");
            c.parentElement.querySelector("#hide").innerHTML = "show";
        }
    }else{
        alert("No examples added to train")
    }
}