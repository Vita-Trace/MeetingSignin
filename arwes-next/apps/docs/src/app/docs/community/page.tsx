import type { Metadata } from 'next'

import { settings } from '@/config/settings'
import { PageCommunity } from './PageCommunity'

export const metadata: Metadata = {
  title: `Community | ${settings.title}`,
  description: settings.description
}

export default (): JSX.Element => <PageCommunity />
