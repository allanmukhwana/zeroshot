// ==========================================================================
// ZeroShot Video — AI Lasso Tool
// Canvas-based freehand region selection for localized inpainting,
// object insertion, and object removal simulations.
// ==========================================================================

const ZS_LASSO = (function(){

  let canvas, ctx;
  let isDrawing = false;
  let points = [];
  let mode = 'lasso'; // 'lasso' | 'insert' | 'remove'

  function resizeCanvasToImage(){
    const img = document.getElementById('stageImage');
    const wrap = document.getElementById('stageCanvasWrap');
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
  }

  function init(){
    canvas = document.getElementById('lassoCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvasToImage();
    window.addEventListener('resize', resizeCanvasToImage);

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', ()=>{ if(isDrawing) finishPath(); });
  }

  function setActive(active, activeMode){
    mode = activeMode || 'lasso';
    canvas.classList.toggle('active', active);
    clear();
  }

  function clear(){
    points = [];
    if(ctx) ctx.clearRect(0,0,canvas.width, canvas.height);
  }

  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onDown(e){
    isDrawing = true;
    points = [getPos(e)];
  }

  function onMove(e){
    if(!isDrawing) return;
    points.push(getPos(e));
    draw();
  }

  function onUp(e){
    if(!isDrawing) return;
    finishPath();
  }

  function finishPath(){
    isDrawing = false;
    if(points.length > 4){
      draw(true);
      onRegionSelected();
    } else {
      clear();
    }
  }

  function draw(closed){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    if(points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1;i<points.length;i++){
      ctx.lineTo(points[i].x, points[i].y);
    }
    if(closed) ctx.closePath();

    const strokeColor = mode === 'remove' ? '#ff5c7a' : (mode === 'insert' ? '#3ddc84' : '#3ddcff');
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.setLineDash(mode === 'lasso' ? [6,4] : []);
    ctx.stroke();

    if(closed){
      ctx.fillStyle = strokeColor + '33';
      ctx.fill();
    }
  }

  function onRegionSelected(){
    document.dispatchEvent(new CustomEvent('zs:lasso-region-selected', { detail: { mode, points } }));
  }

  return { init, setActive, clear };
})();
