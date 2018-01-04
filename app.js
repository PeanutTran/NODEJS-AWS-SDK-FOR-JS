var express = require('express');
var app = express();
var serv = require('http').Server(app);
var awsIot = require('aws-iot-device-sdk');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('./utils/iot-properties.file');

var port = 80;

var connectedToAWS = false;

var nodes = new Array();


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
    console.log('=================AWS CONNECTION ESTABLISHED=================');
    connectedToAWS = true;
});

serv.listen(port);

console.log("Server started on port " + port);

app.get('/data/:SHTtemp/:SHThumid/:BMPtemp/:BMPpressure/:batteryVoltage/:DSvelocity/:DSdirection/:DStemp/:sec/:min/:hr/:day/:month/:visibleLight/:irLight/:uvIndex/:ID/', function(req, res){
    var currentTime = new Date(Date.now());

    console.log("Received data from node-" + req.params.ID + " on " + (parseInt(currentTime.getMonth())+1) + "/" + currentTime.getDate() + "/" + (parseInt(currentTime.getYear())+1900) + " at " + currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds() + ", data collected on " + req.params.month + "/" + req.params.day + "/" + (parseInt(currentTime.getYear())+1900) + " at " + req.params.hr + ":" + req.params.min + ":" + req.params.sec);
    
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
        console.log("Unable to publish data to AWS.")
    }
    res.status(200).send("Success"); //Send the node a confirmation of receipt.
    
});

app.get('*', function(req, res){
    console.log(req);
    res.send(200);
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
