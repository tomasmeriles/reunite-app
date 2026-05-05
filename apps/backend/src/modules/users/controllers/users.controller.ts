import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
  Body,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import type { Page } from '../../../common/interfaces/page.interface';
import { CheckPolicies } from '../../../casl/decorators/check-policies.decorator';
import { UsersQueryDto } from '../dto/users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import type { SafeUser } from '../selects/user.select';
import { UsersService } from '../services/users.service';
import { Audit } from '../../audit/decorators/audit.decorator';
import { AuditAction, AuditResource } from '@prisma/client';
import { ErrorCode } from '../../../common/errors/error-codes.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'User'))
  getUsers(@Query() query: UsersQueryDto): Promise<Page<SafeUser>> {
    return this.users.findMany(query);
  }

  @Get('by-username/:username')
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<SafeUser> {
    const user = await this.users.findByUsername(username);
    if (!user) throw new NotFoundException({ code: ErrorCode.USER_NOT_FOUND });
    return user;
  }

  @Patch(':id')
  @CheckPolicies((ability, req) =>
    ability.can('update', subject('User', { id: req.params['id'] })),
  )
  @Audit(AuditAction.UPDATE, AuditResource.USER)
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<SafeUser> {
    return this.users.updateUser(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPolicies((ability, req) =>
    ability.can('delete', subject('User', { id: req.params['id'] })),
  )
  @Audit(AuditAction.DELETE, AuditResource.USER)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.users.deleteUser(id);
  }
}
