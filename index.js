// ==UserScript==
// @name         阿里云盘批量重命名
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  对某个剧集里面的内容进行批量重命名
// @author       You
// @match        https://www.aliyundrive.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aliyundrive.com
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.1/jquery.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @grant        GM_addStyle
// @license		 GPL
// ==/UserScript==

(function (open) {
    'use strict';

    let obj = {};
    let list = [];
    let sortedOriginalArray = [];
    let nextMarker = '';
    let parent_file_id = '';
    let token = '';
    let loading = false;
    XMLHttpRequest.prototype.open = function () {
        this.addEventListener(
            'readystatechange',
            function () {
                if (this.readyState == 4 && this.status == 200) {
                    if (this.responseURL.indexOf('adrive/v3/file/list') > -1) {
                        let { items, next_marker } = JSON.parse(this.response);
                        nextMarker = next_marker;
                        token = this._header_.Authorization;
                        let i = 0;
                        let len = items.length;
                        for (; i < len; i++) {
                            const item = items[i];
                            parent_file_id = item.parent_file_id;
                            obj[item.file_id] = item;
                        }
                        list = Object.values(obj);
                        list = list.filter(
                            item => item.parent_file_id == parent_file_id
                        );
                    }
                }
            },
            false
        );
        open.apply(this, arguments);
    };

    function initRenameBox() {
        $('#rename-box').css({
            top: 0
        });
        $('#rename-wrap').css({
            top: 0
        });
        $('.box-modal').css({
            top: 0
        });
        let indexHtml = '';
        let contentHtml = '';
        list = list.sort(compareEpisodes);
        list = list.map((item, index) => {
            return {
                ...item,
                sortId: index
            };
        });
        sortedOriginalArray = list;
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            indexHtml +=
                `
                <span>
                ` +
                (i + 1) +
                `</span>
            `;
            contentHtml +=
                `
                <div class="item">
                ` +
                item.name +
                `
                </div>
            `;
        }
        let html =
            `
            <div class="index-wrap">
            ` +
            indexHtml +
            `
            </div>
            <div class="list-wrap">
            ` +
            contentHtml +
            `
            </div>
        `;
        $('.sort-wrap').html(html);
        $('.list-wrap').sortable({
            // 可选参数：如果需要在拖拽结束后执行一些操作，可以使用 stop 回调函数
            update: function (event, ui) {
                $(this)
                    .children('.item')
                    .each(function () {
                        const originalIndex = $(this).data('original-index');
                        sortedOriginalArray.push(list[originalIndex]);
                    });
            }
        });
        $('.list-wrap .item').each(function (index) {
            $(this).data('original-index', index);
        });
        $('.list-wrap').disableSelection();

        $('#cancelSort').click(() => {
            $('#rename-box').remove();
        });
        $('#confirmSort').click(() => {
            $('.confirm-modal').css({
                top: 0
            });
            $('#input-wrap').css({
                top: 0
            });
        });
        $('#cancelRename').click(() => {
            if (loading) {
                return;
            }
            $('.confirm-modal').css({
                top: '-9999px'
            });
            $('#input-wrap').css({
                top: '-9999px'
            });
        });
        $('#confirmRename').click(async () => {
            if (loading) {
                return;
            }
            loading = true;
            $('#confirmRename').text('重命名中，请不要关闭或刷新页面');
            $('#confirmRename').css({
                color: '#999',
                background: '#ccc',
                cursor: 'not-allowed'
            });
            let prefix = $('#prefix').val();
            let suffix = $('#suffix').val();
            let k = 0;
            const len = sortedOriginalArray.length;
            for (let i = 0; i < len; i++) {
                const item = sortedOriginalArray[i];
                let name = `${prefix}${(i + 1)
                    .toString()
                    .padStart(2, '0')}${suffix}.${item.file_extension}`;
                let body = `{"drive_id":"${item.drive_id}","file_id":"${item.file_id}","name":"${name}","check_name_mode":"refuse"}`;
                const res = await rename(body);
                if (res) {
                    k++;
                }
            }
            if (k == len) {
                alert('重命名完成');
            } else {
                alert(`有 ${len - k} 个重命名失败`);
            }
            window.location.reload();
        });
    }
    function compareEpisodes(a, b) {
        const nameA = a.name;
        const nameB = b.name;
        return nameA.localeCompare(nameB, undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    }
    function init() {
        let css = ` 
            .batchRename {
                border-radius: 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 8px 16px;
                background: #637dff;
                font-size: 12px;
                font-weight: 500;
                line-height: 14px;
                color: #fff;
                cursor: pointer;
                flex: 1;
            }
            .batchRename.cancel {
                background: #dedede;
                color: #999;
            }
            #rename-box {
                width: 70vw;
                height: 80vh;
                left: 0;
                top: -9999px;
                bottom: 0;
                right: 0;
                margin: auto;
                position: fixed;
            }
            #rename-box .box-modal {
                position: fixed;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.4);
                left: 0;
                top: -9999px;
            }
            #rename-box .confirm-modal {
                position: fixed;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.4);
                left: 0;
                top: -9999px;
            }
            #rename-box .btn-wrap {
                display: flex;
                margin-top: 20px;
            }
            #rename-box .btn-wrap span + span {
                margin-left: 20px;
            }
            #rename-box #rename-wrap {
                position: absolute;
                background: #fff;
                padding: 20px;
                left: 0;
                top: 0;
                width: 100%;
                box-shadow: 0 0 5px #dedede;
                height: 100%;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
            }
            #rename-box #rename-wrap p {
                padding-bottom: 20px;
                font-size: 14px;
            }
            #rename-box #rename-wrap p span {
                color: red;
            }
            #rename-box #rename-wrap .sort-wrap {
                padding-right: 16px;
                flex: 1;
                overflow-y: scroll;
                display: flex;
                line-height: 30px;
            }
            #rename-box #rename-wrap .sort-wrap .index-wrap {
                display: flex;
                flex-direction: column;
                margin-right: 10px;
            }
            #rename-box #rename-wrap .sort-wrap .index-wrap span {
                width: 30px;
                height: 30px;
                font-size: 13px;
            }
            #rename-box #rename-wrap .sort-wrap .list-wrap {
                flex: 1;
            }
            #rename-box #rename-wrap .sort-wrap .list-wrap .item {
                height: 30px;
                cursor: pointer;
                user-select: none;
                margin: 0;
                font-size: 13px;
                border-bottom: 1px dashed #999;
            }
            #rename-box #rename-wrap > .batchRename {
                margin-top: 20px;
                margin-left: 0;
            }
            #rename-box #input-wrap {
                position: absolute;
                background: #fff;
                padding: 20px;
                z-index: 10;
                left: 0;
                top: -9999px;
                bottom: 0;
                right: 0;
                margin: auto;
                width: 60%;
                height: 50%;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                font-size: 13px;
                color: #666;
            }
            #rename-box #input-wrap .name-wrap {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            #rename-box #input-wrap .name-wrap span {
                width: 60px;
                text-align: center;
            }
            #rename-box #input-wrap .name-wrap .prefix {
                height: 40px;
                margin: 0;
                padding: 0;
                outline: none;
                border: 0;
                border-bottom: 1px solid #dedede;
                flex: 1;
            }
            #rename-box #input-wrap .tip {
                margin-top: 20px;
            }
            #batchBtn {
                position: fixed;
                bottom: 120px;
                right: 48px;
                font-size: 14px;
                background: #637dff;
                border-radius: 100px;
                display: -ms-flexbox;
                display: flex;
                -ms-flex-align: center;
                align-items: center;
                -ms-flex-pack: center;
                justify-content: center;
                color: #fff;
                cursor: pointer;
                -webkit-transition: all 0.3s ease;
                -o-transition: all 0.3s ease;
                transition: all 0.3s ease;
                -webkit-box-shadow: 0px 3px 8px 0px rgba(28, 28, 32, 0.12), 0px 3px 5px 0px rgba(28, 28, 32, 0.04);
                box-shadow: 0px 3px 8px 0px rgba(28, 28, 32, 0.12), 0px 3px 5px 0px rgba(28, 28, 32, 0.04);
            }
            `;
        let box = `
            <div id="rename-box">
                <div class="box-modal"></div>
                <div id="rename-wrap">
                    <p>
                        文件已自动排序，如顺序不对，请手动拖动排序，然后点击确定
                        <span>（请务必确保排序正确！！）</span>
                    </p>
                    <div class="sort-wrap">
                        <div class="index-wrap"></div>
                        <div class="list-wrap"></div>
                    </div>
                    <div class="btn-wrap">
                        <span id="cancelSort" class="batchRename cancel">取消</span>
                        <span id="confirmSort" class="batchRename">确定</span>
                    </div>
                </div>
                <div class="confirm-modal"></div>
                <div id="input-wrap">
                    <div>
                        <div class="name-wrap">
                            <input id="prefix" class="prefix" type="text" placeholder="前缀" />
                            <span>序号</span>
                            <input id="suffix" class="prefix" type="text" placeholder="后缀" />
                        </div>
                        <div class="tip">
                            <p>序号从 01 开始</p>
                            <p>前缀、后缀都可不填</p>
                            <p>例：琅琊榜第 + 01 + 集 => 琅琊榜第01集.mp4</p>
                        </div>
                    </div>
                    <div class="btn-wrap">
                        <span id="cancelRename" class="batchRename cancel">取消</span>
                        <span id="confirmRename" class="batchRename">确定</span>
                    </div>
                </div>
            </div>
            `;
        let btn = "<span id='batchBtn' class='batchRename'>批量重命名</span>";
        GM_addStyle(css);
        $('body').append(btn);
        $('#batchBtn').click(() => {
            if (nextMarker) {
                alert('当前目录还有未加载完的文件，请滚动页面加载');
            } else {
                $('body').append(box);
            }
            initRenameBox();
        });
    }

    init();

    async function rename(body) {
        try {
            const res = await fetch(
                'https://api.aliyundrive.com/v3/file/update',
                {
                    headers: {
                        accept: 'application/json, text/plain, */*',
                        'accept-language': 'zh-CN,zh;q=0.9',
                        authorization: token,
                        'cache-control': 'no-cache',
                        'content-type': 'application/json',
                        pragma: 'no-cache',
                        'sec-ch-ua':
                            '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"macOS"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-site',
                        'x-canary': 'client=web,app=adrive,version=v4.9.0',
                        'x-device-id': 'a4c5a51d-2fd5-4919-abdd-1d15e3fbdbbd',
                        'x-signature':
                            '30ef6ffed7e9513dfe692c9064fe1fdf7ca97941d11ab610b1dff75476ef811c6e9b746c658eb38e146bbfee148005d2ddf1c771ca485dd0ee72e3c1a03e4e3c01',
                        Referer: 'https://www.aliyundrive.com/',
                        'Referrer-Policy': 'origin'
                    },
                    body,
                    method: 'POST'
                }
            );
            return Promise.resolve(res.ok);
        } catch (error) {
            return Promise.resolve(false);
        }
    }
})(XMLHttpRequest.prototype.open);
