const mongodb = require("mongoose");
mongodb.connect("mongodb://127.0.0.1:27017/DrunkVenti", {useNewUrlParser: true, useUnifiedTopology: true});


const TweetSchema = mongodb.Schema({userid: String, tweetid: String, tweettext: String});
const Tweets = mongodb.model("Tweets",{guild_id: String, tweets: [TweetSchema]})

const ConfigSchema = mongodb.Schema({
        guild_id: String,
        news_channel: String,
        reminder_channel: String
    }
)

const Config = mongodb.model("Config", ConfigSchema);

module.exports = {Tweets, TweetSchema, Config};