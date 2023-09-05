import { ProgressUI } from "../../../ui/layaMaxUI";
export default class ProgressRT extends ProgressUI {
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