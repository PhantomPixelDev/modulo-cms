import type { PluginOption, UserConfig } from 'vite';

export declare const SHARED: string[];

export declare function moduloPlugin(options?: { entry?: string; outDir?: string; plugins?: PluginOption[] }): UserConfig;

export * from './runtime';
