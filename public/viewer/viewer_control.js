const classListContainer = document.querySelector("#classContainer");
const newClassBtn = document.querySelector("#newClassBtn");
const trainBtn = document.querySelector("#trainBtn");
const predictBtn = document.querySelector("#predictBtn");
const classExample = document.querySelector("#classExample");
const canvasRender = document.querySelector("#display");
const dualHand = document.querySelector(".form-check-input#dualHand");
const predictCheck = document.querySelector(".form-check-input#predict");
var tensorList = {}
const domList = []

function createClass(){
	let div = classExample.cloneNode(true);

    let id = domList.length;
    if(!tensorList[id]) tensorList[id] = [];
    div.setAttribute("id",id);
    div.removeAttribute("class");
    let b = div.querySelector("button#snap");
    b.onclick = function() { 
        tensorList[id].push(handRenderer.snap(0)); 
        div.querySelector("div.row-container").appendChild(cloneCanvas(document.querySelector("#display")))
    };
    
    let bl = div.querySelector("button#snapLeft");
    bl.onclick = function() { 
        tensorList[id].push(handRenderer.snap(1,dualHand.checked));
        div.querySelector("div.row-container").appendChild(cloneCanvas(document.querySelector("#display")))
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
        div.querySelector("div.row-container").innerHTML="";
    };

    let hb = div.querySelector("button#hide");
    hb.onclick = function() { 
        let row = div.querySelector("div.row-container");
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
predictBtn.onclick = function(){predict();}

function predict(hand=0){
    if(hand==1){
        classifier.predictClass(tf.tensor(h1.getTensor())).then(
            (res)=>{
            console.log(res.label);
            h2.text.text = res.label;
            }
        )
    }else{
        classifier.predictClass(tf.tensor(h1.getTensor())).then(
            (res)=>{
               console.log(res.label);
               h1.text.text = res.label;
            }
        ) 
    }
}


function saveState(){

    let jsonStr = JSON.stringify(tensorList)
  
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([jsonStr], {type: "text/plain"}));
    a.download = "model.json";
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
                    domList[i].querySelector("div.row-container").innerHTML="";
                }
                if(tensorList[i]){
                    for(var t of tensorList[i]){
                        handRenderer.load(t, t["handness"]);
                        domList[i].querySelector("div.row-container").appendChild(cloneCanvas(document.querySelector("#display")));
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
            tensors[c_index].push(getTensorFromJoints(j));
        }
    }
    addExamples(tensors);
    if(classifier.getNumExamples()>0){
        predictBtn.removeAttribute("disabled");
        predictCheck.removeAttribute("disabled");
        let classes = document.querySelectorAll("div.row-container");
        for(const c of classes){
            c.classList.add("invisible");
            c.parentElement.querySelector("#hide").innerHTML = "show";
        }
    }else{
        alert("No examples added to train")
    }
}