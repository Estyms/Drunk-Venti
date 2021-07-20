import { Database, MongoDBConnector, Model, DataTypes, Relationships,  } from "../deps.ts"

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

    /**
     * Gets the servers that needs the tweets of a certain user
     *  @param userId ID of a twitter user 
     */
    static async servers(userId: string) {
        const a = await ServerTweet.where({ tweetId: userId }).all();
        const res = [];
        for await (const b of a) {
            res.push(await Server.where({ guild_id: String(b["serverId"]) }).first());
        }
        return res;
    }
}


class Server extends Model {
    static table = "server";

    static fields = {
        guild_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        news_channel: {
            type: DataTypes.STRING,
        },
        daily_message_channel: {
            type: DataTypes.STRING,
        },
        daily_message_id: {
            type: DataTypes.STRING,
        },

    }

    /**
     * Gets the twitter users that a specific server needs
     * @param guildId ID of a Discord server
     */
    static async tweets(guildId: string) {
        const a = await ServerTweet.where({ serverId: guildId }).all();
        const res = [];
        for await (const b of a) {
            res.push(await Tweet.where({ user_id: String(b["tweetId"]) }).first());
        }
        return res;
    }
}

// Sets a relationship Between the servers and the tweets
const ServerTweet = Relationships.manyToMany(Server, Tweet);

// Links the database with the differents types
mongodb.link([ServerTweet, Server, Tweet]);

// Synchronizes the database
mongodb.sync();

export { Server, Tweet, ServerTweet };