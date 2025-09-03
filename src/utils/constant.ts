import * as dotenv from "dotenv";

dotenv.config();
const ENV = process.env;
export const PORT = ENV.PORT || 5000;

export const TOKEN_SECRET = ENV.TOKEN_SECRET || "PMS_TOKEN";

const timer = {
  "10AM": "0 10 * * *", // every day at 10 AM
  "24hr": "0 0 0 * * *", // every day at midnight
  "12hr": "0 0 */12 * * *", // every 12 hours
  "6hr": "0 0 */6 * * *", // every 6 hours
  "3hr": "0 0 */3 * * *", // every 3 hours
  "2hr": "0 0 */2 * * *", // every 2 hours
  "1hr": "0 0 * * * *", // every hour
  "45min": "0 */45 * * * *", // every 45 minutes
  "30min": "0 */30 * * * *", // every 30 minutes
  "10min": "0 */10 * * * *", // every 10 minutes
  "30sec": "*/30 * * * * *", // every 30 seconds
  "10sec": "*/10 * * * * *", // every 10 seconds
  "5sec": "*/5 * * * * *", // every 5 seconds
  "1sec": "* * * * * *", // every second
};

// Cron expressions for draw intervals
export const HOURLY_DRAW_CRON_EXPRESSION = timer["1hr"]; // Every hour
export const RANDOM_BID_CRON_EXPRESSION = timer["6hr"]; // Every 6 hours
export const MEGA_POT_CRON_EXPRESSION = timer["10AM"]; // Daily at 10 AM
export const RESET_SPIN_CRON_EXPRESSION = timer["10AM"]; // Daily at 10 AM
export const DELETE_YESTERDAY_DATA_CRON_EXPRESSION = timer["10AM"]; // Daily at 10 AM
export const DOUBLE_TROUBLE_CRON_EXPRESSION = timer["30sec"]; // Every 30 seconds

// Winning multipliers for matches
export const WINNING_MULTIPLIERS: Record<number, number> = {
  6: 100000,
  5: 1000,
  4: 50,
  3: 5,
  2: 2,
};

// Referral bonus constants
export const REFERRAL_BONUS = {
  REFERRER_BONUS: 2000, // Coins given to the user who referred someone
  REFERRED_BONUS: 1000, // Coins given to the new user who used a referral
};

export const SALT =
  ENV.HMAC_SECRET || "sixywin-dev-secret-2025-change-in-production";
export const HMAC_SECRET =
  ENV.HMAC_SECRET || "sixywin-dev-secret-2025-change-in-production";

export const LOTTERY_MINIMUM_NUMBER = 1; // Minimum number for lottery draws
export const LOTTERY_MAXIMUM_NUMBER = 49; // Maximum number for lottery draws
export const LOTTERY_NUMBERS_COUNT = 6; // Number of lottery numbers to draw
export const AVIATOR_COUNTDOWN_TIMER = 10; // Countdown timer for the aviator game 5 seconds
export const AVIATOR_MAX_MULTIPLIER = 5; // Maximum multiplier for the aviator game
export const USER_MAX_TICKETS = 5; // Maximum tickets a user can have
export const MEGA_POT_AMOUNT = 1000000; // Mega pot amount
export const MAX_NUMBER_DOUBLE_TROUBLE = 30; // Maximum number for double trouble
// Double Trouble Payouts
export const doubleTroublePayouts = {
  exact: 50,
  over: 2,
  under: 2,
  number: 10,
};
