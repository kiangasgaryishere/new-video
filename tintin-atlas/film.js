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
function loc(lon,lat){return [30+(lon+180)*480/360,192+(85-lat)*250/155]}
function pin(lon,lat,t){
 const [x,y]=loc(lon,lat);
 g.strokeStyle=coral;g.lineWidth=2;g.beginPath();g.arc(x,y,6+clamp(t)*4,0,7);g.stroke();
 g.fillStyle=coral;g.beginPath();g.arc(x,y,3,0,7);g.fill();
}
function route(a,b,p){
 let [x,y]=loc(...a),[u,v]=loc(...b);
 g.save();g.beginPath();g.moveTo(x,y);g.setLineDash([4,4]);g.lineWidth=2.1;g.strokeStyle=coral;
 for(let i=1;i<=Math.ceil(40*p);i++){const k=Math.min(i/40,p);g.lineTo(x+(u-x)*k,y+(v-y)*k-17*Math.sin(k*Math.PI))}
 g.stroke();g.restore();
}
function stamp(str,x,y,angle,col){
 g.save();g.translate(x,y);g.rotate(angle);g.strokeStyle=col;g.lineWidth=2;const w=137;g.strokeRect(-w/2,-13,w,26);
 type(str,0,0,13,col,false,w-8);g.restore();
}
function paint(t){
 const i=shots.findLastIndex(s=>s[0]<=t),[start,id,fa,en,kind,lon,lat]=shots[i],age=t-start,q=stepped(age);
 const fiction=kind==='fiction', special=kind==='special', intro=kind==='intro';
 const arrival=ease((q+.07)/.5);
 g.setTransform(canvas.width/540,0,0,canvas.height/960,0,0);
 g.fillStyle=paper;g.fillRect(0,0,540,960);
 plate(-10,12,560,91,fiction?navy:teal,5);
 type('THE ADVENTURES OF TINTIN',270,40,22,cream);
 type('T R A V E L    A T L A S',270,71,12,'#e4c68c');
 g.strokeStyle='#736d56';g.lineWidth=1;g.strokeRect(19,116,502,727);
 g.save();g.translate(270,437);g.rotate(-.012+.005*Math.sin(t*.4));g.translate(-270,-437);
 plate(5,154,552,409,fiction?'#718886':special?'#344d5e':'#c8a568',11);
 plate(15,169,506,293,cream,13);
 if(fiction||special){
   plate(29,187,482,260,fiction?'#b9ae87':navy,21);
   if(id==='diver'){
     for(let j=0;j<6;j++){
       g.beginPath();for(let x=30;x<=510;x+=5){const y=224+j*33+7*Math.sin(x/32+t*.8);x===30?g.moveTo(x,y):g.lineTo(x,y)}
       g.strokeStyle='#708e91';g.lineWidth=1.8;g.stroke();
     }
   }else if(id==='moon'){
     for(let j=0;j<72;j++){g.fillStyle=cream;g.fillRect(33+noise(j)*470,193+noise(j+98)*246,j%4===0?2.4:1.3,1.9)}
   }else{
     for(let j=0;j<7;j++){g.strokeStyle='#968363';g.lineWidth=.85;g.beginPath();
       for(let k=0;k<101;k++){const a=k*Math.PI/50,rad=(32+j*14)*(1+.09*Math.cos(3*a)+.06*Math.sin(5*a));
       const x=258+1.63*rad*Math.cos(a),y=312+.83*rad*Math.sin(a);k?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}
   }
 }else mapPanel(30,192,480,250);
 if(kind==='place'){
 const last=shots.slice(0,i).reverse().find(s=>s[4]==='place');
 if(last)route(last.slice(5),[lon,lat],ease(age/1.25));pin(lon,lat,age);
 }else if(intro||kind==='title'){
 const path=[[37,55],[15,-4],[-87,42],[31,30],[77,28],[121,31],[-72,-13]];
 path.slice(0,-1).forEach((p,j)=>{const k=clamp((t-.45-j*.46)/.51);if(k){route(p,path[j+1],k);pin(...p,k)}});
 }
 g.restore();
 const tag=fiction?'FICTIONAL TERRITORY':kind==='place'?'GEOGRAPHICAL INDEX':special?'SPECIAL EXPEDITION':'FIELD NOTES';
 stamp(tag,405,151,.036,fiction?coral:navy);
 const portrait=['hero','moon','diver','camera'].includes(id);
 const center=kind==='title'?306:270;
 const slide=(1-arrival)*(i%2?-245:245),land=Math.sin(clamp(age/.68)*Math.PI*2)*9*(1-clamp(age/.68));
 const drift=4*Math.sin(t*.55);
 // The opening cuts from the travelling reporter to the route and then back to the atlas title.
 if(intro){
  const move=ease((age-1.55)/.95);
  art('hero',242+slide*.35-107*move,414+land+22*move,330-105*move,492-123*move,-.055+.052*arrival);
  if(age>1.55){const k=ease((q-1.55)/.52);art('moon',385,440-40*(1-k),152*k,225*k,.075); }
  if(age>3.2){g.save();g.translate(287,470);g.rotate(-.09);plate(-66,-29,132,58,coral);type('کجا؟',0,-1,30,cream,true);g.restore()}
 }else{
  const fly=id==='moon'?-Math.min(45,age*17):0;
  const push=1+.075*ease(Math.max(0,age-.85)/4);
  g.save();g.translate(center+slide+drift,427+land+fly);
  // A hinged card opens in discrete poses, with the next plate already on the table.
  const hinge=clamp((q+.12)/.49);
  g.scale(.38+.62*Math.sin(hinge*Math.PI/2),1);
  art(id,0,0,(portrait?350:437)*push,(portrait?399:337)*push,(1-arrival)*.13+.016*Math.sin(i));
  g.restore();
  if(['camera','book','andes','castle'].includes(id)&&age>3.1){
   const k=ease((q-3.1)/.6);
   art(id==='book'?'hero':id==='camera'?'book':'camera',465+105*(1-k),505,103,129,.07);
  }
 }
 const tab=fiction?'کشور خیالی':special?'فراتر از خشکی':kind==='place'?'مسیر سفر':'دفتر سفر';
 g.save();g.translate(0,Math.max(0,1-arrival)*26);g.rotate(-.011);
 plate(32,567,479,147,cream,27);plate(39,571,462,8,fiction?coral:teal,3);
 type(fa,272,617,38,ink,true,433);type(en,270,673,34,fiction?coral:navy,false,425);g.restore();
 plate(38,121,150,30,navy);type(tab,113,136,15,cream,true,142);
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
