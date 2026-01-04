import { type ReactNode } from 'react'
import { LayoutCommunity } from './LayoutCommunity'

export default (props: { children: ReactNode }): JSX.Element => (
  <LayoutCommunity>{props.children}</LayoutCommunity>
)
