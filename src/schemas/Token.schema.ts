import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type TokenDocument = HydratedDocument<Token>;

@Schema({ collection: 'tokens' })
export class Token {
  @Prop({ required: true })
  value: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  exp: Date;

  @Prop({ required: true, type: String })
  userAgent: string;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
