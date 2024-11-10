import { MsgSearchEnum } from "./message-search.enum";

export enum MsgAuthEnum {
  ME = 'me',
  SIGNIN = 'signin',
  SIGNUP = 'signup',
  LOGOUT = 'logout',
  REFRESH = 'refresh',
  AUTH = 'auth',
  DELETE = 'delete',
  USER_ROLES = 'user.roles',
  GOOGLE_AUTH = 'auth.google',
  JWT_AUTH = 'auth.jwt',
  YANDEX_AUTH = 'auth.yandex',
  ADMIN_LOGIN = 'admin.login',
  GET_ALL_USERS = 'user.all',
  BLOCK_USER = 'user.block',
  UNBLOCK_USER = 'user.unblock',
  UPDATE_ADMIN = 'admin.update',
  CREATE_USER_BY_ADMIN = 'admin.create.user',
  ADD_ADMIN_ROLE_TO_USER = 'admin.add',
  USERS_STATS = 'user.stats',
  SEARCH_USERS = MsgSearchEnum.SEARCH_USERS
}
