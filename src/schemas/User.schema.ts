import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RolesEnum } from '../libs/enums';
import { AuthProvidersEnum } from '../libs/enums/auth-providers.enum';
import { v4 } from 'uuid';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true }) 
export class User {
  @Prop({ default: () => v4(), unique: true, required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  surname: string;

  @Prop({ required: true, unique: true, type: String })
  email: string;

  @Prop({ type: String })
  password?: string;

  @Prop({ type: String })
  phone_number?: string;

  @Prop({ default: false, type: Boolean })
  activated: boolean;

  @Prop({ default: false, type: Boolean })
  isBlocked: boolean;

  @Prop({ default: [RolesEnum.USER], type: [String], enum: RolesEnum })
  roles: RolesEnum[];

  @Prop({
    type: String,
    enum: AuthProvidersEnum,
    default: AuthProvidersEnum.LOCAL,
  })
  provider: AuthProvidersEnum;

}

export const UserSchema = SchemaFactory.createForClass(User);
