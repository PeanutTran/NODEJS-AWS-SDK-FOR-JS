var express = require('express');
var app = express();
var serv = require('http').Server(app);
var port = 80;
var io = require('socket.io')(serv, {});
var deltaT = 2000;
var updateReady = false;
var awsIot = require('aws-iot-device-sdk');
var PropertiesReader = require('properties-reader');

var connectedToAWS = false;

var nodes = new Array();

var SOCKET_LIST = {};

var properties = PropertiesReader('./utils/iot-properties.file');

const device = awsIot.device ({
"host": properties.get('host'),
"port": properties.get('port'),
"clientId": properties.get('clientId'),
"thingName": properties.get('thingName'),
"caPath": properties.get('caPath'),
"certPath": properties.get('certPath'),
"keyPath": properties.get('keyPath'),
"region": properties.get('region')
});

device.on('connect', function() {
    console.log('\n=================AWS CONNECTION ESTABLISHED=================\n');
    connectedToAWS = true;
});


//This is a node object, used to represent the data received from a node in the field.
var node = function(SHTtemp, SHThumid, BMPtemp, BMPpressure, batteryVoltage, DSvelocity, DSdirection, DStemp, sec, min, hr, day, month, visibleLight, irLight, uvIndex, ID){ 
    updateTime = new Date(2017, month, day, hr, min, sec);
    var self = {
        temp1: SHTtemp,
        humidity: SHThumid,
        temp2: BMPtemp,
        pressure: BMPpressure,
        voltage: batteryVoltage,
        velocity: DSvelocity,
        direction: DSdirection,
        temp3: DStemp,
        lastUdate: updateTime,
        VB: visibleLight,
        IR: irLight,
        UV: uvIndex,
        uniqueID: ID
    }
    self.update = function(SHTtemp, SHThumid, BMPtemp, BMPpressure, batteryVoltage, DSvelocity, DSdirection, DStemp, sec, min, hr, day, month, visibleLight, irLight, uvIndex){
        updateTime = new Date(2017, month, day, hr, min, sec);
        self.temp1= SHTtemp;
        self.humidity= SHThumid;
        self.temp2= BMPtemp;
        self.pressure = BMPpressure;
        self.voltage = batteryVoltage;
        self.velocity = DSvelocity;
        self.direction = DSdirection;
        self.temp3 = DStemp;
        self.lastUpdate = updateTime;
        self.VB = visibleLight;
        self.IR = irLight;
        self.UV = uvIndex;
    }
    //console.log(self.lastUdate);
    return self;
}




app.use('/client', express.static(__dirname + '/client'));

serv.listen(port);

console.log("Server started on port " + port);


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/index.js', function(req, res){
    res.sendFile(__dirname + '/client/index.js');
});

