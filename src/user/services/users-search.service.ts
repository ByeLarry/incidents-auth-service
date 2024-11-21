import { HttpStatus, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { isArray } from 'util';
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
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private readonly searchService: SearchService,
  ) {}

  async onApplicationBootstrap() {
    this.reindexSearhchEngine();
  }
  async getUsersFromSearchDto(data: UserSearchDto[]) {
    return await handleAsyncOperation(async () => {
      const users = await this.userModel
        .find({ id: { $in: data.map((user) => user.id) } })
        .select('-password -_id -__v');

      if (isArray(users) && users.length === 0) return [];

      const usersWithTokenCount = await Promise.all(
        users.map(async (user) => {
          const userObj: UserDto = user.toObject();

          const tokensCount = await this.tokenModel.countDocuments({
            userId: user.id,
          });

          userObj.tokensCount = tokensCount;

          return userObj;
        }),
      );
      return usersWithTokenCount;
    });
  }

  public async reindexSearhchEngine() {
    return await handleAsyncOperation(async () => {
      const users = await this.userModel.find().select('-password -_id -__v');

      if (isArray(users) && users.length === 0)
        MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      await this.searchService.update(users, MsgSearchEnum.SET_USERS);

      return MicroserviceResponseStatusFabric.create(HttpStatus.NO_CONTENT);
    });
  }
}
