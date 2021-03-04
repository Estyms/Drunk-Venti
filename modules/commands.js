const { Message, Client } = require("discord.js");
const { Config, Tweets, TweetSchema } = require("./mongodb");
const { Twitter } = require("./twitter")

/**
 * @param { Client } client
 * @param { String } command 
 * @param { Config } Config 
 * @param { Message } message
 */
async function executeCommand(client, command, message, Config){
    let config = await Config.findOne({guild_id: message.guild.id}).exec();
    
    if ((await Tweets.find({guild_id:message.guild.id}).exec()).length == 0){
        await new Tweets({guild_id: message.guild.id}).save();
    } 
    if (!config) {
        config = new Config({guild_id: message.guild.id})
        await config.save();
    }
    
    switch(command){
        case "setNewsChannel": {
            if (config["news_channel"] == message.channel.id) 
            {
                message.reply("This channel is already the News Channel !");
                break;
            }
            if (config["reminder_channel"] == message.channel.id) {
                message.reply("This channel is already the Reminder Channel, choose another Text Channel !");
                break;
            } 
            Config.updateOne({guild_id: message.guild.id}, {news_channel: message.channel.id}).exec();
            message.reply("This channel is now set as the News Channel !");
            break;
        }

        case "setReminderChannel": {
            if (config["reminder_channel"] == message.channel.id) 
            {
                message.reply("This channel is already the Reminder Channel !");
                break;
            }
            if (config["news_channel"] == message.channel.id) {
                message.reply("This channel is already the News Channel, choose another Text Channel !");
                break;
            } 
            Config.updateOne({guild_id: message.guild.id}, {reminder_channel: message.channel.id}).exec();
            message.reply("This channel is now set as the Reminder Channel !");
            break;
        }

        case "addTwitterAccount": {
            if (!message.content.split(" ")[2].match(/^[a-zA-Z0-9_]{0,15}$/)){
                message.reply("This is not a twitter username.");
                break;
            }

            if (!config["news_channel"]) {
                message.reply("Please set News channel first with command ``!dv setNewsChannel`` !");
                break;
            }

            Twitter.getUserId(message.content.split(" ")[2]).then(json => {
                if (json["errors"]){
                    message.reply("This username does not exists.")
                    return;
                }
                Tweets.findOne({guild_id:message.guild.id, tweets:{$elemMatch : {userid:json["data"]["id"]}}}).exec().then(info=>{
                    if (info){
                        message.reply("This account is already tracked !");
                        return;
                    }
                    Twitter.getUserTweets(json["data"]["id"]).then( (res) => {    
                        console.log(res)              
                        if (res["errors"]) {
                            message.reply("This Account is invalid.");
                            return;
                        }  
                        let newTweet = {userid:json["data"]["id"]};
                        Tweets.updateOne({guild_id:message.guild.id}, {$push : {tweets: newTweet}}).exec();
                        message.reply(`Account @${json["data"]["username"]} is now tracked !`);
                    });
                })
            });
            break;
        }

        case "removeTwitterAccount": {
            if (!message.content.split(" ")[2].match(/^[a-zA-Z0-9_]{0,15}$/)){
                message.reply("This is not a twitter username.");
                break;
            }

            if ((await Tweets.find({guild_id:message.guild.id}).exec()).length == 0){
                await new Tweets({guild_id: message.guild.id}).save();
            } 

            Twitter.getUserId(message.content.split(" ")[2]).then(json => {
                console.log(json)
                Tweets.findOne({guild_id:message.guild.id, tweets:{$elemMatch : {userid:json["data"]["id"]}}}).exec().then(info=>{
                    console.log(info);
                    if (!info){
                        message.reply("This account isn't tracked !");
                        return;
                    }
                    Tweets.updateOne({guild_id:message.guild.id}, {$pull: {tweets:{userid:json["data"]["id"]}}}).exec().then(() => {
                        message.reply(`Account @${json["data"]["username"]} is no longer tracked !`);
                    })
                });
            });
            break;
        }

        case "":{}

        default: console.log("Unknown command.")
    }
}



module.exports = executeCommand;