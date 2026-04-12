export interface EventBridge {
  onAny(listener: (event: string, value: any) => void): void;
  offAny(listener: (event: string, value: any) => void): void;
}
