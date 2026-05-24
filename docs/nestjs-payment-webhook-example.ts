import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  Injectable,
} from '@nestjs/common';
import {
  Column,
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';

export type PaymentGateway = 'WECHAT' | 'ALIPAY';
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED';
export type OrderType = 'TOKEN_TOPUP' | 'VIP_SUBSCRIPTION';

export interface PaymentWebhookDto {
  gateway: PaymentGateway;
  payload: Record<string, unknown>;
  signature: string;
}

export interface ParsedWebhookResult {
  orderNo: string;
  paidAt: Date;
}

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  orderNo!: string;

  @Column()
  userId!: string;

  @Column({ type: 'varchar' })
  status!: OrderStatus;

  @Column({ type: 'varchar' })
  type!: OrderType;

  @Column({ type: 'integer', nullable: true })
  tokenAmount?: number;

  @Column({ type: 'integer', nullable: true })
  vipMonths?: number;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;
}

@Entity('membership')
export class MembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column({ type: 'bigint', default: 0 })
  currentTokens!: number;

  @Column({ type: 'boolean', default: false })
  isVIP!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  vipExpiresAt?: Date;
}

@Controller('/api/v1/payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(private readonly webhookService: PaymentsWebhookService) {}

  @Post('/webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-signature') headerSignature?: string,
  ): Promise<{ code: string; message: string }> {
    const signature = dto.signature ?? headerSignature;
    if (!signature) {
      this.logger.warn('Webhook rejected: missing signature');
      throw new BadRequestException('Missing signature');
    }

    await this.webhookService.handlePaymentSuccessWebhook({
      ...dto,
      signature,
    });

    return {
      code: 'SUCCESS',
      message: 'OK',
    };
  }
}

