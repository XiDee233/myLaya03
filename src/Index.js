export default class Index extends Laya.Script {
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
