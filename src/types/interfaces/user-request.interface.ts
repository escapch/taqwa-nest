import { ProfileResponseDto } from 'src/users/dto/profile.dto';

export interface UserRequest extends Request {
  user: ProfileResponseDto;
}
