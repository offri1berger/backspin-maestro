import Sticker from '../boombox/Sticker'

export const SectionMark = ({ children }: { children: React.ReactNode }) => (
  <Sticker color="cyan" rotate={-3} size="sm">{children}</Sticker>
)
