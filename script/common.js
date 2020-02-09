const _URL = 'http://106.13.124.128/openapi/';
const API_URL = _URL+'index/';
const API_URL_FUN = API_URL+'get_fun_api/';//功能接口
const API_URL_GOODS = API_URL+'get_goods_data/';//商品接口
const ADMIN_USERID = 1;//用户id后台获取
const Gtablist = [{
    name: '淘宝',
    value: 'tb'
}, {
    name: '京东',
    value: 'jd'
}, {
    name: '拼多多',
    value: 'pdd'
}];
const Gsortlist = [{
    name: '综合',
    sort: 0,
    type: 'tb'
}, {
    name: '销量',
    sort: 2,
    type: 'tb'
}, {
    name: '奖励',
    sort: 6,
    type: 'tb'
}, {
    name: '价格',
    sort: 4,
    type: 'tb'
}];
var sorts_data = {
    min_id: 1,
    back: 20,
    tb_p:1
};

 //打开新窗口name:窗口名称；URL窗口地址；data对象参数
function openWinto(name, url, data) {
    if (api.systemType == "ios") {
        var times = 0;
    } else {
        var times = 300;
    }
    data = typeof(data) == 'object' ? data : {};
    data.reload = data.reload || true;
    data.bounces = data.bounces || false;
        api.openWin({
            name: name,
            url: url + '.html',
            delay: times,
            slidBackType: 'edge',
            allowEdit: true,
            overScrollMode: "always",
            reload: data.reload,
            bounces: data.bounces,
            pageParam: {
                data: data
            },
            animation: {
                type: 'movein'
            }
        });
}


function showProgress(msg) {
    msg = msg || '加载中...'
    api.showProgress({
        title: msg
    });
}

function hideProgress() {
    api.hideProgress();
}

//提示
function showToast(text) {
    api.toast({
        msg: text,
        location: 'middle'
    });
    return false;
}

/*打开商品搜索页面*/
function doSearch() {
    openWinto('searchlist_win', 'widget://html/searchlist');
}

//html模板解析函数
function setDotTmpl(tmpl_id, div_id, data) {
    var temp_id = $api.byId(tmpl_id);
    var tmpdata = doT.template($api.text(temp_id));
    $api.html($api.byId(div_id), tmpdata(data));
}

//导航菜单
function setNavMenu(menu_id, top_y, items, w, style) {
    style = style || 'horizontal';
    w = w || 60;
    var NVNavigationBar = api.require('NVNavigationBar');
    NVNavigationBar.open({
        rect: {
            x: 0,
            y: top_y,
            w: api.winWidth,
            h: 42
        },
        styles: {
            orientation: style,
            bg: 'rgba(0,0,0,0.0)',
            bgAlpha: 1,
            font: {
                size: 14,
                sizeSelected: 17,
                color: '#FFFFFF',
                colorSelected: '#FFFFFF',
                alpha: 1,
                bold: true
            },
            itemSize: {
                w: w,
                h: 42
            }
        },
        items: items,
        selectedIndex: 0,
        fixedOn: api.frameName,
        fixed: true,
        id: menu_id
    }, function(ret, err) {
        if (ret.eventType == 'click') {
            api.setFrameGroupIndex({
                name: ret.id + '_frame_list',
                index: ret.index
            });
        }
    })
}

//菜单选择
function setNavMenuSelected(menu_id, index) {
    var NVNavigationBar = api.require('NVNavigationBar');
    NVNavigationBar.setSelected({
        id: menu_id,
        index: index,
        selected: true
    }, function(ret) {
        //console.log(JSON.stringify(ret));
    });
}

//post获取数据
function postData(url, data, callback) {
    data.login_devid = api.deviceId;
    data.admin_userid = ADMIN_USERID;
    api.ajax({
        url: url,
        method: 'post',
        data: {
            values: data
        }
    }, function(ret, err) {
        typeof callback == "function" && callback(ret, err);
    });

}

//商品列表接口
/*********
apiname 接口名称string
param 接口参数obeject
cb 回调函数
tmpl_id 模板id string
div_id  htmlid string
more  加载更多 string
*************/
function getGoodsList(apiname, param, cb, more, tmpl_id, div_id) {
    $(".index_loading").show();
    more = more || false;
    tmpl_id = tmpl_id || 'tmpl_goods_list';
    div_id = div_id || 'div_goods_list';
    param.apiname = apiname;
    param.min_id = param.min_id || 1;
    postData(API_URL_GOODS, param, function(ret, err) {
        if (ret.code == 1) {
            $(".temporarily_data").hide();
            sorts_data.min_id = ret.min_id;
            sorts_data.tb_p=ret.tb_p;
            if (true === more) {
                var list_data = new Array;
                var temp_id = $api.byId(tmpl_id);
                var tmpdata = doT.template($api.text(temp_id));
                list_data = list_data.concat(ret.data);
                $api.append($api.byId(div_id), tmpdata(list_data));
            } else {
                setDotTmpl(tmpl_id, div_id, ret.data);
                echo.render();
            }
        } else if(ret.code==0) {
            if (param.min_id == 1 && sorts_data.min_id == 1) {
                $(".temporarily_data").show();
            } else {
                showToast('没有更多了...');
            }
        }else{//

        }
        $(".index_loading").hide();
        typeof cb == 'function' && cb();
    });
}

//分类筛选商品
function getSortGoods(tabs, callback) {
    setDotTmpl('tmpl_goods_list', 'div_goods_list', false);
    tabs = tabs || 'sorts';
    var tab = new auiTab({
        element: document.getElementById(tabs),
    }, function(ret) {
        gotoback(); //返回顶端
        typeof callback == 'function' && callback(ret.index);
    });
}

