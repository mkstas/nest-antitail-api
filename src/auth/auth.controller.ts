import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtRequest } from 'src/core/tokens/tokens.types';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthUserDto } from './dto/auth-user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: AuthUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const tokens = await this.authService.register(dto);
    this.setCookieWithToken(res, 'accessToken', tokens.accessToken, 60 * 10);
    this.setCookieWithToken(res, 'refreshToken', tokens.refreshToken, 60 * 60 * 24 * 30);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: AuthUserDto, @Res({ passthrough: true }) res: Response): Promise<void> {
    const tokens = await this.authService.login(dto);
    this.setCookieWithToken(res, 'accessToken', tokens.accessToken, 60 * 10);
    this.setCookieWithToken(res, 'refreshToken', tokens.refreshToken, 60 * 60 * 24 * 30);
  }

  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async logout(@Req() req: JwtRequest, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.authService.logout(req.cookies.refreshToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refreshAccessToken(
    @Req() req: JwtRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const accessToken = await this.authService.refreshAccessToken(req.cookies.refreshToken);
    this.setCookieWithToken(res, 'accessToken', accessToken, 60 * 10);
  }

  @Get('check')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async checkAuth(): Promise<void> {}

  private setCookieWithToken(res: Response, name: string, token: string, maxAge: number): void {
    res.cookie(name, token, { httpOnly: true, secure: true, maxAge: maxAge * 1000 });
  }
}
