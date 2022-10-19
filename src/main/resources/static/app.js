var app = (function () {

    var dibujo =0;

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }

    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var addPoligonToCanvas = function (points) {
        console.log(points[1].x);
        var data = points;
        var canvas = document.getElementById("canvas");
        var line = canvas.getContext("2d");
        line.beginPath();
        line.fillStyle = '#f00';
        for (i = 0; i < data.length; i++) {
            line.moveTo(data[i].x, data[i].y);
            var j = i + 1 < data.length ? i + 1 : 0;
            line.lineTo(data[j].x, data[j].y);
        }
        line.closePath();
        line.fill();
        line.stroke();
    };


    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var publicPointAtTopic = function (point){
        stompClient.send("/app"+dibujo, {}, JSON.stringify(point));
        console.log("Se publico el punto "+ point);
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe("/topic" + dibujo, function (eventbody) {
                console.log(JSON.parse(eventbody.body));
                if (dibujo.includes("newpoint")) {
                    var point = JSON.parse(eventbody.body);
                    addPointToCanvas(point);
                }
                else{
                    addPoligonToCanvas(JSON.parse(eventbody.body));
                }
            });
        });

    };



    return {

        connect: function (dibujoCanvas) {
            var can = document.getElementById("canvas");
            //websocket connection
            var selecion = document.getElementById("conexion")
            dibujo = selecion.value + dibujoCanvas;
            connectAndSubscribe();
            alert("Te conectaste al "+selecion[selecion.selectedIndex].innerHTML + dibujoCanvas);
            if (dibujo.includes("newpoint")) {
                if (window.PointerEvent) {
                    can.addEventListener("pointerdown", function (evt) {
                        var point = getMousePosition(evt);
                        console.log(point);
                        addPointToCanvas(point);
                        publicPointAtTopic(point)
                    });
                }
            }
            else{
                var points = [];
                var i = 0;
                can.addEventListener("click", function (evt) {
                    var point = getMousePosition(evt);
                    points[i] = point;
                    i++;
                    if (i == 3) {
                        addPoligonToCanvas(points);
                        publicPointAtTopic(points);
                        points = [];
                        i = 0;
                    }
                });
            }
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            addPointToCanvas(pt);
            publicPointAtTopic(pt)
            //publicar el evento
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();