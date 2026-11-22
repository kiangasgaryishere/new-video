const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
const ink = "#24242a";
const blue = "#073dbb";
const red = "#ff4841";
const paper = "#fbfaf7";
const gray = "#d8d6d4";
const clamp = (n) => Math.min(1, Math.max(0, n));
const progress = (time, start, duration) => clamp((time - start) / duration);
const smooth = (n) => n * n * (3 - 2 * n);
let glyphs;

function stroke(points, amount, color, width) {
  if (amount <= 0 || points.length < 2) return;
  const lengths = points.slice(1).map(([x,y], i) => Math.hypot(x-points[i][0], y-points[i][1]));
  let remaining = amount * lengths.reduce((a,b) => a+b, 0);
  c.beginPath();
  c.moveTo(...points[0]);
  for (let i = 0; i < lengths.length && remaining > 0; i++) {
    const a = points[i], b = points[i+1];
    const f = Math.min(1, remaining / (lengths[i] || 1));
    c.lineTo(a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f);
    remaining -= lengths[i];
  }
  c.lineWidth = width * (color === ink ? 1.42 : 1.23);
  c.strokeStyle = color;
  c.lineCap = c.lineJoin = "round";
  c.stroke();
}

function ellipse(x,y,rx,ry) {
  return Array.from({length: 65}, (_,i) => {
    const a = i * Math.PI / 32;
    return [x+Math.cos(a)*rx, y+Math.sin(a)*ry];
  });
}

function marker(points, amount, color, scale=1) {
  if (!amount) return;
  c.save();
  c.globalCompositeOperation = "multiply";
  for (let i=0; i<5; i++) {
    c.globalAlpha = .17 + i * .027;
    stroke(points.map(([x,y],j)=>[x + Math.sin(i+j)*2*scale, y+(i-2)*2.3*scale]), amount, color, 7*scale);
  }
  c.restore();
}

function hand(text,x,y,size,amount,color=ink) {
  if (!glyphs || !amount) return;
  const layout = [...text].map((char) => {
    const lines = glyphs.g[char] || [];
    const max = Math.max(0,...lines.flatMap((line)=>line.filter((_,i)=>i%2===0)));
    return {lines, width: char===" " ? .26 : Math.max(.17, max+.022)};
  });
  let left = x;
  layout.forEach(({lines,width},i) => {
    const a = clamp(amount*layout.length-i);
    lines.forEach((line,j) => {
      const points = [];
      for(let k=0; k<line.length; k+=2) {
        points.push([left+line[k]*size, y+(line[k+1]+.018*Math.sin(i))*size]);
      }
      stroke(points,clamp(a*lines.length-j),color,Math.max(1.2,size*glyphs.hw*1.07));
    });
    left += width * size;
  });
}

function caption(text,x,y,size,color=ink) {
  c.save();
  c.direction="rtl";
  c.textAlign="right";
  c.fillStyle=color;
  c.font="bold "+size+"px 'Noto Sans Arabic', sans-serif";
  c.strokeStyle=color;
  c.lineWidth=Math.max(1,size*.027);
  c.strokeText(text,x,y);
  c.fillText(text,x,y);
  c.restore();
}

function controller(x,y,a) {
  const border = [[0,32],[10,16],[29,14],[49,20],[76,14],[95,19],[104,35],[112,65],[108,79],[99,84],[85,78],[69,62],[42,62],[26,79],[13,84],[3,79],[-2,68],[0,32]];
  c.save();
  c.translate(x,y);
  marker([[10,72],[19,75],[32,67]],clamp(a*2-1),gray,.8);
  marker([[84,66],[99,78],[105,72]],clamp(a*2-1),gray,.8);
  stroke(border,clamp(a*1.6),ink,3.4);
  stroke([[22,43],[43,43]],clamp(a*3-1.3),ink,3.2);
  stroke([[32,32],[32,54]],clamp(a*3-1.6),ink,3.2);
  for (const [i,[xx,yy]] of [[78,35],[89,45],[78,55],[67,45]].entries()) {
    stroke(ellipse(xx,yy,3,3),clamp(a*4-2-i*.28),i===1?blue:ink,2.2);
  }
  c.restore();
}

function calendar(x,y,a,checks) {
  c.save();
  c.translate(x,y);
  stroke([[0,11],[2,7],[78,7],[82,11],[82,63],[78,67],[4,67],[0,63],[0,11]],a,ink,2.8);
  marker([[3,23],[79,23]],clamp(a*2-1),blue,.65);
  stroke([[2,25],[80,25]],a,ink,2);
  stroke([[20,2],[20,15]],a,ink,3.4);
  stroke([[61,2],[61,15]],a,ink,3.4);
  for(let i=0;i<3;i++){
    const x=12+i*23;
    stroke([[x,46],[x+5,51],[x+13,40]],clamp(checks*3-i),red,2.5);
  }
  c.restore();
}

