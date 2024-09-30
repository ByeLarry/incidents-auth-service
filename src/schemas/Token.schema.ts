import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TokenDocument = HydratedDocument<Token>;

@Schema({ collection: 'tokens' })
export class Token {
  @Prop({ required: true })
  value: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ required: true })
  exp: Date;

  @Prop({ required: true, type: String })
  userAgent: string;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
