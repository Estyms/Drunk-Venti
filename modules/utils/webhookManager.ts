import {
  Client,
  Embed,
  fetchAuto,
  Message,
  RESTEndpoints,
  RESTManager,
  TextChannel,
  User,
  UserPayload,
  Webhook,
  WebhookPayload,
} from "../../deps.ts";

class WebHookManagerClass {
  static restEndpoints: RESTEndpoints;
  static manager: RESTManager;
  static client: Client;

  create(client: Client) {
    WebHookManagerClass.manager = new RESTManager({
      token: Deno.env.get("DISCORD_TOKEN"),
      client: client,
      version: 8,
    });
    WebHookManagerClass.restEndpoints = new RESTEndpoints(
      WebHookManagerClass.manager,
    );
    WebHookManagerClass.client = client;
  }

  async getMessage(channelID: string, messageID:string){
    try {
      const messagePayload =  await WebHookManagerClass.restEndpoints.getChannelMessage(channelID, messageID);
      return new Message(WebHookManagerClass.client, messagePayload, <TextChannel> await WebHookManagerClass.client.channels.get(channelID), new User(WebHookManagerClass.client, messagePayload.author));
    } catch {
      return null;
    }
  }

  async createChannelWebhook(channelID: string): Promise<WebhookPayload> {
    const avatarData = await fetchAuto(
      <string> WebHookManagerClass.client.user?.avatarURL(),
    );

    const webhook = await this.getWebhookPayload(channelID);
    if (webhook == undefined) {
      return WebHookManagerClass.restEndpoints.createWebhook(channelID, {
        name: WebHookManagerClass.client.user?.username,
        avatar: avatarData,
      });
    }

    return webhook;
  }

  async getWebhookPayload(
    channelID: string,
  ): Promise<WebhookPayload | undefined> {
    const webhooks = await WebHookManagerClass.restEndpoints.getChannelWebhooks(
      channelID,
    );
    if (webhooks == undefined) return;
    const webhookPayload = webhooks.find((c) =>
      c.user?.username == WebHookManagerClass.client.user?.username
    );

    return webhookPayload;
  }

  async sendWebhookMessage(
    channelID: string,
    embeds: Embed[],
  ): Promise<{ message?: Message; success: boolean }> {
    const webhookPayload = await this.getWebhookPayload(channelID);
    if (!webhookPayload) return { success: false };
    const message = await new Webhook(webhookPayload).send({
      embeds: embeds,
    });
    return { message: message, success: true };
  }

  async editWebhookMessage(
    message: Message,
    channelID: string,
    embeds: Embed[],
  ): Promise<{ success: boolean }> {
    const webhookPayload = await this.getWebhookPayload(channelID);
    if (!webhookPayload) return { success: false };
    WebHookManagerClass.restEndpoints.editWebhookMessage(
      webhookPayload.id,
      <string> webhookPayload.token,
      message.id,
      {
        embeds: embeds,
      },
    );
    return { success: true };
  }

  async getWebhookMessage(channelID: string, messageID: string) {
    try {
    const message = await WebHookManagerClass.restEndpoints.getChannelMessage(
      channelID,
      messageID,
    );
    return new Message(
      WebHookManagerClass.client,
      message,
      <TextChannel> await WebHookManagerClass.client.channels.get(channelID),
      new User(
        WebHookManagerClass.client,
        <UserPayload> (await this.getWebhookPayload(channelID))?.user,
      ),
    );
    } catch {
      return null;
    }
  }
}

const webHookManager = new WebHookManagerClass();
export { webHookManager };
