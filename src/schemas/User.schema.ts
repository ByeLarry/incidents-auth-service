import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { RolesEnum } from '../libs/enums';
import { AuthProvidersEnum } from '../libs/enums/auth-providers.enum';
import { v4 } from 'uuid';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users' })
export class User {
  @Prop({ default: () => v4(), unique: true, required: true, type: String })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  surname: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String })
  phone_number?: string;

  @Prop({ default: false })
  activated: boolean;

  @Prop({ default: false, type: Boolean })
  isBlocked: boolean;

  @Prop({ default: [RolesEnum.USER], type: [String], enum: RolesEnum })
  roles: RolesEnum[];

  @Prop({ type: String, enum: AuthProvidersEnum })
  provider: AuthProvidersEnum;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Token' }] })
  tokens: MongooseSchema.Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
