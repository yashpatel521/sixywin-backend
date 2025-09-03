import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  AVIATOR_MAX_MULTIPLIER,
  TOKEN_SECRET,
  WINNING_MULTIPLIERS,
} from "./constant";
import { User } from "../entities/User";

export function createJwtToken(
  payload: object,
  expiresIn: string | number = "7d"
) {
  return jwt.sign(payload, TOKEN_SECRET, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
}

export async function createHashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function getRandomNumbers(
  count: number,
  min: number,
  max: number
): number[] {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(n);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

export function getMatchedNumbers(
  ticketNumbers: number[],
  drawNumbers: number[]
): number[] {
  return ticketNumbers.filter((n) => drawNumbers.includes(n));
}

export function getCoinsForMatches(matches: number): number {
  if (matches === 1) return 100;
  if (matches === 2) return 200;
  if (matches === 3) return 500;
  if (matches === 4) return 1000;
  if (matches === 5) return 2000;
  if (matches === 6) return 5000;
  return 0;
}

export function getMultiplierForMatches(matches: number): number {
  return WINNING_MULTIPLIERS[matches] || 0;
}

export function getRandomAvatar(name: string) {
  // Use ui-avatars.com for random avatars based on name
  // return `https://ui-avatars.com/api/?name=${encodeURIComponent(
  //   name
  // )}&background=random`;
  const avatarNumber = Math.floor(Math.random() * 20) + 1;
  return `/avatars/avatar${avatarNumber}.png`;
}

export const crashMultiplier = async () => {
  const r = Math.random();
  let multiplier: number;

  if (r < 0.65) {
    // 65% → crash between 1.00x – 2.00x
    multiplier = 1 + Math.random();
  } else if (r < 0.9) {
    // 25% → crash between 2.00x – 0.5 * max
    multiplier = 2 + Math.random() * (AVIATOR_MAX_MULTIPLIER * 0.5 - 2);
  } else if (r < 0.98) {
    // 8% → crash between 0.5 * max – 0.8 * max
    multiplier =
      AVIATOR_MAX_MULTIPLIER * 0.5 +
      Math.random() * (AVIATOR_MAX_MULTIPLIER * 0.3);
  } else {
    // 2% → rare high (0.8 * max – max)
    multiplier =
      AVIATOR_MAX_MULTIPLIER * 0.8 +
      Math.random() * (AVIATOR_MAX_MULTIPLIER * 0.2);
  }

  return parseFloat(multiplier.toFixed(2));
};

export const updateUserCoins = (
  user: User,
  bid: number
): {
  user: User;
  success: boolean;
} => {
  const totalFunds = user.coins + user.winningAmount;
  if (totalFunds < bid) {
    return {
      user,
      success: false,
    };
  }
  if (user.coins > bid) {
    user.coins -= bid;
  } else {
    const remainingBid = bid - user.coins;
    user.winningAmount -= remainingBid;
    user.coins = 0;
  }
  user.todaysBids += bid;
  return {
    user,
    success: true,
  };
};
