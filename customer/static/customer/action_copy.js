let HEART_BEAT = "heart_beat";
let HEART_BEAT_INTERVAL = 10;

let is_pause = false;
let is_temp_change_timer = false;
let is_spmode_change_timer = false;
// 轮询定时器
let timer = null;
let off_timer = null;
let is_verify = false;
// 用户是否开机
let power_on = false;
// 目标温度,环境温度
let d_goal_temp, goal_temp;
let curr_temp;
let env_temp;
// 工作模式,0为制冷
let d_work_mode, work_mode;
// 风速模式
let d_sp_mode, sp_mode;
// 客户信息
let room_id = null;
let phone_num = null;
// 目标温度上下限
let hot_sub , hot_sup;
let cold_sub, cold_sup;

let total_cost = 0;
// 按钮
let $power_btn;
let $mode_btn;
let $spd_btn;
let $temp_add_btn;
let $temp_minus_btn;
// 显示
let $pic_mode;
let $speed;
let $air_state;
let $curr_temp;
let $goal_temp;
let $room_id;
let $phone_num;
let $info_btn;
let $total_cost;

function bindElement() {
    // 按钮
    $power_btn = $("#power_btn");
    $mode_btn = $("#mode_btn");
    $spd_btn = $("#spd_btn");
    $temp_add_btn = $("#temp_add_btn");
    $temp_minus_btn = $("#temp_minus_btn");
    // 显示
    $pic_mode = $("#pic_mode");
    $speed = $("#speed");
    $air_state = $("#air_state");
    $curr_temp = $("#curr_temp");
    $goal_temp = $("#goal_temp");
    $room_id = $("#room_id_input");
    $phone_num = $("#phone_number_input");
    $info_btn = $("#info_btn");
    $total_cost = $("#total_cost");
}


function setParams() {
    $.ajax({
        url: 'get_default',
        async: false,
        dataType: 'JSON',
        type: 'GET',
        success: function (ret) {
            if (ret.code !== 200) {
                alert(ret.msg)
            } else {
                data = ret.data
                // 变量赋值
                d_work_mode = data.work_mode
                work_mode = d_work_mode;
                d_sp_mode = data.sp_mode;
                sp_mode = d_sp_mode;

                cold_sub = data.cold_sub;
                cold_sup = data.cold_sup;

                hot_sub = data.hot_sub;
                hot_sup = data.hot_sup;
                d_goal_temp = data.goal_temp;
                goal_temp = d_goal_temp;
                setInitState();
            }
        },
        error: function (err) {
            console.log(err);
            alert("和主机连接失败，请刷新页面");
        }
    });
}

function setInitState() {

    // 风速
    if(sp_mode === 0) {
        $speed.text("低风");
    } else if(sp_mode === 1) {
         $speed.text("中风");
    } else {
        $speed.text("高风");
    }
    // 工作模式
    let img = $pic_mode.attr("src");

    let tmp = img.split('/');

    if(work_mode === 0) {
        tmp[tmp.length - 1] = "snow.png";
    } else {
        tmp[tmp.length - 1] = "sun.png";
    }
    $pic_mode.attr("src", tmp.join("/"));
    // 目标温度
    $goal_temp.text(goal_temp);
}

function disButton() {
    $curr_temp.text(curr_temp);
    $air_state.text("未开机");
    $mode_btn.attr("disabled", true);
    $spd_btn.attr("disabled", true);
    $temp_add_btn.attr("disabled", true);
    $temp_minus_btn.attr("disabled", true);
}

function enaButton() {
    $("#mode_btn").attr("disabled", false);
    $("#spd_btn").attr("disabled", false);
    $("#temp_add_btn").attr("disabled", false);
    $("#temp_minus_btn").attr("disabled", false);
}
function verify() {
    $.ajax({
        url: 'verify',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'room_id': room_id,
            'phone_num': phone_num,
        },
        success: function (ret) {
            if (ret.code !== 200) {
                alert(ret.msg);
            } else {
                let data = ret.data;
                env_temp = data.env_temp;
                curr_temp = env_temp;
                $curr_temp.text(curr_temp);
                is_verify = true;
            }
        },
        error: function (ret) {
            console.log(ret.msg);
        }
    })
}

