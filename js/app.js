// ==========================================================================
// ZeroShot Video — App Controller
// Handles navigation, view rendering, and cross-view interactivity.
// Uses ZS_API for backend calls with fallback to mock data (ZS_DATA).
// ==========================================================================

let credits = 2480;

async function syncCredits(){
  const data = await ZS_API.getCredits();
  if(data && typeof data.balance === 'number'){
    credits = data.balance;
    $('#creditCount').text(credits.toLocaleString());
  }
}

function updateCredits(delta){
  credits += delta;
  $('#creditCount').text(credits.toLocaleString());
  if(delta < 0) ZS_API.deductCredits(Math.abs(delta));
  if(delta > 0) ZS_API.addCredits(delta);
}

function showToast(title, body, variant='primary'){
  const id = 't' + Date.now();
  const $toast = $(`
    <div id="${id}" class="toast align-items-center border-0 text-bg-dark border-secondary" role="alert">
      <div class="d-flex">
        <div class="toast-body"><strong>${title}</strong><br><span class="text-white-50">${body}</span></div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `);
  $('#toastContainer').append($toast);
  const toast = new bootstrap.Toast($toast[0], { delay: 3200 });
  toast.show();
  $toast.on('hidden.bs.toast', ()=> $toast.remove());
}

// -------------------- NAVIGATION --------------------
function switchView(viewName){
  $('.nav-item').removeClass('active');
  $(`.nav-item[data-view="${viewName}"]`).addClass('active');
  $('.view').removeClass('active');
  $(`#view-${viewName}`).addClass('active');

  if(viewName === 'editor'){
    // ensure lasso canvas resizes correctly once visible
    setTimeout(()=>{ ZS_LASSO.setActive(false); }, 50);
  }
}

// -------------------- DASHBOARD --------------------
async function renderDashboard(){
  const $grid = $('#projectGrid').empty();
  let projects = ZS_DATA.projects;
  const apiProjects = await ZS_API.getProjects();
  if(apiProjects && apiProjects.length) projects = apiProjects;
  projects.forEach(p=>{
    const $card = $(`
      <div class="col-xl-3 col-lg-4 col-sm-6">
        <div class="project-card" data-project-id="${p.id}">
          <img src="${p.thumb}" alt="${p.name}">
          <div class="project-card-body">
            <h6>${p.name}</h6>
            <div class="project-card-meta">
              <span><i class="bi bi-film"></i> ${p.clips} clips · ${p.duration}</span>
              <span>${p.updated}</span>
            </div>
          </div>
        </div>
      </div>
    `);
    $card.find('.project-card').on('click', ()=> switchView('editor'));
    $grid.append($card);
  });
}

// -------------------- STORYBOARD WORKSHOP --------------------
function renderStoryboard(scenes){
  const $strip = $('#storyboardStrip').empty();
  const data = scenes || ZS_DATA.storyboardScenes;
  data.forEach(s=>{
    const $card = $(`
      <div class="sb-card" data-scene-id="${s.id}">
        <img src="${s.thumb || 'https://picsum.photos/seed/sb'+s.id+'/300/170'}" alt="${s.title}">
        <div class="sb-card-body">
          <h6>${s.title}</h6>
          <p>${s.desc}</p>
          <div class="sb-cast">${(s.cast||[]).map(c=>`<span>@${c}</span>`).join('')}</div>
        </div>
      </div>
    `);
    $card.on('click', ()=> switchView('editor'));
    $strip.append($card);
  });
}

