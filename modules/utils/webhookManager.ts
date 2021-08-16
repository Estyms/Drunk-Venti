import {
  Client,
  Embed,
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
      version:8
    });
    WebHookManagerClass.restEndpoints = new RESTEndpoints(WebHookManagerClass.manager);
    WebHookManagerClass.client = client;
  }

  async createChannelWebhook(channelID: string): Promise<WebhookPayload> {
    const webhook = await this.getWebhookPayload(channelID);
    if (webhook == undefined) {
      return await WebHookManagerClass.restEndpoints.createWebhook(channelID, {
        name: WebHookManagerClass.client.user?.username,
        avatar: WebHookManagerClass.client.user?.avatar,
      });
    }
    return webhook;
  }

  async getWebhookPayload(
    channelID: string,
  ): Promise<WebhookPayload | undefined> {
    const webhooks = await WebHookManagerClass.restEndpoints.getChannelWebhooks(channelID);
    if (webhooks == undefined) return;
    const webhook = webhooks.find((c) =>
      c.user?.username == WebHookManagerClass.client.user?.username
    );
    return webhook;
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
    WebHookManagerClass.restEndpoints.editWebhookMessage(webhookPayload.id, <string> webhookPayload.token, message.id, {
        embeds: embeds
    });
    return { success: true };
  }

  async getWebhookMessage(channelID: string, messageID: string) {
    const message = await WebHookManagerClass.restEndpoints.getChannelMessage(
      channelID,
      messageID,
    );
    return await new Message(
        WebHookManagerClass.client,
      message,
      <TextChannel> await WebHookManagerClass.client.channels.get(channelID),
      new User(
        WebHookManagerClass.client,
        <UserPayload> (await this.getWebhookPayload(channelID))?.user,
      ),
    );
  }
}


const webHookManager = new WebHookManagerClass();
export { webHookManager };
