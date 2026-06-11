import { Queue } from "bullmq";

 

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Create the queue — "auction-close" is just the queue name, can be anything
export const auctionQueue = new Queue("auction-close", { connection });

 
export const scheduleAuctionClose = async (listingId, endTime) => {
  const delay = endTime.getTime() - Date.now(); // milliseconds from now

  if (delay <= 0) {
    console.warn(`Auction ${listingId} end time is in the past — skipping job`);
    return;
  }

  await auctionQueue.add(
    "close-auction",      // job name (for logging/filtering)
    { listingId },        // job data — passed to the worker
    {
      delay,              // run after this many milliseconds
      attempts: 3,        // retry up to 3 times if the worker throws
      backoff: {
        type: "exponential",
        delay: 5000,      // wait 5s, then 10s, then 20s between retries
      },
      removeOnComplete: true,  // clean up from Redis once done (saves memory)
      removeOnFail: 100,       // keep last 100 failed jobs for debugging
    }
  );

  console.log(`📅 Auction close job scheduled for listing ${listingId} at ${endTime.toISOString()}`);
};