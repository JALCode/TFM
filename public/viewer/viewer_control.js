const classListContainer = document.querySelector("#classContainer");
const newClassBtn = document.querySelector("#newClassBtn");
const trainBtn = document.querySelector("#trainBtn");
const predictBtn = document.querySelector("#predictBtn");
const classExample = document.querySelector("#classExample");
const canvasRender = document.querySelector("#display");
const dualHand = document.querySelector(".form-check-input#dualHand");
const predictCheck = document.querySelector(".form-check-input#predict");
const tensorList = {}
const domList = []

function createClass(){
	let div = classExample.cloneNode(true);

    let id = domList.length;
    tensorList[id] = [];
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

    let hb = div.querySelector("#hide");
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

newClassBtn.onclick = createClass
trainBtn.onclick = function(){addExamples(tensorList);
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
};
predictBtn.onclick = function(){
    predict();
}

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
