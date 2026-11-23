const canvas=document.querySelector('canvas'), g=canvas.getContext('2d');
const ink='#242924', cream='#f7edce', coral='#c84c39', teal='#255759', navy='#243e50';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>1-Math.pow(1-clamp(x),3);
const stepped=t=>Math.floor(t*12)/12;
const noise=i=>{const n=Math.sin(i*78.233+4.2)*43758.5453;return n-Math.floor(n)};
let shots,captions,coast,map,paper,grain,imgs={};
function plate(x,y,w,h,color,seed=1){
 g.fillStyle=color;g.beginPath();
 for(let j=0;j<=20;j++){const xx=x+w*j/20,yy=y+(noise(seed+j)-.5)*3;j?g.lineTo(xx,yy):g.moveTo(xx,yy)}
 for(let j=1;j<=8;j++)g.lineTo(x+w+(noise(seed+j*4)-.5)*3,y+h*j/8);
 for(let j=0;j<=20;j++)g.lineTo(x+w-w*j/20,y+h+(noise(seed+j*2)-.5)*4);
 for(let j=1;j<=8;j++)g.lineTo(x+(noise(seed+j*8)-.5)*3,y+h-h*j/8);
 g.closePath();g.fill();
}
function type(str,x,y,size,col=ink,fa=false,max=455){
 g.save();g.direction=fa?'rtl':'ltr';g.textAlign='center';g.textBaseline='middle';g.fillStyle=col;
 g.font=(fa?'bold '+size+'px "Noto Sans Arabic"':'bold '+size+'px Georgia');
 const w=g.measureText(str).width;g.translate(x,y);g.scale(Math.min(1,max/w),1);g.fillText(str,0,0);g.restore();
}
function art(id,x,y,maxW,maxH,angle=0){
 const im=imgs[id];const f=Math.min(maxW/im.width,maxH/im.height);
 g.save();g.translate(x,y);g.rotate(angle);g.shadowColor='#21201888';g.shadowOffsetX=3;g.shadowOffsetY=6;g.shadowBlur=5;
 g.drawImage(im,-im.width*f/2,-im.height*f/2,im.width*f,im.height*f);g.restore();
}
function mapPanel(x,y,w,h){
 g.save();g.translate(x,y);g.scale(w/map.width,h/map.height);g.drawImage(map,0,0);g.restore();
}
function makeMap(){
 const m=document.createElement('canvas');m.width=960;m.height=500;const c=m.getContext('2d');
 c.fillStyle='#dbe0ca';c.fillRect(0,0,960,500);c.strokeStyle='#789693';c.lineWidth=.6;
 for(let i=0;i<960;i+=40){c.beginPath();c.moveTo(i,0);c.lineTo(i,500);c.stroke()}
 for(let j=0;j<500;j+=40){c.beginPath();c.moveTo(0,j);c.lineTo(960,j);c.stroke()}
 for(const r of coast){c.beginPath();r.forEach(([a,b],i)=>c[i?'lineTo':'moveTo']((a+180)*960/360,(85-b)*500/155));c.closePath();c.fillStyle='#c1b289';c.fill();c.strokeStyle='#776c50';c.stroke()}
 return m;
}
function ellipse(x,y,rx,ry,color){
 g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();
}
function compass(x,y,t){
 g.save();g.translate(x,y);g.rotate(-.15);
 ellipse(0,0,44,44,'#675639');ellipse(0,0,39,39,cream);
 for(let j=0;j<24;j++){g.rotate(Math.PI/12);g.fillStyle=ink;g.fillRect(-1,-37,2,j%3?3:7)}
 g.rotate(-1.15+Math.exp(-t*1.3)*Math.sin(t*7)*2);
 for(const col of [coral,navy]){g.fillStyle=col;g.beginPath();g.moveTo(0,-32);g.lineTo(7,0);g.lineTo(-7,0);g.fill();g.rotate(Math.PI)}
 ellipse(0,0,3,3,cream);g.restore();
}
function paperPlane(t){
 const p=clamp((t-.5)/3.8);
 const path=k=>[-70+690*k,285-145*Math.sin(k*Math.PI)+45*k];
 g.save();g.setLineDash([6,6]);g.strokeStyle=coral;g.lineWidth=3;g.beginPath();
 for(let n=0;n<=50;n++){const xy=path(p*n/50);n?g.lineTo(...xy):g.moveTo(...xy)}g.stroke();
 g.translate(...path(p));g.rotate(Math.atan2(45-145*Math.PI*Math.cos(p*Math.PI),690));g.setLineDash([]);
 g.fillStyle=cream;g.beginPath();g.moveTo(-32,-15);g.lineTo(31,0);g.lineTo(-28,22);g.lineTo(-16,3);g.closePath();g.fill();g.strokeStyle=ink;g.lineWidth=2;g.stroke();
 g.beginPath();g.moveTo(-16,3);g.lineTo(31,0);g.stroke();g.restore();
}
function paint(t){
 const i=shots.findLastIndex(s=>s[0]<=t);
 const [start,id,,en,kind,lon,lat]=shots[i],age=t-start,q=stepped(age);
 const intro=kind==='intro',fiction=kind==='fiction',space=id==='moon',sea=id==='diver';
 const entry=ease((q+.12)/.65),sway=Math.sin(t*.44);
 g.setTransform(canvas.width/540,0,0,canvas.height/960,0,0);
 g.fillStyle=paper;g.fillRect(0,0,540,960);
 if(space||sea){
   g.fillStyle=space?'#152b43':'#194b54';g.fillRect(0,0,540,960);
   if(space){
     for(let n=0;n<108;n++){const x=noise(n)*540,y=(noise(n+135)*1000+age*17)%1000-20;
       ellipse(x,y,n%6?1:2.5,n%6?1:2.5,cream)}
   }else{
     for(let n=0;n<20;n++){g.beginPath();for(let x=-4;x<=546;x+=10){
       const y=n*55+Math.sin(x/75+t*.7+n)*12;x===-4?g.moveTo(x,y):g.lineTo(x,y)}
       g.strokeStyle='#36717a';g.lineWidth=2;g.stroke()}
   }
 }else if(fiction){
   g.fillStyle=['#a8b4a1','#b5b39a','#d5b38d','#9eb2a1'][i%4];g.fillRect(0,0,540,960);
   g.save();g.translate(290+sway*15,415);g.rotate(.3);
   for(let j=0;j<22;j++){g.beginPath();for(let k=0;k<=100;k++){
     const a=k*Math.PI/50,r=(39+29*j)*(1+.09*Math.cos(3*a)+.07*Math.sin(5*a));
     const x=1.4*r*Math.cos(a),y=r*Math.sin(a);k?g.lineTo(x,y):g.moveTo(x,y)}
     g.strokeStyle='#68786d';g.lineWidth=.8;g.stroke()}g.restore();
 }else{
   const w=1960,h=w*500/960;
   const centerLon=kind==='place'?lon:20,centerLat=kind==='place'?lat:25;
   const x=270-(centerLon+180)*w/360+24*sway;
   const y=Math.min(0,Math.max(960-h,290-(85-centerLat)*h/155));
   for(let n=-1;n<=1;n++)mapPanel(x+n*w,y,w,h);
   if(kind==='place'){
     const px=x+(lon+180)*w/360,py=y+(85-lat)*h/155;
     const p=(age%2)/2;g.save();g.globalAlpha=1-p;g.strokeStyle=coral;g.lineWidth=3;
     g.beginPath();g.arc(px,py,9+p*30,0,7);g.stroke();g.restore();
     ellipse(px,py,6,6,coral);
   }
 }
 const x=270+(1-entry)*(i%2?-146:146)+8*sway;
 const y=465+Math.sin(i)*18+(1-entry)*54;
 if(intro||kind==='title'||kind==='end'){
   const k=intro?ease(age/2):1;
   art('hero',x-25*k,y+22,544,775,-.035+.025*k);
   compass(456,183,age);
   if(intro)paperPlane(q);
 }else{
   if(id==='rail'){
     for(let n=0;n<11;n++){const k=(q*.35+n/11)%1;g.save();g.globalAlpha=.55*(1-k);
       ellipse(178-134*k,355-224*k,12+37*k,10+30*k,cream);g.restore()}
   }
   const rise=space?-100*ease(age/1.85):sea?45*ease(age/1.8):0;
   if(space){
     for(let j=0;j<7;j++){const p=(q*.95+j/7)%1;g.save();g.globalAlpha=1-p;
       ellipse(262+14*Math.sin(j*2),y+rise+179+155*p,12+21*p,35+31*p,j%2?cream:coral);g.restore()}
   }
   const push=1+.08*ease(age/4);
   art(id,x,y+rise,545*push,690*push,.019*Math.sin(i)+(1-entry)*.10);
   if(sea){
     for(let n=0;n<16;n++){const k=(age*.32+n/16)%1;
       const bx=325+45*Math.sin(k*8+n*.8),by=533-k*660;
       g.beginPath();g.arc(bx,by,3+10*k,0,7);g.lineWidth=1.8;g.strokeStyle='#dbeee2';g.stroke()}
   }
   if(id==='camera'){
     const p=clamp((age-3.65)/.52);
     if(p>0&&p<1){
       const r=520*(1-Math.sin(p*Math.PI));g.beginPath();g.rect(-1,-1,542,962);
       g.moveTo(270+r,440);g.arc(270,440,r,0,Math.PI*2,true);g.fillStyle=navy;g.fill('evenodd');
     }
   }
 }
 const country=fiction||(kind==='place'&&id!=='rider');
 if(country){
   const labelY=112+15*(1-entry),width=Math.min(415,70+en.length*15);
   g.save();g.translate(270,labelY);g.rotate(-.024);plate(-width/2,-28,width,57,cream,13);
   type(en,0,1,34,ink,false,width-19);g.restore();
 }
 const cue=captions.find(a=>a[0]<=t&&t<a[1]);
 if(cue){
  let lines=cue[2].split('|');
  if(lines.length===1 && lines[0].length>39){
    const words=lines[0].split(' '),half=lines[0].length/2;
    let cut=1;while(cut<words.length-1 && words.slice(0,cut).join(' ').length<half-2)cut++;
    lines=[words.slice(0,cut).join(' '),words.slice(cut).join(' ')];
  }
  const y=785;
  plate(26,y-48,488,96,navy,20);plate(26,y-48,7,96,coral,22);
  lines.forEach((l,j)=>type(l,270,y+(j-(lines.length-1)/2)*35,24,cream,true,442));
 }
 g.fillStyle=grain;g.fillRect(0,0,540,960);
}
window.DUR=111.307755;window.READY=false;
window.render=t=>{if(canvas.width!==innerWidth||canvas.height!==innerHeight){canvas.width=innerWidth;canvas.height=innerHeight}paint(t)};
(async()=>{
 const data=await(await fetch('story.json')).json();shots=data.shots;captions=data.captions;coast=await(await fetch('art/coast.json')).json();map=makeMap();
 await Promise.all([...new Set(shots.map(s=>s[1]))].map(async id=>{const im=new Image();im.src='art/'+id+'.webp';await im.decode();imgs[id]=im}));
 const tile=document.createElement('canvas');tile.width=tile.height=180;
 const c=tile.getContext('2d'),px=c.createImageData(180,180);
 for(let i=0;i<180*180;i++){const v=(noise(i)-.5)*14;px.data.set([237+v,223+v,192+v,255],i*4)}
 c.putImageData(px,0,0);paper=g.createPattern(tile,'repeat');
 for(let i=0;i<180*180;i++)px.data.set([65,42,24,noise(i)*12],i*4);
 c.putImageData(px,0,0);grain=g.createPattern(tile,'repeat');
 await document.fonts.ready;window.render(0);window.READY=true;
})();
