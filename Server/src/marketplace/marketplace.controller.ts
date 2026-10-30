import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare, hash, hashSync } from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  agentSelect,
  JwtAuthGuard,
  OptionalJwtGuard,
  publicUser,
  Roles,
  RolesGuard,
} from './auth.js';
import type { AuthRequest, Principal } from './auth.js';
import {
  CollectionDto,
  FavoriteDto,
  InquiryDto,
  InquiryUpdateDto,
  ItemDto,
  LeadDto,
  LoginDto,
  MediaDto,
  NewsletterDto,
  PostDto,
  PropertyDto,
  RegisterDto,
  ReviewDto,
  SavedSearchDto,
  SearchDto,
  UpdatePostDto,
  UpdatePropertyDto,
} from './dto.js';

const listingInclude = {
  media: { orderBy: { sortOrder: 'asc' as const } },
  agent: { select: agentSelect },
  neighborhood: true,
};
const publicStatuses = ['ACTIVE', 'PENDING', 'SOLD', 'RENTED'] as const;
const missingUserHash = hashSync(randomUUID(), 12);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

@Controller()
export class MarketplaceController {
  constructor(
    private db: PrismaService,
    private jwt: JwtService,
  ) {}
  @Get('health')
  async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected' };
  }
  @Post('auth/register')
  async register(@Body() dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.db.user.findUnique({ where: { email } }))
      throw new ConflictException('An account with this email already exists.');
    try {
      const user = await this.db.user.create({
        data: {
          name: dto.name.trim(),
          email,
          passwordHash: await hash(dto.password, 12),
        },
        select: publicUser,
      });
      return { user, accessToken: await this.jwt.signAsync({ sub: user.id }) };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        throw new ConflictException(
          'An account with this email already exists.',
        );
      throw e;
    }
  }
  @Post('auth/login')
  async login(@Body() dto: LoginDto) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    const validPassword = await compare(
      dto.password,
      user?.passwordHash ?? missingUserHash,
    );
    if (!user || !validPassword)
      throw new UnauthorizedException('Email or password is incorrect.');
    const { passwordHash: _, ...safe } = user;
    return {
      user: safe,
      accessToken: await this.jwt.signAsync({ sub: user.id }),
    };
  }
  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthRequest) {
    return req.user;
  }

  @Get('properties')
  async properties(@Query() q: SearchDto) {
    if (
      q.status &&
      !publicStatuses.includes(q.status as (typeof publicStatuses)[number])
    )
      throw new BadRequestException('This status is not public.');
    if (
      q.minPrice !== undefined &&
      q.maxPrice !== undefined &&
      q.minPrice > q.maxPrice
    )
      throw new BadRequestException(
        'Minimum price must not exceed maximum price.',
      );
    const where: Prisma.PropertyWhereInput = {
      status: q.status ?? { in: ['ACTIVE', 'PENDING'] },
      listingType: q.type,
      propertyType: q.propertyType,
      isPrivateExclusive: q.exclusive === 'true' ? true : undefined,
      city: q.city ? { equals: q.city, mode: 'insensitive' } : undefined,
      beds: q.beds ? { gte: q.beds } : undefined,
      baths: q.baths ? { gte: q.baths } : undefined,
      price: { gte: q.minPrice, lte: q.maxPrice },
      amenities: q.amenities
        ? { hasEvery: q.amenities.split(',').filter(Boolean) }
        : undefined,
      OR: q.q
        ? [
            ...['title', 'city', 'addressLine1'].map((field) => ({
              [field]: { contains: q.q, mode: 'insensitive' },
            })),
            { neighborhood: { name: { contains: q.q, mode: 'insensitive' } } },
          ]
        : undefined,
    };
    if (q.bbox) {
      const bounds = q.bbox.split(',').map(Number);
      if (
        bounds.length !== 4 ||
        bounds.some((x) => !Number.isFinite(x)) ||
        bounds[0] > bounds[2] ||
        bounds[1] > bounds[3]
      )
        throw new BadRequestException('Invalid map bounds.');
      where.lng = { gte: bounds[0], lte: bounds[2] };
      where.lat = { gte: bounds[1], lte: bounds[3] };
    }
    const orderBy: Prisma.PropertyOrderByWithRelationInput =
      q.sort === 'price-asc'
        ? { price: 'asc' }
        : q.sort === 'price-desc'
          ? { price: 'desc' }
          : q.sort === 'sqft'
            ? { sqft: { sort: 'desc', nulls: 'last' } }
            : { publishedAt: 'desc' };
    const [items, total] = await this.db.$transaction([
      this.db.property.findMany({
        where,
        include: listingInclude,
        orderBy: [orderBy, { id: 'asc' }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      this.db.property.count({ where }),
    ]);
    return { items, total, page: q.page, pages: Math.ceil(total / q.limit) };
  }
  @Get('properties/:slug')
  async property(@Param('slug') slug: string) {
    const property = await this.db.property.findFirst({
      where: { slug, status: { in: [...publicStatuses] } },
      include: listingInclude,
    });
    if (!property)
      throw new NotFoundException('This home is no longer available.');
    return property;
  }
  @Post('properties')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AGENT', 'ADMIN')
  createProperty(@Body() dto: PropertyDto, @Req() req: AuthRequest) {
    const { mediaUrls, ...data } = dto;
    if (dto.status === 'ACTIVE' && !mediaUrls?.length)
      throw new BadRequestException(
        'Add at least one image before publishing.',
      );
    return this.db.property.create({
      data: {
        ...data,
        amenities: dto.amenities ?? [],
        features: dto.features ?? [],
        slug: `${slugify(dto.title)}-${randomUUID().slice(0, 8)}`,
        agentId: req.user.id,
        publishedAt: dto.status === 'ACTIVE' ? new Date() : null,
        media: {
          create: mediaUrls?.map((url, sortOrder) => ({
            url,
            sortOrder,
            alt: dto.title,
          })),
        },
      },
      include: listingInclude,
    });
  }
  private async ownedProperty(
    id: string,
    user: Principal,
    db: Prisma.TransactionClient = this.db,
  ) {
    const property = await db.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Home not found.');
    if (property.agentId !== user.id && user.role !== 'ADMIN')
      throw new ForbiddenException();
    return property;
  }
  @Patch('properties/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AGENT', 'ADMIN')
  async updateProperty(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @Req() req: AuthRequest,
  ) {
    return this.db.$transaction(async (tx) => {
      // Publishing and media removal must serialize on the same residence.
      await tx.$queryRaw`SELECT "id" FROM "Property" WHERE "id" = ${id} FOR UPDATE`;
      const property = await this.ownedProperty(id, req.user, tx);
      const { mediaUrls, ...data } = dto;
      const mediaCount = await tx.media.count({
        where: { propertyId: id, kind: 'image' },
      });
      if (dto.status === 'ACTIVE' && !mediaCount && !mediaUrls?.length)
        throw new BadRequestException(
          'Add at least one image before publishing.',
        );
      return tx.property.update({
        where: { id },
        data: {
          ...data,
          publishedAt:
            dto.status === 'ACTIVE' && !property.publishedAt
              ? new Date()
              : undefined,
          media: mediaUrls?.length
            ? {
                create: mediaUrls.map((url, i) => ({
                  url,
                  sortOrder: mediaCount + i,
                  alt: dto.title ?? property.title,
                })),
              }
            : undefined,
        },
        include: listingInclude,
      });
    });
  }
  @Delete('properties/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteProperty(@Param('id') id: string, @Req() req: AuthRequest) {
    await this.ownedProperty(id, req.user);
    await this.db.property.delete({ where: { id } });
    return { success: true };
  }
  @Post('properties/:id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AGENT', 'ADMIN')
  async media(
    @Param('id') id: string,
    @Body() dto: MediaDto,
    @Req() req: AuthRequest,
  ) {
    await this.ownedProperty(id, req.user);
    if (dto.kind === 'video') {
      const url = new URL(dto.url);
      const supported =
        (url.hostname === 'my.matterport.com' &&
          url.pathname.startsWith('/show/')) ||
        (url.hostname === 'www.youtube.com' &&
          url.pathname.startsWith('/embed/')) ||
        (url.hostname === 'player.vimeo.com' &&
          url.pathname.startsWith('/video/'));
      if (!supported)
        throw new BadRequestException(
          'Use an embeddable Matterport /show/, YouTube /embed/, or Vimeo /video/ URL.',
        );
    }
    return this.db.media.create({
      data: {
        ...dto,
        propertyId: id,
        sortOrder: await this.db.media.count({ where: { propertyId: id } }),
      },
    });
  }
  @Delete('properties/:id/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AGENT', 'ADMIN')
  async deleteMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @Req() req: AuthRequest,
  ) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Property" WHERE "id" = ${id} FOR UPDATE`;
      const property = await this.ownedProperty(id, req.user, tx);
      const media = await tx.media.findFirst({
        where: { id: mediaId, propertyId: id },
      });
      if (!media) throw new NotFoundException();
      if (
        media.kind === 'image' &&
        property.status === 'ACTIVE' &&
        (await tx.media.count({
          where: { propertyId: id, kind: 'image' },
        })) <= 1
      )
        throw new BadRequestException(
          'Keep at least one image on an active residence. Add a new image first.',
        );
      return tx.media.deleteMany({ where: { id: mediaId, propertyId: id } });
    });
  }

  @Get('neighborhoods')
  neighborhoods() {
    return this.db.neighborhood.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { properties: { where: { status: 'ACTIVE' } } } },
      },
    });
  }
  @Get('neighborhoods/:slug')
  async neighborhood(@Param('slug') slug: string) {
    const result = await this.db.neighborhood.findUnique({
      where: { slug },
      include: {
        properties: { where: { status: 'ACTIVE' }, include: listingInclude },
        posts: { where: { publishedAt: { lte: new Date() } } },
      },
    });
    if (!result) throw new NotFoundException();
    return result;
  }
  @Get('agents')
  agents() {
    return this.db.user.findMany({
      where: { role: 'AGENT' },
      select: {
        ...agentSelect,
        _count: { select: { listings: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { name: 'asc' },
    });
  }
  @Get('agents/:id')
  async agent(@Param('id') id: string) {
    const user = await this.db.user.findFirst({
      where: { id, role: { in: ['AGENT', 'ADMIN'] } },
      select: {
        ...agentSelect,
        listings: { where: { status: 'ACTIVE' }, include: listingInclude },
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }
  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  // Buyer reviews are attributed to an authenticated account, with one review per advisor.
  favorites(@Req() req: AuthRequest) {
    return this.db.favorite.findMany({
      where: {
        userId: req.user.id,
        property: { status: { in: [...publicStatuses] } },
      },
      include: { property: { include: listingInclude } },
      orderBy: { createdAt: 'desc' },
    });
  }
  @Get('agents/:id/reviews')
  reviews(@Param('id') id: string) {
    return this.db.review.findMany({
      where: { agentId: id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  @Post('agents/:id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async review(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: ReviewDto,
  ) {
    if (!(await this.db.user.findFirst({ where: { id, role: 'AGENT' } })))
      throw new NotFoundException('Advisor not found.');
    return this.db.review.upsert({
      where: { authorId_agentId: { authorId: req.user.id, agentId: id } },
      create: { ...dto, authorId: req.user.id, agentId: id },
      update: dto,
    });
  }
  @Post('favorites')
  @UseGuards(JwtAuthGuard)
  async favorite(@Req() req: AuthRequest, @Body() dto: FavoriteDto) {
    const p = await this.db.property.findFirst({
      where: { id: dto.propertyId, status: { in: [...publicStatuses] } },
    });
    if (!p) throw new NotFoundException();
    return this.db.favorite.upsert({
      where: {
        userId_propertyId: { userId: req.user.id, propertyId: dto.propertyId },
      },
      update: {},
      create: { userId: req.user.id, propertyId: dto.propertyId },
    });
  }
  @Delete('favorites/:propertyId')
  @UseGuards(JwtAuthGuard)
  removeFavorite(
    @Req() req: AuthRequest,
    @Param('propertyId') propertyId: string,
  ) {
    return this.db.favorite.deleteMany({
      where: { userId: req.user.id, propertyId },
    });
  }

  @Get('collections')
  @UseGuards(JwtAuthGuard)
  collections(@Req() req: AuthRequest) {
    return this.db.collection.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          where: { property: { status: { in: [...publicStatuses] } } },
          include: { property: { include: listingInclude } },
          orderBy: { rank: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
  @Post('collections')
  @UseGuards(JwtAuthGuard)
  createCollection(@Req() req: AuthRequest, @Body() dto: CollectionDto) {
    return this.db.collection.create({
      data: { name: dto.name.trim(), userId: req.user.id },
    });
  }
  private async ownedCollection(id: string, userId: string) {
    const result = await this.db.collection.findFirst({
      where: { id, userId },
      include: {
        items: {
          where: { property: { status: { in: [...publicStatuses] } } },
          include: { property: { include: listingInclude } },
          orderBy: { rank: 'asc' },
        },
      },
    });
    if (!result) throw new NotFoundException();
    return result;
  }
  @Get('collections/:id')
  @UseGuards(JwtAuthGuard)
  collection(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.ownedCollection(id, req.user.id);
  }
  @Patch('collections/:id')
  @UseGuards(JwtAuthGuard)
  async renameCollection(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: CollectionDto,
  ) {
    await this.ownedCollection(id, req.user.id);
    return this.db.collection.update({
      where: { id },
      data: { name: dto.name.trim() },
    });
  }
  @Delete('collections/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCollection(@Param('id') id: string, @Req() req: AuthRequest) {
    await this.ownedCollection(id, req.user.id);
    return this.db.collection.delete({ where: { id } });
  }
  @Post('collections/:id/items')
  @UseGuards(JwtAuthGuard)
  async addItem(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Body() dto: ItemDto,
  ) {
    await this.ownedCollection(id, req.user.id);
    const property = await this.db.property.findFirst({
      where: { id: dto.propertyId, status: { in: [...publicStatuses] } },
    });
    if (!property) throw new NotFoundException('Home not found.');
    return this.db.collectionItem.upsert({
      where: {
        collectionId_propertyId: {
          collectionId: id,
          propertyId: dto.propertyId,
        },
      },
      create: { ...dto, collectionId: id },
      update: { note: dto.note, rank: dto.rank },
    });
  }
  @Delete('collections/:id/items/:propertyId')
  @UseGuards(JwtAuthGuard)
  async removeItem(
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
    @Req() req: AuthRequest,
  ) {
    await this.ownedCollection(id, req.user.id);
    return this.db.collectionItem.deleteMany({
      where: { collectionId: id, propertyId },
    });
  }

  @Post('inquiries')
  @UseGuards(OptionalJwtGuard)
  async inquiry(@Body() dto: InquiryDto, @Req() req: AuthRequest) {
    if (
      !(await this.db.property.findFirst({
        where: { id: dto.propertyId, status: { in: ['ACTIVE', 'PENDING'] } },
      }))
    )
      throw new NotFoundException('This home is unavailable for inquiries.');
    return this.db.inquiry.create({ data: { ...dto, userId: req.user?.id } });
  }
  @Get('inquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AGENT', 'ADMIN')
  inquiries(@Req() req: AuthRequest) {
    return this.db.inquiry.findMany({
      where:
        req.user.role === 'ADMIN' ? {} : { property: { agentId: req.user.id } },
      include: { property: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  @Patch('inquiries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AGENT', 'ADMIN')
  async updateInquiry(
    @Param('id') id: string,
    @Body() dto: InquiryUpdateDto,
    @Req() req: AuthRequest,
  ) {
    const inquiry = await this.db.inquiry.findFirst({
      where: {
        id,
        ...(req.user.role !== 'ADMIN'
          ? { property: { agentId: req.user.id } }
          : {}),
      },
    });
    if (!inquiry) throw new NotFoundException();
    return this.db.inquiry.update({ where: { id }, data: dto });
  }
  @Get('account/inquiries')
  @UseGuards(JwtAuthGuard)
  ownInquiries(@Req() req: AuthRequest) {
    return this.db.inquiry.findMany({
      where: { userId: req.user.id },
      include: { property: { select: { title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  @Get('saved-searches')
  @UseGuards(JwtAuthGuard)
  savedSearches(@Req() req: AuthRequest) {
    return this.db.savedSearch.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
  }
  @Post('saved-searches')
  @UseGuards(JwtAuthGuard)
  savedSearch(@Req() req: AuthRequest, @Body() dto: SavedSearchDto) {
    return this.db.savedSearch.create({
      data: {
        userId: req.user.id,
        name: dto.name,
        filters: dto.filters as Prisma.InputJsonObject,
      },
    });
  }
  @Delete('saved-searches/:id')
  @UseGuards(JwtAuthGuard)
  removeSearch(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.db.savedSearch.deleteMany({
      where: { id, userId: req.user.id },
    });
  }

  @Get('journal')
  journal() {
    return this.db.journalPost.findMany({
      where: { publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: 'desc' },
    });
  }
  @Get('journal/:slug')
  async post(@Param('slug') slug: string) {
    const result = await this.db.journalPost.findFirst({
      where: { slug, publishedAt: { lte: new Date() } },
    });
    if (!result) throw new NotFoundException();
    return result;
  }
  @Post('journal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createPost(@Body() dto: PostDto) {
    return this.db.journalPost.create({
      data: {
        ...dto,
        slug: `${slugify(dto.title)}-${randomUUID().slice(0, 6)}`,
        publishedAt: new Date(),
      },
    });
  }
  @Patch('journal/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.db.journalPost.update({ where: { id }, data: dto });
  }
  @Delete('journal/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deletePost(@Param('id') id: string) {
    return this.db.journalPost.delete({ where: { id } });
  }
  @Post('valuation')
  valuation(@Body() dto: LeadDto) {
    const low = Math.round((dto.sqft * 740) / 10000) * 10000;
    const high = Math.round((dto.sqft * 980) / 10000) * 10000;
    return this.db.sellerLead.create({ data: { ...dto, low, high } });
  }
  @Post('newsletter')
  newsletter(@Body() dto: NewsletterDto) {
    const email = dto.email.toLowerCase().trim();
    return this.db.subscriber
      .upsert({ where: { email }, create: { email }, update: {} })
      .then(() => ({ success: true }));
  }
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AGENT', 'ADMIN')
  async dashboard(@Req() req: AuthRequest) {
    const where = req.user.role === 'ADMIN' ? {} : { agentId: req.user.id };
    const [listings, inquiries, leads, subscribers] = await Promise.all([
      this.db.property.findMany({
        where,
        include: listingInclude,
        orderBy: { updatedAt: 'desc' },
      }),
      this.db.inquiry.count({ where: { property: where } }),
      req.user.role === 'ADMIN'
        ? this.db.sellerLead.findMany({ orderBy: { createdAt: 'desc' } })
        : [],
      req.user.role === 'ADMIN' ? this.db.subscriber.count() : 0,
    ]);
    return { listings, inquiries, leads, subscribers };
  }
  @Get('market')
  async market() {
    const properties = await this.db.property.findMany({
      where: { status: 'ACTIVE', listingType: 'SALE' },
      select: { price: true, publishedAt: true },
      orderBy: { price: 'asc' },
    });
    const n = properties.length;
    const medianPrice = n
      ? (Number(properties[Math.floor((n - 1) / 2)].price) +
          Number(properties[Math.floor(n / 2)].price)) /
        2
      : 0;
    const days = properties
      .filter((p) => p.publishedAt)
      .map((p) =>
        Math.max(
          0,
          Math.round((Date.now() - p.publishedAt!.getTime()) / 86400000),
        ),
      );
    return {
      medianPrice,
      daysOnMarket: days.length
        ? Math.round(days.reduce((a, b) => a + b, 0) / days.length)
        : 0,
      newThisWeek: properties.filter(
        (p) =>
          p.publishedAt && Date.now() - p.publishedAt.getTime() < 604800000,
      ).length,
      active: n,
    };
  }
}
