import { Notification } from "../models/Notification.js";
import { sendEmail } from "./email.service.js";

export async function createNotification({ user, title, message, type = "info", link }) {
  if (!user) return null;
  return Notification.create({ user, title, message, type, link });
}

export async function notifyByEmail(options) {
  return sendEmail(options);
}
