'use strict';
var config = require('./config');

let util = require('util');
let http = require('http');
let Bot  = require('@kikinteractive/kik');

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
        message.reply(`Hi ${user.firstName}!`);
        console.log("New session from  " + user.firstName);
    });
    
    message.reply('This is a very basic Zork client on Kik, inspired by the May 14, 2016 avc.com post');
    message.reply('The kik bot was built by Rob Underwood using node.js, mostly as an experiment');
    message.reply('Zork itself is being served up to this app by an API created by Tim Lefler. See http://tlef.ca/a/zork');
    message.reply('A list of Zork commands is available at http://zork.wikia.com/wiki/Command_List. Try typing \'look\' if you don\'t know where to start');
    console.log("The chatId is " + message['chatId']);
    
});


bot.onTextMessage((message) => {
    // we will use the Kik username as our session id when we post to the zork API
    var session_from = message.from;
    
    // the following commands is needed for multi-word commands with spaces
    var command = message.body.split(' ').join('+');
    
    //there is a title, a locatiom, and a message returned from JSON
    //this following variable holds the message
    var tlefResponse_message;

    // this variable holds the current location
    var currLocation;
    
    // Create the URL to return the Zork command
    var zork_url = "http://tlef.ca/projects/restful-frotz/?play&data_id=zork1&session_id="+ session_from + "&command=" + command;
    
    // Get the response from the Zork API
    http.get(zork_url, function(res){
        var body = '';
        res.on('data', function(chunk){
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


            console.log("User " + message.from + " is presently in " + currLocation);
     
        });
    
        
    }).on('error', function(e){
      console.log("Got an error: ", e);
    });
 
});



// Set up your server and start listening
let server = http
    .createServer(bot.incoming())
    .listen(process.env.PORT || 8080);
    
console.log('Server started on port ' + (process.env.PORT || 8080));
console.log('The Api key is ' + bot.apiKey);
