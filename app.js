import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
const $=s=>document.querySelector(s), host=$('#viewport');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e9e5dc');const camera=new THREE.PerspectiveCamera(32,1,.001,20);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.22;controls.maxDistance=.95;controls.maxPolarAngle=Math.PI*.53;controls.autoRotateSpeed=.7;
const pmrem=new THREE.PMREMGenerator(renderer);
const studio=new THREE.Scene();studio.background=new THREE.Color('#171d24');
const studioWall=new THREE.Mesh(new THREE.BoxGeometry(10,8,10),new THREE.MeshBasicMaterial({color:'#414851',side:THREE.BackSide}));studio.add(studioWall);
function reflectionCard(x,y,z,w,h,power){const card=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(power),side:THREE.DoubleSide}));card.position.set(x,y,z);card.lookAt(0,0,0);studio.add(card)}
reflectionCard(-3,1,2,1.3,5,5);reflectionCard(3,1,-1,.65,5,7);reflectionCard(0,3,1,4,2,2.5);reflectionCard(-1,0,-4,3,3,1.2);
scene.environment=pmrem.fromScene(studio,.015).texture;scene.environmentIntensity=.85;
const light=new THREE.DirectionalLight(0xffefdc,3);light.position.set(-.3,.5,.4);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-.4;light.shadow.camera.right=.4;light.shadow.camera.top=.4;light.shadow.camera.bottom=-.4;light.shadow.camera.near=.01;light.shadow.camera.far=2;light.shadow.bias=-.0001;scene.add(light);const fill=new THREE.DirectionalLight(0xdceaff,1.5);fill.position.set(.3,.2,-.2);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.MeshStandardMaterial({color:'#e9e5dc',roughness:.32,metalness:.08}));ground.rotation.x=-Math.PI/2;ground.position.y=-.001;ground.receiveShadow=true;scene.add(ground);
let model, labels=[], metals=[], caps=[], packageMats=[], packageSides=[], bodies=[], bottles=[], boxes=[];let state={color:1,finish:.46,metal:'gold',cap:'black',body:'glass',view:'all',light:'studio'};const names=['','深海蓝','宝石蓝','藏红'];const textures={};
function resetCamera(){if(state.view==='cap'){controls.target.set(.045,.15,.025);camera.position.set(.11,.245,.16);controls.update();return}controls.target.set(state.view==='bottle'?.045:state.view==='box'?-.07:-.008,.087,0);camera.position.set(controls.target.x+.16,.16,.54);controls.update()}
function active(group,button){$(group).querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))})}
function summary(){$('#color-name').textContent=names[state.color];$('#summary').textContent=`${names[state.color]} / ${{'.46':'哑光烫金','.15':'亮面烤漆','.85':'细磨砂'}[String(state.finish).replace('0.','.')]} / ${state.body==='glass'?'通透玻璃':'白色陶瓷'} / ${capNames[state.cap]}瓶盖 / ${state.metal==='gold'?'金环':'银环'}`}
function metal(){metals.forEach(m=>{m.anisotropy=0;m.color.set(state.metal==='gold'?'#cbbb8c':'#d5d8dd');m.metalness=.88;m.roughness=state.metal==='gold'?.25:.34})}
function applyColor(i){state.color=Number(i);labels.forEach(m=>{m.map=textures[i];m.needsUpdate=true});updatePackage();summary()}
function setView(v){state.view=v;bottles.forEach(o=>o.visible=v!=='box');boxes.forEach(o=>o.visible=v!=='bottle'&&v!=='cap');resetCamera()}

