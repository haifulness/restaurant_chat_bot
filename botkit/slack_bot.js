/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it is running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// RapidAPI is used to help us simplify Yelp Fusion API connection
const rapidAPI_token = "c10b4173-cbf3-47c1-a35c-385dc88905c9";
const RapidAPI = new require('rapidapi-connect');
const rapid = new RapidAPI('cs421', rapidAPI_token);

// By default, we will only look for restaurants in Chicago.
// And we will list 3 restaurants at a time.
var default_location = "Chicago";
var results_limit = "3";
var radius = "100";
var sort_criteria = "distance";

// Return an error if the program cannot connect to the Slack bot
if (!process.env.bot_token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

// Setup botkit
var Botkit = require('./lib/Botkit.js');
var os = require('os');
var controller = Botkit.slackbot({ debug: true, });
var bot = controller.spawn({
    token: process.env.bot_token
}).startRTM();

// Set up Conversation service
var Conversation = require('watson-developer-cloud/conversation/v1');
var conversation = new Conversation({
  username: process.env.username,
  password: process.env.password,
  path: { workspace_id: process.env.workspace },
  url: 'https://gateway.watsonplatform.net/conversation/api',
  version_date: '2016-10-21',
  version: 'v1'
});

// Context of the response, which the bot bases on to choose the right response
var response_context = {};

// Start conversation with an empty input (a greeting message stored on
// Conversation service will be displayed)
conversation.message({}, processResponse);

// After that, the bot's response will be based on user input
controller.on('ambient', function(bot, message) {
    conversation.message({
        input: { text: message.text },
        context: response_context
      }, 
      processResponse
    );
});

// Main processing unit. This function handles user's input and returns response.
// This function also sends request to Yelp API to get a list of restaurants when
// user has chosen the preferences.
function processResponse(err, response) {

    // If an intent was detected
    if (response.intents.length > 0 && response.intents[0].intent == "Food") {
            
        // Prepare the category of the API request based on Yelp's requirement.
        // The response from Conversation service in this case is the cuisine
        // code according to user's preference.
        var categories = "food," + response.output.text[0];
        
        // API request
        var results = rapid.call('YelpAPI', 'getBusinesses', { 
            'accessToken': '_4Zt6rM00ZWHNhuIjmN7vGittFp5PoII9pZjidLmuCc2EAy2jTqPYCV2gnBN1c_SuxFMLkg4hnxL0FVz5Rz8G7jmfopiae2hrw-4VqiA6LX_lK3jOU5LkkFBWUL6WHYx',
            'term': '',
            'location': default_location,
            'latitude': '',
            'longitude': '',
            'radius': radius,
            'categories': categories,
            'locale': '',
            'limit': results_limit,
            'offset': '',
            'sortBy': sort_criteria,
            'price': '',
            'openNow': '',
            'openAt': '',
            'attributes': '' 
        })
        .on('success', (payload)=>{
            bot.say({
                text: display_result(payload),
                channel: '#cs421' 
            });
            /*
            if (payload.businesses.length > 0) {
                bot.say({
                    text: "Here are the best " + results_limit + " matches based on your prefences: \n",
                    channel: '#cs421' 
                });
                for (i = 0; i < payload.businesses.length; i++) {
                    bot.say({
                        text: "" + (i+1) + ". " + payload.businesses[i].name
                                 + "\n - Location: " + payload.businesses[i].location.display_address[0]
                                 + ", " + payload.businesses[i].location.display_address[1]
                                 + "\n - Phone: " + payload.businesses[i].display_phone
                                 ,
                        channel: '#cs421' 
                    });
                }
            } else {
                bot.say({
                    text: "No matching result",
                    channel: '#cs421' 
                });
            }*/

        }).on('error', (payload)=>{
            bot.say({
                text: payload.status_msg.error.description,
                channel: '#cs421' 
            });
        });

    } else {

        // Send raw response received from Conversation service to user
        bot.say({
            text: response.output.text[0],
            channel: '#cs421' 
        });
    }
    
    // Update context
    response_context = response.context;   
}


// Convert a list of restaurant to a string
function display_result(payload) {
    if (payload.length == 0) return "No matching result";

    var out = "Here are the best " + results_limit + " matches based on your prefences: \n";
    for (i = 0; i < payload.businesses.length; i++) {
        out += "" + (i+1) + ". " + payload.businesses[i].name
                     + "\n - Location: " + payload.businesses[i].location.display_address[0]
                     + ", " + payload.businesses[i].location.display_address[1]
                     + "\n - Phone: " + payload.businesses[i].display_phone
                     + "\n"
                     ;
    }
    return out;
}

// Provided by botkit
function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
