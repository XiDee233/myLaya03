import { LoadingUI } from "./ui/layaMaxUI";
export default class LoadingRT extends LoadingUI {
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