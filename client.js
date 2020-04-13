var http = require('http');
var qs = require('querystring');

let options = {                     
    hostname: 'localhost',
    port: '80',
    path: '/turnOffServer',
    method: 'POST'
};

let arg = process.argv[2].toString();                   //Obrada argumenta
if(arg.startsWith("off")){
    let timeToOff = arg.split(",")[1];
    if(timeToOff=="" || timeToOff==undefined){
        timeToOff = 5;
    }
    TurnOff(timeToOff);
}else if(arg=="on"){
    TurnOn();
}

function TurnOff(timeToOff){                    //Startovanje gasenja servera iz konzolne aplikacije
    let data = qs.stringify(
        {time:timeToOff+""}
    );
    let request = http.request(options, function (response) {
        HandleResponse(response);
    });
    request.write(data);
    request.end();
    function HandleResponse(res){
        response = "";
        res.on("data",function(data){
            response+=data;
        });
        res.on("end",function(){
            console.log(response);
        })
    }
}
function TurnOn(){                              //Paljenje servera iz konzolne aplikacije
    options.path = '/turnOnServer'              //Izmena za ukljucivanje, sve ostalo je isto
    let request = http.request(options, function (response) {
        HandleResponse(response);
    }).end();
    function HandleResponse(res){
        response = "";
        res.on("data",function(data){
            response+=data;
        });
        res.on("end",function(){
            console.log(response);
        })
    }
}
