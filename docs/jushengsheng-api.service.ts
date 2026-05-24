import { Inject, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Redis from 'ioredis';

const TOKEN_CACHE_KEY = 'jushengsheng:auth:token';
const TOKEN_TTL_SECONDS = 7100;
const DEFAULT_TIMEOUT_MS = 10_000;

type Nullable<T> = T | null;

export interface SubmissionAsset {
  script: string;
  images: string[];
  mediaLinks: string[];
  title?: string;
  description?: string;
}

export interface SubmissionRepository {
  findAssetsBySubmissionId(submissionId: string): Promise<Nullable<SubmissionAsset>>;
}

interface JushengshengTokenResponse {
  code: number;
  message: string;
  data?: {
    token: string;
    expiresIn?: number;
  };
}

interface JushengshengCreateDramaResponse {
  code: number;
  message: string;
  data?: {
    dramaId: string;
    shareUrl: string;
  };
}

@Injectable()
export class JushengshengApiService {
  private readonly logger = new Logger(JushengshengApiService.name);
  private readonly httpClient: AxiosInstance;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('SUBMISSION_REPOSITORY')
    private readonly submissionRepository: SubmissionRepository,
  ) {
    this.httpClient = axios.create({
      baseURL: 'https://jushengsheng.com/api/v1',
      timeout: DEFAULT_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.installInterceptors();
  }

  async getAuthToken(): Promise<string> {
    const cachedToken = await this.redis.get(TOKEN_CACHE_KEY);
    if (cachedToken) {
      return cachedToken;
    }

    const appId = process.env.JUSHENGSHENG_APP_ID;
    const appSecret = process.env.JUSHENGSHENG_APP_SECRET;

    if (!appId || !appSecret) {
      this.logger.error('Jushengsheng credentials missing in environment variables');
      throw new Error('Jushengsheng credentials not configured');
    }

    try {
      const response = await this.httpClient.post<JushengshengTokenResponse>('/auth/token', {
        appId,
        appSecret,
      });

      const token = response.data?.data?.token;
      if (!token) {
        this.logger.error('Jushengsheng token response missing token payload', {
          response: response.data,
        });
        throw new Error('Invalid token response from Jushengsheng');
      }

      await this.redis.set(TOKEN_CACHE_KEY, token, 'EX', TOKEN_TTL_SECONDS);
      return token;
    } catch (error) {
      this.handleAxiosError('Failed to fetch Jushengsheng auth token', error);
      throw new Error('Unable to fetch Jushengsheng auth token');
    }
  }

  async pushAssetToPlatform(submissionId: string): Promise<{ dramaId: string; shareUrl: string }> {
    try {
      const submissionAssets = await this.submissionRepository.findAssetsBySubmissionId(submissionId);
      if (!submissionAssets) {
        this.logger.warn(`Submission not found or has no assets, submissionId=${submissionId}`);
        throw new Error('Submission assets not found');
      }

      const token = await this.getAuthToken();
      const payload = this.buildDramaCreatePayload(submissionId, submissionAssets);

      const response = await this.httpClient.post<JushengshengCreateDramaResponse>(
        '/drama/create',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const dramaId = response.data?.data?.dramaId;
      const shareUrl = response.data?.data?.shareUrl;

      if (!dramaId || !shareUrl) {
        this.logger.error('Jushengsheng drama create response invalid', {
          submissionId,
          response: response.data,
        });
        throw new Error('Invalid drama create response from Jushengsheng');
      }

      return { dramaId, shareUrl };
    } catch (error) {
      this.handleAxiosError(
        `Failed to push submission assets to Jushengsheng, submissionId=${submissionId}`,
        error,
      );
      throw new Error('Unable to push submission assets to Jushengsheng platform');
    }
  }

  private buildDramaCreatePayload(submissionId: string, assets: SubmissionAsset): Record<string, unknown> {
    return {
      bizSubmissionId: submissionId,
      title: assets.title ?? `Submission-${submissionId}`,
      description: assets.description ?? '',
      scriptContent: assets.script,
      imageList: assets.images,
      mediaList: assets.mediaLinks,
    };
  }

  private installInterceptors(): void {
    this.httpClient.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        const startedAt = Date.now();
        (config as AxiosRequestConfig & { metadata?: { startedAt: number } }).metadata = { startedAt };

        this.logger.debug(
          `[Jushengsheng Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        );

        return config;
      },
      (error) => {
        this.logger.error('[Jushengsheng Request Error] request interceptor failed', error);
        return Promise.reject(error);
      },
    );

    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => {
        const metadata = (response.config as AxiosRequestConfig & { metadata?: { startedAt: number } })
          .metadata;
        const duration = metadata?.startedAt ? Date.now() - metadata.startedAt : -1;

        this.logger.debug(
          `[Jushengsheng Response] ${response.status} ${response.config.url} (${duration}ms)`,
        );

        return response;
      },
      (error) => {
        this.handleAxiosError('[Jushengsheng Response Error] response interceptor captured error', error);
        return Promise.reject(error);
      },
    );
  }

  private handleAxiosError(message: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      this.logger.error(message, {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        status,
        code: axiosError.code,
        response: data,
      });

      if (status === 401) {
        void this.redis.del(TOKEN_CACHE_KEY);
      }
      return;
    }

    this.logger.error(message, error as Error);
  }
}
