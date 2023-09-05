import IframeElementRT from "./page/IframeElementRT";
import { UiMainUI } from "../../ui/layaMaxUI";
export default class UiMainRT extends UiMainUI {
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
        openSceneBtn.on(Laya.Event.MOUSE_DOWN, this, () => { Laya.Scene.open("uiDemo/page/OpenMainScene.scene", false); });
        openSceneBtn2.on(Laya.Event.MOUSE_DOWN, this, () => { Laya.Scene.open("uiDemo/page/OpenScene.scene", false); });
        openDialogBtn.on(Laya.Event.MOUSE_DOWN, this, () => { Laya.Scene.open("uiDemo/Dialog.scene", false, { "title": "弹窗的标题", "text": "弹窗的具体文本……" }); });
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
                    Laya.Scene.open("uiDemo/page/OpenMainScene.scene", false);
                    break;
                case 3:
                    Laya.Scene.open("uiDemo/page/OpenScene.scene", false);
                    break;
                case 4:
                    Laya.Scene.open("uiDemo/Dialog.scene", false, { "title": "弹窗的标题", "text": "弹窗的具体文本……" });
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