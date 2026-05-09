// Auto-discovers every image in src/assets/avatars/.
// To add or remove an avatar, just add or remove the file from that folder.
const modules = import.meta.glob('../assets/avatars/*.{png,jpg,jpeg,gif,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const AVATARS: string[] = Object.values(modules) as string[]
