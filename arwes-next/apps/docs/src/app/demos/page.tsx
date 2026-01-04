import type { Metadata } from 'next'

import { settings } from '@/config/settings'
import { PageDemos } from './PageDemos'

export const metadata: Metadata = {
  title: `Demos | ${settings.title}`,
  description: settings.description
}

export default (): JSX.Element => <PageDemos />
