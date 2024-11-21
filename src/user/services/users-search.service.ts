import { HttpStatus, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UserSearchDto, UserDto } from '../../libs/dto';
import { MsgSearchEnum } from '../../libs/enums';
import { handleAsyncOperation } from '../../libs/helpers';
import { MicroserviceResponseStatusFabric } from '../../libs/utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SearchService } from '../../libs/services';
import { User, Token } from '../../schemas';

@Injectable()
export class UsersSearchService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
    private readonly searchService: SearchService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.reindexSearchEngine();
    } catch (error) {
      console.error('Error during search engine reindexing:', error);
    }
  }

  
  public async getUsersFromSearchDto(data: UserSearchDto[]) {
    return handleAsyncOperation(async () => {
      const userIds = data.map((user) => user.id);
      const users = await this.userModel
        .find({ id: { $in: userIds } })
        .select('-password -_id -__v');

      const usersWithTokenCount = await Promise.all(
        users.map(async (user) => {
          const userObj: UserDto = user.toObject();
          userObj.tokensCount = await this.tokenModel.countDocuments({
            userId: user.id,
          });
          return userObj;
        }),
      );

      return usersWithTokenCount;
    });
  }

  public async reindexSearchEngine() {
    return handleAsyncOperation(async () => {
      const users = await this.userModel.find().select('-password -_id -__v');

      if (users.length === 0) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }

      await this.searchService.update(users, MsgSearchEnum.SET_USERS);

      return MicroserviceResponseStatusFabric.create(HttpStatus.NO_CONTENT);
    });
  }
}