$(document).ready(function() {
    // 绑定html元素
    bindElement();
    // 获取除环境温度以外的默认参数
    setParams();

    $info_btn.on("click", function () {
        room_id = $room_id.val();
        phone_num = $phone_num.val();
        if(room_id === "" || phone_num === "") {
            alert("请输入信息");
            return;
        }
        console.log("room_id is: ", room_id, "phone_num is: ", phone_num);
        verify();
    })

    $power_btn.on("click", function() {
        if(power_on === false) {
            if(is_verify === false) {
                alert("请先输入房间号和手机号进行验证");
                return;
            }
            clearInterval(off_timer);
            postPowerOn();
        } else {
            postPowerOff();
        }
        if( power_on === true ) {
            // 心跳
            timer = setInterval(poll, HEART_BEAT_INTERVAL*1000);
        } else {
            clearInterval(timer);
            $air_state.text("已关机");
            goal_temp = d_goal_temp;
            work_mode = d_work_mode;
            sp_mode = d_sp_mode;
            setInitState();

            off_timer = setInterval(postOffRate, HEART_BEAT_INTERVAL*1000);
        }
    });

    $mode_btn.on("click", function(){
        let img = $pic_mode.attr("src");
        let tmp = img.split('/')

        if(tmp[tmp.length - 1] === "snow.png"){
            if (goal_temp < hot_sub) {
                alert("目标温度过低，无法切换模式");
            } else {
                tmp[tmp.length - 1] = "sun.png"
                $pic_mode.attr("src", tmp.join("/"));
                work_mode = 1;
                if(power_on === true)
                    changeWorkMode();
            }
        } else {
            if(goal_temp > cold_sup) {
                alert("目标温度过高，无法切换模式");
            } else {
                tmp[tmp.length - 1] = "snow.png"
                $pic_mode.attr("src", tmp.join("/"));
                work_mode = 0;
                if(power_on === true)
                    changeWorkMode();
            }
        }

    });

    $temp_add_btn.on("click", function() {
        goal_temp = parseInt($goal_temp.text()) + 1;
        if(work_mode === 1 && goal_temp > hot_sup) {
            goal_temp = hot_sup;
            alert("已经达到制热模式最大温度");
        } else if(work_mode === 0 && goal_temp > cold_sup) {
            goal_temp = cold_sup;
            alert("已经达到制冷模式最大温度，请切换到制热模式");
        } else {
            $goal_temp.text(goal_temp);
            if(is_temp_change_timer === false) {
                is_temp_change_timer = true;
                setTimeout(function () {
                    is_temp_change_timer = false;
                    if(power_on === true)
                        changeGoalTemp();
                }, 1000);
            }
        }
    });

    $temp_minus_btn.on("click", function() {
        goal_temp = parseInt($goal_temp.text()) - 1;
        if(work_mode === 0 && goal_temp < cold_sub) {
            goal_temp = cold_sub;
            alert("已经达到制冷模式最低温度");
        } else if(work_mode === 1 && goal_temp < hot_sub) {
            goal_temp = hot_sub;
            alert("已经达到制热模式最低温度，请切换到制冷模式");
        } else {
            $goal_temp.text(goal_temp);
            if(is_temp_change_timer === false) {
                is_temp_change_timer = true;
                setTimeout(function () {
                    is_temp_change_timer = false;
                    if(power_on === true)
                        changeGoalTemp();
                }, 1000);
            }
        }
    });

    $spd_btn.on("click", function() {
        if(sp_mode === 0){
            $speed.text("中风");
            sp_mode++;
        }else if(sp_mode === 1){
            $speed.text("高风");
            sp_mode++;
        } else {
            $speed.text("低风");
            sp_mode = 0;

        }
        if(is_spmode_change_timer === false) {
            is_spmode_change_timer = true;
            setTimeout(function () {
                is_spmode_change_timer = false;
                if(power_on === true)
                    changeFanSpeed();
            }, 1000);
        }
    });
});


