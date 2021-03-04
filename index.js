const Twitter =  require("./modules/twitter").Twitter;
const {Tweets, Config} = require("./modules/mongodb");
const Commands = require("./modules/commands");
require("dotenv").config();

const Discord = require('discord.js');
const client = new Discord.Client();
 

async function checkTweets(Tweet) {
	let tweets = await Tweets.find().exec();
	tweets.forEach(tweets => {
		if (tweets["errors"]) return;
		Config.find({guild_id: tweets["guild_id"]}).exec().then(config => {
			config = config[0];
			if (!config["news_channel"]) return;
			tweets["tweets"].forEach(tweet => {
				if (!tweet["userid"]) return;
				Twitter.getUserTweets(tweet["userid"]).then(json => {
					console.log(json);
					if (json["errors"]) return;
					if (json["data"][0]["id"] == tweet.tweetid) {
						console.log("No update")
						return;
					} 
					Tweets.updateOne({guild_id: tweets["guild_id"], tweets: { $elemMatch: { userid:tweet.userid}}}, {$set : {"tweets.$.tweetid":json["data"][0]["id"], "tweets.$.tweettext":json["data"][0]["text"]}}).exec();
					Twitter.getUsername(tweet.userid).then(userJSON => {
						postMessage(config["news_channel"],`https://twitter.com/${userJSON["data"]["username"]}/status/${json["data"][0]["id"]}`);
					})
					console.log("Update")
				})
			});
		})
	})
}

async function postMessage(channel_id, message){
	client.channels.cache.get(channel_id).send(message);
}

async function start(){
	setInterval(checkTweets, 1000*60*15, Tweets);
}


client.on('ready', () => {
	console.log('bot ready');
	start();
});

client.on("message", (message) => {
	if (message.content.startsWith("!dv")) {
		args = message.content.split(" ");
		Commands(client, args[1], message, Config);
	}
})

client.login(process.env.DISCORD_TOKEN);