app.get('/data/:SHTtemp/:SHThumid/:BMPtemp/:BMPpressure/:batteryVoltage/:DSvelocity/:DSdirection/:DStemp/:sec/:min/:hr/:day/:month/:visibleLight/:irLight/:uvIndex/:ID/', function(req, res){
    var currentTime = new Date(Date.now());
    console.log("Received data from node-" + req.params.ID + " on " + (parseInt(currentTime.getMonth())+1) + "/" + currentTime.getDate() + "/" + (parseInt(currentTime.getYear())+1900) + " at " + currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds() + ", data collected on " + req.params.month + "/" + req.params.day + "/" + (parseInt(currentTime.getYear())+1900) + " at " + req.params.hr + ":" + req.params.min + ":" + req.params.sec);
    
    updateReady = true;
    if(contains(nodes, req.params.ID)){
        nodes[getIndexFromID(nodes, req.params.ID)].update(  req.params.SHTtemp, 
                                                             req.params.SHThumid, 
                                                             req.params.BMPtemp,
                                                             req.params.BMPpressure,
                                                             req.params.batteryVoltage,
                                                             req.params.DSvelocity,
                                                             req.params.DSdirection,
                                                             req.params.DStemp,
                                                             req.params.sec,
                                                             req.params.min,
                                                             req.params.hr,
                                                             req.params.day,
                                                             req.params.month,
                                                             req.params.visibleLight,
                                                             req.params.irLight,
                                                             req.params.uvIndex
                                                          );
    }else{
        nodes.push(
            new node(req.params.SHTtemp, 
                     req.params.SHThumid, 
                     req.params.BMPtemp,
                     req.params.BMPpressure,
                     req.params.batteryVoltage,
                     req.params.DSvelocity,
                     req.params.DSdirection,
                     req.params.DStemp,
                     req.params.sec,
                     req.params.min,
                     req.params.hr,
                     req.params.day,
                     req.params.month,
                     req.params.visibleLight,
                     req.params.irLight,
                     req.params.uvIndex,
                     req.params.ID));
    }
    
    if(connectedToAWS){
        device.publish('sensor_data', JSON.stringify(
            { "SHTtemp"       : req.params.SHTtemp, 
              "SHThumid"      : req.params.SHThumid, 
              "BMPtemp"       : req.params.BMPtemp,
              "BMPpressure"   : req.params.BMPpressure,
              "batteryVoltage": req.params.batteryVoltage,
              "DSvelocity"    : req.params.DSvelocity,
              "DSdirection"   : req.params.DSdirection,
              "DStemp"        : req.params.DStemp,
              "sec"           : req.params.sec,
              "min"           : req.params.min,
              "hr"            : req.params.hr,
              "day"           : req.params.day,
              "month"         : req.params.month,
              "visibleLight"  : req.params.visibleLight,
              "irLight"       : req.params.irLight,
              "uvIndex"       : req.params.uvIndex,
              "ID"            : req.params.ID
            }
        ));
        console.log("Succesfully published data to AWS.");
    }else{
        console.log("Received an update from a node but not connected to AWS.")
    }
    
    res.status(200).send("Success"); //Send the node a confirmation of receipt.
    
    updateReady = true;
});


io.sockets.on('connection', function(socket){

    socket.id = Math.floor(Math.random()*1000000);
    socket.toRemove = false;
    SOCKET_LIST[socket.id] = socket;
    socket.emit('nodeupdate', nodes);//Get the newly connected user up-to-date with all the data strings sent by nodes.
    
    var currentTime = new Date(Date.now());
    console.log("Connection from " + socket.request.connection._peername.address + " on " + (parseInt(currentTime.getMonth())+1) + "/" + currentTime.getDate() + "/" + (parseInt(currentTime.getYear())+1900) + " at " + currentTime.getHours() + ":" + currentTime.getMinutes() + ". " + numberOfObjects(SOCKET_LIST) + " users currently connected.");
    

    socket.on('disconnect', function(){ //This is executed when a socket disconnects, so the server doesn't send packages to sockets that don't exist anymore.
        var currentTime = new Date(Date.now());
        delete SOCKET_LIST[socket.id];
        var currentTime = new Date(Date.now());
        console.log(socket.request.connection._peername.address + " disconnected on " + (parseInt(currentTime.getMonth())+1) + "/" + currentTime.getDate() + "/" + (parseInt(currentTime.getYear())+1900) + " at " + currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds() + ". " + numberOfObjects(SOCKET_LIST) + " users currently connected.");    
    });
});
    
var contains = function(arr, ID){ //This was written to check the nodes array for whether or not a certain node exists already.
    for(var i in arr){
        if(arr[i].uniqueID == ID){
            return true;
        }
    }
    return false;
}

var numberOfObjects = function(list){ //This function counts the number of objects in a list.
    var count = 0;
    for(var i in list) count++;
    return count;
}

var getIndexFromID = function(arr, ID){ //This returns the index of an element in the nodes array using a unique ID each node has.
    for(var i in arr){
        if(arr[i].uniqueID == ID){
            return i;
        }
    }
    return -1;
}
setInterval(function(socket){ // This is a function that is called every 'tick'.   
    if(updateReady){
        console.log("Sending update to all connected clients.");
        for(var i in SOCKET_LIST){ //This loop sends a package with the now updated curve list to every socket currently connected to the server.
            var socket = SOCKET_LIST[i];
            socket.emit('nodeupdate', nodes);
        }  
    }
    updateReady = false;
   
 }, deltaT);