function bubble(x,y,w,h,a,color) {
  stroke([[x+12,y],[x+w-12,y-1],[x+w,y+12],[x+w,y+h-12],
    [x+w-13,y+h],[x+64,y+h],[x+36,y+h+17],[x+42,y+h],
    [x+11,y+h],[x,y+h-12],[x,y+11],[x+12,y]],a,color,3.15);
}

function panel(y,t,start,write,lines,accent) {
  const tall=lines.length>1;
  const top=y+195, bottom=y+(tall?365:315);
  stroke([[62,top+14],[79,top],[451,top+1],[475,top+14],
    [471,bottom-14],[451,bottom],[81,bottom-1],[61,bottom-14],[62,top+14]],
    progress(t,start,.85),blue,2.85);
  const sizes=lines.map(line=>Math.min(50,810/line.length));
  lines.forEach((line,i)=>hand(line,84,top+65+54*i,sizes[i],
    progress(t,write+i*.86,Math.min(1.3,line.length*.064))));
  const i=lines.findIndex(line=>line.includes(accent));
  if(i>=0){
    const line=lines[i], size=sizes[i];
    const width=(str)=>[...str].reduce((sum,ch)=>{
      const strokes=glyphs.g[ch]||[];
      const max=Math.max(0,...strokes.flatMap(points=>points.filter((_,idx)=>idx%2===0)));
      return sum+(ch===" "?.26:Math.max(.17,max+.022))*size;
    },0);
    const x=84+width(line.slice(0,line.indexOf(accent))), y=top+76+54*i;
    marker([[x+2,y],[x+width(accent)*.5,y+1],[x+width(accent),y-1]],
      progress(t,write+i*.86+1.03,.43),red,.65);
  }
}

function lesson(t,y,start,number,label,write,lines,accent,icon){
  if(t<start) return;
  const p=(delay,duration)=>progress(t,start+delay,duration);
  hand(number,65,y,52,p(0,.41),blue);
  hand(label,143,y,Math.min(43,580/label.length),p(.16,.81));
  c.save();
  c.translate(0,y);
  icon(p(.35,.95),p(1.15,.78));
  c.restore();
  panel(y,t,start+1.16,write,lines,accent);
  if(number!=="07"){
    stroke([[474,y+374],[484,y+405],[467,y+440],[439,y+459]],p(2.1,1.1),blue,2.7);
    stroke([[453,y+458],[439,y+459],[444,y+446]],p(2.9,.3),blue,2.7);
  }
}

