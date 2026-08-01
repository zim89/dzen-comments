import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

const USER_NAME_PATTERN = /^[a-zA-Z0-9]+$/;

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(USER_NAME_PATTERN, {
    message: 'userName must contain only Latin letters and digits',
  })
  userName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  homePage?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text!: string;
}
