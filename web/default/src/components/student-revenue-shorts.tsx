import { useMemo, useState } from 'react'
import { ShieldCheck, Play, TrendingUp, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface StudentWorkItem {
  id: string
  title: string
  coverUrl: string
  publishedAt: string
  playCount: number
  likeCount: number
  conversionRate: number
  revenueCny: number
}

interface StudentRevenueShortsProps {
  items?: StudentWorkItem[]
}

const mockItems: StudentWorkItem[] = [
  {
    id: 'short-001',
    title: '校园成长日记 · 第一集',
    coverUrl:
      'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=900&q=80',
    publishedAt: '2026-05-01',
    playCount: 186_200,
    likeCount: 23_901,
    conversionRate: 4.7,
    revenueCny: 145.6,
  },
  {
    id: 'short-002',
    title: '我的高效学习法 · 番外',
    coverUrl:
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80',
    publishedAt: '2026-05-11',
    playCount: 120_043,
    likeCount: 15_220,
    conversionRate: 3.9,
    revenueCny: 98.3,
  },
  {
    id: 'short-003',
    title: '社团活动高光合集',
    coverUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    publishedAt: '2026-05-18',
    playCount: 91_552,
    likeCount: 12_409,
    conversionRate: 5.2,
    revenueCny: 132.2,
  },
]

export function StudentRevenueShorts(props: StudentRevenueShortsProps) {
  const { t } = useTranslation()
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [alipayAccount, setAlipayAccount] = useState('')

  const workItems = props.items ?? mockItems

  const totals = useMemo(() => {
    return workItems.reduce(
      (acc, current) => {
        acc.totalPlays += current.playCount
        acc.totalLikes += current.likeCount
        acc.totalRevenue += current.revenueCny
        acc.totalConversionRate += current.conversionRate
        return acc
      },
      {
        totalPlays: 0,
        totalLikes: 0,
        totalRevenue: 0,
        totalConversionRate: 0,
      },
    )
  }, [workItems])

  const averageConversionRate =
    workItems.length > 0 ? totals.totalConversionRate / workItems.length : 0

  const canWithdraw = totals.totalRevenue > 100

  return (
    <section className='space-y-8'>
      <div className='space-y-3'>
        <h2 className='text-2xl font-bold tracking-tight'>
          {t('My commercial成果与剧生生收益')}
        </h2>
        <p className='text-muted-foreground'>
          {t('Approved works that are officially published on jushengsheng.com')}
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {workItems.map((item) => (
          <article
            key={item.id}
            className='group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-xl'
          >
            <img
              src={item.coverUrl}
              alt={item.title}
              className='h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105'
            />
            <div className='absolute left-3 top-3'>
              <Badge className='gap-1 border-emerald-200/40 bg-emerald-500/85 px-2.5 py-1 text-white backdrop-blur'>
                <ShieldCheck className='size-3.5' aria-hidden='true' />
                {t('剧生生官方正版认证')}
              </Badge>
            </div>
            <div className='space-y-1 p-4'>
              <h3 className='line-clamp-1 text-base font-semibold text-white'>
                {item.title}
              </h3>
              <p className='text-xs text-zinc-300'>
                {t('Published at')}: {item.publishedAt}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 p-6 text-white shadow-xl'>
          <p className='text-sm/6 opacity-90'>{t('Total Plays')}</p>
          <p className='mt-1 text-4xl font-black tracking-tight'>
            {totals.totalPlays.toLocaleString()}
          </p>
        </div>

        <div className='rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 p-6 text-zinc-900 shadow-xl'>
          <p className='text-sm/6 font-medium opacity-90'>{t('Total Revenue')}</p>
          <p className='mt-1 text-4xl font-black tracking-tight'>
            ￥{totals.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className='rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 p-6 text-white shadow-xl'>
          <p className='text-sm/6 opacity-90'>{t('Total Likes')}</p>
          <p className='mt-1 text-4xl font-black tracking-tight'>
            {totals.totalLikes.toLocaleString()}
          </p>
        </div>

        <div className='rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 p-6 text-white shadow-xl'>
          <p className='text-sm/6 opacity-90'>{t('Average Sales Conversion')}</p>
          <p className='mt-1 text-4xl font-black tracking-tight'>
            {averageConversionRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className='flex items-center justify-between rounded-2xl border bg-card p-4'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Wallet className='size-4' />
          {t('Withdrawals are available when total revenue is above ¥100.')}
        </div>
        <Button
          type='button'
          onClick={() => setIsWithdrawDialogOpen(true)}
          disabled={!canWithdraw}
          className='gap-2'
        >
          <TrendingUp className='size-4' aria-hidden='true' />
          {t('Apply for Withdrawal')}
        </Button>
      </div>

      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Apply for Withdrawal')}</DialogTitle>
            <DialogDescription>
              {t('Please enter your Alipay account to receive the revenue share.')}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <label htmlFor='alipay-account' className='text-sm font-medium'>
              {t('Alipay Account')}
            </label>
            <Input
              id='alipay-account'
              value={alipayAccount}
              onChange={(event) => setAlipayAccount(event.target.value)}
              placeholder={t('Enter your Alipay account')}
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              type='button'
              onClick={() => setIsWithdrawDialogOpen(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type='button' disabled={!alipayAccount.trim()}>
              <Play className='size-4' aria-hidden='true' />
              {t('Submit Request')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
