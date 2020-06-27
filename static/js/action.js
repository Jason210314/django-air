/*
 * @Author: your name
 * @Date: 2020-06-27 10:25:47
 * @LastEditTime: 2020-06-27 11:05:34
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /django-air/static/js/action.js
 */ 


$(document).ready(function() {
    
    $rpt_day_btn = $("#rpt_day");
    $date_from= $("#dpd1");
    $date_to= $("#dpd2");

    $rpt_day_btn.on("click", function() {
        date_from = $date_from.val();
        date_to = $date_to.val();
        console.log('sadwedwedw')
        console.log(date_from,date_to,'aaaaa')
        postgetrpt(date_from,date_to,'d')
    })
})

function postgetrpt(date_from,date_to,r_type){
    console.log("查询报表");
    $.ajax({
        url: 'get_rpt',
        type: 'POST',
        dataType: 'JSON',
        data: {
            'date_from':date_from,
            'date_to':date_to,
            'r_type':r_type
        },
        success: function (ret) {
            console.log(ret)
        }
    })
}
