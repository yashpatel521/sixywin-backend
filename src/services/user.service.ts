import { User } from "../entities/User";
import { Reference } from "../entities/Reference";
import AppDataSource from "../app-data-source";
import { REFERRAL_BONUS } from "../utils/constant";

export class UserService {
  static userRepo = AppDataSource.getRepository(User);
  static referenceRepo = AppDataSource.getRepository(Reference);
  static async findUserByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  static async findUserByGoogleId(googleId: string) {
    return this.userRepo.findOne({ where: { googleId } });
  }

  static async createUser(
    email: string,
    username: string,
    password?: string,
    referralId?: string,
    googleId?: string,
    avatar?: string
  ) {
    const user = this.userRepo.create({
      email,
      username,
      password,
      googleId,
      avatar,
    });
    const savedUser = await this.userRepo.save(user);

    // Handle referral if provided
    if (referralId) {
      await this.createReferral(savedUser, referralId);
    }

    return savedUser;
  }

  static async findUserByReferralId(referralId: string) {
    return this.userRepo.findOne({ where: { referenceId: referralId } });
  }

  static async createReferral(newUser: User, referralId: string) {
    // Find the referrer user
    const referrer = await this.userRepo.findOne({
      where: { referenceId: referralId },
    });
    if (!referrer) {
      throw new Error("Referral user not found");
    }

    // Create the reference relationship
    const reference = this.referenceRepo.create({
      referrer: referrer,
      referred: newUser,
    });

    await this.referenceRepo.save(reference);

    // Give bonus coins to both users using constants
    await this.userRepo.update(referrer.id, {
      coins: referrer.coins + REFERRAL_BONUS.REFERRER_BONUS,
    });
    await this.userRepo.update(newUser.id, {
      coins: newUser.coins + REFERRAL_BONUS.REFERRED_BONUS,
    });
  }

  static async findUserById(id: number) {
    return this.userRepo
      .createQueryBuilder("user")
      .where("user.id = :id", { id })
      .leftJoinAndSelect("user.referrals", "referral")
      .leftJoinAndSelect("referral.referred", "referredUser")
      .getOne();
  }

  static async findUserByEmailOrUsernameLogin(emailOrUsername: string) {
    return this.userRepo
      .createQueryBuilder("user")
      .where(
        "user.email = :emailOrUsername OR user.username = :emailOrUsername",
        {
          emailOrUsername,
        }
      )
      .getOne();
  }

  // Get leaderboard with today's bid amount and ticket count
  static async getLeaderboard(limit: number = 10) {
    const list = await this.userRepo
      .createQueryBuilder("user")
      .orderBy("user.todaysBids", "DESC")
      .limit(limit)
      .getMany();
    return list;
  }

  static async getUserReferrals(userId: number) {
    return this.referenceRepo.find({
      where: { referrer: { id: userId } },
      relations: ["referred"],
      order: { createdAt: "DESC" },
    });
  }

  static async updateUser(user: User) {
    return this.userRepo.save(user);
  }

  static async resetAllUsersSpinStatus() {
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ isSpinned: false })
      .execute();

    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ todaysBids: 0 })
      .execute();
    return true;
  }
}
