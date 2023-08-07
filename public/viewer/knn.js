let classifier;

function loadModel(){
  var file = document.getElementById("fileModel").files[0];
  if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        classifier = knnClassifier.create();

        console.log("Loaded knn:");

        let jsonObj = JSON.parse(evt.target.result);
        tensorObj = Object.fromEntries( jsonObj.map(([label, data, shape])=>[label, tf.tensor(data, shape)]) ) ;

        console.log(tensorObj);
        classifier.setClassifierDataset(tensorObj);
      }
      reader.onerror = function (evt) {
         console.log("error reading file");
      }
  }
}

function saveModel(){

  let dataset = classifier.getClassifierDataset()
  var datasetObj = Object.entries(dataset).map(([label, data])=>[label, Array.from(data.dataSync()), data.shape]);

  let jsonStr = JSON.stringify(datasetObj)

  var a = document.createElement("a");
  a.href = window.URL.createObjectURL(new Blob([jsonStr], {type: "text/plain"}));
  a.download = "demo.txt";
  a.click();

  }

const init = async function() {

  classifier = knnClassifier.create();
  fetch('demo.txt')
    .then((res)=> {
        if(res.ok){
          res.text().then((text)=>{
            console.log("Loaded knn:")
            let jsonObj = JSON.parse(text);
            let tensorObj = Object.fromEntries( jsonObj.map(([label, data, shape])=>[label, tf.tensor(data, shape)]) ) ;
          
            classifier.setClassifierDataset(tensorObj);
            console.log(tensorObj);
          })
        }else{
          console.log(res);
        }   
      })   
  }

 init();

async function addClass(hand, classNumber) {

    classifier.addExample(tf.tensor(hand), classNumber);

}

async function addExamples(tensorList) {
  let keys = Object.keys(tensorList);
  for(let i=0; i<keys.length;i++){
    let list = tensorList[keys[i]];
    for(let j=0; j<list.length;j++){
      classifier.addExample(tf.tensor(list[j]), keys[i]);
    }
  }
}


