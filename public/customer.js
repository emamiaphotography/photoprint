fetch("/api/studio").then(r=>r.json()).then(p=>{const name=p.studioName||"Emamia Studios";document.title=name+" | Order Photos";const brand=document.getElementById("customerBrand");if(brand){brand.innerHTML="";if(p.logoUrl){const img=document.createElement("img");img.src=p.logoUrl;img.alt=name+" logo";img.className="header-logo";brand.appendChild(img)}const label=document.createElement("span");label.textContent=name;brand.appendChild(label)}const footer=document.getElementById("customerFooter");if(footer){const parts=[name,p.mobile,p.address].filter(Boolean);footer.textContent=parts.join(" · ")+" · Secure photo ordering"}}).catch(()=>{});
const photosInput=document.getElementById("photos"),list=document.getElementById("photoList"),totalEl=document.getElementById("total"),form=document.getElementById("orderForm"),message=document.getElementById("message");
const prices={"4x6":10,"5x7":20,"6x8":30,"8x12":60,"passport":5,"a4":0};
const ratios={"4x6":4/6,"5x7":5/7,"6x8":6/8,"8x12":8/12,"passport":35/45,"a4":210/297};
let selected=[];
function priceFor(p){return (p.size==="custom"||p.size==="a4")?0:prices[p.size||"4x6"];}
function ratioFor(p){let r=(p.size==="custom"&&p.width>0&&p.height>0)?p.width/p.height:(ratios[p.size]||ratios["4x6"]);return p.orientation==="horizontal"?1/r:r;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function loadImage(url){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});}
function initEditor(p,canvas){
 const ctx=canvas.getContext("2d"),img=new Image();let action=null,start=null,initial=null,anchor=null; canvas.style.cursor="crosshair"; canvas.style.touchAction="none";
 function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
 function targetRatio(){return ratioFor(p)*canvas.height/canvas.width;}
 function defaultCrop(){const r=targetRatio();let w=.8,h=w/r;if(h>.8){h=.8;w=h*r;}return{x:(1-w)/2,y:(1-h)/2,w,h};}
 function normalizeCrop(){let c=p.crop||defaultCrop();c.x=clamp(c.x,0,1);c.y=clamp(c.y,0,1);c.w=clamp(c.w,.04,1-c.x);c.h=clamp(c.h,.04,1-c.y);const r=targetRatio();if(Math.abs(c.w/c.h-r)>.01){const cx=c.x+c.w/2,cy=c.y+c.h/2;let w=c.w,h=w/r;if(h>1){h=1;w=h*r;}if(w>1){w=1;h=w/r;}c={x:clamp(cx-w/2,0,1-w),y:clamp(cy-h/2,0,1-h),w,h};}p.crop=c;}
 function draw(){
  if(!p.img)return;normalizeCrop();ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(p.img,0,0,canvas.width,canvas.height);
  const c=p.crop,x=c.x*canvas.width,y=c.y*canvas.height,w=c.w*canvas.width,h=c.h*canvas.height;
  ctx.fillStyle="rgba(0,0,0,.56)";ctx.fillRect(0,0,canvas.width,y);ctx.fillRect(0,y+h,canvas.width,canvas.height-y-h);ctx.fillRect(0,y,x,h);ctx.fillRect(x+w,y,canvas.width-x-w,h);
  ctx.strokeStyle="#fff";ctx.lineWidth=Math.max(2,canvas.width/450);ctx.strokeRect(x,y,w,h);
  ctx.strokeStyle="#16a5e5";ctx.lineWidth=Math.max(3,canvas.width/350);ctx.strokeRect(x,y,w,h);
  const hs=Math.max(14,canvas.width/38);ctx.fillStyle="#16a5e5";
  [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([hx,hy])=>ctx.fillRect(hx-hs/2,hy-hs/2,hs,hs));
  ctx.fillStyle="#fff";ctx.font=`bold ${Math.max(12,canvas.width/48)}px Arial`;ctx.fillText("Drag inside to move · drag corners to resize · drag outside to select",8,Math.max(18,canvas.height-10));
 }
 img.onload=()=>{p.img=img;const scale=Math.min(1,1100/img.width,800/img.height);canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);p.crop=defaultCrop();draw();};img.src=p.url;
 function point(e){const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)*canvas.width/r.width,0,canvas.width),y:clamp((e.clientY-r.top)*canvas.height/r.height,0,canvas.height)};}
 function cursorAt(pt){const c=p.crop,x=c.x*canvas.width,y=c.y*canvas.height,w=c.w*canvas.width,h=c.h*canvas.height,handle=Math.max(26,canvas.width/24);const near=(a,b)=>Math.abs(pt.x-a)<=handle&&Math.abs(pt.y-b)<=handle;if(near(x,y)||near(x+w,y+h))return "nwse-resize";if(near(x+w,y)||near(x,y+h))return "nesw-resize";if(pt.x>=x&&pt.x<=x+w&&pt.y>=y&&pt.y<=y+h)return "move";return "crosshair";}
 canvas.addEventListener("pointermove",e=>{if(!action&&p.img)canvas.style.cursor=cursorAt(point(e));});
 canvas.addEventListener("pointerdown",e=>{if(!p.img)return;canvas.setPointerCapture(e.pointerId);const pt=point(e),c=p.crop,x=c.x*canvas.width,y=c.y*canvas.height,w=c.w*canvas.width,h=c.h*canvas.height,handle=Math.max(22,canvas.width/28);
  const corners=[{x,y,ax:x+w,ay:y+h},{x:x+w,y,ax:x,ay:y+h},{x,y:y+h,ax:x+w,ay:y},{x:x+w,y:y+h,ax:x,ay:y}];
  const hit=corners.find(q=>Math.abs(pt.x-q.x)<=handle&&Math.abs(pt.y-q.y)<=handle);
  start=pt;initial={...c};
  if(hit){action="resize";anchor={x:hit.ax,y:hit.ay};canvas.style.cursor=(hit.x===x&&hit.y===y)||(hit.x===x+w&&hit.y===y+h)?"nwse-resize":"nesw-resize";}
  else if(pt.x>=x&&pt.x<=x+w&&pt.y>=y&&pt.y<=y+h){action="move";canvas.style.cursor="move";}
  else {action="new";canvas.style.cursor="crosshair";anchor=pt;p.crop={x:pt.x/canvas.width,y:pt.y/canvas.height,w:0,h:0};}
  draw();
 });
 canvas.addEventListener("pointermove",e=>{if(!action||!start)return;const pt=point(e),r=targetRatio();
  if(action==="move"){const dx=(pt.x-start.x)/canvas.width,dy=(pt.y-start.y)/canvas.height;p.crop.x=clamp(initial.x+dx,0,1-initial.w);p.crop.y=clamp(initial.y+dy,0,1-initial.h);}
  else {const ax=anchor.x,ay=anchor.y;let dx=pt.x-ax,dy=pt.y-ay;const sx=dx<0?-1:1,sy=dy<0?-1:1;let ww=Math.max(24,Math.abs(dx)),hh=ww/r;if(hh<24){hh=24;ww=hh*r;}if(Math.abs(dy)>0){const h2=Math.max(24,Math.abs(dy)),w2=h2*r;if(w2>ww){ww=w2;hh=h2;}}const maxW=sx<0?ax:canvas.width-ax,maxH=sy<0?ay:canvas.height-ay,scale=Math.min(1,maxW/ww,maxH/hh);ww*=scale;hh*=scale;p.crop={x:Math.min(ax,ax+sx*ww)/canvas.width,y:Math.min(ay,ay+sy*hh)/canvas.height,w:ww/canvas.width,h:hh/canvas.height};}
  draw();
 });
 const finish=()=>{action=null;start=null;initial=null;anchor=null;canvas.style.cursor="crosshair";};canvas.addEventListener("pointerup",finish);canvas.addEventListener("pointercancel",finish);
 return {draw,reset(){p.crop=defaultCrop();draw();}};
}
function render(){
 list.innerHTML="";
 selected.forEach(p=>{
  const row=document.createElement("div");row.className="photo-item ratio-crop-item";
  row.innerHTML=`<div class="ratio-crop-area"><canvas class="ratio-crop-canvas"></canvas><button type="button" class="reset-crop">Reset crop</button><small class="crop-help">Select any area by dragging outside the frame. The crop shape stays locked to the selected print size, so the printed photo will not stretch. Drag inside to move; drag a blue corner to resize.</small></div>
  <div class="photo-details"><strong>${escapeHtml(p.file.name)}</strong><small>${(p.file.size/1024/1024).toFixed(2)} MB</small>
  <label class="small-label">Print size<select class="size"><option value="4x6">4 × 6 — ₹10</option><option value="5x7">5 × 7 — ₹20</option><option value="6x8">6 × 8 — ₹30</option><option value="8x12">8 × 12 — ₹60</option><option value="passport">Passport — ₹5</option><option value="a4">A4 — studio quote</option><option value="custom">Custom size — studio quote</option></select></label>
  <label class="small-label">Orientation<select class="orientation"><option value="vertical">Vertical (Portrait)</option><option value="horizontal">Horizontal (Landscape)</option></select></label>\n  <div class="custom-fields" hidden><input class="width" type="number" min="1" max="24" step="0.1" placeholder="Width (inch)"><input class="height" type="number" min="1" max="24" step="0.1" placeholder="Height (inch)"></div>
  <label class="small-label">Copies<input class="qty" type="number" min="1" max="500" value="1"></label></div>`;
  const canvas=row.querySelector("canvas"),size=row.querySelector(".size"),orientation=row.querySelector(".orientation"),w=row.querySelector(".width"),h=row.querySelector(".height"),custom=row.querySelector(".custom-fields"),qty=row.querySelector(".qty");
  size.value=p.size||"4x6";orientation.value=p.orientation||"vertical";w.value=p.width||"";h.value=p.height||"";qty.value=p.qty||1;custom.hidden=size.value!=="custom";p.orientation=orientation.value;
  const editor=initEditor(p,canvas);
  size.onchange=()=>{p.size=size.value;custom.hidden=p.size!=="custom";editor.reset();};
  orientation.onchange=()=>{p.orientation=orientation.value;editor.reset();};
  w.oninput=()=>{p.width=Number(w.value);editor.reset();};h.oninput=()=>{p.height=Number(h.value);editor.reset();};
  qty.oninput=()=>{p.qty=Math.max(1,Number(qty.value)||1);calc();};
  row.querySelector(".reset-crop").onclick=()=>editor.reset();list.appendChild(row);
 });calc();
}
function calc(){let sum=0,hasCustom=false;selected.forEach(p=>{if(p.size==="custom"||p.size==="a4")hasCustom=true;else sum+=priceFor(p)*(p.qty||1)});totalEl.textContent="₹"+sum+(hasCustom?" + A4/custom-size items quoted by studio":"");}
async function makeCropBlob(p){
 const img=p.img||await loadImage(p.url),c=p.crop||{x:0,y:0,w:1,h:1};
 const sx=Math.max(0,Math.round(c.x*img.width)),sy=Math.max(0,Math.round(c.y*img.height)),sw=Math.max(1,Math.min(img.width-sx,Math.round(c.w*img.width))),sh=Math.max(1,Math.min(img.height-sy,Math.round(c.h*img.height)));
 const out=document.createElement("canvas");out.width=1800;out.height=Math.max(1,Math.round(1800/ratioFor(p)));
 out.getContext("2d").drawImage(img,sx,sy,sw,sh,0,0,out.width,out.height);
 return await new Promise(resolve=>out.toBlob(resolve,"image/jpeg",0.95));
}
photosInput.addEventListener("change",()=>{selected.forEach(p=>URL.revokeObjectURL(p.url));selected=Array.from(photosInput.files).slice(0,20).map(file=>({file,url:URL.createObjectURL(file),size:"4x6",orientation:"vertical",qty:1,crop:null}));render();});
form.addEventListener("submit",async e=>{
 e.preventDefault();if(!selected.length)return;
 for(const p of selected){if(p.size==="custom"&&(!(p.width>0)||!(p.height>0)||p.width>24||p.height>24)){message.textContent="Enter custom width and height between 1 and 24 inches.";return;}}
 message.textContent="Preparing print-size crops…";
 try{const fd=new FormData(form);fd.delete("photos");const items=[];
  for(let i=0;i<selected.length;i++){const p=selected[i],blob=await makeCropBlob(p);fd.append("photos",blob,`print-crop-${i+1}.jpg`);items.push({size:p.size,width:p.size==="custom"?p.width:null,height:p.size==="custom"?p.height:null,orientation:p.orientation,quantity:p.qty,price:priceFor(p),cropMode:"freeform"});}
  fd.append("items",JSON.stringify(items));message.textContent="Submitting order…";const r=await fetch("/api/orders",{method:"POST",body:fd}),data=await r.json();if(!r.ok)throw new Error(data.error);
  message.textContent=`Order received: ${data.order.id}. Fixed-size subtotal ₹${data.order.total}. A4/custom-size items require studio quotation. Payment is pending.`;
  form.reset();selected.forEach(p=>URL.revokeObjectURL(p.url));selected=[];render();
 }catch(err){message.textContent="Could not prepare or submit photos: "+err.message;}
});
