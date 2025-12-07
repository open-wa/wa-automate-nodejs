export interface CmdOptions {
  method?: string,
  timeout?: string,
  args ?: {
    [k: string] : boolean | number | string | undefined
  }
}
