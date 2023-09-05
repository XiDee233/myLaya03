import { MailListUI } from "../../../ui/layaMaxUI";
/**
 * Mail列表示例，
 * @readme 重点示范列表的单元格新增与删除，以及单元格的鼠标事件处理。
 * （tab标签只示例ui的button的组合，代码参照其它示例的实现。）
 */
export default class MailListRT extends MailListUI {
    constructor() {
        super();
        /** 记录当前的选项 */
        this.optStatus = [];
    }
    onEnable() {
        const jsonPath = "json/mailList.json";
        Laya.loader.create(jsonPath, Laya.Handler.create(this, () => {
            //获取模拟list数据的json文件
            let jsonData = (Laya.loader.getRes(jsonPath)).mailList;
            if (jsonData && jsonData.length > 0) {
                //绑定列表数据源
                this.mailList.array = jsonData;
                this.mailList.mouseHandler = new Laya.Handler(this, this.onListMouse);
            }
            this.addMail.on(Laya.Event.CLICK, this, this.addMialItem);
            this.selectDel.on(Laya.Event.CLICK, this, this.listSelectDel);
            this.selectFlag.on(Laya.Event.CLICK, this, this.listSelectFlag);
        }));
    }

    /** 标记选中单元为已读 */
    listSelectFlag() {
        if (this.optStatus.length > 0) {
            for (let i = 0; i < this.optStatus.length; i++) {
                let index = this.optStatus[i];
                this.mailList.array[index].flag = 1;
                this.mailList.array[index].flagStatus = { "skin": "comp/img_mail_open.png" };
                this.mailList.array[index].flagBtn = { "label": "标为未读", "labelColors": "#3277f3,#3277f3,#3277f3" };
            }
            this.mailList.refresh();
            Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "已成功标记" });
        } else
            Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "没有勾选项，请先勾选" });
    }

    /** 删除选中的列表单元*/
    listSelectDel() {
        if (this.optStatus.length > 0) {
            //先把选项索引做个排序，从大到小，这样，删除的时候，就从后向前删除，避免因重新排序而把素引顺序打乱了。
            this.optStatus.sort(function(a, b) { return b - a; });
            for (let i = 0; i < this.optStatus.length; i++) {
                //按索引，从后向前逐个删除
                this.mailList.array.splice(this.optStatus[i], 1);
            }
            //清空选中的索引
            this.optStatus = [];
            this.mailList.refresh();
            Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "已成功删除" });
        } else
            Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "没有勾选项，请先勾选" });
    }

    /** 新增邮件列表单元 */
    addMialItem() {
        // console.log("===11111===", this.mailList.startIndex, JSON.parse(JSON.stringify(this.mailList.array)), this.optStatus);
        //list数据组的可见索引位置的后面
        var index = this.mailList.startIndex + 1;
        let itemData = {
            "mailTitle": {
                "text": "这里是新增加的邮件" + index
            },
            "mailDateTime": {
                "text": this.timestampFormat("YYYY-MM-DD hh:mm")
            },
            "opt": {
                "visible": false
            },
            "flagStatus": {
                "skin": "comp/img_mail.png"
            },
            "flagBtn": {
                "label": "标为已读",
                "labelColors": "#000000,#000000,#000000"
            }
        };
        //在指定的数据源索引位置增加一条模拟数据
        this.mailList.array.splice(index, 0, itemData);
        //如果选项数组里有值，还要处理选项的数组索引更新
        if (this.optStatus.length > 0) {
            //修正选项的数组索引
            for (let i = 0; i < this.optStatus.length; i++) {
                //只有大于或等于列表数据源新增位置的索引才需要更新
                if (this.optStatus[i] >= index) {
                    //从删除的索引位置开始，后续勾选元素都后移1位
                    this.optStatus[i] += 1;
                }
            }
        }
        this.mailList.refresh();
    }

    /**
     * 将时间戳转换为格式化后的时间文本
     * @param timestamp 时间戳
     * @param fmt 格式，默认为："YYYY-MM-DD hh:mm:ss"
     * @returns 返回格式化后的时间字符串
     */
    timestampFormat(fmt = "YYYY-MM-DD hh:mm:ss", timestamp = 0) {
        Date.prototype["Format"] = function(fmt) {
            var o = {
                "M+": this.getMonth() + 1,
                "D+": this.getDate(),
                "h+": this.getHours(),
                "m+": this.getMinutes(),
                "s+": this.getSeconds(),
            };
            //检查test(fmt)里，是否存在
            if (new RegExp("(Y+)").test(fmt))
                fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt))
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        };
        if (timestamp == 0)
            return new Date()["Format"](fmt);
        else
            return new Date(timestamp)["Format"](fmt);
    }

    /**列表的鼠标事件处理，常用于处理单元格上的点击事件等 */
    onListMouse(e, index) {
        if (e.type == Laya.Event.CLICK) {
            //检查是否已经是选中状态，
            var optIndex = this.optStatus.indexOf(index);
            switch (e.target.name) {
                case "optBG": //点击列表单元的选框
                    //如果不在选中数组中
                    if (optIndex === -1) {
                        //让对勾状态图可见
                        this.mailList.array[index].opt = { "visible": true };
                        //添加到选中数组里
                        this.optStatus.push(index);
                    } else {
                        //否则取消对勾的显示
                        this.mailList.array[index].opt = { "visible": false };
                        //删除数组里对应的元素
                        this.optStatus.splice(optIndex, 1);
                    }
                    //刷新列表的数据源，让刚才的array修改生效
                    this.mailList.refresh();
                    break;
                case "mailTitle": //点击列表单元的标题 
                    Laya.Scene.open("uiDemo/Dialog.scene", false, { "title": this.mailList.array[index].mailTitle.text, "text": "邮件内容，此处省略1000字……………………" });
                    this.mailList.array[index].flag = 1;
                    this.mailList.array[index].flagStatus = { "skin": "comp/img_mail_open.png" };
                    this.mailList.array[index].flagBtn = { "label": "标为未读", "labelColors": "#3277f3,#3277f3,#3277f3" };
                    //刷新列表的数据源，让刚才的array修改生效
                    this.mailList.refresh();
                    break;
                case "flagBtn": //点击列表单元的标记按钮 
                    if (this.mailList.array[index].flag === 1) {
                        this.mailList.array[index].flag = 0;
                        this.mailList.array[index].flagStatus = { "skin": "comp/img_mail.png" };
                        this.mailList.array[index].flagBtn = { "label": "标为已读", "labelColors": "#000000,#000000,#000000" };
                    } else {
                        this.mailList.array[index].flag = 1;
                        this.mailList.array[index].flagStatus = { "skin": "comp/img_mail_open.png" };
                        this.mailList.array[index].flagBtn = { "label": "标为未读", "labelColors": "#3277f3,#3277f3,#3277f3" };
                    }
                    //刷新列表的数据源，让刚才的array修改生效
                    this.mailList.refresh();
                    break;
                case "delBtn": //点击列表单元的删除按钮
                    this.mailList.array.splice(index, 1);
                    //如果勾选过，
                    if (optIndex > -1) {
                        //从勾选数组里剔除
                        this.optStatus.splice(optIndex, 1);
                        //删除数据源的元素后，索引发生变化，要修改选项索引以后的元素
                        for (let i = optIndex; i < this.optStatus.length; i++) {
                            //从删除的索引位置开始，后续勾选元素都前移1位
                            this.optStatus[i] -= 1;
                        }
                    }
                    //刷新列表的数据源，让刚才的array修改生效
                    this.mailList.refresh();
                    Laya.Scene.open("uiDemo/Msg.scene", false, { "text": "删除成功" });
                    break;
            }
        }
    }
}