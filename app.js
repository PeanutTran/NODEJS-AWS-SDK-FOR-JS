var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var ser = require('http').Server(app);
var AWS = require('aws-sdk');

AWS.config.loadFromPath('./config.json');

var iotData = new AWS.IotData({endpoint: 'a30ovrxliiw32u-ats.iot.ap-southeast-1.amazonaws.com'});
var iot = new AWS.Iot();

var port = 80;

ser.listen(port);

console.log("Server started on port " + port);

var params = {
    thingName: 'Meter-001', /* required */
    shadowName: 'DEVICE_SHADOW'
};

app.get('/data/:thing/:shadow', function(req, res){
    var params = {
        thingName: req.params.thing,
        shadowName: req.params.shadow,
    };
    iotData.getThingShadow(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);
        res.status(200).send(data.payload);
    });
});

app.get('/list-thing', function(req, res){
    var params = {
        attributeName: 'attribute',
        attributeValue: 'attribute_value',
        maxResults: 10,
        nextToken: null,
        usePrefixAttributeValue: false
      };
    iot.listThings(params, function (err, data) {
        if (err) {
            console.log(err, err.stack)
            return res.sendStatus(400);
        } else {
            console.log(data);
        }
        res.status(200).send(data.payload);
    });
});

app.get('/publish', function(req, res){
    var params = {
        topic: 'topic_2', /* required */
        payload: JSON.stringify({ message: 'message send from AWS device'})
      };
    iotData.publish(params, function (err, data) {
        if (err) {
            console.log(err, err.stack)
            return res.sendStatus(400);
        } else {
            console.log(data);
        }
        res.status(200).send(data.payload);
    });
});

app.post('/publish', function(req, res){
    const data = req.body;
    var params = {
        topic: data.topic, /* required */
        payload: JSON.stringify({ message: data.message})
      };
    iotData.publish(params, function (err, data) {
        if (err) {
            console.log(err, err.stack)
            return res.sendStatus(400);
        } else {
            console.log(data);
        }
        res.status(200).send(data.payload);
    });
});

app.post('/update-thing', function(req, res){
    const data = req.body;
    var params = {
        thingName: data.thingName, /* required */
        attributePayload: {
            attributes: {
                attribute: data.attributePayload.attributes.attribute,
            },
            merge: true
        },
        removeThingType: false,
    };
    iot.updateThing(params, function (err, data) {
        if (err) {
            console.log(err, err.stack)
            return res.sendStatus(400);
        } else {
            console.log(data);
        }
        res.status(200).send(data.payload);
    });
});


app.get('*', function(req, res){
    res.sendStatus(200);
});