function poll() {
    console.log(HEART_BEAT);
    $.ajax({
        url: 'poll',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'room_id': room_id,
            'phone_num': phone_num,
        },
        success: function (ret) {
            console.log(ret.data);
            let data = ret.data;
            $air_state.text(data.is_work);
            if (data.is_work === 1) {
                $air_state.text('送风中');
                is_pause = false;
            } else if(data.is_work === 0) {
                $air_state.text('等待中');
            } else {
                $air_state.text('待机中');
            }
            curr_temp = data.curr_temp;
            total_cost = data.total_cost;
            $curr_temp.text(curr_temp.toFixed(2));
            $total_cost.text(total_cost.toFixed(2));
            // 达到目标温度，主动请求停止送风
            if(Math.abs(curr_temp  - goal_temp) < 1e-5 && data.is_work === 1) {
                is_pause = true;
                pause();
            } else if(Math.abs(curr_temp - goal_temp) > 0.999 && is_pause === true) {
                is_pause = false;
                re_start();
            }
        }
    })
}

function  postOffRate() {
    console.log('POST OFF RATE');
    $.ajax({
        url: 'off_rate',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'room_id': room_id,
            'phone_num': phone_num,
        },
        success: function (ret) {
            let data = ret.data;
            console.log(data);
            curr_temp = data.curr_temp;
            $curr_temp.text(curr_temp.toFixed(2));
            if(Math.abs(curr_temp - env_temp) < 1e-5) {
                clearInterval(off_timer);
            }
        }
    })
}
function pause() {
    $.ajax({
        url: 'pause',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'room_id': room_id,
            'phone_num': phone_num,
        },
        success: function (ret) {
            if(ret.code !== 200) {
                console.log(ret.msg);
                return
            }
            $air_state.text("待机中");
        }
    })
}

function re_start() {
    $.ajax({
        url: 're_start',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'room_id': room_id,
            'phone_num': phone_num,
            'sp_mode': sp_mode,
        },
        success: function (ret) {
            if(ret.code !== 200) {
                console.log(ret.msg);
            }
        }
    })
}

function changeFanSpeed() {
    console.log("changeFanSpeed");
    $.ajax({
        url: 'change_fan_speed',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'room_id': room_id,
            'phone_num': phone_num,
            'sp_mode': sp_mode,
        },
        success: function (ret) {
            console.log(ret)
        }
    })
}


function changeGoalTemp() {
    console.log("changeGoalTemp");
    $.ajax({
        url: 'change_goal_temp',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'room_id': room_id,
            'goal_temp': goal_temp,
        },
        success: function (ret) {
            console.log(ret)
        }
    })
}

function changeWorkMode() {
    console.log("changeWorkMode");
    $.ajax({
        url: 'change_work_mode',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'room_id': room_id,
            'work_mode': work_mode,
        },
        success: function (ret) {
            console.log(ret)
        }
    })
}

function postPowerOff() {
    $.ajax({
        url: 'power_off',
        type: 'POST',
        dataType: 'JSON',
        async: false,
        data: {
            'room_id': room_id,
            'phone_num': phone_num,
        },
        success: function (ret) {
            if (ret.code !== 200) {
                console.log(ret.msg);
            } else {
                console.log("poweroff: ", ret);
                power_on = false;
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}
function postPowerOn() {
    $.ajax({
        url: 'power_on',
        type: 'POST',
        dataType: 'JSON',
        async: false,
        data: {
            'room_id': room_id,
            'phone_num': phone_num,
            'sp_mode': sp_mode,
            'work_mode': work_mode,
            'goal_temp': goal_temp,
            'curr_temp': curr_temp,
        },
        success: function (ret) {
            if (ret.code !== 200) {
                console.log(ret.msg);
            } else {
                data = ret.data;
                console.log("poweron: ", data);
                if(data.is_work === 1) {
                    $air_state.text("送风中");
                } else {
                    $air_state.text("等待中");
                }
                power_on = true;
                total_cost = data.total_cost;
                $total_cost.text(total_cost.toFixed(2));
                if(curr_temp === goal_temp) {
                    is_pause = true;
                    pause();
                }
            }
        },
        error: function (err) {
            console.log(err);
        }
    });
}
