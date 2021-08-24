// deno-lint-ignore-file

const headers = {
  "Authorization": `Bearer ${Deno.env.get("TWITTER_BEARER_TOKEN")}`,
  "oauth_consumer_key": `${Deno.env.get("TWITTER_API")}`,
  "oauth_consumer_secret": `${Deno.env.get("TWITTER_SECRET_KEY")}`,
  "oauth_token": `${Deno.env.get("TWITTER_ACCESS_TOKEN")}`,
  "oauth_token_secret": `${Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")}`,
};

class twitter {
  /**
	 * Gets the tweets of a twitter user from its ID
	 * @param id ID of the twitter user
	 */
  async getUserTweets(id: string): Promise<Record<string, any> | undefined> {
    const request = await fetch(
      `https://api.twitter.com/2/users/${id}/tweets?exclude=retweets,replies&max_results=5`,
      {
        method: "GET",
        headers: headers,
      },
    )
    try {return JSON.parse(await request.text())} catch { return undefined };
  }

  /**
	 * Gets the ID of a twitter user from its username
	 * @param username username of the twitter user
	 */
  async getUserId(username: string): Promise<Record<string, any> | undefined> {
    const request = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
      method: "GET",
      headers: headers,
    });
    try {return JSON.parse(await request.text())} catch {return undefined};
  }

  /**
	 * Gets the username of a user from its ID
	 * @param id ID of the twitter user
	 */
  async getUsername(id: string): Promise<Record<string, any> | undefined> {
    const request = await fetch(`https://api.twitter.com/2/users/${id}`, {
      method: "GET",
      headers: headers,
    });
    try {JSON.parse(await request.text())} catch{ return undefined };
  }

  /**
	 * Gets a tweet from its ID
	 * @param id ID of the tweet you want to get
	 */
  async getTweetById(id: string): Promise<Record<string, any> | undefined> {
    const request = await fetch(`https://api.twitter.com/2/tweets/${id}`, {
      method: "GET",
      headers: headers,
    });
    try {JSON.parse(await request.text())} catch{ return undefined };
  }
}

const Twitter = new twitter();

export { Twitter };
