/**
 * Agent App 注册中心 —— 参考 Genspark 的「超级智能体 + 多 AI 应用」形态。
 *
 *  每个 App 提供:
 *    - id / name / tagline / description / category
 *    - 推荐模型 (recommendedModelId,可被用户覆盖)
 *    - 系统提示词 (systemPrompt)
 *    - starters: 进入即可点击的灵感提问
 *    - capabilities: 能力标签 (用于卡片展示)
 *    - emoji: 极简符号图标 (保持黑白中性视觉)
 *
 *  /agents 页面渲染所有 App;点击卡片跳转 `/chat?app=<id>` 即可加载预设。
 */

import { findModel } from './models-catalog';

export type AgentAppCategory =
  | 'general'      // 通用对话 / 助手
  | 'productivity' // 文档 / 表格 / 幻灯片
  | 'research'     // 深度研究 / 检索
  | 'developer'    // 开发 / 代码
  | 'creative'     // 写作 / 创意
  | 'data'         // 数据 / 分析
  | 'media'        // 多媒体 / 视觉 / 语音
  | 'business';    // 商业 / 营销

export interface AgentApp {
  id: string;
  name: string;
  /** 单行标语,用于卡片副标题。 */
  tagline: string;
  /** 详细描述,用于详情区。 */
  description: string;
  category: AgentAppCategory;
  /** Lucide 图标名(用于 React 端按名查找)。 */
  icon: string;
  /** 推荐模型 id(来自 lib/models-catalog)。 */
  recommendedModelId: string;
  /** 系统提示词。 */
  systemPrompt: string;
  /** 起步示例,展示在工作台空状态。 */
  starters: string[];
  /** 能力标签 (中文)。 */
  capabilities: string[];
  /** 是否为「明星」应用 (在卡片左上挂角标)。 */
  featured?: boolean;
  /** 是否标记为 Beta。 */
  beta?: boolean;
}

export const AGENT_CATEGORIES: { id: AgentAppCategory; label: string }[] = [
  { id: 'general', label: '通用助手' },
  { id: 'productivity', label: '生产力' },
  { id: 'research', label: '研究检索' },
  { id: 'developer', label: '开发与代码' },
  { id: 'creative', label: '创意写作' },
  { id: 'data', label: '数据分析' },
  { id: 'media', label: '多媒体' },
  { id: 'business', label: '商业运营' },
];

