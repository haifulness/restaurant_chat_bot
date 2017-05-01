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
var default_location = "Chicago";
var results_limit = "5";

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var output = '';
var response_context = {};

var controller = Botkit.slackbot({
    debug: false
    //require_delivery: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

var Conversation = require('watson-developer-cloud/conversation/v1');

// Set up Conversation service wrapper.
var conversation = new Conversation({
  username: process.env.username,
  password: process.env.password,
  path: { workspace_id: process.env.workspace },
  url: 'https://gateway.watsonplatform.net/conversation/api',
  version_date: '2016-10-21',
  version: 'v1'
});

// Start conversation with empty message.
conversation.message({}, processResponse);

function processResponse(err, response) {
    // If an intent was detected, log it out to the console.
    console.log("INTENTS: " + response.intents + "\n");
    if (response.intents.length > 0) {

        // What will be sent back to user
        var bot_response = "";  


        if (response.intents[0].intent == "Food") {
            console.log("CATEGORY RESPONSE: " + response.output.text[0] + "\n================\n");
            var categories = "food," + response.output.text[0];
            var results = rapid.call('YelpAPI', 'getBusinesses', { 
                'accessToken': '_4Zt6rM00ZWHNhuIjmN7vGittFp5PoII9pZjidLmuCc2EAy2jTqPYCV2gnBN1c_SuxFMLkg4hnxL0FVz5Rz8G7jmfopiae2hrw-4VqiA6LX_lK3jOU5LkkFBWUL6WHYx',
                'term': '',
                'location': default_location,
                'latitude': '',
                'longitude': '',
                'radius': '',
                'categories': categories,
                'locale': '',
                'limit': results_limit,
                'offset': '',
                'sortBy': '',
                'price': '',
                'openNow': '',
                'openAt': '',
                'attributes': ''
             
            })

            .on('success', (payload)=>{
                console.log("RESULTS:")
                console.log(typeof(payload.businesses[0].name));
                console.log("=================");
                bot_response = payload.businesses[0].name;

                bot.say({
                    text: bot_response,
                    channel: '#cs421' 
                });

            }).on('error', (payload)=>{
                bot.say({
                    text: payload.status_msg.error.description,
                    channel: '#cs421' 
                });

            });
            

        };

        response_context = response.context;
    }
}

controller.on('ambient', function(bot, message) {
    conversation.message({
        input: { text: message.text },
        context: response_context
      }, 
      processResponse
    );
})

controller.hears(['hi', 'hello', 'bot', 'whats up', 'sup'], ['direct_message','direct_mention','mention'], function (bot, message) {
    //bot.reply(message, 'Hi there!');
    bot.say({
        text: "Hi there",
        channel: '#cs421' 
    });
});

/*

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });
*/

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
