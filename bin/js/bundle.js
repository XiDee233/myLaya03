(function () {
    'use strict';

    class CloseBtn extends Laya.Script {
        constructor() { super(); }
        onEnable() {
        }
        onClick(e) {
            //当点击按钮时，返回到主场景
            Laya.Scene.open("Index.scene");
        }
        onDisable() {
        }
    }

    var KeyBoardManager = Laya.KeyBoardManager;
    var Keyboard = Laya.Keyboard;
    var Vector3 = Laya.Vector3;
    class D3Main extends Laya.Script {
        constructor() {
            super(...arguments);
            /**3D 场景 */
            this.scene3D = new Laya.Scene3D();
            /** 拖尾的当前转向 */
            this.turnLeft = true;
            /** 当前所处的旋转方位 */
            this._rotation = new Vector3(0, 0, 0);
            this.rotationW = new Vector3(0, 0, 0);
            this.rotationS = new Vector3(0, 180, 0);
            this.rotationA = new Vector3(0, 90, 0);
            this.rotationD = new Vector3(0, -90, 0);
            this.sp3Role = new Laya.Sprite3D();
        }
        onEnable() {
            //在场景中找到对应的节点
            this.spDude = this.owner.getChildByName("spDude");
            this.spFatso = this.owner.getChildByName("spFatso");
            this.spMonkey = this.owner.getChildByName("spMonkey");
            this.spTrail = this.owner.getChildByName("spTrail");
            //初始化设置
            this.setStage();
            this.sceneInit();
            Laya.timer.frameOnce(1, this, () => {
                //加载3D精灵（模型），添加到2D精灵上
                this._3Dto2D("d3/dude/dude.lh", this.spDude, 1, true);
                //设置2D精灵坐标位置
                this.spDude.pos(30, 768);
                this._3Dto2D("d3/LayaMonkey2/LayaMonKey.lh", this.spMonkey, 2);
                this.spMonkey.pos(150, 110);
                this._3Dto2D("d3/BoneLinkScene/PangZi.lh", this.spFatso, 3);
                this.spFatso.pos(300, 380);
                this._3Dto2D("d3/trail/Cube.lh", this.spTrail, 5);
                this.spTrail.pos(100, 500);
            });
        }
        /** 重置舞台相关的设置
         * @readme 由于上一个场景是横屏的，切到竖屏游戏的时候，需要修改一些初始化的舞台设置，否则就会有问题。
         * 当然，这只是故意实现的特例，正常情况下，不需要这样做，横屏还是竖屏，最好统一起来。
         */
        setStage() {
            //取消对画布的物理分辨率
            Laya.stage.useRetinalCanvas = false;
            //重置舞台的初始宽高
            Laya.stage.width = 640;
            Laya.stage.height = 1136;
            //仅为写Demo，用于PC上的体验，固定了宽高，手机端不建议使用showall模式（不能保障各机型全屏适配）。
            Laya.stage.scaleMode = Laya.Stage.SCALE_SHOWALL;
            //在不全屏的情况下，stage位于画布的位置
            Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
            Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
        }
        /** 初始化场景 */
        sceneInit() {
            //添加3D场景到舞台上
            Laya.stage.addChild(this.scene3D);
            //创建场景里的平行光
            let directionLight = new Laya.DirectionLight();
            //添加平行光到场景上
            this.scene3D.addChild(directionLight);
            //设置平行光的强度
            directionLight.intensity = 0.9;
        }
        /** 加载3D精灵画到2D Texture上
         * @param lh 模型的字符串路径
         * @param sp 2D精灵节点，用于画3D的texture
         * @param layer 手动指定层ID
         * @param isRole 是否是可以被控制的主角
        */
        _3Dto2D(lh, sp, layer, isRole = false) {
            //加载指定的模型，并画到2D精灵上
            Laya.Sprite3D.load(lh, Laya.Handler.create(this, (sp3) => {
                //把指定的模型节点添加3D到场景上
                this.scene3D.addChild(sp3);
                //创建一个3D摄像机
                let _camera = new Laya.Camera(0, 0.1, 1000);
                //把摄像机添加到3D场景上
                this.scene3D.addChild(_camera);
                //设置摄像机旋转角度
                _camera.transform.rotate(new Vector3(-45, 0, 0), false, false);
                _camera.clearColor = new Laya.Vector4(0, 0, 0, 0);
                //把摄像机设置为正交模式，2\3D混合游戏一般不使用透视模式
                _camera.orthographic = true;
                //近大远小，
                _camera.orthographicVerticalSize = 10;
                //清除其它层，避免几个层混合到一起
                _camera.removeAllLayers();
                //设置摄像机的层
                _camera.addLayer(layer);
                //一定要给对应的渲染对象节点设置层与摄像机一样的层，如果不清楚是哪个节点，就写个循环，把所有节点都遍历设置一下，否则会影响显示结果
                sp3.getChildAt(0).getChildAt(0).layer = layer;
                //临时坐标，用于2D转3D的输出
                let _tempPos = new Vector3(0, 0, 0);
                //把想显示在2D位置的屏幕坐标转换为3D空间坐标
                _camera.convertScreenCoordToOrthographicCoord(new Vector3(220, 900, 0), _tempPos);
                //把转换后的坐标设置在3D场景中，以便吻合2D屏幕的观察
                sp3.transform.position = _tempPos;
                //缩放值为1
                sp3.transform.localScale = new Vector3(1, 1, 1);
                //把3D摄像机视图画到256宽高的纹理上
                _camera.renderTarget = new Laya.RenderTexture(256, 256, Laya.RenderTextureFormat.R8G8B8A8, Laya.RenderTextureDepthFormat.DEPTHSTENCIL_24_8);
                // 再将离屏3D画到2D节点上，至此，就完成把3D画到2D的基础渲染流程
                sp.texture = new Laya.Texture(_camera.renderTarget);
                //根据参数决定是否要控制哪个节点
                isRole && (this.sp3Role = sp3);
            }));
        }
        onUpdate() {
            //调整拖尾转向
            if (this.spTrail.x < 20 && this.turnLeft)
                this.turnLeft = false;
            else if (this.spTrail.x > (Laya.stage.width - 200) && !(this.turnLeft))
                this.turnLeft = true;
            //控制拖尾的自动移动
            if (this.turnLeft)
                this.spTrail.x -= 1;
            else
                this.spTrail.x += 1;
            //侦听键盘事件，让用户来控制主角移动
            if (KeyBoardManager.hasKeyDown(Keyboard.W)) {
                this.spDude.y -= 1;
                this.rotateRole(this.rotationW);
            }
            else if (KeyBoardManager.hasKeyDown(Keyboard.S)) {
                this.spDude.y += 1;
                this.rotateRole(this.rotationS);
            }
            else if (KeyBoardManager.hasKeyDown(Keyboard.A)) {
                this.spDude.x -= 1;
                this.rotateRole(this.rotationA);
            }
            else if (KeyBoardManager.hasKeyDown(Keyboard.D)) {
                this.spDude.x += 1;
                this.rotateRole(this.rotationD);
            }
        }
        /** 改变角色的朝向
         * @param r Vector3旋转值
         */
        rotateRole(r) {
            if (r === this._rotation)
                return;
            //按世界坐标改变到指定的方位
            this.sp3Role.transform.rotationEuler = r;
            //纪录当前方位，避免重复改变
            this._rotation = r;
        }
        onDisable() {
            //恢复对画布使用物理分辨率
            Laya.stage.useRetinalCanvas = true;
            //恢复舞台的设计宽高
            Laya.stage.width = 1334;
            Laya.stage.height = 750;
            //恢复适配模式
            Laya.stage.scaleMode = Laya.Stage.SCALE_FIXED_WIDTH;
            //激活画布的刷新重置
            Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
            //页面关闭后，清除3D场景
            this.scene3D.destroy();
        }
    }

    class Index extends Laya.Script {
        constructor() { super(); }
        onEnable() {
            //侦听ui按钮点击事件
            this.uiBtn.on(Laya.Event.CLICK, this, () => {
                //点击后，打开UI场景示例
                Laya.Scene.open("uiDemo/UiMain.scene");
            });
            //侦听物理按钮点击事件
            this.phyBtn.on(Laya.Event.CLICK, this, () => {
                //点击后，打开物理游戏示例
                Laya.Scene.open("physicsDemo/PhysicsGameMain.scene");
            });
            //侦听3D混合按钮点击事件
            this.d3Btn.on(Laya.Event.CLICK, this, () => {
                //点击后，打开3D混合场景示例
                Laya.Scene.open("d3Demo/D3Main.scene");
            });
        }
        onDisable() {
        }
    }

    /**This class is automatically generated by LayaAirIDE, please do not make any modifications. */
    var View=Laya.View;
    var Dialog=Laya.Dialog;
    var Scene=Laya.Scene;
    var REG = Laya.ClassUtils.regClass;
    class saceToNormalUI extends Laya.EffectAnimation {
    	constructor(){ 
    		super();
    		    this.ani1=null;
    		this.effectData =saceToNormalUI.uiView;;
    	}
    }
    saceToNormalUI.uiView={"type":"View","props":{},"compId":2,"child":[{"type":"Sprite","props":{"y":0,"x":0,"texture":"comp/x.png"},"compId":3}],"animations":[{"nodes":[{"target":3,"keyframes":{"scaleY":[{"value":0.8,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleY","index":0},{"value":1,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleY","index":5}],"scaleX":[{"value":0.8,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleX","index":0},{"value":1,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleX","index":5}]}}],"name":"ani1","id":1,"frameRate":24,"action":0}],"loadList":["comp/x.png"],"loadList3D":[]};
    REG("ui.ani.saceToNormalUI",saceToNormalUI);
    class scaleUI extends Laya.EffectAnimation {
    	constructor(){ 
    		super();
    		    this.ani1=null;
    		this.effectData =scaleUI.uiView;;
    	}
    }
    scaleUI.uiView={"type":"View","props":{},"compId":2,"child":[{"type":"Button","props":{"y":0,"x":0,"skin":"comp/button.png","label":"label","labelSize":28,"labelFont":"SimHei","labelColors":"#fff,#fff,#e7ce4e","sizeGrid":"14,16,15,19","width":160,"labelPadding":"0,0,1,0"},"compId":3}],"animations":[{"nodes":[{"target":3,"keyframes":{"scaleY":[{"value":1,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleY","index":0},{"value":1.2,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleY","index":12},{"value":1,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleY","index":24}],"scaleX":[{"value":1,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleX","index":0},{"value":1.2,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleX","index":12},{"value":1,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleX","index":24}]}}],"name":"ani1","id":1,"frameRate":60,"action":0}],"loadList":["comp/button.png"],"loadList3D":[]};
    REG("ui.ani.scaleUI",scaleUI);
    class scaleToBigUI extends Laya.EffectAnimation {
    	constructor(){ 
    		super();
    		    this.ani1=null;
    		this.effectData =scaleToBigUI.uiView;;
    	}
    }
    scaleToBigUI.uiView={"type":"View","props":{},"compId":2,"child":[{"type":"Image","props":{"y":0,"x":0,"skin":"comp/img_blank.png"},"compId":3}],"animations":[{"nodes":[{"target":3,"keyframes":{"scaleY":[{"value":1,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleY","index":0},{"value":1.2,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleY","index":6}],"scaleX":[{"value":1,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleX","index":0},{"value":1.2,"tweenMethod":"linearNone","tween":true,"target":3,"key":"scaleX","index":6}]}}],"name":"ani1","id":1,"frameRate":24,"action":0}],"loadList":["comp/img_blank.png"],"loadList3D":[]};
    REG("ui.ani.scaleToBigUI",scaleToBigUI);
    class scaleToSmallUI extends Laya.EffectAnimation {
    	constructor(){ 
    		super();
    		    this.ani1=null;
    		this.effectData =scaleToSmallUI.uiView;;
    	}
    }
    scaleToSmallUI.uiView={"type":"View","props":{},"compId":2,"child":[{"type":"Image","props":{"y":0,"x":0,"skin":"comp/img_hd.png"},"compId":4}],"animations":[{"nodes":[{"target":4,"keyframes":{"scaleY":[{"value":1,"tweenMethod":"linearNone","tween":true,"target":4,"key":"scaleY","index":0},{"value":0.8,"tweenMethod":"linearNone","tween":true,"target":4,"key":"scaleY","index":6}],"scaleX":[{"value":1,"tweenMethod":"linearNone","tween":true,"target":4,"key":"scaleX","index":0},{"value":0.8,"tweenMethod":"linearNone","tween":true,"target":4,"key":"scaleX","index":6}]}}],"name":"ani1","id":1,"frameRate":24,"action":0}],"loadList":["comp/img_hd.png"],"loadList3D":[]};
    REG("ui.ani.scaleToSmallUI",scaleToSmallUI);
    class LoadingUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("Loading");
    	}
    }
    REG("ui.LoadingUI",LoadingUI);
    class PhysicsGameMainUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("physicsDemo/PhysicsGameMain");
    	}
    }
    REG("ui.physicsDemo.PhysicsGameMainUI",PhysicsGameMainUI);
    class AniEffectUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/animation/AniEffect");
    	}
    }
    REG("ui.uiDemo.animation.AniEffectUI",AniEffectUI);
    class AtlasAniUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/animation/AtlasAni");
    	}
    }
    REG("ui.uiDemo.animation.AtlasAniUI",AtlasAniUI);
    class FrameAniUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/animation/FrameAni");
    	}
    }
    REG("ui.uiDemo.animation.FrameAniUI",FrameAniUI);
    class TimelineAniUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/animation/TimelineAni");
    	}
    }
    REG("ui.uiDemo.animation.TimelineAniUI",TimelineAniUI);
    class TweenAniUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/animation/TweenAni");
    	}
    }
    REG("ui.uiDemo.animation.TweenAniUI",TweenAniUI);
    class DialogUI extends Dialog {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/Dialog");
    	}
    }
    REG("ui.uiDemo.DialogUI",DialogUI);
    class JoystickUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/interactive/Joystick");
    	}
    }
    REG("ui.uiDemo.interactive.JoystickUI",JoystickUI);
    class ShapeDetectionUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/interactive/ShapeDetection");
    	}
    }
    REG("ui.uiDemo.interactive.ShapeDetectionUI",ShapeDetectionUI);
    class BagListUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/list/BagList");
    	}
    }
    REG("ui.uiDemo.list.BagListUI",BagListUI);
    class ComboBoxUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/list/ComboBox");
    	}
    }
    REG("ui.uiDemo.list.ComboBoxUI",ComboBoxUI);
    class LoopListUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/list/LoopList");
    	}
    }
    REG("ui.uiDemo.list.LoopListUI",LoopListUI);
    class MailListUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/list/MailList");
    	}
    }
    REG("ui.uiDemo.list.MailListUI",MailListUI);
    class RefreshUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/list/Refresh");
    	}
    }
    REG("ui.uiDemo.list.RefreshUI",RefreshUI);
    class TreeListUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/list/TreeList");
    	}
    }
    REG("ui.uiDemo.list.TreeListUI",TreeListUI);
    class MsgUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/Msg");
    	}
    }
    REG("ui.uiDemo.MsgUI",MsgUI);
    class IframeElementUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/page/IframeElement");
    	}
    }
    REG("ui.uiDemo.page.IframeElementUI",IframeElementUI);
    class OpenMainSceneUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/page/OpenMainScene");
    	}
    }
    REG("ui.uiDemo.page.OpenMainSceneUI",OpenMainSceneUI);
    class OpenSceneUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/page/OpenScene");
    	}
    }
    REG("ui.uiDemo.page.OpenSceneUI",OpenSceneUI);
    class UsePanelUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/page/UsePanel");
    	}
    }
    REG("ui.uiDemo.page.UsePanelUI",UsePanelUI);
    class UiMainUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/UiMain");
    	}
    }
    REG("ui.uiDemo.UiMainUI",UiMainUI);
    class ChangeTextureUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/useUI/ChangeTexture");
    	}
    }
    REG("ui.uiDemo.useUI.ChangeTextureUI",ChangeTextureUI);
    class MaskUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/useUI/Mask");
    	}
    }
    REG("ui.uiDemo.useUI.MaskUI",MaskUI);
    class MouseThroughUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/useUI/MouseThrough");
    	}
    }
    REG("ui.uiDemo.useUI.MouseThroughUI",MouseThroughUI);
    class PhysicalCollisionUI extends View {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/useUI/PhysicalCollision");
    	}
    }
    REG("ui.uiDemo.useUI.PhysicalCollisionUI",PhysicalCollisionUI);
    class ProgressUI extends Scene {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/useUI/Progress");
    	}
    }
    REG("ui.uiDemo.useUI.ProgressUI",ProgressUI);
    class TextShowUI extends Scene {
    	constructor(){ 
    		super();
    	}
    	createChildren() {
    		super.createChildren();
    		this.loadScene("uiDemo/useUI/TextShow");
    	}
    }
    REG("ui.uiDemo.useUI.TextShowUI",TextShowUI);

    class LoadingRT extends LoadingUI {
        onAwake() {
            let resArr = [
                "bg/background.jpg",
                "bg/bg14.png",
                "bg/img_bg4.png",
                "bg/bg.png",
                "demo/fcs.jpg",
                "demo/whs.jpg",
                "res/atlas/bag.atlas",
                "res/atlas/bg.atlas",
                "res/atlas/cd.atlas",
                "res/atlas/comp.atlas",
                "role/atlasAni/139x.atlas",
                "role/spineAni/dragon.sk",
                "role/spineAni/goblins.sk",
                "res/atlas/role/frameAni.atlas",
                "res/atlas/role.atlas",
                "res/atlas/test.atlas",
                "files/layaAir.mp4",
                "json/bagList.json",
                "json/mailList.json",
            ];
            //加载2D
            Laya.loader.load(resArr, Laya.Handler.create(this, this.load3D));
            // 侦听加载失败
            Laya.loader.on(Laya.Event.ERROR, this, this.onError);
        }

        /** 加载3D */
        load3D() {
            let resArr3d = [
                "d3/dude/dude.lh",
                "d3/LayaMonkey2/LayaMonKey.lh",
                "d3/BoneLinkScene/PangZi.lh",
                "d3/trail/Cube.lh"
            ];
            //加载3D
            Laya.loader.create(resArr3d, Laya.Handler.create(this, this.onLoaded), Laya.Handler.create(this, this.onLoading));
        }

        /**
         * 当报错时打印错误
         * @param err 报错信息
         */
        onError(err) {
            console.log("加载失败: " + err);
        }

        /**
         * 加载时侦听
         */
        onLoading(progress) {
            //接近完成加载时，让显示进度比实际进度慢一点，这是为打开场景时的自动加载预留，尤其是要打开的场景资源多，并没有完全放到预加载中，还需要再自动加载一部分时。
            if (progress > 0.92)
                this.progress.value = 0.95;
            else
                this.progress.value = progress;
            console.log("加载进度: " + progress, this.progress.value);
        }

        /**
         * 加载完成后，处理逻辑
         */
        onLoaded() {
            this.progress.value = 0.98;
            console.log("加载结束", this.progress.value);
            //预加载的东西太少，为了本地看效果延迟一秒，真实项目不需要延迟
            Laya.timer.once(1000, this, () => {
                //跳转到入口场景
                Laya.Scene.open("Index.scene");
            });
        }
    }

    /**
     * 游戏控制脚本。定义了几个dropBox，bullet，createBoxInterval等变量，能够在IDE显示及设置该变量
     * 更多类型定义，请参考官方文档
     */
    class PhysicsGameMain extends Laya.Script {
        constructor() {
            super();
            /** @prop {name:createBoxInterval,tips:"间隔多少毫秒创建一个下跌的容器",type:int,default:1000}*/
            this.createBoxInterval = 1000;
            /**开始时间*/
            this._time = 0;
            /**是否已经开始游戏 */
            this._started = false;
            /**是否停止每帧更新 */
            this.updateStop = false;
        }
        onEnable() {
            this._time = Date.now();
            this._gameBox = this.owner.getChildByName("gameBox");
            //帧听舞台事件，当失去焦点后，停止每帧更新
            Laya.stage.on(Laya.Event.BLUR, this, () => { this.updateStop = true; });
            //当恢复鼠标焦点后，恢复每帧更新
            Laya.stage.on(Laya.Event.FOCUS, this, () => { this.updateStop = false; });
        }
        //涉及到与屏幕适配相关逻辑，必须要放到onStart里，否则就可能因适配值没计算完，导致一系列的问题
        onStart() {
            //先找到地板这个节点，然后再找到该节点挂的碰撞体,赋值给_ground，用于修改碰撞体的属性
            let _ground = this.owner.getChildByName("ground").getComponent(Laya.BoxCollider);
            //由于是全屏适配，将碰撞体的宽度设置为屏幕的宽
            _ground.width = Laya.stage.width;
        }
        onUpdate() {
            //避免由于切到后台后还在更新，而导致切出后台后，同时出现大量盒子
            if (this.updateStop)
                return;
            //每间隔一段时间创建一个盒子
            let now = Date.now();
            if (now - this._time > this.createBoxInterval && this._started) {
                this._time = now;
                this.createBox();
            }
        }
        createBox() {
            //使用对象池创建盒子
            let box = Laya.Pool.getItemByCreateFun("dropBox", this.dropBox.create, this.dropBox);
            box.pos(Math.random() * (Laya.stage.width - 100), -100);
            this._gameBox.addChild(box);
        }
        onStageClick(e) {
            //停止事件冒泡，提高性能，当然也可以不要
            e.stopPropagation();
            //舞台被点击后，使用对象池创建子弹
            let flyer = Laya.Pool.getItemByCreateFun("bullet", this.bullet.create, this.bullet);
            flyer.pos(Laya.stage.mouseX, Laya.stage.mouseY);
            this._gameBox.addChild(flyer);
        }
        /**开始游戏，通过激活本脚本方式开始游戏*/
        startGame() {
            if (!this._started) {
                this._started = true;
                this.enabled = true;
            }
        }
        /**结束游戏，通过非激活本脚本停止游戏 */
        stopGame() {
            this._started = false;
            this.enabled = false;
            this.createBoxInterval = 1000;
            this._gameBox.removeChildren();
        }
    }

    /**
     * 本示例采用非脚本的方式实现，而使用继承页面基类，实现页面逻辑。在IDE里面设置场景的Runtime属性即可和场景进行关联
     * 相比脚本方式，继承式页面类，可以直接使用页面定义的属性（通过IDE内var属性定义），比如this.tipLbll，this.scoreLbl，具有代码提示效果
     * 建议：如果是页面级的逻辑，需要频繁访问页面内多个元素，使用继承式写法，如果是独立小模块，功能单一，建议用脚本方式实现，比如子弹脚本。
     */
    class PhysicsGameMainRT extends PhysicsGameMainUI {
        constructor() {
            super();
            PhysicsGameMainRT.instance = this;
            //关闭多点触控，否则就无敌了
            Laya.MouseManager.multiTouchEnabled = false;
        }
        onEnable() {
            this._control = this.getComponent(PhysicsGameMain);
            //点击提示文字，开始游戏
            this.tipLbll.on(Laya.Event.CLICK, this, this.onTipClick);
        }
        onTipClick(e) {
            this.tipLbll.visible = false;
            this._score = 0;
            this.scoreLbl.text = "";
            this._control.startGame();
        }

        /**增加分数 */
        addScore(value = 1) {
            this._score += value;
            this.scoreLbl.changeText("分数：" + this._score);
            //随着分数越高，难度增大
            if (this._control.createBoxInterval > 600 && this._score % 20 == 0)
                this._control.createBoxInterval -= 20;
        }

        /**停止游戏 */
        stopGame() {
            this.tipLbll.visible = true;
            this.tipLbll.text = "游戏结束了，点击屏幕重新开始";
            this._control.stopGame();
        }
    }

    /**
     * 图集动画，其实就是基于图集资源的逐帧动画。
     */
    class AtlasAniRT extends AtlasAniUI {
        constructor() {
            super(...arguments);
            /** 是否播放的开关，true为播放 */
            this.isPlay = false;
        }
        onAwake() {
            //创建动画模板
            this.createAniTemplate("moveB");
            this.createAniTemplate("moveC");
            this.createAniTemplate("moveE");
            this.createAniTemplate("moveF");
            this.createAniTemplate("moveH");
            this.createAniTemplate("moveI");
            this.createAniTemplate("moveK");
            this.createAniTemplate("moveL");
        }
        onEnable() {
                // this.aniSource.play(0,true,"moveB");
                //帧听按钮状态
                this.playAni.on(Laya.Event.MOUSE_DOWN, this, () => {
                    this.isPlay = true;
                    this.aniSource.play(0, true, this.selectAni.selectedLabel);
                });
                this.stopAni.on(Laya.Event.MOUSE_DOWN, this, () => {
                    this.isPlay = false;
                    this.aniSource.isPlaying && this.aniSource.stop();
                });
                //切换动画模板
                this.selectAni.selectHandler = new Laya.Handler(this, () => {
                    this.isPlay ? this.aniSource.play(0, true, this.selectAni.selectedLabel) : this.aniSource.play(0, false, this.selectAni.selectedLabel);
                });
            }
            /** 创建动画模板
             * @param name 动画的资源模板名称
             * @param len 动画关键帧的长度，有多少资源，就创建多少个动画关键帧
             */
        createAniTemplate(name, len = 8) {
            /**动画关键帧数组 */
            let aniFrames = [];
            for (let i = 0; i < len; i++) {
                //拼接动画关键帧的资源数组
                aniFrames.push("role/atlasAni/139x/" + name + i + ".png");
            }
            //创建动画模板，会占用内存，但频繁使用的时候可节省CPU性能消耗。
            Laya.Animation.createFrames(aniFrames, name);
        }
    }

    /** 逐帧动画
     * @readme 逐帧动画与图集动画的播放本质上没有什么区别，主要区别在于资源是图集还是散图。
     * 逐帧动画是指一帧一帧的连续播放，这种动画，也可以在时间轴上实现。
     */
    class FrameAniRT extends FrameAniUI {
        constructor() {
            super(...arguments);
            /** 是否播放的开关，true为播放 */
            this.isPlay = false;
        }
        onEnable() {
            //初始播放的动画
            this.isPlay = true;
            this.playAnimation(this.selectAni.selectedLabel);
            //帧听按钮状态
            this.playAni.on(Laya.Event.MOUSE_DOWN, this, () => {
                this.isPlay = true;
                this.playAnimation(this.selectAni.selectedLabel);
            });
            this.stopAni.on(Laya.Event.MOUSE_DOWN, this, () => {
                this.isPlay = false;
                this.aniSource.isPlaying && this.aniSource.stop();
            });
            //切换动画
            this.selectAni.selectHandler = new Laya.Handler(this, () => {
                this.isPlay ? this.playAnimation(this.selectAni.selectedLabel) : this.playAnimation(this.selectAni.selectedLabel, false);
            });
        }

        /** 直接播放动画
         * @param name 动画的资源模板名称
         * @param loop 是否循环播放
         * @param len 动画关键帧的长度，有多少资源，就创建多少个动画关键帧
         */
        playAnimation(name, loop = true, len = 7) {
            /**动画关键帧数组 */
            let aniFrames = [];
            for (let i = 0; i < len; i++) {
                //拼接动画关键帧的资源数组
                aniFrames.push("role/frameAni/" + name + i + ".png");
            }
            //设置动画的数据源,并播放。
            this.aniSource.loadImages(aniFrames).play(0, loop);
            // 如果需要频繁播放调用的，建议采用动画模板的方式，节省性能开销，参照图集动画示例中的API即可
        }
    }

    var Templet = Laya.Templet;
    var Event = Laya.Event;
    var SpineTemplet = Laya.SpineTemplet;
    /**
     * 骨骼动画示例:
     * @readme1 骨骼动画有两种，一种是将spine或龙骨动画通过LayaAirIDE转换为引擎内置的骨骼动画（无论是spine还是龙骨，转换成引擎内置的动画文件后，都是sk后缀，）
     * 转换后的骨骼动画性能高，但有版本限制，且仅支持基础的功能。
     * @readme2 spine转换文档：https://ldc2.layabox.com/doc/?nav=zh-ts-1-5-4
     * @readme3 龙骨转换文档：https://ldc2.layabox.com/doc/?nav=zh-ts-1-5-5
     * @readme4 另一种是直接使用第三方的动画文件和动画运行库。这种方式，只支持spine动画文件。
     * @readme5 用样的spine动画，直接使用spine文件（skel后缀），要比转换成引擎内置的骨骼动画，性能相对LayaAir引擎内置版本要差不少，但支持相对完整的功能，以及3.7、3.8、4.0多个版本。
     * 具体可查看相关文档：https://ldc2.layabox.com/doc/?nav=zh-ts-1-5-6
     */
    class SkeletonAni extends Laya.Script {
        constructor() {
            super(...arguments);
            /** 动画皮肤名称 */
            this.skinArray = ["goblin", "goblingirl"];
            /** 动画皮肤索引 */
            this.skinIndex = 0;
            /** spine 动画索引 */
            this.spineAniIndex = 6;
        }
        onEnable() {
            this.createLayaSpine();
            this.createSpine();
        }
        /**创建layaAir引擎内置的spine动画 */
        createLayaSpine() {
            this.skeletonTemplet = new Templet();
            this.skeletonTemplet.on(Event.COMPLETE, this, this.parseComplete);
            //加载转换后的骨骼动画
            this.skeletonTemplet.loadAni("role/spineAni/goblins.sk");
            //找到IDE里的节点
            this.skeletonNode = this.owner.getChildByName("skeletonNode");
        }
        /**创建spine动画 */
        createSpine() {
            //根据不同的spine版本，创建不同的spine动画模板，提醒：别忘了IDE里勾选对应spine版本的引擎库
            this.spineTemplet = new SpineTemplet(Laya.SpineVersion.v3_8);
            this.spineTemplet.on(Event.COMPLETE, this, this.spineParseComplete);
            this.spineTemplet.loadAni("role/spineAni/spineboy-pma.skel");
            //找到IDE里的节点
            this.spineNode = this.owner.getChildByName("spineNode");
        }
        /** spine动画解析完成回调 */
        spineParseComplete() {
            //创建spine动画
            this.spineAni = this.spineTemplet.buildArmature();
            this.spineNode.addChild(this.spineAni);
            this.spineAni.scale(0.3, 0.3);
            this.spineAni.pos(220, 390);
            //获得spine动画的数量
            this.spineAniNum = this.spineAni.getAnimNum();
            //按索引播放动画
            this.spineAni.play(this.spineAniIndex, true);
            //侦听点击，换动画
            this.spineNode.on(Event.CLICK, this, this.changeAni);
        }
        /** 更换动画 */
        changeAni() {
            //挑几个好看的spine动画，所以把前几个跳过去了，开发者可按实际需求设置动画索引值
            ++this.spineAniIndex >= this.spineAniNum && (this.spineAniIndex = 5);
            //按索引播放动画
            this.spineAni.play(this.spineAniIndex, true, true);
        }
        /** 动画解析完成回调 */
        parseComplete() {
            //创建动画，缓冲区模式为1，可以启用换装
            this.skeletonAni = this.skeletonTemplet.buildArmature(1);
            this.skeletonNode.addChild(this.skeletonAni);
            this.skeletonAni.x = 128;
            this.skeletonAni.y = 390;
            //按索引播放动画
            this.skeletonAni.play(0, true);
            //设置皮肤
            this.changeSkin();
            //点击换肤
            this.skeletonNode.on(Event.CLICK, this, this.changeSkin);
        }
        /** 改变骨骼动画皮肤 */
        changeSkin() {
            //按名称来播放spine动画,如果想按索引可用showSkinByIndex(index)
            this.skeletonAni.showSkinByName(this.skinArray[this.skinIndex]);
            //注意，这里的index索引是指动画皮肤的索引，并非是示例这里用于定义名称的数组索引skinIndex
            // this.skeletonAni.showSkinByIndex(index);
            //改变索引值，超出皮肤的索引长度后重置
            ++this.skinIndex >= this.skinArray.length && (this.skinIndex = 0);
        }
    }

    var Keyboard$1 = Laya.Keyboard;
    var KeyBoardManager$1 = Laya.KeyBoardManager;
    class Role extends Laya.Script {
        constructor() { super(); }
        onEnable() {
            this._owner = this.owner;
            this.roleStand = this._owner.getChildByName("roleStand");
            this.roleRun = this._owner.getChildByName("roleRun");
            this.bg = this.owner.parent;
        }
        /** 播放动画
         * @param name 动画名称
         * @param type 动画类型，跑:run，停:stand
         */
        playRoleAni(name, type = "stand") {
            if (type == "run") {
                //停掉站立动画
                this.roleStand.visible = false;
                this.roleStand.isPlaying && this.roleStand.stop();
                this.roleRun.visible = true;
                //播放跑动动画
                this.roleRun.play(0, true, name);
            }
            else {
                this.roleRun.visible = false;
                this.roleRun.isPlaying && this.roleRun.stop();
                this.roleStand.play(0, true, name);
                this.roleStand.visible = true;
            }
        }
        onUpdate() {
            this.lastRoleDirection = this.roleDirection;
            //侦听键盘事件，让用户来控制主角移动
            if (KeyBoardManager$1.hasKeyDown(Keyboard$1.UP) || KeyBoardManager$1.hasKeyDown(Keyboard$1.W)) {
                this.roleDirection = "Up";
                this._owner.y -= 2;
                this._owner.y < 80 && (this._owner.y = 80);
            }
            else if (KeyBoardManager$1.hasKeyDown(Keyboard$1.DOWN) || KeyBoardManager$1.hasKeyDown(Keyboard$1.S)) {
                this.roleDirection = "Down";
                this._owner.y += 2;
                this._owner.y > (this.bg.height - 130) && (this._owner.y = this.bg.height - 130);
            }
            else if (KeyBoardManager$1.hasKeyDown(Keyboard$1.LEFT) || KeyBoardManager$1.hasKeyDown(Keyboard$1.A)) {
                this.roleDirection = "Left";
                this._owner.x -= 2;
                this._owner.x < 30 && (this._owner.x = 30);
            }
            else if (KeyBoardManager$1.hasKeyDown(Keyboard$1.RIGHT) || KeyBoardManager$1.hasKeyDown(Keyboard$1.D)) {
                this.roleDirection = "Right";
                this._owner.x += 2;
                this._owner.x > (this.bg.width - 130) && (this._owner.x = (this.bg.width - 130));
            }
            //方向改变之后，才调整播放的动画
            this.lastRoleDirection !== this.roleDirection && this.playRoleAni(this.roleDirection, "run");
        }
        //键盘控键抬起时
        onKeyUp(e) {
            this.playRoleAni(this.roleDirection);
            //清空方向，用于下次按键的同方向播放判断；
            this.roleDirection = "";
        }
        onDisable() {
        }
    }

    /**
     * 工具条收缩效果脚本
     */
    class Folded extends Laya.Script {
        constructor() {
            super();
            /** 工具条是否打开 */
            this.isOpen = true;
        }
        onEnable() {
            //获得工具条背景对象
            this.toolbarBG = this.owner.parent;
            //获得折叠按钮对象
            this._owner = this.owner;
            //获得菜单组对象
            this.menu = this.owner.parent.getChildByName("menu");
        }
        onMouseDown(e) {
            //停止事件冒泡
            e.stopPropagation();
            if (this.isOpen) {
                //背景缓动收起
                Laya.Tween.to(this.toolbarBG, { width: 106 }, 1000, Laya.Ease.strongOut);
                //向左，移动+旋转
                Laya.Tween.to(this._owner, { x: 52, rotation: 540 }, 1000, Laya.Ease.strongOut, Laya.Handler.create(this, () => {
                    //修改打开状态
                    this.isOpen = false;
                }));
                //菜单消失
                Laya.Tween.to(this.menu, { alpha: 0 }, 300, Laya.Ease.strongOut, Laya.Handler.create(this, () => {
                    //修改帮助菜单显示状态
                    this.menu.visible = false;
                }));
            }
            else {
                //背景缓动打开
                Laya.Tween.to(this.toolbarBG, { width: 460 }, 1000, Laya.Ease.strongOut);
                //向右，移动+旋转
                Laya.Tween.to(this._owner, { x: 402, rotation: -360 }, 1000, Laya.Ease.strongOut, Laya.Handler.create(this, () => {
                    //修改打开状态
                    this.isOpen = true;
                }));
                //菜单显示
                Laya.Tween.to(this.menu, { alpha: 1 }, 200, Laya.Ease.strongOut, Laya.Handler.create(this, () => {
                    //修改帮助菜单显示状态
                    this.menu.visible = true;
                }));
            }
        }
        onDisable() {
        }
    }

    class DialogRT extends DialogUI {
        constructor() { super(); }
        onAwake() {
            this.dialogTitle.text = "";
            this.dialogText.text = "";
            this.closeBtn.on(Laya.Event.CLICK, this, () => {
                this.close();
            });
        }
        onOpened(param = null) {
            if (param) {
                this.dialogTitle.text = param.title;
                this.dialogText.text = param.text;
            }
        }
        onDisable() {}
    }

    var Event$1 = Laya.Event;
    var Point = Laya.Point;
    /**
     * 2D摇杆脚本，
     * 控制角色行走与站立、控制地图偏移中心点
     */
    class Joystick extends Laya.Script {
        constructor() {
            super();
            /** @prop {name:runAniName, tips:"各个方向对应的角色跑动动画名称，共16个方向，以英文逗号间隔。方向顺序从右开始，顺时针从0至15", type:String, default:"Right,Rdown1,Rdown2,Rdown3,Down,Ldown3,Ldown2,Ldown1,Left,Lup1,Lup2,Lup3,Up,Rup3,Rup2,Rup1"}*/
            this.runAniName = "Right,Rdown1,Rdown2,Rdown3,Down,Ldown3,Ldown2,Ldown1,Left,Lup1,Lup2,Lup3,Up,Rup3,Rup2,Rup1";
            /** @prop {name:standAniName, tips:"各个方向对应的角色站立动画名称，共8个方向，以英文逗号间隔。方向顺序从右开始，顺时针从0至7", type:String, default:"Right,Rdown,Down,Ldown,Left,Lup,Up,Rup"}*/
            this.standAniName = "Right,Rdown,Down,Ldown,Left,Lup,Up,Rup";
            /** 记录stage上的鼠标点，当频繁使用stage坐标转化时，可以减少实例开销 */
            this.stageMouse = new Point();
            /** 中心点坐标偏移值 */
            this.axisPivot = new Point();
            /** 摇杆角度 */
            this.angle = 0;
            /** 摇杆弧度 */
            this.radian = 0;
            /** 是否允许跑动 */
            this.isMoving = false;
        }
        onEnable() {
            //查找节点对象
            this.joystickBG = this.owner;
            this.joystickAxis = this.owner.getChildByName("joystickAxis");
            //得到摇杆轴最大移动的距离，可用于限制轴心的移动范围，如果不想超出背景大圈，再除2即可。
            this.maxDistance = this.joystickBG.width - this.joystickAxis.width;
            //记录中心点偏移值，需要提前在IDE里将摇杆轴joystickAxis的坐标摆放到中心点坐标上
            this.axisPivot.x = this.joystickAxis.x;
            this.axisPivot.y = this.joystickAxis.y;
            //对整个panel视窗进行鼠标事件侦听
            this.sceneWindow.on(Event$1.MOUSE_DOWN, this, this.mouseDown);
            this.sceneWindow.on(Event$1.MOUSE_MOVE, this, this.mouseMove);
            this.sceneWindow.on(Event$1.MOUSE_UP, this, this.mouseUp);
            this.sceneWindow.on(Event$1.MOUSE_OUT, this, this.mouseUp);
            //添加角色到视窗中心
            this.roleAniNode = this.roleAni.create();
            this.sceneWindow.addChild(this.roleAniNode);
            this.roleAniNode.pivot(this.roleAniNode.width / 2, this.roleAniNode.height / 2);
            this.roleAniNode.x = this.sceneWindow.width / 2;
            this.roleAniNode.y = this.sceneWindow.height / 2;
            //找到动画
            this.roleStand = this.roleAniNode.getChildByName("roleStand");
            this.roleRun = this.roleAniNode.getChildByName("roleRun");
        }
        /** 侦听panel 鼠标\手势按下时 */
        mouseDown(e) {
            //记录按下的touchId，用于判断是否是按下的事件
            this.touchId = e.touchId;
            this.isMoving = true;
            this.updateJoystickPoint();
        }
        /** 更新摇杆按下的位置 */
        updateJoystickPoint() {
            //先把stage坐标转换为摇杆节点的本地坐标,这里是轴心的父节点坐标摇杆背景
            this.stageMouse.x = Laya.stage.mouseX;
            this.stageMouse.y = Laya.stage.mouseY;
            let joystickBGMouse = this.joystickBG.globalToLocal(this.stageMouse), 
            /** 根据摇杆轴心偏移调整后的鼠标坐标点 */
            mouseX = joystickBGMouse.x - this.joystickAxis.width / 2, mouseY = joystickBGMouse.y - this.joystickAxis.height / 2;
            //计算弧度、角度
            this.radian = Math.atan2(mouseY - this.axisPivot.y, mouseX - this.axisPivot.x);
            this.lastAngle = this.angle;
            this.angle = Math.round(this.radian * 180 / Math.PI * 10) / 10;
            this.angle < 0 && (this.angle += 360);
            /**计算摇杆轴的移动距离，摇杆节点（joystickBG）的中心位置到摇杆节点坐标系的摇杆轴鼠标点位置*/
            let distance = this.getDistance(this.joystickBG.width / 2, this.joystickBG.height / 2, joystickBGMouse.x, joystickBGMouse.y);
            // console.log({ distance }, this.maxDistance);
            //在摇杆背景区域外，并且角度发生变化才更新摇杆轴位置
            if (distance > this.maxDistance && this.lastAngle !== this.angle) {
                this.joystickAxis.x = Math.floor(Math.cos(this.radian) * this.maxDistance) + this.axisPivot.x;
                this.joystickAxis.y = Math.floor(Math.sin(this.radian) * this.maxDistance) + this.axisPivot.y;
            }
            else {
                //在限制内，直接设置坐标, 用joystickBG坐标系下的鼠标坐标，减去joystickAxis自身的中心点偏移值，得到joystickAxis最终的坐标值
                this.joystickAxis.pos(joystickBGMouse.x - this.joystickAxis.width / 2, joystickBGMouse.y - this.joystickAxis.height / 2);
            }
            this.switchAni("run");
        }
        /** 切换动画
         * @param aniType 动作类型
         */
        switchAni(aniType) {
            if (aniType == "run") {
                //停止站立动画播放
                if (this.roleStand.isPlaying) {
                    this.roleStand.stop();
                    //让动画节点消失
                    this.roleStand.visible = false;
                    //让跑动节点显示
                    this.roleRun.visible = true;
                }
                let _runAniName = this.getOrientation(this.angle, this.runAniName);
                if (_runAniName !== this.lastRunAniName) {
                    this.lastRunAniName = _runAniName;
                    this.roleRun.play(0, true, _runAniName);
                }
            }
            else {
                //跑动 动画停止
                if (this.roleRun.isPlaying) {
                    this.roleRun.stop();
                    this.roleRun.visible = false;
                    this.roleStand.visible = true;
                }
                this.lastAngle !== this.angle && this.roleStand.play(0, true, this.getOrientation(this.angle, this.standAniName));
            }
        }
        /** 鼠标抬起时 */
        mouseUp(e) {
            //不是按下的，不作处理
            if (e.touchId != this.touchId)
                return;
            this.touchId = null;
            this.isMoving = false;
            //摇杆轴回归原位（摇杆背景中心）
            this.joystickAxis.pos(this.axisPivot.x, this.axisPivot.y);
            //设置站立朝向
            this.switchAni("stand");
        }
        /** 鼠标移动的时候 */
        mouseMove(e) {
            //只处理按下并移动的逻辑
            if (e.touchId != this.touchId)
                return;
            this.updateJoystickPoint();
        }
        /** 根据角度得到朝向动画名
         * @param angle 角度
         * @param aniName 动画名称字符串
         * @return 动画名
        */
        getOrientation(angle, aniName) {
            let aniArr = aniName.split(",");
            const angleConditions = 360 / aniArr.length;
            return aniArr[Math.floor(angle / angleConditions)];
        }
        onUpdate() {
            if (!this.isMoving)
                return;
            //更新角色的移动
            this.updateRoleMove();
        }
        /** 更新角色移动相关 */
        updateRoleMove() {
            //根据摇杆角度改变角色移动朝向
            this.switchAni("run");
            //移动的坐标向量为：摇杆弧度下的坐标向量比率（斜边比）乘以移动速度
            let dx = Math.cos(this.radian) * 2;
            let dy = Math.sin(this.radian) * 2;
            //通过反向移动地图，形成角色位移的视觉效果
            ((dx < 0 && this.gameMap.x < 0) || (dx > 0 && this.gameMap.x > this.sceneWindow.width - this.gameMap.width)) && (this.gameMap.x -= dx);
            ((dy < 0 && this.gameMap.y < 0) || (dy > 0 && this.gameMap.y > this.sceneWindow.height - this.gameMap.height)) && (this.gameMap.y -= dy);
        }
        /**
        * 获得两个坐标点的直线距离，
        * 依据勾股定理，用目标坐标的分量与原始坐标的分量计算斜边(目标点到鼠标点的直线距离)，用于判断是否超出限制范围
        * @param centerX 原始的中心点坐标X轴位置
        * @param centerY 原始的中心点坐标Y轴位置
        * @param mouseX 鼠标点X轴位置
        * @param mouseY 鼠标点Y轴位置
        */
        getDistance(centerX, centerY, mouseX, mouseY) {
            let dx = centerX - mouseX, dy = centerY - mouseY;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }

    var Rectangle = Laya.Rectangle;
    /**
     * 形状的碰撞检测
     * @readme1 本示例基于教学出发，提供了多种检测方式。
     * 但，基于性能考虑，真实项目中，尽可能采用矩形检测，如果是圆形或有旋转，尽可能采用正圆的圆心检测。
     * 一定要精准检测的时候，尽可能先粗略检测发生碰撞后再精细检测。
     * @readme2 碰撞需要检测全部，当碰撞物体较多时，需要用四叉树降低检测范围。
     */
    class ShapeDetection extends Laya.Script {
        constructor() {
            super(...arguments);
            /** 创建一个碰撞节点的矩形区对象，用于检测复用，可节省频繁检测的实例开销 */
            this._rect1 = Rectangle.TEMP;
            /** 创建一个碰撞目标节点的矩形区对象，用于检测复用，可节省频繁检测的实例开销 */
            this._rect2 = Rectangle.TEMP;
        }
        /** 矩形检测
         * @param self 本对象
         * @param target 目标对象
         * @returns boolean：true碰到，flase未碰到
        */
        rectDetection(self, target) {
            //依据矩形顶点判断检测
            return !( //以下有一个条件成立就是未碰到，全都不成立就是碰上了
            self.x > target.x + target.width ||
                self.x + self.width < target.x ||
                self.y > target.y + target.height ||
                self.y + self.height < target.y);
        }
        /** 碰撞检测
         * @param self 控制的碰撞发起对象
         * @param targets 被碰撞的目标对象
         * @param type 碰撞检测类型0：圆形检测，1：矩形检测，2：多边形检测
         * @returns collisionNodes：被撞的节点对象
        */
        collisionWith(self, targets, type) {
            /** 被撞的节点对象 */
            let collisionNodes = [];
            if (type == 0) {
                /** 圆心点坐标 */
                var p1 = Laya.Point.create(), p1PivotX = self.width / 2, p1PivotY = self.height / 2, p2 = Laya.Point.create(), p1Radius, p2Radius;
                //圆心
                p1.x = self.x + p1PivotX;
                p1.y = self.y + p1PivotY;
                //半径
                p1Radius = this.rectToRadius(self.width, self.height);
            }
            else if (type == 2) {
                /** 被撞方的多边形各个顶点坐标 */
                var targetVertices, 
                /** 碰撞方的多边形各个顶点坐标 */
                selfVertices;
                selfVertices = this.arrayToPoint(self);
            }
            for (let i = 0; i < targets.length; i++) {
                if (self.name == targets[i].name)
                    continue;
                switch (type) {
                    case 0:
                        p2.x = targets[i].x + (targets[i].width / 2);
                        p2.y = targets[i].y + (targets[i].height / 2);
                        p2Radius = this.rectToRadius(targets[i].width, targets[i].height);
                        this.circleDetection(p1, p2, p1Radius + p2Radius) && collisionNodes.push(targets[i]);
                        // this.circlesCollision(p1, p2, p1Radius, p2Radius) && collisionNodes.push(targets[i]);
                        break;
                    case 1:
                        this.rectDetection(self, targets[i]) && collisionNodes.push(targets[i]);
                        break;
                    case 2:
                        //圆和多边形碰撞检测
                        if (self.name === "c1") { //碰撞方是圆形
                            targetVertices = this.arrayToPoint(targets[i]);
                            this.circleAndPolygonDetection(self, targetVertices, targets[i]) && collisionNodes.push(targets[i]);
                        }
                        else if (targets[i].name === "c1") { //被撞方是圆形
                            this.circleAndPolygonDetection(targets[i], selfVertices, self) && collisionNodes.push(targets[i]);
                        }
                        else { //多边形与多边形碰撞检测
                            targetVertices = this.arrayToPoint(targets[i]);
                            this.polygonDetection(selfVertices, targetVertices, self, targets[i]) && collisionNodes.push(targets[i]);
                        }
                        break;
                }
            }
            return collisionNodes;
        }
        /**
         * 圆和多边形的碰撞检测
         * @param circel 圆形碰撞方的节点对象
         * @param polygonVertices 多边形碰撞方的全部顶点坐标
         * @param polygonNode 多边形节点对象
         * @returns
         */
        circleAndPolygonDetection(circel, polygonVertices, polygonNode) {
            /** 多边形的边坐标数组 */
            let sides = this.getSides(polygonVertices), 
            /** 投影轴 */
            axises = [], 
            /** 碰撞方的圆心坐标 */
            circelCenter = Laya.Point.create(), 
            /**最近坐标点 */
            nearestPoint = Laya.Point.create(), 
            /** 圆的半径 */
            radius = circel.hitArea._hit._one.radius, 
            /** 多边形顶点坐标 */
            targetList = this.getNodeCoord(polygonVertices, polygonNode);
            //设置圆心坐标
            circelCenter.x = circel.x + circel.hitArea._hit._one.x;
            circelCenter.y = circel.y + circel.hitArea._hit._one.y;
            //计算离圆最近的多边形顶点坐标
            nearestPoint = this.getNearestPoint(circelCenter, targetList);
            axises.push(new Laya.Point(nearestPoint.x - circelCenter.x, nearestPoint.y - circelCenter.y));
            //多边形各边的法线(投影轴)
            for (let i = 0, len = sides.length; i < len; i++)
                axises.push(this.perpendicular(sides[i]));
            for (let i = 0, len = axises.length; i < len; i++) {
                let axis = axises[i], s = this.getCircleProjection(circelCenter, axis, radius), t = this.getPolygonProjection(targetList, axis);
                //如果不发生投影重叠，直接退出检测，否则就要检测每一条边
                if (!this.isOverlap(s, t))
                    return false;
            }
            return true;
        }
        /**
         * 获得离圆最近的多边形顶点坐标
         * @param circelCenter 圆心坐标
         * @param list 多边形所有顶点的节点位置坐标
         * @returns nearestPoint 最近的点
         */
        getNearestPoint(circelCenter, list) {
            /**最近坐标点 */
            let nearestPoint = list[0], //先从多边形第一个顶点开始算
            /** 最短的直线距离 */
            minDistance = this.getDistance(circelCenter, nearestPoint), 
            /** 用于遍历计算的当前坐标点 */
            nowPoint, 
            /** 用于遍历计算的的当前直线距离 */
            nowDistance;
            //遍历所有顶点（除去已算的），算出两点间最短的直线距离
            for (let i = 1; i < list.length; i++) {
                nowPoint = list[i];
                nowDistance = this.getDistance(circelCenter, nowPoint);
                //记录更小的坐标点与直线距离
                if (nowDistance < minDistance) {
                    minDistance = nowDistance;
                    nearestPoint = nowPoint;
                }
            }
            return nearestPoint;
        }
        /** 多边形碰撞检测
         * @param selfVertices 碰撞方的顶点坐标
         * @param targetVertices 被撞方的顶点坐标
         */
        polygonDetection(selfVertices, targetVertices, selfNode, targetNode) {
            /** 两个多边形边 拼成的全部边数组 */
            let sides = this.getSides(selfVertices).concat(this.getSides(targetVertices)), 
            /** 投影轴 */
            axises = [], 
            /** 多边形顶点坐标 */
            selfList = this.getNodeCoord(selfVertices, selfNode), targetList = this.getNodeCoord(targetVertices, targetNode);
            //获得各边的法线(投影轴)
            for (let i = 0, len = sides.length; i < len; i++)
                axises.push(this.perpendicular(sides[i]));
            for (let i = 0, len = axises.length; i < len; i++) {
                let axis = axises[i], s = this.getPolygonProjection(selfList, axis), t = this.getPolygonProjection(targetList, axis);
                //如果不发生投影重叠，直接退出检测，否则就要检测每一条边
                if (!this.isOverlap(s, t))
                    return false;
            }
            return true;
        }
        /** 判断投影集合是否存在交集，也就是发生投影重叠
         * @param self 碰撞方的投影集合
         * @param target 碰撞目标的投影集合
        */
        isOverlap(self, target) {
            let min, max;
            //双方的最小值
            min = (self.min < target.min) ? self.min : target.min;
            //双方的最大值
            max = (self.max > target.max) ? self.max : target.max;
            //交集的判断,条件为真则存在交集
            return (self.max - self.min) + (target.max - target.min) >= max - min;
        }
        /** 取得多边形各个顶点的节点位置坐标 */
        getNodeCoord(vertices, node) {
            let _arr = [];
            for (let i = 0; i < vertices.length; i++) {
                let _point = Laya.Point.create();
                _point.x = vertices[i].x + node.x + node.hitArea._hit._one.x;
                _point.y = vertices[i].y + node.y + node.hitArea._hit._one.y;
                _arr.push(_point);
            }
            return _arr;
        }
        /** 获得多边形的最大与最小投影点
         * @param list 多边形顶点坐标
         * @param axis 边的法线
        */
        getPolygonProjection(list, axis) {
            let min = null, max = null;
            for (let i = 0; i < list.length; i++) {
                /** 投影点的计算 */
                let projection = this.dotProduct(list[i], axis) / this.getLength(axis);
                //投影点小于最小值时，存为新的投影最小值
                (min === null || projection < min) && (min = projection);
                //投影点大于最大值时，存为新的投影最大值
                (max === null || projection > max) && (max = projection);
            }
            //返回投影点最小与最大值
            return { min: min, max: max };
        }
        /** 获得圆形的最大与最小投影点
         * @param circelCenter 圆心坐标
         * @param axis 边的法线
         * @param circleRadius 圆的半径
        */
        getCircleProjection(circelCenter, axis, circleRadius) {
            /** 投影点的计算 */
            let projection = this.dotProduct(circelCenter, axis) / this.getLength(axis);
            //返回投影点最小与最大值
            return { min: projection - circleRadius, max: projection + circleRadius };
        }
        /** 已知矩形边，求相切的同心圆半径
         *  @param width 矩形宽
         *  @param height 矩形高
         *  @return 半径长度
         * */
        rectToRadius(width, height) {
            let radius;
            //圆在正方形之内的内切圆，直接取边长的一半作为半径
            if (width == height) {
                radius = width / 2;
            }
            else { //圆包裹着矩形,以矩形对角线交点为圆心时，取对角线长的一半作为半径
                radius = Math.sqrt(width * width + height * height) / 2;
            }
            return radius;
        }
        /** 圆形碰撞检测
         * @param p1 本对象圆心坐标
         * @param p2 目标对象圆心坐标
         * @param distance 碰撞距离（两个半径和）
         * @returns boolean true:发生碰撞，false:未碰撞
        */
        circleDetection(p1, p2, distance) {
            //判断两个圆心的直线距离是否小于或等于两个碰撞圆的半径和
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) <= distance;
        }
        /** 圆形碰撞检测（分离轴）
         * @param p1 碰撞方的圆心坐标
         * @param p2 被撞方的圆心坐标
         * @param p1Radius 碰撞方的半径
         * @param p2Radius 被撞方的半径
        */
        circlesCollision(p1, p2, p1Radius, p2Radius) {
            let axis = this.subtract(p1, p2), s = this.getCircleProjection(p1, axis, p1Radius), t = this.getCircleProjection(p2, axis, p2Radius);
            //重叠即碰撞，否则没碰上
            if (this.isOverlap(s, t))
                return true;
            return false;
        }
        /**
         * 把一维数组转换为二维坐标数组
         * @param sp 节点对象
         */
        arrayToPoint(sp) {
            let points = [], hitPoints = [];
            hitPoints = sp.hitArea._hit._one.points;
            if (hitPoints && hitPoints.length > 3) {
                for (let i = 0; i < hitPoints.length / 2; i++) {
                    points[i] = Laya.Point.create();
                    points[i].x = hitPoints[i * 2];
                    points[i].y = hitPoints[i * 2 + 1];
                }
            }
            return points;
        }
        /**
         * 边的法线
         */
        perpendicular(p) {
            let _temp = Laya.Point.create();
            //把y坐标点投到x轴上
            _temp.x = p.y;
            _temp.y = -p.x;
            return _temp;
        }
        /** 获得法向量
         * @param p 坐标点
        */
        getNormal(p) {
            //向量大小
            let sum = Math.sqrt(p.x * p.x + p.y * p.y);
            //法向量
            return new Laya.Point(p.y / sum, (0 - p.x) / sum);
        }
        /** 获得多边形的边（向量坐标）
         * @param vertices 顶点坐标数组
         * @returns Array<any> 边坐标数组
        */
        getSides(vertices) {
            var list = vertices, 
            /** 顶点数量 */
            length = list.length, 
            /** 边的数组 */
            sides = new Array();
            //顶点不小于3个即为多边形
            if (length >= 3) {
                for (var i = 1, lastPoint = list[0]; i < length; i++) {
                    let nowPoint = list[i];
                    //后一个顶点坐标减前一个顶点坐标，得到的值作为边向量坐标
                    sides.push(this.subtract(nowPoint, lastPoint));
                    //把当前坐标，转存为上一个坐标
                    lastPoint = nowPoint;
                }
                //最后一个边，用第0个数组的顶点减去最后一个，形成封闭的边
                sides.push(this.subtract(list[0], list[length - 1]));
            }
            return sides;
        }
        /**
         * 获得坐标的长度，把二维坐标点转换为一维长度
         * @param p 坐标点
         */
        getLength(p) {
            return Math.sqrt(p.x * p.x + p.y * p.y);
        }
        /**
         * 点乘运算，把向量降维成标量
         * @param p1 坐标点
         * @param p2 坐标点
         */
        dotProduct(p1, p2) {
            return p1.x * p2.x + p1.y * p2.y;
        }
        /** 坐标相减
         * @param p2 当前坐标
         * @param p1 上一个坐标
         */
        subtract(p2, p1) {
            let _point = Laya.Point.create();
            return _point.setTo(p2.x - p1.x, p2.y - p1.y);
        }
        /** 已知两个坐标点，求两者的距离长度
         * @param p1 坐标点
         * @param p2 坐标点
        */
        getDistance(p1, p2) {
            let dx = p1.x - p2.x, dy = p1.y - p2.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }

    class ShapeDetectionRT extends ShapeDetectionUI {
        constructor() {
            super();
            /** 检测类型 */
            this._detectionType = 0;
            /** 需要碰撞的节点 */
            this.collisionNodes = [this.c1, this.p1, this.p2];
            ShapeDetectionRT.i = this;
        }
        onEnable() {
            //获取场景上的组件
            this._script = this.getComponent(ShapeDetection);
            //关联切换选项
            this.detectionType.selectHandler = new Laya.Handler(this, this.onSelected);
            //设置默认的选项
            this.detectionType.selectedIndex = 0;
        }

        /** 当选中某个选项时 */
        onSelected(index) {
            this._detectionType = index;
            switch (index) {
                case 0:
                    this.setCircleLine([this.c11, this.p11, this.p22]);
                    break;
                case 1:
                    this.setRectLine([this.c11, this.p11, this.p22]);
                    break;
                case 2:
                    this.c11.graphics.clear();
                    this.p11.graphics.clear();
                    this.p22.graphics.clear();
                    break;
            }
        }

        /** 碰撞检测
         * @param self 发起碰撞的对象
         */
        collisionWith(self) {
            /** 被撞的对象 */
            let nodes;
            nodes = this._script.collisionWith(self, this.collisionNodes, this._detectionType);
            if (nodes.length > 0) {
                nodes.push(self);
                this.setLineWidth(nodes);
            } else {
                this.retsetLineWidth();
            }
        }

        /** 设置边框宽度
         * @param nodes 节点对象数组
         */
        setLineWidth(nodes) {
            for (let i = 0; i < nodes.length; i++) {
                nodes[i]._graphics._one.lineWidth = 3;
            }
        }

        /** 重置边框宽度 */
        retsetLineWidth() {
            for (let i = 0; i < this.collisionNodes.length; i++) {
                this.collisionNodes[i]._graphics._one.lineWidth = 0;
            }
        }

        /** 设置圆形边线
         * @param nodes 节点对象数组
         * @param lineWidth 线框宽度
         * @param lineColor 线的颜色
         */
        setCircleLine(nodes, lineWidth = 1, lineColor = "#1e00fb") {
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].graphics.clear();
                let x = nodes[i].width / 2,
                    y = nodes[i].height / 2,
                    radius = this._script.rectToRadius(nodes[i].width, nodes[i].height);
                nodes[i].graphics.drawCircle(x, y, radius, null, lineColor, lineWidth);
            }
        }

        /** 设置矩形边线
         * @param nodes 节点对象数组
         * @param lineWidth 线框宽度
         * @param lineColor 线的颜色
         */
        setRectLine(nodes, lineWidth = 1, lineColor = "#1e00fb") {
            for (let i = 0; i < nodes.length; i++) {
                nodes[i].graphics.clear();
                nodes[i].graphics.drawRect(nodes[i].x, nodes[i].y, nodes[i].width, nodes[i].height, null, lineColor, lineWidth);
            }
        }
    }

    class DragAndTips extends Laya.Script {
        constructor() {
            super(...arguments);
            /** @prop {name:tipsText,tips:"移入点击区的提示文本，为空则不显示",type:string} */
            this.tipsText = '';
            /** 是否已按下 */
            this.isDown = false;
        }
        onEnable() {
            this.tipsText.replace(/(^\s*)|(\s*$)/g, '');
        }
        onMouseDown() {
            this.owner.startDrag();
            this.isDown = true;
        }
        onMouseUp() {
            this.isDown = false;
        }
        onMouseMove() {
            this.isDown && ShapeDetectionRT.i.collisionWith(this.owner);
        }
        onMouseOver() {
            Laya.Mouse.cursor = "move";
            this.tipsText !== "" && Laya.Scene.open("uiDemo/Msg.scene", false, { "text": this.tipsText });
        }
        onMouseOut() {
            Laya.Mouse.cursor = "auto";
        }
    }

    /**
     * 背包列表示例
     * @readme 重点示范列表的单元格选项切换处理与对应值的提取
     */
    class BagListRT extends BagListUI {
        constructor() {
            super();
            this.lastIndex = -1;
        }
        onEnable() {
            Laya.loader.create("json/bagList.json", Laya.Handler.create(this, () => {
                //获取模拟list数据的json文件，文件要提前加载好
                let _json = Laya.loader.getRes("json/bagList.json");
                if (_json.bagList && _json.bagList.length > 0) {
                    //把json数据传递给list组件的数据源属性array,当数据源符合ui组件属性规则时，可直接作为默认初始值。不符合时，可通过renderHandler自定义修改。
                    this.bagList.array = _json.bagList;
                    //绑定list渲染单元处理方法，自定义list的渲染单元数据
                    this.bagList.renderHandler = new Laya.Handler(this, this.onListRender);
                    //绑定list选项改变的切换
                    this.bagList.selectHandler = new Laya.Handler(this, this.onListSelect);
                    //绑定单元格的鼠标事件
                    this.bagList.mouseHandler = new Laya.Handler(this, this.onListMouse);
                }
            }));
        }

        /** 列表单元的渲染处理 */
        onListRender(item, index) {
            //如果当前索引不在数据源可索引范围，则跳出
            if (index > this.bagList.array.length || index < 0)
                return;
            // (item.getChildByName("listItemBG") as Laya.Image).skin = "bg/bg100-0.png";
        }

        /**列表选择改变处理
         * @readme 这里是为了示范怎么在选项切换里处理数据的变化，故意采用了自定义的方式处理选中状态切换。
         * 如果只是为了列表单元的选中状态切换， 引擎里提供了更简单的设置方式：将选中态ui的name设置为selectBox。
         * 简单方式，可参照拉动刷新列表的示例。
         */
        onListSelect(index) {
            this.tips.visible = true;
            //获取当前选择的渲染单元对象
            this.bagList.array[index].listItemBG = { "skin": "bg/bg100-1.png" };
            // console.log(this.bagList.getItem(index), this.bagList.array);
            if (this.lastIndex !== -1) {
                //获取指定索引的对象（仅可获取可见对象）
                this.bagList.array[this.lastIndex].listItemBG = { "skin": "bg/bg100-0.png" };
            }
            //重置上次选择的索引
            this.lastIndex = index;
            //选中的数据显示
            this.itemImg.skin = this.bagList.array[index].listItemImg.skin;
            this.itemNumber.changeText("数量 " + this.bagList.array[index].listItemNumber.text);
            this.itemReadme.text = this.bagList.array[index].readme;
        }

        /**列表单元上的鼠标事件处理 */
        onListMouse(e, index) {
            //鼠标单击事件触发
            // if (e.type == Laya.Event.MOUSE_DOWN) {
            //     // console.log("事件目标", e.target);
            //     (e.target as Laya.Image).skin = "bg/bg100-1.png"; 
            // }
        }

        onDisable() {}
    }

    class ComboBoxRT extends ComboBoxUI {
        constructor() { super(); }
        onEnable() {
            //模拟list数据
            var _dataSourece = this.getDataSourece();
            // console.log(_dataSourece);
            Laya.loader.create("./prefab/comboList.prefab", Laya.Handler.create(this, () => {
                //拿到json数据并创建一个对象
                this.comboList = (Laya.loader.getRes("./prefab/comboList.prefab")).create();
                //修改数据源，这里用模拟数据替代
                this.comboList.array = _dataSourece;
                //列表数据长度
                this.comboList.repeatY = _dataSourece.length;
                //将自定义的List数据替换给下拉框自己创建的list
                this.combo2.list = this.comboList;
                this.combo2.list.width = this.combo2.width;
                this.combo2.selectHandler = new Laya.Handler(this, this.onSelected2);
            }));
            this.combo1.selectHandler = new Laya.Handler(this, this.onSelected1);
            // this.combo1.itemPadding = "20,5,5,25";
            // this.combo1.itemHeight = 70 ;
            // this.combo1.defaultLabel = "请选择下拉选项";
        }

        onSelected1(index) {
            this.selectedText.text = "您选中了：" + this.combo1.selectedLabel;
            // this.selectedText.text = "您选中了：" + this.combo1.list.array[index].label;
        }

        onSelected2(index) {
            this.selectedText.text = "您选中了：" + (index < 0 ? "" : this.comboList.array[index].label);
        }

        /**
         * 创建List用的模拟数据
         */
        getDataSourece() {
            for (var _data = [], i = 0; i < 10; i++) {
                _data[i] = { "optText": { "text": "选项" + (i + 1) } };
            }
            return _data;
        }
        onDisable() {}
    }

    class LoopListRT extends LoopListUI {
        onEnable() {
            //初始数据源
            this.hList.array = this.getListDataSource();
            //把数据索引为1的item设定为可视列表第一项，让右划更平滑
            this.hList.scrollTo(1);
            //取得居中的头像对象
            let icon = this.hList.cells[1].getChildByName("icon");
            //把居中的cell头像放大2倍
            icon.scaleX = icon.scaleY = 2;
            this.hList.disableStopScroll = true;
            //侦听滚动条，按滑动条值的条件处理循环逻辑
            this.hList.scrollBar.on(Laya.Event.CHANGE, this, this.onScrollBarChange);
            //设置头像改变的坐标限制
            this.leftLimit = this.getLeftLimit();
            this.rightLimit = this.getRightLimit();
        }

        onScrollBarChange() {
            var sliderValue = this.hList.scrollBar.value;
            var listArr = this.hList.array;
            //达到左划限制，删除第一个，加到右侧
            if (sliderValue > this.leftLimit) {
                var cell = listArr.shift();
                listArr[listArr.length] = cell;
                this.hList.array = listArr;
                //重设滚动条位置值，无缝衔接
                this.hList.scrollBar.value = sliderValue - this.hList.cells[0].width - this.hList.spaceX;
                this.iconTweenToLeft();
            } else if (sliderValue < this.rightLimit) { //达到右划限制，删除最后一个，加到开头    
                cell = listArr.pop();
                listArr.unshift(cell);
                this.hList.array = listArr;
                this.hList.scrollBar.value = sliderValue + this.hList.cells[0].width + this.hList.spaceX;
                this.iconTweenToRight();
            }
        }

        /**
         * 左划缓动处理头像
         * @param time 缓动效果时间
         */
        iconTweenToLeft(time = 200) {
            //取得原放大的头像对象
            let iconOld = this.hList.cells[1].getChildByName("icon");
            //新的cell容器把值设置为2
            iconOld.scaleX = iconOld.scaleY = 2;
            //然后缓动缩小还原
            Laya.Tween.to(iconOld, { scaleX: 1, scaleY: 1 }, time);
            //取得新头像对象
            let icon = this.hList.cells[2].getChildByName("icon");
            //由于cell是复用的，先将值还原，否则没有缩放效果。
            icon.scaleX = icon.scaleY = 1;
            //缓动放大居中区域的头像
            Laya.Tween.to(icon, { scaleX: 2, scaleY: 2 }, time);
        }

        /**
         * 右划缓动处理头像
         * @param time 缓动效果时间
         */
        iconTweenToRight(time = 200) {
            //取得原放大的头像对象
            let iconOld = this.hList.cells[2].getChildByName("icon");
            //新的cell容器把值设置为2
            iconOld.scaleX = iconOld.scaleY = 2;
            //然后缓动缩小还原
            Laya.Tween.to(iconOld, { scaleX: 1, scaleY: 1 }, time);
            //取得新头像对象
            let icon = this.hList.cells[1].getChildByName("icon");
            //由于cell是复用的，先将值还原，否则没有缩放效果。
            icon.scaleX = icon.scaleY = 1;
            //缓动放大居中区域的头像
            Laya.Tween.to(icon, { scaleX: 2, scaleY: 2 }, time);
        }

        /**取得右划限制 */
        getRightLimit() {
            return this.hList.cells[0].width - this.hList.spaceX;
        }

        /**取得左划限制 */
        getLeftLimit() {
            return (this.hList.cells[0].width * 2) + this.hList.spaceX;
        }

        /**
         * 模拟数据源
         * @param length 生成的数组长度
         */
        getListDataSource(length = 5) {
            let _arr = [];
            for (let i = 0; i < length; i++) {
                _arr[i] = {};
                _arr[i].icon = { "skin": `role/r${i}.png` };
            }
            return _arr;
        }
    }

    /**
     * Mail列表示例，
     * @readme 重点示范列表的单元格新增与删除，以及单元格的鼠标事件处理。
     * （tab标签只示例ui的button的组合，代码参照其它示例的实现。）
     */
    class MailListRT extends MailListUI {
        constructor() {
            super();
            /** 记录当前的选项 */
            this.optStatus = [];
        }
        onEnable() {
            const jsonPath = "./json/mailList.json";
            Laya.loader.create(jsonPath, Laya.Handler.create(this, () => {
                //获取模拟list数据的json文件
                let jsonData = (Laya.loader.getRes(jsonPath)).mailList;
                if (jsonData && jsonData.length > 0) {
                    //绑定列表数据源
                    this.mailList.array = jsonData;
                    this.mailList.mouseHandler = new Laya.Handler(this, this.onListMouse);
                }
                this.addMail.on(Laya.Event.CLICK, this, this.addMialItem);
                this.selectDel.on(Laya.Event.CLICK, this, this.listSelectDel);
                this.selectFlag.on(Laya.Event.CLICK, this, this.listSelectFlag);
            }));
        }

        /** 标记选中单元为已读 */
        listSelectFlag() {
            if (this.optStatus.length > 0) {
                for (let i = 0; i < this.optStatus.length; i++) {
                    let index = this.optStatus[i];
                    this.mailList.array[index].flag = 1;
                    this.mailList.array[index].flagStatus = { "skin": "comp/img_mail_open.png" };
                    this.mailList.array[index].flagBtn = { "label": "标为未读", "labelColors": "#3277f3,#3277f3,#3277f3" };
                }
                this.mailList.refresh();
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "已成功标记" });
            } else
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "没有勾选项，请先勾选" });
        }

        /** 删除选中的列表单元*/
        listSelectDel() {
            if (this.optStatus.length > 0) {
                //先把选项索引做个排序，从大到小，这样，删除的时候，就从后向前删除，避免因重新排序而把素引顺序打乱了。
                this.optStatus.sort(function(a, b) { return b - a; });
                for (let i = 0; i < this.optStatus.length; i++) {
                    //按索引，从后向前逐个删除
                    this.mailList.array.splice(this.optStatus[i], 1);
                }
                //清空选中的索引
                this.optStatus = [];
                this.mailList.refresh();
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "已成功删除" });
            } else
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "没有勾选项，请先勾选" });
        }

        /** 新增邮件列表单元 */
        addMialItem() {
            // console.log("===11111===", this.mailList.startIndex, JSON.parse(JSON.stringify(this.mailList.array)), this.optStatus);
            //list数据组的可见索引位置的后面
            var index = this.mailList.startIndex + 1;
            let itemData = {
                "mailTitle": {
                    "text": "这里是新增加的邮件" + index
                },
                "mailDateTime": {
                    "text": this.timestampFormat("YYYY-MM-DD hh:mm")
                },
                "opt": {
                    "visible": false
                },
                "flagStatus": {
                    "skin": "comp/img_mail.png"
                },
                "flagBtn": {
                    "label": "标为已读",
                    "labelColors": "#000000,#000000,#000000"
                }
            };
            //在指定的数据源索引位置增加一条模拟数据
            this.mailList.array.splice(index, 0, itemData);
            //如果选项数组里有值，还要处理选项的数组索引更新
            if (this.optStatus.length > 0) {
                //修正选项的数组索引
                for (let i = 0; i < this.optStatus.length; i++) {
                    //只有大于或等于列表数据源新增位置的索引才需要更新
                    if (this.optStatus[i] >= index) {
                        //从删除的索引位置开始，后续勾选元素都后移1位
                        this.optStatus[i] += 1;
                    }
                }
            }
            this.mailList.refresh();
        }

        /**
         * 将时间戳转换为格式化后的时间文本
         * @param timestamp 时间戳
         * @param fmt 格式，默认为："YYYY-MM-DD hh:mm:ss"
         * @returns 返回格式化后的时间字符串
         */
        timestampFormat(fmt = "YYYY-MM-DD hh:mm:ss", timestamp = 0) {
            Date.prototype["Format"] = function(fmt) {
                var o = {
                    "M+": this.getMonth() + 1,
                    "D+": this.getDate(),
                    "h+": this.getHours(),
                    "m+": this.getMinutes(),
                    "s+": this.getSeconds(),
                };
                //检查test(fmt)里，是否存在
                if (new RegExp("(Y+)").test(fmt))
                    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
                for (var k in o)
                    if (new RegExp("(" + k + ")").test(fmt))
                        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                return fmt;
            };
            if (timestamp == 0)
                return new Date()["Format"](fmt);
            else
                return new Date(timestamp)["Format"](fmt);
        }

        /**列表的鼠标事件处理，常用于处理单元格上的点击事件等 */
        onListMouse(e, index) {
            if (e.type == Laya.Event.CLICK) {
                //检查是否已经是选中状态，
                var optIndex = this.optStatus.indexOf(index);
                switch (e.target.name) {
                    case "optBG": //点击列表单元的选框
                        //如果不在选中数组中
                        if (optIndex === -1) {
                            //让对勾状态图可见
                            this.mailList.array[index].opt = { "visible": true };
                            //添加到选中数组里
                            this.optStatus.push(index);
                        } else {
                            //否则取消对勾的显示
                            this.mailList.array[index].opt = { "visible": false };
                            //删除数组里对应的元素
                            this.optStatus.splice(optIndex, 1);
                        }
                        //刷新列表的数据源，让刚才的array修改生效
                        this.mailList.refresh();
                        break;
                    case "mailTitle": //点击列表单元的标题 
                        Laya.Scene.open("uiDemo/Dialog.scene", false, { "title": this.mailList.array[index].mailTitle.text, "text": "邮件内容，此处省略1000字……………………" });
                        this.mailList.array[index].flag = 1;
                        this.mailList.array[index].flagStatus = { "skin": "comp/img_mail_open.png" };
                        this.mailList.array[index].flagBtn = { "label": "标为未读", "labelColors": "#3277f3,#3277f3,#3277f3" };
                        //刷新列表的数据源，让刚才的array修改生效
                        this.mailList.refresh();
                        break;
                    case "flagBtn": //点击列表单元的标记按钮 
                        if (this.mailList.array[index].flag === 1) {
                            this.mailList.array[index].flag = 0;
                            this.mailList.array[index].flagStatus = { "skin": "comp/img_mail.png" };
                            this.mailList.array[index].flagBtn = { "label": "标为已读", "labelColors": "#000000,#000000,#000000" };
                        } else {
                            this.mailList.array[index].flag = 1;
                            this.mailList.array[index].flagStatus = { "skin": "comp/img_mail_open.png" };
                            this.mailList.array[index].flagBtn = { "label": "标为未读", "labelColors": "#3277f3,#3277f3,#3277f3" };
                        }
                        //刷新列表的数据源，让刚才的array修改生效
                        this.mailList.refresh();
                        break;
                    case "delBtn": //点击列表单元的删除按钮
                        this.mailList.array.splice(index, 1);
                        //如果勾选过，
                        if (optIndex > -1) {
                            //从勾选数组里剔除
                            this.optStatus.splice(optIndex, 1);
                            //删除数据源的元素后，索引发生变化，要修改选项索引以后的元素
                            for (let i = optIndex; i < this.optStatus.length; i++) {
                                //从删除的索引位置开始，后续勾选元素都前移1位
                                this.optStatus[i] -= 1;
                            }
                        }
                        //刷新列表的数据源，让刚才的array修改生效
                        this.mailList.refresh();
                        Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "删除成功" });
                        break;
                }
            }
        }
    }

    /** 拉动刷新的列表示例
     * @readme 重点示范基于列表橡皮筋效果的上下拉动、列表滚动暂停、恢复、列表数据添加方式等，
     * 以及横向拉动单元格效果，与快捷跳转到指定的列表单元格位置等功能。
     */
    class RefreshRT extends RefreshUI {
        constructor() {
            super();
            /** 滚动条效果是否停止 */
            this.scrollBarIsStop = false;
            /** 消息生成的当前最大id值 */
            this.msgIdNow = 1;
            /** 列表单元是否已打开 */
            this.itemIsOpen = false;
            /**展开的单元格索引ID */
            this.itemOpenId = -1;
            /** 记录模拟数据的红点状态 */
            this.redHotStatus = [];
            /** 纪录鼠标按下状态，true为已按下，用于状态判断 */
            this.mouseDown = false;
        }
        onEnable() {
            this.refreshList.array = this.createListData(9);
            //帧听几个操作按钮的点击事件
            this.toLine.on(Laya.Event.CLICK, this, this.onToLineBtn);
            this.toTop.on(Laya.Event.CLICK, this, this.onToTopBtn);
            this.toBottom.on(Laya.Event.CLICK, this, this.onToBottomBtn);
            //侦听鼠标在列表上的抬起处理
            this.refreshList.on(Laya.Event.MOUSE_UP, this, this.stageOnMouseUp);
            this.refreshList.on(Laya.Event.MOUSE_OUT, this, this.stageOnMouseUp);
            //游戏逻辑关联引擎的停止滚动接口
            this.refreshList.scrollBar.stopMoveLimit = this.scrollBarIsStopBind.bind(this);
            this.refreshLimit("dragTopLimit", 80);
            this.refreshLimit("dragBottomLimit", 80, 20);
            //绑定单元格鼠标处理
            this.refreshList.mouseHandler = new Laya.Handler(this, this.onListMouse);
        }
        stageOnMouseUp() {
            // console.log("??????????-----stageOnMouseUp", this.itemIsOpen, this.itemOpenId, this.openedItem);
            this.mouseDown = false;
        }

        /**
         * 处理列表刷新数据时的限制
         * @param eventName 要侦听的事件名
         * @param moveLimit 移动距离的上限，达到上限后才会抛出要侦听的事件
         * @param distance 相对布局，位于父节点的距离
         * @param time  需要加载多少毫秒后恢复
         */
        refreshLimit(eventName, moveLimit, distance = 0, time = 2000) {
            if (eventName === "dragTopLimit") {
                //设置下拉的最大橡皮筋高度,只有在启用了停止滚动的功能后有效
                this.refreshList.scrollBar.topMoveLimit = moveLimit;
            } else if (eventName === "dragBottomLimit") {
                this.refreshList.scrollBar.bottomMoveLimit = moveLimit;
            }
            //帧听达到限制的事件，达到限制条件的时候再触发停止滚动的接口
            this.refreshList.scrollBar.on(eventName, this, () => {
                console.log("达到了滚动限制:" + eventName);
                //显示加载进度ui
                this.refreshLoading.visible = true;
                //处理加载ui的位置
                if (eventName === "dragTopLimit") {
                    //先清理bottom的状态，避免top计算出错
                    this.refreshLoading.bottom = NaN;
                    this.refreshLoading.top = distance;
                    //创建模拟数据
                    var _arr = this.createListData(5, "顶部新增的标题");
                    //加到源数据前面
                    _arr = _arr.concat(this.refreshList.array);
                    var index = 0 + 5;
                    var line = 0;
                    //所有的红点数据索引都增加
                    if (this.redHotStatus.length > 0) {
                        for (let i = 0; i < this.redHotStatus.length; i++) {
                            this.redHotStatus[i] += 5;
                        }
                    }
                } else if (eventName === "dragBottomLimit") {
                    this.refreshList.scrollBar.disableDrag = true;
                    //先清理top的状态，避免bottom计算出错
                    this.refreshLoading.top = NaN;
                    this.refreshLoading.bottom = distance;
                    //创建模拟数据
                    var _arr = this.createListData(5, "底部新增的标题");
                    //加到源数据后面
                    _arr = this.refreshList.array.concat(_arr);
                    var index = this.refreshList.array.length - 1;
                    var line = index + 5;
                }
                //停止滚动条
                this.scrollBarIsStop = true;
                //模拟数据加载效果，X秒后恢复
                Laya.timer.once(time, this, () => {
                    //更新list数据源
                    this.refreshList.array = _arr;
                    this.refreshList.scrollTo(line);
                    //将选中索引设定为该索引
                    this.refreshList.selectedIndex = index;
                    //恢复滚动条到原位
                    this.scrollBarIsStop = false;
                    this.refreshList.scrollBar.backToNormal();
                    this.refreshLoading.visible = false;
                });
            });
        }

        /**列表的鼠标事件处理，常用于处理单元格上的点击事件等 */
        onListMouse(e, index) {
            // console.log("-----onListMouse", e.type, this.refreshList.getChildAt(0), e.target, index);
            if (e.type == Laya.Event.MOUSE_DOWN) {
                this.mouseDown = true;
                // console.log("===========MOUSE_DOWN", this.itemOpenId, JSON.stringify(this.redHotStatus), index);
                //如果单元格已经展开，则先恢复
                if (this.itemIsOpen) {
                    this.itemIsOpen = false;
                    this.itemOpenId = -1;
                    Laya.Tween.to(this.openedItem, { "x": 0 }, 500, null, Laya.Handler.create(this, () => {
                        this.refreshList.scrollBar.disableDrag = false;
                    }));
                    // console.log("mouseDown+++++++++++++*****", this.itemOpenId, e.target.name, index);
                } else {
                    //转换全局坐标为列表单元格的本地坐标并保存
                    this.moveLastPos = e.target.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY));
                    //鼠标按下的时候进行移动侦听
                    e.target.on(Laya.Event.MOUSE_MOVE, this, this.onItemBoxMouseMove, [e.target, index]);
                    // console.log("移动侦听", this.itemOpenId, e.target.name, index);
                }
            }
            if (e.type == Laya.Event.MOUSE_UP) {
                this.mouseDown = false;
                // console.log("??????????=====MOUSE_UP", this.itemIsOpen, this.itemOpenId, this.openedItem, index);
                // !(this.itemOnMouseUp()) && e.target.off(Laya.Event.MOUSE_MOVE, this, this.onItemBoxMouseMove);
                this.itemOnMouseUp();
            }
            //点击标记文本
            if (e.target.name == "flag" && e.type == Laya.Event.CLICK)
                this.onClickFlag(index);
            //点击删除文本
            if (e.target.name == "del" && e.type == Laya.Event.CLICK)
                this.onClickDel(index);
        }


        /** 列表单元格上的鼠标抬起时处理恢复逻辑
         */
        itemOnMouseUp() {
            //抬起鼠标时，处理正打开的单元格
            if (this.itemIsOpen) {
                var targetX;
                //根据单元格x当前坐标，处理回缩还是展开。
                if (this.openedItem.x < -80) {
                    targetX = -262;
                } else {
                    this.itemIsOpen = false;
                    targetX = 0;
                }
                //当前坐标不等于目标坐标时，才处理
                if (targetX !== this.openedItem.x) {
                    //自动展开或恢复
                    Laya.Tween.to(this.openedItem, { "x": targetX }, 500);
                }
                //在鼠标抬起的时候恢复列表滚动
                this.refreshList.scrollBar.disableDrag = false;
                //抬起或划出单元格的时候移除移动侦听
                if (this.itemOpenId !== -1) {
                    this.openedItem.off(Laya.Event.MOUSE_MOVE, this, this.onItemBoxMouseMove);
                    this.itemOpenId = -1; //接触侦听后，恢复为未打开的状态
                    // console.log("off1___33333333333333---this.openedItem", this.openedItem.name, this.itemOpenId, this.openedItem, this.itemIsOpen, this.refreshList.array);
                }
                // console.log("off2________移除移动侦听", this.itemOpenId, this.openedItem, this.itemIsOpen);
            }
            // console.log("off3________移除移动侦听", this.itemOpenId, this.openedItem, this.itemIsOpen);
            // return false;
        }


        /** 点击标记按钮处理
         * @param index 要删除的列表索引
         */
        onClickFlag(index) {
            // console.log("((((((((((((--onClickFlag---------", JSON.stringify(this.redHotStatus), this.refreshList.array[index]);
            //检查红点是否已经是显示状态，
            var showRedHot = this.redHotStatus.indexOf(index);
            //红点不在列表中，说明当前index的单元格未显示红点
            if (showRedHot == -1) {
                //修改数据源，设置为显示红点
                this.refreshList.array[index].avatar = {};
                this.refreshList.array[index].avatar.redHot = { "visible": true };
                this.refreshList.array[index].flag = { "flagText": { "text": "标记已读" } };
                //把当前已显示红点的索引记录下来，用于点击判断
                this.redHotStatus.push(index);
            } else {
                this.refreshList.array[index].avatar = { "redHot": { "visible": false } };
                this.refreshList.array[index].flag = { "flagText": { "text": "标记未读" } };
                //清除红点索引记录
                this.redHotStatus.splice(showRedHot, 1);
                // console.log("11111", JSON.stringify(this.redHotStatus));
            }
            this.refreshList.refresh();
            // console.log("((((((((((((--onClickFlag+++++", JSON.stringify(this.redHotStatus), this.refreshList.array);
        }


        /** 单元格上的删除按钮点击逻辑
         * @param index 要删除的列表索引
         */
        onClickDel(index) {
            // console.log("((((((((((((del------------");
            //按索引删除
            this.refreshList.array.splice(index, 1);
            //清除已纪录的打开状态
            // this.itemIsOpen = false;
            this.itemOpenId = -1;
            //如果当前单元格有红点状态纪录，要把状态索引清除
            var showRedHot = this.redHotStatus.indexOf(index);
            if (showRedHot > -1) {
                this.redHotStatus.splice(index, 1);
            }
            //处理红点用于点击状态数据索引
            if (this.redHotStatus.length > 0) {
                for (let i = 0; i < this.redHotStatus.length; i++) {
                    (this.redHotStatus[i] > index) && (this.redHotStatus[i] += 1);
                }
            }
            //刷新列表
            this.refreshList.refresh();
        }


        /** 列表当前单元格的鼠标移动事件的处理
         * @param item 单元格对象
         * @param index 单元格索引
         */
        onItemBoxMouseMove(item, index) {
            if (this.mouseDown) {
                //得到当前的本地坐标
                let mousePos = item.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY));
                //计算移动距离值
                let moveX = this.moveLastPos.x - mousePos.x;
                let moveY = this.moveLastPos.y - mousePos.y;
                //当左右划，并且是没有打开的时候，处理
                if (Math.abs(moveX) > Math.abs(moveY) && !(this.itemIsOpen)) {
                    // console.log("@@@@---onItemBoxMouseMove", moveX, moveY);
                    //存储正在打开的单元格对象，用于跨单元格恢复处理
                    this.openedItem = item;
                    //已进入划动状态
                    this.itemIsOpen = true;
                    //停止列表的上下滚动
                    this.refreshList.scrollBar.disableDrag = true;
                    //纪录下来打开的单元格索引，在下次重按之前，都会先处理该索引
                    this.itemOpenId = index;
                }
                //划动状态的时候处理单元格x位置
                if (this.itemIsOpen) {
                    this.openedItem.x -= moveX;
                    // console.log("-------------move-------", { item }, { mousePos }, this.openedItem, this.itemIsOpen, this.itemOpenId);
                    if (this.openedItem.x < -262)
                        this.openedItem.x = -262;
                    else if (this.openedItem.x > 0)
                        this.openedItem.x = 0;
                }
            } else {
                this.refreshList.scrollBar.disableDrag = false;
                // console.log("没有按下的时候，划动", this.itemOpenId, this.openedItem);
            }
        }


        /** 关联引擎的滚动限制接口 */
        scrollBarIsStopBind() {
                return this.scrollBarIsStop;
            }
            /** 当点击跳转XX行的按钮时 */
        onToLineBtn() {
            let line = parseInt(this.lineNumber.text) - 1;
            //传入列表array的索引值，会将该索引作为第一个（可见的）起始索引
            this.refreshList.scrollTo(line);
            //并将选中索引设定为该索引
            (line < this.refreshList.array.length) && (this.refreshList.selectedIndex = line);
        }


        /** 当点击跳转顶部的按钮时 */
        onToTopBtn() {
            this.refreshList.scrollTo(0);
            //并将选中索引设定为该索引
            this.refreshList.selectedIndex = 0;
        }


        /** 当点击跳转底部的按钮时 */
        onToBottomBtn() {
            let line = this.refreshList.array.length - 1;
            //如果索引传值大于最大的可见起始索引时，只会拉到底，不会把传入的索引当成第一个可见索引
            this.refreshList.scrollTo(line);
            //并将选中索引设定为该索引
            this.refreshList.selectedIndex = line;
        }


        /** 创建list模拟数据
         * @param max 最大生成数量
         * @param msgTitle 标题文本
         */
        createListData(max = 5, msgTitle = "初始测试标题") {
            let _Date = new Date();
            let _hour = (_Date.getHours() < 10) ? "0" + _Date.getHours() : "" + _Date.getHours();
            let _minute = (_Date.getMinutes() < 10) ? "0" + _Date.getMinutes() : "" + _Date.getMinutes();
            var _arr = [];
            for (var i = 0; i < max; i++) {
                let msgTime = { "text": _hour + " : " + _minute };
                _arr[i] = {};
                _arr[i].msgTime = msgTime;
                _arr[i].msgTitle = { "text": msgTitle + (this.msgIdNow + i) };
                //给img子节点直接设置数据源的方式，引擎是不支持的，但可以通过runtime类来修改数据源处理流程来实现，具体可参考本示例list单元格的Runtime类
                _arr[i].avatar = { "redHot": { "visible": false } };
                // console.log(".............", i, msgTime);
            }
            this.msgIdNow += i;
            return _arr;
        }
        onDisable() {}
    }

    class ItemBox extends Laya.Box {
        constructor() { super(); }
        get dataSource() {
            return super.dataSource;
        }
        set dataSource(value) {
            super.dataSource = value;
            if (!value)
                return;
            //把数据源里的值，给到子节点属性
            if (value.avatar) {
                let redHot = this.getChildByName("avatar").getChildByName("redHot");
                redHot.visible = value.avatar.redHot.visible;
            }
            if (value.flag) {
                let flagText = this.getChildByName("flag").getChildByName("flagText");
                flagText.changeText(value.flag.flagText.text);
            }
        }
    }

    class TreeListRT extends TreeListUI {
        onEnable() {
            //给tree设置xml数据源
            this.tree1.xml = this.getTreeData(true);
            this.tree2.xml = this.getTreeData(false);
        }
        getTreeData(_static) {
            //初始化树状列表的数据源
            let treeData = "<data>";
            if (_static) { //写死的模拟数据
                //拼接模拟数据，最多只能是二层结构，不支持层级很深的结构。结合else里的程序创建的模拟数据格式与注释，加深理解xml数据规则
                treeData +=
                    "<dir itemLabel='一级目录一' isOpen='false'>" +
                    "<file itemLabel='二级子项1 '/>" +
                    "<file itemLabel='二级子项2 '/>" +
                    "<file itemLabel='二级子项3 '/>" +
                    "<file itemLabel='二级子项4 '/>" +
                    "<file itemLabel='二级子项5 '/>" +
                    "</dir>" +
                    "<dir itemLabel='一级目录二' isOpen='true'>" +
                    "<file itemLabel='二级子项1 '/>" +
                    "<file itemLabel='二级子项2 '/>" +
                    "<file itemLabel='二级子项3 '/>" +
                    "</dir>" +
                    "<dir itemLabel='一级目录三' isOpen='false'>" +
                    "<file itemLabel='二级子项1 '/>" +
                    "<file itemLabel='二级子项2 '/>" +
                    "<file itemLabel='二级子项3 '/>" +
                    "<file itemLabel='二级子项4 '/>" +
                    "<file itemLabel='二级子项5 '/>" +
                    "</dir>" +
                    "<file itemLabel='一级子项1 '/>" +
                    "<file itemLabel='一级子项2 '/>"; //一级子项与一级目录并列，二级子项会相对于一级目录缩进一些
            } else { //程序创建的模拟数据
                //模拟树状列表数据，拼接列表的数据源
                for (let i = 0; i < 5; i++) {
                    //拼接目录数据结构（item标签这里可以自己定义标签名，用什么开头就用什么结束,但是title这里，一定要对应列表渲染单元的label文本节点name）
                    treeData += "<item title='目录" + (i + 1) + "' isOpen='true'>";
                    for (let j = 0; j < 5; j++) {
                        //拼接子项（即不会再有展开）的结构，(这里的subpage标签也是可以自己任意定义名称，title这里，一定要对应列表渲染单元的label文本节点name）
                        treeData += "<subpage title='子项标题" + (j + 1) + "' />";
                    }
                    //每一个子项的外层，要有一个完整的结束标签，目录开始用什么标签名就用什么标签名结束。
                    treeData += "</item>";
                }
            }
            //数据源data标签，需要拼接一个结束标签；
            treeData += "</data>";
            //把字符串解析为xml对象并返回
            return Laya.Utils.parseXMLFromString(treeData);;
        }
    }

    class MsgRT extends Laya.View {
        constructor() { super(); }
        onOpened(param) {
            if (param) {
                this.msgLab.x = param.point && param.point.x ? param.point.x : Laya.stage.mouseX - 50;
                this.msgLab.y = param.point && param.point.y ? param.point.y : Laya.stage.mouseY - 80;
                //传入的文本
                this.msgLab.changeText(param.text);
                Laya.Tween.to(this.msgLab, { y: this.msgLab.y - 100, alpha: 0 }, 1000, Laya.Ease.linearNone);
            }
        }
    }

    var Browser = Laya.Browser;
    var Render = Laya.Render;
    var Utils = Laya.Utils;
    class IframeElementRT extends IframeElementUI {
        constructor() {
            super();
            IframeElementRT.instance = this;
        }
        onEnable() {
            this.videoBtn.on(Laya.Event.MOUSE_DOWN, this, () => { this.createElementVideo(); });
        }

        /** 创建视频 */
        createElementVideo() {
            //在window设置全局IframeElementRT，用于原生JS调用IframeElementRT里的方法
            Browser.window.IframeElementRT = this;
            //创建dom节点
            this.createScript();
            this.createDiv();
            this.createIframe("./files/video.html?url=layaAir.mp4");
            //让dom节点使用引擎上的节点区域
            this.setDOMElementInArea();
            //舞台改变时，重置DOM节点区域
            Laya.stage.on(Laya.Event.RESIZE, this, this.setDOMElementInArea);
        }

        /** 设置DOM节点区域，与引擎上的节点位置对应起来 */
        setDOMElementInArea() {
            if (this.iframeElement != null && this.divElement != null) {
                Utils.fitDOMElementInArea(this.divElement, this.closeBox, 0, 0, this.closeBox.width, this.closeBox.height);
                Utils.fitDOMElementInArea(this.iframeElement, this.iframeBox, 0, 0, this.iframeBox.width, this.iframeBox.height);
            }
        }

        /** 创建script元素与内容 */
        createScript() {
            //创建一个script元素节点
            this.scriptElement = Browser.document.createElement("script");
            //在body里添加这个创建的元素节点
            Browser.document.body.appendChild(this.scriptElement);
            //给script元素节点里，插入函数内容
            this.scriptElement.innerHTML = "function closeVideo(){IframeElementRT.closeVideo() }";
        }

        /** 创建iframe相关的DOM元素与属性 */
        createIframe(url) {
            //创建一个iframe元素节点
            this.iframeElement = Browser.createElement("iframe");
            //在body里添加这个创建的元素节点
            Browser.document.body.appendChild(this.iframeElement);
            //设置iframe元素样式与属性
            this.iframeElement.style.zIndex = Render.canvas.style.zIndex + 998;
            this.iframeElement.src = url;
            this.iframeElement.style.margin = "0";
            this.iframeElement.style.scrolling = "no";
            this.iframeElement.style.frameborder = "0";
            this.iframeElement.style.padding = "0";
            this.iframeElement.style.left = "0";
            this.iframeElement.style.top = "0px";
            this.iframeElement.style.position = "absolute";
        }

        /** 创建div元素
         *  由于dom元素不能穿插到引擎节点里，只能在最上层显示，如果想在视频上面与引擎交互，要采用原生的dom元素去调
         */
        createDiv() {
            this.divElement = Laya.Browser.createElement("div");
            Laya.Browser.document.body.appendChild(this.divElement);
            this.divElement.innerHTML = "<img src='files/x.png' width='60px' height='60px' onclick='closeVideo()'/>";
            this.divElement.style.zIndex = Render.canvas.style.zIndex + 999;
        }

        /**关掉视频 */
        closeVideo() {
            //删除创建的dom节点
            Laya.Browser.document.body.removeChild(this.scriptElement);
            Laya.Browser.document.body.removeChild(this.iframeElement);
            Laya.Browser.document.body.removeChild(this.divElement);
            //回收内存
            this.scriptElement = this.iframeElement = this.divElement = null;
            //关掉侦听
            Laya.stage.off(Laya.Event.RESIZE, this, this.setDOMElementInArea);
            //如果是独立场景，也可以关掉整个场景
            //this.close();
        }
    }

    class OpenMainScene extends Laya.Script {
        onEnable() {
            this.owner.getChildByName("btn").on(Laya.Event.CLICK, this, () => { this.owner.close(); });
        }
        onDisable() {
        }
    }

    class OpenScene extends Laya.Script {
        constructor() { super(); }
        onEnable() {
            let _window, closeBtn;
            _window = this.owner.getChildByName("window");
            closeBtn = _window.getChildByName("closeBtn");
            _window.on(Laya.Event.MOUSE_DOWN, this, () => { _window.startDrag(); });
            closeBtn.on(Laya.Event.MOUSE_DOWN, this, () => { this.owner.close(); });
        }
        onDisable() {
        }
    }

    var Event$2 = Laya.Event;
    var Mouse = Laya.Mouse;
    class UsePanelRT extends UsePanelUI {
        constructor() { super(); }
        onEnable() {
            if (!(Laya.Browser.onPC)) {
                this.topLab.changeText("背景可拖拽，双指缩放改变大小");
            } else {
                this._panel.on(Event$2.MOUSE_OVER, this, () => { Mouse.cursor = "move"; });
                this._panel.on(Event$2.MOUSE_OUT, this, () => { Mouse.cursor = "auto"; });
            }
        }
    }

    class bgImg extends Laya.Script {
        constructor() {
            super(...arguments);
            /** x轴最大可拖坐标点 */
            this.maxX = 0;
            /** x轴最小可拖坐标点 */
            this.minX = -90;
            /** y轴最大可拖坐标点 */
            this.maxY = 0;
            /** y轴最小可拖坐标点 */
            this.minY = -580;
            /**每次滚轮的缩放大小 */
            this.scaleSize = 0.1;
            /** 上次的距离值 */
            this.lastDistance = 0;
        }
        onEnable() {
            this._owner = this.owner;
            this.onMouseWheel();
        }
        /** 帧听滚轮事件，并处理滚动 */
        onMouseWheel() {
            //处理滚轮事件的帧听
            this.owner.on(Laya.Event.MOUSE_WHEEL, this, (e) => {
                //转换舞台坐标为本地坐标
                let point = this._owner.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY));
                // this.addTestPoint(point);
                if (e.delta > 0) { //当滑轮向上滚动时  
                    this._owner.scaleX += this.scaleSize;
                    this._owner.scaleY += this.scaleSize;
                }
                if (e.delta < 0) { //当滑轮向下滚动时  
                    this._owner.scaleX -= this.scaleSize;
                    this._owner.scaleY -= this.scaleSize;
                    //设置最小缩放值
                    (this._owner.scaleX < 1) && (this._owner.scaleX = 1);
                    (this._owner.scaleY < 1) && (this._owner.scaleY = 1);
                }
                //缩放后的鼠标位置
                let point2 = this._owner.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY));
                // this.addTestPoint(point2, "#ffffff");
                //计算缩放引发的xy偏移值
                let _offsetX = (point2.x - point.x) * this._owner.scaleX;
                let _offsetY = (point2.y - point.y) * this._owner.scaleY;
                //偏移的实际坐标位置
                _offsetX += this._owner.x;
                _offsetY += this._owner.y;
                //缩放后,图的宽高改变了，要更新边界限制
                this.updateLimit();
                //对于有边界限制的，要考虑偏移不要超过边界限制
                if (_offsetX > this.maxX)
                    this._owner.x = this.maxX;
                else if (_offsetX < this.minX)
                    this._owner.x = this.minX;
                else
                    this._owner.x = _offsetX;
                if (_offsetY > this.maxY)
                    this._owner.y = this.maxY;
                else if (_offsetY < this.minY)
                    this._owner.y = this.minY;
                else
                    this._owner.y = _offsetY;
            });
        }
        onStart() {
            //onStart 生命周期里得到的适配宽高比较准确
            this.updateLimit();
        }
        /** 更新边界限制 */
        updateLimit() {
            //父节点，panel
            let _parent = this.owner.parent.parent;
            //设置初始值
            this.minX = _parent.width - this._owner.width * this._owner.scaleY;
            this.minY = _parent.height - this._owner.height * this._owner.scaleY;
        }
        onMouseDown(e) {
            e.stopPropagation();
            //当触摸操作的touch对象数组存在，并且大于1个触摸点，就认定为缩放
            if (e.touches && e.touches.length > 1) {
                let lastPivot = this.setPivot(e.touches);
                //加个保护，个别浏览器（例如safari）有bug，可能偶尔遗失手势信息
                if (!(lastPivot.x) || !(lastPivot.y)) {
                    console.log("(((((((((((((((((((((((", this.lastPivot, JSON.parse(JSON.stringify(e.touches)));
                }
                else {
                    //把初始的touch空间位置通过开平方运算，记录为初始双指距离
                    this.lastDistance = this.getDistance(e.touches);
                    //纪录缩放前的手指中心点坐标
                    this.lastPivot = lastPivot;
                    //多指按下的情况下，再去侦听手势移动事件并处理逻辑
                    this._owner.on(Laya.Event.MOUSE_MOVE, this, this.mouseMove);
                    // this.addTestPoint(this.lastPivot);
                }
            }
            else if (Laya.Browser.onPC) //拖拽图片  
                this._owner.startDrag();
        }
        onMouseUp(e) {
            //鼠标或手势抬起后，移除侦听
            this._owner.off(Laya.Event.MOUSE_MOVE, this, this.mouseMove);
        }
        /** 计算两个触摸点坐标之间的距离 */
        getDistance(touches) {
            //初始值为0
            var distance = 0;
            if (touches && touches.length > 1) {
                //计算距离
                let dx = touches[0].stageX - touches[1].stageX;
                let dy = touches[0].stageY - touches[1].stageY;
                distance = Math.sqrt(dx * dx + dy * dy);
            }
            return distance;
        }
        /** 鼠标（或手势）在对象上移动时触发的事件侦听方法 */
        mouseMove(e) {
            /**当前的双指距离*/
            let distance = this.getDistance(e.touches);
            //设置缩放
            this._owner.scaleX += (distance - this.lastDistance) * (this.scaleSize / 10);
            this._owner.scaleY += (distance - this.lastDistance) * (this.scaleSize / 10);
            //设置缩放值值限制条件
            (this._owner.scaleX < 1) && (this._owner.scaleX = 1);
            (this._owner.scaleY < 1) && (this._owner.scaleY = 1);
            (this._owner.scaleX > 5) && (this._owner.scaleX = 5);
            (this._owner.scaleY > 5) && (this._owner.scaleY = 5);
            //缩放后的手势中心点位置(局部位置)
            let nowPivot = this.setPivot(e.touches);
            //加个保护，个别浏览器（例如safari）有bug，可能偶尔遗失手势信息
            if (!(nowPivot.x) || !(nowPivot.y)) {
                console.log("$$$$$$$$$$$", nowPivot, JSON.parse(JSON.stringify(e.touches)));
            }
            else {
                // this.addTestPoint(nowPivot, "#ffffff");
                //缩放后,图的宽高改变了，要更新边界限制
                this.updateLimit();
                //计算缩放引发的xy偏移值
                let _offsetX = (nowPivot.x - this.lastPivot.x) * this._owner.scaleX;
                let _offsetY = (nowPivot.y - this.lastPivot.y) * this._owner.scaleY;
                //偏移的实际坐标位置
                _offsetX += this._owner.x;
                _offsetY += this._owner.y;
                //对于有边界限制的，要考虑偏移不要超过边界限制
                if (_offsetX > this.maxX)
                    this._owner.x = this.maxX;
                else if (_offsetX < this.minX)
                    this._owner.x = this.minX;
                else
                    this._owner.x = _offsetX;
                if (_offsetY > this.maxY)
                    this._owner.y = this.maxY;
                else if (_offsetY < this.minY)
                    this._owner.y = this.minY;
                else
                    this._owner.y = _offsetY;
                //保存当前值，用于下次计算
                this.lastDistance = distance;
            }
        }
        /**
         * 计算并设置多指的中心点坐标
         * @param touches 手势信息数组
         */
        setPivot(touches) {
            let Point0 = this._owner.globalToLocal(new Laya.Point(touches[0].stageX, touches[0].stageY));
            let Point1 = this._owner.globalToLocal(new Laya.Point(touches[1].stageX, touches[1].stageY));
            return new Laya.Point((Point0.x + Point1.x) / 2, (Point0.y + Point1.y) / 2);
        }
        onUpdate() {
            //边界控制
            (this._owner.x > this.maxX) && (this._owner.x = this.maxX);
            (this._owner.x < this.minX) && (this._owner.x = this.minX);
            (this._owner.y > this.maxY) && (this._owner.y = this.maxY);
            (this._owner.y < this.minY) && (this._owner.y = this.minY);
            // console.log("---------_owner.xy++++++++++", this._owner.x, this._owner.y, this.maxX, this.maxY, this.minX, this.minY);
        }
        /** 添加一个测试点
         * @param point 测试点坐标
         * @param size 测试点大小，圆的半径
         * @param color 测试点的颜色
         */
        addTestPoint(point, color = "#ff0000", size = 2) {
            let spTest = new Laya.Sprite();
            spTest.graphics.drawCircle(0, 0, size, color);
            this.owner.addChild(spTest);
            spTest.pos(point.x, point.y);
            // console.log("====---------", point.x, point.y)
        }
    }

    class UiMainRT extends UiMainUI {
        constructor() {
            super();
            Laya.stage.screenMode = Laya.Stage.SCREEN_HORIZONTAL;
            Laya.stage.alignH = "left";
        }
        onEnable() {
            //在开启物理辅助线的情况下，设置默认隐藏
            Laya.PhysicsDebugDraw.I && Laya.PhysicsDebugDraw.I.visible && (Laya.PhysicsDebugDraw.I.visible = false);
            this.tabBindViewStack();
            // this.onClicked();
        }

        /**侦听某些点击事件  */
        onClicked() {
            let openSceneBtn = this.item2Tab.getChildByName("item2"),
                openSceneBtn2 = this.item2Tab.getChildByName("item3"),
                openDialogBtn = this.item2Tab.getChildByName("item4");
            openSceneBtn.on(Laya.Event.MOUSE_DOWN, this, () => { Laya.Scene.open("./uiDemo/page/OpenMainScene.scene", false); });
            openSceneBtn2.on(Laya.Event.MOUSE_DOWN, this, () => { Laya.Scene.open("./uiDemo/page/OpenScene.scene", false); });
            openDialogBtn.on(Laya.Event.MOUSE_DOWN, this, () => { Laya.Scene.open("./uiDemo/Dialog.scene", false, { "title": "弹窗的标题", "text": "弹窗的具体文本……" }); });
        }

        /**关联tab与ViewStack的索引关系*/
        tabBindViewStack() {
            //关联顶部tab的选项与ViewStack的索引关系
            this.topTab.selectHandler = new Laya.Handler(this, (index) => {
                this.tabPage.selectedIndex = index;
                //处理物理辅助线
                Laya.PhysicsDebugDraw.I && Laya.PhysicsDebugDraw.I.visible && (Laya.PhysicsDebugDraw.I.visible = false);
                //处理DOM视频
                !!IframeElementRT.instance.iframeElement && IframeElementRT.instance.closeVideo();
                index == 2 && this.item2Page.selectedIndex == 1 && !IframeElementRT.instance.iframeElement && IframeElementRT.instance.createElementVideo();
            });
            //关联子级tab选项与ViewStack的索引关系
            this.item0Tab.selectHandler = new Laya.Handler(this, (index) => {
                this.item0Page.selectedIndex = index;
            });
            this.item1Tab.selectHandler = new Laya.Handler(this, (index) => {
                this.item1Page.selectedIndex = index;
                if (index !== 4 && Laya.PhysicsDebugDraw.I && Laya.PhysicsDebugDraw.I.visible)
                    Laya.PhysicsDebugDraw.I.visible = false;
                else if (index == 4 && Laya.PhysicsDebugDraw.I && !Laya.PhysicsDebugDraw.I.visible)
                    Laya.PhysicsDebugDraw.I.visible = true;
            });
            this.item2Tab.selectHandler = new Laya.Handler(this, (index) => {
                this.item2Page.selectedIndex = index;
                switch (index) {
                    case 1:
                        !IframeElementRT.instance.iframeElement && IframeElementRT.instance.createElementVideo();
                        break;
                    case 2:
                        Laya.Scene.open("./uiDemo/page/OpenMainScene.scene", false);
                        break;
                    case 3:
                        Laya.Scene.open("./uiDemo/page/OpenScene.scene", false);
                        break;
                    case 4:
                        Laya.Scene.open("./uiDemo/Dialog.scene", false, { "title": "弹窗的标题", "text": "弹窗的具体文本……" });
                        break;
                }
                index !== 1 && !!IframeElementRT.instance.iframeElement && IframeElementRT.instance.closeVideo();
            });
            this.item3Tab.selectHandler = new Laya.Handler(this, (index) => {
                this.item3Page.selectedIndex = index;
            });
            this.item4Tab.selectHandler = new Laya.Handler(this, (index) => {
                this.item4Page.selectedIndex = index;
            });
        }

        onDisable() {
            Laya.stage.screenMode = Laya.Stage.SCREEN_NONE;
            Laya.stage.alignH = "left";
        }
    }

    class ProgressRT extends ProgressUI {
        onAwake() {
            this.ani1.on(Laya.Event.COMPLETE, this, () => {
                this.ani1.stop();
                //间隔3秒再次播放
                Laya.timer.once(3000, this, () => {
                    this.ani1.play();
                });
            });
            this.testProgress();
        }

        /**
         * 测试加载效果
         */
        testProgress() {
            this.loading2.value = 0.01;
            this.loadText.changeText("资源加载中……");
            Laya.timer.loop(100, this, this.changeProgress);
        }

        //这里仅模拟加载演示效果，正常的加载流程，请查看LoadingRuntime类
        changeProgress() {
            this.loading2.value += 0.01;
            if (this.loading2.value == 1) {
                this.loadText.changeText("资源加载完成");
                Laya.timer.clear(this, this.changeProgress);
                //间隔3秒再次测试
                Laya.timer.once(3000, this, () => {
                    this.testProgress();
                });
            }
        }
    }

    class TextShowRT extends TextShowUI {
        onAwake() {
            this.loadBitmapFont();
        }

        /**
         * 实例化位图字体类，并加载位图字体
         */
        loadBitmapFont() {
            let bitmapFont = new Laya.BitmapFont();
            bitmapFont.loadFont("bitmapfont/gongfang.fnt", new Laya.Handler(this, this.onFontLoaded, [bitmapFont]));
        }

        /**
         * 位图字体加载完成后的回调方法
         * @param bitmapFont 实例后的位图字体对象
         */
        onFontLoaded(bitmapFont) {
            //注册位图字体
            Laya.Text.registerBitmapFont("gongfang", bitmapFont);
            //除非是注册位图字体（Laya.Text.registerBitmapFont）在字体显示前就完成，例如在Main入口类里注册。
            //否则，需要在完成位图字体的注册后，对于需要使用位图字体的对象，重设字体（font）
            this.btFont.font = "gongfang";
        }
    }

    class ChangeTextureRT extends ChangeTextureUI {
        constructor() { super(); }
        onEnable() {
            Laya.timer.loop(2000, this, () => {
                this.changeImgSkin();
                this.changeSpriteTexture();
                this.changeFillTexture();
                this.changeTexture();
            });
        }

        /** 替换Image组件的资源 */
        changeImgSkin() {
            this.Img.skin = this.randomImg();
        }


        /**替换Sprite组件的资源 */
        changeSpriteTexture() {
            this.spImg.loadImage(this.randomImg(true, 6, 5));
        }

        /**替换FillTexture资源，基于Graphics绘图只能是重绘 */
        changeFillTexture() {
            //需要注意，调用clear方法会清除当前节点上的所有Graphics绘图（不含子节点），如果不想全部清，则需要把该不需要清除的Graphics绘图放到其它节点上。
            this.graphics.clear();
            let _texture = Laya.loader.getRes(this.randomImg(true, 4));
            //重绘纹理
            this.graphics.fillTexture(_texture, 10, 325, 132, 306);
        }

        /** 替换Texture资源，基于Graphics绘图只能是重绘 */
        changeTexture() {
            //清除this._textureImg节点下的所有绘图（不含子节点）
            this._textureImg.graphics.clear();
            //加载资源获得一个纹理对象
            let _texture = Laya.loader.getRes(this.randomImg(true, 8, 7));
            //在this._textureImg节点上重绘纹理
            this._textureImg.graphics.drawTexture(_texture);
        }

        /** 生成随意图片地址 */
        randomImg(isMan = false, max = 8, min = 1) {
            let mum = Math.floor(Math.random() * (max - min + 1)) + min;
            if (isMan)
                return "role/m" + mum + ".png";
            return "role/w" + mum + ".png";
        }
        onDisable() {}
    }

    /**理解鼠标事件与穿透，请参照文档：https://ldc2.layabox.com/doc/?nav=zh-ts-2-2-8 **/
    class MouseThroughRT extends MouseThroughUI {
        constructor() { super(); }
        onEnable() {
            this.changeMouseCursor();
            this.throughTab.selectHandler = new Laya.Handler(this, this.onSwitchTab);
        }

        /**当切换tab的index标签索引时 */
        onSwitchTab(index) {
            switch (index) {
                case 0:
                    this.leftBg.hitTestPrior = true;
                    this.rightBg.hitTestPrior = true;
                    break;
                case 1:
                    this.leftBg.hitTestPrior = false;
                    this.rightBg.hitTestPrior = false;
                    break;
            }
        }

        /**
         * 改变鼠标样式，
         * 通过侦听父节点的移入和移出事件，做出鼠标样式的改变，方便查看不同检测模式下，鼠标事件的交互区域变化
         */
        changeMouseCursor() {
            //进出鼠标事件区，改变鼠标状态
            this.leftBg.on(Laya.Event.MOUSE_OVER, this, () => {
                Laya.Mouse.cursor = "move";
            });
            this.leftBg.on(Laya.Event.MOUSE_OUT, this, () => {
                Laya.Mouse.cursor = "auto";
            });
            this.rightBg.on(Laya.Event.MOUSE_OVER, this, (e) => {
                Laya.Mouse.cursor = "move";
            });
            this.rightBg.on(Laya.Event.MOUSE_OUT, this, () => {
                Laya.Mouse.cursor = "auto";
            });
            //侦听父节点的点击状态
            this.leftBg.on(Laya.Event.CLICK, this, () => {
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "点击了左侧的可点击区域", "point": { x: Laya.stage.mouseX - 100 } });
                console.log("click " + this.leftBg.name);
            });
            this.rightBg.on(Laya.Event.CLICK, this, () => {
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "点击了右侧的可点击区域", "point": { x: Laya.stage.mouseX - 120 } });
                console.log("click " + this.rightBg.name);
            });
            //侦听在父节点鼠标检测区域子节点的点击状态，用于测试穿透
            this.btn1.on(Laya.Event.CLICK, this, (e) => {
                //阻止事件向父节点冒泡，只对相同事件类型有效，假如父节点侦听的是MOUSE_DOWN，这里是CLICK，那就无法阻止了。
                e.stopPropagation();
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "点击了测试按钮1" });
                console.log("click btn1");
            });
            this.btn2.on(Laya.Event.CLICK, this, (e) => {
                e.stopPropagation();
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "点击了测试按钮2" });
                console.log("click btn2");
            });
            //侦听在父节点区域之外的点击状态，用于测试优先检测子对象和本对象的区别
            //穿透模式下，优先检测的设置无效
            this.close1.on(Laya.Event.CLICK, this, (e) => {
                e.stopPropagation(); //这里不阻止，父节点btn1，爷节点leftBg，会都响应帧听，然后打印。
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "点击了左侧关闭按钮", "point": { x: Laya.stage.mouseX - 100 } });
                console.log("click " + this.close1.name);
            });
            //在不穿透的模式下，优先检测本对象，本对象范围外的，会跳过检测，导致点击不到。
            this.close2.on(Laya.Event.CLICK, this, (e) => {
                e.stopPropagation();
                Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "点击了右侧关闭按钮", "point": { x: Laya.stage.mouseX - 120 } });
                console.log("click " + this.close2.name);
            });
        }
        onDisable() {}
    }

    class PhysicalCollisionRT extends PhysicalCollisionUI {
        onEnable() {
            this.bTop.getComponent(Laya.BoxCollider).width = this.bTop.width;
            this.bBottom.getComponent(Laya.BoxCollider).width = this.bBottom.width;
            this.bRight.getComponent(Laya.BoxCollider).height = this.bRight.height;
            this.bLeft.getComponent(Laya.BoxCollider).height = this.bLeft.height;
        }
    }

    var Event$3 = Laya.Event;
    /**
     * 当节点设置为mask类型后，不再具有节点属性，无法通过查找节点的方式找到，所以也不能被鼠标检测到，
     * 需要通过控制参照物来间接来控制，本示例中，分别通过舞台的鼠标坐标以及graphics绘制的鼠标区域来同步改变mask位置
     */
    class MaskRT extends MaskUI {
        onEnable() {
            this._hitArea.on(Event$3.MOUSE_DOWN, this, () => {
                this._hitArea.off(Event$3.MOUSE_MOVE, this, this.bg3MaskMove);
                this._hitArea.startDrag();
                //当_hitArea节点位移的时候，同步mask位置
                this._hitArea.on(Event$3.MOUSE_MOVE, this, this.bg3MaskMove);
            });
            this.on(Event$3.MOUSE_MOVE, this, this.maskMove);
        }

        bg3MaskMove(e) {
            e.stopPropagation();
            //用可控制的鼠标交互区来同步不可鼠标交互的mask位置。
            this.bg3Mask.x = this._hitArea.x;
            this.bg3Mask.y = this._hitArea.y;
        }

        maskMove() {
            /** 场景上的鼠标点，考虑到场景被引用，场景位置就不等于stage位置，需要转换坐标 */
            let _point = this.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY)),
                maskX = _point.x - (this._mask.width / this.bg2.scaleX / 2),
                maskY = _point.y - (this._mask.height / this.bg2.scaleY / 2);
            if (maskX > 80 && maskY > 80) {
                //要还原缩放的偏移影响来同步mask位置
                this._mask.x = _point.x - (this._mask.width / this.bg2.scaleX / 2);
                this._mask.y = _point.y - (this._mask.height / this.bg2.scaleY / 2);
                //放大的背景需要考虑缩放偏移的影响
                this.bg2.x = (-_point.x - this._mask.width / 2) * (this.bg2.scaleX - 1);
                this.bg2.y = (-_point.y - this._mask.height / 2) * (this.bg2.scaleY - 1);
            }
        }
    }

    /**
     * 子弹脚本，实现子弹飞行逻辑及对象池回收机制
     */
    class Bullet extends Laya.Script {
        constructor() { super(); }
        onEnable() {
            //设置初始速度
            var rig = this.owner.getComponent(Laya.RigidBody);
            rig.setVelocity({ x: 0, y: -10 });
        }
        onTriggerEnter(other, self, contact) {
            //如果被碰到，则移除子弹
            this.owner.removeSelf();
        }
        onUpdate() {
            //如果子弹超出屏幕，则移除子弹
            if (this.owner.y < -10) {
                this.owner.removeSelf();
            }
        }
        onDisable() {
            //子弹被移除时，回收子弹到对象池，方便下次复用，减少对象创建开销
            Laya.Pool.recover("bullet", this.owner);
        }
    }

    /**
     * 掉落盒子脚本，实现盒子碰撞及回收流程
     */
    class DropBox extends Laya.Script {
        constructor() {
            super();
            /**盒子等级 */
            this.level = 1;
        }
        onEnable() {
            /**获得组件引用，避免每次获取组件带来不必要的查询开销 */
            this._rig = this.owner.getComponent(Laya.RigidBody);
            this.level = Math.round(Math.random() * 5) + 1;
            this._text = this.owner.getChildByName("levelTxt");
            this._text.text = this.level + "";
        }
        onUpdate() {
            //让持续盒子旋转
            this.owner.rotation++;
        }
        onTriggerEnter(other, self, contact) {
            var owner = this.owner;
            if (other.label === "buttle") {
                //碰撞到子弹后，增加积分，播放声音特效
                if (this.level > 1) {
                    this.level--;
                    this._text.changeText(this.level + "");
                    owner.getComponent(Laya.RigidBody).setVelocity({ x: 0, y: -10 });
                    Laya.SoundManager.playSound("sound/hit.wav");
                } else {
                    if (owner.parent) {
                        let effect = Laya.Pool.getItemByCreateFun("effect", this.createEffect, this);
                        effect.pos(owner.x, owner.y);
                        owner.parent.addChild(effect);
                        effect.play(0, true);
                        owner.removeSelf();
                        Laya.SoundManager.playSound("sound/destroy.wav");
                    }
                }
                PhysicsGameMainRT.instance.addScore(1);
            } else if (other.label === "ground") {
                //只要有一个盒子碰到地板，则停止游戏
                owner.removeSelf();
                PhysicsGameMainRT.instance.stopGame();
            }
        }

        /**使用对象池创建爆炸动画 */
        createEffect() {
            let ani = new Laya.Animation();
            ani.loadAnimation("test/TestAni.ani");
            ani.on(Laya.Event.COMPLETE, null, recover);

            function recover() {
                ani.removeSelf();
                Laya.Pool.recover("effect", ani);
            }
            return ani;
        }
        onDisable() {
            //盒子被移除时，回收盒子到对象池，方便下次复用，减少对象创建开销。
            Laya.Pool.recover("dropBox", this.owner);
        }
    }

    class LoopImg extends Laya.Script {
        constructor() { super(); }
        onEnable() {
        }
        onUpdate() {
            //超出盒子的显示宽高时，移除。 这里考虑了图片设置轴心点后的坐标偏移
            // if ((<Laya.Image>this.owner).x < -128 || (<Laya.Image>this.owner).x > 1016) {
            //     console.log("removeSelf", (<Laya.Image>this.owner).x, (<Laya.Image>this.owner).y);
            //     // this.owner.removeSelf();
            // }
        }
        onDisable() {
            //Img被移除时，回收到对象池，方便下次复用，减少对象创建开销。
            // Laya.Pool.recover("loopImg", this.owner);
        }
    }

    /**This class is automatically generated by LayaAirIDE, please do not make any modifications. */

    class GameConfig {
        static init() {
            //注册Script或者Runtime引用
            let reg = Laya.ClassUtils.regClass;
    		reg("prefab/CloseBtn.js",CloseBtn);
    		reg("scence/d3Demo/D3Main.js",D3Main);
    		reg("Index.js",Index);
    		reg("LoadingRT.js",LoadingRT);
    		reg("scence/physicsDemo/PhysicsGameMainRT.js",PhysicsGameMainRT);
    		reg("scence/physicsDemo/PhysicsGameMain.js",PhysicsGameMain);
    		reg("scence/uiDemo/animation/AtlasAniRT.js",AtlasAniRT);
    		reg("scence/uiDemo/animation/FrameAniRT.js",FrameAniRT);
    		reg("scence/uiDemo/animation/SkeletonAni.js",SkeletonAni);
    		reg("prefab/Role.js",Role);
    		reg("script/tween/Folded.js",Folded);
    		reg("scence/uiDemo/DialogRT.js",DialogRT);
    		reg("script/mouse/Joystick.js",Joystick);
    		reg("scence/uiDemo/interactive/ShapeDetectionRT.js",ShapeDetectionRT);
    		reg("script/mouse/DragAndTips.js",DragAndTips);
    		reg("scence/uiDemo/interactive/ShapeDetection.js",ShapeDetection);
    		reg("scence/uiDemo/list/BagListRT.js",BagListRT);
    		reg("scence/uiDemo/list/ComboBoxRT.js",ComboBoxRT);
    		reg("scence/uiDemo/list/LoopListRT.js",LoopListRT);
    		reg("scence/uiDemo/list/MailListRT.js",MailListRT);
    		reg("scence/uiDemo/list/RefreshRT.js",RefreshRT);
    		reg("runtime/box/dataSource/ItemBox.js",ItemBox);
    		reg("scence/uiDemo/list/TreeListRT.js",TreeListRT);
    		reg("scence/uiDemo/MsgRT.js",MsgRT);
    		reg("scence/uiDemo/page/IframeElementRT.js",IframeElementRT);
    		reg("scence/uiDemo/page/OpenMainScene.js",OpenMainScene);
    		reg("scence/uiDemo/page/OpenScene.js",OpenScene);
    		reg("scence/uiDemo/page/UsePanelRT.js",UsePanelRT);
    		reg("script/mouse/BgImg.js",bgImg);
    		reg("scence/uiDemo/UiMainRT.js",UiMainRT);
    		reg("scence/uiDemo/useUI/ProgressRT.js",ProgressRT);
    		reg("scence/uiDemo/useUI/TextShowRT.js",TextShowRT);
    		reg("scence/uiDemo/useUI/ChangeTextureRT.js",ChangeTextureRT);
    		reg("scence/uiDemo/useUI/MouseThroughRT.js",MouseThroughRT);
    		reg("scence/uiDemo/useUI/PhysicalCollisionRT.js",PhysicalCollisionRT);
    		reg("scence/uiDemo/useUI/MaskRT.js",MaskRT);
    		reg("prefab/Bullet.js",Bullet);
    		reg("prefab/DropBox.js",DropBox);
    		reg("prefab/LoopImg.js",LoopImg);
        }
    }
    GameConfig.width = 1334;
    GameConfig.height = 750;
    GameConfig.scaleMode ="fixedwidth";
    GameConfig.screenMode = "none";
    GameConfig.alignV = "middle";
    GameConfig.alignH = "center";
    GameConfig.startScene = "Loading.scene";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = true;
    GameConfig.exportSceneToJson = true;

    GameConfig.init();

    class Main {
        constructor() {
            Config.useRetinalCanvas = true;
            //根据IDE设置初始化引擎		
            if (window["Laya3D"])
                Laya3D.init(GameConfig.width, GameConfig.height);
            else
                Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = GameConfig.scaleMode;
            Laya.stage.screenMode = GameConfig.screenMode;
            Laya.stage.alignV = GameConfig.alignV;
            Laya.stage.alignH = GameConfig.alignH;
            Laya.stage.bgColor = "#efeed7";
            //兼容微信不支持加载scene后缀场景
            Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
            //打开调试面板（通过IDE设置调试模式，或者url地址增加debug=true参数，均可打开调试面板）
            if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
                Laya.enableDebugPanel();
            if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
                Laya["PhysicsDebugDraw"].enable();
            if (GameConfig.stat)
                Laya.Stat.show();
            Laya.alertGlobalError(true);
            //激活资源版本控制，version.json由IDE发布功能自动生成，如果没有也不影响后续流程
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        }
        onVersionLoaded() {
            //激活大小图映射，加载小图的时候，如果发现小图在大图合集里面，则优先加载大图合集，而不是小图
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
        }
        onConfigLoaded() {
            //加载IDE指定的场景
            GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);
        }
    }
    //激活启动类
    new Main();

}());
