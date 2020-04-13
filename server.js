var http = require('http');
var fs = require("fs");
var url = require("url");
var qs = require('querystring');
const Events = require('events');
const em = new Events();

let data = [{ name: "Bojan", surname: "Stojkovic", department: "NRT", index: "NRT-4/17" },      //Podaci
{ name: "Petar", surname: "Petrovic", department: "RT", index: "RT-1/17" },
{ name: "Marko", surname: "Markovic", department: "IS", index: "IS-1/17" },
{ name: "Nikola", surname: "Nikolic", department: "NRT", index: "NRT-1/17" }]


let work = true;                                                //"Gasenje servera", server uvek radi ali ako je work false onda ne opsluzuje klijente
var server = http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    if(q.pathname == "/turnOnServer"){                  //Dogadjaj paljenja servera, node klijent jedino moze da upali server, pokretanje "node client on"
        em.emit("turnOn",{req:req,res:res});
    }
    if(!work){
        res.writeHead(200);
        res.end("Server is disabled");
        return;
    }
    if (q.pathname == "/style.css") {         //Css fajl na serveru
        CssFile(res);
    }
    else if (q.pathname.startsWith("/showStudent")) {           //GET
        console.log(q.query.index);
        ShowStudent(q.query.index, res);
    }
    else if (q.pathname.startsWith("/deleteStudent")) {     //GET
        DeleteStudent(q.query.index, res);
    }
    else if (q.pathname == "/addNew") {             //GET
        ShowAddForm(res);
    }
    else if (q.pathname == "/newStudent") {      //POST
        CreateNewStudent(req, res);
    }
    else if(q.pathname == "/turnOffServer")         //POST   startuje gassenje servera
    {
        em.emit("turnOff",{req:req,res:res});               //Dogadjaj gasenja servera
    }
    else if(q.pathname == "/getTimeForShutdown"){   //POST
        GetTimeToShutDown(req,res);
    }
    else {                                                                  //GET pocetna ruta, ili bilo koja nevalidna
        let textForRender = fs.readFileSync("./index.html").toString();
        let result = View(textForRender, data, 0);
        res.writeHead(200);
        res.end(result);
    }
}).listen(80);

function CssFile(res) {                                     //Vraca css fajl
    fs.readFile("style.css", function (err, data) {
        if (err) {
            console.error(err);
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
}
function ShowStudent(index, res) {                                     //Prikazuje odabranog studenta, sa web klijenta
    let textForRender = fs.readFileSync("./index.html").toString();
    let student = data.filter(s=>s.index==index);
    res.writeHead(200)
    res.end(View(textForRender, student, 1));
}
function DeleteStudent(index, res) {                        //Brise odabranog studenta, sa web klijenta
    data = data.filter(s=>s.index!=index);
    let textForRender = fs.readFileSync("./index.html").toString();
    res.writeHead(200);
    res.end(View(textForRender, data, 0));
}
function CreateNewStudent(req, res) {                   //Krejiranje kovog studenta, sa web klijenta
    let body = '';
    req.on('data', function (data) {
        body += data;
    });
    req.on('end', function () {
        let newStudent = qs.parse(body);
        data.push(newStudent);
        let textForRender = fs.readFileSync("./index.html").toString();
        res.writeHead(200);
        res.end(View(textForRender, data, 0));
    });
}
function ShowAddForm(res) {                                                 //Prikazuje web klijentu formu za dodavanje studenta
    let textForRender = fs.readFileSync("./addform.html").toString();
    res.write(textForRender);
    res.end();
}

let timer = null;                               
let counter = 0;          
em.on("turnOff",function(data){     //Dogadaj gasenja servera, moze biti pozvano sa web klijenta ili sa node client off,[vreme u sekundama] (off,5);
    console.log("Server disabling event");
    clearInterval(timer);
    let body = "";
    data.req.on("data",function(data){
        body+=data;
    })
    data.req.on("end",function(){
        counter = parseInt(qs.parse(body).time);
        console.log(body);
        timer = setInterval(()=>{
            console.log(counter)
            if(counter==0){
                console.log("Server disabled");
                work = false;
                clearInterval(timer);
                return;
            }
            counter--;
        },1000);
        data.res.write("Disabling started...");
        data.res.end();
    })
});
em.on("turnOn",function(data){                      //Ukljucivanje servera sa node klijenta, node client on
    console.log("Server enabling event");
    work = true;
    clearInterval(timer);
    data.res.write("Server is enabled");
    data.res.end();
    console.log("Server enabled");
})
function GetTimeToShutDown(req,res){            //Vraca web klijentu vreme do gasenja servera
    let body = "";
    req.on("data",function(data){
        body+=data;
    })
    req.on("end",function(){
        res.write(counter+"");
        res.end();
    })
}

function View(file, data, n) {           //Kreiranje strane za podatke i for petlju {data} {myforloop}{endmyforloop}
    let count = data.length;
    file = file.replace("{display3}", n == 1 ? "none" : "block");
    let start = file.indexOf("{myforloop}");            //10
    let end = file.indexOf("{endmyforloop}") + 14;        //14
    let before = file.substr(0, start);
    let after = file.substr(end, file.length - end);
    let midle = file.substr(start + 10 + 1, end - 14 - (start + 10 + 1));
    let result = before;
    for (let i = 0; i < count; i++) {
        let help = midle;
        help = help.replace("{name}", data[i].name);
        help = help.replace("{surname}", data[i].surname);
        help = help.replace("{department}", data[i].department);
        help = help.replace(new RegExp("{index}", 'g'), data[i].index);
        help = help.replace("{display1}", n == 1 ? "none" : "block");
        help = help.replace("{display2}", n == 1 ? "block" : "none");
        result += help;
    }
    return result + after;
}