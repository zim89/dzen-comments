import { createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Attachment, Comment, Prisma } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { CaptchaService } from '../captcha/captcha.service';
import { FilesService } from '../files/files.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommentQueryDto, CommentSortField } from './dto/comment-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PreviewCommentDto } from './dto/preview-comment.dto';
import {
  COMMENT_CREATED_EVENT,
  CommentCreatedEvent,
} from './events/comment-created.event';
import { HtmlSanitizerService } from './html-sanitizer.service';
import {
  CommentResponse,
  PaginatedCommentsResponse,
  PreviewCommentResponse,
} from './comments.types';

const COMMENTS_LIST_CACHE_TTL_SECONDS = 60;
const COMMENTS_LIST_CACHE_PREFIX = 'comments:list:';

type CommentWithAttachment = Comment & { attachment: Attachment | null };

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly htmlSanitizer: HtmlSanitizerService,
    private readonly captchaService: CaptchaService,
    private readonly cacheService: CacheService,
    private readonly filesService: FilesService,
  ) {}

  async create(
    dto: CreateCommentDto,
    file?: Express.Multer.File,
  ): Promise<CommentResponse> {
    await this.captchaService.verify(dto.captchaId, dto.captchaValue);

    const comment = await this.prisma.comment.create({
      data: this.toCreateData(dto),
      include: { attachment: true },
    });

    if (file) {
      await this.filesService.attachToComment(comment.id, file);
    }

    this.emitCreated(comment.id);

    return this.findOne(comment.id);
  }

  async createReply(
    parentId: string,
    dto: CreateCommentDto,
    file?: Express.Multer.File,
  ): Promise<CommentResponse> {
    await this.captchaService.verify(dto.captchaId, dto.captchaValue);

    const parent = await this.prisma.comment.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException(`Comment with id "${parentId}" not found`);
    }

    const comment = await this.prisma.comment.create({
      data: {
        ...this.toCreateData(dto),
        parentId,
      },
      include: { attachment: true },
    });

    if (file) {
      await this.filesService.attachToComment(comment.id, file);
    }

    this.emitCreated(comment.id);

    return this.findOne(comment.id);
  }

  preview(dto: PreviewCommentDto): PreviewCommentResponse {
    return { html: this.htmlSanitizer.sanitize(dto.text) };
  }

  async findAll(query: CommentQueryDto): Promise<PaginatedCommentsResponse> {
    const cacheKey = this.buildListCacheKey(query);
    const cached =
      await this.cacheService.get<PaginatedCommentsResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.findAllFromDatabase(query);
    await this.cacheService.set(
      cacheKey,
      result,
      COMMENTS_LIST_CACHE_TTL_SECONDS,
    );

    return result;
  }

  async findOne(id: string): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { attachment: true },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id "${id}" not found`);
    }

    const repliesByParent = await this.loadRepliesMap();

    return this.toResponseWithReplies(comment, repliesByParent);
  }

  async findByIdForBroadcast(id: string): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { attachment: true },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id "${id}" not found`);
    }

    return this.toResponse(comment);
  }

  async remove(id: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id "${id}" not found`);
    }

    const subtreeIds = await this.collectSubtreeIds(id);
    const attachments = await this.prisma.attachment.findMany({
      where: { commentId: { in: subtreeIds } },
    });

    await this.prisma.comment.delete({ where: { id } });

    for (const attachment of attachments) {
      this.filesService.deleteStoredFile(attachment.storedName);
    }

    await this.cacheService.invalidate('comments:list:*');
  }

  private async collectSubtreeIds(rootId: string): Promise<string[]> {
    const comments = await this.prisma.comment.findMany({
      select: { id: true, parentId: true },
    });

    const ids = new Set<string>([rootId]);
    let changed = true;

    while (changed) {
      changed = false;

      for (const comment of comments) {
        if (
          comment.parentId &&
          ids.has(comment.parentId) &&
          !ids.has(comment.id)
        ) {
          ids.add(comment.id);
          changed = true;
        }
      }
    }

    return [...ids];
  }

  private async findAllFromDatabase(
    query: CommentQueryDto,
  ): Promise<PaginatedCommentsResponse> {
    const { page, limit, sortField, sortOrder } = query;
    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderBy(sortField, sortOrder);

    const [roots, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: null },
        orderBy,
        skip,
        take: limit,
        include: { attachment: true },
      }),
      this.prisma.comment.count({ where: { parentId: null } }),
    ]);

    const repliesByParent = await this.loadRepliesMap();

    return {
      data: roots.map((comment) =>
        this.toResponseWithReplies(comment, repliesByParent),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  private buildListCacheKey(query: CommentQueryDto): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(query))
      .digest('hex');

    return `${COMMENTS_LIST_CACHE_PREFIX}${hash}`;
  }

  private async loadRepliesMap(): Promise<
    Map<string, CommentWithAttachment[]>
  > {
    const replies = await this.prisma.comment.findMany({
      where: { parentId: { not: null } },
      orderBy: { createdAt: 'desc' },
      include: { attachment: true },
    });

    const repliesByParent = new Map<string, CommentWithAttachment[]>();

    for (const reply of replies) {
      if (!reply.parentId) {
        continue;
      }

      const siblings = repliesByParent.get(reply.parentId) ?? [];
      siblings.push(reply);
      repliesByParent.set(reply.parentId, siblings);
    }

    return repliesByParent;
  }

  private buildOrderBy(
    sortField: CommentSortField,
    sortOrder: Prisma.SortOrder,
  ): Prisma.CommentOrderByWithRelationInput {
    return { [sortField]: sortOrder };
  }

  private toResponseWithReplies(
    comment: CommentWithAttachment,
    repliesByParent: Map<string, CommentWithAttachment[]>,
  ): CommentResponse {
    const childComments = repliesByParent.get(comment.id) ?? [];

    return {
      ...this.toResponse(comment),
      replies: childComments.map((reply) =>
        this.toResponseWithReplies(reply, repliesByParent),
      ),
    };
  }

  private toResponse(comment: CommentWithAttachment): CommentResponse {
    return {
      id: comment.id,
      userName: comment.userName,
      email: comment.email,
      homePage: comment.homePage,
      text: comment.text,
      parentId: comment.parentId,
      attachment: comment.attachment
        ? this.filesService.toAttachmentResponse(comment.attachment)
        : null,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: [],
    };
  }

  private emitCreated(commentId: string): void {
    this.eventEmitter.emit(
      COMMENT_CREATED_EVENT,
      new CommentCreatedEvent(commentId),
    );
  }

  private toCreateData(dto: CreateCommentDto): {
    userName: string;
    email: string;
    homePage?: string;
    text: string;
  } {
    return {
      userName: dto.userName,
      email: dto.email,
      homePage: dto.homePage,
      text: this.htmlSanitizer.sanitize(dto.text),
    };
  }
}
