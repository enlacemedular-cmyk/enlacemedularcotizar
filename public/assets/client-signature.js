/* Shared client-signature capture for every MEDULAR document type. */
(function(){
  const fields = new Map();
  let active = null, previousFocus = null, paths = [], drawing = null;
  const valid = value => typeof value === 'string' && value.length < 500000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(value);
  window.MedularSignature = {
    register(type, fieldId){ fields.set(type, fieldId); },
    value(type){ const field = document.getElementById(fields.get(type)); return field && valid(field.value) ? field.value : ''; },
    image(type){ const value = this.value(type); return value ? `<img src="${value}" alt="Firma del cliente" style="height:52px;width:156px;max-width:92%;object-fit:contain;display:block;margin:0 0 2px;" />` : ''; },
    refresh(){
      fields.forEach((id, type) => {
        const value = this.value(type);
        document.querySelectorAll('[data-client-signature="'+type+'"]').forEach(host => {
          const image = host.querySelector('img');
          image.hidden = !value;
          if(value) image.src = value; else image.removeAttribute('src');
          host.querySelector('[data-sign-open]').textContent = value ? '✍ Cambiar firma del cliente' : '✍ Firmar cliente';
          host.querySelector('[data-sign-remove]').hidden = !value;
        });
      });
    },
    clear(type){
      const field = document.getElementById(fields.get(type));
      if(!field) return;
      field.value = '';
      field.dispatchEvent(new Event('input', {bubbles:true}));
      this.refresh();
    },
    open(type){
      if(!fields.has(type)) return;
      active = type; previousFocus = document.activeElement; paths = []; drawing = null;
      document.getElementById('signature-error').textContent = '';
      const dialog = document.getElementById('client-signature-dialog');
      dialog.showModal();
      paint();
    }
  };
  const api = window.MedularSignature;
  function paint(){
    const canvas = document.getElementById('client-signature-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-1').trim();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    paths.forEach(path => {
      if(!path.length) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x*canvas.width, path[0].y*canvas.height);
      path.slice(1).forEach(p => ctx.lineTo(p.x*canvas.width, p.y*canvas.height));
      ctx.stroke();
      if(path.length === 1){ ctx.beginPath(); ctx.arc(path[0].x*canvas.width,path[0].y*canvas.height,1.5,0,Math.PI*2); ctx.fill(); }
    });
    document.getElementById('signature-undo').disabled = !paths.length;
    document.getElementById('signature-clear').disabled = !paths.length;
  }
  function close(){ document.getElementById('client-signature-dialog').close(); active = null; drawing = null; previousFocus?.focus({preventScroll:true}); }
  document.addEventListener('DOMContentLoaded', () => {
    api.register('quote', 'f_cliente_firma'); api.register('cobro', 'cc_cliente_firma');
    const dialog = document.getElementById('client-signature-dialog');
    const canvas = document.getElementById('client-signature-canvas');
    const point = e => { const r=canvas.getBoundingClientRect(); return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}; };
    canvas.addEventListener('pointerdown', e => {
      if(drawing || (e.pointerType==='mouse' && e.button!==0)) return;
      e.preventDefault(); canvas.setPointerCapture(e.pointerId);
      document.getElementById('signature-error').textContent = '';
      drawing = {id:e.pointerId,path:[point(e)]}; paths.push(drawing.path); paint();
    });
    canvas.addEventListener('pointermove', e => { if(!drawing || drawing.id!==e.pointerId) return; e.preventDefault(); drawing.path.push(point(e)); paint(); });
    const finish = e => { if(drawing?.id===e.pointerId) drawing=null; };
    canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish); canvas.addEventListener('lostpointercapture', finish);
    document.getElementById('signature-cancel').onclick = close;
    dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
    document.getElementById('signature-undo').onclick = () => {paths.pop(); drawing=null; paint();};
    document.getElementById('signature-clear').onclick = () => {paths=[]; drawing=null; paint();};
    document.getElementById('signature-save').onclick = () => {
      if(!paths.some(path => path.length>2 && path.some(p => Math.hypot(p.x-path[0].x,p.y-path[0].y)>.015))){ document.getElementById('signature-error').textContent='Traza la firma antes de guardar.'; return; }
      const field = document.getElementById(fields.get(active));
      if(!field) return;
      field.value=canvas.toDataURL('image/png');
      field.dispatchEvent(new Event('input',{bubbles:true}));
      if(active==='quote') saveState(); else ccSaveState();
      api.refresh(); close();
    };
    document.querySelectorAll('[data-client-signature]').forEach(host => {
      const type=host.dataset.clientSignature;
      host.querySelector('[data-sign-open]').onclick=()=>api.open(type);
      host.querySelector('[data-sign-remove]').onclick=()=>api.clear(type);
    });
    // Handle touch on release, without depending on a delayed synthetic click.
    dialog.querySelectorAll('button').forEach(button => {
      const action = button.onclick;
      let lastTouch = 0;
      button.onclick = e => { if(e.pointerType !== 'touch' && Date.now()-lastTouch>700) action?.(e); };
      button.addEventListener('pointerup', e => {
        if(e.pointerType !== 'touch' || button.disabled) return;
        lastTouch = Date.now();
        e.preventDefault(); action?.(e);
      });
    });
    api.refresh();
  });
})();