//滑动到底部加载更多
function getMoreGoods(callback) {
    api.addEventListener({
        name: 'scrolltobottom',
        extra: {
            threshold: 50
        }
    }, function(ret, err) {
        typeof callback == "function" && callback();
    });
}

//淘宝图文详情
function getTaoBaoDetail(itemid, desc_img) {
    $("#tabtxt").html('商品图文详情（加载中......）');
    var tb_url = 'https://h5api.m.taobao.com/h5/mtop.taobao.detail.getdesc/6.0/?jsv=2.4.11&appKey=12574478&t=1541515546003&sign=9588b256ff5a9aa9eb9aadfcde249749&api=mtop.taobao.detail.getdesc&v=6.0&type=jsonp&dataType=jsonp&timeout=20000&callback=mtopjsonp1&data={"id":"' + itemid + '","type":"1","f":"TB15fWEnNTpK1RjSZFM8qvG_Vla"}';
    $.ajax({
        url: tb_url,
        tryCount: 0,
        retryLimit: 3,
        dataType: 'jsonp',
        jsonpCallback: 'mtopjsonp1',
        success: function(dat) {
            if (dat.ret[0] == "SUCCESS::调用成功") {
                var picinfo = dat.data.pcDescContent;
                var patt = /<img[^>]+src=['"]([^'"]+)['"]+/g;
                var image = [],
                    temp;
                while ((temp = patt.exec(picinfo)) != null) {
                    if (temp[1].indexOf('img.alicdn.com') !== -1) {
                        image.push("<img src='https:" + temp[1] + "' style='width:100%;max-width:100%' onerror='this.src=../image/load-img.png' class='bgimg'>");
                    }
                }
                $("." + desc_img).html(image);
                $("#tabtxt").html('商品图文详情（加载完毕，请您查阅）');
            }
        },
        error: function(xhr, textStatus, errorThrown) {
            this.tryCount++;
            $("#tabtxt").html('商品图文详情（加载中' + this.tryCount + '......）');
            $.ajax(this);
            return;
        }
    });

}
//下拉刷新
function pullDown(callback, pram) {
    if (!pram) {
        api.setRefreshHeaderInfo({
            loadingImg: 'widget://image/sx.png',
            bgColor: 'rgba(0,0,0,0.0)',
            textColor: '#fff',
            textDown: '下拉刷新...',
            textUp: '松开刷新...'
        }, function(ret, err) {
            callback.call(this);
            api.refreshHeaderLoadDone();
        });
    } else {
        api.setRefreshHeaderInfo({
            loadingImg: 'widget://image/cate_bg.png',
            bgColor: 'rgba(0,0,0,0.0)',
            textColor: '#fff',
            textDown: '',
            textUp: ''
        }, function(ret, err) {
            callback.call(this);
            api.refreshHeaderLoadDone();
        });
    }
}

//打开远程页面
function openWinX5(y, url) {
    var browser = api.require('webBrowser');
    browser.openView({
        url: url,
        rect: {
            x: 0,
            y: y,
            w: 'auto',
            h: 'auto',
            marginLeft: 0,
            marginTop: 0,
            marginBottom: 0,
            marginRight: 0
        }
    }, function(ret, err) {

    });
}

//打开远程网页
function openUrlX5(url) {
    var browser = api.require('webBrowser');
    browser.open({
        url: url
    });
}

//缓存图片
function imageCache(selector) {
    selector.each(function(data) {
        ! function(data) {
            var url = selector.eq(data).attr("src");
            var img = this;
            var pos = url.lastIndexOf("/");
            var filename = url.substring(pos + 1);
            var path = api.cacheDir + "/pic/" + filename;
            var obj = api.require('fs');
            obj.exist({
                path: path
            }, function(ret, err) {
                if (ret.exist) {
                    if (ret.directory) {} else {
                        selector.eq(data).attr('src', null);
                        path = api.cacheDir + "/pic/" + filename;
                        selector.eq(data).attr('src', path);
                    }
                } else {
                    api.download({
                        url: url,
                        savePath: path,
                        report: false,
                        cache: true,
                        allowResume: true
                    }, function(ret, err) {});
                }
            });
        }(data);
    });
}
//页面左右滑动防止swiper不动
function setAppNotSroll() {
    api.addEventListener({
        name: 'swipeleft'
    }, function(ret, err) {
        api.setFrameGroupAttr({
            name: 'index_frame_list',
            scrollEnabled: true
        });
    });
    api.addEventListener({
        name: 'swiperight'
    }, function(ret, err) {
        api.setFrameGroupAttr({
            name: 'index_frame_list',
            scrollEnabled: true
        });
    });
}
//页面上滑隐藏页头
function bodySrollChangeHeader() {
    window.onscroll = function() {
        var toph = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        if (toph > 300) {
            $api.css($api.byId('gotoback'), "display:block");
        } else {
            $api.css($api.byId('gotoback'), "display:none");
        }
        var func = 'changeHeader(' + toph + ');';
        api.execScript({
            name: 'root',
            frameName: 'index_win',
            script: func
        });
    }
}
//返回页面顶部
function gotoback() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

//首页分类
function openindexfenleiurl_new(url) {
    if (api.connectionType == "none") {
        showToast("网络出差~");
    } else {
        var param = url.substring(0, 4);
        if (param == 'open') { // open开头打开内页;
            url = url.replace(/#/g, "'");
            api.execScript({
                frameName: 'frame_0',
                script: url
            });
        } else if (param == 'http') {
            openUrlX5(url);
        }
    }
}
