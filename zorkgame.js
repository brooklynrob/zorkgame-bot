'use strict';
var config = require('./config');

let util = require('util');
let fs = require("fs");
let http = require('http');
let https = require('https');
let Bot  = require('@kikinteractive/kik');

var logFile = fs.createWriteStream('zorklog', { flags: 'a' });


var path = require('path');
var express = require('express');

//For Facebook
//How would I respond based on what the incoming URL is -- take different action based on the route... e.g., /kik, /facebook
//var app = express();

// Configure the bot API endpoint, details for your bot
let bot = new Bot({
    username: config.kik.username,
    apiKey: config.kik.apiKey,
    baseUrl: config.app.baseUrl
});

bot.updateBotConfiguration();

bot.onStartChattingMessage((message) => {
    
    bot.getUserProfile(message.from)
    .then((user) => {
        
        var new_session_message = "New session from  " + user.firstName;
        var log_arguments = [new_session_message];
            
        logFile.write(util.format.apply(null, log_arguments) + '\n');
        console.log(new_session_message);

        
    });
    
    message.reply('This is a very basic Zork client on Kik, inspired by the May 14, 2016 avc.com post');
    message.reply('The kik bot was built by Rob Underwood using node.js, mostly as an experiment');
    message.reply('Zork itself is being served up to this app by an API created by Tim Lefler. See http://tlef.ca/a/zork');
    message.reply('A list of Zork commands is available at http://zork.wikia.com/wiki/Command_List ... Try typing \'look\' or \'help\' if you don\'t know where to start');
    console.log("The chatId is " + message['chatId']);
    
});


bot.onTextMessage((message) => {

// we will use the Kik username as our session id when we post to the zork API
    var session_from = message.from;
    
    var log_arguments = ["Message Received from: ", session_from];
    logFile.write(util.format.apply(null, log_arguments) + '\n')
    
    // the following commands is needed for multi-word commands with spaces
    var command = message.body.split(' ').join('+');
    
    var log_arguments = ["Command is",command];
    logFile.write(util.format.apply(null, log_arguments) + '\n')
    
    
    if (session_from == 'somerandomguy638') {
       message.reply('Should you be studying, Taka?');
    }
    
    if (session_from == 'zafra42') {
       message.reply('How is the coop?');
    }
    
    // custom message in order to provide help
    if ((message.body == 'help') || (message.body == 'Help') || (message.body == 'H') || (message.body == 'h')) {
      message.reply('Zork accepts a surpisingly wide set of commands including directions such as \'south\' and verbs like \'take\' and \'inventory\'. Direct objects are usually accepted.');
      message.reply('A list of Zork commands is available at http://zork.wikia.com/wiki/Command_List');
    }
    
    //there is a title, a locatiom, and a message returned from JSON
    //this following variable holds the message
    var tlefResponse_message;

    var currLocation;
    
    // Create the URL to return the Zork command
    var zork_url = "https://tlef.ca/projects/restful-frotz/?play&data_id=zork1&session_id="+ session_from + "&command=" + command + "&output-webhook=" + bot.baseUrl;
    log_arguments = ["URLs is ",zork_url];
    logFile.write(util.format.apply(null, log_arguments) + '\n')
 
    var body = '';
    // Get the response from the Zork API
    https.get(zork_url, function(res){
        //var req = http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            console.log('BODY: ' + chunk);
            body += chunk;
        });
        
    res.on('end', function(){
            var tlefResponse = JSON.parse(body);
            
            if (tlefResponse.location != null) {
                //if (tlefResponse.location != currLocation) {
                    message.reply(tlefResponse.location);
                //}
                currLocation = tlefResponse.location;
            }
            
            //sometimtes the title and location are the same, in which case we don't want to say the same thing twice
            if ((tlefResponse.title !== null) && (tlefResponse.title !== tlefResponse.location)) {
                message.reply(tlefResponse.title);
            }
            
            
            if ((tlefResponse.message !== undefined) && (tlefResponse.message !== "")) {
                // End of line \n were giving problems so parsed them out
                tlefResponse_message = tlefResponse.message.replace(/(\r\n|\n|\r)/gm,"");
                //console.log("tlefResponse_message body is " + tlefResponse_message);
                message.reply(tlefResponse_message);
            }

            var current_loc_message = "User " + message.from + " is presently in " + currLocation;
            var log_arguments = [current_loc_message];
            
            logFile.write(util.format.apply(null, log_arguments) + '\n');
            console.log(current_loc_message);
  
     
        });
        
    
        
    }).on('error', function(e){
      console.log("Got an error: ", e);
    });



 
});



// Set up your server and start listening
// Set up your server and start listening
let server = http
    .createServer(bot.incoming())
    .listen(process.env.PORT || 8080);
    

console.log('Server started on port ' + (process.env.PORT || 8080));
console.log('The Api key is ' + bot.apiKey);
var log_arguments = ["Server Starting"];
logFile.write(util.format.apply(null, log_arguments) + '\n')


