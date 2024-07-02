import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './User.schema';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ collection: 'sessions' })
export class Session {
  @Prop({ required: true })
  session_id: string;

  @Prop({ type: mongoose.Schema.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  csrf_token: string;

  @Prop()
  expires: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
