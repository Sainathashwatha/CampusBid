
import { Queue, Worker } from "bullmq";
import { sendAuctionEndEmail, sendPaymentEmail } from "../utils/email.js";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Queue used by auction worker to enqueue email jobs
export const emailQueue = new Queue("emails", { connection });

// Worker that processes email jobs
export const startEmailWorker = () => {
  const worker = new Worker(
    "emails",
    async (job) => {
      const {
        to,
        role,
        listingId,
        listingTitle,
        amount,
        winnerName,
        sellerName,
        sellerEmail,
        buyerName,
        buyerEmail,
      } = job.data;

      // Payment-related emails
      if (role?.startsWith("payment_")) {
        await sendPaymentEmail({
          to,
          role,
          amount,
          buyerName,
          sellerName,
        });
      }

      // Auction completion emails
      else {
        await sendAuctionEndEmail({
          to,
          role,
          listingId,
          listingTitle,
          amount,
          winnerName,
          sellerName,
          sellerEmail,
          buyerName,
          buyerEmail,
        });
      }
    },
    {
      connection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`📧 Email job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `📧 Email job failed (attempt ${job?.attemptsMade}):`,
      err.message
    );
  });

  console.log("📧 Email worker started");

  return worker;
};