const capNames={gold:'香槟金',silver:'拉丝银',black:'曜石黑',white:'瓷白',wood:'木色'};
const woodCanvas=document.createElement('canvas');woodCanvas.width=512;woodCanvas.height=512;const woodCtx=woodCanvas.getContext('2d');const pixels=woodCtx.createImageData(512,512);
for(let y=0;y<512;y++)for(let x=0;x<512;x++){const w=x+7*Math.sin(y*.012)+3*Math.sin(y*.033);const grain=.5+.26*Math.sin(w*.27)+.13*Math.sin(w*.89)+.08*Math.sin(w*2.31+y*.013);const k=(y*512+x)*4;pixels.data[k]=110+grain*70;pixels.data[k+1]=66+grain*58;pixels.data[k+2]=33+grain*35;pixels.data[k+3]=255}woodCtx.putImageData(pixels,0,0);
const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;woodTexture.repeat.set(2,1);
function applyBody(){bodies.forEach(m=>{const glass=state.body==='glass';m.color.set(glass?'#ffffff':'#fffaf1');m.metalness=0;m.roughness=glass?.015:.24;m.transmission=glass?1:0;m.thickness=glass?.012:0;m.ior=1.52;m.attenuationColor.set('#a1c6b5');m.attenuationDistance=.09;m.envMapIntensity=glass?1.65:1;m.clearcoat=glass?0:1;m.clearcoatRoughness=glass?.04:.12;m.side=THREE.FrontSide;m.needsUpdate=true});summary()}
function applyCap(){caps.forEach(m=>{const kind=state.cap;const metallic=kind==='gold'||kind==='silver';m.map=kind==='wood'?woodTexture:null;m.color.set({gold:'#cbbb8c',silver:'#d5d8dd',black:'#151719',white:'#fffaf1',wood:'#ffffff'}[kind]);m.metalness=metallic?.88:0;m.roughness=kind==='wood'?.43:metallic?.28:.22;m.anisotropy=0;m.clearcoat=metallic?.08:.35;m.needsUpdate=true});summary()}
$('#body-material').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;active('#body-material',b);state.body=b.dataset.body;applyBody()});
$('#caps').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;active('#caps',b);state.cap=b.dataset.cap;applyCap()});


