(()=>{if(!function(){const t=document.createElement("canvas").getContext("2d");t.fillRect(0,0,40,40),t.drawImage(t.canvas,-40,-40,80,80,50,50,20,20);const e=t.getImageData(50,50,30,30),a=new Uint32Array(e.data.buffer),n=(t,n)=>a[n*e.width+t];return[[9,9],[20,9],[9,20],[20,20]].some(([t,e])=>0!==n(t,e))||[[10,10],[19,10],[10,19],[19,19]].some(([t,e])=>0===n(t,e))}())return;const t=CanvasRenderingContext2D.prototype,e=t.drawImage;e?t.drawImage=function(t,a,n){if(!(9===arguments.length))return e.apply(this,[...arguments]);const r=function(t,e,a,n,r,i,o,s,h){const{width:m,height:c}=function(t){const e=e=>{const a=globalThis[e];return a&&t instanceof a};if(e("HTMLImageElement"))return{width:t.naturalWidth,height:t.naturalHeight};if(e("HTMLVideoElement"))return{width:t.videoWidth,height:t.videoHeight};if(e("SVGImageElement"))throw new TypeError("SVGImageElement isn't yet supported as source image.","UnsupportedError");if(e("HTMLCanvasElement")||e("ImageBitmap"))return t}(t);n<0&&(e+=n,n=Math.abs(n));r<0&&(a+=r,r=Math.abs(r));s<0&&(i+=s,s=Math.abs(s));h<0&&(o+=h,h=Math.abs(h));const u=Math.max(e,0),d=Math.min(e+n,m),g=Math.max(a,0),l=Math.min(a+r,c),f=s/n,p=h/r;return[t,u,g,d-u,l-g,e<0?i-e*f:i,a<0?o-a*p:o,(d-u)*f,(l-g)*p]}(...arguments);var i;return i=r,[3,4,7,8].some(t=>!i[t])?void 0:e.apply(this,r)}:console.error("This script requires a basic implementation of drawImage")})();