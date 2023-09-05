export default class OpenMainScene extends Laya.Script {
    onEnable() {
        this.owner.getChildByName("btn").on(Laya.Event.CLICK, this, () => { this.owner.close(); });
    }
    onDisable() {
    }
}
