'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PageCommunity = (): JSX.Element => {
  const router = useRouter()
  useEffect(() => router.push('/docs/community/apps'), [])
  return <></>
}

export { PageCommunity }
