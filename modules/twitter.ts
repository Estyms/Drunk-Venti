// deno-lint-ignore-file
import "https://deno.land/x/dotenv@v2.0.0/load.ts";

const headers = {
	'Authorization': `Bearer ${Deno.env.get("TWITTER_BEARER_TOKEN")}`,
	'oauth_consumer_key': `${Deno.env.get("TWITTER_API")}`,
	'oauth_consumer_secret': `${Deno.env.get("TWITTER_SECRET_KEY")}`,
	'oauth_token': `${Deno.env.get("TWITTER_ACCESS_TOKEN")}`,
	'oauth_token_secret': `${Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")}`,
}


class twitter {

	/**
	 * Gets the tweets of a twitter user from its ID
	 * @param id ID of the twitter user
	 */
	getUserTweets(id: string): Promise<Record<string, any>> {
		return fetch(`https://api.twitter.com/2/users/${id}/tweets?exclude=retweets,replies&max_results=5`,
			{
				method: 'GET',
				headers: headers
			}
		)
			.then(async res => JSON.parse(await res.text()))
	}

	/**
	 * Gets the ID of a twitter user from its username
	 * @param username username of the twitter user
	 */
	getUserId(username: string): Promise<Record<string, any>> {
		return fetch(`https://api.twitter.com/2/users/by/username/${username}`,
			{
				method: 'GET',
				headers: headers
			}
		)
			.then(async res => JSON.parse(await res.text()))
	}

	/**
	 * Gets the username of a user from its ID
	 * @param id ID of the twitter user
	 */
	getUsername(id: string): Promise<Record<string, any>> {
		return fetch(`https://api.twitter.com/2/users/${id}`,
			{
				method: 'GET',
				headers: headers
			})
			.then(async res => JSON.parse(await res.text()))
	}

	/**
	 * Gets a tweet from its ID
	 * @param id ID of the tweet you want to get
	 */
	getTweetById(id: string): Promise<Record<string, any>> {
		return fetch(`https://api.twitter.com/2/tweets/${id}`,
			{
				method: 'GET',
				headers: headers
			})
			.then(async res => JSON.parse(await res.text()))
	}
}

const Twitter = new twitter()

export { Twitter }

