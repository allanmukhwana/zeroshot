const ZS_API = (function(){

  const BASE = (window.location.origin.startsWith('http://localhost') || window.location.origin.startsWith('http://127.0.0.1'))
    ? window.location.origin.replace(/:\d+$/, ':8000')
    : window.location.origin + '/api';

  async function _fetch(path, options){
    try {
      const resp = await fetch(BASE + path, options);
      if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch(err){
      console.warn(`[ZS_API] ${path} failed, using fallback:`, err.message);
      return null;
    }
  }

  async function getProjects(){
    return _fetch('/api/projects');
  }

  async function getElements(filter, search){
    let qs = '';
    if(filter && filter !== 'all') qs += `?filter=${filter}`;
    if(search) qs += (qs ? '&' : '?') + `search=${encodeURIComponent(search)}`;
    return _fetch('/api/elements' + qs);
  }

  async function createElement(data){
    return _fetch('/api/elements', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data),
    });
  }

  async function getTools(){
    return _fetch('/api/tools');
  }

  async function getCredits(){
    return _fetch('/api/credits');
  }

  async function addCredits(amount){
    return _fetch(`/api/credits/add?amount=${amount||500}`, { method:'POST' });
  }

  async function deductCredits(amount){
    return _fetch(`/api/credits/deduct?amount=${amount}`, { method:'POST' });
  }

  async function generateTextToVideo(data){
    return _fetch('/api/generate/text-to-video', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data),
    });
  }

  async function generateFramesToVideo(data){
    return _fetch('/api/generate/frames-to-video', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data),
    });
  }

  async function generateElementsToVideo(data){
    return _fetch('/api/generate/elements-to-video', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data),
    });
  }

  async function generateStoryboard(script, elementRefs){
    return _fetch('/api/storyboard/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ script, element_refs: elementRefs || [] }),
    });
  }

  async function extendClip(clipId, extendDuration){
    return _fetch('/api/generate/extend', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ clip_id: clipId, extend_duration: extendDuration || 8 }),
    });
  }

  async function inpaintRegion(data){
    return _fetch('/api/generate/inpaint', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data),
    });
  }

  async function applyCamera(data){
    return _fetch('/api/generate/camera', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data),
    });
  }

  async function getHealth(){
    return _fetch('/api/health');
  }

  return {
    getProjects, getElements, createElement, getTools, getCredits, addCredits, deductCredits,
    generateTextToVideo, generateFramesToVideo, generateElementsToVideo,
    generateStoryboard, extendClip, inpaintRegion, applyCamera, getHealth,
  };
})();
