/**
 * 集中的模型目录 —— 单一事实来源。
 *
 * 所有页面 / 组件中需要展示模型列表、价格、能力的位置,
 * 都应当从这里读取,避免散落各处的硬编码导致版本不一致。
 *
 * 价格说明:
 *   - input_rate / output_rate 为相对「基准积分单位」的倍率,
 *     遵循 new-api 的计费惯例(基准 = $0.002 / 1K input tokens)。
 *   - context 单位 K tokens。
 *
 * 最近更新:2026-05(覆盖 GPT-5、Claude 4 Opus/Sonnet、Gemini 2.5、
 *   DeepSeek V3、Grok 3、Llama 4、Mistral Large 2 等最新模型版本)。
 */

import type { PricingEntry } from '@/types/api';
import type { AgentOption, ModelOption } from '@/types/chat';

export interface ModelMeta extends ModelOption {
  /** 上下文窗口大小,单位 K tokens。 */
  context: number;
  /** 能力标签,用于价格卡 / 检索过滤。 */
  tags: string[];
  /** 是否被列为「推荐」展示在选择器顶部。 */
  recommended?: boolean;
  /** 是否支持视觉 / 图像输入。 */
  vision?: boolean;
  /** 是否支持工具调用 / function calling。 */
  tools?: boolean;
  /** 是否为推理 (reasoning) 模型。 */
  reasoning?: boolean;
}

/* ============================================================ *
 *  模型目录                                                     *
 * ============================================================ */

