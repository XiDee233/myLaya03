export default class CloseBtn extends Laya.Script {
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
