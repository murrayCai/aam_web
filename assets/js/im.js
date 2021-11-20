var wsImUri = "ws://192.168.10.188:16676/";

var im = {
    socket : undefined,
    isInited : false,
    msgId : 1,
    messages : [],
    cbOnInited : function(){
        // setInterval(function(){
        //     for(i = 0; i < 1000; ){
        //         if(im.sendMessage("test " + i)){
        //             i++;
        //         }
        //     }
        // },1000);
    },
    initSocket : function(){
        im.socket = new WebSocket(wsImUri);
        im.socket.onopen = function (evt) {
            im.onOpen(evt)
        };
        im.socket.onclose = function (evt) {
            im.onClose(evt)
        };
        im.socket.onmessage = function (evt) {
            im.onMessage(evt)
        };
        im.socket.onerror = function (evt) {
            im.onError(evt)
        };
    },
    sendRequest : function(request){
        request.setMsgid(this.msgId++);
        request.setClienttype(proto.IMClientType.IMCT_WEB);
        im.socket.send(request.serializeBinary().buffer);
    },
    init : function(){
        var request = new proto.IMRequest();
        request.setType(proto.IMRequestType.IMMT_HELLO);
        im.sendRequest(request);
    },
    onOpen : function (evt) {
        console.log("IM CONNECTED");
        im.init();
    },
    onClose : function (evt) {
        console.log("IM DISCONNECTED");
        im.isInited = false;
    },
    onMessage : function (evt) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(evt.data);
        reader.onload = function (e) {
            var buf = new Uint8Array(reader.result);
            try{
                var pb = proto.IMResponse.deserializeBinary(buf)
                var type = pb.getType();
                switch(type){
                    case proto.IMResponseType.IMEST_HELLO:
                         im.isInited = true;
                         if('function' == typeof im.cbOnInited){
                            im.cbOnInited();
                         }
                         break;
                    case proto.IMResponseType.IMEST_OK : break;
                    case proto.IMResponseType.IMEST_REPLY :
                        im.addMessage(pb.getReply(),true);
                    break;
                }
            }catch(e){
                console.log("parse protobuf message failed!")
                console.log(evt.data)
            }
        }
    },
    onError : function (evt) {
        console.log('<span style="color: red;">ERROR:</span> ' + evt.data);
    },
    getCurrTimeStr : function(){
        var curDate = new Date();
        var curMonth = curDate.getMonth() + 1;  //获取当前月份(0-11,0代表1月)
        var curDay = curDate.getDate();       //获取当前日(1-31)
        var curHour = curDate.getHours();      //获取当前小时数(0-23)
        var curMinute = curDate.getMinutes();   // 获取当前分钟数(0-59)
        var curSec =curDate.getSeconds();      //获取当前秒数(0-59)
        return (curMonth < 10 ? ("0" + curMonth) : curMonth) + "-" + 
                    (curDay < 10 ? ("0" + curDay) : curDay) + " " +
                    (curHour < 10 ? ("0" + curHour) : curHour) + ":" +
                    (curMinute < 10 ? ("0" + curMinute) : curMinute) + ":" +
                    (curSec < 10 ? ("0" + curSec) : curSec);
    },
    sendedCount : 0,
    addMessage : function(msg,isReply){
        im.messages.push({time : im.getCurrTimeStr(), msg : msg, isReply : isReply});
        console.log(im.messages);
        console.log(im.sendedCount++);
    },
    sendMessage : function(msg){
        if(im.isInited){
            im.addMessage(msg,false);
            var request = new proto.IMRequest();
            request.setType(proto.IMRequestType.IMMT_SAY);
            request.setSay(msg);
            im.sendRequest(request);
            return true;
        }else{
            return false;
        }
    }
};

window.addEventListener("load", im.initSocket, false);