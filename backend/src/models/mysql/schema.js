import pool from "../../config/mysql.js";

export const createTables = async () => {
  const conn = await pool.getConnection();

  try {
    // ── 1. users ──────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(100)  NOT NULL,
        email         VARCHAR(150)  NOT NULL,
        password_hash VARCHAR(255)  NOT NULL,
        avatar_url    VARCHAR(500)  DEFAULT NULL,
        is_verified   BOOLEAN       DEFAULT FALSE,
        created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

        UNIQUE KEY uq_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS auction_state (
        listing_id          VARCHAR(24)     NOT NULL,
        seller_id           INT             NOT NULL,
        current_price       DECIMAL(10,2)   NOT NULL CHECK (current_price > 0),
        highest_bidder_id   INT             DEFAULT NULL,
        status              ENUM('active','closing','ended','sold','cancelled')
                            DEFAULT 'active',
        end_time            DATETIME        NOT NULL,
        created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

        PRIMARY KEY (listing_id),
        FOREIGN KEY fk_as_seller (seller_id)
          REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY fk_as_winner (highest_bidder_id)
          REFERENCES users(id) ON DELETE SET NULL,

        INDEX idx_status_end (status, end_time),
        INDEX idx_seller     (seller_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS bids (
        id          INT AUTO_INCREMENT  PRIMARY KEY,
        listing_id  VARCHAR(24)         NOT NULL,
        bidder_id   INT                 NOT NULL,
        amount      DECIMAL(10,2)       NOT NULL CHECK (amount > 0),
        created_at  TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY fk_bid_bidder (bidder_id)
          REFERENCES users(id) ON DELETE CASCADE,

        INDEX idx_bid_listing        (listing_id),
        INDEX idx_bid_bidder         (bidder_id),
        INDEX idx_bid_listing_amount (listing_id, amount)
        -- compound index: makes "highest bid for listing X" query O(log n)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS watchlist (
        user_id     INT          NOT NULL,
        listing_id  VARCHAR(24)  NOT NULL,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (user_id, listing_id),
        FOREIGN KEY fk_wl_user (user_id)
          REFERENCES users(id) ON DELETE CASCADE,

        INDEX idx_wl_user    (user_id),
        INDEX idx_wl_listing (listing_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

     
    await conn.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id                  INT AUTO_INCREMENT  PRIMARY KEY,
        listing_id          VARCHAR(24)         NOT NULL,
        buyer_id            INT                 NOT NULL,
        seller_id           INT                 NOT NULL,
        amount              DECIMAL(10,2)       NOT NULL CHECK (amount > 0),
        razorpay_order_id   VARCHAR(100)        DEFAULT NULL,
        razorpay_payment_id VARCHAR(100)        DEFAULT NULL,
        status              ENUM('pending','paid','failed','refunded')
                            DEFAULT 'pending',
        created_at          TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY fk_pay_buyer  (buyer_id)  REFERENCES users(id),
        FOREIGN KEY fk_pay_seller (seller_id) REFERENCES users(id),

        INDEX idx_pay_listing (listing_id),
        INDEX idx_pay_buyer   (buyer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("✅ MySQL tables ready");
  } catch (err) {
    console.error("❌ Table creation failed:", err.message);
    throw err;
  } finally {
    conn.release();
  }
};