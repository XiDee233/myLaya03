var Browser = Laya.Browser;
var Render = Laya.Render;
var Utils = Laya.Utils;
import { IframeElementUI } from "../../../ui/layaMaxUI";
export default class IframeElementRT extends IframeElementUI {
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