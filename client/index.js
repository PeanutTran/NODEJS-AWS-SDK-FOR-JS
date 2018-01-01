var socket = io();

//SHTtemp/:SHThumid/:BMPtemp/:BMPpressure/:batteryVoltage/:DSvelocity/:DSdirection/:DStemp/:sec/:min/:hr/:day/:month/:visibleLight/:irLight/:uvIndex/:ID

socket.on('nodeupdate', function(data){
    for(var i in data){
        var currentNode = document.getElementById('node-' + data[i].uniqueID);
        timeOfUpdate = new Date(data[i].lastUpdate);
        nodestring = "<div class=\"nodeid\">"; 
        nodestring += "node-" + data[i].uniqueID;
        nodestring += "</div>";
        nodestring += "<div class=\"nodedata\">";
        nodestring += "TEMP ONE:  <b>" + data[i].temp1 + "C</b><br>";
        nodestring += "TEMP TWO:  <b>" + data[i].temp2 + "C</b><br>";
        nodestring += "TEMP THR:  <b>" + data[i].temp3 + "C</b><br>";
        nodestring += "HUMIDITY:  <b>" + data[i].humidity + "%</b><br>";
        nodestring += "PRESSURE:  <b>" + data[i].pressure + "</b><br>";
        nodestring += "BATTERY :  <b>" + data[i].voltage + "V</b><br>";
        nodestring += "DS SPEED:  <b>" + data[i].velocity + "m/s</b><br>";
        nodestring += "DS DIREC: <b>" + data[i].direction + "</b><br>";
        nodestring += "VISIBLE : <b>" + data[i].VB + "</b><br>";
        nodestring += "IR LIGHT: <b>" + data[i].IR + "</b><br>";
        nodestring += "UV LIGHT: <b>" + data[i].UV + "</b><br>";
        nodestring += "</div>";
        nodestring += "<div class=\"nodedate\">";
        nodestring += "Time of last update:\n";
        nodestring += (parseInt(timeOfUpdate.getMonth())+1) + "/" + timeOfUpdate.getDate() + "/" + (parseInt(timeOfUpdate.getYear())+1900) + " at " + timeOfUpdate.getHours() + ":" + timeOfUpdate.getMinutes() + ":" + timeOfUpdate.getSeconds();
        nodestring += "</div>";
        
        if(currentNode){ //Update existing node
            currentNode.innerHTML = nodestring;
        }else{
            
            newhtml = document.createElement('div');
            newhtml.className = "node";
            newhtml.id = "node-" + data[i].uniqueID
            newhtml.innerHTML = nodestring;
            
            document.getElementById('nodewrapper').appendChild(newhtml);
            

        }
    }
});