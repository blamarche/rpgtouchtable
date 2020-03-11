window.$ = window.jQuery = require('./lib/jquery-3.4.1.min.js');

const { webFrame, ipcRenderer } = require('electron');
webFrame.setVisualZoomLevelLimits(1, 3);

const fs = require('fs');
const path = require('path');
const tilePath = './tiles';
const initIndex = 10;

var touchSupport = false; 
var dragItem=null;
var dragX, dragY, moveX, moveY, scaleX, scaleY;
var scaleW;
var moveItem=null;
var tokenIndex = initIndex;

$(document).ready(function() {
  var main = document.querySelector("#main");
  main.ondrop = drop;
  main.ondragover = allowDrop;
 
  recurseAddTiles(tilePath, false, null);

  $("#main")[0].addEventListener("touchmove",touchMovePieceMoving,true);
  $("#main")[0].addEventListener("mousemove",mouseMovePieceMoving,true);
  
  $("body").on("touchstart", (ev) => {
    $("#main").addClass("touchscreen");
    $("body").addClass("touchscreen");
    $("#sidebar").addClass("touchscreen");
    //$("body").off("touchstart");
    if (ev.targetTouches.length>0) {    
      scaleX=ev.targetTouches[0].pageX;
      scaleY=ev.targetTouches[0].pageY;
      if (moveItem!=null)
        scaleW = $(moveItem).width();
    }
    touchSupport=true;
  });

  $("body").on("mousemove", (ev) => {
    /*
    $("#main").removeClass("touchscreen");
    $("body").removeClass("touchscreen");
    $("#sidebar").removeClass("touchscreen");
    //$("body").off("mousemove");
    touchSupport=false;
    */
  });

  //handle two touch scaling of tokens
  $("#main").on("touchmove", (ev) => {
    if (moveItem!=null && ev.touches.length>1 && ev.targetTouches.length>0) {
      event.preventDefault();
      var stouch=ev.targetTouches[0];
      var itouch=ev.touches[0];
      var dif = (stouch.pageX - scaleX)*(stouch.pageX - scaleX);
      var dif2 = (stouch.pageY - scaleY)*(stouch.pageY - scaleY);
      dif = Math.sqrt(dif+dif2)
      var pc = Math.abs(dif) / 100;
      var w = scaleW*(1.0+pc);
      if (stouch.pageX < scaleX) { //shrink
        pc = Math.abs(dif) / 5 / 100;
        w = scaleW*(1.0-pc);
      }
      w=Math.max(w, 24); //dont want things to get TOO small
      $(moveItem).css("width", w+"px");
    }
  });
});

