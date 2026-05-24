import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

type ReviewStatus = 'pending' | 'reviewed' | 'synced'

type StudentSubmission = {
  id: string
  studentName: string
  agentType: string
  submittedAt: string
  aiScore: number
  reviewStatus: ReviewStatus
  scriptContent: string
}

const INVITE_CODE = 'TRAIN-9A2F-H8K7'

const SUBMISSIONS: StudentSubmission[] = [
  {
    id: 's-001',
    studentName: '王欣怡',
    agentType: '剧情策划助手',
    submittedAt: '2026-05-23 14:10',
    aiScore: 92,
    reviewStatus: 'reviewed',
    scriptContent:
      '第一幕：旧图书馆里的记忆装置意外启动，主角发现每翻开一本书，都会触发一段被遗忘的校园往事。',
  },
  {
    id: 's-002',
    studentName: '李泽宇',
    agentType: '角色对白优化体',
    submittedAt: '2026-05-24 09:22',
    aiScore: 86,
    reviewStatus: 'pending',
    scriptContent:
      '第二幕：团队在冲突中重建信任，通过三场对话推动角色成长，最终完成校园短剧排演。',
  },
  {
    id: 's-003',
    studentName: '陈思睿',
    agentType: '场景分镜生成体',
    submittedAt: '2026-05-24 10:46',
    aiScore: 95,
    reviewStatus: 'synced',
    scriptContent:
      '第三幕：舞台灯光逐层点亮，角色在谢幕前完成“自我和解”的独白，形成完整情绪闭环。',
  },
]

function getReviewStatusLabel(status: ReviewStatus, t: (key: string) => string): string {
  if (status === 'reviewed') {
    return t('已批改')
  }

  if (status === 'synced') {
    return t('已同步剧生生')
  }

  return t('未批改')
}

function buildEncouragement(score: number, t: (key: string) => string): string {
  if (score >= 90) {
    return t('作品完成度很高，节奏把控和情绪推进都非常成熟。建议继续强化细节描写，你已经具备优秀创作者的潜质！')
  }

  if (score >= 80) {
    return t('作品结构清晰、亮点明确，已经体现出不错的剧本能力。建议补充角色动机和场景细节，你会更进一步！')
  }

  return t('你已经建立了完整的故事雏形，这是很好的开始。建议在冲突张力和对白自然度上再打磨一下，继续加油！')
}

export function TeacherAssignmentDashboard() {
  const { t } = useTranslation()
  const [selectedSubmission, setSelectedSubmission] =
    useState<StudentSubmission | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const submitRate = useMemo(() => {
    const submittedCount = SUBMISSIONS.length
    const totalStudents = 40
    return Math.round((submittedCount / totalStudents) * 100)
  }, [])

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(INVITE_CODE)
      toast.success(t('邀请码已复制'))
    } catch {
      toast.error(t('复制失败，请手动复制'))
    }
  }

  const handleGenerateComment = async () => {
    if (!selectedSubmission) {
      return
    }

    setIsGenerating(true)
    await new Promise((resolve) => {
      setTimeout(resolve, 650)
    })
    setReviewComment(buildEncouragement(selectedSubmission.aiScore, t))
    setIsGenerating(false)
    toast.success(t('AI 批改寄语已生成'))
  }

  return (
    <div className='space-y-6 p-4 lg:p-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('班级实训概览')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          <div className='space-y-1'>
            <p className='text-sm text-muted-foreground'>{t('班级名称')}</p>
            <p className='text-base font-semibold'>{t('2026级数字媒体1班')}</p>
          </div>

          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>{t('实训邀请码')}</p>
            <div className='flex items-center gap-2'>
              <Input readOnly value={INVITE_CODE} />
              <Button onClick={handleCopyInviteCode} variant='secondary'>
                {t('复制')}
              </Button>
            </div>
          </div>

          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>{t('实训提交率')}</p>
            <Progress value={submitRate} />
            <p className='text-sm text-muted-foreground'>
              {t('已提交 {{count}}%', { count: submitRate })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('学生提交列表')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('学生姓名')}</TableHead>
                <TableHead>{t('智能体类型')}</TableHead>
                <TableHead>{t('提交时间')}</TableHead>
                <TableHead>{t('AI 初评得分')}</TableHead>
                <TableHead>{t('教师终审状态')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUBMISSIONS.map((item) => (
                <TableRow
                  className='cursor-pointer'
                  key={item.id}
                  onClick={() => {
                    setSelectedSubmission(item)
                    setReviewComment('')
                  }}
                >
                  <TableCell className='font-medium'>{item.studentName}</TableCell>
                  <TableCell>{item.agentType}</TableCell>
                  <TableCell>{item.submittedAt}</TableCell>
                  <TableCell>{item.aiScore}</TableCell>
                  <TableCell>
                    <Badge variant='secondary'>
                      {getReviewStatusLabel(item.reviewStatus, t)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet
        open={selectedSubmission !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubmission(null)
            setReviewComment('')
          }
        }}
      >
        <SheetContent className='w-full sm:max-w-2xl'>
          <SheetHeader>
            <SheetTitle>{t('学生作品详情')}</SheetTitle>
            <SheetDescription>
              {selectedSubmission
                ? t('当前查看：{{name}}（AI 初评 {{score}} 分）', {
                    name: selectedSubmission.studentName,
                    score: selectedSubmission.aiScore,
                  })
                : ''}
            </SheetDescription>
          </SheetHeader>

          <div className='mt-6 space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>{t('AI 剧本内容 / 作品')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='whitespace-pre-wrap text-sm leading-6 text-muted-foreground'>
                  {selectedSubmission?.scriptContent}
                </p>
              </CardContent>
            </Card>

            <div className='space-y-2'>
              <Button disabled={isGenerating} onClick={handleGenerateComment}>
                {isGenerating
                  ? t('AI 正在生成寄语...')
                  : t('调用 AI 生成批改寄语')}
              </Button>
              <Textarea
                onChange={(event) => {
                  setReviewComment(event.target.value)
                }}
                placeholder={t('请填写教师评语')}
                rows={6}
                value={reviewComment}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
