// ==========================================================================
// ZeroShot Video — Timeline Editor
// A lightweight custom timeline built with jQuery + jQuery UI
// (draggable / resizable clips, ruler, playhead, zoom, split).
// ==========================================================================

const ZS_TIMELINE = (function(){

  let pxPerSecond = 50;
  const MIN_PX_PER_SEC = 20;
  const MAX_PX_PER_SEC = 160;
  let totalDuration = 30; // seconds, recalculated on render
  let selectedClipId = null;

  function computeTotalDuration(){
    let max = 10;
    ZS_DATA.timelineTracks.forEach(t=>{
      t.clips.forEach(c=>{
        max = Math.max(max, c.start + c.duration);
      });
    });
    totalDuration = max + 4;
  }

  function renderRuler(){
    const $ruler = $('#timelineRuler').empty();
    const width = totalDuration * pxPerSecond;
    $ruler.css('width', width + 'px');
    for(let s=0; s<=totalDuration; s++){
      const isMajor = s % 5 === 0;
      const $tick = $('<div class="ruler-tick"></div>')
        .css({ left: (s*pxPerSecond)+'px' })
        .text(isMajor ? formatTime(s) : '');
      $ruler.append($tick);
    }
    $('#timelineTracks').css('width', width + 'px');
  }

  function formatTime(s){
    const m = Math.floor(s/60);
    const sec = s % 60;
    return m>0 ? `${m}:${sec.toString().padStart(2,'0')}` : `${sec}s`;
  }

  function clipColorClass(trackType){ return trackType; }

  function renderTracks(){
    const $tracks = $('#timelineTracks').empty();
    ZS_DATA.timelineTracks.forEach(track=>{
      const $track = $(`
        <div class="tl-track" data-track-id="${track.id}">
          <div class="tl-track-label">${track.label}</div>
          <div class="tl-track-body"></div>
        </div>
      `);
      const $body = $track.find('.tl-track-body');

      track.clips.forEach(clip=>{
        const left = clip.start * pxPerSecond;
        const width = clip.duration * pxPerSecond;
        const $clip = $(`
          <div class="tl-clip ${clipColorClass(track.type)}" data-clip-id="${clip.id}" data-track-id="${track.id}"
               style="left:${left}px;width:${width}px;">
            ${clip.thumb ? `<img class="tl-clip-thumb" src="${clip.thumb}" alt="">` : ''}
            <span class="tl-clip-name">${clip.name}</span>
          </div>
        `);
        $body.append($clip);
      });

      $tracks.append($track);
    });

    applyClipInteractions();
  }

  function applyClipInteractions(){
    $('.tl-clip').draggable({
      axis: 'x',
      containment: 'parent',
      grid: $('#snapToggle').is(':checked') ? [pxPerSecond, 0] : false,
      start: function(){ selectClip($(this).data('clip-id')); },
      stop: function(e, ui){
        const clipId = $(this).data('clip-id');
        const newStart = Math.max(0, Math.round(ui.position.left / pxPerSecond));
        updateClipData(clipId, { start: newStart });
      }
    });

    $('.tl-clip').resizable({
      handles: 'e',
      grid: [pxPerSecond, 0],
      minWidth: pxPerSecond,
      stop: function(e, ui){
        const clipId = $(this).data('clip-id');
        const newDuration = Math.max(1, Math.round(ui.size.width / pxPerSecond));
        updateClipData(clipId, { duration: newDuration });
      }
    });

    $('.tl-clip').off('click.select').on('click.select', function(e){
      e.stopPropagation();
      selectClip($(this).data('clip-id'));
    });
  }

  function updateClipData(clipId, patch){
    ZS_DATA.timelineTracks.forEach(t=>{
      t.clips.forEach(c=>{
        if(c.id === clipId) Object.assign(c, patch);
      });
    });
    computeTotalDuration();
    renderRuler();
    renderTracks();
  }

  function selectClip(clipId){
    selectedClipId = clipId;
    $('.tl-clip').removeClass('selected');
    $(`.tl-clip[data-clip-id="${clipId}"]`).addClass('selected');
  }

  function movePlayhead(seconds){
    $('#timelinePlayhead').css('left', (seconds*pxPerSecond)+'px');
  }

  function zoom(factor){
    pxPerSecond = Math.min(MAX_PX_PER_SEC, Math.max(MIN_PX_PER_SEC, pxPerSecond + factor));
    renderRuler();
    renderTracks();
  }

  function splitAtPlayhead(){
    const playheadLeft = parseFloat($('#timelinePlayhead').css('left')) || 0;
    const playheadSec = Math.round(playheadLeft / pxPerSecond);
    let didSplit = false;

    ZS_DATA.timelineTracks.forEach(t=>{
      const newClips = [];
      t.clips.forEach(c=>{
        if(playheadSec > c.start && playheadSec < c.start + c.duration){
          const firstDur = playheadSec - c.start;
          const secondDur = c.duration - firstDur;
          newClips.push({ ...c, duration: firstDur });
          newClips.push({ ...c, id: c.id + '-split-' + Date.now(), start: playheadSec, duration: secondDur, name: c.name + ' (2)' });
          didSplit = true;
        } else {
          newClips.push(c);
        }
      });
      t.clips = newClips;
    });

    if(didSplit){
      renderTracks();
    }
    return didSplit;
  }

  function addTrack(){
    const idx = ZS_DATA.timelineTracks.length + 1;
    ZS_DATA.timelineTracks.push({
      id: 'track-custom-' + idx, type: 'video', label: `Video ${idx}`, clips: []
    });
    renderTracks();
  }

  function init(){
    computeTotalDuration();
    renderRuler();
    renderTracks();
    movePlayhead(0);

    // click ruler / track area to move playhead
    $('#timelineScroll').on('click', function(e){
      if($(e.target).closest('.tl-clip').length) return;
      const scrollLeft = $(this).scrollLeft();
      const clickX = e.clientX - $(this).offset().left + scrollLeft - 90; // minus label width
      const sec = Math.max(0, Math.round(clickX / pxPerSecond));
      movePlayhead(sec);
    });
  }

  return { init, zoom, splitAtPlayhead, addTrack, movePlayhead, renderTracks, get selectedClipId(){ return selectedClipId; } };
})();
