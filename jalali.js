(function(g){
const div=(a,b)=>Math.trunc(a/b), mod=(a,b)=>a-div(a,b)*b;
const B=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2330,2390,2456,3178];
function cal(jy){let gy=jy+621,leapJ=-14,jp=B[0],jm,jump,i;
 for(i=1;i<B.length;i++){jm=B[i];jump=jm-jp;if(jy<jm)break;leapJ+=div(jump,33)*8+div(mod(jump,33),4);jp=jm}
 let n=jy-jp;leapJ+=div(n,33)*8+div(mod(n,33)+3,4);
 if(mod(jump,33)===4&&jump-n===4)leapJ++;
 const leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150,march=20+leapJ-leapG;
 if(jump-n<6)n=n-jump+div(jump+4,33)*33;
 let leap=mod(mod(n+1,33)-1,4);if(leap===-1)leap=4;
 return{leap,gy,march}}
function g2d(y,m,d){let r=div((y+div(m-8,6)+100100)*1461,4)+div(153*mod(m+9,12)+2,5)+d-34840408;
 return r-div(div(y+100100+div(m-8,6),100)*3,4)+752}
function d2g(j){let x=4*j+139361631;x+=div(div(4*j+183187720,146097)*3,4)*4-3908;
 const i=div(mod(x,1461),4)*5+308,gd=div(mod(i,153),5)+1,gm=mod(div(i,153),12)+1;
 return{gy:div(x,1461)-100100+div(8-gm,6),gm,gd}}
function toGregorian(jy,jm,jd){const r=cal(jy);return d2g(g2d(r.gy,3,r.march)+(jm-1)*31-div(jm,7)*(jm-7)+jd-1)}
function toJalali(gy,gm,gd){const j=g2d(gy,gm,gd);let jy=d2g(j).gy-621;const r=cal(jy),f=g2d(d2g(j).gy,3,r.march);
 let k=j-f,jm,jd;
 if(k>=0){if(k<=185)return{jy,jm:1+div(k,31),jd:mod(k,31)+1};k-=186}
 else{jy--;k+=179;if(r.leap===1)k++}
 return{jy,jm:7+div(k,30),jd:mod(k,30)+1}}
function monthLength(jy,jm){return jm<=6?31:jm<=11?30:(cal(jy).leap===0?30:29)}
const API={toGregorian,toJalali,monthLength};
if(typeof module!=='undefined')module.exports=API;else g.Jalali=API;
})(this);
