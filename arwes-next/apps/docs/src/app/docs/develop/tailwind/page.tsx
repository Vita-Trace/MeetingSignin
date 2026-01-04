import type { Metadata } from 'next'

import { settings } from '@/config/settings'
import Content from './Content'

export const metadata: Metadata = {
  title: `Tailwind | ${settings.title}`,
  description: settings.description
}

export default (): JSX.Element => <Content />
