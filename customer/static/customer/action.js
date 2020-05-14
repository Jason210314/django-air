let ws = null;


// 轮询定时器
let timer = 0;
// 机器是否在工作(调度)
let online = true;
// 用户是否开机
let power_on = false;
// 目标温度
let goal_temp;

// 工作模式
let word_mode = "cold";
// 风速模式
let sp_mode = 0;
// 总费用
let total_cost = 0;

// 目标温度上下限
let hot_sub = 25, hot_sup = 30;
let cold_sub = 18, cold_sup = 25;

$(document).ready(function() {
    // $("#control_btn").on("click", function() {
    //     if(online === false) {
    //         online = true;
    //         get_time();
    //         openws();
    //         timer = setInterval(get_time, 5 * 1000);
    //     } else {
    //         online = false;
    //         clearInterval(timer);
    //         closews();
    //         $("#timer").text("停止了");
    //     }
    // });

    $("#power_btn").on("click", power_set)

    // $("#mode_btn").on("click", change_workmode);

    $("#temp_add_btn").on("click", function() {
        goal_temp = parseInt($("#temp").text()) + 1;
        if(goal_temp > hot_sup) {
            alert("已经达到最大温度");
            return;
        } else if(goal_temp == cold_sup + 1) {
            change_workmode();
        }
        $("#temp").text(goal_temp);
    });

    $("#temp_minus_btn").on("click", function() {
        goal_temp = parseInt($("#temp").text()) - 1;
        if(goal_temp < cold_sub) {
            alert("已经达到最低温度");
            return;
        } else if(goal_temp == cold_sup) {
            change_workmode();
        }
        $("#temp").text(goal_temp);
    });


    $("#spd_btn").on("click", function() {
        if(sp_mode==0){
            $("#speed").text("中风");
            sp_mode++;
        }else if(sp_mode==1){
            $("#speed").text("高风");
            sp_mode++;
        }else {
            $("#speed").text("低风");
            sp_mode=0;
        }
        
    });
});

function power_set() {
    if(power_on === false) {
        power_on = true;
    } else {
        power_on = false;
    }
    if(power_on == true ) {
        poll()
        timer = setInterval(poll, 30*1000);
    } else {
        clearInterval(timer);
    }
}
function poll() {
    console.log("该轮询了");
}

function change_workmode() {
    let img = $("#pic_mode").attr("src");
    console.log(img)
    let tmp = img.split('/')
    
    if(tmp[tmp.length - 1] === "snow.png"){
        tmp[tmp.length - 1] = "sun.png"
        $("#pic_mode").attr("src", tmp.join("/"));
        word_mode = "hot";
        // console.log(document.getElementById("pic_mode").src);
    }else {
        tmp[tmp.length - 1] = "snow.png"
        $("#pic_mode").attr("src", tmp.join("/"));
        word_mode = "cold";
        // console.log(document.getElementById("pic_mode").src);
    }
}

function get_time() {
    jQuery.ajax({
		type:'GET',
		url:'get_time',
		dataType:'json',
		success:function(data){
            console.log(data.time)
            $("#timer").text(data.time);
        }
    });
}

function openws() {
    ws = new WebSocket('ws://' + window.location.host + '/ws/tuisong/');

    ws.onopen = function(evt) { 
      console.log("Connection open ..."); 
    };
    
    ws.onmessage = function(evt) {
        var data = JSON.parse(evt.data)['msg'];
      console.log( "Received Message: " + data);
    };
    
    ws.onclose = function(evt) {
      console.log("Connection closed.");
    };
}
function closews() {
    ws.close();
    ws = null;
}

window.onbeforeunload = function () {
    ws.close()
    console.log(1);//在刷新页面或者关闭页面需要断开websocket
};