export const MODEL_CATALOG: ModelMeta[] = [
  /* ---------------- OpenAI ---------------- */
  {
    id: 'gpt-5',
    label: 'GPT-5',
    provider: 'openai',
    description: '旗舰多模态,顶级推理与代码',
    inputRate: 1.25,
    outputRate: 10,
    context: 400,
    tags: ['多模态', '推理', '推荐'],
    recommended: true,
    vision: true,
    tools: true,
    reasoning: true,
  },
  {
    id: 'gpt-5-mini',
    label: 'GPT-5 mini',
    provider: 'openai',
    description: '更轻量的 GPT-5,延迟更低',
    inputRate: 0.25,
    outputRate: 2,
    context: 400,
    tags: ['多模态', '高性价比'],
    vision: true,
    tools: true,
  },
  {
    id: 'gpt-5-nano',
    label: 'GPT-5 nano',
    provider: 'openai',
    description: '超低成本、超快响应',
    inputRate: 0.05,
    outputRate: 0.4,
    context: 400,
    tags: ['极速', '低成本'],
    tools: true,
  },
  {
    id: 'o3',
    label: 'OpenAI o3',
    provider: 'openai',
    description: '深度推理,擅长数学与科学',
    inputRate: 2,
    outputRate: 8,
    context: 200,
    tags: ['推理', '链式思考'],
    reasoning: true,
    tools: true,
  },
  {
    id: 'o4-mini',
    label: 'OpenAI o4-mini',
    provider: 'openai',
    description: '高性价比的推理模型',
    inputRate: 0.55,
    outputRate: 2.2,
    context: 200,
    tags: ['推理', '高性价比'],
    reasoning: true,
    tools: true,
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    provider: 'openai',
    description: '面向编码与长上下文优化',
    inputRate: 1,
    outputRate: 4,
    context: 1000,
    tags: ['代码', '长上下文'],
    vision: true,
    tools: true,
  },
  {
    id: 'gpt-4.1-mini',
    label: 'GPT-4.1 mini',
    provider: 'openai',
    description: '低成本长上下文版本',
    inputRate: 0.2,
    outputRate: 0.8,
    context: 1000,
    tags: ['长上下文', '高性价比'],
    vision: true,
    tools: true,
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'openai',
    description: '多模态、响应快',
    inputRate: 1,
    outputRate: 3,
    context: 128,
    tags: ['多模态'],
    vision: true,
    tools: true,
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    provider: 'openai',
    description: '低成本、轻量',
    inputRate: 0.15,
    outputRate: 0.6,
    context: 128,
    tags: ['高性价比'],
    vision: true,
    tools: true,
  },

  /* ---------------- Anthropic ---------------- */
  {
    id: 'claude-opus-4',
    label: 'Claude Opus 4',
    provider: 'anthropic',
    description: '最强 Claude,适合复杂推理与代码',
    inputRate: 7.5,
    outputRate: 37.5,
    context: 200,
    tags: ['推理', '代码', '推荐'],
    recommended: true,
    vision: true,
    tools: true,
    reasoning: true,
  },
  {
    id: 'claude-sonnet-4',
    label: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: '平衡性能与成本的主力模型',
    inputRate: 1.5,
    outputRate: 7.5,
    context: 200,
    tags: ['推理', '代码'],
    recommended: true,
    vision: true,
    tools: true,
    reasoning: true,
  },
  {
    id: 'claude-haiku-4',
    label: 'Claude Haiku 4',
    provider: 'anthropic',
    description: '轻盈快速、低延迟',
    inputRate: 0.4,
    outputRate: 2,
    context: 200,
    tags: ['极速', '高性价比'],
    vision: true,
    tools: true,
  },
  {
    id: 'claude-3-7-sonnet',
    label: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    description: '可切换扩展思考模式',
    inputRate: 1.5,
    outputRate: 7.5,
    context: 200,
    tags: ['推理', '代码', '思考'],
    vision: true,
    tools: true,
    reasoning: true,
  },
  {
    id: 'claude-3-5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: '推理与代码',
    inputRate: 1.5,
    outputRate: 7.5,
    context: 200,
    tags: ['代码', '推理'],
    vision: true,
    tools: true,
  },

  /* ---------------- Google ---------------- */
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    provider: 'google',
    description: '顶级推理,百万级上下文',
    inputRate: 0.625,
    outputRate: 5,
    context: 2000,
    tags: ['长上下文', '推理', '推荐'],
    recommended: true,
    vision: true,
    tools: true,
    reasoning: true,
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'google',
    description: '极速、低成本、原生多模态',
    inputRate: 0.075,
    outputRate: 0.3,
    context: 1000,
    tags: ['极速', '多模态', '高性价比'],
    vision: true,
    tools: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    description: '更轻量的 Flash 版本',
    inputRate: 0.0375,
    outputRate: 0.15,
    context: 1000,
    tags: ['极速', '低成本'],
    vision: true,
    tools: true,
  },
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    provider: 'google',
    description: '稳定的快速多模态',
    inputRate: 0.05,
    outputRate: 0.2,
    context: 1000,
    tags: ['极速', '多模态'],
    vision: true,
    tools: true,
  },

  /* ---------------- DeepSeek ---------------- */
  {
    id: 'deepseek-v3',
    label: 'DeepSeek V3',
    provider: 'deepseek',
    description: '高性价比国产旗舰',
    inputRate: 0.14,
    outputRate: 0.28,
    context: 128,
    tags: ['中文', '代码', '高性价比'],
    recommended: true,
    tools: true,
  },
  {
    id: 'deepseek-r1',
    label: 'DeepSeek R1',
    provider: 'deepseek',
    description: '开源推理王者,可见思考链',
    inputRate: 0.275,
    outputRate: 1.1,
    context: 128,
    tags: ['推理', '中文'],
    reasoning: true,
  },
  {
    id: 'deepseek-chat',
    label: 'DeepSeek Chat',
    provider: 'deepseek',
    description: '稳定的对话模型',
    inputRate: 0.14,
    outputRate: 0.28,
    context: 64,
    tags: ['中文', '高性价比'],
    tools: true,
  },

  /* ---------------- xAI ---------------- */
  {
    id: 'grok-3',
    label: 'Grok 3',
    provider: 'xai',
    description: 'xAI 旗舰,实时联网思考',
    inputRate: 1.5,
    outputRate: 7.5,
    context: 1000,
    tags: ['推理', '实时'],
    vision: true,
    tools: true,
    reasoning: true,
  },
  {
    id: 'grok-3-mini',
    label: 'Grok 3 mini',
    provider: 'xai',
    description: '轻量版 Grok 3',
    inputRate: 0.15,
    outputRate: 0.25,
    context: 1000,
    tags: ['高性价比', '实时'],
    tools: true,
  },
  {
    id: 'grok-2-vision',
    label: 'Grok 2 Vision',
    provider: 'xai',
    description: 'Grok 多模态版本',
    inputRate: 1,
    outputRate: 5,
    context: 32,
    tags: ['多模态'],
    vision: true,
    tools: true,
  },

  /* ---------------- Meta ---------------- */
  {
    id: 'llama-4-maverick',
    label: 'Llama 4 Maverick',
    provider: 'meta',
    description: 'Meta 最新开源旗舰',
    inputRate: 0.25,
    outputRate: 0.85,
    context: 1000,
    tags: ['开源', '多模态'],
    vision: true,
    tools: true,
  },
  {
    id: 'llama-4-scout',
    label: 'Llama 4 Scout',
    provider: 'meta',
    description: '轻量级开源选择',
    inputRate: 0.09,
    outputRate: 0.29,
    context: 1000,
    tags: ['开源', '高性价比'],
    vision: true,
    tools: true,
  },

  /* ---------------- Mistral ---------------- */
  {
    id: 'mistral-large-2',
    label: 'Mistral Large 2',
    provider: 'mistral',
    description: 'Mistral 旗舰多语言模型',
    inputRate: 1,
    outputRate: 3,
    context: 128,
    tags: ['多语言', '代码'],
    tools: true,
  },
  {
    id: 'mistral-small-3',
    label: 'Mistral Small 3',
    provider: 'mistral',
    description: '快速、可商用的小模型',
    inputRate: 0.1,
    outputRate: 0.3,
    context: 128,
    tags: ['极速', '高性价比'],
    tools: true,
  },

  /* ---------------- 阿里通义 ---------------- */
  {
    id: 'qwen3-max',
    label: '通义千问 Qwen3 Max',
    provider: 'alibaba',
    description: '阿里旗舰中文模型',
    inputRate: 0.6,
    outputRate: 2.4,
    context: 256,
    tags: ['中文', '推理'],
    vision: true,
    tools: true,
  },
  {
    id: 'qwen3-coder',
    label: 'Qwen3 Coder',
    provider: 'alibaba',
    description: '代码专精',
    inputRate: 0.3,
    outputRate: 1.2,
    context: 256,
    tags: ['代码', '中文'],
    tools: true,
  },

  /* ---------------- 月之暗面 ---------------- */
  {
    id: 'kimi-k2',
    label: 'Kimi K2',
    provider: 'moonshot',
    description: '月之暗面长上下文专家',
    inputRate: 0.6,
    outputRate: 2.5,
    context: 2000,
    tags: ['长上下文', '中文'],
    tools: true,
  },

  /* ---------------- 智谱 ---------------- */
  {
    id: 'glm-4.6',
    label: 'GLM-4.6',
    provider: 'zhipu',
    description: '智谱清言旗舰',
    inputRate: 0.3,
    outputRate: 0.9,
    context: 128,
    tags: ['中文', '代码'],
    tools: true,
  },
];

