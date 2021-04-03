import { delimiter } from './std/path.ts'
export const createPathLikeEnv = (...components: string[]) => components.join(delimiter)
export default createPathLikeEnv
