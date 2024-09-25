import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from './User.schema';

export type TokenDocument = HydratedDocument<Token>;

@Schema({ collection: 'tokens' })
export class Token {
  @Prop({ required: true })
  token: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  exp: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