export const AGENT_APPS: AgentApp[] = [
  /* ---------------- 通用 / 旗舰 ---------------- */
  {
    id: 'super-agent',
    name: '超级智能体',
    tagline: 'AI 自主规划、调用工具、完成任务',
    description:
      '一站式自主智能体:接到目标后自行拆解步骤,联网检索、调用工具、产出最终交付物。适合复杂、跨步骤任务。',
    category: 'general',
    icon: 'Sparkles',
    recommendedModelId: 'gpt-5',
    systemPrompt:
      '你是一个自主智能体 (Super Agent)。接到目标后:\n1. 先把任务拆解为编号步骤;\n2. 逐步执行并在每步开头标注「步骤 N」;\n3. 遇到不确定的地方,主动向用户索取信息;\n4. 最后用清晰的结论 + 可交付清单收尾。',
    starters: [
      '帮我做一份「AI 浏览器」赛道的竞品分析交付物',
      '为下周的产品发布会拟一份完整执行计划',
      '调研日本数字银行牌照的获取流程',
      '为初创公司起草一份种子轮 BP 大纲',
    ],
    capabilities: ['任务拆解', '联网检索', '工具调用', '多步执行'],
    featured: true,
  },
  {
    id: 'chat',
    name: '通用对话',
    tagline: '轻量、稳定、随时可用',
    description: '默认的全能助手,适合日常问答、闲聊、知识查询、轻量草拟。',
    category: 'general',
    icon: 'MessageSquare',
    recommendedModelId: 'gpt-5-mini',
    systemPrompt: '你是一位乐于助人的智能助手,回答简洁、准确、友好。',
    starters: [
      '今天有什么新闻值得关注?',
      '帮我把这段英文翻译成中文',
      '我该怎么改善睡眠质量?',
      '用三句话解释什么是熵',
    ],
    capabilities: ['日常问答', '多语言', '极速响应'],
  },

  /* ---------------- 研究 / 检索 ---------------- */
  {
    id: 'deep-research',
    name: '深度研究',
    tagline: '生成可引用的研究报告',
    description:
      '面向严肃研究场景:多源检索、交叉验证、给出结构化报告与可点击引文。适合行业研究、学术综述、尽调。',
    category: 'research',
    icon: 'Telescope',
    recommendedModelId: 'claude-opus-4',
    systemPrompt:
      '你是一位严谨的研究分析师。回答须:\n1. 先输出「研究问题 / 关键发现」摘要;\n2. 正文按主题分小节,每个论断后用 [n] 标注来源;\n3. 末尾给出参考来源列表;\n4. 区分「事实」「推测」「未知」。',
    starters: [
      '撰写一份「全球 AI 视频生成」市场研究报告',
      '比较 GPT-5、Claude Opus 4、Gemini 2.5 的能力差异',
      '梳理 2024-2026 年 AI 监管政策走向',
      '调研小米汽车产能与销量趋势',
    ],
    capabilities: ['多源检索', '引用追溯', '结构化报告'],
    featured: true,
  },
  {
    id: 'ai-browser',
    name: 'AI 浏览器',
    tagline: '让 AI 替你浏览网页',
    description:
      '把网页交给 AI:总结长文、提取关键信息、对比多个页面、按你的提问解读复杂内容。',
    category: 'research',
    icon: 'Globe',
    recommendedModelId: 'gemini-2.5-pro',
    systemPrompt:
      '你是一个 AI 浏览助手。用户会粘贴或要求你处理网页内容:\n- 自动识别主体内容、忽略广告/导航;\n- 输出「TL;DR」摘要 + 分主题要点;\n- 关键数据/人物加粗;\n- 提出 3 条可继续深入的问题。',
    starters: [
      '把这个 Hacker News 帖子总结给我',
      '对比这两篇产品发布博文的差异',
      '从这份 SEC 文件中提取关键风险条款',
      '把这个 YouTube 视频的要点列出来',
    ],
    capabilities: ['长文摘要', '关键信息提取', '多页对比'],
  },

  /* ---------------- 生产力 ---------------- */
  {
    id: 'ai-slides',
    name: 'AI 幻灯片',
    tagline: '一句话生成完整演示稿',
    description:
      '输入主题 / 大纲,自动生成结构化幻灯片内容:封面、目录、章节页、要点、备注、结语。可继续微调。',
    category: 'productivity',
    icon: 'Presentation',
    recommendedModelId: 'claude-sonnet-4',
    systemPrompt:
      '你是一位顶级演示设计师。请用 Markdown 输出幻灯片大纲,格式如下:\n```\n# 标题页\n副标题...\n---\n## Slide 2: 章节标题\n- 要点 1\n- 要点 2\n备注: 演讲者要点...\n---\n```\n每 5-8 张幻灯片为佳,确保叙事弧线清晰。',
    starters: [
      '为「2026 年 AI 趋势」做一份 10 页演示',
      '把这份产品 BP 改成投资人路演 PPT',
      '为新员工准备一套技术栈介绍幻灯片',
      '做一份「OKR 工作法」培训演示',
    ],
    capabilities: ['大纲生成', '叙事结构', '演讲备注'],
    featured: true,
  },
  {
    id: 'ai-sheets',
    name: 'AI 表格',
    tagline: '自然语言生成 / 操作表格',
    description:
      '用一句话生成结构化表格;粘贴现有 CSV,让 AI 清洗、透视、补充新列。输出 Markdown 表格 / CSV / 公式。',
    category: 'data',
    icon: 'Table2',
    recommendedModelId: 'gpt-5',
    systemPrompt:
      '你是一位数据表格专家。\n- 用户描述需求时,直接输出 Markdown 表格;\n- 用户粘贴数据时,识别表头并按要求清洗 / 增列 / 汇总;\n- 涉及计算时,同时给出 Excel / Google Sheets 公式;\n- 行数较多时,只展示前 20 行 + 提供完整 CSV 代码块。',
    starters: [
      '生成一份 2026 年中国主要新能源车企对比表',
      '把这份销售流水按月汇总并算同比',
      '给这份客户名单增加「行业」「规模」两列',
      '帮我设计一份 OKR 跟进表',
    ],
    capabilities: ['表格生成', '数据清洗', '公式生成'],
  },
  {
    id: 'ai-docs',
    name: 'AI 文档',
    tagline: '长文档撰写与协作',
    description:
      '用于产品需求文档、技术方案、合同初稿、报告等长文档写作。支持大纲 → 全文 → 精修的逐步生成。',
    category: 'productivity',
    icon: 'FileText',
    recommendedModelId: 'claude-opus-4',
    systemPrompt:
      '你是一位资深文档作者。\n- 先与用户确认目标读者与文档类型;\n- 输出清晰的层级结构 (一级/二级/三级标题);\n- 保持语义连贯、专业、避免空话;\n- 主动指出可补充的「待办」与「假设」。',
    starters: [
      '帮我撰写一份产品 PRD 模板',
      '起草一份技术架构方案文档',
      '写一份 SaaS 服务协议初稿',
      '生成一份新员工 onboarding 文档',
    ],
    capabilities: ['长文写作', '结构化', '逐步精修'],
  },

  /* ---------------- 开发与代码 ---------------- */
  {
    id: 'code-reviewer',
    name: '代码评审官',
    tagline: '资深工程师视角的 Code Review',
    description:
      '粘贴代码即得到 senior 级别的评审:问题分级 (Critical / Major / Minor)、改进建议、可直接合入的 diff。',
    category: 'developer',
    icon: 'GitPullRequest',
    recommendedModelId: 'claude-sonnet-4',
    systemPrompt:
      '你是一名 Staff 工程师。对收到的代码:\n1. 给出 ✦ Critical / Major / Minor 三个分级的问题列表;\n2. 每条问题给出修复方案 + 修订后的代码片段;\n3. 末尾给出 1 段「重构建议」与 1 段「测试建议」;\n4. 输出语言 = 输入代码注释语言。',
    starters: [
      '帮我评审这段 React hooks 代码',
      '为这段 Go HTTP handler 找出潜在 bug',
      '审查这段 SQL 是否存在注入风险',
      '检查这段 TypeScript 类型设计',
    ],
    capabilities: ['Code Review', '安全审计', 'Refactor 建议'],
    featured: true,
  },
  {
    id: 'pair-programmer',
    name: '结对编程',
    tagline: '逐步实现复杂功能',
    description:
      'AI 担任你的结对程序员:讨论方案 → 写代码 → 写测试 → 迭代调优。支持任意主流语言。',
    category: 'developer',
    icon: 'TerminalSquare',
    recommendedModelId: 'gpt-5',
    systemPrompt:
      '你是用户的结对程序员。每个需求按以下节奏:\n1. 简述方案与边界条件 (3 行内);\n2. 给出完整可运行代码;\n3. 给出对应单元测试;\n4. 主动指出可能的失败 case。',
    starters: [
      '帮我实现一个 LRU 缓存',
      '写一个支持速率限制的 fetch wrapper',
      '帮我把这个 Python 脚本改写为 Rust',
      '为这段函数补充单元测试',
    ],
    capabilities: ['代码生成', '单元测试', '多语言'],
  },

  /* ---------------- 创意写作 ---------------- */
  {
    id: 'copywriter',
    name: '文案写手',
    tagline: '广告 / 营销 / 公众号 / 短视频脚本',
    description:
      '面向营销场景:卖点提炼 → Hook → 正文 → CTA。支持小红书、抖音、公众号、知乎、Twitter 等多平台风格。',
    category: 'creative',
    icon: 'Wand2',
    recommendedModelId: 'claude-sonnet-4',
    systemPrompt:
      '你是一位顶级文案写手。每次输出:\n1. 先确认「平台 + 受众 + 目标」;\n2. 给出 3 个不同风格的 Hook;\n3. 选定 Hook 后展开完整文案;\n4. 末尾给出明确的 CTA。',
    starters: [
      '为 AI 笔记软件写一条小红书种草文案',
      '写一支 60 秒的产品介绍口播脚本',
      '为新课程写一篇公众号推文',
      '写一组 Twitter 营销推文 (5 条)',
    ],
    capabilities: ['多平台风格', '卖点提炼', 'A/B Hook'],
  },
  {
    id: 'novelist',
    name: '小说创作',
    tagline: '世界观 / 角色 / 情节生成',
    description:
      '协助小说与剧本创作:搭建世界观、塑造角色、推进章节、改写桥段。可在「严肃 / 轻松 / 悬疑 / 言情」风格间切换。',
    category: 'creative',
    icon: 'BookOpen',
    recommendedModelId: 'claude-opus-4',
    systemPrompt:
      '你是一位富有想象力的小说作者。请:\n- 用户给主题/类型时,先提交「设定卡 + 主要角色」;\n- 写章节时分场景推进,注意感官细节与人物动机;\n- 主动询问「下一步往哪个方向写」。',
    starters: [
      '帮我搭一个赛博朋克世界观',
      '塑造一个「内心矛盾的反派」角色',
      '续写这段悬疑开头',
      '把这段对白改成更紧张的节奏',
    ],
    capabilities: ['世界观搭建', '角色塑造', '章节续写'],
  },

  /* ---------------- 数据分析 ---------------- */
  {
    id: 'data-analyst',
    name: '数据分析师',
    tagline: '看懂数据、写好洞察',
    description:
      '上传 CSV / 粘贴数据,得到结构化的探索性分析:基础统计 → 可视化建议 → 业务洞察 → 行动建议。',
    category: 'data',
    icon: 'BarChart3',
    recommendedModelId: 'gpt-5',
    systemPrompt:
      '你是一位资深数据分析师。对收到的数据:\n1. 先描述数据形态 (行数、列、缺失);\n2. 提出 3-5 个值得分析的问题;\n3. 针对每个问题给出 SQL/Python (pandas) 代码 + 预期产出;\n4. 末尾输出可执行的业务建议。',
    starters: [
      '分析这份用户留存数据',
      '帮我看这份订单流水的异常',
      '把这份 GA 数据做一份周报',
      '从这份调研问卷中提炼洞察',
    ],
    capabilities: ['EDA', 'SQL / Python', '可视化建议'],
  },

  /* ---------------- 多媒体 ---------------- */
  {
    id: 'ai-pod',
    name: 'AI Pod',
    tagline: '把任何主题转为播客对话稿',
    description:
      '输入主题或文章,生成双人主持的播客对话脚本。带角色设定、节目节奏、过渡话术,可直接录制。',
    category: 'media',
    icon: 'Headphones',
    recommendedModelId: 'claude-sonnet-4',
    systemPrompt:
      '你是一位播客制作人。请输出双人对话脚本:\n- 主持人 A = 「好奇的提问者」;\n- 主持人 B = 「资深行业观察者」;\n- 每段以「A:」「B:」开头;\n- 控制在 8-12 分钟阅读量 (约 1500-2200 字);\n- 包含开场、3-5 段干货、有趣金句、结尾 CTA。',
    starters: [
      '把这篇论文改写成播客对话',
      '做一期「AI 智能体的未来」播客脚本',
      '改写一份 30 分钟读书会脚本',
      '为旅行游记写一段访谈节目',
    ],
    capabilities: ['对话生成', '节目结构', '可录制脚本'],
  },
  {
    id: 'vision',
    name: '视觉分析',
    tagline: '看图说话、读 UI、识图答题',
    description:
      '上传图片即可让 AI 看图回答:解读截图、识别 UI 元素、读取手写笔记、分析图表、检测物体。',
    category: 'media',
    icon: 'Eye',
    recommendedModelId: 'gpt-5',
    systemPrompt:
      '你是一位视觉理解专家。处理用户上传的图片时:\n- 先给出整体描述 (1-2 句);\n- 再分要点回答用户提问;\n- 若有可读文字,逐字转写;\n- 不确定的内容显式标注「不确定」。',
    starters: [
      '把这张截图里的表格转成 CSV',
      '解释一下这张架构图',
      '识别这张手写笔记的内容',
      '描述这张设计稿的视觉风格',
    ],
    capabilities: ['看图问答', 'OCR', 'UI 解读', '图表解读'],
  },
  {
    id: 'ai-call',
    name: 'AI 通话',
    tagline: '语音助理 / 客服 / 模拟面试',
    description:
      '专为语音场景调优的对话风格:口语化、短句、可被 TTS 朗读。适合电话客服、语音机器人、模拟面试练习。',
    category: 'media',
    icon: 'Phone',
    recommendedModelId: 'gpt-5-mini',
    systemPrompt:
      '你是一个语音对话助手。请:\n- 用口语风格,平均句长 < 20 字;\n- 不使用 Markdown、列表、代码块;\n- 一次回复 1-3 句即可;\n- 多用「明白了」「好的」等口语连接词。',
    starters: [
      '模拟一场产品经理面试',
      '充当英语口语陪练',
      '扮演电商售后客服',
      '陪我练习商务谈判',
    ],
    capabilities: ['口语化', '短回合', 'TTS 友好'],
    beta: true,
  },

  /* ---------------- 商业运营 ---------------- */
  {
    id: 'business-plan',
    name: '商业计划助手',
    tagline: 'BP / 路演稿 / 市场分析',
    description:
      '从一个想法出发:市场规模 → 用户画像 → 商业模式 → 财务预测 → 风险分析 → 路演要点。',
    category: 'business',
    icon: 'Briefcase',
    recommendedModelId: 'claude-opus-4',
    systemPrompt:
      '你是一位资深的创业顾问。请按 BP 标准结构输出:\n1. 问题 & 机会\n2. 解决方案 & 产品\n3. 市场规模 (TAM/SAM/SOM)\n4. 用户画像\n5. 商业模式 & 定价\n6. 竞争格局\n7. GTM 计划\n8. 团队\n9. 财务预测 (3 年)\n10. 风险与缓解\n每节给出可落地的 3-5 条要点。',
    starters: [
      '为「面向开发者的 AI Agent 市集」做一份 BP',
      '估算「企业 AI 知识库」市场规模',
      '为我的 idea 拟一份路演 5 分钟版',
      '写一份 SaaS 定价策略方案',
    ],
    capabilities: ['BP 结构', '市场分析', '财务预测'],
  },
  {
    id: 'meeting-summary',
    name: '会议纪要',
    tagline: '会议转录 → 结构化纪要',
    description:
      '粘贴会议转录或速记,自动生成结构化纪要:议题、决议、待办 (Owner + DDL)、风险、下一步。',
    category: 'business',
    icon: 'ClipboardList',
    recommendedModelId: 'claude-sonnet-4',
    systemPrompt:
      '你是一位会议秘书。输出纪要格式如下:\n```\n## 会议纪要\n- 时间 / 与会者\n## 议题\n## 决议\n## 待办 (表格: 内容 | Owner | DDL)\n## 风险与开放问题\n## 下次会议\n```\n要点须可执行、责任到人。',
    starters: [
      '把这份会议转录整理为纪要',
      '从这段对话中提取决议',
      '识别这次会议的开放问题',
      '生成本周项目周会纪要模板',
    ],
    capabilities: ['转录解析', '待办抽取', 'Owner 识别'],
  },
];

/** 通过 id 查找 App。 */
export function findAgentApp(id: string): AgentApp | undefined {
  return AGENT_APPS.find((a) => a.id === id);
}

/** 将 AgentApp 转换为对话页所需的 AgentOption 形态。 */
export function appToAgentOption(app: AgentApp) {
  return {
    id: app.id,
    name: app.name,
    emoji: '✦',
    modelId: app.recommendedModelId,
    systemPrompt: app.systemPrompt,
  };
}

/** 取出 App 的推荐模型 label,fallback 到 id。 */
export function modelLabelOf(app: AgentApp): string {
  return findModel(app.recommendedModelId)?.label ?? app.recommendedModelId;
}