const packageColor=new THREE.Color('#03162e');
function updatePackage(){packageColor.set({1:'#03162e',2:'#061d52',3:'#97051c'}[state.color]);packageSides.forEach(m=>m.color.copy(packageColor))}
function configurePackage(m){
 m.onBeforeCompile=shader=>{shader.uniforms.packageColor={value:packageColor};shader.fragmentShader='uniform vec3 packageColor;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float blueSaturation=(diffuseColor.b-max(diffuseColor.r,diffuseColor.g))/max(diffuseColor.b,0.001);
 float blueInk=smoothstep(0.36,0.65,blueSaturation);
 float paperShade=clamp(diffuseColor.b/0.15,0.65,1.35);
 diffuseColor.rgb=mix(diffuseColor.rgb,packageColor*paperShade,blueInk);
 `)};m.customProgramCacheKey=()=> 'package-ink-v1';m.needsUpdate=true;
}

const loader=new THREE.TextureLoader();
const draco=new DRACOLoader().setDecoderPath('./vendor/draco/').setDecoderConfig({type:'wasm'});
const modelLoader=new GLTFLoader().setDRACOLoader(draco);
Promise.all([1,2,3].map(i=>loader.loadAsync(`./assets/label-${i}.webp`).then(t=>{t.flipY=false;t.channel=2;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();textures[i]=t}))).then(()=>modelLoader.loadAsync('./assets/bottle.glb',e=>{if(e.total)$('#loading').firstChild.textContent=`正在载入模型 ${Math.round(e.loaded/e.total*100)}%`;})).then(g=>{
 model=g.scene;scene.add(model);model.traverse(o=>{if(!o.isMesh)return;let p=o,isBox=false;while(p){if(p.name.startsWith('包装'))isBox=true;p=p.parent} (isBox?boxes:bottles).push(o);o.castShadow=true;o.receiveShadow=false;
 const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{if(m.name.includes('原稿印刷')){packageMats.push(m);configurePackage(m)}if(m.name.includes('藏蓝包纸'))packageSides.push(m);if(m.name.includes('瓶贴')){labels.push(m);o.scale.x=1.055;o.scale.z=1.055;m.map=textures[1];m.alphaTest=.45;m.transparent=true;m.side=THREE.FrontSide;o.renderOrder=3;m.roughness=.46;m.metalness=.4}if(o.name==='01_箍_瓶塞'){caps.push(m);const a=o.geometry.attributes.position;const uv=new Float32Array(a.count*2);o.geometry.computeBoundingBox();const box=o.geometry.boundingBox;for(let i=0;i<a.count;i++){uv[i*2]=Math.atan2(a.getZ(i),a.getX(i))/(2*Math.PI)+.5;uv[i*2+1]=(a.getY(i)-box.min.y)/(box.max.y-box.min.y)}o.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));}else if(/保留光面|编织浅浮雕|拉丝银/.test(m.name))metals.push(m);if(m.name.includes('玻璃'))bodies.push(m) });
 });updatePackage();metal();applyBody();applyCap();summary();resetCamera();$('#loading').style.display='none';window.showroomReady=true;
}).catch(e=>{$('#loading').textContent='模型加载失败，请刷新页面重试。';console.error(e)});
$('#colors').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;active('#colors',b);applyColor(b.dataset.color)});
$('#finish').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;active('#finish',b);state.finish=Number(b.dataset.rough);labels.forEach(m=>{m.roughness=state.finish;m.metalness=state.finish===.15?.5:.3});summary()});
$('#metals').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;active('#metals',b);state.metal=b.dataset.metal;metal();summary()});
$('#view').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;active('#view',b);setView(b.dataset.view)});
$('#lighting').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;active('#lighting',b);state.light=b.dataset.light;scene.background.set(state.light==='dark'?'#26313e':state.light==='warm'?'#e9ddc8':'#e9e5dc');ground.material.color.copy(scene.background);document.body.classList.toggle('dark',state.light==='dark');light.color.set(state.light==='warm'?0xffcf8b:0xffefdc);renderer.toneMappingExposure=state.light==='dark'?.95:state.light==='warm'?1.1:1.2});
$('#rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('#rotate').classList.toggle('active',controls.autoRotate);$('#rotate').setAttribute('aria-pressed',controls.autoRotate)};$('#reset').onclick=resetCamera;
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('#notice').textContent='当前窗口不支持全屏，请在独立浏览器打开。'}};
$('#restore').onclick=()=>{['#colors','#body-material','#finish','#metals','#caps','#view','#lighting'].forEach(s=>$(s).querySelector('button').click());controls.autoRotate=false;$('#rotate').setAttribute('aria-pressed','false');$('#rotate').classList.remove('active');resetCamera();$('#notice').textContent='已恢复初始方案'};
$('#save').onclick=()=>{if(!model){$('#notice').textContent='请等待模型载入完成';return}renderer.render(scene,camera);const c=document.createElement('canvas');c.width=1600;c.height=1200;const ctx=c.getContext('2d');ctx.fillStyle=state.light==='dark'?'#202a35':'#eeebe4';ctx.fillRect(0,0,c.width,c.height);const src=renderer.domElement;const s=Math.min(1500/src.width,980/src.height);ctx.drawImage(src,(1600-src.width*s)/2,65,src.width*s,src.height*s);ctx.fillStyle=state.light==='dark'?'#eee4d2':'#39362e';ctx.font='30px Microsoft YaHei';ctx.fillText('扎日神山酒 · 设计方案',65,65);ctx.font='21px Microsoft YaHei';ctx.fillText($('#summary').textContent,65,1130);const a=document.createElement('a');a.download=`扎日神山酒-${names[state.color]}-${state.metal}.png`;a.href=c.toDataURL('image/png');a.click();$('#notice').textContent='方案图片已导出'};
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}).observe(host);resetCamera();renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
