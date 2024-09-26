import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { MongoCollectionsEnum } from '../libs/enums';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ collection: MongoCollectionsEnum.SESSIONS })
export class Session {
  @Prop({ required: true })
  session_id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: MongoCollectionsEnum.USERS,
    required: true,
  })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  csrf_token: string;

  @Prop()
  expires: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
