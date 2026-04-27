import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import {
  type UpsertOAuthUserInput,
  type UserWithMemberships,
  type CreateLocalUserInput,
} from '../interfaces/user.interface';
import { userSelect, type SafeUser } from '../selects/user.select';
import {
  buildSearch,
  defined,
  paginate,
  toOrderBy,
} from '../../../common/helpers/prisma.helpers';
import type { Page } from '../../../common/interfaces/page.interface';
import type { UsersQueryDto } from '../dto/users-query.dto';
import type { UpdateUserDto } from '../dto/update-user.dto';
import { userDefaultOrderBy } from '../constants/user.constants';

@Injectable()
export class UsersService extends TransactionalService {
  findById(id: string): Promise<SafeUser | null> {
    return this.db.user.findUnique({ where: { id }, select: userSelect });
  }

  findByEmail(email: string): Promise<SafeUser | null> {
    return this.db.user.findUnique({ where: { email }, select: userSelect });
  }

  findByEmailWithPassword(
    email: string,
  ): Promise<(SafeUser & { passwordHash: string | null }) | null> {
    return this.db.user.findUnique({
      where: { email },
      select: { ...userSelect, passwordHash: true },
    });
  }

  findWithMemberships(id: string): Promise<UserWithMemberships | null> {
    return this.db.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        memberships: { include: { event: { select: { config: true, status: true } } } },
      },
    }) as Promise<UserWithMemberships | null>;
  }

  findMany(query: UsersQueryDto): Promise<Page<SafeUser>> {
    const { search, sortBy, sortOrder } = query;

    const where = buildSearch(search, ['name', 'email']);

    return paginate<SafeUser>(
      query,
      () =>
        this.db.user.findMany({
          select: userSelect,
          where,
          orderBy: toOrderBy(sortBy, sortOrder, userDefaultOrderBy),
          skip: query.skip,
          take: query.limit,
        }),
      () => this.db.user.count({ where }),
    );
  }

  async findByIdOrFail(id: string): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Transactional()
  updateUser(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    return this.db.user.update({
      where: { id },
      data: defined(dto),
      select: userSelect,
    });
  }

  @Transactional()
  async deleteUser(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } });
  }

  /**
   * Creates a new user with a hashed password (local auth).
   * Throws ConflictException if the email already exists.
   */
  findByUsername(username: string): Promise<SafeUser | null> {
    return this.db.user.findUnique({ where: { username }, select: userSelect });
  }

  @Transactional()
  async createLocalUser(input: CreateLocalUserInput): Promise<SafeUser> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      }),
      this.db.user.findUnique({
        where: { username: input.username },
        select: { id: true },
      }),
    ]);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }
    return this.db.user.create({
      data: {
        email: input.email,
        username: input.username,
        name: input.name,
        passwordHash: input.passwordHash,
      },
      select: userSelect,
    });
  }

  /**
   * Upserts the user and the linked OAuth account in a single transaction.
   * If the user already exists (same email), we update their profile data.
   * If the OAuth account already exists, we refresh the stored tokens.
   */
  @Transactional()
  async upsertOAuthUser(input: UpsertOAuthUserInput): Promise<SafeUser> {
    const {
      email,
      name,
      avatar,
      provider,
      providerAccountId,
      accessToken,
      refreshToken,
      expiresAt,
      tokenType,
      scope,
      idToken,
    } = input;

    const user = await this.db.user.upsert({
      where: { email },
      create: {
        email,
        name,
        avatar,
        emailVerifiedAt: new Date(),
        username:
          (email.split('@')[0] ?? 'user')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .slice(0, 28) +
          '_' +
          Math.random().toString(36).slice(2, 6),
      },
      update: defined({
        name,
        avatar,
      }),
      select: userSelect,
    });

    const accountData = defined({
      accessToken,
      refreshToken,
      expiresAt,
      tokenType,
      scope,
      idToken,
    });

    await this.db.oAuthAccount.upsert({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      create: {
        userId: user.id,
        provider,
        providerAccountId,
        ...accountData,
      },
      update: accountData,
    });

    return user;
  }
}
