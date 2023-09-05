import { DialogUI } from "../../ui/layaMaxUI";
export default class DialogRT extends DialogUI {
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