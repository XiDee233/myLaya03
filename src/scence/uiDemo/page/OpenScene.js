export default class OpenScene extends Laya.Script {
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
