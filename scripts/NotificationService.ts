import TelegramBot from "node-telegram-bot-api";
import { config as dotEnvConfig } from "dotenv"
dotEnvConfig()

class NotificationService{
  private readonly service?: TelegramBot;
  public get on(): boolean {
    return process.env.TELEGRAM_ON === 'true' ?? false
  };

  constructor() {
    if(this.on && process.env.TELEGRAM_API_KEY) {
      this.service = new TelegramBot(process.env.TELEGRAM_API_KEY);
    }
  }

  async send(message: string) {
    if(this.on && process.env.TELEGRAM_CHAT_ID) {
      await this.service!.sendMessage(process.env.TELEGRAM_CHAT_ID, message);
    }
  }
}

const notificationService = new NotificationService();

export default notificationService;