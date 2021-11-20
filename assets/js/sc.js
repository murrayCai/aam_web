var wsScUri = "ws://192.168.10.188:16678/";
var syncTimeTryMax = 10;
var sc = {
    socket : undefined,
    isInited : false,
    msgId : 1,
    messages : [],
    imageData : {},
    diffServMilliseconds : 0,
    currTrySyncTimeCount : 0,
    syncTimes : [],
    initSocket : function(){
        sc.socket = new WebSocket(wsScUri);
        sc.socket.onopen = function (evt) {
            sc.onOpen(evt)
        };
        sc.socket.onclose = function (evt) {
            sc.onClose(evt)
        };
        sc.socket.onmessage = function (evt) {
            sc.onMessage(evt)
        };
        sc.socket.onerror = function (evt) {
            sc.onError(evt)
        };
    },
    sendRequest : function(request){
        request.setMsgid(this.msgId++);
        request.setClienttype(proto.SCClientType.SCCT_WEB);
        sc.socket.send(request.serializeBinary().buffer);
    },
    init : function(){
        var request = new proto.SCRequest();
        request.setType(proto.SCRequestType.SCMT_HELLO);
        sc.sendRequest(request);
    },
    syncTime : function(){
        try {
            var reqTime = new proto.SCTime();
            var timestamp = Date.now();
            reqTime.setSecond(parseInt(timestamp / 1000));
            reqTime.setMillisecond(timestamp % 1000);

            var request = new proto.SCRequest();
            request.setType(proto.SCRequestType.SCMT_SYNC_TIME);
            request.setTime(reqTime);
            sc.sendRequest(request);
        } catch (error) {
            console.log("syncTime : " + error)
        }

    },
    onOpen : function (evt) {
        console.log("SC CONNECTED");
        sc.init();
    },
    onClose : function (evt) {
        console.log("SC DISCONNECTED");
        sc.isInited = false;
        sc.initSocket();
    },
    onGetServerTime : function(pb){
        try {
            var reqTime = pb.getReqtime().getSecond() * 1000 + pb.getReqtime().getMillisecond();
            var servTime = pb.getServtime().getSecond() * 1000 + pb.getServtime().getMillisecond();
            sc.syncTimes.push([reqTime,Date.now(),servTime]);
            console.log(sc.syncTimes);
            if(++sc.currTrySyncTimeCount < syncTimeTryMax){
                sc.syncTime();
            }else{
                var totalDiffTime = 0,totalGoodDiffTime = 0,goodDiffCount = 0;
                for(var i = 0; i < sc.syncTimes.length; i++){
                    if(sc.syncTimes[i].length < 3) continue;
                    var requestTime = sc.syncTimes[i][1] - sc.syncTimes[i][0];
                    if(requestTime < 50){
                        totalGoodDiffTime +=  sc.syncTimes[i][1] - sc.syncTimes[i][2] - parseInt(requestTime / 2);
                        goodDiffCount++;
                    }else{
                        totalDiffTime += sc.syncTimes[i][1] - sc.syncTimes[i][2] - parseInt(requestTime / 2);
                    }
                }
                if(goodDiffCount > 0){
                    sc.diffServMilliseconds = parseInt(totalGoodDiffTime / goodDiffCount);
                }else{
                    sc.diffServMilliseconds = parseInt(totalDiffTime / sc.syncTimes.length);
                }
                sc.isInited = true;
                console.log("diff server milliseconds : " + totalGoodDiffTime + "/" + goodDiffCount + sc.diffServMilliseconds);
            }
        } catch (error) {
            console.log(error);
        }
        
    },
    onMessage : function (evt) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(evt.data);
        reader.onload = function (e) {
            var buf = new Uint8Array(reader.result);
            try{
                var pb = proto.SCResponse.deserializeBinary(buf)
                var type = pb.getType();
                switch(type){
                    case proto.SCResponseType.SCEST_HELLO:
                         sc.syncTime();
                         break;
                    case proto.SCResponseType.SCEST_OK : break;
                    case proto.SCResponseType.SCEST_SYNC_TIME :
                        sc.onGetServerTime(pb);
                    break;
                    case proto.SCResponseType.SCEST_SCREEN_IMAGE :
                        sc.onRecvedImage(pb.getImage());
                    break;
                }
            }catch(e){
                console.log("SC parse protobuf message failed!")
                console.log(evt.data)
            }
        }
    },
    onError : function (evt) {
        console.log('<span style="color: red;">ERROR:</span> ' + evt.data);
    },
    transformUint8ArrayToBase64 : function (array) {
        var binary = "";
        for (var len = array.byteLength, i = 0; i < len; i++) {
          binary += String.fromCharCode(array[i]);
        }
        return window.btoa(binary).replace(/=/g, "");
    },
    refreshView : function(data) {
        var timestamp = Date.now();
        var dataBase64 = sc.transformUint8ArrayToBase64(data.data);
        document.getElementById("sc_img").src = "data:image/png;base64," + dataBase64;
        var tt = data.startSecond * 1000 + data.startMillisecond;
        document.getElementById("tv_disp").innerText = "SIZE : [" + data.totalSize + "B]   FPS : " + (timestamp - tt - sc.diffServMilliseconds) + "ms";
    },
    onRecvedImage : function(image){
        try{
            var id = image.getId();
            var index = image.getIndex();
            var total = image.getTotal();
            var data = image.getData();
            var totalSize = image.getTotalsize();
            var second = image.getSecond();
            var millisecond = image.getMillisecond();
            if(1 == index){
                sc.imageData = {};
                sc.imageData.data = new Uint8Array(totalSize);
                sc.imageData.offset = 0;
                sc.imageData.totalSize = totalSize;
                sc.imageData.startSecond = second;
                sc.imageData.startMillisecond = millisecond;
            }
            for(var i = 0;i < data.length; i++){
                sc.imageData.data[sc.imageData.offset++] = data[i];
            }

            // console.log(data)
            if(index == total){
                sc.refreshView(sc.imageData);
            }else if(index < total){
            }else{
                console.log("recved image data error : " + index + ">" + total)
            }
        }catch(e){
            console.log("onRecvedImage failed!");
        }

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
        sc.messages.push({time : im.getCurrTimeStr(), msg : msg, isReply : isReply});
        console.log(im.messages);
        console.log(im.sendedCount++);
    },
    sendMessage : function(msg){
        if(sc.isInited){
            sc.addMessage(msg,false);
            var request = new proto.IMRequest();
            request.setType(proto.IMRequestType.IMMT_SAY);
            request.setSay(msg);
            sc.sendRequest(request);
            return true;
        }else{
            return false;
        }
    }
};

window.addEventListener("load", sc.initSocket, false);
// window.addEventListener("beforeunload",sc.closeSocket,false);