// -------------------- GENERATE VIEW --------------------
function initGenerateView(){
  $('#genTabs button').on('click', function(){
    const tab = $(this).data('tab');
    $('#genTabs button').removeClass('active');
    $(this).addClass('active');
    $('.gen-panel').removeClass('active');
    $(`.gen-panel[data-panel="${tab}"]`).addClass('active');
  });

  $('.count-btn').on('click', function(){
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
  });

  $('#btnRunT2V').on('click', ()=> runGeneration('t2v', 't2vPreview', 40));
  $('#btnRunF2V').on('click', ()=> runGeneration('f2v', 'f2vPreview', 40));
  $('#btnRunE2V').on('click', ()=> runGeneration('e2v', 'e2vPreview', 40));

  // Frame drop zones (simulate file drop)
  ['#dropStart', '#dropEnd'].forEach(sel=>{
    $(sel).on('click', function(){
      $(this).addClass('filled').html(`<img src="https://picsum.photos/seed/${sel}${Date.now()}/200/110" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`);
    });
    $(sel).on('dragover', function(e){ e.preventDefault(); $(this).addClass('dragover'); });
    $(sel).on('dragleave', function(){ $(this).removeClass('dragover'); });
    $(sel).on('drop', function(e){ e.preventDefault(); $(this).removeClass('dragover').trigger('click'); });
  });

  renderMiniElementLibrary();

  // Elements-to-video dropzone
  const $dz = $('#elementDropzone');
  $dz.on('dragover', e=>{ e.preventDefault(); $dz.addClass('dragover'); });
  $dz.on('dragleave', ()=> $dz.removeClass('dragover'));
  $dz.on('drop', function(e){
    e.preventDefault();
    $dz.removeClass('dragover');
    const elId = e.originalEvent.dataTransfer.getData('text/element-id');
    addElementToDropzone(elId);
  });
}

function renderMiniElementLibrary(){
  const $list = $('#miniElementList').empty();
  ZS_DATA.elements.forEach(el=>{
    const $item = $(`
      <div class="mini-element" draggable="true" data-el-id="${el.id}">
        <img src="${el.thumb}" alt="${el.name}">
        <div><div>${el.name}</div><span class="met-type">${el.type}</span></div>
      </div>
    `);
    $item.on('dragstart', function(e){
      e.originalEvent.dataTransfer.setData('text/element-id', el.id);
    });
    $item.on('click', ()=> addElementToDropzone(el.id));
    $list.append($item);
  });
}

function addElementToDropzone(elId){
  const el = ZS_DATA.elements.find(x=>x.id === elId);
  if(!el) return;
  const $dz = $('#elementDropzone');
  if($dz.find('.dropped-el').length === 0) $dz.empty();
  $dz.append(`<span class="dropped-el" data-el-id="${el.id}"><img src="${el.thumb}">@${el.name}</span>`);
}

async function runGeneration(mode, previewId, cost){
  if(credits < cost){ showToast('Insufficient Credits', 'Please add more credits to continue.', 'danger'); return; }
  const $preview = $('#' + previewId);
  $preview.html(`
    <div class="text-center text-white-50">
      <div class="spinner-border text-info mb-3" role="status"></div>
      <p>Generating with GenBlaze pipeline...</p>
    </div>
  `);

  let result = null;
  try {
    if(mode === 't2v'){
      const prompt = $preview.closest('.gen-layout').find('.gen-form textarea').val();
      const model = $preview.closest('.gen-layout').find('.gen-form select').first().val();
      const qualityMode = $('.qt-btn.active').data('mode') || 'fast';
      result = await ZS_API.generateTextToVideo({ prompt, model: 'seedance-2-0-260128', duration: 10, aspect_ratio: '16:9', quality_mode: qualityMode });
    } else if(mode === 'f2v'){
      const motionPrompt = $preview.closest('.gen-layout').find('.gen-form textarea').val();
      const startImg = $('#dropStart img').attr('src') || 'https://picsum.photos/seed/startframe/640/360';
      result = await ZS_API.generateFramesToVideo({ start_frame_url: startImg, motion_prompt: motionPrompt, model: 'seedance-2-0-260128', duration: 8 });
    } else if(mode === 'e2v'){
      const scenePrompt = $preview.closest('.gen-layout').find('.gen-form textarea').val();
      const elIds = $('#elementDropzone .dropped-el').map(function(){ return $(this).data('el-id') || ''; }).get().filter(Boolean);
      result = await ZS_API.generateElementsToVideo({ element_ids: elIds, scene_prompt: scenePrompt, model: 'seedance-2-0-260128', duration: 10 });
    }
  } catch(e){ console.error('Generation API error:', e); }

  const usedCredits = (result && result.credits_used) ? result.credits_used : cost;
  updateCredits(-usedCredits);

  if(result && result.success && result.assets && result.assets.length){
    const assetHtml = result.assets.map(a => `<img src="${a.url}" alt="generated result">`).join('');
    $preview.html(`<div class="preview-result-single">${assetHtml}</div>`);
    const manifestInfo = result.manifest_uri ? `<br><span class="text-muted small">Provenance: ${result.canonical_hash || 'verified'}</span>` : '';
    showToast('Generation Complete', `New clip ready — ${usedCredits} credits used.${manifestInfo}`, 'success');
  } else {
    const seed = Math.floor(Math.random()*9999);
    $preview.html(`
      <div class="preview-result-single">
        <img src="https://picsum.photos/seed/gen${seed}/640/360" alt="generated result">
      </div>
    `);
    const errMsg = result && result.error ? ` (${result.error})` : '';
    showToast('Generation Complete', `Clip ready — ${usedCredits} credits used.${errMsg}`, 'success');
  }
}

