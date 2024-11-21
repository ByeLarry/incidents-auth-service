import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SearchDto, UserSearchDto } from '../../libs/dto';
import { MsgAuthEnum, MsgSearchEnum } from '../../libs/enums';
import { UsersSearchService } from '../services/users-search.service';
import { SearchService } from '../../libs/services';

@Controller()
export class UserSearchController {
  constructor(
    private readonly usersSearchService: UsersSearchService,
    private readonly searchService: SearchService,
  ) {}
  @MessagePattern(MsgAuthEnum.SEARCH_USERS)
  async searchUsers(@Payload() dto: SearchDto) {
    const ids: UserSearchDto[] = await this.searchService.search<
      SearchDto,
      UserSearchDto[]
    >(dto, MsgSearchEnum.SEARCH_USERS);
    return this.usersSearchService.getUsersFromSearchDto(ids ?? []);
  }

  @MessagePattern(MsgAuthEnum.REINDEX)
  async reindexSearhchEngine() {
    return this.usersSearchService.reindexSearhchEngine();
  }
}
