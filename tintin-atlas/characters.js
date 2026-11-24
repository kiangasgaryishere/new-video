const actors=['walk','climb','sail','jungle','ride','dive','studio','snowy'];
const settings=['dock','forest','cliff','plain','water','study','station','desert'];
const backgrounds={},poses={};
async function loadCast(){
 const load=async path=>{const im=new Image();im.src=path;await im.decode();return im};
 await Promise.all(settings.map(async key=>backgrounds[key]=await load('art/sets/'+key+'.webp')));
 await Promise.all(actors.map(async key=>poses[key]=await Promise.all([0,1,2,3].map(n=>load('art/cels/'+key+n+'.webp')))));
}
const sets={
 departure:'dock',globe:'study',ship:'dock',balloon:'plain',itinerary:'study',rail:'station',railwheel:'station',
 jungle:'forest',river:'forest',chicago:'station',news:'study',rider:'plain',egypt:'desert',scope:'desert',
 india:'desert',china:'forest',andes:'cliff',ridge:'cliff',sun:'cliff',horizon:'dock',diver:'water',moon:'water',
 book:'study',missing:'study',castle:'cliff',seal:'study',border:'station',desert:'desert',republic:'forest',
 paperland:'study',camera:'study',contact:'study',pen:'study',bookopen:'study',panels:'study',crossing:'dock',
 souvenirs:'station',pages:'study',farewell:'dock'
};
function scenery(mode,a){
 const im=backgrounds[sets[mode]];
 const f=Math.max(540/im.width,960/im.height)*(1.10+.015*Math.sin(a*.5));
 const w=im.width*f,h=im.height*f;
 g.drawImage(im,(540-w)*(.5+.40*Math.sin(a*.45)),(960-h)*(.5+.4*Math.sin(a*.31)),w,h);
}
function cel(name,n,x,feet,width,tilt=0){
 const im=poses[name][n],h=width*im.height/im.width;
 g.save();g.translate(x,feet);g.rotate(tilt);g.drawImage(im,-width/2,-h,width,h);g.restore();
}
function walk(a,x,feet,w,speed){
 const step=a*speed;
 cel('walk',Math.floor(step)%4,x,feet-3*Math.abs(Math.sin(step*Math.PI/2)),w);
}
function perform(mode,a){
 const q=stepped(a);
 if(mode==='departure'){
   walk(a,148+69*a,720,382,4.6);
   const z=ease((a-1.14)/.75);g.save();g.translate(428-158*z,265+161*z);
   g.scale(1+3.6*z,1+3.6*z);compass(0,0,a);g.restore();return true;
 }
 if(['ridge','andes'].includes(mode)){
   const elapsed=mode==='ridge'?a+3.43:a;
   const step=elapsed*3.6,grip=[.59,.61,.58,.63][Math.floor(step)%4];
   const w=340,feet=737-elapsed*32,x=291+3*Math.sin(step*Math.PI/2);
   inkPath([[x+(grip-.5)*w,0],[x+(grip-.5)*w,feet+54],[x+29+7*Math.sin(elapsed),1000]],1,'#69462a',4);
   cel('climb',Math.floor(step)%4,x,feet,w);return true;
 }
 if(mode==='rider'){
   cel('ride',Math.floor(a*6.5)%4,98+98*a,660-7*Math.abs(Math.sin(a*9)),394);
   return true;
 }
 if(mode==='diver'){
   cel('dive',Math.floor(a*3.8)%4,95+93*a,590+14*Math.sin(a*3),365,-.1);
   for(let n=0;n<15;n++){let k=(a*.45+n/15)%1;g.strokeStyle='#d7efdd';g.lineWidth=2;g.beginPath();
    g.arc(206+93*a+15*Math.sin(k*6+n),380-410*k,3+8*k,0,7);g.stroke()}
   return true;
 }
 if(mode==='jungle'||mode==='river'){
   const s=mode==='river'?a+2.68:a;
   cel('jungle',[0,1,2,3,2,1][Math.floor(s*1.9)%6],204+17*s,714,358,.012*Math.sin(s*2));
   cel('snowy',Math.floor(s*5)%4,98+26*s,757,100);return true;
 }
 if(mode==='ship'||mode==='crossing'||mode==='horizon'){
   art('ship',350+12*a,410,390,220,.02*Math.sin(q*2));
   const state=[0,1,2,2,2,3,3,2][Math.floor(a*2.15)%8];
   cel('sail',state,162+4*Math.sin(q*2),744,280,.025*Math.sin(q*2));return true;
 }
 if(mode==='camera'||mode==='contact'){
   const s=mode==='contact'?a+3.4:a;
   cel('studio',[0,1,2,2,3,3,1,0][Math.floor(s*1.55)%8],257,739,376);
   if(mode==='contact')stripMini(a);
   return true;
 }
 if(mode==='farewell'||mode==='railwheel'){
   walk(a,112+61*a,743,335,4.8);return true;
 }
 return false;
}
function stripMini(a){g.save();g.translate(270,215);g.scale(.71,.71);g.translate(-270,-439);strip(a,['egypt','china','andes']);g.restore()}
function travelCompanion(mode,a){
 if(['india','china','egypt','chicago','border','desert','republic','rail','castle'].includes(mode)){
   walk(a,88+28*a,725,175,4.5);
 }else if(mode==='bookopen'||mode==='pages'){
   cel('studio',Math.min(3,Math.floor(a*1.1)),105,753,172);
 }
}
