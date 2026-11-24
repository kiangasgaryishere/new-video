// Each entry is a motivated camera cut or an action within the narration.
const edit = [
 [0,'departure'],[1.9,'globe'],[5.25,'ship'],[8.5,'balloon'],[11.6,'itinerary'],
 [13.94,'rail'],[16.65,'railwheel'],[18.32,'jungle'],[21,'river'],[22.78,'chicago'],
 [26,'news'],[28.55,'rider'],[31.30,'egypt'],[34.3,'scope'],[35.76,'india'],
 [38.05,'china'],[41.77,'andes'],[45.2,'ridge'],[48.45,'sun'],[50.1,'horizon'],
 [53.56,'diver'],[56.05,'moon'],[58.04,'book'],[61.35,'missing'],[64.65,'castle'],
 [67.1,'seal'],[68.75,'border'],[71.87,'desert'],[75.32,'republic'],[78.9,'paperland'],
 [82.6,'camera'],[86.0,'contact'],[89.5,'pen'],[92.7,'bookopen'],[96.1,'panels'],
 [99.4,'crossing'],[101.36,'souvenirs'],[104.57,'pages'],[108.0,'farewell']
];
let globes=[];
function globe(t,x,y,r){
 const n=Math.floor((t*6+12)%64);
 g.save();g.translate(x,y);g.rotate(-.12);g.shadowColor='#35332477';g.shadowBlur=12;g.shadowOffsetY=9;
 g.drawImage(globes[n],-r,-r,r*2,r*2);g.restore();
}
function inkPath(points,p,color,width){
 g.save();g.strokeStyle=color;g.lineWidth=width;g.lineJoin=g.lineCap='round';g.beginPath();g.moveTo(...points[0]);
 const stop=clamp(p)*(points.length-1);
 for(let j=1;j<points.length;j++){const k=clamp(stop-j+1),a=points[j-1],b=points[j];g.lineTo(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k);if(k<1)break}g.stroke();g.restore();
}
function postmark(p,x,y){
 g.save();g.translate(x,y-140*(1-ease(p)));g.rotate(-.27);
 g.strokeStyle=coral;g.lineWidth=5;
 for(const r of [47,39]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke()}
 for(let j=0;j<4;j++)inkPath([[36,j*7-12],[59,j*7-16],[79,j*7-10],[105,j*7-14]],p,coral,2);
 g.restore();
}
function strip(t,ids,angle=-.13){
 g.save();g.translate(270,439);g.rotate(angle);
 const dx=-300+Math.min(t*58,250);
 g.fillStyle=ink;g.fillRect(-800,-122,1600,244);
 for(let j=-34;j<60;j++){g.fillStyle=cream;g.fillRect(dx+j*24,-114,12,9);g.fillRect(dx+j*24,105,12,9)}
 for(let j=-2;j<6;j++){const x=dx+j*188;plate(x,-90,181,182,cream,j+12);art(ids[(j+ids.length)%ids.length],x+91,0,170,174)}
 g.restore();
}
function vignette(id,t,x=270,y=449,w=533,h=649,angle=0){
 const k=ease(t/.52);art(id,x+(1-k)*43,y-(1-k)*28,w*(1+.036*Math.sin(t*.65)),h,angle+(1-k)*.06);
}
const realPlaces=new Set(['rail','jungle','chicago','egypt','india','china','andes']);
function compose(t,index){
 const [start,mode]=edit[index], a=t-start,q=stepped(a),k=ease(a/.7);
 scenery(mode,a);
 if(perform(mode,a))return;
 if(realPlaces.has(mode)){

   vignette(mode,a,270,468,526,637);
   if(mode==='rail'){
     for(let n=0;n<8;n++){const f=(q*.38+n/8)%1;g.save();g.globalAlpha=(1-f)*.68;
       ellipse(233-f*165,330-f*174,7+23*f,8+18*f,cream);g.restore()}
   }else if(mode==='andes'){
     inkPath([[75,648],[129,621],[168,637],[220,599],[263,610],[336,554]],ease((a-.36)/2.6),coral,3);
   }
 }else switch(mode){
 case 'departure':{
   art('hero',222,440,490,740,-.02);
   const z=ease((a-1.15)/.74);g.save();g.translate(416-146*z,271+155*z);
   g.scale(1+3.6*z,1+3.6*z);compass(0,0,a);g.restore();break}
 case 'globe':globe(a,270,426,205+18*Math.sin(a*.72));break;
 case 'ship':case 'river':case 'crossing':{
   const ocean=mode!=='river';plate(-10,424,565,562,ocean?navy:teal);
   for(let j=0;j<8;j++){const pts=Array.from({length:35},(_,i)=>[i*17-12,500+j*54+8*Math.sin(i*.48+a*2.3+j)]);inkPath(pts,1,'#92b4a2',2)}
   art(mode==='river'?'jungle':'ship',86+ease(a/3.6)*250,413+7*Math.sin(q*3),510,465,.026*Math.sin(q*2.4));break}
 case 'balloon':globe(t,230,718,265);art('balloon',315+26*Math.sin(a),576-82*a,196,292,-.048*Math.sin(q*1.5));break;
 case 'itinerary':case 'souvenirs':strip(a,mode==='itinerary'?['rail','jungle','chicago']:['andes','moon','castle']);postmark(ease((a-.65)/.3),365,615);break;
 case 'railwheel':art('rail',225-22*a,518,808,844,-.05);break;
 case 'news':strip(a,['chicago','rider','rail'],.11);break;
 case 'rider':art('rider',83+67*a,445+9*Math.abs(Math.sin(q*6)),453,480,-.026*Math.sin(q*5));break;
 case 'scope':case 'horizon':{
   const p=ease(a/1.1);globe(t,362,335,135);art('scope',185+88*p,520-35*p,490,255,-.21+.09*Math.sin(q));break}
 case 'ridge':art('andes',318-32*a,518+9*a,799,758,-.04);art('hero',90+a*19,584-14*a,139,201,.025*Math.sin(q*3));break;
 case 'sun':ellipse(270,408,102+60*k,102+60*k,'#edbc56');art('andes',270,574,545,339);break;
 case 'diver':{
   g.fillStyle=navy;g.fillRect(0,0,540,960);art('diver',267,375+28*a,410,530);
   for(let j=0;j<20;j++){const f=(a*.32+j/20)%1;g.strokeStyle='#b1cbc3';g.lineWidth=2;g.beginPath();g.arc(330+44*Math.sin(j+f*6),607-680*f,3+8*f,0,7);g.stroke()}break}
 case 'moon':g.fillStyle='#192f49';g.fillRect(0,0,540,960);for(let j=0;j<80;j++){g.fillStyle=cream;g.fillRect(noise(j)*540,(noise(j+3)*960+12*a)%960,2,2)}art('moon',260+15*a,541-69*a,476,569,-.04);break;
 case 'book':case 'bookopen':case 'pages':{
   g.save();g.translate(270,465);g.scale(.40+.60*ease((a+.15)/.7),1);art('book',0,0,520,536,-.06);g.restore();
   if(mode==='pages')art('pen',445-20*a,580+12*Math.sin(a),167,186,.23);break}
 case 'missing':case 'paperland':{
   const ids=mode==='missing'?['castle','desert']:['border','republic'];
   g.save();g.translate(160,362);g.rotate(-.16);plate(-119,-121,238,242,cream);art(ids[0],0,0,222,216);g.restore();
   g.save();g.translate(354,690-160*k);g.rotate(.12);plate(-126,-126,252,252,cream);art(ids[1],0,0,230,222);g.restore();postmark(ease((a-1.2)/.48),196,624);break}
 case 'seal':vignette('castle',a,267,454,482,550);postmark(ease(a/.5),327,541);break;
 case 'border':case 'castle':case 'republic':case 'desert':vignette(mode,a);break;
 case 'camera':vignette('camera',a);if(a>2.5){const f=clamp((a-2.5)/.3);g.globalAlpha=.72*Math.sin(f*Math.PI);g.fillStyle=cream;g.fillRect(0,0,540,960);g.globalAlpha=1}break;
 case 'contact':strip(a,['egypt','china','andes']);break;
 case 'pen':{
   const pts=[[82,572],[159,543],[208,557],[261,499],[303,488],[366,429],[417,413]],p=clamp(a/2.65);
   mapPanel(-72,203,696,410);inkPath(pts,p,coral,5);
   const n=p*(pts.length-1),i=Math.min(Math.floor(n),pts.length-2),f=n-i;
   art('pen',pts[i][0]+(pts[i+1][0]-pts[i][0])*f+77,pts[i][1]+(pts[i+1][1]-pts[i][1])*f-71,186,213,.16);break}
 case 'panels':strip(a,['hero','ship','moon'],.08);break;
 case 'farewell':art('hero',224-22*a,456,432,643,-.04);art('balloon',437+8*a,283-38*a,112,160,.04);postmark(ease((a-.75)/.38),366,596);break;
 }
}
// A foreground sheet crosses the lens at the cut, then reveals the next location.
const paperCuts=[13.94,22.78,31.3,41.77,64.65,82.6,92.7,104.57];
function transition(t){
 for(const cut of paperCuts){
   const delta=t-cut;if(delta<-.22||delta>.28)continue;
   const dir=paperCuts.indexOf(cut)%2?-1:1;
   const x=dir*(((delta+.22)/.5)*1500-750);
   g.save();g.translate(x+270,480);g.rotate(-.12*dir);
   plate(-344,-630,688,1260,cream);plate(-309,-630,25,1260,coral);g.restore();
 }
}
