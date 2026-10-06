import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

import { env } from "../config/env.js";
import ReceivedEmail from "../models/ReceivedEmail.js";

// ==========================================
// CREATE IMAP CLIENT
// ==========================================

const createClient = () => {
  return new ImapFlow({
    host: env.imap.host,

    port: Number(
      env.imap.port || 993,
    ),

    secure: Boolean(
      env.imap.secure,
    ),

    auth: {
      user: env.imap.user,
      pass: env.imap.pass,
    },

    logger: false,
  });
};

// ==========================================
// NORMALIZE EMAIL ADDRESS
// ==========================================

const normalizeEmail = (
  email,
) => {
  if (!email) {
    return "";
  }

  return String(email)
    .trim()
    .toLowerCase();
};

// ==========================================
// NORMALIZE ADDRESS LIST
// ==========================================

const normalizeAddress = (
  address,
) => {
  if (!address) {
    return [];
  }

  const value = Array.isArray(
    address,
  )
    ? address
    : [address];

  return value.flatMap(
    (item) => {
      if (!item) {
        return [];
      }

      // mailparser structure:
      //
      // {
      //   value: [
      //     {
      //       name,
      //       address
      //     }
      //   ]
      // }
      if (
        item.value &&
        Array.isArray(item.value)
      ) {
        return item.value
          .map((entry) => ({
            name:
              entry?.name ||
              "",

            email:
              normalizeEmail(
                entry?.address,
              ),
          }))
          .filter(
            (entry) =>
              entry.email,
          );
      }

      // Single address object
      if (item.address) {
        return [
          {
            name:
              item.name || "",

            email:
              normalizeEmail(
                item.address,
              ),
          },
        ];
      }

      return [];
    },
  );
};

// ==========================================
// GET MESSAGE ID
// ==========================================

const getMessageId = (
  parsed,
  message,
) => {
  if (
    parsed?.messageId
  ) {
    return parsed.messageId
      .trim();
  }

  return `${message.uid}-${
    parsed?.date?.getTime() ||
    Date.now()
  }`;
};

// ==========================================
// SYNC INBOX
// ==========================================

export const syncInbox =
  async () => {
    const client =
      createClient();

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    try {
      // ======================================
      // CONNECT
      // ======================================

      await client.connect();

      // ======================================
      // LOCK INBOX
      // ======================================

      const lock =
        await client.getMailboxLock(
          "INBOX",
        );

      try {
        const mailbox =
          client.mailbox;

        const totalMessages =
          mailbox?.exists || 0;

        // ====================================
        // EMPTY INBOX
        // ====================================

        if (!totalMessages) {
          return {
            synced: 0,
            skipped: 0,
            failed: 0,
            message:
              "Inbox is empty.",
          };
        }

        // ====================================
        // SYNC LAST 100 EMAILS
        // ====================================

        const startUid =
          Math.max(
            1,
            totalMessages - 100,
          );

        for await (const message of client.fetch(
          `${startUid}:*`,
          {
            uid: true,
            envelope: true,
            source: true,
            flags: true,
          },
        )) {
          try {
            // ==================================
            // SOURCE CHECK
            // ==================================

            if (
              !message.source
            ) {
              skipped++;
              continue;
            }

            // ==================================
            // PARSE EMAIL
            // ==================================

            const parsed =
              await simpleParser(
                message.source,
              );

            // ==================================
            // MESSAGE ID
            // ==================================

            const messageId =
              getMessageId(
                parsed,
                message,
              );

            // ==================================
            // DUPLICATE CHECK
            // ==================================

            const existing =
              await ReceivedEmail.findOne(
                {
                  messageId,
                },
              ).lean();

            if (existing) {
              skipped++;
              continue;
            }

            // ==================================
            // FROM
            // ==================================

            const from =
              parsed.from?.value?.[0];

            const normalizedFrom = {
              name:
                from?.name || "",

              email:
                normalizeEmail(
                  from?.address,
                ),
            };

            // ==================================
            // TO
            // ==================================

            const normalizedTo =
              normalizeAddress(
                parsed.to,
              );

            // ==================================
            // CC
            // ==================================

            const normalizedCc =
              normalizeAddress(
                parsed.cc,
              );

            // ==================================
            // ATTACHMENTS
            // ==================================

            const attachments =
              (
                parsed.attachments ||
                []
              ).map(
                (attachment) => ({
                  filename:
                    attachment.filename ||
                    "attachment",

                  contentType:
                    attachment.contentType ||
                    "application/octet-stream",

                  size:
                    Number(
                      attachment.size,
                    ) || 0,
                }),
              );

            // ==================================
            // RECEIVED DATE
            // ==================================

            const receivedAt =
              parsed.date ||
              message.envelope
                ?.date ||
              new Date();

            // ==================================
            // READ STATUS
            // ==================================

            const isRead =
              message.flags?.has(
                "\\Seen",
              ) || false;

            // ==================================
            // SAVE EMAIL
            // ==================================

            await ReceivedEmail.create(
              {
                messageId,

                from:
                  normalizedFrom,

                to:
                  normalizedTo,

                cc:
                  normalizedCc,

                subject:
                  parsed.subject ||
                  "(No Subject)",

                text:
                  parsed.text || "",

                html:
                  parsed.html || "",

                receivedAt,

                isRead,

                hasAttachments:
                  attachments.length >
                  0,

                attachments,

                folder:
                  "INBOX",

                uid:
                  message.uid,
              },
            );

            synced++;
          } catch (
            messageError
          ) {
            failed++;

            console.error(
              `Failed to sync email UID ${message.uid}:`,
              messageError,
            );
          }
        }
      } finally {
        // ====================================
        // RELEASE LOCK
        // ====================================

        lock.release();
      }
    } catch (error) {
      console.error(
        "Inbox synchronization failed:",
        error,
      );

      throw error;
    } finally {
      // ======================================
      // LOGOUT
      // ======================================

      try {
        await client.logout();
      } catch {
        // Ignore logout errors.
      }
    }

    return {
      synced,
      skipped,
      failed,

      message:
        `Inbox synchronization completed. ${synced} new email(s) imported.`,
    };
  };

// ==========================================
// GET IMAP CLIENT
// ==========================================

export const getInboxClient =
  () => {
    return createClient();
  };