// -------------------- ELEMENTS & ASSETS --------------------
async function renderAssetGrid(filter='all'){
  const $grid = $('#assetGrid').empty();
  const query = ($('#elementSearch').val() || '').toLowerCase();
  let elements = ZS_DATA.elements;
  const apiElements = await ZS_API.getElements(filter, query);
  if(apiElements && apiElements.length) elements = apiElements;
  elements
    .filter(el => (filter === 'all' || el.type === filter))
    .filter(el => el.name.toLowerCase().includes(query))
    .forEach(el=>{
      const $card = $(`
        <div class="asset-card" data-el-id="${el.id}">
          <img src="${el.thumb}" alt="${el.name}">
          <div class="asset-card-body">
            <h6>${el.name}</h6>
            <span class="asset-type-badge ${el.type}">${el.type}</span>
          </div>
        </div>
      `);
      $card.on('click', ()=> openCharacterMap(el.id));
      $grid.append($card);
    });
}

function openCharacterMap(elId){
  const el = ZS_DATA.elements.find(x=>x.id === elId);
  if(!el) return;
  $('#characterMapContent').html(`
    <div class="char-map-header">
      <img src="${el.thumb}" alt="${el.name}">
      <div>
        <h5 class="mb-1">${el.name}</h5>
        <span class="asset-type-badge ${el.type}">${el.type}</span>
        ${el.voice ? `<div class="text-muted small mt-2"><i class="bi bi-mic-fill"></i> ${el.voice}</div>` : ''}
        <div class="char-map-tags">${(el.tags||[]).map(t=>`<span class="chip">#${t}</span>`).join('')}</div>
      </div>
      <button type="button" class="btn-close ms-auto" data-bs-dismiss="modal"></button>
    </div>
    <div class="char-map-body">
      <h6>Backstory &amp; Traits</h6>
      <p class="text-muted">${el.backstory}</p>
      <h6 class="mt-3">Usage</h6>
      <p class="text-muted small">Call this element into any scene using <code>@${el.name.replace(/\s+/g,'')}</code> in a prompt to enforce strict visual consistency.</p>
    </div>
  `);
  new bootstrap.Modal('#characterMapModal').show();
}

// -------------------- TOOLS PANEL --------------------
async function renderToolsGrid(){
  const $grid = $('#toolsGrid').empty();
  let tools = ZS_DATA.tools;
  const apiTools = await ZS_API.getTools();
  if(apiTools && apiTools.length) tools = apiTools;
  tools.forEach(t=>{
    $grid.append(`
      <div class="col-lg-4 col-md-6">
        <div class="tool-card">
          <i class="bi ${t.icon}"></i>
          <h6>${t.name}</h6>
          <p>${t.desc}</p>
          <button class="btn btn-sm btn-outline-light w-100">Open Tool</button>
        </div>
      </div>
    `);
  });
}

// -------------------- SCENE BUILDER: CAMERA CONTROLS --------------------
function initCameraControls(){
  function applyTransform(){
    const pan = $('#rangePan').val();
    const tilt = $('#rangeTilt').val();
    const zoom = $('#rangeZoom').val();
    const rot = $('#rangeRotation').val();
    $('#valPan').text(pan);
    $('#valTilt').text(tilt);
    $('#valZoom').text(zoom);
    $('#valRotation').text(rot);
    $('#stageImage').css('transform', `scale(${zoom/100}) rotate(${rot}deg) translate(${pan*1}px, ${tilt*1}px)`);
  }
  $('#rangePan,#rangeTilt,#rangeZoom,#rangeRotation').on('input', applyTransform);

  $('.preset-btn').on('click', function(){
    const preset = $(this).data('preset');
    if(preset === 'reset'){
      $('#rangePan,#rangeTilt,#rangeRotation').val(0);
      $('#rangeZoom').val(100);
    } else if(preset === 'dolly-in'){
      $('#rangeZoom').val(150);
    } else if(preset === 'pan-left'){
      $('#rangePan').val(-30);
    } else if(preset === 'orbit'){
      $('#rangeRotation').val(45);
    }
    applyTransform();
  });
}

// -------------------- SCENE BUILDER: TOOLBAR (select/lasso/insert/remove) --------------------
function initStageTools(){
  $('.tool-btn').on('click', function(){
    const tool = $(this).data('tool');
    $('.tool-btn').removeClass('active');
    $(this).addClass('active');

    if(tool === 'lasso' || tool === 'insert' || tool === 'remove'){
      ZS_LASSO.setActive(true, tool);
      $('#lassoStatus').text(
        tool === 'lasso' ? 'Lasso Active — draw a region to inpaint' :
        tool === 'insert' ? 'Insert Active — draw where to add an object' :
        'Remove Active — draw the object to erase'
      ).show();
    } else {
      ZS_LASSO.setActive(false);
      $('#lassoStatus').hide();
    }
  });

  document.addEventListener('zs:lasso-region-selected', async function(e){
    const mode = e.detail.mode;
    const promptMap = {
      lasso: { title: 'Region Selected', body: 'Type a localized prompt to inpaint this area.' },
      insert: { title: 'Insertion Region Set', body: 'Describe the object to insert — lighting will auto-match.' },
      remove: { title: 'Removal Region Set', body: 'Object marked for removal — shadows will be reconstructed.' },
    };
    const info = promptMap[mode];
    showToast(info.title, info.body, 'info');

    const result = await ZS_API.inpaintRegion({
      clip_id: 'current', mode, region_mask: JSON.stringify(e.detail.points), prompt: '',
    });
    if(result && result.success){
      showToast('Edit Applied', `Inpaint complete — ${result.credits_used} credits used.`, 'success');
      if(result.credits_used) updateCredits(-result.credits_used);
      if(result.assets && result.assets[0]) $('#stageImage').attr('src', result.assets[0].url);
    }
    setTimeout(()=> ZS_LASSO.clear(), 1500);
  });

  // Extend Clip
  $('#btnExtendClip').on('click', async function(){
    showToast('Extending Clip', 'Continuing motion and lighting from the last frame...', 'primary');
    const result = await ZS_API.extendClip('current', 8);
    if(result && result.success){
      showToast('Clip Extended', `+8s added. ${result.credits_used} credits used.`, 'success');
      if(result.credits_used) updateCredits(-result.credits_used);
    }
  });

  // Play / Pause (visual only)
  let playing = false;
  $('#btnPlayPause').on('click', function(){
    playing = !playing;
    $(this).find('i').attr('class', playing ? 'bi bi-pause-fill' : 'bi bi-play-fill');
  });
}

// -------------------- TIMELINE TOOLBAR --------------------
function initTimelineToolbar(){
  $('#btnZoomInTl').on('click', ()=> ZS_TIMELINE.zoom(15));
  $('#btnZoomOutTl').on('click', ()=> ZS_TIMELINE.zoom(-15));
  $('#btnAddTrack').on('click', ()=> ZS_TIMELINE.addTrack());
  $('#btnSplitClip').on('click', function(){
    const ok = ZS_TIMELINE.splitAtPlayhead();
    showToast(ok ? 'Clip Split' : 'Nothing to Split', ok ? 'Clip divided at the playhead.' : 'Move the playhead over a clip first.', ok ? 'success':'warning');
  });
}

// -------------------- MISC UI WIRES --------------------
function initTopbar(){
  $('.qt-btn').on('click', function(){
    $('.qt-btn').removeClass('active');
    $(this).addClass('active');
  });
  $('#btnAddCredits').on('click', async function(){
    const data = await ZS_API.addCredits(500);
    if(data && typeof data.balance === 'number') credits = data.balance;
    else credits += 500;
    $('#creditCount').text(credits.toLocaleString());
    showToast('Credits Added', '+500 credits added to your balance.', 'success');
  });
}

function initInspectorTabs(){
  $('.inspector-tabs .nav-link').on('click', function(){
    const panel = $(this).data('inspect');
    $('.inspector-tabs .nav-link').removeClass('active');
    $(this).addClass('active');
    $('.inspector-panel').removeClass('active');
    $(`.inspector-panel[data-panel="${panel}"]`).addClass('active');
  });
}

function initElementsView(){
  $('#elementFilterTabs button').on('click', function(){
    $('#elementFilterTabs button').removeClass('active');
    $(this).addClass('active');
    renderAssetGrid($(this).data('filter'));
  });
  $('#elementSearch').on('input', function(){
    const activeFilter = $('#elementFilterTabs .nav-link.active').data('filter') || 'all';
    renderAssetGrid(activeFilter);
  });
  $('#btnNewElement').on('click', ()=> showToast('New Element', 'Element creation wizard would open here.', 'primary'));
}

function initOverlayDraggable(){
  $('#draggableCaption').draggable({ containment: 'parent' });
}

function initMiscButtons(){
  $('#btnNewProject').on('click', ()=> switchView('storyboard'));
  $('#btnGenerateStoryboard').on('click', async function(){
    const $btn = $(this);
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Generating...');
    const script = $('#storyboardScript').val();
    const elementRefs = $('.chip:not(.add-chip)').map(function(){ return $(this).text().trim().replace('@',''); }).get();
    const result = await ZS_API.generateStoryboard(script, elementRefs);
    $btn.prop('disabled', false).html('<i class="bi bi-magic"></i> Generate Storyboard');
    if(result && result.success && result.scenes && result.scenes.length){
      renderStoryboard(result.scenes);
      showToast('Storyboard Generated', `${result.scenes.length} scenes mapped from your script via Gemini.`, 'success');
    } else {
      showToast('Storyboard Generated', 'Scenes mapped from your script.', 'success');
    }
  });
  $('#btnResizeCanvas').on('click', function(){
    const $img = $('#stageImage');
    const isWide = $(this).text().includes('16:9');
    $(this).html(isWide ? '<i class="bi bi-aspect-ratio"></i> 9:16' : '<i class="bi bi-aspect-ratio"></i> 16:9');
    $img.css('aspect-ratio', isWide ? '9/16' : '16/9');
  });
}

// -------------------- INIT --------------------
$(function(){
  renderDashboard();
  renderStoryboard();
  initGenerateView();
  renderAssetGrid();
  renderToolsGrid();
  initCameraControls();
  initStageTools();
  initTimelineToolbar();
  initInspectorTabs();
  initTopbar();
  initElementsView();
  initOverlayDraggable();
  initMiscButtons();

  ZS_LASSO.init();
  ZS_TIMELINE.init();

  $('.nav-item[data-view]').on('click', function(e){
    e.preventDefault();
    switchView($(this).data('view'));
  });

  $('#btnToggleSidebar').on('click', ()=> $('#sidebar').toggleClass('open'));

  syncCredits();
});