@Injectable()
export class PaymentsWebhookService {
  private readonly logger = new Logger(PaymentsWebhookService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(MembershipEntity)
    private readonly membershipRepo: Repository<MembershipEntity>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async handlePaymentSuccessWebhook(dto: PaymentWebhookDto): Promise<void> {
    this.logger.log(
      `[Webhook] Incoming payment callback: gateway=${dto.gateway}, signatureLength=${dto.signature.length}`,
    );

    const isSignatureValid = this.verifySignature(
      dto.gateway,
      dto.payload,
      dto.signature,
    );

    if (!isSignatureValid) {
      this.logger.warn(
        `[Webhook] Signature verification failed: gateway=${dto.gateway}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    const parsed = this.parseWebhook(dto.gateway, dto.payload);
    this.logger.log(
      `[Webhook] Parsed callback: orderNo=${parsed.orderNo}, paidAt=${parsed.paidAt.toISOString()}`,
    );

    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const membershipRepo = manager.getRepository(MembershipEntity);

      const order = await orderRepo.findOne({ where: { orderNo: parsed.orderNo } });
      if (!order) {
        this.logger.warn(`[Webhook] Order not found: orderNo=${parsed.orderNo}`);
        throw new BadRequestException('Order does not exist');
      }

      this.logger.log(
        `[Webhook] Current order state: orderNo=${order.orderNo}, status=${order.status}, type=${order.type}, userId=${order.userId}`,
      );

      if (order.status === 'PAID') {
        this.logger.log(
          `[Webhook] Idempotent pass: order already PAID, orderNo=${order.orderNo}`,
        );
        return;
      }

      if (order.status !== 'PENDING') {
        this.logger.warn(
          `[Webhook] Unsupported order status for payment success: orderNo=${order.orderNo}, status=${order.status}`,
        );
        throw new BadRequestException('Order is not payable');
      }

      order.status = 'PAID';
      order.paidAt = parsed.paidAt;
      await orderRepo.save(order);
      this.logger.log(`[Webhook] Order marked as PAID: orderNo=${order.orderNo}`);

      const membership = await membershipRepo.findOne({
        where: { userId: order.userId },
      });
      if (!membership) {
        this.logger.error(
          `[Webhook] Membership missing: userId=${order.userId}, orderNo=${order.orderNo}`,
        );
        throw new InternalServerErrorException('Membership not found');
      }

      if (order.type === 'TOKEN_TOPUP') {
        const topupTokens = order.tokenAmount ?? 0;
        if (topupTokens <= 0) {
          this.logger.error(
            `[Webhook] Invalid tokenAmount for TOKEN_TOPUP: orderNo=${order.orderNo}, tokenAmount=${order.tokenAmount}`,
          );
          throw new InternalServerErrorException('Invalid top-up token amount');
        }

        const redisKey = `membership:tokens:${order.userId}`;
        const latestCachedTokens = await this.redis.incrby(redisKey, topupTokens);
        this.logger.log(
          `[Webhook] Redis INCRBY success: key=${redisKey}, delta=${topupTokens}, newValue=${latestCachedTokens}`,
        );

        membership.currentTokens += topupTokens;
        await membershipRepo.save(membership);
        this.logger.log(
          `[Webhook] PostgreSQL membership.currentTokens updated: userId=${order.userId}, currentTokens=${membership.currentTokens}`,
        );
      }

      if (order.type === 'VIP_SUBSCRIPTION') {
        const months = order.vipMonths ?? 0;
        if (months <= 0) {
          this.logger.error(
            `[Webhook] Invalid vipMonths for VIP_SUBSCRIPTION: orderNo=${order.orderNo}, vipMonths=${order.vipMonths}`,
          );
          throw new InternalServerErrorException('Invalid vip months');
        }

        const now = new Date();
        const baseDate =
          membership.vipExpiresAt && membership.vipExpiresAt > now
            ? membership.vipExpiresAt
            : now;
        const nextExpireAt = new Date(baseDate);
        nextExpireAt.setMonth(nextExpireAt.getMonth() + months);

        membership.isVIP = true;
        membership.vipExpiresAt = nextExpireAt;
        await membershipRepo.save(membership);

        this.logger.log(
          `[Webhook] VIP activated/extended: userId=${order.userId}, months=${months}, vipExpiresAt=${nextExpireAt.toISOString()}`,
        );
      }

      this.logger.log(
        `[Webhook] Payment callback handled successfully: orderNo=${order.orderNo}`,
      );
    });
  }

  private verifySignature(
    gateway: PaymentGateway,
    payload: Record<string, unknown>,
    signature: string,
  ): boolean {
    // TODO: Replace this section with real signature verification.
    // 1) Build canonical string from payload according to gateway rules.
    // 2) Load gateway public key or certificate from secure config.
    // 3) Verify signature with crypto APIs.
    // 4) Return true/false.
    this.logger.debug(
      `[Webhook] Signature verification placeholder: gateway=${gateway}, payloadKeys=${Object.keys(payload).join(',')}, signaturePreview=${signature.slice(0, 8)}***`,
    );

    return true;
  }

  private parseWebhook(
    gateway: PaymentGateway,
    payload: Record<string, unknown>,
  ): ParsedWebhookResult {
    const rawOrderNo = payload.orderNo;
    if (typeof rawOrderNo !== 'string' || rawOrderNo.trim().length === 0) {
      this.logger.warn(
        `[Webhook] Missing orderNo in payload: gateway=${gateway}, payload=${JSON.stringify(payload)}`,
      );
      throw new BadRequestException('Invalid payload: missing orderNo');
    }

    const rawPaidAt = payload.paidAt;
    const paidAt =
      typeof rawPaidAt === 'string' && rawPaidAt
        ? new Date(rawPaidAt)
        : new Date();

    if (Number.isNaN(paidAt.getTime())) {
      this.logger.warn(
        `[Webhook] Invalid paidAt in payload: gateway=${gateway}, paidAt=${String(rawPaidAt)}`,
      );
      throw new BadRequestException('Invalid payload: paidAt format error');
    }

    return {
      orderNo: rawOrderNo.trim(),
      paidAt,
    };
  }
}
