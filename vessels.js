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
const pieces=[
 {file:'vessel-cylinder',name:'纹饰筒形酒具',description:'直筒器形与朱红表面，横向纹饰环带层层相接。转动观察顶部与装饰细节。'},
 {file:'vessel-flower',name:'花纹酒壶',description:'高挑壶颈连接圆润壶腹，曲线把手与高足呼应，细密纹样点缀器身。'},
 {file:'vessel-copper',name:'铜制水壶',description:'修长铜色壶身配合高低错落的口沿，壶嘴与弧形提柄形成舒展轮廓。'}
];
const group=new THREE.Group();scene.add(group);let selected=-1,view='all',lighting='studio',ready=false;const models=[];
controls.maxDistance=1.8;controls.minDistance=.1;controls.maxPolarAngle=Math.PI*.49;
const $all=s=>document.querySelectorAll(s);
function active(selector,chosen){$all(selector+' button').forEach(b=>{b.classList.toggle('active',b===chosen);b.setAttribute('aria-pressed',String(b===chosen))})}
function frame(){
 const all=selected<0;const targetY=view==='detail'?.13:.09;controls.target.set(0,targetY,0);
 const dist=all?Math.max(.55,.23/(Math.tan(THREE.MathUtils.degToRad(16))*camera.aspect)):view==='detail'?.26:Math.max(.4,.095/(Math.tan(THREE.MathUtils.degToRad(16))*camera.aspect));
 camera.position.set(view==='front'?0:dist*.12,targetY+(view==='front'?0:dist*.15),dist);controls.update();
}
function choose(index,mode='front'){
 selected=index;view=mode;models.forEach((m,i)=>{m.visible=index<0||i===index;m.position.x=index<0?(i-1)*.15:0});
 active('#vessel-options',index<0?null:$all('#vessel-options button')[index]);
 active('#views',document.querySelector(`#views [data-view="${mode}"]`));
 $('#piece-title').textContent=index<0?'三款酒具 · 全貌':pieces[index].name;
 $('#piece-description').textContent=index<0?'从直筒到曲腹，从纹饰环带到弧形提柄，转动视角，细看每一款酒具的形态与材质。':pieces[index].description;
 frame();
}
const draco=new DRACOLoader().setDecoderPath('./vendor/draco/').setDecoderConfig({type:'wasm'});
const loader=new GLTFLoader().setDRACOLoader(draco);let loaded=0;
Promise.all(pieces.map(async(p,i)=>{const gltf=await loader.loadAsync(`./assets/${p.file}.glb`);const m=gltf.scene;models[i]=m;m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(mat=>{if(mat.map)mat.map.anisotropy=renderer.capabilities.getMaxAnisotropy();mat.envMapIntensity=.7})}});group.add(m);$('#loading').textContent=`正在载入酒具 ${++loaded} / 3`; })).then(()=>{ready=true;choose(-1,'all');$('#loading').hidden=true;window.showroomReady=true}).catch(e=>{$('#loading').textContent='酒具加载失败，请刷新重试。';console.error(e)});
$('#vessel-options').onclick=e=>{const b=e.target.closest('button');if(b&&ready)choose(Number(b.dataset.index))};
$('#views').onclick=e=>{const b=e.target.closest('button');if(!b||!ready)return;choose(b.dataset.view==='all'?-1:Math.max(0,selected),b.dataset.view)};
$('#reset').onclick=frame;
$('#rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('#rotate').classList.toggle('active',controls.autoRotate);$('#rotate').setAttribute('aria-pressed',String(controls.autoRotate))};
$('#lighting').onclick=e=>{const b=e.target.closest('button');if(!b)return;lighting=b.dataset.light;active('#lighting',b);scene.background.set(lighting==='dark'?'#26313e':lighting==='warm'?'#e9ddc8':'#e9e5dc');ground.material.color.copy(scene.background);document.body.classList.toggle('dark',lighting==='dark');light.color.set(lighting==='warm'?0xffcf8b:0xffefdc);renderer.toneMappingExposure=lighting==='dark'?1:1.2};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('#notice').textContent='请在独立浏览器中使用全屏。'}};
$('#save').onclick=()=>{if(!ready){$('#notice').textContent='请等待酒具加载完成';return}renderer.render(scene,camera);const a=document.createElement('a');a.download=(selected<0?'三款酒具':pieces[selected].name)+'.png';a.href=renderer.domElement.toDataURL('image/png');a.click();$('#notice').textContent='展示图片已导出'};
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();frame()}).observe(host);
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
