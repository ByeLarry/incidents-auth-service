import { Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/User.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  signin(data: SignInDto) {
    return 'This action adds a new user' + JSON.stringify(data);
  }

  async signup(data: SignUpDto) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const existingUser = await this.userModel.findOne({
        email: data.email,
      });

      if (existingUser) {
        return '409';
      }

      const user = new this.userModel({
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: hashedPassword,
        csrf_token: 'afsdafsdafsdafdfdafsdafafsdaafsdfsda',
      });

      await user.save();
      const result = user.toObject({
        versionKey: false,
      });
      delete result.password;
      return result as Omit<User, 'password'>;
    } catch (error) {
      return '500';
    }
  }
}
