import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Comment, Prisma } from '@prisma/client';
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

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly htmlSanitizer: HtmlSanitizerService,
  ) {}

  async create(dto: CreateCommentDto): Promise<CommentResponse> {
    const comment = await this.prisma.comment.create({
      data: this.toCreateData(dto),
    });

    this.emitCreated(comment.id);

    return this.toResponse(comment);
  }

  async createReply(
    parentId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponse> {
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
    });

    this.emitCreated(comment.id);

    return this.toResponse(comment);
  }

  preview(dto: PreviewCommentDto): PreviewCommentResponse {
    return { html: this.htmlSanitizer.sanitize(dto.text) };
  }

  async findAll(query: CommentQueryDto): Promise<PaginatedCommentsResponse> {
    const { page, limit, sortField, sortOrder } = query;
    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderBy(sortField, sortOrder);

    const [roots, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: null },
        orderBy,
        skip,
        take: limit,
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

  async findOne(id: string): Promise<CommentResponse> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with id "${id}" not found`);
    }

    const repliesByParent = await this.loadRepliesMap();

    return this.toResponseWithReplies(comment, repliesByParent);
  }

  private async loadRepliesMap(): Promise<Map<string, Comment[]>> {
    const replies = await this.prisma.comment.findMany({
      where: { parentId: { not: null } },
      orderBy: { createdAt: 'asc' },
    });

    const repliesByParent = new Map<string, Comment[]>();

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
    comment: Comment,
    repliesByParent: Map<string, Comment[]>,
  ): CommentResponse {
    const childComments = repliesByParent.get(comment.id) ?? [];

    return {
      ...this.toResponse(comment),
      replies: childComments.map((reply) =>
        this.toResponseWithReplies(reply, repliesByParent),
      ),
    };
  }

  private toResponse(comment: Comment): CommentResponse {
    return {
      id: comment.id,
      userName: comment.userName,
      email: comment.email,
      homePage: comment.homePage,
      text: comment.text,
      parentId: comment.parentId,
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
