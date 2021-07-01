import {Database, MongoDBConnector, Model, DataTypes, Relationships} from "../deps.ts"

const connector = new MongoDBConnector({
    uri: 'mongodb://127.0.0.1:27017',
    database: "drunkventi"
});

const mongodb = new Database(connector)

class Tweet extends Model {
    static table = "tweet";
    static fields = {
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        tweet_id: {
            type: DataTypes.STRING,
        },
        tweet_text: {
            type: DataTypes.STRING,
        } 
    }

    static async servers(userId: string){
        const a = await ServerTweet.where({tweetId: userId}).all();
        const res = [];
        for await (const b of a){
            res.push(await Server.where({guild_id: String(b["serverId"])}).first());
        }   
        return res;
    }
}


class Server extends Model {
    static table = "server";

    static fields = {
        guild_id : {
            type: DataTypes.STRING,
            primaryKey: true,
        }, 
        news_channel: {
            type: DataTypes.STRING,
        }, 
        reminder_channel: {
            type: DataTypes.STRING,
        }, 
    }

    static async tweets(guildId: string){
            const a = await ServerTweet.where({serverId: guildId}).all();
            const res = [];
            for await (const b of a){
                res.push(await Tweet.where({user_id: String(b["tweetId"])}).first());
            }   
            return res;
    }
}

const ServerTweet = Relationships.manyToMany(Server, Tweet);

mongodb.link([ServerTweet, Server, Tweet]);

mongodb.sync();

export {Server,Tweet, ServerTweet};