window.DUR = 59.428571;
window.READY = false;
window.render = (t) => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  c.scale(innerWidth/540,innerHeight/960);
  c.fillStyle=paper;
  c.fillRect(0,0,540,960);
  const moves = [
    [2.8,2.1,340], [8.23,1.5,466], [12.1,1.75,490],
    [17.55,1.55,490], [25.85,1.55,490], [32.05,1.4,490],
    [37.25,1.45,490], [50.7,2.05,490]
  ];
  const shift = moves.reduce((y,[start,distance,delta]) => y+delta*smooth(progress(t,start,distance)),0);
  const pull = smooth(progress(t,48.28,1.28)) * (1-smooth(progress(t,50.0,1.45)));
  const zoom = 1-.806*pull;
  const centerY = (shift+480)*(1-pull)+2260*pull;
  c.translate(270,480);
  c.scale(zoom,zoom);
  c.translate(-270,-centerY);
  const top = centerY-480/zoom;
  const bottom = centerY+480/zoom;
  c.fillStyle="#e0dbd4";
  for(let y=Math.floor(top/17)*17+9;y<bottom+17;y+=17){
    for(let x=14;x<540;x+=17){
      c.beginPath();c.arc(x+(Math.sin(y+x)*.24),y,.79,0,Math.PI*2);c.fill();
    }
  }

  c.save();
  c.translate(207,135);
  c.scale(1.12,1.12);
  controller(-55,-44,progress(t,-.09,.58));
  c.restore();
  for (const [i,[x,y,dx,dy]] of [[136,92,-13,-12],[202,77,-2,-17],[258,91,13,-12]].entries()){
    stroke([[x,y],[x+dx,y+dy]],progress(t,.31+i*.08,.22),red,3.9);
  }
  hand("7",63,300,170,progress(t,.24,.58),blue);
  if(t>.65) caption("گرامر",455,221,71);
  if(t>.96) caption("انگلیسی",461,313,86);
  stroke([[132,341],[132,382],[150,426],[198,475],[249,505],[266,549],[231,588]],progress(t,1.7,2.1),blue,3.2);
  stroke([[221,574],[231,588],[248,584]],progress(t,3.53,.24),blue,3.2);

  hand("01",65,665,50,progress(t,3.4,.39),blue);
  hand("HABIT",134,664,43,progress(t,3.63,.76));
  marker([[71,683],[144,685],[253,682]],progress(t,3.98,.62),blue,.78);
  controller(94,724,progress(t,4.04,.99));
  calendar(345,730,progress(t,4.67,.61),progress(t,5.0,1.0));
  stroke([[62,865],[79,847],[452,848],[474,863],[471,956],[451,973],[81,971],[61,953],[62,865]],progress(t,5.15,1.2),blue,2.55);
  hand("I play every day.",84,926,48,progress(t,6.60,1.63));
  marker([[201,940],[274,942],[344,938],[416,941]],progress(t,7.75,.51),red,.67);
  stroke([[478,956],[478,1019],[454,1069],[394,1094],[335,1100],[273,1124]],progress(t,8.18,1.04),blue,2.85);
  stroke([[290,1101],[273,1124],[297,1128]],progress(t,9.01,.23),blue,2.85);

  hand("02",65,1198,50,progress(t,8.52,.47),blue);
  hand("NOW",143,1197,48,progress(t,8.77,.8));
  marker([[145,1210],[213,1209],[260,1211]],progress(t,9.34,.55),red,.75);
  controller(95,1252,progress(t,8.92,.98));
  stroke(ellipse(382,1294,38,37),progress(t,8.89,.79),ink,3.1);
  stroke([[383,1271],[382,1294],[398,1302]],progress(t,9.41,.41),red,3.3);
  panel(1198, t, 9.45, 10.36, ["I’m playing now."], "now");

  lesson(t, 1688, 12.35, "03", "YESTERDAY", 14.28, ["I played yesterday."], "yesterday", (a,b) => {
    controller(95,54,a);
    calendar(352,59,a,0);
    stroke(ellipse(388,107,19,13),b,red,2.8);
  });
  lesson(t, 2178, 17.7, "04", "INTERRUPTION", 21.05, ["I was playing", "when you called."], "called", (a,b) => {
    controller(100,52,a);
    stroke([[82,164],[226,163],[361,164],[444,163]],a,blue,3.5);
    stroke([[431,153],[444,163],[431,173]],a,blue,3.5);
    stroke([[338,77],[376,77],[380,82],[380,140],[376,144],[339,144],[334,140],[334,82],[338,77]],b,ink,3.4);
    stroke([[350,133],[364,133]],b,ink,2.4);
    stroke([[357,145],[357,174]],b,red,3.6);
    stroke([[388,94],[397,85],[397,76]],b,red,3.2);
    stroke([[397,107],[408,103]],b,red,3.2);
  });
  lesson(t, 2668, 25.96, "05", "QUICK DECISION", 30.02, ["I’ll help you."], "I’ll", (a,b) => {
    bubble(91,64,147,71,a,ink);
    hand("?",149,120,49,a);
    bubble(291,89,148,71,b,blue);
    stroke([[341,104],[330,126],[349,124],[337,151],[371,115],[349,119],[359,104]],b,red,3.1);
  });
  lesson(t, 3158, 32.22, "06", "ALREADY PLANNED", 34.85, ["I’m going to play", "tomorrow."], "tomorrow", (a,b) => {
    controller(94,53,a);
    calendar(342,58,a,0);
    stroke(ellipse(397,104,14,13),b,red,3.1);
    stroke([[226,107],[320,104],[309,96]],b,blue,3);
  });
  lesson(t, 3648, 37.4, "07", "STILL TRUE NOW", 42.0, ["I’ve lost my keys."], "lost", (a,b) => {
    stroke(ellipse(115,105,22,20),a,ink,3.7);
    stroke([[136,104],[207,104],[213,111],[205,118],[196,111],[185,118],[174,112],[138,113]],a,ink,3.7);
    stroke([[280,104],[322,105],[314,98]],a,blue,3);
    stroke([[355,69],[435,70],[432,132],[355,132],[355,69]],b,ink,3.4);
    stroke([[389,83],[405,83],[407,104],[398,114],[389,107]],b,ink,3.4);
    stroke([[369,139],[418,139]],b,red,3.4);
  });

  c.save();
  c.translate(0,4142);
  const notebook=progress(t,50.15,1.28);
  stroke([[159,72],[355,71],[365,82],[365,187],[349,203],[160,203],[148,189],[148,87],[159,72]],notebook,blue,4.0);
  stroke([[170,75],[170,199],[350,199]],notebook,ink,2.7);
  if (t>51.5) caption("دفترچهٔ تمرین",339,150,29);
  bubble(66,260,407,118,progress(t,53.7,1.55),ink);
  hand("grammar",110,337,73,progress(t,55.4,1.2),blue);
  marker([[116,349],[200,350],[303,348],[407,349]],progress(t,56.65,.52),red,.85);
  if (t>56.45) caption("کامنت کن",380,444,49);
  c.restore();
};

(async () => {
  const res=await fetch("lettering.json");
  if (!res.ok) throw new Error("Lettering data unavailable");
  glyphs=await res.json();
  await document.fonts.ready;
  window.render(0);
  window.READY=true;
})();
