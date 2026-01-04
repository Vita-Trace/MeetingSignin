import type { Metadata } from 'next'

import { settings } from '@/config/settings'
import { PageDesign } from './PageDesign'

export const metadata: Metadata = {
  title: `Design | ${settings.title}`,
  description: settings.description
}

export default (): JSX.Element => <PageDesign />