function recurseAddTiles(tpath, showseparator, sectionR) {
  const validImages = ['.png','.jpg','.gif','.jpeg','.bmp','.svg'];
  const tiles = fs.opendirSync(path.resolve(__dirname,tpath));
  var d = tiles.readSync();
  var entries = [];
  while (d!=null) {
    entries.push(d);
    d=tiles.readSync();
  }
  //add title
  if (showseparator) {
    var t = document.createElement("h5");
    $(t).attr("data-id", tpath);
    $(t).html(prettyTitle(tpath.match(/([^\/]*)\/*$/)[1]));
    $(t).click(()=>{
      $("div.section[data-id='"+tpath+"']").toggle();
    });
    $("#sidebar").append(t);
  }
  //add files 
  var section;
  if (sectionR!=null) {
    section=sectionR;
  } else {
    section = document.createElement("div");
    $(section).addClass("section");  
    $(section).attr("data-id", tpath);
  }
  for (var i=0; i<entries.length; i++) {
    var d=entries[i];
    if (!d.isDirectory()) {
      for (var k=0; k< validImages.length; k++) {
        if (d.name.indexOf(validImages[k])>=0) {
          addDragImage(tpath+"/"+d.name, section, 0, 0, true, d.name.split('.')[0]);
          break;
        }
      }
    }
  }
  if (sectionR==null) {
    $("#sidebar").append(section);
    $(section).hide();
  }
  //add deeper folders
  for (var i=0; i<entries.length; i++) {
    var d=entries[i];
    if (d.isDirectory()) {
      if (showseparator || sectionR!=null) {
        recurseAddTiles(tpath+"/"+d.name, false, section);
      } else {
        recurseAddTiles(tpath+"/"+d.name, true, null);
      }
    }
  }   
}

/*
BUTTONS&UI EVENTS
*/
function clickNew() {
  var c = $("#main").children();
  for (var i=0; i<c.length; i++) {
    if (!$(c[i]).hasClass("getstarted"))
      $(c[i]).remove();
  }
  tokenIndex=initIndex;
}

function clickSave() {
  //TODO: Option of bundling the map image file into it as data uri 
  var path = ipcRenderer.sendSync("save-file-prompt");
  if (typeof path!="undefined") {
    var map = {};
    map.files = [];
    map.tokens = [];
    var c = $("#main").children();
    for (var i=0; i<c.length; i++) {
      var child = $(c[i]);
      if (!child.hasClass('getstarted')) {
        if (child.hasClass('file')) {
          var isrc=child.attr('src');
          if (path.indexOf(".rtmape")>=0) {
            isrc = getImgDataUri(c[i]);
          }
          map.files.push({src: isrc});
        } else {
          var x = child.css("left").replace("px","");
          var y = child.css("top").replace("px","");
          var w = child.width();
          var ix = child.css('z-index');
          map.tokens.push({src: child.attr('src'), left: x, top: y, width: w, order: ix});
        }
      }
    }
    fs.writeFileSync(path, JSON.stringify(map));
    console.log(map);
    alert("Map saved to "+path);
  }
}

function clickLoad() {
  var path = ipcRenderer.sendSync("open-file-prompt");
  if (typeof path!="undefined" && path.length>0) {
    path=path[0];
    var fc = fs.readFileSync(path);
    if (typeof fc!="undefined") {
      try {
        clickNew();
        var map = JSON.parse(fc);
        for (var i=0; i<map.files.length; i++) {
          var f = map.files[i].src;
          $(addDragImage(f, $("#main"), -1, -1, false, f)).addClass("file");
          console.log(f);
        } 
        for (var i=0; i<map.tokens.length; i++) {
          var t = map.tokens[i];
          var tile = $(addDragImage(t.src, $("#main"), t.left, t.top, false, t.src.match(/([^\/]*)\/*$/)[1].split('.')[0]));
          tile.css("width", t.width+"px");
          tile.css("left", t.left+"px");
          tile.css("top", t.top+"px");
          tile.css("z-index", t.order);
          console.log(t);
        }
      }
      catch (er) {
        console.log(er);
        alert("Error reading map. The file format appears to be invalid or corrupt.");
      }
    }
  }
}

function getImgDataUri(i) {
  var canvas = document.createElement("canvas");
  canvas.width = $(i).width();
  canvas.height = $(i).height();
  context = canvas.getContext('2d');  
  context.drawImage(i, 0,0, $(i).width(), $(i).height());
  var mime="image/png";
  if (i.src.indexOf(".jpg")>=0 || i.src.indexOf(".jpeg")>=0)
    mime="image/jpeg";
  return canvas.toDataURL(mime, 85);
}

/*
DRAG&MOVE FUNCTIONS
*/
function touchMovePieceStart(event) {
  if (event.cancelable && moveItem==null) {
    event.preventDefault();
    moveItem=event.target;
    setTitle(event.target.title);
    var touches = event.changedTouches;        
    for (var i = 0; i < touches.length; i++) {
      if (touches[i].target == moveItem) {
        moveX = touches[i].pageX;
        moveY = touches[i].pageY;
        break;
      }
    }
    setTitle(moveItem.title);
  }
}

function touchMovePieceMoving(event) { //applied to #main
  if (event.cancelable) {
    if (moveItem)
      event.preventDefault();
    var touches = event.targetTouches;        
    for (var i = 0; i < touches.length; i++) {
      if (touches[i].target == moveItem) {
        moveX = touches[i].pageX;
        moveY = touches[i].pageY;
      }
      break;
    }
    if (moveItem)
      moveMoveItem();
  }
}

function touchMovePieceStop(event) {
  if (event.cancelable) {
    event.preventDefault();
    checkDoTrash(moveItem);
    moveItem=null;
  }
}

function mouseMovePieceStart(event) {
  event.preventDefault();
  moveItem=event.target;
  setTitle(event.target.title);
  moveX=event.pageX;
  moveY=event.pageY;
  setTitle(moveItem.title);
}

function mouseMovePieceMoving(event) { //applied to #main
  if (moveItem)
    event.preventDefault();
  moveX=event.pageX;
  moveY=event.pageY;
  if (moveItem)
    moveMoveItem();
}

function mouseMovePieceStop(event) {
  event.preventDefault();
  checkDoTrash(moveItem);
  moveItem=null;
}

function moveMoveItem() {
  if (moveItem) {
    var i = moveItem;
    var x = moveX;
    var y = moveY;
    x-=$('#sidebar').width();
    x+=$("#main").scrollLeft();
    y+=$("#main").scrollTop();
    //if (touchSupport) {
      $(moveItem).css('top',(y-$(i).height()/2)+"px");
      $(moveItem).css('left',(x-$(i).width()/2)+"px");
    //} else {
    //  $(moveItem).css('top',(y-$(i).height()/2)+"px");
    //  $(moveItem).css('left',(x-$(i).width())+"px");  
    //}

    if (inTrashArea(i)) {
      $("#remove").show();
      $("#sidebar").addClass("trash");
    } else {
      $("#remove").hide();
      $("#sidebar").removeClass("trash");
    }
  }
}

function mouseWheelScale(event) {
  event.preventDefault();
  var w = $(event.target).width();
  var pc = (event.deltaY * -3.0 / 100.0) + 1.0;
  w = w*pc;
  w=Math.max(w, 24); //dont want things to get TOO small
  $(event.target).css("width", w+"px");
}

function checkDoTrash(i) {
  var i=moveItem;
  if (inTrashArea(i)) {
    $(i).remove();
  }
  $("#remove").hide();
  $("#sidebar").removeClass("trash");
}

function inTrashArea(i) {
  return (moveX - $('#sidebar').width() < Math.min(64,$(i).width()*2) && moveY < Math.min(64,$(i).height()*2));
}

function mouseOverSidebar(event) {
  setTitle(event.target.title);
}

function setTitle(title) {
  $("#title").show();
  $("#title").html(title);
}

/*
DRAG&DROP FUNCTIONS
*/
function dragStart(event) {
  dragItem = event.target;
  setTitle(dragItem.title);
}

function dragging(event) {
  dragX=event.pageX;
  dragY=event.pageY;
}

function allowDrop(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
}

function drop(event) {
  if (event.cancelable) {
    event.preventDefault();
    dragX=event.pageX;
    dragY=event.pageY;

    handleDragEvent(event);
  }
}

function touchDragStart(event) {
  if (event.cancelable) {
    event.preventDefault();
    dragItem = event.target;
    setTitle(dragItem.title);
  }
}

function touchDragging(event) {
  if (event.cancelable) {
    event.preventDefault();
    var touches = event.changedTouches;        
    for (var i = 0; i < touches.length; i++) {
      dragX = touches[i].pageX;
      dragY = touches[i].pageY;
      break;
    }
  }
}

function touchDrop(event) {
  if (event.cancelable) {
    event.preventDefault();
    var touches = event.changedTouches;        
    for (var i = 0; i < touches.length; i++) {
      dragX = touches[i].pageX;
      dragY = touches[i].pageY;

      handleDragEvent(event);

      break;
    }
  }
}

function handleDragEvent(event) {
  if (dragItem==null) {
    if (event.dataTransfer && event.dataTransfer.items) {
      for (var i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === 'file') {
          var file = event.dataTransfer.items[i].getAsFile();
          //$(".getstarted").remove();
          $(addDragImage(file.path, $("#main"), -1, -1, false, file.name)).addClass("file");
        }
      }
    }
  } else {  
    var dragEl = dragItem;
    addDragImage($(dragEl).clone()[0], $("#main"), dragX, dragY, false);    
    dragItem = null;
  }
}

/*
SHARED FUNCTIONS
*/
function addDragImage(path, parent, x, y, sidebarEvents, title) {
  var i;
  if (typeof path == "string") {
    var i = document.createElement("img");
    i.src=path;
    if (typeof title!="undefined")
      i.title = prettyTitle(title);
  } else {
    i=path;
  }

  if (sidebarEvents) {
    i.draggable = true;
    i.ondragstart = dragStart;
    i.ondrag = dragging;
    i.addEventListener("touchstart", touchDragStart, false);
    i.addEventListener("touchmove" ,touchDragging,false);
    i.addEventListener("touchend", touchDrop,false);
    i.addEventListener("mouseover", mouseOverSidebar, false);
  } else {
    i.draggable = false;
    
    if (x>=0) {
      i.addEventListener("touchstart", touchMovePieceStart, false);
      i.addEventListener("touchend", touchMovePieceStop,false);
      i.addEventListener("mousedown", mouseMovePieceStart, false);
      i.addEventListener("mouseup", mouseMovePieceStop,false);
      i.addEventListener("wheel", mouseWheelScale, false);
    }    
  }
  
  $(parent).append(i);
  if (!sidebarEvents && x>=0) {
    x-=$('#sidebar').width();
    x+=$(parent).scrollLeft();
    y+=$(parent).scrollTop();
    $(i).css('top',(y-$(i).height()/2)+"px");
    //if (touchSupport)
      $(i).css('left',(x-$(i).width()/2)+"px");
    //else 
    //  $(i).css('left',(x-$(i).width())+"px");
    $(i).css('z-index', tokenIndex);
    tokenIndex++;
  }
  return i;
}

function prettyTitle(title) {
  if (typeof title!="undefined" && title){
    title =title.replace(/_/g, " ");
  }
  return title;
}