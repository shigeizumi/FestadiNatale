let NoIndex
let repIndex
let enterIndex
let typeIndex
async function load(){
  await fetch("https://script.google.com/macros/s/AKfycbw_iM4FRlpaUu479jg5lCa3BZOpdgHYjhB-x0w3_PC9vaz4t2K8VKYJi3H6iADr3cAZ/exec")
  .then(res=>res.json())
  .then(e=>{
    NoIndex=e[0].indexOf("No.");
    repIndex=e[0].indexOf("代表者名");
    enterIndex=e[0].indexOf("入場済み");
    typeIndex=e[0].indexOf("券種");
    window.sessionStorage.setItem("data",JSON.stringify(e))
  });
  
  video.play();
  requestAnimationFrame(tick);
}

var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d",{willReadFrequently: true});
var loadingMessage = document.getElementById("loadingMessage");
var outputContainer = document.getElementById("output");
var outputMessage = document.getElementById("outputMessage");
var outputData = document.getElementById("outputData");

function drawLine(begin, end, color) {
  canvas.beginPath();
  canvas.moveTo(begin.x, begin.y);
  canvas.lineTo(end.x, end.y);
  canvas.lineWidth = 4;
  canvas.strokeStyle = color;
  canvas.stroke();
}

// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
  video.srcObject = stream;
  video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
  //video.play();
  //requestAnimationFrame(tick);
});

async function tick() {
  loadingMessage.innerText = "⌛ Loading video..."
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    loadingMessage.hidden = true;
    canvasElement.hidden = false;
    outputContainer.hidden = false;

    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    var code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      try{
        drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
        drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
        drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
        drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
        outputMessage.hidden = true;
        outputData.parentElement.hidden = false;
        outputData.innerText = code.data;
        
        let data=JSON.parse(window.sessionStorage.getItem("data"));
        const repData=data.filter(e=>e[NoIndex]==code.data)[0];
        const groupArray=data.filter(e=>e[repIndex]==repData[repIndex]);
        await new Promise(choice(repData,groupArray))
      }catch(err){}
    } else {
      outputMessage.hidden = false;
      outputData.parentElement.hidden = true;
    }
  }
  requestAnimationFrame(tick);
}

function choice(indi,group){
    $('#Area').fadeIn();
    const num=indi[NoIndex];
    let string="";
    if(group.length>1) string+=`<a href="javascript:void(0)" class="btn btn--orange btn--radius" id="${num}_group" onclick="get(this)">団体(${group.length}名)</a>`;
    string+=`<a href="javascript:void(0)" class="btn btn--brue btn--radius" onclick="get(this)" id="${num}_indi">個人</a>`;
    document.getElementById("btnarea").insertAdjacentHTML("beforeend",string);
    if(group.length==1) document.getElementById(`${num}_indi`).click();
    return new Function('return "resolve"');
}

async function get(btn){
  const id=btn.id.split("_")[0];
  let data=JSON.parse(window.sessionStorage.getItem("data"));
  let row=data.map((e,index)=>{
    if(e[NoIndex]==id) return index;
  }).filter(e=>e!=undefined)[0]+1;
  let startIndex=data.map((e,index)=>{
    if(e[repIndex]==data[row-1][repIndex]) return index;
  }).filter(e=>e!=undefined)[0];
  let length=0;
  if(btn.id.split("_")[1]=="indi") length=1;
  else length=data.filter(e=>e[repIndex]==data[row-1][repIndex]).length;

  const ele=document.getElementById("btnarea");
  let flg=false;
  if(length!=1){
    for(let i=0;i<length;i++) 
      if(data[startIndex+i][enterIndex]!="") flg=true;
  }else if(data[row-1][enterIndex]!="") flg=true;
  if(flg){
    alert("既に入場済みです。");
    $('#Area').fadeOut();
    while( ele.firstChild ){
        ele.removeChild( ele.firstChild );
    }
    requestAnimationFrame(tick);
    return
  }

  while( ele.firstChild ){
      ele.removeChild( ele.firstChild );
    }
  document.getElementById("btnarea").insertAdjacentHTML("beforeend","処理中");
  await fetch(`https://script.google.com/macros/s/AKfycbw_iM4FRlpaUu479jg5lCa3BZOpdgHYjhB-x0w3_PC9vaz4t2K8VKYJi3H6iADr3cAZ/exec?number=${row}?${length}`)
      .then(res=>res.json())
      .then(range=>{
          NoIndex=data[0].indexOf("No.");
          repIndex=data[0].indexOf("代表者名");
          enterIndex=data[0].indexOf("入場済み");
          typeIndex=data[0].indexOf("券種");
          window.sessionStorage.setItem("data",JSON.stringify(range));
          data=range;
      })
      
      let alertData=[];
      for(let i=0;i<length;i++) alertData.push(`代表者名：${data[startIndex+i][repIndex]} 、 券種：${data[startIndex+i][typeIndex]} 、 入場時刻：${new Date(data[startIndex+i][enterIndex]).toLocaleString('ja-JP', {timeZone: 'Asia/Tokyo',})}`)
      alert(alertData.join("\n"));
      $('#Area').fadeOut();
      while( ele.firstChild ){
          ele.removeChild( ele.firstChild );
        }
    requestAnimationFrame(tick);
}
