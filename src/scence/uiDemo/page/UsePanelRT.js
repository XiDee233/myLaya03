var Event = Laya.Event;
var Mouse = Laya.Mouse;
import { UsePanelUI } from "../../../ui/layaMaxUI";
export default class UsePanelRT extends UsePanelUI {
    constructor() { super(); }
    onEnable() {
        if (!(Laya.Browser.onPC)) {
            this.topLab.changeText("背景可拖拽，双指缩放改变大小");
        } else {
            this._panel.on(Event.MOUSE_OVER, this, () => { Mouse.cursor = "move"; });
            this._panel.on(Event.MOUSE_OUT, this, () => { Mouse.cursor = "auto"; });
        }
    }
}