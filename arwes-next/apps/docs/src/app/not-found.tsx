import type { Metadata } from 'next'

import { settings } from '@/config/settings'
import NotFound from './NotFound'

export const metadata: Metadata = {
  title: `Not Found | ${settings.title}`,
  description: settings.description
}

export default (): JSX.Element => <NotFound />
