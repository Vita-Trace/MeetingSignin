import type { Metadata } from 'next'

import { settings } from '@/config/settings'
import { PageCommunityApps } from './PageCommunityApps'

export const metadata: Metadata = {
  title: `Community Apps | ${settings.title}`,
  description: settings.description
}

export default (): JSX.Element => <PageCommunityApps />
