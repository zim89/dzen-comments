import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PreviewCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text!: string;
}