/* ============================================================ *
 *  导出便捷视图                                                  *
 * ============================================================ */

/** 对话工作台默认展示的「推荐」模型(按推荐度排序)。 */
export const DEFAULT_MODELS: ModelOption[] = [
  ...MODEL_CATALOG.filter((m) => m.recommended),
  ...MODEL_CATALOG.filter((m) => !m.recommended).slice(0, 6),
].map(({ id, label, provider, description, inputRate, outputRate }) => ({
  id,
  label,
  provider,
  description,
  inputRate,
  outputRate,
}));

/** 渠道表单 / 模型选择下拉中的「常用模型」快捷标签。 */
export const COMMON_MODELS: string[] = MODEL_CATALOG.map((m) => m.id);

/** 提供商分类(可在选择器中按 provider 分组展示)。 */
export const PROVIDERS: { id: string; label: string }[] = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Google Gemini' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'xai', label: 'xAI Grok' },
  { id: 'meta', label: 'Meta Llama' },
  { id: 'mistral', label: 'Mistral' },
  { id: 'alibaba', label: '阿里通义' },
  { id: 'moonshot', label: '月之暗面 Kimi' },
  { id: 'zhipu', label: '智谱 GLM' },
];

/** 与 new-api 后端 channel.type 对应的提供商类型枚举(常用项)。 */
export const PROVIDER_TYPES: { id: number; label: string }[] = [
  { id: 1, label: 'OpenAI' },
  { id: 14, label: 'Anthropic' },
  { id: 24, label: 'Google Gemini' },
  { id: 28, label: 'Mistral' },
  { id: 36, label: 'DeepSeek' },
  { id: 41, label: 'xAI Grok' },
  { id: 42, label: 'Meta Llama' },
  { id: 50, label: '阿里通义' },
  { id: 51, label: '月之暗面 Kimi' },
  { id: 52, label: '智谱 GLM' },
  { id: 99, label: '自定义(OpenAI 兼容)' },
];

/** 价格卡使用的完整列表(直接来自 catalog,保证版本一致)。 */
export const PRICING_CATALOG: PricingEntry[] = MODEL_CATALOG.map((m) => ({
  model: m.id,
  provider: m.provider,
  input_rate: m.inputRate ?? 0,
  output_rate: m.outputRate ?? 0,
  context: m.context,
  tags: m.tags,
}));

/** 默认智能体预设。 */
export const DEFAULT_AGENTS: AgentOption[] = [
  {
    id: 'default',
    name: '普通对话',
    emoji: '✦',
    modelId: 'gpt-5-mini',
    systemPrompt: '你是一位乐于助人的智能助手。',
  },
  {
    id: 'researcher',
    name: '深度研究员',
    emoji: '◍',
    modelId: 'claude-opus-4',
    systemPrompt: '你是一名严谨的研究员,请始终标明资料出处。',
  },
  {
    id: 'coder',
    name: '代码评审官',
    emoji: '◰',
    modelId: 'claude-sonnet-4',
    systemPrompt: '你是一名资深工程师,请以代码评审的严谨度提出反馈。',
  },
  {
    id: 'reasoner',
    name: '推理专家',
    emoji: '⌬',
    modelId: 'o3',
    systemPrompt: '你擅长分步推理与数学证明,请展开思考过程。',
  },
  {
    id: 'long-doc',
    name: '长文档分析',
    emoji: '◇',
    modelId: 'gemini-2.5-pro',
    systemPrompt: '你擅长阅读超长文档并提取要点,请输出结构化摘要。',
  },
  {
    id: 'chinese',
    name: '中文助手',
    emoji: '中',
    modelId: 'deepseek-v3',
    systemPrompt: '你是一名母语为中文的智能助手,回答简洁、地道。',
  },
];

/** 通过 id 查找模型元数据。 */
export function findModel(id: string): ModelMeta | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}
