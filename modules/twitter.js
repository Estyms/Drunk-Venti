const fetch = require("node-fetch");



class twitter {



	getUserTweets(id) {
		return fetch(`https://api.twitter.com/2/users/${id}/tweets?exclude=retweets,replies&max_results=5`, 
		{
			method: 'GET',
			headers: {
						'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
						'oauth_consumer_key' : `${process.env.TWITTER_API}`,
						'oauth_consumer_secret' : `${process.env.TWITTER_SECRET_KEY}`,
						'oauth_token' : `${process.env.TWITTER_ACCESS_TOKEN}`,
						'oauth_token_secret' : `${process.env.TWITTER_ACCESS_TOKEN_SECRET}`,
					}
			}
		)
		.then(res => res.json())
	}

	getUserId(username) {
		return fetch(`https://api.twitter.com/2/users/by/username/${username}`,
		{
			method: 'GET',
			headers: {
						'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
						'oauth_consumer_key' : `${process.env.TWITTER_API}`,
						'oauth_consumer_secret' : `${process.env.TWITTER_SECRET_KEY}`,
						'oauth_token' : `${process.env.TWITTER_ACCESS_TOKEN}`,
						'oauth_token_secret' : `${process.env.TWITTER_ACCESS_TOKEN_SECRET}`,
					}
			}
		)
		.then(res => res.json())
	}

	getUsername(id) {
		return fetch(`https://api.twitter.com/2/users/${id}`,
		{
			method: 'GET',
			headers: {
						'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
						'oauth_consumer_key' : `${process.env.TWITTER_API}`,
						'oauth_consumer_secret' : `${process.env.TWITTER_SECRET_KEY}`,
						'oauth_token' : `${process.env.TWITTER_ACCESS_TOKEN}`,
						'oauth_token_secret' : `${process.env.TWITTER_ACCESS_TOKEN_SECRET}`,
					}
			})
		.then(res => res.json())
	}

	getTweetById(id) {
		return fetch(`https://api.twitter.com/2/tweets/${id}`,
		{
			method: 'GET',
			headers: {
						'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
						'oauth_consumer_key' : `${process.env.TWITTER_API}`,
						'oauth_consumer_secret' : `${process.env.TWITTER_SECRET_KEY}`,
						'oauth_token' : `${process.env.TWITTER_ACCESS_TOKEN}`,
						'oauth_token_secret' : `${process.env.TWITTER_ACCESS_TOKEN_SECRET}`,
					}
			})
		.then(res => res.json())
	}
}


module.exports = {
	Twitter: new twitter(),
}
