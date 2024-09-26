import { IJwtPayload } from '../interfaces';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { genSaltSync, hashSync } from 'bcrypt';
import { User } from '../schemas';
import { Model, ObjectId } from 'mongoose';
import { HttpStatusExtends, RolesEnum } from '../libs/enums';
import { MicroserviceResponseStatusFabric } from '../libs/utils';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async save(user: Partial<User>) {
    const hashedPassword = user?.password
      ? this.hashPassword(user.password)
      : null;

    const existingUser = await this.userModel.findOne({ email: user.email });

    if (existingUser) {
      existingUser.password = hashedPassword ?? existingUser.password;
      existingUser.provider = user?.provider ?? existingUser.provider;
      existingUser.roles = user?.roles ?? existingUser.roles;
      existingUser.isBlocked = user?.isBlocked ?? existingUser.isBlocked;
      return existingUser.save();
    } else {
      const newUser = new this.userModel({
        email: user.email,
        password: hashedPassword,
        provider: user?.provider,
        roles: [RolesEnum.USER],
      });

      return newUser.save();
    }
  }

  async findOne(userIdOrEmail: string): Promise<User | null> {
    const user = await this.userModel.findOne({
      $or: [{ _id: userIdOrEmail }, { email: userIdOrEmail }],
    });
    return user || null;
  }

  async findUserByObjectId(userId: ObjectId): Promise<User | null> {
    return await this.userModel.findOne({ _id: userId }).exec();
  }

  async delete(id: string, user: IJwtPayload) {
    if (user.id !== id && !user.roles.includes(RolesEnum.ADMIN)) {
      return MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.FORBIDDEN,
      );
    }

    return this.userModel.findByIdAndDelete(id, { select: { _id: true } });
  }

  private hashPassword(password: string) {
    return hashSync(password, genSaltSync(10));
  }
}
