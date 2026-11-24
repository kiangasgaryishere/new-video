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
function paint(t){
 const i=shots.findLastIndex(s=>s[0]<=t);
 const [start,id,,en,kind]=shots[i];
 const cut=edit.findLastIndex(row=>row[0]<=t);
 g.setTransform(canvas.width/540,0,0,canvas.height/960,0,0);
 compose(t,cut);
 transition(t);
 if((kind==='place'&&id!=='rider')||kind==='fiction'){
   const w=Math.min(415,70+en.length*15);
   plate(270-w/2,85,w,57,cream,13);type(en,270,115,34,ink,false,w-19);
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
 await Promise.all([...new Set([...shots.map(s=>s[1]),"ship","scope","balloon","pen"])].map(async id=>{const im=new Image();im.src='art/'+id+'.webp';await im.decode();imgs[id]=im}));
 globes=await Promise.all(Array.from({length:64},async(_,i)=>{const im=new Image();im.src='art/globes/'+i+'.webp';await im.decode();return im}));
 const tile=document.createElement('canvas');tile.width=tile.height=180;
 const c=tile.getContext('2d'),px=c.createImageData(180,180);
 for(let i=0;i<180*180;i++){const v=(noise(i)-.5)*14;px.data.set([237+v,223+v,192+v,255],i*4)}
 c.putImageData(px,0,0);paper=g.createPattern(tile,'repeat');
 for(let i=0;i<180*180;i++)px.data.set([65,42,24,noise(i)*12],i*4);
 c.putImageData(px,0,0);grain=g.createPattern(tile,'repeat');
 await document.fonts.ready;window.render(0);window.READY=true;
})();
